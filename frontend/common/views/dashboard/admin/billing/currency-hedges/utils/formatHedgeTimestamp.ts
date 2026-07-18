// NEW FOR PLAN v5: pure-data formatter lifted out of currencyHedges.{mobile,desktop}.tsx
// where it was duplicated as local `formatTimestamp` lowercase helpers (specs §5 +
// §3 N9 violation). Both tiers now import from here.
export function formatHedgeTimestamp(value: string | null | undefined, locale: string): string {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleString(locale);
}
