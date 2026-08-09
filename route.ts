import { NextRequest, NextResponse } from "next/server";
import { seed } from "@/db/seed";

// Visit /api/setup?key=YOUR_SETUP_SECRET once after your first deploy to
// fill the database with categories, products, demo accounts, etc.
// Protected by SETUP_SECRET so random visitors can't wipe/reseed your data.
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");

  if (!process.env.SETUP_SECRET) {
    return NextResponse.json(
      { error: "SETUP_SECRET .env / Vercel environment variables ichida sozlanmagan." },
      { status: 500 },
    );
  }
  if (key !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Ruxsat yo'q — kalit noto'g'ri." }, { status: 401 });
  }

  try {
    await seed();
    return NextResponse.json({ ok: true, message: "✅ Baza muvaffaqiyatli to'ldirildi." });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
