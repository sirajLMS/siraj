## Section 7: Final Verification & Integrity Protocol

All items in this section must be verified **after all tasks A–I are complete**. No item may be skipped. The sprint is NOT done until every checkpoint below passes.

---

### 7.1 Test Suite Verification (Zero Failures)

Run the complete test suite in the specified order. Every command must exit with code 0.

```bash
# 7.1.1 Database layer — repo + logic tests
bun run test:db

# 7.1.2 GraphQL integration tests — all 5 new mutations
bun run test:graphql

# 7.1.3 UI component tests
bun run test:ui:components

# 7.1.4 Full test suite (all layers combined)
bun run test
```

**Expected output:** 0 failures across all test layers. Any failure is BLOCKING — fix before proceeding.

---

### 7.2 TypeScript Compilation (Zero Errors)

```bash
bun tsgo
```

**Expected output:** 0 TypeScript errors, 0 warnings. Any error is BLOCKING.

---

### 7.3 Linting & Formatting (Zero Issues)

```bash
bun biome:check
bun lint
```

**Expected output:** 0 errors, 0 warnings from both tools. Any issue is BLOCKING.

---

### 7.4 Code Quality Gate

```bash
bun codescene
```

**Expected output:** 0 code health issues introduced by Story 9 changes. Any newly introduced issue is BLOCKING.

---

### 7.5 Mock Store Removal Verification

```bash
rg "mockAdminBillingStore|mocKAdminManualInvoiceStore|mockUserStore" frontend/views --glob "!**/*.stories.tsx"
```

**Expected output:** Empty (no matches). Any match is BLOCKING.

---

### 7.6 Incomplete Implementation Verification

```bash
rg -i "TODO|FIXME|@todo" backend/services backend/graphql frontend/views frontend/graphql/sharedDocuments
```

**Expected output:** Empty (no matches in scope). Any match is BLOCKING.

---

### 7.7 No Drizzle/DB Imports in Services

```bash
rg "from ['\"]drizzle-orm|from ['\"]backend/db/schema|from ['\"]backend/db/index" backend/services
```

**Expected output:** Empty (no matches). Any match is BLOCKING.

---

### 7.8 No Repo Imports in GraphQL Resolvers

```bash
rg "from ['\"]backend/db" backend/graphql/pothos
```

**Expected output:** Empty (no matches in `pothos/` directory). Any match is BLOCKING.

---

### 7.9 `globalThis.confirm` / `window.confirm` Verification

```bash
rg "globalThis\.confirm|window\.confirm" frontend/views
```

**Expected output:** Empty (no matches). Any match is BLOCKING.

---

### 7.10 Permission Enum Verification

```bash
grep -n "BILLING_CREATE_INVOICE\|BILLING_UPDATE_STATUS_PAID\|BILLING_DELETE_INVOICE\|STUDENT_REASSIGN_TEACHER\|STUDENT_MANAGE_STATUS\|SYSTEM_SYNC_NOTIFICATIONS" shared/lib/enum.ts
```

**Expected output:** All 6 enum keys found with correct string values. Missing key is BLOCKING.

---

### 7.11 Migration Integrity Verification

```bash
bun db cleanGenerate
bun db reset
bun db seed
bun test:db
```

**Expected output:** All 4 commands pass with 0 errors. Any failure is BLOCKING.

---

### 7.12 Generated Types Verification

```bash
grep -n "BillingCreateInvoice\|BillingUpdateStatusPaid\|BillingDeleteInvoice\|StudentReassignTeacher\|StudentManageStatus\|SystemSyncNotifications" frontend/graphql/generated/gql/graphql-types.ts
```

**Expected output:** All 6 new `AppPermission` enum values found in generated types. Missing value requires re-running `bun run generate:gqlSchema && bun codegen`.

---

### 7.13 Functional Verification Checklist

**Billing Management (requires Academy Admin session in development environment):**
- [ ] Open Parent Profile → Billing section → Click "Create Invoice" → Fill form → Submit → Invoice appears in list with `UNPAID` status
- [ ] On an UNPAID invoice row → Click "Mark as Paid" → Invoice status changes to `PAID` → Mark as Paid button disappears → Notification tray updates
- [ ] Attempt "Mark as Paid" on already-PAID invoice → Error snackbar appears: "Invoice already paid"
- [ ] On invoice row → Click "Delete" → Confirm dialog → Invoice disappears from list
- [ ] Attempt to delete same invoice again → Error snackbar appears: "Invoice not found"
- [ ] Log in as Teacher → Billing page actions are hidden (no "Create Invoice", no "Mark as Paid", no "Delete" buttons visible)

**Student Management (requires Academy Admin session in development environment):**
- [ ] Open Parent Profile → Students section → Click SettingsOutlined icon on any student row → Reassign Teacher dialog opens
- [ ] Select new teacher in Reassign dialog → Click Confirm → Student's teacher column updates → Success snackbar
- [ ] Click StatusBadge on REGULAR student → Change Status dialog opens with `suspended` and `on_leave` options
- [ ] Select SUSPENDED → Confirm → StatusBadge updates to Suspended
- [ ] Click StatusBadge on SUSPENDED student → Change Status dialog opens with only `regular` and `deactivated` options
- [ ] Click StatusBadge on GRADUATED student → Change Status dialog opens with "No status transitions available" warning
- [ ] Log in as Teacher → SettingsOutlined and StatusBadge clicks do nothing (RequirePermission fallback = inert icon, no click handler)

**i18n (verify in both English and Arabic locales):**
- [ ] All new dialog titles, labels, buttons, and snackbar messages render correctly in English
- [ ] All new dialog titles, labels, buttons, and snackbar messages render correctly in Arabic with RTL layout

---

### 7.14 Coverage Report (Final)

```bash
bun run test:coverage backend/db/test/repo/billing.repository.test.ts
bun run test:coverage backend/db/test/repo/student.repository.test.ts
```

**Expected output:** 100% line + function coverage on all new/modified repository methods. Any method below 100% coverage is BLOCKING.

---

### 7.15 Sprint Closure Sign-Off

All of the following must be confirmed before marking Sprint 9 as DONE:

- [ ] Section 7.1 — All 4 test commands pass with 0 failures ✅
- [ ] Section 7.2 — `bun tsgo` passes with 0 errors ✅
- [ ] Section 7.3 — `bun biome:check` and `bun lint` pass with 0 issues ✅
- [ ] Section 7.4 — `bun codescene` passes with 0 new issues ✅
- [ ] Section 7.5 — Mock stores completely removed from production containers ✅
- [ ] Section 7.6 — No TODO/FIXME markers in scope ✅
- [ ] Section 7.7 — No Drizzle imports in services ✅
- [ ] Section 7.8 — No repo imports in GraphQL resolvers ✅
- [ ] Section 7.9 — No `globalThis.confirm` / `window.confirm` calls ✅
- [ ] Section 7.10 — All 6 permission enum values present ✅
- [ ] Section 7.11 — Migration sequence completes cleanly ✅
- [ ] Section 7.12 — Generated types contain all new permission values ✅
- [ ] Section 7.13 — All functional scenarios manually verified ✅
- [ ] Section 7.14 — 100% coverage on new repo methods ✅
