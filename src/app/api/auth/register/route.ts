import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Email and password (min 8 chars) are required" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    // Create default workspace
    const slug = slugify(name || email.split("@")[0]) + "-" + Math.random().toString(36).slice(2, 6);
    const workspace = await db.workspace.create({
      data: {
        name: name ? `${name}'s Workspace` : "My Workspace",
        slug,
        memberships: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
        subscription: {
          create: {
            planTier: "STARTER",
            status: "active",
          },
        },
      },
    });

    return NextResponse.json({ 
      user: { id: user.id, email: user.email, name: user.name },
      workspace: { id: workspace.id, slug: workspace.slug },
    }, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
