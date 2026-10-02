"use server";
import { revalidatePath } from "next/cache";
import { saveWorkOrder, deleteWorkOrder } from "@/lib/data/work-orders";
import { saveProperty, deleteProperty } from "@/lib/data/properties";
import { saveAsset, deleteAsset } from "@/lib/data/assets";
const text = (f: FormData, k: string, required = false) => {
  const v = String(f.get(k) || "").trim();
  if (required && !v) throw new Error(`${k.replaceAll("_", " ")} is required.`);
  if (v.length > 4000)
    throw new Error("Please keep text under 4,000 characters.");
  return v || null;
};
const uuid = (v: string | null) => {
  if (
    v &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v,
    )
  )
    throw new Error("Invalid record identifier.");
  return v;
};
export async function mutate(
  kind: string,
  f: FormData,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const id = uuid(text(f, "id")),
      actor = text(f, "actor") || "Demo manager";
    if (kind.startsWith("delete-")) {
      if (!id) throw new Error("Record is required.");
      if (f.get("confirmed") !== "yes")
        throw new Error("Confirm deletion first.");
      if (kind === "delete-property") await deleteProperty(id);
      else if (kind === "delete-asset") await deleteAsset(id);
      else if (kind === "delete-order") await deleteWorkOrder(id, actor);
      else throw new Error("Unknown action.");
    } else if (kind === "property") {
      const floors = Number(f.get("floors")),
        units = Number(f.get("units"));
      if (
        !Number.isInteger(floors) ||
        floors < 1 ||
        !Number.isInteger(units) ||
        units < 1
      )
        throw new Error("Floors and units must be positive whole numbers.");
      await saveProperty(id, {
        name: text(f, "name", true),
        address: text(f, "address"),
        floors,
        units,
      });
    } else if (kind === "asset") {
      const type = text(f, "type", true);
      if (
        ![
          "HVAC",
          "lift",
          "fire_alarm",
          "electrical_panel",
          "water_system",
        ].includes(type!)
      )
        throw new Error("Choose a supported asset type.");
      const v: Record<string, unknown> = {
        name: text(f, "name", true),
        property_id: uuid(text(f, "property_id", true)),
        type,
      };
      for (const k of [
        "model_number",
        "serial_number",
        "location_floor",
        "location_unit",
      ])
        v[k] = text(f, k);
      for (const k of ["purchase_date", "install_date", "warranty_expiry"]) {
        const d = text(f, k);
        if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d))
          throw new Error("Invalid date.");
        v[k] = d;
      }
      await saveAsset(id, v);
    } else if (kind === "order")
      await saveWorkOrder(
        id,
        {
          title: text(f, "title", true),
          description: text(f, "description"),
          property_id: uuid(text(f, "property_id", true)),
          asset_id: uuid(text(f, "asset_id")),
          reported_by_name: text(f, "reported_by_name", true),
        },
        actor,
      );
    else if (["assign", "start", "resolve"].includes(kind)) {
      if (!id) throw new Error("Work order is required.");
      const v: Record<string, unknown> = {};
      if (kind === "assign")
        v.assigned_to_name = text(f, "assigned_to_name", true);
      if (kind === "start") v.status = "wip";
      if (kind === "resolve") {
        if (f.get("confirmed") !== "yes")
          throw new Error("Confirm that the issue is resolved.");
        v.status = "resolved";
      }
      await saveWorkOrder(id, v, actor);
    } else throw new Error("Unknown action.");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not save. Check connection.",
    };
  }
}
