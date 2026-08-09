import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminOrResponse } from "@/lib/api-guard";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const { id } = await params;
  const body = await req.json();
  const [row] = await db
    .update(brands)
    .set({ name: body.name, country: body.country, description: body.description, isActive: body.isActive, updatedAt: new Date() })
    .where(eq(brands.id, Number(id)))
    .returning();
  return NextResponse.json({ brand: row });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const { id } = await params;
  await db.delete(brands).where(eq(brands.id, Number(id)));
  return NextResponse.json({ success: true });
}
