# Complaints Page Audit — Fake/Static Data & Actions Report

## Summary

After a full audit of `app/[locale]/(dashboard)/complaints/` and all subcomponents in `frontend/views/dashboard/complaints/`, I identified **7 issues** where components use fake/hardcoded data or have no real action. The backend (services, repositories, GraphQL resolvers, Pothos schema) is fully implemented — the gaps are in the **frontend container/view layer** failing to use available backend data and actions.

---

## Issues Found

### 1. `ParentComplaintsContainer` — Category hardcoded to `ComplaintCategory.Other`

**File:** `frontend/views/dashboard/complaints/ParentComplaintsContainer.tsx:119`

**Current behavior:** The submit complaint mutation always sends `category: ComplaintCategory.Other`, ignoring the user's choice. The form has no category selector — it's completely omitted.

**Available backend:** `ComplaintCategory` enum has `REGARDING_TEACHER`, `REGARDING_SYSTEM`, `OTHER`. Labels are already built (`labels.categoryLabels`). The GraphQL input `ComplaintSubmitInput` accepts a `category` field.

**Suggested fix:** Add a `ComplaintCategory` select field to `ComplaintFormFields` (using `labels.categoryLabels`), wire it into the form schema (`complaintFormSchema`), and pass the selected category to `submitComplaint` mutation instead of hardcoding `Other`.

---

### 2. `AdminComplaintsContainer` — `adminResponse` and `answeredAt` always `undefined`

**File:** `frontend/views/dashboard/complaints/AdminComplaintsContainer.tsx:87-88`

**Current behavior:** When mapping `adminComplaintQueue` rows to `AdminComplaintRow`, both `adminResponse` and `answeredAt` are hardcoded to `undefined`. This means the "Answered" tab in the admin view **never shows the response text or timestamp**, even though the backend returns response data.

**Available backend:** `ComplaintReturnType` includes `responses` array with `body`, `createdAt`, `responderName`. The GraphQL `adminComplaintQueue` query already has `responses` available (though not in the current document selection set).

**Suggested fix:**
1. Add `responses { id body createdAt responderName emailSent }` to the `adminComplaintQueue` GraphQL document selection.
2. Map the first response's `body` → `adminResponse` and `createdAt` → `answeredAt` in `AdminComplaintsContainer.tsx:87-88`.
3. This will make the `ComplaintResponseSection` in `ComplaintQueueCard` actually display response content for answered complaints.

---

### 3. `AdminComplaintsContainer` — `avatarUrl` hardcoded to empty string `""`

**File:** `frontend/views/dashboard/complaints/AdminComplaintsContainer.tsx:82`

**Current behavior:** `avatarUrl` is always `""`, so the `ComplaintQueueCard` always falls back to initials. The backend does not return an avatar URL in the complaint data, and the parent profile query is not utilized.

**Available backend:** `parentProfile` query (in `parent-profile.documents.ts`) returns `avatarUrl`. Also, the `ComplaintReturnType` could potentially expose `parentAvatarUrl` if added to the join.

**Suggested fix options:**
- **Option A (Preferred):** Add a `parentAvatarUrl` resolved field to `ComplaintReturnType` via a DB join in `ComplaintRepository` → Pothos → then map it in the container. This avoids N+1 queries.
- **Option B:** Keep using initials fallback (current behavior) — this is a minor visual issue, not a functional one.
- **Option C:** Batch-fetch parent avatars after the queue loads (N+1 concern, less ideal).

---

### 4. `AdminComplaintsContainer` — Client-side filtering duplicates server-side filtering

**File:** `frontend/views/dashboard/complaints/AdminComplaintsContainer.tsx:94-97` and `utils/complaintFilters.ts`

**Current behavior:** The container fetches data from the API, then applies `filterComplaintsByTab()` on the client side. This means the server already returns filtered results (by `status` and `search`), but the client filters them again. This is redundant but also **causes a bug**: when the `activeTab` changes, the query refetches with the new status filter, but the client-side filter also applies — if search query filtering doesn't match the server's search, results may differ.

**Suggested fix:** Remove `filterComplaintsByTab()` call. The `filteredRows` variable should just be `rows`. The server already handles both status and search filtering. Alternatively, keep client-side search filtering only (for debounced/local search) but remove tab filtering since the server handles it.

---

### 5. `AdminComplaintsContainer` — `respondToComplaint` mutation doesn't clear draft after success

**File:** `frontend/views/dashboard/complaints/AdminComplaintsContainer.tsx:59-63`

**Current behavior:** When `respondToComplaint` succeeds (`onCompleted`), it refetches but does NOT clear the draft response for that complaint. The `adminComplaintsStore` has a `clearDraftResponse(id)` action that is never called.

