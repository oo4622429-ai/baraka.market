import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  products,
  productImages,
  productSimilar,
  productBundles,
  reviews,
  users,
  brands,
  categories,
  recentlyViewed,
} from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [product] = await db
    .select({
      product: products,
      brandName: brands.name,
      brandLogo: brands.logoUrl,
      categoryName: categories.nameUz,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);

  if (!product) return NextResponse.json({ error: "Mahsulot topilmadi" }, { status: 404 });

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.product.id))
    .orderBy(productImages.sortOrder);

  const similarLinks = await db.select().from(productSimilar).where(eq(productSimilar.productId, product.product.id));
  const bundleLinks = await db.select().from(productBundles).where(eq(productBundles.productId, product.product.id));

  const similarIds = similarLinks.map((s) => s.similarProductId);
  const bundleIds = bundleLinks.map((s) => s.bundledProductId);

  const [similarProducts, bundledProducts, productReviews] = await Promise.all([
    similarIds.length ? db.select().from(products).where(inArray(products.id, similarIds)) : Promise.resolve([]),
    bundleIds.length ? db.select().from(products).where(inArray(products.id, bundleIds)) : Promise.resolve([]),
    db
      .select({ review: reviews, userName: users.fullName, userAvatar: users.avatarUrl })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.productId, product.product.id))
      .orderBy(desc(reviews.createdAt))
      .limit(20),
  ]);

  await db.update(products).set({ viewCount: product.product.viewCount + 1 }).where(eq(products.id, product.product.id));

  const currentUser = await getCurrentUser();
  if (currentUser) {
    await db.insert(recentlyViewed).values({ userId: currentUser.id, productId: product.product.id });
  }

  return NextResponse.json({
    product: product.product,
    brand: product.brandName ? { name: product.brandName, logoUrl: product.brandLogo } : null,
    category: product.categoryName ? { name: product.categoryName, slug: product.categorySlug } : null,
    images,
    similarProducts,
    bundledProducts,
    reviews: productReviews.map((r) => ({ ...r.review, userName: r.userName, userAvatar: r.userAvatar })),
  });
}
