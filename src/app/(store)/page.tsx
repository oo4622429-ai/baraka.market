import Link from "next/link";
import { db } from "@/db";
import { banners, categories, products, promotions, brands } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [bannerRows, categoryRows, featuredProducts, newProducts, promoRows, brandRows] = await Promise.all([
    db.select().from(banners).where(eq(banners.isActive, true)).orderBy(banners.sortOrder),
    db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder),
    db
      .select()
      .from(products)
      .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
      .limit(10),
    db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt)).limit(10),
    db.select().from(promotions).where(eq(promotions.isActive, true)).limit(4),
    db.select().from(brands).where(eq(brands.isActive, true)).limit(12),
  ]);

  return (
    <HomeClient
      banners={bannerRows}
      categories={categoryRows}
      featuredProducts={featuredProducts}
      newProducts={newProducts}
      promotions={promoRows}
      brands={brandRows}
    />
  );
}
