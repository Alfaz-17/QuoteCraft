import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, logAdminAction } from "@/lib/admin-auth";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const rateLimit = checkRateLimit(`admin:revenue:${admin.id}`, 60, 60_000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    // 1. Fetch configured subscription plans
    const { rows: plans } = await db.query(
      `SELECT id, name, description, "priceMonthlyUsd", "priceYearlyUsd", 
              "monthlyQuotationLimit", "monthlyAiLimit", features, "isActive", "updatedAt"
       FROM "SubscriptionPlan"
       ORDER BY "priceMonthlyUsd" ASC;`
    );

    // 2. Count total registered users
    const { rows: userCountRes } = await db.query(`SELECT count(*) FROM "User";`);
    const totalUsers = parseInt(userCountRes[0].count, 10);

    return NextResponse.json({
      billingIntegrationStatus: {
        integrated: false,
        provider: "Pending (Ready for Stripe / Razorpay Webhooks)",
        message: "No live payment processor is connected yet. User tiers currently run on default trial / starter quotas. Revenue figures reflect zero until merchant keys are configured.",
      },
      summary: {
        totalRegisteredUsers: totalUsers,
        activePaidSubscriptions: 0,
        mrrUsd: 0.0,
        totalRevenueUsd: 0.0,
      },
      plans,
    });
  } catch (error: unknown) {
    const msg = (error as Error)?.message;
    if (msg === "UNAUTHORIZED_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("Admin Revenue Error:", error);
    return NextResponse.json({ error: "Failed to fetch revenue settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const body = await req.json();
    const {
      planId,
      name,
      description,
      priceMonthlyUsd,
      priceYearlyUsd,
      monthlyQuotationLimit,
      monthlyAiLimit,
      features,
      isActive,
    } = body;

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    const { rows } = await db.query(
      `UPDATE "SubscriptionPlan" SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         "priceMonthlyUsd" = COALESCE($3, "priceMonthlyUsd"),
         "priceYearlyUsd" = COALESCE($4, "priceYearlyUsd"),
         "monthlyQuotationLimit" = COALESCE($5, "monthlyQuotationLimit"),
         "monthlyAiLimit" = COALESCE($6, "monthlyAiLimit"),
         features = COALESCE($7, features),
         "isActive" = COALESCE($8, "isActive"),
         "updatedAt" = NOW()
       WHERE id = $9
       RETURNING *;`,
      [
        name,
        description,
        priceMonthlyUsd,
        priceYearlyUsd,
        monthlyQuotationLimit,
        monthlyAiLimit,
        features ? JSON.stringify(features) : null,
        isActive,
        planId,
      ]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const updatedPlan = rows[0];

    // Log admin action
    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "UPDATE_SUBSCRIPTION_PLAN",
      targetEntity: "SubscriptionPlan",
      targetId: planId,
      details: {
        planName: updatedPlan.name,
        priceMonthlyUsd: updatedPlan.priceMonthlyUsd,
        monthlyQuotationLimit: updatedPlan.monthlyQuotationLimit,
      },
    });

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      message: `Plan "${updatedPlan.name}" updated successfully.`,
    });
  } catch (error: unknown) {
    const msg = (error as Error)?.message;
    if (msg === "UNAUTHORIZED_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("Admin Plan Update Error:", error);
    return NextResponse.json({ error: "Failed to update subscription plan" }, { status: 500 });
  }
}
