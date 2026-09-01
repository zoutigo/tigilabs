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
