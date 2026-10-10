## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-09 - Caching Intl.DateTimeFormat and Set lookup for Timezone Options

**Learning:** Generating options for ~420 timezones in `getTimezoneOptions` previously called `date.toLocaleString("en-US", { timeZone: ... })` twice per timezone, instantiating ~840 heavy JS runtime `Intl.DateTimeFormat` objects and performing O(N) array scans (`includes`) on validity checks. This took ~1.1s per `getTimezoneOptions` call.
**Action:** Cache `Intl.DateTimeFormat` instances in a `Map`, reuse computed `offsetMinutes` for `offsetLabel`, and use a `Set` for `isValidIanaTimezoneId`.

## 2026-09-10 - Caching Intl.DateTimeFormat in cron execution loops

**Learning:** `resolveLocalHour` in `ondemand-teacher-digest-cron.ts` and candidate formatting in `quota-reminder-cron.ts` instantiated `new Intl.DateTimeFormat(...)` inside per-teacher and per-window callbacks. Creating `Intl.DateTimeFormat` objects initializes heavy C++/ICU locale structures in V8/Bun, taking ~100x-200x longer than formatting with a cached instance.
**Action:** Cache `Intl.DateTimeFormat` instances in a module-level `Map` or static variables for all background cron scripts that process dates across timezones.
