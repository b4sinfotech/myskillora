import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";

// ── Class name utility ────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ── Currency formatting ───────────────────────────────────────────────────────

export function formatCurrency(
  amount: number,
  currency: string = "INR",
  locale: string = "en-IN"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100); // amounts stored in paise
}

export function formatCurrencyRaw(amount: number, currency: string = "INR"): string {
  return formatCurrency(amount * 100, currency);
}

// ── Date/time formatting ──────────────────────────────────────────────────────

export function formatDate(date: string | Date, pattern: string = "dd MMM yyyy"): string {
  const parsed = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(parsed)) return "—";
  return format(parsed, pattern);
}

export function formatTime(date: string | Date, pattern: string = "h:mm a"): string {
  const parsed = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(parsed)) return "—";
  return format(parsed, pattern);
}

export function formatRelativeTime(date: string | Date): string {
  const parsed = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(parsed)) return "—";
  return formatDistanceToNow(parsed, { addSuffix: true });
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "dd MMM yyyy, h:mm a");
}

// ── Slug utilities ────────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── String utilities ──────────────────────────────────────────────────────────

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase();
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// ── Number utilities ──────────────────────────────────────────────────────────

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ── Validation ────────────────────────────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^\+?[\d\s\-]{10,}$/.test(phone);
}

// ── Contact info detection (for chat safety filter) ───────────────────────────

const CONTACT_PATTERNS = [
  /(\+?[\d\s\-]{10,})/g,           // phone numbers
  /[\w.+]+@[\w.]+\.[a-z]{2,}/gi,  // email addresses
  /@[\w.]+/g,                       // social handles
  /\b(whatsapp|telegram|instagram|facebook|twitter|snapchat|signal|wechat)\b/gi,
];

export function containsContactInfo(text: string): boolean {
  return CONTACT_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}

export function redactContactInfo(text: string): string {
  let result = text;
  for (const pattern of CONTACT_PATTERNS) {
    pattern.lastIndex = 0;
    result = result.replace(pattern, "[contact info removed]");
  }
  return result;
}

// ── URL utilities ─────────────────────────────────────────────────────────────

export function buildSearchParams(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  return searchParams.toString();
}

// ── Commission calculation ─────────────────────────────────────────────────────

export function calculatePlatformFee(amount: number, commissionRate: number): number {
  return Math.round(amount * commissionRate);
}

export function calculateTeacherPayout(amount: number, commissionRate: number): number {
  return amount - calculatePlatformFee(amount, commissionRate);
}

// ── Avatar fallback ───────────────────────────────────────────────────────────

export function getAvatarUrl(avatarUrl: string | null, name: string | null): string {
  if (avatarUrl) return avatarUrl;
  const initials_ = initials(name ?? "U");
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials_)}&background=0F172A&color=F59E0B&size=128&bold=true`;
}
