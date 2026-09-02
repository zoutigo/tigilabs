import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { AvailabilityService } from "./availability.service";
import { AvailabilityQueryDto } from "./dto/availability-query.dto";
import { SuggestSlotsQueryDto } from "./dto/suggest-slots-query.dto";

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

  @Get("suggestions")
  suggestSlots(@Query() query: SuggestSlotsQueryDto) {
    return this.availabilityService.suggestSlots({
      userIds: query.userIds.split(",").filter(Boolean),
      durationMinutes: query.durationMinutes,
      searchFrom: new Date(query.from),
      searchTo: new Date(query.to),
      limit: query.limit,
    });
  }
}
