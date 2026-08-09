import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderStatusHistory, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminOrResponse } from "@/lib/api-guard";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAdminOrResponse();
  if (response) return response;
  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.status) updates.status = body.status;
  if (body.courierId !== undefined) updates.courierId = body.courierId ? Number(body.courierId) : null;
  if (body.paymentStatus) updates.paymentStatus = body.paymentStatus;
  if (body.status === "delivered") updates.deliveredAt = new Date();

  const [order] = await db.update(orders).set(updates).where(eq(orders.id, Number(id))).returning();

  if (body.status) {
    await db.insert(orderStatusHistory).values({
      orderId: order.id,
      status: body.status,
      note: body.note || `Holat "${body.status}" ga o'zgartirildi`,
      changedBy: user!.id,
    });
    await db.insert(notifications).values({
      userId: order.userId,
      titleUz: "Buyurtma holati yangilandi",
      titleRu: "Статус заказа обновлен",
      titleEn: "Order status updated",
      body: `Buyurtma #${order.orderNumber} holati: ${body.status}`,
      type: "order",
      relatedEntity: "order",
      relatedId: order.id,
    });
  }

  return NextResponse.json({ order });
}
