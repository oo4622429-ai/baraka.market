import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { getCurrentUser } from "@/lib/auth";
import LoginRequired from "@/components/admin/LoginRequired";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const isAdmin = user && ["admin", "super_admin", "manager"].includes(user.roleName);

  if (!isAdmin) {
    return <LoginRequired />;
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
