import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function requireAdminOrResponse() {
  const user = await getCurrentUser();
  if (!user || !["admin", "super_admin", "manager"].includes(user.roleName)) {
    return { user: null, response: NextResponse.json({ error: "Ruxsat berilmagan" }, { status: 403 }) };
  }
  return { user, response: null };
}
