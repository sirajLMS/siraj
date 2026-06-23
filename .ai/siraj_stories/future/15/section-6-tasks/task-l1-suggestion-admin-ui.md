# Task L1 — Suggestion Admin UI

## Sprint 15 · Frontend Views Layer · Section 6

---

## Objective

Build new admin UI components for suggestion management: detail dialog, action bar, response panel, and duplicate search dialog. Extend existing DataGrid, CardList, and MetricsRow with new columns, action buttons, status badges, and duplicate count metric.

---

## Dependencies

| Task | Description |
|------|-------------|
| J | Stories ready (Sprint 15 planning) |
| K | Stores exist (`mockAdminSuggestionsStore` extended with new actions) |

---

## Target Files

| File | Action |
|------|--------|
| `frontend/views/dashboard/suggestions/components/SuggestionDetailDialog.tsx` | NEW |
| `frontend/views/dashboard/suggestions/components/SuggestionActionBar.tsx` | NEW |
| `frontend/views/dashboard/suggestions/components/AdminResponsePanel.tsx` | NEW |
| `frontend/views/dashboard/suggestions/components/DuplicateSearchDialog.tsx` | NEW |
| `frontend/views/dashboard/suggestions/components/SuggestionsDataGrid.tsx` | Modify (add new columns, action buttons) |
| `frontend/views/dashboard/suggestions/components/SuggestionsCardList.tsx` | Modify (add actions, status badges) |
| `frontend/views/dashboard/suggestions/components/SuggestionsMetricsRow.tsx` | Modify (add duplicate count metric) |
| `frontend/views/dashboard/suggestions/AdminSuggestionsContainer.tsx` | Modify (wire new actions) |
| `frontend/views/dashboard/suggestions/AdminSuggestionsDesktopView.tsx` | Modify (pass new props) |
| `frontend/views/dashboard/suggestions/AdminSuggestionsMobileView.tsx` | Modify (pass new props) |
| `frontend/views/dashboard/suggestions/types/suggestionsViewTypes.ts` | Modify (extend props interface) |
| `frontend/views/dashboard/suggestions/utils/buildSuggestionsLabels.ts` | Modify (add new label keys) |

---

## Pre-Implementation Checklist

- [ ] Read `frontend/views/AGENTS.md` for view layer rules
- [ ] Read `frontend/AGENTS.md` for MUI breaking changes and theme rules
- [ ] Read `frontend/COMPONENT_PATTERNS.md` for dashboard UI patterns
- [ ] Verify `mockAdminSuggestionsStore` has new actions: `respondToSuggestion`, `markAsDuplicate`, `deleteSuggestion`
- [ ] Verify `AdminSuggestionRow` type extended with: `adminResponse`, `duplicateOfId`, `duplicateOfPreview`, `fullText`
- [ ] Verify `SuggestionStatus` includes `"duplicate"` value
- [ ] Confirm `AppPermission.SuggestionsReview` and `AppPermission.SuggestionsDelete` exist in generated GraphQL types
- [ ] Confirm `StatusBadge` component supports a `duplicate` status mapping
- [ ] Confirm `AppDataGrid` supports popover-based action menus
- [ ] Verify MUI `Dialog`, `Autocomplete`, `IconButton`, `Tooltip` imports work with v9+ API

---

## Implementation Details

### 1. New Component: `SuggestionDetailDialog`

MUI Dialog showing full suggestion text, parent name, submitted date, and status badge. Contains `AdminResponsePanel` and `SuggestionActionBar`.

