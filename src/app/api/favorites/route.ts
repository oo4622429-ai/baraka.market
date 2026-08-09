import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { favorites, products } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ items: [] });

  const items = await db
    .select({ id: favorites.id, product: products })
    .from(favorites)
    .innerJoin(products, eq(favorites.productId, products.id))
    .where(eq(favorites.userId, user.id));

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Avval tizimga kiring" }, { status: 401 });
  const { productId } = await req.json();

  const [existing] = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, user.id), eq(favorites.productId, Number(productId))))
    .limit(1);

  if (existing) {
    await db.delete(favorites).where(eq(favorites.id, existing.id));
    return NextResponse.json({ success: true, favorited: false });
  }

  await db.insert(favorites).values({ userId: user.id, productId: Number(productId) });
  return NextResponse.json({ success: true, favorited: true });
}
