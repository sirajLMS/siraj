# Task L2 — Parent Suggestion History

## Sprint 15 · Frontend Views Layer · Section 6

---

## Objective

Add a "My Suggestions" section to the parent suggestion view showing past suggestions with admin responses and duplicate links. New card components follow the `ComplaintRecordCard` / `ComplaintRecordCardList` pattern.

---

## Dependencies

| Task | Description |
|------|-------------|
| J | Stories ready (Sprint 15 planning) |
| K | Stores exist (`mockParentSuggestionsStore` extended with history data) |

---

## Layer-Specific Rules

- **Generated types only**: View components use types from generated GraphQL types or from extracted `types.ts` files. No local entity type definitions.

---

## Target Files

| File | Action |
|------|--------|
| `frontend/views/dashboard/suggestions/components/ParentSuggestionRecordCard.tsx` | NEW |
| `frontend/views/dashboard/suggestions/components/ParentSuggestionRecordCardList.tsx` | NEW |
| `frontend/views/dashboard/suggestions/ParentSuggestionsView.tsx` | Modify (add history section) |
| `frontend/views/dashboard/suggestions/ParentSuggestionsDesktopView.tsx` | Modify (add history section below form) |
| `frontend/views/dashboard/suggestions/ParentSuggestionsMobileView.tsx` | Modify (add history section below form) |
| `frontend/views/dashboard/suggestions/ParentSuggestionsContainer.tsx` | Modify (wire parentSuggestions query) |
| `frontend/views/dashboard/suggestions/types/suggestionsViewTypes.ts` | Modify (extend props) |
| `frontend/views/dashboard/suggestions/utils/buildSuggestionsLabels.ts` | Modify (add parent history labels) |

---

## Pre-Implementation Checklist

- [ ] Read `frontend/views/AGENTS.md` for view layer rules
- [ ] Read `frontend/AGENTS.md` for MUI breaking changes and theme rules
- [ ] Read `frontend/COMPONENT_PATTERNS.md` for dashboard UI patterns
- [ ] Verify `mockParentSuggestionsStore` has: `parentSuggestions`, `parentSuggestionsTotal`, `isLoadingHistory`, `loadOlderSuggestions`
- [ ] Verify `ParentSuggestionRecord` type exists in store with: `id`, `suggestionPreview`, `fullText`, `status`, `adminResponse`, `duplicateOfId`, `duplicateOfPreview`, `submittedAt`
- [ ] Review `ComplaintRecordCard` pattern at `frontend/views/dashboard/complaints/components/ComplaintRecordCard.tsx`
- [ ] Review `ComplaintRecordCardList` pattern at `frontend/views/dashboard/complaints/components/ComplaintRecordCardList.tsx`
- [ ] Confirm `StatusBadge` supports duplicate status mapping (`"cancelled"` for duplicate)

---

## Implementation Details

### 1. New Component: `ParentSuggestionRecordCard`

Card showing: suggestion text preview, status badge (Pending/Reviewed/Duplicate), admin response text (if responded), duplicate link (if duplicate — clickable link to original suggestion), submitted date. Follows `ComplaintRecordCard` pattern.

