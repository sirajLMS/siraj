## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-09 - Caching Intl.DateTimeFormat and Set lookup for Timezone Options

**Learning:** Generating options for ~420 timezones in `getTimezoneOptions` previously called `date.toLocaleString("en-US", { timeZone: ... })` twice per timezone, instantiating ~840 heavy JS runtime `Intl.DateTimeFormat` objects and performing O(N) array scans (`includes`) on validity checks. This took ~1.1s per `getTimezoneOptions` call.
**Action:** Cache `Intl.DateTimeFormat` instances in a `Map`, reuse computed `offsetMinutes` for `offsetLabel`, and use a `Set` for `isValidIanaTimezoneId`.

## 2026-09-10 - Single-pass schedule metric calculation and epoch ms status resolution

**Learning:** `computeDailyScheduleMetricsFromRows` executed a nested loop iterating 11 metric keys per row and re-evaluated `resolveClassInstanceDashboardStatus` 6 times per row, while `isClassInstancePastMissedGrace` instantiated new `Date` objects on every row. For 1,000 schedule rows, this took ~885ms.
**Action:** Convert `computeDailyScheduleMetricsFromRows` to a single-pass O(N) loop that calculates row status once and updates counts via a switch block, and use `toEpochMs` (`Date.parse()` / `.getTime()`) to eliminate temporary `Date` object allocations. This reduced calculation time by ~90% (~91ms vs ~885ms per 1k rows).
