import { NextResponse } from "next/server";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(brands).where(eq(brands.isActive, true)).orderBy(asc(brands.name));
  return NextResponse.json({ brands: rows });
}