```typescript
"use client";

import { CloseOutlined } from "@mui/icons-material";
import { Box, Dialog, Divider, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { StatusBadge } from "@/frontend/components/ui";
import type { AdminSuggestionRow, SuggestionStatus } from "@/frontend/stores/mockAdminSuggestionsStore";
import type { SuggestionsAdminLabels } from "@/shared/messages/types/dashboard/suggestions/main";
import { AdminResponsePanel } from "./AdminResponsePanel";
import { SuggestionActionBar } from "./SuggestionActionBar";

const StyledDialogHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(3),
  borderBottom: `1px solid ${theme.palette.outlineVariant}`,
}));

const StyledDialogBody = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const StyledMetaRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const StyledSuggestionText = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.layout.radius.card,
  backgroundColor: theme.palette.surfaceContainerLow,
  borderLeft: `4px solid ${theme.palette.primary.main}`,
  marginBottom: theme.spacing(3),
}));

const StyledDialogFooter = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderTop: `1px solid ${theme.palette.outlineVariant}`,
}));

interface SuggestionDetailDialogProps {
  readonly open: boolean;
  readonly suggestion: AdminSuggestionRow | null;
  readonly labels: SuggestionsAdminLabels;
  readonly canReview: boolean;
  readonly canDelete: boolean;
  readonly onClose: () => void;
  readonly onRespond: (suggestionId: string, response: string) => void;
  readonly onMarkDuplicate: (suggestionId: string, duplicateOfId: string) => void;
  readonly onDelete: (suggestionId: string) => void;
  readonly onMarkReviewed: (suggestionId: string) => void;
}

function mapStatusForDialog(status: SuggestionStatus): string {
  if (status === "reviewed") return "paid";
  if (status === "duplicate") return "cancelled";
  return "pending";
}

export function SuggestionDetailDialog({
  open,
  suggestion,
  labels,
  canReview,
  canDelete,
  onClose,
  onRespond,
  onMarkDuplicate,
  onDelete,
  onMarkReviewed,
}: Readonly<SuggestionDetailDialogProps>) {
  if (!suggestion) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      slotProps={{ paper: { sx: theme => ({ borderRadius: theme.layout.radius.card }) } }}
    >
      <StyledDialogHeader>
        <Typography variant="titleLg">{labels.detailDialogTitle}</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseOutlined />
        </IconButton>
      </StyledDialogHeader>

      <StyledDialogBody>
        <StyledMetaRow>
          <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
            {suggestion.parentName}
          </Typography>
          <StatusBadge
            category="invoice"
            status={mapStatusForDialog(suggestion.status)}
            label={labels.statusLabels[suggestion.status]}
          />
        </StyledMetaRow>

        <Typography
          variant="labelMd"
          sx={theme => ({ color: theme.palette.text.secondary, mb: 2, display: "block" })}
        >
          {suggestion.submittedAt}
        </Typography>

        <StyledSuggestionText>
          <Typography variant="bodyLg">
            {suggestion.fullText ?? suggestion.suggestionPreview}
          </Typography>
        </StyledSuggestionText>

        <AdminResponsePanel
          suggestion={suggestion}
          labels={labels}
          canRespond={canReview}
          onSave={(response) => { onRespond(suggestion.id, response); }}
        />
      </StyledDialogBody>

      <StyledDialogFooter>
        <SuggestionActionBar
          suggestion={suggestion}
          labels={labels}
          canReview={canReview}
          canDelete={canDelete}
          onRespond={() => {}}
          onMarkDuplicate={() => { onMarkDuplicate(suggestion.id, ""); }}
          onDelete={() => { onDelete(suggestion.id); }}
          onMarkReviewed={() => { onMarkReviewed(suggestion.id); }}
        />
      </StyledDialogFooter>
    </Dialog>
  );
}
```

---

### 2. New Component: `SuggestionActionBar`

Row of action buttons for admin suggestion management. Each button triggers the corresponding store action.

