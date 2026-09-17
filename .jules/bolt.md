## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-09 - Caching Intl.DateTimeFormat and Set lookup for Timezone Options

**Learning:** Generating options for ~420 timezones in `getTimezoneOptions` previously called `date.toLocaleString("en-US", { timeZone: ... })` twice per timezone, instantiating ~840 heavy JS runtime `Intl.DateTimeFormat` objects and performing O(N) array scans (`includes`) on validity checks. This took ~1.1s per `getTimezoneOptions` call.
**Action:** Cache `Intl.DateTimeFormat` instances in a `Map`, reuse computed `offsetMinutes` for `offsetLabel`, and use a `Set` for `isValidIanaTimezoneId`.

## 2026-09-17 - Caching Intl.DisplayNames, Intl.NumberFormat, and Set lookups in Locale & Currency Helpers

**Learning:** High-frequency locale and currency helpers (`getCountryDisplayName`, `getLanguageDisplayName`, `getCurrencyDisplayName`, and `formatLockedAmount`) created fresh runtime `Intl.DisplayNames` and `Intl.NumberFormat` instances on every call, while currency validation re-allocated `Object.values(CurrencyCode)` arrays on every call.
**Action:** Cache `Intl.DisplayNames` and `Intl.NumberFormat` instances in module-level `Map` caches per locale/currency/options key and replace `Object.values().includes()` with module-level `Set.has()` checks.
