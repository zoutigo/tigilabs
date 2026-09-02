import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

export const publicUserSelection = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  name: true,
  status: true,
};

export const eventInclude = {
  organizer: { select: publicUserSelection },
  category: true,
  series: true,
  participants: { include: { user: { select: publicUserSelection } } },
  reminders: true,
  attachments: { include: { uploadedBy: { select: publicUserSelection } } },
} satisfies Prisma.EventInclude;

export type EventWithRelations = Prisma.EventGetPayload<{
  include: typeof eventInclude;
}>;

@Injectable()
export class EventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRange(range: {
    from: Date;
    to: Date;
    visibleTo: string[];
    q?: string;
    categoryId?: string;
  }) {
    const clauses: Prisma.EventWhereInput[] = [
      { startAt: { lt: range.to }, endAt: { gt: range.from } },
      {
        OR: [
          { organizerId: { in: range.visibleTo } },
          { participants: { some: { userId: { in: range.visibleTo } } } },
        ],
      },
    ];

    if (range.q) {
      clauses.push({
        OR: [
          { title: { contains: range.q, mode: "insensitive" } },
          { description: { contains: range.q, mode: "insensitive" } },
          { location: { contains: range.q, mode: "insensitive" } },
        ],
      });
    }

    if (range.categoryId) {
      clauses.push({ categoryId: range.categoryId });
    }

    return this.prisma.event.findMany({
      where: { AND: clauses },
      include: eventInclude,
      orderBy: { startAt: "asc" },
    });
  }

  findUpcoming(userId: string, limit: number) {
    return this.prisma.event.findMany({
      where: {
        status: "CONFIRMED",
        startAt: { gte: new Date() },
        OR: [{ organizerId: userId }, { participants: { some: { userId } } }],
      },
      include: eventInclude,
      orderBy: { startAt: "asc" },
      take: limit,
    });
  }

  findById(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      include: eventInclude,
    });
  }

  findSeriesFrom(seriesId: string, fromStartAt: Date, includeAll = false) {
    return this.prisma.event.findMany({
      where: {
        seriesId,
        startAt: includeAll ? undefined : { gte: fromStartAt },
      },
      include: eventInclude,
      orderBy: { startAt: "asc" },
    });
  }

  async runTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  createEvent(tx: Prisma.TransactionClient, data: Prisma.EventCreateInput) {
    return tx.event.create({ data, include: eventInclude });
  }

  updateEvent(
    tx: Prisma.TransactionClient,
    id: string,
    data: Prisma.EventUpdateInput,
  ) {
    return tx.event.update({ where: { id }, data, include: eventInclude });
  }

  updateManyEvents(
    tx: Prisma.TransactionClient,
    where: Prisma.EventWhereInput,
    data: Prisma.EventUpdateManyMutationInput,
  ) {
    return tx.event.updateMany({ where, data });
  }

  deleteEvent(tx: Prisma.TransactionClient, id: string) {
    return tx.event.delete({ where: { id } });
  }

  deleteManyEvents(
    tx: Prisma.TransactionClient,
    where: Prisma.EventWhereInput,
  ) {
    return tx.event.deleteMany({ where });
  }

  replaceParticipants(
    tx: Prisma.TransactionClient,
    eventId: string,
    participantIds: string[],
    organizerId: string,
  ) {
    const allIds = Array.from(new Set([organizerId, ...participantIds]));

    return tx.eventParticipant.createMany({
      data: allIds.map((userId) => ({
        eventId,
        userId,
        status: userId === organizerId ? "ACCEPTED" : "PENDING",
      })),
      skipDuplicates: true,
    });
  }

  removeParticipantsNotIn(
    tx: Prisma.TransactionClient,
    eventId: string,
    keepUserIds: string[],
  ) {
    return tx.eventParticipant.deleteMany({
      where: { eventId, userId: { notIn: keepUserIds } },
    });
  }

  setReminders(
    tx: Prisma.TransactionClient,
    eventId: string,
    userIds: string[],
    reminders: Array<{ minutesBefore: number; channel: "EMAIL" | "IN_APP" }>,
  ) {
    return tx.eventReminder.createMany({
      data: userIds.flatMap((userId) =>
        reminders.map((reminder) => ({ eventId, userId, ...reminder })),
      ),
    });
  }

  clearReminders(tx: Prisma.TransactionClient, eventId: string) {
    return tx.eventReminder.deleteMany({ where: { eventId } });
  }

  respond(
    eventId: string,
    userId: string,
    status: "ACCEPTED" | "DECLINED" | "TENTATIVE",
  ) {
    return this.prisma.eventParticipant.update({
      where: { eventId_userId: { eventId, userId } },
      data: { status, respondedAt: new Date() },
    });
  }

  createHistory(
    tx: Prisma.TransactionClient | PrismaService,
    data: {
      eventId: string;
      userId: string;
      action: string;
      oldValue?: string | null;
      newValue?: string | null;
    },
  ) {
    return tx.eventHistory.create({ data });
  }

  findHistory(eventId: string) {
    return this.prisma.eventHistory.findMany({
      where: { eventId },
      include: { user: { select: publicUserSelection } },
      orderBy: { createdAt: "desc" },
    });
  }

  createSeries(
    tx: Prisma.TransactionClient,
    data: Prisma.EventSeriesCreateInput,
  ) {
    return tx.eventSeries.create({ data });
  }

  updateSeries(
    tx: Prisma.TransactionClient,
    id: string,
    data: Prisma.EventSeriesUpdateInput,
  ) {
    return tx.eventSeries.update({ where: { id }, data });
  }
}
