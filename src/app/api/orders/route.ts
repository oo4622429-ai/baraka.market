import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  orders,
  orderItems,
  orderStatusHistory,
  payments,
  carts,
  cartItems,
  products,
  addresses,
  coupons,
  couponUsages,
  wallets,
  walletTransactions,
  bonusTransactions,
  warehouses,
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { genOrderNumber } from "@/lib/format";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ orders: [] });

  const rows = await db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt));
  return NextResponse.json({ orders: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Avval tizimga kiring" }, { status: 401 });

  const body = await req.json();
  const addressId = Number(body.addressId);
  const paymentMethod = String(body.paymentMethod || "cash");
  const couponCode = body.couponCode ? String(body.couponCode).toUpperCase() : null;
  const bonusToUse = Number(body.bonusToUse || 0);
  const comment = body.comment ? String(body.comment) : null;

  const [cart] = await db.select().from(carts).where(eq(carts.userId, user.id)).limit(1);
  if (!cart) return NextResponse.json({ error: "Savatcha topilmadi" }, { status: 400 });

  const items = await db
    .select({ productId: cartItems.productId, quantity: cartItems.quantity, product: products })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cart.id));

  if (!items.length) return NextResponse.json({ error: "Savatcha bo'sh" }, { status: 400 });

  const [address] = await db.select().from(addresses).where(eq(addresses.id, addressId)).limit(1);
  if (!address) return NextResponse.json({ error: "Manzil topilmadi" }, { status: 400 });

  const subtotal = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
  let discountTotal = 0;
  let appliedCoupon: typeof coupons.$inferSelect | null = null;

  if (couponCode) {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, couponCode)).limit(1);
    if (coupon && coupon.isActive && new Date(coupon.endsAt) > new Date() && subtotal >= Number(coupon.minOrderAmount)) {
      const discount =
        coupon.type === "percent"
          ? Math.round((subtotal * Number(coupon.value)) / 100)
          : Number(coupon.value);
      discountTotal = coupon.maxDiscountAmount ? Math.min(discount, Number(coupon.maxDiscountAmount)) : discount;
      appliedCoupon = coupon;
    }
  }

  const deliveryFee = subtotal - discountTotal >= 300000 ? 0 : 15000;

  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, user.id)).limit(1);
  const walletBalance = wallet ? Number(wallet.balance) : 0;
  const bonusUsed = Math.min(bonusToUse, walletBalance, subtotal - discountTotal);

  const total = Math.max(0, subtotal - discountTotal + deliveryFee - bonusUsed);

  const [warehouse] = await db.select().from(warehouses).limit(1);

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber: genOrderNumber(),
      userId: user.id,
      addressId: address.id,
      warehouseId: warehouse?.id,
      status: "pending",
      paymentMethod,
      paymentStatus: paymentMethod === "cash" ? "unpaid" : "unpaid",
      subtotal: String(subtotal),
      discountTotal: String(discountTotal),
      deliveryFee: String(deliveryFee),
      bonusUsed: String(bonusUsed),
      total: String(total),
      couponId: appliedCoupon?.id,
      deliveryLat: address.lat,
      deliveryLng: address.lng,
      deliveryAddressText: `${address.city ?? ""}, ${address.street ?? ""} ${address.building ?? ""}`,
      estimatedDeliveryAt: new Date(Date.now() + 45 * 60000),
      customerComment: comment,
    })
    .returning();

  await db.insert(orderItems).values(
    items.map((i) => ({
      orderId: order.id,
      productId: i.productId,
      productNameSnapshot: i.product.nameUz,
      priceSnapshot: i.product.price,
      quantity: i.quantity,
      total: String(Number(i.product.price) * i.quantity),
    })),
  );

  await db.insert(orderStatusHistory).values({ orderId: order.id, status: "pending", note: "Buyurtma yaratildi" });
  await db.insert(payments).values({
    orderId: order.id,
    provider: paymentMethod === "cash" ? "cash" : paymentMethod === "wallet" ? "wallet" : "click",
    amount: String(total),
    status: paymentMethod === "cash" ? "pending" : "success",
    paidAt: paymentMethod === "cash" ? null : new Date(),
  });

  if (appliedCoupon) {
    await db.insert(couponUsages).values({ couponId: appliedCoupon.id, userId: user.id, orderId: order.id });
    await db.update(coupons).set({ usedCount: appliedCoupon.usedCount + 1 }).where(eq(coupons.id, appliedCoupon.id));
  }

  if (bonusUsed > 0 && wallet) {
    const newBalance = walletBalance - bonusUsed;
    await db.update(wallets).set({ balance: String(newBalance) }).where(eq(wallets.id, wallet.id));
    await db.insert(walletTransactions).values({
      walletId: wallet.id,
      amount: String(-bonusUsed),
      type: "payment",
      orderId: order.id,
      description: `Buyurtma #${order.orderNumber} uchun to'lov`,
    });
    await db.insert(bonusTransactions).values({
      userId: user.id,
      amount: String(-bonusUsed),
      type: "redeem",
      orderId: order.id,
      balanceAfter: String(newBalance),
    });
  }

  // earn bonus 2% of total for future purchases
  const earn = Math.round(total * 0.02);
  if (earn > 0) {
    const [w2] = await db.select().from(wallets).where(eq(wallets.userId, user.id)).limit(1);
    if (w2) {
      const newBal = Number(w2.balance) + earn;
      await db.update(wallets).set({ balance: String(newBal) }).where(eq(wallets.id, w2.id));
      await db.insert(walletTransactions).values({
        walletId: w2.id,
        amount: String(earn),
        type: "cashback",
        orderId: order.id,
        description: "Buyurtma uchun bonus",
      });
      await db.insert(bonusTransactions).values({
        userId: user.id,
        amount: String(earn),
        type: "earn",
        orderId: order.id,
        balanceAfter: String(newBal),
      });
    }
  }

  await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

  for (const i of items) {
    await db.update(products).set({ orderCount: i.product.orderCount + i.quantity }).where(eq(products.id, i.productId));
  }

  return NextResponse.json({ success: true, order });
}
