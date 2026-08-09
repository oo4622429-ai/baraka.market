import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { promotions } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireAdminOrResponse } from "@/lib/api-guard";

export async function GET() {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const rows = await db.select().from(promotions).orderBy(desc(promotions.createdAt));
  return NextResponse.json({ promotions: rows });
}

export async function POST(req: NextRequest) {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const body = await req.json();
  const [row] = await db
    .insert(promotions)
    .values({
      titleUz: body.titleUz,
      titleRu: body.titleRu || body.titleUz,
      titleEn: body.titleEn || body.titleUz,
      descriptionUz: body.descriptionUz || null,
      imageUrl: body.imageUrl || "https://loremflickr.com/900/400/grocery,sale?lock=1",
      discountPercent: Number(body.discountPercent || 0),
      categoryId: body.categoryId ? Number(body.categoryId) : null,
      startsAt: new Date(body.startsAt || Date.now()),
      endsAt: new Date(body.endsAt || Date.now() + 30 * 86400000),
    })
    .returning();
  return NextResponse.json({ promotion: row });
}
