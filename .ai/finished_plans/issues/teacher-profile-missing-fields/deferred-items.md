# Deferred Items: Teacher Profile Missing Fields

## DEF-1: Pre-existing `nationality` label mis-mapping in `toTeacherPersonalFieldLabels`

**File:** `frontend/common/views/dashboard/profile/teacher/sections/teacherProfileLabelUtils.ts`
**Line:** ~24
**Status:** RESOLVED — Now fixed in this plan (Task 1 adds `nationality` label to i18n, Task 5 fixes the mapping)

**Description:** The `toTeacherPersonalFieldLabels` function maps `nationality: t.fields.nationalId` — it uses the "National ID" translation string as the label for the `nationality` field. This is incorrect: the `nationality` field (rendered as a `CountrySelect` in `ProfilePersonalSection`) should display a label like "Nationality", not "National ID".

**Root cause:** `ProfileTeacherLabels.fields` (in `shared/locale/types/profile/index.ts`) does not have a `nationality` key — it only has `nationalId`. The label adapter approximates `nationality` with `nationalId`.

**Why originally deferred (now resolved):** Fixing this requires adding a `nationality` label key to:
- `ProfileTeacherLabels.fields` type schema (`shared/locale/types/profile/index.ts`)
- EN locale (`shared/locale/en/profile/teacher/index.ts`) — `nationality: "Nationality"`
- AR locale (`shared/locale/ar/profile/teacher/index.ts`) — `nationality: "الجنسية"`
- `toTeacherPersonalFieldLabels` mapping (`teacherProfileLabelUtils.ts`)

This is now included in the plan: Task 1 adds the i18n keys and Task 5 fixes the mapping. The fix was folded into the plan because adding `countryCode` to the same `fields` object required touching the same i18n type/locale files and label adapter — making it natural to fix both in the same pass.

**Impact if not fixed:** The `nationality` field label in the teacher profile edit/view page displays "National ID" instead of "Nationality". This is visible to users today and is not caused by the plan's changes.
