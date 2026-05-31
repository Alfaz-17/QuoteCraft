import { Pool } from "pg";

// Single connection pool reused across serverless invocations
const globalForPg = globalThis as unknown as { pgPool: Pool | undefined };

export const db: Pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Required for Neon / Supabase
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000, // Increased to 15s to allow Neon cold starts
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = db;
}

// ---------------------------------------------------------------------------
// User helpers
// ---------------------------------------------------------------------------

export async function findUserByEmail(email: string) {
  const { rows } = await db.query(
    `SELECT id, name, email, password, "geminiApiKey", "createdAt", "updatedAt"
     FROM "User" WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function findUserById(id: string) {
  const { rows } = await db.query(
    `SELECT id, name, email, password, "geminiApiKey", "createdAt", "updatedAt"
     FROM "User" WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function findUserApiKey(id: string): Promise<string | null> {
  const { rows } = await db.query(
    `SELECT "geminiApiKey" FROM "User" WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0]?.geminiApiKey ?? null;
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  const { rows } = await db.query(
    `INSERT INTO "User" (id, name, email, password, "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, LOWER($2), $3, NOW(), NOW())
     RETURNING id, name, email`,
    [data.name, data.email, data.password]
  );
  return rows[0];
}

export async function updateUserPassword(id: string, hashedPassword: string) {
  await db.query(
    `UPDATE "User" SET password = $1, "updatedAt" = NOW() WHERE id = $2`,
    [hashedPassword, id]
  );
}

export async function updateUserGeminiKey(id: string, geminiApiKey: string | null) {
  await db.query(
    `UPDATE "User" SET "geminiApiKey" = $1, "updatedAt" = NOW() WHERE id = $2`,
    [geminiApiKey, id]
  );
}

// ---------------------------------------------------------------------------
// Quotation helpers
// ---------------------------------------------------------------------------

export async function findQuotationByUserAndNumber(userId: string, number: string) {
  const { rows } = await db.query(
    `SELECT id FROM "Quotation" WHERE "userId" = $1 AND number = $2 LIMIT 1`,
    [userId, number]
  );
  return rows[0] ?? null;
}

export async function createQuotation(data: {
  userId: string;
  number: string;
  type: string;
  date: string;
  validUntil: string;
  vessel: string;
  reference: string;
  scope: string;
  make: string;
  model: string;
  introText: string;
  company: object;
  client: object;
  items: object[];
  terms: string;
  currency: string;
  discount: number;
  discountType: string;
  taxPercent: number;
  shippingCharge: number;
}) {
  const { rows } = await db.query(
    `INSERT INTO "Quotation"
       (id, "userId", number, type, date, "validUntil", vessel, reference, scope, make, model,
        "introText", company, client, items, terms, currency, discount, "discountType",
        "taxPercent", "shippingCharge", "createdAt", "updatedAt")
     VALUES
       (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
     RETURNING id`,
    [
      data.userId, data.number, data.type, data.date, data.validUntil,
      data.vessel, data.reference, data.scope, data.make, data.model,
      data.introText,
      JSON.stringify(data.company), JSON.stringify(data.client), JSON.stringify(data.items),
      data.terms, data.currency, data.discount, data.discountType,
      data.taxPercent, data.shippingCharge,
    ]
  );
  return rows[0];
}

export async function updateQuotation(id: string, data: {
  type: string;
  date: string;
  validUntil: string;
  vessel: string;
  reference: string;
  scope: string;
  make: string;
  model: string;
  introText: string;
  company: object;
  client: object;
  items: object[];
  terms: string;
  currency: string;
  discount: number;
  discountType: string;
  taxPercent: number;
  shippingCharge: number;
}) {
  await db.query(
    `UPDATE "Quotation" SET
       type=$1, date=$2, "validUntil"=$3, vessel=$4, reference=$5, scope=$6,
       make=$7, model=$8, "introText"=$9, company=$10, client=$11, items=$12,
       terms=$13, currency=$14, discount=$15, "discountType"=$16,
       "taxPercent"=$17, "shippingCharge"=$18, "updatedAt"=NOW()
     WHERE id=$19`,
    [
      data.type, data.date, data.validUntil, data.vessel, data.reference, data.scope,
      data.make, data.model, data.introText,
      JSON.stringify(data.company), JSON.stringify(data.client), JSON.stringify(data.items),
      data.terms, data.currency, data.discount, data.discountType,
      data.taxPercent, data.shippingCharge, id,
    ]
  );
}

// ---------------------------------------------------------------------------
// UserProfile helpers — stores settings config per user
// ---------------------------------------------------------------------------

export interface UserProfileData {
  company: object;
  branding: object;
  terms: string;
  tableColumns: object[];
  builderConfig: object;
}

export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  const { rows } = await db.query(
    `SELECT company, branding, terms, "tableColumns", "builderConfig"
     FROM "UserProfile" WHERE "userId" = $1 LIMIT 1`,
    [userId]
  );
  return rows[0] ?? null;
}

export async function upsertUserProfile(userId: string, data: UserProfileData) {
  await db.query(
    `INSERT INTO "UserProfile" ("userId", company, branding, terms, "tableColumns", "builderConfig", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT ("userId") DO UPDATE SET
       company = EXCLUDED.company,
       branding = EXCLUDED.branding,
       terms = EXCLUDED.terms,
       "tableColumns" = EXCLUDED."tableColumns",
       "builderConfig" = EXCLUDED."builderConfig",
       "updatedAt" = NOW()`,
    [
      userId,
      JSON.stringify(data.company),
      JSON.stringify(data.branding),
      data.terms,
      JSON.stringify(data.tableColumns),
      JSON.stringify(data.builderConfig),
    ]
  );
}
