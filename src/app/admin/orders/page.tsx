"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate, formatMoney } from "@/lib/format";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

type Order = {
  id: number; orderNumber: string; status: string; total: string; createdAt: string;
  paymentMethod: string; customerName: string | null; customerPhone: string;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState("");

  function load() {
    fetch(`/api/admin/orders${statusFilter ? `?status=${statusFilter}` : ""}`)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []));
  }

  useEffect(load, [statusFilter]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Buyurtmalar</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
          <option value="">Barcha holatlar</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s].uz}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 text-left text-xs text-slate-400 dark:border-slate-800">
            <tr><th className="p-3">Raqam</th><th className="p-3">Mijoz</th><th className="p-3">Summasi</th><th className="p-3">To&apos;lov</th><th className="p-3">Holat</th><th className="p-3">Sana</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800/40">
                <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-medium text-emerald-600 hover:underline">#{o.orderNumber}</Link></td>
                <td className="p-3">{o.customerName}<div className="text-xs text-slate-400">{o.customerPhone}</div></td>
                <td className="p-3 font-semibold">{formatMoney(o.total)}</td>
                <td className="p-3 capitalize">{o.paymentMethod}</td>
                <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_LABELS[o.status as OrderStatus]?.color}`}>{ORDER_STATUS_LABELS[o.status as OrderStatus]?.uz}</span></td>
                <td className="p-3 text-xs text-slate-400">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
