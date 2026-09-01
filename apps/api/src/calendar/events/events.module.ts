import { Module } from "@nestjs/common";
import { AvailabilityModule } from "../availability/availability.module";
import { JobsModule } from "../jobs/jobs.module";
import { EventsController } from "./events.controller";
import { EventsRepository } from "./events.repository";
import { EventsService } from "./events.service";

@Module({
  imports: [JobsModule, AvailabilityModule],
  controllers: [EventsController],
  providers: [EventsRepository, EventsService],
  exports: [EventsService, EventsRepository],
})
export class EventsModule {}