```typescript
"use client";

import { HourglassEmptyOutlined, LinkOutlined, VerifiedUserOutlined } from "@mui/icons-material";
import { Box, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { StatusBadge } from "@/frontend/components/ui";
import type { ParentSuggestionRecord } from "@/frontend/stores/mockParentSuggestionsStore";
import type { SuggestionsParentLabels } from "@/shared/messages/types/dashboard/suggestions/main";

const StyledRecordCardPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.layout.radius.card,
  border: `1px solid ${theme.palette.outlineVariant}`,
  backgroundColor: theme.palette.surfaceContainerLowest,
  overflow: "hidden",
  transition: "border-color 0.15s ease",
  "&:hover": { borderColor: theme.palette.primary.main },
}));

const StyledRecordCardContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const StyledRecordCardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const StyledSuggestionPreview = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.primary.main,
}));

const StyledSubmittedDate = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
}));

const StyledAdminResponseBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.layout.radius.card,
  backgroundColor: theme.palette.surfaceContainerLow,
  position: "relative",
}));

const StyledAdminResponseHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const StyledVerifiedIcon = styled(VerifiedUserOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: 18,
}));

const StyledAdminResponseLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

const StyledAdminResponseText = styled(Typography)(({ theme }) => ({
  fontStyle: "italic",
  color: theme.palette.onSurfaceVariant,
}));

const StyledPendingStatusBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  color: theme.palette.text.secondary,
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  borderTop: `1px dashed ${theme.palette.outlineVariant}`,
  marginTop: theme.spacing(1),
}));

const StyledDuplicateLinkBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(1.5),
  borderRadius: theme.layout.radius.card,
  backgroundColor: theme.palette.surfaceContainerLow,
  cursor: "pointer",
  "&:hover": {
    backgroundColor: theme.palette.surfaceContainer,
  },
}));

const StyledDuplicateLinkIcon = styled(LinkOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: 18,
}));

const StyledDuplicateLinkText = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 600,
  textDecoration: "underline",
}));

interface ParentSuggestionRecordCardProps {
  readonly record: ParentSuggestionRecord;
  readonly labels: SuggestionsParentLabels;
  readonly onClickDuplicate?: (duplicateOfId: string) => void;
}

function mapStatusForBadge(status: ParentSuggestionRecord["status"]): string {
  if (status === "reviewed") return "paid";
  if (status === "duplicate") return "cancelled";
  return "pending";
}

export function ParentSuggestionRecordCard({
  record,
  labels,
  onClickDuplicate,
}: Readonly<ParentSuggestionRecordCardProps>) {
  const isReviewed = record.status === "reviewed";
  const isDuplicate = record.status === "duplicate";
  const hasResponse = Boolean(record.adminResponse);

  return (
    <StyledRecordCardPaper elevation={0}>
      <StyledRecordCardContent>
        <StyledRecordCardHeader>
          <Box sx={{ flex: 1 }}>
            <StyledSuggestionPreview variant="bodyLg">
              {record.suggestionPreview}
            </StyledSuggestionPreview>
            <StyledSubmittedDate variant="labelMd">
              {record.submittedAt}
            </StyledSubmittedDate>
          </Box>
          <StatusBadge
            category="invoice"
            status={mapStatusForBadge(record.status)}
            label={labels.statusLabels[record.status]}
          />
        </StyledRecordCardHeader>

        {isDuplicate && record.duplicateOfId && record.duplicateOfPreview ? (
          <StyledDuplicateLinkBox
            onClick={() => {
              if (onClickDuplicate) {
                onClickDuplicate(record.duplicateOfId!);
              }
            }}
          >
            <StyledDuplicateLinkIcon />
            <Box>
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {labels.duplicateBadge}
              </Typography>
              <StyledDuplicateLinkText variant="bodyMd">
                {record.duplicateOfPreview}
              </StyledDuplicateLinkText>
            </Box>
          </StyledDuplicateLinkBox>
        ) : null}

        {isReviewed && hasResponse ? (
          <StyledAdminResponseBox>
            <StyledAdminResponseHeader>
              <StyledVerifiedIcon />
              <StyledAdminResponseLabel variant="labelMd">
                {labels.responsePanelTitle}
              </StyledAdminResponseLabel>
            </StyledAdminResponseHeader>
            <StyledAdminResponseText variant="bodyMd">
              &ldquo;{record.adminResponse}&rdquo;
            </StyledAdminResponseText>
          </StyledAdminResponseBox>
        ) : null}

        {!isReviewed && !isDuplicate ? (
          <StyledPendingStatusBox>
            <HourglassEmptyOutlined sx={{ fontSize: 20 }} />
            <Typography variant="labelMd">{labels.waitingMessage}</Typography>
          </StyledPendingStatusBox>
        ) : null}
      </StyledRecordCardContent>
    </StyledRecordCardPaper>
  );
}
```

---

### 2. New Component: `ParentSuggestionRecordCardList`

Maps cards, shows empty state if no suggestions. Follows `ComplaintRecordCardList` pattern.

