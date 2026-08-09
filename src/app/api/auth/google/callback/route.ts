import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, roles, carts, wallets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ACCESS_COOKIE, REFRESH_COOKIE, signAccessToken, signRefreshToken } from "@/lib/auth";

type GoogleTokenResponse = {
  access_token: string;
  id_token: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

// Step 2 of the Google OAuth 2.0 flow. Google redirects here with a
// one-time `code`. We exchange it for tokens, fetch the user's Google
// profile, then create/find the matching local user and log them in
// using the same JWT-cookie session mechanism as phone/OTP login.
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const cookieState = req.cookies.get("bm_oauth_state")?.value;
  const next = req.cookies.get("bm_oauth_next")?.value || "/profile";

  const failRedirect = (message: string) => {
    const res = NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, req.url));
    res.cookies.delete("bm_oauth_state");
    res.cookies.delete("bm_oauth_next");
    return res;
  };

  if (errorParam) return failRedirect("Google orqali kirish bekor qilindi");
  if (!code || !state || !cookieState || state !== cookieState) {
    return failRedirect("Google orqali kirishda xatolik (state mos kelmadi)");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return failRedirect("Google login sozlanmagan (.env faylga GOOGLE_CLIENT_ID/SECRET qo'shing)");
  }
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${url.origin}/api/auth/google/callback`;

  // --- Exchange the authorization code for tokens ---
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = (await tokenRes.json().catch(() => ({}))) as GoogleTokenResponse;
  if (!tokenRes.ok || !tokenData.access_token) {
    return failRedirect(tokenData.error_description || "Google tokenini olishda xatolik");
  }

  // --- Fetch the Google profile ---
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = (await profileRes.json().catch(() => ({}))) as GoogleUserInfo;
  if (!profileRes.ok || !profile.sub) {
    return failRedirect("Google profilini olib bo'lmadi");
  }

  // --- Find or create the local user ---
  let [user] = await db.select().from(users).where(eq(users.googleId, profile.sub)).limit(1);

  if (!user && profile.email) {
    // Link an existing account that was created with the same email (e.g. via phone login).
    [user] = await db.select().from(users).where(eq(users.email, profile.email)).limit(1);
    if (user) {
      [user] = await db.update(users).set({ googleId: profile.sub }).where(eq(users.id, user.id)).returning();
    }
  }

  if (!user) {
    const [customerRole] = await db.select().from(roles).where(eq(roles.name, "customer")).limit(1);
    [user] = await db
      .insert(users)
      .values({
        googleId: profile.sub,
        email: profile.email,
        fullName: profile.name || profile.email || "Google foydalanuvchisi",
        avatarUrl: profile.picture,
        roleId: customerRole.id,
        isPhoneVerified: false,
        referralCode: `BM${Math.floor(1000 + Math.random() * 9000)}`,
      })
      .returning();
    await db.insert(carts).values({ userId: user.id });
    await db.insert(wallets).values({ userId: user.id, balance: "0" });
  } else {
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  }

  const [roleRow] = await db.select().from(roles).where(eq(roles.id, user.roleId)).limit(1);
  const payload = { sub: user.id, phone: user.phone ?? null, role: roleRow.name };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const res = NextResponse.redirect(new URL(next, req.url));
  res.cookies.set(ACCESS_COOKIE, accessToken, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 30 });
  res.cookies.set(REFRESH_COOKIE, refreshToken, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  res.cookies.delete("bm_oauth_state");
  res.cookies.delete("bm_oauth_next");
  return res;
}
