"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MapPin, Plus, Ticket, Wallet as WalletIcon } from "lucide-react";
import { useApp } from "@/components/providers";
import { formatMoney } from "@/lib/format";

type Address = { id: number; title: string; city: string | null; street: string | null; building: string | null; isDefault: boolean };
type CartItem = { id: number; productId: number; quantity: number; product: { price: string; nameUz: string } };

export default function CheckoutPage() {
  const { t, refreshCartCount } = useApp();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "wallet">("cash");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [useBonus, setUseBonus] = useState(0);
  const [comment, setComment] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ title: "Uy", city: "", street: "", building: "" });
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/cart").then((r) => r.json()),
      fetch("/api/addresses").then((r) => r.json()),
      fetch("/api/wallet").then((r) => r.json()),
    ]).then(([cart, addr, wallet]) => {
      setItems(cart.items ?? []);
      setAddresses(addr.addresses ?? []);
      const def = (addr.addresses ?? []).find((a: Address) => a.isDefault) ?? addr.addresses?.[0];
      if (def) setAddressId(def.id);
      setWalletBalance(wallet.wallet ? Number(wallet.wallet.balance) : 0);
    });
  }, []);

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0), [items]);
  const deliveryFee = subtotal - couponDiscount >= 300000 ? 0 : 15000;
  const total = Math.max(0, subtotal - couponDiscount + deliveryFee - useBonus);

  async function applyCoupon() {
    setCouponError("");
    if (!couponCode) return;
    const res = await fetch("/api/coupons/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, subtotal }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCouponError(data.error);
      setCouponDiscount(0);
      return;
    }
    setCouponDiscount(data.discount);
  }

  async function addAddress() {
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newAddress, isDefault: addresses.length === 0 }),
    });
    const data = await res.json();
    setAddresses((prev) => [...prev, data.address]);
    setAddressId(data.address.id);
    setShowAddressForm(false);
  }

  async function placeOrder() {
    if (!addressId) return;
    setPlacing(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressId, paymentMethod, couponCode: couponDiscount ? couponCode : undefined, bonusToUse: useBonus, comment }),
    });
    const data = await res.json();
    setPlacing(false);
    if (!res.ok) {
      alert(data.error || "Xatolik yuz berdi");
      return;
    }
    await refreshCartCount();
    setSuccess(data.order.orderNumber);
    setTimeout(() => router.push(`/orders/${data.order.id}`), 1800);
  }

  if (success) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <CheckCircle2 size={64} className="mb-4 text-emerald-600" />
        <h1 className="mb-2 text-2xl font-bold">Buyurtma qabul qilindi!</h1>
        <p className="text-slate-500">Buyurtma raqami: <b>{success}</b></p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("checkout")}</h1>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 font-bold"><MapPin size={18} className="text-emerald-600" /> {t("address")}</h2>
            <div className="space-y-2">
              {addresses.map((a) => (
                <label key={a.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${addressId === a.id ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950" : "border-slate-200 dark:border-slate-700"}`}>
                  <input type="radio" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                  <div>
                    <div className="font-semibold">{a.title}</div>
                    <div className="text-slate-500">{a.city}, {a.street} {a.building}</div>
                  </div>
                </label>
              ))}
            </div>

            {showAddressForm ? (
              <div className="mt-3 space-y-2 rounded-xl border border-dashed border-slate-300 p-3 dark:border-slate-700">
                <input placeholder="Nomi (Uy, Ish...)" value={newAddress.title} onChange={(e) => setNewAddress({ ...newAddress, title: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
                <input placeholder="Shahar/tuman" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
                <input placeholder="Ko'cha" value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
                <input placeholder="Uy raqami" value={newAddress.building} onChange={(e) => setNewAddress({ ...newAddress, building: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
                <button onClick={addAddress} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Saqlash</button>
              </div>
            ) : (
              <button onClick={() => setShowAddressForm(true)} className="mt-3 flex items-center gap-1 text-sm font-medium text-emerald-600">
                <Plus size={16} /> {t("addAddress")}
              </button>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 font-bold">{t("payment")}</h2>
            <div className="grid grid-cols-3 gap-2">
              {(["cash", "card", "wallet"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`rounded-xl border p-3 text-sm font-medium ${paymentMethod === m ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950" : "border-slate-200 dark:border-slate-700"}`}
                >
                  {t(m)}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 font-bold"><Ticket size={18} className="text-emerald-600" /> {t("coupons")}</h2>
            <div className="flex gap-2">
              <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Kupon kodi" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" />
              <button onClick={applyCoupon} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">{t("apply")}</button>
            </div>
            {couponError && <p className="mt-2 text-sm text-rose-500">{couponError}</p>}
            {couponDiscount > 0 && <p className="mt-2 text-sm text-emerald-600">Chegirma qo&apos;llandi: -{formatMoney(couponDiscount)}</p>}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 font-bold"><WalletIcon size={18} className="text-emerald-600" /> {t("bonusUsed")}</h2>
            <p className="mb-2 text-sm text-slate-500">Mavjud balans: {formatMoney(walletBalance)}</p>
            <input
              type="range"
              min={0}
              max={Math.min(walletBalance, subtotal)}
              value={useBonus}
              onChange={(e) => setUseBonus(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <p className="text-sm">Ishlatiladigan: <b>{formatMoney(useBonus)}</b></p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 font-bold">Izoh</h2>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Kuryerga izoh (ixtiyoriy)" className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700" />
          </section>
        </div>

        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-bold">Buyurtma tafsilotlari</h2>
          <div className="mb-2 flex justify-between text-sm"><span className="text-slate-500">{t("subtotal")}</span><span>{formatMoney(subtotal)}</span></div>
          <div className="mb-2 flex justify-between text-sm"><span className="text-slate-500">{t("discount")}</span><span>-{formatMoney(couponDiscount)}</span></div>
          <div className="mb-2 flex justify-between text-sm"><span className="text-slate-500">{t("deliveryFee")}</span><span>{deliveryFee === 0 ? "Bepul" : formatMoney(deliveryFee)}</span></div>
          <div className="mb-4 flex justify-between text-sm"><span className="text-slate-500">{t("bonusUsed")}</span><span>-{formatMoney(useBonus)}</span></div>
          <div className="mb-4 flex justify-between border-t border-slate-100 pt-3 text-lg font-bold dark:border-slate-800">
            <span>{t("total")}</span>
            <span className="text-emerald-700 dark:text-emerald-400">{formatMoney(total)}</span>
          </div>
          <button
            disabled={!addressId || placing || items.length === 0}
            onClick={placeOrder}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {placing && <Loader2 size={16} className="animate-spin" />} {t("checkout")}
          </button>
        </div>
      </div>
    </div>
  );
}
