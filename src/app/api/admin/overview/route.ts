import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const rateLimit = checkRateLimit(`admin:overview:${admin.id}`, 30, 60_000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d"; // 7d, 30d, 90d, all

    let days = 30;
    if (range === "7d") days = 7;
    if (range === "90d") days = 90;
    if (range === "all") days = 365;

    // 1. High-level metric counts
    const [
      totalUsersRes,
      activeUsersRes,
      newUsersPeriodRes,
      totalQuotesRes,
      periodQuotesRes,
      aiLogsRes,
      recentEventsRes,
    ] = await Promise.all([
      db.query(`SELECT count(*) FROM "User";`),
      // Active users: generated a quote or ran an extraction in the last 30 days
      db.query(`
        SELECT count(DISTINCT "userId") FROM (
          SELECT "userId" FROM "Quotation" WHERE "createdAt" >= NOW() - INTERVAL '30 days'
          UNION
          SELECT "userId" FROM "AiUsageLog" WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        ) active WHERE "userId" IS NOT NULL;
      `),
      db.query(
        `SELECT count(*) FROM "User" WHERE "createdAt" >= NOW() - ($1 || ' days')::INTERVAL;`,
        [days]
      ),
      db.query(`SELECT count(*) FROM "Quotation";`),
      db.query(
        `SELECT count(*) FROM "Quotation" WHERE "createdAt" >= NOW() - ($1 || ' days')::INTERVAL;`,
        [days]
      ),
      // AI statistics
      db.query(`
        SELECT 
          count(*) as total_requests,
          count(*) FILTER (WHERE status = 'SUCCESS') as success_requests,
          count(*) FILTER (WHERE status = 'FAILED') as failed_requests,
          COALESCE(SUM("totalTokens"), 0) as total_tokens,
          COALESCE(SUM("estimatedCostUsd"), 0) as total_cost,
          COALESCE(AVG("durationMs"), 0) as avg_duration_ms
        FROM "AiUsageLog";
      `),
      // Recent platform activity
      db.query(`
        SELECT 
          e.id, 
          e."eventType", 
          e.metadata, 
          e."createdAt", 
          u.name as user_name, 
          u.email as user_email
        FROM "PlatformEvent" e
        LEFT JOIN "User" u ON e."userId" = u.id
        ORDER BY e."createdAt" DESC
        LIMIT 10;
      `),
    ]);

    // 2. Growth Trends per day for the requested period
    const trendsRes = await db.query(
      `
      WITH date_series AS (
        SELECT generate_series(
          CURRENT_DATE - ($1 || ' days')::INTERVAL,
          CURRENT_DATE,
          '1 day'::INTERVAL
        )::date AS day
      )
      SELECT 
        ds.day::text as date,
        COALESCE(u.reg_count, 0)::int as new_users,
        COALESCE(q.quote_count, 0)::int as quotes,
        COALESCE(a.ai_count, 0)::int as ai_requests
      FROM date_series ds
      LEFT JOIN (
        SELECT "createdAt"::date as day, count(*) as reg_count 
        FROM "User" 
        GROUP BY "createdAt"::date
      ) u ON ds.day = u.day
      LEFT JOIN (
        SELECT "createdAt"::date as day, count(*) as quote_count 
        FROM "Quotation" 
        GROUP BY "createdAt"::date
      ) q ON ds.day = q.day
      LEFT JOIN (
        SELECT "createdAt"::date as day, count(*) as ai_count 
        FROM "AiUsageLog" 
        GROUP BY "createdAt"::date
      ) a ON ds.day = a.day
      ORDER BY ds.day ASC;
      `,
      [days]
    );

    const aiStats = aiLogsRes.rows[0];

    return NextResponse.json({
      admin: {
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      stats: {
        totalUsers: parseInt(totalUsersRes.rows[0].count, 10),
        activeUsers30d: parseInt(activeUsersRes.rows[0].count, 10),
        newUsersInPeriod: parseInt(newUsersPeriodRes.rows[0].count, 10),
        totalQuotations: parseInt(totalQuotesRes.rows[0].count, 10),
        quotationsInPeriod: parseInt(periodQuotesRes.rows[0].count, 10),
        totalAiRequests: parseInt(aiStats.total_requests || "0", 10),
        successfulAiRequests: parseInt(aiStats.success_requests || "0", 10),
        failedAiRequests: parseInt(aiStats.failed_requests || "0", 10),
        totalTokens: parseInt(aiStats.total_tokens || "0", 10),
        totalEstimatedCostUsd: parseFloat(aiStats.total_cost || "0"),
        avgDurationMs: Math.round(parseFloat(aiStats.avg_duration_ms || "0")),
      },
      trends: trendsRes.rows,
      recentActivity: recentEventsRes.rows,
    });
  } catch (error: unknown) {
    const msg = (error as Error)?.message;
    if (msg === "UNAUTHORIZED_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("Admin Overview Error:", error);
    return NextResponse.json({ error: "Failed to fetch overview analytics" }, { status: 500 });
  }
}
