import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserProfile, upsertUserProfile } from "@/lib/prisma";

// GET /api/user/profile — Load saved settings config for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!userId) {
      return NextResponse.json({ error: "Invalid user session" }, { status: 400 });
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!userId) {
      return NextResponse.json({ error: "Invalid user session" }, { status: 400 });
    }

    const body = await req.json();
    const { company, branding, terms, tableColumns, builderConfig } = body;

    // Strip the logo (base64 image) from branding before storing — it's too large for DB
    // The logo is kept in localStorage only
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

    return NextResponse.json({ message: "Profile saved successfully" });
  } catch (error) {
    console.error("Save Profile Error:", error);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
