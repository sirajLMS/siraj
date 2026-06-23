## Section 3: State Machine & Threat Alignment

See [Section 0](./section-0-metadata.md) for story scope and [Section 4](./section-4-security-threats.md) for security threat remediation.

---

### 3.1 Invoice State Machine

Invoices follow a strict lifecycle enforced at the repository and service layers. There is no DB-level trigger for invoice state transitions — enforcement is done in `BillingManagementService` with advisory locking via `BillingRepository.updateInvoiceStatus`.

```mermaid
stateDiagram-v2
    [*] --> UNPAID : billing.create_invoice (Admin)
    UNPAID --> PAID : billing.update_status_paid (Admin)\n injects paidDate = now()
    UNPAID --> DELETED : billing.delete_invoice (Admin)\n soft-delete sets deletedAt
    PAID --> DELETED : billing.delete_invoice (Admin)\n soft-delete allowed on paid invoices

    note right of PAID
        Once PAID, the "Mark as Paid" and
        "Edit" actions are hidden in the UI.
        Immutability enforced in service layer:
        markInvoicePaid throws if status ≠ UNPAID.
    end note

    note right of DELETED
        Soft-delete: sets invoices.deletedAt = now().
        Record remains in DB for audit.
        BillingRepository.getInvoicesForParent
        filters with isNull(invoices.deletedAt).
    end note
```

**Invoice State Transition Guards:**
- `BillingManagementService.markInvoicePaid()`: Throws `billing.invoiceAlreadyPaid` if `invoice.status !== "UNPAID"`. Advisory lock (`pg_advisory_xact_lock`) prevents concurrent settlement of the same invoice.
- `BillingManagementService.deleteInvoice()`: Soft-deletes by setting `deletedAt = now()`. Does NOT check status — both UNPAID and PAID invoices can be deleted by an authorized admin. Throws not-found if invoice is already soft-deleted.

---

### 3.2 Student Status State Machine

Student status transitions are enforced by the existing DB trigger `fn_enforce_student_status_transition` (verified in `backend/db/migration/student_status_transition_trigger.sql`). Story 9 adds the `student.manage_status` permission to gate the UI action that triggers this transition.

```mermaid
stateDiagram-v2
    [*] --> ON_TRIAL : student created
    ON_TRIAL --> REGULAR : activate (admin)
    ON_TRIAL --> DEACTIVATED : deactivate (admin)

    REGULAR --> SUSPENDED : student.manage_status (Admin)\n "Suspended" selection
    REGULAR --> ON_LEAVE : student.manage_status (Admin)\n "On Leave" selection
    REGULAR --> DEACTIVATED : admin action
    REGULAR --> GRADUATED : admin action (terminal)

    SUSPENDED --> REGULAR : student.manage_status (Admin)\n "Regular" re-activation
    SUSPENDED --> DEACTIVATED : admin action

    ON_LEAVE --> REGULAR : student.manage_status (Admin)\n "Regular" re-activation
    ON_LEAVE --> DEACTIVATED : admin action

    DEACTIVATED --> REGULAR : admin re-activation

    GRADUATED --> [*] : terminal — no further transitions

    note right of SUSPENDED
        Suspended students cannot be scheduled
        for new classes. Scheduling module
        must check status before class creation.
        (Scheduling integration = separate story)
    end note
```

**Student State Transition Guards:**
- DB trigger `fn_enforce_student_status_transition` (BEFORE UPDATE on `students` table) enforces the whitelist of allowed transitions shown above. Story 9 does NOT modify this trigger.
- `StudentLifecycleService.changeStudentStatus()`: Calls `StudentRepository.partiallyUpdate()` with new status. If the DB trigger rejects the transition, the Postgres exception propagates as an error returned to the GraphQL resolver.
- Allowed transitions via `student.manage_status` UI: `REGULAR → SUSPENDED`, `REGULAR → ON_LEAVE`, `SUSPENDED → REGULAR`, `ON_LEAVE → REGULAR`. The UI dropdown filters the allowed target statuses based on the student's current status.

---

### 3.3 Notification Sync Flow

The `system.sync_notifications` rule is triggered **internally** after `markInvoicePaid` or `deleteInvoice` mutations complete successfully. It is NOT directly callable via GraphQL.

```mermaid
stateDiagram-v2
    [*] --> BillingMutation : Admin executes markInvoicePaid\nor deleteInvoice
    BillingMutation --> CheckRemainingUnpaid : NotificationSyncService.syncUnpaidNotifications()
    CheckRemainingUnpaid --> NotificationTrayUpdated : Parent has 0 remaining UNPAID invoices\n→ parent purged from tray
    CheckRemainingUnpaid --> NotificationTrayUnchanged : Parent still has ≥1 UNPAID invoice\n→ tray unchanged
    NotificationTrayUpdated --> [*]
    NotificationTrayUnchanged --> [*]

    note right of CheckRemainingUnpaid
        BillingRepository.getUnpaidInvoicesSummary()
        re-evaluated after each billing mutation.
        Apollo cache is invalidated by returning
        updated UnpaidInvoicesSummary from mutation.
    end note
```

**Implementation Note:** `NotificationSyncService.syncUnpaidNotifications()` calls `BillingRepository.getUnpaidInvoicesSummary()` and returns the updated summary. The GraphQL mutation resolvers for `markInvoicePaid` and `deleteInvoice` return the `UnpaidInvoicesSummary` object alongside the mutated invoice, enabling Apollo Client to automatically update the cache for the `billingUnpaidInvoices` query without a manual `refetchQueries` call.
