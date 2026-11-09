import { db } from "@/lib/prisma";

export const DEFAULT_DAILY_AI_LIMIT = 5;

export interface DailyQuotaResult {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
}

/**
 * Checks if the user has exceeded their daily AI fallback extraction quota.
 * Reads atomically from PostgreSQL "AiUsageLog" within the last 24-hour rolling window.
 * 
 * Note: Deterministic Excel and PDF extractions do not consume this quota.
 */
export async function checkDailyAiQuota(userId: string): Promise<DailyQuotaResult> {
  const envLimit = process.env.DAILY_AI_REQUEST_LIMIT;
  const limit = envLimit ? parseInt(envLimit, 10) : DEFAULT_DAILY_AI_LIMIT;

  try {
    const { rows } = await db.query(
      `SELECT count(*)::int as used_count
       FROM "AiUsageLog"
       WHERE "userId" = $1
         AND method = 'ai_fallback'
         AND status = 'SUCCESS'
         AND "createdAt" >= NOW() - INTERVAL '24 hours'`,
      [userId]
    );

    const used = rows?.[0]?.used_count ?? 0;
    const allowed = used < limit;
    const remaining = Math.max(0, limit - used);

    return {
      allowed,
      limit,
      used,
      remaining,
    };
  } catch (err) {
    // Graceful degradation: in case of DB connection hiccup, allow the request rather than blocking user
    console.warn("AI Quota check encountered DB warning:", err);
    return {
      allowed: true,
      limit,
      used: 0,
      remaining: limit,
    };
  }
}

