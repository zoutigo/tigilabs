import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(data: { action: string; subject: string; subjectId?: string; userId?: string; metadata?: Record<string, unknown> }) {
    return this.prisma.auditLog.create({ data });
  }
}
