"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dictionary, type DictKey, type Locale } from "@/lib/i18n";

/* ------------------------------- Theme context ------------------------------ */

type Theme = "light" | "dark";

type AppCtx = {
  theme: Theme;
  toggleTheme: () => void;
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: DictKey) => string;
  cartCount: number;
  setCartCount: (n: number) => void;
  refreshCartCount: () => Promise<void>;
};

const Ctx = createContext<AppCtx | null>(null);

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000`;
}

export function AppProviders({
  children,
  initialTheme,
  initialLocale,
}: {
  children: ReactNode;
  initialTheme: Theme;
  initialLocale: Locale;
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      setCookie("bm_theme", next);
      return next;
    });
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    setCookie("bm_locale", l);
  }, []);

  const t = useCallback((key: DictKey) => dictionary[locale][key] ?? dictionary.uz[key], [locale]);

  const refreshCartCount = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const count = (data.items ?? []).reduce((acc: number, i: { quantity: number }) => acc + i.quantity, 0);
      setCartCount(count);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshCartCount();
  }, [refreshCartCount]);

  const value = useMemo(
    () => ({ theme, toggleTheme, locale, setLocale, t, cartCount, setCartCount, refreshCartCount }),
    [theme, toggleTheme, locale, setLocale, t, cartCount, refreshCartCount],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProviders");
  return ctx;
}
