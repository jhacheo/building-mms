# Building MMS

A mobile-first, database-backed maintenance workspace for properties, machinery, work orders and weekly status. The homepage is the working shared demo; no login is required for v1.

## Run locally

Use Node.js 24 and pnpm 11.19.0. Link the provisioned Vercel project and run `vercel env pull .env.local`. Required environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Never commit environment files.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm build
pnpm test:db
```

`test:db` performs the real lifecycle against Supabase using the demo key. It creates temporary properties, assets and issues, checks scoring, timing, constraints and audit access, then removes the test records. Append-only audit events remain as evidence.

## Database

The initial schema and editable demo seeds live in `supabase/migrations`. They were applied to the provisioned project `idzuedlnakwrqphjmjxi` through the Supabase SQL editor on 2 October 2026. Both scripts are idempotent for initial setup. Do not reapply the demo seed to reset an active workspace.

Scoring and transition triggers run atomically with database writes. Starting work requires an assigned technician; resolution requires WIP. First-response and resolution timestamps remain stable after edits. Audit logs can be read by the demo, but only the private trigger can append records. Deleting linked properties/assets is blocked until their dependent records are removed.

## Core workflow

1. Open Work Orders and choose New Issue. Select a property and optional asset, enter symptoms and reporter, then save.
2. Open the issue, enter a technician and save the assignment.
3. Choose Start Work. The database records the first response.
4. Confirm the issue is fixed and choose Resolve Issue. Resolution timing is recorded automatically.
5. Open Weekly Status. Open issues carry forward; resolved issues appear in the week of resolution. Weeks use Asia/Kuala_Lumpur time, Monday through Sunday.

Priority follows `docs/INTELLIGENCE_LAYER.md`: scores 0–30 are low, 31–60 medium, 61–80 high, and 81+ critical. A fire-alarm score of 40 is therefore medium; the conflicting assertion in the original test plan is superseded by the explicit rule table. Assignment and Start Work are separate steps, as specified in the manual success scenario.

## Deploy

Public shared demo: https://building-mms.vercel.app. The GitHub integration is connected; pushes to `main` publish production updates.

Commit and push to `main`; Vercel deploys through its GitHub integration. The Vercel GitHub application must have repository access and the project must be connected to `jhacheo/building-mms`. Do not deploy local files with the Vercel CLI. The commit identity is pinned to jhacheo's GitHub noreply email.

## v1 boundary

This is the shared public demo specified by the PRD. Use demo data. Sprint 4 (authentication, roles and owner isolation) remains the later lock-down phase and must precede private production data.
