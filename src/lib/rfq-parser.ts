import ExcelJS from "exceljs";
import { ImportResult, ImportedColumn, ImportKind } from "@/utils/importMapping";

export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export interface DeterministicParseResult extends ImportResult {
  method: "deterministic_excel" | "ai_fallback";
  durationMs: number;
  uncertainCount: number;
  sheetName?: string;
  rfqDetails?: {
    vesselName?: string;
    customerName?: string;
    rfqNumber?: string;
    date?: string;
  };
}

/** Header matching patterns */
const PATTERNS: Record<ImportKind, RegExp[]> = {
  serial: [/^(s\.?\s*no|sr\.?\s*no|#|item\s*no|sl\s*no)$/i],
  name: [
    /^(item(\s*name)?|description|item\s*desc|particulars|material|scope(\s*of\s*supply)?)$/i,
    /description/i,
    /item/i,
  ],
  description: [/^(specification|spec|detailed\s*desc|remarks|dimension|size)$/i],
  partNumber: [
    /^(part\s*(no|number|#)?|drawing\s*(no|#)?|dwg\s*no|article\s*no|impa(\s*code)?|issa(\s*code)?|pos(\s*no)?)$/i,
    /part\s*no/i,
    /drawing/i,
  ],
  qty: [/^(qty|quantity|qnty|req(\.|\s*qty)?|required\s*qty)$/i, /qty/i, /quantity/i],
  unit: [/^(uom|unit|unit\s*of\s*(measure|measurement)|pkg)$/i, /unit/i],
  price: [/^(rate|unit\s*price|price|cost|unit\s*rate)$/i, /price/i, /rate/i],
  total: [/^(total|line\s*total|amount|ext\s*price)$/i, /total/i],
  text: [],
  number: [],
};

function classifyHeader(text: string): ImportKind {
  const clean = text.trim();
  for (const [kind, regexes] of Object.entries(PATTERNS)) {
    if (kind === "text" || kind === "number") continue;
    for (const rx of regexes) {
      if (rx.test(clean)) {
        return kind as ImportKind;
      }
    }
  }
  return "text";
}

/**
 * Deterministically parses an Excel workbook buffer into columns and rows without calling an LLM.
 * Returns null if no suitable header row or items could be identified with confidence.
 */
export async function parseExcelDeterministically(
  buffer: Buffer
): Promise<DeterministicParseResult | null> {
  const startTime = Date.now();
  try {
    const wb = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await wb.xlsx.load(buffer as any);

    // Find the sheet with the most rows
    let bestSheet: ExcelJS.Worksheet | null = null;
    let maxRows = 0;

    wb.eachSheet((ws) => {
      if (ws.rowCount > maxRows) {
        maxRows = ws.rowCount;
        bestSheet = ws;
      }
    });

    if (!bestSheet || maxRows < 2) {
      return null;
    }

    const ws = bestSheet as ExcelJS.Worksheet;

    // Scan the first 15 rows to find the table header row
    let headerRowNumber = -1;
    let detectedColumns: { colIndex: number; label: string; kind: ImportKind }[] = [];

    for (let r = 1; r <= Math.min(15, ws.rowCount); r++) {
      const row = ws.getRow(r);
      const candidates: { colIndex: number; label: string; kind: ImportKind }[] = [];

      for (let c = 1; c <= Math.min(row.cellCount, 25); c++) {
        const val = row.getCell(c).text;
        if (val && typeof val === "string" && val.trim().length > 0) {
          const kind = classifyHeader(val.trim());
          candidates.push({ colIndex: c, label: val.trim(), kind });
        }
      }

      // Check if this row looks like a header (contains at least name/desc or partNumber, plus qty or serial)
      const hasName = candidates.some((c) => c.kind === "name" || c.kind === "description");
      const hasPartOrQty = candidates.some((c) => c.kind === "partNumber" || c.kind === "qty" || c.kind === "serial");

      if (hasName && hasPartOrQty && candidates.length >= 2) {
        headerRowNumber = r;
        detectedColumns = candidates;
        break;
      }
    }

    if (headerRowNumber === -1 || detectedColumns.length < 2) {
      return null;
    }

    // Scan top rows for vessel, buyer, or RFQ reference details
    const rfqDetails: { vesselName?: string; customerName?: string; rfqNumber?: string; date?: string } = {};
    for (let r = 1; r < headerRowNumber; r++) {
      const row = ws.getRow(r);
      for (let c = 1; c <= Math.min(row.cellCount, 15); c++) {
        const val = row.getCell(c).text?.trim();
        if (!val) continue;

        const vesselMatch = val.match(/(?:vessel(?:\s*name)?|ship)\s*[:\-]\s*(.+)/i) || val.match(/^(?:m\/?v|mt|mv)\s+([a-z0-9\s\.\-_]+)/i);
        if (vesselMatch && !rfqDetails.vesselName) {
          rfqDetails.vesselName = (vesselMatch[1] || val).trim();
        }

        const clientMatch = val.match(/(?:buyer|customer|client|company|purchaser)\s*[:\-]\s*(.+)/i);
        if (clientMatch && !rfqDetails.customerName) {
          rfqDetails.customerName = clientMatch[1].trim();
        }

        const rfqMatch = val.match(/(?:rfq|enquiry|inquiry|requisition|req)\s*(?:no|number|#)?\s*[:\-]\s*(.+)/i);
        if (rfqMatch && !rfqDetails.rfqNumber) {
          rfqDetails.rfqNumber = rfqMatch[1].trim();
        }
      }
    }

    // Build columns for ImportResult
    const columns: ImportedColumn[] = detectedColumns.map((c, i) => ({
      key: `c${i + 1}`,
      label: c.label,
      kind: c.kind,
    }));

    // Extract data rows
    const rows: Record<string, unknown>[] = [];
    let uncertainCount = 0;

    for (let r = headerRowNumber + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      // Check if row has any content
      let hasData = false;
      const rowObj: Record<string, unknown> = {};

      detectedColumns.forEach((col, idx) => {
        const cell = row.getCell(col.colIndex);
        let cellVal: string | number = "";

        if (cell.type === ExcelJS.ValueType.Number) {
          cellVal = Number(cell.value);
        } else if (cell.text !== undefined && cell.text !== null) {
          cellVal = cell.text.trim();
        }

        rowObj[`c${idx + 1}`] = cellVal;
        if (cellVal !== "" && cellVal !== null && cellVal !== undefined) {
          hasData = true;
        }
      });

      if (!hasData) continue;

      // Check for section headings or total rows to ignore
      const firstColText = String(rowObj["c1"] || "").toLowerCase();
      if (firstColText.includes("total") || firstColText.includes("subtotal") || firstColText.includes("terms")) {
        continue;
      }

      // Check for missing values (Rule 8: Never silently convert missing quantity to 1)
      const qtyCol = columns.find((c) => c.kind === "qty");
      if (qtyCol) {
        const qVal = rowObj[qtyCol.key];
        if (qVal === "" || qVal === null || qVal === undefined || Number(qVal) <= 0) {
          uncertainCount++;
        }
      }

      rows.push(rowObj);
    }

    if (rows.length === 0) {
      return null;
    }

    return {
      columns,
      rows,
      method: "deterministic_excel",
      durationMs: Date.now() - startTime,
      uncertainCount,
      sheetName: ws.name,
      rfqDetails,
    };
  } catch (err) {
    console.error("Deterministic Excel parse error:", err);
    return null;
  }
}

/** Reads an .xlsx buffer and returns tab-separated text (all sheets that have data). */
export async function xlsxToText(buffer: Buffer): Promise<string> {
  const wb = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await wb.xlsx.load(buffer as any);
  const parts: string[] = [];
  wb.eachSheet((ws) => {
    const lines: string[] = [];
    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const cells: string[] = [];
      for (let c = 1; c <= row.cellCount; c++) {
        const t = row.getCell(c).text ?? "";
        cells.push(String(t).replace(/\s+/g, " ").trim());
      }
      if (cells.some(Boolean)) lines.push(`${rowNumber}\t${cells.join("\t")}`);
    });
    if (lines.length) parts.push(`## Sheet: ${ws.name}\n${lines.join("\n")}`);
  });
  return parts.join("\n\n");
}
