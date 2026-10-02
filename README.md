# Building MMS

A mobile-first maintenance workspace for properties, machinery, work orders and weekly status. Each organization has its own records and team roles. Sign in, create an organization, then add teammates who have registered and verified their email.

## Run locally

Use Node.js 24 and pnpm 11.19.0. Link the provisioned Vercel project and run `vercel env pull .env.local`. Required variables are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Never commit environment files or use a service key in a browser client.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
node scripts/test-tenancy.cjs
```

The last command emits a rollback-only SQL authorization test. Execute its output through the Supabase SQL editor or a privileged PostgreSQL connection. It creates five temporary identities, tests the actual anonymous and authenticated roles across two organizations, and rolls back all fixtures. It needs no service-key environment variable. Browser signup/session verification is separate; the SQL test simulates JWT identity claims.

The previous `scripts/test-database.cjs` is the historical anonymous-demo lifecycle test. Its anonymous writes are intentionally blocked after the tenancy migration.

## Database and isolation

Tracked SQL is in `supabase/migrations`, targeting the provisioned project `idzuedlnakwrqphjmjxi`. The original schema and demo seeds were applied on 2 October 2026. The multi-tenant migration was applied to the provisioned database on 2 October 2026 and its rollback authorization test passed. Apply it once when setting up another environment. Do not reapply the seed to reset a workspace.

Every maintenance row has a required organization ID. RLS checks membership and role; composite foreign keys prevent cross-organization links. Scoring, lifecycle timing and audit run atomically with writes. Starting work requires an assigned organization member; resolving requires WIP. Timestamps remain stable after edits, and audit actors are derived from the authenticated membership.

Existing public-demo records are preserved in an inaccessible legacy organization without members. New accounts begin with empty organizations. An administrator can add an existing verified account through Workspace settings. Adding membership does not send an email invitation. A user can belong to several organizations and switch between them; the workspace cookie only selects a context that the server validates.

## Core workflow

1. A manager maintains the property and asset registry.
2. An inspector or manager chooses New Issue, selects a property and optional asset, enters symptoms, and saves.
3. A manager selects a technician from the organization and saves the assignment.
4. The assigned technician chooses Start Work, then confirms and resolves the issue after fixing it.
5. Weekly Status shows the resolved item and its timing. Open issues carry forward; resolved issues appear in their resolution week. Weeks use Asia/Kuala_Lumpur time, Monday through Sunday.

Administrators and building managers can also run the lifecycle. Inspection managers report and review issues; asset managers maintain registries and review issues; technicians see assigned work. See `docs/SECURITY.md` for the enforced role matrix.

Priority follows `docs/INTELLIGENCE_LAYER.md`: 0–30 low, 31–60 medium, 61–80 high, and 81+ critical. A fire-alarm score of 40 is medium. Assignment and Start Work remain separate steps.

## Deploy

Production: https://building-mms.vercel.app. Commit and push to `main`; Vercel deploys through the connected GitHub integration. Do not deploy local files with the Vercel CLI. The commit identity is pinned to jhacheo's GitHub noreply email.

The multi-tenant release supersedes the earlier shared public demo. Authentication and database isolation are required before private maintenance data is entered. Verification results are recorded in `docs/TEST_PLAN.md` after execution.


