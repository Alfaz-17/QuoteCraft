import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

async function withDatabaseRetry<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const code = (error as { code?: string })?.code || "";
      const transient = /timeout|terminated|connection|ECONNRESET|ETIMEDOUT|EHOSTUNREACH/i.test(message) ||
        ["57P03", "53300", "ECONNRESET", "ETIMEDOUT", "EHOSTUNREACH"].includes(code);
      if (!transient || attempt >= 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
    }
  }
}

// Ensure clerkUserId column exists in PostgreSQL without throwing errors
let hasEnsuredColumn = false;
async function ensureClerkColumn() {
  if (hasEnsuredColumn) return;
  try {
    await withDatabaseRetry(() => db.query(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clerkUserId" TEXT;`
    ));
    await withDatabaseRetry(() => db.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "User_clerkUserId_key" ON "User"("clerkUserId") WHERE "clerkUserId" IS NOT NULL;`
    ));
    hasEnsuredColumn = true;
  } catch (err) {
    // If permission or already exists, continue gracefully
    hasEnsuredColumn = true;
  }
}

export interface AuthenticatedUser {
  id: string; // PostgreSQL User.id (UUID)
  clerkUserId: string;
  name: string | null;
  email: string;
}

/**
 * Resolves the authenticated PostgreSQL User for the current request.
 * - Matches by Clerk User ID first.
 * - If not found, matches by primary email address (linking existing NextAuth users).
 * - If user does not exist in PostgreSQL, creates a new record automatically.
 * Returns null if the request is unauthenticated.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return null;
  }

  await ensureClerkColumn();

  // 1. Check if user already exists by clerkUserId
  try {
    const { rows: byClerk } = await withDatabaseRetry(() => db.query(
      `SELECT id, name, email, "clerkUserId" FROM "User" WHERE "clerkUserId" = $1 LIMIT 1`,
      [clerkUserId]
    ));

    if (byClerk && byClerk[0]) {
      return {
        id: byClerk[0].id,
        clerkUserId,
        name: byClerk[0].name,
        email: byClerk[0].email,
      };
    }
  } catch {
    // Fall back to email lookup
  }

  // 2. Fetch full user details from Clerk to get email
  const user = await currentUser();
  const primaryEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim();
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || null;

  if (!primaryEmail) {
    return null;
  }

  // 3. Check if user exists by email (Migrate / Link existing NextAuth account)
  const { rows: byEmail } = await withDatabaseRetry(() => db.query(
    `SELECT id, name, email FROM "User" WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [primaryEmail]
  ));

  if (byEmail && byEmail[0]) {
    const existingId = byEmail[0].id;
    // Link existing NextAuth record to this Clerk identity
    try {
      await withDatabaseRetry(() => db.query(
        `UPDATE "User" SET "clerkUserId" = $1, "updatedAt" = NOW() WHERE id = $2`,
        [clerkUserId, existingId]
      ));
    } catch {
      // Ignore if column constraint or duplicate
    }

    return {
      id: existingId,
      clerkUserId,
      name: byEmail[0].name || fullName,
      email: byEmail[0].email,
    };
  }

  // 4. Create new User record in PostgreSQL
  const { rows: created } = await withDatabaseRetry(() => db.query(
    `INSERT INTO "User" (id, name, email, "clerkUserId", password, "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, LOWER($2), $3, '', NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET
       "clerkUserId" = COALESCE("User"."clerkUserId", EXCLUDED."clerkUserId"),
       name = COALESCE("User".name, EXCLUDED.name),
       "updatedAt" = NOW()
     RETURNING id, name, email`,
    [fullName, primaryEmail, clerkUserId]
  ));

  return {
    id: created[0].id,
    clerkUserId,
    name: created[0].name,
    email: created[0].email,
  };
}

/**
 * Returns the PostgreSQL user UUID string for the authenticated request,
 * or null if unauthenticated.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const user = await getAuthenticatedUser();
  return user?.id ?? null;
}

