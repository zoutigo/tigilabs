# AGENTS.md - tigilabs

## Git et qualite

- Sauf instruction explicite contraire, tous les travaux se font sur la branche `dev`. Si la branche courante n'est pas `dev`, basculer dessus avant de modifier le code ou signaler le blocage.
- Avant chaque commit, executer et monitorer les controles locaux : `pnpm typecheck`, `pnpm format`, puis `pnpm test`. Si un hook pre-commit les lance, attendre sa fin et corriger les erreurs au lieu de contourner le hook.
- Apres chaque travail termine, creer un commit puis pousser vers `origin/dev`.
- Apres le push, monitorer la CI GitHub Actions declenchee par `dev` et corriger tout echec avant de considerer le travail termine.
- Ne pas utiliser `--no-verify` sans accord explicite de l'utilisateur.

## Developpement

- Conserver des changements scopes et coherents avec les patterns existants du monorepo.
- Ne jamais revert des changements non faits par l'agent sans demande explicite.
