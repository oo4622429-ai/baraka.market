import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminOrResponse } from "@/lib/api-guard";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const { id } = await params;
  const body = await req.json();
  const [row] = await db
    .update(users)
    .set({ isActive: body.isActive, fullName: body.fullName, updatedAt: new Date() })
    .where(eq(users.id, Number(id)))
    .returning();
  return NextResponse.json({ user: row });
}
