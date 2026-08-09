"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import Link from "next/link";
import ProductCard, { type ProductCardData } from "@/components/store/ProductCard";
import { useApp } from "@/components/providers";

export default function FavoritesPage() {
  const { t } = useApp();
  const [items, setItems] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => setItems((d.items ?? []).map((i: { product: ProductCardData }) => i.product)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("favorites")}</h1>
      {loading ? (
        <div className="py-24 text-center text-slate-400">Yuklanmoqda...</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 py-24 text-center dark:border-slate-700">
          <Heart size={48} className="text-slate-300" />
          <p className="text-slate-400">{t("wishlistEmpty")}</p>
          <Link href="/" className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700">
            {t("catalog")}ga o&apos;tish
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
