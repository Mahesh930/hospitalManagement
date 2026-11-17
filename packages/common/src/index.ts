/** Shared helpers for MediCore web packages (SSOT utilities). */

export function isBlank(value: string | null | undefined): boolean {
  return value == null || value.trim().length === 0;
}

export function formatInr(amount: number | null | undefined): string {
  const n = amount ?? 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function roleLabel(role: string): string {
  return role.replace(/_/g, " ");
}

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message: string;
};
