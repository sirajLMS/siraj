## 2026-09-08 - Optimizing availability & time calculation hot paths

**Learning:** Hot paths in schedule availability computation (`timeToMinutes`, `getUtcDateString`, date/time formatters, and gap range merging) were heavily allocating temporary arrays and strings (`split(":")`, `map(Number)`, `.padStart()`, array spreads, and `toSorted`).
**Action:** Replace `split` with `indexOf`/`slice` index parsing, replace `.padStart()` with ternary padding, eliminate intermediate spread copies, and convert date-time conversions directly to minutes to reduce GC pressure on search queries.

## 2026-09-09 - Caching Intl.DateTimeFormat and Set lookup for Timezone Options

**Learning:** Generating options for ~420 timezones in `getTimezoneOptions` previously called `date.toLocaleString("en-US", { timeZone: ... })` twice per timezone, instantiating ~840 heavy JS runtime `Intl.DateTimeFormat` objects and performing O(N) array scans (`includes`) on validity checks. This took ~1.1s per `getTimezoneOptions` call.
**Action:** Cache `Intl.DateTimeFormat` instances in a `Map`, reuse computed `offsetMinutes` for `offsetLabel`, and use a `Set` for `isValidIanaTimezoneId`.

## 2026-09-16 - Reusing Global Intl.DateTimeFormat Cache in High-Frequency Formatting Renders

**Learning:** DataGrid cell formatters (such as `formatCompactSessionTime` in `SessionAuditDataGrid`) and view model timestamp helpers (WhatsApp inbox/conversations, Audit logs, Payments Ledger) were calling `new Intl.DateTimeFormat()` on every single cell render/item format. At 200 rows x 3 columns per page, this created 600 `Intl.DateTimeFormat` instantiations per render pass, causing CPU spikes and GC pressure.
**Action:** Export `getDateTimeFormatter` from `@/frontend/common/components/intl/dateFormat` to leverage its central `Map` cache and reuse `Intl.DateTimeFormat` instances across high-frequency date formatting paths.
