import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export const aiModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export async function analyzeLogoColors(imageBase64: string) {
  const prompt = `
    Analyze this company logo and extract the primary and secondary branding colors.
    Return ONLY a JSON object with two fields: "primary" and "secondary".
    Both should be hex codes (e.g., "#2563EB").
    Focus on colors that look professional for a marine/shipping company.
    If the logo is black and white, suggest a professional blue or navy as primary.
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
    return { primary: "#2563eb", secondary: "#64748b" };
  } catch (error) {
    console.error("AI Logo Analysis Error:", error);
    return { primary: "#2563eb", secondary: "#64748b" };
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
