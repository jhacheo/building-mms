# Data Model

## properties
| Field | Type |
------|------|
| id | uuid PK |
| name | text not null |
| address | text |
| floors | int default 1 |
| units | int default 1 |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## assets
| Field | Type |
|------|------|
| id | uuid PK |
| property_id | uuid → properties.id |
| name | text not null |
| type | text (HVAC, lift, fire_alarm, electrical_panel, water_system) |
| model_number | text |
| serial_number | text |
| purchase_date | date |
| install_date | date |
| warranty_expiry | date |
| location_floor | text |
| location_unit | text |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## work_orders
| Field | Type |
|------|------|
| id | uuid PK |
| title | text not null |
| description | text |
| status | text not null default 'pending' (pending/wip/resolved) |
| priority | text default 'medium' (low/medium/high/critical) |
| priority_score | numeric (AI field — source='rule_engine', confidence=1.0, review_status='unreviewed') |
| priority_source | text |
| priority_confidence | numeric |
| priority_review_status | text default 'unreviewed' |
| property_id | uuid → properties.id |
| asset_id | uuid nullable → assets.id |
| reported_by_name | text |
| assigned_to_name | text |
| created_at | timestamptz default now() |
| responded_at | timestamptz nullable |
| resolved_at | timestamptz nullable |
| response_time_hours | numeric nullable (derived: responded_at - created_at) |
| resolution_time_hours | numeric nullable (derived: resolved_at - created_at) |
| user_id | uuid nullable |

**Constraint:** status ∈ {pending, wip, resolved}. responded_at set when status first → wip. resolved_at set when status → resolved. Times calculated server-side on transition.

## RLS (v1 — permissive)
All tables: public read/write for demo. Lock-down sprint replaces with `auth.uid() = user_id`.

## Multi-tenant release

The organization is the data boundary. A user can belong to several organizations with a different role in each; `user_id` ownership alone is insufficient for shared maintenance teams.

| Table | Organization fields and constraints |
|---|---|
| tenants | UUID `id`, `name`, `created_by` referencing Auth, creation time |
| tenant_members | Composite key `(tenant_id, user_id)`, role, display name; membership and roles managed by authorized RPCs |
| properties | Required `tenant_id`, unique `(id, tenant_id)` |
| assets | Required `tenant_id`; composite `(property_id, tenant_id)` reference to properties |
| work_orders | Required `tenant_id`; composite property and asset references; `reported_by` authenticated UUID; `assigned_to` references a member of the same organization |
| audit_logs | Required `tenant_id`; `actor_id` authenticated UUID; authoritative member display name |

`create_tenant(tenant_name, member_name)` creates an organization and its first administrator atomically. `add_tenant_member(target_tenant, member_email, member_role)` adds an existing email-verified account after checking that the caller is an administrator. `refresh_tenant_scores(target_tenant)` checks membership and refreshes authoritative age-based priority scores without granting arbitrary work-order mutation.

Role policies are specified in `SECURITY.md`. Every core row has an immutable organization ID. The original public-demo policy description above is historical and is superseded by this release. Existing demo rows are preserved in a legacy organization with no memberships, rather than assigned to the first person who registers.
