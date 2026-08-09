"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";

type Banner = { id: number; titleUz: string | null; imageUrl: string; isActive: boolean; sortOrder: number };

export default function AdminBannersPage() {
  const [items, setItems] = useState<Banner[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ titleUz: "", imageUrl: "", linkType: "none", sortOrder: "0" });

  function load() {
    fetch("/api/admin/banners").then((r) => r.json()).then((d) => setItems(d.banners ?? []));
  }
  useEffect(load, []);

  async function save() {
    await fetch("/api/admin/banners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setModalOpen(false);
    setForm({ titleUz: "", imageUrl: "", linkType: "none", sortOrder: "0" });
    load();
  }

  async function toggleActive(b: Banner) {
    await fetch(`/api/admin/banners/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !b.isActive }) });
    load();
  }

  async function remove(id: number) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bannerlar</h1>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"><Plus size={18} /> Yangi</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.imageUrl} alt="" className="h-32 w-full object-cover" />
            <div className="flex items-center justify-between p-3">
              <span className="text-sm font-medium">{b.titleUz}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(b)} className={`rounded-full px-2 py-0.5 text-xs ${b.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{b.isActive ? "Faol" : "Nofaol"}</button>
                <button onClick={() => remove(b.id)} className="text-rose-500"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Yangi banner</h2><button onClick={() => setModalOpen(false)}><X size={20} /></button></div>
            <div className="space-y-3">
              <input placeholder="Sarlavha" value={form.titleUz} onChange={(e) => setForm({ ...form, titleUz: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
              <input placeholder="Rasm URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
              <input placeholder="Tartib raqami" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
            </div>
            <button onClick={save} className="mt-5 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700">Saqlash</button>
          </div>
        </div>
      )}
    </div>
  );
}
