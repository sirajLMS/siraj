## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-09 - Caching Intl.DateTimeFormat and Set lookup for Timezone Options

**Learning:** Generating options for ~420 timezones in `getTimezoneOptions` previously called `date.toLocaleString("en-US", { timeZone: ... })` twice per timezone, instantiating ~840 heavy JS runtime `Intl.DateTimeFormat` objects and performing O(N) array scans (`includes`) on validity checks. This took ~1.1s per `getTimezoneOptions` call.
**Action:** Cache `Intl.DateTimeFormat` instances in a `Map`, reuse computed `offsetMinutes` for `offsetLabel`, and use a `Set` for `isValidIanaTimezoneId`.

## 2026-09-10 - Minute-level offset caching and emoji memoization for timezone options

**Learning:** `getTimezoneOptions` and relative offset calculations in `frontend/common/lib/timezone.ts` called `formatToParts` and territory/country lookups for all ~420 timezones on every call/render (~530ms per 100 calls). Timezone UTC minute offsets are constant within any epoch minute, and timezone territory emojis are static.
**Action:** Cache computed timezone offset minutes in a minute-keyed Map (`offsetMinutesCache`), memoize timezone territory flag emojis (`timezoneEmojiCache`), and bypass redundant string normalization calls for canonical IANA timezone keys in options generation loops to yield a ~3x speedup (~67% reduction in runtime).
