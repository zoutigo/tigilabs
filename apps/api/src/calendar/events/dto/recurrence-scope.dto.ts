import { IsIn, IsOptional } from "class-validator";

export const RecurrenceScope = {
  THIS: "this",
  FOLLOWING: "following",
  ALL: "all",
} as const;

export type RecurrenceScopeValue =
  (typeof RecurrenceScope)[keyof typeof RecurrenceScope];

export class RecurrenceScopeDto {
  @IsIn(Object.values(RecurrenceScope))
  @IsOptional()
  scope?: RecurrenceScopeValue;
}
