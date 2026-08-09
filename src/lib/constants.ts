export const APP_NAME = "Baraka Market";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packing",
  "courier_assigned",
  "on_the_way",
  "delivered",
  "cancelled",
  "returned",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, { uz: string; ru: string; en: string; color: string }> = {
  pending: { uz: "Kutilmoqda", ru: "В ожидании", en: "Pending", color: "bg-amber-100 text-amber-700" },
  confirmed: { uz: "Tasdiqlandi", ru: "Подтвержден", en: "Confirmed", color: "bg-blue-100 text-blue-700" },
  packing: { uz: "Yig'ilmoqda", ru: "Собирается", en: "Packing", color: "bg-indigo-100 text-indigo-700" },
  courier_assigned: {
    uz: "Kuryer tayinlandi",
    ru: "Курьер назначен",
    en: "Courier assigned",
    color: "bg-purple-100 text-purple-700",
  },
  on_the_way: { uz: "Yo'lda", ru: "В пути", en: "On the way", color: "bg-cyan-100 text-cyan-700" },
  delivered: { uz: "Yetkazildi", ru: "Доставлен", en: "Delivered", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { uz: "Bekor qilindi", ru: "Отменен", en: "Cancelled", color: "bg-rose-100 text-rose-700" },
  returned: { uz: "Qaytarildi", ru: "Возвращен", en: "Returned", color: "bg-slate-200 text-slate-700" },
};

export const PAYMENT_METHODS = ["cash", "card", "wallet"] as const;

export const LOCALES = ["uz", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const CURRENCY = "so'm";
