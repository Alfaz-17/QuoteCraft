import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/clerk-auth";
import { findUserApiKey } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { xlsxToText, parseExcelDeterministically, XLSX_MIME } from "@/lib/rfq-parser";
import { z } from "zod";

const aiOutputSchema = z.object({
  columns: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      kind: z.string().optional(),
    })
  ),
  rows: z.array(z.record(z.string(), z.any())),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
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
        { error: `Too many import requests. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.` },
        { status: 429 }
      );
    }

    let userApiKey = "";
    userApiKey = (await findUserApiKey(userId)) ?? "";

    // 1. Parse input payload
    const { fileData, fileName, mimeType, rawText } = await req.json();

    // Prevent handling excessively large files (approx 10MB raw file in base64 is ~13.5MB)
    if (fileData && fileData.length > 14 * 1024 * 1024) {
      return NextResponse.json(
        { error: "The uploaded file exceeds 10MB. Please upload a smaller file, or copy-paste the raw RFQ text directly." },
        { status: 400 }
      );
    }

    const isExcel =
      mimeType === XLSX_MIME ||
      /\.(xlsx|xls)$/i.test(fileName || "");

    // 2. LAYER A: DETERMINISTIC EXCEL EXTRACTION (Zero LLM cost, instant, 100% deterministic)
    if (fileData && isExcel) {
      try {
        const base64Data = fileData.split(",")[1] || fileData;
        const buffer = Buffer.from(base64Data, "base64");
        const deterministicResult = await parseExcelDeterministically(buffer);

        if (deterministicResult && deterministicResult.rows.length > 0) {
          return NextResponse.json({
            columns: deterministicResult.columns,
            rows: deterministicResult.rows,
            method: "deterministic_excel",
            durationMs: deterministicResult.durationMs,
            uncertainCount: deterministicResult.uncertainCount,
            sheetName: deterministicResult.sheetName,
          });
        }
      } catch (detErr) {
        console.warn("Deterministic Excel parse skipped to fallback:", detErr);
      }
    }

    // 3. LAYER B: AI FALLBACK (Requires Gemini API Key)
    const apiKey = userApiKey || process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "This document requires AI document intelligence. Please configure your Gemini API Key in Settings.",
        },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 32000 },
    });

    const systemPrompt = `
      You are an expert B2B marine and industrial procurement assistant.
      The input is a buyer's RFQ (PDF, image, spreadsheet text or pasted text).
      Reproduce the buyer's OWN table structure so a supplier can price it.

      1. Detect the item table and list its columns in the SAME order and with the SAME header
         wording as the document (e.g. "Maker", "Drawing No.", "Remarks", "Delivery Port").
         Give each column a short key: "c1", "c2", ...
      2. Classify each column with a "kind":
         serial (Sr/S.No/#), name (short item title), description (specs, size, long text),
         partNumber (part no / drawing no / article no / IMPA / ISSA code), qty (quantity requested),
         unit (UOM), price (rate / unit price - only if the buyer provided a column for it),
         total (line amount), number (any other numeric column), text (any other column).
         Use each kind at most once, except "text" and "number".
      3. Return every item row as an object keyed by those column keys. Keep values exactly as written.
         Use "" when a cell is empty. Do NOT invent prices, part numbers or quantities.
      4. Ignore header blocks, vessel details, notes and footers - only the item table.
         If section/sub-heading rows appear inside the table, skip them.

      Return ONLY JSON in this shape:
      {"columns":[{"key":"c1","label":"Sr No","kind":"serial"}],"rows":[{"c1":"1"}]}
    `;

    const startTime = Date.now();
    let result;
    const isCsv = mimeType === "text/csv" || /\.csv$/i.test(fileName || "");

    if (fileData && isExcel) {
      const base64Data = fileData.split(",")[1] || fileData;
      const sheetText = await xlsxToText(Buffer.from(base64Data, "base64"));
      if (!sheetText.trim()) {
        return NextResponse.json({ error: "The Excel file looks empty." }, { status: 400 });
      }
      result = await model.generateContent(`${systemPrompt}\n\nInput RFQ spreadsheet (first number on each line is the Excel row):\n${sheetText}`);
    } else if (fileData && isCsv) {
      const base64Data = fileData.split(",")[1] || fileData;
      const csvText = Buffer.from(base64Data, "base64").toString("utf-8");
      result = await model.generateContent(`${systemPrompt}\n\nInput RFQ (CSV):\n${csvText}`);
    } else if (fileData && mimeType) {
      // Multimodal import (file)
      const base64Data = fileData.split(",")[1] || fileData;
      result = await model.generateContent([
        systemPrompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
      ]);
    } else if (rawText) {
      // Text paste import
      result = await model.generateContent(`${systemPrompt}\n\nInput RFQ text:\n${rawText}`);
    } else {
      return NextResponse.json({ error: "No input file or text provided" }, { status: 400 });
    }

    const responseText = await result.response.text();

    // Clean potential markdown wrapped blocks
    let cleanedJson = responseText.trim();
    if (cleanedJson.startsWith("```")) {
      cleanedJson = cleanedJson.replace(/^```(json)?/, "").replace(/```$/, "").trim();
    }

    try {
      const parsed = JSON.parse(cleanedJson);
      const validated = aiOutputSchema.parse(parsed);

      return NextResponse.json({
        columns: validated.columns,
        rows: validated.rows,
        method: "ai_fallback",
        durationMs: Date.now() - startTime,
      });
    } catch {
      console.error("AI returned malformed JSON or invalid schema:", responseText);
      return NextResponse.json(
        { error: "AI failed to extract line items in a structured format. Please try copy-pasting the raw text." },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Import RFQ Error:", error);

    const errMsg = (error as Error)?.message || String(error);
    let friendlyMessage = "An unexpected error occurred during document analysis. Please try again.";

    if (
      errMsg.includes("API key not valid") || 
      errMsg.includes("API_KEY_INVALID") || 
      errMsg.includes("key is invalid") ||
      errMsg.includes("invalid key")
    ) {
      friendlyMessage = "Your Gemini API Key is invalid or expired. Please check your key in Settings.";
    } else if (
      errMsg.includes("quota") || 
      errMsg.includes("quota exceeded") || 
      errMsg.includes("RESOURCE_EXHAUSTED") || 
      errMsg.includes("429")
    ) {
      friendlyMessage = "Gemini AI API rate limit exceeded. Please wait a minute before trying again.";
    } else if (
      errMsg.includes("fetch failed") || 
      errMsg.includes("network") || 
      errMsg.includes("ENOTFOUND") || 
      errMsg.includes("connect") ||
      errMsg.includes("offline")
    ) {
      friendlyMessage = "Network error: Unable to connect to Gemini API. Please check your connection.";
    }

    return NextResponse.json({ error: friendlyMessage }, { status: 500 });
  }
}
