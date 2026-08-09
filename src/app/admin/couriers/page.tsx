"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

type Courier = {
  id: number; name: string | null; phone: string; avatar: string | null; vehicleType: string;
  isOnline: boolean; isActive: boolean; ratingAvg: number; totalDeliveries: number;
};

export default function AdminCouriersPage() {
  const [couriers, setCouriers] = useState<Courier[]>([]);

  function load() {
    fetch("/api/admin/couriers").then((r) => r.json()).then((d) => setCouriers(d.couriers ?? []));
  }
  useEffect(load, []);

  async function toggleActive(c: Courier) {
    await fetch(`/api/admin/couriers/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !c.isActive }) });
    load();
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Kuryerlar</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {couriers.map((c) => (
          <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.avatar ?? ""} alt="" className="h-12 w-12 rounded-full" />
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-slate-400">{c.phone}</div>
              </div>
              <span className={`ml-auto h-2.5 w-2.5 rounded-full ${c.isOnline ? "bg-emerald-500" : "bg-slate-300"}`} />
            </div>
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-amber-500"><Star size={14} className="fill-amber-400" /> {c.ratingAvg?.toFixed?.(1) ?? c.ratingAvg}</span>
              <span className="text-slate-400">{c.totalDeliveries} yetkazma</span>
              <span className="capitalize text-slate-400">{c.vehicleType}</span>
            </div>
            <button onClick={() => toggleActive(c)} className={`w-full rounded-xl py-2 text-sm font-semibold ${c.isActive ? "bg-rose-50 text-rose-600 dark:bg-rose-950" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950"}`}>
              {c.isActive ? "Bloklash" : "Faollashtirish"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
