"use client";

import { useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Gift, Wallet as WalletIcon } from "lucide-react";
import { useApp } from "@/components/providers";
import { formatDate, formatMoney } from "@/lib/format";

type Tx = { id: number; amount: string; type: string; description: string | null; createdAt: string };

export default function WalletPage() {
  const { t } = useApp();
  const [wallet, setWallet] = useState<{ balance: string } | null>(null);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [bonusHistory, setBonusHistory] = useState<Tx[]>([]);

  useEffect(() => {
    fetch("/api/wallet")
      .then((r) => r.json())
      .then((d) => {
        setWallet(d.wallet);
        setTransactions(d.transactions ?? []);
        setBonusHistory(d.bonusHistory ?? []);
      });
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("myWallet")}</h1>

      <div className="mb-8 rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white shadow-lg">
        <div className="mb-2 flex items-center gap-2 text-emerald-100"><WalletIcon size={18} /> Balans</div>
        <div className="text-3xl font-extrabold">{formatMoney(wallet?.balance ?? 0)}</div>
        <p className="mt-2 text-sm text-emerald-100">Har bir xariddan 2% bonus qaytariladi</p>
      </div>

      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
        <Gift className="text-emerald-600" size={24} />
        <div>
          <div className="font-semibold">{t("giftCards")}</div>
          <div className="text-sm text-slate-500">Sovg'a kartangiz bormi? Buyurtma berish paytida kodini kiriting.</div>
        </div>
      </div>

      <h2 className="mb-3 font-bold">Tranzaksiyalar tarixi</h2>
      <div className="space-y-2">
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
            <div className="flex items-center gap-2">
              {Number(tx.amount) >= 0 ? <ArrowUpCircle size={16} className="text-emerald-600" /> : <ArrowDownCircle size={16} className="text-rose-500" />}
              <div>
                <div className="font-medium">{tx.description ?? tx.type}</div>
                <div className="text-xs text-slate-400">{formatDate(tx.createdAt)}</div>
              </div>
            </div>
            <span className={Number(tx.amount) >= 0 ? "font-semibold text-emerald-600" : "font-semibold text-rose-500"}>
              {Number(tx.amount) >= 0 ? "+" : ""}{formatMoney(tx.amount)}
            </span>
          </div>
        ))}
        {transactions.length === 0 && <p className="text-sm text-slate-400">Hozircha tranzaksiyalar yo&apos;q</p>}
      </div>

      <h2 className="mb-3 mt-8 font-bold">{t("bonusPoints")} tarixi</h2>
      <div className="space-y-2">
        {bonusHistory.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
            <span>{tx.type === "earn" ? "Bonus qo'shildi" : "Bonus ishlatildi"}</span>
            <span className={Number(tx.amount) >= 0 ? "font-semibold text-emerald-600" : "font-semibold text-rose-500"}>
              {Number(tx.amount) >= 0 ? "+" : ""}{formatMoney(tx.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
