import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, orderStatusHistory, couriers, users, addresses } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Avval tizimga kiring" }, { status: 401 });
  const { id } = await params;

  const [order] = await db.select().from(orders).where(eq(orders.id, Number(id))).limit(1);
  if (!order || (order.userId !== user.id && !["admin", "super_admin", "manager"].includes(user.roleName))) {
    return NextResponse.json({ error: "Buyurtma topilmadi" }, { status: 404 });
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const history = await db
    .select()
    .from(orderStatusHistory)
    .where(eq(orderStatusHistory.orderId, order.id))
    .orderBy(asc(orderStatusHistory.createdAt));

  let courier = null;
  if (order.courierId) {
    const [c] = await db
      .select({ courier: couriers, name: users.fullName, avatar: users.avatarUrl, phone: users.phone })
      .from(couriers)
      .innerJoin(users, eq(couriers.userId, users.id))
      .where(eq(couriers.id, order.courierId))
      .limit(1);
    if (c) courier = { ...c.courier, name: c.name, avatar: c.avatar, phone: c.phone };
  }

  let address = null;
  if (order.addressId) {
    const [a] = await db.select().from(addresses).where(eq(addresses.id, order.addressId)).limit(1);
    address = a ?? null;
  }

  return NextResponse.json({ order, items, history, courier, address });
}
