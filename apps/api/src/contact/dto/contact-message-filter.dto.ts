import { IsEnum, IsOptional } from "class-validator";
import { ContactMessageStatus } from "@prisma/client";

export class ContactMessageFilterDto {
  @IsEnum(ContactMessageStatus)
  @IsOptional()
  status?: ContactMessageStatus;
}
