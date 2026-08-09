import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminOrResponse } from "@/lib/api-guard";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const { id } = await params;
  const body = await req.json();
  const [row] = await db
    .update(banners)
    .set({ titleUz: body.titleUz, isActive: body.isActive, sortOrder: body.sortOrder, updatedAt: new Date() })
    .where(eq(banners.id, Number(id)))
    .returning();
  return NextResponse.json({ banner: row });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const { id } = await params;
  await db.delete(banners).where(eq(banners.id, Number(id)));
  return NextResponse.json({ success: true });
}
