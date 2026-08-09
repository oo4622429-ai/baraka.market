"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { formatDate } from "@/lib/format";

type Promotion = { id: number; titleUz: string; discountPercent: number; isActive: boolean; startsAt: string; endsAt: string };

export default function AdminPromotionsPage() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ titleUz: "", descriptionUz: "", discountPercent: "10", startsAt: "", endsAt: "" });

  function load() {
    fetch("/api/admin/promotions").then((r) => r.json()).then((d) => setItems(d.promotions ?? []));
  }
  useEffect(load, []);

  async function save() {
    await fetch("/api/admin/promotions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setModalOpen(false);
    load();
  }
  async function toggleActive(p: Promotion) {
    await fetch(`/api/admin/promotions/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !p.isActive }) });
    load();
  }
  async function remove(id: number) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    await fetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Aksiyalar</h1>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"><Plus size={18} /> Yangi</button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 text-left text-xs text-slate-400 dark:border-slate-800"><tr><th className="p-3">Nomi</th><th className="p-3">Chegirma</th><th className="p-3">Muddati</th><th className="p-3">Holat</th><th className="p-3"></th></tr></thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800/50">
                <td className="p-3 font-medium">{p.titleUz}</td>
                <td className="p-3">{p.discountPercent}%</td>
                <td className="p-3 text-xs text-slate-400">{formatDate(p.startsAt)} — {formatDate(p.endsAt)}</td>
                <td className="p-3"><button onClick={() => toggleActive(p)} className={`rounded-full px-2 py-0.5 text-xs ${p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{p.isActive ? "Faol" : "Nofaol"}</button></td>
                <td className="p-3"><button onClick={() => remove(p.id)} className="text-rose-500"><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Yangi aksiya</h2><button onClick={() => setModalOpen(false)}><X size={20} /></button></div>
            <div className="space-y-3">
              <input placeholder="Nomi" value={form.titleUz} onChange={(e) => setForm({ ...form, titleUz: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
              <textarea placeholder="Tavsif" value={form.descriptionUz} onChange={(e) => setForm({ ...form, descriptionUz: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" rows={2} />
              <input placeholder="Chegirma %" type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
              <input type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
              <input type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
            </div>
            <button onClick={save} className="mt-5 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700">Saqlash</button>
          </div>
        </div>
      )}
    </div>
  );
}
