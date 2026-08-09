export function formatMoney(value: number | string, locale: string = "uz") {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "0";
  const formatted = new Intl.NumberFormat("ru-RU").format(Math.round(n));
  return `${formatted} so'm`;
}

export function formatDate(date: Date | string, opts: Intl.DateTimeFormatOptions = {}) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...opts,
  }).format(d);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9а-яёў\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function genOrderNumber() {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `BM-${rand}`;
}

export function genCode(prefix: string, len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}${out}`;
}
