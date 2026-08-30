# CLAUDE.md - tigilabs

Ce fichier complète `AGENTS.md` (règles de process obligatoires : branche `dev`, checks avant commit, push + CI). Ici : contexte architecture et conventions techniques du repo pour travailler efficacement dessus.

## Vue d'ensemble

Monorepo pnpm (workspaces `apps/*` + `packages/*`) pour Tigilabs : site public + espace privé de gestion interne (auth, utilisateurs, rôles/permissions, gestion de tâches) + API backend.

- `apps/web` — Next.js 14 (App Router), port **3100**
- `apps/api` — NestJS, port **3101**
- `packages/ui` — composants UI partagés
- `packages/types` — types TypeScript partagés
- `packages/schemas` — schémas Zod partagés (validation front/back)
- `packages/config` — configuration commune
- `prisma/` — schéma PostgreSQL unique et migrations (partagé par l'API, pas de prisma par app)

## Commandes essentielles

```bash
pnpm dev            # web + api en parallèle
pnpm dev:web / dev:api
pnpm build           # build récursif (turbo-less, `pnpm -r`)
pnpm lint / typecheck / test    # récursifs sur tous les workspaces
pnpm format / format:check      # prettier
pnpm check:repo      # format:check + lint + typecheck + test (= la CI locale)
pnpm prisma:generate / prisma:migrate / prisma:studio
```

Le typecheck de `@tigilabs/api` régénère le client Prisma avant `tsc --noEmit` (voir `apps/api/package.json`) — donc `pnpm typecheck` peut échouer silencieusement si la DB/`.env` n'est pas configurée. Tests : `vitest` côté web, `jest` côté api.

La CI (`.github/workflows/ci.yml`) tourne sur push/PR vers `dev`/`main` : install → prisma generate → format:check → lint → typecheck → test → build. Reproduire cette séquence localement avant de pousser.

## Architecture web (`apps/web`)

Route groups App Router :

- `(public)` — vitrine : `solutions` (dont `solutions/scolive`, présenté comme produit de l'entreprise, pas Tigilabs lui-même), `contact`, `about`
- `(auth)` — `login`, `register`, `confirm-email`, `forgot-password`, `reset-password`
- `(private)` — espace interne : `dashboard`, `users/[id]`, `tasks` (+ `tasks/my`, `tasks/[id]`), `settings`
- `app/api/auth/*` — route handlers qui proxient vers l'API NestJS (login/register/logout/forgot-password/reset-password/confirm-email)
- `app/api/backend/[...path]` — proxy catch-all vers `@tigilabs/api`

`middleware.ts` gère la protection des routes privées. `lib/auth` = logique client d'authentification, `lib/api` = client HTTP vers le backend. `components/` organisé par domaine (`tasks`, `users`, `layout`, `ui`).

**Formulaires** : toujours React Hook Form + résolveur Zod (schémas partagés via `@tigilabs/schemas`). Erreurs affichées en `onChange` ; au submit, focus + erreur + bordure rouge sur le premier champ invalide (règle définie dans `AGENTS.md`).

**UI** : composants shadcn en priorité, complétés par `packages/ui`.

## Architecture API (`apps/api`, NestJS)

Modules sous `src/` : `auth`, `users`, `roles` (RBAC), `tasks`, `comments`, `notifications`, `audit`, `database` (PrismaService/PrismaModule), `common` (guards/decorators/filters/interceptors partagés), `config` (validation d'env via `env.validation.ts`).

- Auth : JWT (passport-jwt), tokens de confirmation email / reset password stockés hashés dans `AuthToken` (voir schéma Prisma).
- RBAC : `Role` / `Permission` / `UserRole` / `RolePermission`, appliqué via `roles/permissions.guard.ts` + `permissions.decorator.ts`.
- Pattern par module : `*.controller.ts` → `*.service.ts` → `*.repository.ts` (accès Prisma), DTOs dans `dto/`, entités dans `entities/`.
- Tests : fichiers `*.spec.ts` colocalisés (ex. `tasks.service.spec.ts`, `auth.service.spec.ts`), exécutés par Jest.

## Modèle de données (Prisma, `prisma/schema.prisma`)

Domaine tâches : `TaskGroup` (statut `ACTIVE/COMPLETED/ARCHIVED`) contient des `Task` (statut `TODO/IN_PROGRESS/BLOCKED/REVIEW/DONE/ARCHIVED`, priorité `LOW/MEDIUM/HIGH/URGENT`), avec assignation (`assignedTo`), créateur, "completer", `TaskProgress` (notes d'avancement), `TaskHistory` (audit des changements de champ) et `Comment`.

Domaine identité : `User` (statut `ACTIVE/INVITED/DISABLED`), `Role`/`Permission` via tables de jointure, `AuthToken` (confirmation email / reset password), `Notification`, `AuditLog` global (action/subject/subjectId/metadata JSON).

Toute nouvelle migration doit passer par `pnpm prisma:migrate` (jamais éditer les migrations existantes sous `prisma/migrations/`).

## Process de travail

- Ne pas utiliser le tool `Agent` (pas de sous-agents/subagents, y compris `Explore` ou `fork`) sur ce repo : l'utilisateur veut que Claude fasse tout lui-même directement (exploration, code, tests).
- Apres chaque modification de code, ecrire/completer des tests approfondis (cas nominal + gestion des erreurs), puis executer `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm test` (ou `pnpm check:repo`) avant de commiter. Une tache n'est terminee qu'apres commit + push vers `origin/dev` (voir `AGENTS.md`).
- Apres chaque `git push`, monitorer le run CI GitHub Actions declenche (`.github/workflows/ci.yml`) jusqu'a son resultat (succes/echec) plutot que de considerer la tache terminee au push.
- Toute modification ou creation d'UI doit reutiliser les composants deja presents dans `apps/web/components/` (par domaine : `tasks`, `users`, `layout`, `ui`) avant d'en creer de nouveaux, et doit etre pensee/verifiee pour les trois gabarits desktop, tablette et mobile en s'appuyant sur le skill `frontend-design`.

## Conventions à respecter

- Scoper les changements aux patterns déjà en place (voir `AGENTS.md` pour les règles de process/git obligatoires).
- Respecter les enums Prisma existants plutôt que d'introduire des champs texte libres pour des statuts/priorités.
- Les endpoints privés doivent vérifier les permissions via le guard RBAC existant, pas de check ad hoc.
- Scolive est un produit séparé avec son propre site ; dans Tigilabs il n'apparaît que comme une solution vitrine (`app/(public)/solutions/scolive`).
