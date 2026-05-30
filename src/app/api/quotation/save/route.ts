import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const userId = (session.user as any).id; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!userId) {
      return NextResponse.json({ error: "Invalid user session" }, { status: 400 });
    }

    const state = await req.json();
    const { documentInfo, company, client, items, terms, currency, discount, discountType, taxPercent, shippingCharge, introText } = state;

    if (!documentInfo?.number) {
      return NextResponse.json({ error: "Missing document number" }, { status: 400 });
    }

    // Find if a quotation with this number and userId already exists
    const existing = await prisma.quotation.findFirst({
      where: {
        userId,
        number: documentInfo.number,
      }
    });

    let quotation;
    if (existing) {
      // Update existing
      quotation = await prisma.quotation.update({
        where: { id: existing.id },
        data: {
          type: documentInfo.type || "quotation",
          date: documentInfo.date || "",
          validUntil: documentInfo.validUntil || "",
          vessel: documentInfo.vessel || "",
          reference: documentInfo.reference || "",
          scope: documentInfo.scope || "",
          make: documentInfo.make || "",
          model: documentInfo.model || "",
          introText: introText || "",
          company: company || {},
          client: client || {},
          items: items || [],
          terms: terms || "",
          currency: currency || "USD",
          discount: parseFloat(discount) || 0,
          discountType: discountType || "flat",
          taxPercent: parseFloat(taxPercent) || 0,
          shippingCharge: parseFloat(shippingCharge) || 0,
        }
      });
    } else {
      // Create new
      quotation = await prisma.quotation.create({
        data: {
          userId,
          number: documentInfo.number,
          type: documentInfo.type || "quotation",
          date: documentInfo.date || "",
          validUntil: documentInfo.validUntil || "",
          vessel: documentInfo.vessel || "",
          reference: documentInfo.reference || "",
          scope: documentInfo.scope || "",
          make: documentInfo.make || "",
          model: documentInfo.model || "",
          introText: introText || "",
          company: company || {},
          client: client || {},
          items: items || [],
          terms: terms || "",
          currency: currency || "USD",
          discount: parseFloat(discount) || 0,
          discountType: discountType || "flat",
          taxPercent: parseFloat(taxPercent) || 0,
          shippingCharge: parseFloat(shippingCharge) || 0,
        }
      });
    }

    return NextResponse.json({
      message: "Sync successful",
      quotationId: quotation.id,
    });
  } catch (error) {
    console.error("Save Quotation Error:", error);
    return NextResponse.json({ error: "Failed to save quotation to cloud" }, { status: 500 });
  }
}
