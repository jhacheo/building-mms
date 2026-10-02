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
