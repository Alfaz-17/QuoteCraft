import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email, password } = await req.json();
    const identifier = (phone || email || "").toLowerCase().trim();

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters long" }, { status: 400 });
    }

    if (!identifier) {
      return NextResponse.json({ error: "Missing phone number or email" }, { status: 400 });
    }

    // Basic phone validation (allowing +, numbers, spaces, dashes, parentheses)
    const phoneRegex = /^[+]?[0-9\s\-()]{7,25}$/;
    if (!phoneRegex.test(identifier)) {
      return NextResponse.json({ error: "Please enter a valid phone number (at least 7 digits)" }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: identifier }
    });

    if (existing) {
      return NextResponse.json({ error: "User with this phone number is already registered" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: identifier,
        password: hashedPassword,
      }
    });

    return NextResponse.json({
      message: "User registered successfully",
      user: { id: user.id, name: user.name, email: user.email }
    }, { status: 201 });
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
