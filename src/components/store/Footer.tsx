"use client";

import Link from "next/link";
import { useApp } from "@/components/providers";

export default function Footer() {
  const { t } = useApp();
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-lg font-bold text-white">B</span>
            <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
              Baraka<span className="text-orange-500">Market</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("tagline")}. Onlayn supermarket — tez, qulay va ishonchli.</p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">{t("catalog")}</h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><Link href="/categories" className="hover:text-emerald-600">{t("categories")}</Link></li>
            <li><Link href="/brands" className="hover:text-emerald-600">{t("brands")}</Link></li>
            <li><Link href="/promotions" className="hover:text-emerald-600">{t("promotions")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">{t("profile")}</h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><Link href="/orders" className="hover:text-emerald-600">{t("myOrders")}</Link></li>
            <li><Link href="/favorites" className="hover:text-emerald-600">{t("favorites")}</Link></li>
            <li><Link href="/profile/wallet" className="hover:text-emerald-600">{t("myWallet")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Aloqa</h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li>+998 71 200 00 00</li>
            <li>support@barakamarket.uz</li>
            <li>Toshkent, O&apos;zbekiston</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400 dark:border-slate-800">
        © {new Date().getFullYear()} Baraka Market. Barcha huquqlar himoyalangan.
      </div>
    </footer>
  );
}
