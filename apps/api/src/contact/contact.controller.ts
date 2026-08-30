import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { resolveClientIp } from "../common/utils/resolve-client-ip";
import { Permissions } from "../roles/permissions.decorator";
import { PermissionsGuard } from "../roles/permissions.guard";
import { ContactService } from "./contact.service";
import { ContactMessageFilterDto } from "./dto/contact-message-filter.dto";
import { CreateContactMessageDto } from "./dto/create-contact-message.dto";
import { UpdateContactMessageDto } from "./dto/update-contact-message.dto";

type AuthenticatedRequest = {
  user: { id: string };
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
};

@Controller("contact")
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  submit(
    @Body() dto: CreateContactMessageDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.contactService.submit(dto, {
      ipAddress: resolveClientIp(request),
    });
  }

  @Get()
  @SkipThrottle()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("contact.manage")
  findMany(@Query() filter: ContactMessageFilterDto) {
    return this.contactService.findMany(filter);
  }

  @Patch(":id")
  @SkipThrottle()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("contact.manage")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateContactMessageDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.contactService.updateStatus(id, dto.status, request.user.id);
  }
}