```typescript
"use client";

import {
  CheckCircleOutlined,
  DeleteOutlined,
  LinkOutlined,
  ReplyOutlined,
} from "@mui/icons-material";
import { Box, Button, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { AdminSuggestionRow } from "@/frontend/stores/mockAdminSuggestionsStore";
import type { SuggestionsAdminLabels } from "@/shared/messages/types/dashboard/suggestions/main";

const StyledActionBarContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  flexWrap: "wrap",
}));

interface SuggestionActionBarProps {
  readonly suggestion: AdminSuggestionRow;
  readonly labels: SuggestionsAdminLabels;
  readonly canReview: boolean;
  readonly canDelete: boolean;
  readonly onRespond: () => void;
  readonly onMarkDuplicate: () => void;
  readonly onDelete: () => void;
  readonly onMarkReviewed: () => void;
}

export function SuggestionActionBar({
  suggestion,
  labels,
  canReview,
  canDelete,
  onRespond,
  onMarkDuplicate,
  onDelete,
  onMarkReviewed,
}: Readonly<SuggestionActionBarProps>) {
  const isPending = suggestion.status === "pending";
  const isDuplicate = suggestion.status === "duplicate";

  if (isDuplicate) return null;

  return (
    <StyledActionBarContainer>
      {canReview && isPending ? (
        <Tooltip title={labels.actions.review}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CheckCircleOutlined />}
            onClick={onMarkReviewed}
          >
            {labels.actions.review}
          </Button>
        </Tooltip>
      ) : null}

      {canReview ? (
        <Tooltip title={labels.actions.respond}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ReplyOutlined />}
            onClick={onRespond}
          >
            {labels.actions.respond}
          </Button>
        </Tooltip>
      ) : null}

      {canReview && isPending ? (
        <Tooltip title={labels.actions.markDuplicate}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<LinkOutlined />}
            onClick={onMarkDuplicate}
          >
            {labels.actions.markDuplicate}
          </Button>
        </Tooltip>
      ) : null}

      {canDelete ? (
        <Tooltip title={labels.actions.delete}>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<DeleteOutlined />}
            onClick={onDelete}
          >
            {labels.actions.delete}
          </Button>
        </Tooltip>
      ) : null}
    </StyledActionBarContainer>
  );
}
```

---

### 3. New Component: `AdminResponsePanel`

Text area for admin to write/edit response. Shows existing response in read-only mode if already responded.

```typescript
"use client";

import { VerifiedUserOutlined } from "@mui/icons-material";
import { Box, Button, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useState } from "react";
import type { AdminSuggestionRow } from "@/frontend/stores/mockAdminSuggestionsStore";
import type { SuggestionsAdminLabels } from "@/shared/messages/types/dashboard/suggestions/main";

const StyledResponseContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const StyledReadOnlyResponse = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.layout.radius.card,
  backgroundColor: theme.palette.surfaceContainerLow,
  border: `1px solid ${theme.palette.outlineVariant}`,
}));

const StyledReadOnlyHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const StyledVerifiedIcon = styled(VerifiedUserOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: 18,
}));

interface AdminResponsePanelProps {
  readonly suggestion: AdminSuggestionRow;
  readonly labels: SuggestionsAdminLabels;
  readonly canRespond: boolean;
  readonly onSave: (response: string) => void;
}

export function AdminResponsePanel({
  suggestion,
  labels,
  canRespond,
  onSave,
}: Readonly<AdminResponsePanelProps>) {
  const [responseText, setResponseText] = useState("");
  const hasExistingResponse = Boolean(suggestion.adminResponse);

  if (hasExistingResponse) {
    return (
      <StyledResponseContainer>
        <StyledReadOnlyResponse>
          <StyledReadOnlyHeader>
            <StyledVerifiedIcon />
            <Typography variant="labelMd" sx={{ fontWeight: 700 }}>
              {labels.responsePanel.title}
            </Typography>
          </StyledReadOnlyHeader>
          <Typography variant="bodyMd" sx={{ fontStyle: "italic" }}>
            {suggestion.adminResponse}
          </Typography>
        </StyledReadOnlyResponse>
      </StyledResponseContainer>
    );
  }

  if (!canRespond) return null;

  return (
    <StyledResponseContainer>
      <Typography variant="labelMd" sx={{ fontWeight: 700, mb: 1, display: "block" }}>
        {labels.responsePanel.title}
      </Typography>
      <TextField
        fullWidth
        multiline
        minRows={3}
        maxRows={6}
        value={responseText}
        placeholder={labels.responsePanel.placeholder}
        onChange={event => { setResponseText(event.target.value); }}
        slotProps={{ htmlInput: { autoComplete: "off" } }}
      />
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
        <Button
          variant="contained"
          disabled={responseText.trim().length === 0}
          onClick={() => {
            onSave(responseText.trim());
            setResponseText("");
          }}
        >
          {labels.responsePanel.save}
        </Button>
      </Box>
    </StyledResponseContainer>
  );
}
```

