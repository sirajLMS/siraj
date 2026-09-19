## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-09 - Caching Intl.DateTimeFormat and Set lookup for Timezone Options

**Learning:** Generating options for ~420 timezones in `getTimezoneOptions` previously called `date.toLocaleString("en-US", { timeZone: ... })` twice per timezone, instantiating ~840 heavy JS runtime `Intl.DateTimeFormat` objects and performing O(N) array scans (`includes`) on validity checks. This took ~1.1s per `getTimezoneOptions` call.
**Action:** Cache `Intl.DateTimeFormat` instances in a `Map`, reuse computed `offsetMinutes` for `offsetLabel`, and use a `Set` for `isValidIanaTimezoneId`.

## 2026-09-19 - Dual-tier WeakMap + Map caching for Intl.DateTimeFormat options

**Learning:** `JSON.stringify(options)` string serialization on hot date formatting paths (such as DataGrid cells and schedule calendars) incurred non-trivial string allocation and CPU overhead on repeated calls.
**Action:** Use a `WeakMap<Intl.DateTimeFormatOptions, Map<string, Intl.DateTimeFormat>>` as a Tier 1 O(1) object identity lookup before falling back to a string-keyed `Map` for dynamic options objects.
