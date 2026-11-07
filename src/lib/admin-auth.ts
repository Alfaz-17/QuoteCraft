import { getAuthenticatedUser } from "@/lib/clerk-auth";
import { db } from "@/lib/prisma";
import { headers } from "next/headers";

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: "SUPER_ADMIN";
  status: "ACTIVE";
}

/**
 * Checks if the given email is an authorized owner email.
 */
export function isAuthorizedOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  const ownerEmails = (process.env.OWNER_EMAILS || "alfazbilakhiya17@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return ownerEmails.includes(email.trim().toLowerCase());
}

/**
 * Resolves the authenticated super admin from Clerk session and PostgreSQL user record.
 * Never trusts client headers or frontend tokens.
 */
export async function getAuthenticatedAdmin(): Promise<AdminUser | null> {
  const authUser = await getAuthenticatedUser();
  if (!authUser) return null;

  try {
    const { rows } = await db.query(
      `SELECT id, name, email, role, status FROM "User" WHERE id = $1 LIMIT 1`,
      [authUser.id]
    );

    if (!rows || rows.length === 0) return null;
    const user = rows[0];

    // If owner email matches, ensure SUPER_ADMIN role
    const isOwner = isAuthorizedOwnerEmail(user.email);
    if (isOwner && user.role !== "SUPER_ADMIN") {
      await db.query(`UPDATE "User" SET role = 'SUPER_ADMIN' WHERE id = $1`, [user.id]);
      user.role = "SUPER_ADMIN";
    }

    if (user.role !== "SUPER_ADMIN") return null;
    if (user.status !== "ACTIVE") return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    };
  } catch (err) {
    console.error("Admin verification error:", err);
    return null;
  }
}

/**
 * Strict server helper for API routes: enforces SUPER_ADMIN authorization.
 * Returns the admin user or throws a 401/403 HTTP error object.
 */
export async function requireSuperAdmin(): Promise<AdminUser> {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    throw new Error("UNAUTHORIZED_ADMIN");
  }
  return admin;
}

/**
 * Audit Logger: Persists every administrative action for accountability.
 */
export async function logAdminAction(data: {
  adminId: string;
  adminEmail: string;
  action: string;
  targetEntity: string;
  targetId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
}): Promise<void> {
  try {
    let clientIp = data.ipAddress;
    if (!clientIp) {
      try {
        const headerList = await headers();
        clientIp =
          headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          headerList.get("x-real-ip") ||
          "127.0.0.1";
      } catch {
        clientIp = "internal";
      }
    }

    await db.query(
      `INSERT INTO "AdminAuditLog" 
         (id, "adminId", "adminEmail", action, "targetEntity", "targetId", details, "ipAddress", "createdAt")
       VALUES 
         (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        data.adminId,
        data.adminEmail,
        data.action,
        data.targetEntity,
        data.targetId || null,
        JSON.stringify(data.details || {}),
        clientIp,
      ]
    );
  } catch (err) {
    console.error("Failed to log admin action:", err);
  }
}

/**
 * Platform Event Tracker for product analytics & funnel monitoring.
 */
export async function trackPlatformEvent(data: {
  userId?: string | null;
  eventType:
    | "RFQ_UPLOAD"
    | "EXTRACTION_SUCCESS"
    | "EXTRACTION_FAIL"
    | "QUOTE_SAVED"
    | "PDF_EXPORTED"
    | "USER_SIGNUP"
    | "USER_LOGIN";
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.query(
      `INSERT INTO "PlatformEvent" (id, "userId", "eventType", metadata, "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
      [data.userId || null, data.eventType, JSON.stringify(data.metadata || {})]
    );
  } catch (err) {
    console.error("Platform event tracking error:", err);
  }
}

/**
 * AI Usage & Cost Logger: Logs every document analysis attempt with token counts and calculated cost.
 */
export async function logAiUsage(data: {
  userId?: string | null;
  userEmail?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  method: "deterministic_excel" | "ai_fallback" | "manual";
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  durationMs?: number;
  itemCount?: number;
  status: "SUCCESS" | "FAILED";
  errorMessage?: string | null;
}): Promise<void> {
  try {
    const input = data.inputTokens || 0;
    const output = data.outputTokens || 0;
    const total = data.totalTokens || input + output;

    // Gemini 2.5 Flash pricing: $0.075 / 1M prompt tokens, $0.30 / 1M completion tokens
    // Deterministic Excel uses $0.00 LLM cost
    const inputCost = (input / 1_000_000) * 0.075;
    const outputCost = (output / 1_000_000) * 0.30;
    const estimatedCostUsd = data.method === "deterministic_excel" ? 0.0 : +(inputCost + outputCost).toFixed(6);

    await db.query(
      `INSERT INTO "AiUsageLog"
         (id, "userId", "userEmail", "fileName", "mimeType", method, model, "inputTokens", "outputTokens",
          "totalTokens", "estimatedCostUsd", "durationMs", "itemCount", status, "errorMessage", "createdAt")
       VALUES
         (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())`,
      [
        data.userId || null,
        data.userEmail || null,
        data.fileName || null,
        data.mimeType || null,
        data.method,
        data.model || "gemini-2.5-flash",
        input,
        output,
        total,
        estimatedCostUsd,
        data.durationMs || 0,
        data.itemCount || 0,
        data.status,
        data.errorMessage || null,
      ]
    );
  } catch (err) {
    console.error("Failed to log AI usage:", err);
  }
}
