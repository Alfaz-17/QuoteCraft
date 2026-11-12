import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/clerk-auth";
import { getQuotationById, deleteQuotation, updateQuotation } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const quotation = await getQuotationById(userId, id);
    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    return NextResponse.json({ quotation });
  } catch (error) {
    console.error("Get Quotation Error:", error);
    return NextResponse.json({ error: "Failed to retrieve quotation" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteQuotation(userId, id);
    if (!deleted) {
      return NextResponse.json({ error: "Quotation not found or already deleted" }, { status: 404 });
    }

    return NextResponse.json({ message: "Quotation deleted successfully" });
  } catch (error) {
    console.error("Delete Quotation Error:", error);
    return NextResponse.json({ error: "Failed to delete quotation" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await getQuotationById(userId, id);
    if (!existing) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    const body = await req.json();
    await updateQuotation(id, {
      type: body.type || existing.type,
      date: body.date || existing.date,
      validUntil: body.validUntil || existing.validUntil,
      vessel: body.vessel !== undefined ? body.vessel : existing.vessel,
      reference: body.reference !== undefined ? body.reference : existing.reference,
      scope: body.scope !== undefined ? body.scope : existing.scope,
      make: body.make !== undefined ? body.make : existing.make,
      model: body.model !== undefined ? body.model : existing.model,
      introText: body.introText !== undefined ? body.introText : existing.introText,
      company: body.company || existing.company,
      client: body.client || existing.client,
      items: Array.isArray(body.items) ? body.items : existing.items,
      terms: body.terms !== undefined ? body.terms : existing.terms,
      currency: body.currency || existing.currency,
      discount: typeof body.discount === "number" ? body.discount : existing.discount,
      discountType: body.discountType || existing.discountType,
      taxPercent: typeof body.taxPercent === "number" ? body.taxPercent : existing.taxPercent,
      shippingCharge: typeof body.shippingCharge === "number" ? body.shippingCharge : existing.shippingCharge,
      tableColumns: Array.isArray(body.tableColumns) ? body.tableColumns : undefined,
    });

    const updated = await getQuotationById(userId, id);
    return NextResponse.json({ quotation: updated });
  } catch (error) {
    console.error("Update Quotation Error:", error);
    return NextResponse.json({ error: "Failed to update quotation" }, { status: 500 });
  }
}
