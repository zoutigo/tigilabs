import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
} from "class-validator";
import { RecurrenceFrequency } from "@prisma/client";

export class RecurrenceInputDto {
  @IsEnum(RecurrenceFrequency)
  frequency!: RecurrenceFrequency;

  @IsInt()
  @Min(1)
  @IsOptional()
  interval?: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  byWeekday?: number[];

  @IsDateString()
  @IsOptional()
  until?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  count?: number;
}
