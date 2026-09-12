## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-12 - Caching Intl.DateTimeFormat in pattern availability checking

**Learning:** `getTzOffsetMs` and `buildPatternOccurrences` in `AvailabilityService` instantiated a new `Intl.DateTimeFormat` on every day/time calculation and invoked `toLocaleString` inside date loops, causing CPU bottlenecks and heavy garbage collection during schedule pattern availability checks.
**Action:** Cache `Intl.DateTimeFormat` instances per timezone in a module-level `Map`, pre-parse start times outside loops, and construct `Date.UTC` instances directly to achieve a ~70x speedup in pattern calculations.
