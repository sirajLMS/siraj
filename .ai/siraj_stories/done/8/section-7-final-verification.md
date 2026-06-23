# Section 7: Final Verification

This section defines the end-to-end verification gates that MUST ALL PASS before the story is considered complete.

---

## 7.1 Functional Verification Checklist

### Permission Registration
- [ ] `bun run test:db` — All database tests pass with 0 failures.
- [ ] Run: `grep -c "parent.view_profile\|parent.manage_status\|student.view_associated\|student.edit_quota\|billing.view_history\|document.manage_parent_docs" backend/db/migration/3-system_permissions_and_groups.sql` — Output must be **≥ 6** (6 new permission entries present).
- [ ] Run: `grep -c "PARENT_VIEW_PROFILE\|PARENT_MANAGE_STATUS\|STUDENT_VIEW_ASSOCIATED\|STUDENT_EDIT_QUOTA\|BILLING_VIEW_HISTORY\|DOCUMENT_MANAGE_PARENT_DOCS" shared/lib/enum.ts` — Output must be **≥ 6** (6 new enum values present).

### Repository Layer
- [ ] `bun run test:db` — All repository tests pass including new methods.
- [ ] `bun run test:coverage backend/db/test/repo/parent.repository.test.ts` — Shows 100% line and function coverage on `getParentProfile`, `getAssociatedStudents`, `deactivateParent`.
- [ ] `bun run test:coverage backend/db/test/repo/billing.repository.test.ts` — Shows 100% coverage on `getInvoicesForParent`.

### Service Layer
- [ ] Run: `grep -rn "from.*drizzle-orm\|from.*backend/db/schema\|from.*backend/db/index" backend/services/` — Output must be **empty** (no Drizzle imports in services).
- [ ] Run: `grep -rn "from.*backend/db/repo" backend/graphql/pothos/` — Output must be **empty** (no repo imports in resolvers).

### GraphQL Layer
- [ ] `bun run generate:gqlSchema` — Succeeds with 0 errors.
- [ ] `bun codegen` — Succeeds with 0 errors; new TypeScript types generated.
- [ ] `bun run test:graphql` — All tests pass including all new `describe` blocks from Task G.

### Frontend Layer
- [ ] Run: `grep -rn "mockParentBillingStore\|mockStudentQuotaStore\|moackParentBillingStore\|MOCK_PARENT" frontend/views/ --include="*.tsx" --glob "!**/*.stories.tsx"` — Output must be **empty** (no mock stores in production views).
- [ ] Run: `grep -n "useParams.*as {" frontend/views/` — Output must be **empty** (no blind casts).
- [ ] Run: `grep -n "href=\"#\"" frontend/views/dashboard/parents/profile/ParentProfileActions.tsx` — Output must be **empty** (deactivate link removed from href).

### Security Verification
- [ ] `bun run test:graphql` — Teacher and parent denial tests all pass.
- [ ] `bun run test:graphql` — `deactivateParent` confirmation mutation test passes (status becomes `DEACTIVATED`).

---

## 7.2 Code Quality Gates

```bash
# Run all quality checks
bun tsgo
bun biome:check
bun lint
bun codescene
```

All four commands must exit with **0 errors and 0 warnings**.

Run them in sequence. If any fails, fix the issues and run all four again until all pass.

---

## 7.3 Full Test Suite

```bash
# Run every test layer in sequence
bun run test:db
bun run test:graphql
bun run test:ui:components
bun run test
```

Final target: `bun run test` passes with **0 failures** across ALL layers.

---

## 7.4 Zero-Incomplete-Implementation Verification

```bash
# Verify no TODOs, FIXMEs, or console.* calls remain in new/modified files
rg -i "TODO|FIXME|console\.(log|warn|error|debug|info)" \
  backend/services/parent/parent-profile.service.ts \
  backend/services/billing/billing-history.service.ts \
  backend/services/parent/parent-document.service.ts \
  backend/services/student/student-management.service.ts \
  backend/graphql/pothos/parent-profile.pothos.ts \
  backend/graphql/pothos/billing-history.pothos.ts \
  backend/graphql/pothos/parent-document.pothos.ts \
  frontend/views/dashboard/parents/profile/ParentProfileContainer.tsx \
  frontend/views/dashboard/parents/profile/ParentProfileActions.tsx \
  frontend/views/dashboard/billing/ParentBillingContainer.tsx \
  frontend/views/dashboard/students/quota/StudentQuotaContainer.tsx
```

Output must be **empty**.

---

## 7.5 Mock Store Elimination Verification

```bash
# Verify mock stores are only in Storybook files, not in production containers
rg "mock.*Store|MOCK_PARENT" \
  frontend/views/dashboard/parents/profile/ParentProfileContainer.tsx \
  frontend/views/dashboard/billing/ParentBillingContainer.tsx \
  frontend/views/dashboard/students/quota/StudentQuotaContainer.tsx
```

Output must be **empty**.

---

## 7.6 Definition of Done

The story is complete when:
1. ✅ All 6 new `AppPermission` enum values exist in `shared/lib/enum.ts`
2. ✅ All 6 new permissions seeded in the DB via migration SQL
3. ✅ All 6 new permissions assigned to `academy_admin` group
4. ✅ All 7 new repository methods implemented (3 in ParentRepository, 1 in BillingRepository, 2 in StorageDbRepository, 1 in StudentRepository)
5. ✅ All 4 new services implemented with permission checks and no Drizzle imports
6. ✅ All Pothos objects, 4 queries, 3 mutations registered in the GraphQL schema
7. ✅ All 7 new `TypedDocumentNode` documents created and codegen passes
8. ✅ All 3 production containers wired to real Apollo hooks (no mock stores)
9. ✅ Deactivate action replaced with MUI Dialog + real mutation
10. ✅ All i18n keys present in English translation file
11. ✅ `bun run test` passes with 0 failures across all layers
12. ✅ `bun tsgo && bun biome:check && bun lint && bun codescene` all pass with 0 errors
