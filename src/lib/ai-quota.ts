import { db } from "@/lib/prisma";

export const DEFAULT_DAILY_AI_LIMIT = 5;

export interface DailyQuotaResult {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
}

export interface AiEngineControls {
  dailyAiLimitPerUser: number;
  groqModel: string;
  maxUploadSizeMb: number;
  enableVisionFallback: boolean;
}

/**
 * Resolves current AI engine controls from PlatformSetting with environment fallbacks.
 * Changes made in the Admin Settings page take effect immediately at runtime.
 */
export async function getAiEngineControls(): Promise<AiEngineControls> {
  const defaults: AiEngineControls = {
    dailyAiLimitPerUser: process.env.DAILY_AI_REQUEST_LIMIT
      ? parseInt(process.env.DAILY_AI_REQUEST_LIMIT, 10)
      : DEFAULT_DAILY_AI_LIMIT,
    groqModel: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
    maxUploadSizeMb: 10,
    enableVisionFallback: true,
  };

  try {
    const { rows } = await db.query(
      `SELECT value FROM "PlatformSetting" WHERE key = 'ai_engine_controls' LIMIT 1`
    );
    if (rows.length > 0 && rows[0].value) {
      const val =
        typeof rows[0].value === "string"
          ? JSON.parse(rows[0].value)
          : rows[0].value;

      return {
        dailyAiLimitPerUser:
          typeof val.dailyAiLimitPerUser === "number" && val.dailyAiLimitPerUser > 0
            ? val.dailyAiLimitPerUser
            : defaults.dailyAiLimitPerUser,
        groqModel:
          typeof val.groqModel === "string" && val.groqModel.trim()
            ? val.groqModel.trim()
            : defaults.groqModel,
        maxUploadSizeMb:
          typeof val.maxUploadSizeMb === "number" && val.maxUploadSizeMb > 0
            ? val.maxUploadSizeMb
            : defaults.maxUploadSizeMb,
        enableVisionFallback:
          typeof val.enableVisionFallback === "boolean"
            ? val.enableVisionFallback
            : defaults.enableVisionFallback,
      };
    }
  } catch {
    // Fall through to defaults on DB error
  }

  return defaults;
}

let aiLimitColumnEnsured = false;

export async function ensureUserAiLimitColumn(): Promise<void> {
  if (aiLimitColumnEnsured) return;
  try {
    await db.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "aiDailyLimit" INTEGER;`);
    aiLimitColumnEnsured = true;
  } catch {
    // Column may already exist or role lacks ALTER permission
  }
}

/** Per-customer limit set in Admin → Customers; null means "use the global limit". */
export async function getUserAiLimitOverride(userId: string): Promise<number | null> {
  try {
    await ensureUserAiLimitColumn();
    const { rows } = await db.query(`SELECT "aiDailyLimit" FROM "User" WHERE id = $1 LIMIT 1`, [userId]);
    const value = rows?.[0]?.aiDailyLimit;
    return typeof value === "number" && value > 0 ? value : null;
  } catch {
    return null;
  }
}

/**
 * Checks if the user has exceeded their daily AI fallback extraction quota.
 * Reads atomically from PostgreSQL "AiUsageLog" within the last 24-hour rolling window.
 * 
 * Note: Deterministic Excel and PDF extractions do not consume this quota.
 */
export async function checkDailyAiQuota(userId: string): Promise<DailyQuotaResult> {
  const controls = await getAiEngineControls();
  const limit = (await getUserAiLimitOverride(userId)) ?? controls.dailyAiLimitPerUser;

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
