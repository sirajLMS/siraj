## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-09 - Caching Intl.DateTimeFormat and Set lookup for Timezone Options

**Learning:** Generating options for ~420 timezones in `getTimezoneOptions` previously called `date.toLocaleString("en-US", { timeZone: ... })` twice per timezone, instantiating ~840 heavy JS runtime `Intl.DateTimeFormat` objects and performing O(N) array scans (`includes`) on validity checks. This took ~1.1s per `getTimezoneOptions` call.
**Action:** Cache `Intl.DateTimeFormat` instances in a `Map`, reuse computed `offsetMinutes` for `offsetLabel`, and use a `Set` for `isValidIanaTimezoneId`.

## 2026-09-27 - WeakMap Options Caching & Direct UTC Offset Math in Timezone Utilities

**Learning:** In `backend/lib/timezone.ts`, `getDtf` serialized options via `JSON.stringify(options)` on every call, and `getOffsetMs` formatted `d` as UTC parts via `utcDtf.formatToParts(d)` before re-parsing them to epoch ms. Since `d` is already a UTC `Date`, `partsToEpochMs(utcDtf.formatToParts(d))` was identical to `d.getTime() - d.getUTCMilliseconds()`.
**Action:** Use a `WeakMap<Intl.DateTimeFormatOptions, Map<string, Intl.DateTimeFormat>>` for O(1) object-identity cache hits, export module-level options constants, and compute UTC epoch ms directly without calling `formatToParts` for UTC. This reduced `getOffsetMsSafe` runtime from 1.52s to 517ms (~3x faster) and `getDayBoundaries` from 5.27s to 2.09s (~2.5x faster).
