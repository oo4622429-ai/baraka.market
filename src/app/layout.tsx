import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Baraka Market — Onlayn supermarket",
  description: "Baraka Market — uyingizga eng yaqin zamonaviy onlayn supermarket. Tez yetkazib berish, aksiyalar va qulay narxlar.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const theme = (cookieStore.get("bm_theme")?.value as "light" | "dark") || "light";
  const locale = (cookieStore.get("bm_locale")?.value as Locale) || "uz";

  return (
    <html lang={locale} className={theme === "dark" ? "dark" : undefined}>
      <body className="bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100 transition-colors">
        <AppProviders initialTheme={theme} initialLocale={locale}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
