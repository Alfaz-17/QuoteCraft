import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/clerk-auth";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    const body = await req.json();

    const { subject, message, category } = body;
    const userEmail = authUser?.email || body.email?.trim();
    const userName = authUser?.name || body.name?.trim() || "Customer";

    if (!userEmail || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Please provide your email, a subject, and a message description." },
        { status: 400 }
      );
    }

    // Rate limit: 5 submissions per 10 minutes per IP/User
    const rateLimit = checkRateLimit(`support:${authUser?.id || userEmail}`, 5, 600_000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many feedback submissions. Please wait before submitting again." },
        { status: 429 }
      );
    }

    const { rows } = await db.query(
      `
      INSERT INTO "SupportTicket"
        (id, "userId", "userEmail", "userName", category, subject, message, status, priority, "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'OPEN', 'MEDIUM', NOW(), NOW())
      RETURNING id, subject, status, "createdAt";
      `,
      [
        authUser?.id || null,
        userEmail,
        userName,
        category || "FEEDBACK",
        subject.trim(),
        message.trim(),
      ]
    );

    return NextResponse.json({
      success: true,
      ticket: rows[0],
      message: "Thank you! Your feedback has been received and logged for review.",
    });
  } catch (error) {
    console.error("Support Ticket Submission Error:", error);
    return NextResponse.json({ error: "Failed to submit support request" }, { status: 500 });
  }
}

