import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, logAdminAction } from "@/lib/admin-auth";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireSuperAdmin();
    const rateLimit = checkRateLimit(`admin:settings:${admin.id}`, 60, 60_000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { rows } = await db.query(
      `SELECT key, value, description, "updatedBy", "updatedAt" FROM "PlatformSetting" ORDER BY key ASC;`
    );

    const settingsMap: Record<string, unknown> = {};
    for (const r of rows) {
      settingsMap[r.key] = r.value;
    }

    return NextResponse.json({
      settings: settingsMap,
      raw: rows,
    });
  } catch (error: unknown) {
    const msg = (error as Error)?.message;
    if (msg === "UNAUTHORIZED_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("Admin Settings GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch platform settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Setting key and value are required" }, { status: 400 });
    }

    await db.query(
      `
      INSERT INTO "PlatformSetting" (key, value, "updatedBy", "updatedAt")
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        "updatedBy" = EXCLUDED."updatedBy",
        "updatedAt" = NOW();
      `,
      [key, JSON.stringify(value), admin.email]
    );

    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "UPDATE_PLATFORM_SETTING",
      targetEntity: "PlatformSetting",
      targetId: key,
      details: { key, updatedValue: value },
    });

    return NextResponse.json({
      success: true,
      key,
      value,
      message: `Platform setting "${key}" updated successfully.`,
    });
  } catch (error: unknown) {
    const msg = (error as Error)?.message;
    if (msg === "UNAUTHORIZED_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("Admin Settings PATCH Error:", error);
    return NextResponse.json({ error: "Failed to save platform setting" }, { status: 500 });
  }
}

