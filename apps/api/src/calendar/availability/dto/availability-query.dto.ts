import { IsDateString, IsString } from "class-validator";

export class AvailabilityQueryDto {
  @IsString()
  userIds!: string;

  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;
}
