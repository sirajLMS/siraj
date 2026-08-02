# Plan 17 — Certificate Generation Dialog: Design

## Document Info

| Field | Value |
|-------|-------|
| **Plan** | 17 — Certificate Generation Dialog |
| **Type** | Frontend — Multi-step wizard dialog component (6 steps) |
| **Dependencies** | Plan 5 (GraphQL API), Plan 6 (Template model + rendering), Plan 14 (Recipient groups), Plan 16 (Certificate list — launch point), Plan 01 (`certificate_batch_jobs` table), Plan 04 (CertificateGenerationService), Plan 22 (cron worker for batch processing) |
| **Related Plans** | Plan 18 (Certificate detail — after generation, user navigates to detail), Plan 19 (QR verification) |

---

## 1. Architecture Position

```
App Router Page (Server Component)
  └─ CertificateListContainer (from Plan 16)
       └─ CertificateListView
            ├─ Desktop View
            │    └─ CertificateTableToolbar
            │         └─ GenerateButton ───► [THIS PLAN] GenerationDialog
            └─ Mobile View
                 └─ CertificateCardList
                      └─ Generate FAB ───► [THIS PLAN] GenerationDialog
```

The Generation Dialog is a client-side modal component launched from the Certificate List page. It does NOT have its own route — it overlays the current page. The dialog renders a **6-step wizard** (template → recipients → variables → options → review → progress) using MUI Dialog with a custom content area sized to fit the wizard.

Generation is **asynchronous** (per INTER_PLAN_CONTRACTS.md §10): the `batchGenerateCertificates` mutation creates a `certificate_batch_jobs` row (status: pending) and returns immediately with a `batchJobId`. The UI polls `certificateBatchJob(id)` query at 2-second intervals for progress. Plan 22's cron worker picks up the pending job, processes certificates sequentially, and updates `processedCount`/`successCount`/`failureCount` on the job row.

### Key Design Principle

The dialog is **stateless across sessions** — all wizard state (selected template, recipients, variable overrides, options, step) lives in a dedicated Zustand store (`certGenerationStore`) that resets when the dialog closes. The dialog does NOT persist data to the server until the user clicks "Generate" in Step 5 (Review), which creates an async batch job.

---

## 2. Route Design

This plan does NOT add any new routes. The dialog is a modal overlay triggered by:
1. "Generate" button on the Certificate List page (`/certificates` — Plan 16)
2. "Generate from Template" button on the Template Detail page (`/templates/[id]` — Plan 6/7)

No URL changes occur while the dialog is open.

---

## 2.5. Complete File Scaffold

All files created by this plan:

### Container + ViewModel (frontend/common/views/dashboard/cert-generation/)
| File | Purpose |
|------|---------|
| `frontend/common/views/dashboard/cert-generation/generationContainer.tsx` | Container component — calls ViewModel hook, wraps in `RequirePermission`, passes to `ResponsiveViewSwitch` |
| `frontend/common/views/dashboard/cert-generation/useGenerationViewModel.ts` | ViewModel hook — encapsulates ALL business logic: Apollo queries/mutations, form state, handlers, labels |
| `frontend/common/views/dashboard/cert-generation/generationView.tsx` | View switcher — uses `createLazyView` + `ResponsiveViewSwitch` for mobile/desktop tier isolation |
| `frontend/common/views/dashboard/cert-generation/GenerateCertificatesDialog.tsx` | MUI Dialog shell — renders stepper + active step content + navigation buttons |

### Step Components (frontend/common/views/dashboard/cert-generation/steps/)
| File | Purpose |
|------|---------|
| `steps/TemplateSelectionStep.tsx` | Step 0 — template grid/list with search, filter, single select |
| `steps/TemplateSelectionStep/TemplateCard.tsx` | Template card sub-component (thumbnail, name, category, variable count) |
| `steps/RecipientSelectionStep.tsx` | Step 1 — mode toggle + 4 picker sub-components |
| `steps/RecipientSelectionStep/IndividualRecipientPicker.tsx` | Individual mode — searchable multi-select with pagination |
| `steps/RecipientSelectionStep/GroupRecipientPicker.tsx` | Group mode — dropdown + member count + preview |
| `steps/RecipientSelectionStep/ClassRecipientPicker.tsx` | Class mode — class dropdown + student count |
| `steps/RecipientSelectionStep/CSVUploadPicker.tsx` | CSV mode — file upload + preview + column mapping |
| `steps/VariableMappingStep.tsx` | Step 2 — variable override form (skipped if no variables) |
| `steps/GenerationOptionsStep.tsx` | Step 3 — issue date, expiry, numbering, PDF quality, email, QR |
| `steps/ReviewStep.tsx` | Step 4 — summary + large batch warning + estimated time + Generate button |
| `steps/ProgressStep.tsx` | Step 5 — progress bar + per-certificate status + pause/resume/cancel |
| `steps/ProgressStep/GenerationProgressDisplay.tsx` | Progress bar + stats + per-certificate list |
| `steps/ProgressStep/GenerationReport.tsx` | Post-completion report: stats + failure table + retry + download all + done |

### Zustand Store
| File | Purpose |
|------|---------|
| `frontend/common/stores/certGenerationStore.ts` | Zustand store for ALL wizard state (6 steps, 4 recipient modes, generation options, async job progress) |

### GraphQL Documents
| File | Purpose |
|------|---------|
| `frontend/common/graphql/sharedDocuments/certificates/generation.documents.ts` | All queries + mutations for generation dialog (templates, recipients, groups, classes, batch job, retry, pause/resume/cancel, download) |

### i18n Namespace
| File | Purpose |
|------|---------|
| `shared/locale/namespaces/dashboard/certificates/generation.namespace.ts` | Namespace export `DashboardCertificateGeneration` |
| `shared/locale/types/dashboard/certificates/generation.ts` | Typed translation keys interface `CertificateGenerationLabels` |
| `shared/locale/en/dashboard/certificates/generation.ts` | English translations |
| `shared/locale/ar/dashboard/certificates/generation.ts` | Arabic translations (including pluralization + interpolation) |

### Mobile/Desktop Tier Views
| File | Purpose |
|------|---------|
| `frontend/mobile/views/dashboard/cert-generation/generation.mobile.tsx` | Mobile view — condensed stepper, virtualized lists, simplified options |
| `frontend/desktop/views/dashboard/cert-generation/generation.desktop.tsx` | Desktop view — full MUI Stepper, grid layouts, detailed options |

---

## 3. Component Hierarchy

```
GenerateCertificatesContainer (client component, permission-gated)
├── RequirePermission (AppPermission.CertificateBatchGenerate)
├── useGenerationViewModel(props) — ViewModel hook
│    ├── useAppTranslation(Translation.Dashboard.CertificateGeneration)
│    ├── useRouter
│    ├── useApolloClient
│    ├── useMutation(GenerateBatchCertificatesMutationDocument)
│    ├── useQuery(CertificateBatchJobStatusQueryDocument) — polling
│    └── useForm + zodResolver — per-step validation
├── ResponsiveViewSwitch
│    ├── GenerationDesktopView (lazy, frontend/desktop/views/dashboard/cert-generation/)
│    └── GenerationMobileView (lazy, frontend/mobile/views/dashboard/cert-generation/)
│
└── GenerationView (switcher, frontend/common/views/dashboard/cert-generation/)
     └── GenerationDialog (MUI Dialog)
          ├── DialogTitle
          │    ├── DialogTitleText ("Generate Certificates")
          │    └── CloseButton (IconButton — disabled during generation)
          ├── DialogContent (scrollable body)
          │    ├── GenerationStepper (MUI Stepper — 5 or 6 steps)
          │    │    ├── Step 0: "Select Template" (DescriptionOutlined)
          │    │    ├── Step 1: "Select Recipients" (PeopleOutlined)
          │    │    ├── Step 2: "Map Variables" (TuneOutlined — skipped if no variables)
          │    │    ├── Step 3: "Generation Options" (SettingsOutlined)
          │    │    ├── Step 4: "Review" (FactCheckOutlined)
          │    │    └── Step 5: "Progress" (CloudSyncOutlined)
          │    └── ActiveStepContent (conditional render)
          │         ├── TemplateSelectionStep (Step 0)
          │         │    ├── TemplateSearchBar (debounced search input)
          │         │    ├── CategoryFilter (MUI Autocomplete / chip filter)
          │         │    ├── TemplateGrid (MUI Grid of TemplateCard)
          │         │    │    └── TemplateCard (thumbnail, name, category, variable count)
          │         │    ├── TemplatePreviewButton (opens preview dialog)
          │         │    ├── TemplateListSkeleton (loading state)
          │         │    └── TemplateListError (error state + retry)
          │         ├── RecipientSelectionStep (Step 1)
          │         │    ├── SelectionModeToggle (Individual | Group | Class | CSV Upload)
          │         │    ├── IndividualRecipientPicker (mode: individual)
          │         │    │    ├── RecipientSearchBar (debounced search)
          │         │    │    ├── RecipientList (page-number pagination, "Load More")
          │         │    │    │    └── RecipientListItem (checkbox, name, email)
          │         │    │    └── SelectedRecipientsChips (removable)
          │         │    ├── GroupRecipientPicker (mode: group)
          │         │    │    ├── GroupDropdown (MUI Select)
          │         │    │    ├── GroupMemberCount (pluralized)
          │         │    │    └── GroupMemberPreview (up to 50 + "Show all")
          │         │    ├── ClassRecipientPicker (mode: class)
          │         │    │    ├── ClassDropdown (MUI Select — fetches classes)
          │         │    │    └── ClassStudentCount (pluralized)
          │         │    └── CSVUploadPicker (mode: csv)
          │         │         ├── CSVDropzone (file upload, drag-and-drop)
          │         │         ├── CSVPreviewTable (parsed data preview)
          │         │         ├── CSVColumnMapping (auto-map + manual remap)
          │         │         └── CSVInvalidRowsWarning (flagged rows)
          │         ├── VariableMappingStep (Step 2 — conditionally skipped)
          │         │    ├── VariableMappingHint (info banner)
          │         │    ├── VariableResolutionPreview (first recipient preview)
          │         │    └── VariableForm
          │         │         └── VariableField (per variable)
          │         │              ├── TextField (TEXT type)
          │         │              ├── NumberField (NUMBER type)
          │         │              ├── DatePicker (DATE type)
          │         │              └── SelectField (SELECT type)
          │         ├── GenerationOptionsStep (Step 3)
          │         │    ├── IssueDatePicker (MUI DatePicker — default today)
          │         │    ├── ExpiryDatePicker (conditional — if template.expiryEnabled)
          │         │    ├── CertificateNumberingControl
          │         │    │    ├── NumberingModeToggle (auto-increment | custom prefix)
          │         │    │    └── NumberingPrefixInput (visible when custom)
          │         │    ├── PDFQualitySelect (Draft | Standard | High)
          │         │    ├── SendEmailCheckbox (notification email toggle)
          │         │    └── GenerateQRCheckbox (QR code for verification)
          │         ├── ReviewStep (Step 4)
          │         │    ├── ReviewSummary
          │         │    │    ├── SummaryTemplate (name + thumbnail)
          │         │    │    ├── SummaryRecipients (count + mode breakdown)
          │         │    │    ├── SummaryVariables (mappings or "Using defaults")
          │         │    │    └── SummaryOptions (issue date, expiry, numbering, quality, email, QR)
          │         │    ├── LargeBatchWarning (>100 recipients)
          │         │    ├── EstimatedTimeDisplay
          │         │    └── GenerateButton (triggers generation → Step 5)
          │         └── ProgressStep (Step 5)
          │              ├── GenerationProgress
          │              │    ├── ProgressBar (MUI LinearProgress — determinate)
          │              │    ├── ProgressStats (processedCount / totalCount)
          │              │    ├── PerCertificateStatusList
          │              │    │    └── CertificateStatusItem (name, status icon, download link)
          │              │    ├── PauseButton / ResumeButton
          │              │    └── CancelButton (with confirmation)
          │              ├── GenerationReport (post-completion)
          │              │    ├── ReportHeader (success / partial / failed)
          │              │    ├── ReportStats (success, failure, duration)
          │              │    ├── FailureTable (recipient, error, inline Retry)
          │              │    ├── DownloadAllButton (ZIP download)
          │              │    └── DoneButton (closes wizard, triggers list refetch)
          │              └── RetrySingleButton (per failed certificate)
          ├── DialogActions (footer navigation)
          │    ├── BackButton (hidden on Step 0, disabled during generation)
          │    ├── NextButton (hidden on Steps 4-5, disabled when step invalid)
          │    └── CancelButton (always visible, disabled during generation)
          └── UnsavedChangesPrompt (confirmation sub-dialog)
               ├── "Discard changes?" title
               ├── "You have unsaved data..." message
               ├── "Yes, discard" confirm
               └── "Keep editing" cancel
```

---

## 4. GraphQL API Surface

### 4.1 Queries

| Document Name | Operation | Variables | Return Shape |
|---------------|-----------|-----------|--------------|
| `PublishedTemplatesForGenerationQueryDocument` | Query `publishedTemplates` | `{ search?: string, categoryId?: string, pagination: PageNumberPaginationInput }` | `{ items: [{ id, name, thumbnailUrl, category { id, name }, variables [{ id, name, type, sourceField, defaultValue, required, options }] }], totalCount, page, pageSize }` |
| `RecipientsForGenerationQueryDocument` | Query `recipients` | `{ search?: string, pagination: PageNumberPaginationInput }` | `{ items: [{ id, name, email }], totalCount, page, pageSize }` |
| `RecipientGroupsForGenerationQueryDocument` | Query `recipientGroups` | `{ pagination: PageNumberPaginationInput }` | `{ items: [{ id, name, memberCount }], totalCount, page, pageSize }` |
| `RecipientGroupMembersQueryDocument` | Query `recipientGroupMembers` | `{ groupId: ID!, pagination: PageNumberPaginationInput }` | `{ items: [{ id, name, email }], totalCount, page, pageSize }` |
| `ClassesForGenerationQueryDocument` | Query `classes` | `{ pagination: PageNumberPaginationInput }` | `{ items: [{ id, name, studentCount }], totalCount, page, pageSize }` |
| `ClassStudentsQueryDocument` | Query `classStudents` | `{ classId: ID!, pagination: PageNumberPaginationInput }` | `{ items: [{ id, name, email }], totalCount, page, pageSize }` |
| `CertificateBatchJobStatusQueryDocument` | Query `certificateBatchJob` | `{ id: ID! }` | `{ id, status, totalCount, processedCount, successCount, failureCount, perCertificateResults: [{ recipientId, recipientName, status, certificateId, verificationCode, errorMessage }], estimatedRemainingMs }` |

**Pagination**: All list queries use **page-number OFFSET pagination** matching AppDataGrid (per INTER_PLAN_CONTRACTS.md §8). `PageNumberPaginationInput = { page: number, pageSize: number }`. NO cursor/relay Connection — use `{ items, totalCount, page, pageSize }` shape.

### 4.2 Mutations

| Document Name | Operation | Variables | Return Shape |
|---------------|-----------|-----------|--------------|
| `GenerateBatchCertificatesMutationDocument` | Mutation `batchGenerateCertificates` | `{ templateId: ID!, recipientGroupId: ID!, variableOverrides: JSONObject, options: BatchGenerationOptionsInput }` | `{ batchJobId: ID!, idempotencyKey: String! }` |
| `GenerateSingleCertificateMutationDocument` | Mutation `generateCertificate` | `{ templateId: ID!, studentId: ID!, variableValues: JSONObject, options: GenerationOptionsInput }` | `{ certificate: { id, certificateId, verificationCode, status, recipientName } }` |
| `RetryCertificateMutationDocument` | Mutation `retryCertificate` | `{ certificateId: ID!, idempotencyKey: String }` | `{ certificate: { id, certificateId, verificationCode, status } }` |
| `PauseBatchJobMutationDocument` | Mutation `pauseCertificateBatchJob` | `{ batchJobId: ID! }` | `{ success: Boolean }` |
| `ResumeBatchJobMutationDocument` | Mutation `resumeCertificateBatchJob` | `{ batchJobId: ID! }` | `{ success: Boolean }` |
| `CancelBatchJobMutationDocument` | Mutation `cancelCertificateBatchJob` | `{ batchJobId: ID! }` | `{ success: Boolean }` |
| `CertificateBatchDownloadMutationDocument` | Mutation `downloadCertificateBatch` | `{ batchJobId: ID! }` | `{ downloadUrl: String!, expiresAt: String }` |

**Async job model** (per INTER_PLAN_CONTRACTS.md §10): `batchGenerateCertificates` creates a `certificate_batch_jobs` row (status: `pending`) and returns `{ batchJobId, idempotencyKey }` immediately. The cron worker (Plan 22) picks up pending jobs, processes them, and updates `processedCount`/`successCount`/`failureCount`. The UI polls `certificateBatchJob(id)` at 2s intervals for progress.

**BatchGenerationOptionsInput**:
- `issueDate: String!` — ISO 8601 date string (NOT a Date object)
- `expiryDate: String` — optional ISO 8601 date string (only if template.expiryEnabled)
- `numberingPrefix: String` — optional custom prefix for certificate numbering
- `pdfQuality: String!` — `"draft"` | `"standard"` | `"high"`
- `sendEmail: Boolean!` — whether to send notification email
- `generateQR: Boolean!` — whether to embed QR code for verification

**Variable overrides keying** (per B.6): `variableOverrides` is `Record<variableId, string>` — keys are variable IDs (UUID), NOT variable names. Values are string (dates as ISO 8601).

**Idempotency** (per B.7): The mutation input includes `idempotencyKey` (generated client-side via `uuid` package). Retries for the SAME logical batch MUST reuse the original `idempotencyKey` — the backend deduplicates. New retry batches get new keys, but individual certificate retries reuse the original key from the job.

### 4.3 Fetch Policies

| Query | fetchPolicy | notifyOnNetworkStatusChange | Polling |
|-------|-------------|-----------------------------|--------|
| PublishedTemplates | `cache-and-network` | true | — |
| Recipients | `cache-and-network` | true | — |
| RecipientGroups | `cache-first` | false | — |
| RecipientGroupMembers | `cache-and-network` | true | — |
| Classes | `cache-first` | false | — |
| ClassStudents | `cache-and-network` | true | — |
| CertificateBatchJobStatus | `cache-and-network` | false | 2000ms (pollInterval) |

**Polling lifecycle**: Polling starts when Step 5 (Progress) becomes active (generation started). Polling stops when `status` transitions to `completed` or `failed`, or when the user pauses/cancels. Use stateful `useQuery` with `pollInterval: 2000` and conditional `skip: generationStatus !== 'generating'`.

