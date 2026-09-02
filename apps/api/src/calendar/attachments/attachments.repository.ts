import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class AttachmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    eventId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    uploadedById: string;
  }) {
    return this.prisma.eventAttachment.create({ data });
  }

  findById(id: string) {
    return this.prisma.eventAttachment.findUnique({
      where: { id },
      include: { event: true },
    });
  }

  delete(id: string) {
    return this.prisma.eventAttachment.delete({ where: { id } });
  }
}
