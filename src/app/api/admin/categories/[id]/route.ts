import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminOrResponse } from "@/lib/api-guard";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const { id } = await params;
  const body = await req.json();
  const [row] = await db
    .update(categories)
    .set({
      nameUz: body.nameUz,
      nameRu: body.nameRu,
      nameEn: body.nameEn,
      icon: body.icon,
      imageUrl: body.imageUrl,
      sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
      isActive: body.isActive,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, Number(id)))
    .returning();
  return NextResponse.json({ category: row });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const { id } = await params;
  await db.delete(categories).where(eq(categories.id, Number(id)));
  return NextResponse.json({ success: true });
}
