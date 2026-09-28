## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-09 - Caching Intl.DateTimeFormat and Set lookup for Timezone Options

**Learning:** Generating options for ~420 timezones in `getTimezoneOptions` previously called `date.toLocaleString("en-US", { timeZone: ... })` twice per timezone, instantiating ~840 heavy JS runtime `Intl.DateTimeFormat` objects and performing O(N) array scans (`includes`) on validity checks. This took ~1.1s per `getTimezoneOptions` call.
**Action:** Cache `Intl.DateTimeFormat` instances in a `Map`, reuse computed `offsetMinutes` for `offsetLabel`, and use a `Set` for `isValidIanaTimezoneId`.

## 2026-09-28 - Reusing getDateTimeFormatter for View-Model Date Formatting

**Learning:** Direct instantiation of `new Intl.DateTimeFormat(...)` inside date formatting callbacks (`formatTimestamp`, `formatDate`, `dayDividerLabel`) causes repeated JS runtime ICU object instantiation across list renderings and view-model hook re-computations.
**Action:** Leverage `@/frontend/common/components/intl/dateFormat`'s `getDateTimeFormatter` and lift `Intl.DateTimeFormatOptions` out of function scope to reuse cached `Intl.DateTimeFormat` instances across render cycles.
