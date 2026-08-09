"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { formatMoney } from "@/lib/format";

type Coupon = { id: number; code: string; type: string; value: string; usedCount: number; usageLimit: number; isActive: boolean };

export default function AdminCouponsPage() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ code: "", type: "percent", value: "10", minOrderAmount: "0", usageLimit: "100", perUserLimit: "1", startsAt: "", endsAt: "" });

  function load() {
    fetch("/api/admin/coupons").then((r) => r.json()).then((d) => setItems(d.coupons ?? []));
  }
  useEffect(load, []);

  async function save() {
    await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setModalOpen(false);
    load();
  }
  async function toggleActive(c: Coupon) {
    await fetch(`/api/admin/coupons/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !c.isActive }) });
    load();
  }
  async function remove(id: number) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kupon kodlar</h1>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"><Plus size={18} /> Yangi</button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 text-left text-xs text-slate-400 dark:border-slate-800"><tr><th className="p-3">Kod</th><th className="p-3">Turi</th><th className="p-3">Qiymati</th><th className="p-3">Ishlatilgan</th><th className="p-3">Holat</th><th className="p-3"></th></tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b border-slate-50 dark:border-slate-800/50">
                <td className="p-3 font-mono font-semibold">{c.code}</td>
                <td className="p-3">{c.type === "percent" ? "Foiz" : "Aniq summa"}</td>
                <td className="p-3">{c.type === "percent" ? `${c.value}%` : formatMoney(c.value)}</td>
                <td className="p-3">{c.usedCount}/{c.usageLimit}</td>
                <td className="p-3"><button onClick={() => toggleActive(c)} className={`rounded-full px-2 py-0.5 text-xs ${c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{c.isActive ? "Faol" : "Nofaol"}</button></td>
                <td className="p-3"><button onClick={() => remove(c.id)} className="text-rose-500"><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Yangi kupon</h2><button onClick={() => setModalOpen(false)}><X size={20} /></button></div>
            <div className="space-y-3">
              <input placeholder="Kod (masalan BARAKA10)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                <option value="percent">Foiz chegirma</option>
                <option value="fixed">Aniq summa chegirma</option>
              </select>
              <input placeholder="Qiymati" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
              <input placeholder="Minimal buyurtma summasi" type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
              <input placeholder="Foydalanish limiti" type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
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
