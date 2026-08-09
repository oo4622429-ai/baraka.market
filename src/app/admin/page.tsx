"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

type Stats = {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  statusBreakdown: { status: string; count: number }[];
  last7days: { day: string; count: number; revenue: number }[];
  topProducts: { productId: number; name: string; qty: number; revenue: number }[];
  recentOrders: { id: number; orderNumber: string; total: string; status: string; createdAt: string }[];
};

const COLORS = ["#059669", "#f59e0b", "#3b82f6", "#8b5cf6", "#06b6d4", "#f43f5e", "#64748b", "#10b981"];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
  }, []);

  if (!stats) return <div className="py-24 text-center text-slate-400">Yuklanmoqda...</div>;

  const cards = [
    { label: "Jami buyurtmalar", value: stats.totalOrders, icon: ShoppingCart, color: "bg-emerald-100 text-emerald-700" },
    { label: "Jami tushum", value: formatMoney(stats.totalRevenue), icon: DollarSign, color: "bg-orange-100 text-orange-700" },
    { label: "Mahsulotlar", value: stats.totalProducts, icon: Package, color: "bg-blue-100 text-blue-700" },
    { label: "Mijozlar", value: stats.totalCustomers, icon: Users, color: "bg-purple-100 text-purple-700" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Boshqaruv paneli</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className={`mb-3 inline-grid h-10 w-10 place-items-center rounded-xl ${c.color}`}>
              <c.icon size={20} />
            </span>
            <div className="text-xl font-bold">{c.value}</div>
            <div className="text-xs text-slate-400">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <h2 className="mb-4 font-bold">So&apos;nggi 7 kunlik savdo</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.last7days}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v) => formatMoney(Number(v ?? 0))} />
              <Area type="monotone" dataKey="revenue" stroke="#059669" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-bold">Holat bo&apos;yicha buyurtmalar</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={stats.statusBreakdown} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {stats.statusBreakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {stats.statusBreakdown.map((s, i) => (
              <span key={s.status} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {ORDER_STATUS_LABELS[s.status as OrderStatus]?.uz ?? s.status} ({s.count})
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-bold">Eng ko&apos;p sotilgan mahsulotlar</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.topProducts} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" fontSize={11} />
              <YAxis dataKey="name" type="category" width={140} fontSize={10} />
              <Tooltip />
              <Bar dataKey="qty" fill="#059669" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-bold">So&apos;nggi buyurtmalar</h2>
          <div className="space-y-2">
            {stats.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-2.5 text-sm dark:border-slate-800">
                <span className="font-medium">#{o.orderNumber}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_LABELS[o.status as OrderStatus]?.color}`}>
                  {ORDER_STATUS_LABELS[o.status as OrderStatus]?.uz}
                </span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">{formatMoney(o.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
