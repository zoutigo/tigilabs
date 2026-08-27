import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
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
}