---

### 4. New Component: `DuplicateSearchDialog`

MUI Dialog with MUI Autocomplete for searching existing suggestions to mark as duplicate.

```typescript
"use client";

import { CloseOutlined, SearchOutlined } from "@mui/icons-material";
import { Autocomplete, Box, Button, Dialog, IconButton, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useState } from "react";
import type { AdminSuggestionRow } from "@/frontend/stores/mockAdminSuggestionsStore";
import type { SuggestionsAdminLabels } from "@/shared/messages/types/dashboard/suggestions/main";

const StyledDialogHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(3),
  borderBottom: `1px solid ${theme.palette.outlineVariant}`,
}));

const StyledDialogBody = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const StyledDialogFooter = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(1),
  padding: theme.spacing(2, 3),
  borderTop: `1px solid ${theme.palette.outlineVariant}`,
}));

const StyledOptionMeta = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

interface DuplicateSearchDialogProps {
  readonly open: boolean;
  readonly suggestionId: string;
  readonly suggestions: readonly AdminSuggestionRow[];
  readonly labels: SuggestionsAdminLabels;
  readonly onClose: () => void;
  readonly onConfirm: (duplicateOfId: string) => void;
}

export function DuplicateSearchDialog({
  open,
  suggestionId,
  suggestions,
  labels,
  onClose,
  onConfirm,
}: Readonly<DuplicateSearchDialogProps>) {
  const [selectedOption, setSelectedOption] = useState<AdminSuggestionRow | null>(null);

  const availableSuggestions = suggestions.filter(
    s => s.id !== suggestionId && s.status !== "duplicate"
  );

  const handleClose = () => {
    setSelectedOption(null);
    onClose();
  };

  const handleConfirm = () => {
    if (selectedOption) {
      onConfirm(selectedOption.id);
      setSelectedOption(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: theme => ({ borderRadius: theme.layout.radius.card }) } }}
    >
      <StyledDialogHeader>
        <Typography variant="titleLg">{labels.duplicateSearch.title}</Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseOutlined />
        </IconButton>
      </StyledDialogHeader>

      <StyledDialogBody>
        <Autocomplete
          options={availableSuggestions}
          value={selectedOption}
          onChange={(_event, value) => { setSelectedOption(value); }}
          getOptionLabel={option => option.suggestionPreview}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.id}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, width: "100%" }}>
                <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
                  {option.parentName}
                </Typography>
                <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                  {option.suggestionPreview}
                </Typography>
                <StyledOptionMeta variant="labelMd">{option.submittedAt}</StyledOptionMeta>
              </Box>
            </Box>
          )}
          renderInput={params => (
            <TextField
              {...params}
              placeholder={labels.duplicateSearch.placeholder}
              slotProps={{
                input: {
                  ...params.slotProps?.input,
                  startAdornment: (
                    <>
                      <SearchOutlined sx={theme => ({ color: theme.palette.text.secondary, mr: 1 })} />
                      {params.slotProps?.input?.startAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
        />
      </StyledDialogBody>

      <StyledDialogFooter>
        <Button variant="text" onClick={handleClose}>
          {labels.actions.delete}
        </Button>
        <Button
          variant="contained"
          disabled={!selectedOption}
          onClick={handleConfirm}
        >
          {labels.duplicateSearch.confirm}
        </Button>
      </StyledDialogFooter>
    </Dialog>
  );
}
```

---

### 5. Modifications: `SuggestionsDataGrid`

Add new columns: `status` (badge with PENDING/REVIEWED/DUPLICATE), `adminResponse` (preview), `duplicateOf` (link to original). Expand actions column to show `SuggestionActionBar` inline or via popover.

