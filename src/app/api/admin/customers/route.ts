import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, logAdminAction } from "@/lib/admin-auth";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const rateLimit = checkRateLimit(`admin:customers:${admin.id}`, 60, 60_000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "ALL"; // ALL, ACTIVE, SUSPENDED
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const offset = (page - 1) * limit;

    const params: unknown[] = [];
    const whereClauses: string[] = [];

    if (status !== "ALL") {
      params.push(status);
      whereClauses.push(`u.status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      const pIndex = params.length;
      whereClauses.push(
        `(LOWER(u.name) LIKE $${pIndex} OR LOWER(u.email) LIKE $${pIndex} OR LOWER(COALESCE(p.company->>'name', '')) LIKE $${pIndex})`
      );
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Count total matching
    const countSql = `
      SELECT count(*) 
      FROM "User" u
      LEFT JOIN "UserProfile" p ON u.id = p."userId"
      ${whereSql};
    `;
    const countRes = await db.query(countSql, params);
    const totalCount = parseInt(countRes.rows[0].count, 10);

    // Fetch paginated customers with quotation counts and AI usage counts
    params.push(limit);
    const limitParam = params.length;
    params.push(offset);
    const offsetParam = params.length;

    const dataSql = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.status,
        u."createdAt",
        u."lastLoginAt",
        p.company->>'name' as company_name,
        p.company->>'email' as company_email,
        p.company->>'phone' as company_phone,
        COALESCE(q.total_quotes, 0)::int as total_quotes,
        COALESCE(a.total_ai_extractions, 0)::int as total_ai_extractions,
        COALESCE(a.total_ai_cost, 0)::float as total_ai_cost
      FROM "User" u
      LEFT JOIN "UserProfile" p ON u.id = p."userId"
      LEFT JOIN (
        SELECT "userId", count(*) as total_quotes 
        FROM "Quotation" 
        GROUP BY "userId"
      ) q ON u.id = q."userId"
      LEFT JOIN (
        SELECT 
          "userId", 
          count(*) as total_ai_extractions,
          SUM("estimatedCostUsd") as total_ai_cost
        FROM "AiUsageLog"
        GROUP BY "userId"
      ) a ON u.id = a."userId"
      ${whereSql}
      ORDER BY u."createdAt" DESC
      LIMIT $${limitParam} OFFSET $${offsetParam};
    `;

    const dataRes = await db.query(dataSql, params);

    return NextResponse.json({
      customers: dataRes.rows,
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
    console.error("Admin Customers Error:", error);
    return NextResponse.json({ error: "Failed to fetch customer accounts" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const body = await req.json();
    const { userId, action, reason } = body; // action: 'SUSPEND' | 'REACTIVATE'

    if (!userId || !["SUSPEND", "REACTIVATE"].includes(action)) {
      return NextResponse.json({ error: "Invalid action payload" }, { status: 400 });
    }

    // Safety: Founder cannot suspend themselves
    if (userId === admin.id) {
      return NextResponse.json({ error: "Cannot suspend owner account." }, { status: 400 });
    }

    const newStatus = action === "SUSPEND" ? "SUSPENDED" : "ACTIVE";

    const { rows } = await db.query(
      `UPDATE "User" SET status = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING id, email, name, status;`,
      [newStatus, userId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUser = rows[0];

    // Log administrative action
    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: action === "SUSPEND" ? "SUSPEND_USER" : "REACTIVATE_USER",
      targetEntity: "User",
      targetId: userId,
      details: {
        targetEmail: targetUser.email,
        targetName: targetUser.name,
        newStatus,
        reason: reason || "Manual founder administrative review",
      },
    });

    return NextResponse.json({
      success: true,
      user: targetUser,
      message: `User account ${action === "SUSPEND" ? "suspended" : "reactivated"} successfully.`,
    });
  } catch (error: unknown) {
    const msg = (error as Error)?.message;
    if (msg === "UNAUTHORIZED_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("Admin Customer Update Error:", error);
    return NextResponse.json({ error: "Failed to update customer status" }, { status: 500 });
  }
}

