import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { AvailabilityService } from "../availability/availability.service";
import { OutboxService } from "../jobs/outbox.service";
import { AuthenticatedUser, EventsService } from "./events.service";
import { EventsRepository } from "./events.repository";

const eventsRepository = {
  findRange: jest.fn(),
  findUpcoming: jest.fn(),
  findById: jest.fn(),
  findSeriesFrom: jest.fn(),
  runTransaction: jest.fn((fn: (tx: unknown) => unknown) => fn({})),
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  updateManyEvents: jest.fn(),
  deleteEvent: jest.fn(),
  deleteManyEvents: jest.fn(),
  replaceParticipants: jest.fn(),
  removeParticipantsNotIn: jest.fn(),
  setReminders: jest.fn(),
  clearReminders: jest.fn(),
  respond: jest.fn(),
  createHistory: jest.fn(),
  findHistory: jest.fn(),
  createSeries: jest.fn(),
  updateSeries: jest.fn(),
};

const outboxService = {
  enqueue: jest.fn(),
  enqueueMany: jest.fn(),
  cancelPendingByEventId: jest.fn(),
};

const availabilityService = {
  findConflicts: jest.fn(),
  getAvailability: jest.fn(),
};

const prisma = {
  eventHistory: { create: jest.fn() },
};

const organizer: AuthenticatedUser = {
  id: "organizer-1",
  email: "organizer@tigilabs.com",
  name: "Ada Organizer",
  permissions: ["calendar.event.create"],
};

const outsider: AuthenticatedUser = {
  id: "outsider-1",
  email: "outsider@tigilabs.com",
  name: "Bob Outsider",
  permissions: [],
};

function baseUser(
  id: string,
  overrides: Partial<{ email: string; name: string }> = {},
) {
  return {
    id,
    email: overrides.email ?? `${id}@tigilabs.com`,
    firstName: null,
    lastName: null,
    name: overrides.name ?? id,
    status: "ACTIVE",
  };
}

