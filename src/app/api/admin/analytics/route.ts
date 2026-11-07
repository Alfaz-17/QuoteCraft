import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const rateLimit = checkRateLimit(`admin:analytics:${admin.id}`, 60, 60_000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d";
    let days = 30;
    if (range === "7d") days = 7;
    if (range === "90d") days = 90;
    if (range === "all") days = 365;

    // 1. Funnel statistics derived from PlatformEvent & AiUsageLog
    const [
      uploadsRes,
      extractionSuccessRes,
      extractionFailRes,
      quotesCreatedRes,
      methodBreakdownRes,
      currencyBreakdownRes,
      dailyFunnelRes,
    ] = await Promise.all([
      // Total RFQs uploaded
      db.query(`
        SELECT count(*) FROM "AiUsageLog" WHERE "createdAt" >= NOW() - ($1 || ' days')::INTERVAL;
      `, [days]),
      // Successful extractions
      db.query(`
        SELECT count(*) FROM "AiUsageLog" 
        WHERE status = 'SUCCESS' AND "createdAt" >= NOW() - ($1 || ' days')::INTERVAL;
      `, [days]),
      // Failed extractions
      db.query(`
        SELECT count(*) FROM "AiUsageLog" 
        WHERE status = 'FAILED' AND "createdAt" >= NOW() - ($1 || ' days')::INTERVAL;
      `, [days]),
      // Total quotations created
      db.query(`
        SELECT count(*) FROM "Quotation" WHERE "createdAt" >= NOW() - ($1 || ' days')::INTERVAL;
      `, [days]),
      // Extraction Method Breakdown (Deterministic vs AI Fallback)
      db.query(`
        SELECT 
          method,
          count(*) as count,
          COALESCE(SUM("estimatedCostUsd"), 0) as total_cost,
          COALESCE(AVG("durationMs"), 0) as avg_duration_ms
        FROM "AiUsageLog"
        WHERE "createdAt" >= NOW() - ($1 || ' days')::INTERVAL
        GROUP BY method;
      `, [days]),
      // Top Currencies used
      db.query(`
        SELECT 
          currency,
          count(*) as count,
          COALESCE(AVG(discount), 0) as avg_discount
        FROM "Quotation"
        WHERE "createdAt" >= NOW() - ($1 || ' days')::INTERVAL
        GROUP BY currency
        ORDER BY count DESC
        LIMIT 5;
      `, [days]),
      // Daily Funnel
      db.query(`
        SELECT 
          "createdAt"::date as date,
          count(*) FILTER (WHERE status = 'SUCCESS') as successful_extractions,
          count(*) FILTER (WHERE status = 'FAILED') as failed_extractions
        FROM "AiUsageLog"
        WHERE "createdAt" >= NOW() - ($1 || ' days')::INTERVAL
        GROUP BY "createdAt"::date
        ORDER BY date ASC;
      `, [days]),
    ]);

    const totalUploads = parseInt(uploadsRes.rows[0].count, 10);
    const successfulExtractions = parseInt(extractionSuccessRes.rows[0].count, 10);
    const failedExtractions = parseInt(extractionFailRes.rows[0].count, 10);
    const quotesCreated = parseInt(quotesCreatedRes.rows[0].count, 10);

    const extractionRate = totalUploads > 0 ? +((successfulExtractions / totalUploads) * 100).toFixed(1) : 0;
    const conversionToQuoteRate = successfulExtractions > 0 ? +((quotesCreated / successfulExtractions) * 100).toFixed(1) : 0;

    return NextResponse.json({
      periodDays: days,
      funnel: [
        { step: "1. RFQ Document Uploaded", count: totalUploads, rate: 100 },
        { step: "2. Items Extracted Successfully", count: successfulExtractions, rate: extractionRate },
        { step: "3. Quotations Finalized & Saved", count: quotesCreated, rate: conversionToQuoteRate },
      ],
      metrics: {
        totalUploads,
        successfulExtractions,
        failedExtractions,
        quotesCreated,
        extractionRate,
        conversionToQuoteRate,
      },
      methodBreakdown: methodBreakdownRes.rows,
      currencyBreakdown: currencyBreakdownRes.rows,
      dailyActivity: dailyFunnelRes.rows,
    });
  } catch (error: unknown) {
    const msg = (error as Error)?.message;
    if (msg === "UNAUTHORIZED_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("Admin Analytics Error:", error);
    return NextResponse.json({ error: "Failed to fetch product analytics" }, { status: 500 });
  }
}

