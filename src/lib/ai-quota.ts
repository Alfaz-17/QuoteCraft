import { db } from "@/lib/prisma";

export const DEFAULT_DAILY_AI_LIMIT = 5;

export interface DailyQuotaResult {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
}

/**
 * Resolves the daily AI fallback limit with this priority:
 * 1. PlatformSetting "ai_engine_controls" → dailyAiLimitPerUser (admin panel)
 * 2. DAILY_AI_REQUEST_LIMIT environment variable
 * 3. Hardcoded default (5)
 */
async function resolveDailyLimit(): Promise<number> {
  try {
    const { rows } = await db.query(
      `SELECT value FROM "PlatformSetting" WHERE key = 'ai_engine_controls' LIMIT 1`
    );
    if (rows.length > 0 && rows[0].value) {
      const val =
        typeof rows[0].value === "string"
          ? JSON.parse(rows[0].value)
          : rows[0].value;
      if (typeof val.dailyAiLimitPerUser === "number" && val.dailyAiLimitPerUser > 0) {
        return val.dailyAiLimitPerUser;
      }
    }
  } catch {
    // Fall through to env / default
  }

  const envLimit = process.env.DAILY_AI_REQUEST_LIMIT;
  return envLimit ? parseInt(envLimit, 10) : DEFAULT_DAILY_AI_LIMIT;
}

/**
 * Checks if the user has exceeded their daily AI fallback extraction quota.
 * Reads atomically from PostgreSQL "AiUsageLog" within the last 24-hour rolling window.
 * 
 * Note: Deterministic Excel and PDF extractions do not consume this quota.
 */
export async function checkDailyAiQuota(userId: string): Promise<DailyQuotaResult> {
  const limit = await resolveDailyLimit();

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
