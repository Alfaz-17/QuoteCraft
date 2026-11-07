import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/clerk-auth";
import { getUserQuotations, createQuotation } from "@/lib/prisma";
import { trackPlatformEvent } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
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
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
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
      items: Array.isArray(body.items) ? body.items : [],
      terms: body.terms || "",
      currency: body.currency || "USD",
      discount: typeof body.discount === "number" ? body.discount : 0,
      discountType: body.discountType || "flat",
      taxPercent: typeof body.taxPercent === "number" ? body.taxPercent : 0,
      shippingCharge: typeof body.shippingCharge === "number" ? body.shippingCharge : 0,
    });

    trackPlatformEvent({
      userId,
      eventType: "QUOTE_SAVED",
      metadata: { quotationId: created?.id, number: body.number, currency: body.currency, itemsCount: Array.isArray(body.items) ? body.items.length : 0 },
    }).catch(() => {});

    return NextResponse.json({ quotation: created }, { status: 201 });
  } catch (error) {
    console.error("Create Quotation Error:", error);
    return NextResponse.json({ error: "Failed to create quotation" }, { status: 500 });
  }
}