```typescript
"use client";

import { ExpandMoreOutlined, HistoryOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ParentSuggestionRecord } from "@/frontend/stores/mockParentSuggestionsStore";
import type { SuggestionsParentLabels } from "@/shared/messages/types/dashboard/suggestions/main";
import { ParentSuggestionRecordCard } from "./ParentSuggestionRecordCard";

const StyledCardListHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: theme.spacing(3),
  gap: theme.spacing(2),
}));

const StyledHistoryIcon = styled(HistoryOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

const StyledTitleGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const StyledTotalCountChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.surfaceContainerHigh,
}));

const StyledCardListContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const StyledLoadMoreContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  marginTop: theme.spacing(4),
}));

const StyledLoadMoreButton = styled(Button)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
}));

const StyledEmptyState = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(6),
  textAlign: "center",
}));

interface ParentSuggestionRecordCardListProps {
  readonly records: readonly ParentSuggestionRecord[];
  readonly labels: SuggestionsParentLabels;
  readonly hasOlderRecords: boolean;
  readonly onLoadOlderRecords: () => void;
  readonly onClickDuplicate?: (duplicateOfId: string) => void;
}

export function ParentSuggestionRecordCardList({
  records,
  labels,
  hasOlderRecords,
  onLoadOlderRecords,
  onClickDuplicate,
}: Readonly<ParentSuggestionRecordCardListProps>) {
  if (records.length === 0) {
    return (
      <StyledEmptyState>
        <HistoryOutlined sx={theme => ({ fontSize: 48, color: theme.palette.text.secondary, mb: 2 })} />
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.text.secondary })}>
          {labels.history.empty}
        </Typography>
      </StyledEmptyState>
    );
  }

  const totalLabel = labels.history.totalRecords.replace("{count}", String(records.length));

  return (
    <Box>
      <StyledCardListHeader>
        <StyledTitleGroup>
          <StyledHistoryIcon />
          <Typography variant="titleLg">{labels.history.title}</Typography>
        </StyledTitleGroup>
        <StyledTotalCountChip label={totalLabel} size="small" />
      </StyledCardListHeader>

      <StyledCardListContainer>
        {records.map(record => (
          <ParentSuggestionRecordCard
            key={record.id}
            record={record}
            labels={labels}
            onClickDuplicate={onClickDuplicate}
          />
        ))}
      </StyledCardListContainer>

      {hasOlderRecords ? (
        <StyledLoadMoreContainer>
          <StyledLoadMoreButton onClick={onLoadOlderRecords} endIcon={<ExpandMoreOutlined />}>
            {labels.loadOlder}
          </StyledLoadMoreButton>
        </StyledLoadMoreContainer>
      ) : null}
    </Box>
  );
}
```

---

### 3. Modifications: `ParentSuggestionsContainer`

Wire parent suggestions history query and loading state.

```typescript
// ADD store selectors:
const parentSuggestions = useParentSuggestionsStore(state => state.parentSuggestions);
const parentSuggestionsTotal = useParentSuggestionsStore(state => state.parentSuggestionsTotal);
const isLoadingHistory = useParentSuggestionsStore(state => state.isLoadingHistory);
const loadOlderSuggestions = useParentSuggestionsStore(state => state.loadOlderSuggestions);

// ADD to ParentSuggestionsView props:
<ParentSuggestionsView
  labels={labels.parent}
  isSubmitting={isSubmitting}
  showSuccess={showSuccess}
  canSubmit={canSubmit}
  onSubmit={handleSubmit}
  onDismissSuccess={resetSuccess}
  parentSuggestions={parentSuggestions}
  parentSuggestionsTotal={parentSuggestionsTotal}
  isLoadingHistory={isLoadingHistory}
  onLoadOlder={loadOlderSuggestions}
/>
```

---

### 4. Modifications: `ParentSuggestionsView`

Pass history props through to desktop/mobile views.

```typescript
// ADD to viewProps object:
parentSuggestions,
parentSuggestionsTotal,
isLoadingHistory,
onLoadOlder,
```

---

### 5. Modifications: `ParentSuggestionsDesktopView`

Add "My Suggestions" section below the submit form.

