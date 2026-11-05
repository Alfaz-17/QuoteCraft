import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/clerk-auth";
import {
  findQuotationByUserAndNumber,
  createQuotation,
  updateQuotation,
} from "@/lib/prisma";
import {
  calculateRowTotal,
  calculateSubtotal,
  calculateGrandTotal,
  roundToTwo,
} from "@/utils/calculations";
import { LineItem, TableColumn } from "@/types/quotation.types";

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const state = await req.json();
    const {
      documentInfo,
      company,
      client,
      items,
      terms,
      currency,
      discount,
      discountType,
      taxPercent,
      shippingCharge,
      introText,
      tableColumns,
    } = state;

    if (!documentInfo?.number) {
      return NextResponse.json({ error: "Missing document number" }, { status: 400 });
    }

    const existing = await findQuotationByUserAndNumber(userId, documentInfo.number);

    // Recalculate row totals server-side to guarantee precision & integrity
    const cols = (Array.isArray(tableColumns) ? tableColumns : undefined) as TableColumn[] | undefined;
    const sanitizedItems: LineItem[] = (Array.isArray(items) ? items : []).map((item: LineItem) => ({
      ...item,
      total: calculateRowTotal(item, cols),
    }));

    const cleanDiscount = Math.max(0, parseFloat(discount) || 0);
    const cleanTaxPercent = Math.max(0, parseFloat(taxPercent) || 0);
    const cleanShipping = Math.max(0, parseFloat(shippingCharge) || 0);
    const cleanDiscountType = discountType === "percent" ? "percent" : "flat";

    const serverSubtotal = calculateSubtotal(sanitizedItems, cols);
    const serverGrandTotal = calculateGrandTotal(
      serverSubtotal,
      cleanDiscount,
      cleanDiscountType,
      cleanTaxPercent,
      cleanShipping
    );

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
      items: sanitizedItems,
      terms: terms || "",
      currency: currency || "USD",
      discount: cleanDiscount,
      discountType: cleanDiscountType,
      taxPercent: cleanTaxPercent,
      shippingCharge: cleanShipping,
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
      subtotal: serverSubtotal,
      grandTotal: serverGrandTotal,
      message: "Quotation saved successfully",
    });
  } catch (error) {
    console.error("Save Quotation Error:", error);
    return NextResponse.json({ error: "Failed to save quotation" }, { status: 500 });
  }
}
