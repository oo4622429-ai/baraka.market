"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { useApp } from "@/components/providers";
import { formatDate, formatMoney } from "@/lib/format";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

type Order = { id: number; orderNumber: string; status: string; total: string; createdAt: string; paymentMethod: string };

export default function OrdersPage() {
  const { t, locale } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("myOrders")}</h1>
      {loading ? (
        <div className="py-24 text-center text-slate-400">Yuklanmoqda...</div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 py-24 text-center dark:border-slate-700">
          <PackageSearch size={48} className="text-slate-300" />
          <p className="text-slate-400">Hali buyurtmalar yo&apos;q</p>
          <Link href="/" className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700">Xarid qilish</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const label = ORDER_STATUS_LABELS[o.status as OrderStatus];
            return (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="font-semibold">#{o.orderNumber}</div>
                  <div className="text-xs text-slate-400">{formatDate(o.createdAt)}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">{formatMoney(o.total)}</div>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${label?.color}`}>
                    {label?.[locale] ?? o.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
