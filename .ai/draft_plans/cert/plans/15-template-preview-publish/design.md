# Plan 15 — Template Preview & Publishing: Design

## Document Info

| Field | Value |
|-------|-------|
| Plan ID | 15 |
| Title | Template Preview & Publishing |
| Status | Draft |
| Dependencies | Plan 5 (GraphQL API), Plan 6 (PDF Rendering — preview reference), Plan 11 (Visual Canvas — uses canvas elements) |
| Reference | `MASTER_ARCHITECTURE.md`, `cgvs_analysis/01-generation-logic.md`, `cgvs_analysis/04-template-ui.md`, `siraj_analysis/05-frontend-patterns.md`, `siraj_analysis/06-i18n-system.md` |

---

## 1. Architecture Overview

### 1.1 Data Flow

```
Template Editor (Plan 11)
    │
    ├──[Preview Button]──► Preview Modal Overlay
    │                          ├── Background Image Layer
    │                          ├── Element Rendering Layer (text, image, QR, barcode, data)
    │                          ├── Test Variable Input Panel
    │                          ├── Desktop: Zoom Controls + Pan
    │                          └── Mobile: Scaled-to-Width + Pinch Zoom
    │
    ├──[Publish Button]──► Publish Validation Service
    │                          ├── Check: element presence
    │                          ├── Check: variable defaults
    │                          ├── Check: data element references
    │                          ├── Check: valid dimensions
    │                          └── Check: duplicate element names (warning)
    │                          │
    │                          ▼ (if all pass)
    │                     Publish Confirmation Dialog
    │                          │
    │                          ▼ (confirm)
    │                     Publish Mutation (GraphQL)
    │                          ├── Service: createVersionSnapshot()
    │                          ├── Service: updateTemplateStatus("published")
    │                          ├── Service: invalidateRenderCache()
    │                          └── Apollo cache update
    │
    ├──[Archive Button]──► Archive Confirmation ──► Archive Mutation ──► Status = "archived"
    │
    ├──[Unarchive Button]──► Unarchive Confirmation ──► Unarchive Mutation ──► Status = "published"
    │
    └──[Version History]──► Version History Panel
                                ├── Query: template versions
                                ├── Display: version cards (number, date, elements, certs)
                                └── [Revert Button]──► Revert Confirmation ──► Revert Mutation
```

### 1.2 Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| Frontend Views | Preview modal components, publish/archive/revert dialogs, version history panel |
| Frontend Stores (Zustand) | Preview state (zoom level, test values, isPreviewOpen), publish dialog state |
| Frontend GraphQL | Publish, archive, revert mutation documents; version history query document |
| Backend Services | Publish validation, version snapshot creation, status transitions, cache invalidation |
| Backend Repositories | Version snapshot CRUD, template status update, certificate count aggregation |
| Backend GraphQL (Pothos) | Mutation resolvers for publish/archive/unarchive/revert; query resolver for version history |
| Backend Types | Version snapshot types, publish result types, validation result types |
| Shared/i18n | Translation keys for preview, publish, archive, revert, version history |

---

## 2. Design Decisions

### DD-01: Preview Rendering Approach — Client-Side React Components (NOT PDF)

**Decision**: The template preview renders React components positioned absolutely over the background image. It does NOT generate a PDF for preview purposes.

**Rationale**: PDF generation (Plan 6) is expensive and slow (involves server-side rendering, Puppeteer/headless browser). The preview needs to be interactive and update in real-time when test values change. Rendering React components client-side allows instant updates without server round-trips. The visual fidelity is sufficient for design verification — exact PDF rendering fidelity is only needed at generation time.

**Implications**:
- Element rendering uses CSS absolute positioning, matching the coordinate system used in Plan 11's canvas
- Text elements use CSS font-family, font-size, color, text-align
- QR/barcode elements use client-side generation libraries (same as Plan 11 canvas)
- Image elements use standard `<img>` tags
- Data elements behave like text elements but display resolved variable values
- The preview area has the same coordinate space as the template dimensions; zoom is achieved via CSS transform: scale()

---

### DD-02: Version Snapshot Storage — Separate `template_versions` Table with Deep Copy

**Decision**: Published versions are stored in a separate `template_versions` table. Each snapshot is a deep copy of the template's elements and variables into `template_version_elements` and `template_version_variables` tables.

**Rationale**: Storing snapshots in separate tables ensures immutability — editing the draft template's elements never affects published snapshots. A `previousVersionId` foreign key on `template_versions` creates the version chain. Separate element/variable tables prevent schema coupling between draft and published data.

**Implications**:
- Three new tables: `template_versions`, `template_version_elements`, `template_version_variables`
- `template_versions` has: id, templateId, versionNumber, previousVersionId, publishedAt, publishedBy, snapshot of template metadata (name, description, dimensions, backgroundImageUrl)
- `template_version_elements` mirrors the `template_elements` schema but is scoped to a version
- `template_version_variables` mirrors the `template_variables` schema but is scoped to a version
- Certificate records (Plan 16+) reference a `templateVersionId` to ensure they always point to an immutable snapshot
- The version chain allows traversing history: `current → previousVersionId → previousVersionId → ...`

---

### DD-03: Publish Validation — Collect-All Strategy (Not Fail-Fast)

**Decision**: All validation checks run in a single pass. All failures are collected and returned together. The user sees a complete list of issues, not just the first one.

**Rationale**: Templates can have multiple errors (missing elements, bad variable references, invalid dimensions). Showing all errors at once saves the user from repeated publish-attempt cycles. Optional checks (duplicate names) produce warnings alongside errors.

**Implications**:
- The validation service returns a `ValidationResult` type containing: `passed: boolean`, `errors: ValidationError[]`, `warnings: ValidationWarning[]`
- Each error/warning includes: check name, field path (element/variable identifier), i18n message key
- The frontend displays errors and warnings in a scrollable list before the publish dialog
- Publishing is blocked only if `errors.length > 0`; warnings do not block

---

### DD-04: Cache Invalidation — Fire-and-Forget via Service-Level Call

**Decision**: When a template is published, the publish service calls the render cache invalidation service (from Plan 6) in a fire-and-forget manner. The publish mutation does not wait for cache invalidation to complete.

**Rationale**: Cache invalidation may be slow (clearing Redis keys, file system caches). Making it synchronous would delay the publish response. The cache will eventually be consistent — certificates re-render on next access.

**Implications**:
- The publish service calls `invalidateTemplateRenders(templateId)` after committing the version snapshot
- The invalidation call is wrapped in a try/catch — failure to invalidate does not fail the publish
- A log entry is written if invalidation fails (for ops investigation)
- The mutation response includes a `cacheInvalidated: boolean` field so the frontend can warn if cache invalidation failed

---

### DD-05: Preview as Dedicated Page Route (with optional modal from editor)

**Decision**: The template preview is a **dedicated page route** at `app/(dashboard)/certificates/templates/[templateId]/preview/page.tsx`. An optional modal entry point remains in the template editor (Plan 11) that navigates to this page via `router.push`, but the preview page itself is a full standalone route.

**Rationale**: A dedicated page route follows the Siraj App Router convention (verified `app/(dashboard)/<domain>/page.tsx` pattern for all dashboard domains). It allows direct linking, bookmarking, and sharing of preview URLs. The editor's in-memory state is preserved by using `router.push` which does not unmount the editor route. The preview page reads template data from Apollo cache (populated by the editor's query) or falls back to a fresh query if accessed directly.

