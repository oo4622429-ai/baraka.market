import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, roles } from "@/db/schema";
import { desc, eq, ilike, or } from "drizzle-orm";
import { requireAdminOrResponse } from "@/lib/api-guard";

export async function GET(req: NextRequest) {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const q = req.nextUrl.searchParams.get("q");

  const rows = await db
    .select({ user: users, roleName: roles.name })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(q ? or(ilike(users.fullName, `%${q}%`), ilike(users.phone, `%${q}%`)) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(300);

  return NextResponse.json({ users: rows.map((r) => ({ ...r.user, roleName: r.roleName })) });
}