describe("EventsService", () => {
  let service: EventsService;

  beforeEach(() => {
    jest.clearAllMocks();
    eventsRepository.runTransaction.mockImplementation(
      (fn: (tx: unknown) => unknown) => fn({}),
    );
    availabilityService.findConflicts.mockResolvedValue([]);
    service = new EventsService(
      eventsRepository as unknown as EventsRepository,
      outboxService as unknown as OutboxService,
      availabilityService as unknown as AvailabilityService,
      prisma as unknown as PrismaService,
    );
  });

  describe("create", () => {
    it("rejects when endAt is not after startAt", async () => {
      await expect(
        service.create(
          {
            title: "Reunion",
            startAt: "2026-02-01T10:00:00.000Z",
            endAt: "2026-02-01T09:00:00.000Z",
            timezone: "Europe/Paris",
          } as never,
          organizer,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("creates a single event, invites participants and returns conflicts", async () => {
      eventsRepository.createEvent.mockResolvedValue({ id: "event-1" });
      const fullEvent = {
        id: "event-1",
        title: "Reunion",
        description: null,
        startAt: new Date("2026-02-01T09:00:00.000Z"),
        endAt: new Date("2026-02-01T10:00:00.000Z"),
        allDay: false,
        timezone: "Europe/Paris",
        location: null,
        meetingUrl: null,
        privacy: "NORMAL",
        status: "CONFIRMED",
        organizerId: organizer.id,
        organizer: baseUser(organizer.id, { name: organizer.name }),
        category: null,
        series: null,
        seriesId: null,
        participants: [
          {
            eventId: "event-1",
            userId: organizer.id,
            status: "ACCEPTED",
            user: baseUser(organizer.id),
          },
          {
            eventId: "event-1",
            userId: "participant-1",
            status: "PENDING",
            user: baseUser("participant-1"),
          },
        ],
        reminders: [],
        attachments: [],
      };
      eventsRepository.findById.mockResolvedValue(fullEvent);
      availabilityService.findConflicts.mockResolvedValue([
        {
          userId: "participant-1",
          userName: "participant-1",
          conflictingEventId: "other-event",
          conflictingEventTitle: "Autre reunion",
          startAt: "2026-02-01T09:30:00.000Z",
          endAt: "2026-02-01T10:30:00.000Z",
        },
      ]);

      const result = (await service.create(
        {
          title: "Reunion",
          startAt: "2026-02-01T09:00:00.000Z",
          endAt: "2026-02-01T10:00:00.000Z",
          timezone: "Europe/Paris",
          participantIds: ["participant-1"],
        } as never,
        organizer,
      )) as Record<string, unknown>;

      expect(result.title).toBe("Reunion");
      expect(result.occurrenceCount).toBe(1);
      expect(result.conflicts).toHaveLength(1);
      expect(eventsRepository.replaceParticipants).toHaveBeenCalledWith(
        {},
        "event-1",
        ["participant-1"],
        organizer.id,
      );
      expect(outboxService.enqueueMany).toHaveBeenCalledWith(
        {},
        expect.arrayContaining([
          expect.objectContaining({
            payload: expect.objectContaining({ userId: "participant-1" }),
          }),
        ]),
      );
    });
  });

  describe("findOne", () => {
    it("throws NotFoundException when the event does not exist", async () => {
      eventsRepository.findById.mockResolvedValue(null);
      await expect(
        service.findOne("missing", organizer),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("throws ForbiddenException for a restricted event when the viewer is not invited", async () => {
      eventsRepository.findById.mockResolvedValue({
        id: "event-1",
        organizerId: organizer.id,
        privacy: "RESTRICTED",
        participants: [{ userId: organizer.id }],
      });

      await expect(service.findOne("event-1", outsider)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe("findRange", () => {
    it("redacts private events and drops restricted ones for non-participants", async () => {
      eventsRepository.findRange.mockResolvedValue([
        {
          id: "private-event",
          organizerId: organizer.id,
          privacy: "PRIVATE",
          startAt: new Date("2026-02-01T09:00:00.000Z"),
          endAt: new Date("2026-02-01T10:00:00.000Z"),
          allDay: false,
          status: "CONFIRMED",
          participants: [{ userId: organizer.id }],
        },
        {
          id: "restricted-event",
          organizerId: organizer.id,
          privacy: "RESTRICTED",
          participants: [{ userId: organizer.id }],
        },
        {
          id: "normal-event",
          organizerId: organizer.id,
          privacy: "NORMAL",
          title: "Reunion publique",
          participants: [{ userId: organizer.id }],
        },
      ]);

      const events = await service.findRange(
        {
          from: "2026-02-01T00:00:00.000Z",
          to: "2026-02-02T00:00:00.000Z",
        } as never,
        outsider,
      );

      expect(events).toHaveLength(2);
      expect(events.find((e) => e.id === "private-event")?.title).toBe(
        "Occupe",
      );
      expect(events.some((e) => e.id === "restricted-event")).toBe(false);
      expect(events.find((e) => e.id === "normal-event")?.title).toBe(
        "Reunion publique",
      );
    });
  });

  describe("update", () => {
    it("requires a scope when updating a recurring event", async () => {
      eventsRepository.findById.mockResolvedValue({
        id: "event-1",
        organizerId: organizer.id,
        seriesId: "series-1",
        participants: [{ userId: organizer.id }],
      });

      await expect(
        service.update("event-1", {}, undefined, organizer),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("denies updates from a user who is neither organizer nor privileged", async () => {
      eventsRepository.findById.mockResolvedValue({
        id: "event-1",
        organizerId: organizer.id,
        seriesId: null,
        participants: [{ userId: organizer.id }],
      });

      await expect(
        service.update(
          "event-1",
          { title: "Nouveau titre" },
          undefined,
          outsider,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("remove", () => {
    it("hard-deletes an event with no other participants", async () => {
      const event = {
        id: "event-1",
        organizerId: organizer.id,
        seriesId: null,
        participants: [{ userId: organizer.id }],
      };
      eventsRepository.findById.mockResolvedValue(event);

      const result = await service.remove("event-1", undefined, organizer);

      expect(result).toEqual({ ok: true, cancelled: false });
      expect(eventsRepository.deleteEvent).toHaveBeenCalledWith({}, "event-1");
      expect(outboxService.enqueueMany).not.toHaveBeenCalled();
    });

    it("soft-cancels and notifies participants when others are invited", async () => {
      const event = {
        id: "event-1",
        organizerId: organizer.id,
        seriesId: null,
        title: "Reunion",
        startAt: new Date("2026-02-01T09:00:00.000Z"),
        endAt: new Date("2026-02-01T10:00:00.000Z"),
        allDay: false,
        location: null,
        meetingUrl: null,
        organizer: baseUser(organizer.id, { name: organizer.name }),
        participants: [
          { userId: organizer.id, user: baseUser(organizer.id) },
          { userId: "participant-1", user: baseUser("participant-1") },
        ],
      };
      eventsRepository.findById.mockResolvedValue(event);

      const result = await service.remove("event-1", undefined, organizer);

      expect(result).toEqual({ ok: true, cancelled: true });
      expect(eventsRepository.updateEvent).toHaveBeenCalledWith(
        {},
        "event-1",
        expect.objectContaining({ status: "CANCELLED" }),
      );
      expect(outboxService.enqueueMany).toHaveBeenCalledWith(
        {},
        expect.arrayContaining([
          expect.objectContaining({
            payload: expect.objectContaining({ userId: "participant-1" }),
          }),
        ]),
      );
    });
  });

  describe("respond", () => {
    it("denies responding when the user is not invited", async () => {
      eventsRepository.findById.mockResolvedValue({
        id: "event-1",
        organizerId: organizer.id,
        participants: [{ userId: organizer.id }],
      });

      await expect(
        service.respond("event-1", { status: "ACCEPTED" } as never, outsider),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("records the participant response", async () => {
      eventsRepository.findById
        .mockResolvedValueOnce({
          id: "event-1",
          organizerId: organizer.id,
          participants: [{ userId: outsider.id }],
        })
        .mockResolvedValueOnce({
          id: "event-1",
          organizerId: organizer.id,
          privacy: "NORMAL",
          participants: [{ userId: outsider.id, status: "ACCEPTED" }],
        });

      const result = await service.respond(
        "event-1",
        { status: "ACCEPTED" } as never,
        outsider,
      );

      expect(eventsRepository.respond).toHaveBeenCalledWith(
        "event-1",
        outsider.id,
        "ACCEPTED",
      );
      expect(eventsRepository.createHistory).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({
          eventId: "event-1",
          action: "PARTICIPANT_RESPONDED",
        }),
      );
      expect(result).toMatchObject({ id: "event-1" });
    });
  });
});
