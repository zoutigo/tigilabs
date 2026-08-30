import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PERMISSIONS: Array<{
  subject: string;
  action: string;
  description: string;
}> = [
  {
    subject: "user",
    action: "read",
    description: "Consulter les utilisateurs",
  },
  { subject: "user", action: "create", description: "Creer des utilisateurs" },
  {
    subject: "user",
    action: "manage",
    description: "Gerer les utilisateurs (roles, statut)",
  },
  {
    subject: "task",
    action: "create",
    description: "Creer/modifier taches et groupes",
  },
  {
    subject: "task",
    action: "delete",
    description: "Supprimer/archiver taches et groupes",
  },
  {
    subject: "task",
    action: "assign",
    description: "Assigner une tache a un utilisateur",
  },
  {
    subject: "role",
    action: "manage",
    description: "Gerer les roles et leurs permissions",
  },
  {
    subject: "contact",
    action: "manage",
    description: "Consulter et traiter les messages de contact",
  },
  {
    subject: "settings",
    action: "manage",
    description: "Gerer les parametres du site",
  },
];

const ADMIN_ROLE_NAME = "ADMIN";

const DEFAULT_SITE_SETTINGS_ID = "site-settings-default";
const DEFAULT_SITE_SETTINGS = {
  companyName: "Tigilabs",
  ownerName: "Direction Tigilabs",
  contactEmail: "contact@tigilabs.com",
  contactPhone: "+237 600 000 000",
  privacyPolicy:
    "Tigilabs collecte uniquement les informations necessaires au traitement de vos demandes de contact (nom, email, message). Ces donnees ne sont jamais cedees a des tiers et sont conservees le temps necessaire au traitement de votre demande. Vous pouvez demander leur suppression a tout moment en nous contactant.",
};

async function main() {
  const permissions = await Promise.all(
    PERMISSIONS.map(({ subject, action, description }) =>
      prisma.permission.upsert({
        create: { action, description, subject },
        update: { description },
        where: { action_subject: { action, subject } },
      }),
    ),
  );

  const adminRole = await prisma.role.upsert({
    create: {
      description: "Acces complet a l'espace interne",
      name: ADMIN_ROLE_NAME,
    },
    update: {},
    where: { name: ADMIN_ROLE_NAME },
  });

  await Promise.all(
    permissions.map((permission) =>
      prisma.rolePermission.upsert({
        create: { permissionId: permission.id, roleId: adminRole.id },
        update: {},
        where: {
          roleId_permissionId: {
            permissionId: permission.id,
            roleId: adminRole.id,
          },
        },
      }),
    ),
  );

  const usersWithoutRole = await prisma.user.findMany({
    where: { roles: { none: {} } },
  });

  await Promise.all(
    usersWithoutRole.map((user) =>
      prisma.userRole.upsert({
        create: { roleId: adminRole.id, userId: user.id },
        update: {},
        where: { userId_roleId: { roleId: adminRole.id, userId: user.id } },
      }),
    ),
  );

  await prisma.siteSettings.upsert({
    where: { id: DEFAULT_SITE_SETTINGS_ID },
    create: { id: DEFAULT_SITE_SETTINGS_ID, ...DEFAULT_SITE_SETTINGS },
    update: {},
  });

  console.log(
    `Seed RBAC: ${permissions.length} permissions, role ${ADMIN_ROLE_NAME} assigne a ${usersWithoutRole.length} utilisateur(s) sans role.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
