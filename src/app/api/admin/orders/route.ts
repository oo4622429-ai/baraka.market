import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAdminOrResponse } from "@/lib/api-guard";

export async function GET(req: NextRequest) {
  const { response } = await requireAdminOrResponse();
  if (response) return response;

  const status = req.nextUrl.searchParams.get("status");

  const rows = await db
    .select({ order: orders, customerName: users.fullName, customerPhone: users.phone })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(status ? eq(orders.status, status) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(200);

  return NextResponse.json({
    orders: rows.map((r) => ({ ...r.order, customerName: r.customerName, customerPhone: r.customerPhone })),
  });
}
