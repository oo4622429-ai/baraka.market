import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { asc } from "drizzle-orm";
import { requireAdminOrResponse } from "@/lib/api-guard";
import { slugify } from "@/lib/format";

export async function GET() {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const rows = await db.select().from(brands).orderBy(asc(brands.name));
  return NextResponse.json({ brands: rows });
}

export async function POST(req: NextRequest) {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const body = await req.json();
  const [row] = await db
    .insert(brands)
    .values({
      name: body.name,
      slug: `${slugify(body.name)}-${Date.now().toString().slice(-5)}`,
      logoUrl: body.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(body.name)}`,
      country: body.country || null,
      description: body.description || null,
    })
    .returning();
  return NextResponse.json({ brand: row });
}
