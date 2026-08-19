# Plan Review: Teacher Profile Missing Fields — R1

## Date: 2026-08-16

## Review Summary

The plan was reviewed against all applicable AGENTS.md files:
- `shared/AGENTS.md` (i18n, layer isolation, translation system)
- `frontend/views/AGENTS.md` (ViewModel pattern, labels pass-down, tier isolation)
- `frontend/AGENTS.md` (MUI v9, theme, React 19, mobile/desktop isolation)

## Violations Found: 9 total (3 HIGH, 2 MEDIUM, 1 LOW, 2 PASS, 1 INFORMATIONAL)

## HIGH Violations (fixed)

### V8 — `ProfilePersonalFieldLabels.countryCode` as required would break staff/parent consumers
- **Rule:** Non-breaking change to shared types
- **Impact:** `ProfilePersonalFieldLabels` is consumed by `StaffExtensionProfileSection` and parent `IdentitySection` — making `countryCode` required causes type errors in all label adapters that don't provide it
- **Fix:** Changed Task 2 to use `readonly countryCode?: string;` (optional)
- **Status:** FIXED in tasks.md

### V9 — `ProfilePersonalSection` edit-mode `labels.countryCode` access must guard against undefined
- **Rule:** Component robustness across shared consumers
- **Impact:** If `countryCode` label is optional, `labels.countryCode` may be `undefined` for staff/parent consumers — direct access causes runtime error or type error
- **Fix:** Updated Task 3 to use `labels.countryCode ?? ""` as fallback label; guard via `canViewField("countryCode")` which checks `isFieldEnabled` (returns false when `fields.countryCode` is not `true`) so staff/parent never reach the label access
- **Status:** FIXED in tasks.md

### V4 — `TeacherProfileEditBody.tsx` submit adapters drop `countryCode` (and own-adapter drops `dateOfBirth`/`gender`/`address`/`qualifications`)
- **Rule:** Data flow correctness
- **Impact:** The plan's Tasks 7-8 fixed the viewmodel's `TeacherOwnSubmitData`/`TeacherAdminSubmitData` types and `onSubmitOwn`/`onSubmitAdmin` handlers, but the **actual** code path that constructs these submit data objects from RHF form values lives in `TeacherProfileEditBody.tsx`'s submit adapters (lines 74-84 for own, lines 96-113 for admin). Without fixing these adapters, `countryCode` and the dropped fields never reach the viewmodel's handlers.
- **Fix:** Expanded Task 11 into 3 subtasks: 11a (toTeacherEditData mapping), 11b (own submit adapter — add `dateOfBirth`, `gender`, `address`, `qualifications`, `countryCode`), 11c (admin submit adapter — add `countryCode`)
- **Status:** FIXED in tasks.md

## MEDIUM Violations (fixed)

### V5 — Task 9 lacked precise admin-fallback expression for `countryCode` in view mode
- **Rule:** Consistency with existing patterns
- **Impact:** Task 9 said "add `countryCode={data.countryCode}`" without specifying the admin-fallback pattern used by all other fields
- **Fix:** Updated Task 9 to specify `countryCode={adminData?.countryCode ?? teacherData.countryCode}` — matching the pattern for `address`, `dateOfBirth`, `gender`, `qualifications` in the same render call
- **Status:** FIXED in tasks.md

### V2 — Pre-existing `nationality` label mis-mapping in `toTeacherPersonalFieldLabels`
- **Rule:** i18n correctness
- **Impact:** `nationality: t.fields.nationalId` maps the "Nationality" field to the "National ID" label string — pre-existing bug, not introduced by plan
- **Fix:** Created `deferred-items.md` with DEF-1 documenting this bug and why it's deferred (requires adding a `nationality` key to `ProfileTeacherLabels.fields` + EN/AR locales, which is a separate i18n fix)
- **Status:** DOCUMENTED in deferred-items.md

## LOW Violations (fixed)

### V3 — Task 9 wording about `teacherProfileTypes.ts` was ambiguous
- **Rule:** Task clarity
- **Impact:** Task 9 said "ensure `TeacherViewData` and `TeacherAdminData` types include `countryCode`" — but these types are codegen-derived and already include it
- **Fix:** Updated Task 9 with NOTE: "`teacherProfileTypes.ts` requires NO changes — types are codegen-derived and already include `countryCode`"
- **Status:** FIXED in tasks.md

## PASS (no violations)

### V6 — `TeacherExtensionProfileSection` view props + forwarding covered correctly
- Task 4 correctly adds `countryCode` to view props interface and forwards to `ProfilePersonalSection`

### V7 — No i18n namespace registration needed
- Plan adds a field key to existing namespace (not a new namespace) — correct approach

## INFORMATIONAL

### V1 — `TeacherOwnSubmitData`/`TeacherAdminSubmitData` are local view-layer types, not from `@/backend/types`
- Pre-existing pattern: the viewmodel defines its own submit data types rather than importing canonical types from `@/backend/types`. The plan follows this existing convention. Not introduced by the plan.

## Files Patched

1. `tasks.md` — Task 2 (optional label), Task 3 (label guard), Task 9 (admin-fallback + types note), Task 11 (expanded to 3 subtasks covering submit adapters)
2. `design.md` — Section 2 (optional label), Section 9 (submit adapter details)
3. `deferred-items.md` — Created with DEF-1 (nationality label mis-mapping)

## Conclusion

All HIGH and MEDIUM violations are fixed. The plan is ready for implementation. Re-run `@plan-review` if needed to confirm.
