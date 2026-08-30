import { Controller, Get, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { NotificationsService } from "./notifications.service";

type AuthenticatedRequest = {
  user: { id: string };
};

@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get("unread")
  findUnread(@Req() request: AuthenticatedRequest) {
    return this.notificationsService.findUnread(request.user.id);
  }

  @Patch(":id/read")
  markAsRead(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.notificationsService.markAsRead(id, request.user.id);
  }
}
