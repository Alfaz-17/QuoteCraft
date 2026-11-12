import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/clerk-auth";
import {
  findQuotationByUserAndNumber,
  getOwnedQuotation,
  getNextQuotationNumber,
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
      tableColumns: cols ?? null,
    };

    // Quotes are identified by a client-generated quotationId; the number is only a label.
    // Never upsert by number: a new device restarting at QT-1001 must not overwrite an existing quote.
    const requestedId =
      typeof state.quotationId === "string" && UUID_RE.test(state.quotationId) ? state.quotationId : null;
    let number = String(documentInfo.number).trim();
    let quotationId: string;

    const owned = requestedId ? await getOwnedQuotation(userId, requestedId) : null;
    if (owned) {
      if (number !== owned.number) {
        const clash = await findQuotationByUserAndNumber(userId, number);
        if (clash && clash.id !== owned.id) number = owned.number;
      }
      await updateQuotation(owned.id, { ...payload, number });
      quotationId = owned.id;
    } else {
      if (await findQuotationByUserAndNumber(userId, number)) {
        number = await getNextQuotationNumber(userId, number);
      }
      let created = await createQuotation({ id: requestedId ?? undefined, userId, number, ...payload });
      if (!created && requestedId) {
        const raced = await getOwnedQuotation(userId, requestedId);
        if (raced) {
          await updateQuotation(raced.id, payload);
          created = { id: raced.id };
          number = raced.number;
        } else {
          // id already used by another account: issue a fresh one
          created = await createQuotation({ userId, number, ...payload });
        }
      }
      if (!created) throw new Error("Failed to create quotation");
      quotationId = created.id;
    }

    return NextResponse.json({
      success: true,
      quotationId,
      number,
      subtotal: serverSubtotal,
      grandTotal: serverGrandTotal,
      message: "Quotation saved successfully",
    });
  } catch (error) {
    console.error("Save Quotation Error:", error);
    return NextResponse.json({ error: "Failed to save quotation" }, { status: 500 });
  }
}
