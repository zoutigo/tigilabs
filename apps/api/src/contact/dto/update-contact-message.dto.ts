import { IsEnum } from "class-validator";
import { ContactMessageStatus } from "@prisma/client";

export class UpdateContactMessageDto {
  @IsEnum(ContactMessageStatus)
  status!: ContactMessageStatus;
}
