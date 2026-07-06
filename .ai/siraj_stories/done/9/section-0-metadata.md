## Section 0: Story Metadata & Context

- **Source story:** `.ai/siraj_stories/9.md` (Part 10 - Permissions & Permission Groups, timestamps 00:00 - 02:01)
- **Security baseline:** `.ai/siraj_stories/8/` (mandatory prerequisite — Parent Profile & Account Lifecycle sprint must be fully deployed)
- **Story scope:** Implements six new granular permissions enabling: manual invoice generation, payment settlement, invoice deletion, student teacher reassignment, student status management, and automated notification tray synchronization. All operations are restricted to Admin / Super Admin roles. No new database tables are required — only new permission seeds and new service/repo methods wired to existing schema.
- **Target roles:** Admin (full access to all 5 new operational permissions), System Automated (internal `system.sync_notifications` rule only). Teacher/Parent roles are explicitly excluded.
- **Status:** Planning phase — awaiting approval for execution.

---

### 0.1 Business Objectives

1. **Separation of Duties — Financial Ledger Control:** The `billing.create_invoice`, `billing.update_status_paid`, and `billing.delete_invoice` permissions are strictly reserved for Admin and Super Admin. No teacher or parent can touch a financial record — ensuring an auditable, tamper-resistant billing ledger.

2. **Immutable Paid Records:** Once `billing.update_status_paid` is executed, the UI removes further edit/pay actions for that invoice row. Paid invoices become read-only; any error correction requires explicit admin action (`billing.delete_invoice` then re-issue).

3. **Real-Time Student Lifecycle Management:** The `student.reassign_teacher` and `student.manage_status` permissions allow targeted, surgical edits directly from the Parent Profile view — eliminating the need to navigate to the Student Directory and open a full edit form for routine operational tasks.

4. **Cascading Student Status:** Changing a student to `SUSPENDED` or `ON_LEAVE` must be deeply integrated with the existing DB trigger (`fn_enforce_student_status_transition`) and scheduling module, ensuring suspended students cannot consume teacher capacity or trigger automated billing.

5. **Automated Notification Tray Sync:** The `system.sync_notifications` permission gates the internal background rule that refreshes the global unpaid invoices notification tray (introduced in Part 6). When a billing action (mark paid, delete) resolves all outstanding invoices for a parent, the parent name is automatically purged from the notification dropdown — closing the feedback loop without requiring a manual page refresh.

6. **Cross-Module Efficiency:** The `student.reassign_teacher` capability is a UX optimization allowing admins to update the student-teacher relational link directly from the Parent Profile without navigating away.

---

### 0.2 Scope Boundaries

**In scope:**
- New permission seeds in `backend/db/migration/3-system_permissions_and_groups.sql` for all 6 new permissions
- New `AppPermission` enum entries in `shared/lib/enum.ts`
- New repository methods in `billing.repository.ts` (delete invoice, mark as paid with idempotency lock)
- New repository methods in `student.repository.ts` (reassign teacher, change status with state machine guard)
- New domain services: `BillingManagementService` (create, mark paid, delete), `StudentLifecycleService` (reassign teacher, manage status), `NotificationSyncService` (sync tray after billing mutations)
- New Pothos GraphQL mutations: `createManualInvoice`, `markInvoicePaid`, `deleteInvoice`, `reassignStudentTeacher`, `changeStudentStatus`
- New frontend Apollo `TypedDocumentNode` mutation documents for all 5 operational mutations
- Replacement of mock stores in `AdminBillingContainer` and `ManualInvoiceContainer` with real GraphQL mutations
- Wiring of student action columns in `ParentStudentsDataGrid` with real reassign-teacher and change-status mutations (MUI Dialogs replacing any `confirm()` calls)
- RBAC enforcement via `<RequirePermission>` on all new mutation-triggering UI elements
- i18n keys for all new UI strings (English + Arabic)
- Full test coverage: repository tests, GraphQL integration tests

**Out of scope:**
- New database tables or schema columns (all operations target existing `invoices`, `students`, `parents` tables)
- Automated email dispatch on invoice creation (displayed in UI as an option but not wired — separate story)
- Bulk invoice operations (single invoice actions only)
- Parent-facing invoice view changes (billing history display was implemented in Story 8)
- Student scheduling integration for status cascade (noted as a constraint; scheduling module changes are a separate story)
