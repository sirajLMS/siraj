## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-09 - Caching Intl.DateTimeFormat and Set lookup for Timezone Options

**Learning:** Generating options for ~420 timezones in `getTimezoneOptions` previously called `date.toLocaleString("en-US", { timeZone: ... })` twice per timezone, instantiating ~840 heavy JS runtime `Intl.DateTimeFormat` objects and performing O(N) array scans (`includes`) on validity checks. This took ~1.1s per `getTimezoneOptions` call.
**Action:** Cache `Intl.DateTimeFormat` instances in a `Map`, reuse computed `offsetMinutes` for `offsetLabel`, and use a `Set` for `isValidIanaTimezoneId`.

## 2026-09-26 - Caching relative luminance and optimizing pickOnPrimary contrast math

**Learning:** `pickOnPrimary` evaluated contrast by calling `contrastRatio(primary, "#ffffff")` and `contrastRatio(primary, "#000000")`. This re-parsed hex strings, validated regexes, and linearized RGB channels for white and black constants on every call while computing primary luminance twice, taking ~1.08s for 1M iterations.
**Action:** Cache `relativeLuminance` in a `Map<string, number>` and evaluate `pickOnPrimary` directly against white ($L = 1.0$) and black ($L = 0.0$) constants (`1.05 / (lPrimary + 0.05)` vs `(lPrimary + 0.05) / 0.05`), yielding a ~41x speedup (~26ms for 1M iterations).