**Suggested fix:** In the `onCompleted` callback of `respondToComplaint`, call `clearDraftResponse(complaintId)`. The complaint ID is available from the mutation variables. Also set `isResponding: false` via `resetResponding()`.

---

### 6. `deleteComplaint` mutation exists in GraphQL documents but has NO UI trigger

**File:** `frontend/graphql/sharedDocuments/complaint.documents.ts:122-129`

**Current behavior:** `deleteComplaintMutationDocument` is defined in the GraphQL documents, the backend Pothos resolver and `ComplaintService.deleteComplaint` are fully implemented, but there is **no button or UI** in any admin component to trigger deletion.

**Suggested fix:** Add a delete button (e.g., a trash icon) to `ComplaintQueueCard` for admin users with `ComplaintsDelete` permission. Wire it to call `deleteComplaintMutationDocument`, with a confirmation dialog. On success, refetch the queue.

---

### 7. `ParentComplaintsContainer` — `hasOlderRecords` hardcoded to `false`

**File:** `frontend/views/dashboard/complaints/ParentComplaintsContainer.tsx:145`

**Current behavior:** `hasOlderRecords` is always `false`. The backend returns `pageInfo.hasMorePages` which could indicate whether older records exist. Since pagination is now handled by `PaginationControls` (using `page`/`pageSize`/`totalCount`), this prop is only used as a fallback and is likely irrelevant.

**Suggested fix:** Either remove the `hasOlderRecords` prop entirely (since pagination is now handled by `PaginationControls` with `totalCount`), or map it from `data?.parentComplaints?.pageInfo?.hasMorePages ?? false` for completeness.

---

## Component-by-Component Status

