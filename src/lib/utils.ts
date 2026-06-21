import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(n: number): string {
  return "¥" + n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatMoneyShort(n: number): string {
  if (Math.abs(n) >= 10000) {
    return "¥" + (n / 10000).toFixed(1) + "万";
  }
  return "¥" + n.toLocaleString("zh-CN", { maximumFractionDigits: 0 });
}

export function todayISO(): string {
  const d = new Date();
  return toISODate(d);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso.replace(/-/g, "/"));
  if (isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function formatDateFull(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso.replace(/-/g, "/"));
  if (isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso.replace(/-/g, "/"));
  if (isNaN(d.getTime())) return iso;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getMonth() + 1}月${d.getDate()}日 ${hh}:${mm}`;
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a.replace(/-/g, "/")).getTime();
  const db = new Date(b.replace(/-/g, "/")).getTime();
  return Math.round((db - da) / 86400000);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso.replace(/-/g, "/"));
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
}

export function weekdayLabel(iso: string): string {
  const d = new Date(iso.replace(/-/g, "/"));
  const labels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return labels[d.getDay()];
}
