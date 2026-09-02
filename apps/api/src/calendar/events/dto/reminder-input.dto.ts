import { IsEnum, IsInt, Min } from "class-validator";
import { ReminderChannel } from "@prisma/client";

export class ReminderInputDto {
  @IsInt()
  @Min(0)
  minutesBefore!: number;

  @IsEnum(ReminderChannel)
  channel!: ReminderChannel;
}