```typescript
// ADD import:
import { CircularProgress } from "@mui/material";
import { ParentSuggestionRecordCardList } from "./components/ParentSuggestionRecordCardList";
import { SectionPanel } from "@/frontend/components/ui";

// ADD to interface:
readonly parentSuggestions: readonly ParentSuggestionRecord[];
readonly parentSuggestionsTotal: number;
readonly isLoadingHistory: boolean;
readonly onLoadOlder: () => void;

// ADD after SuggestionSupportCards, inside PageContainer:
{parentSuggestions.length > 0 || isLoadingHistory ? (
  <Box sx={{ maxWidth: 960, mx: "auto", width: "100%", mt: 4 }}>
    <SectionPanel>
      {isLoadingHistory && parentSuggestions.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ParentSuggestionRecordCardList
          records={parentSuggestions}
          labels={labels}
          hasOlderRecords={parentSuggestionsTotal > parentSuggestions.length}
          onLoadOlderRecords={onLoadOlder}
        />
      )}
    </SectionPanel>
  </Box>
) : null}
```

---

### 6. Modifications: `ParentSuggestionsMobileView`

Add "My Suggestions" section below the submit form (same pattern as desktop).

```typescript
// ADD same imports and interface props as desktop view

// ADD after form submit button, inside PageContainer:
{parentSuggestions.length > 0 || isLoadingHistory ? (
  <Box sx={{ mt: 3 }}>
    {isLoadingHistory && parentSuggestions.length === 0 ? (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    ) : (
      <ParentSuggestionRecordCardList
        records={parentSuggestions}
        labels={labels}
        hasOlderRecords={parentSuggestionsTotal > parentSuggestions.length}
        onLoadOlderRecords={onLoadOlder}
      />
    )}
  </Box>
) : null}
```

---

### 7. Modifications: `suggestionsViewTypes`

Extend `ParentSuggestionsViewProps` with history properties.

```typescript
export interface ParentSuggestionsViewProps {
  readonly labels: SuggestionsLabels["parent"];
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly canSubmit: boolean;
  readonly onSubmit: (data: SuggestionFormData) => void;
  readonly onDismissSuccess: () => void;
  readonly parentSuggestions: readonly ParentSuggestionRecord[];
  readonly parentSuggestionsTotal: number;
  readonly isLoadingHistory: boolean;
  readonly onLoadOlder: () => void;
}
```

---

### 8. Modifications: `buildSuggestionsLabels`

Add parent history label keys.

```typescript
// ADD to parent labels in buildSuggestionsLabels:
history: {
  title: t("parent.history.title"),
  empty: t("parent.history.empty"),
  totalRecords: t("parent.history.totalRecords"),
},
duplicateBadge: t("parent.duplicateBadge"),
responsePanelTitle: t("parent.responsePanelTitle"),
waitingMessage: t("parent.waitingMessage"),
loadOlder: t("parent.loadOlder"),
statusLabels: {
  pending: t("parent.statusLabels.pending"),
  reviewed: t("parent.statusLabels.reviewed"),
  duplicate: t("parent.statusLabels.duplicate"),
},
```

---

## Duplicate Link Behavior

When a suggestion is marked as duplicate, the card shows a "Duplicate of" badge with a clickable link. Clicking opens the original suggestion in a read-only dialog (or navigates to it).

```typescript
// In ParentSuggestionsContainer, add state for read-only dialog:
const [viewDuplicateOfId, setViewDuplicateOfId] = useState<string | null>(null);

// Pass to views:
onClickDuplicate={setViewDuplicateOfId}

// Render a read-only SuggestionDetailDialog (or simple Dialog) when viewDuplicateOfId is set:
{viewDuplicateOfId ? (
  <Dialog open onClose={() => { setViewDuplicateOfId(null); }} fullWidth maxWidth="md">
    {/* Render the original suggestion content in read-only mode */}
  </Dialog>
) : null}
```

---

## Status Badge Mapping

| ParentSuggestionRecord.status | StatusBadge `status` | StatusBadge `category` |
|------------------------------|---------------------|----------------------|
| `"pending"` | `"pending"` | `"invoice"` |
| `"reviewed"` | `"paid"` | `"invoice"` |
| `"duplicate"` | `"cancelled"` | `"invoice"` |

