## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-09 - Caching Intl.DateTimeFormat and Set lookup for Timezone Options

**Learning:** Generating options for ~420 timezones in `getTimezoneOptions` previously called `date.toLocaleString("en-US", { timeZone: ... })` twice per timezone, instantiating ~840 heavy JS runtime `Intl.DateTimeFormat` objects and performing O(N) array scans (`includes`) on validity checks. This took ~1.1s per `getTimezoneOptions` call.
**Action:** Cache `Intl.DateTimeFormat` instances in a `Map`, reuse computed `offsetMinutes` for `offsetLabel`, and use a `Set` for `isValidIanaTimezoneId`.

## 2026-09-20 - Caching Intl.DisplayNames, Intl.NumberFormat, and Set lookups for localized display helpers

**Learning:** Uncached calls to `new Intl.DisplayNames([locale], { type: ... })` and `new Intl.NumberFormat(locale, { ... })` inside currency, country, and language display helpers took ~3.67 seconds per 10,000 operations due to repeated JS runtime ICU locale data initialization. Additionally, calling `Object.values(CurrencyCode).includes(code)` allocated temporary arrays and performed O(N) array scans on every currency check.
**Action:** Cache `Intl.DisplayNames` and `Intl.NumberFormat` instances in Map caches keyed by locale/currency, and use module-level `Set<string>` constants for O(1) enum validation. This reduced execution time from 3676ms down to 96ms (~38x-46x speedup).
