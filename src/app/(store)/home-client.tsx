"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Truck, ShieldCheck, Percent, Clock } from "lucide-react";
import { useApp } from "@/components/providers";
import ProductCard, { type ProductCardData } from "@/components/store/ProductCard";
import type { InferSelectModel } from "drizzle-orm";
import type { banners, categories, promotions, brands } from "@/db/schema";

type Banner = InferSelectModel<typeof banners>;
type Category = InferSelectModel<typeof categories>;
type Promotion = InferSelectModel<typeof promotions>;
type Brand = InferSelectModel<typeof brands>;

export default function HomeClient({
  banners: bannerList,
  categories: categoryList,
  featuredProducts,
  newProducts,
  promotions: promoList,
  brands: brandList,
}: {
  banners: Banner[];
  categories: Category[];
  featuredProducts: ProductCardData[];
  newProducts: ProductCardData[];
  promotions: Promotion[];
  brands: Brand[];
}) {
  const { locale, t } = useApp();
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    if (!bannerList.length) return;
    const id = setInterval(() => setActiveBanner((v) => (v + 1) % bannerList.length), 4500);
    return () => clearInterval(id);
  }, [bannerList.length]);

  function categoryName(c: Category) {
    return locale === "ru" ? c.nameRu : locale === "en" ? c.nameEn : c.nameUz;
  }
  function promoTitle(p: Promotion) {
    return locale === "ru" ? p.titleRu : locale === "en" ? p.titleEn : p.titleUz;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Hero banner carousel */}
      {bannerList.length > 0 && (
        <div className="relative mb-8 overflow-hidden rounded-3xl shadow-lg">
          <div className="relative h-48 w-full sm:h-64 md:h-80">
            {bannerList.map((b, i) => (
              <div
                key={b.id}
                className={`absolute inset-0 transition-opacity duration-700 ${i === activeBanner ? "opacity-100" : "opacity-0"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.imageUrl} alt={b.titleUz ?? ""} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8">
                  <h2 className="max-w-md text-xl font-bold text-white drop-shadow sm:text-3xl animate-fade-in-up">
                    {locale === "ru" ? b.titleRu : locale === "en" ? b.titleEn : b.titleUz}
                  </h2>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {bannerList.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveBanner(i)}
                className={`h-1.5 rounded-full transition-all ${i === activeBanner ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Trust badges */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Truck, label: "Tez yetkazib berish", sub: "35-55 daqiqada" },
          { icon: ShieldCheck, label: "Sifat kafolati", sub: "100% original" },
          { icon: Percent, label: "Har kuni aksiyalar", sub: "30% gacha chegirma" },
          { icon: Clock, label: "24/7 xizmat", sub: "Har doim yoningizda" },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
              <f.icon size={20} />
            </span>
            <div>
              <div className="text-sm font-semibold">{f.label}</div>
              <div className="text-xs text-slate-400">{f.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold sm:text-xl">{t("categories")}</h2>
          <Link href="/categories" className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:underline">
            {t("seeAll")} <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {categoryList.map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="text-3xl">{c.icon}</span>
              <span className="line-clamp-2 text-xs font-medium text-slate-700 dark:text-slate-200">{categoryName(c)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Promotions */}
      {promoList.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold sm:text-xl">{t("promotions")}</h2>
            <Link href="/promotions" className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:underline">
              {t("seeAll")} <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {promoList.map((p) => (
              <div key={p.id} className="relative overflow-hidden rounded-2xl shadow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl ?? ""} alt={promoTitle(p)} className="h-36 w-full object-cover" />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-4">
                  <span className="mb-1 w-fit rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                    -{p.discountPercent}%
                  </span>
                  <h3 className="text-base font-bold text-white">{promoTitle(p)}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {featuredProducts.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold sm:text-xl">{t("topDeals")}</h2>
            <Link href="/search?featured=true" className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:underline">
              {t("seeAll")} <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* New arrivals */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold sm:text-xl">{t("newArrivals")}</h2>
          <Link href="/search?sort=new" className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:underline">
            {t("seeAll")} <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {newProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Brands */}
      <section>
        <h2 className="mb-4 text-lg font-bold sm:text-xl">{t("brands")}</h2>
        <div className="flex flex-wrap gap-4">
          {brandList.map((b) => (
            <Link
              key={b.id}
              href={`/search?brand=${b.slug}`}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.logoUrl ?? ""} alt={b.name} className="h-8 w-8 rounded-full" />
              <span className="text-sm font-medium">{b.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
