import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Permissions } from "../../roles/permissions.decorator";
import { PermissionsGuard } from "../../roles/permissions.guard";
import { CreateEventDto } from "./dto/create-event.dto";
import { EventFilterDto } from "./dto/event-filter.dto";
import { RecurrenceScopeDto } from "./dto/recurrence-scope.dto";
import { RespondInvitationDto } from "./dto/respond-invitation.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { AuthenticatedUser, EventsService } from "./events.service";

type AuthenticatedRequest = { user: AuthenticatedUser };

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("calendar/events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findRange(
    @Query() filter: EventFilterDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.eventsService.findRange(filter, request.user);
  }

  @Get("dashboard/upcoming")
  dashboard(@Req() request: AuthenticatedRequest) {
    return this.eventsService.dashboardUpcoming(request.user);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.eventsService.findOne(id, request.user);
  }

  @Get(":id/history")
  history(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.eventsService.findHistory(id, request.user);
  }

  @Post()
  @Permissions("calendar.event.create")
  create(@Body() dto: CreateEventDto, @Req() request: AuthenticatedRequest) {
    return this.eventsService.create(dto, request.user);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateEventDto,
    @Query() query: RecurrenceScopeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.eventsService.update(id, dto, query.scope, request.user);
  }

  @Delete(":id")
  remove(
    @Param("id") id: string,
    @Query() query: RecurrenceScopeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.eventsService.remove(id, query.scope, request.user);
  }

  @Post(":id/respond")
  respond(
    @Param("id") id: string,
    @Body() dto: RespondInvitationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.eventsService.respond(id, dto, request.user);
  }
}
