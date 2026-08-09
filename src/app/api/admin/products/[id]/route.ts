import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminOrResponse } from "@/lib/api-guard";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const { id } = await params;
  const body = await req.json();

  const discountPercent =
    body.oldPrice && Number(body.oldPrice) > Number(body.price)
      ? Math.round(((Number(body.oldPrice) - Number(body.price)) / Number(body.oldPrice)) * 100)
      : 0;

  const [row] = await db
    .update(products)
    .set({
      nameUz: body.nameUz,
      nameRu: body.nameRu,
      nameEn: body.nameEn,
      descriptionUz: body.descriptionUz,
      categoryId: body.categoryId ? Number(body.categoryId) : undefined,
      brandId: body.brandId ? Number(body.brandId) : null,
      manufacturer: body.manufacturer,
      price: body.price !== undefined ? String(body.price) : undefined,
      oldPrice: body.oldPrice ? String(body.oldPrice) : null,
      discountPercent,
      unit: body.unit,
      weightGrams: body.weightGrams ? Number(body.weightGrams) : null,
      volumeMl: body.volumeMl ? Number(body.volumeMl) : null,
      calories: body.calories ? Number(body.calories) : null,
      coverImageUrl: body.coverImageUrl,
      isActive: body.isActive,
      isFeatured: body.isFeatured,
      updatedAt: new Date(),
    })
    .where(eq(products.id, Number(id)))
    .returning();

  return NextResponse.json({ product: row });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminOrResponse();
  if (response) return response;
  const { id } = await params;
  await db.delete(products).where(eq(products.id, Number(id)));
  return NextResponse.json({ success: true });
}
