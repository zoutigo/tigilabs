import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { CALENDAR_CATEGORY_COLORS } from "../category-colors";

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsIn(CALENDAR_CATEGORY_COLORS)
  color!: string;

  @IsBoolean()
  @IsOptional()
  isGlobal?: boolean;
}
