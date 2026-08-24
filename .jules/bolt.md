## 2026-08-24 - Profile Field Manifest O(1) Lookups
**Learning:** Profile and student field manifests export pre-built O(1) lookup records (`PROFILE_FIELD_GROUP_BY_KEY` and `STUDENT_FIELD_GROUP_BY_KEY`). Scans using `.find()` on `PROFILE_FIELD_GROUPS` or `STUDENT_FIELD_GROUPS` during authorization checks can be avoided.
**Action:** Use `PROFILE_FIELD_GROUP_BY_KEY[groupKey as ProfileFieldGroupKey]` for constant-time group definition lookups instead of scanning `PROFILE_FIELD_GROUPS`.
