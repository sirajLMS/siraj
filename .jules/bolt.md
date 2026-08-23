## 2026-08-23 - Field Manifest O(1) Lookups
**Learning:** Profile and student field group permission checks were calling `PROFILE_FIELD_GROUPS.find()` and `STUDENT_FIELD_GROUPS.find()` on array definitions for every field check. The manifests already export `PROFILE_FIELD_GROUP_BY_KEY` and `STUDENT_FIELD_GROUP_BY_KEY` object dictionaries for $O(1)$ constant-time lookup.
**Action:** Always prefer `PROFILE_FIELD_GROUP_BY_KEY` / `STUDENT_FIELD_GROUP_BY_KEY` over array searching when checking field group permissions.
