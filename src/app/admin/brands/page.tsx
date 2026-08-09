"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";

type Brand = { id: number; name: string; country: string | null; logoUrl: string | null; isActive: boolean };

export default function AdminBrandsPage() {
  const [items, setItems] = useState<Brand[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", country: "", description: "" });

  function load() {
    fetch("/api/admin/brands").then((r) => r.json()).then((d) => setItems(d.brands ?? []));
  }
  useEffect(load, []);

  async function save() {
    await fetch("/api/admin/brands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setModalOpen(false);
    setForm({ name: "", country: "", description: "" });
    load();
  }

  async function remove(id: number) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    await fetch(`/api/admin/brands/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Brendlar</h1>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"><Plus size={18} /> Yangi</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.logoUrl ?? ""} alt="" className="h-9 w-9 rounded-full" />
              <div>
                <div className="font-semibold">{b.name}</div>
                <div className="text-xs text-slate-400">{b.country}</div>
              </div>
            </div>
            <button onClick={() => remove(b.id)} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Yangi brend</h2><button onClick={() => setModalOpen(false)}><X size={20} /></button></div>
            <div className="space-y-3">
              <input placeholder="Nomi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
              <input placeholder="Davlat" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
              <textarea placeholder="Tavsif" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" rows={3} />
            </div>
            <button onClick={save} className="mt-5 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700">Saqlash</button>
          </div>
        </div>
      )}
    </div>
  );
}
