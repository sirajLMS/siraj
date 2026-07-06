## Section 2: RBAC Permissions (Canonical)

See [Section 0](./section-0-metadata.md) for story scope.

---

### 2.1 New Permissions

| **Permission Key** | **Category** | **Group** | **UI Gate** | **Backend Service Method** | **GraphQL Mutation** |
|---|---|---|---|---|---|
| `billing.create_invoice` | Billing | Admin, Super Admin | Manual Invoice Form (`ManualInvoiceContainer`) | `BillingManagementService.createManualInvoice()` | `createManualInvoice` |
| `billing.update_status_paid` | Billing | Admin, Super Admin | "Mark as Paid" action (green checkmark in invoice row) | `BillingManagementService.markInvoicePaid()` | `markInvoicePaid` |
| `billing.delete_invoice` | Billing | Admin, Super Admin | "Delete" action (red trash icon in invoice row) | `BillingManagementService.deleteInvoice()` | `deleteInvoice` |
| `student.reassign_teacher` | Students | Admin, Super Admin | "Change" link in Teacher column of `ParentStudentsDataGrid` | `StudentLifecycleService.reassignTeacher()` | `reassignStudentTeacher` |
| `student.manage_status` | Students | Admin, Super Admin | Status badge click in `ParentStudentsDataGrid` | `StudentLifecycleService.changeStudentStatus()` | `changeStudentStatus` |
| `system.sync_notifications` | System | System Automated | Not user-facing — internal background rule | `NotificationSyncService.syncUnpaidNotifications()` | Called internally by billing mutations (no direct GraphQL exposure) |

---

### 2.2 Permission Mapping to Existing Permissions

| **Story 9 Permission** | **Existing Related Permission** | **Relationship** |
|---|---|---|
| `billing.create_invoice` | `billing.view_history` | Complementary — view gates read access, create gates write access to the ledger |
| `billing.create_invoice` | `invoices.create` (legacy) | Supersedes — `billing.create_invoice` is the new canonical permission for manual invoice creation from parent profile context |
| `billing.update_status_paid` | `billing.view_unpaid_invoices` | Complementary — view permission lists unpaid; update_status_paid settles them |
| `billing.update_status_paid` | `invoices.mark_paid` (legacy) | Supersedes — new canonical permission for mark-as-paid from parent billing context |
| `billing.delete_invoice` | `invoices.delete` (legacy) | Supersedes — new canonical permission scoped to the parent billing history view |
| `student.reassign_teacher` | `student.view_associated` | Sequential — view permission is prerequisite for seeing the student list; reassign_teacher gates the mutation action |
| `student.reassign_teacher` | `students.change_teacher` (legacy) | Complements — `students.change_teacher` is for the global Students Directory; `student.reassign_teacher` is for the parent profile context |
| `student.manage_status` | `student.view_associated` | Sequential — manage_status requires knowing current status which is shown via view_associated |
| `student.manage_status` | `students.change_status` (legacy) | Complements — `students.change_status` targets the Students Directory; `student.manage_status` targets the Parent Profile context |
| `system.sync_notifications` | `notification.view_alerts` | Complementary — view_alerts shows the tray; sync_notifications gates the internal update of the tray data |

> **Note on legacy vs. new permissions:** The `invoices.*` and `students.*` (plural) permissions in the existing catalog were seeded in earlier sprints for the global billing and student directories. Story 9 introduces `billing.*` and `student.*` (singular) permissions scoped to the parent profile context. Both sets coexist — the Admin group receives both.

---

### 2.3 Permission Group Assignments

| **Permission Group** | **Slug** | **New Permissions Assigned** |
|---|---|---|
| Super Admin | `super_admin` | `billing.create_invoice`, `billing.update_status_paid`, `billing.delete_invoice`, `student.reassign_teacher`, `student.manage_status`, `system.sync_notifications` |
| Admin | `academy_admin` | `billing.create_invoice`, `billing.update_status_paid`, `billing.delete_invoice`, `student.reassign_teacher`, `student.manage_status` |
| Teacher | `teacher_default` | *(none — explicitly excluded)* |
| Parent | `parent_default` | *(none — explicitly excluded)* |
| Staff | `staff_default` | *(none — explicitly excluded)* |
| System Automated | `system_automated` | `system.sync_notifications` |

---

### 2.4 Self-Scoping vs Any-Scoping

All Story 9 permissions are **admin-scoped (any)**:

- **`billing.create_invoice`** — Admin creates invoices for any parent. No self-scoping variant exists.
- **`billing.update_status_paid`** — Admin settles any parent's invoice. No self-scoping.
- **`billing.delete_invoice`** — Admin deletes any parent's invoice. No self-scoping.
- **`student.reassign_teacher`** — Admin reassigns any student's teacher. No self-scoping.
- **`student.manage_status`** — Admin changes any student's status. No self-scoping.
- **`system.sync_notifications`** — System automated rule. Not user-triggered.

This is enforced in the service layer by verifying `actorUserId` holds the required `AppPermission` and then operating on any resource ID without ownership checks.

---

### 2.5 New `AppPermission` Enum Entries (to add to `shared/lib/enum.ts`)

The following entries must be appended to the `AppPermission` enum in `shared/lib/enum.ts` (verified absent as of Story 8 — `shared/lib/enum.ts` lines 474–482):

```typescript
// Story 9: Invoice Generation & Processing (billing domain)
BILLING_CREATE_INVOICE = "billing.create_invoice",
BILLING_UPDATE_STATUS_PAID = "billing.update_status_paid",
BILLING_DELETE_INVOICE = "billing.delete_invoice",

// Story 9: Student Metadata & Lifecycle Management
STUDENT_REASSIGN_TEACHER = "student.reassign_teacher",
STUDENT_MANAGE_STATUS = "student.manage_status",

// Story 9: Automated System Synchronization
SYSTEM_SYNC_NOTIFICATIONS = "system.sync_notifications",
```
