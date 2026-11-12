import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { db } from "@/lib/prisma";

interface ClerkUserPayload {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  primary_email_address_id?: string | null;
  email_addresses?: { id: string; email_address: string }[];
}

export async function POST(req: NextRequest) {
  // Reject anything not signed by Clerk (Svix); unsigned payloads could hijack accounts by email.
  let eventType: string;
  let data: ClerkUserPayload;
  try {
    const evt = await verifyWebhook(req);
    eventType = evt.type;
    data = evt.data as ClerkUserPayload;
  } catch (err) {
    console.error("Clerk webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    if (!eventType || !data) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const clerkUserId = data.id;
    const emails = data.email_addresses ?? [];
    const primaryEmail = (emails.find((e) => e.id === data.primary_email_address_id) ?? emails[0])
      ?.email_address?.toLowerCase().trim();
    const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || null;

    if (eventType === "user.created" || eventType === "user.updated") {
      if (!clerkUserId || !primaryEmail) {
        return NextResponse.json({ received: true });
      }

      // Check if user already exists by clerkUserId
      const { rows: existingByClerk } = await db.query(
        `SELECT id FROM "User" WHERE "clerkUserId" = $1 LIMIT 1`,
        [clerkUserId]
      );

      if (existingByClerk.length > 0) {
        await db.query(
          `UPDATE "User" SET name = COALESCE($1, name), email = LOWER($2), "updatedAt" = NOW() WHERE "clerkUserId" = $3`,
          [name, primaryEmail, clerkUserId]
        );
      } else {
        // Check by email to link existing NextAuth user
        const { rows: existingByEmail } = await db.query(
          `SELECT id FROM "User" WHERE LOWER(email) = LOWER($1) LIMIT 1`,
          [primaryEmail]
        );

        if (existingByEmail.length > 0) {
          await db.query(
            `UPDATE "User" SET "clerkUserId" = $1, name = COALESCE($2, name), "updatedAt" = NOW() WHERE id = $3`,
            [clerkUserId, name, existingByEmail[0].id]
          );
        } else {
          // Insert new user
          await db.query(
            `INSERT INTO "User" (id, name, email, "clerkUserId", password, "createdAt", "updatedAt")
             VALUES (gen_random_uuid(), $1, LOWER($2), $3, '', NOW(), NOW())
             ON CONFLICT (email) DO UPDATE SET "clerkUserId" = EXCLUDED."clerkUserId"`,
            [name, primaryEmail, clerkUserId]
          );
        }
      }
    } else if (eventType === "user.deleted") {
      // Safe account handling
      if (clerkUserId) {
        await db.query(
          `UPDATE "User" SET "clerkUserId" = NULL, "updatedAt" = NOW() WHERE "clerkUserId" = $1`,
          [clerkUserId]
        );
      }
    }

    return NextResponse.json({ success: true, eventType });
  } catch (error) {
    console.error("Clerk Webhook Error:", error);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}

