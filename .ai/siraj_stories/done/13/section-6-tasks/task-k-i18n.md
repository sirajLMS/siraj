### Task K — i18n: Verify and Add Missing Translation Keys

**Objective:** Verify that all translation keys exist for the new user provisioning workflows. Add any missing keys for error messages and new UI strings.

**Dependencies:** Task J — stories are migrated. Depends on existing i18n infrastructure.

**Layer-Specific Rules (i18n - Flattened from AGENTS_STORY_PLANNING.md):**
- Uses `shared/messages/en.ts` and `shared/messages/ar/` directories.
- DO NOT create `frontend/locales/` or `backend/locales/` directories.
- No hardcoded errors/messages in services — use `getBackendTranslations`.
- All translation keys must exist in both English and Arabic.

**Target Files:**
- `shared/messages/en.ts` — Add missing error messages
- `shared/messages/ar/errors.ts` — Add Arabic translations for error messages
- `shared/messages/types/message.ts` — Add error message types if needed

**Detailed Implementation Steps:**

*Step 1: Verify existing onboarding translations*

The following translation blocks already exist (verified in Section 5):
- `dashboard.teacherOnboarding` (lines 1119-1200 in `shared/messages/en.ts`)
- `dashboard.parentOnboarding` (lines 1357-1437 in `shared/messages/en.ts`)
- `dashboard.managerOnboarding` (lines 1438-1492 in `shared/messages/en.ts`)

Arabic translations also exist:
- `ar/dashboard/teachers/onboarding.ts` (84 lines)
- `ar/dashboard/parents/onboarding.ts` (83 lines)
- `ar/dashboard/managers/onboarding.ts` (57 lines)

*Step 2: Add error message translations for provisioning*

Open `shared/messages/en.ts` and add error messages for the new provisioning workflows. These are used by the backend services via `getBackendTranslations`:

```typescript
// In the errors namespace, add:
errors: {
  // ... existing errors ...
  teacher: {
    alreadyExists: "A teacher profile for this user already exists.",
    invalidTimezone: "The provided timezone is not valid.",
    createFailed: "Failed to create teacher profile.",
  },
  parent: {
    alreadyExists: "A parent profile for this user already exists.",
    invalidTimezone: "The provided timezone is not valid.",
    createFailed: "Failed to create parent profile.",
  },
  staff: {
    alreadyExists: "A staff profile for this user already exists.",
    createFailed: "Failed to create staff profile.",
  },
  manager: {
    onlySuperAdminCanCreate: "Only System Administrators can create manager accounts.",
  },
  auth: {
    invalidRoleTab: "The selected role tab is not valid.",
  },
  user: {
    emailAlreadyExists: "An account with this email address already exists.",
  },
  permission: {
    groupNotFound: "The required permission group was not found.",
  },
}
```

*Step 3: Add Arabic error translations*

Create or update `shared/messages/ar/errors.ts` with Arabic translations:

```typescript
export const errors = {
  teacher: {
    alreadyExists: "الملف التدريسي لهذا المستخدم موجود بالفعل.",
    invalidTimezone: "المنطقة الزمنية غير صالحة.",
    createFailed: "فشل إنشاء الملف التدريسي.",
  },
  parent: {
    alreadyExists: "ملف ولي الأمر لهذا المستخدم موجود بالفعل.",
    invalidTimezone: "المنطقة الزمنية غير صالحة.",
    createFailed: "فشل إنشاء ملف ولي الأمر.",
  },
  staff: {
    alreadyExists: "الملف الوظيفي لهذا المستخدم موجود بالفعل.",
    createFailed: "فشل إنشاء الملف الوظيفي.",
  },
  manager: {
    onlySuperAdminCanCreate: "فقط المسؤولون النظاميون يمكنهم إنشاء حسابات المدراء.",
  },
  auth: {
    invalidRoleTab: "علامة التبويب المحددة للدور غير صالحة.",
  },
  user: {
    emailAlreadyExists: "الحساب بهذا البريد الإلكتروني موجود بالفعل.",
  },
  permission: {
    groupNotFound: "مجموعة الأذونات المطلوبة غير موجودة.",
  },
};
```

*Step 4: Update Arabic index to include error translations*

Open `shared/messages/ar/index.ts` and ensure the error translations are exported:

```typescript
// ... existing exports ...
export { errors } from "./errors";
```

*Step 5: Verify translation key types*

Open `shared/messages/types/message.ts` and verify that the error message types are defined. If not, add them to the appropriate type definition.

*Step 6: Verify TypeScript compilation*

```bash
bun tsgo
```

All translation files must compile with zero errors.

**Test Execution Requirements:**
- Verify TypeScript compilation:
  ```bash
  bun tsgo
  ```
- Verify linting:
  ```bash
  bun lint
  ```

**Success Criteria / Check Progress Points:**
- [ ] All existing onboarding translations verified present (EN + AR)
- [ ] Error message translations added for teacher, parent, staff, manager, auth, user, permission
- [ ] Arabic translations added for all new error messages
- [ ] Error translations exported from `shared/messages/ar/index.ts`
- [ ] Translation key types are defined in `shared/messages/types/message.ts`
- [ ] `bun tsgo` passes with zero TypeScript errors
- [ ] `bun lint` passes with zero errors
- [ ] No hardcoded strings remain in new service methods

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
