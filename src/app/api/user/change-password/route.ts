import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { findUserById, updateUserPassword } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!userId) {
      return NextResponse.json({ error: "Invalid user session" }, { status: 400 });
    }

    const { oldPassword, newPassword } = await req.json();
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect old password" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters long" }, { status: 400 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await updateUserPassword(userId, hashedNewPassword);

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error: any) {
    console.error("Change Password Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update password" }, { status: 500 });
  }
}
