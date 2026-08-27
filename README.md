# Tigilabs

Monorepo pour le site public Tigilabs, l'espace privé de gestion interne et l'API backend.

## Stack

- `apps/web` : Next.js App Router
- `apps/api` : NestJS
- `packages/ui` : composants UI partagés
- `packages/types` : types TypeScript partagés
- `packages/schemas` : schémas Zod partagés
- `packages/config` : configuration commune
- `prisma` : modèle PostgreSQL et migrations

## Installation

```bash
corepack enable
pnpm install
cp .env.example .env
cp docker/.env.example docker/.env
docker compose --env-file docker/.env -f docker/docker-compose.dev.yml up -d postgres
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

Le site web est disponible en local sur `http://localhost:3100` et l'API sur `http://localhost:3101`.

## Scripts utiles

```bash
pnpm dev:web
pnpm dev:api
pnpm build
pnpm typecheck
pnpm lint
pnpm prisma:migrate
pnpm prisma:studio
```

## Vision produit

Tigilabs combine un site vitrine public et un espace privé modulaire. Le premier périmètre interne couvre l'authentification, les utilisateurs, les rôles, les permissions et la gestion de tâches avec affectation, priorité, statut et commentaires.

Scolive reste un produit séparé avec son propre site. Dans Tigilabs, il est présenté comme une solution de l'entreprise.
