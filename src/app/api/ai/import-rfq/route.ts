import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/clerk-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAiUsage, trackPlatformEvent } from "@/lib/admin-auth";
import { checkDailyAiQuota, getAiEngineControls } from "@/lib/ai-quota";
import {
  extractRfqWithGroq,
  AiOutputData,
  DEFAULT_GROQ_MODEL,
  GROQ_VISION_MODEL,
} from "@/lib/groq";
import {
  xlsxToText,
  parseExcelDeterministically,
  extractPdfText,
  renderPdfPageAsImage,
  XLSX_MIME,
} from "@/lib/rfq-parser";

const SCANNED_PDF_PAGES_PER_BATCH = 2;
const MAX_SCANNED_PDF_PAGES = 6;
const MAX_VISION_IMAGE_BYTES = 18 * 1024 * 1024;
export const maxDuration = 60;

function mergeVisionPageResults(results: AiOutputData[]): AiOutputData {
  const columns: AiOutputData["columns"] = [];
  const rows: AiOutputData["rows"] = [];

  for (const result of results) {
    if (result.rows.length > 0 && result.columns.length === 0) {
      throw new Error("SCANNED_PDF_TABLE_COLUMNS_MISSING");
    }
    const keyMap = new Map<string, string>();
    const normalized = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "");

    result.columns.forEach((column, index) => {
      let target = columns.find((existing) =>
        normalized(existing.label) === normalized(column.label) &&
        (!existing.kind || !column.kind || existing.kind === column.kind)
      );
      if (!target && columns.length === result.columns.length) {
        target = columns[index];
      }
      if (!target) {
        const key = `c${columns.length + 1}`;
        target = { ...column, key };
        columns.push(target);
      }
      keyMap.set(column.key, target.key);
    });

    for (const row of result.rows) {
      const mergedRow: Record<string, unknown> = {};
      for (const [sourceKey, targetKey] of keyMap) {
        mergedRow[targetKey] = row[sourceKey] ?? "";
      }
      rows.push(mergedRow);
    }
  }

  const rfqDetails = { vesselName: "", customerName: "", rfqNumber: "", date: "" };
  for (const result of results) {
    for (const field of Object.keys(rfqDetails) as Array<keyof typeof rfqDetails>) {
      if (!rfqDetails[field] && result.rfqDetails?.[field]) {
        rfqDetails[field] = result.rfqDetails[field];
      }
    }
  }

  return { columns, rows, rfqDetails };
}

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  let fileName: string | null = null;
  let mimeType: string | null = null;

  try {
    userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to import and process RFQs." },
        { status: 401 }
      );
    }

    // Rate limiting: 15 imports per minute per user
    const rateLimit = checkRateLimit(`ai:import:${userId}`, 15, 60_000);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Too many import requests. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    // 1. Parse input payload (Supports both multipart/form-data and JSON)
    const contentType = req.headers.get("content-type") || "";
    let fileData: string | null = null;
    let rawText: string | null = null;

    // Load AI engine settings from admin controls (dynamic)
    const aiControls = await getAiEngineControls();
    const effectiveLimitMb = Math.max(aiControls.maxUploadSizeMb || 10, 35);
    const maxBytes = effectiveLimitMb * 1024 * 1024;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      rawText = (formData.get("rawText") as string) || null;

      if (file && typeof file === "object" && typeof file.arrayBuffer === "function") {
        if (file.size > maxBytes) {
          return NextResponse.json(
            {
              error: `The uploaded file (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the ${effectiveLimitMb}MB size limit. Please upload a smaller file or copy-paste the raw RFQ text.`,
            },
            { status: 413 }
          );
        }
        fileName = file.name || null;
        mimeType = file.type || null;
        const arrayBuf = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        fileData = buffer.toString("base64");
      }
    } else {
      const body = await req.json();
      fileData = body.fileData || null;
      rawText = body.rawText || null;
      fileName = body.fileName || null;
      mimeType = body.mimeType || null;

      // Base64 string payload size check (base64 ~1.37x)
      const maxBase64Length = Math.ceil(maxBytes * 1.37);
      if (fileData && typeof fileData === "string" && fileData.length > maxBase64Length) {
        return NextResponse.json(
          {
            error: `The uploaded file exceeds the ${effectiveLimitMb}MB size limit. Please upload a smaller file or copy-paste the raw RFQ text.`,
          },
          { status: 413 }
        );
      }
    }

    // Check raw text length (cap at 60,000 characters)
    if (rawText && typeof rawText === "string" && rawText.length > 60_000) {
      return NextResponse.json(
        {
          error:
            "The pasted text exceeds 60,000 characters. Please shorten the text or upload as an Excel/PDF file.",
        },
        { status: 413 }
      );
    }

    const isExcel =
      mimeType === XLSX_MIME ||
      /\.(xlsx|xls)$/i.test(fileName || "");

    const isPdf =
      mimeType === "application/pdf" ||
      /\.pdf$/i.test(fileName || "");

    const isCsv =
      mimeType === "text/csv" ||
      /\.csv$/i.test(fileName || "");

    // -------------------------------------------------------------------------
    // 2. LAYER A1: DETERMINISTIC EXCEL EXTRACTION (Zero LLM cost, instant)
    // -------------------------------------------------------------------------
    if (fileData && isExcel) {
      try {
        const base64Data = fileData.split(",")[1] || fileData;
        const buffer = Buffer.from(base64Data, "base64");
        const deterministicResult = await parseExcelDeterministically(buffer);

        if (deterministicResult && deterministicResult.rows.length > 0) {
          logAiUsage({
            userId,
            fileName,
            mimeType,
            method: "deterministic_excel",
            itemCount: deterministicResult.rows.length,
            durationMs: deterministicResult.durationMs,
            status: "SUCCESS",
          }).catch(() => {});

          trackPlatformEvent({
            userId,
            eventType: "EXTRACTION_SUCCESS",
            metadata: {
              method: "deterministic_excel",
              items: deterministicResult.rows.length,
            },
          }).catch(() => {});

          return NextResponse.json({
            columns: deterministicResult.columns,
            rows: deterministicResult.rows,
            method: "deterministic_excel",
            durationMs: deterministicResult.durationMs,
            uncertainCount: deterministicResult.uncertainCount,
            sheetName: deterministicResult.sheetName,
            rfqDetails: deterministicResult.rfqDetails,
          });
        }
      } catch (detErr) {
        console.warn("Deterministic Excel parse skipped to fallback:", detErr);
      }
    }

    // -------------------------------------------------------------------------
    // 2B. PDF TEXT EXTRACTION WITH PAGE COORDINATES
    // -------------------------------------------------------------------------
    let extractedPdfTextContent: string | null = null;
    let isScannedPdf = false;
    let scannedPdfBuffer: Buffer | null = null;
    let scannedPdfPageCount = 0;

    if (fileData && isPdf) {
      try {
        const base64Data = fileData.split(",")[1] || fileData;
        const buffer = Buffer.from(base64Data, "base64");
        scannedPdfBuffer = buffer;

        // Keep both readable text and item coordinates; whitespace-splitting PDF text
        // can move values across columns and silently corrupt extracted rows.
        const textExtract = await extractPdfText(buffer);
        scannedPdfPageCount = textExtract.totalPages;
        if (!textExtract.isScanned && textExtract.text && textExtract.text.length > 40) {
          extractedPdfTextContent = textExtract.layoutText || textExtract.text;
        } else {
          isScannedPdf = true;
        }
      } catch (pdfErr) {
        console.warn("Deterministic PDF parse skipped to fallback:", pdfErr);
        isScannedPdf = true;
      }
    }

    if (fileData && isPdf && isScannedPdf) {
      if (!aiControls.enableVisionFallback) {
        return NextResponse.json(
          { error: "Scanned-PDF OCR is disabled. Enable Vision Fallback in Admin → AI Engine settings." },
          { status: 403 }
        );
      }
      if (!scannedPdfPageCount) {
        return NextResponse.json(
          { error: "Could not read the scanned PDF pages. Try exporting or scanning the document again." },
          { status: 400 }
        );
      }
      if (scannedPdfPageCount > MAX_SCANNED_PDF_PAGES) {
        return NextResponse.json(
          { error: `Scanned-PDF OCR supports up to ${MAX_SCANNED_PDF_PAGES} pages per import. Split this PDF into smaller files and upload each part.` },
          { status: 413 }
        );
      }
    }

    // -------------------------------------------------------------------------
    // 4. LAYER B: GROQ AI FALLBACK EXTRACTION
    // -------------------------------------------------------------------------

    // A. Check Server-side Groq API Key
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        {
          error: "RFQ extraction is temporarily unavailable. Please try again later or contact support.",
        },
        { status: 503 }
      );
    }

    // B. Check daily AI quota (per-user limit set in Admin → AI engine controls)
    const quota = await checkDailyAiQuota(userId);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `Daily AI extraction limit reached (${quota.used}/${quota.limit} requests today). You can still import supported Excel files with unlimited zero-cost deterministic imports, or try again tomorrow.`,
        },
        { status: 429 }
      );
    }

    let extractionResult;

    if (fileData && isExcel) {
      // Excel AI fallback using extracted text
      const base64Data = fileData.split(",")[1] || fileData;
      const sheetText = await xlsxToText(Buffer.from(base64Data, "base64"));
      if (!sheetText.trim()) {
        return NextResponse.json(
          { error: "The Excel file looks empty." },
          { status: 400 }
        );
      }
      extractionResult = await extractRfqWithGroq({
        textInput: sheetText,
        customModel: aiControls.groqModel,
      });
    } else if (fileData && isCsv) {
      // CSV AI fallback using decoded text
      const base64Data = fileData.split(",")[1] || fileData;
      const csvText = Buffer.from(base64Data, "base64").toString("utf-8");
      if (!csvText.trim()) {
        return NextResponse.json(
          { error: "The CSV file is empty." },
          { status: 400 }
        );
      }
      extractionResult = await extractRfqWithGroq({
        textInput: csvText,
        customModel: aiControls.groqModel,
      });
    } else if (fileData && isPdf && extractedPdfTextContent) {
      // Digital PDF fallback using extracted text
      extractionResult = await extractRfqWithGroq({
        textInput: extractedPdfTextContent,
        customModel: aiControls.groqModel,
      });
    } else if (fileData && isPdf && isScannedPdf && scannedPdfBuffer) {
      const batches: AiOutputData[] = [];
      let promptTokens = 0;
      let completionTokens = 0;
      let totalTokens = 0;
      let visionDurationMs = 0;
      const pageBatchCount = Math.ceil(scannedPdfPageCount / SCANNED_PDF_PAGES_PER_BATCH);

      for (let batchIndex = 0; batchIndex < pageBatchCount; batchIndex++) {
        const firstPage = batchIndex * SCANNED_PDF_PAGES_PER_BATCH + 1;
        const lastPage = Math.min(firstPage + SCANNED_PDF_PAGES_PER_BATCH - 1, scannedPdfPageCount);
        const imageInputs = [];

        for (let pageNumber = firstPage; pageNumber <= lastPage; pageNumber++) {
          let image = await renderPdfPageAsImage(scannedPdfBuffer, pageNumber);
          let imageBytes = Buffer.from(image.base64Data, "base64").byteLength;
          if (imageBytes > MAX_VISION_IMAGE_BYTES) {
            image = await renderPdfPageAsImage(scannedPdfBuffer, pageNumber, 1.5);
            imageBytes = Buffer.from(image.base64Data, "base64").byteLength;
          }
          if (imageBytes > MAX_VISION_IMAGE_BYTES) {
            image = await renderPdfPageAsImage(scannedPdfBuffer, pageNumber, 1);
            imageBytes = Buffer.from(image.base64Data, "base64").byteLength;
          }
          if (imageBytes > MAX_VISION_IMAGE_BYTES) {
            return NextResponse.json(
              { error: `Scanned PDF page ${pageNumber} is too large to process. Upload a lower-resolution scan.` },
              { status: 413 }
            );
          }
          imageInputs.push({ ...image, pageNumber });
        }

        const knownColumns = batches.find((batch) => batch.columns.length > 0)?.columns;
        const additionalInstructions = batchIndex === 0
          ? "These are the first pages of the scanned RFQ. Extract every visible header and item row."
          : `These are pages ${firstPage}-${lastPage} of the same RFQ and may continue the previous table without repeating its header. Use these exact columns and kinds in this order: ${JSON.stringify(knownColumns)}. Continue item rows without repeating previous-page rows.`;

        const batch = await extractRfqWithGroq({
          imageInputs,
          additionalInstructions,
          customModel: GROQ_VISION_MODEL,
        });
        batches.push(batch.data);
        promptTokens += batch.usage.promptTokens;
        completionTokens += batch.usage.completionTokens;
        totalTokens += batch.usage.totalTokens;
        visionDurationMs += batch.durationMs;
      }

      const merged = mergeVisionPageResults(batches);
      extractionResult = {
        data: merged,
        model: GROQ_VISION_MODEL,
        usage: { promptTokens, completionTokens, totalTokens },
        durationMs: visionDurationMs,
      };
    } else if (fileData && mimeType && mimeType.startsWith("image/")) {
      // Check if image vision fallback is enabled by admin
      if (!aiControls.enableVisionFallback) {
        return NextResponse.json(
          {
            error:
              "Image document extraction is currently disabled by administrator. Please upload an Excel, CSV, or digital PDF.",
          },
          { status: 403 }
        );
      }
      // Supported image import using Groq vision
      const base64Data = fileData.split(",")[1] || fileData;
      extractionResult = await extractRfqWithGroq({
        imageInput: {
          mimeType,
          base64Data,
        },
        customModel: GROQ_VISION_MODEL,
      });
    } else if (rawText && typeof rawText === "string" && rawText.trim().length > 0) {
      // Raw text paste fallback
      extractionResult = await extractRfqWithGroq({
        textInput: rawText.trim(),
        customModel: aiControls.groqModel,
      });
    } else {
      return NextResponse.json(
        {
          error:
            "No supported input provided. Please upload an Excel, PDF, CSV, image file, or paste raw RFQ text.",
        },
        { status: 400 }
      );
    }

    const { data: validated, usage, model, durationMs } = extractionResult;

    // Log successful AI extraction
    logAiUsage({
      userId,
      fileName,
      mimeType,
      method: "ai_fallback",
      model: model || DEFAULT_GROQ_MODEL,
      inputTokens: usage.promptTokens,
      outputTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      itemCount: validated.rows.length,
      durationMs,
      status: "SUCCESS",
    }).catch(() => {});

    trackPlatformEvent({
      userId,
      eventType: "EXTRACTION_SUCCESS",
      metadata: {
        method: "ai_fallback",
        model,
        tokens: usage.totalTokens,
        items: validated.rows.length,
      },
    }).catch(() => {});

    // Return identical response contract expected by frontend
    return NextResponse.json({
      rfqDetails: validated.rfqDetails,
      columns: validated.columns,
      rows: validated.rows,
      method: "ai_fallback",
      durationMs,
    });
  } catch (error: unknown) {
    console.error("Import RFQ Error:", error);

    const errMsg = (error as Error)?.message || String(error);

    if (userId) {
      logAiUsage({
        userId,
        fileName,
        mimeType,
        method: "ai_fallback",
        status: "FAILED",
        errorMessage: errMsg.substring(0, 500),
      }).catch(() => {});

      trackPlatformEvent({
        userId,
        eventType: "EXTRACTION_FAIL",
        metadata: { error: errMsg.substring(0, 300) },
      }).catch(() => {});
    }

    // Determine status code and user-friendly error messages without leaking internals
    let statusCode = 500;
    let friendlyMessage =
      "An unexpected error occurred during document analysis. Please try again or copy-paste the text.";

    if (errMsg.includes("GROQ_API_KEY_MISSING") || errMsg.includes("Invalid API Key")) {
      statusCode = 503;
      friendlyMessage =
        "RFQ extraction is temporarily unavailable. Please try again later or contact support.";
    } else if (
      errMsg.includes("rate_limit_exceeded") ||
      errMsg.includes("429") ||
      errMsg.includes("ITPM") ||
      errMsg.includes("Request too large")
    ) {
      statusCode = 429;
      friendlyMessage =
        "The uploaded document is too large for the current AI token limit. Please upload a spreadsheet with fewer rows (under 80 items) or paste the requisition items directly.";
    } else if (errMsg.includes("UNSUPPORTED_IMAGE_MIME")) {
      statusCode = 400;
      friendlyMessage =
        "Unsupported image format. Please upload JPG, PNG, WEBP, or GIF files.";
    } else if (errMsg.includes("INVALID_JSON_RESPONSE") || errMsg.includes("SCHEMA_VALIDATION_FAILED")) {
      statusCode = 500;
      friendlyMessage =
        "The AI model failed to produce a valid structured table. Please verify the document layout or paste the text directly.";
    } else if (errMsg.includes("PDF_PAGE_RENDER_FAILED") || /canvas/i.test(errMsg)) {
      statusCode = 400;
      friendlyMessage =
        "Could not render this scanned PDF for OCR. Try exporting it again or upload clear page images instead.";
    } else if (errMsg.includes("EMPTY_AI_RESPONSE")) {
      statusCode = 500;
      friendlyMessage = "The AI returned an empty response. Please try again.";
    }

    return NextResponse.json({ error: friendlyMessage }, { status: statusCode });
  }
}
