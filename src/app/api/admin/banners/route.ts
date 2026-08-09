import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { asc } from "drizzle-orm";
import { requireAdminOrResponse } from "@/lib/api-guard";

export async function GET() {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const rows = await db.select().from(banners).orderBy(asc(banners.sortOrder));
  return NextResponse.json({ banners: rows });
}

export async function POST(req: NextRequest) {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const body = await req.json();
  const [row] = await db
    .insert(banners)
    .values({
      titleUz: body.titleUz,
      titleRu: body.titleRu || body.titleUz,
      titleEn: body.titleEn || body.titleUz,
      imageUrl: body.imageUrl || "https://loremflickr.com/1200/500/grocery,supermarket?lock=1",
      linkType: body.linkType || "none",
      linkValue: body.linkValue || null,
      sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
    })
    .returning();
  return NextResponse.json({ banner: row });
}
