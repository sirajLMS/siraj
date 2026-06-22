### Task J — i18n: Add Missing Translation Keys for Backend Error Messages

**Objective:** Add backend translation keys for new error messages introduced by Story 11 services. Frontend i18n keys already exist for all three domains (`dashboard.studentDirectory`, `dashboard.managersDirectory`, `dashboard.resources`).

**Dependencies:** Depends on Task L — view components are implemented and any new UI strings are identified.

**Layer-Specific Rules (i18n — Flattened from AGENTS_STORY_PLANNING.md):**
- Uses `shared/messages/en.ts` and `shared/messages/ar/` directories.
- DO NOT create `frontend/locales/` or `backend/locales/` directories.
- No hardcoded errors/messages in services — use `getBackendTranslations`.
- Backend error messages go in `shared/messages/errors/` namespace.

**Target Files:**
- `shared/messages/en.ts` — MODIFY (add backend error keys if needed)
- `shared/messages/ar/errors.ts` — MODIFY (add Arabic backend error keys if needed)

---

**Detailed Implementation Steps:**

*Step 1: Audit existing i18n keys*

Before adding new keys, verify what already exists:

**Frontend keys (already present — NO changes needed):**
- `dashboard.studentDirectory.*` — All student directory UI strings exist in `shared/messages/en.ts`
- `dashboard.managersDirectory.*` — All manager directory UI strings exist
- `dashboard.resources.*` — All resource UI strings exist
- `dashboard.nav.students`, `dashboard.nav.managers`, `dashboard.nav.resources` — Nav labels exist

**Backend error keys (check if these exist):**
- `errors.permissionDenied` — Used by all services when permission check fails
- `errors.staffProfileNotFound` — Used by `ManagerProfileService`
- `errors.insufficientPrivilege` — Used by hierarchical privilege check
- `errors.resourceCreateFailed` — Used by `LearningResourceRepository`

*Step 2: Add missing backend error keys*

If any of the above error keys are missing from `shared/messages/en.ts` (in the `errors` namespace), add them:

```typescript
// In shared/messages/en.ts, within the errors object:
permissionDenied: "You do not have permission to perform this action.",
staffProfileNotFound: "Staff profile not found.",
insufficientPrivilege: "You do not have sufficient privilege to edit administrative accounts.",
resourceCreateFailed: "Failed to create learning resource. Please try again.",
```

*Step 3: Add Arabic translations*

Add corresponding Arabic translations in `shared/messages/ar/errors.ts`:

```typescript
// In shared/messages/ar/errors.ts:
permissionDenied: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
staffProfileNotFound: "لم يتم العثور على ملف الموظف.",
insufficientPrivilege: "ليس لديك صلاحية كافية لتعديل حسابات المسؤولين.",
resourceCreateFailed: "فشل إنشاء مورد التعلم. يرجى المحاولة مرة أخرى.",
```

*Step 4: Verify no hardcoded strings in services*

After adding translation keys, verify that no service files contain hardcoded English error messages:

```bash
rg "throw new Error\(\"" backend/services/student/student-directory.service.ts
rg "throw new Error\(\"" backend/services/staff/manager-directory.service.ts
rg "throw new Error\(\"" backend/services/staff/manager-profile.service.ts
rg "throw new Error\(\"" backend/services/resource/learning-resource.service.ts
```

All output should be empty — services should use `getBackendTranslations()` + typed error classes.

**Test Execution Requirements:**
- Run TypeScript check:
  ```bash
  bun tsgo
  ```

**Success Criteria / Check Progress Points:**
- [ ] All backend error keys exist in `shared/messages/en.ts`.
- [ ] All backend error keys have Arabic translations in `shared/messages/ar/errors.ts`.
- [ ] No hardcoded error strings in any Story 11 service files.
- [ ] All frontend UI keys already exist (no new frontend keys needed).
- [ ] `bun tsgo` passes with 0 errors.

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
