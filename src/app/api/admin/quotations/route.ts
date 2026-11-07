import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const rateLimit = checkRateLimit(`admin:quotations:${admin.id}`, 60, 60_000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const type = searchParams.get("type") || "ALL"; // ALL, quotation, proforma, rfq
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    const params: unknown[] = [];
    const whereClauses: string[] = [];

    if (type !== "ALL") {
      params.push(type);
      whereClauses.push(`q.type = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      const pIndex = params.length;
      whereClauses.push(
        `(LOWER(q.number) LIKE $${pIndex} OR LOWER(COALESCE(q.vessel, '')) LIKE $${pIndex} OR LOWER(COALESCE(q.client->>'companyName', q.client->>'name', '')) LIKE $${pIndex} OR LOWER(u.email) LIKE $${pIndex})`
      );
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Count
    const countRes = await db.query(
      `SELECT count(*) FROM "Quotation" q LEFT JOIN "User" u ON q."userId" = u.id ${whereSql};`,
      params
    );
    const totalCount = parseInt(countRes.rows[0].count, 10);

    // Fetch paginated metadata (tenant-isolated: excludes full line items array)
    params.push(limit);
    const limitParam = params.length;
    params.push(offset);
    const offsetParam = params.length;

    const dataRes = await db.query(
      `
      SELECT 
        q.id,
        q.number,
        q.type,
        q.date,
        q."validUntil",
        q.vessel,
        q.reference,
        q.currency,
        q.discount,
        q."discountType",
        q."taxPercent",
        q."shippingCharge",
        q."createdAt",
        q."updatedAt",
        COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(q.items) = 'array' THEN q.items ELSE '[]'::jsonb END), 0)::int as item_count,
        q.company->>'name' as supplier_company,
        COALESCE(q.client->>'companyName', q.client->>'name', '—') as buyer_company,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email
      FROM "Quotation" q
      LEFT JOIN "User" u ON q."userId" = u.id
      ${whereSql}
      ORDER BY q."updatedAt" DESC
      LIMIT $${limitParam} OFFSET $${offsetParam};
      `,
      params
    );

    return NextResponse.json({
      quotations: dataRes.rows,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: unknown) {
    const msg = (error as Error)?.message;
    if (msg === "UNAUTHORIZED_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("Admin Quotations Error:", error);
    return NextResponse.json({ error: "Failed to fetch platform quotations" }, { status: 500 });
  }
}

