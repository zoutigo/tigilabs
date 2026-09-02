import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { JobType } from "@prisma/client";
import { NotificationsService } from "../../notifications/notifications.service";
import {
  CalendarMailService,
  EventMailPayload,
  ReminderMailPayload,
} from "../mail/calendar-mail.service";
import { OutboxService } from "./outbox.service";

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 25;

type ReminderJobPayload = ReminderMailPayload & {
  eventId: string;
  userId: string;
  channel: "EMAIL" | "IN_APP";
};

@Injectable()
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);
  private draining = false;

  constructor(
    private readonly outboxService: OutboxService,
    private readonly calendarMailService: CalendarMailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async drain() {
    if (this.draining) {
      return;
    }

    this.draining = true;
    try {
      const jobs = await this.outboxService.findDue(new Date(), BATCH_SIZE);

      for (const job of jobs) {
        await this.outboxService.markProcessing(job.id);

        try {
          await this.dispatch(job.type, job.payload as Record<string, unknown>);
          await this.outboxService.markSent(job.id);
        } catch (error) {
          const attempts = job.attempts + 1;
          this.logger.error(
            `Job ${job.id} (${job.type}) failed on attempt ${attempts}: ${(error as Error).message}`,
          );
          await this.outboxService.markFailed(
            job.id,
            attempts,
            (error as Error).message,
            MAX_ATTEMPTS,
          );
        }
      }
    } finally {
      this.draining = false;
    }
  }

  private async dispatch(type: JobType, payload: Record<string, unknown>) {
    switch (type) {
      case JobType.EVENT_INVITATION:
        return this.calendarMailService.sendInvitation(
          payload as unknown as EventMailPayload,
        );
      case JobType.EVENT_UPDATE:
        return this.calendarMailService.sendUpdate(
          payload as unknown as EventMailPayload,
        );
      case JobType.EVENT_CANCELLATION:
        return this.calendarMailService.sendCancellation(
          payload as unknown as EventMailPayload,
        );
      case JobType.EVENT_REMINDER:
        return this.dispatchReminder(payload as unknown as ReminderJobPayload);
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  }

  private async dispatchReminder(payload: ReminderJobPayload) {
    if (payload.channel === "IN_APP") {
      await this.notificationsService.create({
        userId: payload.userId,
        title: "Rappel de rendez-vous",
        body: `"${payload.eventTitle}" commence bientot.`,
      });
      return;
    }

    await this.calendarMailService.sendReminder(payload);
  }
}
