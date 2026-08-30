# AGENTS.md - tigilabs

## Git et qualite

- Sauf instruction explicite contraire, tous les travaux se font sur la branche `dev`. Si la branche courante n'est pas `dev`, basculer dessus avant de modifier le code ou signaler le blocage.
- Apres chaque modification de code (feature, fix, refactor), ecrire ou completer des tests approfondis couvrant le comportement nominal ET la gestion des erreurs (cas invalides, erreurs API, etats limites), colocalises selon les conventions du module (`*.spec.ts` cote api, `*.test.tsx`/`*.test.ts` cote web).
- Avant chaque commit, executer et monitorer les controles locaux dans cet ordre : `pnpm typecheck`, `pnpm lint`, `pnpm format` (ou `pnpm check:repo` qui enchaine format:check + lint + typecheck + test), puis `pnpm test`. Si un hook pre-commit les lance, attendre sa fin et corriger les erreurs au lieu de contourner le hook.
- Une tache n'est consideree terminee qu'une fois ces controles verts, le commit cree et le push vers `origin/dev` effectue : ne pas s'arreter a la seule modification du code.
- Apres le push, monitorer la CI GitHub Actions declenchee par `dev` et corriger tout echec avant de considerer le travail termine.
- Ne pas utiliser `--no-verify` sans accord explicite de l'utilisateur.

## Developpement

- Conserver des changements scopes et coherents avec les patterns existants du monorepo.
- Ne jamais revert des changements non faits par l'agent sans demande explicite.
- Pour les formulaires front, utiliser React Hook Form. Les erreurs sont affichees en `onChange`; au submit, si un champ est invalide, le focus va sur ce champ, l'erreur du champ est affichee et la bordure de l'input passe en rouge.
- Les composants shadcn sont privilegies pour l'UI.
