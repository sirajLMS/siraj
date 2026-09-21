## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-09 - Caching Intl.DateTimeFormat and Set lookup for Timezone Options

**Learning:** Generating options for ~420 timezones in `getTimezoneOptions` previously called `date.toLocaleString("en-US", { timeZone: ... })` twice per timezone, instantiating ~840 heavy JS runtime `Intl.DateTimeFormat` objects and performing O(N) array scans (`includes`) on validity checks. This took ~1.1s per `getTimezoneOptions` call.
**Action:** Cache `Intl.DateTimeFormat` instances in a `Map`, reuse computed `offsetMinutes` for `offsetLabel`, and use a `Set` for `isValidIanaTimezoneId`.

## 2026-09-21 - Single-pass slot bounds & Intl.NumberFormat caching

**Learning:** `computeSlotBounds` was allocating temporary mapped arrays (`slots.map(...)`) and spreading them into `Math.min`/`Math.max`, risking call stack depth errors on large slot arrays. Additionally, table cell formatters like `formatPartialPercentage` were instantiating `new Intl.NumberFormat` on every row render.
**Action:** Replace `slots.map` + argument spread with a single O(N) loop in `computeSlotBounds`, and cache `Intl.NumberFormat` instances in a module-level `Map` by locale tag.
