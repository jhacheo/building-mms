export type Property = {
  id: string;
  name: string;
  address: string | null;
  floors: number;
  units: number;
  created_at: string;
};
export type Asset = {
  id: string;
  property_id: string;
  name: string;
  type: string;
  model_number: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  install_date: string | null;
  warranty_expiry: string | null;
  location_floor: string | null;
  location_unit: string | null;
  created_at: string;
};
export type WorkOrder = {
  id: string;
  property_id: string;
  asset_id: string | null;
  title: string;
  description: string | null;
  status: "pending" | "wip" | "resolved";
  priority: string;
  priority_score: number;
  priority_source: string;
  priority_confidence: number;
  priority_review_status: string;
  reported_by_name: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  created_at: string;
  responded_at: string | null;
  resolved_at: string | null;
  response_time_hours: number | null;
  resolution_time_hours: number | null;
};
export type AuditLog = {
  id: string;
  entity_id: string;
  action: string;
  actor_name: string;
  detail: string;
  created_at: string;
};
export type Snapshot = {
  properties: Property[];
  assets: Asset[];
  orders: WorkOrder[];
  logs: AuditLog[];
};
