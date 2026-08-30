import { Injectable } from "@nestjs/common";
import { ContactMessageStatus } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { ContactMessageFilterDto } from "./dto/contact-message-filter.dto";

@Injectable()
export class ContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    name: string;
    email: string;
    subject?: string;
    message: string;
    ipAddress?: string;
  }) {
    return this.prisma.contactMessage.create({ data });
  }

  findMany(filter: ContactMessageFilterDto) {
    return this.prisma.contactMessage.findMany({
      where: filter.status ? { status: filter.status } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  findRecipients() {
    return this.prisma.user.findMany({
      where: {
        status: "ACTIVE",
        roles: {
          some: {
            role: {
              permissions: {
                some: {
                  permission: { subject: "contact", action: "manage" },
                },
              },
            },
          },
        },
      },
      select: { id: true, email: true, firstName: true, name: true },
    });
  }

  update(id: string, status: ContactMessageStatus, readById?: string) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: {
        status,
        readAt: status === "NEW" ? null : new Date(),
        readById: status === "NEW" ? null : readById,
      },
    });
  }
}
