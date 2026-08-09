import { db } from "@/db";
import { promotions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PromotionsPage() {
  const rows = await db.select().from(promotions).where(eq(promotions.isActive, true)).orderBy(desc(promotions.createdAt));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Aksiyalar</h1>
      <div className="grid gap-6 sm:grid-cols-2">
        {rows.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.imageUrl ?? ""} alt={p.titleUz} className="h-48 w-full object-cover" />
            <div className="p-5">
              <span className="mb-2 inline-block rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">-{p.discountPercent}%</span>
              <h2 className="mb-1 text-lg font-bold">{p.titleUz}</h2>
              <p className="mb-2 text-sm text-slate-500">{p.descriptionUz}</p>
              <p className="text-xs text-slate-400">Amal qilish muddati: {formatDate(p.startsAt)} — {formatDate(p.endsAt)}</p>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-slate-400">Hozircha aksiyalar mavjud emas</p>}
      </div>
    </div>
  );
}
