"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import ProductCard, { type ProductCardData } from "@/components/store/ProductCard";
import { useApp } from "@/components/providers";

export default function SearchClient({ initialCategory }: { initialCategory?: string }) {
  const searchParams = useSearchParams();
  const { t } = useApp();
  const [items, setItems] = useState<ProductCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState(searchParams.get("sort") || "new");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);

  const q = searchParams.get("q") || "";
  const featured = searchParams.get("featured");
  const brand = searchParams.get("brand");

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (initialCategory) sp.set("category", initialCategory);
    if (brand) sp.set("brand", brand);
    if (featured) sp.set("featured", featured);
    if (minPrice) sp.set("minPrice", minPrice);
    if (maxPrice) sp.set("maxPrice", maxPrice);
    sp.set("sort", sort);
    sp.set("page", String(page));
    sp.set("limit", "24");

    const res = await fetch(`/api/products?${sp.toString()}`);
    const data = await res.json();
    setItems(data.products);
    setTotal(data.total);
    setLoading(false);
  }, [q, initialCategory, brand, featured, minPrice, maxPrice, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / 24));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <SlidersHorizontal size={18} className="text-emerald-600" />
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-sm dark:border-slate-700"
        >
          <option value="new">Yangi</option>
          <option value="price_asc">Narx: pastdan yuqoriga</option>
          <option value="price_desc">Narx: yuqoridan pastga</option>
          <option value="popular">Mashhur</option>
          <option value="rating">Reyting</option>
        </select>
        <input
          placeholder="Min narx"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          onBlur={() => {
            setPage(1);
            load();
          }}
          className="w-28 rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-sm dark:border-slate-700"
        />
        <input
          placeholder="Max narx"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          onBlur={() => {
            setPage(1);
            load();
          }}
          className="w-28 rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-sm dark:border-slate-700"
        />
        <span className="ml-auto text-sm text-slate-400">{total} ta mahsulot topildi</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-20 text-center text-slate-400 dark:border-slate-700">
          Hech narsa topilmadi
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`h-9 w-9 rounded-lg text-sm font-medium ${
                page === i + 1 ? "bg-emerald-600 text-white" : "border border-slate-200 dark:border-slate-700"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
