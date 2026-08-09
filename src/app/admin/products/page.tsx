"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { formatMoney } from "@/lib/format";

type Category = { id: number; nameUz: string };
type Brand = { id: number; name: string };
type Product = {
  id: number; nameUz: string; nameRu: string; nameEn: string; sku: string; price: string; oldPrice: string | null;
  unit: string; categoryId: number; brandId: number | null; coverImageUrl: string | null; isActive: boolean;
  isFeatured: boolean; categoryName: string | null; brandName: string | null; manufacturer: string | null;
  weightGrams: number | null; volumeMl: number | null; calories: number | null; descriptionUz: string | null;
};

const empty = {
  nameUz: "", nameRu: "", nameEn: "", sku: "", barcode: "", price: "", oldPrice: "", categoryId: "", brandId: "",
  manufacturer: "", unit: "dona", weightGrams: "", volumeMl: "", calories: "", coverImageUrl: "", descriptionUz: "",
  isActive: true, isFeatured: false,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(empty);

  async function load() {
    const [p, c, b] = await Promise.all([
      fetch(`/api/admin/products?q=${encodeURIComponent(q)}`).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/brands").then((r) => r.json()),
    ]);
    setProducts(p.products ?? []);
    setCategories(c.categories ?? []);
    setBrands(b.brands ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      nameUz: p.nameUz, nameRu: p.nameRu, nameEn: p.nameEn, sku: p.sku, barcode: "", price: p.price,
      oldPrice: p.oldPrice ?? "", categoryId: String(p.categoryId), brandId: p.brandId ? String(p.brandId) : "",
      manufacturer: p.manufacturer ?? "", unit: p.unit, weightGrams: p.weightGrams ? String(p.weightGrams) : "",
      volumeMl: p.volumeMl ? String(p.volumeMl) : "", calories: p.calories ? String(p.calories) : "",
      coverImageUrl: p.coverImageUrl ?? "", descriptionUz: p.descriptionUz ?? "", isActive: p.isActive, isFeatured: p.isFeatured,
    });
    setModalOpen(true);
  }

  async function save() {
    const url = editing ? `/api/admin/products/${editing.id}` : "/api/admin/products";
    const method = editing ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setModalOpen(false);
    load();
  }

  async function remove(id: number) {
    if (!confirm("Mahsulotni o'chirishni tasdiqlaysizmi?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Mahsulotlar</h1>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">
          <Plus size={18} /> Yangi mahsulot
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
        <Search size={16} className="text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Mahsulot qidirish..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 text-left text-xs text-slate-400 dark:border-slate-800">
            <tr>
              <th className="p-3">Mahsulot</th>
              <th className="p-3">Kategoriya</th>
              <th className="p-3">Brend</th>
              <th className="p-3">Narx</th>
              <th className="p-3">Holat</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800/50">
                <td className="flex items-center gap-3 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.coverImageUrl ?? ""} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  <div>
                    <div className="font-medium">{p.nameUz}</div>
                    <div className="text-xs text-slate-400">{p.sku}</div>
                  </div>
                </td>
                <td className="p-3">{p.categoryName}</td>
                <td className="p-3">{p.brandName ?? "—"}</td>
                <td className="p-3 font-semibold text-emerald-700 dark:text-emerald-400">{formatMoney(p.price)}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                    {p.isActive ? "Faol" : "Nofaol"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil size={16} /></button>
                    <button onClick={() => remove(p.id)} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}</h2>
              <button onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nomi (UZ)"><input value={form.nameUz} onChange={(e) => setForm({ ...form, nameUz: e.target.value })} className="input" /></Field>
              <Field label="Nomi (RU)"><input value={form.nameRu} onChange={(e) => setForm({ ...form, nameRu: e.target.value })} className="input" /></Field>
              <Field label="Nomi (EN)"><input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="input" /></Field>
              <Field label="SKU"><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="input" /></Field>
              <Field label="Shtrix kod"><input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="input" /></Field>
              <Field label="Narxi"><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" /></Field>
              <Field label="Eski narxi"><input type="number" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} className="input" /></Field>
              <Field label="Birligi">
                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="input">
                  <option value="dona">dona</option><option value="kg">kg</option><option value="litr">litr</option><option value="quti">quti</option>
                </select>
              </Field>
              <Field label="Kategoriya">
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input">
                  <option value="">Tanlang</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.nameUz}</option>)}
                </select>
              </Field>
              <Field label="Brend">
                <select value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })} className="input">
                  <option value="">Yo'q</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
              <Field label="Ishlab chiqaruvchi"><input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className="input" /></Field>
              <Field label="Og'irligi (g)"><input type="number" value={form.weightGrams} onChange={(e) => setForm({ ...form, weightGrams: e.target.value })} className="input" /></Field>
              <Field label="Hajmi (ml)"><input type="number" value={form.volumeMl} onChange={(e) => setForm({ ...form, volumeMl: e.target.value })} className="input" /></Field>
              <Field label="Kaloriya"><input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} className="input" /></Field>
              <Field label="Rasm URL"><input value={form.coverImageUrl} onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })} className="input" /></Field>
              <div className="sm:col-span-2">
                <Field label="Tavsif"><textarea value={form.descriptionUz} onChange={(e) => setForm({ ...form, descriptionUz: e.target.value })} className="input" rows={3} /></Field>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Faol</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Tavsiya etilgan</label>
            </div>
            <button onClick={save} className="mt-5 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700">Saqlash</button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background: transparent;
        }
        .dark .input {
          border-color: rgb(30 41 59);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-slate-400">{label}</span>
      {children}
    </label>
  );
}
