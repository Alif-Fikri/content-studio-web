const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat("id-ID");
const compact = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });
const shortDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" });
const fullDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
const dateTime = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

export function formatRupiah(value: number): string {
  return rupiah.format(value);
}

export function formatInt(value: number): string {
  return integer.format(value);
}

export function formatCompact(value: number): string {
  return compact.format(value);
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(2).replace(".", ",")}%`;
}

export function formatRate(percentValue: number): string {
  if (!Number.isFinite(percentValue)) return "—";
  return `${percentValue.toFixed(2).replace(".", ",")}%`;
}

export function formatDate(value: string): string {
  return fullDate.format(new Date(value));
}

export function formatShortDate(value: string): string {
  return shortDate.format(new Date(value));
}

export function formatDateTime(value: string): string {
  return dateTime.format(new Date(value));
}

export function formatRelative(value: string, now = Date.now()): string {
  const seconds = Math.round((now - new Date(value).getTime()) / 1000);
  if (seconds < 45) return "barusan";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return formatDate(value);
}

export function timecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--.-";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${rest.toFixed(1).padStart(4, "0")}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}
