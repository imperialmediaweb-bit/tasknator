import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const membership = await db.membership.findFirst({
      where: { userId: user.id },
      include: { workspace: { include: { subscription: true, businessProfiles: true } } },
    });

    if (!membership) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    const body = await req.json();

    const profile = await db.businessProfile.create({
      data: {
        workspaceId: membership.workspaceId,
        name: body.name,
        industry: body.industry,
        country: body.country,
        city: body.city || null,
        websiteUrl: body.websiteUrl || null,
        description: body.description || null,
        facebookUrl: body.facebookUrl || null,
        instagramUrl: body.instagramUrl || null,
        tiktokUrl: body.tiktokUrl || null,
        linkedinUrl: body.linkedinUrl || null,
        googleBusinessUrl: body.googleBusinessUrl || null,
        revenueRange: body.revenueRange || null,
        customersMonth: body.customersMonth || null,
        avgOrderValue: body.avgOrderValue || null,
        marketingBudget: body.marketingBudget || null,
        teamSize: body.teamSize || null,
        primaryGoal: body.primaryGoal || null,
        mainPain: body.mainPain || null,
        websiteText: body.websiteText || null,
      },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error: any) {
    console.error("Create business error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const membership = await db.membership.findFirst({
      where: { userId: user.id },
      include: {
        workspace: {
          include: {
            businessProfiles: {
              include: {
                auditRuns: { orderBy: { createdAt: "desc" }, take: 1 },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "No workspace" }, { status: 404 });
    }

    return NextResponse.json(membership.workspace.businessProfiles);
  } catch (error) {
    console.error("Get businesses error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
