import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { couriers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminOrResponse } from "@/lib/api-guard";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const { id } = await params;
  const body = await req.json();
  const [row] = await db
    .update(couriers)
    .set({ isActive: body.isActive, isOnline: body.isOnline, vehicleType: body.vehicleType, updatedAt: new Date() })
    .where(eq(couriers.id, Number(id)))
    .returning();
  return NextResponse.json({ courier: row });
}
