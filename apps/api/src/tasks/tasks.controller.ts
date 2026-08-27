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
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Permissions } from "../roles/permissions.decorator";
import { PermissionsGuard } from "../roles/permissions.guard";
import { AssignTaskDto } from "./dto/assign-task.dto";
import { CreateTaskGroupDto } from "./dto/create-task-group.dto";
import { CreateTaskInGroupDto } from "./dto/create-task-in-group.dto";
import { CreateTaskProgressDto } from "./dto/create-task-progress.dto";
import { CreateTaskDto } from "./dto/create-task.dto";
import { TaskFilterDto } from "./dto/task-filter.dto";
import { UpdateTaskGroupDto } from "./dto/update-task-group.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { AuthenticatedUser, TasksService } from "./tasks.service";

type AuthenticatedRequest = {
  user: AuthenticatedUser;
};

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get("groups")
  findGroups(@Req() request: AuthenticatedRequest) {
    return this.tasksService.findGroups(request.user);
  }

  @Post("groups")
  @Permissions("task.create")
  createGroup(
    @Body() dto: CreateTaskGroupDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.tasksService.createGroup(dto, request.user);
  }

  @Get("groups/:id")
  findGroup(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.tasksService.findGroup(id, request.user);
  }

  @Patch("groups/:id")
  @Permissions("task.create")
  updateGroup(@Param("id") id: string, @Body() dto: UpdateTaskGroupDto) {
    return this.tasksService.updateGroup(id, dto);
  }

  @Patch("groups/:id/archive")
  @Permissions("task.delete")
  archiveGroup(@Param("id") id: string) {
    return this.tasksService.archiveGroup(id);
  }

  @Post("groups/:groupId/tasks")
  @Permissions("task.create")
  createInGroup(
    @Param("groupId") groupId: string,
    @Body() dto: CreateTaskInGroupDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.tasksService.create({ ...dto, groupId }, request.user);
  }

  @Get("my")
  findMyTasks(@Req() request: AuthenticatedRequest) {
    return this.tasksService.findMyTasks(request.user);
  }

  @Get("dashboard")
  dashboard(@Req() request: AuthenticatedRequest) {
    return this.tasksService.dashboard(request.user);
  }

  @Get()
  findAll(
    @Query() filter: TaskFilterDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.tasksService.findAll(filter, request.user);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.tasksService.findOne(id, request.user);
  }

  @Post()
  @Permissions("task.create")
  create(@Body() dto: CreateTaskDto, @Req() request: AuthenticatedRequest) {
    return this.tasksService.create(dto, request.user);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateTaskDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.tasksService.update(id, dto, request.user);
  }

  @Patch(":id/assign")
  @Permissions("task.assign")
  assign(
    @Param("id") id: string,
    @Body() dto: AssignTaskDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.tasksService.assign(id, dto.assignedToId ?? null, request.user);
  }

  @Patch(":id/complete")
  complete(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.tasksService.complete(id, request.user);
  }

  @Patch(":id/reopen")
  reopen(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.tasksService.reopen(id, request.user);
  }

  @Post(":id/progress")
  addProgress(
    @Param("id") id: string,
    @Body() dto: CreateTaskProgressDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.tasksService.addProgress(id, dto, request.user);
  }

  @Delete(":id")
  @Permissions("task.delete")
  delete(@Param("id") id: string) {
    return this.tasksService.delete(id);
  }
}
