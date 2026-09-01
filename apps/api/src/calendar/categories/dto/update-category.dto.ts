import { IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { CALENDAR_CATEGORY_COLORS } from "../category-colors";

export class UpdateCategoryDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @IsIn(CALENDAR_CATEGORY_COLORS)
  @IsOptional()
  color?: string;
}
