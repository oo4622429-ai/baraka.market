import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, products, users, roles, orderItems } from "@/db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { requireAdminOrResponse } from "@/lib/api-guard";

export async function GET() {
  const { response } = await requireAdminOrResponse();
  if (response) return response;

  const [totalOrders] = await db.select({ count: sql<number>`count(*)::int` }).from(orders);
  const [totalRevenue] = await db
    .select({ sum: sql<number>`coalesce(sum(total),0)::float` })
    .from(orders)
    .where(eq(orders.paymentStatus, "paid"));
  const [totalProducts] = await db.select({ count: sql<number>`count(*)::int` }).from(products);
  const [customerRole] = await db.select().from(roles).where(eq(roles.name, "customer")).limit(1);
  const [totalCustomers] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.roleId, customerRole?.id ?? -1));

  const statusBreakdown = await db
    .select({ status: orders.status, count: sql<number>`count(*)::int` })
    .from(orders)
    .groupBy(orders.status);

  const last7days = await db
    .select({
      day: sql<string>`to_char(created_at, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(total),0)::float`,
    })
    .from(orders)
    .where(gte(orders.createdAt, sql`now() - interval '7 days'`))
    .groupBy(sql`to_char(created_at, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(created_at, 'YYYY-MM-DD')`);

  const topProducts = await db
    .select({
      productId: orderItems.productId,
      name: sql<string>`max(product_name_snapshot)`,
      qty: sql<number>`sum(quantity)::int`,
      revenue: sql<number>`sum(total)::float`,
    })
    .from(orderItems)
    .groupBy(orderItems.productId)
    .orderBy(desc(sql`sum(quantity)`))
    .limit(5);

  const recentOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(8);

  return NextResponse.json({
    totalOrders: totalOrders.count,
    totalRevenue: totalRevenue.sum,
    totalProducts: totalProducts.count,
    totalCustomers: totalCustomers.count,
    statusBreakdown,
    last7days,
    topProducts,
    recentOrders,
  });
}
