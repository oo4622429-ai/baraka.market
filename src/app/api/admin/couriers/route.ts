import { NextResponse } from "next/server";
import { db } from "@/db";
import { couriers, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminOrResponse } from "@/lib/api-guard";

export async function GET() {
  const { response } = await requireAdminOrResponse();
  if (response) return response;

  const rows = await db
    .select({ courier: couriers, name: users.fullName, phone: users.phone, avatar: users.avatarUrl })
    .from(couriers)
    .innerJoin(users, eq(couriers.userId, users.id));

  return NextResponse.json({ couriers: rows.map((r) => ({ ...r.courier, name: r.name, phone: r.phone, avatar: r.avatar })) });
}
