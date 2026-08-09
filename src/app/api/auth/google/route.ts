import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Step 1 of the Google OAuth 2.0 "Authorization Code" flow.
// Redirects the browser to Google's consent screen.
//
// Required env vars (see .env.example):
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
//   GOOGLE_REDIRECT_URI   (optional — falls back to <origin>/api/auth/google/callback)
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      {
        error:
          "Google login sozlanmagan: GOOGLE_CLIENT_ID va GOOGLE_CLIENT_SECRET .env fayliga qo'shilmagan. .env.example faylga qarang.",
      },
      { status: 500 },
    );
  }

  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.nextUrl.origin}/api/auth/google/callback`;

  // CSRF protection: random state, stored in a short-lived cookie and
  // checked again in the callback route.
  const state = crypto.randomBytes(16).toString("hex");

  // Where to send the user back to inside our own app once login succeeds.
  const next = req.nextUrl.searchParams.get("next") || "/profile";

  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleUrl.searchParams.set("client_id", clientId);
  googleUrl.searchParams.set("redirect_uri", redirectUri);
  googleUrl.searchParams.set("response_type", "code");
  googleUrl.searchParams.set("scope", "openid email profile");
  googleUrl.searchParams.set("state", state);
  googleUrl.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(googleUrl.toString());
  res.cookies.set("bm_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  res.cookies.set("bm_oauth_next", next, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
