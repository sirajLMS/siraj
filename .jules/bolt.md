## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-09 - Caching Intl.DateTimeFormat and Set lookup for Timezone Options

**Learning:** Generating options for ~420 timezones in `getTimezoneOptions` previously called `date.toLocaleString("en-US", { timeZone: ... })` twice per timezone, instantiating ~840 heavy JS runtime `Intl.DateTimeFormat` objects and performing O(N) array scans (`includes`) on validity checks. This took ~1.1s per `getTimezoneOptions` call.
**Action:** Cache `Intl.DateTimeFormat` instances in a `Map`, reuse computed `offsetMinutes` for `offsetLabel`, and use a `Set` for `isValidIanaTimezoneId`.

## 2026-10-11 - Caching google-libphonenumber lookups in calling-code.ts

**Learning:** `google-libphonenumber` `getCountryCodeForRegion` (~5µs) and `getRegionCodeForCountryCode` (~0.1µs) are already fast O(1) internal map lookups inside the library. Caching them in `calling-code.ts` adds mutable module-level state and sentinel logic without providing a noticeable product-level win, as `ensureCallingCodeIndex` already handles one-time region indexing up front.
**Action:** Do not add wrapper caches over fast O(1) library lookups unless profiling shows a real bottleneck on an active product path.
