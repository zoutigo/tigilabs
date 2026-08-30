import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Permissions } from "../roles/permissions.decorator";
import { PermissionsGuard } from "../roles/permissions.guard";
import { UpdateSiteSettingsDto } from "./dto/update-site-settings.dto";
import { SettingsService } from "./settings.service";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get("public")
  findPublic() {
    return this.settingsService.findPublic();
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("settings.manage")
  findAll() {
    return this.settingsService.findAll();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("settings.manage")
  update(@Body() dto: UpdateSiteSettingsDto) {
    return this.settingsService.update(dto);
  }
}
