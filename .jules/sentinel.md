## 2026-09-30 - CSV Formula Injection Bypass via Leading Whitespace
**Vulnerability:** `toCsvCell` checked `value.startsWith(prefix)` for formula characters (`=`, `+`, `-`, `@`, `\t`, `\r`) without trimming leading whitespace.
**Learning:** Spreadsheet applications (such as Microsoft Excel and LibreOffice Calc) strip or ignore leading spaces when parsing cells, executing formula payloads prefixed with spaces (e.g. `"  =SUM(...)"`).
**Prevention:** Always inspect `value.trimStart()` when checking for formula injection prefixes in CSV exporters.
