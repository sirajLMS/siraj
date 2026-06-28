# Complaints Page — Make All Components Real

## Scope

**Pages:** `app/[locale]/(dashboard)/complaints/page.tsx` and `app/[locale]/(dashboard)/complaints/manage/page.tsx`
**Views:** `frontend/views/dashboard/complaints/` (all components, types, utils, schemas)

The backend (services, repositories, Pothos schema, types) and GraphQL documents are fully wired — all queries/mutations exist and are functional. The issue is in the **frontend views layer**: components may have buttons/actions that don't connect to real GraphQL operations, display stale/static data, or have no-ops.

---

## Assessment Table

| # | Component | Status | Details |
|---|-----------|--------|---------|
| 1 | `ParentComplaintsContainer.tsx` | REAL | Fetches via `useQuery(parentComplaintsQueryDocument)`, submits via `useMutation(submitComplaintMutationDocument)`. All wired. |
| 2 | `AdminComplaintsContainer.tsx` | REAL | Fetches via `useQuery(adminComplaintQueueQueryDocument)`, responds via `useMutation(respondToComplaintMutationDocument)`, deletes via `useMutation(deleteComplaintMutationDocument)`. All wired. |
| 3 | `ParentComplaintsView.tsx` | REAL | Dispatcher + form setup. |
| 4 | `AdminComplaintsView.tsx` | REAL | Dispatcher. |
| 5 | `ParentComplaintsDesktopView.tsx` | REAL | Renders form, policy panel, record list. All callbacks wired. |
| 6 | `ParentComplaintsMobileView.tsx` | REAL | Same as desktop. |
| 7 | `AdminComplaintsDesktopView.tsx` | REAL | Metrics, search, tabs, queue list. All handlers forwarded. |
| 8 | `AdminComplaintsMobileView.tsx` | REAL | Same as desktop. |
| 9 | `ComplaintFormFields.tsx` | REAL | Form fields bound to react-hook-form. Category uses real `ComplaintCategory` enum. Students from real query. |
| 10 | `ComplaintPolicyPanel.tsx` | PASSIVE | Static text panel, fully i18n. No actions to wire — informational only. |
| 11 | `ComplaintRecordCardList.tsx` | REAL | Renders cards from real data. Pagination via `PaginationControls`. |
| **12** | **`ComplaintRecordCard.tsx`** | **MISMATCH** | **Uses `category="invoice"` on `StatusBadge` with `status="paid"`. Complaints are not invoices — wrong semantic category.** |
| 13 | `ComplaintQueueCardList.tsx` | REAL | Cards from real data. Pagination wired. |
| 14 | `ComplaintQueueCard.tsx` | REAL | All actions wired: answer, answer+email, delete. |
| 15 | `ComplaintsMetricsRow.tsx` | REAL | Uses `BillingMetricsRow` + `AdminQueueEfficiencyBanner` with real GraphQL metrics. |
| 16 | `ComplaintsSearchBar.tsx` | REAL | `onChange` sets store `searchQuery` → triggers `useQuery` refetch. |
| 17 | `ComplaintsTabBar.tsx` | REAL | Tab change sets store `activeTab` → updates `filter.status` on query → triggers refetch. |
| 18-21 | Types & utils | REAL | All properly derived. |

---

## Issue Found

### `ComplaintRecordCard.tsx` — Wrong StatusBadge Category

**File:** `frontend/views/dashboard/complaints/components/ComplaintRecordCard.tsx:105-111, 126-130`

**Current code:**
```tsx
function mapStatusForBadge(status: ComplaintStatus): string {
  if (status === ComplaintStatus.Answered) {
    return "paid";      // ← Invoice-specific, meaningless for complaints
  }
  return "pending";
}

<StatusBadge
  category="invoice"     // ← Wrong category — complaints are not invoices
  status={mapStatusForBadge(record.status)}
  label={labels.statusLabels[labelKey]}
/>
```

**Why it's wrong:** The `StatusBadge` component resolves colors based on its `category` and `status` props. `"invoice"` category maps `"paid"` → `completed` colors (green) and `"pending"` → `pending` colors (amber). While the colors happen to work visually, the semantic mapping is wrong. Complaints should use `"classStatus"` category which supports `"completed"` and `"pending"` statuses with the same visual results but correct semantics.

**Proposed fix:** Change `category` from `"invoice"` to `"classStatus"`, and update `mapStatusForBadge` to return `"completed"` for Answered (which maps to green/completed colors) and `"pending"` for Unanswered (which maps to amber/pending colors).

```tsx
// After fix:
function mapStatusForBadge(status: ComplaintStatus): string {
  if (status === ComplaintStatus.Answered) {
    return "completed";   // classStatus: completed → green
  }
  return "pending";       // classStatus: pending → amber
}

<StatusBadge
  category="classStatus"  // ← Semantically appropriate for complaint status
  status={mapStatusForBadge(record.status)}
  label={labels.statusLabels[labelKey]}
/>
```

This matches how `ComplaintQueueCard.tsx` already uses `category="classStatus"` for the priority badge on the admin side.

---

## Plan

### Step 1: Fix ComplaintRecordCard StatusBadge (frontend/views layer)
- Update `mapStatusForBadge` return values: `"paid"` → `"completed"`
- Update `category` prop: `"invoice"` → `"classStatus"`

### Step 2: Run quality checks (in agent sandbox container)
- `bun tsgo`
- `bun biome:check`
- `bun lint` (via lint queue server)

### Step 3: Run related tests
- Run `frontend/graphql/test/complaint.test.ts` (no changes to GraphQL, but verify no regressions)
- No UI component tests exist yet for the complaints views layer
