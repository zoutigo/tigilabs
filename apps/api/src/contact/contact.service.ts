import { Injectable, Logger } from "@nestjs/common";
import { ContactMessageStatus } from "@prisma/client";
import { NotificationsService } from "../notifications/notifications.service";
import { ContactRepository } from "./contact.repository";
import { ContactMessageFilterDto } from "./dto/contact-message-filter.dto";
import { CreateContactMessageDto } from "./dto/create-contact-message.dto";

/** Bots and browser autofill scripts submit forms far faster than a human can type a message. */
const MIN_FILL_TIME_MS = 2000;

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async submit(dto: CreateContactMessageDto, context: { ipAddress?: string }) {
    if (this.isLikelyBot(dto)) {
      this.logger.warn(
        `Suspected bot contact submission from ${context.ipAddress ?? "unknown"}`,
      );
      return { message: "Votre message a bien ete envoye." };
    }

    const created = await this.contactRepository.create({
      name: dto.name,
      email: dto.email,
      subject: dto.subject,
      message: dto.message,
      ipAddress: context.ipAddress,
    });

    await this.notifyRecipients(created);

    return { message: "Votre message a bien ete envoye." };
  }

  findMany(filter: ContactMessageFilterDto) {
    return this.contactRepository.findMany(filter);
  }

  updateStatus(id: string, status: ContactMessageStatus, readById: string) {
    return this.contactRepository.update(id, status, readById);
  }

  private isLikelyBot(dto: CreateContactMessageDto): boolean {
    if (dto.website) {
      return true;
    }

    if (!dto.startedAt) {
      return false;
    }

    const startedAt = Number(dto.startedAt);
    if (!Number.isFinite(startedAt)) {
      return false;
    }

    return Date.now() - startedAt < MIN_FILL_TIME_MS;
  }

  private async notifyRecipients(message: { name: string; email: string }) {
    const recipients = await this.contactRepository.findRecipients();

    await this.notificationsService.createMany(
      recipients.map((recipient) => ({
        userId: recipient.id,
        title: "Nouveau message de contact",
        body: `${message.name} (${message.email}) a envoye un message via le formulaire de contact.`,
      })),
    );
  }
}
