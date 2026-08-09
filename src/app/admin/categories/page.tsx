"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

type Category = { id: number; nameUz: string; nameRu: string; nameEn: string; icon: string | null; isActive: boolean; sortOrder: number };

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ nameUz: "", nameRu: "", nameEn: "", icon: "🛒", sortOrder: "0" });

  function load() {
    fetch("/api/admin/categories").then((r) => r.json()).then((d) => setItems(d.categories ?? []));
  }
  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm({ nameUz: "", nameRu: "", nameEn: "", icon: "🛒", sortOrder: "0" });
    setModalOpen(true);
  }
  function openEdit(c: Category) {
    setEditing(c);
    setForm({ nameUz: c.nameUz, nameRu: c.nameRu, nameEn: c.nameEn, icon: c.icon ?? "🛒", sortOrder: String(c.sortOrder) });
    setModalOpen(true);
  }

  async function save() {
    const url = editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories";
    await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setModalOpen(false);
    load();
  }

  async function toggleActive(c: Category) {
    await fetch(`/api/admin/categories/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !c.isActive }) });
    load();
  }

  async function remove(id: number) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kategoriyalar</h1>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"><Plus size={18} /> Yangi</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{c.icon}</span>
              <div>
                <div className="font-semibold">{c.nameUz}</div>
                <button onClick={() => toggleActive(c)} className={`text-xs ${c.isActive ? "text-emerald-600" : "text-slate-400"}`}>{c.isActive ? "Faol" : "Nofaol"}</button>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil size={16} /></button>
              <button onClick={() => remove(c.id)} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">{editing ? "Tahrirlash" : "Yangi kategoriya"}</h2><button onClick={() => setModalOpen(false)}><X size={20} /></button></div>
            <div className="space-y-3">
              <input placeholder="Nomi (UZ)" value={form.nameUz} onChange={(e) => setForm({ ...form, nameUz: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
              <input placeholder="Nomi (RU)" value={form.nameRu} onChange={(e) => setForm({ ...form, nameRu: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
              <input placeholder="Nomi (EN)" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
              <input placeholder="Icon (emoji)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
              <input placeholder="Tartib raqami" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
            </div>
            <button onClick={save} className="mt-5 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700">Saqlash</button>
          </div>
        </div>
      )}
    </div>
  );
}
