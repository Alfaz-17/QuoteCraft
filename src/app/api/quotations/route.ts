import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserQuotations, createQuotation } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid user session" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const type = searchParams.get("type") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;

    const quotations = await getUserQuotations(userId, { search, type, limit });
    return NextResponse.json({ quotations });
  } catch (error) {
    console.error("List Quotations Error:", error);
    return NextResponse.json({ error: "Failed to fetch quotations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid user session" }, { status: 400 });
    }

    const body = await req.json();
    const created = await createQuotation({
      userId,
      number: body.number || `QT-${Date.now().toString().slice(-4)}`,
      type: body.type || "quotation",
      date: body.date || new Date().toISOString().split("T")[0],
      validUntil: body.validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      vessel: body.vessel || "",
      reference: body.reference || "",
      scope: body.scope || "",
      make: body.make || "",
      model: body.model || "",
      introText: body.introText || "",
      company: body.company || {},
      client: body.client || {},
      items: body.items || [],
      terms: body.terms || "",
      currency: body.currency || "USD",
      discount: parseFloat(body.discount) || 0,
      discountType: body.discountType || "flat",
      taxPercent: parseFloat(body.taxPercent) || 0,
      shippingCharge: parseFloat(body.shippingCharge) || 0,
    });

    return NextResponse.json({ message: "Quotation created successfully", quotation: created }, { status: 201 });
  } catch (error) {
    console.error("Create Quotation Error:", error);
    return NextResponse.json({ error: "Failed to create quotation" }, { status: 500 });
  }
}
