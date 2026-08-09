"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Bike, CheckCircle2, MapPin, Package, Phone, Star, Truck } from "lucide-react";
import { useApp } from "@/components/providers";
import { formatDate, formatMoney } from "@/lib/format";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

type OrderDetail = {
  order: { id: number; orderNumber: string; status: string; total: string; subtotal: string; discountTotal: string; deliveryFee: string; bonusUsed: string; paymentMethod: string; createdAt: string; deliveryAddressText: string | null; estimatedDeliveryAt: string | null };
  items: { id: number; productNameSnapshot: string; priceSnapshot: string; quantity: number; total: string }[];
  history: { id: number; status: string; createdAt: string }[];
  courier: { id: number; name: string | null; phone: string | null; avatar: string | null; vehicleType: string; ratingAvg: number } | null;
  address: { city: string | null; street: string | null; building: string | null } | null;
};

const trackableStatuses: OrderStatus[] = ["pending", "confirmed", "packing", "courier_assigned", "on_the_way", "delivered"];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useApp();
  const [data, setData] = useState<OrderDetail | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => setData(d));
  }, [id]);

  if (!data || !data.order) return <div className="py-24 text-center text-slate-400">Yuklanmoqda...</div>;

  const { order, items, courier, address } = data;
  const currentIdx = trackableStatuses.indexOf(order.status as OrderStatus);
  const progressPct = currentIdx >= 0 ? (currentIdx / (trackableStatuses.length - 1)) * 100 : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Buyurtma #{order.orderNumber}</h1>
          <p className="text-sm text-slate-400">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${ORDER_STATUS_LABELS[order.status as OrderStatus]?.color}`}>
          {ORDER_STATUS_LABELS[order.status as OrderStatus]?.[locale]}
        </span>
      </div>

      {order.status !== "cancelled" && order.status !== "returned" && (
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Truck size={18} className="text-emerald-600" /> {t("trackOrder")}</h2>

          {/* Map-style visual tracker */}
          <div className="relative mb-6 h-40 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle, #10b981 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
            <div className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-emerald-600 p-2 text-white shadow-lg">
              <Package size={16} />
            </div>
            <div
              className="absolute top-1/2 -translate-y-1/2 rounded-full bg-orange-500 p-2 text-white shadow-lg transition-all duration-1000 animate-pulse-soft"
              style={{ left: `calc(${Math.max(8, Math.min(85, progressPct))}% )` }}
            >
              <Bike size={16} />
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-slate-700 p-2 text-white shadow-lg dark:bg-slate-600">
              <MapPin size={16} />
            </div>
            <div className="absolute left-6 right-6 top-1/2 h-0.5 -translate-y-1/2 bg-slate-300 dark:bg-slate-700" />
          </div>

          <div className="relative flex justify-between">
            {trackableStatuses.map((s, i) => (
              <div key={s} className="flex flex-1 flex-col items-center text-center">
                <div className={`z-10 grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${i <= currentIdx ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-400 dark:bg-slate-700"}`}>
                  {i <= currentIdx ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <span className="mt-1 max-w-[70px] text-[10px] text-slate-500">{ORDER_STATUS_LABELS[s][locale]}</span>
              </div>
            ))}
          </div>

          {order.estimatedDeliveryAt && (
            <p className="mt-4 text-center text-sm text-slate-500">
              Taxminiy yetib kelish vaqti: <b>{formatDate(order.estimatedDeliveryAt)}</b>
            </p>
          )}

          {courier && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={courier.avatar ?? ""} alt="" className="h-10 w-10 rounded-full" />
                <div>
                  <div className="font-semibold">{courier.name}</div>
                  <div className="flex items-center gap-1 text-xs text-amber-500"><Star size={12} className="fill-amber-400" /> {courier.ratingAvg.toFixed?.(1) ?? courier.ratingAvg}</div>
                </div>
              </div>
              <a href={`tel:${courier.phone}`} className="grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-white"><Phone size={16} /></a>
            </div>
          )}
        </section>
      )}

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 font-bold">Mahsulotlar</h2>
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex justify-between text-sm">
              <span>{it.productNameSnapshot} × {it.quantity}</span>
              <span className="font-medium">{formatMoney(it.total)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
          <div className="flex justify-between"><span className="text-slate-500">{t("subtotal")}</span><span>{formatMoney(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">{t("discount")}</span><span>-{formatMoney(order.discountTotal)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">{t("deliveryFee")}</span><span>{formatMoney(order.deliveryFee)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">{t("bonusUsed")}</span><span>-{formatMoney(order.bonusUsed)}</span></div>
          <div className="flex justify-between border-t border-slate-100 pt-2 font-bold dark:border-slate-800"><span>{t("total")}</span><span className="text-emerald-700 dark:text-emerald-400">{formatMoney(order.total)}</span></div>
        </div>
      </section>

      {address && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-2 flex items-center gap-2 font-bold"><MapPin size={16} className="text-emerald-600" /> {t("address")}</h2>
          <p className="text-sm text-slate-500">{address.city}, {address.street} {address.building}</p>
        </section>
      )}
    </div>
  );
}
