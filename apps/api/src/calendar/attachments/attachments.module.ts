import { Module } from "@nestjs/common";
import { EventsRepository } from "../events/events.repository";
import { AttachmentsController } from "./attachments.controller";
import { AttachmentsRepository } from "./attachments.repository";
import { AttachmentsService } from "./attachments.service";
import { LocalDiskStorage } from "./storage/local-disk.storage";
import { STORAGE_ADAPTER } from "./storage/storage.interface";

@Module({
  controllers: [AttachmentsController],
  providers: [
    AttachmentsRepository,
    AttachmentsService,
    EventsRepository,
    { provide: STORAGE_ADAPTER, useClass: LocalDiskStorage },
  ],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
