-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3);

-- Backfill: accounts that were already ACTIVE were, under the previous
-- flow, confirmed by email (confirmEmail used to set status=ACTIVE
-- directly). Without this, the new emailVerifiedAt gate would lock every
-- existing active user out of login.
UPDATE "User" SET "emailVerifiedAt" = "updatedAt" WHERE "status" = 'ACTIVE';