### 4.4 Mutation Cache Updates

After `batchGenerateCertificates` mutation completes successfully (job created):
- Call `client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'certificates' })` — evict the ROOT_QUERY list field ONLY (per B.9)
- Do NOT evict singular `certificate(id)` cache entries — they belong to detail pages and eviction causes unnecessary refetch
- Trigger `client.refetchQueries({ include: ['CertificateList', 'CertificateMetrics'] })` — this automatically refetches the certificate list on the page behind the dialog

After job completion (polling detects `status === 'completed'`):
- Same cache eviction + refetchQueries as above
- This ensures the certificate list shows newly generated certificates when the dialog closes

---

## 5. Zustand Store Design

### certGenerationStore

The store holds all wizard state and resets on dialog close. It is **NOT persisted** (ephemeral state per `frontend/common/stores/AGENTS.md`).

#### State Fields

| State Field | Type | Default | Description |
|-------------|------|---------|-------------|
| `isOpen` | `boolean` | `false` | Whether the dialog is open |
| `activeStep` | `0 \| 1 \| 2 \| 3 \| 4 \| 5` | `0` | Current wizard step (0-indexed, 6 steps) |
| `preselectedTemplateId` | `string \| null` | `null` | Template ID pre-selected from external context (e.g. Template Detail page) |
| `selectedTemplateId` | `string \| null` | `null` | User's template selection |
| `selectedTemplateSummary` | `TemplateSummary \| null` | `null` | Full template object (for thumbnail, variables, etc.) |
| `selectionMode` | `'individual' \| 'group' \| 'class' \| 'csv'` | `'individual'` | Recipient selection mode (4 modes) |
| `selectedRecipientIds` | `Record<string, RecipientSummary>` | `{}` | Individual recipients keyed by studentId UUID (per B.4) |
| `selectedGroupId` | `string \| null` | `null` | Selected recipient group ID |
| `groupMemberIds` | `string[]` | `[]` | Resolved group member IDs (fetched on group select) |
| `selectedClassId` | `string \| null` | `null` | Selected class ID |
| `classStudentIds` | `string[]` | `[]` | Resolved class student IDs (fetched on class select) |
| `csvParsedData` | `CSVParsedData \| null` | `null` | Parsed CSV data (metadata only; File object held in `useRef` per stores AGENTS.md) |
| `csvColumnMapping` | `Record<string, string>` | `{}` | CSV column → recipient field mapping (e.g. `{ "Full Name": "name", "Email Address": "email" }`) |
| `csvValidRowCount` | `number` | `0` | Count of valid rows after validation |
| `csvInvalidRowCount` | `number` | `0` | Count of invalid rows (missing name, invalid email) |
| `variableOverrides` | `Record<string, string>` | `{}` | Variable overrides keyed by variableId (UUID) (per B.6); values are ISO strings or plain strings |
| `generationOptions` | `GenerationOptions` | see below | Step 4 configuration |
| `batchJobId` | `string \| null` | `null` | Async batch job ID returned by mutation |
| `idempotencyKey` | `string \| null` | `null` | UUID generated for this batch (per B.7 reused on retry) |
| `generationStatus` | `'idle' \| 'generating' \| 'paused' \| 'completed' \| 'error'` | `'idle'` | Current generation state |
| `generationProgress` | `{ processed: number, total: number, success: number, failure: number }` | `{ processed: 0, total: 0, success: 0, failure: 0 }` | Progress counts from polling |
| `perCertificateStatus` | `Record<string, CertificateResult>` | `{}` | Per-certificate results keyed by recipientId (per B.3) |
| `failedRecipientDetails` | `FailedRecipientDetail[]` | `[]` | Failed recipients with details `{ id, recipientName, code, message }` (per B.3) |
| `cancelConfirmOpen` | `boolean` | `false` | Whether the cancel confirmation sub-dialog is open |
| `error` | `string \| null` | `null` | Top-level error message |

#### GenerationOptions type (Step 4 state)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `issueDate` | `string` | `new Date().toISOString()` | ISO 8601 date string (per B.6 — NOT a Date object) |
| `expiryDate` | `string \| null` | `null` | Optional ISO 8601 date string (only if template.expiryEnabled) |
| `numberingMode` | `'auto' \| 'custom'` | `'auto'` | Auto-increment from last certificate number, or custom prefix |
| `numberingPrefix` | `string` | `''` | Custom prefix for certificate numbering (visible only when mode is 'custom') |
| `pdfQuality` | `'draft' \| 'standard' \| 'high'` | `'standard'` | PDF rendering quality: draft=72 DPI, standard=150 DPI, high=300 DPI |
| `sendEmail` | `boolean` | `false` | Whether to send notification email to recipients |
| `generateQR` | `boolean` | `true` | Whether to embed QR code for verification (Plan 19) |

#### CertificateResult type

| Field | Type | Description |
|-------|------|-------------|
| `recipientId` | `string` | Student ID (UUID) |
| `recipientName` | `string` | Display name |
| `status` | `'pending' \| 'generating' \| 'success' \| 'error'` | Per-certificate status |
| `certificateId` | `string \| null` | Generated certificate ID (null until success) |
| `verificationCode` | `string \| null` | Certificate verification code (for QR/Plan 19) |
| `errorMessage` | `string \| null` | Error message if failed |
| `downloadUrl` | `string \| null` | Per-certificate download link (if successful) |

#### Actions

