import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, logAdminAction } from "@/lib/admin-auth";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const rateLimit = checkRateLimit(`admin:support:${admin.id}`, 60, 60_000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "ALL"; // ALL, OPEN, IN_PROGRESS, RESOLVED, CLOSED
    const category = searchParams.get("category") || "ALL";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const offset = (page - 1) * limit;

    const params: unknown[] = [];
    const whereClauses: string[] = [];

    if (status !== "ALL") {
      params.push(status);
      whereClauses.push(`status = $${params.length}`);
    }

    if (category !== "ALL") {
      params.push(category);
      whereClauses.push(`category = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      const pIndex = params.length;
      whereClauses.push(
        `(LOWER(subject) LIKE $${pIndex} OR LOWER(message) LIKE $${pIndex} OR LOWER("userEmail") LIKE $${pIndex} OR LOWER(COALESCE("userName", '')) LIKE $${pIndex})`
      );
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countRes = await db.query(
      `SELECT count(*) FROM "SupportTicket" ${whereSql};`,
      params
    );
    const totalCount = parseInt(countRes.rows[0].count, 10);

    params.push(limit);
    const limitParam = params.length;
    params.push(offset);
    const offsetParam = params.length;

    const dataRes = await db.query(
      `
      SELECT id, "userId", "userEmail", "userName", category, subject, message, status, priority, "internalNotes", "createdAt", "updatedAt"
      FROM "SupportTicket"
      ${whereSql}
      ORDER BY 
        CASE 
          WHEN status = 'OPEN' THEN 1
          WHEN status = 'IN_PROGRESS' THEN 2
          WHEN status = 'RESOLVED' THEN 3
          ELSE 4
        END,
        "createdAt" DESC
      LIMIT $${limitParam} OFFSET $${offsetParam};
      `,
      params
    );

    // Also get ticket counts by status for quick metric chips
    const countsByStatus = await db.query(`
      SELECT 
        count(*) as total,
        count(*) FILTER (WHERE status = 'OPEN') as open_count,
        count(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress_count,
        count(*) FILTER (WHERE status = 'RESOLVED') as resolved_count
      FROM "SupportTicket";
    `);

    return NextResponse.json({
      tickets: dataRes.rows,
      counts: countsByStatus.rows[0],
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
    console.error("Admin Support GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch support tickets" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const body = await req.json();
    const { ticketId, status, priority, internalNotes } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
    }

    const { rows } = await db.query(
      `
      UPDATE "SupportTicket" SET
        status = COALESCE($1, status),
        priority = COALESCE($2, priority),
        "internalNotes" = COALESCE($3, "internalNotes"),
        "updatedAt" = NOW()
      WHERE id = $4
      RETURNING *;
      `,
      [status, priority, internalNotes, ticketId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const updatedTicket = rows[0];

    // Log admin action
    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "UPDATE_SUPPORT_TICKET",
      targetEntity: "SupportTicket",
      targetId: ticketId,
      details: {
        status: updatedTicket.status,
        priority: updatedTicket.priority,
        subject: updatedTicket.subject,
      },
    });

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      message: "Ticket updated successfully.",
    });
  } catch (error: unknown) {
    const msg = (error as Error)?.message;
    if (msg === "UNAUTHORIZED_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("Admin Support PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update support ticket" }, { status: 500 });
  }
}
