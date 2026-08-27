-- Add workflow status value while keeping legacy REVIEW/ARCHIVED values readable.
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'BLOCKED';

-- CreateEnum
CREATE TYPE "TaskGroupStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_assigneeId_fkey";
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_reporterId_fkey";

-- RenameColumns
ALTER TABLE "Task" RENAME COLUMN "assigneeId" TO "assignedToId";
ALTER TABLE "Task" RENAME COLUMN "reporterId" TO "createdById";

-- CreateTable
CREATE TABLE "TaskGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskGroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,

    CONSTRAINT "TaskGroup_pkey" PRIMARY KEY ("id")
);

-- Keep existing tasks visible after the schema change.
INSERT INTO "TaskGroup" ("id", "name", "description", "status", "createdAt", "updatedAt", "createdById")
SELECT 'legacy-tasks', 'Taches existantes', 'Groupe cree automatiquement pour les taches existantes.', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "createdById"
FROM "Task"
LIMIT 1;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "groupId" TEXT;
ALTER TABLE "Task" ADD COLUMN "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Task" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "completedById" TEXT;

UPDATE "Task"
SET "groupId" = 'legacy-tasks',
    "completedAt" = CASE WHEN "status" = 'DONE' THEN "updatedAt" ELSE NULL END
WHERE "groupId" IS NULL;

ALTER TABLE "Task" ALTER COLUMN "groupId" SET NOT NULL;

-- CreateTable
CREATE TABLE "TaskProgress" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "TaskProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskHistory" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TaskHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_groupId_status_idx" ON "Task"("groupId", "status");
CREATE INDEX "Task_assignedToId_status_idx" ON "Task"("assignedToId", "status");
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
CREATE INDEX "TaskGroup_status_createdAt_idx" ON "TaskGroup"("status", "createdAt");
CREATE INDEX "TaskProgress_taskId_createdAt_idx" ON "TaskProgress"("taskId", "createdAt");
CREATE INDEX "TaskHistory_taskId_createdAt_idx" ON "TaskHistory"("taskId", "createdAt");

-- AddForeignKey
ALTER TABLE "TaskGroup" ADD CONSTRAINT "TaskGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TaskGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskProgress" ADD CONSTRAINT "TaskProgress_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskProgress" ADD CONSTRAINT "TaskProgress_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskHistory" ADD CONSTRAINT "TaskHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskHistory" ADD CONSTRAINT "TaskHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Permissions requested for the private task and user areas.
INSERT INTO "Permission" ("id", "action", "subject", "description")
VALUES
  ('perm-task-create', 'create', 'task', 'Creer des groupes et des taches'),
  ('perm-task-assign', 'assign', 'task', 'Affecter ou desaffecter des taches'),
  ('perm-task-read-all', 'read-all', 'task', 'Consulter toutes les taches'),
  ('perm-task-delete', 'delete', 'task', 'Supprimer des taches'),
  ('perm-user-read', 'read', 'user', 'Consulter les utilisateurs'),
  ('perm-user-create', 'create', 'user', 'Creer des utilisateurs'),
  ('perm-user-manage', 'manage', 'user', 'Gerer les utilisateurs et leurs roles')
ON CONFLICT ("action", "subject") DO UPDATE
SET "description" = EXCLUDED."description";

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT "Role"."id", "Permission"."id"
FROM "Role"
JOIN "Permission" ON TRUE
WHERE "Role"."name" IN ('Admin', 'Administrateur')
  AND "Permission"."id" IN (
    'perm-task-create',
    'perm-task-assign',
    'perm-task-read-all',
    'perm-task-delete',
    'perm-user-read',
    'perm-user-create',
    'perm-user-manage'
  )
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT "Role"."id", "Permission"."id"
FROM "Role"
JOIN "Permission" ON TRUE
WHERE "Role"."name" = 'Manager'
  AND "Permission"."id" IN (
    'perm-task-create',
    'perm-task-assign',
    'perm-task-read-all',
    'perm-user-read'
  )
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT "Role"."id", "Permission"."id"
FROM "Role"
JOIN "Permission" ON TRUE
WHERE "Role"."name" IN ('Member', 'Membre', 'Utilisateur')
  AND "Permission"."id" = 'perm-user-read'
ON CONFLICT DO NOTHING;
