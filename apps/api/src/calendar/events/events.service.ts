import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { JobType, Prisma, ReminderChannel } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { AvailabilityService } from "../availability/availability.service";
import { OutboxService } from "../jobs/outbox.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { EventFilterDto } from "./dto/event-filter.dto";
import {
  RecurrenceScope,
  RecurrenceScopeValue,
} from "./dto/recurrence-scope.dto";
import { RespondInvitationDto } from "./dto/respond-invitation.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { EventsRepository, EventWithRelations } from "./events.repository";
import { generateMeetingUrl } from "./meeting-link.util";
import { generateOccurrences } from "./recurrence.util";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name?: string;
  roles?: string[];
  permissions?: string[];
};

const IMPORTANT_FIELDS = [
  "startAt",
  "endAt",
  "location",
  "meetingUrl",
  "allDay",
] as const;

const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3100";

@Injectable()
export class EventsService {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly outboxService: OutboxService,
    private readonly availabilityService: AvailabilityService,
    private readonly prisma: PrismaService,
  ) {}

  async findRange(filter: EventFilterDto, user: AuthenticatedUser) {
    const from = new Date(filter.from);
    const to = new Date(filter.to);
    const calendarOwnerId = filter.calendarUserId ?? user.id;

    const events = await this.eventsRepository.findRange({
      from,
      to,
      visibleTo: [calendarOwnerId],
      q: filter.q,
      categoryId: filter.categoryId,
    });

    return events
      .map((event) => this.redact(event, user.id))
      .filter((event): event is NonNullable<typeof event> => event !== null);
  }

  async dashboardUpcoming(user: AuthenticatedUser, limit = 5) {
    const events = await this.eventsRepository.findUpcoming(user.id, limit);
    return events.map((event) => this.redact(event, user.id));
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const event = await this.eventsRepository.findById(id);

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    if (event.privacy === "RESTRICTED" && !this.isParticipant(event, user.id)) {
      throw new ForbiddenException("Access denied");
    }

    const redacted = this.redact(event, user.id);
    if (!redacted) {
      throw new ForbiddenException("Access denied");
    }

    return redacted;
  }

  async findHistory(id: string, user: AuthenticatedUser) {
    const event = await this.eventsRepository.findById(id);
    if (!event) {
      throw new NotFoundException("Event not found");
    }
    if (!this.isParticipant(event, user.id)) {
      throw new ForbiddenException("Access denied");
    }
    return this.eventsRepository.findHistory(id);
  }

  async create(dto: CreateEventDto, user: AuthenticatedUser) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    if (endAt <= startAt) {
      throw new BadRequestException("endAt must be after startAt");
    }

    const participantIds = (dto.participantIds ?? []).filter(
      (id) => id !== user.id,
    );

    const meetingUrl =
      dto.meetingUrl ??
      (dto.generateMeetingLink ? generateMeetingUrl(dto.title) : undefined);

    const occurrences = dto.recurrence
      ? generateOccurrences(
          {
            frequency: dto.recurrence.frequency,
            interval: dto.recurrence.interval ?? 1,
            byWeekday: dto.recurrence.byWeekday,
            until: dto.recurrence.until ? new Date(dto.recurrence.until) : null,
            count: dto.recurrence.count,
          },
          startAt,
          endAt,
        )
      : [{ startAt, endAt }];

    const conflicts = participantIds.length
      ? await this.availabilityService.findConflicts({
          userIds: participantIds,
          startAt,
          endAt,
        })
      : [];

    const createdEvents = await this.eventsRepository.runTransaction(
      async (tx) => {
        const series = dto.recurrence
          ? await this.eventsRepository.createSeries(tx, {
              frequency: dto.recurrence.frequency,
              interval: dto.recurrence.interval ?? 1,
              byWeekday: dto.recurrence.byWeekday ?? [],
              until: dto.recurrence.until
                ? new Date(dto.recurrence.until)
                : null,
              count: dto.recurrence.count,
            })
          : null;

        const eventIds: string[] = [];

        for (const occurrence of occurrences) {
          const event = await this.eventsRepository.createEvent(tx, {
            title: dto.title,
            description: dto.description,
            startAt: occurrence.startAt,
            endAt: occurrence.endAt,
            allDay: dto.allDay ?? false,
            timezone: dto.timezone,
            location: dto.location,
            meetingUrl,
            privacy: dto.privacy ?? "NORMAL",
            organizer: { connect: { id: user.id } },
            category: dto.categoryId
              ? { connect: { id: dto.categoryId } }
              : undefined,
            series: series ? { connect: { id: series.id } } : undefined,
          });

          await this.eventsRepository.replaceParticipants(
            tx,
            event.id,
            participantIds,
            user.id,
          );

          if (dto.reminders?.length) {
            await this.eventsRepository.setReminders(
              tx,
              event.id,
              [user.id, ...participantIds],
              dto.reminders,
            );
          }

          await this.eventsRepository.createHistory(tx, {
            eventId: event.id,
            userId: user.id,
            action: "EVENT_CREATED",
            newValue: event.title,
          });

          eventIds.push(event.id);
        }

        return eventIds;
      },
    );

    const events = (
      await Promise.all(
        createdEvents.map((eventId) => this.eventsRepository.findById(eventId)),
      )
    ).filter((created): created is EventWithRelations => created !== null);

    const primary = events[0];
    if (!primary) {
      throw new NotFoundException("Event not found");
    }

    await this.enqueueInvitations(primary, participantIds, user);
    await this.enqueueReminders(events);

    return {
      ...this.redact(primary, user.id),
      conflicts,
      occurrenceCount: events.length,
    };
  }

  async update(
    id: string,
    dto: UpdateEventDto,
    scope: RecurrenceScopeValue | undefined,
    user: AuthenticatedUser,
  ) {
    const event = await this.eventsRepository.findById(id);
    if (!event) {
      throw new NotFoundException("Event not found");
    }
    this.assertCanManage(event, user);

    if (event.seriesId && !scope) {
      throw new BadRequestException(
        "scope is required when updating a recurring event",
      );
    }

    const targets = await this.resolveTargets(event, scope);
    const newStartAt = dto.startAt ? new Date(dto.startAt) : undefined;
    const newEndAt = dto.endAt ? new Date(dto.endAt) : undefined;

    if (newStartAt && newEndAt && newEndAt <= newStartAt) {
      throw new BadRequestException("endAt must be after startAt");
    }

    const deltaMs = newStartAt
      ? newStartAt.getTime() - event.startAt.getTime()
      : 0;
    const newDurationMs =
      newStartAt && newEndAt
        ? newEndAt.getTime() - newStartAt.getTime()
        : undefined;

    const participantIds = dto.participantIds?.filter(
      (pid) => pid !== event.organizerId,
    );

    const updated = await this.eventsRepository.runTransaction(async (tx) => {
      const results: string[] = [];

      for (const target of targets) {
        const isAnchor = target.id === event.id;
        const shouldDetach = scope === RecurrenceScope.THIS && isAnchor;

        const nextStart = isAnchor
          ? newStartAt
          : deltaMs
            ? new Date(target.startAt.getTime() + deltaMs)
            : undefined;
        const nextEnd = nextStart
          ? new Date(
              nextStart.getTime() +
                (newDurationMs ??
                  target.endAt.getTime() - target.startAt.getTime()),
            )
          : isAnchor
            ? newEndAt
            : undefined;

        const data: Prisma.EventUpdateInput = {
          title: dto.title,
          description: dto.description,
          startAt: nextStart,
          endAt: nextEnd,
          allDay: dto.allDay,
          location: dto.location,
          meetingUrl: dto.meetingUrl,
          privacy: dto.privacy,
          category:
            dto.categoryId === undefined
              ? undefined
              : dto.categoryId === null
                ? { disconnect: true }
                : { connect: { id: dto.categoryId } },
          series: shouldDetach ? { disconnect: true } : undefined,
          recurrenceExceptionOf: shouldDetach ? target.startAt : undefined,
        };

        await this.eventsRepository.updateEvent(tx, target.id, data);

        if (participantIds) {
          await this.eventsRepository.replaceParticipants(
            tx,
            target.id,
            participantIds,
            event.organizerId,
          );
          await this.eventsRepository.removeParticipantsNotIn(tx, target.id, [
            event.organizerId,
            ...participantIds,
          ]);
        }

        if (dto.reminders) {
          await this.eventsRepository.clearReminders(tx, target.id);
          await this.eventsRepository.setReminders(
            tx,
            target.id,
            [
              event.organizerId,
              ...(participantIds ?? target.participants.map((p) => p.userId)),
            ],
            dto.reminders,
          );
        }

        await this.recordChanges(tx, target, dto, user.id);

        results.push(target.id);
      }

      return results;
    });

    const updatedEvents = (
      await Promise.all(
        updated.map((eventId) => this.eventsRepository.findById(eventId)),
      )
    ).filter(
      (updatedEvent): updatedEvent is EventWithRelations =>
        updatedEvent !== null,
    );

    for (const target of updatedEvents) {
      await this.outboxService.cancelPendingByEventId(this.prisma, target.id);
    }

    const anchorAfter = await this.eventsRepository.findById(event.id);
    if (anchorAfter && this.hasImportantChange(dto)) {
      await this.enqueueUpdateNotifications(anchorAfter, user);
    }

    await this.enqueueReminders(updatedEvents);

    return this.redact(anchorAfter ?? updatedEvents[0], user.id);
  }

  async remove(
    id: string,
    scope: RecurrenceScopeValue | undefined,
    user: AuthenticatedUser,
  ) {
    const event = await this.eventsRepository.findById(id);
    if (!event) {
      throw new NotFoundException("Event not found");
    }
    this.assertCanManage(event, user);

    if (event.seriesId && !scope) {
      throw new BadRequestException(
        "scope is required when deleting a recurring event",
      );
    }

    const targets = await this.resolveTargets(event, scope);
    const hasOtherParticipants = event.participants.some(
      (p) => p.userId !== event.organizerId,
    );

    await this.eventsRepository.runTransaction(async (tx) => {
      for (const target of targets) {
        if (hasOtherParticipants) {
          await this.eventsRepository.updateEvent(tx, target.id, {
            status: "CANCELLED",
            cancelledAt: new Date(),
          });
        } else {
          await this.eventsRepository.deleteEvent(tx, target.id);
        }
      }
    });

    if (hasOtherParticipants) {
      await this.enqueueCancellation(event, user);
    }

    return { ok: true, cancelled: hasOtherParticipants };
  }

  async respond(
    id: string,
    dto: RespondInvitationDto,
    user: AuthenticatedUser,
  ) {
    const event = await this.eventsRepository.findById(id);
    if (!event) {
      throw new NotFoundException("Event not found");
    }
    if (!this.isParticipant(event, user.id)) {
      throw new ForbiddenException("Access denied");
    }

    await this.eventsRepository.respond(id, user.id, dto.status as never);
    await this.eventsRepository.createHistory(this.prisma, {
      eventId: id,
      userId: user.id,
      action: "PARTICIPANT_RESPONDED",
      newValue: dto.status,
    });

    const updated = await this.eventsRepository.findById(id);
    return this.redact(updated!, user.id);
  }

  private assertCanManage(event: EventWithRelations, user: AuthenticatedUser) {
    if (event.organizerId === user.id || this.canManageOthers(user)) {
      return;
    }
    throw new ForbiddenException("Access denied");
  }

  private canManageOthers(user: AuthenticatedUser) {
    return user.permissions?.includes("calendar.event.manage_others") ?? false;
  }

  private isParticipant(event: EventWithRelations, userId: string) {
    return (
      event.organizerId === userId ||
      event.participants.some((p) => p.userId === userId)
    );
  }

  private redact(event: EventWithRelations, viewerId: string) {
    if (this.isParticipant(event, viewerId)) {
      return event;
    }

    if (event.privacy === "RESTRICTED") {
      return null;
    }

    if (event.privacy === "PRIVATE") {
      return {
        id: event.id,
        startAt: event.startAt,
        endAt: event.endAt,
        allDay: event.allDay,
        status: event.status,
        title: "Occupe",
        description: null,
        location: null,
        meetingUrl: null,
        privacy: event.privacy,
        organizerId: event.organizerId,
        category: null,
        participants: [],
        reminders: [],
        attachments: [],
      };
    }

    return event;
  }

  private async resolveTargets(
    event: EventWithRelations,
    scope: RecurrenceScopeValue | undefined,
  ) {
    if (!event.seriesId || scope === RecurrenceScope.THIS || !scope) {
      return [event];
    }

    if (scope === RecurrenceScope.FOLLOWING) {
      return this.eventsRepository.findSeriesFrom(
        event.seriesId,
        event.startAt,
      );
    }

    return this.eventsRepository.findSeriesFrom(
      event.seriesId,
      event.startAt,
      true,
    );
  }

  private hasImportantChange(dto: UpdateEventDto) {
    return IMPORTANT_FIELDS.some((field) => dto[field] !== undefined);
  }

  private async recordChanges(
    tx: Prisma.TransactionClient,
    before: EventWithRelations,
    dto: UpdateEventDto,
    userId: string,
  ) {
    const fields: Array<keyof UpdateEventDto> = [
      "title",
      "startAt",
      "endAt",
      "location",
      "privacy",
    ];

    for (const field of fields) {
      if (dto[field] === undefined) {
        continue;
      }
      const oldValue = String(
        (before as unknown as Record<string, unknown>)[field] ?? "",
      );
      const newValue = String(dto[field]);
      if (oldValue === newValue) {
        continue;
      }
      await this.eventsRepository.createHistory(tx, {
        eventId: before.id,
        userId,
        action: `${field.toUpperCase()}_CHANGED`,
        oldValue,
        newValue,
      });
    }
  }

  private async enqueueInvitations(
    event: EventWithRelations,
    participantIds: string[],
    user: AuthenticatedUser,
  ) {
    if (!participantIds.length) {
      return;
    }

    const jobs = event.participants
      .filter((p) => participantIds.includes(p.userId))
      .map((p) => ({
        type: JobType.EVENT_INVITATION,
        payload: {
          eventId: event.id,
          userId: p.userId,
          to: p.user.email,
          participantName: p.user.name,
          organizerName: user.name ?? event.organizer.name,
          eventTitle: event.title,
          startAt: event.startAt.toISOString(),
          endAt: event.endAt.toISOString(),
          allDay: event.allDay,
          location: event.location,
          meetingUrl: event.meetingUrl,
          url: `${WEB_ORIGIN}/calendar/${event.id}`,
        },
      }));

    await this.eventsRepository.runTransaction((tx) =>
      this.outboxService.enqueueMany(tx, jobs),
    );
  }

  private async enqueueUpdateNotifications(
    event: EventWithRelations,
    user: AuthenticatedUser,
  ) {
    const jobs = event.participants
      .filter((p) => p.userId !== event.organizerId)
      .map((p) => ({
        type: JobType.EVENT_UPDATE,
        payload: {
          eventId: event.id,
          userId: p.userId,
          to: p.user.email,
          participantName: p.user.name,
          organizerName: user.name ?? event.organizer.name,
          eventTitle: event.title,
          startAt: event.startAt.toISOString(),
          endAt: event.endAt.toISOString(),
          allDay: event.allDay,
          location: event.location,
          meetingUrl: event.meetingUrl,
          url: `${WEB_ORIGIN}/calendar/${event.id}`,
        },
      }));

    if (!jobs.length) {
      return;
    }

    await this.eventsRepository.runTransaction((tx) =>
      this.outboxService.enqueueMany(tx, jobs),
    );
  }

  private async enqueueCancellation(
    event: EventWithRelations,
    user: AuthenticatedUser,
  ) {
    const jobs = event.participants
      .filter((p) => p.userId !== event.organizerId)
      .map((p) => ({
        type: JobType.EVENT_CANCELLATION,
        payload: {
          eventId: event.id,
          userId: p.userId,
          to: p.user.email,
          participantName: p.user.name,
          organizerName: user.name ?? event.organizer.name,
          eventTitle: event.title,
          startAt: event.startAt.toISOString(),
          endAt: event.endAt.toISOString(),
          allDay: event.allDay,
          location: event.location,
          meetingUrl: event.meetingUrl,
          url: `${WEB_ORIGIN}/calendar`,
        },
      }));

    if (!jobs.length) {
      return;
    }

    await this.eventsRepository.runTransaction((tx) =>
      this.outboxService.enqueueMany(tx, jobs),
    );
  }

  private async enqueueReminders(events: EventWithRelations[]) {
    const now = Date.now();

    for (const event of events) {
      const jobs = event.reminders
        .map((reminder) => {
          const scheduledFor = new Date(
            event.startAt.getTime() - reminder.minutesBefore * 60_000,
          );
          if (scheduledFor.getTime() <= now) {
            return null;
          }
          const participant =
            event.participants.find((p) => p.userId === reminder.userId) ??
            (reminder.userId === event.organizerId
              ? { user: event.organizer }
              : undefined);
          if (!participant) {
            return null;
          }
          return {
            type: JobType.EVENT_REMINDER,
            payload: {
              eventId: event.id,
              userId: reminder.userId,
              channel: reminder.channel as ReminderChannel,
              to: participant.user.email,
              participantName: participant.user.name,
              eventTitle: event.title,
              startAt: event.startAt.toISOString(),
              location: event.location,
              minutesBefore: reminder.minutesBefore,
              url: `${WEB_ORIGIN}/calendar/${event.id}`,
            },
            scheduledFor,
          };
        })
        .filter((job): job is NonNullable<typeof job> => job !== null);

      if (jobs.length) {
        await this.eventsRepository.runTransaction((tx) =>
          this.outboxService.enqueueMany(tx, jobs),
        );
      }
    }
  }
}
