import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount);
  return `Rs. ${new Intl.NumberFormat("en-PK").format(rounded)}`;
}

export function formatTimeAgo(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

export function getElapsedMinutes(dateString: string | Date | null | undefined): number {
  if (!dateString) return 0;
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60)));
}

export function getElapsedSeconds(dateString: string | Date | null | undefined): number {
  if (!dateString) return 0;
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.max(0, Math.floor(diffMs / 1000));
}

export function formatTimer(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Available discount coupons
export const AVAILABLE_COUPONS: Record<string, { label: string; type: "FIXED" | "PERCENT"; value: number }> = {
  PIZZA100: { label: "Rs. 100 Off Pizza World Special", type: "FIXED", value: 100 },
  HOTDEAL10: { label: "10% Off Hot Deals", type: "PERCENT", value: 10 },
  FAMILY20: { label: "20% Off Family Feast", type: "PERCENT", value: 20 },
  KHICHIWALA: { label: "Local Khichiwala Special (15% Off)", type: "PERCENT", value: 15 },
  STAFF50: { label: "Staff Discount (50% Off)", type: "PERCENT", value: 50 },
};
