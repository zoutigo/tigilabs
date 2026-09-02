import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

export type ConflictInfo = {
  userId: string;
  userName: string;
  conflictingEventId: string;
  conflictingEventTitle: string;
  startAt: string;
  endAt: string;
};

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /** Finds other confirmed events overlapping [startAt, endAt) for the given users. */
  async findConflicts(params: {
    userIds: string[];
    startAt: Date;
    endAt: Date;
    excludeEventId?: string;
  }): Promise<ConflictInfo[]> {
    if (!params.userIds.length) {
      return [];
    }

    const events = await this.prisma.event.findMany({
      where: {
        id: params.excludeEventId ? { not: params.excludeEventId } : undefined,
        status: "CONFIRMED",
        startAt: { lt: params.endAt },
        endAt: { gt: params.startAt },
        OR: [
          { organizerId: { in: params.userIds } },
          {
            participants: {
              some: {
                userId: { in: params.userIds },
                status: { in: ["ACCEPTED", "PENDING", "TENTATIVE"] },
              },
            },
          },
        ],
      },
      include: {
        organizer: { select: { id: true, name: true } },
        participants: {
          select: { userId: true, user: { select: { name: true } } },
        },
      },
    });

    const conflicts: ConflictInfo[] = [];

    for (const event of events) {
      const involvedUserIds = new Set<string>([
        event.organizerId,
        ...event.participants.map((p) => p.userId),
      ]);

      for (const userId of params.userIds) {
        if (!involvedUserIds.has(userId)) {
          continue;
        }
        const userName =
          event.organizerId === userId
            ? event.organizer.name
            : (event.participants.find((p) => p.userId === userId)?.user.name ??
              "Utilisateur");

        conflicts.push({
          userId,
          userName,
          conflictingEventId: event.id,
          conflictingEventTitle: event.title,
          startAt: event.startAt.toISOString(),
          endAt: event.endAt.toISOString(),
        });
      }
    }

    return conflicts;
  }

  /**
   * Suggests the earliest free slots for every given user within a search
   * window, restricted to business hours (08:00-19:00, Mon-Fri). Phase 3
   * "disponibilite intelligente / creneaux automatiques", built entirely on
   * top of the conflict data already computed for Phase 2 - no external
   * service required.
   */
  async suggestSlots(params: {
    userIds: string[];
    durationMinutes: number;
    searchFrom: Date;
    searchTo: Date;
    limit?: number;
    stepMinutes?: number;
    workingHours?: { startHour: number; endHour: number };
  }) {
    const limit = params.limit ?? 5;
    const stepMinutes = params.stepMinutes ?? 30;
    const workingHours = params.workingHours ?? { startHour: 8, endHour: 19 };

    const busyEvents = params.userIds.length
      ? await this.prisma.event.findMany({
          where: {
            status: "CONFIRMED",
            startAt: { lt: params.searchTo },
            endAt: { gt: params.searchFrom },
            OR: [
              { organizerId: { in: params.userIds } },
              {
                participants: {
                  some: {
                    userId: { in: params.userIds },
                    status: { in: ["ACCEPTED", "PENDING", "TENTATIVE"] },
                  },
                },
              },
            ],
          },
          select: { startAt: true, endAt: true },
        })
      : [];

    const durationMs = params.durationMinutes * 60_000;
    const stepMs = stepMinutes * 60_000;
    const suggestions: Array<{ startAt: string; endAt: string }> = [];

    let cursor = roundUpToStep(params.searchFrom, stepMs);

    while (
      cursor.getTime() + durationMs <= params.searchTo.getTime() &&
      suggestions.length < limit
    ) {
      const candidateEnd = new Date(cursor.getTime() + durationMs);

      if (isWithinBusinessHours(cursor, candidateEnd, workingHours)) {
        const overlaps = busyEvents.some(
          (event) => event.startAt < candidateEnd && event.endAt > cursor,
        );

        if (!overlaps) {
          suggestions.push({
            startAt: cursor.toISOString(),
            endAt: candidateEnd.toISOString(),
          });
        }
      }

      cursor = new Date(cursor.getTime() + stepMs);
    }

    return suggestions;
  }

  async getAvailability(params: { userIds: string[]; from: Date; to: Date }) {
    const conflicts = await this.findConflicts({
      userIds: params.userIds,
      startAt: params.from,
      endAt: params.to,
    });

    return params.userIds.map((userId) => {
      const userConflicts = conflicts.filter((c) => c.userId === userId);
      return {
        userId,
        status:
          userConflicts.length === 0
            ? "AVAILABLE"
            : userConflicts.length > 1
              ? "BUSY"
              : "PARTIALLY_AVAILABLE",
        conflicts: userConflicts,
      };
    });
  }
}

function roundUpToStep(date: Date, stepMs: number) {
  const rounded = Math.ceil(date.getTime() / stepMs) * stepMs;
  return new Date(rounded);
}

function isWithinBusinessHours(
  start: Date,
  end: Date,
  workingHours: { startHour: number; endHour: number },
) {
  const day = start.getDay();
  if (day === 0 || day === 6) {
    return false;
  }

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  return (
    startMinutes >= workingHours.startHour * 60 &&
    endMinutes <= workingHours.endHour * 60 &&
    start.toDateString() === end.toDateString()
  );
}