| Component | Status | Issues |
|-----------|--------|--------|
| `complaints/page.tsx` | REAL | Server-side auth + cached parent ID lookup |
| `complaints/manage/page.tsx` | REAL | Simple passthrough to container |
| `ParentComplaintsContainer.tsx` | PARTIAL FAKE | #1 (hardcoded category), #7 (hardcoded hasOlderRecords) |
| `AdminComplaintsContainer.tsx` | PARTIAL FAKE | #2 (no adminResponse/answeredAt), #3 (no avatarUrl), #4 (redundant client filter), #5 (no draft clear) |
| `ParentComplaintsView.tsx` | REAL | Delegates to desktop/mobile |
| `AdminComplaintsView.tsx` | REAL | Delegates to desktop/mobile |
| `ParentComplaintsDesktopView.tsx` | REAL | Layout only |
| `ParentComplaintsMobileView.tsx` | REAL | Layout only |
| `AdminComplaintsDesktopView.tsx` | REAL | Layout only |
| `AdminComplaintsMobileView.tsx` | REAL | Layout only |
| `ComplaintFormFields.tsx` | INCOMPLETE | Missing category selector (#1) |
| `ComplaintRecordCard.tsx` | REAL | Correctly renders response/pending |
| `ComplaintRecordCardList.tsx` | REAL | Pagination works |
| `ComplaintQueueCard.tsx` | DISPLAY-ONLY ISSUE | Would show answered responses if data were passed (#2) |
| `ComplaintQueueCardList.tsx` | REAL | Pagination works |
| `ComplaintsMetricsRow.tsx` | REAL | Uses real GraphQL data |
| `ComplaintsSearchBar.tsx` | REAL | Wires to store |
| `ComplaintsTabBar.tsx` | REAL | Wires to store |
| `ComplaintPolicyPanel.tsx` | REAL | Static content (policy text) — correct behavior |
| `complaint.documents.ts` | REAL | All queries/mutations defined |
| `parentComplaintsStore.ts` | REAL | State management works |
| `adminComplaintsStore.ts` | REAL | State management works (but `clearDraftResponse` unused) |
| `complaintFormSchema.ts` | INCOMPLETE | Missing `category` field (#1) |
| `complaintFilters.ts` | REDUNDANT | #4 |
| `complaints.types.ts` | REAL | Types aligned with GraphQL |

---

## Recommended Priority Order

1. **#2** — Admin answered responses not shown (high impact: entire "Answered" tab is broken)
2. **#1** — Category hardcoded (high impact: wrong data submitted)
3. **#5** — Draft not cleared after response (medium impact: UX awkwardness)
4. **#6** — Delete complaint has no UI (medium impact: missing feature)
5. **#4** — Redundant client-side filtering (low impact: correctness/cleanup)
6. **#7** — hasOlderRecords hardcoded (low impact: pagination already works)
7. **#3** — avatarUrl empty (low impact: visual only, initials work fine)

---

## Implementation Plan

### Phase 1: Fix #2 — Admin answered responses not shown

**Files to modify:**
1. `frontend/graphql/sharedDocuments/complaint.documents.ts` — Add `responses { id body createdAt responderName emailSent }` to `adminComplaintQueue` query selection
2. `frontend/graphql/generated/gql/` — Regenerate via `bun run generate:gqlSchema && bun codegen`
3. `frontend/views/dashboard/complaints/AdminComplaintsContainer.tsx:87-88` — Map first response's `body` → `adminResponse`, `createdAt` → `answeredAt`

### Phase 2: Fix #1 — Add complaint category selector

**Files to modify:**
1. `frontend/views/dashboard/complaints/schemas/complaintFormSchema.ts` — Add `category` field to schema
2. `frontend/views/dashboard/complaints/types/complaints.types.ts` — Add `category` to `ComplaintFormData` (via schema change)
3. `frontend/views/dashboard/complaints/components/ComplaintFormFields.tsx` — Add `ComplaintCategory` select field using `labels.categoryLabels`
4. `frontend/views/dashboard/complaints/ParentComplaintsView.tsx` — Add `category` to form defaultValues
5. `frontend/views/dashboard/complaints/ParentComplaintsContainer.tsx:119` — Use form's `category` value instead of hardcoded `ComplaintCategory.Other`
6. `frontend/views/dashboard/complaints/types/complaintsViewTypes.ts` — No change needed (category flows through form data)
7. Parent desktop/mobile views — Pass category label through existing labels prop

### Phase 3: Fix #5 — Clear draft after successful response

**Files to modify:**
1. `frontend/views/dashboard/complaints/AdminComplaintsContainer.tsx:59-63` — In `onCompleted`, add `clearDraftResponse(complaintId)` using mutation variables, and `resetResponding()`

### Phase 4: Fix #6 — Add delete complaint UI

**Files to modify:**
1. `frontend/views/dashboard/complaints/components/ComplaintQueueCard.tsx` — Add delete icon button, confirmation dialog, `onDelete` prop
2. `frontend/views/dashboard/complaints/components/ComplaintQueueCardList.tsx` — Thread `onDelete` through to each card
3. `frontend/views/dashboard/complaints/types/complaintsViewTypes.ts` — Add `onDelete` to `AdminComplaintsViewProps`
4. `frontend/views/dashboard/complaints/AdminComplaintsDesktopView.tsx` — Thread `onDelete`
5. `frontend/views/dashboard/complaints/AdminComplaintsMobileView.tsx` — Thread `onDelete`
6. `frontend/views/dashboard/complaints/AdminComplaintsContainer.tsx` — Add `deleteComplaint` mutation with `useMutation`, wire `onDelete` handler, check `AppPermission.ComplaintsDelete`

### Phase 5: Fix #4 — Remove redundant client-side filtering

**Files to modify:**
1. `frontend/views/dashboard/complaints/AdminComplaintsContainer.tsx:94-97` — Replace `filteredRows` with `rows` (remove `useMemo` for client-side filter)
2. `frontend/views/dashboard/complaints/utils/complaintFilters.ts` — Delete this file (no longer needed)
3. `AdminComplaintsContainer.tsx` — Remove `import { filterComplaintsByTab }`

### Phase 6: Fix #7 — hasOlderRecords hardcoded

**Files to modify:**
1. `frontend/views/dashboard/complaints/ParentComplaintsContainer.tsx:145` — Map from `data?.parentComplaints?.pageInfo?.hasMorePages ?? false` or remove the prop if pagination makes it irrelevant
2. If removing: update `ParentComplaintsView.tsx`, desktop/mobile views, and `ComplaintRecordCardList.tsx` to remove the prop

### Phase 7: Fix #3 — avatarUrl empty (backend join approach)

**Files to modify:**
1. `backend/db/repo/complaint.repository.ts` — Add `users.avatarUrl` to the complaint queue join
2. `backend/types/complaint.types.ts` — Add `parentAvatarUrl?: string | null` to `ComplaintReturnType`
3. `backend/graphql/pothos/complaint.pothos.ts` — Add `parentAvatarUrl` field to `ComplaintPothosObject`
4. `frontend/graphql/sharedDocuments/complaint.documents.ts` — Add `parentAvatarUrl` to `adminComplaintQueue` selection
5. Regenerate GraphQL types
6. `frontend/views/dashboard/complaints/AdminComplaintsContainer.tsx:82` — Map `row.parentAvatarUrl ?? ""`

### Post-implementation

1. Run `bun run generate:gqlSchema && bun codegen` (after Phase 1 and Phase 7)
2. Run `bun quality-gate` to verify all changes
