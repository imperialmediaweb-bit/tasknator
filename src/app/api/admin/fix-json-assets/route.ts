import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { convertJsonContent } from "@/lib/json-to-markdown";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assets = await db.asset.findMany({
      select: { id: true, content: true, title: true },
    });

    let fixed = 0;
    const fixedAssets: string[] = [];

    for (const asset of assets) {
      const converted = convertJsonContent(asset.content);
      if (converted) {
        await db.asset.update({
          where: { id: asset.id },
          data: { content: converted },
        });
        fixed++;
        fixedAssets.push(asset.title);
      }
    }

    // Also fix asset versions that contain JSON
    const versions = await db.assetVersion.findMany({
      select: { id: true, content: true },
    });

    let fixedVersions = 0;
    for (const version of versions) {
      const converted = convertJsonContent(version.content);
      if (converted) {
        await db.assetVersion.update({
          where: { id: version.id },
          data: { content: converted },
        });
        fixedVersions++;
      }
    }

    return NextResponse.json({
      message: `Fixed ${fixed} assets and ${fixedVersions} versions`,
      fixedAssets,
    });
  } catch (error: any) {
    console.error("Fix JSON assets error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
