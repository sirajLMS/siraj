## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-09 - Caching Intl.DateTimeFormat and Set lookup for Timezone Options

**Learning:** Generating options for ~420 timezones in `getTimezoneOptions` previously called `date.toLocaleString("en-US", { timeZone: ... })` twice per timezone, instantiating ~840 heavy JS runtime `Intl.DateTimeFormat` objects and performing O(N) array scans (`includes`) on validity checks. This took ~1.1s per `getTimezoneOptions` call.
**Action:** Cache `Intl.DateTimeFormat` instances in a `Map`, reuse computed `offsetMinutes` for `offsetLabel`, and use a `Set` for `isValidIanaTimezoneId`.

## 2026-09-10 - Single-pass loops and Date.parse() in quota analytics

**Learning:** Quota insights metrics and filter operations chained up to 5 separate array passes (`filter`, `reduce`), allocated multiple intermediate arrays, instantiated `new Date()` heap objects on every item, and used heavy `structuredClone` inside aggregation loops.
**Action:** Consolidate filter and metric functions into single-pass O(N) `for` loops, use primitive numeric `Date.parse()` epoch ms comparisons to avoid `Date` allocations, replace `structuredClone` with shallow `{ ...init }` spreads, and bypass sorting array copy copies when operating on fresh `Array.from()` instances.
