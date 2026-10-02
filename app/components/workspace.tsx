import { requireTenant } from "@/lib/auth/tenant";
import MaintenanceApp from "./maintenance-app";
import { listProperties } from "@/lib/data/properties";
import { listAssets } from "@/lib/data/assets";
import { listWorkOrders, listAuditLogs } from "@/lib/data/work-orders";
export default async function Workspace({ section }: { section: string }) {
  const context = await requireTenant();
  const workspace = {
    id: context.tenant.id,
    name: context.tenant.name,
    role: context.role,
    userId: context.user.id,
    email: context.user.email || "",
    members: context.members,
  };
  try {
    const [properties, assets, orders, logs] = await Promise.all([
      listProperties(),
      listAssets(),
      listWorkOrders(),
      listAuditLogs(),
    ]);
    return (
      <MaintenanceApp
        section={section}
        workspace={workspace}
        data={{ properties, assets, orders, logs }}
      />
    );
  } catch {
    return (
      <MaintenanceApp
        section={section}
        workspace={workspace}
        data={{ properties: [], assets: [], orders: [], logs: [] }}
        loadError="Could not load your maintenance records. Check your connection and retry."
      />
    );
  }
}
