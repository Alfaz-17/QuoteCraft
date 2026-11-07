import { db } from "@/lib/prisma";

let isBootstrapped = false;

async function executeWithRetry(query: string, params: unknown[] = [], maxRetries = 3): Promise<void> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      await db.query(query, params);
      return;
    } catch (err: unknown) {
      attempt++;
      const msg = (err as Error)?.message || String(err);
      if (
        (msg.includes("timeout") || msg.includes("terminated") || msg.includes("Connection")) &&
        attempt < maxRetries
      ) {
        console.warn(`Neon wake-up retry attempt ${attempt}/${maxRetries}...`);
        await new Promise((res) => setTimeout(res, 2000 * attempt));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Ensures all required PostgreSQL tables, columns, and indexes for the
 * Owner Command Center exist in Neon PostgreSQL without requiring manual migrations.
 */
export async function bootstrapAdminDatabase(): Promise<void> {
  if (isBootstrapped) return;

  try {
    // 0. Wake up connection
    await executeWithRetry("SELECT 1;");

    // 1. Update User table with role, status, lastLoginAt
    await executeWithRetry(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'USER';
    `);
    await executeWithRetry(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'ACTIVE';
    `);
    await executeWithRetry(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP WITH TIME ZONE;
    `);
    await executeWithRetry(`
      CREATE INDEX IF NOT EXISTS "idx_user_role" ON "User"("role");
    `);
    await executeWithRetry(`
      CREATE INDEX IF NOT EXISTS "idx_user_status" ON "User"("status");
    `);
    await executeWithRetry(`
      CREATE INDEX IF NOT EXISTS "idx_user_created_at" ON "User"("createdAt");
    `);

    // Auto-promote founder / owner email
    const ownerEmails = (process.env.OWNER_EMAILS || "alfazbilakhiya17@gmail.com")
      .split(",")
      .map((e) => e.trim().toLowerCase());

    for (const email of ownerEmails) {
      if (email) {
        await executeWithRetry(
          `UPDATE "User" SET "role" = 'SUPER_ADMIN' WHERE LOWER(email) = LOWER($1);`,
          [email]
        );
      }
    }

    // 2. AI Usage Log Table
    await executeWithRetry(`
      CREATE TABLE IF NOT EXISTS "AiUsageLog" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT REFERENCES "User"(id) ON DELETE SET NULL,
        "userEmail" TEXT,
        "fileName" TEXT,
        "mimeType" TEXT,
        "method" TEXT NOT NULL,
        "model" TEXT DEFAULT 'gemini-2.5-flash',
        "inputTokens" INT DEFAULT 0,
        "outputTokens" INT DEFAULT 0,
        "totalTokens" INT DEFAULT 0,
        "estimatedCostUsd" DOUBLE PRECISION DEFAULT 0.0,
        "durationMs" INT DEFAULT 0,
        "itemCount" INT DEFAULT 0,
        "status" TEXT NOT NULL,
        "errorMessage" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    await executeWithRetry(`CREATE INDEX IF NOT EXISTS "idx_ai_usage_user" ON "AiUsageLog"("userId");`);
    await executeWithRetry(`CREATE INDEX IF NOT EXISTS "idx_ai_usage_created" ON "AiUsageLog"("createdAt");`);
    await executeWithRetry(`CREATE INDEX IF NOT EXISTS "idx_ai_usage_status" ON "AiUsageLog"("status");`);

    // 3. Platform Event Table (Analytics & Funnel tracking)
    await executeWithRetry(`
      CREATE TABLE IF NOT EXISTS "PlatformEvent" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT REFERENCES "User"(id) ON DELETE SET NULL,
        "eventType" TEXT NOT NULL,
        "metadata" JSONB DEFAULT '{}'::jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    await executeWithRetry(`CREATE INDEX IF NOT EXISTS "idx_platform_event_type" ON "PlatformEvent"("eventType");`);
    await executeWithRetry(`CREATE INDEX IF NOT EXISTS "idx_platform_event_user" ON "PlatformEvent"("userId");`);
    await executeWithRetry(`CREATE INDEX IF NOT EXISTS "idx_platform_event_created" ON "PlatformEvent"("createdAt");`);

    // 4. Support Tickets Table
    await executeWithRetry(`
      CREATE TABLE IF NOT EXISTS "SupportTicket" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT REFERENCES "User"(id) ON DELETE SET NULL,
        "userEmail" TEXT NOT NULL,
        "userName" TEXT,
        "category" TEXT NOT NULL DEFAULT 'TECHNICAL',
        "subject" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'OPEN',
        "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
        "internalNotes" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    await executeWithRetry(`CREATE INDEX IF NOT EXISTS "idx_support_ticket_status" ON "SupportTicket"("status");`);
    await executeWithRetry(`CREATE INDEX IF NOT EXISTS "idx_support_ticket_user" ON "SupportTicket"("userId");`);
    await executeWithRetry(`CREATE INDEX IF NOT EXISTS "idx_support_ticket_created" ON "SupportTicket"("createdAt");`);

    // 5. Platform Settings Table
    await executeWithRetry(`
      CREATE TABLE IF NOT EXISTS "PlatformSetting" (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        description TEXT,
        "updatedBy" TEXT,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Seed default settings if empty
    const { rows: settingsCount } = await db.query(`SELECT count(*) FROM "PlatformSetting";`);
    if (parseInt(settingsCount[0]?.count || "0", 10) === 0) {
      await executeWithRetry(`
        INSERT INTO "PlatformSetting" (key, value, description, "updatedBy")
        VALUES 
          ('platform_branding', '{"platformName":"QuoteCraft","tagline":"From Enquiry to Quotation, Faster","primaryColor":"#0F766E","accentColor":"#F59E0B"}'::jsonb, 'Global application branding parameters', 'SYSTEM'),
          ('free_tier_limits', '{"monthlyQuotations":50,"monthlyAiExtractions":30,"maxFileSizeMb":10}'::jsonb, 'Default free plan usage quotas', 'SYSTEM'),
          ('maintenance_mode', '{"enabled":false,"message":"QuoteCraft is undergoing scheduled maintenance. We will be back shortly."}'::jsonb, 'Emergency maintenance control', 'SYSTEM'),
          ('announcements', '{"active":false,"bannerText":"","bannerType":"info"}'::jsonb, 'Top announcement banner broadcast to all users', 'SYSTEM')
        ON CONFLICT (key) DO NOTHING;
      `);
    }

    // 6. Admin Audit Log Table
    await executeWithRetry(`
      CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "adminId" TEXT NOT NULL,
        "adminEmail" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "targetEntity" TEXT NOT NULL,
        "targetId" TEXT,
        "details" JSONB DEFAULT '{}'::jsonb,
        "ipAddress" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    await executeWithRetry(`CREATE INDEX IF NOT EXISTS "idx_audit_log_created" ON "AdminAuditLog"("createdAt");`);
    await executeWithRetry(`CREATE INDEX IF NOT EXISTS "idx_audit_log_action" ON "AdminAuditLog"("action");`);

    // 7. Subscription Plans Table
    await executeWithRetry(`
      CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        "priceMonthlyUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "priceYearlyUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "monthlyQuotationLimit" INT NOT NULL DEFAULT 50,
        "monthlyAiLimit" INT NOT NULL DEFAULT 30,
        "features" JSONB DEFAULT '[]'::jsonb,
        "isActive" BOOLEAN DEFAULT TRUE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Seed default subscription plans if empty
    const { rows: plansCount } = await db.query(`SELECT count(*) FROM "SubscriptionPlan";`);
    if (parseInt(plansCount[0]?.count || "0", 10) === 0) {
      await executeWithRetry(`
        INSERT INTO "SubscriptionPlan" (id, name, description, "priceMonthlyUsd", "priceYearlyUsd", "monthlyQuotationLimit", "monthlyAiLimit", features, "isActive")
        VALUES 
          ('free', 'Starter Free', 'Essential quotation builder for individual marine traders and small suppliers', 0, 0, 30, 20, '["30 Quotes / month","20 AI RFQ Extractions","Standard Marine Templates","PDF Export","Email Support"]'::jsonb, true),
          ('marine_pro', 'Marine Trader Pro', 'Full power for active ship suppliers and equipment distributors', 49, 470, 500, 300, '["500 Quotes / month","300 AI RFQ Extractions","All 4 Commercial Templates","Custom Brand Logo & Palettes","Bank Details on Invoices","Priority Support"]'::jsonb, true),
          ('enterprise', 'Fleet Enterprise', 'Unlimited quotation workflows for large chandleries and multi-port exporters', 149, 1430, 10000, 5000, '["Unlimited Quotes","5,000 AI Extractions","Multi-currency Auto Rates","Custom Watermark & Headers","Dedicated Account Manager","SLA Guarantee"]'::jsonb, true)
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    isBootstrapped = true;
    console.log("Admin Database Schema successfully bootstrapped.");
  } catch (error) {
    console.error("Failed to bootstrap admin database schema:", error);
    throw error;
  }
}
