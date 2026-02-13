import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const existing = await db.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: "Already subscribed!" });
    }

    await db.newsletterSubscriber.create({ data: { email } });
    return NextResponse.json({ message: "Subscribed successfully!" }, { status: 201 });
  } catch (error: any) {
    console.error("Newsletter error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
