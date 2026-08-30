import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateContactMessageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  @MaxLength(160)
  subject?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  message!: string;

  /** Honeypot: legitimate users never fill this hidden field. */
  @IsString()
  @IsOptional()
  @MaxLength(200)
  website?: string;

  /** Client-side form mount timestamp (ms epoch), used to reject too-fast submits. */
  @IsString()
  @IsOptional()
  startedAt?: string;
}
