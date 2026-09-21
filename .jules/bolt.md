## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-09 - Caching Intl.DateTimeFormat and Set lookup for Timezone Options

**Learning:** Generating options for ~420 timezones in `getTimezoneOptions` previously called `date.toLocaleString("en-US", { timeZone: ... })` twice per timezone, instantiating ~840 heavy JS runtime `Intl.DateTimeFormat` objects and performing O(N) array scans (`includes`) on validity checks. This took ~1.1s per `getTimezoneOptions` call.
**Action:** Cache `Intl.DateTimeFormat` instances in a `Map`, reuse computed `offsetMinutes` for `offsetLabel`, and use a `Set` for `isValidIanaTimezoneId`.

## 2026-09-21 - Single-pass parsing for formatToParts timezone offset calculations

**Learning:** `getTimezoneOffsetMs` in `frontend/common/lib/timezone.ts` was using `parts.map` and `new Map()` for every offset calculation, allocating ~420 Map instances and ~420 tuple arrays on every `getTimezoneOptions` call. In addition, calling `toSorted` on a fresh array returned by `.map()` created an extra array copy.
**Action:** Use a direct single-pass `partsToEpochMs` loop over `parts` instead of `new Map(parts.map(...))` to eliminate Map allocations, and use in-place `.sort()` on arrays returned directly by `.map()`.
