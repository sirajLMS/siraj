# Section 3: State Machine & Threat Alignment

## 3.1 Parent Account Status State Machine

The `parents` table has a `status` column using the `parentStatusEnum` (values: `ACTIVATED`, `DEACTIVATED`, `REGULAR`, `ON_LEAVE`, `SUSPENDED`, `ON_TRIAL`).

The `parent.manage_status` permission in this story exposes only the **deactivation** transition:

```mermaid
stateDiagram-v2
    [*] --> REGULAR : Account created (onboarding)
    [*] --> ON_TRIAL : Account created (trial)
    REGULAR --> ACTIVATED : Admin activation
    ON_TRIAL --> ACTIVATED : Trial converts to active
    ON_LEAVE --> ACTIVATED : Admin reactivation
    ACTIVATED --> DEACTIVATED : parent.manage_status (Admin only)
    REGULAR --> DEACTIVATED : parent.manage_status (Admin only)
    ON_TRIAL --> DEACTIVATED : parent.manage_status (Admin only)
    ON_LEAVE --> DEACTIVATED : parent.manage_status (Admin only)
    SUSPENDED --> DEACTIVATED : parent.manage_status (Admin only)
    DEACTIVATED --> ACTIVATED : Admin reactivation (out of scope this story)

    note right of DEACTIVATED
      Upon transition to DEACTIVATED:
      - All active Redis sessions for this parent's userId are invalidated
      - Parent cannot log in
    end note
```

**State Transition Guards:**
- The `deactivateParent` service method:
  1. Checks `PermissionsService.hasPermission(actorUserId, AppPermission.PARENT_MANAGE_STATUS)` — throws localized `insufficientPermissions` error if not met.
  2. Fetches the parent record. Throws `parentNotFound` if missing.
  3. Rejects transition if parent is already `DEACTIVATED` (throw localized `parentAlreadyDeactivated` error).
  4. Calls `ParentRepository.deactivateParent(parentId)` inside a `db.transaction()`.
  5. After transaction success, calls session invalidation for the parent's `userId`.

---

## 3.2 Student Quota Edit Flow

The `student.edit_quota` permission exposes a **direct quota override** (not a delta add/deduct):

```mermaid
stateDiagram-v2
    [*] --> QuotaLoaded : studentProfile query (student.view_associated)
    QuotaLoaded --> ValidationCheck : Admin enters new classesRemaining value
    ValidationCheck --> ValidationFailed : value < 0 OR value > classesTotal
    ValidationCheck --> QuotaUpdated : value valid → setClassesRemaining()
    ValidationFailed --> QuotaLoaded : Error shown to user, no DB write
    QuotaUpdated --> [*] : Apollo cache invalidated, UI reflects new value

    note right of QuotaUpdated
      DB CHECK constraint: classesRemaining >= 0
      Service validates: newValue <= classesTotal
      Uses optimistic locking (version field)
    end note
```

**Validation Rules for `setClassesRemaining`:**
- `newValue >= 0` (enforced by DB `CHECK` constraint `students_classes_remaining_chk`)
- `newValue <= student.classesTotal` (enforced in service layer — cannot give more classes than ever purchased)
- Optimistic locking: service reads current `version`, passes it to repo, repo increments `version + 1`

---

## 3.3 Billing History View Flow

```mermaid
stateDiagram-v2
    [*] --> PermissionCheck : parentInvoiceHistory query received
    PermissionCheck --> AccessDenied : actor lacks billing.view_history
    PermissionCheck --> FetchInvoices : actor has billing.view_history
    FetchInvoices --> EmptyState : invoices array is empty
    FetchInvoices --> InvoiceList : invoices returned
    EmptyState --> [*] : "You don't have invoices." shown
    InvoiceList --> [*] : Table renders Month, IssueDate, DueDate, PaidDate, Fee, Status
```

---

## 3.4 Document Management Flow

```mermaid
stateDiagram-v2
    [*] --> PermissionCheck : parentDocuments query received
    PermissionCheck --> AccessDenied : actor lacks document.manage_parent_docs
    PermissionCheck --> FetchDocs : actor has document.manage_parent_docs
    FetchDocs --> EmptyState : parentFiles array is empty
    FetchDocs --> DocList : files returned with signed URLs
    EmptyState --> [*] : "No documents uploaded." shown
    DocList --> [*] : File list renders with download links
```
