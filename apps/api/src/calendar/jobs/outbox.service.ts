import { Injectable } from "@nestjs/common";
import { JobStatus, JobType, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

export type OutboxPayload = Record<string, unknown>;

@Injectable()
export class OutboxService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enqueue a job using the given Prisma client so it can be part of the
   * same transaction as the business mutation that triggered it. The HTTP
   * response therefore never waits on mail sending or reminder scheduling.
   */
  enqueue(
    client: Prisma.TransactionClient | PrismaService,
    data: { type: JobType; payload: OutboxPayload; scheduledFor?: Date },
  ) {
    return client.outboxJob.create({
      data: {
        type: data.type,
        payload: data.payload as Prisma.InputJsonValue,
        scheduledFor: data.scheduledFor ?? new Date(),
      },
    });
  }

  enqueueMany(
    client: Prisma.TransactionClient | PrismaService,
    jobs: Array<{ type: JobType; payload: OutboxPayload; scheduledFor?: Date }>,
  ) {
    if (!jobs.length) {
      return Promise.resolve({ count: 0 });
    }

    return client.outboxJob.createMany({
      data: jobs.map((job) => ({
        type: job.type,
        payload: job.payload as Prisma.InputJsonValue,
        scheduledFor: job.scheduledFor ?? new Date(),
      })),
    });
  }

  /** Cancels pending jobs matching a payload filter, e.g. all reminders for an event. */
  cancelPendingByEventId(
    client: Prisma.TransactionClient | PrismaService,
    eventId: string,
  ) {
    return client.outboxJob.updateMany({
      where: {
        status: JobStatus.PENDING,
        payload: { path: ["eventId"], equals: eventId },
      },
      data: { status: JobStatus.CANCELLED },
    });
  }

  findDue(now: Date, limit: number) {
    return this.prisma.outboxJob.findMany({
      where: { status: JobStatus.PENDING, scheduledFor: { lte: now } },
      orderBy: { scheduledFor: "asc" },
      take: limit,
    });
  }

  markProcessing(id: string) {
    return this.prisma.outboxJob.update({
      where: { id },
      data: { status: JobStatus.PROCESSING },
    });
  }

  markSent(id: string) {
    return this.prisma.outboxJob.update({
      where: { id },
      data: { status: JobStatus.SENT, processedAt: new Date() },
    });
  }

  markFailed(id: string, attempts: number, error: string, maxAttempts: number) {
    return this.prisma.outboxJob.update({
      where: { id },
      data: {
        attempts,
        lastError: error.slice(0, 2000),
        status: attempts >= maxAttempts ? JobStatus.FAILED : JobStatus.PENDING,
        scheduledFor:
          attempts >= maxAttempts
            ? undefined
            : new Date(Date.now() + this.backoffMs(attempts)),
      },
    });
  }

  private backoffMs(attempts: number) {
    return Math.min(60_000 * 2 ** attempts, 30 * 60_000);
  }
}
