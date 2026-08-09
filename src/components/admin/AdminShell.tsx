"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tag,
  ShoppingCart,
  Users,
  Bike,
  Image as ImageIcon,
  Percent,
  Ticket,
  BarChart3,
  ScrollText,
  LogOut,
  Menu,
  X,
  Store,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Mahsulotlar", icon: Package },
  { href: "/admin/categories", label: "Kategoriyalar", icon: FolderTree },
  { href: "/admin/brands", label: "Brendlar", icon: Tag },
  { href: "/admin/orders", label: "Buyurtmalar", icon: ShoppingCart },
  { href: "/admin/users", label: "Foydalanuvchilar", icon: Users },
  { href: "/admin/couriers", label: "Kuryerlar", icon: Bike },
  { href: "/admin/banners", label: "Bannerlar", icon: ImageIcon },
  { href: "/admin/promotions", label: "Aksiyalar", icon: Percent },
  { href: "/admin/coupons", label: "Kupon kodlar", icon: Ticket },
  { href: "/admin/activity", label: "Faollik jurnali", icon: ScrollText },
];

export default function AdminShell({
  children,
  user,
}: {
  children: ReactNode;
  user: { fullName: string | null; phone: string; roleName: string } | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 md:static md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5 dark:border-slate-800">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-lg font-bold text-white">B</span>
          <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">Baraka Admin</span>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {NAV.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-emerald-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <item.icon size={18} /> {item.label}
              </Link>
            );
          })}
          <Link href="/" className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Store size={18} /> Do&apos;konga qaytish
          </Link>
          <button onClick={logout} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950">
            <LogOut size={18} /> Chiqish
          </button>
        </nav>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 md:ml-0">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
          <button className="md:hidden" onClick={() => setOpen(true)}><Menu size={22} /></button>
          <div className="flex-1" />
          <div className="text-right">
            <div className="text-sm font-semibold">{user?.fullName}</div>
            <div className="text-xs text-slate-400">{user?.roleName}</div>
          </div>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900">
            {user?.fullName?.[0] ?? "A"}
          </span>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
