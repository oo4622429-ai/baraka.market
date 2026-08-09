import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { otpCodes, users, roles, carts, wallets } from "@/db/schema";
import { and, desc, eq, gt } from "drizzle-orm";
import { ACCESS_COOKIE, REFRESH_COOKIE, signAccessToken, signRefreshToken } from "@/lib/auth";

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const phone = normalizePhone(String(body.phone || ""));
  const code = String(body.code || "");
  const fullName = body.fullName ? String(body.fullName) : undefined;

  if (!phone || !code) {
    return NextResponse.json({ error: "Ma'lumotlar to'liq emas" }, { status: 400 });
  }

  const [otp] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), eq(otpCodes.code, code), eq(otpCodes.isUsed, false), gt(otpCodes.expiresAt, new Date())))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (!otp) {
    return NextResponse.json({ error: "Kod noto'g'ri yoki muddati tugagan" }, { status: 400 });
  }

  await db.update(otpCodes).set({ isUsed: true }).where(eq(otpCodes.id, otp.id));

  let [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);

  if (!user) {
    const [customerRole] = await db.select().from(roles).where(eq(roles.name, "customer")).limit(1);
    [user] = await db
      .insert(users)
      .values({
        phone,
        fullName: fullName || `Mijoz ${phone.slice(-4)}`,
        roleId: customerRole.id,
        isPhoneVerified: true,
        referralCode: `BM${Math.floor(1000 + Math.random() * 9000)}`,
      })
      .returning();
    await db.insert(carts).values({ userId: user.id });
    await db.insert(wallets).values({ userId: user.id, balance: "0" });
  } else {
    await db.update(users).set({ lastLoginAt: new Date(), isPhoneVerified: true }).where(eq(users.id, user.id));
  }

  const [roleRow] = await db.select().from(roles).where(eq(roles.id, user.roleId)).limit(1);
  const payload = { sub: user.id, phone: user.phone, role: roleRow.name };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const res = NextResponse.json({
    success: true,
    user: { id: user.id, phone: user.phone, fullName: user.fullName, role: roleRow.name },
  });
  res.cookies.set(ACCESS_COOKIE, accessToken, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 30 });
  res.cookies.set(REFRESH_COOKIE, refreshToken, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
