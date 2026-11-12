import { LineItem, TableColumn } from "@/types/quotation.types";
import { toNumber } from "@/utils/calculations";

/** What the AI classifies each column of the buyer's document as. */
export type ImportKind =
  | "serial" | "name" | "description" | "partNumber"
  | "qty" | "unit" | "price" | "total" | "text" | "number";

export interface ImportedColumn { key: string; label: string; kind: ImportKind }
export interface ImportResult { columns: ImportedColumn[]; rows: Record<string, unknown>[] }

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "col";

const CANONICAL: Record<string, { key: string; type: TableColumn["type"]; role?: TableColumn["role"]; width?: string }> = {
  serial:      { key: "sno",        type: "auto", width: "50px" },
  name:        { key: "itemName",   type: "text" },
  description: { key: "description", type: "text" },
  partNumber:  { key: "partNumber", type: "text", width: "110px" },
  qty:         { key: "quantity",   type: "number", role: "qty", width: "70px" },
  unit:        { key: "unit",       type: "text", width: "70px" },
  price:       { key: "unitPrice",  type: "number", role: "price", width: "90px" },
  total:       { key: "total",      type: "auto", role: "total", width: "90px" },
};

/**
 * Turns the AI's raw result into table columns + line items.
 * - Keeps the buyer's own column order and labels.
 * - Standard kinds map to the canonical keys the PDF/preview already understand.
 * - Anything else becomes a custom column (text or number).
 * - Guarantees S.No, Qty, Rate and Total exist so the trader can always price the sheet.
 */
export function mapImport(result: ImportResult): { columns: TableColumn[]; items: LineItem[] } {
  const used = new Set<string>();
  const keyFor = new Map<string, string>(); // AI column key -> final column key
  const columns: TableColumn[] = [];

  // No item-name column (e.g. the RFQ only has "Description"): that column is the product name.
  const promoteDescription = !result.columns.some((c) => c.kind === "name");

  for (const c of result.columns) {
    const canon =
      c.kind === "description" && promoteDescription && !used.has("itemName")
        ? CANONICAL.name
        : CANONICAL[c.kind];
    let key = canon ? canon.key : `x_${slug(c.label)}`;
    if (used.has(key)) {
      // duplicate kind (e.g. two "description"-like columns) -> keep both as custom text
      let i = 2;
      while (used.has(`x_${slug(c.label)}_${i}`)) i++;
      key = `x_${slug(c.label)}_${i}`;
      columns.push({ id: `imp_${key}`, label: c.label, key, type: "text", visible: true });
    } else {
      columns.push({
        id: `imp_${key}`,
        label: key === "itemName" ? "Item Name" : c.label,
        key,
        type: canon ? canon.type : c.kind === "number" ? "number" : "text",
        ...(canon?.role ? { role: canon.role } : {}),
        visible: true,
        ...(canon?.width ? { width: canon.width } : {}),
      });
    }
    used.add(key);
    keyFor.set(c.key, key);
  }

  const has = (k: string) => used.has(k);
  if (!has("sno"))
    columns.unshift({ id: "imp_sno", label: "S.No", key: "sno", type: "auto", visible: true, width: "50px" });
  if (!has("quantity"))
    columns.push({ id: "imp_quantity", label: "Qty", key: "quantity", type: "number", role: "qty", visible: true, width: "70px" });
  if (!has("unitPrice"))
    columns.push({ id: "imp_unitPrice", label: "Rate", key: "unitPrice", type: "number", role: "price", visible: true, width: "90px" });
  // Total always last
  const totalIdx = columns.findIndex((c) => c.key === "total");
  if (totalIdx === -1)
    columns.push({ id: "imp_total", label: "Total", key: "total", type: "auto", role: "total", visible: true, width: "90px" });
  else columns.push(columns.splice(totalIdx, 1)[0]);

  const numberKeys = new Set(columns.filter((c) => c.type === "number").map((c) => c.key));
  const stamp = Date.now();
  const items: LineItem[] = result.rows.map((row, idx) => {
    const item: LineItem = { id: `${stamp}_${idx}`, itemName: "", quantity: 0, unit: "pcs", unitPrice: 0 };
    let hadExplicitQty = false;

    for (const c of result.columns) {
      const key = keyFor.get(c.key);
      if (!key || key === "sno" || key === "total") continue;
      const raw = row[c.key];
      if (numberKeys.has(key)) {
        const val = toNumber(raw);
        item[key] = val;
        if (key === "quantity" && raw !== "" && raw !== null && raw !== undefined) {
          hadExplicitQty = true;
        }
      } else {
        item[key] = raw === null || raw === undefined ? "" : String(raw).trim();
      }
    }

    // Rule 8 & 9: NEVER silently convert missing quantity to 1.
    // If not explicitly provided in the source file, mark as needing review.
    if (!hadExplicitQty || item.quantity <= 0) {
      item.needsReview = true;
      item.isMissingQty = true;
      // Do not silently force quantity to 1. Leave as 0 to flag review.
    }
    if (!item.unit) item.unit = "pcs";
    if (typeof item.itemName !== "string") item.itemName = "";
    if (!item.itemName) item.itemName = itemTitle(item, columns);
    return item;
  });

  return { columns, items };
}

/** Best human title for a row when there is no "name" column. */
export function itemTitle(item: LineItem, columns: TableColumn[]): string {
  if (item.itemName) return String(item.itemName);
  if (item.description) return String(item.description);
  const firstText = columns.find((c) => c.visible && c.type === "text" && item[c.key]);
  return firstText ? String(item[firstText.key]) : "";
}
