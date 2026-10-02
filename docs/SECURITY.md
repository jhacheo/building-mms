# Security

## Secret Handling
- Supabase service key server-side only (server actions, route handlers)
- Anon key in frontend (public, safe for RLS-protected reads)
- No secrets in client bundles; no `.env` exposure

## Permission Model (v1 demo → lock-down)
- **v1:** All tables public read/write (permissive RLS) — demo works without login
- **Lock-down sprint:** Replace permissive policies with owner-scoped: `auth.uid() = user_id`
- **Roles (post lock-down):** building_manager, technician, inspection_manager, asset_manager — role stored in profiles table, checked server-side

## Approved-Tools Rule
- Agent can only call explicitly named server actions (score_work_order, calculate_times, assign_work_order, generate_weekly_summary)
- No raw SQL execution from client; all writes via `lib/data/` functions
- No generic "run_any" or "send_any" tools

## Audit Principle
Every status change, assignment, and resolution writes to `audit_logs`. Audit log is append-only (no update/delete). Reviewable by asset managers.
