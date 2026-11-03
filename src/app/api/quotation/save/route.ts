import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/clerk-auth";
import {
  findQuotationByUserAndNumber,
  createQuotation,
  updateQuotation,
} from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const state = await req.json();
    const { documentInfo, company, client, items, terms, currency, discount, discountType, taxPercent, shippingCharge, introText } = state;

    if (!documentInfo?.number) {
      return NextResponse.json({ error: "Missing document number" }, { status: 400 });
    }

    const existing = await findQuotationByUserAndNumber(userId, documentInfo.number);

    const payload = {
      type: documentInfo.type || "quotation",
      date: documentInfo.date || "",
      validUntil: documentInfo.validUntil || "",
      vessel: documentInfo.vessel || "",
      reference: documentInfo.reference || "",
      scope: documentInfo.scope || "",
      make: documentInfo.make || "",
      model: documentInfo.model || "",
      introText: introText || "",
      company: company || {},
      client: client || {},
      items: Array.isArray(items) ? items : [],
      terms: terms || "",
      currency: currency || "USD",
      discount: parseFloat(discount) || 0,
      discountType: discountType || "flat",
      taxPercent: parseFloat(taxPercent) || 0,
      shippingCharge: parseFloat(shippingCharge) || 0,
    };

    let quotationId: string;
    if (existing) {
      await updateQuotation(existing.id, payload);
      quotationId = existing.id;
    } else {
      const created = await createQuotation({ userId, number: documentInfo.number, ...payload });
      quotationId = created.id;
    }

    return NextResponse.json({
      success: true,
      quotationId,
      number: documentInfo.number,
      message: "Quotation saved successfully",
    });
  } catch (error) {
    console.error("Save Quotation Error:", error);
    return NextResponse.json({ error: "Failed to save quotation" }, { status: 500 });
  }
}
