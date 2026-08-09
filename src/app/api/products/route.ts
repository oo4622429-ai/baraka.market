import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, categories, brands } from "@/db/schema";
import { and, asc, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const categorySlug = sp.get("category");
  const brandSlug = sp.get("brand");
  const minPrice = sp.get("minPrice");
  const maxPrice = sp.get("maxPrice");
  const featured = sp.get("featured");
  const sort = sp.get("sort") || "new";
  const page = Math.max(1, Number(sp.get("page") || 1));
  const limit = Math.min(60, Math.max(1, Number(sp.get("limit") || 20)));
  const offset = (page - 1) * limit;

  const conditions = [eq(products.isActive, true)];

  if (q) {
    conditions.push(
      or(
        ilike(products.nameUz, `%${q}%`),
        ilike(products.nameRu, `%${q}%`),
        ilike(products.nameEn, `%${q}%`),
        ilike(products.barcode, `%${q}%`),
      )!,
    );
  }

  if (categorySlug) {
    const [cat] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, categorySlug)).limit(1);
    if (cat) conditions.push(eq(products.categoryId, cat.id));
    else return NextResponse.json({ products: [], total: 0, page, limit });
  }

  if (brandSlug) {
    const [brand] = await db.select({ id: brands.id }).from(brands).where(eq(brands.slug, brandSlug)).limit(1);
    if (brand) conditions.push(eq(products.brandId, brand.id));
    else return NextResponse.json({ products: [], total: 0, page, limit });
  }

  if (minPrice) conditions.push(gte(products.price, minPrice));
  if (maxPrice) conditions.push(lte(products.price, maxPrice));
  if (featured === "true") conditions.push(eq(products.isFeatured, true));

  const orderBy =
    sort === "price_asc"
      ? asc(products.price)
      : sort === "price_desc"
        ? desc(products.price)
        : sort === "popular"
          ? desc(products.orderCount)
          : sort === "rating"
            ? desc(products.ratingAvg)
            : desc(products.createdAt);

  const where = and(...conditions);

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: products.id,
        sku: products.sku,
        nameUz: products.nameUz,
        nameRu: products.nameRu,
        nameEn: products.nameEn,
        slug: products.slug,
        price: products.price,
        oldPrice: products.oldPrice,
        discountPercent: products.discountPercent,
        unit: products.unit,
        coverImageUrl: products.coverImageUrl,
        ratingAvg: products.ratingAvg,
        ratingCount: products.ratingCount,
        isFeatured: products.isFeatured,
        categoryId: products.categoryId,
        brandName: brands.name,
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(products).where(where),
  ]);

  return NextResponse.json({ products: rows, total: countRows[0]?.count ?? 0, page, limit });
}