---

## Error Handling Strategy

| Scenario | Handling |
|----------|---------|
| No suggestions yet | Empty state with icon and `history.empty` label |
| Loading history | `CircularProgress` spinner when `isLoadingHistory && records.length === 0` |
| Duplicate link clicked | Opens read-only dialog showing original suggestion |
| Older records available | "Load Older" button shown when `total > records.length` |

---

## Quality Gate — Implementation

- [ ] All new components are functional components with hooks (no class components)
- [ ] All user-facing text uses translation keys via `labels` prop (no hardcoded strings)
- [ ] All MUI style props placed inside `sx` callbacks
- [ ] All colors use theme palette via `sx={(theme) => ({ ... })}` pattern (no hardcoded hex/rgb)
- [ ] `ParentSuggestionRecordCard` follows `ComplaintRecordCard` styled-component pattern
- [ ] `ParentSuggestionRecordCardList` follows `ComplaintRecordCardList` styled-component pattern
- [ ] `ParentSuggestionRecordCard` shows status badge for pending, reviewed, and duplicate
- [ ] `ParentSuggestionRecordCard` shows admin response when `status === "reviewed"` and response exists
- [ ] `ParentSuggestionRecordCard` shows clickable duplicate link when `status === "duplicate"`
- [ ] `ParentSuggestionRecordCard` shows pending waiting message when `status === "pending"`
- [ ] `ParentSuggestionRecordCardList` shows empty state when no records exist
- [ ] `ParentSuggestionRecordCardList` shows "Load Older" button when more records exist
- [ ] `ParentSuggestionsContainer` wires `parentSuggestions`, `isLoadingHistory`, `loadOlderSuggestions` from store
- [ ] `ParentSuggestionsDesktopView` renders history section below form
- [ ] `ParentSuggestionsMobileView` renders history section below form
- [ ] `ParentSuggestionsViewProps` extended with history properties
- [ ] `buildSuggestionsLabels` includes all new parent history translation keys
- [ ] No `console.*` calls — use `logger` from `@/frontend/utils/logger` if needed
- [ ] No nested ternary operators
- [ ] TypeScript types are fully resolved (no `any`)
- [ ] No local entity type definitions — all types sourced from generated GraphQL types or extracted `types.ts` files

---

## Quality Gate — Verification

- [ ] `bun tsgo` passes with zero errors
- [ ] `bun lint` passes with zero errors
- [ ] `bun quality-gate` passes all stages
- [ ] Manual verification: parent sees "My Suggestions" section below the submit form
- [ ] Manual verification: empty state displays when no suggestions exist
- [ ] Manual verification: loading spinner shows while fetching history
- [ ] Manual verification: pending suggestion shows waiting message and pending badge
- [ ] Manual verification: reviewed suggestion shows admin response in styled box
- [ ] Manual verification: duplicate suggestion shows clickable "Duplicate of" link
- [ ] Manual verification: clicking duplicate link opens original suggestion in read-only view
- [ ] Manual verification: "Load Older" button fetches additional records
- [ ] Manual verification: history section renders correctly on both desktop and mobile
- [ ] Manual verification: all text renders correctly in both English and Arabic (RTL)

---

## Notes

- The `ParentSuggestionRecord` type must be defined in `mockParentSuggestionsStore` (Task K) with fields: `id`, `suggestionPreview`, `fullText`, `status`, `adminResponse`, `duplicateOfId`, `duplicateOfPreview`, `submittedAt`.
- The `SuggestionsParentLabels` type must be extended to include: `history`, `duplicateBadge`, `responsePanelTitle`, `waitingMessage`, `loadOlder`, and `statusLabels` with `"duplicate"` key.
- The `ParentSuggestionRecordCard` uses the same styled-component pattern as `ComplaintRecordCard` for visual consistency.
- The history section is conditionally rendered — it only appears when there are suggestions or when loading.
- The duplicate link dialog can reuse `SuggestionDetailDialog` in read-only mode or a simpler custom dialog.
