## 2026-01-01 - O(1) Map Precomputation for Static Locale Catalogs
**Learning:** Static lookup utilities for countries, languages, and currencies in `frontend/common/lib/` were performing linear array scans (`Array.prototype.find`) with `.toString()` conversions on every call across rendering loops and autocomplete components.
**Action:** Replace `Array.prototype.find` linear searches in static datasets with precomputed `ReadonlyMap<string, T>` instances created at module load time for $O(1)$ lookups.
