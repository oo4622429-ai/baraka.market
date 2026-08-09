import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { carts, cartItems, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

async function ensureCart(userId: number) {
  let [cart] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
  if (!cart) {
    [cart] = await db.insert(carts).values({ userId }).returning();
  }
  return cart;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ items: [] });

  const cart = await ensureCart(user.id);
  const items = await db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      product: products,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cart.id));

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Avval tizimga kiring" }, { status: 401 });

  const body = await req.json();
  const productId = Number(body.productId);
  const quantity = Math.max(1, Number(body.quantity || 1));

  const cart = await ensureCart(user.id);
  const [existing] = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.cartId, cart.id))
    .then((rows) => rows.filter((r) => r.productId === productId));

  if (existing) {
    await db
      .update(cartItems)
      .set({ quantity: existing.quantity + quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, existing.id));
  } else {
    await db.insert(cartItems).values({ cartId: cart.id, productId, quantity });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Avval tizimga kiring" }, { status: 401 });
  const cart = await ensureCart(user.id);
  await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  return NextResponse.json({ success: true });
}
