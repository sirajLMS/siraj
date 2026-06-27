# Billing Page: Make Everything Real — Implementation Plan

## Implementation Order (per user selection)
1. Fix empty pages first
2. Fix NO-OP actions
3. Fix fake metrics
4. Fix Manual Invoice form

---

## GROUP 1: Fix Empty Pages (Critical — pages show nothing)

### 1A. AdminBilling — Add `allInvoices` query (no parentId required)

**Problem**: `AdminBillingContainer` requires `parentId` but the admin billing page doesn't have one → query is skipped → zero invoices shown.

**Implementation (bottom-up)**:

1. **Repository** (`billing.repository.ts`): Add `getAllInvoices(pagination, tx?)` method
   - Query all non-deleted invoices ordered by `issueDate DESC`
   - Join with `students` + `users` tables to resolve `studentName`
   - Return `InvoiceHistoryPaginatedResult` with `studentName` added to the row type

2. **Types** (`billing.types.ts`):
   - Add `studentName` to `InvoiceHistoryRow` (optional field, resolved from join)
   - Add `AdminBillingSummaryResult` type with `totalOutstanding`, `pendingCount`, `mtdRevenue`, `negativeBalanceCount`

3. **Repository** (`billing.repository.ts`): Add `getAdminBillingSummary(tx?)` method
   - Aggregate: SUM of unpaid invoice amounts → `totalOutstanding`
   - COUNT of unpaid invoices → `pendingCount`
   - SUM of paid invoices created this month → `mtdRevenue`
   - COUNT of students with `classesRemaining = 0` → `negativeBalanceCount`

4. **Repository** (`billing.repository.ts`): Add `getStudentsWithCreditStatus(tx?)`
   - Query `students` with `parentId` join + `users` for parent email
   - Return student name, parent email, plan type, classesRemaining, classesTotal
   - Filter: only students where `classesRemaining` is low (0 or near 0) = negative_balance

5. **Service** (`billing-history.service.ts`): Add `getAdminInvoices(actorUserId, pagination, locale)` and `getAdminBillingSummary(actorUserId, locale)` and `getStudentCreditStatus(actorUserId, locale)` — with permission checks

6. **Pothos** (`billing-history.pothos.ts`): Add `adminInvoices` query (no parentId required, with pagination), `adminBillingSummary` query, `studentCreditStatus` query
   - Add `AdminBillingSummaryPothosObject` type
   - Add `StudentCreditRowPothosObject` type
   - Use types from `billing.types.ts` (fix existing `ParentInvoiceRowDefinition` violation — should use `InvoiceHistoryRow` from `@/backend/types`)
   - Add `studentName` field to `ParentInvoiceRowPothosObject`

7. **GraphQL Documents** (`billing-management.documents.ts`): Add `adminInvoicesQueryDocument`, `adminBillingSummaryQueryDocument`, `studentCreditStatusQueryDocument`

8. **Codegen**: Run `bun run generate:gqlSchema && bun codegen`

9. **Frontend Container** (`AdminBillingContainer.tsx`):
   - Remove `parentId` prop dependency
   - Use `adminInvoicesQueryDocument` instead of `parentInvoiceHistoryQueryDocument`
   - Use `adminBillingSummaryQueryDocument` for real summary metrics
   - Use `studentCreditStatusQueryDocument` for credit rows
   - Map `studentName` from the GraphQL response
   - Remove fragile currency string parsing — use raw summary data

10. **Tests**: Add repository tests for `getAllInvoices`, `getAdminBillingSummary`, `getStudentsWithCreditStatus`

### 1B. ParentBilling — Fix parentId resolution

**Problem**: `ParentBillingContainer` gets `parentId` from `useParams().id` but route `/billing/invoices` has no `[id]` param → parentId = `""` → query skipped.

**Implementation**:

1. **Service** (`billing-history.service.ts`): Modify `getParentInvoiceHistory` to optionally accept `actorUserId` and auto-resolve `parentId` from it using `ParentRepository.findByUserId`

2. **Pothos** (`billing-history.pothos.ts`): Make `parentId` arg optional on `parentInvoiceHistory` query. If `parentId` is null, resolve from `ctx.user.id` via `ParentRepository.findByUserId`

3. **Frontend Container** (`ParentBillingContainer.tsx`):
   - Remove `useParams()` dependency for `parentId`
   - Pass `parentId: null` (or empty) and let the backend resolve from the logged-in user
   - OR: Get `parentId` from user context via the user store if available

4. **GraphQL Document** (`parent-billing-history.documents.ts`): Make `$parentId` optional

5. **Codegen**: Run `bun run generate:gqlSchema && bun codegen`

### 1C. StudentCreditDataGrid/CardList — Connect to real data

**Problem**: Always receives `creditRows={[]}`.

**Implementation**: Covered by 1A (steps 4-8). Additionally:
- Frontend: Map `studentCreditStatus` query results to `StudentCreditRow[]` in `AdminBillingContainer`

---

## GROUP 2: Fix NO-OP Actions

### 2A. `onSendReminder` — Add `sendPaymentReminder` mutation

