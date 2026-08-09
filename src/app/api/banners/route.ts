import { NextResponse } from "next/server";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(banners).where(eq(banners.isActive, true)).orderBy(asc(banners.sortOrder));
  return NextResponse.json({ banners: rows });
}
