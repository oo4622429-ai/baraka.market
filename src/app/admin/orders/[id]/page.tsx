"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatDate, formatMoney } from "@/lib/format";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

type OrderDetail = {
  order: { id: number; orderNumber: string; status: string; total: string; subtotal: string; deliveryFee: string; discountTotal: string; createdAt: string; paymentMethod: string; deliveryAddressText: string | null };
  items: { id: number; productNameSnapshot: string; quantity: number; total: string }[];
  courier: { id: number; name: string | null } | null;
};

type Courier = { id: number; name: string | null; isOnline: boolean };

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<OrderDetail | null>(null);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [status, setStatus] = useState("");
  const [courierId, setCourierId] = useState("");

  function load() {
    fetch(`/api/orders/${id}`).then((r) => r.json()).then((d) => {
      setData(d);
      setStatus(d.order?.status ?? "");
      setCourierId(d.courier?.id ? String(d.courier.id) : "");
    });
  }

  useEffect(() => {
    load();
    fetch("/api/admin/couriers").then((r) => r.json()).then((d) => setCouriers(d.couriers ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function updateOrder() {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, courierId: courierId ? Number(courierId) : undefined }),
    });
    load();
  }

  if (!data || !data.order) return <div className="py-24 text-center text-slate-400">Yuklanmoqda...</div>;
  const { order, items } = data;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">Buyurtma #{order.orderNumber}</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 font-bold">Holatni boshqarish</h2>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s].uz}</option>)}
          </select>
          <select value={courierId} onChange={(e) => setCourierId(e.target.value)} className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
            <option value="">Kuryer tanlanmagan</option>
            {couriers.map((c) => <option key={c.id} value={c.id}>{c.name} {c.isOnline ? "🟢" : "⚪"}</option>)}
          </select>
          <button onClick={updateOrder} className="w-full rounded-xl bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700">Yangilash</button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 font-bold">Ma&apos;lumot</h2>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Sana</span><span>{formatDate(order.createdAt)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">To&apos;lov</span><span className="capitalize">{order.paymentMethod}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Manzil</span><span className="text-right">{order.deliveryAddressText}</span></div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 font-bold">Mahsulotlar</h2>
        {items.map((it) => (
          <div key={it.id} className="flex justify-between border-b border-slate-50 py-2 text-sm last:border-0 dark:border-slate-800/50">
            <span>{it.productNameSnapshot} × {it.quantity}</span>
            <span className="font-medium">{formatMoney(it.total)}</span>
          </div>
        ))}
        <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 font-bold dark:border-slate-800">
          <span>Jami</span><span className="text-emerald-700 dark:text-emerald-400">{formatMoney(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
