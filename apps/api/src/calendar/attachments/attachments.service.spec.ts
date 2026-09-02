import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { AuthenticatedUser } from "../events/events.service";
import { EventsRepository } from "../events/events.repository";
import { AttachmentsRepository } from "./attachments.repository";
import { AttachmentsService } from "./attachments.service";
import { StorageAdapter } from "./storage/storage.interface";

const attachmentsRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  delete: jest.fn(),
};

const eventsRepository = {
  findById: jest.fn(),
};

const storage: jest.Mocked<StorageAdapter> = {
  save: jest.fn(),
  read: jest.fn(),
  delete: jest.fn(),
};

const organizer: AuthenticatedUser = {
  id: "organizer-1",
  email: "organizer@tigilabs.com",
};
const outsider: AuthenticatedUser = {
  id: "outsider-1",
  email: "outsider@tigilabs.com",
};

const event = {
  id: "event-1",
  organizerId: organizer.id,
  participants: [{ userId: organizer.id }],
};

describe("AttachmentsService", () => {
  let service: AttachmentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AttachmentsService(
      attachmentsRepository as unknown as AttachmentsRepository,
      eventsRepository as unknown as EventsRepository,
      storage,
    );
  });

  it("rejects an upload from a user with no access to the event", async () => {
    eventsRepository.findById.mockResolvedValue(event);

    await expect(
      service.upload(
        "event-1",
        {
          originalname: "note.pdf",
          mimetype: "application/pdf",
          size: 1024,
          buffer: Buffer.from("x"),
        } as Express.Multer.File,
        outsider,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it("rejects a disallowed file type", async () => {
    eventsRepository.findById.mockResolvedValue(event);

    await expect(
      service.upload(
        "event-1",
        {
          originalname: "script.exe",
          mimetype: "application/x-msdownload",
          size: 1024,
          buffer: Buffer.from("x"),
        } as Express.Multer.File,
        organizer,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects a file above the size limit", async () => {
    eventsRepository.findById.mockResolvedValue(event);

    await expect(
      service.upload(
        "event-1",
        {
          originalname: "big.pdf",
          mimetype: "application/pdf",
          size: 21 * 1024 * 1024,
          buffer: Buffer.from("x"),
        } as Express.Multer.File,
        organizer,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("stores a valid attachment and records it", async () => {
    eventsRepository.findById.mockResolvedValue(event);
    attachmentsRepository.create.mockResolvedValue({ id: "att-1" });

    const result = await service.upload(
      "event-1",
      {
        originalname: "plan.pdf",
        mimetype: "application/pdf",
        size: 2048,
        buffer: Buffer.from("x"),
      } as Express.Multer.File,
      organizer,
    );

    expect(storage.save).toHaveBeenCalled();
    expect(attachmentsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "event-1",
        fileName: "plan.pdf",
        uploadedById: organizer.id,
      }),
    );
    expect(result).toEqual({ id: "att-1" });
  });

  it("throws when downloading an attachment that does not exist", async () => {
    attachmentsRepository.findById.mockResolvedValue(null);

    await expect(service.download("missing", organizer)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("prevents deleting someone else's attachment without the override permission", async () => {
    attachmentsRepository.findById.mockResolvedValue({
      id: "att-1",
      eventId: "event-1",
      uploadedById: organizer.id,
      storageKey: "event-1/file",
    });

    await expect(service.remove("att-1", outsider)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it("allows an override permission to delete another user's attachment", async () => {
    attachmentsRepository.findById.mockResolvedValue({
      id: "att-1",
      eventId: "event-1",
      uploadedById: organizer.id,
      storageKey: "event-1/file",
    });

    const admin: AuthenticatedUser = {
      id: "admin-1",
      email: "admin@tigilabs.com",
      permissions: ["calendar.attachment.delete_others"],
    };

    const result = await service.remove("att-1", admin);

    expect(storage.delete).toHaveBeenCalledWith("event-1/file");
    expect(result).toEqual({ ok: true });
  });
});
