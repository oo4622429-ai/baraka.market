import Link from "next/link";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const rows = await db.select().from(brands).where(eq(brands.isActive, true)).orderBy(asc(brands.name));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Brendlar</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {rows.map((b) => (
          <Link
            key={b.id}
            href={`/search?brand=${b.slug}`}
            className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-center transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.logoUrl ?? ""} alt={b.name} className="h-14 w-14 rounded-full" />
            <div>
              <div className="font-semibold">{b.name}</div>
              <div className="text-xs text-slate-400">{b.country}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
