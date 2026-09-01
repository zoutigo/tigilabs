import { IsIn } from "class-validator";
import { ParticipantStatus } from "@prisma/client";

const RESPONSE_STATUSES = [
  ParticipantStatus.ACCEPTED,
  ParticipantStatus.DECLINED,
  ParticipantStatus.TENTATIVE,
] as const;

export class RespondInvitationDto {
  @IsIn(RESPONSE_STATUSES)
  status!: (typeof RESPONSE_STATUSES)[number];
}
