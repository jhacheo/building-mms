# Test Plan

## v1 Success Scenario (manual, mobile viewport)
1. Open app on mobile-width browser — no login screen, land on Properties
2. Navigate to Work Orders → tap "New Issue"
3. Fill: title "HVAC not cooling 3rd floor", select property, select HVAC asset, submit
4. Verify: new order appears in Work Orders list with status "pending" and priority badge
5. Tap order → assign technician "John" → tap "Start Work" → status becomes "WIP", responded_at populated
6. Tap "Resolve" → status becomes "resolved", resolved_at populated, resolution_time shown
7. Navigate to Weekly Status → verify: 1 resolved, 0 WIP, 0 pending for that property; resolution time visible
8. Verify order sorted by priority in list

## Empty States
- Delete all work orders (or fresh DB) → Work Orders screen shows "No work orders yet. Create the first issue."
- No properties → Properties screen shows "No properties yet. Add your first building."
- Weekly Status with no data → shows "No activity this week."

## Error States
- Disconnect network → attempt to create work order → error toast: "Could not save. Check connection."
- Invalid form (empty title) → submit blocked, field highlighted

## Loading States
- Initial page load → skeleton cards visible before data renders
- Status change button tap → button shows spinner until DB confirms

## Scoring Check
- Create work order with asset type = fire_alarm → verify priority_score ≥ 40, label = medium for a score of 40, following the explicit intelligence rule table
- Create with water_system + "leak" in description → verify score includes leak bonus


## Verified implementation — 2 October 2026

- Production build, strict TypeScript and ESLint pass.
- Real database lifecycle test passes, including append-only audit, invalid transitions, cross-property asset rejection, expired warranty and pending age scoring.
- 390px mobile browser: report Floor 3 HVAC issue, assign John, start, confirm resolution; Weekly Status shows the resolved issue with a 1-minute resolution.
- Mobile property and asset create/edit forms persist, including warranty dates.
- Empty filtered registry and failed linked-asset save show readable states; the failed save leaves records intact.
- Temporary integration and registry records are removed; audit entries remain append-only.
- Vercel GitHub application installed with access limited to this repository; `cjh-abc/building-mms` connected to `jhacheo/building-mms` on 2 October 2026.
- Public production release at https://building-mms.vercel.app returns the working app without authentication. Vercel build, lint and TypeScript validation pass.
- Live browser verification: reported HVAC issue WO-3E82D4, assigned John, started work and resolved it. First response and resolution were under one minute; the weekly dashboard shows the resolved record and its activity history persists.

## Multi-tenant release — acceptance checks

The former no-login demo scenario above is historical. The current workflow requires a verified user and an organization membership, retaining the same report → assign → start → resolve → weekly status job.

Database test: run `node scripts/test-tenancy.cjs`, then execute the emitted SQL in the project SQL editor or a privileged PostgreSQL connection. It is one transaction ending in `rollback`; do not remove the rollback. Any assertion failure raises `FAIL`. The test is authorization-focused rather than a replacement for browser Auth verification.

- Anonymous access to maintenance records and organization creation is denied.
- Tenant B cannot discover, update, delete or insert Tenant A's data even with a known UUID.
- Composite property and asset foreign keys reject cross-organization links.
- Reporter names and audit headers cannot impersonate another user.
- An inspection manager can report but cannot manage registries or add an administrator.
- Assignment to an outside user and start-before-assignment are rejected.
- A technician sees only assigned work and cannot edit or reassign it.
- Assigned technician starts and resolves the HVAC issue with stable, populated timings under 24 hours.
- Audit update/delete is denied; lifecycle events retain the authenticated actor.
- Asset managers can maintain registries but cannot edit work-order details.
- A user who belongs to both tenants can filter each workspace while ownership remains immutable.
- Direct membership mutation and role escalation are denied.

Browser acceptance:

1. Signed-out production requests show login, and protected route requests never render organization data.
2. Sign up and verify the account email, sign in, and create an organization. Its registry starts empty.
3. Add a second verified account by email and choose the required role. Confirm the member can sign in to the same workspace.
4. Create a property and HVAC asset; report the PRD issue as an inspector, assign as a manager, and complete it as the assigned technician.
5. Check Weekly Status and the actor names in activity history.
6. Create or join a second organization and switch between them; records and counts follow the selected workspace after refresh.
7. Sign out, refresh protected routes, and verify the session no longer grants access.

Record actual execution and deployment results below after these checks pass; do not mark planned checks as verified.

## Verified multi-tenant database and local app — 2 October 2026

- The multi-tenant migration was applied to the provisioned Supabase database through its SQL editor.
- The complete rollback SQL authorization harness passed: anonymous lockdown, cross-organization access and linkage rejection, role restrictions, audit integrity, assigned-technician lifecycle, multi-membership filtering and immutable organization ownership. All test fixtures were rolled back.
- Local production build, TypeScript and ESLint passed after the authenticated data-layer and role-aware UI integration.
- Local browser sign-in, empty-account onboarding, organization creation and property persistence were verified. Creating a second organization starts with an empty registry.
- Production release `ff1fbdb` deployed successfully. Signed-out visits redirect to login. Signed-in production requests load only the selected workspace.
- Local browser switching showed Alpha's property, an empty Beta workspace, then Alpha's original property again; signout returned to login.
- Production manager flow reported issue WO-CE9ED1, assigned a workspace member, started work and resolved it in two minutes, with authenticated audit events and weekly results.
- Custom SMTP remains disabled in Supabase. Public signup email delivery and the full multi-account browser role scenario require SMTP configuration. Production Site URL and the exact `/auth/callback` redirect are configured.

## Google signup update — 2 October 2026

This historical update offered Google signup through Supabase. It is superseded by the email/password-only update below.

- Production build, TypeScript and ESLint passed.
- Local browser signup displays Continue with Google and no password registration form.
- With the actual Supabase Google provider disabled, pressing the button displays an actionable error and remains on signup. No raw Supabase error page is shown.
- Google Cloud project Building MMS (`speedy-league-510407-t2`) was created. Provider credential setup and a real Google login remain pending; do not consider Google registration end-to-end verified until those steps pass.

## Email/password-only update — 2 October 2026

The owner chose Supabase email/password only. Google UI and its server action were removed; password registration was restored. Google provider activation was cancelled and the provider remains disabled. Production build and its TypeScript validation passed. Email confirmation remains enabled, so public confirmation delivery still requires SMTP setup. No database policies or tenancy boundaries changed.

