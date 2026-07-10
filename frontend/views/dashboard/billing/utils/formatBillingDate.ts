export function resolveBillingDateLocale(locale: string): string {
  if (locale.startsWith("ar")) {
    return "ar-SA";
  }
  return "en-US";
}

export function formatBillingDate(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) {
    return "";
  }
  return new Date(dateStr).toLocaleDateString(resolveBillingDateLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatBillingMonth(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) {
    return "";
  }
  return new Date(dateStr).toLocaleDateString(resolveBillingDateLocale(locale), { month: "long" });
}
