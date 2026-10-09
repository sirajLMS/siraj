## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-09 - Caching Intl.DateTimeFormat and Set lookup for Timezone Options

**Learning:** Generating options for ~420 timezones in `getTimezoneOptions` previously called `date.toLocaleString("en-US", { timeZone: ... })` twice per timezone, instantiating ~840 heavy JS runtime `Intl.DateTimeFormat` objects and performing O(N) array scans (`includes`) on validity checks. This took ~1.1s per `getTimezoneOptions` call.
**Action:** Cache `Intl.DateTimeFormat` instances in a `Map`, reuse computed `offsetMinutes` for `offsetLabel`, and use a `Set` for `isValidIanaTimezoneId`.

## 2026-09-10 - Single-pass schedule metrics calculation and Date allocation removal

**Learning:** `computeDailyScheduleMetricsFromRows` evaluated metric counts using a nested loop over filter keys, resolving row dashboard status up to 6 times per row and creating spread options objects on each check. In addition, date string parsing called `new Date(string)` repeatedly.
**Action:** Use a single-pass O(N) loop resolving status once per row and checking class types and flags directly. Convert `DateLike` values via `toEpochMs` (`Date.parse` / `.getTime()`) and direct `options.now` timestamp checks to avoid temporary `Date` object allocations.