```typescript
// ADD to columns array (after existing status column, update mapStatusForBadge):

function mapStatusForBadge(status: SuggestionStatus): string {
  if (status === "reviewed") return "paid";
  if (status === "duplicate") return "cancelled";
  return "pending";
}

// ADD new columns:
{
  field: "adminResponse",
  headerName: labels.table.adminResponse,
  flex: 1.2,
  minWidth: 200,
  renderCell: ({ row }) => (
    <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
      {row.adminResponse ?? "—"}
    </Typography>
  ),
},
{
  field: "duplicateOf",
  headerName: labels.table.duplicateOf,
  flex: 0.8,
  minWidth: 120,
  renderCell: ({ row }) => {
    if (!row.duplicateOfId || !row.duplicateOfPreview) return null;
    return (
      <Typography
        variant="bodyMd"
        sx={theme => ({
          color: theme.palette.primary.main,
          cursor: "pointer",
          textDecoration: "underline",
        })}
        onClick={() => { onViewDuplicate(row.duplicateOfId!); }}
      >
        {row.duplicateOfPreview}
      </Typography>
    );
  },
},

// UPDATE actions column to use SuggestionActionBar:
{
  field: "actions",
  headerName: labels.table.actions,
  flex: 1.4,
  minWidth: 260,
  sortable: false,
  align: "right",
  headerAlign: "right",
  renderCell: ({ row }) => (
    <SuggestionActionBar
      suggestion={row}
      labels={labels}
      canReview={canReview}
      canDelete={canDelete}
      onRespond={() => { onOpenDetail(row); }}
      onMarkDuplicate={() => { onOpenDuplicateSearch(row.id); }}
      onDelete={() => { onDeleteSuggestion(row.id); }}
      onMarkReviewed={() => { onMarkReviewed(row.id); }}
    />
  ),
},
```

---

### 6. Modifications: `SuggestionsCardList`

Add status badge for duplicate, admin response preview, duplicate link indicator, and action buttons.

```typescript
// ADD after existing status badge in card header:
{row.duplicateOfId && row.duplicateOfPreview ? (
  <Typography
    variant="labelMd"
    sx={theme => ({
      color: theme.palette.primary.main,
      cursor: "pointer",
      textDecoration: "underline",
    })}
    onClick={() => { onViewDuplicate(row.duplicateOfId!); }}
  >
    {labels.duplicateBadge}: {row.duplicateOfPreview}
  </Typography>
) : null}

// ADD admin response preview after suggestion text:
{row.adminResponse ? (
  <Box
    sx={theme => ({
      mt: 1,
      p: 1.5,
      borderRadius: theme.layout.radius.card,
      bgcolor: theme.palette.surfaceContainerLow,
    })}
  >
    <Typography variant="labelMd" sx={{ fontWeight: 700 }}>
      {labels.responsePanel.title}
    </Typography>
    <Typography variant="bodyMd" sx={{ fontStyle: "italic" }}>
      {row.adminResponse}
    </Typography>
  </Box>
) : null}

// REPLACE single "Mark Reviewed" button with SuggestionActionBar:
<SuggestionActionBar
  suggestion={row}
  labels={labels}
  canReview={canReview}
  canDelete={canDelete}
  onRespond={() => { onOpenDetail(row); }}
  onMarkDuplicate={() => { onOpenDuplicateSearch(row.id); }}
  onDelete={() => { onDeleteSuggestion(row.id); }}
  onMarkReviewed={() => { onMarkReviewed(row.id); }}
/>
```

---

### 7. Modifications: `SuggestionsMetricsRow`

Add duplicate count metric card.

```typescript
// ADD import:
import { ContentCopyOutlined } from "@mui/icons-material";

// ADD to metrics array:
{
  key: "duplicate",
  label: labels.metrics.duplicate,
  value: summary.duplicate,
  icon: ContentCopyOutlined,
  variant: "default" as const,
},
```

---

### 8. Modifications: `AdminSuggestionsContainer`

Wire new store actions and permission checks.

