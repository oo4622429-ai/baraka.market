import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireAdminOrResponse } from "@/lib/api-guard";

export async function GET() {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  return NextResponse.json({ coupons: rows });
}

export async function POST(req: NextRequest) {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const body = await req.json();
  const [row] = await db
    .insert(coupons)
    .values({
      code: String(body.code).toUpperCase(),
      type: body.type || "percent",
      value: String(body.value),
      minOrderAmount: String(body.minOrderAmount || 0),
      maxDiscountAmount: body.maxDiscountAmount ? String(body.maxDiscountAmount) : null,
      usageLimit: Number(body.usageLimit || 100),
      perUserLimit: Number(body.perUserLimit || 1),
      startsAt: new Date(body.startsAt || Date.now()),
      endsAt: new Date(body.endsAt || Date.now() + 30 * 86400000),
    })
    .returning();
  return NextResponse.json({ coupon: row });
}
