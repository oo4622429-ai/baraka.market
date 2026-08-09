"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, MapPin, Menu, Moon, Search, ShoppingCart, Sun, User, X } from "lucide-react";
import { useApp } from "@/components/providers";
import type { Locale } from "@/lib/i18n";

type MeUser = { id: number; fullName: string | null; phone: string; roleName: string } | null;

export default function Header() {
  const { theme, toggleTheme, locale, setLocale, t, cartCount } = useApp();
  const router = useRouter();
  const [user, setUser] = useState<MeUser>(null);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {});
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <button className="md:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-lg font-bold text-white">B</span>
          <span className="hidden text-lg font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400 sm:block">
            Baraka<span className="text-orange-500">Market</span>
          </span>
        </Link>

        <button className="hidden items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300 md:flex">
          <MapPin size={14} className="text-emerald-600" /> Toshkent, Chilonzor
        </button>

        <form onSubmit={submitSearch} className="relative mx-2 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none ring-emerald-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
          />
        </form>

        <div className="flex items-center gap-1 sm:gap-2">
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="hidden rounded-lg border border-slate-200 bg-transparent px-2 py-1.5 text-xs font-medium dark:border-slate-700 sm:block"
          >
            <option value="uz">UZ</option>
            <option value="ru">RU</option>
            <option value="en">EN</option>
          </select>

          <button
            onClick={toggleTheme}
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="theme"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <Link href="/favorites" className="rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            <Heart size={20} />
          </Link>

          <Link href="/cart" className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>

          <Link
            href={user ? "/profile" : "/login"}
            className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <User size={16} />
            <span className="hidden sm:inline">{user ? (user.fullName?.split(" ")[0] ?? "Profil") : t("login")}</span>
          </Link>
        </div>
      </div>

      <nav className="hidden border-t border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950 md:block">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link href="/" className="hover:text-emerald-600">{t("home")}</Link>
          <Link href="/categories" className="hover:text-emerald-600">{t("categories")}</Link>
          <Link href="/brands" className="hover:text-emerald-600">{t("brands")}</Link>
          <Link href="/promotions" className="hover:text-emerald-600">{t("promotions")}</Link>
          <Link href="/orders" className="hover:text-emerald-600">{t("myOrders")}</Link>
          <Link href="/profile/wallet" className="hover:text-emerald-600">{t("myWallet")}</Link>
          <span className="ml-auto text-xs text-emerald-700 dark:text-emerald-400">
            300 000 so&apos;m {t("freeDeliveryFrom")}
          </span>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium">
            <Link href="/" onClick={() => setMenuOpen(false)}>{t("home")}</Link>
            <Link href="/categories" onClick={() => setMenuOpen(false)}>{t("categories")}</Link>
            <Link href="/brands" onClick={() => setMenuOpen(false)}>{t("brands")}</Link>
            <Link href="/promotions" onClick={() => setMenuOpen(false)}>{t("promotions")}</Link>
            <Link href="/orders" onClick={() => setMenuOpen(false)}>{t("myOrders")}</Link>
            <Link href="/profile/wallet" onClick={() => setMenuOpen(false)}>{t("myWallet")}</Link>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="w-fit rounded-lg border border-slate-200 bg-transparent px-2 py-1.5 text-xs font-medium dark:border-slate-700"
            >
              <option value="uz">O&apos;zbekcha</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      )}
    </header>
  );
}
