"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { useApp } from "@/components/providers";

type Address = { id: number; title: string; city: string | null; street: string | null; building: string | null; isDefault: boolean };

export default function AddressesPage() {
  const { t } = useApp();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "Uy", city: "", street: "", building: "" });

  function load() {
    fetch("/api/addresses").then((r) => r.json()).then((d) => setAddresses(d.addresses ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function addAddress() {
    await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, isDefault: addresses.length === 0 }),
    });
    setForm({ title: "Uy", city: "", street: "", building: "" });
    setShowForm(false);
    load();
  }

  async function remove(id: number) {
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("address")}</h1>
      <div className="space-y-3">
        {addresses.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-emerald-600" />
              <div>
                <div className="font-semibold">{a.title} {a.isDefault && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-900">Asosiy</span>}</div>
                <div className="text-sm text-slate-500">{a.city}, {a.street} {a.building}</div>
              </div>
            </div>
            <button onClick={() => remove(a.id)} className="text-slate-400 hover:text-rose-500"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>

      {showForm ? (
        <div className="mt-4 space-y-2 rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
          <input placeholder="Nomi" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
          <input placeholder="Shahar/tuman" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
          <input placeholder="Ko'cha" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
          <input placeholder="Uy raqami" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
          <button onClick={addAddress} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Saqlash</button>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="mt-4 flex items-center gap-1 text-sm font-medium text-emerald-600">
          <Plus size={16} /> {t("addAddress")}
        </button>
      )}
    </div>
  );
}
