import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats any price value (number, string, Prisma.Decimal) into Chilean Pesos (CLP).
 * e.g. 89990 -> "$89.990"
 */
export function formatCLP(val: any): string {
  if (val === null || val === undefined) return "$0";
  const num = Number(val);
  if (isNaN(num)) return "$0";

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Formats date to local Chilean string format.
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Returns formatted percentage text.
 */
export function formatPercentage(val: any): string {
  if (val === null || val === undefined) return "0%";
  const num = Number(val);
  if (isNaN(num)) return "0%";
  const formatted = num.toFixed(1).replace(".", ",");
  return num > 0 ? `+${formatted}%` : `${formatted}%`;
}
