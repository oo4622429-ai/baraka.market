import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminOrResponse } from "@/lib/api-guard";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const { id } = await params;
  const body = await req.json();
  const [row] = await db
    .update(coupons)
    .set({ isActive: body.isActive, updatedAt: new Date() })
    .where(eq(coupons.id, Number(id)))
    .returning();
  return NextResponse.json({ coupon: row });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const { id } = await params;
  await db.delete(coupons).where(eq(coupons.id, Number(id)));
  return NextResponse.json({ success: true });
}
