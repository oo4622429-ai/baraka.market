import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import SearchClient from "../../search/search-client";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="text-4xl">{category.icon}</span>
        <h1 className="text-2xl font-bold">{category.nameUz}</h1>
      </div>
      <SearchClient initialCategory={slug} />
    </div>
  );
}
