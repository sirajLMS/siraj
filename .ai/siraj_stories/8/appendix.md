# Appendix: Task Dependency Graph & Cross-References

## A.1 Execution Order

Tasks MUST be executed in this exact order. No task may begin before all of its dependencies have been completed and their quality gates passed.

```
[Task A] Migration & Enum
    → [Task B] Repositories
        → [Task C] Repository Tests
            → [Task D] Services
                → [Task E] GraphQL (Pothos)
                    → [Task F] Frontend Documents (codegen)
                        → [Task G] GraphQL Integration Tests
                            → [Task H] Frontend Views
                                → [Task I] i18n
                                    → [Section 7] Final Verification
```

---

## A.2 File Change Summary

| **File** | **Action** | **Task** |
|---|---|---|
| `shared/lib/enum.ts` | Modify — add 6 enum values | Task A |
| `backend/db/migration/3-system_permissions_and_groups.sql` | Modify — add 6 permissions + group assignments | Task A |
| `backend/db/repo/parent.repository.ts` | Modify — add 3 methods | Task B |
| `backend/db/repo/billing.repository.ts` | Modify — add 1 method | Task B |
| `backend/db/repo/storage.repository.ts` | Modify — add 2 methods | Task B |
| `backend/db/repo/student.repository.ts` | Modify — add 1 method | Task B |
| `backend/db/test/repo/parent.repository.test.ts` | **NEW** | Task C |
| `backend/db/test/repo/billing.repository.test.ts` | Modify — extend | Task C |
| `backend/db/test/repo/student.repository.test.ts` | **NEW** | Task C |
| `backend/services/parent/parent-profile.service.ts` | **NEW** | Task D |
| `backend/services/billing/billing-history.service.ts` | **NEW** | Task D |
| `backend/services/parent/parent-document.service.ts` | **NEW** | Task D |
| `backend/services/student/student-management.service.ts` | **NEW** | Task D |
| `backend/graphql/pothos/parent-profile.pothos.ts` | **NEW** | Task E |
| `backend/graphql/pothos/billing-history.pothos.ts` | **NEW** | Task E |
| `backend/graphql/pothos/parent-document.pothos.ts` | **NEW** | Task E |
| `backend/graphql/pothos/index.ts` | Modify — add 3 exports | Task E |
| `frontend/graphql/sharedDocuments/parent-profile.documents.ts` | **NEW** | Task F |
| `frontend/graphql/sharedDocuments/parent-billing-history.documents.ts` | **NEW** | Task F |
| `frontend/graphql/sharedDocuments/parent-documents.documents.ts` | **NEW** | Task F |
| `frontend/graphql/sharedDocuments/index.ts` | Modify — add 3 exports | Task F |
| `frontend/graphql/test/parent.test.ts` | Modify — extend with 6 describe blocks | Task G |
| `frontend/views/dashboard/parents/profile/ParentProfileContainer.tsx` | Modify — replace mock | Task H |
| `frontend/views/dashboard/parents/profile/ParentProfileActions.tsx` | Modify — add Dialog | Task H |
| `frontend/views/dashboard/parents/profile/ParentProfileView.tsx` | Modify — add parentId prop | Task H |
| `frontend/views/dashboard/billing/ParentBillingContainer.tsx` | Modify — replace mock | Task H |
| `frontend/views/dashboard/students/quota/StudentQuotaContainer.tsx` | Modify — replace mock | Task H |
| Translation files (`shared/messages/en.ts` or equivalent) | Modify — add keys | Task I |
| Backend error translation file | Modify — add error keys | Task I |

**Total new files:** 10  
**Total modified files:** 16  

---

## A.3 Existing Code Reused (Do NOT Recreate)

| **Existing Asset** | **Reused In** |
|---|---|
| `PermissionsService.hasPermission()` | All 4 new services |
| `getBackendTranslations()` | All 4 new services, new repo methods |
| `ParentRepository.getStudentsForParent()` | Superseded by `getAssociatedStudents()` — keep both |
| `BillingRepository.getUnpaidInvoicesSummary()` | Not touched — different use case |
| `StudentRepository.addClasses()`, `deductClasses()` | Not touched — delta-based; `setClassesRemaining` is additive |
| `StorageDbRepository.createFile()` | Not touched — upload flow out of scope |
| `parentDirectoryQueryDocument` | Used in Task G tests to find valid parentIds |
| `RequirePermission` component | Task H — added to 3 containers |
| `PageContainer`, `PageHeader`, `SectionPanel` | Unchanged in all views |
| `ParentProfileDetails`, `ParentProfileHeader`, `ParentStudentsDataGrid` | Unchanged — pure presentational |
| `*.stories.tsx` files | **Untouched** — keep mock store aliases |

---

## A.4 Key Design Decisions

### Why a separate `setClassesRemaining` instead of `partiallyUpdate`?

`StudentRepository.partiallyUpdate` is a general-purpose update that accepts any field. Using it for quota changes would bypass the advisory lock pattern and optimistic locking that protects quota integrity. The dedicated `setClassesRemaining` method:
1. Uses the same advisory lock (`pg_advisory_xact_lock`) as `addClasses`/`deductClasses`.
2. Increments `version` for optimistic concurrency.
3. Makes the intent explicit and auditable.

### Why `deactivateParent` is a separate method and not using `partiallyUpdate`?

For the same reason — `deactivateParent` needs to return the `userId` for session invalidation. It also implements a state guard (throws `parentAlreadyDeactivated`). `partiallyUpdate` in `parent.repository.ts` (if it exists) does not have these concerns.

### Why `getAssociatedStudents` instead of reusing `getStudentsForParent`?

The existing `getStudentsForParent` only returns `{ name }` — a minimal list used for internal lookups. `getAssociatedStudents` returns the full data needed by the admin UI: teacher name, hoursPerWeek, classesRemaining, classesTotal, status. Creating a separate named method keeps both concerns isolated and avoids breaking callers of the original.

### Why session invalidation is in the Service layer, not the Repository layer?

Repositories are pure data-access objects. Session invalidation is a cross-cutting concern (involves both DB and Redis). The service layer is the correct place for this orchestration: it calls the repo for the DB write, then handles session cleanup. If session cleanup fails, the service decides not to roll back (the status change takes precedence over cache consistency).

---

## A.5 Quick Verification Commands

```bash
# After Task A
bun run test:db

# After Task B
bun run test:db

# After Task C
bun run test:db && bun run test:coverage backend/db/test/repo/parent.repository.test.ts

# After Task D
bun tsgo

# After Task E
bun run generate:gqlSchema && bun codegen && bun tsgo

# After Task F
bun codegen && bun tsgo

# After Task G
bun run test:graphql

# After Task H
bun tsgo && bun run lint

# After Task I
bun tsgo && bun run lint

# Final
bun run test && bun tsgo && bun biome:check && bun lint && bun codescene
```
