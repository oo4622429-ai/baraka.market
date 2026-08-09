"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, MapPin, Moon, Package, ShieldCheck, Sun, User, Wallet } from "lucide-react";
import { useApp } from "@/components/providers";

type MeUser = { id: number; fullName: string | null; phone: string; email: string | null; avatarUrl: string | null; roleName: string } | null;

export default function ProfilePage() {
  const { t, theme, toggleTheme, locale, setLocale } = useApp();
  const router = useRouter();
  const [user, setUser] = useState<MeUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (loading) return <div className="py-24 text-center text-slate-400">Yuklanmoqda...</div>;
  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={user.avatarUrl ?? ""} alt="" className="h-16 w-16 rounded-full" />
        <div>
          <h1 className="text-xl font-bold">{user.fullName}</h1>
          <p className="text-sm text-slate-400">{user.phone}</p>
          {["admin", "super_admin", "manager"].includes(user.roleName) && (
            <Link href="/admin" className="mt-1 inline-block text-xs font-semibold text-emerald-600 hover:underline">Admin panelga o&apos;tish →</Link>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <Link href="/orders" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <span className="flex items-center gap-3 font-medium"><Package size={18} className="text-emerald-600" /> {t("myOrders")}</span>
          <span className="text-slate-300">›</span>
        </Link>
        <Link href="/profile/addresses" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <span className="flex items-center gap-3 font-medium"><MapPin size={18} className="text-emerald-600" /> {t("address")}</span>
          <span className="text-slate-300">›</span>
        </Link>
        <Link href="/profile/wallet" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <span className="flex items-center gap-3 font-medium"><Wallet size={18} className="text-emerald-600" /> {t("myWallet")}</span>
          <span className="text-slate-300">›</span>
        </Link>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="flex items-center gap-3 font-medium">{theme === "light" ? <Moon size={18} /> : <Sun size={18} />} {t("darkMode")}</span>
          <button onClick={toggleTheme} className={`h-6 w-11 rounded-full p-0.5 transition ${theme === "dark" ? "bg-emerald-600" : "bg-slate-300"}`}>
            <span className={`block h-5 w-5 rounded-full bg-white transition ${theme === "dark" ? "translate-x-5" : ""}`} />
          </button>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="flex items-center gap-3 font-medium"><ShieldCheck size={18} className="text-emerald-600" /> {t("language")}</span>
          <select value={locale} onChange={(e) => setLocale(e.target.value as "uz" | "ru" | "en")} className="rounded-lg border border-slate-200 bg-transparent px-2 py-1 text-sm dark:border-slate-700">
            <option value="uz">O&apos;zbekcha</option>
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>

        <button onClick={logout} className="flex w-full items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 font-medium text-rose-600 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950">
          <LogOut size={18} /> {t("logout")}
        </button>
      </div>
    </div>
  );
}
