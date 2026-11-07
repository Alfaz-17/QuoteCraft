import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const rateLimit = checkRateLimit(`admin:logs:${admin.id}`, 60, 60_000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const action = searchParams.get("action") || "ALL";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const offset = (page - 1) * limit;

    const params: unknown[] = [];
    const whereClauses: string[] = [];

    if (action !== "ALL") {
      params.push(action);
      whereClauses.push(`action = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      const pIndex = params.length;
      whereClauses.push(
        `(LOWER(action) LIKE $${pIndex} OR LOWER("targetEntity") LIKE $${pIndex} OR LOWER("adminEmail") LIKE $${pIndex} OR LOWER(COALESCE("targetId", '')) LIKE $${pIndex})`
      );
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countRes = await db.query(
      `SELECT count(*) FROM "AdminAuditLog" ${whereSql};`,
      params
    );
    const totalCount = parseInt(countRes.rows[0].count, 10);

    params.push(limit);
    const limitParam = params.length;
    params.push(offset);
    const offsetParam = params.length;

    const dataRes = await db.query(
      `
      SELECT id, "adminId", "adminEmail", action, "targetEntity", "targetId", details, "ipAddress", "createdAt"
      FROM "AdminAuditLog"
      ${whereSql}
      ORDER BY "createdAt" DESC
      LIMIT $${limitParam} OFFSET $${offsetParam};
      `,
      params
    );

    return NextResponse.json({
      logs: dataRes.rows,
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
    console.error("Admin Activity Logs GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}

