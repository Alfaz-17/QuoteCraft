import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let userApiKey = "";

    // 1. If user is logged in, try to fetch their custom Gemini API Key from database
    if (session?.user) {
      const userId = (session.user as any).id; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { geminiApiKey: true }
        });
        if (user?.geminiApiKey) {
          userApiKey = user.geminiApiKey;
        }
      }
    }

    // 2. Use user key or fall back to system global key
    const apiKey = userApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API Key is not configured. Please go to Settings (AI Integration Settings) to paste a valid API key, or make sure you are signed in." },
        { status: 400 }
      );
    }

    // 3. Parse input
    const { fileData, fileName, mimeType, rawText } = await req.json();

    // Prevent handling extremely large files to protect server performance
    if (fileData && fileData.length > 5.5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "The uploaded file exceeds 4MB. Please upload a smaller file, or copy-paste the raw RFQ text directly." },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const systemPrompt = `
      You are an expert B2B marine procurement and estimation AI.
      Your task is to analyze the provided document/text and extract all line items accurately.
      
      For each item, extract the following:
      - itemName (string): A short clean title of the item (e.g. Cylinder Liner Seals, Exhaust Valve, Fuel Injector Spares).
      - description (string): Extra specifications, measurements, sizes, drawing references or technical description.
      - partNumber (string): The manufacturer part number or drawing reference if visible, otherwise "".
      - quantity (number): The quantity requested, defaulting to 1 if not found.
      - unit (string): The unit of measurement (e.g. pcs, sets, kg, ltrs, mtrs, nos, lot). Default to "pcs".
      - condition (string): The required condition if specified (e.g. New Genuine, OEM, Reconditioned), otherwise "".
      - unitPrice (number): The price per unit if visible, otherwise 0.

      Format the output as a strict, valid JSON array of objects. Do NOT include any markdown formatting like \`\`\`json or explanation text. Return only the raw JSON string.
    `;

    let result;
    if (fileData && mimeType) {
      // Multimodal import (file)
      const base64Data = fileData.split(",")[1] || fileData;
      result = await model.generateContent([
        systemPrompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        }
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
      const parsedItems = JSON.parse(cleanedJson);
      if (!Array.isArray(parsedItems)) {
        throw new Error("AI did not return a valid array");
      }
      return NextResponse.json({ items: parsedItems });
    } catch (e) {
      console.error("AI returned malformed JSON:", responseText);
      return NextResponse.json(
        { error: "AI failed to extract line items in a structured format. The document may be low quality. Please try copy-pasting the raw text." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Import RFQ Error:", error);
    
    const errMsg = error?.message || String(error);
    let friendlyMessage = "An unexpected error occurred during AI analysis. Please try again.";

    if (
      errMsg.includes("API key not valid") || 
      errMsg.includes("API_KEY_INVALID") || 
      errMsg.includes("key is invalid") ||
      errMsg.includes("invalid key")
    ) {
      friendlyMessage = "Your Gemini API Key is invalid or expired. Please check your key in Settings and ensure it is correct.";
    } else if (
      errMsg.includes("quota") || 
      errMsg.includes("quota exceeded") || 
      errMsg.includes("RESOURCE_EXHAUSTED") || 
      errMsg.includes("429")
    ) {
      friendlyMessage = "Gemini AI API rate limit or quota exceeded. Please wait a minute before trying again.";
    } else if (
      errMsg.includes("fetch failed") || 
      errMsg.includes("network") || 
      errMsg.includes("ENOTFOUND") || 
      errMsg.includes("connect") ||
      errMsg.includes("offline")
    ) {
      friendlyMessage = "Network error: Unable to connect to Gemini API. Please check your internet connection and try again.";
    } else if (
      errMsg.includes("SAFETY") || 
      errMsg.includes("blocked") || 
      errMsg.includes("safety filters") ||
      errMsg.includes("candidate")
    ) {
      friendlyMessage = "The document was blocked by Gemini safety filters. Please verify that the content contains standard marine RFQ text and try again.";
    } else if (
      errMsg.includes("model not found") || 
      errMsg.includes("404") || 
      errMsg.includes("not found")
    ) {
      friendlyMessage = "The requested AI model (gemini-2.5-flash) is currently unavailable or deprecated. Please contact support.";
    } else if (
      errMsg.includes("too large") || 
      errMsg.includes("payload") || 
      errMsg.includes("413") ||
      errMsg.includes("exceeds")
    ) {
      friendlyMessage = "The uploaded file is too large. Please upload files under 4MB, or copy-paste the text directly.";
    }

    return NextResponse.json({ error: friendlyMessage }, { status: 500 });
  }
}