```typescript
// ADD permission checks:
const canReview = permissions.includes(AppPermission.SuggestionsReview);
const canDelete = permissions.includes(AppPermission.SuggestionsDelete);

// ADD store actions:
const respondToSuggestion = useAdminSuggestionsStore(state => state.respondToSuggestion);
const markAsDuplicate = useAdminSuggestionsStore(state => state.markAsDuplicate);
const deleteSuggestion = useAdminSuggestionsStore(state => state.deleteSuggestion);

// ADD dialog state:
const [detailSuggestion, setDetailSuggestion] = useState<AdminSuggestionRow | null>(null);
const [duplicateSearchId, setDuplicateSearchId] = useState<string | null>(null);

// PASS new props to AdminSuggestionsView:
<AdminSuggestionsView
  labels={labels.admin}
  summary={summary}
  rows={filteredRows}
  searchQuery={searchQuery}
  activeTab={activeTab}
  canManage={canManage}
  canReview={canReview}
  canDelete={canDelete}
  onSearchChange={setSearchQuery}
  onTabChange={setActiveTab}
  onMarkReviewed={markReviewed}
  onRespond={respondToSuggestion}
  onMarkDuplicate={markAsDuplicate}
  onDelete={deleteSuggestion}
  onOpenDetail={setDetailSuggestion}
  onOpenDuplicateSearch={setDuplicateSearchId}
  detailSuggestion={detailSuggestion}
  onCloseDetail={() => { setDetailSuggestion(null); }}
  duplicateSearchId={duplicateSearchId}
  onCloseDuplicateSearch={() => { setDuplicateSearchId(null); }}
/>
```

---

### 9. Modifications: `suggestionsViewTypes`

Extend `AdminSuggestionsViewProps` with new properties.

```typescript
export interface AdminSuggestionsViewProps {
  readonly labels: SuggestionsLabels["admin"];
  readonly summary: AdminSuggestionsSummary;
  readonly rows: readonly AdminSuggestionRow[];
  readonly searchQuery: string;
  readonly activeTab: SuggestionTab;
  readonly canManage: boolean;
  readonly canReview: boolean;
  readonly canDelete: boolean;
  readonly onSearchChange: (query: string) => void;
  readonly onTabChange: (tab: SuggestionTab) => void;
  readonly onMarkReviewed: (id: string) => void;
  readonly onRespond: (suggestionId: string, response: string) => void;
  readonly onMarkDuplicate: (suggestionId: string, duplicateOfId: string) => void;
  readonly onDelete: (suggestionId: string) => void;
  readonly onOpenDetail: (suggestion: AdminSuggestionRow) => void;
  readonly onOpenDuplicateSearch: (suggestionId: string) => void;
  readonly detailSuggestion: AdminSuggestionRow | null;
  readonly onCloseDetail: () => void;
  readonly duplicateSearchId: string | null;
  readonly onCloseDuplicateSearch: () => void;
}
```

---

### 10. Modifications: `buildSuggestionsLabels`

Add new label keys for actions, response panel, duplicate search, detail dialog, and metrics.

```typescript
// ADD to admin labels in buildSuggestionsLabels:
actions: {
  review: t("admin.actions.review"),
  respond: t("admin.actions.respond"),
  markDuplicate: t("admin.actions.markDuplicate"),
  delete: t("admin.actions.delete"),
},
duplicateSearch: {
  title: t("admin.duplicateSearch.title"),
  placeholder: t("admin.duplicateSearch.placeholder"),
  confirm: t("admin.duplicateSearch.confirm"),
},
duplicateBadge: t("admin.duplicateBadge"),
responsePanel: {
  title: t("admin.responsePanel.title"),
  placeholder: t("admin.responsePanel.placeholder"),
  save: t("admin.responsePanel.save"),
},
detailDialogTitle: t("admin.detailDialog.title"),
```

---

## Permission Checks

| Action | Permission | Check Pattern |
|--------|-----------|---------------|
| Review / Respond / Mark Duplicate | `AppPermission.SuggestionsReview` | `permissions.includes(AppPermission.SuggestionsReview)` |
| Delete | `AppPermission.SuggestionsDelete` | `permissions.includes(AppPermission.SuggestionsDelete)` |
| View list | `AppPermission.ComplaintsRespond` (existing) | `permissions.includes(AppPermission.ComplaintsRespond)` |

---

## Status Badge Mapping

