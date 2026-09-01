import { Module } from "@nestjs/common";
import { NotificationsModule } from "../../notifications/notifications.module";
import { CalendarMailService } from "../mail/calendar-mail.service";
import { OutboxProcessor } from "./outbox.processor";
import { OutboxService } from "./outbox.service";

@Module({
  imports: [NotificationsModule],
  providers: [OutboxService, OutboxProcessor, CalendarMailService],
  exports: [OutboxService],
})
export class JobsModule {}
