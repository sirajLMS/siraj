# M6 — Frontend Analysis

## 1. Current Suggestion Admin UI Structure

### Component Hierarchy
```
AdminSuggestionsContainer (state + permissions)
  └── AdminSuggestionsView (responsive router)
        ├── AdminSuggestionsDesktopView
        │     ├── PageHeader (title + subtitle)
        │     ├── SuggestionsMetricsRow (summary metrics + queue efficiency banner)
        │     └── SectionPanel
        │           ├── SuggestionsSearchBar (search input in actions slot)
        │           ├── SuggestionsTabBar (pending/reviewed tabs with counts)
        │           └── SuggestionsDataGrid (data table)
        └── AdminSuggestionsMobileView
              ├── PageHeader (title + subtitle, headlineMd variant)
              ├── SuggestionsMetricsRow (compact mode)
              ├── SuggestionsSearchBar (standalone, mb: 2)
              ├── SuggestionsTabBar
              └── SuggestionsCardList (card-based list)
```

### DataGrid Columns (SuggestionsDataGrid)
| Field | Header | Flex | MinWidth | Notes |
|-------|--------|------|----------|-------|
| `parentName` | labels.table.parentName | 0.9 | 140 | Bold `bodyMd` text |
| `suggestionPreview` | labels.table.suggestion | 1.6 | 260 | Secondary color `bodyMd` |
| `submittedAt` | labels.table.submittedAt | 0.8 | 120 | Secondary color `bodyMd` |
| `status` | labels.table.status | 0.7 | 110 | `StatusBadge` with `category="invoice"`, maps "reviewed"→"paid", "pending"→"pending" |
| `actions` | labels.table.actions | 0.8 | 140 | "Mark Reviewed" button (text variant, uppercase), hidden if already reviewed or no permission |

### Card List Actions (SuggestionsCardList)
- Each card shows: parent name (bold), submitted date, status badge, suggestion preview text
- "Mark Reviewed" button: `fullWidth`, `variant="outlined"`, uppercase, shown only for pending items when `canManage` is true
- Empty state: centered secondary text

### Metrics (SuggestionsMetricsRow)
- Two metric cards via `BillingMetricsRow`:
  1. **Pending** — `VisibilityOutlined` icon, count
  2. **Reviewed** — `CheckCircleOutlined` icon, count
- `AdminQueueEfficiencyBanner` below metrics showing avg response time + efficiency note
- Supports `compact` prop for mobile layout

### Store (mockAdminSuggestionsStore)
- **Types**: `SuggestionStatus = "pending" | "reviewed"`, `SuggestionTab = "pending" | "reviewed"`
- **Row shape**: `{ id, parentName, suggestionPreview, status, submittedAt }`
- **Summary**: `{ pending: number, reviewed: number, avgResponseHours: string }`
- **Actions**: `setSearchQuery`, `setActiveTab`, `markReviewed(id)`
- **Permission**: Uses `AppPermission.ComplaintsRespond` (checked in container)

## 2. New UI Elements Needed for Suggestions

### Status Badges — Expansion Required
- Current: Only `"pending"` and `"reviewed"` statuses
- **Needed**: Additional statuses like `"responded"`, `"duplicate"`, `"dismissed"` (or whatever the Sprint 15 stories define)
- The `mapStatusForBadge()` function needs new mappings for each status
- `StatusBadge` category may need a new category (currently reuses `"invoice"`)

### Action Buttons — Major Expansion
- **Current**: Single "Mark Reviewed" button
- **Needed**:
  - **Review** — open detail/response dialog
  - **Respond** — write admin response (text input + submit)
  - **Mark as Duplicate** — open duplicate search modal to link to existing suggestion
  - **Delete/Dismiss** — soft-delete with confirmation
- These should likely be in a dropdown menu (`IconButton` + `Menu`) or a detail panel rather than inline buttons

### Duplicate Search Modal — New Component
- **No existing search/autocomplete modal pattern found** in the codebase
- Closest reference: `ManualInvoiceParentField.tsx` uses MUI `Autocomplete` with `Controller` from react-hook-form
- **New component needed**: `DuplicateSearchModal` or `DuplicateSearchDialog`
  - MUI `Dialog` with `Autocomplete` inside
  - Search suggestions by text, display results with parent name + date + preview
  - On select: link current suggestion as duplicate of selected one