| Action | Parameters | Description |
|--------|------------|-------------|
| `openDialog` | `preselectedTemplateId?: string` | Opens dialog, optionally pre-selecting a template |
| `closeDialog` | none | Resets ALL state to defaults and closes dialog |
| `setActiveStep` | `step: number` | Sets active step (with jump validation) |
| `nextStep` | none | Increments step (respects skip-variable-step logic: if template has 0 variables, skip Step 2) |
| `prevStep` | none | Decrements step |
| `selectTemplate` | `template: TemplateSummary` | Sets selectedTemplateId + selectedTemplateSummary, auto-fills variableOverrides with defaults |
| `setSelectionMode` | `mode: 'individual' \| 'group' \| 'class' \| 'csv'` | Toggles selection mode; switching modes clears the other modes' selections (per B.11: switching to group clears individual IDs; switching back clears groupId/groupMemberIds) |
| `toggleRecipient` | `recipient: RecipientSummary` | Adds/removes from selectedRecipientIds Record |
| `clearRecipients` | none | Clears all individual recipients |
| `selectGroup` | `groupId: string, memberIds: string[], members: RecipientSummary[]` | Sets group + resolves member IDs |
| `clearGroup` | none | Clears group selection |
| `selectClass` | `classId: string, studentIds: string[], students: RecipientSummary[]` | Sets class + resolves student IDs |
| `clearClass` | none | Clears class selection |
| `setCSVParsedData` | `data: CSVParsedData, mapping: Record<string, string>, validCount: number, invalidCount: number` | Sets CSV upload state (File object NOT in store — held in container's useRef) |
| `clearCSV` | none | Clears CSV state |
| `setVariableOverride` | `variableId: string, value: string` | Sets a variable override (keyed by variableId UUID per B.6) |
| `clearVariableOverride` | `variableId: string` | Removes a variable override |
| `clearAllVariableOverrides` | none | Clears all overrides |
| `setGenerationOption` | `key: keyof GenerationOptions, value: string \| boolean` | Updates a single generation option field |
| `startGeneration` | `batchJobId: string, idempotencyKey: string` | Sets generationStatus to 'generating', stores batchJobId + idempotencyKey |
| `pauseGeneration` | none | Sets generationStatus to 'paused' |
| `resumeGeneration` | none | Sets generationStatus to 'generating' |
| `cancelGeneration` | none | Sets generationStatus to 'idle', clears batchJobId |
| `updateGenerationProgress` | `progress: GenerationProgress, perCertificateStatus: Record<string, CertificateResult>, failedRecipientDetails: FailedRecipientDetail[]` | Updates progress from polling response |
| `completeGeneration` | none | Sets generationStatus to 'completed' or 'error' based on failure count |
| `resetForRetry` | `recipientIds: string[]` | Resets generationStatus to 'idle', keeps only specified recipient IDs in failedRecipientDetails |
| `closeCancelConfirm` | none | Sets cancelConfirmOpen to false |
| `openCancelConfirm` | none | Sets cancelConfirmOpen to true |

### Store Selection Hooks

| Hook | Returns | Usage |
|------|---------|-------|
| `useGenerationDialogState()` | Selected state fields (use `useShallow` selector) | For dialog root component |
| `useGenerationDialogActions()` | Store actions | For step components to dispatch actions |

### File Objects NOT in Store

Per `frontend/common/stores/AGENTS.md`: the CSV `File` object is held in a `useRef` in the GenerationContainer (NOT in the Zustand store). The store only tracks parsed metadata (column names, row count, mapping). The file is read for parsing, then the reference is held for retry/re-upload purposes.

---

## 6. Design Decisions

### DD-1: Modal Dialog vs. Dedicated Route

**Decision**: Use a modal dialog instead of a route like `/certificates/generate`.

**Rationale**: The generation workflow is a short-lived, context-bound action that starts from the certificate list. Navigating to a separate route would lose the list context (filter state, scroll position, selected rows). A modal preserves the underlying page and allows the user to immediately see newly generated certificates when the dialog closes (via cache refetch).

**Alternative considered**: Route `/(dashboard)/certificates/generate` — rejected because it requires full page transition and loses list state.

### DD-2: Zustand Store vs. React State

**Decision**: Use Zustand for generation dialog state instead of React `useState`/`useReducer`.

**Rationale**: The wizard has complex state across 4 steps with interdependencies (template → recipients → variables → summary). Zustand provides:
- Centralized state accessible by all step components without prop drilling
- Easy reset (just call `closeDialog` which resets all fields)
- DevTools support for debugging
- Clean separation from Apollo cache (which handles server state only)

The store does NOT persist to localStorage (wizard state is ephemeral).

### DD-3: Cursor Pagination for Recipient Picker

**Decision**: Use cursor-based pagination (page size 25) for the individual recipient picker with "Load More" button instead of infinite scroll.

**Rationale**: Infinite scroll inside a modal dialog creates nested scroll containers that are confusing on mobile and cause accessibility issues. A "Load More" button is simpler, more predictable, and easier to implement with Apollo `fetchMore`. The user rarely needs to scroll through hundreds of recipients since the search filters narrow the list quickly.

### DD-4: Group Member Preview Limit

**Decision**: Load only up to 50 group members as a preview, with a "Show all N members" expansion that fetches the full member list only on demand.

**Rationale**: Some recipient groups may contain 200+ members. Loading all member details upfront wastes bandwidth and memory when the user just needs to confirm the group is correct. The preview gives enough context (names, emails of first 50) to verify the group selection without the full payload.

### DD-5: Variable Override Semantics

**Decision**: Manual variable overrides apply UNIFORMLY to ALL recipients in the batch. Variables with `sourceField` mappings auto-resolve per-recipient from backend data.

**Rationale**: The backend generation pipeline (CGVS analysis §1) handles variable resolution: for each recipient, it checks if a manual override exists → uses it; otherwise, if `sourceField` is defined → resolves from recipient data; otherwise → uses the template default. This means the frontend sends a single `variableOverrides` object that applies to all recipients, and the backend handles per-recipient resolution. This is simpler and more efficient than sending per-recipient overrides from the frontend.

### DD-6: Progress Display via Async Job Polling (RESOLVED per B.1)

**Decision**: Use async-job+polling pattern. The `batchGenerateCertificates` mutation creates a `certificate_batch_jobs` row (status: pending) and returns immediately with `{ batchJobId, idempotencyKey }`. The UI polls `certificateBatchJob(id)` at 2-second intervals. The progress bar shows REAL server counts (`processedCount / totalCount`), not estimated time.

**Rationale**: The synchronous-mutation assumption is fragile (per B.1) — large batches would block the HTTP request and cause timeouts. The async pattern provides:
- Real, deterministic progress (server counts, not estimates)
- Pause/resume capability (set job status to `paused`)
- Cancel capability (set job status to `failed` with reason `cancelled`)
- Crash recovery (job survives client disconnect)
- Plan 22's cron worker processes the job sequentially

**Progress bar**: Determinate MUI `LinearProgress` with `value = (processedCount / totalCount) * 100`. Shows `{successCount} succeeded, {failureCount} failed, {remaining} remaining` (all pluralized).

If `totalCount > 0` and `reportedAtMs` is available, the query returns `estimatedRemainingMs` for an indeterminate fallback display.

### DD-7: Retry Strategy with Async Job Model

**Decision**: Two retry levels:
1. **Per-certificate retry** (inline): Uses `retryCertificate` mutation with the original `idempotencyKey` (per B.7) — backend deduplicates and only regenerates the failed certificate. Does NOT create a new batch job.
2. **Batch retry**: Creates a NEW batch job containing only `failedRecipientDetails` IDs, with a NEW `idempotencyKey` but same template/variables/options.

**Rationale**: Per-certificate retry is lightweight (single mutation, no job) and immediately visible. Batch retry is for bulk-failure scenarios where many certificates failed. The store tracks `failedRecipientDetails` (per B.3: `{ id, recipientName, code, message }`) and `resetForRetry(recipientIds)` preserves these while resetting status.

### DD-8: Step 2 (Variable Mapping) Skip Logic in 6-Step Wizard

**Decision**: When the selected template has zero variables, Step 2 (Variable Mapping) is skipped entirely. The stepper adjusts to show only 5 steps (Template → Recipients → Options → Review → Progress). Step indicies shift dynamically: `nextStep` from Step 1 checks if the template has variables — if zero, it jumps to Step 3 (Options, index 3 in a 6-step layout, or index 2 in a 5-step layout).

**Rationale**: Showing an empty "Map Variables" step with "No variables to map" is unnecessary friction. The step count is computed dynamically. The stepper label and count update accordingly.

**Edge case** (per B.11): If template variables change between selection and "Next" click (template republished mid-flow), re-validate variable count on step transition. Block re-entering Step 0 (Template Selection) after generation starts.

### DD-9: Mobile Full-Screen Dialog

**Decision**: On mobile (screen width < 768px), the dialog renders as a full-screen MUI Dialog (`fullScreen` prop) with a condensed step indicator (dots or minimal progress text) instead of the horizontal stepper.

**Rationale**: A multi-step wizard with a horizontal stepper, grid of template cards, and recipient picker requires significant horizontal and vertical space. On mobile, this would be cramped inside a standard dialog. Full-screen dialog maximizes usable area and the condensed step indicator (e.g., "Step 2 of 3") saves vertical space for the content.

### DD-10: Navigation Lock During Generation (RESOLVED per B.8)

**Decision**: During active generation (`generationStatus === 'generating'` or `'paused'`):
- BOTH the Close button (X in DialogTitle) AND Cancel button in DialogActions are disabled
- Pressing Escape is blocked (via `onKeyDown` handler on Dialog)
- A `beforeunload` event listener is added to `window` that shows a browser-native confirmation prompt
- The `Await` stepper navigation is disabled (clicking a step indicator does nothing)
- Back/Next buttons are hidden

**Rationale**: Closing the dialog or navigating away during batch generation would leave the async job orphaned (per B.8). The `beforeunload` listener catches page refresh/close. After generation completes (status `completed` or `error`) or is cancelled, navigation is re-enabled and the `beforeunload` listener is removed.

Before generation (Steps 0-4): pressing Escape or clicking Close/Cancel shows the unsaved-changes prompt (`UnsavedChangesPrompt` sub-dialog) if any data is entered. If no data entered, dialog closes immediately.

---

## 7. Data Model References

### Entities Referenced (from Plan 5/6/14)

| Entity | Source Plan | Key Fields Used |
|--------|------------|-----------------|
| CertificateTemplate | Plan 6 | `id`, `name`, `thumbnailUrl`, `category`, `variables[]` |
| TemplateVariable | Plan 6 | `id`, `name`, `type` (TEXT/NUMBER/DATE/SELECT), `sourceField`, `defaultValue`, `required`, `options[]` |
| Recipient / Student | Plan 14 | `id`, `name`, `email` |
| RecipientGroup | Plan 14 | `id`, `name`, `memberCount` |
| RecipientGroupMember | Plan 14 | `id` (student ID), `name`, `email` |
| Certificate | Plan 5 | `id`, `certificateId`, `verificationCode`, `status` |
| BatchResult | Plan 5 | `successCount`, `failureCount`, `failures[]`, `durationMs` |

### Type Imports (from backend/types)

| Type | Source | Used In |
|------|--------|---------|
| `TemplateVariableType` | `backend/types/template.types.ts` | Variable field rendering |
| `GenerationResultType` | `backend/types/certificate.types.ts` | Mutation result handling |
| `BatchFailureType` | `backend/types/certificate.types.ts` | Failure table rendering |
| `CursorPaginationInput` | `backend/types/common.types.ts` | Recipient/group pagination |

---

## 8. Interface Contracts

### GenerateCertificatesContainer

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `preselectedTemplateId` | `string \| null` | No | Template ID to pre-select (from template detail page) |
| `locale` | `Locale` | Yes | Current locale for translations |

### GenerationViewModel

Returned by `useGenerationViewModel(props)` — a flat plain object passed to tier views:

| Field | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Dialog visibility |
| `activeStep` | `number` | Current step index (0-5) |
| `steps` | `WizardStep[]` | Array of step metadata (label, icon, optional skip) |
| `selectedTemplateId` | `string \| null` | Selected template ID |
| `selectedTemplateSummary` | `TemplateSummary \| null` | Full template data |
| `selectionMode` | `RecipientSelectionMode` | Current recipient mode |
| `selectedRecipientIds` | `Record<string, RecipientSummary>` | Individual recipients |
| `selectedGroupId` | `string \| null` | Group selection |
| `selectedClassId` | `string \| null` | Class selection |
| `csvParsedData` | `CSVParsedData \| null` | Parsed CSV metadata |
| `csvColumnMapping` | `Record<string, string>` | CSV column mapping |
| `variableOverrides` | `Record<string, string>` | Variable overrides (keyed by variableId) |
| `generationOptions` | `GenerationOptions` | Step 4 options |
| `generationStatus` | `GenerationStatus` | idle/generating/paused/completed/error |
| `generationProgress` | `GenerationProgress` | processed/total/success/failure counts |
| `perCertificateStatus` | `Record<string, CertificateResult>` | Per-certificate results |
| `failedRecipientDetails` | `FailedRecipientDetail[]` | Failed recipient details |
| `batchJobId` | `string \| null` | Async batch job ID |
| `cancelConfirmOpen` | `boolean` | Cancel confirmation dialog state |
| `error` | `string \| null` | Top-level error |
| `labels` | `CertificateGenerationLabels` | i18n labels grouped by section |
| `templateListQuery` | `QueryResult` | Apollo template list query state |
| `recipientListQuery` | `QueryResult` | Apollo recipient list query state |
| `groupListQuery` | `QueryResult` | Apollo group list query state |
| `classListQuery` | `QueryResult` | Apollo class list query state |
| `batchJobStatusQuery` | `QueryResult` | Apollo batch job polling query state |
| `generateBatchMutation` | `MutationTuple` | Batch generate mutation |
| `retryCertificateMutation` | `MutationTuple` | Single retry mutation |
| `pauseJobMutation` | `MutationTuple` | Pause batch job mutation |
| `resumeJobMutation` | `MutationTuple` | Resume batch job mutation |
| `cancelJobMutation` | `MutationTuple` | Cancel batch job mutation |
| `downloadBatchMutation` | `MutationTuple` | Download all (ZIP) mutation |
| `handleOpenDialog` | `(preselectedTemplateId?: string) => void` | Open dialog |
| `handleCloseDialog` | `() => void` | Close dialog (with unsaved checks) |
| `handleNextStep` | `() => void` | Validate + advance step |
| `handlePrevStep` | `() => void` | Go back step |
| `handleStepClick` | `(step: number) => void` | Jump to step (with validation) |
| `handleSelectTemplate` | `(template: TemplateSummary) => void` | Select template |
| `handleSetSelectionMode` | `(mode: RecipientSelectionMode) => void` | Change recipient mode |
| `handleToggleRecipient` | `(recipient: RecipientSummary) => void` | Toggle individual recipient |
| `handleSelectGroup` | `(groupId: string) => void` | Select group (fetches members) |
| `handleSelectClass` | `(classId: string) => void` | Select class (fetches students) |
| `handleCSVUpload` | `(file: File) => void` | Parse CSV and set state |
| `handleSetColumnMapping` | `(mapping: Record<string, string>) => void` | Set CSV column mapping |
| `handleSetVariableOverride` | `(variableId: string, value: string) => void` | Set variable override |
| `handleSetGenerationOption` | `(key, value) => void` | Set generation option |
| `handleGenerate` | `() => void` | Start batch generation (creates async job) |
| `handlePause` | `() => void` | Pause generation |
| `handleResume` | `() => void` | Resume generation |
| `handleCancel` | `() => void` | Cancel generation (with confirm) |
| `handleConfirmCancel` | `() => void` | Confirm cancel |
| `handleRetrySingle` | `(certificateId: string) => void` | Retry individual failed certificate |
| `handleDownloadAll` | `() => void` | Download all as ZIP |
| `handleDone` | `() => void` | Close dialog + navigate to cert list |
| `getStepValidation` | `(step: number) => StepValidation` | Get validation state for a step |

### TemplateCard

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `template` | `TemplateSummary` | Yes | Template data (id, name, thumbnailUrl, category, variableCount) |
| `selected` | `boolean` | Yes | Whether this template is currently selected |
| `onSelect` | `(id: string) => void` | Yes | Callback when card is clicked |
| `onPreview` | `(id: string) => void` | Yes | Callback when preview button is clicked |
| `labels` | `CertificateGenerationLabels` | Yes | i18n labels |

### RecipientListItem

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `recipient` | `RecipientSummary` | Yes | id, name, email |
| `selected` | `boolean` | Yes | Whether this recipient is selected |
| `onToggle` | `(id: string) => void` | Yes | Toggle selection callback |

### VariableField

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `variable` | `TemplateVariable` | Yes | Variable definition (id, name, type, sourceField, defaultValue, required, options) |
| `value` | `string \| undefined` | No | Current override value (ISO string for dates per B.6) |
| `onChange` | `(value: string) => void` | Yes | Override value change callback |
| `error` | `string \| null` | No | Validation error message |

### GenerationOptionsStep

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `GenerationOptions` | Yes | Current generation options state |
| `template` | `TemplateSummary \| null` | Yes | Selected template (for expiryEnabled check) |
| `onOptionChange` | `(key, value) => void` | Yes | Update an option field |
| `labels` | `CertificateGenerationLabels` | Yes | i18n labels |
| `errors` | `Record<string, string>` | No | Per-field validation errors |

### ReviewStep

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `template` | `TemplateSummary \| null` | Yes | Selected template |
| `recipientCount` | `number` | Yes | Total recipients |
| `selectionMode` | `RecipientSelectionMode` | Yes | Mode used for selection |
| `selectedGroupName` | `string \| null` | Yes | Group name (if group mode) |
| `selectedClassName` | `string \| null` | Yes | Class name (if class mode) |
| `variableOverrides` | `Record<string, string>` | Yes | Variable overrides summary |
| `generationOptions` | `GenerationOptions` | Yes | Options summary |
| `estimatedTimeMs` | `number` | Yes | Estimated generation time |
| `onGenerate` | `() => void` | Yes | Start generation callback |
| `labels` | `CertificateGenerationLabels` | Yes | i18n labels |

### ProgressStep

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `progress` | `GenerationProgress` | Yes | processed/total/success/failure counts |
| `status` | `GenerationStatus` | Yes | generating/paused/completed/error |
| `perCertificateStatus` | `Record<string, CertificateResult>` | Yes | Per-certificate results |
| `failedRecipientDetails` | `FailedRecipientDetail[]` | Yes | Failed details for retry |
| `onPause` | `() => void` | Yes | Pause callback |
| `onResume` | `() => void` | Yes | Resume callback |
| `onCancel` | `() => void` | Yes | Cancel callback |
| `onRetrySingle` | `(certificateId: string) => void` | Yes | Retry individual certificate |
| `onDownloadAll` | `() => void` | Yes | Download ZIP callback |
| `onDone` | `() => void` | Yes | Close dialog callback |
| `labels` | `CertificateGenerationLabels` | Yes | i18n labels |

### CSVUploadPicker

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `parsedData` | `CSVParsedData \| null` | Yes | Parsed CSV metadata (columns, sample rows) |
| `columnMapping` | `Record<string, string>` | Yes | Current column mapping |
| `validRowCount` | `number` | Yes | Valid row count |
| `invalidRowCount` | `number` | Yes | Invalid row count |
| `onUpload` | `(file: File) => void` | Yes | File upload handler |
| `onMappingChange` | `(mapping: Record<string, string>) => void` | Yes | Column remap handler |
| `labels` | `CertificateGenerationLabels` | Yes | i18n labels |

---

## 8.5. react-hook-form + Zod Integration

The ViewModel lifts `useForm` with `zodResolver` into its hook body (following the `useCreateRecurringClassViewModel` pattern). Each step has its own Zod schema for validation. Form state and step state are complementary: the form validates the current step's inputs, while the Zustand store holds cross-step state.

### Per-Step Schemas

| Step | Zod Schema | Fields | Validation Rules |
|------|-----------|--------|-------------------|
| Step 0 (Template) | `templateStepSchema` | `selectedTemplateId` | `z.string().min(1, "Required")` — at least one template selected |
| Step 1 (Recipients) | `recipientStepSchema` | `selectionMode`, `selectedRecipientIds`, `selectedGroupId`, `selectedClassId`, `csvValidRowCount` | Conditional: if mode is 'individual', `selectedRecipientIds` must have ≥1 entry; if 'group', `selectedGroupId` required; if 'class', `selectedClassId` required; if 'csv', `csvValidRowCount` must be ≥1 |
| Step 2 (Variables) | `variableStepSchema` | `variableOverrides` | For each `required` template variable: `variableOverrides[variableId]` must be non-empty string. Dates must be valid ISO 8601. |
| Step 3 (Options) | `optionsStepSchema` | `issueDate`, `expiryDate`, `numberingPrefix`, `pdfQuality`, `sendEmail`, `generateQR` | `issueDate` must be valid ISO date and not in the past. `expiryDate` (if provided) must be after `issueDate`. `numberingPrefix` (if custom mode) must be non-empty alphanumeric. `pdfQuality` must be one of draft/standard/high. |
| Step 4 (Review) | — | No form inputs; display-only summary | Validation passes if all prior steps are valid |
| Step 5 (Progress) | — | No form inputs | N/A (generation in progress) |

### Step Validation Trigger

`handleNextStep` calls `await form.trigger(['fieldName1', 'fieldName2'])` for the current step's fields before advancing. If validation fails, errors are displayed inline on the relevant fields. The `Next` button is disabled (with tooltip tooltip) while validation errors exist.

### Cross-Step Validation (per B.11)

When `handleNextStep` is called from Step 1 (Recipients), it checks:
1. Step 1's own validation (recipient count ≥1)
2. Step 2's skip condition: if `selectedTemplateSummary.variables.length === 0`, skip Step 2 and jump to Step 3 (Options)
3. Block re-entering Step 0 after generation starts (if `generationStatus !== 'idle'`)

### Form Reset on Mode Change

When `handleSetSelectionMode` changes the recipient mode, the form resets the previous mode's fields (e.g., switching from 'individual' to 'group' clears `selectedRecipientIds`; switching back clears `selectedGroupId`/`groupMemberIds`). This prevents stale data from one mode leaking into another (per B.11).

---

## 8.6. Desktop View Specification

The desktop view renders in a **full-width MUI Dialog** (`maxWidth="md"` or `lg"`):

- **DialogTitle**: Title text + step counter ("Step 2 of 6: Select Recipients") + close button (disabled during generation)
- **Stepper**: Full MUI Stepper at the top of `DialogContent` — all 5-6 steps visible with icons and labels. Completed steps show checkmark, active step highlighted, future steps greyed. Clicking a step calls `handleStepClick` which validates all prior steps before navigating.
- **Content Area**: Large scrollable area showing the active step component. Desktop uses wider layouts (3-column template grid, 2-column review summary).
- **Desktop DialogActions**: Back button (left), Next/Generate button (right), Cancel button (far right).
- **Template Grid**: 3-column MUI Grid of TemplateCards with thumbnail, name, category badge, variable count.
- **Recipient List**: Full-width table with checkbox column, name, email, grade. "Load More" pagination button below.
- **Variable Mapping**: Form layout with 2 columns for variable fields (label on left, input on right).
- **Options Step**: 2-column layout — left column for date/numbering, right column for quality/email/QR toggles.
- **Review Step**: Summary card with template thumbnail (left), recipient summary (center), options summary (right). Large batch warning as Alert banner if >100.
- **Progress Step**: Progress bar at top. Per-certificate status table below with columns: Recipient Name, Status (icon), Download Link, Retry button.

---

## 8.7. Mobile View Specification

The mobile view renders as a **full-screen MUI Dialog** (`fullScreen` prop):

- **AppBar**: Replaces DialogTitle. Shows title + step counter + close button (disabled during generation). Uses MUI AppBar with back arrow.
- **Stepper**: Condensed — shows "Step 2 of 6" text with a thin LinearProgress indicator. Completed steps collapse (no full stepper horizontal bar on mobile). Tapping the stepper text opens a bottom sheet with all steps for navigation (with validation).
- **Content Area**: Full-screen scrollable area. Mobile uses single-column layouts:
  - Template grid: 1-column list with smaller thumbnails (48x48px).
  - Recipient list: virtualized list (`react-window` or MUI `List` with `virtuoso`) for performance with large lists. Single column.
  - Variable mapping: 1-column stacked form.
  - Options step: simplified — PDF quality defaults to 'standard' and is hidden (no dropdown). Only issue date, expiry (if applicable), numbering, send email, and QR toggles shown. Reduced options prevent screen overload.
  - Review step: stacked summary sections (template → recipients → options). Large batch warning as full-width Alert.
  - Progress step: progress bar at top. Per-certificate status list below. Pause/Resume/Cancel as full-width buttons. Download all and Done as full-width buttons when complete.
- **Mobile Bottom Navigation**: Fixed position at bottom of screen — Back (left), Next/Generate (right). Cancel accessible via AppBar overflow menu.
- **CSV Upload**: Full-screen file dropzone with large tap target. Preview table scrolls horizontally.

### Tier Isolation Rules

Per `frontend/views/AGENTS.md`:
- Mobile views at `frontend/mobile/views/dashboard/cert-generation/generation.mobile.tsx`
- Desktop views at `frontend/desktop/views/dashboard/cert-generation/generation.desktop.tsx`
- Both tier views receive the same `viewModel` object via props
- Tier views are **pure presentation** — NO `useAppTranslation` calls, NO business logic, NO Apollo hooks directly
- They call handlers from the viewModel (e.g., `viewModel.handleNextStep()`, `viewModel.handleSelectTemplate()`)
- The `generationView.tsx` switcher uses `createLazyView` + `ResponsiveViewSwitch` to load the appropriate tier

---

## 9. Error Handling Strategy

### Error Matrix

| Scenario | Detection | User Experience | Recovery Action |
|----------|-----------|-----------------|-----------------|
| Template list fails to load | Apollo `useQuery` error | Error state in Step 0 with "Retry" button | Click retry → re-fetches template list |
| Recipient list fails to load | Apollo `useQuery` error | Error state in Step 1 with "Retry" button | Click retry → re-fetches recipient list |
| Group list fails to load | Apollo `useQuery` error | Error message in group dropdown | Click retry → re-fetches groups |
| Class list fails to load | Apollo `useQuery` error | Error message in class dropdown | Click retry → re-fetches classes |
| Class student fetch fails | Apollo `useQuery` error | Warning in Step 1: "Failed to load class students" + retry | Click retry → re-fetches students |
| CSV parse error | Client-side parse error | Error banner: "Failed to parse CSV file" + details | User re-uploads or fixes CSV |
| CSV has zero valid rows | Parse returns 0 valid rows | Warning banner: "No valid rows found in CSV" + re-upload prompt | User fixes CSV and re-uploads |
| Template not found (pre-selected no longer exists) | Template query returns no match for preselectedTemplateId | Warning in Step 0: "Template no longer exists" + manual selection enabled | User selects a different template |
| Zero recipients selected | Validation on "Next" click | "Please select at least one recipient" inline message | User selects recipients |
| Required variable empty | Validation on "Next" click | "This variable is required" inline error under the field | User fills in the variable |
| Issue date in past | Zod validation on Step 3 | "Issue date cannot be in the past" inline error | User selects valid date |
| Expiry before issue date | Zod validation on Step 3 | "Expiry date must be after issue date" inline error | User corrects dates |
| Batch job creation fails | Apollo mutation `error` | Error state in Step 5 with "Retry" and "Back" buttons | Retry re-submits mutation; Back returns to Review |
| Permission error during generation | Mutation error code `FORBIDDEN` | "You do not have permission to generate certificates" message | User must contact admin (no in-dialog fix) |
| Batch job not found (idempotency mismatch) | Polling query returns null | "Batch job not found" error state + "Start Over" button | User closes dialog and restarts |
| Polling timeout / network drop | Polling query error after 3 retries | "Connection lost — checking..." + auto-retry | Auto-retries every 5s for up to 1 minute |
| Per-certificate generation failure | Polling response shows `failedRecipientDetails` | Per-certificate error icon + message + inline "Retry" button | Click retry → calls retryCertificate mutation |
| All generation failures | Polling shows `failureCount === totalCount` | Report view: "All certificates failed" + "Retry All" | Retry re-submits all as new batch |
| Partial generation failure | Polling shows `failureCount > 0 && successCount > 0` | Report view with failure table + per-certificate "Retry" + "Retry Failed All" | Retry individual or batch |
| Download ZIP fails | Download mutation error | "Failed to prepare ZIP download" + retry button | Click retry → re-requests ZIP |
| Pause/resume mutation fails | Mutation error | "Failed to pause/resume generation" warning toast | User can try again; generation continues from server side |

### Error Propagation

All errors are handled locally within the dialog component — no error boundary needed since the dialog is self-contained. Apollo mutation errors are caught in the ViewModel and exposed via `viewModel.error`. No error silently disappears — every failure path has a visible user message.

### Generation Status Transitions

```
idle → generating (mutation success, job created)
generating → paused (user clicks Pause, pauseMutation success)
paused → generating (user clicks Resume, resumeMutation success)
generating → completed (polling: status === 'completed', failureCount === 0)
generating → completed (polling: status === 'completed', failureCount > 0) — show report with partial failures
generating → error (polling: status === 'failed', or 3 consecutive polling errors)
paused → error (user cancels during pause)
generating → cancelled (user clicks Cancel + confirms, cancelMutation success) — status becomes 'idle'
```

---

## 10. i18n Design

### 10.1 Namespace Structure

```
Translation.Dashboard.CertificateGeneration
  ├── dialogTitle, dialogSubtitle, cancelButton, pauseButton, resumeButton, doneButton
  ├── backButton, nextButton, generateButton, closeWarningTitle, closeWarningBody
  ├── stepTemplateLabel, stepRecipientLabel, stepVariableLabel, stepOptionsLabel
  ├── stepReviewLabel, stepProgressLabel
  ├── stepTemplateDescription, stepRecipientDescription, stepVariableDescription
  ├── stepOptionsDescription, stepReviewDescription, stepProgressDescription
  ├── templateSearchPlaceholder, templateCardVariables, templateCardCategory, templatePreviewButton
  ├── individualMode, groupMode, classMode, csvMode, recipientSearchPlaceholder
  ├── recipientSelectedCount(count), groupPullPreview, groupShowAllMembers(count)
  ├── classSelectPlaceholder, classStudentCount(count), csvUploadHint, csvPreviewColumn, csvRowCount(count), csvParseError
  ├── variableMappingTitle, variableMappingHint, variableSourceRecipient, variableSourceStatic
  ├── variableSourceSystem, variableRecipientField, variableStaticValue, variableSystemValue
  ├── variableResolvedPreview, variablePreviewForFirstRecipient
  ├── optionsIssueDate, optionsExpiryDate, optionsExpiryOptional, optionsNumberingPrefix
  ├── optionsPdfQuality, optionsPdfDraft, optionsPdfStandard, optionsPdfHigh
  ├── optionsSendEmail, optionsGenerateQR, optionsQRVerificationHint
  ├── reviewTitle, reviewTemplate, reviewRecipientCount, reviewVariableMappings
  ├── reviewOptions, reviewEstimatedTime, reviewLargeBatchWarning(count), reviewGenerateButton
  ├── progressTitle, progressSubtitle, progressCompleteLabel, progressProcessed(processed, total)
  ├── progressPaused, progressResumeButton, progressCancelButton, progressCancelConfirm
  ├── progressPerCertPending, progressPerCertGenerating, progressPerCertSuccess, progressPerCertError
  ├── progressRetryFailed, progressRetryAll, progressDownloadAll, progressDownloadZip
  ├── progressErrorAppName, progressErrorRetryButton, progressSuccessCount(count)
  ├── progressFailureCount(count)
  ├── errorNetwork, errorPermission, errorTemplateNotFound, errorRecipientNotFound
  ├── errorClassNotFound, errorCSVParse, errorCSVZeroRows, errorIssueDatePast
  ├── errorExpiryBeforeIssue, errorJobNotFound, errorPollingTimeout, errorDownloadZip
  ├── errorPauseFailed, errorResumeFailed, errorCancelFailed
  └── validationRequiredTemplate, validationRequiredRecipients, validationRequiredVariables
```

### 10.2 Registration Points

| Component | Translation Access Pattern |
|-----------|--------------------------|
| GenerationViewModel | `useAppTranslation(Translation.Dashboard.CertificateGeneration)` — single call, distributes labels via object |
| DesktopView | Receives `labels` as prop from viewModel — NO `useAppTranslation` call |
| MobileView | Same — receives labels as prop |
| StepTemplateSelect | Receives `labels` as prop — NO direct translation access |
| StepRecipientSelect | Same |
| StepVariableMapping | Same |
| GenerationOptionsStep | Same |
| ReviewStep | Same |
| ProgressStep | Same |
| CSVUploadPicker | Same |
| ClassRecipientPicker | Same |
| TemplateCard | Same |
| RecipientListItem | Same |

The ViewModel calls `useAppTranslation` once and passes the `labels` object to all step components as a prop. This avoids redundant hook calls in each child.

### 10.3 Pluralization Keys

| Key | Arabic Rules | English Rules |
|-----|-------------|---------------|
| `groupMemberCount` | zero/one/two/few/many/other | one/other |
| `groupShowAllMembers` | one/other | one/other |
| `recipientSelectedCount` | zero/one/two/few/many/other | one/other |
| `templateCardVariables` | Zero: "0 متغير", One: "1 متغير", Two: "2 متغيران", Few: "5 متغيرات", Many: "25 متغيراً", Other: "150 متغيراً" | one: "1 variable", other: "N variables" |
| `classStudentCount` | zero/one/two/few/many/other | one/other |
| `csvRowCount` | zero/one/two/few/many/other | one/other |
| `progressSuccessCount` | zero/one/two/few/many/other | one/other |
| `progressFailureCount` | zero/one/two/few/many/other | one/other |
| `reviewLargeBatchWarning` | zero/one/two/few/many/other | one/other |

### 10.4 Interpolation

All interpolation parameters are typed in the type interface. The `useAppTranslation` hook resolves them at runtime. For example:
- `progressCompleteLabel(percent: number)` → `"{percent}% complete"`
- `progressProcessed(processed: number, total: number)` → `"{processed} of {total} processed"`
- `reviewLargeBatchWarning(count: number)` → pluralization + interpolation
- `recipientSelectedCount(count: number)` → pluralization
- `progressSuccessCount(count: number)` → pluralization
- `progressFailureCount(count: number)` → pluralization

### 10.5 i18n Locale Files

Three locale files + one namespace file + one type interface file:

| File | Path |
|------|------|
| Type interface | `shared/locale/types/dashboard/certificates/generation.ts` |
| English locale | `shared/locale/en/dashboard/certificates/generation.ts` |
| Arabic locale | `shared/locale/ar/dashboard/certificates/generation.ts` |
| Namespace registration | `shared/locale/namespaces/dashboard/certificates/generation.namespace.ts` |

---

## 11. AGENTS.md References

| File Location | AGENTS.md Files to Read |
|---------------|------------------------|
| `frontend/common/views/dashboard/certificates/generation/generationContainer.tsx` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| `frontend/common/views/dashboard/certificates/generation/useGenerationViewModel.ts` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| `frontend/common/views/dashboard/certificates/generation/generationView.tsx` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| `frontend/common/views/dashboard/certificates/generation/components/StepTemplateSelect.tsx` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| `frontend/common/views/dashboard/certificates/generation/components/StepRecipientSelect.tsx` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| `frontend/common/views/dashboard/certificates/generation/components/StepVariableMapping.tsx` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| `frontend/common/views/dashboard/certificates/generation/components/GenerationOptionsStep.tsx` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| `frontend/common/views/dashboard/certificates/generation/components/ReviewStep.tsx` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| `frontend/common/views/dashboard/certificates/generation/components/ProgressStep.tsx` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| `frontend/common/views/dashboard/certificates/generation/components/CSVUploadPicker.tsx` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| `frontend/common/views/dashboard/certificates/generation/components/ClassRecipientPicker.tsx` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| `frontend/common/views/dashboard/certificates/generation/components/TemplateCard.tsx` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| `frontend/common/views/dashboard/certificates/generation/components/RecipientListItem.tsx` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| `frontend/desktop/views/dashboard/certificates/generation/generation.desktop.tsx` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| `frontend/mobile/views/dashboard/certificates/generation/generation.mobile.tsx` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| `frontend/common/stores/certGenerationStore.ts` | `AGENTS.md`, `frontend/common/stores/AGENTS.md` |
| `frontend/common/graphql/sharedDocuments/certificates/generation.documents.ts` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/common/graphql/sharedDocuments/AGENTS.md` |
| `shared/locale/types/dashboard/certificates/generation.ts` | `AGENTS.md`, `shared/AGENTS.md` |
| `shared/locale/ar/dashboard/certificates/generation.ts` | `AGENTS.md`, `shared/AGENTS.md` |
| `shared/locale/en/dashboard/certificates/generation.ts` | `AGENTS.md`, `shared/AGENTS.md` |
| `shared/locale/namespaces/dashboard/certificates/generation.namespace.ts` | `AGENTS.md`, `shared/AGENTS.md` |
| `frontend/common/views/dashboard/cert-list/components/GenerateCertificatesDialog.tsx` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| `app/(dashboard)/certificates/page.tsx` (if modified for launch button) | `AGENTS.md`, `app/AGENTS.md` |
| `test/ui/components/certificates/generation/` | `AGENTS.md`, `test/ui/AGENTS.md` |

### Key Rules from AGENTS.md

- **Logging**: Never use `console.*` — use `logger` from `@/frontend/common/utils/logger`
- **MUI v9**: All style via `sx` prop — no `fontWeight`, `mb`, `mt`, etc. as direct props on Typography/Stack/Box/Grid
- **MUI Icons**: Use `Outlined` suffix (e.g., `workspacePremiumOutlined`, not `workspacePremiumOutline`)
- **Apollo**: Use `useQuery` (NOT `useLazyQuery`), import from `@apollo/client/react`, include `id` field on all object types
- **React 19**: Use `React.SubmitEvent` or `React.SyntheticEvent` (not `FormEvent`)
- **Path aliases**: All imports use `@/*` alias — never relative paths
- **GraphQL documents**: Include `id` on all object types for Apollo cache normalization
- **TypedDocumentNode**: Import from `@apollo/client`
- **i18n**: Never hardcode strings — all from `Translation.Dashboard.CertificateGeneration`

---

## 12. Outcome & Knowledge Transfer

### Knowledge Artifacts Produced

| Artifact | Consumer Plan | Description |
|----------|--------------|-------------|
| Generation dialog component architecture | Plan 21 (Knowledge Propagation) | 6-step wizard pattern with Zustand store + async job polling |
| Async job + polling pattern | Plan 21 | How `batchGenerateCertificates` creates a `certificate_batch_jobs` row, UI polls `certificateBatchJob(id)` at 2s intervals |
| Batch generation mutation pattern | Plan 21 | How to create async job, handle polling, pause/resume/cancel |
| Variable override semantics | Plan 21 | How `variableOverrides` keyed by `variableId` (UUID) + backend per-recipient resolution works |
| Progress display pattern | Plan 21 | Real progress bar driven by server counts (processed/total), NOT fabricated estimates |
| Per-certificate retry pattern | Plan 21 | Individual retry via `retryCertificate` mutation; batch retry via idempotent `batchGenerateCertificates` reuse |
| i18n namespace for generation | Plan 21 | `Translation.Dashboard.CertificateGeneration` namespace already created |
| Pause/resume/cancel pattern | Plan 21 | How pause/resume mutations update server-side job status; cancel terminates iterator |

### Handoff to Plan 22 (Batch Job Worker)

The `GenerateCertificatesMutation` creates a `certificate_batch_jobs` row with status `pending` and returns `{ jobId, status: 'pending' }` immediately. The Plan 22 cron worker picks up the job, iterates recipients, and updates each per-certificate status. The UI polls `CertificateBatchJobStatusQueryDocument` every 2s to track progress. Plan 22 is responsible for:
- Polling the `certificate_batch_jobs` table for pending jobs
- Calling `CertificateGenerationService.generateCertificate()` per recipient (Plan 04 §6 loop)
- Updating `perCertificateStatus` rows as each recipient resolves
- Updating the batch job `status` to `completed` or `failed` when done
- Handling `pause`/`resume`/`cancel` flags set by mutations from this plan's UI

This plan's UI must send the jobId to Plan 22's worker via the `certificate_batch_jobs` row — no direct service invocation from the UI.

### Handoff to Plan 19 (QR Verification)

If `options.generateQR` is `true`, the batch input includes `generateQR: true`. Plan 22's worker (or Plan 04's service) generates a `verificationCode` per certificate and stores it. The `CertificateBatchJobStatusQueryDocument` returns `verificationCode` per completed certificate in the `perCertificateStatus` array. Plan 19's verification page consumes this code via the `verificationCodes` table. The dialog's `ProgressStep` shows a QR icon next to certificates that have QR codes, but does NOT render QR images — that is Plan 18's responsibility. The `BatchGenerateCertificatesMutationDocument` must include `generateQR` in the input, and the batch job result must include `verificationCode` per certificate so Plan 18's detail page can render the QR.

### Handoff to Plan 18 (Certificate Detail)

After generation completes, the `ProgressStep` success entries are clickable → navigate to `/certificates/[id]` (Plan 18). The `perCertificateStatus` array in the store contains `{ certificateId, recipientName, status, verificationCode }` per generated certificate. This requires no data contract between plans — Plan 18 receives the certificate ID via the URL parameter. The `verificationCode` is included so the `ProgressStep` can optionally display it, but QR image rendering is Plan 18's job.

### Handoff to Plan 16 (Certificate List)

When the dialog closes after successful generation (or partial success), it triggers `client.refetchQueries({ include: ['CertificateList', 'CertificateMetrics'] })`. The certificate list page automatically shows the newly generated certificates. Plan 16's container must ensure its query operation names match `CertificateList` and `CertificateMetrics` — Apollo `refetchQueries` matches by operation name, not document variable name. This plan's mutation cache update depends on Plan 16's operation names being consistent. Cache eviction is narrowly scoped: `client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'certificates' })` (list field only) — NOT singular `certificate` detail (to preserve Plan 18's `cache-first` detail cache).


---

## Reality Check Notes

> Verified against the actual codebase at `/home/ahmed/Projects/siraj-cert/` on 2026-08-02.

### Corrections applied to this plan

1. **Store path `frontend/stores/` → `frontend/common/stores/`** (CRITICAL)
   - Verified: `frontend/stores/` does **NOT** exist. Stores live at `frontend/common/stores/` with camelCase `{entity}Store.ts` naming (see `frontend/common/stores/AGENTS.md`).
   - Fixed: `frontend/stores/certGenerationStore.ts` → `frontend/common/stores/certGenerationStore.ts`; `frontend/stores/AGENTS.md` → `frontend/common/stores/AGENTS.md`. Removed the redundant "(or `frontend/stores/AGENTS.md`)" alternative in tasks.md (the dir does not exist).

2. **i18n namespace handle is FLAT under `Dashboard` (not nested `Dashboard.Certificates.Generation`)**
   - Verified in `shared/locale/namespaces/translation.ts`: `Translation.Dashboard` has flat keys (e.g. `StaffDirectory`, `StudentDirectory`) — **no nested `Certificates` object**.
   - Fixed: `useAppTranslation(Translation.Dashboard.Certificate.Generation)` → `useAppTranslation(Translation.Dashboard.CertificateGeneration)`.
   - Client uses the typed handle, NEVER a string namespace.
   - Registration files must follow: `shared/locale/types/dashboard/certificates/generation.ts`, `shared/locale/en/dashboard/certificates/generation.ts`, `shared/locale/ar/dashboard/certificates/generation.ts`, `shared/locale/namespaces/dashboard/certificates/generation.namespace.ts` exporting `DashboardCertificateGeneration`.
   - **NOTE for implementation**: also add the flat `CertificateGeneration: DashboardCertificateGeneration` entry in `shared/locale/namespaces/translation.ts` (`Translation.Dashboard` object), the flat `certificateGeneration: CertificateGenerationLabels` on the `DashboardTranslations` interface in `shared/locale/types/message.ts`, and re-export `DashboardCertificateGeneration` from `shared/locale/namespaces/index.ts`. These registration steps were not enumerated in tasks — add them.

3. **GraphQL sharedDocuments file naming**: multi-word documents use **kebab-case within the domain directory**. Fixed `certificates-generation.documents.ts` → `certificates/generation.documents.ts` (domain folder + singular file name).

4. **Logger import path typo fixed**: `@/frontend/utils/logger` → `@/frontend/common/utils/logger`.

5. **6-step wizard (was 4-step)**: The original plan had 4 steps (Template, Recipients, Variable Mapping, Generate). SWE review (B.1) forced async job model, and the user's enhancement request separated Options and Review from the progress step. Now 6 steps: Step 0 Template, Step 1 Recipients, Step 2 Variable Mapping, Step 3 Generation Options, Step 4 Review, Step 5 Progress. Step 2 is skipped if the template has no variables.

6. **Async job model (was synchronous mutation)**: The original `batchGenerateCertificates` mutation was synchronous (returned full batch result). SWE review B.1 identified this as fragile — a 200-recipient batch would take ~60s on a single HTTP request, exceeding serverless function limits. Redesigned to async job pattern: mutation creates `certificate_batch_jobs` row, returns immediately, UI polls `certificateBatchJob(id)` every 2s. Plan 22 cron worker processes the job. This is documented in DD-6 and §12 Handoff to Plan 22.

7. **`verificationCode` for Plan 19**: The batch mutation result (via polling query) must include `verificationCode` per completed certificate so Plan 18's QR rendering and Plan 19's verification page work. Documented in §12 Handoff to Plan 19.

### Verified-correct (no change needed)

- **Dialog as modal overlay (no route)**: correct — MUI Dialog client component launched from Certificate List (Plan 16) and Template Detail (Plan 10/15). No app route needed; matches existing modal patterns.
- **Component location** `frontend/common/views/dashboard/certificates/generation/`: aligns with the `{domain}/{feature}/` layout under `common/views` (e.g. `staff/home/`);
- **AGENTS.md files** referenced exist: `frontend/common/stores/AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/common/graphql/sharedDocuments/AGENTS.md`, `app/AGENTS.md`.
- Tier-view import helpers `createLazyView` + `ResponsiveViewSwitch` (`@/frontend/common/components/ui/container/`) are real.

### Minor signature notes (left as-is; implementer should follow the live pattern)

- `AppPermission` in client Containers is imported from `@/frontend/common/graphql/generated/gql/graphql-types` (verified in `ManagersContainer.tsx`), wrapped via `<RequirePermission permissions={[AppPermission.X]}>`. The dialog's permission gating should match this client-side helper, not reimplement raw checks. Permission key: `AppPermission.CertificateBatchGenerate` (string: `certificates.batch_generate` per INTER_PLAN_CONTRACTS §1).

---

## SWE Expert Review Resolution Summary

> The following expert review notes (B.1–B.11) were all INCORPORATED into the design above. They are retained here for traceability and for the implementation engineer to verify each resolution was addressed.

### B.1 Async job + polling (RESOLVED in DD-6)
**Original concern**: Synchronous mutation would take ~60s for 200 recipients, exceeding serverless limits.
**Resolution**: Redesigned to async job pattern. Mutation creates `certificate_batch_jobs` row, returns immediately. UI polls `certificateBatchJob(id)` every 2s. Plan 22 cron worker processes. Cancel/pause/resume are server-side operations. Documented in DD-6, §4 GraphQL API, §12 Handoff to Plan 22.

### B.2 Estimated time undefined (RESOLVED in Step 4 Review)
**Original concern**: "Estimated 2-5 minutes" had no basis.
**Resolution**: Under async job model, the Review step computes ETA from `recipientCount × avgRenderMsPerRecipient` (sequential, ~300ms/recipient). The Progress step shows REAL progress (`processed/total`) with live ETA: `elapsed × (total/processed)`. No fabricated bar.

### B.3 Per-recipient failure state (RESOLVED in §5 Zustand Store + §9 Error Matrix)
**Original concern**: `failedRecipientIds: string[]` lost `code`/`message` per failure.
**Resolution**: Store now has `failedRecipientDetails: { id, recipientName, code, message }[]` for the FailureTable. Per-recipient records persist as `certificate_recipient_items` (Plan 01) so retry works across dialog reopen. Documented in §5 and DD-7.

### B.4 Permission + identifier contract (RESOLVED in §4 + §11)
**Original concern**: Used `recipientId` instead of `studentId`; wrong permission keys.
**Resolution**: Input uses `studentIds: [ID!]!` (UUIDs per Plan 02). Permission is `CertificateBatchGenerate` (string: `certificates.batch_generate` per INTER_PLAN_CONTRACTS §1). `verificationCode` returned in batch result for Plan 18/19.

### B.5 Pagination: page-number, not cursor (RESOLVED in DD-3)
**Original concern**: Used cursor-based "Load More"; codebase uses page-number pagination.
**Resolution**: Changed to page-number OFFSET pagination matching `AppDataGrid` and `studentDirectory`. Reuse `student-directory.documents.ts` for recipient queries. Documented in DD-3 and §4.

### B.6 Variable override keying (RESOLVED in DD-5 + §4)
**Original concern**: Overrides keyed by `variable.name` (not stable); `Date` not JSON-serializable.
**Resolution**: `variableOverrides` keyed by `variableId` (UUID from Plan 02 `TemplateVariable.id`). All dates ISO 8601 strings. Store type is `Record<string, string>`.

### B.7 Idempotency key for retry (RESOLVED in DD-7)
**Original concern**: Retries might double-issue.
**Resolution**: Retry re-submits the SAME `(template, recipient)` pair — backend dedup via idempotency key (Plan 04 §6). Dialog's "Retry Failed" relies on backend dedup, not new keys. Documented in DD-7.

### B.8 Navigation lock + beforeunload (RESOLVED in DD-10 + §9)
**Original concern**: Escape/Cancel asymmetry; back-button navigation not blocked.
**Resolution**: Both Close (X) IconButton AND Cancel button disabled during `generating`. `beforeunload` listener set when `generating`, removed when done. Under async job model, generation survives navigation (job runs server-side), user can reopen by `jobId`.

### B.9 Cache eviction scope (RESOLVED in §12 Handoff to Plan 16)
**Original concern**: Evicting ALL Certificate cache kills Plan 18's detail cache.
**Resolution**: Narrowly scoped: `client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'certificates' })` (list field only) + `evict` metrics field. NOT singular `certificate` detail. Operation names hard-contracted with Plan 16/05.

### B.10 qrcode dependency (RESOLVED in §12 Handoff to Plan 19)
**Original concern**: `qrcode` not installed; `verificationCode` needed for Plan 18/19.
**Resolution**: This plan does NOT render QR images. `BatchGenerateCertificatesMutationDocument` includes `generateQR: boolean` in input. Polling query returns `verificationCode` per completed certificate. Plan 18 renders QR from the code; Plan 19 verifies. No direct `qrcode` dependency needed.

### B.11 Step validation + mode switch (RESOLVED in DD-8 + §8.5)
**Original concern**: Variable count can change between selection and Next; mode switch clears recipients.
**Resolution**: Step re-validation on transition: re-check `template.variables.length` before entering Step 2. Block re-entering Steps 0–4 after generation starts. Switching recipient mode clears prior selections. Documented in DD-8 and §8.5 react-hook-form integration.

---

## SWE Expert Review Notes

> Expert SWE architectural review + codebase reality check layered on top of the existing "Reality Check Notes". Verified against `/home/ahmed/Projects/siraj-cert/` on 2026-08-02. Cross-refs Plans 01 (enums), 02 (types/permissions), 04 (services), 05 (GraphQL API), 14 (recipient groups), 06/07 (PDF/storage).

### B.1 Generation progress tracking — the synchronous-mutation assumption is fragile (CRITICAL)

DD-6 asserts "the `batchGenerateCertificates` mutation is synchronous from the client's perspective — it sends the request and waits for the full batch result." Reality in Plan 04: `CertificateGenerationService.generateCertificate(input, locale, tErrors)` is invoked **per recipient inside a loop** (Plan 04 §6 batch flow: `for each item → try generateCertificate`). Each call does idempotency-key computation, certificate + verification-code insertion, **PDF rendering, storage linking, notifications, audit logs** (Plan 04 §3.5 bullet "PDF rendering, storage linking…"). For a 200-recipient batch that is synchronous HTTP seeing each render sequentially.

Real-world cost:
- A single PDF render in Plan 06 (`pdf-lib`, the installed dep) for a multi-element template is tens-to-hundreds of ms on the server. 200 recipients × ~300 ms = **~60 seconds on a single HTTP request**, which will:
  - exceed Next.js serverless function execution limits (Vercel hobby max 10s, pro 60s, enterprise 300s — non-configurable),
  - exceed every reasonable HTTP/GraphQL timeout (Apollo Client v4 default `timeout`/ HTTP link is 30s unless overridden),
  - trigger hostile UX (a 0→100 determinate progress bar that "estimates" duration but can never reflect real partial failures until the whole thing returns).
- The "estimated progress based on elapsed time" UX is a fabrication — it animates a bar toward 100% purely from a time model. If the server takes 90s, the bar hits 100% at ~estimated 50s and stalls indefinitely, then suddenly resolves. That is worse than an indeterminate bar.

**Required redesign.** Choose ONE and document it:
1. **Make generation truly async with a job + polling** (recommended). Mutation `batchGenerateCertificates` enqueues a job row (Plan 01 already has `certificateGenerationStatusEnum` pending/processing/completed/failed and Plan 04 references a "render queue"), returns `{ batchId, status: "processing" }` immediately. The dialog polls a `certificateBatchStatus(batchId)` subscription/query every 2–3s returning `{ processed, total, failures[], status }`. The UI progress bar is then REAL (driven by server counts), `Retry Failed` and partial-failure surfaces are meaningful, and the HTTP timeout problem disappears. This aligns with `DownloadCertificateUrlQueryDocument` polling already specified in Plan 18.
2. If staying synchronous: **strictly cap** the batch size (e.g. 25 recipients) on the client AND server (Plan 05), reject larger batches with `BATCH_LIMIT_EXCEEDED`, and force `no-proxy-timeout` / edge function config. Convert the determinate bar to an indeterminate spinner for batches > 50 (don't fabricate %).

The current design also claims partial failure reveals state for "the 20" — under (1) each recipient resolves to per-recipient status `pending`/`processing`/`issued`/`failed`/`skipped` (Plan 01 `certificateRecipientItemStatusEnum`) which is exactly the "20" the question asks about. Under (2), the 20 are surfaced only after the whole batch returns. Resolve against Plan 04/05 — explicitly state the job model name (`certificate_generation_jobs` table or similar) the dialog polls. **Cancel mid-batch** (a prompt question) is ONLY possible under model (1) (set job `cancelled=true`, server stops iterating on next item). Under model (2) cancel is impossible — the HTTP call is already in flight. State the chosen model in DD-6 and update progress/cancel/cancel-mid-batch UX accordingly.

### B.2 "Estimated time" is undefined

The reviewer specifically asks: "What about estimated time?" The plan only says "estimated 2-5 minutes" for >200 batches with no basis. Provide a concrete estimate source, e.g. `(recipientCount × avgRenderMsPerRecipient) / concurrency`. Concurrency must be specified (Plan 04 loop is sequential unless a worker pool exists; if sequential, estimate = `count × perRenderMs`). If model (1) above is adopted, show elapsed/processed to derive live ETA: `ETA = elapsed × (total / processed)`. Otherwise drop the "2-5 minutes" claim and show an indeterminate bar with an honest "This may take a few minutes…" copy.

### B.3 Partial-failure handling — state definition of the 20

For the failure review question (80/100 succeed — state of the 20): The 20 must be explicitly persisted as `certificate_recipient_items` (or equivalent per-recipient records) with `status='failed'` and `failureCode`/`failureMessage` (Plan 01's `certificateRecipientItemStatusEnum` already defines `pending|processing|issued|failed|skipped`). Currently the design's `failedRecipientIds: string[]` store field loses the per-failure `code`/`message` after retry. **Specify that the per-recipient failure record persists** (so the user can close the dialog, come back later, and still see which failed and why from the list page). The "Retry Failed" action re-submits the 20 by their `studentId` AND preserves audit of each retry attempt. The dialog's `failedRecipientIds` should be hydrated from the persisted per-item records, not only the in-memory mutation result, so retry works across dialog reopen. Add `failedRecipientDetails: { id, recipientName, code, message }[]` to the store for the FailureTable; do not silently drop `code`/`message`.

### B.4 Status/permission/identifier contract — same corrections as Plan 16

This plan inherits the same invented vocabulary that Plan 02 contradicts. Apply:
- `recipientIds: [ID!]!` → these must be `studentId` UUIDs (Plan 02 filter input is `studentId`, and `recipientId` doesn't exist as a top-level key in the canonical type set). Confirm with Plan 05 — the input should be `studentIds: [ID!]!` (or whatever Plan 05 names it). Align with Plan 02 §3 ReturnType record (`studentId`, `studentName`).
- The "Generate" toolbar button permission is gated by `CERT_GENERATE` (single) / `CERT_BATCH_GENERATE` (batch) per Plan 02 §5.1 — NOT "CERTIFICATES_MANAGE". Update §11 AGENTS.md rules reference (currently vague) and remove references to the invented permission keys.
- Generated certificate `status` returned in the `certificates` array: per Plan 02 will be `pending` (PDF rendering) or `issued` (rendered synchronously in this hypothetical-per-certificate model). There is no `draft`. The `GenerationReport` "ReportHeader (success / partial / failed)" relates to the BATCH outcome, not certificate statuses — disambiguate in the design text to avoid conflating batch-failure with certificate-status `failed`.

### B.5 Recipient picker UX — cursor vs page discrepant with codebase

DD-3 picks "cursor-based pagination…with Load More". The codebase's `PaginationArgs` input supports `page`, `skip`, `after`, `first`, `before`, `last` and the dominant pattern is page-number pagination (`studentDirectory` uses `paginationArgs` with `page`). "Load More" via `fetchMore` cursor mode IS supported by the backend `PageInfo` (`startCursor`/`endCursor`/`hasMorePages`), so it can work — BUT the frontend recipient query should match the existing `studentDirectoryQueryDocument` shape rather than inventing a relay `RecipientsForGenerationQueryDocument.edges`. Reuse the `students` sharedDocuments (`student-directory.documents.ts`) and `recipientGroups` (Plan 14) documents rather than creating new ones if the fields overlap — `RecipientsForGenerationQueryDocument` likely duplicates `studentDirectoryQuery`. Confirm with Plan 14/05; otherwise document the divergence. Search input: 25 row page is fine but align `pageSize` default with codebase (10) for consistency unless the modal needs more density.

### B.6 Variable override — `Record<string, string|number|Date>` keying

DD-5 overrides by `variable.name`. Two concerns:
1. Template variable identity is the variable `id` (UUID) in Plan 02 models (`TemplateVariable` has `id`), not `name` — `name` may not be unique stable. Key overrides by `variableId` to be safe; the backend resolves by id then name. **Confirm with Plan 06** what the override wire contract is (`{ variableId, value }[]` vs `{ [name]: value }`). The current `JSONObject` type hides this — make it an explicit `[{ variableId: ID!, value: JSON }]` input so the backend can validate by id.
2. `Date` is not JSON-serializable — `JSONObject` will coerce to ISO strings client-side. State explicitly that all dates are sent as ISO-8601 strings and the backend parses them; the store type should be `Record<string, string | number>` (no `Date`).

### B.7 Missing: idempotency key handling

Plan 04 §6 each `generateCertificate` computes a deterministic idempotency key. For batch retry, the SAME idempotency key per (template, recipient) ensures retries don't double-issue. The dialog's "Retry Failed" path must NOT generate new idempotency keys — it relies on backend dedup. State this in DD-7 so a reviewer doesn't ask why a "retry" of a previously-attempted recipient is safe against transient width.

### B.8 Unsaved-changes prompt vs mid-generation cancel

DD-10 blocks Escape/close during generation, and shows unsaved-changes prompt before generation. Good, but the "Cancel" button (footer, "always visible, disabled during generation") overlaps with Escape semantics — disable BOTH the Close (X) IconButton AND the Cancel button during `generationStatus === 'generating'`, not just Escape. Also: navigating away with the browser back button while generating is NOT blocked by Escape handling. Add a `beforeunload` listener (set when `generating`, removed when done) — but ONLY meaningful under the async-job model (B.1): when truly async, the dialog CAN survive navigation because the job keeps running server-side, and on return the user can reopen progress by `batchId`. Choose the model and specify navigation behavior. Under the synchronous model (B.1.2), navigation aborts the generation, so `beforeunload` + disable back-button is required.

### B.9 Cache invalidation over-reaches

§4.4 says "Evict all `Certificate` cache entries OR call `client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'certificates' })`" + `refetchQueries({ include: ['CertificateList', 'CertificateMetrics'] })`. Evicting ALL `Certificate` entries nukes the detail-cache populations Plan 18 builds. Prefer the narrowly-scoped approach: `client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'certificates' })` (drops only the list ROOT_QUERY field) + `evict` the metrics field + `refetchQueries`. Do NOT call `client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'certificate' })` (singular detail) — that would defeat Plan 18's `fetchPolicy: cache-first`. Also confirm the `CertificateList` operation name matches Plan 16's `CertificateListQueryDocument` operation name exactly (Apollo `refetchQueries` matches by operation name, not document-variable name) — the handoff note in §12 already flags this; make it a hard contract in Plan 05's schema/types.

### B.10 `qrcode` dependency + shared-duplicate concern

Plan 18 already flags `qrcode` is not installed. This plan doesn't use QR, so no direct issue — but `BatchGenerateCertificatesMutationDocument` returns `verificationCode` per generated cert, which Plan 19's verification page + Plan 18's QR both consume. Confirm Plan 05 returns `verificationCode` in the batch result so Plan 18 QR generation works after navigating from this dialog's report. Add to §12 handoff note.

### B.11 Remaining risks
- DD-1 (modal vs route) is sound.
- Step 3 skip logic (DD-8): the `nextStep` jump currently hard-codes index 3 for a 4-step layout. If template variables change between selection and "Next" click (template republished mid-flow), the step count can change under the user. Re-validate variable count on step transition, and block re-entering Step 1 after generation starts. Add a NOTE.
- The `selectionMode` toggle (individual/group) UX: when the user switches modes after selecting 50 individuals then picks a group, do the individual IDs persist or get cleared? Specify: switching to group mode clears `selectedRecipientIds`; switching back clears `selectedGroupId`/`groupMemberIds`.
- Mobile full-screen (DD-9): agree.
- i18n: `templateCardVariables` pluralization rules per §10.3 — confirm the compiled-time i18n supports the `many`/`other` distinct forms (Plan 16 review notes the Arabic zero/one/two/few/many/other rules exist). Fine.

### Summary of edits required in this file
- DD-6: pick async-job+polling vs synchronous-with-strict cap; rewrite progress bar (real vs indeterminate); add cancel-mid-batch under async model only.
- §5.2 mutation: input `studentIds` (UUID) + override contract by `variableId`; persisted per-recipient failure records; `failedRecipientDetails` in store.
- §4.1 queries: align with `studentDirectory`/`recipientGroups` existing documents; clarify "Load More" uses codebase cursor-ish `PageInfo`.
- DD-2 (Zustand): trim pure-dialog flags; keep ephemeral store non-persisted (already noted).
- §4.4 cache: narrow eviction to ROOT_QUERY list field only; do not evict detail cache; hard-contract operation name with Plan 16/05.
- §12 handoff: confirm `verificationCode` returned in batch result for Plan 18/19 reuse; idempotency-key safety for retry.
- DD-10/DD-9: add `beforeunload` + symmetric disable of Cancel/Close during generation; specify navigation behavior under the chosen generation model.

---

## Round 2: Complete Component Specifications

### Wizard Step Components

#### TemplateSelectionStep
```typescript
interface TemplateSelectionStepProps {
  templates: CertTemplateReturnType[];
  selectedTemplateId: string | null;
  onSelectTemplate: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  loading: boolean;
  error: string | null;
  t: (key: string) => string;
}
```

#### RecipientSelectionStep
```typescript
interface RecipientSelectionStepProps {
  mode: 'individual' | 'group' | 'csv';
  onModeChange: (mode: 'individual' | 'group' | 'csv') => void;
  recipients: RecipientReturnType[];
  selectedRecipientIds: Record<string, boolean>;
  onToggleRecipient: (id: string) => void;
  recipientSearch: string;
  onRecipientSearchChange: (q: string) => void;
  groups: RecipientGroupReturnType[];
  selectedGroupId: string | null;
  onSelectGroup: (id: string) => void;
  csvPreview: CSVPreviewRow[];
  csvErrors: CSVRowError[];
  t: (key: string) => string;
}
```

#### VariableMappingStep
```typescript
interface VariableMappingStepProps {
  variables: TemplateVariableReturnType[];
  mappings: Record<string, string>;
  onMappingChange: (variableId: string, value: string) => void;
  t: (key: string) => string;
}
```

#### GenerationOptionsStep
```typescript
interface CertificateGenerationOptions {
  numberingPattern: string;
  outputFormat: 'pdf' | 'png' | 'both';
  paperSize: 'a4' | 'letter';
  quality: 'standard' | 'high';
  sendEmail: boolean;
}

interface GenerationOptionsStepProps {
  options: CertificateGenerationOptions;
  onChange: (options: Partial<CertificateGenerationOptions>) => void;
  t: (key: string) => string;
}
```

#### ProgressTracker
```typescript
interface GenerationProgress {
  jobId: string;
  status: 'running' | 'completed' | 'failed' | 'partial';
  total: number;
  completed: number;
  failed: number;
  currentCertificate: string | null;
  estimatedTimeRemaining: number | null;
  results: GenerationResultItem[];
}

interface ProgressTrackerProps {
  progress: GenerationProgress;
  onCancel: () => void;
  onRetry: (failedIds: string[]) => void;
  onDownloadAll: () => void;
  t: (key: string) => string;
}
```

### i18n Keys (English + Arabic)

| Key | English | Arabic |
|-----|---------|--------|
| generation.title | Generate Certificates | إنشاء الشهادات |
| generation.step.template | Select Template | اختيار القالب |
| generation.step.recipients | Select Recipients | اختيار المستلمين |
| generation.step.variables | Map Variables | ربط المتغيرات |
| generation.step.options | Options | الخيارات |
| generation.step.review | Review & Generate | المراجعة والإنشاء |
| generation.recipient.mode.individual | Individual | أفراد |
| generation.recipient.mode.group | Group | مجموعة |
| generation.recipient.mode.csv | CSV Upload | رفع ملف CSV |
| generation.csv.dropzone | Drop CSV file here | أسقط ملف CSV هنا |
| generation.options.numbering | Numbering Pattern | نمط الترقيم |
| generation.options.format | Output Format | صيغة الإخراج |
| generation.generate.button | Generate | إنشاء |
| generation.progress.title | Progress | التقدم |
| generation.progress.cancel | Cancel | إلغاء |
| generation.result.success | {count} certificates generated | تم إنشاء {count} شهادة |
| generation.result.downloadAll | Download All (ZIP) | تحميل الكل (ZIP) |

---

## 11. Alternative 4-Step Generation Wizard (V2 Design)

This section specifies an alternative **4-step** wizard design (`CertificateGenerationWizard`) that consolidates the 6-step flow into a tighter UX. Both designs coexist — the 6-step flow (§3) remains canonical; this section adds the 4-step variant for implementations that prefer fewer steps with denser screens.

### A. GENERATION WIZARD (4-step)

- **Component**: `CertificateGenerationWizard`
- **File**: `frontend/views/dashboard/cert/certificates/generate/CertificateGenerationWizard.tsx`
- **Props**: `{ open: boolean; onClose: () => void; onCompleted: (batchJobId: string) => void }`
- **Layout**: MUI Dialog — `fullScreen` on mobile (via `useMediaQuery`), `maxWidth="lg"` on desktop
- **Stepper**: 4 steps with Back/Next buttons (MUI `MobileStepper` on mobile, `Stepper` on desktop)
- **Steps**: Select Template → Select Recipients → Configure & Map Variables → Review & Generate

#### Step 1: Select Template

- Template gallery rendered as a **horizontal scroll** of published templates (MUI `Card` + `Stack` with `overflowX: auto`)
- Each **template card** displays:
  - Thumbnail (template preview image or placeholder)
  - Template name
  - Category badge (MUI `Chip`)
  - Variable count (e.g., "6 variables")
- **Single selection** (radio-style — only one template selected at a time). Card border highlights on selection.
- **Search bar** (MUI `TextField`, debounced 300ms) to filter templates by name
- **"Refresh" button** (MUI `IconButton` with `RefreshOutlined`) to reload published templates from the server
- **Validation**: must select a template to proceed — Next button is disabled until a template is selected
- Below the gallery: the **selected template's variables list** displays with "Required" / "Optional" badges (MUI `Chip` with color: `error` for required, `default` for optional)

#### Step 2: Select Recipients

Two modes via MUI `Tabs`:

1. **Individual Recipients** (default tab):
   - **Recipient table** (MUI `DataGrid` or `Table`) with add/remove columns (Name, Email, Phone)
   - **Add recipient dialog**: a small nested MUI `Dialog` with fields:
     - Name (required `TextField`)
     - Email (required `TextField` with email validation)
     - Phone (optional `TextField`)
   - **Bulk paste**: a `TextField` (`multiline`, `rows={6}`) where each line is a recipient in `"Name, Email"` format. Parse button populates the table.
   - **CSV upload**: integrated `CsvUploadZone` (see §D below) — file input + drag-drop zone + preview of first 5 rows

2. **Recipient Group** (second tab):
   - MUI `Select` dropdown to choose from existing groups (from recipient group management — Plan 14)
   - Selected group shows **member count** (pluralized) and a **member list preview** (up to 50 members, expandable)

- **Validation**: at least 1 recipient required — Next button disabled if zero recipients
- **Recipient count badge** in step header: MUI `Chip` showing "5 recipients selected" (pluralized via i18n)
- **Variable preview**: for each recipient row, an expandable panel shows which template variables will be auto-filled from recipient data (e.g., `recipient_name → "Ahmed Hassan"`)

#### Step 3: Configure & Map Variables

Three-column layout (MUI `Grid` with `spacing={3}`):

- **Column 1: Template Variables** (read-only list)
  - All variables from the selected template, displayed with name, type, and Required/Optional badge
  - Read-only — no inline editing (the list is the source of truth)

- **Column 2: Data Source Mapping**
  - **Auto-mapped variables** (highlighted green background — `sx={{ bgcolor: 'success.light' }}`): variables matched by name to recipient data fields (e.g., `name` → recipient name, `email` → recipient email)
  - **Manual mapping**: for each unmapped variable, a MUI `Select` lets the user pick a source field from:
    - Recipient data fields (name, email, phone, etc.)
    - CSV columns (if CSV was uploaded)
    - Or choose "Static value" to enter a fixed value
  - **Static values**: when "Static value" is selected:
    - `text` variable → MUI `TextField`
    - `number` variable → MUI `TextField` with `type="number"`
    - `date` variable → MUI `DatePicker`
    - `select` variable → MUI `Select` with template's select options

- **Column 3: Live Preview**
  - Renders the certificate using the **first recipient's** data applied to the template
  - **"Next recipient" / "Previous recipient"** buttons to cycle through recipients and verify data renders correctly
  - Preview uses the template renderer component (Plan 6)

- **Validation**: all required variables must be mapped — Next button disabled if any required variable is unmapped
- **Warning banner** (MUI `Alert` with `severity="warning"`): "3 optional variables are unmapped. Continue?" — does not block progression but shows a confirmation dialog on Next click
- **Variable resolution status** per variable row:
  - ✅ Resolved (green check icon) — variable has a valid source
  - ⚠️ Partial (yellow icon) — variable resolved for some recipients but not all
  - ❌ Missing (red X icon) — variable has no source and is required

#### Step 4: Review & Generate

- **Summary card** (MUI `Card`):
  - **Template**: name + thumbnail image
  - **Recipients**: count + expandable list (MUI `Collapse` — expand to see all recipient names/emails)
  - **Variable mapping**: summary text — "X auto-mapped, Y manual, Z static"
  - **Options** section (MUI `FormControl` components):
    - **Language**: MUI `Select` with options: Auto-detect, English, Arabic
    - **Paper Size**: MUI `Select` with options: A4, Letter
    - **Watermark**: MUI `Switch` — when on, shows a `TextField` for watermark text
    - **Send Email**: MUI `Switch` — when on, shows a `Select` for choosing an email template
    - **Email Template**: MUI `Select` (only visible when Send Email is on)

- **"Generate Certificates" button** (MUI `LoadingButton` — `loading` state bound to `isGenerating`):
  - On click: validates final state, calls `startGeneration()` on the store, then transitions to the progress view (§B below)

- **Generation options card** (advanced settings, collapsible via MUI `Accordion`):
  - **Concurrent generations**: MUI `Slider` (min=1, max=10, default=3) — number of certificates generated in parallel
  - **PDF quality**: MUI `Select` — Standard, High
  - **Retry failed**: MUI `Switch` — automatically retry failed certificate generations once
  - **Generate verification page**: MUI `Switch` — include a printable verification page for each certificate

### B. GENERATION PROGRESS VIEW

- **Component**: `GenerationProgressView`
- **File**: `frontend/views/dashboard/cert/certificates/generate/GenerationProgressView.tsx`
- **Props**: `{ batchJobId: string; onComplete: (result: GenerationResult) => void; onCancel: () => void }`
- Renders in place of the wizard steps (replaces step content area) after "Generate Certificates" is clicked

- **Progress bar** (MUI `LinearProgress` with `variant="determinate"`): shows "X of Y certificates generated" — value = `(completed / total) * 100`

- **Live log panel** (auto-scroll to bottom, monospace font — `sx={{ fontFamily: 'monospace', maxHeight: 300, overflowY: 'auto' }}`):
  Each log line has a timestamp prefix and an emoji status icon:
  - `[12:34:56] ✅ Certificate #001: Ahmed Hassan — Generated`
  - `[12:34:57] ❌ Certificate #002: Fatima Ali — Email send failed (retrying...)`
  - `[12:34:58] ⏳ Certificate #003: John Smith — Generating PDF...`

- **Stats cards** (MUI `Card` row, 4 cards):
  - **Generated** (green `Card` / `sx={{ borderColor: 'success.main' }}`) — success count
  - **Failed** (red `Card`) — failure count
  - **Pending** (blue `Card`) — not-yet-started count
  - **In Progress** (orange `Card`) — currently being generated count

- **Cancel button**: stops remaining generation
  - Confirms with a MUI `Dialog`: "Cancel generation? N certificates already generated."
  - On confirm: calls `cancelGeneration()` on the store, which fires the `cancelBatchJob` mutation

- **On complete** — transitions to a **result screen**:
  - **Success count** with a 🎉 confetti emoji and green `CheckCircle` icon
  - **Failed count** (if any > 0) with a "Retry Failed" `LoadingButton` that re-submits only the failed certificates
  - **"View Certificates" button** — navigates to certificate list page (Plan 16) via `router.push('/certificates')`
  - **"Generate More" button** — resets the wizard store to initial state and returns to Step 1

### C. ZUSTAND GENERATION STORE (V2)

An alternative Zustand store interface for the 4-step wizard. This supplements the store in §5 — both interfaces may be implemented in the same file with a version flag, or the V2 interface may replace the V1 interface if the 4-step wizard is the chosen implementation.

```typescript
interface Recipient {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface GenerationLogEntry {
  timestamp: string;
  certificateIndex: number;
  recipientName: string;
  status: 'generated' | 'failed' | 'in_progress' | 'retrying';
  message: string;
}

interface GenerationOptions {
  language: 'auto' | 'en' | 'ar';
  paperSize: 'A4' | 'Letter';
  watermark: boolean;
  watermarkText: string;
  sendEmail: boolean;
  emailTemplateId: string | null;
  concurrentGenerations: number;
  pdfQuality: 'standard' | 'high';
  retryFailed: boolean;
  generateVerificationPage: boolean;
}

interface GenerationProgress {
  total: number;
  completed: number;
  failed: number;
  current: string;
}

interface GenerationState {
  // Wizard step
  step: number; // 0-3 (4-step wizard)
  selectedTemplateId: string | null;
  recipients: Recipient[];
  recipientMode: 'individual' | 'group';
  selectedGroupId: string | null;
  variableMapping: Record<string, { source: 'auto' | 'manual' | 'static'; value: string }>;
  options: GenerationOptions;

  // Generation progress
  isGenerating: boolean;
  progress: GenerationProgress;
  logEntries: GenerationLogEntry[];

  // Actions — step navigation
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;

  // Actions — selection
  selectTemplate: (templateId: string) => void;
  setRecipients: (recipients: Recipient[]) => void;
  setRecipientMode: (mode: 'individual' | 'group') => void;
  selectGroup: (groupId: string) => void;

  // Actions — mapping & options
  setVariableMapping: (mapping: Record<string, { source: 'auto' | 'manual' | 'static'; value: string }>) => void;
  setOptions: (options: Partial<GenerationOptions>) => void;

  // Actions — generation
  startGeneration: () => void;
  cancelGeneration: () => void;
  addLogEntry: (entry: GenerationLogEntry) => void;
  updateProgress: (progress: Partial<GenerationProgress>) => void;
}
```

### D. CSV UPLOAD COMPONENT

- **Component**: `CsvUploadZone`
- **File**: `frontend/views/dashboard/cert/certificates/generate/CsvUploadZone.tsx`
- **Props**: `{ onParsed: (data: CsvParseResult) => void; onError: (error: string) => void; templateVariables: TemplateVariable[] }`

- **Drag-and-drop zone** (MUI `Box` with `border: '2px dashed'`, `borderColor: 'primary.main'`, hover state changes border color):
  - Accepts `.csv` files only
  - Click to browse also supported (hidden `<input type="file" accept=".csv" />`)
  - Dropped file shows filename + file size + "Remove" button

- **On upload** — parsing pipeline:
  1. Validate file size (max 5MB) — show inline error if exceeded
  2. Parse CSV (client-side, using a CSV parser library or custom parser)
  3. Validate row count (max 1000 rows) — show inline error if exceeded
  4. Show **preview table** (MUI `Table`) with the first 5 rows of parsed data
  5. Open **column mapping dialog** (MUI `Dialog`)

- **Column mapping dialog**:
  - Auto-detect columns by header name (case-insensitive):
    - `name`, `full_name`, `full name` → name field
    - `email`, `e-mail`, `mail` → email field
    - `phone`, `tel`, `mobile` → phone field
  - For each detected CSV column header, show a MUI `Select` with options:
    - "Name", "Email", "Phone", "Custom field", "Ignore"
  - Allow manual remapping — user can override auto-detected mappings
  - **Validation**: `name` and `email` columns are required — shows inline `FormHelperText` error if either is unmapped
  - "Apply Mapping" button confirms the column mapping and calls `onParsed` with the parsed + mapped data

- **Template download**: "Download CSV template" link (MUI `Link`) that generates and downloads a sample CSV file with headers matching the template's variables (e.g., `name,email,phone,course_name,completion_date`)

- **Error states** (inline `Alert` components):
  - File too large (> 5MB)
  - Too many rows (> 1000)
  - Invalid CSV format (parse error)
  - Missing name or email column after mapping

```typescript
interface CsvParseResult {
  headers: string[];
  rows: Record<string, string>[];
  columnMapping: Record<string, 'name' | 'email' | 'phone' | 'custom' | 'ignore'>;
  totalRows: number;
}
```

---

## Round 4 Enhancement — Production Hardening

Round 4 focuses on production-readiness features that transform the certificate generation dialog from a functional prototype into a robust, enterprise-grade tool. These enhancements address real-world failure modes, large-scale performance, accessibility compliance, and operator workflow ergonomics. Each subsection below specifies UI components, data models, state management, validation logic, and integration points with existing Round 1–3 architecture.

### R4-1. CSV Column Mapping UI

#### Overview

Replaces the basic column mapping dialog (§D) with a full drag-and-drop mapping interface. Users visually drag CSV column headers onto template variable slots, auto-detection matches columns by name similarity (case-insensitive, Levenshtein distance ≤ 2), and mappings persist across sessions via localStorage.

#### Component: `CsvColumnMapperDialog`

- **File**: `frontend/views/dashboard/cert/certificates/generate/CsvColumnMapperDialog.tsx`
- **Props**:
  ```typescript
  interface CsvColumnMapperDialogProps {
    open: boolean;
    onClose: () => void;
    csvHeaders: string[];
    templateVariables: TemplateVariable[];
    onApply: (mapping: ColumnMapping[]) => void;
    lastMapping?: ColumnMapping[] | null; // persisted from localStorage
  }
  ```
- Renders inside a MUI `Dialog` with `fullWidth` and `maxWidth="lg"`.

#### Layout

Three-section layout within the dialog body:

**Section A — Source Columns (left, 35% width)**:
- MUI `Box` with `sx={{Width: '35%', borderRight: 1, borderColor: 'divider', p: 2 }}`
- Lists each CSV header as a **draggable chip** (MUI `Chip` with `draggable` attribute):
  - Chip label: header name
  - Chip color: `sx={{ bgcolor: 'primary.light' }}` for unmapped, `sx={{ bgcolor: 'success.light' }}` for mapped
  - Drag start sets `dataTransfer` payload to the column name

**Section B — Template Variable Slots (center, 45% width)**:
- MUI `Box` with `sx={{Width: '45%', p: 2 }}`
- Each template variable renders as a **drop target row** (MUI `Paper` with `sx={{ p: 1.5, mb: 1, border: '2px dashed', borderColor: dropTarget ? 'primary.main' : 'divider' }}`):
  - Variable name + type badge (`sx={{ typography: 'caption' }}`)
  - "Required" / "Optional" label
  - Drop zone: when a CSV chip is dropped here, the mapping is created
  - If already mapped: shows the source column name + "Unmap" `IconButton` (`CloseOutlined` icon)
  - **Manual override**: MUI `Select` with options — all CSV headers + "Static value" + "Ignore"
    - When "Static value" is selected: inline `TextField` (text/number) or `DatePicker` (date) based on variable type
  - **Auto-detect badge**: when matched by name, shows `AutoFixHighOutlined` icon with tooltip "Auto-detected by name match"

**Section C — Preview & Validation (right, 20% width)**:
- MUI `Box` with `sx={{Width: '20%', borderLeft: 1, borderColor: 'divider', p: 2 }}`
- Shows first 3 rows of CSV data with current mapping applied
- **Unmapped variable warnings** (MUI `Alert` with `severity="warning"`):
  - "3 required variables are unmapped" (red, blocks Apply)
  - "2 optional variables are unmapped" (yellow, does not block)
- **Mapping validation summary**: "X of Y variables mapped" (MUI `LinearProgress` with `variant="determinate"`, value = `(mapped / total) * 100`)

#### Drag-and-Drop Implementation

Uses HTML5 Drag and Drop API (no external library):

```typescript
// On chip drag start
const handleDragStart = (e: React.DragEvent, columnName: string) => {
  e.dataTransfer.setData('text/csv-column', columnName);
  setDraggingColumn(columnName);
};

// On drop zone drag over
const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  setDropTarget(variableName);
};

// On drop
const handleDrop = (e: React.DragEvent, variableName: string) => {
  e.preventDefault();
  const columnName = e.dataTransfer.getData('text/csv-column');
  updateMapping(variableName, { source: 'csv', value: columnName });
  setDraggingColumn(null);
  setDropTarget(null);
};
```

#### Auto-Detection Logic

- Case-insensitive header name matching
- Common aliases hardcoded:
  - `name` ← `name`, `full_name`, `full name`, `recipient_name`, `student_name`
  - `email` ← `email`, `e-mail`, `mail`, `email_address`
  - `phone` ← `phone`, `tel`, `mobile`, `phone_number`
  - `date` ← `date`, `completion_date`, `issue_date`
- Fuzzy match: Levenshtein distance ≤ 2 for headers not in alias list
- Auto-detection runs when CSV is first parsed; results are passed as `initialMapping` prop

#### Mapping Persistence

- On `Apply`: save mapping to `localStorage` under key `cert-gen-csv-mapping-{templateId}`
- On next open: read from localStorage, pass as `lastMapping` prop
- Mapping stores: `{ csvHeader: string, variableName: string, source: 'csv' | 'static' | 'ignore', staticValue?: string }[]`
- "Reset to auto-detect" button clears persisted mapping and re-runs auto-detection
- "Remember this mapping" MUI `Switch` (default on) — when off, mapping is not persisted

#### Validation Rules

1. All `required: true` template variables must be mapped (CSV column or static value)
2. Optional variables may be left unmapped (warning shown, not blocking)
3. No two variables can map to the same CSV column (shows error: "Column 'X' is already mapped to variable 'Y'")
4. Static values must be non-empty for required variables
5. Date static values must be valid ISO date strings

#### Zustand Store Additions

```typescript
// Added to useGenerationStore
interface ColumnMapping {
  csvHeader: string;
  variableName: string;
  source: 'csv' | 'static' | 'ignore';
  staticValue?: string;
}

interface CsvMappingState {
  csvMappings: ColumnMapping[];
  mappingValidation: {
    mappedCount: number;
    totalCount: number;
    unmappedRequired: string[];
    unmappedOptional: string[];
    duplicateMappings: { csvHeader: string; variables: string[] }[];
  };
  lastUsedMapping: ColumnMapping[] | null;
  rememberMapping: boolean;

  // Actions
  setCsvMappings: (mappings: ColumnMapping[]) => void;
  updateSingleMapping: (variableName: string, mapping: Partial<ColumnMapping>) => void;
  removeMapping: (variableName: string) => void;
  validateMappings: () => CsvMappingState['mappingValidation'];
  persistMapping: () => void;
  loadLastMapping: (templateId: string) => void;
  resetMappings: () => void;
}
```

### R4-2. Duplicate Detection

#### Overview

After CSV parsing or manual recipient entry, the system detects duplicate recipients by email (primary) or recipient ID (secondary). Duplicates are highlighted in the recipient preview table, and the user can resolve them with bulk actions.

#### Component: `DuplicateDetectionPanel`

- **File**: `frontend/views/dashboard/cert/certificates/generate/DuplicateDetectionPanel.tsx`
- **Props**: `{ duplicates: DuplicateGroup[]; onResolve: (action: DuplicateResolution) => void }`
- Renders as a collapsible `Accordion` within Step 2 (Recipient Selection), shown only when duplicates are detected.

#### Data Model

```typescript
interface DuplicateGroup {
  key: string; // email or ID used for dedup
  keyType: 'email' | 'id';
  recipients: Recipient[];
  indices: number[]; // row numbers in the recipient list
}

type DuplicateResolution = 
  | { type: 'keep_first'; groupKey: string }
  | { type: 'keep_last'; groupKey: string }
  | { type: 'keep_all'; groupKey: string }
  | { type: 'keep_first_all' } // resolve all groups with keep_first
  | { type: 'keep_last_all' }
  | { type: 'keep_all_all' };
```

#### UI

- **Duplicate count banner** (MUI `Alert` with `severity="info"`): "5 duplicate recipients detected (3 groups). Click to review."
- On expand, each duplicate group displays:
  - MUI `Table` with duplicate rows highlighted (`sx={{ bgcolor: 'warning.light', '&:hover': { bgcolor: 'warning.main' } }}`)
  - Columns: `#`, `Name`, `Email`, `Source Row`, `Action`
  - Action column: MUI `Select` with "Keep This" / "Keep First" / "Keep Last" / "Keep All"
- **Bulk actions bar** (MUI `Box` with `sx={{ display: 'flex', gap: 1, mt: 1 }}`):
  - "Keep First (All Groups)" `Button` — resolves all groups with keep_first
  - "Keep Last (All Groups)" `Button`
  - "Keep All (No Dedup)" `Button`
  - "Export Duplicates" `Button` — downloads CSV of duplicate rows only

#### Detection Algorithm

```typescript
function detectDuplicates(recipients: Recipient[]): DuplicateGroup[] {
  const groups = new Map<string, Recipient[]>();

  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i];
    // Primary key: normalized email
    const emailKey = r.email?.toLowerCase().trim() || '';
    const key = emailKey || r.id;

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({ ...r, _index: i });
  }

  return Array.from(groups.entries())
    .filter(([, recs]) => recs.length > 1)
    .map(([key, recs]) => ({
      key,
      keyType: recs[0].email ? 'email' : 'id',
      recipients: recs,
      indices: recs.map(r => r._index),
    }));
}
```

#### Zustand Store Additions

```typescript
interface DuplicateDetectionState {
  duplicateGroups: DuplicateGroup[];
  duplicateResolution: Record<string, 'keep_first' | 'keep_last' | 'keep_all'>;
  hasDuplicates: boolean;
  showDuplicatePanel: boolean;

  detectDuplicates: () => void;
  resolveDuplicates: (action: DuplicateResolution) => void;
  exportDuplicates: () => void; // triggers CSV download
  setShowDuplicatePanel: (show: boolean) => void;
}
```

### R4-3. Recipient Validation

#### Overview

Validates each recipient row against template variable requirements before generation. Shows per-row errors inline with row numbers, and allows exporting all errors as a CSV for offline correction.

#### Validation Pipeline

Runs after duplicate resolution, before Step 3 (Variable Mapping):

1. **Email format validation**: RFC 5322 simplified regex — `^[^\s@]+@[^\s@]+\.[^\s@]+$`
2. **Required field check**: for each template variable with `required: true`, the mapped source field must be non-empty in the recipient row
3. **Phone number validation** (if phone variable is used): E.164 format check — `^\+?[1-9]\d{1,14}$` (configurable strictness)
4. **Name validation** (configurable): "No special characters" option — regex `^[a-zA-Z\u0600-\u06FF\s]+$` (allows Arabic + Latin letters + spaces). Configurable via a `Switch` in validation settings.

#### Component: `RecipientValidationPanel`

- **File**: `frontend/views/dashboard/cert/certificates/generate/RecipientValidationPanel.tsx`
- **Props**: `{ validationResults: RowValidation[]; onExportErrors: () => void; onFixRow: (rowIndex: number) => void }`
- Renders as an inline `Alert` + expandable `Table` within Step 2.

#### Data Model

```typescript
interface RowValidation {
  rowIndex: number;
  recipient: Recipient;
  errors: ValidationError[];
  status: 'valid' | 'warning' | 'error';
}

interface ValidationError {
  field: string; // 'email' | 'name' | 'phone' | template variable name
  type: 'required' | 'format' | 'range';
  message: string; // i18n key for the error
  severity: 'error' | 'warning';
}
```

#### UI

- **Summary banner** (MUI `Alert`):
  - `severity="error"`: "12 rows have errors and must be fixed before generation"
  - `severity="warning"`: "5 rows have warnings (generation will proceed but results may be incomplete)"
  - `severity="success"`: "All recipients validated successfully"
- **Error table** (expandable via MUI `Collapse`, `in={showErrors}`):
  - MUI `Table` with columns: `Row #`, `Name`, `Email`, `Errors`, `Action`
  - Error cell: red `Typography` with `sx={{ color: 'error.main', fontSize: 'caption.fontSize' }}` listing all error messages for that row
  - Action cell: "Edit Row" `IconButton` (`EditOutlined`) → switches Step 2 to inline edit mode for that row
- **Export errors button**: "Export Error Report (CSV)" — downloads CSV with columns: `row_number, name, email, error_field, error_type, error_message`
- **Validation settings** (MUI `Accordion`, collapsed by default):
  - "Strict email validation" `Switch` (default on)
  - "No special characters in names" `Switch` (default off)
  - "Phone number format" `Select` — `E.164` / `Local` / `None` (default: `None`)
  - "Block generation on warnings" `Switch` (default off — warnings don't block, errors do)

#### Integration

- Validation runs automatically on recipient list change (debounced 500ms via `useEffect` + `setTimeout`)
- Results stored in Zustand; Step 3 "Next" button is disabled if any `severity: 'error'` validations exist (unless `blockOnWarnings` is off and the only issues are warnings)

#### Zustand Store Additions

```typescript
interface RecipientValidationState {
  validationResults: RowValidation[];
  validationSettings: {
    strictEmail: boolean;
    noSpecialCharsInNames: boolean;
    phoneFormat: 'e164' | 'local' | 'none';
    blockOnWarnings: boolean;
  };
  showValidationPanel: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;

  validateRecipients: () => void;
  setValidationSettings: (settings: Partial<RecipientValidationState['validationSettings']>) => void;
  exportValidationErrors: () => void;
  fixRow: (rowIndex: number) => void;
}
```

### R4-4. Progress Cancellation

#### Overview

Enhances the existing progress view (§B) with a robust cancellation flow: immediate cancel button, confirmation dialog with partial progress info, cleanup of partial certificates, and WebSocket-based cancellation (replacing polling-only).

#### Cancellation Flow

1. User clicks "Cancel Generation" button (already exists in §B — enhanced here)
2. **Confirmation Dialog** (MUI `Dialog`):
   - Title: "Cancel Certificate Generation?"
   - Body: "N of M certificates have been generated. Cancelling will stop the remaining M−N certificates and clean up any partial PDFs. This cannot be undone."
   - Shows partial progress: MUI `LinearProgress` with current value
   - Buttons: "Keep Generating" (secondary) / "Cancel Generation" (error `Button` with `sx={{ color: 'error.main' }}`)
3. On confirm: `store.cancelGeneration()` fires:
   - Sends `cancelBatchJob` mutation via Apollo (existing behavior)
   - **WebSocket message**: `cert:generation:cancel` with `batchJobId` — server immediately stops processing
   - Sets `isCancelling: true` in store (UI shows "Cancelling..." overlay)
4. **Cleanup**: after cancellation confirmed by server:
   - Any certificates in `in_progress` status are marked as `cancelled`
   - Partial PDF files on server are deleted (server-side cleanup)
   - Log entry appended: `[timestamp] ⛔ Generation cancelled by user`
5. **Post-cancel state**:
   - Progress bar shows frozen state: "Cancelled — N of M completed"
   - Result screen shows: "Generation Cancelled" header, success count, "Resume Generation" `Button` (submits a new batch job for remaining recipients only)

#### WebSocket Integration

- Uses existing WebSocket infrastructure (or adds a minimal one if not present)
- Client subscribes to `cert:generation:{batchJobId}` channel on generation start
- Server pushes events: `progress` (completed/failed counts), `log` (new log entry), `cancelled` (cancel confirmed), `completed` (all done)
- WebSocket supplements polling — if WS is connected, polling interval increases to 10s (fallback); if WS disconnects, polling falls back to 2s

```typescript
interface GenerationWebSocketMessage {
  type: 'progress' | 'log' | 'cancelled' | 'completed' | 'error';
  batchJobId: string;
  payload: {
    completed?: number;
    failed?: number;
    total?: number;
    logEntry?: GenerationLogEntry;
    current?: string;
  };
}
```

#### Progress Bar Enhancement

- Cancel button is **integrated** into the progress bar container (not separate):
  - MUI `Box` with `sx={{ display: 'flex', alignItems: 'center', gap: 2 }}`:
    - `LinearProgress` (flex-grow)
    - "N / M" `Typography`
    - Cancel `IconButton` (`CancelOutlined`) — `sx={{ color: 'error.main' }}`
- During cancellation: `LinearProgress` shows `variant="indeterminate"`, cancel button shows `LoadingButton` spinner

#### Zustand Store Additions

```typescript
interface ProgressCancellationState {
  isCancelling: boolean;
  cancelConfirmationOpen: boolean;
  webSocketConnected: boolean;
  partialCleanupComplete: boolean;

  requestCancellation: () => void;
  confirmCancellation: () => void;
  denyCancellation: () => void;
  handleWebSocketMessage: (msg: GenerationWebSocketMessage) => void;
  setWebSocketConnected: (connected: boolean) => void;
  resumeGeneration: () => void; // submits new batch for remaining recipients
}
```

### R4-5. Partial Failure Recovery

#### Overview

Tracks per-recipient success/failure with detailed failure reasons, allows retrying only the failed recipients, exports failed recipients as a CSV for offline correction, and supports resuming from the last successful recipient.

#### Per-Recipient Tracking

```typescript
interface RecipientGenerationResult {
  recipientId: string;
  recipient: Recipient;
  status: 'pending' | 'in_progress' | 'generated' | 'failed' | 'cancelled' | 'retried';
  certificateId?: string; // set on success
  failureReason?: string; // i18n key or raw error
  failureCategory?: 'template_error' | 'recipient_data' | 'pdf_render' | 'email_send' | 'storage' | 'unknown';
  retryCount: number;
  lastAttemptAt?: string;
  generatedAt?: string;
}
```

#### Failure Categories

Each failure is categorized for reporting:

| Category | i18n Namespace Key | Description |
|----------|-------------------|-------------|
| `template_error` | `certificates.generation.errors.template` | Template not found, corrupted, or variable resolution failure |
| `recipient_data` | `certificates.generation.errors.recipientData` | Missing required field, invalid email, etc. |
| `pdf_render` | `certificates.generation.errors.pdfRender` | PDF generation timeout, font missing, image fetch failure |
| `email_send` | `certificates.generation.errors.emailSend` | SMTP error, bounce, rate limit |
| `storage` | `certificates.generation.errors.storage` | Disk full, S3 upload failure, permission denied |
| `unknown` | `certificates.generation.errors.unknown` | Any uncategorized error |

#### UI — Failure Recovery Panel

Shown on the result screen (replacing the simple "Failed count" display in §B):

- **Failure summary card** (MUI `Card` with `sx={{ borderColor: 'error.main' }}`):
  - "N recipients failed" header
  - Breakdown by category (MUI `Chip` per category with count): `template_error: 2`, `pdf_render: 5`, `email_send: 3`
- **Failed recipients table** (MUI `Table`, scrollable — `sx={{ maxHeight: 400, overflowY: 'auto' }}`):
  - Columns: `#`, `Name`, `Email`, `Failure Category`, `Failure Reason`, `Retry Count`, `Actions`
  - Actions per row: "Retry This" `IconButton` (`ReplayOutlined`)
- **Bulk recovery actions** (MUI `Stack` with `direction="row"`, `spacing={2}`):
  - "Retry All Failed" `LoadingButton` — submits new batch job with only failed recipients
  - "Export Failed as CSV" `Button` — downloads CSV with `name, email, failure_category, failure_reason, retry_count`
  - "Resume from Last Success" `Button` — re-submits with all `pending` + `failed` recipients (skips `generated`)
  - "Skip Failed & Complete" `Button` — marks job as complete with partial results

#### Retry Logic

- Retry creates a new `batchJobId` with only failed recipients
- Retry count is tracked per recipient — max 3 retries (configurable in advanced settings)
- After max retries, recipient status changes to `failed_final` and is excluded from further retry buttons
- Retry jobs appear as separate entries in the queue (§R4-6)

#### Zustand Store Additions

```typescript
interface PartialFailureState {
  recipientResults: RecipientGenerationResult[];
  failureBreakdown: Record<FailureCategory, number>;
  maxRetries: number;
  isRetrying: boolean;

  updateRecipientResult: (recipientId: string, update: Partial<RecipientGenerationResult>) => void;
  getFailedRecipients: () => RecipientGenerationResult[];
  retryFailed: () => void;
  retrySingle: (recipientId: string) => void;
  exportFailed: () => void;
  resumeFromLastSuccess: () => void;
  skipFailedAndComplete: () => void;
}
```

### R4-6. Generation Queue Management

#### Overview

Allows queueing multiple generation jobs, assigning priority, viewing queue position, and managing the queue from an admin view. This is essential for organizations processing multiple certificate batches concurrently.

#### Queue Data Model

```typescript
interface GenerationJob {
  id: string;
  batchJobId: string;
  templateId: string;
  templateName: string;
  recipientCount: number;
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
  progress: { completed: number; failed: number; total: number };
  estimatedTimeSeconds?: number;
  position?: number; // queue position (1 = next)
  createdBy: string;
  error?: string;
}

type JobStatus = GenerationJob['status'];
type JobPriority = GenerationJob['priority'];
```

#### Component: `GenerationQueueDialog`

- **File**: `frontend/views/dashboard/cert/certificates/generate/GenerationQueueDialog.tsx`
- **Props**: `{ open: boolean; onClose: () => void }`
- Renders as a separate MUI `Dialog` accessible from the wizard footer: "Queue" `Button` with badge showing queue length.

#### Queue List UI

- MUI `Table` with columns: `#` (position), `Template`, `Recipients`, `Status`, `Priority`, `Est. Time`, `Actions`
- **Status chip** (MUI `Chip` with color by status):
  - `queued` → `sx={{ bgcolor: 'info.light' }}` "Queued"
  - `running` → `sx={{ bgcolor: 'warning.light' }}` "Running" (with spinner icon)
  - `paused` → `sx={{ bgcolor: 'grey.300' }}` "Paused"
  - `completed` → `sx={{ bgcolor: 'success.light' }}` "Completed"
  - `failed` → `sx={{ bgcolor: 'error.light' }}` "Failed"
  - `cancelled` → `sx={{ bgcolor: 'grey.200' }}` "Cancelled"
- **Priority selector**: inline MUI `Select` per row — changes priority; re-sorts queue on change
- **Actions per row** (MUI `IconButton`s):
  - `running` → `PauseOutlined` (pause job)
  - `paused` → `PlayArrowOutlined` (resume)
  - `queued` → `DeleteOutlined` (remove from queue)
  - `completed`/`failed` → `VisibilityOutlined` (view results)
  - Any → `ArrowUpwardOutlined` / `ArrowDownwardOutlined` (move position in queue)

#### Queue Admin View

- **Estimated time**: server provides `estimatedTimeSeconds` based on historical generation speed (avg ms per cert × recipient count)
- Displayed as relative time: "~3 min" (MUI `Typography` with `sx={{ fontStyle: 'italic' }}`)
- **Queue position** for running job: "Position 2 of 5" (updated via WebSocket)
- **Add to queue**: when user clicks "Generate Certificates" in Step 4, instead of immediately starting, job is added to queue. If queue is empty, it starts immediately. Otherwise it shows position.
- **"Start Now" override**: a `Button` in the queue dialog that moves a job to position 1 (high priority)

#### GraphQL Additions

```graphql
query GenerationQueue {
  certificateGenerationQueue {
    id
    batchJobId
    templateId
    templateName
    recipientCount
    status
    priority
    queuedAt
    startedAt
    completedAt
    progress { completed failed total }
    estimatedTimeSeconds
    position
    createdBy
  }
}

mutation UpdateJobPriority($jobId: ID!, $priority: JobPriority!) { ... }
mutation PauseJob($jobId: ID!) { ... }
mutation ResumeJob($jobId: ID!) { ... }
mutation RemoveJob($jobId: ID!) { ... }
mutation ReorderJob($jobId: ID!, $newPosition: Int!) { ... }
```

#### Zustand Store Additions

```typescript
interface GenerationQueueState {
  queue: GenerationJob[];
  queueDialogOpen: boolean;
  currentJobId: string | null;

  loadQueue: () => void;
  addToQueue: (job: Omit<GenerationJob, 'id' | 'queuedAt' | 'position' | 'status'>) => void;
  updateJobPriority: (jobId: string, priority: JobPriority) => void;
  pauseJob: (jobId: string) => void;
  resumeJob: (jobId: string) => void;
  removeJob: (jobId: string) => void;
  reorderJob: (jobId: string, newPosition: number) => void;
  setQueueDialogOpen: (open: boolean) => void;
  subscribeToQueueUpdates: () => void; // WebSocket subscription
}
```

### R4-7. Email Notification Toggle

#### Overview

Extends the "Send Email" option (§A, Step 4) into a full email notification flow: template selector, preview, scheduling, delivery tracking, and bounce handling.

#### Email Configuration (Step 4 Enhancement)

When "Send Email" `Switch` is toggled on, a new section appears:

- **Email Template Selector** (MUI `Select` populated from `emailTemplates` query — filtered by `type = 'certificate_notification'`)
- **Email Preview** (MUI `Dialog` or inline `Paper`):
  - Shows rendered email HTML using the first recipient's data
  - "Preview with recipient X" dropdown — cycle through recipients to verify variables render correctly
  - "Send test email to me" `Button` — sends a test to the current user's email
- **Send Later option** (MUI `Switch` — "Schedule email send"):
  - When on, shows MUI `DateTimePicker` for scheduled send time
  - Stores `scheduledSendAt: string | null` in options
- **Delivery tracking toggle** (MUI `Switch` — default on): when on, email delivery status is tracked per recipient

#### Delivery Tracking

After generation + email send, each recipient's result (§R4-5) includes email status:

```typescript
interface EmailDeliveryStatus {
  recipientId: string;
  status: 'pending' | 'sent' | 'delivered' | 'bounced' | 'failed' | 'opened';
  sentAt?: string;
  deliveredAt?: string;
  bouncedAt?: string;
  bounceReason?: string;
  openedAt?: string;
}
```

#### Bounce Handling

- On bounce notification (via webhook or polling): recipient result is updated with `emailStatus: 'bounced'` and `bounceReason`
- Bounced recipients appear in the failure recovery panel (§R4-5) under category `email_send`
- "Re-send email" `Button` appears for bounced recipients (re-sends without re-generating the certificate)

#### GraphQL Additions

```graphql
query EmailTemplates($type: EmailTemplateType) {
  emailTemplates(type: $type) {
    id
    name
    subject
    bodyPreview
  }
}

mutation SendTestEmail($templateId: ID!, $recipientEmail: String!) { ... }
mutation ResendEmail($certificateId: ID!) { ... }
```

#### Zustand Store Additions

```typescript
interface EmailNotificationState {
  sendEmail: boolean;
  emailTemplateId: string | null;
  emailPreviewOpen: boolean;
  previewRecipientIndex: number;
  sendLater: boolean;
  scheduledSendAt: string | null;
  trackDelivery: boolean;
  emailDeliveryStatuses: EmailDeliveryStatus[];

  setEmailTemplate: (templateId: string) => void;
  openEmailPreview: () => void;
  setPreviewRecipient: (index: number) => void;
  sendTestEmail: () => Promise<void>;
  setScheduledSend: (datetime: string | null) => void;
  updateEmailDeliveryStatus: (recipientId: string, status: Partial<EmailDeliveryStatus>) => void;
  resendEmail: (certificateId: string) => Promise<void>;
}
```

### R4-8. Validation Before Generation

#### Overview

A pre-flight check that runs before full generation starts. Checks template availability, variable coverage, image/font availability, and offers a preview of the first 3 certificates.

#### Pre-Flight Checks

Triggered when "Generate Certificates" button is clicked (Step 4), before actually starting generation:

1. **Template Status Check**: verify template still exists and is `active` (may have been deleted/archived since Step 1)
2. **Variable Coverage Check**: for each template variable, verify that every recipient has non-empty data for the mapped source. Reports any gaps.
3. **Image Availability Check**: if template uses background images or logos, verify URLs are reachable (HEAD request). Reports any broken images.
4. **Font Availability Check**: verify font files referenced in the template are available on the server. Reports missing fonts.

#### Pre-Flight Result Display

- MUI `Dialog` titled "Pre-Generation Validation"
- Shows checklist of checks with pass/fail icons:
  - ✅ Template status: Active
  - ✅ Variable coverage: 100% (all recipients have data for all variables)
  - ❌ Image availability: 1 of 2 images reachable (template_logo.png — 404 Not Found)
  - ✅ Font availability: All fonts available
- If any check fails with `severity: 'error'`: "Generate" button is disabled, "Fix Issues" button highlighted
- If checks pass but have warnings: "Generate" button enabled, warnings shown as non-blocking `Alert`

#### Certificate Preview (First 3)

- "Preview First 3 Certificates" `Button` (shown after pre-flight passes)
- Renders 3 certificate thumbnails (using the template renderer with recipient data for the first 3 recipients)
- Each thumbnail is a clickable `Card` that opens a full-size preview `Dialog`
- "Looks good — proceed to full generation" `Button` confirms and starts generation

#### Zustand Store Additions

```typescript
interface PreFlightCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string[];
}

interface PreFlightState {
  preFlightChecks: PreFlightCheck[];
  preFlightRunning: boolean;
  preFlightPassed: boolean;
  showPreviewDialog: boolean;
  previewCertificates: PreviewCertificate[];

  runPreFlightChecks: () => Promise<void>;
  setShowPreviewDialog: (show: boolean) => void;
  loadPreviewCertificates: () => Promise<void>;
}
```

### R4-9. Batch Size Control

#### Overview

Automatically batches large recipient lists into manageable chunks to avoid memory exhaustion and API rate limits. Provides configurable batch sizes, throttling, memory monitoring, and per-batch progress tracking.

#### Batch Strategy

```typescript
interface BatchConfig {
  mode: 'auto' | 'manual';
  batchSize: 100 | 500 | 1000 | number; // auto selects based on total count
  throttleMs: number; // delay between batches (default 100ms)
  maxMemoryMB: number; // abort if exceeded (default 500)
  batchTimeoutMs: number; // per-batch timeout (default 60000)
  pauseBetweenBatches: boolean; // require manual confirmation between batches
}

interface BatchGroup {
  index: number;
  startIndex: number;
  endIndex: number;
  recipientIds: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'timed_out';
  startedAt?: string;
  completedAt?: string;
  certificateIds: string[];
  error?: string;
}
```

#### Auto-Batch Sizing

| Total Recipients | Batch Size | Rationale |
|-------------------|------------|-----------|
| ≤ 100 | 100 | Single batch |
| 101–500 | 100 | Small batches for progress granularity |
| 501–1000 | 500 | Medium batches |
| > 1000 | 500 | Stay under memory limits |

#### UI — Batch Control Panel

Shown in the advanced settings `Accordion` (Step 4):

- **Batch mode** (MUI `ToggleButtonGroup`): "Auto" / "Manual"
- When manual: `Slider` for batch size (min 10, max 1000, step 10) + `TextField` for custom value
- **Throttle** (`TextField` with `type="number"`): ms between batches (default 100)
- **Memory limit** (`TextField` with `type="number"`): MB (default 500) — shows current memory usage `LinearProgress`
- **Batch timeout** (`TextField` with `type="number"`): ms (default 60000)
- **Pause between batches** (`Switch`): when on, after each batch completes, shows a "Continue to next batch?" dialog before proceeding

#### Progress View Enhancement

- Progress bar shows **dual levels**: overall progress + current batch progress
  - Overall: `LinearProgress variant="determinate"` — `(totalCompleted / totalRecipients) * 100`
  - Current batch: `LinearProgress variant="determinate" color="secondary"` — `(batchCompleted / batchSize) * 100`
- Batchelog panel (separate from main log): shows batch-level entries:
  - `[12:35:00] 📦 Batch 1/3 started (recipients 1-500)`
  - `[12:35:45] 📦 Batch 1/3 completed (498 generated, 2 failed)`
  - `[12:35:45] ⏸️ Pausing — click "Continue" to proceed to batch 2`

#### Memory Monitoring

- Client-side: `performance.memory?.usedJSHeapSize` (Chrome only) polled every 5s
- If memory exceeds `maxMemoryMB`: auto-pauses generation, shows `Alert` "Memory limit reached — pausing generation. Consider reducing batch size."
- Server-side: reported via WebSocket `cert:generation:memory` events

#### Zustand Store Additions

```typescript
interface BatchControlState {
  batchConfig: BatchConfig;
  batchGroups: BatchGroup[];
  currentBatchIndex: number;
  batchMemoryMB: number;
  pauseBetweenBatches: boolean;
  batchPaused: boolean;

  setBatchConfig: (config: Partial<BatchConfig>) => void;
  calculateBatches: () => void; // splits recipients into batch groups
  processNextBatch: () => void;
  pauseBatchProcessing: () => void;
  resumeBatchProcessing: () => void;
  updateBatchStatus: (index: number, status: BatchGroup['status']) => void;
  updateMemory: (mb: number) => void;
}
```

### R4-10. Accessibility

#### Overview

Ensures the entire wizard dialog is WCAG 2.1 AA compliant: ARIA roles for wizard steps, keyboard navigation through CSV preview tables, screen reader announcements for progress, and focus management on step transitions.

#### Wizard ARIA Structure

- **Wizard container**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="cert-gen-dialog-title"`
- **Stepper**: `role="tablist"`, each step `StepButton` has `role="tab"`, `aria-selected={activeStep === index}`, `aria-controls="cert-gen-step-content-{index}"`
- **Step content**: `role="tabpanel"`, `id="cert-gen-step-content-{index}"`, `aria-labelledby="cert-gen-step-label-{index}"`
- **Step labels**: `aria-label` on each `StepLabel` — e.g., "Step 1 of 4: Select Template"
- **Progress indicator**: `aria-label="Certificates generated: N of M"`, updated on each progress change

#### Keyboard Navigation

- **CSV preview table** (Step 2):
  - `tabindex="0"` on `<table>` element
  - Arrow keys navigate cells (Up/Down/Left/Right)
  - Enter to activate a cell (e.g., edit mode, or expand a duplicate group)
  - `aria-label` on each column header: "Column: Email, 5 rows"
  - `aria-rowcount` and `aria-colcount` on table
  - `aria-rowindex` on each `<tr>`, `aria-colindex` on each `<td>`
- **Wizard navigation**:
  - Tab moves focus through interactive elements in the current step
  - Steps are NOT tab-navigable (clicking or Enter on focused step label activates)
  - Ctrl+Left / Ctrl+Right keyboard shortcut for Back/Next

#### Screen Reader Announcements

- **Step changes**: `aria-live="polite"` region announces "Step 2 of 4: Recipient Selection"
- **Progress**: `aria-live="assertive"` region announces every 10% milestone: "20% complete — 200 of 1000 certificates generated"
- **Errors**: `aria-live="assertive"` for validation errors that block progression
- **Log entries**: MUI `Snackbar` with `role="status"` for major events (generation started, completed, failed)

#### Focus Management

- On step change (Next/Back): focus moves to the step content heading (`h2` with `tabindex="-1"`)
- On dialog open: focus moves to the first interactive element in Step 1 (template search `TextField`)
- On dialog close: focus returns to the element that triggered the dialog (the "Generate" button on the certificate list page)
- Trap focus within dialog (MUI `Dialog` handles this by default with `disableEnforceFocus={false}`)

#### Implementation Notes

- Use MUI v9's built-in `Stepper` `aria` props where available
- For custom table keyboard nav: add `onKeyDown` handler with a key map
- For `aria-live` regions: render a visually-hidden `Box` (`sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}`) that updates its text content
- Test with NVDA / VoiceOver during E2E (manual verification — not automated)

### R4-11. Error States

#### Overview

Comprehensive error handling for all failure modes: CSV parse errors, missing templates, recipient limits, disk space, and API rate limits. Each error has a clear, actionable message and recovery path.

#### Error Catalog

| Error | i18n Key | Severity | Recovery Action |
|-------|----------|----------|-----------------|
| CSV parse error at line N | `certificates.generation.errors.csvParse` | error | "Fix line N and re-upload" + highlight |
| Template not found | `certificates.generation.errors.templateNotFound` | error | "Go back to Step 1 and select a template" |
| Template archived since selection | `certificates.generation.errors.templateArchived` | error | "Template was archived — select another" |
| Recipient limit exceeded (> 10000) | `certificates.generation.errors.recipientLimit` | error | "Split into multiple batches" |
| Disk space insufficient | `certificates.generation.errors.diskSpace` | error | "Free up N MB and retry" |
| API rate limit hit | `certificates.generation.errors.rateLimit` | warning | "Auto-retrying in 60s" + countdown |
| WebSocket disconnected | `certificates.generation.errors.wsDisconnected` | warning | "Falling back to polling (2s interval)" |
| Session expired mid-generation | `certificates.generation.errors.sessionExpired` | error | "Re-authenticate — generation saved" |
| Network error during generation | `certificates.generation.errors.network` | warning | "Auto-retrying connection" |

#### CSV Parse Error with Line Number

- CSV parser catches syntax errors (unclosed quotes, malformed rows) and reports the line number
- UI shows: MUI `Alert` with `severity="error"`:
  - "CSV Parse Error: malformed quoted field on line 47"
  - Below: a code block showing the problematic line with line number prefix
  - "Download error log" `Button` — exports full parse log

#### Disk Space Check

- Pre-flight check (§R4-8) includes a disk space estimate:
  - `estimatedSizeMB = recipientCount * avgCertSizeKB / 1024`
  - `avgCertSizeKB` calculated from template's image/fonts (default 500KB)
- If `estimatedSizeMB > availableDiskMB`: blocks generation with error "Insufficient disk space (need ~500MB, 200MB available). Free up space or reduce recipient count."

#### API Rate Limit Handler

- When server returns HTTP 429 (rate limit):
  - Auto-pauses generation
  - Shows `Alert` with countdown: "Rate limited — auto-retrying in 60s" (MUI `Typography` with `sx={{ fontVariantNumeric: 'tabular-nums' }}`)
  - Countdown decrements every second
  - When countdown reaches 0: auto-resumes generation
  - If rate-limited 3+ times in one job: shows suggestion "Consider enabling batch throttle (§R4-9)"

#### Error Boundary

- Wrap the entire wizard in a React Error Boundary:
  - Catches unexpected render errors
  - Shows fallback UI: "Something went wrong. Your generation has been saved." + "Reload" `Button`
  - Logs error to backend via GraphQL `logFrontendError` mutation

### R4-12. Performance Budgets

#### Overview

Defines and enforces performance budgets for the generation dialog. Each operation has a target time/memory, and violations trigger warnings or auto-optimization.

#### Budget Table

| Operation | Budget | Measurement | Enforcement |
|-----------|--------|-------------|-------------|
| CSV parse (10000 rows) | < 2s | Client-side `performance.now()` | Warning if > 2s; suggest batch mode |
| Certificate generation | < 100ms per cert | Server-side timing | Auto-throttle if avg > 100ms |
| PDF render | < 3s per cert | Server-side timing | Auto-reduce DPI if > 3s |
| Memory usage (1000 certs) | < 500MB | `performance.memory` / WebSocket | Auto-pause if exceeding |
| Dialog open to interactive | < 1s | Client-side | Show skeleton loaders |
| Step transition | < 300ms | Client-side | Optimistic UI with fallback |
| WebSocket message latency | < 500ms | Round-trip time | Fall back to polling if > 500ms |

#### Performance Monitoring Component

- **Component**: `PerformanceMonitor` (invisible — renders `null`)
- **File**: `frontend/views/dashboard/cert/certificates/generate/PerformanceMonitor.tsx`
- Wraps critical operations and reports timing to the store

```typescript
interface PerformanceMetric {
  operation: string;
  durationMs: number;
  memoryMB?: number;
  timestamp: string;
  withinBudget: boolean;
}

interface PerformanceState {
  metrics: PerformanceMetric[];
  budgetViolations: PerformanceMetric[];

  recordMetric: (metric: Omit<PerformanceMetric, 'timestamp' | 'withinBudget'>) => void;
  checkBudget: (operation: string, value: number) => boolean;
  getAverageTime: (operation: string) => number;
  reportViolations: () => void;
}
```

#### Budget Violation UI

- When a budget is exceeded, a non-blocking `Snackbar` appears:
  - "⚠️ Performance: CSV parse took 3.2s (budget: 2s). Consider enabling batch mode for large files."
- Repeated violations (3+) escalate to a persistent `Alert` in the step header
- All violations recorded in store and included in the generation result report (for debugging)

#### Auto-Optimization Rules

1. If CSV parse > 2s for current file: auto-enable batch mode with size 500
2. If generation avg > 100ms/cert: auto-increase throttle to 200ms between batches
3. If PDF render > 3s: reduce DPI from 300 to 150 (with toast notification)
4. If memory > 400MB (80% of budget): preemptively pause before next batch

#### CSV Parse Performance

- Use Web Worker for CSV parsing (offloads from main thread):
  - Worker file: `frontend/views/dashboard/cert/certificates/generate/csvParseWorker.ts`
  - Posts parse result back via `postMessage`
  - Prevents UI freeze on large files
  - Shows inline parse progress: `LinearProgress variant="indeterminate"` with text "Parsing CSV..."

### R4-13. Round 4 State Integration Summary

All Round 4 state additions are consolidated into the existing `useGenerationStore` via slice composition. The store file (`frontend/stores/useGenerationStore.ts`) is extended with the new interfaces from R4-1 through R4-12, using Zustand's slice pattern to keep the single store file organized:

```typescript
// Structure of extended store
export const useGenerationStore = create<GenerationState>()((...args) => ({
  ...createBaseSlice(...args),        // Round 1-2 base state
  ...createWizardSlice(...args),      // Round 2-3 wizard state
  ...createCsvMappingSlice(...args),   // R4-1
  ...createDuplicateSlice(...args),   // R4-2
  ...createValidationSlice(...args),   // R4-3
  ...createCancellationSlice(...args), // R4-4
  ...createFailureRecoverySlice(...args), // R4-5
  ...createQueueSlice(...args),        // R4-6
  ...createEmailNotificationSlice(...args), // R4-7
  ...createPreFlightSlice(...args),    // R4-8
  ...createBatchControlSlice(...args), // R4-9
  ...createPerformanceSlice(...args),  // R4-12
}));
```

Each slice is defined in the same file (no separate files) to maintain single-store-same-file convention. Slices access shared state via the `get()` function and mutate via `set()`.

### R4-14. i18n Keys for Round 4

All new user-facing strings in Round 4 must use the compile-time translation system. New namespace additions:

```
shared/locale/
  en/
    certificates/
      generation-r4.ts   // Round 4 English translations
  ar/
    certificates/
      generation-r4.ts   // Round 4 Arabic translations
```

Key groups (non-exhaustive):

- `certificates.generation.csvMapping.*` — column mapping dialog labels, validation messages, auto-detect tooltips
- `certificates.generation.duplicates.*` — duplicate detection panel, resolution actions, export labels
- `certificates.generation.validation.*` — validation error messages (required, format, range), settings labels, export labels
- `certificates.generation.cancellation.*` — cancel confirmation dialog, cleanup messages, resume labels
- `certificates.generation.failures.*` — failure categories, retry actions, export labels
- `certificates.generation.queue.*` — queue dialog labels, status/priority names, estimated time
- `certificates.generation.email.*` — email notification labels, preview, scheduling, bounce messages
- `certificates.generation.preFlight.*` — pre-flight check names, results, preview labels
- `certificates.generation.batch.*` — batch control labels, batch log entries, memory warnings
- `certificates.generation.accessibility.*` — aria labels, screen reader announcements
- `certificates.generation.errors.*` — error catalog messages (expanded from Round 1)
- `certificates.generation.performance.*` — budget violation warnings, auto-optimization messages

All keys defined as typed functions in the type schema (`shared/locale/schema/`) and implemented in both `en` and `ar` locale files. Pluralization functions where applicable (e.g., `duplicateCount: (count: number) => string`).
