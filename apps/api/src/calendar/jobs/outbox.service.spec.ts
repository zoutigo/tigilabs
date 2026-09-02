import { JobStatus, JobType } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { OutboxService } from "./outbox.service";

const prisma = {
  outboxJob: {
    create: jest.fn(),
    createMany: jest.fn(),
    updateMany: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

describe("OutboxService", () => {
  let service: OutboxService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OutboxService(prisma as unknown as PrismaService);
  });

  it("enqueues a job scheduled for now by default", async () => {
    prisma.outboxJob.create.mockResolvedValue({ id: "job-1" });

    await service.enqueue(prisma as never, {
      type: JobType.EVENT_INVITATION,
      payload: { eventId: "event-1" },
    });

    expect(prisma.outboxJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: JobType.EVENT_INVITATION }),
      }),
    );
  });

  it("does nothing when enqueuing an empty batch", async () => {
    const result = await service.enqueueMany(prisma as never, []);
    expect(result).toEqual({ count: 0 });
    expect(prisma.outboxJob.createMany).not.toHaveBeenCalled();
  });

  it("marks a job SENT after successful processing", async () => {
    prisma.outboxJob.update.mockResolvedValue({});
    await service.markSent("job-1");
    expect(prisma.outboxJob.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: { status: JobStatus.SENT, processedAt: expect.any(Date) },
    });
  });

  it("keeps a failed job PENDING with backoff before the max attempts", async () => {
    prisma.outboxJob.update.mockResolvedValue({});
    await service.markFailed("job-1", 2, "SMTP timeout", 5);

    expect(prisma.outboxJob.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: expect.objectContaining({
        attempts: 2,
        status: JobStatus.PENDING,
        scheduledFor: expect.any(Date),
      }),
    });
  });

  it("marks a job FAILED once max attempts are reached", async () => {
    prisma.outboxJob.update.mockResolvedValue({});
    await service.markFailed("job-1", 5, "SMTP timeout", 5);

    expect(prisma.outboxJob.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: expect.objectContaining({
        attempts: 5,
        status: JobStatus.FAILED,
        scheduledFor: undefined,
      }),
    });
  });
});
