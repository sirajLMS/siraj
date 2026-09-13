## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-09 - Caching Intl.DateTimeFormat and Set lookup for Timezone Options

**Learning:** Generating options for ~420 timezones in `getTimezoneOptions` previously called `date.toLocaleString("en-US", { timeZone: ... })` twice per timezone, instantiating ~840 heavy JS runtime `Intl.DateTimeFormat` objects and performing O(N) array scans (`includes`) on validity checks. This took ~1.1s per `getTimezoneOptions` call.
**Action:** Cache `Intl.DateTimeFormat` instances in a `Map`, reuse computed `offsetMinutes` for `offsetLabel`, and use a `Set` for `isValidIanaTimezoneId`.

## 2026-09-13 - Caching Intl.DateTimeFormat for Backend Timezone & Day Boundaries

**Learning:** `getDayBoundaries` in `backend/lib/timezone.ts` repeatedly invoked `date.toLocaleString("en-US", { timeZone })` to calculate timezone offset differentials. Creating un-cached `Intl.DateTimeFormat` instances and parsing strings via `toLocaleString` in a loop took ~3.77s for 1000 calls.
**Action:** Cache `Intl.DateTimeFormat` instances in a module Map keyed by locale/timezone/options, and replace `toLocaleString` string parsing with `formatToParts()` to cut execution time down to ~87ms (~43x speedup).
