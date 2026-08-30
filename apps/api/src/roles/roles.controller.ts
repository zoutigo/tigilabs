import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRolePermissionsDto } from "./dto/update-role-permissions.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { Permissions } from "./permissions.decorator";
import { PermissionsGuard } from "./permissions.guard";
import { RolesService } from "./roles.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions("user.read")
  findAll() {
    return this.rolesService.findAll();
  }

  @Get("permissions")
  @Permissions("role.manage")
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Post()
  @Permissions("role.manage")
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Patch(":id")
  @Permissions("role.manage")
  update(@Param("id") id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Put(":id/permissions")
  @Permissions("role.manage")
  setPermissions(
    @Param("id") id: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.rolesService.setPermissions(id, dto.permissionIds);
  }
}
