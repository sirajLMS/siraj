# Section 0: Story Metadata & Context

- **Source story:** `.ai/siraj_stories/8.md` — Part 9: Permissions & Permission Groups (00:00 - 01:57)
- **Story scope:** Implement six new RBAC-gated permissions covering Parent Profile viewing, account deactivation, associated-student listing, student quota editing, billing history viewing, and parent document management. All six are Admin-only (Academy Admin). The existing `ParentProfileContainer`, `ParentBillingContainer`, and `StudentQuotaContainer` are currently wired to **mock stores** — this story replaces them with real Apollo `useQuery`/`useMutation` hooks backed by new backend GraphQL operations.
- **Target roles:** Academy Admin (full access to all six permissions), Parent (none applicable).
- **Status:** Planning phase — awaiting approval for execution.

---

## 0.1 Business Objectives

1. **Separation of Duties** — `parent.manage_status` (account deactivation) is strictly Admin-only. Parents cannot deactivate their own accounts; this ensures accountability for lifecycle actions.
2. **Data Privacy** — `parent.view_profile` gates the rich PII-heavy profile screen. Without this permission, the `/parents/[id]/profile` route is inaccessible.
3. **Quota Integrity** — `student.edit_quota` is highly sensitive because directly overwriting `classesRemaining` alters billing cycle triggers. Only admins with explicit assignment can do this.
4. **Financial Auditability** — `billing.view_history` exposes a parent's complete invoice ledger (paid + unpaid). This is scoped to a single parent and distinct from the global `billing.view_unpaid_invoices` (Story 6) which shows all-academy debt.
5. **Document Traceability** — `document.manage_parent_docs` allows contracts and identity files to be attached to a parent record, creating an auditable document trail per parent.
6. **Mock Elimination** — `ParentProfileContainer`, `StudentQuotaContainer`, and `ParentBillingContainer` all currently import from `mockXxxStore`. This story moves all three to real GraphQL-backed data.

---

## 0.2 Scope Boundaries

**In scope:**
- 6 new permission entries in `backend/db/migration/3-system_permissions_and_groups.sql`
- 6 new `AppPermission` enum values in `shared/lib/enum.ts`
- New repository methods:
  - `ParentRepository.getParentProfile(parentId)` — full profile with user info
  - `ParentRepository.deactivateParent(parentId, actorUserId)` — set status to DEACTIVATED + Redis session invalidation call
  - `ParentRepository.getAssociatedStudents(parentId)` — with teacher name, hoursPerWeek, classesRemaining
  - `BillingRepository.getInvoicesForParent(parentId)` — full invoice history for one parent
  - `StorageDbRepository.getFilesForParent(parentId)` — list docs linked to a parent
  - `StorageDbRepository.linkFileToParent(parentId, fileId, usageType)` — attach a file to a parent record
  - `StudentRepository.setClassesRemaining(studentId, newValue, actorUserId)` — direct integer override (different from delta-based `addClasses`/`deductClasses`)
- New backend services: `ParentProfileService`, `BillingHistoryService`, `ParentDocumentService`; extend `StudentManagementService` with `editQuota`
- New Pothos GraphQL types, queries, and mutations
- New Apollo `TypedDocumentNode` documents in `frontend/graphql/sharedDocuments/`
- Replace mock stores in `ParentProfileContainer`, `ParentBillingContainer`, `StudentQuotaContainer`
- `<RequirePermission>` wrappers on all new feature sections
- Replace `ParentProfileActions` deactivate button (currently `href="#"`) with a real MUI Dialog + `useMutation`
- Repository tests (`backend/db/test/repo/parent.repository.test.ts`, `billing.repository.test.ts`)
- GraphQL integration tests (extend `frontend/graphql/test/parent.test.ts`)
- i18n keys for any new UI strings

**Out of scope:**
- Parent onboarding flow (separate story)
- Student profile creation/deletion (separate story)
- Payment processing (separate story)
- Physical file upload to S3/storage (signed-URL infrastructure is already in place; the `document.manage_parent_docs` permission gates document **listing** and **linking** — the upload initiation UI is not required here)
- Actual Redis session invalidation implementation (the service layer will call `SessionRepository.invalidateSessionsForUser` — if that method already exists, it is used; if not, the service throws with a logged warning and continues)
