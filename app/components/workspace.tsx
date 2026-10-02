import MaintenanceApp from "./maintenance-app";
import { listProperties } from "@/lib/data/properties";
import { listAssets } from "@/lib/data/assets";
import { listWorkOrders, listAuditLogs } from "@/lib/data/work-orders";
export default async function Workspace({ section }: { section: string }) {
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
        data={{ properties, assets, orders, logs }}
      />
    );
  } catch {
    return (
      <MaintenanceApp
        section={section}
        data={{ properties: [], assets: [], orders: [], logs: [] }}
        loadError="Could not load your maintenance records. Check your connection and retry."
      />
    );
  }
}
