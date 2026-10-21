## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-09 - Caching Intl.DateTimeFormat and Set lookup for Timezone Options

**Learning:** Generating options for ~420 timezones in `getTimezoneOptions` previously called `date.toLocaleString("en-US", { timeZone: ... })` twice per timezone, instantiating ~840 heavy JS runtime `Intl.DateTimeFormat` objects and performing O(N) array scans (`includes`) on validity checks. This took ~1.1s per `getTimezoneOptions` call.
**Action:** Cache `Intl.DateTimeFormat` instances in a `Map`, reuse computed `offsetMinutes` for `offsetLabel`, and use a `Set` for `isValidIanaTimezoneId`.

## 2026-09-10 - Eliminating quadratic array allocations and Date instantiations in search schedule gap grouping

**Learning:** In search schedule UI utilities (`groupGapsByDate` and `groupGapsByDayOfMonth`), spreading existing array elements (`[...existing, gap]`) on every gap item resulted in quadratic memory copying allocations ($O(N^2)$) during search result grid construction. In addition, calling `date-fns` `parse` or `new Date()` inside gap loops generated unnecessary GC pressure.
**Action:** Use single-pass array `.push(gap)` mutations into a map/record lookup array, fast-parse standard `"YYYY-MM-DD"` date strings using integer string slicing without `Date` object instantiation, and compute active teacher filters once per search result calculation.
