import { notFound } from "next/navigation";
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
} from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import ProductClient from "./product-client";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [row] = await db
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

  if (!row) notFound();

  const [images, similarLinks, bundleLinks, productReviews] = await Promise.all([
    db.select().from(productImages).where(eq(productImages.productId, row.product.id)).orderBy(productImages.sortOrder),
    db.select().from(productSimilar).where(eq(productSimilar.productId, row.product.id)),
    db.select().from(productBundles).where(eq(productBundles.productId, row.product.id)),
    db
      .select({ review: reviews, userName: users.fullName, userAvatar: users.avatarUrl })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.productId, row.product.id))
      .orderBy(desc(reviews.createdAt))
      .limit(20),
  ]);

  const similarIds = similarLinks.map((s) => s.similarProductId);
  const bundleIds = bundleLinks.map((s) => s.bundledProductId);

  const [similarProducts, bundledProducts] = await Promise.all([
    similarIds.length ? db.select().from(products).where(inArray(products.id, similarIds)) : Promise.resolve([]),
    bundleIds.length ? db.select().from(products).where(inArray(products.id, bundleIds)) : Promise.resolve([]),
  ]);

  await db.update(products).set({ viewCount: row.product.viewCount + 1 }).where(eq(products.id, row.product.id));

  return (
    <ProductClient
      product={{ ...row.product, createdAt: row.product.createdAt.toString() }}
      images={images}
      brand={row.brandName ? { name: row.brandName, logoUrl: row.brandLogo } : null}
      category={row.categoryName ? { name: row.categoryName, slug: row.categorySlug! } : null}
      similarProducts={similarProducts}
      bundledProducts={bundledProducts}
      reviews={productReviews.map((r) => ({
        ...r.review,
        createdAt: r.review.createdAt.toString(),
        userName: r.userName,
        userAvatar: r.userAvatar,
      }))}
    />
  );
}
