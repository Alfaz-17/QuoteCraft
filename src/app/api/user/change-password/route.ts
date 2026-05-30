import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid user session" }, { status: 400 });
    }

    const { oldPassword, newPassword } = await req.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Load all users from our local JSON file DB
    const DATA_DIR = path.join(process.cwd(), "data");
    const USERS_FILE = path.join(DATA_DIR, "users.json");
    
    if (!fs.existsSync(USERS_FILE)) {
      return NextResponse.json({ error: "User database not initialized" }, { status: 500 });
    }

    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8") || "[]");
    const userIndex = users.findIndex((u: any) => u.id === userId);

    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[userIndex];

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect old password" }, { status: 400 });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Save the updated password
    user.password = hashedNewPassword;
    user.updatedAt = new Date().toISOString();
    users[userIndex] = user;

    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error: any) {
    console.error("Change Password Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update password" }, { status: 500 });
  }
}
