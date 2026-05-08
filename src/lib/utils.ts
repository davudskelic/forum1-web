import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("bs-BA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Upravo";
  if (diffMins < 60) return `Prije ${diffMins}min`;
  if (diffHours < 24) return `Prije ${diffHours}h`;
  if (diffDays < 7) return `Prije ${diffDays}d`;
  return formatDate(dateStr);
}

export function getInitials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}
