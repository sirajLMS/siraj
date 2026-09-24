## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-09 - Caching Intl.DateTimeFormat and Set lookup for Timezone Options

**Learning:** Generating options for ~420 timezones in `getTimezoneOptions` previously called `date.toLocaleString("en-US", { timeZone: ... })` twice per timezone, instantiating ~840 heavy JS runtime `Intl.DateTimeFormat` objects and performing O(N) array scans (`includes`) on validity checks. This took ~1.1s per `getTimezoneOptions` call.
**Action:** Cache `Intl.DateTimeFormat` instances in a `Map`, reuse computed `offsetMinutes` for `offsetLabel`, and use a `Set` for `isValidIanaTimezoneId`.

## 2026-09-24 - Single-pass Intl.DateTimeFormatPart parsing in frontend timezone options

**Learning:** Generating timezone options across ~420 timezones in `getTimezoneOptions` executed `parts.map` and `new Map(...)` inside `getTimezoneOffsetMs` for every timezone ID, allocating over 3,000 short-lived arrays and 420 Map objects per call, resulting in ~500ms execution time.
**Action:** Replace `parts.map` and `new Map(...)` with a single-pass `partsToEpochMs` loop over `parts` to eliminate intermediate allocations, reducing execution time by ~46% (~270ms).