### Admin Response Display — New Component
- **Needed**: A section/panel to display admin's written response
- For admin view: editable text area + save button
- For parent view: read-only display of the admin response text
- Could be a `AdminResponsePanel` component using `BaseCard` or `SectionPanel`

### New Components to Create
1. `SuggestionDetailDialog` — full suggestion view with response form
2. `DuplicateSearchDialog` — modal with Autocomplete for finding duplicates
3. `AdminResponsePanel` — display/edit admin response
4. `SuggestionActionBar` — consolidated action buttons (review, respond, duplicate, delete)

## 3. Current Complaint Form Structure & File Upload Integration Point

### ComplaintFormFields Structure
```
StyledFormContainer (flex column, responsive gap)
  ├── StyledFormHeaderBox (icon + title)
  ├── StyledFormFieldGroup — Student Select (Controller + MUI Select)
  ├── StyledFormFieldGroup — Contact Email (Controller + TextField + InputAdornment)
  └── StyledFormFieldGroup — Complaint Details (Controller + TextField multiline + InputAdornment)
```

### Where to Add File Upload Dropzone
- **After the complaint details field group** (last `StyledFormFieldGroup`) and before the closing `</StyledFormContainer>`
- This is the natural position: user fills in all text fields, then attaches supporting files
- The dropzone should be a new `StyledFormFieldGroup` containing a `ComplaintFileUploadDropzone` component

### Form Schema Impact
- Current `ComplaintFormData` type: `{ studentId, contactEmail, complaintDetails }`
- Needs new field: `fileIds: string[]` or `files: File[]` (depending on upload strategy)
- The `complaintFormSchema` (Zod) needs validation for file count and size limits
- `react-hook-form` will need to track file state — likely via `useWatch` or external state

### Parent View Integration (ParentComplaintsDesktopView)
- The form is inside a `BaseCard` with `ComplaintFormFields` + `PrimaryPageAction` (submit button)
- File upload state needs to flow from `ParentComplaintsView` (where `useForm` lives) down to `ComplaintFormFields`
- Alternatively, file state can be managed in a separate Zustand store or local `useState` in the container

## 4. How `ResourceUploadDropzone` Works

### Props
```ts
{
  labels: ResourcesLabels;        // i18n labels for title, hint, supported formats
  selectedFileName: string;       // currently selected file name (displayed when non-empty)
  hasError: boolean;              // error state toggles border color
  errorMessage?: string;          // error text shown below dropzone
  onFileSelect: (fileName: string) => void;  // callback with file name only
  variant: "desktop" | "mobile";  // responsive sizing
}
```

### MUI Components Used
- `Box` — outer container and the clickable label area
- `Typography` — title (`titleLg`), hint (`bodyMd`), file name (`labelMd`), error message (`bodyMd`), supported formats (`labelMd`)
- `CloudUploadOutlined` — upload icon from `@mui/icons-material`

### Key Implementation Details
- Uses `<Box component="label">` wrapping a hidden `<input type="file">` — standard CSS label-input pattern
- `accept=".pdf,.docx,.pptx,.xlsx"` — file type filtering at browser level
- Only passes `file.name` to parent (not the File object, size, or type)
- No drag-and-drop support (no `onDrop`/`onDragOver` handlers)
- No multi-file support (`event.target.files?.[0]` — only first file)
- Theme callback pattern for all colors: `sx={theme => ({ ... })}`

### Adaptation Needed for Complaints
- **Multi-file**: Complaints need up to N files (from `complaint_max_files_per_complaint` setting)
- **File objects**: Need full `File` objects for size/type validation, not just names
- **File list display**: Show list of selected files with remove buttons
- **Size validation**: Check against `complaint_max_file_size_mb` setting
- **Accept attribute**: Different file types (images + documents vs just documents)

## 5. Components to Create vs Modify

