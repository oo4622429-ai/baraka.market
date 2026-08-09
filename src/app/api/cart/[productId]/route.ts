import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { carts, cartItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Avval tizimga kiring" }, { status: 401 });
  const { productId } = await params;
  const body = await req.json();
  const quantity = Number(body.quantity);

  const [cart] = await db.select().from(carts).where(eq(carts.userId, user.id)).limit(1);
  if (!cart) return NextResponse.json({ error: "Savatcha topilmadi" }, { status: 404 });

  if (quantity <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, Number(productId))));
  } else {
    await db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, Number(productId))));
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Avval tizimga kiring" }, { status: 401 });
  const { productId } = await params;

  const [cart] = await db.select().from(carts).where(eq(carts.userId, user.id)).limit(1);
  if (!cart) return NextResponse.json({ error: "Savatcha topilmadi" }, { status: 404 });

  await db.delete(cartItems).where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, Number(productId))));
  return NextResponse.json({ success: true });
}
