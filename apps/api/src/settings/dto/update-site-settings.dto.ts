import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateSiteSettingsDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  companyName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  ownerName!: string;

  @IsEmail()
  contactEmail!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(40)
  contactPhone!: string;

  @IsString()
  @IsOptional()
  @MaxLength(240)
  address?: string;

  @IsString()
  @MinLength(20)
  @MaxLength(20000)
  privacyPolicy!: string;
}
