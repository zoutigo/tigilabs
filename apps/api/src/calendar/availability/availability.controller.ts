import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { AvailabilityService } from "./availability.service";
import { AvailabilityQueryDto } from "./dto/availability-query.dto";

@UseGuards(JwtAuthGuard)
@Controller("calendar/availability")
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  getAvailability(@Query() query: AvailabilityQueryDto) {
    return this.availabilityService.getAvailability({
      userIds: query.userIds.split(",").filter(Boolean),
      from: new Date(query.from),
      to: new Date(query.to),
    });
  }
}
