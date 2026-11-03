import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getQuotationById, deleteQuotation, updateQuotation } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    const { id } = await params;
    const existing = await getQuotationById(userId, id);
    if (!existing) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    const body = await req.json();
    await updateQuotation(id, {
      type: body.type ?? existing.type,
      date: body.date ?? existing.date,
      validUntil: body.validUntil ?? existing.validUntil,
      vessel: body.vessel ?? existing.vessel,
      reference: body.reference ?? existing.reference,
      scope: body.scope ?? existing.scope,
      make: body.make ?? existing.make,
      model: body.model ?? existing.model,
      introText: body.introText ?? existing.introText,
      company: body.company ?? existing.company,
      client: body.client ?? existing.client,
      items: body.items ?? existing.items,
      terms: body.terms ?? existing.terms,
      currency: body.currency ?? existing.currency,
      discount: parseFloat(body.discount) || 0,
      discountType: body.discountType ?? existing.discountType,
      taxPercent: parseFloat(body.taxPercent) || 0,
      shippingCharge: parseFloat(body.shippingCharge) || 0,
    });

    return NextResponse.json({ message: "Quotation updated successfully" });
  } catch (error) {
    console.error("Update Quotation Error:", error);
    return NextResponse.json({ error: "Failed to update quotation" }, { status: 500 });
  }
}