**Implementation**:

1. **Service** (`billing-management.service.ts`): Add `sendPaymentReminder(actorUserId, studentId, locale)`
   - Permission check: `AppPermission.BILLING_SEND_REMINDER` (or reuse `BILLING_UPDATE_STATUS_PAID`)
   - Look up student + parent info
   - Call `CommunicationService` to send email/push notification to parent about student's negative balance
   - Return `{ success: boolean, notificationId: string }`

2. **Pothos** (`billing-management.pothos.ts`): Add `sendPaymentReminder` mutation
   - Args: `studentId: String!`
   - Returns: `SendPaymentReminderResult { id, success }`

3. **GraphQL Document** (`billing-management.documents.ts`): Add `sendPaymentReminderMutationDocument`

4. **Frontend Container** (`AdminBillingContainer.tsx`): Wire `onSendReminder` to the mutation with success/error feedback

### 2B. `onPayNow` / `onQuickPay` — Payment flow

**Implementation**:

1. **Decision needed**: Payment gateway integration is complex. For now, implement as:
   - `onPayNow(invoiceId)`: Open a confirmation dialog → call `markInvoicePaid` mutation (same as admin "Mark as Paid" — parent self-service payment recording)
   - `onQuickPay()`: Navigate to the first unpaid invoice or open a payment dialog listing all unpaid invoices

2. **Frontend Container** (`ParentBillingContainer.tsx`):
   - Wire `onPayNow` to the existing `markInvoicePaidMutationDocument` (it already works)
   - Wire `onQuickPay` to either navigate to a quick-pay view or open a dialog
   - Add `useMutation(markInvoicePaidMutationDocument)` to `ParentBillingContainer`

3. Note: For real payment gateway integration (Stripe, etc.), that's a separate feature. For now, "Pay Now" records the payment intent.

### 2C. `onDownloadPdf` — Invoice PDF download

**Implementation**:

1. **Backend**: Add a Next.js API route or server action to generate/download invoice PDF
   - File: `app/api/billing/invoices/[invoiceId]/pdf/route.ts` or use a server action
   - Use a PDF library (e.g., `pdfkit` or `@react-pdf/renderer`) to generate a simple invoice PDF
   - Check if a PDF lib is already in `package.json`; if not, add one

2. **Frontend**: `onDownloadPdf(invoiceId)` → trigger download via `window.open(`/api/billing/invoices/${invoiceId}/pdf`)` or fetch + blob

### 2D. `viewDetails` — Invoice detail navigation/dialog

**Implementation**:

1. **Decision needed**: Full invoice detail page vs. dialog/drawer
   - Option A (Recommended): Navigate to a detail drawer/dialog showing full invoice info
   - Option B: Create a dedicated `/billing/invoices/[invoiceId]` page

2. For now, implement as a detail dialog/drawer since we don't have a standalone invoice detail page:
   - Create `InvoiceDetailDrawer` component showing all invoice fields
   - Wire `viewDetails` onClick to open the drawer with the invoice data

### 2E. FilterButton — Add filter functionality

**Implementation**:

1. **Frontend Store** (`adminBillingStore.ts`): Add filter state (status filter, date range)
2. **Frontend Component**: Create `BillingFilterDrawer` with status/status filters
3. Wire `FilterButton` to open the filter drawer
4. Apply filters to the GraphQL query variables or client-side filtering
5. For `ParentBillingDesktopView.tsx` FilterButton: same approach

### 2F. "View All Negative Balance" button

**Implementation**:

1. Wire to navigate to a filtered view showing all students with negative balance
2. Options:
   - Navigate to same page with a filter/anchor to the credit section
   - Create a dedicated page `/billing/credit-status`
   - Toggle the filter to show only negative-balance students
3. Recommended: Toggle a filter on the existing credit section, or expand the section

---

## GROUP 3: Fix Fake Metrics

### 3A. AdminBilling summary metrics

**Problem**: Summary computed by parsing formatted currency strings; `negativeBalanceCount` hardcoded.

**Implementation**: Covered by 1A step 3 (backend `getAdminBillingSummary`).
- Frontend: Replace the `useMemo` that parses formatted strings with the real summary from the `adminBillingSummary` query
- Map backend `AdminBillingSummaryResult` directly to `AdminBillingSummary` type

### 3B. ParentBilling summary metrics

**Problem**: All summary fields = empty strings.

**Implementation**:

1. **Types** (`billing.types.ts`): Add `ParentBillingSummaryResult` with `outstandingBalance`, `paidThisTerm`, `nextDueDate`, `activeStudents`

2. **Repository** (`billing.repository.ts`): Add `getParentBillingSummary(parentId, tx?)`
   - `outstandingBalance`: SUM of unpaid invoice amounts for this parent
   - `paidThisTerm`: SUM of paid invoice amounts for this parent in current term
   - `nextDueDate`: MIN dueDate of unpaid invoices
   - `activeStudents`: COUNT of active students under this parent

3. **Service** (`billing-history.service.ts`): Add `getParentBillingSummary(actorUserId, parentId, locale)` with permission check

