import { Type } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  ValidateNested,
} from "class-validator";
import { EventPrivacy } from "@prisma/client";
import { RecurrenceInputDto } from "./recurrence-input.dto";
import { ReminderInputDto } from "./reminder-input.dto";

export class CreateEventDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsBoolean()
  @IsOptional()
  allDay?: boolean;

  @IsString()
  timezone!: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsUrl()
  @IsOptional()
  meetingUrl?: string;

  @IsBoolean()
  @IsOptional()
  generateMeetingLink?: boolean;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsEnum(EventPrivacy)
  @IsOptional()
  privacy?: EventPrivacy;

  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @IsOptional()
  participantIds?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReminderInputDto)
  @IsOptional()
  reminders?: ReminderInputDto[];

  @ValidateNested()
  @Type(() => RecurrenceInputDto)
  @IsOptional()
  recurrence?: RecurrenceInputDto;
}
