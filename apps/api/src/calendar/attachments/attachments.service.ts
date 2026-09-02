import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AuthenticatedUser } from "../events/events.service";
import { EventsRepository } from "../events/events.repository";
import { AttachmentsRepository } from "./attachments.repository";
import { STORAGE_ADAPTER, StorageAdapter } from "./storage/storage.interface";

const MAX_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
]);

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly attachmentsRepository: AttachmentsRepository,
    private readonly eventsRepository: EventsRepository,
    @Inject(STORAGE_ADAPTER) private readonly storage: StorageAdapter,
  ) {}

  async upload(
    eventId: string,
    file: Express.Multer.File,
    user: AuthenticatedUser,
  ) {
    const event = await this.assertCanAccessEvent(eventId, user);

    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException("File exceeds the 20MB limit");
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException("File type not allowed");
    }

    const storageKey = `${event.id}/${randomUUID()}-${this.sanitizeFileName(file.originalname)}`;
    await this.storage.save(storageKey, file.buffer);

    return this.attachmentsRepository.create({
      eventId: event.id,
      fileName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storageKey,
      uploadedById: user.id,
    });
  }

  async download(attachmentId: string, user: AuthenticatedUser) {
    const attachment = await this.attachmentsRepository.findById(attachmentId);
    if (!attachment) {
      throw new NotFoundException("Attachment not found");
    }

    await this.assertCanAccessEvent(attachment.eventId, user);
    const buffer = await this.storage.read(attachment.storageKey);

    return {
      buffer,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
    };
  }

  async remove(attachmentId: string, user: AuthenticatedUser) {
    const attachment = await this.attachmentsRepository.findById(attachmentId);
    if (!attachment) {
      throw new NotFoundException("Attachment not found");
    }

    const canDeleteOthers =
      user.permissions?.includes("calendar.attachment.delete_others") ?? false;

    if (attachment.uploadedById !== user.id && !canDeleteOthers) {
      throw new ForbiddenException("Access denied");
    }

    await this.storage.delete(attachment.storageKey);
    await this.attachmentsRepository.delete(attachmentId);

    return { ok: true };
  }

  private async assertCanAccessEvent(eventId: string, user: AuthenticatedUser) {
    const event = await this.eventsRepository.findById(eventId);
    if (!event) {
      throw new NotFoundException("Event not found");
    }

    const isParticipant =
      event.organizerId === user.id ||
      event.participants.some((p) => p.userId === user.id);

    if (!isParticipant) {
      throw new ForbiddenException("Access denied");
    }

    return event;
  }

  private sanitizeFileName(fileName: string) {
    return fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  }
}
