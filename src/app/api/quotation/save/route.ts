import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  findQuotationByUserAndNumber,
  createQuotation,
  updateQuotation,
} from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const userId = (session.user as any).id; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!userId) {
      return NextResponse.json({ error: "Invalid user session" }, { status: 400 });
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
      items: items || [],
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

    return NextResponse.json({ message: "Sync successful", quotationId });
  } catch (error) {
    console.error("Save Quotation Error:", error);
    return NextResponse.json({ error: "Failed to save quotation to cloud" }, { status: 500 });
  }
}
