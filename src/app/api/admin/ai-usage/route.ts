import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const rateLimit = checkRateLimit(`admin:ai-usage:${admin.id}`, 60, 60_000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d";
    let days = 30;
    if (range === "7d") days = 7;
    if (range === "90d") days = 90;
    if (range === "all") days = 365;

    const [
      totalsRes,
      dailyUsageRes,
      topUsersRes,
      recentLogsRes,
      recentErrorsRes,
    ] = await Promise.all([
      // Overall aggregated totals for the period
      db.query(`
        SELECT 
          count(*) as total_requests,
          count(*) FILTER (WHERE status = 'SUCCESS') as successful_requests,
          count(*) FILTER (WHERE status = 'FAILED') as failed_requests,
          count(*) FILTER (WHERE method IN ('deterministic_excel', 'deterministic_pdf')) as deterministic_count,
          count(*) FILTER (WHERE method = 'ai_fallback') as gemini_count,
          COALESCE(SUM("inputTokens"), 0) as total_input_tokens,
          COALESCE(SUM("outputTokens"), 0) as total_output_tokens,
          COALESCE(SUM("totalTokens"), 0) as total_tokens,
          COALESCE(SUM("estimatedCostUsd"), 0) as total_cost_usd,
          COALESCE(AVG("durationMs"), 0) as avg_latency_ms
        FROM "AiUsageLog"
        WHERE "createdAt" >= NOW() - ($1 || ' days')::INTERVAL;
      `, [days]),

      // Daily token consumption and cost trends
      db.query(`
        SELECT 
          "createdAt"::date as date,
          count(*) as total_requests,
          COALESCE(SUM("totalTokens"), 0) as tokens,
          COALESCE(SUM("estimatedCostUsd"), 0) as cost_usd,
          COALESCE(AVG("durationMs"), 0)::int as avg_duration_ms
        FROM "AiUsageLog"
        WHERE "createdAt" >= NOW() - ($1 || ' days')::INTERVAL
        GROUP BY "createdAt"::date
        ORDER BY date ASC;
      `, [days]),

      // Top consuming customers
      db.query(`
        SELECT 
          COALESCE(u.name, 'Anonymous/Trial') as customer_name,
          COALESCE(u.email, '—') as customer_email,
          count(l.id) as request_count,
          COALESCE(SUM(l."totalTokens"), 0)::int as total_tokens,
          COALESCE(SUM(l."estimatedCostUsd"), 0)::float as total_cost_usd
        FROM "AiUsageLog" l
        LEFT JOIN "User" u ON l."userId" = u.id
        WHERE l."createdAt" >= NOW() - ($1 || ' days')::INTERVAL
        GROUP BY u.name, u.email
        ORDER BY total_cost_usd DESC
        LIMIT 10;
      `, [days]),

      // Recent 20 extraction logs
      db.query(`
        SELECT 
          l.id,
          l."fileName",
          l."mimeType",
          l.method,
          l.model,
          l."inputTokens",
          l."outputTokens",
          l."totalTokens",
          l."estimatedCostUsd",
          l."durationMs",
          l."itemCount",
          l.status,
          l."errorMessage",
          l."createdAt",
          u.name as user_name,
          u.email as user_email
        FROM "AiUsageLog" l
        LEFT JOIN "User" u ON l."userId" = u.id
        ORDER BY l."createdAt" DESC
        LIMIT 20;
      `),

      // Recent Failed extractions report
      db.query(`
        SELECT 
          l.id,
          l."fileName",
          l."mimeType",
          l.method,
          l."errorMessage",
          l."durationMs",
          l."createdAt",
          u.email as user_email
        FROM "AiUsageLog" l
        LEFT JOIN "User" u ON l."userId" = u.id
        WHERE l.status = 'FAILED'
        ORDER BY l."createdAt" DESC
        LIMIT 15;
      `),
    ]);

    const totals = totalsRes.rows[0];
    const totalRequests = parseInt(totals.total_requests || "0", 10);
    const failedRequests = parseInt(totals.failed_requests || "0", 10);
    const errorRate = totalRequests > 0 ? +((failedRequests / totalRequests) * 100).toFixed(1) : 0;

    return NextResponse.json({
      metrics: {
        totalRequests,
        successfulRequests: parseInt(totals.successful_requests || "0", 10),
        failedRequests,
        errorRate,
        deterministicCount: parseInt(totals.deterministic_count || "0", 10),
        geminiCount: parseInt(totals.gemini_count || "0", 10),
        totalInputTokens: parseInt(totals.total_input_tokens || "0", 10),
        totalOutputTokens: parseInt(totals.total_output_tokens || "0", 10),
        totalTokens: parseInt(totals.total_tokens || "0", 10),
        totalCostUsd: parseFloat(totals.total_cost_usd || "0"),
        avgLatencyMs: Math.round(parseFloat(totals.avg_latency_ms || "0")),
      },
      dailyTrends: dailyUsageRes.rows,
      topCustomers: topUsersRes.rows,
      recentLogs: recentLogsRes.rows,
      failedReports: recentErrorsRes.rows,
    });
  } catch (error: unknown) {
    const msg = (error as Error)?.message;
    if (msg === "UNAUTHORIZED_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("Admin AI Usage Error:", error);
    return NextResponse.json({ error: "Failed to fetch AI usage monitoring data" }, { status: 500 });
  }
}

