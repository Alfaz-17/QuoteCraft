import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/clerk-auth";
import { getUserProfile, upsertUserProfile } from "@/lib/prisma";

// GET /api/user/profile — Load saved settings config for the logged-in user
export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getUserProfile(userId);

    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Load Profile Error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

// POST /api/user/profile — Save settings config (company, branding, terms, tableColumns, builderConfig)
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { company, branding, terms, tableColumns, builderConfig } = body;

    // Strip the logo (base64 image) from branding before storing
    const brandingWithoutLogo = branding
      ? { ...branding, logo: null }
      : {};

    await upsertUserProfile(userId, {
      company: company ?? {},
      branding: brandingWithoutLogo,
      terms: terms ?? "",
      tableColumns: tableColumns ?? [],
      builderConfig: builderConfig ?? {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save Profile Error:", error);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
