"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/format";

type Log = { id: number; action: string; entity: string | null; entityId: string | null; userName: string | null; createdAt: string };

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    fetch("/api/admin/activity").then((r) => r.json()).then((d) => setLogs(d.logs ?? []));
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Faollik jurnali</h1>
      {logs.length === 0 ? (
        <p className="text-slate-400">Hozircha yozuvlar yo&apos;q. Admin tomonidan bajarilgan muhim amallar shu yerda qayd etiladi.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
              <span>{l.userName ?? "Tizim"} — {l.action} {l.entity ? `(${l.entity} #${l.entityId})` : ""}</span>
              <span className="text-xs text-slate-400">{formatDate(l.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