| SuggestionStatus | StatusBadge `status` | StatusBadge `category` |
|-----------------|---------------------|----------------------|
| `"pending"` | `"pending"` | `"invoice"` |
| `"reviewed"` | `"paid"` | `"invoice"` |
| `"duplicate"` | `"cancelled"` | `"invoice"` |

---

## Error Handling Strategy

| Scenario | Handling |
|----------|---------|
| Dialog open with null suggestion | Guard: `if (!suggestion) return null` |
| Duplicate search with no results | Autocomplete shows "No options" by default |
| Self-duplicate in search | Filtered out: `suggestions.filter(s => s.id !== suggestionId)` |
| Already-duplicate target | Filtered out: `s.status !== "duplicate"` |
| Empty response text | Save button disabled when `responseText.trim().length === 0` |

---

## Quality Gate — Implementation

- [ ] All new components are functional components with hooks (no class components)
- [ ] All user-facing text uses translation keys via `labels` prop (no hardcoded strings)
- [ ] All MUI style props (`fontWeight`, `mb`, `display`, etc.) placed inside `sx` callbacks
- [ ] All colors use theme palette via `sx={(theme) => ({ ... })}` pattern (no hardcoded hex/rgb)
- [ ] `SuggestionDetailDialog` uses MUI `Dialog` with `slotProps` for paper styling
- [ ] `DuplicateSearchDialog` uses MUI `Autocomplete` with `params.slotProps` (not `inputProps`)
- [ ] `SuggestionActionBar` conditionally renders buttons based on `canReview` / `canDelete`
- [ ] `AdminResponsePanel` shows read-only mode when `adminResponse` exists
- [ ] `SuggestionsDataGrid` includes new columns: `adminResponse`, `duplicateOf`, expanded actions
- [ ] `SuggestionsCardList` shows duplicate badge, response preview, and full action bar
- [ ] `SuggestionsMetricsRow` includes duplicate count metric
- [ ] `AdminSuggestionsContainer` wires all new store actions and permission checks
- [ ] `AdminSuggestionsViewProps` extended with all new props
- [ ] `buildSuggestionsLabels` includes all new translation keys
- [ ] No `console.*` calls — use `logger` from `@/frontend/utils/logger` if needed
- [ ] No nested ternary operators
- [ ] TypeScript types are fully resolved (no `any`)

---

## Quality Gate — Verification

- [ ] `bun tsgo` passes with zero errors
- [ ] `bun lint` passes with zero errors
- [ ] `bun quality-gate` passes all stages
- [ ] Manual verification: admin can open suggestion detail dialog and see full text
- [ ] Manual verification: admin can write and save a response via `AdminResponsePanel`
- [ ] Manual verification: admin can mark a suggestion as reviewed via action bar
- [ ] Manual verification: admin can open duplicate search dialog and select a target
- [ ] Manual verification: duplicate search excludes self and already-duplicate suggestions
- [ ] Manual verification: delete button only visible for users with `SuggestionsDelete` permission
- [ ] Manual verification: DataGrid shows status badges for pending, reviewed, and duplicate
- [ ] Manual verification: CardList shows duplicate badge and response preview on mobile
- [ ] Manual verification: metrics row displays duplicate count alongside pending and reviewed
- [ ] Manual verification: all text renders correctly in both English and Arabic (RTL)

---

## Notes

- The `AdminSuggestionRow` type must be extended in the store (Task K) to include `fullText`, `adminResponse`, `duplicateOfId`, and `duplicateOfPreview` fields.
- The `SuggestionStatus` type must include `"duplicate"` value.
- The `AdminSuggestionsSummary` type must include a `duplicate: number` field.
- The `SuggestionDetailDialog` and `DuplicateSearchDialog` are controlled dialogs — open state is managed by the container.
- The `SuggestionActionBar` is reused in both the DataGrid (desktop) and CardList (mobile) contexts.
- Delete action is restricted to super admin via `AppPermission.SuggestionsDelete`.
- The `DuplicateSearchDialog` filters out the current suggestion and any suggestions already marked as duplicate to prevent chaining.
