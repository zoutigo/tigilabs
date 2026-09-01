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
import { ReminderInputDto } from "./reminder-input.dto";

export class UpdateEventDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  startAt?: string;

  @IsDateString()
  @IsOptional()
  endAt?: string;

  @IsBoolean()
  @IsOptional()
  allDay?: boolean;

  @IsString()
  @IsOptional()
  location?: string;

  @IsUrl()
  @IsOptional()
  meetingUrl?: string;

  @IsString()
  @IsOptional()
  categoryId?: string | null;

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
}