### New Components to Create
| Component | Location | Purpose |
|-----------|----------|---------|
| `ComplaintFileUploadDropzone` | `complaints/components/` | Multi-file dropzone adapted from ResourceUploadDropzone |
| `ComplaintFileList` | `complaints/components/` | Display selected files with remove buttons |
| `SuggestionDetailDialog` | `suggestions/components/` | Full suggestion view with admin response form |
| `DuplicateSearchDialog` | `suggestions/components/` | Modal for finding duplicate suggestions |
| `AdminResponsePanel` | `suggestions/components/` | Display/edit admin response text |
| `SuggestionActionBar` | `suggestions/components/` | Consolidated action buttons for admin |

### Existing Components to Modify
| Component | Changes Needed |
|-----------|---------------|
| `ComplaintFormFields` | Add file upload dropzone section after complaint details field |
| `ParentComplaintsView` | Add file state management, pass file props down |
| `ParentComplaintsDesktopView` | Accept and pass file-related props |
| `ParentComplaintsMobileView` | Same as desktop |
| `SuggestionsDataGrid` | Add new columns (response preview, duplicate link), expand action buttons |
| `SuggestionsCardList` | Add admin response preview, duplicate indicator, expanded actions |
| `SuggestionsMetricsRow` | Add new metrics (responded count, duplicate count) |
| `AdminSuggestionsContainer` | Wire new actions (respond, markDuplicate, delete) from store |
| `mockAdminSuggestionsStore` | Add new status types, response field, duplicate link field, new actions |
| `complaintFormSchema` | Add file validation rules |

## 6. Existing Patterns for Search/Autocomplete Modals

### No Direct Modal Pattern Found
- No existing search modal or dialog with Autocomplete was found in the dashboard views

### Closest References
1. **`ManualInvoiceParentField.tsx`** — MUI `Autocomplete` with:
   - `Controller` from react-hook-form
   - `getOptionLabel`, `isOptionEqualToValue`
   - Custom `renderInput` with `TextField` + `InputAdornment`
   - `slotProps` pattern for input configuration
   - This is the **best reference** for building the duplicate search Autocomplete

2. **`ScheduleFilters.tsx`** — Uses `Autocomplete` inside filter UI (not a modal)

### Recommended Pattern for Duplicate Search Dialog
```
MUI Dialog
  └── DialogTitle + DialogContent
        └── Autocomplete
              ├── TextField (search input)
              ├── options: suggestion rows
              ├── getOptionLabel: parent name + preview
              └── onChange: select duplicate target
        └── DialogActions (Cancel + Confirm buttons)
```

## 7. Parent View — Displaying Admin Response + Duplicate Link

### Current Parent Suggestion View (ParentSuggestionsDesktopView)
- **Submit-only**: Form with hero banner, form fields, submit button, social proof, and support cards
- **No list of past suggestions**: Unlike complaints (which show `ComplaintRecordCardList`), the parent suggestion view has NO history/list of submitted suggestions
- **No admin response display**: Currently no mechanism to show admin responses to parents

### What Needs to Change
1. **Add a "My Suggestions" section** below the form (similar to `ComplaintRecordCardList` in complaints)
2. Each suggestion card should show:
   - Suggestion text preview
   - Status badge (pending, reviewed, responded, duplicate)
   - **Admin response text** (if status is "responded")
   - **Duplicate link** (if status is "duplicate") — link to the original suggestion
   - Submitted date
3. This requires:
   - New GraphQL query to fetch parent's suggestions with admin responses
   - New store or extension of existing store
   - New `ParentSuggestionRecordCardList` component (or reuse pattern from `ComplaintRecordCardList`)

### Pattern from Complaints (ComplaintRecordCardList)
- Used in `ParentComplaintsDesktopView` right column (Grid size 7)
- Shows past complaint records with status
- Has "Load older records" button via `hasOlderRecords` + `onLoadOlderRecords`
- This is the closest pattern to follow for displaying parent's suggestion history

### Key Difference
- Complaints use a 2-column Grid layout (form left, records right)
- Suggestions currently use a single-column centered layout
- For adding suggestion history, consider either:
  - Adopting the 2-column Grid layout (like complaints)
  - Or adding a section below the form (simpler, more mobile-friendly)