**Implications**:
- The preview page route: `app/(dashboard)/certificates/templates/[templateId]/preview/page.tsx`
- The page is a Server Component that checks auth + permissions, then renders `PreviewContainer`
- `PreviewContainer` (client component) fetches template data via Apollo `useQuery` with `cache-first` policy (hits editor's cached data, falls back to network)
- The editor (Plan 11) "Preview" button uses `router.push` to navigate to the preview page (no modal unless explicitly opted in)
- The test-variable panel uses the preview Zustand store (separate from the editor canvas store)
- On mobile, the preview page uses a full-screen layout with the preview on top and sample data as a collapsible bottom sheet
- The page's back navigation returns to the template editor via `router.back()` or a "Back to Editor" button

**Dual entry modes**:
| Entry | Mechanism | Data source |
|-------|-----------|-------------|
| From editor toolbar | `router.push("/certificates/templates/[id]/preview")` | Apollo cache → network fallback |
| Direct URL access | Server Component renders `PreviewContainer` | Apollo `cache-first` → network |

**Modal fallback (retained for inline quick-preview)**: The editor may optionally also render an inline modal preview that reads directly from the Zustand canvas store (for instant unsaved-draft preview). This modal is a lightweight wrapper that reuses the shared `CertificatePreviewCanvas` component but does NOT include the full sample data panel or publish toolbar — those live on the dedicated page only.

---

### DD-06: Revert Does NOT Create a New Version — It Modifies the Draft

**Decision**: Reverting to a previous version loads that version's content into the current draft. It does NOT create a new published version. The published version chain remains unchanged until the next explicit publish.

**Rationale**: Revert is a "restore draft from snapshot" operation, not a "publish from snapshot" operation. Conflating revert with publish would inflate version numbers and create confusing history. The user reverts to get a starting point, makes edits, then explicitly publishes when ready.

**Implications**:
- The revert mutation copies `template_version_elements` and `template_version_variables` back into `template_elements` and `template_variables` (replacing current draft content)
- The template's `status` field is not changed by revert
- The `sourceVersionId` field on the template record is updated to track which version the draft was reverted from
- The user must explicitly publish to create a new version

---

### DD-07: Desktop vs Mobile Preview — Responsive Rendering with Different Interaction Models

**Decision**: The preview component renders responsively. Desktop uses a zoomable, pannable canvas. Mobile scales-to-fit-width with pinch-to-zoom and vertical scroll.

**Rationale**: Desktop users have large screens and precise input (mouse) for zoom/pan. Mobile users have limited screen width and touch input. Forcing the same interaction model on both would be suboptimal.

**Implications**:
- The shared `TemplatePreview` component contains the rendering logic (background image + elements)
- A `DesktopPreviewContainer` wraps it with zoom controls and a pannable viewport
- A `MobilePreviewContainer` wraps it with CSS scale-to-fit and touch gesture handlers
- Both share the same `PreviewElementRenderer` for element rendering
- The test-variable panel is a right sidebar on desktop and a bottom sheet on mobile

---

### DD-08: Version History Query — GraphQL Query with Aggregated Certificate Count

**Decision**: The version history is fetched via a GraphQL query that returns all versions for a template, each with an aggregated count of certificates generated from that version.

**Rationale**: The certificate count per version requires a JOIN/aggregate with the certificates table. Doing this in a single query avoids N+1 problems. The query uses DataLoader batching (per template) to avoid over-fetching.

**Implications**:
- The `templateVersions` query returns: versionNumber, publishedAt, publishedBy (name), elementCount, variableCount, certificateCount
- `certificateCount` is computed via a subquery (COUNT of certificates WHERE templateVersionId = version.id)
- The query accepts `templateId` as input
- FetchPolicy: `cache-first` (versions are immutable — cache is always valid)

---

## 3. Complete File Scaffold

### 3.0.1 Tier-Isolated File Structure

Per the Siraj mobile/desktop isolation architecture (`frontend/views/AGENTS.md`, `frontend/common/views/AGENTS.md`), the preview & publish feature follows the three-tier structure with `cert-preview` as the domain folder name.

**Tier-neutral (shared):** `frontend/common/views/dashboard/cert-preview/`
```
previewContainer.tsx              # Container: auth/permission gate, calls ViewModel, passes to ResponsiveViewSwitch
previewView.tsx                   # Switcher: createLazyView + ResponsiveViewSwitch
usePreviewViewModel.ts            # ViewModel hook: ALL business logic (Apollo queries, store, handlers, translations)
types/
  preview.types.ts                # PreviewViewLabels, SampleRecipient, PreviewMode, ZoomState types
  previewLabelTypes.ts             # Label section types (shell, toolbar, sampleData, publishDialog, versionHistory)
schemas/
  publishSchema.ts                 # Zod schema for publish form validation (versionNotes)
utils/
  sampleDataResolver.ts            # Resolves template variables against sample data → display values
  previewElementRenderer.ts        # Renders element by type using sample data (shared with canvas)
  versionUtils.ts                  # Version display formatting, certificate count formatting
hooks/
  usePreviewZoom.ts                # Zoom/pan state hook (desktop: CSS transform, mobile: pinch)
  useSampleData.ts                 # Sample recipient selection + custom data management
components/
  CertificatePreviewCanvas.tsx    # Renders template background + elements with applied sample data
  PreviewElementRenderer.tsx       # Renders a single element by type (text, image, QR, data, shape)
  SampleDataPanel.tsx              # Side panel: recipient dropdown + variable form (tier-neutral layout)
  PublishDialog.tsx                 # Publish confirmation dialog with validation summary
  VersionHistory.tsx                # Version history list with preview/revert actions
  PreviewToolbar.tsx                # Top toolbar: zoom, download, publish, version history buttons
  DownloadPreviewButton.tsx         # Downloads preview as PDF or image
  VersionHistoryItem.tsx            # Single version row (version number, date, counts, actions)
  EmptyTemplateState.tsx            # Empty-state message when template has no elements
  NoVariablesState.tsx              # State when template has no variables
  PublishValidationResults.tsx     # Validation errors + warnings list
  PublishSummary.tsx               # Template summary (name, dimensions, element/variable counts)
  RevertDialog.tsx                  # Revert confirmation dialog
  ArchiveDialog.tsx                 # Archive confirmation dialog
  UnarchiveDialog.tsx              # Unarchive confirmation dialog
```

**Desktop-specific:** `frontend/desktop/views/dashboard/cert-preview/`
```
preview.desktop.tsx               # Desktop view: split layout (left canvas, right panel), top toolbar
components/
  DesktopZoomControls.tsx          # Zoom in/out/fit/actual display (toolbar sub-component)
  DesktopSampleDataPanel.tsx        # Right sidebar for sample data (recipient dropdown + variables)
  DesktopVersionDrawer.tsx          # Version history as right drawer
```

**Mobile-specific:** `frontend/mobile/views/dashboard/cert-preview/`
```
preview.mobile.tsx                # Mobile view: full-width canvas, bottom sheet, floating bar
components/
  MobileSampleDataSheet.tsx        # Collapsible bottom sheet for sample data
  MobileVersionDialog.tsx          # Version history in dialog
  MobileFloatingBar.tsx            # Floating action bar (publish, version history)
```

**Zustand store:** `frontend/common/stores/certPreviewStore.ts`

**GraphQL documents:** `frontend/common/graphql/sharedDocuments/certificates/preview.documents.ts`
- Re-exported from `frontend/common/graphql/sharedDocuments/certificates/index.ts` barrel

**i18n namespace:** `shared/locale/{types,namespaces,ar,en}/dashboard/certificatePreview/`
- Translation handle: `Translation.Dashboard.CertificatePreview`
- Server access: `getTranslations(locale).dashboardTranslations.certificatePreview`
- Client hook: `useAppTranslation(Translation.Dashboard.CertificatePreview)`
- GraphQL resolver access: `ctx.t().dashboardTranslations.certificatePreview`

**App Router page:** `app/(dashboard)/certificates/templates/[templateId]/preview/page.tsx`
- Server Component: auth check, permission check (`CertificateTemplateView` for preview, `CertificateTemplatePublish` for publish action), metadata generation, renders `PreviewContainer`
- Receives `templateId` from dynamic route params

**Backend types (if owned by this plan):** `backend/types/templateVersion.types.ts`
- `TemplateVersionSelectType`, `TemplateVersionInsertType`, `TemplateVersionReturnType`
- `PublishResultType`, `ValidationResultType`, `ValidationErrorType`, `ValidationWarningType`

**Shared shared-documents file:** `frontend/common/graphql/sharedDocuments/certificates/preview.documents.ts`
- `PublishTemplateMutationDocument`
- `ArchiveTemplateMutationDocument`
- `UnarchiveTemplateMutationDocument`
- `RevertTemplateMutationDocument`
- `TemplateVersionsQueryDocument`
- `TemplateForPreviewQueryDocument` (template + elements + variables in a single query for preview page)

### 3.0.2 Approved Instruction/AGENTS Mapping per File

| File Path Pattern | AGENTS.md Files | Instruction Files |
|---|---|---|
| `app/(dashboard)/certificates/templates/[templateId]/preview/page.tsx` | `app/AGENTS.md`, root `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| `frontend/common/views/dashboard/cert-preview/**` | `frontend/common/views/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| `frontend/{desktop,mobile}/views/dashboard/cert-preview/**` | `frontend/{desktop,mobile}/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| `frontend/common/stores/certPreviewStore.ts` | `frontend/common/stores/AGENTS.md`, `frontend/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| `frontend/common/graphql/sharedDocuments/certificates/preview.documents.ts` | `frontend/common/graphql/sharedDocuments/AGENTS.md`, `frontend/common/graphql/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| `shared/locale/.../certificatePreview/` | `shared/AGENTS.md` | — |
| `backend/types/templateVersion.types.ts` | `backend/types/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| `backend/services/.../templatePublish.service.ts` | `backend/services/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| `backend/db/repo/.../templateVersion.repository.ts` | `backend/db/repo/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |

---

## 3. Interface Contracts

### 3.1 GraphQL Documents

| Document Name | Type | File | Description |
|---------------|------|------|-------------|
| `TemplateForPreviewQueryDocument` | Query | `frontend/common/graphql/sharedDocuments/certificates/preview.documents.ts` | Fetches a single template with elements + variables for preview rendering (uses `cache-first`) |
| `PublishTemplateMutationDocument` | Mutation | same | Publishes a template: validates, creates version snapshot, transitions to published |
| `ArchiveTemplateMutationDocument` | Mutation | same | Archives a published template |
| `UnarchiveTemplateMutationDocument` | Mutation | same | Unarchives an archived template |
| `RevertTemplateMutationDocument` | Mutation | same | Reverts draft to a previous version snapshot |
| `TemplateVersionsQueryDocument` | Query | same | Fetches version history for a template |

All documents are re-exported from the `frontend/common/graphql/sharedDocuments/certificates/index.ts` barrel.

#### Query: TemplateForPreview

**Input**: `TemplatePreviewQueryInput`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| templateId | ID (UUID) | Yes | The template to preview |
| includeVersionId | ID (UUID) | No | If provided, fetches the template at a specific published version (for version history preview). Otherwise fetches the current draft. |

**Output**: Template type with nested elements, variables, and background — same shape as the template query from Plan 10 but optimized for preview (includes `previewValue` for variables, all element content fields).

**FetchPolicy**: `cache-first` — the editor (Plan 11) already has this template cached from its own query. Direct URL access falls back to network.

#### Mutation: PublishTemplate

**Input**: `PublishTemplateInput`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| templateId | ID (UUID) | Yes | The template to publish |

**Output**: `PublishTemplatePayload`
| Field | Type | Description |
|-------|------|-------------|
| success | Boolean | Whether publish succeeded |
| versionNumber | Int | The new version number |
| errors | `[ValidationError]` | Validation errors (if any) |
| warnings | `[ValidationWarning]` | Validation warnings (if any) |
| cacheInvalidated | Boolean | Whether render cache was invalidated |

**Error handling**: Mutation returns `success: false` with populated `errors` array if validation fails. Throws GraphQL error only for infrastructure failures (DB down, etc.).

#### Mutation: ArchiveTemplate

**Input**: `ArchiveTemplateInput`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| templateId | ID (UUID) | Yes | The template to archive |

**Output**: `ArchiveTemplatePayload`
| Field | Type | Description |
|-------|------|-------------|
| success | Boolean | Whether archive succeeded |
| template | TemplateType | Updated template with `status: "archived"` |

#### Mutation: UnarchiveTemplate

**Input**: `UnarchiveTemplateInput`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| templateId | ID (UUID) | Yes | The template to unarchive |

**Output**: `UnarchiveTemplatePayload`
| Field | Type | Description |
|-------|------|-------------|
| success | Boolean | Whether unarchive succeeded |
| template | TemplateType | Updated template with `status: "published"` |

#### Mutation: RevertTemplate

**Input**: `RevertTemplateInput`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| templateId | ID (UUID) | Yes | The template to revert |
| versionId | ID (UUID) | Yes | The version to revert to |

**Output**: `RevertTemplatePayload`
| Field | Type | Description |
|-------|------|-------------|
| success | Boolean | Whether revert succeeded |
| sourceVersionNumber | Int | The version number reverted from |

#### Query: TemplateVersions

**Input**: `TemplateVersionsQueryInput`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| templateId | ID (UUID) | Yes | Fetch versions for this template |

**Output**: `TemplateVersionsPayload`
| Field | Type | Description |
|-------|------|-------------|
| versions | `[TemplateVersionType]` | List of published versions, newest first |

**`TemplateVersionType` fields**:
| Field | Type | Description |
|-------|------|-------------|
| id | ID | Version snapshot ID |
| versionNumber | Int | Version number (1, 2, 3...) |
| publishedAt | DateTime | When this version was published |
| publishedBy | String | Name of user who published |
| elementCount | Int | Number of elements in this version |
| variableCount | Int | Number of variables in this version |
| certificateCount | Int | Number of certificates generated from this version |
| previousVersionId | ID | Previous version in the chain (null for v1) |

**FetchPolicy**: `cache-first` — versions are immutable, cache is always valid.

---

### 3.2 Zustand Store: `useCertPreviewStore`

**Purpose**: Holds preview-specific state (separate from the editor canvas store from Plan 11). Created with `create` (NO `persist` — ephemeral session state per `frontend/common/stores/AGENTS.md`). Types imported from `frontend/common/graphql/generated/gql/graphql-types.ts`.

| State Field | Type | Initial Value | Description |
|-------------|------|---------------|-------------|
| isPreviewOpen | boolean | false | Whether the preview is active (modal mode from editor) |
| testValues | `Record<string, string>` | {} | Map of **variableId** → test value (keyed by stable variable id, NOT name — per SWE review risk mitigation) |
| selectedSampleRecipientId | `string \| null` | null | Currently selected sample recipient ID (from dropdown) |
| zoomLevel | number | 100 | Current zoom percentage (10–200) |
| isFitToScreen | boolean | true | Whether preview is in fit-to-screen mode |
| previewMode | `"draft" \| "version"` | `"draft"` | Whether previewing current draft or a published version snapshot |
| previewVersionId | `string \| null` | null | Version ID when previewMode is `"version"` |
| downloadFormat | `"pdf" \| "image"` | `"pdf"` | Selected download format |

| Action | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| openPreview | none | void | Sets isPreviewOpen to true, initializes testValues from variables' previewValue |
| closePreview | none | void | Sets isPreviewOpen to false, clears testValues |
| setTestValue | `(variableId: string, value: string)` | void | Updates testValues[variableId] |
| setSampleRecipient | `(recipientId: string)` | void | Sets selectedSampleRecipientId, loads recipient data into testValues |
| setZoomLevel | `(level: number)` | void | Clamps to 10–200, sets zoomLevel, sets isFitToScreen to false |
| zoomIn | none | void | Increments zoomLevel by 10 (max 200) |
| zoomOut | none | void | Decrements zoomLevel by 10 (min 10) |
| fitToScreen | `(containerWidth: number, templateWidth: number)` | void | Calculates scale = containerWidth / templateWidth * 100, sets zoomLevel, sets isFitToScreen to true |
| actualSize | none | void | Sets zoomLevel to 100, sets isFitToScreen to false |
| setPreviewMode | `(mode: "draft" \| "version", versionId?: string)` | void | Switches between draft and version preview |
| setDownloadFormat | `(format: "pdf" \| "image")` | void | Sets download format for preview download |
| resetPreviewState | none | void | Clears all state to initial values |

---

### 3.3 Zustand Store: `useCertPublishStore`

**Purpose**: Holds publish/archive/revert dialog and workflow state. Created with `create` (NO `persist` — ephemeral). Types imported from `frontend/common/graphql/generated/gql/graphql-types.ts`.

| State Field | Type | Initial Value | Description |
|-------------|------|---------------|-------------|
| isPublishDialogOpen | boolean | false | Publish confirmation dialog visibility |
| isArchiveDialogOpen | boolean | false | Archive confirmation dialog visibility |
| isUnarchiveDialogOpen | boolean | false | Unarchive confirmation dialog visibility |
| isRevertDialogOpen | boolean | false | Revert confirmation dialog visibility |
| revertTargetVersion | `TemplateVersionType \| null` | null | The version selected for revert (imported type from `graphql-types.ts`) |
| isVersionHistoryOpen | boolean | false | Version history panel/drawer/dialog visibility |
| publishLoading | boolean | false | Publish mutation in flight |
| archiveLoading | boolean | false | Archive mutation in flight |
| revertLoading | boolean | false | Revert mutation in flight |
| versionNotes | string | "" | Version notes input from publish dialog (what changed in this version) |
| versionPreviewingId | `string \| null` | null | Version ID being previewed in read-only mode (null = draft) |

| Action | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| openPublishDialog | none | void | Opens publish dialog, clears versionNotes |
| closePublishDialog | none | void | Closes publish dialog |
| openArchiveDialog | none | void | Opens archive dialog |
| closeArchiveDialog | none | void | Closes archive dialog |
| openUnarchiveDialog | none | void | Opens unarchive dialog |
| closeUnarchiveDialog | none | void | Closes unarchive dialog |
| openRevertDialog | `(version: TemplateVersionType)` | void | Opens revert dialog with target version |
| closeRevertDialog | none | void | Closes revert dialog |
| openVersionHistory | none | void | Opens version history panel/drawer |
| closeVersionHistory | none | void | Closes version history panel/drawer |
| setPublishLoading | `(loading: boolean)` | void | Sets publish loading state |
| setArchiveLoading | `(loading: boolean)` | void | Sets archive loading state |
| setRevertLoading | `(loading: boolean)` | void | Sets revert loading state |
| setVersionNotes | `(notes: string)` | void | Sets version notes text |
| setVersionPreviewing | `(versionId: string \| null)` | void | Sets which version is being previewed (null = draft mode) |
| resetPublishState | none | void | Clears all publish state to initial |

---

### 3.4 ViewModel Hook: `usePreviewViewModel`

**Purpose**: Unified ViewModel that encapsulates ALL business logic for the preview & publish page — data fetching, sample data management, zoom, publish/archive/revert workflow, version history, and translation loading. This follows `frontend/common/views/AGENTS.md` Rule 7 — handlers stay top-level, copy grouped under `labelsBySection`.

**Props**: `{ templateId: string }` (from route params)

**Returns**: `PreviewViewModel` (flat plain object — same interface for both tiers)

#### Top-level state & handlers

| Field | Type | Description |
|-------|------|-------------|
| template | `TemplateType \| null` | The template being previewed (from Apollo query or editor cache) |
| templateLoading | boolean | Template query loading |
| templateError | `ApolloError \| null` | Template query error |
| elements | `TemplateElementType[]` | Template elements to render |
| variables | `TemplateVariableType[]` | Template variables for sample data panel |
| backgroundImageUrl | `string \| null` | Background image URL |
| templateWidth | number | Template width in px |
| templateHeight | number | Template height in px |
| templateStatus | `TemplateStatus` | Current template status (draft/published/archived) |
| previewMode | `"draft" \| "version"` | Preview mode (draft or specific version) |
| zoomLevel | number | Current zoom level |
| isFitToScreen | boolean | Fit-to-screen mode |
| downloadFormat | `"pdf" \| "image"` | Download format |
| selectedSampleRecipientId | `string \| null` | Selected sample recipient |
| testValues | `Record<string, string>` | Current test values keyed by variableId |
| draftHasUnsavedChanges | boolean | Whether the editor has unsaved changes (read from certCanvasStore.isDirty) |
| canPublish | boolean | Whether the user has `CertificateTemplatePublish` permission (from `useUserStore`) |
| canManage | boolean | Whether the user has `CertificateTemplateManage` permission |
| publishDialogOpen | boolean | Publish dialog visibility |
| archiveDialogOpen | boolean | Archive dialog visibility |
| unarchiveDialogOpen | boolean | Unarchive dialog visibility |
| revertDialogOpen | boolean | Revert dialog visibility |
| versionHistoryOpen | boolean | Version history panel visibility |
| versions | `TemplateVersionType[]` | Version history data |
| versionsLoading | boolean | Version history query loading |
| revertTargetVersion | `TemplateVersionType \| null` | Target version for revert |
| publishLoading | boolean | Publish mutation in flight |
| archiveLoading | boolean | Archive mutation in flight |
| revertLoading | boolean | Revert mutation in flight |
| validationResults | `ValidationResultType \| null` | Validation results from pre-publish check |
| versionNotes | string | Version notes input |

#### Actions (handlers — top-level on ViewModel)

| Action | Type | Description |
|-------|------|-------------|
| actions.zoomIn | `() => void` | Zoom in by 10% |
| actions.zoomOut | `() => void` | Zoom out by 10% |
| actions.fitToScreen | `(containerWidth: number) => void` | Fit to screen width |
| actions.actualSize | `() => void` | Reset to 100% zoom |
| actions.setTestValue | `(variableId: string, value: string) => void` | Set test value for a variable |
| actions.selectSampleRecipient | `(recipientId: string) => void` | Select sample recipient, load their data into testValues |
| actions.resetSampleData | `() => void` | Reset test values to previewValue defaults |
| actions.setDownloadFormat | `(format: "pdf" \| "image") => void` | Set download format |
| actions.downloadPreview | `() => Promise<void>` | Trigger download (PDF via server endpoint or image via canvas screenshot) |
| actions.setPreviewMode | `(mode: "draft" \| "version", versionId?: string) => void` | Switch preview between draft and version |
| actions.openPublishDialog | `() => void` | Opens publish dialog, runs client-side pre-validation, warns if unsaved changes |
| actions.confirmPublish | `() => Promise<void>` | Executes publish mutation with idempotency key, handles both `error` and `success: false` paths |
| actions.closePublishDialog | `() => void` | Closes publish dialog |
| actions.setVersionNotes | `(notes: string) => void` | Sets version notes text |
| actions.openArchiveDialog | `() => void` | Opens archive dialog |
| actions.confirmArchive | `() => Promise<void>` | Executes archive mutation |
| actions.openUnarchiveDialog | `() => void` | Opens unarchive dialog |
| actions.confirmUnarchive | `() => Promise<void>` | Executes unarchive mutation |
| actions.openRevertDialog | `(version: TemplateVersionType) => void` | Opens revert dialog with target version |
| actions.confirmRevert | `() => Promise<void>` | Executes revert mutation, then refetches draft data |
| actions.openVersionHistory | `() => void` | Opens version history panel/drawer |
| actions.closeVersionHistory | `() => void` | Closes version history |
| actions.previewVersion | `(versionId: string) => void` | Switches preview to a specific published version (read-only) |
| actions.backToDraftPreview | `() => void` | Returns preview to current draft |

#### `labelsBySection` (translation copy — grouped per Rule 7)

| Section | Contents |
|---------|----------|
| `labelsBySection.shell` | `pageTitle`, `pageSubtitle`, `backToEditor`, `emptyMessage` |
| `labelsBySection.toolbar` | `zoomIn`, `zoomOut`, `fitToScreen`, `actualSize`, `zoomLevel`, `downloadPdf`, `downloadImage`, `publish`, `versionHistory`, `archive`, `unarchive` |
| `labelsBySection.sampleData` | `title`, `selectRecipient`, `customData`, `variableName`, `testValue`, `testValuePlaceholder`, `noVariables`, `resetToDefaults`, `recipientName` |
| `labelsBySection.previewCanvas` | `loadingPreview`, `rendering`, `previewError`, `noBackgroundImage`, `emptyTemplate`, `versionPreview` |
| `labelsBySection.publishDialog` | `title`, `confirmTitle`, `confirmMessage`, `summary`, `elementCount`, `variableCount`, `dimensions`, `version`, `versionNotesLabel`, `versionNotesPlaceholder`, `warningReRender`, `warningUnsavedChanges`, `success`, `failed`, `cacheInvalidationFailed`, `confirm`, `cancel` |
| `labelsBySection.validation` | `title`, `passed`, `failed`, `noElements`, `missingDefaultValue`, `invalidVariableRef`, `invalidDimensions`, `duplicateNames` |
| `labelsBySection.archive` | `title`, `button`, `confirmTitle`, `confirmMessage`, `success`, `failed` |
| `labelsBySection.unarchive` | `button`, `confirmTitle`, `confirmMessage`, `success`, `failed` |
| `labelsBySection.revert` | `title`, `button`, `confirmTitle`, `confirmMessage`, `success`, `failed`, `certsNotAffectedWarning` |
| `labelsBySection.versionHistory` | `title`, `versionNumber`, `publishedDate`, `publishedBy`, `elementCount`, `certificateCount`, `noVersions`, `currentVersion`, `preview`, `revert` |
| `labelsBySection.notifications` | `publishSuccess`, `publishFailed`, `archiveSuccess`, `archiveFailed`, `unarchiveSuccess`, `unarchiveFailed`, `revertSuccess`, `revertFailed` |

---

### 3.5 Backend Types

#### `TemplateVersionSelectType` (database select type)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Version snapshot ID |
| templateId | UUID | Parent template ID |
| versionNumber | Int | Version number (starts at 1) |
| previousVersionId | UUID \| null | Previous version in chain |
| name | string | Snapshot of template name |
| description | string \| null | Snapshot of template description |
| width | Int | Snapshot of template width |
| height | Int | Snapshot of template height |
| backgroundImageUrl | string \| null | Snapshot of background image URL |
| publishedAt | DateTime | When published |
| publishedById | UUID | Who published |

#### `TemplateVersionReturnType` (GraphQL/API return type)

| Field | Type | Description |
|-------|------|-------------|
| id | ID | Version snapshot ID |
| versionNumber | Int | Version number |
| publishedAt | DateTime | Publish timestamp |
| publishedBy | string | Publisher's display name |
| elementCount | Int | Count of elements in snapshot |
| variableCount | Int | Count of variables in snapshot |
| certificateCount | Int | Count of certificates from this version |
| previousVersionId | ID \| null | Previous version ID in chain |

#### `ValidationResultType`

| Field | Type | Description |
|-------|------|-------------|
| passed | boolean | True if no errors (warnings allowed) |
| errors | `ValidationErrorType[]` | Blocking errors |
| warnings | `ValidationWarningType[]` | Non-blocking warnings |

#### `ValidationErrorType`

| Field | Type | Description |
|-------|------|-------------|
| checkName | string | Machine-readable check identifier |
| fieldPath | string | Element/variable identifier at fault |
| messageKey | string | i18n translation key |
| messageParams | `Record<string, unknown>` | Interpolation parameters |

---

### 3.6 Backend Service Interface: `TemplatePublishService`

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| validateForPublish | `(templateId: UUID, tx: Transaction)` | `ValidationResultType` | Runs all validation checks |
| publish | `(templateId: UUID, userId: UUID, tx: Transaction)` | `PublishResult` | Creates snapshot, transitions status, invalidates cache |
| archive | `(templateId: UUID, tx: Transaction)` | `TemplateReturnType` | Transitions to archived |
| unarchive | `(templateId: UUID, tx: Transaction)` | `TemplateReturnType` | Transitions to published |
| revertToVersion | `(templateId: UUID, versionId: UUID, tx: Transaction)` | `RevertResult` | Loads snapshot into draft |
| getVersionHistory | `(templateId: UUID, tx: Transaction)` | `TemplateVersionReturnType[]` | Returns all versions |

---

## 4. Component Hierarchy

### 4.1 Overview

```
PreviewContainer (frontend/common/views/dashboard/cert-preview/previewContainer.tsx)
└── usePreviewViewModel(templateId) — single unified ViewModel
└── PreviewView (switcher — frontend/common/views/dashboard/cert-preview/previewView.tsx)
    ├── PreviewDesktopView (if md+)
    └── PreviewMobileView (if <md)
```

### 4.2 Container: `PreviewContainer`

**File**: `frontend/common/views/dashboard/cert-preview/previewContainer.tsx`

**Purpose**: Server Component child rendered by the App Router page. Calls `usePreviewViewModel({ templateId })`, passes the result to `PreviewView` (the switcher).

**Props Interface**:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| templateId | string | yes | Template ID from route params |

**Behavior**:
- Receives `templateId` as prop (cannot be async client component anyway)
- Calls `usePreviewViewModel({ templateId })` to build plain ViewModel object
- Passes ViewModel as single `vm` prop to `PreviewView`
- No `useAppTranslation` call here — ViewModel already builds `labelsBySection`

### 4.3 Switcher: `PreviewView`

**File**: `frontend/common/views/dashboard/cert-preview/previewView.tsx`

**Props Interface**:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| vm | `PreviewViewModel` | yes | Full ViewModel object from `usePreviewViewModel` |

**Behavior**:
- Calls `useMediaQuery('(min-width:768px)')` (or theme breakpoint) for desktop/mobile switch
- Renders `<PreviewDesktopView vm={vm} />` or `<PreviewMobileView vm={vm} />`
- No other logic — pure switcher (per `AGENTS.md` rule)

### 4.4 Shared Sub-Components (used by both desktop and mobile)

**Location**: `frontend/common/views/dashboard/cert-preview/components/`

#### 4.4.1 `CertificatePreviewCanvas`

Renders the template as it will appear when issued, with sample recipient data resolved into all variable placeholders. This is the core visual rendering component.

**Props Interface**:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| elements | `TemplateElementType[]` | yes | Elements array from template draft or version |
| backgroundImageUrl | `string \| null` | yes | Background image URL |
| width | number | yes | Canvas width in px |
| height | number | yes | Canvas height in px |
| testValues | `Record<string, string>` | yes | Sample values keyed by variableId |
| zoomLevel | number | yes | Render zoom (1 = 100%) |
| labels | `PreviewCanvasLabels` | yes | Translation labels from ViewModel |
| loading | boolean | no | Show skeleton while loading |
| error | `ApolloError \| null` | no | Show error state |
| empty | boolean | no | Empty template state (no elements) |
| readOnly | boolean | no | Disable interactive affordances when previewing a historical version |

**Internal Structure**:
- Renders to a scrollable viewport (`PannableViewport`) on desktop, CSS-scaled container on mobile (parent provides)
- Background image as `position: absolute; inset: 0; object-fit: contain` layer
- Each element rendered absolutely positioned by `xPct, yPct` percentages (relative to canvas dimensions)
- **Element type renderers** (within `components/element-renderers/`):
  - `StaticTextElementPreview` — renders static text content with font family, size, color, weight, alignment, line-height, letter-spacing from element payload
  - `DataTextElementPreview` — resolves variable by `variableId` from testValues, displays resolved text with same styling as static text
  - `DataDateElementPreview` — resolves variable by `variableId`, formats date per locale using `shared/locale` compile-time date formatting
  - `ImageElementPreview` — `<img>` with object-fit (contain/cover/none), opacity, and optional border radius
  - `QrCodeElementPreview` — generates QR code from value (resolving variables from testValues) using `qrcode.react` or similar; supports error correction level (L/M/Q/H) and size from payload
  - `BarcodeElementPreview` — generates barcode (Code128, EAN13, QR) from value using `react-barcode` or similar; supports format and display options from payload
  - `ShapeElementPreview` — renders geometric shapes: rectangle, circle, line with stroke width, stroke color, fill color, opacity from payload
- **Variable resolution**: each element's text/payload may contain `{{variableId}}` patterns resolved from `testValues` map before rendering
- **Z-order**: elements rendered in array order (index 0 = bottom, last = top)
- **Element bounds validation**: elements with xPct/yPct outside 0-100 or widthPct/heightPct <= 0 are skipped with console warning

**Interaction states**:
- `loading === true` → `<Skeleton variant="rectangular" />` with canvas dimensions
- `error` → centered error message with retry button
- `empty === true` → centered "template has no elements" message
- `readOnly === true` → subtle "version preview — read only" banner at top

#### 4.4.2 `SampleDataPanel`

Side panel (desktop: right column, mobile: bottom sheet) for selecting a sample recipient or entering custom data, with a form listing all template variables.

**Props Interface**:

```typescript
interface SampleDataPanelProps {
  variables: TemplateVariableType[];
  testValues: Record<string, string>;
  selectedSampleRecipientId: string | null;
  sampleRecipients: SampleRecipientType[];
  labels: SampleDataLabels;
  onTestValueChange: (variableId: string, value: string) => void;
  onSelectSampleRecipient: (recipientId: string) => void;
  onResetSampleData: () => void;
  loading?: boolean;
  readOnly?: boolean;
}

interface SampleRecipientType {
  id: string;
  name: string;
  data: Record<string, string>;
}

interface SampleDataLabels {
  title: string;
  selectRecipient: string;
  customData: string;
  variableName: string;
  testValue: string;
  testValuePlaceholder: string;
  noVariables: string;
  resetToDefaults: string;
  datePlaceholder: string;
  booleanTrue: string;
  booleanFalse: string;
  numberPlaceholder: string;
  recipientPreviewHint: string;
}
```

**Internal Structure**:
- `RecipientDropdown` (MUI `Autocomplete`) — lists sample recipients by name, selecting one loads their data into testValues. Shows recipient name as option label, subtitle with recipient email/ID as secondary text.
- `VariableInputList` — renders one input per variable:
  - `text` type → MUI `TextField` with `variant="outlined"`, `size="small"`, `fullWidth`
  - `date` type → MUI `DatePicker` (from `@mui/x-date-pickers`) with locale-aware formatting
  - `boolean` type → MUI `Switch` with label showing variable name
  - `number` type → MUI `TextField` with `type="number"`, `inputProps={{ min: 0 }}`
- Each input prefilled with `previewDefault` from variable definition
- Variables map `testValues[variableId]` → current value
- `ResetToDefaultsButton` — calls `onResetSampleData` to restore all variables to their `previewDefault` values
- `readOnly === true` → all inputs disabled, reset button hidden, recipient dropdown disabled
- `loading === true` → skeleton list rows instead of inputs
- Empty state: `noVariables` message with `InboxOutlined` icon when `variables.length === 0`

#### 4.4.3 `PreviewToolbar`

Toolbar with zoom, download, publish, and version history buttons.

**Props Interface**:

```typescript
interface PreviewToolbarProps {
  labels: ToolbarLabels;
  zoomLevel: number;
  minZoom: number;
  maxZoom: number;
  downloadFormat: "pdf" | "image";
  templateStatus: TemplateStatus;
  canPublish: boolean;
  canManage: boolean;
  previewMode: "draft" | "version";
  renderingMode: "screen" | "pdf-simulation";
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onActualSize: () => void;
  onSetDownloadFormat: (format: "pdf" | "image") => void;
  onDownloadPreview: () => void;
  onPublish: () => void;
  onOpenVersionHistory: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onBackToDraft?: () => void;
  onBackToEditor: () => void;
  onToggleRenderingMode: () => void;
  downloadLoading: boolean;
  hasUnsavedChanges: boolean;
}

interface ToolbarLabels {
  zoomIn: string;
  zoomOut: string;
  fitToScreen: string;
  actualSize: string;
  zoomLevel: (zoom: number) => string;
  downloadPdf: string;
  downloadImage: string;
  publish: string;
  versionHistory: string;
  archive: string;
  unarchive: string;
  backToDraft: string;
  backToEditor: string;
  renderingModeScreen: string;
  renderingModePdf: string;
  unsavedChangesTooltip: string;
}
```

**Internal Structure**:
- Toolbar width matches parent desktop/mobile container
- `BackToEditorButton` — leftmost icon button with `ArrowBack` icon
- Zoom controls grouped: `ZoomOutButton` (disabled at `minZoom`), `ZoomLevelLabel` (e.g. "100%"), `ZoomInButton` (disabled at `maxZoom`), `FitToScreenButton`
- `RenderingModeToggle` — `ToggleButtonGroup` with two options: "Screen" and "PDF Simulation". Only visible on desktop.
- Download controls: `ToggleButtonGroup` for format (PDF / Image), then `DownloadButton` with download icon
- `VersionHistoryButton` — icon button with `History` icon, shows count badge if versions > 0
- `PublishButton` — prominent CTA (`variant="contained"`, `color="primary"`) when `templateStatus === "draft"` and `canPublish`. Shows subtle dot indicator if `hasUnsavedChanges === true` (tooltip: `unsavedChangesTooltip`).
- When `previewMode === "version"`, publish button replaced with `BackToDraftButton` (`variant="outlined"`)
- `ArchiveButton` / `UnarchiveButton` — only visible if `canManage` permission. Archive visible when `status === "published"`, Unarchive when `status === "archived"`.
- Desktop: all controls in a single horizontal `Toolbar` row. Mobile: compact horizontally-scrollable `Toolbar` with icon-only buttons (text labels shown as tooltips).

#### 4.4.4 `PublishDialog`

Confirmation dialog before publishing a draft template. Shows template summary, version notes input, and warning banners.

**Props Interface**:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| open | boolean | yes | Dialog visibility |
| labels | `PublishDialogLabels` | yes | From `labelsBySection.publishDialog` |
| summary | `PublishSummaryType` | yes | Template summary (name, element count, variable count, dimensions, next version) |
| versionNotes | string | yes | Current notes value |
| onVersionNotesChange | `(notes: string) => void` | yes | Notes input change |
| hasUnsavedChanges | boolean | yes | Show warning if editor has unsaved changes |
| validationResults | `ValidationResultType \| null` | yes | Pre-publish validation results |
| onConfirm | `() => void` | yes | Confirm publish |
| onCancel | `() => void` | yes | Cancel dialog |
| loading | boolean | yes | Publish mutation in flight |

**Internal Structure**:
- MUI `Dialog` with `maxWidth="sm"` and `fullWidth`
- `DialogTitle` — "Publish Template Version {versionNumber}"
- `DialogContent`:
  - `PublishSummary` — Card showing: template name, dimensions (WxH), element count, variable count, next version number
  - `ValidationResults` — if `validationResults.hasErrors`, shows error list; if warnings, shows warning list
  - `VersionNotesField` — `TextField multiline rows={4}` with label and placeholder
  - `WarningUnsavedChanges` — Alert banner if `hasUnsavedChanges === true` (warning: you have unsaved editor changes, publish will use the last saved state)
  - `WarningReRender` — Alert banner: "Re-publishing may affect issued certificates that reference this template"
- `DialogActions`:
  - `CancelButton` — `onCancel`
  - `ConfirmButton` — `onConfirm`, disabled if `loading` or `validationResults.hasErrors`

#### 4.4.5 `ArchiveDialog` / `UnarchiveDialog`

**Props Interface** (ArchiveDialog):

```typescript
interface ArchiveDialogProps {
  open: boolean;
  labels: ArchiveDialogLabels;
  templateName: string;
  certificateCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

interface ArchiveDialogLabels {
  title: string;
  confirmTitle: string;
  confirmMessage: (certCount: number) => string;
  warningNonZeroCerts: string;
  confirm: string;
  cancel: string;
  success: string;
  failed: string;
}
```

`UnarchiveDialog` has the same interface structure but uses `labelsBySection.unarchive` with `UnarchiveDialogLabels` (same shape).

**Internal Structure (ArchiveDialog)**:
- MUI `Dialog` with `maxWidth="sm"` and `fullWidth`
- `DialogTitle`: `confirmTitle` (e.g., "Archive this template?")
- `DialogContent`:
  - Confirmation text: `confirmMessage(certificateCount)` — pluralized message warning about the number of issued certificates that reference this template
  - If `certificateCount > 0`: `WarningAlert` (amber) with `warningNonZeroCerts` message explaining that archived templates will still serve existing certificates but won't accept new certificate issuance
  - If `certificateCount === 0`: informational text — "this template has no issued certificates, archiving is safe"
- `DialogActions`:
  - `CancelButton`: `onCancel`, `variant="outlined"`
  - `ConfirmButton`: `onConfirm`, `variant="contained"`, `color="error"`. Disabled when `loading`. Shows `CircularProgress` when loading.
- `loading === true` → dialog cannot be dismissed (no `onClose` from backdrop click or Escape)

**Internal Structure (UnarchiveDialog)**:
- Same pattern as ArchiveDialog but with green `color="success"` confirm button
- `confirmMessage`: "Restore this template to published status?"
- No warning about certificates — unarchiving only affects template status

#### 4.4.6 `RevertDialog`

Confirmation dialog before reverting draft to a previous published version.

**Props Interface**:

```typescript
interface RevertDialogProps {
  open: boolean;
  labels: RevertDialogLabels;
  targetVersion: TemplateVersionType | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

interface RevertDialogLabels {
  title: string;
  confirmMessage: (version: number, date: string) => string;
  certsNotAffectedWarning: string;
  warningOverwritesDraft: string;
  confirm: string;
  cancel: string;
  success: string;
  failed: string;
}
```

**Internal Structure**:
- MUI `Dialog` with `maxWidth="sm"` and `fullWidth`
- `DialogTitle`: `title` with target version number
- `DialogContent`:
  - `VersionInfoCard` — shows: version number (badge), publish date (locale-formatted), publisher name, element count, variable count
  - `WarningCertsNotAffected` — info-level `Alert` with `certsNotAffectedWarning` text and `InfoOutlined` icon: "Existing issued certificates will NOT be affected."
  - `WarningOverwritesDraft` — warning-level `Alert` with `warningOverwritesDraft` text and `WarningAmberOutlined` icon: "This will replace your current draft content. Current unsaved changes will be lost."
- `DialogActions`:
  - `CancelButton`: `onCancel`, `variant="outlined"`
  - `ConfirmButton`: `onConfirm`, `variant="contained"`, `color="warning"`. Label: "Revert to Version {version}". Disabled when `loading`. Shows `CircularProgress` when loading.
- `open === false` or `targetVersion === null` → dialog hidden

#### 4.4.7 `VersionHistory`

Panel listing all published versions with preview, revert, and pagination actions.

**Props Interface**:

```typescript
interface VersionHistoryProps {
  versions: TemplateVersionType[];
  labels: VersionHistoryLabels;
  currentVersionId: string | null;
  onPreviewVersion: (versionId: string) => void;
  onRevertToVersion: (version: TemplateVersionType) => void;
  loading: boolean;
  canManage: boolean;
  // Pagination
  hasMore: boolean;
  onLoadMore: () => void;
  totalCount: number;
  // Empty
  empty: boolean;
}

interface TemplateVersionType {
  id: string;
  version: number;
  publishedAt: string;
  publishedBy: string;
  elementCount: number;
  variableCount: number;
  certificateCount: number;
  sourceVersionId: string | null;
  notes: string | null;
}

interface VersionHistoryLabels {
  title: string;
  versionNumber: (version: number) => string;
  publishedDate: string;
  publishedBy: string;
  elementCount: (count: number) => string;
  variableCount: (count: number) => string;
  certificateCount: (count: number) => string;
  noVersions: string;
  currentVersion: string;
  preview: string;
  revert: string;
  loadMore: string;
  notes: string;
  noNotes: string;
  revertDisabledArchived: string;
}
```

**Internal Structure**:
- Panel header: `title` (e.g., "Version History") with `totalCount` badge (e.g., "3 versions")
- `VersionHistoryList` — one `VersionHistoryItem` per version, rendered in descending version order (newest first)
- Each `VersionHistoryItem` shows:
  - `VersionBadge` — MUI `Chip` with `versionNumber` (e.g., "v3"), `color="primary"` if this version matches `currentVersionId`
  - `VersionMeta` — publish date (formatted via locale-aware `Intl.DateTimeFormat`), publisher name with "by" prefix
  - `VersionStats` — `elementCount` badge (e.g., "5 elements"), `variableCount` badge (e.g., "3 variables"), `certificateCount` badge (e.g., "12 certs")
  - `VersionNotes` — truncated notes text (first 2 lines, "..." if overflow). Shows `noNotes` placeholder if notes is null.
  - Action buttons: `PreviewButton` (eye icon), `RevertButton` (rotate-left icon)
- `PreviewButton` calls `onPreviewVersion(versionId)` → switches canvas to read-only render of that version, sets `currentVersionId`
- `RevertButton` calls `onRevertToVersion(version)` → opens `RevertDialog`. Disabled if version matches current draft or `templateStatus === "archived"`. When disabled, tooltip shows `tooltipDisabledArchived`
- `NoVersionsMessage` — centered `InboxOutlined` icon with `noVersions` text when list is empty AND `loading === false`
- `CurrentVersionBadge` — subtle `currentVersion` label on the version currently being previewed
- `LoadMoreButton` — shown at bottom if `hasMore === true`, calls `onLoadMore` to fetch next page
- `loading === true` → 3 skeleton `VersionHistoryItem` rows (each: chip skeleton + 2 text skeleton + 2 button skeleton)
- `<Divider />` between version items

**Pagination**:
- Initial load: 10 versions
- "Load More": fetches next 10 versions (offset-based via `TemplateVersionsQuery` with `limit`/`offset` variables)
- `hasMore`: computed from `versions.length < totalCount`

**Accessibility**:
- Version items are keyboard-navigable via arrow keys (`role="listbox"`)
- `PreviewButton` aria-label: "Preview version {version}"
- `RevertButton` aria-label: "Revert to version {version}"

#### 4.4.8 `DownloadPreviewButton`

**Props Interface**:

```typescript
interface DownloadPreviewButtonProps {
  format: "pdf" | "image";
  labels: DownloadButtonLabels;
  disabled?: boolean;
  loading?: boolean;
  onDownload: () => void;
}

interface DownloadButtonLabels {
  downloadPdf: string;
  downloadImage: string;
  downloading: string;
}
```

**Behavior**:
- When `loading === true`: button shows `<CircularProgress size={20} />` with `downloading` label, button disabled
- When `disabled === true`: button greyed out (no elements to download or no permissions)
- Image download (client-side):
  1. `CertificatePreviewCanvas` renders into a container with a known ref (the actual canvas DOM node, not the zoomed wrapper)
  2. Use `html2canvas` library to capture the canvas DOM node at native template resolution (not zoomed resolution)
  3. Convert to PNG via `canvas.toDataURL("image/png")`
  4. Trigger download via temporary `<a download="template-preview.png">` element appended to body, clicked, then removed
  5. No server round-trip needed — all client-side
  6. Error handling: if `html2canvas` throws, show error snackbar with `notifications.downloadFailed` key
- PDF download (server-side):
  1. Client POSTs to `app/api/certificates/templates/[templateId]/preview-pdf/route.ts`
  2. Request body includes `{ testValues: Record<string, string>, format: "pdf" }`
  3. Server validates `CertificateTemplateView` permission via `getServerAuth()`
  4. Server loads template elements + variables from repository
  5. Server uses Plan 6 PDF rendering service (`PdfRenderService`) to generate PDF from elements + testValues
  6. Returns binary blob with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="template-preview.pdf"`
  7. Client creates object URL via `URL.createObjectURL(blob)` and triggers download
  8. Client revokes object URL after download trigger
  9. Error handling: HTTP error response → error snackbar with `notifications.downloadFailed` key

**Accessibility**:
- Button has `aria-label` set to current format label
- Loading state announced via `aria-busy="true"`

#### 4.4.9 Element Renderer Interfaces (Shared)

All element renderers live in `frontend/common/views/dashboard/cert-preview/components/element-renderers/` and share a common props interface for consistency and testability.

**Base Props Interface**:

```typescript
interface BaseElementRendererProps {
  element: TemplateElementType;
  testValues: Record<string, string>;
  canvasWidth: number;
  canvasHeight: number;
  zoomLevel: number;
  readOnly: boolean;
}

interface TemplateElementType {
  id: string;
  type: ElementType;  // 'static_text' | 'data_text' | 'data_date' | 'image' | 'qr_code' | 'barcode' | 'shape'
  xPct: number;        // 0-100
  yPct: number;        // 0-100
  widthPct: number;    // 0-100
  heightPct: number;   // 0-100
  payload: ElementPayloadType;
  zIndex: number;
}

type ElementType =
  | "static_text"
  | "data_text"
  | "data_date"
  | "image"
  | "qr_code"
  | "barcode"
  | "shape";
```

**StaticTextElementPreview**:

```typescript
interface StaticTextElementPayload {
  text: string;
  fontFamily: string;           // e.g., "Inter", "Roboto", "Noto Sans Arabic"
  fontSize: number;             // in pixels
  fontWeight: number;           // 100-900
  fontStyle: "normal" | "italic";
  color: string;                // hex or rgb
  textAlign: "left" | "center" | "right";
  lineHeight: number;           // multiplier (1.0, 1.5, etc.)
  letterSpacing: number;        // in pixels
  textDecoration: "none" | "underline" | "overline" | "line-through";
}

interface StaticTextElementPreviewProps extends BaseElementRendererProps {
  element: TemplateElementType & { type: "static_text"; payload: StaticTextElementPayload };
}
```

**DataTextElementPreview**:

```typescript
interface DataTextElementPayload {
  variableId: string;
  // Inherits all styling from StaticTextElementPayload except 'text'
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  color: string;
  textAlign: "left" | "center" | "right";
  lineHeight: number;
  letterSpacing: number;
  textDecoration: "none" | "underline" | "overline" | "line-through";
}

interface DataTextElementPreviewProps extends BaseElementRendererProps {
  element: TemplateElementType & { type: "data_text"; payload: DataTextElementPayload };
}
```

**DataDateElementPreview**:

```typescript
interface DataDateElementPayload {
  variableId: string;
  // Styling same as DataTextElementPayload
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  color: string;
  textAlign: "left" | "center" | "right";
  lineHeight: number;
  letterSpacing: number;
  // Date-specific
  dateFormat: "short" | "medium" | "long" | "full" | "custom";
  customFormat?: string;        // e.g., "dd/MM/yyyy", "MMMM d, yyyy"
}

interface DataDateElementPreviewProps extends BaseElementRendererProps {
  element: TemplateElementType & { type: "data_date"; payload: DataDateElementPayload };
}
```

**ImageElementPreview**:

```typescript
interface ImageElementPayload {
  imageUrl: string;             // absolute or relative URL
  objectFit: "contain" | "cover" | "fill" | "none" | "scale-down";
  opacity: number;              // 0-1
  borderRadius: number;         // pixels
  altText: string;              // for accessibility
}

interface ImageElementPreviewProps extends BaseElementRendererProps {
  element: TemplateElementType & { type: "image"; payload: ImageElementPayload };
}
```

**QrCodeElementPreview**:

```typescript
interface QrCodeElementPayload {
  value: string;                // may contain {{variableId}} placeholders
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
  size: number;                 // pixels (width = height)
  margin: number;               // quiet zone in modules
  foregroundColor: string;      // QR modules color
  backgroundColor: string;      // background color (usually transparent)
  includeMargin: boolean;
}

interface QrCodeElementPreviewProps extends BaseElementRendererProps {
  element: TemplateElementType & { type: "qr_code"; payload: QrCodeElementPayload };
}
```

**BarcodeElementPreview**:

```typescript
interface BarcodeElementPayload {
  value: string;                // may contain {{variableId}} placeholders
  format: "CODE128" | "EAN13" | "EAN8" | "UPC" | "QRCODE";
  width: number;                // pixels
  height: number;               // pixels
  displayValue: boolean;        // show text below barcode
  fontSize: number;             // for display value
  fontFamily: string;
  color: string;                // bars color
  background: string;           // background color
  margin: number;               // quiet zone
}

interface BarcodeElementPreviewProps extends BaseElementRendererProps {
  element: TemplateElementType & { type: "barcode"; payload: BarcodeElementPayload };
}
```

**ShapeElementPreview**:

```typescript
interface ShapeElementPayload {
  shapeType: "rectangle" | "circle" | "line" | "ellipse" | "rounded_rectangle";
  strokeWidth: number;          // pixels
  strokeColor: string;          // hex/rgba
  fillColor: string;            // hex/rgba (transparent = no fill)
  opacity: number;              // 0-1
  // For rounded_rectangle
  borderRadius?: number;        // pixels
  // For line
  lineStart?: { xPct: number; yPct: number }; // relative to element bounds
  lineEnd?: { xPct: number; yPct: number };
  lineCap?: "butt" | "round" | "square";
}

interface ShapeElementPreviewProps extends BaseElementRendererProps {
  element: TemplateElementType & { type: "shape"; payload: ShapeElementPayload };
}
```

**Renderer Factory**:

```typescript
// In element-renderers/index.ts
export function renderElement(props: BaseElementRendererProps): React.ReactElement {
  switch (props.element.type) {
    case "static_text":
      return <StaticTextElementPreview {...props} />;
    case "data_text":
      return <DataTextElementPreview {...props} />;
    case "data_date":
      return <DataDateElementPreview {...props} />;
    case "image":
      return <ImageElementPreview {...props} />;
    case "qr_code":
      return <QrCodeElementPreview {...props} />;
    case "barcode":
      return <BarcodeElementPreview {...props} />;
    case "shape":
      return <ShapeElementPreview {...props} />;
    default:
      return <UnknownElementRenderer {...props} />;
  }
}
```

All renderers implement the same variable resolution logic: replace `{{variableId}}` patterns in payload strings using `testValues[variableId]` map, falling back to empty string if variable not found.

**File**: `frontend/desktop/views/dashboard/cert-preview/preview.desktop.tsx`

**Props Interface**:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| vm | `PreviewViewModel` | yes | Full ViewModel from `usePreviewViewModel` |

**Layout** (CSS Grid):

```
┌─────────────────────────────────────────────────────────────┐
│ PreviewToolbar (full width)                                  │
├─────────────────────────────────────────────┬───────────────┤
│                                             │               │
│  CertificatePreviewCanvas                   │ SampleDataPanel│
│  (PannableViewport, zoomable)               │ (fixed right   │
│  ~70% width                                 │  column ~30%)  │
│                                             │               │
│                                             │               │
└─────────────────────────────────────────────┴───────────────┘
```

- Outer container: `Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}`
- Toolbar: full-width top row with fixed height
- Middle: `Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}`
  - Left: `Box sx={{ flex: 1, overflow: 'auto' }}` containing `CertificatePreviewCanvas` with `PannableViewport`
  - Right: `Box sx={{ width: 360, flexShrink: 0, overflowY: 'auto' }}` containing `SampleDataPanel`
- VersionHistory rendered as right `Drawer` (anchor="right", width=400)
- PublishDialog, ArchiveDialog, UnarchiveDialog, RevertDialog rendered at end of layout (controlled by ViewModel)
- Responsive breakpoint: at `lg` and above, right panel is 360px; at `md` collapses to 280px

**Toolbar behavior on desktop**:
- All zoom controls visible (zoom in/out, fit, actual size, zoom % indicator)
- Rendering mode toggle (Screen / PDF Simulation)
- Download button with format toggle (PDF/Image)
- Publish button prominent (contained variant), disabled if `templateStatus !== "draft"` or persisting error
- Version History button opens right Drawer
- Archive/Unarchive buttons visible only with `canManage` permission
- Back to Editor button always visible (leftmost)

**Interaction States (Desktop)**:
- `PannableViewport`:
  - Mouse wheel + Ctrl/Cmd → zoom in/out (centered on cursor)
  - Mouse wheel (no modifier) → vertical scroll
  - Shift + Mouse wheel → horizontal scroll
  - Click + drag (middle mouse or Space+drag) → pan
  - Double-click on canvas → reset to 100% zoom, center
  - `zoomLevel` state synced with toolbar indicator
- `CertificatePreviewCanvas`:
  - Keyboard navigation: Arrow keys pan when canvas focused
  - `+/-` keys zoom in/out
  - `0` key → fit to screen
  - `1` key → actual size (100%)
- `SampleDataPanel`:
  - Real-time test value updates re-render canvas immediately (debounced 150ms)
  - Recipient dropdown change populates all test values
  - Reset button restores all `previewDefault` values
  - Input validation: shows inline error if required variable empty
- Version History Drawer:
  - Keyboard: Arrow Up/Down navigate versions, Enter preview, Shift+Enter revert
  - Load more button focused after loading new page

### 4.6 Mobile View: `PreviewMobileView`

**File**: `frontend/mobile/views/dashboard/cert-preview/preview.mobile.tsx`

**Props Interface**:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| vm | `PreviewViewModel` | yes | Full ViewModel from `usePreviewViewModel` |

**Layout**:

```
┌──────────────────────────────┐
│ CompactToolbar               │
├──────────────────────────────┤
│                              │
│  CertificatePreviewCanvas    │
│  (CSS-scaled to screen width │
│   + pinch-zoom wrapper)       │
│                              │
│                              │
├──────────────────────────────┤
│ SampleDataPanel collapsed    │
│ (BottomSheet — drag handle)  │
└──────────────────────────────┘

+ FloatingActionButton (bottom-right): Publish
```

- Outer container: `Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}`
- Compact toolbar: horizontal scroll row with essential controls (download, publish, version history button). Zoom via pinch.
- Preview area: `PinchZoomWrapper` from `@/frontend/components/pinch-zoom` wraps `CertificatePreviewCanvas` (scaled via CSS `transform: scale`)
- `SampleDataPanel` collapsed at bottom: MUI `BottomSheet`-style collapsible panel with drag handle. Tapping expands to ~50% screen height.
- `FloatingActionButton` (FAB) bottom-right: `Fab` with `Publish` icon. Hidden if `templateStatus !== "draft"` or no publish permission.
- PublishDialog, ArchiveDialog, UnarchiveDialog, RevertDialog rendered as full-screen MUI `Dialog fullScreen` on mobile.
- Version history displayed as full-screen dialog (not Drawer)

**Mobile-specific notes**:
- Pinch zoom handled by `PinchZoomWrapper` — gesture-based zoom 0.5x to 3x range
- No pannable viewport — pan is implicit via scroll when zoomed
- Sample data panel collapsed height: 56px (just shows title); expanded: 50dvh
- FAB uses theme palette primary color

**Interaction States (Mobile)**:
- `PinchZoomWrapper`:
  - Two-finger pinch → zoom (0.5x min, 3x max)
  - Two-finger drag → pan (when zoomed > 1x)
  - Double-tap → toggle between fit-to-screen and 100%
  - Zoom level indicator briefly shown as toast during pinch
- `CertificatePreviewCanvas`:
  - Single tap on element → no action (read-only preview)
  - Long press → no action (future: element info tooltip)
- `SampleDataPanel` (BottomSheet):
  - Drag handle at top → tap or drag to expand/collapse
  - Expanded: scrollable form with all variable inputs
  - Collapsed: shows title + recipient avatar/name + chevron indicator
  - `onExpand` / `onCollapse` callbacks for analytics
  - Auto-collapses when selecting a recipient
- `CompactToolbar`:
  - Horizontally scrollable (`overflow-x: auto`, `white-space: nowrap`)
  - Icon-only buttons with `aria-label` for accessibility
  - Download format toggle as `ToggleButtonGroup`
  - Version History opens full-screen dialog
  - FAB: bottom-right, `Fab` with `PublishOutlined` icon, `size="large"`
- Dialogs (PublishDialog, ArchiveDialog, RevertDialog, VersionHistory):
  - All rendered as `Dialog fullScreen` on mobile
  - Close on backdrop click when not loading
  - Back button (system/Android) closes dialog
  - Keyboard: Enter confirms, Escape cancels

### 4.7 Container Composition

```
PreviewContainer receives templateId prop from App Router page
   ↓
calls usePreviewViewModel({ templateId })
   ↓
builds PreviewViewModel (single object)
   ↓
renders <PreviewView vm={vm} />
   ↓
PreviewView calls useMediaQuery, picks Desktop or Mobile view
   ↓
Desktop/Mobile view consumes vm (labels via vm.labelsBySection, state via vm.*)
   ↓
Sub-components (CertificatePreviewCanvas, SampleDataPanel, etc.)
   receive their portion of vm via props from the tier view
```

The Container does NOT render any UI of its own — it only constructs the ViewModel and delegates to the switcher.

---

## 5. State Machine — Template Status

```
                    ┌──────────┐
                    │  draft   │◄──── initial state (from Plan 10)
                    └────┬─────┘
                         │ publish (validation passes + confirm)
                         ▼
                    ┌──────────┐
          ┌────────►│ published│◄────────┐
          │         └────┬─────┘         │
          │              │               │
          │   archive    │               │ unarchive
          │   (confirm)  ▼               │ (confirm)
          │         ┌──────────┐         │
          │         │ archived │─────────┘
          │         └──────────┘
          │
          │ revert (confirm) — loads version into draft
          │              │
          │              ▼
          │         ┌──────────┐
          └─────────┤  draft   │ (revert replaces draft content)
                    └──────────┘
                         │ publish (creates new version)
                         └──► published (v2, v3, ...)
```

**Valid transitions**:
| From | To | Action | Service Method |
|------|-----|--------|---------------|
| draft | published | Publish | `publish()` |
| published | archived | Archive | `archive()` |
| archived | published | Unarchive | `unarchive()` |
| published | draft | Revert (modifies draft) | `revertToVersion()` |
| draft | published | Re-publish | `publish()` (creates new version) |

**Invalid transitions** (blocked with error):
- draft → archived (must publish first)
- archived → draft (must unarchive first)
- archived → archived (already archived)

---

## 6. Version Chain Design

### 6.1 Chain Structure

```
Template (id: abc)
  │
  ├── Draft state: elements[], variables[] (mutable, editable in Plan 11)
  │
  └── Published versions (immutable):
        v3 (id: v3, prevId: v2, publishedAt: 2024-03-01)
        ├── v2 (id: v2, prevId: v1, publishedAt: 2024-02-15)
        │     └── v1 (id: v1, prevId: null, publishedAt: 2024-01-01)
        │
        └── Each version has its own:
            ├── template_version_elements[] (deep copy of elements at publish time)
            └── template_version_variables[] (deep copy of variables at publish time)
```

### 6.2 Version Number Assignment

- Version numbers are sequential integers starting at 1
- The next version number is: `max(existing version numbers) + 1`
- Version numbers are unique per template (not global UUID-based)
- If a template has no versions, the first publish creates v1

### 6.3 Certificate Association

- When a certificate is generated (Plan 16+), it references a `templateVersionId` (not the template ID directly)
- This ensures certificates always point to an immutable snapshot
- The `certificateCount` in version history is: `SELECT COUNT(*) FROM certificates WHERE template_version_id = :versionId`

---

## 7. Error Handling

### 7.1 Validation Errors

| Scenario | Handling |
|----------|----------|
| No elements in template | Return ValidationError with `certificatePreview.validation.noElements` key |
| Required variable missing default | Return ValidationError with `certificatePreview.validation.missingDefaultValue` key and variable name |
| Data element references non-existent variable | Return ValidationError with `certificatePreview.validation.invalidVariableRef` key and element name |
| Template dimensions are zero or negative | Return ValidationError with `certificatePreview.validation.invalidDimensions` key |
| Duplicate element names | Return ValidationWarning with `certificatePreview.validation.duplicateNames` key (does not block) |

### 7.2 Mutation Errors

| Scenario | Handling |
|----------|----------|
| Template not found | GraphQL error: "Template not found" (i18n key: `certificatePreview.shell.emptyMessage`) |
| Invalid status transition (e.g., archiving a draft) | Validation error returned in mutation payload: `success: false`, appropriate error key |
| Database transaction fails during publish | GraphQL error: "Failed to publish template" (i18n key: `certificatePreview.publishDialog.failed`) |
| Cache invalidation fails | Publish succeeds, `cacheInvalidated: false` returned, log warning. Frontend shows warning toast via `certificatePreview.publishDialog.cacheInvalidationFailed`. |
| Version snapshot creation fails | Entire publish is rolled back (atomic), GraphQL error returned |

### 7.3 Preview Errors

| Scenario | Handling |
|----------|----------|
| Background image fails to load | Show error placeholder with `certificatePreview.previewCanvas.previewError` message |
| Template has no background image | Render elements on white background with note "No background image set" |
| Variable referenced by data element does not exist in testValues | Render empty string (or placeholder) in data element |

### 7.4 Interaction States

Every user-visible state for the preview & publish page is enumerated below. Each state has a defined visual, behavior, and exit condition.

#### 7.4.1 Loading States

| State | Trigger | Visual | Exit |
|-------|---------|--------|------|
| **Template loading** | Page mount, templateId param | `CertificatePreviewCanvas` shows `<Skeleton variant="rectangular" />` matching template dimensions. `SampleDataPanel` shows skeleton list rows. Toolbar disabled except back button. | Apollo query completes (data or error) |
| **Versions loading** | Version history opens (lazy) | `VersionHistory` panel shows 3 skeleton `VersionHistoryItem` rows | `TemplateVersionsQuery` completes |
| **Publishing** | User clicks Confirm in PublishDialog | `PublishDialog` Confirm button shows `<CircularProgress size={24} />`, button disabled. Dialog cannot be dismissed during flight. | Mutation completes (success or error) |
| **Archiving** | User clicks Confirm in ArchiveDialog | Same pattern as Publishing | Mutation completes |
| **Reverting** | User clicks Confirm in RevertDialog | Same pattern as Publishing | Mutation completes and draft refetched |
| **Downloading** | User clicks Download in toolbar | Download button shows `<CircularProgress size={20} />`. Format toggle disabled. | Blob generated and download triggered |

#### 7.4.2 Error States

| State | Trigger | Visual | Exit |
|-------|---------|--------|------|
| **Template not found** | Template query returns null | Centered `EmptyState` with `shell.emptyMessage` text and "Back to Templates" button | User navigates away |
| **Template access denied** | Permission check fails server-side | Redirect to `/unauthorized` page | N/A (server redirect) |
| **Template query error** | Apollo query returns `error` | `CertificatePreviewCanvas` shows centered Error icon with `previewCanvas.previewError` text and Retry button | Retry refetches query |
| **Publish error** | Mutation returns error or `success: false` | Error `Snackbar` with `notifications.publishFailed` and error message. PublishDialog remains open, Confirm re-enabled | User dismisses or retries |
| **Archive error** | Mutation returns error | Error `Snackbar` with `notifications.archiveFailed` | User dismisses |
| **Revert error** | Mutation returns error | Error `Snackbar` with `notifications.revertFailed` | User dismisses |
| **Download error** | Canvas/PDF generation fails | Error `Snackbar` "Download failed, please try again" | User dismisses |

#### 7.4.3 Success States

| State | Trigger | Visual | Exit |
|-------|---------|--------|------|
| **Published success** | Publish mutation succeeds | Success `Snackbar` with `notifications.publishSuccess` including version number. PublishDialog closes. Template status updates to "published" in UI. Version history refreshes. | Auto-hide 6s or user dismisses |
| **Archived success** | Archive mutation succeeds | Success `Snackbar` with `notifications.archiveSuccess`. Template status updates to "archived". Archive button replaced by Unarchive button. | Auto-hide 6s |
| **Unarchived success** | Unarchive mutation succeeds | Success `Snackbar` with `notifications.unarchiveSuccess`. Status reverts to "published". | Auto-hide 6s |
| **Reverted success** | Revert mutation succeeds | Success `Snackbar` with `notifications.revertSuccess` including version number. Canvas re-renders with reverted draft elements. Preview mode switches back to "draft". | Auto-hide 6s |

#### 7.4.4 Empty / Edge-Case States

| State | Trigger | Visual | Exit |
|-------|---------|--------|------|
| **Empty template (no elements)** | `template.elements.length === 0` | `CertificatePreviewCanvas` shows centered `InboxOutlined` icon with `previewCanvas.emptyTemplate` text. Sample data panel shows "no variables". Toolbar publish disabled. | User adds elements in editor |
| **No variables** | `template.variables.length === 0` | `SampleDataPanel` shows "no variables" message. Preview still renders static elements. | User adds variables in editor |
| **No versions** | `versions.length === 0` | `VersionHistory` panel shows `versionHistory.noVersions` centered text | User publishes first version |
| **Version preview mode** | `previewMode === "version"` | Canvas shows `versionPreview` banner. Sample data panel is read-only (inputs disabled). Publish button replaced by "Back to Draft" toolbar button. | User clicks Back to Draft |
| **Unsaved editor changes** | `certCanvasStore.isDirty === true` | PublishDialog shows `warningUnsavedChanges` Alert banner. Toolbar shows subtle dot indicator on Publish button | User saves in editor or publishes anyway |

---

## 7.5 Navigation & Route Specification

### 7.5.1 Route Path

```
app/(dashboard)/certificates/templates/[templateId]/preview/page.tsx
```

**Route parameters**:
- `templateId` (required): UUID of the template to preview

**Optional query params** (for deep linking):
- `version`: Version ID to preview read-only (e.g., `?version=abc123`)
- `recipient`: Sample recipient ID to pre-select (e.g., `?recipient=rec456`)

### 7.5.2 Entry Points

| Entry | Mechanism | Navigation Call |
|-------|-----------|----------------|
| From template editor (Plan 11) | "Preview" button in editor toolbar | `router.push(\`/certificates/templates/${templateId}/preview\`)` |
| From template list (Plan 10) | "Preview" action menu item | `router.push(\`/certificates/templates/${templateId}/preview\`)` |
| Direct URL | User types URL or clicks bookmark | Standard Next.js route resolution |

### 7.5.3 Back Navigation

- **Back to Editor**: `PreviewToolbar` includes a "Back to Editor" button that calls `router.push(\`/certificates/templates/${templateId}/edit\`)`
- **Back to Templates List**: If entered from list, browser back works. If direct URL, back button goes to `/certificates/templates`
- The App Router `page.tsx` generates `metadata` with title `"Preview Template — {templateName}"` for browser tab

### 7.5.4 Deep Linking

- `?version=<versionId>` → ViewModel reads query param on mount, sets `previewMode = "version"`, fetches that version's elements/variables, renders read-only. Toolbar shows "Back to Draft" instead of Publish.
- `?recipient=<recipientId>` → ViewModel pre-selects that sample recipient and loads their data into `testValues`.

### 7.5.5 Modal Fallback (Inline Preview from Editor)

For quick preview without leaving the editor page, a `PreviewModal` component is available in `frontend/common/views/dashboard/cert-preview/components/previewModal.tsx`. It reuses `CertificatePreviewCanvas` in a `Dialog maxWidth="lg" fullWidth`. It does NOT include publish/archive/version history (those require the full page). Usage: editor page opens `<PreviewModal templateId={templateId} open={showPreview} onClose={...} />`.

### 7.5.6 Download Mechanisms

#### Image Download (client-side)

1. `CertificatePreviewCanvas` renders into a container with a known ref
2. Use `html2canvas` (or similar lib) to capture the canvas DOM node at native resolution
3. Convert to PNG via `canvas.toDataURL("image/png")`
4. Trigger download via temporary `<a download="template-preview.png">` element
5. No server round-trip needed

#### PDF Download (server-side)

1. POST to `app/api/certificates/templates/[templateId]/preview-pdf/route.ts`
2. Server resolves template elements + current testValues (sent in request body)
3. Renders to PDF via the Plan 6 PDF rendering service
4. Returns binary blob
5. Client creates object URL and triggers download
6. **Note**: This endpoint requires `CertificateTemplateView` permission

---

## 8. i18n Design

### 8.1 Namespace Addition

New translation keys are added to the existing `certificates` translation tree under the `certificatePreview` sub-domain. All keys are defined as typed interfaces in `shared/locale/` per the compile-time TypeScript i18n system.

**Translation handle**: `Translation.Dashboard.CertificatePreview`

### 8.2 Access Patterns

| Context | Access Surface | Code Path |
|---------|---------------|-----------|
| Client components (ViewModel, all tier views) | `useAppTranslation(Translation.Dashboard.CertificatePreview)` → `t.dashboardTranslations.certificatePreview.*` | `@/shared/locale` |
| GraphQL resolvers (mutation error messages) | `ctx.t().dashboardTranslations.certificatePreview.*` (bound to `ctx.locale`) | Pothos context |
| Server components (App Router page) | `getTranslations(locale).dashboardTranslations.certificatePreview.*` | `@/shared/locale/server` |
| API routes / scripts / tests | `getServerTranslations(locale).dashboardTranslations.certificatePreview.*` | `@/shared/locale/server-graphql` |

### 8.3 Complete Key List

#### 8.3.1 `shell` section

| Key | EN | AR |
|-----|----|----|
| `shell.pageTitle` | "Preview Template" | "معاينة القالب" |
| `shell.pageSubtitle` | "Preview and publish your certificate template" | "معاينة ونشر قالب الشهادة" |
| `shell.backToEditor` | "Back to Editor" | "العودة إلى المحرر" |
| `shell.emptyMessage` | "Template not found or you don't have access" | "القالب غير موجود أو ليس لديك صلاحية" |

#### 8.3.2 `toolbar` section

| Key | EN | AR |
|-----|----|----|
| `toolbar.zoomIn` | "Zoom In" | "تكبير" |
| `toolbar.zoomOut` | "Zoom Out" | "تصغير" |
| `toolbar.fitToScreen` | "Fit to Screen" | "ملاءمة الشاشة" |
| `toolbar.actualSize` | "Actual Size" | "الحجم الفعلي" |
| `toolbar.zoomLevel` | (zoom: number) => `${zoom}%` | (zoom: number) => `${zoom}٪` |
| `toolbar.downloadPdf` | "Download PDF" | "تحميل PDF" |
| `toolbar.downloadImage` | "Download Image" | "تحميل صورة" |
| `toolbar.downloadDownloading` | "Downloading..." | "جاري التحميل..." |
| `toolbar.publish` | "Publish" | "نشر" |
| `toolbar.versionHistory` | "Version History" | "سجل الإصدارات" |
| `toolbar.archive` | "Archive" | "أرشفة" |
| `toolbar.unarchive` | "Unarchive" | "إلغاء الأرشفة" |
| `toolbar.backToDraft` | "Back to Draft" | "العودة للمسودة" |
| `toolbar.backToEditor` | "Back to Editor" | "العودة إلى المحرر" |
| `toolbar.renderingModeScreen` | "Screen Mode" | "وضع الشاشة" |
| `toolbar.renderingModePdf` | "PDF Simulation" | "محاكاة PDF" |
| `toolbar.unsavedChangesTooltip` | "You have unsaved changes in the editor" | "لديك تغييرات غير محفوظة في المحرر" |

#### 8.3.3 `sampleData` section

| Key | EN | AR |
|-----|----|----|
| `sampleData.title` | "Sample Data" | "بيانات تجريبية" |
| `sampleData.selectRecipient` | "Select Sample Recipient" | "اختر مستلم تجريبي" |
| `sampleData.customData` | "Enter Custom Data" | "أدخل بيانات مخصصة" |
| `sampleData.variableName` | "Variable" | "متغير" |
| `sampleData.testValue` | "Test Value" | "قيمة تجريبية" |
| `sampleData.testValuePlaceholder` | "Enter test value..." | "أدخل قيمة تجريبية..." |
| `sampleData.noVariables` | "This template has no variables" | "هذا القالب لا يحتوي على متغيرات" |
| `sampleData.resetToDefaults` | "Reset to Defaults" | "إعادة للقيم الافتراضية" |
| `sampleData.datePlaceholder` | "Select date..." | "اختر التاريخ..." |
| `sampleData.booleanTrue` | "Yes" | "نعم" |
| `sampleData.booleanFalse` | "No" | "لا" |
| `sampleData.numberPlaceholder` | "Enter number..." | "أدخل رقمًا..." |
| `sampleData.recipientPreviewHint` | "Previewing with recipient data" | "معاينة ببيانات المستلم" |

#### 8.3.4 `previewCanvas` section

| Key | EN | AR |
|-----|----|----|
| `previewCanvas.loadingPreview` | "Loading preview..." | "تحميل المعاينة..." |
| `previewCanvas.rendering` | "Rendering template..." | "جاري عرض القالب..." |
| `previewCanvas.previewError` | "Failed to load template preview" | "فشل في تحميل معاينة القالب" |
| `previewCanvas.noBackgroundImage` | "No background image set" | "لا توجد صورة خلفية" |
| `previewCanvas.emptyTemplate` | "This template has no elements to display" | "هذا القالب لا يحتوي على عناصر للعرض" |
| `previewCanvas.versionPreview` | (version: number) => `Viewing version ${version} (read-only)` | (version: number) => `عرض الإصدار ${version} (للقراءة فقط)` |

#### 8.3.5 `publishDialog` section

| Key | Type | EN | AR |
|-----|------|----|----|
| `publishDialog.title` | string | "Publish Template" | "نشر القالب" |
| `publishDialog.confirmTitle` | (version: number) => string | `Publish version ${version}?` | `نشر الإصدار ${version}؟` |
| `publishDialog.confirmMessage` | string | "Publishing creates a new immutable version. You can still edit the draft afterward." | "النشر ينشئ إصدارًا جديدًا غير قابل للتعديل. يمكنك تعديل المسودة بعد ذلك." |
| `publishDialog.elementCount` | (count: number) => string | pluralized | pluralized (Arabic rules) |
| `publishDialog.variableCount` | (count: number) => string | pluralized | pluralized (Arabic rules) |
| `publishDialog.dimensions` | (width: number, height: number) => string | `Dimensions: ${width} × ${height}px` | `الأبعاد: ${width} × ${height} بكسل` |
| `publishDialog.version` | string | "Next version" | "الإصدار التالي" |
| `publishDialog.versionNotesLabel` | string | "Version Notes" | "ملاحظات الإصدار" |
| `publishDialog.versionNotesPlaceholder` | string | "Describe what changed in this version..." | "صف التغييرات في هذا الإصدار..." |
| `publishDialog.warningReRender` | string | "Re-publishing may affect certificates already issued with this template" | "إعادة النشر قد تؤثر على الشهادات الصادرة بهذا القالب" |
| `publishDialog.warningUnsavedChanges` | string | "You have unsaved changes in the editor. Publishing will use the last saved state." | "لديك تغييرات غير محفوظة في المحرر. النشر سيستخدم آخر حالة محفوظة." |
| `publishDialog.success` | string | "Template published successfully" | "تم نشر القالب بنجاح" |
| `publishDialog.failed` | string | "Failed to publish template" | "فشل في نشر القالب" |
| `publishDialog.cacheInvalidationFailed` | string | "Published successfully but cache cleanup failed. Previews may be stale." | "تم النشر بنجاح لكن فشل تنظيف التخزين المؤقت. المعاينات قد تكون قديمة." |
| `publishDialog.confirm` | string | "Publish" | "نشر" |
| `publishDialog.cancel` | string | "Cancel" | "إلغاء" |

#### 8.3.6 `validation` section

| Key | EN | AR |
|-----|----|----|
| `validation.title` | "Validation Results" | "نتائج التحقق" |
| `validation.passed` | "All checks passed" | "تم اجتياز جميع الفحوصات" |
| `validation.failed` | "Validation failed" | "فشل التحقق" |
| `validation.noElements` | "Template has no elements" | "القالب لا يحتوي على عناصر" |
| `validation.invalidDimensions` | "Template dimensions must be greater than zero" | "أبعاد القالب يجب أن تكون أكبر من صفر" |
| `validation.missingDefaultValue` | (name: string) => `Variable "${name}" has no default value` | (name: string) => `المتغير "${name}" ليس له قيمة افتراضية` |
| `validation.invalidVariableRef` | (name: string) => `Element references unknown variable "${name}"` | (name: string) => `العنصر يشير إلى متغير غير معروف "${name}"` |
| `validation.duplicateNames` | "Variable names must be unique" | "أسماء المتغيرات يجب أن تكون فريدة" |
| `validation.backgroundImageMissing` | "No background image set — template will render on white background" | "لا توجد صورة خلفية — سيعرض القالب على خلفية بيضاء" |
| `validation.fontRenderingIssues` | (fonts: string[]) => `Some fonts may not render correctly: ${fonts.join(", ")}` | (fonts: string[]) => `بعض الخطوط قد لا تعرض بشكل صحيح: ${fonts.join("، ")}` |

#### 8.3.7 `archive` / `unarchive` / `revert` sections

| Key | EN | AR |
|-----|----|----|
| `archive.title` | "Archive Template" | "أرشفة القالب" |
| `archive.confirmTitle` | "Archive this template?" | "أرشفة هذا القالب؟" |
| `archive.confirmMessage` | (certCount: number) => string | pluralized: "This will archive {certCount} issued certificate(s)..." |
| `archive.warningNonZeroCerts` | "Archived templates cannot be used for new certificate issuance. Existing certificates remain valid." | "لا يمكن استخدام القوالب المؤرشفة لإصدار شهادات جديدة. الشهادات الحالية تبقى صالحة." |
| `archive.success` | "Template archived" | "تمت أرشفة القالب" |
| `archive.failed` | "Failed to archive template" | "فشل في أرشفة القالب" |
| `unarchive.title` | "Unarchive Template" | "إلغاء أرشفة القالب" |
| `unarchive.confirmTitle` | "Unarchive this template?" | "إلغاء أرشفة هذا القالب؟" |
| `unarchive.confirmMessage` | "This template will be restored to published status and can be used for new certificate issuance." | "سيتم استعادة هذا القالب إلى حالة النشر ويمكن استخدامه لإصدار شهادات جديدة." |
| `unarchive.success` | "Template unarchived" | "تم إلغاء أرشفة القالب" |
| `unarchive.failed` | "Failed to unarchive template" | "فشل في إلغاء الأرشفة" |
| `revert.title` | "Revert to Version" | "العودة إلى إصدار" |
| `revert.confirmMessage` | (version: number, date: string) => string | `Reverting to version ${version} (published ${date}) will replace your current draft.` | `العودة إلى الإصدار ${version} (المنشور ${date}) سيستبدل مسودتك الحالية.` |
| `revert.certsNotAffectedWarning` | "Existing issued certificates will NOT be affected." | "لن تتأثر الشهادات الصادرة الحالية." |
| `revert.warningOverwritesDraft` | "This will replace your current draft content. Current unsaved changes will be lost." | "سيستبدل هذا محتوى مسودتك الحالية. التغييرات غير المحفوظة ستفقد." |
| `revert.success` | "Draft reverted to version {version}" | "تمت إعادة المسودة إلى الإصدار {version}" |
| `revert.failed` | "Failed to revert template" | "فشل في إعادة القالب" |

#### 8.3.8 `versionHistory` section

| Key | EN | AR |
|-----|----|----|
| `versionHistory.title` | "Version History" | "سجل الإصدارات" |
| `versionHistory.versionNumber` | (version: number) => `Version ${version}` | (version: number) => `الإصدار ${version}` |
| `versionHistory.publishedDate` | "Published" | "تم النشر" |
| `versionHistory.publishedBy` | "by" | "بواسطة" |
| `versionHistory.elementCount` | (count: number) => string | pluralized |
| `versionHistory.variableCount` | (count: number) => string | pluralized |
| `versionHistory.certificateCount` | (count: number) => string | pluralized |
| `versionHistory.noVersions` | "No published versions yet" | "لا توجد إصدارات منشورة بعد" |
| `versionHistory.currentVersion` | "Current" | "الحالي" |
| `versionHistory.preview` | "Preview" | "معاينة" |
| `versionHistory.revert` | "Revert" | "إعادة" |
| `versionHistory.notes` | "Notes" | "ملاحظات" |
| `versionHistory.noNotes` | "No notes for this version" | "لا توجد ملاحظات لهذا الإصدار" |
| `versionHistory.loadMore` | "Load More" | "تحميل المزيد" |
| `versionHistory.revertDisabledArchived` | "Cannot revert from archived template" | "لا يمكن الاستعادة من قالب مؤرشف" |
| `versionHistory.totalVersions` | (total: number) => string | pluralized: "{total} version(s)" |

#### 8.3.9 `notifications` section

| Key | EN | AR |
|-----|----|----|
| `notifications.publishSuccess` | "Template published as version {version}" | "تم نشر القالب كإصدار {version}" |
| `notifications.publishFailed` | "Failed to publish: {error}" | "فشل النشر: {error}" |
| `notifications.archiveSuccess` | "Template archived" | "تمت أرشفة القالب" |
| `notifications.archiveFailed` | "Failed to archive: {error}" | "فشل الأرشفة: {error}" |
| `notifications.unarchiveSuccess` | "Template unarchived" | "تم إلغاء الأرشفة" |
| `notifications.unarchiveFailed` | "Failed to unarchive: {error}" | "فشل إلغاء الأرشفة: {error}" |
| `notifications.revertSuccess` | "Reverted to version {version}" | "تمت الإعادة إلى الإصدار {version}" |
| `notifications.revertFailed` | "Failed to revert: {error}" | "فشل الإعادة: {error}" |
| `notifications.downloadFailed` | "Download failed. Please try again." | "فشل التحميل. يرجى المحاولة مرة أخرى." |

#### 8.3.10 `renderingMode` section

| Key | EN | AR |
|-----|----|----|
| `renderingMode.title` | "Preview Mode" | "وضع المعاينة" |
| `renderingMode.screen` | "Screen — Interactive preview with zoom/pan" | "الشاشة — معاينة تفاعلية مع تكبير/تحريك" |
| `renderingMode.pdfSimulation` | "PDF Simulation — Matches printed output" | "محاكاة PDF — تطابق المخرجات المطبوعة" |
| `renderingMode.warning` | "PDF Simulation disables zoom/pan. Colors may differ slightly from screen." | "محاكاة PDF تعطل التكبير/التحريك. الألوان قد تختلف قليلاً عن الشاشة." |

### 8.4 Pluralization Implementation

Plural keys use the `(count: number) => string` function pattern:

For example, `versionHistory.certificateCount`:
- **English**: `count === 1 ? "1 certificate" : "{count} certificates"`
- **Arabic**: Branch on zero/one/two/few/many per Arabic grammar rules:
  - zero: "لا توجد شهادات"
  - one: "شهادة واحدة"
  - two: "شهادتان"
  - few (3-10): "{count} شهادات"
  - many (11+): "{count} شهادة"

### 8.5 Interpolation Implementation

Keys with multiple parameters use the named-arg object pattern:

For example, `publishDialog.dimensions`:
- Type signature: `(width: number, height: number) => string`
- English: `"Dimensions: {width} × {height}px"`
- Arabic: `"الأبعاد: {width} × {height} بكسل"`
- Called as: `t.dashboardTranslations.certificatePreview.publishDialog.dimensions({ width: 800, height: 600 })`

For example, `revert.confirmMessage`:
- Type signature: `(version: number, date: string) => string`
- English: `"Reverting to version {version} (published on {date}) will replace your current draft."`
- Arabic: `"العودة إلى الإصدار {version} (المنشور في {date}) سيستبدل مسودتك الحالية."`

---

## 9. Apollo Cache Strategy

### 9.1 Mutation Cache Updates

| Mutation | Cache Strategy |
|----------|----------------|
| PublishTemplate | `cache.updateQuery` for `TemplateVersionsQueryDocument` — add new version to list. Update template's `status` field via `cache.modify`. Invalidate preview cache. |
| ArchiveTemplate | `cache.modify` on template's `status` field to "archived". Update template list queries (filtered by status). |
| UnarchiveTemplate | `cache.modify` on template's `status` field to "published". Update template list queries. |
| RevertTemplate | `cache.evict` template entity, then `refetchQueries: [{ query: TemplateForPreviewQueryDocument, variables: { templateId } }]` to force fresh draft data. Also refetch `TemplateVersionsQuery` to update `sourceVersionId` tracking. |

### 9.2 Query Fetch Policies

| Query | FetchPolicy | Rationale |
|-------|-------------|-----------|
| TemplateVersionsQuery | `cache-first` | Versions are immutable — cached data is always valid |
| Template (after revert) | `cache-and-network` | Draft content changed on server — needs fresh data |

---

## 10. Permissions

### 10.1 Required Permissions

Operations are split between **view** (read-only preview) and **manage** (publish/archive/revert). Permission keys use the canonical dot-path from `INTER_PLAN_CONTRACTS.md`:

| Operation | Permission Key | Enum | Description |
|-----------|---------------|------|-------------|
| Open preview page | `certificates.templates.view` | `CertificateTemplateView` | View template preview (read-only) |
| View version history | `certificates.templates.view` | `CertificateTemplateView` | List published versions |
| Preview a specific version | `certificates.templates.view` | `CertificateTemplateView` | Read-only render of historical version |
| Publish template | `certificates.templates.manage` | `CertificateTemplateManage` | Create a new published version |
| Archive template | `certificates.templates.manage` | `CertificateTemplateManage` | Archive a published template |
| Unarchive template | `certificates.templates.manage` | `CertificateTemplateManage` | Restore an archived template |
| Revert to version | `certificates.templates.manage` | `CertificateTemplateManage` | Revert draft to a previous version |

### 10.2 Permission Enforcement

**Layered enforcement**:

| Layer | Mechanism |
|-------|-----------|
| **App Router page** (`page.tsx`) | Server-side: `getServerAuth()` → check `CertificateTemplateView`. Redirect to `/unauthorized` if missing. Enforces the minimum view permission. |
| **GraphQL mutations** (publish/archive/revert) | Pothos resolver checks `ctx.permissions` for `CertificateTemplateManage`. Returns `FORBIDDEN` GraphQL error with i18n key `dashboardTranslations.certificatePreview.shell.permissionDenied` if missing. |
| **GraphQL queries** (TemplateForPreview, TemplateVersions) | Pothos resolver checks `ctx.permissions` for `CertificateTemplateView`. Returns `FORBIDDEN` if missing. |
| **Frontend UI** (ViewModel) | `useUserStore()` exposes user permissions. ViewModel computes `canPublish` and `canManage` boolean flags. Tier views conditionally render publish/archive/revert buttons. No `useAppTranslation` needed for this logic. |

### 10.3 Frontend Permission Flags

ViewModel exposes these permission-derived flags:

| Flag | Computed From | Gates |
|------|--------------|-------|
| `canView` | user has `CertificateTemplateView` | Page access (enforced server-side but also available for conditional rendering) |
| `canPublish` | user has `CertificateTemplateManage` | Publish button, publish dialog confirm action |
| `canManage` | user has `CertificateTemplateManage` | Archive/Unarchive/Revert buttons, revert action in version history |
| `isTemplateOwner` | `template.createdByUserId === currentUserId` | Additional gate for archive operation (teachers can only archive their own templates) |

### 10.4 Permission Error i18n

| Key | EN | AR |
|-----|----|----|
| `shell.permissionDenied` | "You don't have permission to access this template" | "ليس لديك صلاحية للوصول إلى هذا القالب" |
| `shell.publishDenied` | "You don't have permission to publish templates" | "ليس لديك صلاحية لنشر القوالب" |

---

## 11. Outcome & Knowledge Transfer

### 11.1 Knowledge to Capture

| Knowledge Item | Target | Description |
|----------------|--------|-------------|
| Version snapshot table schema | Plan 16+ (Certificate Generation) | The `template_versions` table structure that certificates reference via `templateVersionId` |
| Publish mutation contract | Plan 16+, frontend | The mutation signature and response shape for triggering publish from CLI/tools |
| Status enum values | All dependent plans | The `TemplateStatus` enum: draft, published, archived — used by Plan 10 (template CRUD), Plan 16 (certificate generation) |
| Cache invalidation contract | Plan 6 (PDF Rendering) | The `invalidateTemplateRenders(templateId)` service interface for cache clearing |
| Preview element renderer | Plan 11 (Visual Canvas) | The shared element rendering logic that the canvas editor and preview both use |
| `sourceVersionId` tracking | Plan 10 | Template record's `sourceVersionId` field, set on revert |

### 11.2 Design Artifacts for Downstream Plans

- **Database schema migration** for `template_versions`, `template_version_elements`, `template_version_variables` tables — consumed by Plan 5 (GraphQL) and Plan 16 (Certificate Generation)
- **GraphQL schema additions** for publish/archive/revert mutations and versions query — consumed by frontend codegen
- **TemplateStatus enum** — consumed by Plan 10, Plan 16, and all UI components
- **Validation service contract** — the `validateForPublish` interface that can be reused by Plan 16 for pre-generation validation

### 11.3 Assumptions for Downstream Plans

- Plan 11 (Visual Canvas) provides: `TemplateElementType[]`, `TemplateVariableType[]`, and the editor Zustand store with template draft data
- Plan 6 (PDF Rendering) provides: `invalidateTemplateRenders(templateId)` service method and render cache infrastructure
- Plan 10 (Template CRUD) provides: `TemplateType` with `status` field, template list queries filtered by status
- Plan 5 (GraphQL API) provides: Pothos schema builder, context with `t()` for i18n, permission checking middleware

---

## 12. Enhanced Component Specifications (Plan 15 Extension)

> Added 2026-08-02 — detailed component tree for the enhanced preview, publish, and version-history UI surfaces. These extend (do not replace) the component hierarchy in §4 and the store contracts in §3.2–§3.3.

---

### 12.1 TemplatePreviewPage (Page-Level Container)

**Component**: `TemplatePreviewPage`
**File**: `frontend/views/dashboard/cert/templates/preview/TemplatePreviewPage.tsx`

**Purpose**: Top-level page component for the enhanced template preview experience. Orchestrates the toolbar, canvas, and sidebar sub-components. Hosts the dedicated preview-route page wired by T09 (`app/(dashboard)/certificates/templates/[id]/preview/page.tsx`).

**Layout Stack** (vertical):

1. **Header** (app bar / toolbar composite):
   - Left: Template name (Typography, `sx={{ fontWeight: 700 }}`), "Preview Mode" badge (MUI `Chip` with `color="info"`), Back to editor button (MUI `Button` with `ArrowBackOutlined` icon → navigates to `app/(dashboard)/certificates/templates/[id]/edit`)
   - Right: "Publish" button (opens `PublishDialog`), "Version History" button (opens `VersionHistoryPanel`)
2. **PreviewToolbar** (horizontal MUI `Toolbar`):
   - Left: Mode switcher (`ToggleButtonGroup`): Desktop | Mobile | PDF | Print
   - Center: Zoom controls (zoom out `IconButton` with `ZoomOutOutlined`, zoom % `Typography`, zoom in `IconButton` with `ZoomInOutlined`, fit-to-screen `IconButton` with `FitScreenOutlined`)
   - Right: Sample data selector (`SampleDataSelector` — MUI `Select` dropdown), Variable override toggle (`Switch` with label)
3. **PreviewCanvas** (center): Renders the certificate based on the active mode (desktop/mobile/pdf/print). Takes `mode`, `templateId`, `sampleData`, `zoom`, `variableOverrides` per `PreviewCanvasProps`.
4. **PreviewSidebar** (right, collapsible): Hosts the `VariableOverridePanel`. Collapses via MUI `Drawer` (anchor="right", variant="persistent") or a `Collapse` inside the layout. Only rendered when the variable override toggle is ON.

**Props**:

```typescript
interface TemplatePreviewPageProps {
  templateId: string;
  locale: string;
}
```

**Behavior**:
- Calls `usePreviewViewModel({ templateId })` (§3.4) for template data + labels
- Subscribes to `useCertPreviewStore` (§3.2) for mode, zoom, sample data, override toggle
- Subscribes to `useCertPublishStore` (§3.3) for publish dialog + version history visibility
- Renders `PublishDialog` (open-conditional) and `VersionHistoryPanel` (open-conditional)
- Mode changes re-render `PreviewCanvas` with the updated `mode` prop
- Zoom changes apply CSS `transform: scale()` to the canvas container

---

### 12.2 PreviewCanvas (Center Rendering Surface)

**File**: `frontend/views/dashboard/cert/templates/preview/PreviewCanvas.tsx`

**Purpose**: The central rendering surface that adaptively renders the certificate in one of four modes. Each mode targets a different verification use-case (layout check, mobile responsiveness, PDF fidelity, print output).

**Props Interface** (`PreviewCanvasProps`):

```typescript
interface PreviewCanvasProps {
  mode: 'desktop' | 'mobile' | 'pdf' | 'print';
  templateId: string;
  sampleData: Record<string, unknown>;
  zoom: number;
  variableOverrides: Record<string, string>;
}
```

**Rendering Modes**:

| Mode | Rendering Strategy | Container | Dimensions | Notes |
|------|-------------------|-----------|------------|-------|
| Desktop | DOM render at 1:1 scale; absolute-positioned elements over background image | `Box` with `position: relative` | Template dimensions (e.g. 1200×850px landscape A4) | Same coordinate space as Plan 11 canvas; zoom via CSS `transform: scale()` |
| Mobile | DOM render scaled to mobile viewport | `Box` width-clamped to 375px, height proportional | 375px width, height scaled proportionally | Responsive check: text overflow, element clipping. Scale = 375 / templateWidth |
| PDF | `<iframe>` with server-rendered PDF URL | `iframe` styled to fill canvas area | Iframe matches PDF aspect ratio | URL: `/api/certificates/templates/${templateId}/preview.pdf?sampleData=...` (Plan 6 endpoint). Pixel-perfect match with final output. Shows a loading spinner while the PDF renders. |
| Print | Opens browser print dialog with print-optimized CSS | N/A (delegates to browser) | Uses `@media print` stylesheet | Print CSS hides toolbar/sidebar; renders only the certificate. Triggered via `window.print()` with a `printCertPreview` class on the certificate wrapper. After the dialog closes, mode reverts to the previous mode. |

**Shared rendering** (modes desktop + mobile):
- Uses the `CertificatePreviewCanvas` component (§4.4.1) for element rendering
- Applies the active `sampleData` and `variableOverrides` to resolve variable placeholders
- Zoom is applied as a CSS `transform: scale(zoom / 100)` on the canvas wrapper; `transform-origin: top center`

**Print mode CSS**:
```css
@media print {
  body * { visibility: hidden; }
  .printCertPreview, .printCertPreview * { visibility: visible; }
  .printCertPreview { position: absolute; top: 0; left: 0; width: 100%; }
}
```

**Error handling**: If the template has no elements, shows an empty-state message (`previewCanvas.emptyTemplate` from i18n). If the PDF iframe fails to load, shows `previewCanvas.previewError`.

---

### 12.3 SampleDataSelector (Sample Data Dropdown)

**Component**: `SampleDataSelector`
**File**: `frontend/views/dashboard/cert/templates/preview/SampleDataSelector.tsx`

**Purpose**: Dropdown for selecting pre-configured sample data profiles to populate variable placeholders during preview. Lets designers quickly verify rendering with realistic test data.

**Props**:

```typescript
interface SampleDataSelectorProps {
  selectedId: string | null;
  onSelect: (data: SampleData) => void;
  templateId: string;
}

interface SampleData {
  id: string;
  name: string;
  description: string;
  variableValues: Record<string, string>;
}
```

**Layout**: MUI `Select` dropdown (not `Autocomplete` — single selection only).

**Pre-configured Sample Options**:

| Option | id | description | variableValues |
|--------|----|-------------|----------------|
| Ahmed (Graduate) | `sample-ahmed-graduate` | Standard Arabic name, moderate length | `recipientName: "أحمد محمد العلي"`, `courseName: "البرمجة المتقدمة"`, `completionDate: "2026-07-15"` |
| Fatima (Long Arabic Name) | `sample-fatima-long` | Edge case: very long Arabic name to test overflow | `recipientName: "فاطمة الزهراء بنت محمد عبد الرحمن السالم"`, `courseName: "تصميم التجربة التعليمية الشاملة"`, `completionDate: "2026-08-01"` |
| John (Short Name) | `sample-john-short` | Edge case: short Latin name | `recipientName: "John Doe"`, `courseName: "Intro to Python"`, `completionDate: "2026-06-30"` |
| Empty Variable Test | `sample-empty` | All variables empty — verifies fallback / placeholder behavior | All values `""` |
| Custom... | `custom` (special) | Opens a dialog with all template variables as editable fields | User-provided |

**"Custom..." Dialog**:
- Opens a MUI `Dialog` titled "Custom Sample Data" (`sampleData.customData` i18n key)
- Lists every template variable (from the template query) as an editable `TextField`, with the variable's `display_name` as the label and current preview value as default
- Date variables render as `DatePicker`; boolean variables render as `Switch`; default `TextField` for text
- "Save" button: creates a `SampleData` with `id: "custom-<timestamp>"`, `name: "Custom"`, commits via `onSelect`
- "Cancel" button: closes dialog without changes

**Recently used samples**:
- The last 5 selected sample IDs are persisted in `localStorage` under key `cert-preview-recent-samples-<templateId>`
- On mount, recently used samples are loaded and shown as a "Recent" group at the top of the dropdown (MUI `ListSubheader` divider)
- Pre-configured samples always appear below the "Recent" group under a "Built-in" group header
- `localStorage` operations are wrapped in try/catch (SSR-safe: guarded by `typeof window !== "undefined"`)

**Behavior**:
- On select, calls `onSelect(data)` — the page-level store updates `sampleData` and re-renders `PreviewCanvas`
- The `selectedId` prop drives the dropdown's displayed value
- If `selectedId` matches a recently used sample, it is highlighted; built-in samples are always selectable

---

### 12.4 VariableOverridePanel (Right Sidebar)

**Component**: `VariableOverridePanel`
**File**: `frontend/views/dashboard/cert/templates/preview/VariableOverridePanel.tsx`

**Purpose**: Collapsible panel for overrides. Lets designers test how individual variables render with specific values, beyond the selected sample data. Overrides take precedence over sample data values.

**Layout**: Hosted inside the `PreviewSidebar` (right, collapsible).

**Content**: MUI `Table` with columns:

| Column | Type | Control | Description |
|--------|------|---------|-------------|
| Variable Name | readonly text | `Typography` | The variable's `displayName` (not the raw key) |
| Type | readonly badge | MUI `Chip` | The variable's type: `text`, `date`, `boolean`, `number` (color-coded: text=primary, date=secondary, boolean=success, number=info) |
| Resolved Value | readonly text | `Typography` | The value currently resolved from the selected sample data (read-only display) |
| Override Value | editable | type-dependent control | `TextField` for text, `DatePicker` for date, `Switch` for boolean, `TextField` (number) for number. Empty = no override (uses resolved value). |

**Controls**:
- **"Reset All" button** (`Button` with `RestartAltOutlined` icon): Clears all overrides (`variableOverrides = {}` in the store)
- Only visible when the "Variable override" toggle in the toolbar is ON (`showOverridePanel === true` in `useCertPreviewStore`)

**Real-time updates**:
- All control changes dispatch `setOverride(variableId, value)` on `useCertPreviewStore`
- `PreviewCanvas` subscribes to `variableOverrides` via Zustand → re-renders immediately when any override changes
- The resolved value column updates when the sample data changes (host-page propagates the new `sampleData`)

**Empty state**: If the template has no variables, shows `sampleData.noVariables` i18n message.

---

### 12.5 PublishDialog (3-Step Publish Wizard)

**Component**: `PublishDialog`
**File**: `frontend/views/dashboard/cert/templates/publish/PublishDialog.tsx`

**Purpose**: A 3-step wizard that validates the template, collects version notes, and confirms the publish action. Uses MUI `Stepper` with `activeStep` state.

**Props**:

```typescript
interface PublishDialogProps {
  open: boolean;
  templateId: string;
  onClose: () => void;
  onPublished: () => void;
}
```

**Step 1 — Validation Summary**:

| Check | Pass Condition |
|-------|----------------|
| Template has elements | `elements.length > 0` |
| All variables are mapped | Every `data_*` element's `variableId` resolves to an existing variable |
| No unresolved bindings | No element references a deleted/missing variable |
| Template size within limits | Element count ≤ 100 AND total JSON payload ≤ 256KB |

- Each check renders as a row with a pass/fail icon (`CheckCircleOutlined` green / `ErrorOutlined` red) and the check label
- If any check fails: "Publish" / "Next" button is disabled; failed checks expand to show error details (i18n key from `validation.*` section)
- If all checks pass: green checkmark banner, "Next" button becomes enabled
- Validation runs on dialog open (via `useEffect` calling the ViewModel's `runValidation`) — validation is client-side and mirrors the server validation but is advisory; final enforcement is server-side

**Step 2 — Version Notes**:
- MUI `TextField` (multiline, `maxRows={4}`, `inputProps={{ maxLength: 500 }}`): "What changed in this version?" (`publishDialog.versionNotesLabel`)
- MUI `Switch` (default ON): "Set as active version" (`publishDialog.setAsActiveLabel`) — bound to `useCertPublishStore.setAsActive`
- Version number preview: `Typography` showing "Publishing as version v{n+1} (based on last published v{n})" — queries `TemplateVersionsQueryDocument` for the current max version number on mount; falls back to "v1 (first publish)" if no versions exist

**Step 3 — Publish & Confirm**:
- Summary card (MUI `Card`):
  - Template name (from preview ViewModel)
  - Version number (v{n+1})
  - Version notes preview (truncated to 3 lines with "..." if longer)
  - "Active" badge (MUI `Chip` `color="success"`) if "Set as active" is on
- **"Publish" button**: MUI `LoadingButton` — disabled until all validation checks pass; shows `CircularProgress` while `isPublishing === true` in `useCertPublishStore`
- On success: stepper advances to a success overlay / mini-dialog with:
  - Success icon + "Template published successfully" message
  - "View Template List" button → navigates to `app/(dashboard)/certificates/templates`
  - "Create Another" button → closes dialog, resets publish state

**Error handling**:
- If the mutation throws (infrastructure error): shows `Alert severity="error"` with the error message, keeps the user on Step 3
- If `result.success === false` (domain validation failure): shows the returned `errors[]` in an `Alert severity="error"`, navigates back to Step 1 to show the validation failures highlighted
- On any error, `onPublished` is NOT called (only called on success)

---

### 12.6 VersionHistoryPanel (Timeline)

**Component**: `VersionHistoryPanel`
**File**: `frontend/views/dashboard/cert/templates/publish/VersionHistoryPanel.tsx`

**Purpose**: A vertical timeline visualizing all published versions of a template. Offers per-version actions: restore, view (read-only preview), and diff (element-level comparison).

**Layout**: MUI `Timeline` (`position="left"` on desktop, `position="right"` on RTL).

**Each version entry** (MUI `TimelineItem`):

| Field | Component | Description |
|-------|-----------|-------------|
| Version number | `TimelineContent` header: `Typography` "v{n}" | Bold, large |
| Status badge | MUI `Chip` | Active (green `color="success"`), Draft (gray `color="default"`), Archived (yellow `color="warning"`). Active version also gets a special border (CSS `border: 2px solid theme.palette.success.main`) |
| Author | `Avatar` + name | `publishedBy` user's avatar + display name |
| Date | `Typography` | Relative ("3 days ago") + absolute ("2026-08-02 14:30") — uses existing date formatting utility |
| Notes | `Typography` (truncated) | The `versionNotes` from the publish dialog; expands to full text on click |
| Actions dropdown | MUI `IconButton` with `MoreVertOutlined` → `Menu` | See actions below |

**Actions dropdown** (per version):

| Action | i18n key | Behavior |
|--------|---------|---------|
| Restore | `versionHistory.restore` | Creates a new draft from this version's snapshot. Opens restore confirmation dialog (see below). Disabled if the version is already the active draft source. |
| View | `versionHistory.view` | Opens a read-only preview in `PreviewCanvas` with `mode="desktop"` using the version's snapshot elements/variables. Shows a "Historical Version" banner at the top. |
| Diff with Current | `versionHistory.diffWithCurrent` | Opens `VersionDiffView` comparing this version vs the current draft (or active version). Sets `diffVersions` in `useCertVersionStore`. |

**Restore confirmation dialog** (MUI `Dialog`):
- Message: "Restoring version v{n} will create a new draft. The current draft will be saved as v{n}.1. Continue?" (i18n key `versionHistory.restoreConfirmMessage` with `version` interpolation)
- Buttons: "Cancel" (closes), "Restore" (MUI `LoadingButton`, calls `restoreVersion(versionId)` via the ViewModel)
- On success: toast notification, version history refetches, the timeline highlights the new draft

**Active version highlight**: The version with `isActive: true` gets a dashed green border on the entire `TimelineItem` and a "Active" label badge.

---

### 12.7 VersionDiffView (Element-Level Version Comparison)

**Component**: `VersionDiffView`
**File**: `frontend/views/dashboard/cert/templates/publish/VersionDiffView.tsx`

**Purpose**: Side-by-side visual + tabular comparison of two template versions to help reviewers understand exactly what changed between publishes.

**Props**:

```typescript
interface VersionDiffViewProps {
  versionA: string; // version ID
  versionB: string; // version ID
  templateId: string;
}
```

**Layout**: MUI `Grid` (2 columns), full-height `Dialog` or full page.

**Left column — Version A** ("Version A" header + version number): Mini preview canvas (`PreviewCanvas` with `mode="desktop"`, `zoom` auto-fit) rendering the version A snapshot elements.

**Right column — Version B** ("Version B" header + version number): Mini preview canvas rendering the version B snapshot elements.

**Below the split — Element-level changes list** (MUI `List`):

| Change Type | Visual Treatment | Details |
|-------------|-----------------|---------|
| Added elements (in B, not in A) | Green highlight (`sx={{ bgcolor: 'success.main', color: 'success.contrastText' }}`) | Element name + type icon |
| Removed elements (in A, not in B) | Red strikethrough (`sx={{ textDecoration: 'line-through', color: 'error.main' }}`) | Element name + type icon |
| Modified elements (same id in both, different properties) | Yellow row (`sx={{ bgcolor: 'warning.main', color: 'warning.contrastText' }}`) | Element name + property-level diffs as sub-list: e.g. `fontSize: 16 → 18`, `x: 120 → 140` |

**Element comparison logic**:
- Elements are matched by `id` (stable across versions — same element id means the element persisted)
- For matched elements, each property (x, y, width, height, fontSize, fontFamily, color, text, etc.) is compared; modified properties are listed as `propertyName: oldValue → newValue`
- Unmatched-by-id elements: if present in A only → "Removed"; if present in B only → "Added"

**No-changes state**: If both versions are identical, shows a centered "No differences found" message (`versionHistory.noDifferences` i18n key).

---

### 12.8 Enhanced Zustand Stores (Preview, Publish, Version)

> These extend the store contracts in §3.2–§3.3 with the new fields/actions needed for the enhanced UI in §12.1–§12.7. The existing fields in §3.2 / §3.3 are retained; the interfaces below add the new state surface.

#### 12.8.1 `PreviewState` (extends `useCertPreviewStore` from §3.2)

```typescript
interface PreviewState {
  // --- Existing fields from §3.2 (retained) ---
  isPreviewOpen: boolean;
  testValues: Record<string, string>;
  selectedSampleRecipientId: string | null;
  zoomLevel: number;
  isFitToScreen: boolean;
  previewMode: 'draft' | 'version';
  previewVersionId: string | null;
  downloadFormat: 'pdf' | 'image';
  // --- New: enhanced preview fields ---
  mode: 'desktop' | 'mobile' | 'pdf' | 'print';
  zoom: number; // percentage, same scale domain as zoomLevel (10–200)
  sampleDataId: string | null;
  variableOverrides: Record<string, string>; // key: variableId → override value
  showOverridePanel: boolean;
  isRendering: boolean;
  renderError: string | null;
  // Actions
  setMode: (mode: 'desktop' | 'mobile' | 'pdf' | 'print') => void;
  setZoom: (zoom: number) => void;
  selectSampleData: (id: string | null) => void;
  setOverride: (variableId: string, value: string) => void;
  clearOverrides: () => void;
  toggleOverridePanel: (show?: boolean) => void;
  startRender: () => void;
  setRenderError: (error: string | null) => void;
  // ... existing actions from §3.2 retained
}
```

#### 12.8.2 `PublishState` (extends `useCertPublishStore` from §3.3)

```typescript
interface PublishState {
  // --- Existing fields from §3.3 (retained) ---
  isPublishDialogOpen: boolean;
  isArchiveDialogOpen: boolean;
  isUnarchiveDialogOpen: boolean;
  isRevertDialogOpen: boolean;
  revertTargetVersion: TemplateVersionType | null;
  isVersionHistoryOpen: boolean;
  publishLoading: boolean;
  archiveLoading: boolean;
  revertLoading: boolean;
  versionNotes: string;
  versionPreviewingId: string | null;
  // --- New: enhanced publish fields ---
  setAsActive: boolean;
  isPublishing: boolean; // alias / more specific name for publishLoading
  publishError: string | null;
  lastPublishedVersion: string | null; // version number string after a successful publish
  // Actions
  openPublishDialog: () => void;
  closePublishDialog: () => void;
  setVersionNotes: (notes: string) => void;
  toggleSetAsActive: (value?: boolean) => void;
  startPublish: () => void;
  setPublishError: (error: string | null) => void;
  // ... existing actions from §3.3 retained
}
```

#### 12.8.3 `VersionState` (new store — `useCertVersionStore`)

**File**: `frontend/stores/certVersionStore.ts`

**Purpose**: Holds the expanded version-history panel state (visible versions list, active version pointer, restoring flag, and the diff pair selection for `VersionDiffView`). Kept separate from preview/publish stores to avoid coupling lifecycle concerns.

```typescript
interface TemplateVersion {
  id: string;
  versionNumber: number;
  status: 'active' | 'draft' | 'archived';
  publishedAt: string; // ISO timestamp
  publishedBy: { id: string; displayName: string; avatarUrl: string | null };
  notes: string | null;
  elementCount: number;
  variableCount: number;
  previousVersionId: string | null;
}

interface VersionState {
  versions: TemplateVersion[];
  activeVersionId: string | null;
  isRestoring: boolean;
  diffVersions: [string, string] | null; // [versionAId, versionBId]
  // Actions
  loadVersions: (templateId: string) => Promise<void>;
  restoreVersion: (versionId: string) => Promise<void>;
  openDiff: (versionAId: string, versionBId: string) => void;
  closeDiff: () => void;
}
```

**Notes**:
- Created with `create` (NO `persist` — ephemeral)
- `TemplateVersion` type is imported from `frontend/common/graphql/generated/gql/graphql-types.ts` (or derived); must include `id` for Apollo cache normalization
- `loadVersions` calls `TemplateVersionsQueryDocument` via the ViewModel and populates `versions` + `activeVersionId`
- `restoreVersion` calls `RevertTemplateMutationDocument` (or a new `RestoreVersionMutationDocument` if §3.1 evolves) and refetches the versions list on success
- `openDiff` / `closeDiff` control the `VersionDiffView` dialog visibility

---

## Reality Check Notes

Verified against the actual codebase at `/home/ahmed/Projects/siraj-cert/` on 2026-08-02.

### Verified correct (no change needed)
- **App Router**: `app/(dashboard)/certificates/templates/[id]/preview/page.tsx` matches the existing `app/(dashboard)/<domain>/...` convention (verified `students/`, `billing/`).
- **Shared views**: `frontend/common/views/dashboard/certificates/templates/...` matches `frontend/common/views/dashboard/<domain>/` (verified `students/`, `billing/`).
- **Zustand store AGENTS ref**: corrected `frontend/stores/AGENTS.md` → `frontend/common/stores/AGENTS.md` in requirements.md (a `frontend/stores/` directory does NOT exist; stores live in `frontend/common/stores/`).
- **`backend/types/AGENTS.md`** & **`backend/services/AGENTS.md`** references are correct files that exist.
- **sharedDocuments domain organization**: confirmed is by domain sub-folder each with an `index.ts` barrel (`students/`, `billing/`, `classes/`). Any version-snapshot documents must live under `sharedDocuments/certificates/`.

### Corrections made in this plan file
- **sharedDocuments path**: `frontend/common/graphql/sharedDocuments/cert/templatePublish.documents.ts` → `frontend/common/graphql/sharedDocuments/certificates/templatePublish.documents.ts` (domain sub-folder is `certificates/`, NOT `cert/`; matches the verified `students/`, `billing/` layout).
- **Tier view paths** (tasks.md): `frontend/{desktop,mobile}/views/certificates/templates/preview/` → `frontend/{desktop,mobile}/views/dashboard/certificates/templates/preview/` (all desktop/mobile views live under a `dashboard` segment — verified `frontend/desktop/views/` and `frontend/mobile/views/` contain only a `dashboard/` child).
- **i18n access signatures (§8.2 was hypothetical)**:
  - Client: `useAppTranslation(Translation.Dashboard.Certificate)` → `useAppTranslation(Translation.Certificates.TemplatePublish)` (handle is an object, not a string); import from `@/shared/locale`, not `@/shared/locale/client`.
  - GraphQL resolver: `ctx.t().certTranslations` → `ctx.t().certTranslations.templatePublish.publish.failed` (`ctx.t()` returns the full `Translations`, no namespace arg — verified `backend/graphql/gqlContext.ts:30` and `server-graphql.ts`).
  - Server component (SSR): `getTranslations(locale).dashboardTranslations.certificate` → `getTranslations(locale).certTranslations.templatePublish.versionHistory.title` (synchronous; only `locale` arg — verified `shared/locale/server.ts`).

### i18n convention reminder (cross-plan)
No `certificates` namespace exists yet in `shared/locale/` (verified `shared/locale/namespaces/`, `en/`, `ar/`, `types/` have no `certificates/`). It is introduced by the cert program as a new top-level `certTranslations` key per `siraj_analysis/06-i18n-system.md` §13. The actual signatures are dictated by the code: `getTranslations(locale)` returns the whole `Translations` object and `ctx.t()` is `() => getServerTranslations(locale)` — both synchronous, neither accepts a namespace argument. Pluralization uses typed `(count: number) => string` functions (no ICU).


---

## SWE Expert Review Notes

> Added 2026-08-02 by Staff SWE architectural review (Part A: spec analysis × Part B: codebase reality check).

### 1. Version snapshot model

- **Correct and well-designed.** Separate `template_versions` + `template_version_elements` + `template_version_variables` tables with deep-copy snapshots, `previousVersionId` chain, and certs referencing `templateVersionId` (not the mutable template id) — this is the right immutable-snapshot pattern (matches how the codebase isolates audited history, e.g. `student-status-history.repository.ts`). **Verified convention:** the codebase uses namespace-exported repos with `queryDb(tx)` for reads and `tx ?? db` for writes (verified `student.repository.ts`); the publish-service's version-snapshot repo must follow the same signature (`tx?: DBTransaction`).
- **Gap: deep-copy is not transactionally bounded in the contract.** `publish(templateId, userId, tx)` takes a `tx` — good — but the spec must state the snapshot inserts (N elements + M variables) all run inside that single `tx`, and that `versionNumber == MAX(versionNumber)+1` must be computed **with a row lock** (`SELECT ... FOR UPDATE` on the template or an `advisory_xact_lock` like `student.repository.ts:acquireStudentLock`) to prevent two concurrent publishes from racing on the same `max+1` and producing duplicate version numbers. **Critical concurrency fix.**
- **`template_version_variables` deep copy** must include the per-variable `config` JSONB or generation from a snapshot will diverge from draft. Confirm Plan 1's `template_version_variables` mirrors ALL columns of `certificate_template_variables` (including `config`, `is_system`, `display_order`). Not stated in this design — verify against Plan 1.

### 2. Publish workflow (draft → review → published → archived)

- **State machine (§5) omits the `review` state** that the task brief asks about. The MASTER_ARCHITECTURE entity model lists template status as `draft/published/archived` (no `review`). So either the brief's "review" state does not exist in this program (publish goes draft→published directly) OR it was dropped. **Fix:** this plan must explicitly state "there is no explicit `review`/approval state — publish is a single-step transition gated by validation + user confirmation" so downstream plans don't assume an approval queue. If a review/approval state IS wanted for ACADEMY_ADMIN oversight of TEACHER templates, it must be added to Plan 1's `TemplateStatus` pgEnum now — flag as a product decision.
- **Rollback** is modeled as `Revert` (DD-06: revert loads a version into the *draft*, does NOT create a new published version). This is a sound, deliberate choice. **Gap:** "rollback" usually means *un-publish* a live version (because certs already issued from it can't be un-issued). The plan correctly does NOT attempt to revoke issued certs on revert — but must **state that explicitly**: revert only changes future-draft editing; already-generated certificates from a published version are immutable and unaffected (they reference the immutable snapshot). Add this invariant to the i18n/design so users aren't surprised that "revert" doesn't undo issued certs.
- **Concurrent edits during publish** — **UNADDRESSED.** This is a top risk. If a TEACHER is editing element X in the canvas (Plan 11 draft in Apollo cache) while an ACADEMY_ADMIN publishes, the snapshot copies the *current DB draft* which may be mid-save. Mitigations to specify:
  1. The publish mutation should **acquire a template-level advisory lock** (`pg_advisory_xact_lock(hashtext('template_'||templateId))` — same idiom as `student.repository.ts:87`) for the snapshot read+insert window, AND
  2. Force the editor (Plan 11) to **flush/save before publish** (the Publish button should be disabled with toast "Save your changes before publishing" if the canvas has unsaved edits in the Zustand store), AND
  3. After a successful publish, the client must **refetch the draft** (an optimistic edit made during publish would otherwise be stale vs the new server state).
  None of this is in the spec — **add a "Concurrency" subsection.**

### 3. Preview rendering (client vs server)

- **Client-side React rendering (DD-01)** is the correct call (interactive, instant, no Puppeteer round-trip). **Gap:** there is an inherent **fidelity risk** between the React-canvas preview (CSS transforms, browser font fallback, `<img>` async decode, client-side QR lib) and the *actual* Puppeteer PDF (Plan 6). The plan acknowledges "exact fidelity only at generation" but doesn't define a **contract** so the two renderers don't drift. Recommend: both Plan 11 canvas, Plan 15 preview, and Plan 6 PDF MUST share a single `PreviewElementRenderer`/element-measurement module (the design says Plan 11 shares it — good) and the PDF engine must export a **snapshot test** comparing its output to the preview's bounding boxes. At minimum state the shared module boundary here so it's enforceable.
- **Test-value panel** uses `testValues: Record<varName, string>` keyed by *name*, not *id*. If a variable is renamed mid-session the key breaks silently. Key by `variableId` (stable) and resolve the value by id — matches Plan 13's "use `id` for cache, never `name`" risk mitigation. **Fix the store type.**
- **Preview reads from the editor's Zustand store** (DD-05) to avoid a fetch — good for performance, but means **unsaved** draft is previewed, which differs from what publish will snapshot (the *saved* draft). Either (a) preview must require a save first (browser-native pattern: "Preview shows unsaved changes"), or (b) the spec must clearly say "preview reflects unsaved draft; publish validates the *persisted* draft — call `saveTemplate` before `publish`." Add to the Concurrence subsection above.

### 4. State management

- Two separate stores (`useTemplatePreviewStore`, `useTemplatePublishStore`) — correct separation (preview state vs workflow dialogs). **Verify tasks.md creates both WITHOUT `persist`** (ephemeral editor sub-state; matches `frontend/common/stores/AGENTS.md` non-persisted mitigation). The `revertTargetVersion: TemplateVersionType | null` holds a GraphQL-generated entity type in Zustand — confirms the "import types from `graphql-types.ts`" rule. Good.
- **Optimistic updates** for publish/archive are partial: `cache.modify` on `status` is correct, but **Revert's cache strategy is hand-wavy** ("evict template entity to force re-fetch"). Evicting the whole template entity invalidates the element/variable lists too (they're normalized by `id`). Specify: after revert, `client.refetchQueries({ include: [TemplateElementsQuery, TemplateVariablesQuery] })` with `cache-and-network` (already noted §9.2 for "Template (after revert)") — make tasks.md enforce this rather than a single `evict`.

### 5. GraphQL design

- `TemplateVersionsQuery`, `cache-first` — correct (versions are immutable). **Batched `certificateCount`** via aggregate subquery (DD-08) avoids N+1 — good. But `elementCount`/`variableCount` per version: if these are computed by `COUNT` over the snapshot tables per version row, that's again per-row aggregation — store them as **denormalized columns** on `template_versions` at publish time (write once, read many) instead of recomputing. The deep-copy insert already counts them; persist the count. **Optimization fix.**
- `PublishTemplate` returns `{success, versionNumber, errors[], warnings[], cacheInvalidated}` — **non-standard**: most Siraj mutations throw GraphQL errors for infrastructure failures and return payload for domain failures. The split here ("validation failures → payload `success:false`; infra failures → throws") is reasonable and documented, **but** the frontend must handle BOTH paths (try/catch + `result.errors`). Confirm `useTemplatePublishViewModel.confirmPublish` checks `error` AND `result.success === false`. Add to the ViewModel contract.
- **No bulk publish** (publish many templates at once) — out of scope, acceptable; state it.
- **Revert mutation does NOT validate** that the target version belongs to `templateId` — add a guard `WHERE id = versionId AND templateId = :templateId` (defense in depth; otherwise an attacker passing an arbitrary `versionId` could load another template's snapshot into this template's draft). Specify in the service contract.

### 6. Security

- **TEACHER scope** — same gap as Plans 13/14: `CERTIFICATES_TEMPLATES_MANAGE` is the only gate, and TEACHER "own templates only" enforcement requires an ownership column on `certificate_templates` (verified codebase uses per-row `teacherId`/`createdById`, NOT a global `tenantId`). **Block until Plan 1 confirms the ownership column**, and this plan's resolvers must scope publish/archive/revert by it. A TEACHER must not be able to publish/revert another teacher's (or another academy's) template.
- **Revert as an escalation vector:** if a TEACHER can revert to ANY version id without ownership re-check, that's an IDOR. The revert resolver MUST re-verify ownership of the template *and* that `versionId` belongs to it. Add to the security table.
- No student-facing surface here — correct (students only see issued certs via Plan 18/19).

### 7. i18n

- All preview/publish/archive/revert/version-history keys are listed and access signatures are correct (verified). **Gap:** the **validation error `messageKey`/`messageParams`** returned by the server (`ValidationErrorType`) are machine-readable keys — confirm they map to **existing i18n keys** under `certificates.templatePublish.validation.*` (the keys are listed in §7.1 but the i18n §8 doesn't enumerate the `validation.*` leaf keys). Add: `noElements`, `missingDefaultValue(varName)`, `invalidVariableRef(elementName, varName)`, `invalidDimensions`, `duplicateNames(count)` must all have type signatures + ar/en/Namespace-handle entries. The plural `duplicateNames(count)` needs Arabic zero/one/two/few/many.
- **Cache-invalidation warning toast** (`cacheInvalidated:false`) needs an i18n key — not listed. Add `templatePublish.publish.cacheInvalidationFailed`.

### Reality-check corrections applied in this review
- Confirmed `backend/services/idempotency.service.ts` exists — but the publish mutation has **no idempotency-key handling** specified; a double-click of Publish must not create two versions. Reuse the idempotency header pattern. **Fix.**
- Confirmed `student.repository.ts:acquireStudentLock` advisory-lock idiom — apply the same to `publish` and `revert` for version-number race + concurrent-edit protection. **Fix.**
- Confirmed `student-status-history.repository.ts` namespace-export + `queryDb(tx)` pattern — version-snapshot repos must match.
- No file-path corrections needed beyond existing Reality Check Notes.

### Remaining risks
1. **Concurrent edits during publish** — completely unaddressed; needs advisory lock + editor save-gate + client refetch. **High priority.**
2. **Version-number race** (two simultaneous publishes) — needs `FOR UPDATE`/advisory lock on max+1. **High priority.**
3. **TEACHER ownership scoping** on templates — blocked on Plan 1; revert must re-check ownership + versionId∈templateId (IDOR).
4. **`review`/approval state** missing from state machine — confirm intentional or add to Plan 1 pgEnum.
5. **Preview-vs-PDF fidelity contract** — needs shared element renderer + a snapshot/comparison test to prevent drift.
6. **`testValues` keyed by name** — must be keyed by `variableId`; rename breaks the preview.
7. **Idempotency on Publish** — double-click creates duplicate versions; reuse existing idempotency service.
8. **Denormalize `elementCount`/`variableCount`** onto `template_versions` instead of per-row COUNT aggregation in the versions query.

---

## Round 4 Enhancement — Production Hardening

> Added 2026-08-02. Extends design §12 (Enhanced Component Layer) with detailed specification of the production-hardening concerns introduced during SWE review. The components and stores referenced (TemplatePreviewPage, PreviewCanvas, PublishDialog, VersionHistoryPanel, VersionDiffView, useCertPreviewStore, useCertPublishStore, useCertVersionStore) are defined in §12.1–§12.8. Round 4 adds new concerns — the component footprints are extensions of those existing files unless explicitly noted as new files.

### 13.1 Print CSS Specifications

**Purpose**: Ensure that `window.print()` invoked from Print preview mode (§12.2) produces a print-fidelity output that matches the on-screen layout without clipping, blank pages, or printer-driver-specific breakage.

#### 13.1.1 `@page` Rule for Custom Sizes

```css
/* A4 (portrait + landscape) */
@page A4-portrait { size: A4 portrait; margin: 10mm; }
@page A4-landscape { size: A4 landscape; margin: 10mm; }

/* Letter */
@page Letter { size: Letter portrait; margin: 0.5in; }

/* Legal */
@page Legal { size: Legal portrait; margin: 0.5in; }

/* Custom template size (e.g. 210×297mm certificate) */
@page cert-custom { size: 210mm 297mm; margin: 0; }
```

The page size selector (added to `PreviewCanvas` toolbar, visible only in Print mode) sets the `<link rel="stylesheet" media="print">` that maps the chosen size to the matching `@page` rule. When the template canvas dimensions (inherited from Plan 5 `template.width`/`template.height` in px) differ from the chosen paper size, the preview renders a dashed outline showing the printable area — so the user sees how the certificate will be clipped/fit *before* pressing Print.

#### 13.1.2 `page-break-inside: avoid` and Bleed Margins

```css
@media print {
  .preview-canvas,
  .preview-element {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  /* Hide non-canvas UI */
  .preview-toolbar,
  .preview-sidebar,
  .preview-override-panel,
  .preview-sample-selector { display: none !important; }
  /* Bleed: negative margin pulls background to paper edge so no white border appears */
  .preview-canvas { margin: -10mm; }
  /* Background image must print (Chrome skips backgrounds by default) */
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
```

`-webkit-print-color-adjust: exact` is required so the template background image renders in print — without it, Chrome/Edge silently drop background images in Print mode (a long-standing browser behavior). Safari uses `print-color-adjust: exact` (the standard property). Both are emitted to cover the major print-capable browsers on desktop and mobile.

#### 13.1.3 CMYK Color Space Notes

The preview is rendered in an RGB/sRGB color space (browser limitation — CSS has no CMYK support). For professional certificate printing requiring CMYK accuracy, the **PDF generation pipeline (Plan 6)** is the source of truth, not the Preview/Print path. The design notes:

- The preview shows a small "sRGB preview — CMYK conversion is applied during PDF generation" banner in Print mode so users don't assume print colors match preview exactly.
- Image elements flagged with `colorProfile: 'cmyk'` in Plan 5's element schema display a `[CMYK]` badge on the element in Print preview, indicating the color will be converted at generation time.
- No runtime RGB→CMYK conversion is attempted in the browser (it produces inaccurate results). The Plan 6 Puppeteer pipeline handles this server-side via Ghostscript/Poppler when the destination is a physical printer.

#### 13.1.4 Font Embedding for Print

System fonts (Arial, Times New Roman) print reliably. Custom fonts (uploaded via Plan 5 `templateFont` reference or inherited from the academy theme) require `@font-face` with a local URL for the browser to embed the font in the print stream:

```css
@font-face {
  font-family: 'CertificateCustom';
  src: url('/fonts/certificate-custom.woff2') format('woff2');
  font-display: block; /* do not use fallback while the font loads */
}
```

The preview verifies each referenced font is loaded (`document.fonts.ready` promise) before enabling the Print button. If a font fails to load, the toolbar shows a `FontNotReady` warning with a "Retry" button — printing before fonts are ready produces substitutions that shift element boundaries.

#### 13.1.5 Printer Driver Compatibility Notes

- **Chrome on Windows**: honors `@page` size and margin correctly. Print-color-adjust works.
- **Firefox**: supports `print-color-adjust` but ignores `@page` margins in some driver configurations. The certificate template Custom page size falls back to A4 with a warning if Firefox is detected (`navigator.userAgent`).
- **Safari**: does not support custom `@page` sizes from the web reliably — the template is scaled to fit A4/Letter depending on the user's print dialog selection. A Safari-specific notice appears in Print mode when the page size selector is set to a custom size.
- **Mobile (AirPrint on iOS)**: ignores `@page` entirely; uses the printer's default media. Print preview shows a "AirPrint ignores custom sizes — use PDF mode for fidelity" notice on iOS Safari.

These notes are surfaced via the `printCompatibilityNotice` computed in `PreviewCanvas` (Print mode only) so the user is not surprised by driver-specific behavior.

### 13.2 PDF Preview Fidelity

**Purpose**: Guarantee that the "PDF" preview mode (an iframe rendering the server-side `/api/certificates/templates/<id>/preview.pdf` stream — §12.2) is visually identical to the PDF a recipient receives. This is the **fidelity contract** between Plan 15 preview and Plan 6 generation engine.

#### 13.2.1 Pixel-Perfect Match

- The preview PDF uses the **same Puppeteer + element-measurement module** as runtime generation — the server endpoint simply calls the Plan 6 render pipeline with `isPreview: true` (skips the download-triggering `Content-Disposition: attachment` header; uses `inline`)
- The preview endpoint accepts a `recipientId` and `variableOverrides` query param so it renders with the sample recipient + overrides the user selected in the UI (matches §12.3/§12.4 state). Without this, preview and live generation would diverge.
- The PDF is rendered at **300 DPI** (same as production). Lower DPI for preview was considered for speed but rejected — users must see what the recipient sees. The 3-second generation budget (§13.7 below) assumes 300 DPI.

#### 13.2.2 Font Rendering Verification

- After the PDF iframe finishes loading (`onLoad`), the AppBar shows a "PDF ready" state and the "Download" button becomes enabled.
- Aperçu: a fingerprint hash of the PDF (first 1MB SHA-256) is displayed in a tooltip on the iframe — used by the SWE team to compare preview vs production outputs in regression tests. Mismatch → test fails.
- Fonts referenced in the uploaded template must appear in the iframe; if the blob shows Tofu (□) glyphs, the preview fires a `font-render-error` event that the `PreviewCanvas` surfaces as an inline error overlay with a "Regenerate" button.

#### 13.2.3 Image Color Profile (sRGB)

- All images served to the PDF engine are normalized to sRGB at upload time (Plan 5 upload pipeline). The preview emits a `color-profile: sRGB` metadata header in the PDF.
- If a source image has an embedded Adobe RGB or Display P3 profile, the preview shows a "Color profile converted from <src> to sRGB" note in the element's metadata tooltip — so SWE/Design can audit color shifts.

#### 13.2.4 Transparency Flattening

- Transparent PNG/WebP elements are flattened against the canvas's `background-image` (NOT against a white patch — against the background image so the user sees the true composite). Flattening is done by Plan 6's Puppeteer pipeline server-side; the preview passes a `flattenTransparency=true` URL param so it uses the same code path.
- For templates without a background image (transparent-only canvas), the preview flattens against the academy's default canvas color (a theme token, not a hardcoded color — per AGENTS.md "no hardcoded colors").

#### 13.2.5 Page Size Detection

The PDF preview detects the template's page size (A4/Letter/Legal/custom) from `template.pageSize` (Plan 5 schema field — assumes added; if absent, defaults to A4 with a console-warn that surfaces to the user as "Defaulting preview to A4 — set pageSize on template for accurate preview"). The iframe's container sets the correct aspect-ratio so the preview is never stretched:

```tsx
<Box
  sx={{
    aspectRatio: `${pageSize.width} / ${pageSize.height}`,
    width: '100%',
    maxHeight: 'calc(100vh - 200px)',
    overflow: 'auto',
  }}
>
  <iframe src={previewPdfUrl} title="Certificate PDF Preview" />
</Box>
```

`aspectRatio` is the CSS trick to maintain proportions without computing pixel widths — no JS resize observer needed for this layout concern.

#### 13.2.6 1:1 Zoom Verification

- A "1:1" toggle in the PDF toolbar scales the iframe to 96 CSS px/inch so a 210mm (= 8.27in) A4 page is rendered at exactly 793 × 1122 CSS px on screen.
- This is used by SWE/Design during the fidelity regression test (compare against a rasterized ghostscript output).
- The 1:1 button is disabled on screens < 1000px wide (would force horizontal scroll) — mobile users only get "fit-to-width" by default.

### 13.3 Watermarked Preview

**Purpose**: Prevent unfinalized templates from being exfiltrated via Print/PDF screenshot by overlaying a diagonal "PREVIEW" watermark across the canvas. The watermark is rendered client-side in the React canvas (NOT generations) — it must NOT appear on production PDFs distributed to recipients.

#### 13.3.1 Diagonal "PREVIEW" Watermark

- A tiled `<svg>` background overlay applied via CSS to `.preview-canvas::after` (uses `::after` so it doesn't intercept pointer events on elements):
  ```tsx
  <Box
    sx={{
      position: 'absolute',
      inset: 0,
      backgroundImage: `url("data:image/svg+xml;utf8,${watermarkSvg}")`,
      backgroundSize: '300px 300px',
      transform: 'rotate(-30deg)',
      pointerEvents: 'none',
      opacity: previewWatermarkOpacity,
    }}
  />
  ```
- The SVG contains a single "PREVIEW" word rendered in a light-accent color (`theme.palette.text.disabled` — no hardcoded hex) at low opacity.
- The watermark is repeated across the full canvas extent — even when zoomed/scrolled.

#### 13.3.2 Watermark Opacity Control

- Exposed as `watermarkOpacity: number` (0–1) on `useCertPreviewStore` (extension of §12.8.1). A slider in the toolbar allows SWE/design to tune it for screenshots.
- Preset values: 0.08 (very faint), 0.15 (default), 0.30 (aggressive — used when the academy admin wants to make sharing unappealing).

#### 13.3.3 Watermark URL Toggle

- `?preview=watermark` query param forces watermark on regardless of role (for QA screenshots).
- `?preview=nowatermark` forces off (superadmin use — see §13.3.4 below for the role-based default).

#### 13.3.4 Watermark Visibility per Role

- **ACADEMY_ADMIN / TEACHER** — watermark ON by default (they may download a private copy without watermark if the template is in `published` status — the toolbar's "Download Clean PDF" button calls the same endpoint with `watermark=false` and is gated on published status).
- **SUPERADMIN** — watermark OFF by default (can audit & inspect templates without watermark obstruction). The store reads role via the existing `useAuthStore` selector (`user.role`).
- The role check is **client-side UX only** — the server enforces publish permission via `CERTIFICATES_TEMPLATES_MANAGE`; if a user denies themselves a watermark client-side, the server still rejects any cross-academy publish attempt.

#### 13.3.5 Influence on Export

- Watermark is **disabled on actual export** — the "Download Preview as PNG" feature (§12.2 client-side canvas capture via `html2canvas` equivalent) renders the canvas WITHOUT the watermark element. The capture scope is `canvasRef.current` which points to the inner `.preview-content` div, NOT the watermark overlay div — so the overlay is naturally excluded from the capture bounds.
- The PDF preview endpoint accepts `watermark` query param (default `true`). The "Download Clean PDF" (gated on published status) supplies `watermark=false`. No client-side-only mechanism can produce a clean PDF without the server's permission check.

### 13.4 A/B Testing Variants

**Purpose**: Allow an academy to publish multiple layout variants of the same template and auto-select the top-performing one based on recipient engagement (open rate, share rate).

#### 13.4.1 Up to 4 Template Variants

- A new `template_variants` table (Plan 1 addendum) stores up to 4 variant definitions per `templateId`. Each variant references a `template_version_id` (an immutable snapshot — variants never share mutable state).
- New Zustand store: `useCertVariantStore` — `frontend/common/stores/certVariantStore.ts`:
  ```typescript
  interface VariantState {
    variants: TemplateVariant[]; // length ≤ 4
    winnerVariantId: string | null;
    autoSelectEnabled: boolean;
    autoSelectThreshold: number; // N certificates before auto-select
    createVariant: (templateId: string, sourceVersionId: string) => Promise<void>;
    deleteVariant: (variantId: string) => Promise<void>;
    setAutoSelectThreshold: (n: number) => void;
    selectWinner: (variantId: string) => Promise<void>;
  }
  ```
- This extends §12.8 store roster (preview, publish, version — Round 4 adds variant).

#### 13.4.2 Variant Comparison View

- New component: `VariantComparisonView` — `frontend/desktop/views/dashboard/certificates/templates/preview/VariantsTab.tsx`
- Mobile equivalent: `frontend/mobile/views/dashboard/certificates/templates/preview/VariantsBottomSheet.tsx`
- Side-by-side mini-previews (Grid with `_xs=12 _md=6 _lg=3` for 4 variants on desktop; horizontal scroll on mobile). Uses the existing `PreviewCanvas` mini-preview renderer.
- A `<ToggleButtonGroup>` row above the variants allows filtering by sample recipient (uses §12.3 sample data).

#### 13.4.3 Per-Variant Analytics

- Each variant card displays a "Performance" stat strip:
  - **Open rate**: % of recipients who opened the certificate email (requires Plan 18 emails' open-tracking, but the data surface is here)
  - **Share rate**: % of recipients who clicked "Share to LinkedIn" (Plan 19 social-share)
  - **Certificate count**: issued certificate count from this variant
- A small sparkline (MUI `SparkLine` from `@mui/x-charts/SparkLine`) shows the trend over the last 30 days.
- These stats require new backend fields (Plan 1): `variantOpenCount`, `variantShareCount`, `variantCertificateCount` — denormalized counts, not aggregate queries (per SWE review #8 about avoiding per-row COUNT).

#### 13.4.4 Auto-Select Winner after N Certificates

- Store action: `setAutoSelectThreshold(n)`. After N certificates have been issued across all variants combined, the system auto-promotes the top variant to `winner` and archives the others (variant records preserved for analytics).
- A warning dialog appears before auto-select fires (preview only — actual promotion is in Plan 18).
- Manual override: `selectWinner(variantId)` lets the academy admin override the recommendation.

#### 13.4.5 Manual Override

- ACADEMY_ADMIN can manually choose winner at any time via a "Promote to Winner" button on a variant card. Shows a confirmation dialog. Idempotent (uses Plan 15 publish idempotency pattern from SWE review #7).

### 13.5 Scheduled Publish

**Purpose**: Allow an academy to schedule a template publish for a future DateTime (e.g. "Publish at midnight on graduation day so the design can't leak before the ceremony").

#### 13.5.1 DateTime Picker for Future Publish

- New field in `PublishDialog` Step 3 (§12.5 wizard third step): "Publish Schedule (optional)" — an MUI `DateTimePicker` (from `@mui/x-date-pickers/DateTimePicker`).
- If empty → immediate publish (current behavior). If filled → schedules the publish, returns a "scheduled" status to the UI, the wizard closes with a "Scheduled for <absolute-time>" toast.

#### 13.5.2 Timezone Display

- The selected DateTime is shown **in the user's local timezone** with an explicit UTC equivalent label:
  ```tsx
  <Typography sx={{ typography: 'caption', color: theme => theme.palette.text.secondary }}>
    {`Local: ${dayjs(value).format('LLL')} • UTC: ${dayjs(value).utc().format('LLL')} • ${Intl.DateTimeFormat().resolvedOptions().timeZone}`}
  </Typography>
  ```
- Uses `dayjs` (already in dependencies per Plan 5). The picker's `timezone` prop is set to `Intl.DateTimeFormat().resolvedOptions().timeZone` for correct localization.

#### 13.5.3 Schedule Conflict Detection

- Before scheduling, a query checks for existing scheduled publishes for the same template. Two consecutive scheduled publishes within 1 hour produce a warning toast: "Another scheduled publish at <time> exists — proceed?"
- Conflicts across templates are allowed (different templates may publish at the same time).

#### 13.5.4 Scheduled Publish Cancel

- A `ScheduledPublishList` component (Tab in `VersionHistoryPanel`) lists scheduled publishes for the current template. Each row has a "Cancel" action — calls `cancelScheduledPublish(templateId, scheduleId)` mutation. Confirmation dialog before cancel.

#### 13.5.5 Publish Window with Auto-Revert

- Optional: a scheduled publish can specify a "publish window" — `publishedFrom` (when it becomes active) and `publishedUntil` (when it auto-reverts to draft). The auto-revert uses the existing §3.1 revert pipeline but is server-initiated via a cron job (Plan 1).
- Default is no auto-revert (one-time publish).

#### 13.5.6 Scheduling Calendar View

- A `MonthSelector` (MUI `DatePicker` in calendar mode) in the `ScheduledPublishList` shows the schedule for the next 90 days with badges on days that have scheduled publishes.
- Click a day → list of that day's scheduled publishes with quick-cancel and "publish now" actions.

### 13.6 Rollback Strategy

**Purpose**: Provide a safe, observable path to roll back a published template to a previous version when a defect is discovered post-publish.

#### 13.6.1 One-Click Rollback to Previous Version

- A "Rollback" action button on each non-active version in `VersionHistoryPanel` (§12.6). Click → confirmation dialog → `rollbackToVersion(templateId, versionId)` mutation. Rollback uses the existing Revert pipeline (§3.1) which loads the version's snapshot into a new draft without revoking issued certs (invariant per SWE review #2).

#### 13.6.2 Rollback with Reason Capture

- The rollback confirmation dialog includes a "Reason (required)" `<TextField>` with a `maxLength={500}`.
- The reason is stored on the new template_version row in `rollbackReason` column (Plan 1 addendum).
- The reason is displayed in the version history timeline entry for the rollback version.

#### 13.6.3 Rollback Preview (What Changes)

- Before confirming rollback, a "Preview Changes" button opens `VersionDiffView` in "rollback preview" mode — comparing the candidate rollback version against the current active version.
- Same diff engine as §13.9 below.

#### 13.6.4 Rollback Notification to Team

- After rollback succeeds, a notification is dispatched via the existing in-app notification system (Plan 1).
- Receivers: all users who hold `CERTIFICATES_TEMPLATES_MANAGE` for the affected academy.
- Notification body: "Template '<name>' rolled back to v<n> by <user> — reason: <reason>" — i18n keys under `certTranslations.templatePublish.rollbackNotification.*`.

#### 13.6.5 Version Comparison Before Rollback

- The history timeline shows "click to compare" alongside each version's "Rollback" button — opens the same `VersionDiffView` dialog in "preview" mode (no commit on close).

### 13.7 Performance Budgets

| Concern | Budget | What's measured |
|---|---|---|
| Preview render (first paint of canvas) | < 500ms | `performance.mark('preview-start')` → `performance.mark('preview-paint')` on `PreviewCanvas` mount |
| Full preview render (complete with elements + variables hydrated) | < 1s | mark-to-mark including element fetch |
| PDF generation (single cert) | < 3s | server-side timing logged on the preview endpoint |
| Diff view (two-version compare) | < 1s | `performance.mark('diff-start')` → open → first paint |
| Version list (history panel first paint) | < 200ms | mark-to-mark on `VersionHistoryPanel` mount |

If any budget is exceeded + the appropriate quality-gate check is enabled, the CI pipeline reports a perf regression (`bun scripts/perf-budget.ts` — a new script), blocking the PR from merging. Implementation reflects the timeouts in `useCertPreviewStore` (`isRendering` flag with a `requestIdleCallback` wrapper) and the diff store (`diffLoading` flag on `useCertVersionStore`).

### 13.8 Preview Modes Detail

| Mode | Viewport | When | Implementation |
|---|---|---|---|
| Desktop | 1920×1080 | default | Existing canvas, zoom controls to inspect detail |
| Tablet | 768×1024 | iPad portrait | Container clamps width to 768px; canvas scales proportionally |
| Mobile | 375×667 | iPhone SE | Container clamps to 375px; switches to bottom-sheet toolbar (§12.2 mobile pattern) |
| PDF (A4) | 210×297mm @ 300DPI | Print-archive preview | iframe rendering `/preview.pdf?size=A4` |
| PDF (Letter) | 8.5×11in @ 300DPI | US academies | iframe `?size=Letter` |
| PDF (Legal) | 8.5×14in @ 300DPI | Long-form certs | iframe `?size=Legal` |
| Print (with margins) | @page A4 portrait + 10mm margins | Physical printer via `window.print()` | `@media print` CSS (§13.1) |
| Social share card | 1200×630 | LinkedIn/Twitter share preview | Dedicated inspector — Option in `PreviewCanvas` toolbar; iframe at `/preview-social-card.png` |

Each mode button in the toolbar (ToggleButton row) is wired to useCertPreviewStore.setMode; the PreviewCanvas re-renders the appropriate container Box (with `sx` props as documented in §12.1) per mode.

### 13.9 Version Diff Engine

**Purpose**: Provide a structured, machine-readable diff between two template versions — for rollback preview (§13.6.3), variant comparison (§13.4.3), and audit changelog generation.

#### 13.9.1 Line-by-Line Text Diff (JSON Patch)

- Both versions are serialized to canonical JSON (sorted keys, deterministic order via the Plan 5 schema's `serializeForComparison` utility). The serialization sorts element/variable arrays by `id` so JSON patching is deterministic.
- `diff` is computed via the existing `deep-diff` package (in dependencies). Returns `Array<Diff>` entries.
- Display: a side-by-side panel (Grid 2 columns). Left: JSON of version A. Right: JSON of version B. Each line annotated with `+`/`-`/`~`.

#### 13.9.2 Element-Level Diff

- Higher-level view in `VersionDiffView`:
  - Added elements (present in B, absent in A) — green row, `theme.palette.success.light` background
  - Removed elements (present in A, absent in B) — red row, strikethrough, `theme.palette.error.light` background
  - Modified elements (present in both, one or more fields differ) — yellow row, `theme.palette.warning.light` background with expandable property-level sub-diffs (e.g. `x: 100 → 120`, `fontSize: 16 → 18`, `fontFamily: 'Arial' → 'Inter'`)
- No hardcoded colors; all colors per AGENTS.md theme-tokens-only rule.

#### 13.9.3 Visual Canvas Diff

- Two mini-previews (one per version) rendered side-by-side in a `Grid xs={6}` layout. Each mini-preview is a read-only `PreviewCanvas` instance with no toolbar (configured via `interactive={false}` prop — extending §12.1 prop list).
- The mini-previews are rendered to `<canvas>` (server-rendered to PNG via `/preview-thumbnail.png?versionId=...` Plan 6 endpoint). Client-side React rendering is rejected here for the mini-previews because rendering two full canvases in DOM at all times would exceed the §13.7 budget.
- Changed elements outlined in their respective mini-preview using a stroke-only overlay (a third color-coded layer — same `theme.palette` semantic colors).

#### 13.9.4 Variable Binding Diff

- The variables tab shows: variables present in both versions, variables added/removed, and for shared variables whether `defaultValue` or `config` JSONB has changed.

#### 13.9.5 Diff Export as Changelog

- A "Export changelog" button at the bottom of the `VersionDiffView`. Generates a Markdown escape (`Blob([markdown], { type: 'text/markdown' })`) and triggers a `URL.createObjectURL` download. Format:
  ```
  # Changelog: v{A} → v{B}
  ## Added elements
  - QR_code (qr, x=120 y=80, size=100)
  ## Removed elements
  - Logo_old (image, x=10 y=10, width=80)
  ## Modified elements
  - Recipient name (text, fontSize: 16 → 18)
  ## Variables
  - Added: courseName (default: 'Bachelor')
  - Removed: legacyCode
  ```
- Useful for academies accompanying the rollback notification (§13.6.4).

### 13.10 Publish Pipeline

**Purpose**: Define the full pipeline from "Save draft" to "CDN-served to recipients" with explicit gates, not the loose hand-off between Plan 11/15/18/19 today.

#### 13.10.1 Pre-Publish Checklist

`PublishDialog` Step 1 (validation summary) is extended with explicit checklist items (rather than the binary 4-validation-passes display in §12.5):

- [ ] All variables bound (each template variable has either `defaultValue` or is mapped to a data element)
- [ ] Fonts available (each used fontFamily is present in the academy's font library)
- [ ] Images uploaded (each image element has a non-empty `imageUrl`)
- [ ] Tested on mobile (the user has at some point toggled to Mobile preview during this session — tracked via `useCertPreviewStore.hasTestedMobile`)
- [ ] No unresolved data bindings (variables flagged unresolved by the validation service)

The last item "Tested on mobile" is a soft check — if unchecked, the wizard allows proceeding with a secondary confirmation dialog "Are you sure? Mobile was not tested." This is a UX nudge, not a hard gate.

#### 13.10.2 Validation Gate

- The existing validation service (§3.1 + backend service) is the hard gate. The Round 4 enhancement surfaces all 5 validations on Step 1 — expanded from the original 4 — adding the "no unresolved data bindings" check.
- If any hard validation fails, "Next" is disabled. UI explains which check failed and the template must be resolved.

#### 13.10.3 Approval Workflow (junior → senior → publish)

- A new `approval_workflow` table (Plan 1 addendum) with rows: `templateId`, `requesterId`, `approverId`, `status: pending|approved|rejected`, `createdAt`, `resolvedAt`.
- `useCertPublishStore` is extended with `approvalState: 'idle' | 'pending' | 'approved' | 'rejected'` and actions `requestApproval()`, `cancelApprovalRequest()`.
- TEACHER requests approval — the template is locked (`status: 'review'`) until ACADEMY_ADMIN approves/rejects. SUPERADMIN can skip approval (settings toggle).
- The R3 version history timeline shows the approval records alongside published versions.
- A rejected approval shows the rejection reason (textarea in the ACADEMY_ADMIN's review panel) and the TEACHER can revise and resubmit.
- Note: §5 state machine originally had `draft → published → archived` only; Round 4 introduces the `review` state used here, addressing SWE review #2.

#### 13.10.4 Publish Webhook

- After a successful publish (and CDN invalidation complete), the server emits a webhook to a configurable URL `academy.publishWebhookUrl` (Plan 1 addendum) with payload `{ templateId, versionId, publishedAt }`.
- Retries: 3 attempts with exponential backoff (1s, 5s, 25s). On final failure, a notification is created for academy admins.
- The webhook URL is configurable via the academy settings — never hardcoded.
- Uses the existing logger pattern (`logger.info` in `backend/lib/logger`) — never `console.log`.

#### 13.10.5 CDN Invalidation

- The publish pipeline calls `invalidateCDN(templateId)` (server-side service, expandable to multiple CDN vendors). On success: `cacheInvalidated: true` returned. On failure: `cacheInvalidated: false` — the SWE review #7 cache-invalidation i18n warning toast fires.
- Round 4 specifies that the invalidation is **blocking** — publish is not considered complete until invalidation resolves. If an academy has no CDN configured, this step is a no-op returning `true` immediately.

### 13.11 Accessibility

#### 13.11.1 Preview Zoom Keyboard Controls

- `+` key zooms in (`useCertPreviewStore.setZoom(zoom + 10)`), `−` zooms out (clamp at 10). `0` resets to 100.
- Requires `Tab` focus to be inside the `PreviewCanvas` container (use `<Box>` with `tabIndex={0}` and `aria-label="Certificate preview, use plus and minus to zoom"`) so the listener scope doesn't capture `+` typed in form fields elsewhere.
- Eligible keyboard event handler: `useEffect(() => window.addEventListener('keydown', handler), [])` scoped to the canvas container ref.

#### 13.11.2 Screen Reader for Preview Content

- The canvas has an `aria-label="Certificate preview"`. Each preview element renders an `aria-label` like `'Text element: <content>'` (for text elements) or `'Image element: <alt-text>'` (for image elements). The preview anneals all text into a single live-region update when sample data changes (`role="status"` on the canvas wrapper div) so screen-reader users get audible updates when overrides change.
- Per-content variant: data-element aria-labels use the data-source field label (e.g., `'Recipient name: <value>'`) — never just `'data_text'`.

#### 13.11.3 ARIA for Diff Regions

- `VersionDiffView` uses `role="region"` with `aria-labelledby="version-diff-title"` on each side-by-side panel.
- Element diff rows in the changes list use `role="listitem"` with descriptive `aria-label`: e.g., `'Added element: QR code'`, `'Removed element: Logo'`, `'Modified: Recipient name — fontSize changed from 16 to 18'`.
- The semantic colors are duplicated in `aria-label` text ("Added (green)") — never rely on color alone for understanding.

#### 13.11.4 High Contrast Mode in Preview

- If `prefers-contrast: more` CSS media query matches (`useMediaQuery('(prefers-contrast: more)')`), the PreviewCanvas swaps to high-contrast outline mode for all elements (2px solid outline in `theme.palette.text.primary` on every element).
- Mirror for `prefers-contrast: no-preference` (the default) — no outline.
- This is implemented inside `PreviewCanvas`, not as an app-wide theme toggle — preview-specific accessibility accommodation.

### 13.12 Error States

#### 13.12.1 Preview Render Failure with Retry

- If `PreviewCanvas`'s React rendering throws (a malformed template from template restore, font load timeout, image 404), the error is caught by an error boundary that wraps `<PreviewCanvas>`.
- Display: MUI `Alert` (`severity="error"`) inside a `Card` with a localized title `'Preview failed to render'` and a `LoadingButton` labeled `'Retry'`.
- The retry button re-mounts the canvas with `key={retryCount}` so React fully re-initializes. Does not refetch backend data unless server-side state was also corrupted.

#### 13.12.2 PDF Generation Timeout Handler

- The PDF preview iframe specifies a 10-second timeout via `useEffect` schedule (around the iframe onLoad detection). If onLoad doesn't fire within 10s:
  - The iframe is unmounted.
  - The PDF mode shows `Alert` (`severity="warning"`): `'PDF generation timed out; retry with a lighter sample.'` with "Regenerate" + "Use Desktop mode instead" actions.
- The state is tracked via `useCertPreviewStore`'s `renderError: string | null` field — same surface as the React render errors but with a different error key.

#### 13.12.3 Publish Conflict (Concurrent Edit)

- Addressing SWE review #1 fully: the publish mutation acquires a template advisory lock (server-side, via the same idiom as `student.repository.ts`).
- If a publish is initiated and the template has been edited since the user last previewed (server returns `ETAG_MISMATCH`), the dialog transitions to "Concurrent Edit Detected" state — listing which fields were modified and offering:
  - "Refetch and revalidate" — pulls current draft, re-runs validation.
  - "Discard other user's changes and publish" — disable proposed; instead "Browse history" where they can preview the saved version and decide.
- After a successful publish, the existing editor checks Apollo cache and triggers `client.refetchQueries({ include: [TemplateElementsQuery, TemplateVariablesQuery] })` per SWE review #4.

#### 13.12.4 Version Restore from Corrupted State

- If `useCertVersionStore.loadVersions` fails (network error) or returns a canonical mismatch (version count not matching expected), the timeline shows an error card with a "Restore from backup" button.
- Backups are stored at the localStorage level: the last good version list is cached (`frontend/common/lib/certVersionBackup.ts`) keyed by `templateId`. The cache is best-effort — only used to show stale data while the user retries.
- The "Restore" attempts a fresh refetch and revalidates against cache; completes only if the new fetch matches the cached version ids — otherwise it shows "Versions on the server have changed since backup; reload page." dialog.
