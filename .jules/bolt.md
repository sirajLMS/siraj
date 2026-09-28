## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-09 - Caching Intl.DateTimeFormat and Set lookup for Timezone Options

**Learning:** Generating options for ~420 timezones in `getTimezoneOptions` previously called `date.toLocaleString("en-US", { timeZone: ... })` twice per timezone, instantiating ~840 heavy JS runtime `Intl.DateTimeFormat` objects and performing O(N) array scans (`includes`) on validity checks. This took ~1.1s per `getTimezoneOptions` call.
**Action:** Cache `Intl.DateTimeFormat` instances in a `Map`, reuse computed `offsetMinutes` for `offsetLabel`, and use a `Set` for `isValidIanaTimezoneId`.

## 2026-09-28 - Caching Intl.NumberFormat in Billing & Accounting View Models

**Learning:** Uncached `new Intl.NumberFormat(locale, options)` inside list mapping callbacks (such as `formatLedgerAmount` in `usePaymentsLedgerViewModel` and `formatHours`/`summarizeSelection` in accounting dialogs) incurs ~50x higher CPU overhead (368ms vs 7ms per 10k items) and GC pressure from repeated ICU formatter instantiations.
**Action:** Use module-level `Map<string, Intl.NumberFormat>` caches keyed by locale tag to reuse `Intl.NumberFormat` instances in number and currency formatters across view models.
