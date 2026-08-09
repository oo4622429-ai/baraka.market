"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useApp } from "@/components/providers";
import { formatMoney } from "@/lib/format";

type CartItem = {
  id: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
    nameUz: string;
    nameRu: string;
    nameEn: string;
    price: string;
    oldPrice: string | null;
    coverImageUrl: string | null;
    unit: string;
  };
};

export default function CartPage() {
  const { locale, t, refreshCartCount } = useApp();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/cart");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateQty(productId: number, quantity: number) {
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
    await fetch(`/api/cart/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    await refreshCartCount();
    if (quantity <= 0) load();
  }

  async function removeItem(productId: number) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    await fetch(`/api/cart/${productId}`, { method: "DELETE" });
    await refreshCartCount();
  }

  const subtotal = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);

  function name(p: CartItem["product"]) {
    return locale === "ru" ? p.nameRu : locale === "en" ? p.nameEn : p.nameUz;
  }

  if (loading) return <div className="py-24 text-center text-slate-400">Yuklanmoqda...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("cart")}</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 py-24 text-center dark:border-slate-700">
          <ShoppingBag size={48} className="text-slate-300" />
          <p className="text-slate-400">{t("cartEmpty")}</p>
          <Link href="/" className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700">
            {t("catalog")}ga o&apos;tish
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.product.coverImageUrl ?? ""} alt="" className="h-20 w-20 rounded-xl object-cover" />
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between gap-2">
                    <Link href={`/products/${item.productId}`} className="font-medium hover:text-emerald-600">{name(item.product)}</Link>
                    <button onClick={() => removeItem(item.productId)} className="text-slate-400 hover:text-rose-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700">
                      <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="p-2"><Minus size={14} /></button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="p-2"><Plus size={14} /></button>
                    </div>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {formatMoney(Number(item.product.price) * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 font-bold">{t("total")}</h2>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-500">{t("subtotal")}</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="mb-4 flex justify-between text-sm">
              <span className="text-slate-500">{t("deliveryFee")}</span>
              <span>{subtotal >= 300000 ? "Bepul" : formatMoney(15000)}</span>
            </div>
            <div className="mb-4 flex justify-between border-t border-slate-100 pt-3 font-bold dark:border-slate-800">
              <span>{t("total")}</span>
              <span className="text-emerald-700 dark:text-emerald-400">
                {formatMoney(subtotal + (subtotal >= 300000 ? 0 : 15000))}
              </span>
            </div>
            <button
              onClick={() => router.push("/checkout")}
              className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              {t("checkout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
