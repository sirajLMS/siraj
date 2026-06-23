## Section 7: Final Verification & Integrity Protocol

All items in this section must be verified **after all execution tasks are complete**. No item may be skipped. The sprint is NOT done until every checkpoint below passes.

---

### 7.1 Test Suite Verification (Zero Failures)

Run the complete test suite in the specified order. Every command must exit with code 0.

```bash
# 7.1.1 Database layer — repo + logic tests
bun run test:db

# 7.1.2 GraphQL integration tests
bun run test:graphql

# 7.1.3 UI component tests
bun run test:ui:components

# 7.1.4 Full test suite (all layers combined)
bun run test
```

**Expected output:** 0 failures across all test layers. Any failure is BLOCKING.

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

### 7.4 Incomplete Implementation Verification

```bash
rg -i "TODO|FIXME|@todo" backend/services backend/graphql/pothos frontend/views
```

**Expected output:** Empty (no matches in scope). Any match is BLOCKING.

---

### 7.5 No Drizzle/DB Imports in Services

```bash
rg "from ['\"]drizzle-orm|from ['\"]backend/db/schema|from ['\"]backend/db/index" backend/services
```

**Expected output:** Empty (no matches). Services must access database only through repository methods. Any match is BLOCKING.

---

### 7.6 No Repo Imports in GraphQL Resolvers

```bash
rg "from ['\"]backend/db" backend/graphql/pothos
```

**Expected output:** Empty. GraphQL resolvers must call services, not repositories directly. Any match is BLOCKING.

---

### 7.7 Permission Enum Verification

```bash
grep -n "RESOURCES_DELETE\|REPORT_GENERATE_CUSTOM\|REPORT_VIEW_FINANCIALS" shared/lib/enum.ts
```

**Expected output:** All three enum keys found with correct string values. Missing key is BLOCKING.

---

### 7.8 Migration Integrity Verification

```bash
bun db cleanGenerate
bun db reset
bun db seed
bun test:db
```

**Expected output:** All 4 commands pass with 0 errors. Any failure is BLOCKING.

---

### 7.9 Functional Verification Checklist (Manual QA)

**Resource Deletion (Requires Academy Admin session):**
- [ ] Navigate to Learning Resources view.
- [ ] Click Delete icon on a resource.
- [ ] Verify the MUI Confirmation Dialog appears.
- [ ] Click Cancel -> Dialog dismisses, file remains.
- [ ] Click Confirm -> Loading spinner activates on button.
- [ ] Dialog dismisses automatically on success.
- [ ] Resource disappears from the UI without requiring a hard refresh.
- [ ] Verify S3/Local storage via AWS Console or local filesystem to ensure physical deletion.

**Reporting Engine (Requires Academy Admin session):**
- [ ] Navigate to Reporting / Analytics view.
- [ ] Enter a valid From and To Date.
- [ ] Click Generate Report -> Data Grid populates.
- [ ] Verify columns for Student Name, Teacher Name, Class Count, and Total Minutes.
- [ ] **Financial Test 1:** Log in as an Admin WITH `report.view_financials`. Verify Paid EGP and USD columns contain non-zero mathematical values.
- [ ] **Financial Test 2:** Log in as an Admin WITHOUT `report.view_financials`. Verify Paid EGP and USD columns contain strictly `0` or `null`. No error should crash the grid.

**Permission Gate Tests:**
- [ ] Log in as a Teacher.
- [ ] Attempt to view Learning Resources -> Delete button MUST NOT BE VISIBLE.
- [ ] Open GraphQL Sandbox, paste the `deleteLearningResource` mutation with a valid ID, attach Teacher bearer token.
- [ ] Execution MUST yield `Unauthorized` array in GraphQL response errors.

---

### 7.10 Coverage Report (Final)

```bash
bun run test:coverage backend/db/test/repo/learning-resource.repository.test.ts
bun run test:coverage backend/db/test/repo/reporting.repository.test.ts
```

**Expected output:** 100% line + function coverage on all new repository methods. Any method below 100% coverage is BLOCKING.

---

### 7.11 Sprint Closure Sign-Off

All of the following must be confirmed before marking Sprint 12 as DONE:

- [ ] Section 7.1 — All 4 test commands pass with 0 failures ✅
- [ ] Section 7.2 — `bun tsgo` passes with 0 errors ✅
- [ ] Section 7.3 — `bun biome:check` and `bun lint` pass with 0 issues ✅
- [ ] Section 7.4 — No TODO/FIXME markers in scope ✅
- [ ] Section 7.5 — No Drizzle imports in services ✅
- [ ] Section 7.6 — No repo imports in GraphQL resolvers ✅
- [ ] Section 7.7 — All three permission enum values present ✅
- [ ] Section 7.8 — Migration sequence completes cleanly ✅
- [ ] Section 7.9 — All functional UI scenarios manually verified ✅
- [ ] Section 7.10 — 100% coverage on new repo methods ✅
