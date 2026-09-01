import { Module } from "@nestjs/common";
import { AttachmentsModule } from "./attachments/attachments.module";
import { AvailabilityModule } from "./availability/availability.module";
import { CategoriesModule } from "./categories/categories.module";
import { EventsModule } from "./events/events.module";
import { JobsModule } from "./jobs/jobs.module";

@Module({
  imports: [
    JobsModule,
    EventsModule,
    CategoriesModule,
    AttachmentsModule,
    AvailabilityModule,
  ],
})
export class CalendarModule {}
