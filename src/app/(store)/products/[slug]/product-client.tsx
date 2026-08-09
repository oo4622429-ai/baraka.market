"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Minus, Plus, ShoppingCart, Star, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { useApp } from "@/components/providers";
import { formatDate, formatMoney } from "@/lib/format";
import ProductCard, { type ProductCardData } from "@/components/store/ProductCard";

type FullProduct = {
  id: number;
  nameUz: string; nameRu: string; nameEn: string;
  descriptionUz: string | null; descriptionRu: string | null; descriptionEn: string | null;
  ingredientsUz: string | null;
  manufacturer: string | null;
  price: string; oldPrice: string | null; discountPercent: number;
  unit: string; weightGrams: number | null; volumeMl: number | null;
  calories: number | null; proteins: number | null; fats: number | null; carbs: number | null;
  expiryDays: number | null; barcode: string | null; sku: string;
  coverImageUrl: string | null; ratingAvg: number | string; ratingCount: number;
  createdAt: string;
};

type Review = { id: number; rating: number; comment: string | null; createdAt: string; userName: string | null; userAvatar: string | null };

export default function ProductClient({
  product,
  images,
  brand,
  category,
  similarProducts,
  bundledProducts,
  reviews,
}: {
  product: FullProduct;
  images: { id: number; url: string }[];
  brand: { name: string; logoUrl: string | null } | null;
  category: { name: string; slug: string } | null;
  similarProducts: ProductCardData[];
  bundledProducts: ProductCardData[];
  reviews: Review[];
}) {
  const { locale, t, refreshCartCount } = useApp();
  const allImages = [product.coverImageUrl, ...images.map((i) => i.url)].filter(Boolean) as string[];
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"description" | "ingredients" | "reviews">("description");
  const [busy, setBusy] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [localReviews, setLocalReviews] = useState(reviews);

  const name = locale === "ru" ? product.nameRu : locale === "en" ? product.nameEn : product.nameUz;
  const description = locale === "ru" ? product.descriptionRu : locale === "en" ? product.descriptionEn : product.descriptionUz;

  async function addToCart() {
    setBusy(true);
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, quantity: qty }),
    });
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    await refreshCartCount();
    setBusy(false);
  }

  async function submitReview() {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, rating: reviewRating, comment: reviewComment }),
    });
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    setLocalReviews([{ id: Date.now(), rating: reviewRating, comment: reviewComment, createdAt: new Date().toISOString(), userName: "Siz", userAvatar: null }, ...localReviews]);
    setReviewComment("");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 text-sm text-slate-400">
        <Link href="/" className="hover:text-emerald-600">{t("home")}</Link>
        {category && (
          <>
            {" / "}
            <Link href={`/categories/${category.slug}`} className="hover:text-emerald-600">{category.name}</Link>
          </>
        )}
        {" / "}
        <span className="text-slate-600 dark:text-slate-300">{name}</span>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="mb-3 aspect-square overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={allImages[activeImg]} alt={name} className="h-full w-full object-cover" />
          </div>
          <div className="flex gap-2">
            {allImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`h-16 w-16 overflow-hidden rounded-xl border-2 ${activeImg === i ? "border-emerald-600" : "border-transparent"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          {brand && (
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brand.logoUrl ?? ""} alt="" className="h-6 w-6 rounded-full" /> {brand.name}
            </div>
          )}
          <h1 className="mb-2 text-2xl font-bold">{name}</h1>
          <div className="mb-4 flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-amber-500">
              <Star size={16} className="fill-amber-400 text-amber-400" />
              <span className="font-semibold">{Number(product.ratingAvg).toFixed(1)}</span>
            </div>
            <span className="text-slate-400">({product.ratingCount} {t("reviews").toLowerCase()})</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400">SKU: {product.sku}</span>
          </div>

          <div className="mb-6 flex items-end gap-3">
            <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">{formatMoney(product.price)}</span>
            {product.oldPrice && <span className="text-lg text-slate-400 line-through">{formatMoney(product.oldPrice)}</span>}
            {product.discountPercent > 0 && (
              <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">-{product.discountPercent}%</span>
            )}
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-800 sm:grid-cols-3">
            {product.weightGrams && <Info label={t("weight")} value={`${product.weightGrams} g`} />}
            {product.volumeMl && <Info label={t("volume")} value={`${product.volumeMl} ml`} />}
            {product.calories != null && <Info label={t("calories")} value={`${product.calories} kcal`} />}
            {product.expiryDays && <Info label={t("expiry")} value={`${product.expiryDays} kun`} />}
            {product.manufacturer && <Info label={t("manufacturer")} value={product.manufacturer} />}
            {product.barcode && <Info label={t("barcode")} value={product.barcode} />}
          </div>

          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3"><Minus size={16} /></button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="p-3"><Plus size={16} /></button>
            </div>
            <button
              onClick={addToCart}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              <ShoppingCart size={18} /> {t("addToCart")}
            </button>
            <button className="grid h-12 w-12 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:text-rose-500 dark:border-slate-700">
              <Heart size={18} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs text-slate-500">
            <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <Truck size={18} className="text-emerald-600" /> Tez yetkazish
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <ShieldCheck size={18} className="text-emerald-600" /> Original mahsulot
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <RotateCcw size={18} className="text-emerald-600" /> Qaytarish mumkin
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-10">
        <div className="mb-4 flex gap-6 border-b border-slate-200 dark:border-slate-800">
          {(["description", "ingredients", "reviews"] as const).map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={`border-b-2 pb-2 text-sm font-semibold ${tab === tb ? "border-emerald-600 text-emerald-700 dark:text-emerald-400" : "border-transparent text-slate-400"}`}
            >
              {tb === "description" ? t("description") : tb === "ingredients" ? t("ingredients") : t("reviews")}
            </button>
          ))}
        </div>

        {tab === "description" && <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>}
        {tab === "ingredients" && <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">{product.ingredientsUz}</p>}
        {tab === "reviews" && (
          <div className="max-w-2xl space-y-4">
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="mb-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setReviewRating(s)}>
                    <Star size={20} className={s <= reviewRating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Sharh yozing..."
                className="mb-2 w-full rounded-xl border border-slate-200 bg-transparent p-3 text-sm dark:border-slate-700"
                rows={3}
              />
              <button onClick={submitReview} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                {t("writeReview")}
              </button>
            </div>
            {localReviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold">{r.userName ?? "Mijoz"}</span>
                  <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                </div>
                <div className="mb-2 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                  ))}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {bundledProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-bold">{t("frequentlyBoughtTogether")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {bundledProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {similarProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-bold">{t("similarProducts")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
