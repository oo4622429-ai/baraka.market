import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, categories, brands } from "@/db/schema";
import { desc, eq, ilike, or } from "drizzle-orm";
import { requireAdminOrResponse } from "@/lib/api-guard";
import { slugify } from "@/lib/format";

export async function GET(req: NextRequest) {
  const { response } = await requireAdminOrResponse();
  if (response) return response;

  const q = req.nextUrl.searchParams.get("q");
  const where = q
    ? or(ilike(products.nameUz, `%${q}%`), ilike(products.sku, `%${q}%`), ilike(products.barcode, `%${q}%`))
    : undefined;

  const rows = await db
    .select({
      product: products,
      categoryName: categories.nameUz,
      brandName: brands.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .where(where)
    .orderBy(desc(products.createdAt))
    .limit(200);

  return NextResponse.json({ products: rows.map((r) => ({ ...r.product, categoryName: r.categoryName, brandName: r.brandName })) });
}

export async function POST(req: NextRequest) {
  const { response } = await requireAdminOrResponse();
  if (response) return response;

  const body = await req.json();
  const discountPercent =
    body.oldPrice && Number(body.oldPrice) > Number(body.price)
      ? Math.round(((Number(body.oldPrice) - Number(body.price)) / Number(body.oldPrice)) * 100)
      : 0;

  const [row] = await db
    .insert(products)
    .values({
      sku: body.sku || `BM-${Date.now()}`,
      barcode: body.barcode || null,
      nameUz: body.nameUz,
      nameRu: body.nameRu || body.nameUz,
      nameEn: body.nameEn || body.nameUz,
      slug: `${slugify(body.nameEn || body.nameUz)}-${Date.now().toString().slice(-5)}`,
      descriptionUz: body.descriptionUz || null,
      descriptionRu: body.descriptionRu || null,
      descriptionEn: body.descriptionEn || null,
      ingredientsUz: body.ingredientsUz || null,
      categoryId: Number(body.categoryId),
      brandId: body.brandId ? Number(body.brandId) : null,
      manufacturer: body.manufacturer || null,
      price: String(body.price),
      oldPrice: body.oldPrice ? String(body.oldPrice) : null,
      discountPercent,
      unit: body.unit || "dona",
      weightGrams: body.weightGrams ? Number(body.weightGrams) : null,
      volumeMl: body.volumeMl ? Number(body.volumeMl) : null,
      calories: body.calories ? Number(body.calories) : null,
      expiryDays: body.expiryDays ? Number(body.expiryDays) : null,
      coverImageUrl: body.coverImageUrl || `https://loremflickr.com/600/600/grocery,food?lock=${Date.now()}`,
      isActive: body.isActive ?? true,
      isFeatured: body.isFeatured ?? false,
    })
    .returning();

  return NextResponse.json({ product: row });
}
