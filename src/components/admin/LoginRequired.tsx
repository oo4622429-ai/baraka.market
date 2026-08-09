import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function LoginRequired() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-4 dark:bg-slate-950">
      <div className="max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <ShieldAlert size={48} className="mx-auto mb-4 text-orange-500" />
        <h1 className="mb-2 text-xl font-bold">Admin panelga kirish</h1>
        <p className="mb-6 text-sm text-slate-500">
          Bu bo&apos;limga faqat admin, manager yoki super admin huquqiga ega foydalanuvchilar kira oladi. Demo uchun quyidagi
          telefon raqamlaridan foydalaning: <b>+998901111111</b> (super admin), <b>+998901111112</b> (admin).
        </p>
        <Link href="/login" className="inline-block rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700">
          Tizimga kirish
        </Link>
      </div>
    </div>
  );
}
