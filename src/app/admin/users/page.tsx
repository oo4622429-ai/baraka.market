"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/format";

type User = { id: number; fullName: string | null; phone: string; roleName: string; isActive: boolean; createdAt: string };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState("");

  function load() {
    fetch(`/api/admin/users?q=${encodeURIComponent(q)}`).then((r) => r.json()).then((d) => setUsers(d.users ?? []));
  }
  useEffect(load, []);

  async function toggleActive(u: User) {
    await fetch(`/api/admin/users/${u.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !u.isActive }) });
    load();
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Foydalanuvchilar</h1>
      <div className="mb-4 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Ism yoki telefon..." className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
        <button onClick={load} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">Qidirish</button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 text-left text-xs text-slate-400 dark:border-slate-800">
            <tr><th className="p-3">Ism</th><th className="p-3">Telefon</th><th className="p-3">Rol</th><th className="p-3">Ro&apos;yxatdan o&apos;tgan</th><th className="p-3">Holat</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 dark:border-slate-800/50">
                <td className="p-3 font-medium">{u.fullName}</td>
                <td className="p-3">{u.phone}</td>
                <td className="p-3 capitalize">{u.roleName}</td>
                <td className="p-3 text-xs text-slate-400">{formatDate(u.createdAt)}</td>
                <td className="p-3">
                  <button onClick={() => toggleActive(u)} className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                    {u.isActive ? "Faol" : "Bloklangan"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
