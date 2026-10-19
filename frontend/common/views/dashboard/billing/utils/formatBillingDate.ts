function resolveBillingDateLocale(locale: string): string {
  if (locale.startsWith("ar")) {
    return "ar-SA";
  }
  return "en-US";
}

/** Module-level Intl.DateTimeFormat caches keyed by resolved locale tag. */
const billingDateDtfCache = new Map<string, Intl.DateTimeFormat>();
const billingMonthDtfCache = new Map<string, Intl.DateTimeFormat>();

function getBillingDateDtf(localeTag: string): Intl.DateTimeFormat {
  let dtf = billingDateDtfCache.get(localeTag);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat(localeTag, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    billingDateDtfCache.set(localeTag, dtf);
  }
  return dtf;
}

function getBillingMonthDtf(localeTag: string): Intl.DateTimeFormat {
  let dtf = billingMonthDtfCache.get(localeTag);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat(localeTag, { month: "long" });
    billingMonthDtfCache.set(localeTag, dtf);
  }
  return dtf;
}

export function formatBillingDate(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) {
    return "";
  }
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return getBillingDateDtf(resolveBillingDateLocale(locale)).format(date);
}

export function formatBillingMonth(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) {
    return "";
  }
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return getBillingMonthDtf(resolveBillingDateLocale(locale)).format(date);
}
