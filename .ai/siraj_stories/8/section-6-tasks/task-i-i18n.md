# Task I — Internationalization (i18n): New Translation Keys

**Objective:** Add all new i18n keys required by the UI changes in Task H to the English translation file, and ensure they follow the project's existing namespace structure.

**Dependencies:** Depends on Task H — keys are derived from the `t("...")` calls in updated views.

**Layer-Specific Rules:**
- English keys are the source of truth. All keys go in the shared messages file for English first.
- Follow the existing namespace pattern: `dashboard.parentProfile.actions.*` for action keys, `dashboard.parentProfile.errors.*` for error keys.
- Do NOT duplicate keys that already exist.
- Run `bun tsgo` after editing the translation file to catch missing keys in typed `useTranslations` calls.

**Target Files:**
- Verify existing message file path by running: `find . -name "en.ts" -path "*/messages/*"` — likely `shared/messages/en.ts` or `messages/en.ts`.

---

## Detailed Implementation Steps

### Step 1: Identify the translation file

Run in the project root:

```bash
grep -r "deactivateAccount" shared/ --include="*.ts" --include="*.json" -l
grep -r "dashboard.parentProfile" messages/ --include="*.ts" --include="*.json" -l
```

Locate the file containing `dashboard.parentProfile.actions.deactivateAccount` and verify its path. This is the file to edit.

---

### Step 2: Add new keys to the `dashboard.parentProfile.actions` namespace

The existing `ParentProfileActions` component already uses `t("deactivateAccount")` — it exists. The following keys are NEW (added by Task H's rewrite):

```typescript
// Under dashboard.parentProfile.actions:
deactivateDialogTitle: "Deactivate Parent Account",
deactivateConfirmText: "Are you sure that you want to deactivate this account? The parent will be immediately logged out and lose access to the LMS.",
cancel: "Cancel",
deactivating: "Deactivating...",
deactivateSuccess: "Parent account has been deactivated successfully.",
```

---

### Step 3: Add new keys to `dashboard.parentProfile.errors` namespace

These keys are used by error states in the rewritten containers:

```typescript
// Under dashboard.parentProfile.errors (create if doesn't exist):
invalidId: "Invalid parent ID.",
notFound: "Parent not found.",
```

---

### Step 4: Add new keys to `dashboard.billing.errors` namespace

```typescript
// Under dashboard.billing.errors:
invalidId: "Invalid parent ID in billing view.",
```

---

### Step 5: Add new keys to `dashboard.students.quota.errors` namespace

```typescript
// Under dashboard.students.quota.errors:
invalidId: "Invalid student ID.",
```

---

### Step 6: Add backend error translation keys

The service layer references these localized error keys from `getBackendTranslations({ locale, namespace: "errors" })`. Check whether they exist in the backend translation file (likely `backend/lib/intl/en.ts` or similar):

```bash
grep -r "parentAlreadyDeactivated\|quotaMustBeNonNegative\|quotaExceedsTotal\|insufficientPermissions" backend/lib/ --include="*.ts" --include="*.json" -l
```

If missing, add them to the backend errors translation file:

```typescript
// In backend errors locale file:
parentNotFound: "Parent with ID {id} was not found.",
parentAlreadyDeactivated: "Parent with ID {id} is already deactivated.",
insufficientPermissions: "You do not have permission to perform this action.",
quotaMustBeNonNegative: "Classes remaining must be a non-negative integer.",
quotaExceedsTotal: "Cannot set classes remaining ({requested}) above the total classes purchased ({total}).",
invalidFileId: "A valid file ID is required.",
studentVersionMismatch: "Student {id} has been updated concurrently. Please refresh and try again (expected version {expectedVersion}, got {gotVersion}).",
```

**Note:** `studentNotFound`, `studentVersionMismatch`, and `insufficientPermissions` may already exist. Add only missing keys.

---

## Test Execution Requirements

```bash
# TypeScript type-checks all translation key references
bun tsgo

# Verify no missing key errors in useTranslations() calls
bun run lint
```

---

## Success Criteria / Check Progress Points

- [ ] `deactivateDialogTitle`, `deactivateConfirmText`, `cancel`, `deactivating`, `deactivateSuccess` keys added to `dashboard.parentProfile.actions` namespace.
- [ ] `dashboard.parentProfile.errors.invalidId` and `dashboard.parentProfile.errors.notFound` keys added.
- [ ] `dashboard.billing.errors.invalidId` key added.
- [ ] `dashboard.students.quota.errors.invalidId` key added.
- [ ] Backend error keys `parentAlreadyDeactivated`, `quotaMustBeNonNegative`, `quotaExceedsTotal`, `invalidFileId` confirmed present (add if missing).
- [ ] `bun tsgo` passes with 0 errors — no missing translation key type errors.
- [ ] `bun run lint` passes with 0 errors.

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` passes with 0 TypeScript errors & 0 warnings after modifying translation files
- [ ] `bun biome:check` passes with 0 errors & 0 warnings after modifying translation files
- [ ] `bun lint` passes with 0 errors & 0 warnings after modifying translation files
- [ ] `bun codescene` passes with 0 errors & 0 warnings after modifying translation files

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` passes with 0 TypeScript errors & 0 warnings after completing all steps
- [ ] `bun biome:check` passes with 0 errors & 0 warnings after completing all steps
- [ ] `bun lint` passes with 0 errors & 0 warnings after completing all steps
- [ ] `bun codescene` passes with 0 errors & 0 warnings after completing all steps
