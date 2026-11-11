import ExcelJS from "exceljs";
import { extractText } from "unpdf";
import { ImportResult, ImportedColumn, ImportKind } from "@/utils/importMapping";

export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export interface DeterministicParseResult extends ImportResult {
  method: "deterministic_excel" | "deterministic_pdf" | "ai_fallback";
  durationMs: number;
  uncertainCount: number;
  sheetName?: string;
  extractedText?: string;
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
 * Safely extracts plain text from an ExcelJS cell without throwing null / formula errors.
 */
export function getCellSafeText(cell: ExcelJS.Cell | undefined): string {
  if (!cell) return "";
  try {
    if (cell.value === null || cell.value === undefined) return "";
    if (typeof cell.value === "string") return cell.value.trim();
    if (typeof cell.value === "number") return String(cell.value);
    if (typeof cell.value === "boolean") return String(cell.value);
    if (cell.value instanceof Date) return cell.value.toISOString().split("T")[0];
    if (typeof cell.value === "object") {
      const v = cell.value as unknown as Record<string, unknown>;
      if (v.result !== undefined && v.result !== null) return String(v.result).trim();
      if (Array.isArray(v.richText)) {
        return (v.richText as Array<{ text?: string }>).map((r) => r.text || "").join("").trim();
      }
      if (v.text) return String(v.text).trim();
    }
    return cell.text ? String(cell.text).trim() : "";
  } catch {
    return "";
  }
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
        const val = getCellSafeText(row.getCell(c));
        if (val && val.length > 0) {
          const kind = classifyHeader(val);
          candidates.push({ colIndex: c, label: val, kind });
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
        const val = getCellSafeText(row.getCell(c));
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

        if (cell.type === ExcelJS.ValueType.Number && typeof cell.value === "number") {
          cellVal = Number(cell.value);
        } else {
          cellVal = getCellSafeText(cell);
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
      sheetName: ws.name || "Sheet1",
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
  let totalChars = 0;
  const MAX_TEXT_CHARS = 18_000;

  const sheets: ExcelJS.Worksheet[] = [];
  wb.eachSheet((ws) => {
    if (ws && ws.rowCount > 0) sheets.push(ws);
  });
  sheets.sort((a, b) => (b.rowCount || 0) - (a.rowCount || 0));

  for (const ws of sheets) {
    if (totalChars >= MAX_TEXT_CHARS) break;
    const lines: string[] = [];
    const sheetName = ws.name || "Sheet";
    const maxRow = Math.min(ws.rowCount || 0, 80);

    for (let r = 1; r <= maxRow; r++) {
      if (totalChars >= MAX_TEXT_CHARS) break;
      const row = ws.getRow(r);
      const cells: string[] = [];
      const maxCol = Math.min(row.cellCount || 0, 20);
      for (let c = 1; c <= maxCol; c++) {
        const t = getCellSafeText(row.getCell(c));
        cells.push(t.replace(/\s+/g, " "));
      }
      if (cells.some(Boolean)) {
        const line = `${r}\t${cells.join("\t")}`;
        lines.push(line);
        totalChars += line.length + 1;
      }
    }
    if (lines.length) parts.push(`## Sheet: ${sheetName}\n${lines.join("\n")}`);
  }
  return parts.join("\n\n");
}

/**
 * Extracts raw selectable text stream from a digital PDF buffer using unpdf.
 * Detects if the PDF is scanned (contains no text stream).
 */
export async function extractPdfText(
  buffer: Buffer
): Promise<{ text: string; totalPages: number; isScanned: boolean }> {
  try {
    const uint8 = new Uint8Array(buffer);
    const result = await extractText(uint8);
    const rawText = Array.isArray(result.text) ? result.text.join("\n") : String(result.text || "");
    const cleanText = rawText.replace(/\r\n/g, "\n").trim();
    // A scanned PDF with only image pages typically has < 30 alphanumeric characters
    const alphanumericCount = (cleanText.match(/[a-zA-Z0-9]/g) || []).length;
    const isScanned = alphanumericCount < 30;

    return {
      text: cleanText,
      totalPages: result.totalPages || 1,
      isScanned,
    };
  } catch (err) {
    console.warn("PDF text extraction error:", err);
    return { text: "", totalPages: 1, isScanned: true };
  }
}

/**
 * Deterministically parses a digital PDF into columns and rows without calling an LLM.
 * Returns null if the PDF is scanned or if no clear table layout can be determined.
 */
export async function parsePdfDeterministically(
  buffer: Buffer
): Promise<DeterministicParseResult | null> {
  const startTime = Date.now();
  try {
    const { text: fullText, isScanned } = await extractPdfText(buffer);
    if (isScanned || !fullText || fullText.length < 40) {
      return null;
    }

    const lines = fullText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 3) {
      return null;
    }

    // 1. Scan header lines for vessel, customer, RFQ ref, date
    const rfqDetails: { vesselName?: string; customerName?: string; rfqNumber?: string; date?: string } = {};
    for (let i = 0; i < Math.min(25, lines.length); i++) {
      const line = lines[i];
      const vesselMatch =
        line.match(/(?:vessel(?:\s*name)?|ship)\s*[:\-]\s*(.+)/i) ||
        line.match(/^(?:m\/?v|mt|mv)\s+([a-z0-9\s\.\-_]+)/i);
      if (vesselMatch && !rfqDetails.vesselName) {
        rfqDetails.vesselName = (vesselMatch[1] || line).trim();
      }

      const clientMatch = line.match(/(?:buyer|customer|client|company|purchaser|to)\s*[:\-]\s*(.+)/i);
      if (clientMatch && !rfqDetails.customerName) {
        rfqDetails.customerName = clientMatch[1].trim();
      }

      const rfqMatch = line.match(/(?:rfq|enquiry|inquiry|requisition|quote\s*ref)\s*(?:no|number|#)?\s*[:\-]\s*(.+)/i);
      if (rfqMatch && !rfqDetails.rfqNumber) {
        rfqDetails.rfqNumber = rfqMatch[1].trim();
      }

      const dateMatch = line.match(/(?:date)\s*[:\-]\s*(\d{1,4}[-/\.]\d{1,2}[-/\.]\d{1,4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i);
      if (dateMatch && !rfqDetails.date) {
        rfqDetails.date = dateMatch[1].trim();
      }
    }

    // 2. Identify delimiter and Table Header Line
    let headerLineIndex = -1;
    let detectedDelimiter: RegExp | string = /\t+/;
    let detectedHeaders: { label: string; kind: ImportKind }[] = [];

    const delimiters: (RegExp | string)[] = [/\t+/, /\s*\|\s*/, /\s*;\s*/, /\s{2,}/];

    for (let i = 0; i < Math.min(30, lines.length); i++) {
      const line = lines[i];

      for (const delim of delimiters) {
        const tokens = line.split(delim).map((t) => t.trim()).filter(Boolean);
        if (tokens.length >= 2) {
          const classified = tokens.map((t) => ({ label: t, kind: classifyHeader(t) }));
          const hasName = classified.some((c) => c.kind === "name" || c.kind === "description");
          const hasPartOrQty = classified.some(
            (c) => c.kind === "partNumber" || c.kind === "qty" || c.kind === "serial"
          );

          if (hasName && hasPartOrQty) {
            headerLineIndex = i;
            detectedDelimiter = delim;
            detectedHeaders = classified;
            break;
          }
        }
      }
      if (headerLineIndex !== -1) break;
    }

    // If no clear table headers found with certainty, return null to fall back to Gemini
    if (headerLineIndex === -1 || detectedHeaders.length < 2) {
      return null;
    }

    // Build columns
    const columns: ImportedColumn[] = detectedHeaders.map((h, idx) => ({
      key: `c${idx + 1}`,
      label: h.label,
      kind: h.kind,
    }));

    // 3. Parse Data Rows
    const rows: Record<string, unknown>[] = [];
    let uncertainCount = 0;

    for (let i = headerLineIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      const lower = line.toLowerCase();
      if (
        lower.startsWith("total") ||
        lower.startsWith("grand total") ||
        lower.startsWith("terms &") ||
        lower.startsWith("terms and") ||
        lower.startsWith("authorized signature") ||
        lower.startsWith("payment terms")
      ) {
        break;
      }

      const tokens = line.split(detectedDelimiter).map((t) => t.trim()).filter((t) => t !== "");
      if (tokens.length === 0) continue;

      const rowObj: Record<string, unknown> = {};
      let hasData = false;

      columns.forEach((col, cIdx) => {
        const val = tokens[cIdx] ?? "";
        rowObj[col.key] = val;
        if (val) hasData = true;
      });

      if (!hasData) continue;

      const qtyCol = columns.find((c) => c.kind === "qty");
      if (qtyCol) {
        const qVal = rowObj[qtyCol.key];
        if (!qVal || Number(qVal) <= 0) {
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
      method: "deterministic_pdf",
      durationMs: Date.now() - startTime,
      uncertainCount,
      rfqDetails,
      extractedText: fullText,
    };
  } catch (err) {
    console.error("Deterministic PDF parse error:", err);
    return null;
  }
}
