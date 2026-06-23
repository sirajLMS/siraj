# Section 2: RBAC Permissions (Canonical)

## 2.1 New Permissions

All six permissions are **new** — confirmed NOT present in:
- `backend/db/migration/3-system_permissions_and_groups.sql` ❌ (not found)
- `shared/lib/enum.ts` ❌ (not found — only `PARENT_VIEW_DIRECTORY` and `BILLING_VIEW_UNPAID_INVOICES` exist)

| **Permission Key** | **Resource.Action** | **Group** | **UI Gate** | **Backend Service Method** | **GraphQL Operation** |
|---|---|---|---|---|---|
| `parent.view_profile` | `parent` / `view_profile` | Academy Admin | `ParentProfileContainer` visibility | `ParentProfileService.getProfile()` | `parentProfile` query |
| `parent.manage_status` | `parent` / `manage_status` | Academy Admin | "Deactivate Account" button in `ParentProfileActions` | `ParentProfileService.deactivateAccount()` | `deactivateParent` mutation |
| `student.view_associated` | `student` / `view_associated` | Academy Admin | `ParentStudentsDataGrid` section in profile | `StudentManagementService.getAssociatedStudents()` | `parentAssociatedStudents` query |
| `student.edit_quota` | `student` / `edit_quota` | Academy Admin | `StudentQuotaContainer` form save button | `StudentManagementService.editQuota()` | `updateStudentQuota` mutation |
| `billing.view_history` | `billing` / `view_history` | Academy Admin | `ParentBillingContainer` invoice table | `BillingHistoryService.getParentInvoiceHistory()` | `parentInvoiceHistory` query |
| `document.manage_parent_docs` | `document` / `manage_parent_docs` | Academy Admin | "Upload Docs" tab in `ParentProfileActions` | `ParentDocumentService.getParentDocuments()` | `parentDocuments` query |

---

## 2.2 AppPermission Enum Values to Add

Add to `shared/lib/enum.ts` inside the `AppPermission` enum, after the `PARENT_VIEW_DIRECTORY` line:

```typescript
// Story 8 — Parent Profile & Account Lifecycle Management
PARENT_VIEW_PROFILE = "parent.view_profile",
PARENT_MANAGE_STATUS = "parent.manage_status",
STUDENT_VIEW_ASSOCIATED = "student.view_associated",
STUDENT_EDIT_QUOTA = "student.edit_quota",
BILLING_VIEW_HISTORY = "billing.view_history",
DOCUMENT_MANAGE_PARENT_DOCS = "document.manage_parent_docs",
```

---

## 2.3 Permission Mapping to Existing Permissions

| **Story Permission** | **Existing Related Permission** | **Relationship** |
|---|---|---|
| `parent.view_profile` | `parent.view_directory` | Granular — directory shows aggregate list; view_profile shows PII-deep single record |
| `parent.manage_status` | `parent.view_profile` | Dependent — manage_status implies view_profile access is needed but is a separate gate |
| `student.view_associated` | `students.list` (from old `parents.list`) | Scoped — view_associated is parent-scoped, not a global student list |
| `student.edit_quota` | `student.view_associated` | Dependent — must see student before editing quota |
| `billing.view_history` | `billing.view_unpaid_invoices` | Complementary — unpaid_invoices is global overdue summary; view_history is per-parent full ledger including paid |
| `document.manage_parent_docs` | `resources.upload` (teacher resource) | Analogous — same pattern applied to parent document domain |

---

## 2.4 Permission Group Assignments

| **Permission Group** | **Slug** | **New Permissions Assigned** |
|---|---|---|
| Academy Admin | `academy_admin` | All 6: `parent.view_profile`, `parent.manage_status`, `student.view_associated`, `student.edit_quota`, `billing.view_history`, `document.manage_parent_docs` |
| Parent Default | `parent_default` | None — parents cannot access any of these permissions |
| Teacher Default | `teacher_default` | None — teachers cannot access any of these permissions |
| Super Admin | `super_admin` | Inherits all (existing behavior — super_admin receives all system permissions) |

---

## 2.5 Self-Scoping vs Any-Scoping

These permissions are all **any-scoped** (admin accessing data about any parent/student). There is no self-scoped variant — parents use entirely separate, portal-specific endpoints that are not implemented in this story.

- **Academy Admin (any-scoped):** The service layer passes any `parentId` / `studentId` without ownership checks.
- **IDOR protection:** The service validates that the actor holds the required permission before querying any parent or student data.
