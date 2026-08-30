import { ContactRepository } from "./contact.repository";
import { ContactService } from "./contact.service";
import { CreateContactMessageDto } from "./dto/create-contact-message.dto";
import { NotificationsService } from "../notifications/notifications.service";

const repository = {
  create: jest.fn(),
  findMany: jest.fn(),
  findRecipients: jest.fn(),
  update: jest.fn(),
};

const notificationsService = {
  createMany: jest.fn(),
};

const baseDto: CreateContactMessageDto = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Bonjour, je souhaite discuter d'un projet.",
};

describe("ContactService", () => {
  let service: ContactService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ContactService(
      repository as unknown as ContactRepository,
      notificationsService as unknown as NotificationsService,
    );
  });

  it("persists a legitimate message and notifies recipients", async () => {
    const created = { id: "msg-1", ...baseDto };
    repository.create.mockResolvedValue(created);
    repository.findRecipients.mockResolvedValue([
      {
        id: "user-admin",
        email: "admin@tigilabs.com",
        firstName: "Admin",
        name: "Admin",
      },
      {
        id: "user-manager",
        email: "manager@tigilabs.com",
        firstName: null,
        name: "Manager",
      },
    ]);

    await expect(
      service.submit(baseDto, { ipAddress: "203.0.113.5" }),
    ).resolves.toEqual({ message: "Votre message a bien ete envoye." });

    expect(repository.create).toHaveBeenCalledWith({
      name: baseDto.name,
      email: baseDto.email,
      subject: undefined,
      message: baseDto.message,
      ipAddress: "203.0.113.5",
    });
    expect(notificationsService.createMany).toHaveBeenCalledWith([
      {
        userId: "user-admin",
        title: "Nouveau message de contact",
        body: expect.stringContaining("Ada Lovelace"),
      },
      {
        userId: "user-manager",
        title: "Nouveau message de contact",
        body: expect.stringContaining("Ada Lovelace"),
      },
    ]);
  });

  it("silently drops submissions where the honeypot field is filled", async () => {
    await expect(
      service.submit(
        { ...baseDto, website: "http://spam.example" },
        { ipAddress: "203.0.113.5" },
      ),
    ).resolves.toEqual({ message: "Votre message a bien ete envoye." });

    expect(repository.create).not.toHaveBeenCalled();
    expect(notificationsService.createMany).not.toHaveBeenCalled();
  });

  it("silently drops submissions filled faster than a human could type", async () => {
    await expect(
      service.submit(
        { ...baseDto, startedAt: String(Date.now() - 200) },
        { ipAddress: "203.0.113.5" },
      ),
    ).resolves.toEqual({ message: "Votre message a bien ete envoye." });

    expect(repository.create).not.toHaveBeenCalled();
  });

  it("accepts submissions filled after the minimum delay", async () => {
    repository.create.mockResolvedValue({ id: "msg-2", ...baseDto });
    repository.findRecipients.mockResolvedValue([]);

    await service.submit(
      { ...baseDto, startedAt: String(Date.now() - 5000) },
      { ipAddress: "203.0.113.5" },
    );

    expect(repository.create).toHaveBeenCalled();
  });

  it("lists messages through the repository", async () => {
    repository.findMany.mockResolvedValue([]);

    await service.findMany({ status: "NEW" });

    expect(repository.findMany).toHaveBeenCalledWith({ status: "NEW" });
  });

  it("updates a message status with the acting user id", async () => {
    repository.update.mockResolvedValue({ id: "msg-1", status: "READ" });

    await service.updateStatus("msg-1", "READ", "user-admin");

    expect(repository.update).toHaveBeenCalledWith(
      "msg-1",
      "READ",
      "user-admin",
    );
  });
});
