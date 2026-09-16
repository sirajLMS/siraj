## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-09 - Caching Intl.DateTimeFormat and Set lookup for Timezone Options

**Learning:** Generating options for ~420 timezones in `getTimezoneOptions` previously called `date.toLocaleString("en-US", { timeZone: ... })` twice per timezone, instantiating ~840 heavy JS runtime `Intl.DateTimeFormat` objects and performing O(N) array scans (`includes`) on validity checks. This took ~1.1s per `getTimezoneOptions` call.
**Action:** Cache `Intl.DateTimeFormat` instances in a `Map`, reuse computed `offsetMinutes` for `offsetLabel`, and use a `Set` for `isValidIanaTimezoneId`.

## 2026-09-16 - Caching Intl.NumberFormat and Intl.DisplayNames for Currency and Locale Helpers

**Learning:** Currency amount formatting (`formatLockedAmount`), display name resolution (`getCurrencyDisplayName`, `getCountryDisplayName`, `getLanguageDisplayName`), and enum validations (`isCurrencyCode`) were repeatedly instantiating JS `Intl.NumberFormat` and `Intl.DisplayNames` objects and executing `Object.values(CurrencyCode).includes(...)` on every call. Benchmarks showed `Intl` instantiation overhead of ~1,350ms per 10,000 calls.
**Action:** Cache `Intl.NumberFormat` and `Intl.DisplayNames` instances in `Map` caches keyed by locale and options, and use pre-computed module-level `Set` objects for $O(1)$ currency enum validation, achieving a ~42x speedup (~30ms per 10,000 calls).
