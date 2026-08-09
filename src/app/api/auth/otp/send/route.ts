import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const phone = normalizePhone(String(body.phone || ""));

  if (!phone || phone.replace(/\D/g, "").length < 9) {
    return NextResponse.json({ error: "Telefon raqami noto'g'ri" }, { status: 400 });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await db.insert(otpCodes).values({ phone, code, purpose: "login", expiresAt });

  // NOTE: No real SMS gateway is configured in this sandbox. In production this
  // would call an SMS provider (Eskiz, Play Mobitel, etc). For now we return the
  // code directly so the demo flow is fully testable end-to-end.
  console.log(`[OTP] ${phone} -> ${code}`);

  return NextResponse.json({ success: true, phone, devCode: code, expiresInSeconds: 300 });
}
