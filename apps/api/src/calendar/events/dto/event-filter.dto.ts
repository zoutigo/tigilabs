import { IsDateString, IsOptional, IsString } from "class-validator";

export class EventFilterDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;

  @IsString()
  @IsOptional()
  q?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  calendarUserId?: string;
}