4. **Pothos** (`billing-history.pothos.ts`): Add `parentBillingSummary` query

5. **GraphQL Document**: Add `parentBillingSummaryQueryDocument`

6. **Frontend** (`ParentBillingContainer.tsx`): Query and map to `ParentBillingSummary`

### 3C. Student name shows UUID instead of real name

**Problem**: `studentName: inv.studentId ?? "Student"` — uses UUID.

**Implementation**: Covered by 1A step 1 (add student name join to repository query). Additionally:
- Frontend: Map `inv.studentName` from the GraphQL response instead of `inv.studentId`
- Update `deriveInitials` to use the actual student name

---

## GROUP 4: Fix Manual Invoice Form

### 4A. `billingMonths` not sent to backend

**Problem**: Month selector collects data but `handleSubmit` sends `studentId: null` and ignores `billingMonths`.

**Implementation**:

1. **Types** (`billing.types.ts`): No changes needed — `invoiceCoverageMonths` already exists in schema

2. **Mutation** (`billing-management.pothos.ts`): Add `billingMonths` arg to `createManualInvoice`
   - Type: `[BillingMonthInput!]` where `BillingMonthInput { year: Int!, month: Int! }`

3. **Service** (`billing-management.service.ts`): Accept `billingMonths` in `CreateManualInvoiceInput`
   - After creating the invoice, insert records into `invoiceCoverageMonths` table

4. **Repository** (`billing.repository.ts`): Add `createInvoiceCoverageMonths(invoiceId, months, tx?)`

5. **Frontend Container** (`ManualInvoiceContainer.tsx`):
   - Map `billingMonths` form data to `{ year, month }[]` objects
   - Pass `billingMonths` to the mutation variables

6. **GraphQL Document** (`billing-management.documents.ts`): Add `billingMonths` to `createManualInvoice` mutation

### 4B. `canSendEmail=false` always — email integration

**Problem**: "Submit & Send Email" button always disabled.

**Implementation**:

1. **Service** (`billing-management.service.ts`): Add `sendEmail` boolean to `CreateManualInvoiceInput`
   - When `sendEmail=true`, after creating the invoice, call `CommunicationService` to send the invoice email to the parent

2. **Pothos**: Add `sendEmail: Boolean` arg to `createManualInvoice` mutation

3. **Frontend** (`ManualInvoiceContainer.tsx`):
   - Set `canSendEmail=true` (based on permission or always enabled)
   - Wire `onSubmitAndSendEmail` to pass `sendEmail: true`

4. **CommunicationService Integration**: Send invoice notification via existing `CommunicationService` using email template for invoice created

### 4C. Hardcoded "AED" currency

**Problem**: `InvoiceDraftSummaryCard` shows `AED {totalFormatted}` hardcoded.

**Implementation**:

1. Pass `currency` prop to `InvoiceDraftSummaryCard` (from system settings or parent preferences)
2. Default to "USD" or read from a config/store
3. Update `ManualInvoiceContainer` to determine currency and pass down

### 4D. `studentId` always `null` — add student selector

**Problem**: Admin can't select a specific student for the manual invoice.

**Implementation**:

1. **GraphQL Document**: Add a query to fetch students by parent ID (may already exist in student-related documents)

2. **Frontend** (`ManualInvoiceFormFields.tsx`): Add a `StudentSelector` field
   - Autocomplete similar to parent selector
   - Dependent on parent selection: when parent changes, fetch students for that parent
   - Use `useQuery` with `studentDirectoryQueryDocument` filtered by parentId

3. **Frontend Container** (`ManualInvoiceContainer.tsx`):
   - Add `studentId` to form default values
   - Pass selected `studentId` in the mutation variables

---

## Execution Checklist

For each change, follow the layer order (bottom-up) and run quality checks at each layer:

### Per-layer workflow:
1. Edit files in the current layer
2. Run `bun tsgo` for type checking
3. Run `bun biome:check` for formatting
4. Run `bun lint` for linting (via queue server if parallel)
5. Run relevant test: `bun test <test-file-path>` for the changed layer's tests
6. After updating all layers, run `bun run generate:gqlSchema && bun codegen`
7. Run full layer test suite after completing changes in that layer

### Files in scope (billing-related ONLY):
- `backend/types/billing.types.ts`
- `backend/db/repo/billing.repository.ts`
- `backend/db/test/repo/billing.repository.test.ts` (if exists)
- `backend/services/billing/billing-*.service.ts`
- `backend/graphql/pothos/billing-*.pothos.ts`
- `frontend/graphql/sharedDocuments/billing-*.documents.ts`
- `frontend/stores/adminBillingStore.ts`, `parentBillingStore.ts`
- `frontend/views/dashboard/billing/**/*`
- `app/[locale]/(dashboard)/billing/**/*`

### Files OUT of scope (do NOT edit):
- Shared components (`frontend/components/ui/*`) — used but not owned
- Communication service internals — we only call its public API
- Other domain services/repositories
- `userStore.ts` — read-only
