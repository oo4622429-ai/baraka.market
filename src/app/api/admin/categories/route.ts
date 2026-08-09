import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { asc } from "drizzle-orm";
import { requireAdminOrResponse } from "@/lib/api-guard";
import { slugify } from "@/lib/format";

export async function GET() {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  return NextResponse.json({ categories: rows });
}

export async function POST(req: NextRequest) {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const body = await req.json();
  const [row] = await db
    .insert(categories)
    .values({
      nameUz: body.nameUz,
      nameRu: body.nameRu || body.nameUz,
      nameEn: body.nameEn || body.nameUz,
      slug: `${slugify(body.nameEn || body.nameUz)}-${Date.now().toString().slice(-5)}`,
      icon: body.icon || "🛒",
      imageUrl: body.imageUrl || null,
      sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
    })
    .returning();
  return NextResponse.json({ category: row });
}
