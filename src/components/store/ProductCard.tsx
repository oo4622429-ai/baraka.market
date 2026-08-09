"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Star, ShoppingCart } from "lucide-react";
import { useApp } from "@/components/providers";
import { formatMoney } from "@/lib/format";

export type ProductCardData = {
  id: number;
  slug: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  price: string;
  oldPrice: string | null;
  discountPercent: number;
  unit: string;
  coverImageUrl: string | null;
  ratingAvg: number | string;
  ratingCount: number;
  brandName?: string | null;
};

export default function ProductCard({ product }: { product: ProductCardData }) {
  const { locale, t, refreshCartCount } = useApp();
  const [busy, setBusy] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const name = locale === "ru" ? product.nameRu : locale === "en" ? product.nameEn : product.nameUz;

  async function addToCart(e: React.MouseEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      await refreshCartCount();
    } finally {
      setBusy(false);
    }
  }

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    });
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    const data = await res.json();
    setFavorited(data.favorited);
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
    >
      {product.discountPercent > 0 && (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
          -{product.discountPercent}%
        </span>
      )}
      <button
        onClick={toggleFavorite}
        className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-500 shadow hover:text-rose-500 dark:bg-slate-800/90"
        aria-label="favorite"
      >
        <Heart size={16} className={favorited ? "fill-rose-500 text-rose-500" : ""} />
      </button>

      <div className="aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.coverImageUrl ?? "https://loremflickr.com/400/400/grocery?lock=1"}
          alt={name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {product.brandName && <span className="text-[11px] font-medium text-slate-400">{product.brandName}</span>}
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-slate-800 dark:text-slate-100">{name}</h3>

        <div className="flex items-center gap-1 text-xs text-amber-500">
          <Star size={13} className="fill-amber-400 text-amber-400" />
          <span className="font-semibold">{Number(product.ratingAvg).toFixed(1)}</span>
          <span className="text-slate-400">({product.ratingCount})</span>
        </div>

        <div className="mt-1 flex items-end justify-between gap-2">
          <div>
            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{formatMoney(product.price)}</div>
            {product.oldPrice && (
              <div className="text-xs text-slate-400 line-through">{formatMoney(product.oldPrice)}</div>
            )}
            <div className="text-[11px] text-slate-400">/ {product.unit}</div>
          </div>
          <button
            onClick={addToCart}
            disabled={busy}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:opacity-60"
            aria-label={t("addToCart")}
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </Link>
  );
}
