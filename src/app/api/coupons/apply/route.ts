import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const code = String(body.code || "").toUpperCase();
  const subtotal = Number(body.subtotal || 0);

  const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
  if (!coupon) return NextResponse.json({ error: "Kupon topilmadi" }, { status: 404 });
  if (!coupon.isActive || new Date(coupon.endsAt) < new Date()) {
    return NextResponse.json({ error: "Kupon muddati tugagan" }, { status: 400 });
  }
  if (subtotal < Number(coupon.minOrderAmount)) {
    return NextResponse.json({ error: `Minimal buyurtma summasi: ${coupon.minOrderAmount} so'm` }, { status: 400 });
  }
  if (coupon.usedCount >= coupon.usageLimit) {
    return NextResponse.json({ error: "Kupon limiti tugagan" }, { status: 400 });
  }

  const discount =
    coupon.type === "percent" ? Math.round((subtotal * Number(coupon.value)) / 100) : Number(coupon.value);
  const finalDiscount = coupon.maxDiscountAmount ? Math.min(discount, Number(coupon.maxDiscountAmount)) : discount;

  return NextResponse.json({ valid: true, coupon, discount: finalDiscount });
}
