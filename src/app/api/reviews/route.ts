import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews, products } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Avval tizimga kiring" }, { status: 401 });

  const body = await req.json();
  const productId = Number(body.productId);
  const rating = Math.min(5, Math.max(1, Number(body.rating)));
  const comment = body.comment ? String(body.comment) : null;

  await db.insert(reviews).values({ productId, userId: user.id, rating, comment });

  const agg = await db
    .select({ avg: sql<number>`avg(rating)::float`, count: sql<number>`count(*)::int` })
    .from(reviews)
    .where(eq(reviews.productId, productId));

  await db
    .update(products)
    .set({ ratingAvg: agg[0].avg ?? 0, ratingCount: agg[0].count ?? 0 })
    .where(eq(products.id, productId));

  return NextResponse.json({ success: true });
}
