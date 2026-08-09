import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ addresses: [] });
  const rows = await db.select().from(addresses).where(eq(addresses.userId, user.id)).orderBy(desc(addresses.isDefault));
  return NextResponse.json({ addresses: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Avval tizimga kiring" }, { status: 401 });
  const body = await req.json();

  if (body.isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
  }

  const [row] = await db
    .insert(addresses)
    .values({
      userId: user.id,
      title: body.title || "Uy",
      region: body.region,
      city: body.city,
      street: body.street,
      building: body.building,
      apartment: body.apartment,
      entrance: body.entrance,
      floor: body.floor,
      comment: body.comment,
      lat: body.lat,
      lng: body.lng,
      isDefault: !!body.isDefault,
    })
    .returning();

  return NextResponse.json({ address: row });
}
