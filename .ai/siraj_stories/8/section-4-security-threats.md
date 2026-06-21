# Section 4: Security Threat Remediation

## Threat 1: Destructive Account Action Without Confirmation (UI Safeguard)

**Current Gap:** `ParentProfileActions.tsx` renders the "Deactivate Account" link as `href="#"` with no confirmation dialog and no real mutation. Any click is silent. The story spec explicitly requires a confirmation prompt: `"Are you sure that you want to deactivate this account?"`.

**Fix:**
- Replace the `<Link href="#">` deactivate anchor in `ParentProfileActions` with a button that opens an MUI `<Dialog>`.
- Dialog contains localized confirmation text and two buttons: "Cancel" and "Deactivate" (destructive, `color="error"`).
- On confirm, call `deactivateParent` mutation.
- Show `<CircularProgress>` while mutation is in flight.
- On success, show a `<Snackbar>` confirmation and navigate back to the parent directory.
- On error, show a localized error `<Alert>` inside the dialog.

**Test Requirements:**
- GraphQL test: Admin with `parent.manage_status` can deactivate → success (parent status becomes DEACTIVATED).
- GraphQL test: Teacher role attempting `deactivateParent` → `insufficientPermissions` error.
- GraphQL test: Deactivating an already-deactivated parent → `parentAlreadyDeactivated` error.

---

## Threat 2: IDOR — Accessing Another Parent's Profile/Invoices/Documents

**Current Gap:** `ParentProfileContainer` uses `useParams()` to extract `id` and passes it directly to the mock store with no type-safe guard. In the real implementation, the service layer must:
1. Check the actor's permission before accessing any data.
2. Not leak data to unpermissioned roles.

**Fix in Services:**
- `ParentProfileService.getProfile(actorUserId, parentId)`: Checks `PARENT_VIEW_PROFILE` before fetching.
- `BillingHistoryService.getParentInvoiceHistory(actorUserId, parentId)`: Checks `BILLING_VIEW_HISTORY` before fetching.
- `ParentDocumentService.getParentDocuments(actorUserId, parentId)`: Checks `DOCUMENT_MANAGE_PARENT_DOCS` before fetching.
- `StudentManagementService.getAssociatedStudents(actorUserId, parentId)`: Checks `STUDENT_VIEW_ASSOCIATED` before fetching.

**Fix in Views:**
- Replace `useParams() as { id: string }` (blind cast) with:
  ```typescript
  const params = useParams();
  const parentId = typeof params?.id === "string" ? params.id : "";
  if (!parentId) return <Typography>Invalid parent ID</Typography>;
  ```

**Test Requirements:**
- Repo test: `getParentProfile(unknownId)` returns `null` — no data leak.
- GraphQL test: Teacher token querying `parentProfile` → denied.
- GraphQL test: Parent token querying `parentProfile` → denied.
- GraphQL test: Admin token querying `parentProfile(id: validId)` → returns data.

---

## Threat 3: Quota Manipulation — Allowing classesRemaining > classesTotal

**Current Gap:** `StudentRepository.setClassesRemaining` does not yet exist. When implemented, if validation is missing, an admin could set `classesRemaining` to any integer, potentially granting unlimited classes for free.

**Fix in Service Layer:**
- `StudentManagementService.editQuota(actorUserId, studentId, newClassesRemaining, locale)` must:
  1. Check `STUDENT_EDIT_QUOTA` permission — throw `insufficientPermissions` if missing.
  2. Fetch the student. Throw `studentNotFound` if missing.
  3. Validate: `newClassesRemaining >= 0` (throw `quotaMustBeNonNegative`).
  4. Validate: `newClassesRemaining <= student.classesTotal` (throw `quotaExceedsTotal`).
  5. Call `StudentRepository.setClassesRemaining(studentId, newClassesRemaining, expectedVersion)`.

**Fix in Repository:**
- `StudentRepository.setClassesRemaining` uses optimistic locking (`version` field) and increments `version + 1` on update.
- The DB `CHECK` constraint `students_classes_remaining_chk` (`classesRemaining >= 0`) provides a hard database-level guard.

**Test Requirements:**
- Repo test: `setClassesRemaining` with `newValue = 0` succeeds.
- Repo test: `setClassesRemaining` with `newValue = -1` throws (DB constraint violation).
- Service test (in repo test file): Service rejects `newValue > classesTotal` with localized error before hitting DB.
- GraphQL test: `updateStudentQuota` with valid value → success.
- GraphQL test: `updateStudentQuota` from teacher role → denied.

---

## Threat 4: Session Not Invalidated on Deactivation

**Current Gap:** Setting `status = DEACTIVATED` in the `parents` table does NOT automatically invalidate active Redis sessions. The parent could continue using the app until their session expires naturally (up to 7 days per `session_config`).

**Fix in Service Layer:**
- After `ParentRepository.deactivateParent(parentId)` succeeds, `ParentProfileService.deactivateAccount()` calls `SessionRepository.invalidateSessionsForUser(parentUserId)` (method already exists in `session.repository.ts`).
- If session invalidation fails (unlikely but possible), the service logs a `logger.error` with the failure but does NOT roll back the deactivation — the status change is authoritative.

**Test Requirements:**
- GraphQL test: After `deactivateParent` mutation, the deactivated parent's token should be refused on subsequent requests.
- Repo test: `deactivateParent` updates `parents.status` to `DEACTIVATED`.
