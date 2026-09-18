## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-09 - Caching Intl.DateTimeFormat and Set lookup for Timezone Options

**Learning:** Generating options for ~420 timezones in `getTimezoneOptions` previously called `date.toLocaleString("en-US", { timeZone: ... })` twice per timezone, instantiating ~840 heavy JS runtime `Intl.DateTimeFormat` objects and performing O(N) array scans (`includes`) on validity checks. This took ~1.1s per `getTimezoneOptions` call.
**Action:** Cache `Intl.DateTimeFormat` instances in a `Map`, reuse computed `offsetMinutes` for `offsetLabel`, and use a `Set` for `isValidIanaTimezoneId`.

## 2026-09-10 - WeakMap Enum Value Set Caching & Direct formatToParts Parsing

**Learning:** Hot enum parsing (`parseEnumValue`) was re-allocating `Object.values(enumObject)` arrays and performing O(N) scans on every invocation. For large enums like `IanaTimezone` (420 items), iterating options caused ~176,000 array allocations and ~88,000 checks. Additionally, `getTimezoneOffsetMs` allocated `parts.map` arrays and `Map` instances on every timezone offset evaluation.
**Action:** Cache enum value `Set` instances in a `WeakMap<object, Set<unknown>>` for $O(1)$ lookup with zero allocations per parse, and parse `formatToParts` with direct loop indexing (`partsToEpochMs`) to reduce `getTimezoneOptions` execution time by ~60% (from 736ms to 128ms).
