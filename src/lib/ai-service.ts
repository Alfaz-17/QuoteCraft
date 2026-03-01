import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export const aiModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export async function analyzeLogoColors(imageBase64: string) {
  const prompt = `
    Analyze this company logo image carefully and extract the EXACT dominant colors visible in the logo.
    
    Rules:
    - Extract the ACTUAL colors from the logo, do NOT invent or suggest different colors.
    - "primary" should be the most dominant/prominent color in the logo.
    - "secondary" should be the second most prominent color in the logo.
    - "textColor" should be a dark color suitable for body text that complements the logo palette. Pick a dark shade from the logo if available, otherwise use a dark neutral.
    - If the logo only has one color, use a slightly lighter or darker shade as secondary.
    - Return ONLY a valid JSON object with three fields: "primary", "secondary", and "textColor".
    - All values must be hex color codes (e.g., "#2563EB").
    - Do NOT add any text, explanation, or markdown — just the raw JSON object.
  `;

  try {
    const result = await aiModel.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64.split(",")[1],
          mimeType: "image/png", // Adjust if needed
        },
      },
    ]);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { primary: "#2563eb", secondary: "#64748b", textColor: "#1e293b" };
  } catch (error) {
    console.error("AI Logo Analysis Error:", error);
    return { primary: "#2563eb", secondary: "#64748b", textColor: "#1e293b" };
  }
}

export async function polishItemDescription(description: string) {
  const prompt = `
    You are a marine spare parts expert.
    Polish the following item description to sound professional and technically accurate for a marine RFQ.
    Maintain a professional industry tone.
    Do NOT invent or change part numbers.
    Keep it concise.
    
    Original description: "${description}"
    
    Polished description:
  `;

  try {
    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("AI Description Polish Error:", error);
    return description;
  }
}

export async function generateCommercialTerms(items: string) {
  const prompt = `
    You are a senior marine supply manager.
    Based on these items: [${items}], generate 5 professional commercial terms.
    Include:
    1. Realistic delivery time (e.g. 3-7 days or 4 weeks for European origins)
    2. Country of origin (likely for marine parts)
    3. Condition (OEM / Genuine / Replacement)
    4. Warranty period
    5. Shipping/Payment terms typical for the industry (Incoterms like EXW/FOB/CIF)
    
    Return as a numbered list.
    Keep it professional and marine-standard.
  `;

  try {
    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("AI Terms Generation Error:", error);
    return "";
  }
}
