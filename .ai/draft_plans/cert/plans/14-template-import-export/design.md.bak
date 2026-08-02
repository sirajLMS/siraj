# Plan 14: Template Import/Export — Technical Design

## Document Information

| Field | Value |
|-------|-------|
| **Feature Name** | Certificate Template Import/Export |
| **Plan Number** | 14 |
| **Depends On** | Plan 05 (GraphQL API), Plan 05 (Storage & File Management) |
| **Related Plans** | Plan 10 (Template Editor), Plan 11 (Canvas), Plan 12 (Elements), Plan 13 (Variables) |

---

## 1. Architecture Overview

### 1.1 Layer Position
```
Client Component (React/MUI)         ← Import/export UI, file pickers, preview modal
       │ Apollo Client
       ▼
GraphQL API (Pothos)                  ← Export/import mutations, validation
       │ CertificateServices.template
       │ CertificateServices.templateElement
       │ CertificateServices.templateVariable
       ▼
Repository Layer                      ← Read/write template data
       │ Drizzle ORM
       ▼
PostgreSQL                            ← Persistent storage

Client Component (File I/O)           ← FileReader API, Blob URL generation, file validation
       │ Direct (no GraphQL)
       ▼
Local File System                     ← JSON file download, ZIP creation (client-side)

Client Component (Upload Pipeline)
       │ GraphQL mutation (file content)
       ▼
Storage & File Management (Plan 07)   ← Background image upload
```

### 1.2 Data Flow — Export (Single Template)
```
1. User clicks "Export" in Template List (Plan 08) or Template Editor (Plan 10/11)
2. Client sends exportTemplate(templateId) GraphQL query
3. Pothos resolver fetches template + elements + variables via DataLoader
4. Response includes full template JSON payload
5. Client creates Blob → triggers download via <a> click
6. Audit event logged (side effect in resolver)
```

### 1.3 Data Flow — Import (Single Template)
```
1. User selects JSON file via file picker
2. Client reads file content (FileReader API)
3. Client runs pre-validation: file size, MIME type, JSON.parse
4. If pre-validation passes → show import preview modal
5. User reviews preview, clicks "Import"
6. Client sends importTemplate(jsonContent) GraphQL mutation
7. Pothos resolver validates and creates template + elements + variables in transaction
8. Background images uploaded to storage (Plan 07)
9. Client redirects to template editor for imported template
```

### 1.4 Data Flow — Batch Export (ZIP)
```
1. User selects multiple templates via checkboxes in Template List
2. Click "Export Selected"
3. Client sends exportBatch(templateIds[]) GraphQL query
4. Server returns array of template JSONs
5. Client creates JSZip instance:
   - Adds each template as {templateId}.json
   - Extracts and includes background images in /images/
   - Creates manifest.json
6. Generates ZIP Blob → triggers download
7. Audit logs batch export event
```

### 1.5 Data Flow — Batch Import (ZIP)
```
1. User selects ZIP file via file picker
2. Client reads ZIP, parses manifest.json
3. Client runs pre-validation on each template JSON
4. Shows batch preview modal with per-template results
5. User clicks "Import All Valid" (only valid templates)
6. Client sends importBatch(mutations[]) per valid template
7. Server imports each template independently
8. Client shows results summary: imported, skipped, errors
```

---

## 2. Design Decisions

### DD-001: Export Format — JSON (1.0)
**Decision**: Self-contained JSON with version field and semantic structure.
**Rationale**: JSON is human-readable, diff-friendly, and parseable by any tool.
**Alternatives Considered**:
- YAML: Not natively supported in browser, less ecosystem support
- Binary format: Not human-readable, harder to validate manually
- GraphQL SDL: Overly restrictive, not semantically meaningful for templates

### DD-002: UUID Regeneration on Import
**Decision**: Always generate new UUIDs for imported templates, elements, and variables.
**Rationale**: Prevents ID collisions across Siraj instances. Allows same template imported multiple times.
**Alternatives Considered**:
- Preserve original UUID: Risk of collisions; complex deduplication logic
- Optional UUID preservation (e.g., for migration tool): Future enhancement

### DD-003: Client-Side Pre-Validation
**Decision**: Run validation on client BEFORE sending to server.
**Rationale**: Reduces wasted server work; provides instant feedback to user; allows preview.
**Deferred to Server**: Business validation requiring database checks (e.g., categoryId existence).

### DD-004: Import Preview Modal Pattern
**Decision**: Import uses wizard-style preview modal (not immediate import).
**Rationale**: Informed about what's being imported; can review warnings before committing.
**Alternatives Considered**:
- Direct import: Faster, no risk of "what did I just import?"
- Edit mode (demand template before import): Adds complexity for rare use case

### DD-005: Batch Result Independence
**Decision**: Each template in a batch import is treated independently.
**Rationale**: Maximizes throughput; one bad template doesn't block others.
**Implementation**: Mutation for each import, or single mutation with per-item results array.

### DD-006: State Machine for Import/Export Wizard
**Decision**: Import flow follows a state machine pattern with explicit states.
**Rationale**: Multiple checkpoints (select file → validate → preview → confirm → import) require ordered flow; TypeScript discriminator enforces correct state transitions.

```
Import State Machine:
  [IDLE] → [FILE_SELECTED] → [VALIDATING] → [PREVIEW_SHOWING]
    → [IMPORTING] → [SUCCESS] / [ERROR]
  [FILE_SELECTED] → [FILE_ERROR] (invalid file)
  [VALIDATING] → [VALIDATION_ERROR] → back to [FILE_SELECTED]
  [IMPORTING] → [NETWORK_ERROR] → back to [PREVIEW_SHOWING] (retry)
  [SUCCESS] → [IDLE] (after navigation or timeout)
```

---

## 3. Interface Contracts

### 3.1 GraphQL Export Query
**Operation Name:** `ExportTemplate`

```graphql
query ExportTemplate($id: ID!) {
  exportTemplate(id: $id) {
    version
    exportedAt
    template {
      id title description categoryId width height orientation
      backgroundType backgroundValue fontFamily fontSize status
      elements {
        id type x y width height rotation zIndex
        properties  # JSON scalar for type-specific data
      }
      variables {
        id name type defaultValue required
        options { value label }  # only for 'select' type
      }
    }
  }
}
```

### 3.2 GraphQL Import Mutation

**Mutation Name:** `ImportTemplate`

```graphql
mutation importTemplate($input: ImportTemplateInput!) {
  importTemplate(input: $input) {
    template {
      id        string
      title     string
      status    CertificateTemplateStatus
      categoryId null UUID
      elements {
        count   Int
      }
      variables {
        count Int
      }
    }
    warnings   [importWarning]
  }
}

input ImportTemplateInput {
  jsonContent String
  idempotencyKey String
}
```

### 3.3 Batch Import Mutation

**Mutation Name:** `BatchImportTemplates`

```graphql
mutation batchImportTemplates(input: BatchImportTemplatesInput!) {
  BatchImportTemplates(input: $input) {
    imported [ImportedTemplateResult]
    skipped [SkippedTemplateResult]
    errors   [ImportErrorResult]
    summary {
      totalReceived Int
      imported Int
      skipped Int
      errors   Int
    }
  }
}

input BatchImportTemplatesInput {
  templates   [TemplateImportItem!]
  idempotencyKey String
}
```

### 3.4 Import Warning & Error Types

```graphql
type ImportWarning {
  field        String  # affected field or element
  code         importWarningCode  # enum
  message      String  # localized message
  severity     String  # "info" | "warning"
}

enum importWarningCode {
  MISSING_CATEGORY
  LARGE_IMAGE
  DEPRECATED_PROPERTY
  DUPLICATE_NAME_RENAMED
  ELEMENT_CLAMPED_to _BOUNDS
  CATEGORY_NOT_FOUND
}

type importError {
  field    String  # problem field
  code     importErrorCode  // enum
  message  String                # Localized message
}

enum importErrorCode {
  INVALID_JSON
  SCHEMA_MISMATCH
  MISSING_REQUIRED_FIELD
  INVALID_UUID
  INVALID_ENUM_VALUE
  INVALID_DIMENSIONS
  IMAGE_TOO_LARGE
  SAME_DUPLICATION
}
```

### 3.5 Export File Schema (TypeScript Contract)

```typescript
interface ExportedTemplate {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  width: number;   // pixels, 96 DPI
  height: number;  // pixels, 96 DPI
  orientation: 'landscape' | 'portrait';
  backgroundType: 'color' | 'image' | 'gradient';
  backgroundValue: string;
  fontFamily: string;
  fontSize: number;
  status: 'draft' | 'published' | 'archived';
  elements: ExportedElement[];
  variables: ExportedVariable[];
}

interface ExportedElement {
  id: string;
  type: 'static_text' | 'data_text' | 'data_date' | 'image' | 'qr_code' | 'shape';
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  rotation: number;   // 0..360 (INTER_PLAN_CONTRACTS.md §19)
  zIndex: number;
  properties: Record<string, unknown>;    // flat, type-specific
}

interface ExportedVariable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  defaultValue: string | null;
  required: boolean;
  options?: { value: string; label: string }[];    // select type only
}
```

### 3.6 Zustand ImportExport Store Shape

Referenced by: `frontend/common/stores/importExportStore.ts`

```typescript
interface ImportExportState {
  // Import wizard state machine
  importState: 'idle' | 'fileSelected' | 'validating' | 'preview' | 'importing' | 'success' | 'error';

  // File handling
  selectedFile: File | null;        // Not persisted (@see partialize)
  importType: 'single' | 'batch';

  // Validation results
  preview: ImportPreview | null;
  warnings: ImportWarning[];
  errors: ImportError[];

  // UI state
  previewModalOpen: boolean;
  confirmDialogOpen: boolean;
  testProgress: { current: number; total: number } | null;

  // Actions (setters are implicit via Zustand set)
  resetImport: () => void;
  startFileValidation: () => void;
  startImport: () => void;
  markImportSuccess: (templateId: string) => void;
  markImportError: (error: string) => void;
}

// Non-serialized values — `partialize` excludes File, progress blobs
const importExportStore = create<ImportExportState>((set) => ({
  // ...implementation
}), {
  partialize: (state) => ({ ...state, selectedFile: undefined })
});
```

---

## 4. Component Hierarchy

### 4.1 Desktop Components
```
frontend/common/views/dashboard/certificates/_importExport/
  ImportExportContainer.tsx         # Apollo queries, calls ViewModel
  useImportExportViewModel.ts       # Business logic dispensing
  ImportExportView.tsx              # Switcher with responsive view

frontend/desktop/views/dashboard/certificates/importExport/
  TemplateExportDesktop.tsx         # Export actions (single dropdown + batch)
  TemplateImportDesktop.tsx         # Import file picker + batch trigger
  ImportPreviewModal.desktop.tsx    # Preview modal (sheet format for desktop)
  ImportResultsSummary.desktop.tsx  # Batch results summary
  components/
    ImportFormatDetect.desktop.tsx  # Detect JSON vs ZIP on file select
    ImportPreviewSideBySide.desktop.tsx  # Warnings/errors side panel
    ExportDownloadLink.desktop.tsx  # Trigger download after export

frontend/mobile/views/dashboard/certificates/importExport/
  TemplateImportMobileCard.tsx      # FAB + bottom sheet action
  ImportPreviewMobileFullscreen.tsx # Full-screen preview
  ImportResultsMobileBottomSheet.tsx # Bottom sheet results summary
```

### 4.2 Shared Components
```
frontend/common/views/dashboard/certificates/importExport/
  shared/
    ImportValidationBadge.tsx        # Shows pass/fail with warning count
    ExportFormatSelector.tsx        # Single export vs batch
    ImportProgressIndicator.tsx     # Progress bar during import
    ImportResultCard.tsx            # Per-template result display
    EmptyImportState.tsx            # Empty state illustration
  schemas/
    importSchema.ts                 # Zod schema for validation
    exportSchema.ts                 # Export JSON schema
  utils/
    fileReader.ts                    # File parsing utilities
    downloadHelpers.ts              # Blob create/download helpers
    formatDetect.ts                  # JSON vs ZIP detector
    idGenerator.ts                  # UUID regeneration during import
```

---

## 5. Validation Pipeline Architecture

### 5.1 Client-Side Validation (before upload)
```
[File selected]
    ↓
Detect format (JSON-ZIP bytes or file extension)
    ↓
Check file size < 50MB (single) / 500MB (Zip)
    ↓
Parse JSON (try/catch for syntax errors)
    ↓
Zod schema validation against ExportedTemplate interface
    ↓
→ Valid: show preview modal with pre-populated data
→ Invalid: show per-field errors in file picker
```

### 5.2 Server-Side Validation (in mutation)

```
Mutation receives import input JSON
    ↓
Deserialize JSON + Zod validation
    ↓  └─ Schema mismatch? → Error with specific fields
Validate UUID format (all custom IDs)
    ↓  └─ Invalid UUID? → Error with field ref
Validate enum values (orientation, element types, variable types, backgroundType)
    ↓  └─ Invalid enum? → Error with field + valid options
Check element positions within canvas (0 ≤ x ≤ width−someWidth, etc.)
    ↓  └─ Out of bounds? → Error with element index
Check variable names originality (within single template)
    ↓  └─ Duplicated? → Auto-rename or report
Check background image (if type=image, validate isBase64 or fileRef)
    ↓
Uploading background image to storage → replace value with fileId
    ↓
Create template → elements → variables → commit transaction
```

---

## 6. File Handling & Storage

### 6.1 Download Trigger Pattern
```typescript
// Client-side only — triggers browser's download dialog
function triggerDownload(fileName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('dl', fileName);
  a.click();
  URL.revokeObjectURL(url);
}
```

### 6.2 ZIP Generation (Batch Export)
- Library: `libzip` (already in package.json)
- Client-side ZIP creation (streaming for large batches)
- Concurrency limit: 10 concurrent reads
- Memory: limit 200MB at a time (batch > 50 templates fragments with `zip.updateFiles()`)

### 6.3 Background Image Handing
- **Export (single)**: If backgroundType is 'image' and base64 possible, include inline
- **Export (batch)**: Extract image blobs, add to ZIP '/images/' folder
- **Import (single)**: Extract base64 from JSON, upload to storage, get fileId
- **Import (batch, ZIP)**: Read images via JSZip path, upload to storage
- **Max image size**: 10MB per image (separate from file limit)

### 6.4 Temporary Storage (Input)
- Imported raw JSON: in-memory (React state), no temp files
- Extracted ZIP contents: in-memory viasm JSZip
- Progress bar: Zustand store (not serialized/persisted)

---

## 7. UX/Navigation Specification

### 7.1 Routes
```
/app/(dashboard)/certificates/templates/
  [export]: route for direct download (server fetching)
  import: route for import flow (file picker + preview)
```

### 7.2 Sidebar Placement
```
Sidebar → Certificate Templates (RegNest) item
   └─ All Templates (Plan 08)
   └─ Categories (Plan 09)                      ← (child focus)
   └─ Templates (current)                        ← Import/Export actions inline
```

### 7.3 Navigation from Other Pages
- Template Editor (Plan 10/11/12): Header icon buttons → Export/Copy/Import actions
- Template List (Plan 08): bulk checkboxes → bar with Export batch
- **No dedicated import/export page** - integrated into list + editor

### 7.4 Template List Integration (Plan 08)
```
┌──Template List Page──────────────────────────┐
│ PageHeader                                     │
│ "All Templates" | Actions: [Import] [Export]  │
│────────────────────────────────────────────────│
│ Search │ Filters │ Sort                        │
│ Compact Checkbox │ All checked → bar           │
│ ┌─ [✓] Row 1 │ Row 2 │ Row 3 ──────────────┐ │
│ │ Actions button: Export [⁝] and then row───┐│ │
│ └────────────────────────────────────────────┘─│
│ (rows...20)                                     │
│ checkbox count badge: "3 selected" [Export Sel. │
│─────────────────────────────────────────────────│
│ Pagination                                     │
└─────────────────────────────────────────────────┘
```

### 7.5 Role Matrix (from requirements.md REQ-UX-003)
Implemented via RequirePermission wrapping:
- ExportAction: requires `certificates.templates.view`
- ImportAction: requires `certificates.templates.manage`

---

## 8. Error Handling Strategy

### 8.1 Error Types & Mapping

| Error Class | User Message | Logging |
|-------------|--------------|---------|
| FileSizeExceeded | i18n key `errorFileTooLarge` + {limit} | warn |
| InvalidJSON | i18n key `errorInvalidJSON` | error (debug: parse error location) |
| SchemaMismatch | i18n key `errorSchemaMismatch` + field list | error (debug: Zod error paths) |
| InvalidUUID | Per-field error | warn (is consumer-facing) |
| InvalidEnum | Per-field error + valid options | warn |
| DuplicateId | Auto-rename + warning | info |
| NetworkError | i18n key `errorNetwork` | error ( with retryCount) |
| ServerError | i18n key `errorServer` + correlationId | error (full context) |
| ImageUploadFail | Skip image + warning | error (debug: storage lib error) |
| outOfMemory | Client-side: reduce batch | error |

### 8.2 Un-recoverable Errors
- Server down / network timeout: retry animation, after 3 attempts → "Try again" dialog
- Import of`.json` (not ZIP) but file has more than 1 template: warn, import first template
- Blueprint expired tokens: refresh token retry

### 8.3 Tracking & Observability
- All imports/exports logged as changes to audit_log
- Performance metrics: export_time_ms, import_time_ms per size
- Alert on large batches (>50) per request

---

## 9. State Machine — Import Wizard

```
States:
  IDLE               — no file selected, no progress
  FILE_SELECTED      — file selected, MIME-type detected (immediate)
  VALIDATING         — parsing + validation in progress (async →)
  PREVIEW            — results shown, validate is confirming
  IMPORTING          — sending mutation, progress visible
  SUCCESS/FILE       — import success or failure shown
  ERROR              — unrecoverable error (code, message)

Transitions:
  IDLE → FILE_SELECTED  (user picks file)
  FILE_SELECTED → VALIDATING (auto)
  VALIDATING → PREVIEW (auto on success)
  VALIDATING → FILE_ERROR (auto on fail)
  PREVIEW → IMPORTING (user clicks import)
  IMPORTING → SUCCESS (success with new templateId)
  IMPORTING → ERROR (error payload)
  IMPORTING → PREVIEW (user retries after network error)
  SUCCESS → IDLE (after navigation/timeout)
  ERROR → IDLE (user clicks "try again" → reset to start)
```

---

## 9. Testing Strategy

### 9.1 Component Tests (Happy DOM, Vitest, bun test runner)
Test files go in `test/ui/components/certificates/importExport/`

| File | Description | Coverage |
|------|-------------|----------|
| `TemplateImportDesktop.test.tsx` | Desktop import — file select UI, formats detection | file selection, format detect, drop zone aria |
| `TemplateExportActions.test.tsx` | Single + batch export actions | row action, checkbox bar, batch trigger |
| `ImportPreviewModal.test.tsx` | Modal display, warnings/errors rendering | warnings, errors, import confirm |
| `ImportStateMachine.spec.ts` | Zustand store transitions | all states and invalid transitions |
| `ExportFileFormat.spec.ts` | Validate exported JSON against Zod schema | all schema variations |
| `ImportFormatDetect.test.tsx` | File format detection algorithms | JSON, ZIP, JSON-not-JSON-corrupt |
| `ZIP Downloads.spec.ts` | Generate and verify ZIP content | file structure, valid JSON |

### 9.2 E2E Tests (Playwright)
Test files: `test/ui/e2e/importExport/`

| File | Description |
|------|-------------|
| `importExport-flow.spec.ts` | Single import & route to editor |
| `importExport-batch.spec.ts` | Batch export → import → verify |

### 9.3 Database Tests
- Backend-only: validate post-mutation data (before/after template tables)

### 9.4 i18n Tests
- English and Arabic keys render correctly
- Plural rules for export/import counts

---

## 10. Implementation Guide

### 10.1 Database Considerations
- No new schema tables needed → [Policy: no Drizzle generate/migrate]
- Uses existing `templates`, `template_elements`, `template_variables`
- Storage table (Plan 07) for uploaded background images

### 10.2 Dependencies
- Can be implemented parallel with Plan 10 (Editor) after Plan 05
- **Shares components** with Plan 08 (list page) — coordinate "big chunk" layout progression
- Requires from Plan 07: `uploadFile` service for background image upload

### 10.3 Quality Loop Per File
For each new file:
1. `bun tsgo` — fast type check (safe to push concurrently)
2. `bun biome:check` — formatter + linter
3. `bun run lint` (lint queue client, file-level: `requestLint("xx", [filePaths])` — see AGENTS.md)
4. `bun run client_desktop` and `mobile` tests
5. Complete with all 3 before moving to next file

### 10.4 Reference Files for Implementation
| Stage | File Type | Reference |
|-------|-----------|-----------|
| Schema | `backend/db/schema/` | Plan 01 (cert tables) |
| Services | `backend/services/certificates/template*.service.ts` | Plan 04 |
| GraphQL | `backend/graphql/pothos/certificates/ ` shards | Plan 05 |
| Components | `frontend/views/dashboard/certificates/` | Plan 08 |
| Components | `frontend/common/views/dashboard/certificates/importExport/` | this plan |
| Mobile | frontend/mobile/AGENTS.md | Tier rules |

### 10.5 Knowledge Propagation

**Docs to create:**
- `docs/certificates/template-import-export.md` — feature guide, UX flow

**Instruction Files to update:**
- No new instruction files required

**AGENTS.md to refresh:**
- `frontend/common/stores/AGENTS.md` — add `importExportStore`
- `frontend/common/views/dashboard/certificates/importExport/` directory references

**Skills to create:**
- Not applicable (skill is not a new pattern — this follows existing import/export pattern from earlier features)

**AGENTS.md affected:**
- `frontend/views/AGENTS.md` — updated to note new import/export store
- No others.

---

## 11. i18n Design

### Namespace: `certificates.templates.importExport`

All keys defined in requirements.md §2.6.

**File locations:**
- `shared/locale/certificates/templates/importExport.en.ts`
- `shared/locale/certificates/templates/importExport.ar.ts`

**Plural function shape**: `(count: number) => string`

Type registration in `shared/locale/certificates/templates/index.ts`:
```typescript
import importExport from './importExport/_namespace'
```

---

## 12. Outcome Knowledge & Knowledge Transfer Protocol

### 12.1 Key Decisions Outcome
- Export JSON with enhanced metadata (schema version, timestamp, author)
- UUID remapping on import (avoid conflicts → cleaner)
- Client-side pre-validation before upload
- Import preview step required

### 12.2 Patterns Introduced
- Wizard-based state machine for complex import/export workflow
- Schema-aware validation pipeline
- Batch import with per-item result independence

### 12.3 Changes to Existing System
- Template list page headers: add Import/Export actions
- New Zustand store for import state management
- New GraphQL query/mutation `ImportTemplate`, `BatchImportTemplates`

### 12.4 Learning Artifacts
After this feature is implemented, the team will now:
1. Understand Wizard-based import flow pattern (for future batch operations)
2. Implement export/import in existing templates (no new page needed)
3. Schema validation via Zod (exposed format for inter-application)
4. Current base64 per-image for single export; file storage for batch
---

## 13. Export Wizard Dialog (Enhanced UI)

### 13.1 Component Specification: `ExportWizardDialog`

**File:** `frontend/views/dashboard/cert/templates/export/ExportWizardDialog.tsx`

**Props:**
```typescript
interface ExportWizardDialogProps {
  open: boolean;
  templateId: string;
  onClose: () => void;
}
```

**Architecture:** 3-step wizard using MUI Stepper component, state managed by dedicated export Zustand store.

#### Step 1 — "Format"
A responsive grid of format cards (using MUI Grid or Box with flexbox). Each card is a clickable element with:

| Format | Icon | Title | Description |
|--------|------|-------|-------------|
| JSON | `CodeOutlined` | JSON | Complete template definition as portable JSON file |
| ZIP | `FolderZipOutlined` | ZIP Archive | Template + background images in ZIP archive |
| PDF | `PictureAsPdfOutlined` | PDF Preview | Read-only PDF preview for print/external sharing |
| PNG | `ImageOutlined` | PNG Image | Raster image export (canvas screenshot) |
| SVG | `DrawOutlined` | SVG Vector | Scalable vector export for web/print embedding |

Each card features:
- Icon (MUI `SvgIcon`, 48px)
- Title (Typography, `sx={{ fontWeight: 600 }}`)
- Description (Typography variant="body2", color="text.secondary")
- Selected state: themed border (2px solid `primary.main`), subtle background tint (`primary.main` at 0.04 opacity)
- Hover state: elevation shadow, cursor pointer

Layout: Grid with `spacing={2}`, cards sized `{ xs: 12, sm: 6, md: 4 }` — 1 column mobile, 2 tablet, 3 desktop.

#### Step 2 — "Options"
Format-specific options shown in a Stack (spacing 3). Each option uses MUI form controls.

**JSON Options:**
| Option | Control | Default |
|--------|---------|---------|
| Include Assets (base64 images) | `FormControlLabel` + `Checkbox` | true |
| Pretty Print (indented JSON) | `FormControlLabel` + `Checkbox` | true |

**ZIP Options:**
| Option | Control | Default |
|--------|---------|---------|
| Compress (deflate) | `FormControlLabel` + `Checkbox` | true |
| Include Thumbnails | `FormControlLabel` + `Checkbox` | false |

**PDF Options:**
| Option | Control | Default |
|--------|---------|---------|
| Quality | `Select` (draft/standard/high) | `standard` |
| Page Size | `Select` (A4/Letter/Custom) | `A4` |

| Quality Level | DPI | Notes |
|---------------|-----|-------|
| Draft | 72 | Fastest, smallest file |
| Standard | 150 | Balanced for screen + print |
| High | 300 | Print-quality, largest file |

**PNG Options:**
| Option | Control | Default |
|--------|---------|---------|
| Resolution | `Select` (1x/2x/3x) | `2x` |
| Transparent Background | `FormControlLabel` + `Checkbox` | false |

| Resolution | Scale Factor | Use Case |
|------------|---------------|----------|
| 1x | 1:1 | Web preview |
| 2x | 200% | Retina screens |
| 3x | 300% | Print + zoom |

**SVG Options:**
| Option | Control | Default |
|--------|---------|---------|
| Embed Fonts | `FormControlLabel` + `Checkbox` | true |

**Back/Next buttons:** MUI `Button` in DialogActions. Next is disabled until a format is selected. Back hidden on Step 1.

#### Step 3 — "Progress"
- MUI `LinearProgress` with `variant="determinate"`, value 0-100 (from store `progress`)
- File size display: `Typography` showing formatted size (KB/MB) from store `fileSize`
- Status text: "Exporting..." / "Complete!" / "Error: {message}" (i18n-aware)
- Download button: MUI `Button` with `DownloadOutlined` icon — enabled only when `progress === 100` and `downloadUrl !== null`
- On download click: creates Blob URL from `downloadUrl`, triggers `<a>` click for browser download
- Error state: `Alert` severity="error" with message, retry button to restart export

#### Dialog Container
- MUI `Dialog` with `maxWidth="md"` (800px target)
- `fullScreen` prop on mobile (< 600px) — see §16 Responsive Behavior
- Title bar: `DialogTitle` with format name suffix ("Export Template — {format}")
- Content: `DialogContent` with `sx={{ minHeight: 400 }}`
- Actions: `DialogActions` with Back/Next/Download/Close depending on step

#### Export Store Integration
```typescript
const { format, options, isExporting, progress, downloadUrl, fileSize, error,
        setFormat, setOption, startExport, cancelExport, reset } = useExportStore();
```
- On `open` change to true: `reset()` store, pre-populate `templateId`
- On `open` change to false: `reset()` store, revoke any blob URLs
- On Step 3 mount: call `startExport(templateId, format, options)` — kicks off Apollo query or client-side generation
- Cancel button calls `cancelExport()` — aborts in-flight query/generation

---

## 14. Import Wizard Dialog (Enhanced UI)

### 14.1 Component Specification: `ImportWizardDialog`

**File:** `frontend/views/dashboard/cert/templates/import/ImportWizardDialog.tsx`

**Props:**
```typescript
interface ImportWizardDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: (templateId: string) => void;
}
```

**Architecture:** 4-step wizard using MUI Stepper, state managed by import Zustand store.

#### Step 1 — "Upload"
Uses the `FileDropZone` component (§15) as the primary input. Layout:

- **Primary area (full width):** `FileDropZone` with dashed border, drag-drop, click-to-browse. Accepted types: `.json`, `.zip`. Max file size: 50MB.
- **Secondary inputs (toggle):** Below the drop zone, a `ToggleButton` group with:
  - "URL Import" — toggles a `TextField` for entering a URL (server fetches file)
  - "Paste JSON" — toggles a `TextField` multiline (minRows=6, maxRows=12) for direct JSON paste
- **Validation feedback:** If file too large or wrong type → `Alert` severity="error" inline below drop zone

**Acceptance:**
- `.json` files: MIME `application/json`, max 50MB
- `.zip` files: MIME `application/zip`, max 50MB (500MB for batch ZIP — but capped at 50MB per single upload in UI)

#### Step 2 — "Validation"
Results table showing 4 validation checks, each as an expandable row in a `Table`:

| Check | Icon (pass) | Icon (fail) | Label | Status | Details (expandable) |
|-------|-------------|-------------|-------|--------|----------------------|
| Schema Validation | `CheckCircleOutlined` (success) | `ErrorOutlined` (error) | Schema Validation | Passed/Failed | Zod error paths, missing fields |
| Version Compatibility | `CheckCircleOutlined` | `WarningAmberOutlined` | Version Compatibility | Compatible/Warn | Schema version 1.0 vs current |
| Asset Integrity | `CheckCircleOutlined` | `BrokenImageOutlined` | Asset Integrity | Valid/Invalid | Image count, base64 validity |
| Variable Mapping | `CheckCircleOutlined` | `ReportOutlined` | Variable Mapping | Mapped/Issues | Duplicate names, missing types |

Each row:
- `IconButton` with expand/collapse arrow (`KeyboardArrowDownOutlined`)
- Expandable details: `Collapse` showing `Typography` with specific field-level errors/warnings
- Color-coded: green for pass, amber for warning, red for error

**Blocking errors (red):** Schema mismatch, corrupt ZIP — disable "Next" button, show Alert.
**Non-blocking warnings (amber):** Missing category, deprecated property — allow "Next" with confirmation.

#### Step 3 — "Preview & Conflicts"
Two-column layout (Stack direction horizontal on desktop, vertical on mobile):

**Left column — Template Preview:**
- Mini canvas preview (scaled-down representation of the template)
- Shows template title, dimensions, element count, variable count
- Uses scaled down canvas element (like Plan 11 Canvas but at 25% scale)
- `AspectRatio` wrapper to maintain template orientation ratio

**Right column — Conflict Resolution:**
- `ConflictResolutionCard` component (§15.3)
- Renders when imported template name already exists in database
- Shows radio group with Overwrite / Rename / Skip options
- Default selection: Rename (option 2)

**Navigation:** Back to Step 2, Next to Step 4 (Import). Next disabled if conflict resolution is Skip and no other templates to import.

#### Step 4 — "Import"
- MUI `LinearProgress` (determinate, 0-100%)
- Status text: "Importing template..." / "Import complete!" / "Import failed: {message}"
- On success: `Alert` severity="success" with summary (template name, element count, variable count)
- "View Template" button: calls `onImported(templateId)` → navigates to template editor
- On error: `Alert` severity="error" with error message + "Retry" button (returns to Step 3)
- "Close" button visible throughout, "View Template" only on success

#### Dialog Container
- MUI `Dialog` with `maxWidth="md"` (800px target)
- `fullScreen` on mobile — see §16 Responsive Behavior
- Title bar: `DialogTitle` "Import Template"
- Content: `DialogContent` with `sx={{ minHeight: 500 }}`
- Actions: `DialogActions` with Back/Next/Import/View/Close depending on step

### 14.2 Import Store Integration
```typescript
const { file, importUrl, pastedJson, validationResults, conflicts, resolution,
        isImporting, progress, importedTemplateId, error,
        setFile, setUrl, setPastedJson, startValidation, setResolution,
        startImport, reset } = useImportStore();
```

---

## 15. Supporting Components

### 15.1 Component Specification: `FileDropZone`

**File:** `frontend/views/dashboard/cert/templates/import/FileDropZone.tsx`

**Props:**
```typescript
interface FileDropZoneProps {
  acceptedTypes: string[];       // e.g., ['.json', '.zip']
  maxSize: number;               // bytes (e.g., 50 * 1024 * 1024)
  onFileSelected: (file: File) => void;   // click-to-browse
  onFileDropped: (file: File) => void;    // drag-drop
  urlInputEnabled: boolean;     // show URL import toggle
}
```

**Visual States:**

| State | Visual | Trigger |
|-------|--------|---------|
| Idle | Dashed `Outlined` border (2px, `divider` color), `CloudUploadOutlined` icon (64px, `text.secondary`), centered text "Drag file here or click to browse" | Default — no file, no interaction |
| Drag-over | Background tint: `primary.main` at 0.08 opacity, border: `primary.main` solid 2px, icon scales to 72px with `primary.main` color | `onDragOver` event |
| Uploading | `CircularProgress` (40px) centered, text "Processing..." | `isProcessing` prop or parent state |
| Error | Border: `error.main` dashed 2px, `ErrorOutlined` icon (64px, `error.main`), error message text in `error.main` color | File rejected (size/type) |
| Success | `CheckCircleOutlined` icon (64px, `success.main`), text "{fileName} ready" in `success.main` | File accepted and validated |

**Implementation details:**
- Root: `Box` with `sx` for border, padding (4), textAlign center, cursor pointer, transition
- Hidden `<input type="file" accept={acceptedTypes.join(',')} />` triggered by click
- `onDragOver` / `onDragLeave` / `onDrop` handlers with `e.preventDefault()`
- Drag state managed with `useState<'idle' | 'dragover'>`
- File selection: validate type and size → call appropriate callback or set error state
- Error message: uses i18n key from `certificates.templates.importExport` namespace
- Accessible: `role="button"`, `aria-label` from i18n `dropZoneText`, `tabIndex={0}`, keyboard `Enter`/`Space` triggers file input

**URL Import Sub-component:**
- `ToggleButton` "Import from URL" reveals `TextField` with `placeholder="https://..."`, `type="url"`
- "Fetch" button next to text field calls `onFileSelected` with a synthetic File-like object
- Loading state: `CircularProgress` in button

**Paste JSON Sub-component:**
- `ToggleButton` "Paste JSON" reveals `TextField` multiline (`minRows={6}`, `maxRows={12}`)
- "Validate" button calls `onFileSelected` with a synthetic File (Blob from text content)
- Syntax error preview: red underline in textarea if JSON.parse fails

### 15.2 Export/Import Zustand Stores

#### 15.2.1 Export Store

**File:** `frontend/stores/cert/templateExportStore.ts`

```typescript
interface ExportState {
  // Dialog state
  open: boolean;
  templateId: string | null;

  // Step 1: Format selection
  format: 'json' | 'zip' | 'pdf' | 'png' | 'svg';

  // Step 2: Format-specific options
  options: {
    includeAssets: boolean;      // JSON, ZIP
    prettyPrint: boolean;        // JSON
    compress: boolean;           // ZIP
    includeThumbnails: boolean;  // ZIP
    quality: 'draft' | 'standard' | 'high'; // PDF
    pageSize: 'A4' | 'Letter' | 'Custom';   // PDF
    resolution: 1 | 2 | 3;       // PNG
    transparent: boolean;        // PNG
    embedFonts: boolean;         // SVG
  };

  // Step 3: Progress
  isExporting: boolean;
  progress: number;              // 0-100
  downloadUrl: string | null;    // Blob URL
  fileSize: number | null;       // bytes
  error: string | null;

  // Actions
  setOpen: (open: boolean) => void;
  setTemplateId: (id: string) => void;
  setFormat: (format: ExportState['format']) => void;
  setOption: <K extends keyof ExportState['options']>(key: K, value: ExportState['options'][K]) => void;
  startExport: () => Promise<void>;
  cancelExport: () => void;
  reset: () => void;
}
```

**Persistence:** `partialize` excludes `downloadUrl` (blob URLs are ephemeral), `fileSize`, `progress` — these are runtime-only. Persists `open`, `templateId`, `format`, `options` for UX continuity.

**Export flow:**
1. `startExport()` checks `format` and dispatches appropriate logic:
   - `json`: Apollo `exportTemplate` query → `JSON.stringify` (pretty if `prettyPrint`) → Blob
   - `zip`: Apollo batch export → JSZip creation → Blob
   - `pdf`: Client-side canvas render → `jsPDF` or similar → Blob
   - `png`: Canvas screenshot at `resolution` → Canvas → Blob
   - `svg`: Canvas → SVG serialization → Blob
2. Creates blob URL: `URL.createObjectURL(blob)` → stores in `downloadUrl`
3. Updates `fileSize` with blob.size
4. Sets `progress` to 100, `isExporting` to false
5. Error handler: sets `error`, `isExporting` to false, logs via `logger.error`

#### 15.2.2 Import Store

**File:** `frontend/stores/cert/templateImportStore.ts`

```typescript
interface ImportState {
  // Dialog state
  open: boolean;

  // Step 1: File selection
  file: File | null;
  importUrl: string;
  pastedJson: string;

  // Step 2: Validation results
  validationResults: ValidationResult[];

  // Step 3: Conflicts
  conflicts: ConflictInfo[];
  resolution: 'overwrite' | 'rename' | 'skip';
  renamedTitle: string;          // editable by user

  // Step 4: Import progress
  isImporting: boolean;
  progress: number;             // 0-100
  importedTemplateId: string | null;
  error: string | null;

  // Actions
  setOpen: (open: boolean) => void;
  setFile: (file: File) => void;
  setUrl: (url: string) => void;
  setPastedJson: (json: string) => void;
  startValidation: () => Promise<void>;
  setResolution: (resolution: ImportState['resolution']) => void;
  setRenamedTitle: (title: string) => void;
  startImport: () => Promise<void>;
  reset: () => void;
}

interface ValidationResult {
  check: 'schema' | 'version' | 'asset' | 'variable';
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: string[];
}

interface ConflictInfo {
  existingTemplateId: string;
  existingTitle: string;
  importedTitle: string;
}
```

**Persistence:** `partialize` excludes `file` (non-serializable File object), `validationResults` (transient), `progress`, `error`. Persists `open`, `resolution`, `renamedTitle` for UX continuity.

**Validation flow:**
1. `startValidation()` reads file content via FileReader
2. Detects format (JSON vs ZIP via magic bytes)
3. Runs client-side Zod validation pipeline (see §5.1)
4. Populates `validationResults` with per-check results
5. If all pass (or only warnings) → auto-advance to Step 3 (Preview)
6. If any blocking errors → stay on Step 2, disable Next

**Import flow:**
1. `startImport()` builds import input from file/pastedJson + resolution choice
2. Calls Apollo `importTemplate` mutation (or `batchImportTemplates` for ZIP)
3. Updates `progress` during mutation (using `onUploadProgress` or polling)
4. On success: stores `importedTemplateId`, sets `progress` to 100
5. On error: stores `error`, stays on Step 4 with retry option

### 15.3 Component Specification: `ConflictResolutionCard`

**File:** `frontend/views/dashboard/cert/templates/import/ConflictResolutionCard.tsx`

**Props:**
```typescript
interface ConflictResolutionCardProps {
  existingTitle: string;
  importedTitle: string;
  resolution: 'overwrite' | 'rename' | 'skip';
  renamedTitle: string;
  onResolutionChange: (resolution: 'overwrite' | 'rename' | 'skip') => void;
  onRenamedTitleChange: (title: string) => void;
}
```

**Renders when:** Imported template name already exists in the database (detected by name lookup during validation step).

**UI Structure:**
- `Card` container with `sx={{ p: 3 }}`
- `CardHeader` with `WarningAmberOutlined` icon, title "Name Conflict Detected", subheader "A template with this name already exists"
- `RadioGroup` with 3 `FormControlLabel` options:

**Option 1 — "Overwrite existing template"**
- Radio value: `"overwrite"`
- Label: "Overwrite existing template"
- Warning text (Typography variant="caption", color="error.main"): "This will replace the current template. This action cannot be undone."
- `WarningAmberOutlined` icon next to label

**Option 2 — "Import as new template" (DEFAULT)**
- Radio value: `"rename"`
- Label: "Import as new template"
- Auto-generated name: `"{originalTitle} (Imported)"` — shown in editable `TextField`
- `TextField` is enabled only when this option is selected, otherwise `disabled`
- `CreateNewFolderOutlined` icon next to label

**Option 3 — "Skip this template"**
- Radio value: `"skip"`
- Label: "Skip this template"
- Helper text: "No changes will be made."
- `SkipNextOutlined` icon next to label

**Default selection:** Option 2 (Rename) — safest default, preserves existing template.

**Visual hierarchy:**
- Each option in a `Box` with `sx={{ mb: 2, p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}`
- Selected option: `borderColor: 'primary.main'`, background `primary.main` at 0.04 opacity
- Unselected: `borderColor: 'divider'`

---

## 16. Responsive Behavior

### 16.1 Desktop (>1200px)
- Export Dialog: MUI `Dialog` with `maxWidth="md"` (effectively 800px), `fullScreen={false}`
- Import Dialog: MUI `Dialog` with `maxWidth="md"` (800px), `fullScreen={false}`
- Both dialogs: `sx={{ maxHeight: '90vh' }}` on DialogContent, internal scroll if content overflows
- Step 3 (Preview & Conflicts): two-column horizontal layout (left preview, right conflicts)
- Format cards: 3-column grid (`{ xs: 12, sm: 6, md: 4 }`)
- Navigation: Back/Next as DialogActions buttons (left-aligned Back, right-aligned Next)

### 16.2 Tablet (>600px to ≤1200px)
- Both dialogs: `maxWidth="sm"` (600px), `fullScreen={false}`
- `DialogContent` scrollable (`scroll="paper"`)
- Step 3 (Preview & Conflicts): single column, conflicts below preview
- Format cards: 2-column grid (`{ xs: 12, sm: 6 }`)
- Navigation: Back/Next in DialogActions

### 16.3 Mobile (<600px)
- Both dialogs: `fullScreen={true}` — entire viewport
- `DialogTitle` with close (X) button in top-right
- No DialogActions bar — navigation via bottom `AppBar` with Back/Next `Button`s (sticky)
- Step 3 (Preview & Conflicts): single column, conflicts below preview, each scrollable independently
- Format cards: 1-column grid (`{ xs: 12 }`), cards full-width
- Step transitions: slide animation (MUI `Slide` direction="left" for forward, "right" for back)
- Touch targets: all buttons ≥48×48dp (MUI Button default in mobile theme)
- `Stepper` component: use `orientation="horizontal"` with compact labels or `orientation="vertical"` with step content inline

### 16.4 Responsive Implementation

```typescript
// In ExportWizardDialog.tsx and ImportWizardDialog.tsx
const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('md')); // < 600px in MUI default
const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

<Dialog
  open={open}
  onClose={onClose}
  fullScreen={isMobile}
  maxWidth={isMobile ? false : isTablet ? 'sm' : 'md'}
  fullWidth
>
  {/* ... */}
</Dialog>
```

**Note:** `useMediaQuery` is allowed in the container/switcher component (tier entry point), NOT in inner tier-specific files. These wizard dialogs are tier-aware containers that handle their own responsive layout.

---

## Round 4 Enhancement — Production Hardening

This section specifies production-grade hardening for the template import/export pipeline. All enhancements build on the existing Round 2/3 architecture (stores, services, GraphQL mutations, wizard dialogs) without breaking prior contracts. Round 4 introduces ten subsystems, each with its own design, state additions, component specs, and testing requirements.

### R4.1 File Validation Hardening

#### R4.1.1 Design Rationale

The Round 2 validation pipeline (`FileValidationService` in Task 2.23) performs client-side Zod schema checks. Production usage requires additional layers: file-size enforcement, format magic-byte detection, content schema-version checks, and virus scan integration. These layers must run in sequence with short-circuit semantics — the first blocking error halts the pipeline and displays a user-visible validation result card.

#### R4.1.2 Validation Pipeline (Extended)

```
Upload →
  Layer 1: File Size Check (50MB template / 10MB image) →
  Layer 2: Format Magic-Byte Detection (JSON: `{` / ZIP: `PK` / PNG: `\x89PNG` / JPG: `\xFF\xD8` / SVG: `<svg`) →
  Layer 3: Schema Version Check (parse top-level `schemaVersion`, compare against `SUPPORTED_SCHEMA_VERSIONS`) →
  Layer 4: Required Fields Check (templateName, elements[], canvas config) →
  Layer 5: Virus Scan (server-side ClamAV via GraphQL mutation `scanTemplateFile`) →
  Layer 6: Content Validation (Zod schema, asset reference resolution, variable name uniqueness) →
  ValidationResult[] surfaced to UI
```

#### R4.1.3 Constants

**File:** `shared/constants/cert/templateValidation.ts`

```typescript
export const TEMPLATE_FILE_LIMITS = {
  MAX_TEMPLATE_FILE_SIZE: 50 * 1024 * 1024,   // 50 MB
  MAX_IMAGE_ASSET_SIZE: 10 * 1024 * 1024,     // 10 MB
  SUPPORTED_SCHEMA_VERSIONS: ['1.0.0', '1.1.0', '1.2.0'] as const,
  LATEST_SCHEMA_VERSION: '1.2.0',
  DEPRECATED_SCHEMA_VERSIONS: ['1.0.0'] as const,
} as const;

export const SUPPORTED_IMAGE_FORMATS = ['image/png', 'image/jpeg', 'image/svg+xml'] as const;

export const TEMPLATE_MAGIC_BYTES = {
  JSON: 0x7B,      // '{'
  ZIP: [0x50, 0x4B], // 'PK'
  PNG: [0x89, 0x50, 0x4E, 0x47],
  JPG: [0xFF, 0xD8],
  SVG: '<svg',
} as const;
```

#### R4.1.4 Virus Scan Integration Spec

Virus scanning is server-side only. The client uploads the file to a backend GraphQL mutation that proxies to ClamAV (or a configured scan service). The mutation returns a `VirusScanResult`.

**GraphQL Schema Addition (Pothos):**

```typescript
// backend/graphql/pothos/types/virusScan.ts
const VirusScanResult = builder.objectType('VirusScanResult', {
  fields: (t) => ({
    isClean: t.exposeBoolean('isClean'),
    threatName: t.exposeString('threatName', { nullable: true }),
    scannedAt: t.field({ type: 'DateTime', resolve: (v) => v.scannedAt }),
    scanDurationMs: t.exposeInt('scanDurationMs'),
  }),
});

builder.mutationField('scanTemplateFile', (t) =>
  t.field({
    type: VirusScanResult,
    args: { fileId: t.arg.string() },
    resolve: async (root, args, ctx) => {
      return ctx.services.certificate.scanTemplateFile(args.fileId, ctx);
    },
  }),
);
```

**Service Method:**

```typescript
// backend/services/certificate/virusScanService.ts
async scanTemplateFile(fileId: string, ctx: Context): Promise<VirusScanResult> {
  const stream = await ctx.storage.getFileStream(fileId);
  const result = await ctx.virusScanner.scan(stream);
  logger.info('Virus scan completed', { fileId, isClean: result.isClean });
  return result;
}
```

#### R4.1.5 Validation Result UI

**File:** `frontend/views/dashboard/cert/templates/import/ValidationResultList.tsx`

Renders the `ValidationResult[]` from the import store with enhanced visual states:

| Validation Layer | Pass Icon | Warning Icon | Fail Icon | Color |
|-----------------|-----------|-------------|-----------|-------|
| File Size | `CheckCircleOutlined` | — | `ErrorOutlined` | `success.main` / `error.main` |
| Format Detection | `CheckCircleOutlined` | — | `ErrorOutlined` | `success.main` / `error.main` |
| Schema Version | `CheckCircleOutlined` | `WarningAmberOutlined` | `ErrorOutlined` | `success.main` / `warning.main` / `error.main` |
| Required Fields | `CheckCircleoutlined` | — | `ErrorOutlined` | `success.main` / `error.main` |
| Virus Scan | `SecurityOutlined` | — | `DangerousOutlined` | `success.main` / `error.main` |
| Content Validation | `CheckCircleOutlined` | `WarningAmberOutlined` | `ErrorOutlined` | `success.main` / `warning.main` / `error.main` |

Each result row uses `ListItem` with `sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}`. Expandable `Collapse` shows `details[]` when the user clicks the `ExpandMoreOutlined` icon.

### R4.2 Progress Indicators

#### R4.2.1 Design Rationale

Round 2 provides a simple `progress: number` (0–100) in the export/import stores. Production requires multi-stage progress with per-file granularity (batch export), step labels, estimated time remaining, and a cancel button that triggers cleanup (blob URL revocation, abort controller, server-side cancellation token).

#### R4.2.2 Extended Progress State

Add to `templateExportStore`:

```typescript
// Round 4 additions to ExportState
exportStep: 'idle' | 'collecting' | 'compressing' | 'uploading' | 'finalizing' | 'done' | 'cancelled' | 'error';
stepLabel: string;                    // human-readable current step
perFileProgress: Map<string, number>; // templateId → 0-100 (batch export)
estimatedTimeRemaining: number | null; // seconds, null until ≥2 data points
cancelRequested: boolean;
abortController: AbortController | null;
```

Add to `templateImportStore`:

```typescript
// Round 4 additions to ImportState
importStep: 'idle' | 'validating' | 'scanning' | 'importing' | 'finalizing' | 'done' | 'cancelled' | 'error';
stepLabel: string;
perFileProgress: Map<string, number>;   // for batch ZIP import
estimatedTimeRemaining: number | null;
cancelRequested: boolean;
abortController: AbortController | null;
rollbackSnapshot: TemplateSnapshot | null; // for R4.3 rollback
```

#### R4.2.3 Progress Bar Component

**File:** `frontend/views/dashboard/cert/templates/shared/ProgressTracker.tsx`

```typescript
interface ProgressTrackerProps {
  step: string;                       // current step key
  stepLabel: string;
  progress: number;                   // 0-100
  perFileProgress?: Map<string, number>;
  estimatedTimeRemaining: number | null;
  onCancel: () => void;
  cancelLabel: string;
}
```

**UI Structure:**
- `Box` container, `sx={{ p: 3 }}`
- `LinearProgress` with `variant="determinate"`, `value={progress}`, `sx={{ height: 8, borderRadius: 4, mb: 2 }}`
- `Typography` step label: `variant="body2"`, `sx={{ color: 'text.secondary', mb: 1 }}`
- Estimated time: `Typography variant="caption"` → formatted as "Est. ~ Xm Ys remaining" (hidden when `null`)
- Per-file sub-progress: `Collapse` with inner `LinearProgress` per file (batch mode)
- Cancel `Button`: `color="error"`, `variant="outlined"`, `startIcon={<CancelOutlined />}`
  - Confirm dialog (`Dialog` with `DialogTitle="Cancel export?"`) before aborting
  - On confirm: call `onCancel()`, which triggers `abortController.abort()` + blob URL cleanup

#### R4.2.4 Step Label Translations

**File:** `shared/locale/cert/importExport.ts` (type schema)

```typescript
export interface ImportExportStepLabels {
  collecting: (fileCount: number) => string;
  compressing: () => string;
  uploading: (percent: number) => string;
  validating: () => string;
  scanning: () => string;
  importing: (percent: number) => string;
  finalizing: () => string;
}
```

Each locale implements this with template-literal interpolation. Example for `en`:

```typescript
collecting: (n) => `Collecting ${n} template${n > 1 ? 's' : ''}...`,
compressing: () => 'Compressing archive...',
uploading: (p) => `Uploading... ${p}%`,
```

### R4.3 Error Recovery

#### R4.3.1 Design Rationale

Production imports can fail mid-way (network timeout, server 500, partial ZIP extraction). Round 4 adds retry-with-backoff, skip-and-continue for batch operations, downloadable error logs, partial resume capability, and rollback to pre-import state.

#### R4.3.2 Retry with Backoff

```typescript
// frontend/stores/cert/templateImportStore.ts — action addition
retryFailedFile: (fileId: string) => Promise<void>;
```

Implementation uses exponential backoff: `delay = min(initialDelayMs * 2^attempt, maxDelayMs)` with jitter. Defaults: `initialDelayMs = 1000`, `maxDelayMs = 30000`, `maxAttempts = 3`.

```typescript
async retryFailedFile(fileId: string) {
  const { maxAttempts, initialDelayMs, maxDelayMs } = RETRY_CONFIG;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await this.performImport(fileId);
      return;
    } catch (err) {
      if (attempt === maxAttempts - 1) throw err;
      const jitter = Math.random() * 500;
      const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs) + jitter;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

#### R4.3.3 Skip and Continue

For batch ZIP imports, each template is processed independently. The import store tracks per-template status:

```typescript
interface BatchImportEntry {
  templateId: string;
  title: string;
  status: 'pending' | 'importing' | 'success' | 'failed' | 'skipped';
  error: string | null;
}
```

A "Skip Failed & Continue" `Button` (in the progress step UI) marks all `failed` entries as `skipped` and completes the batch with `partial: true`.

#### R4.3.4 Error Log Report

**File:** `frontend/views/dashboard/cert/templates/shared/ErrorLogDownloadButton.tsx`

On batch completion with failures, a `Button` labeled "Download Error Report" generates a JSON file containing:

```typescript
interface ImportErrorReport {
  generatedAt: string;               // ISO timestamp
  totalTemplates: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: ImportErrorEntry[];
}

interface ImportErrorEntry {
  templateTitle: string;
  errorType: 'validation' | 'network' | 'server' | 'virus' | 'unknown';
  errorMessage: string;
  retryAttempted: boolean;
  timestamp: string;
}
```

Downloaded via `Blob` → `URL.createObjectURL` → `<a download="import-error-report.json">`.

#### R4.3.5 Partial Export/Import Resume

**Export:** `perFileProgress` persisted to `localStorage` via Zustand `persist` middleware. On wizard re-open, if `isExporting === true` and `cancelRequested === false` (e.g., browser refresh), a "Resume" `Button` re-continues from the last checkpoint.

**Import:** The server stores partial import state keyed by `importSessionId` (UUID generated client-side). The `importTemplate` mutation accepts an optional `resumeFrom` parameter. On resume, the server skips already-imported templates (identified by checksum match).

#### R4.3.6 Rollback to Pre-Import State

Before import begins, the client requests a pre-import snapshot from the server:

```graphql
query PreImportSnapshot($templateName: String!) {
  preImportSnapshot(templateName: $templateName) {
    snapshotId
    elements { id type config }
    variables { id name type defaultValue }
    canvasConfig
    capturedAt
  }
}
```

The snapshot is stored in `importStore.rollbackSnapshot`. If import fails critically (e.g., virus detected mid-import), the "Rollback" `Button` calls:

```graphql
mutation RollbackImport($snapshotId: String!) {
  rollbackImport(snapshotId: $snapshotId) {
    restoredTemplateId
  }
}
```

The server restores the template to its pre-import state and deletes any partially imported elements/variables.

### R4.4 Template Diff Preview

#### R4.4.1 Design Rationale

Before overwriting an existing template, users must see exactly what will change. Round 4 adds a side-by-side diff preview rendered before the import confirmation step.

#### R4.4.2 Diff Computation

**File:** `frontend/views/dashboard/cert/templates/import/TemplateDiffViewer.tsx`

The diff is computed client-side using a structural comparison algorithm:

1. Fetch current template via Apollo `exportTemplate(existingTemplateId)` query
2. Parse incoming template JSON
3. Compare element-by-element using a key-match algorithm (match by `element.id` or `element.label`)
4. Compare variable-by-variable (match by `variable.name`)
5. Compare canvas config (width, height, background)

Diff categories: `added`, `removed`, `modified`, `unchanged`.

#### R4.4.3 Diff Data Model

```typescript
interface TemplateDiff {
  elements: ElementDiff[];
  variables: VariableDiff[];
  canvasConfig: ConfigDiff;
  summary: DiffSummary;
}

interface ElementDiff {
  matchKey: string;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  oldValue: ElementConfig | null;
  newValue: ElementConfig | null;
  changedFields: string[];
}

interface DiffSummary {
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  unchangedCount: number;
}
```

#### R4.4.4 Diff UI

| Section | Layout | Visual |
|---------|--------|--------|
| Elements Diff | Two-column `Grid` (left=current, right=new) | Rows colored: green=`added`, red=`removed`, amber=`modified` |
| Variables Diff | `Table` with columns: Name, Type, Old Default, New Default, Status `Chip` | `Chip` color: `success`/`error`/`warning` |
| Canvas Config | `Box` with `Typography` lines | Changed fields bold |
| Summary | `Stack` of `Chip`s | `Chip` per category with count |

**Merge Strategy Selector:**

`RadioGroup` with 3 options:
- `"merge"` — Keep unchanged elements, replace modified, add new (DEFAULT)
- `"replace"` — Replace all elements with incoming
- `"append"` — Keep all existing, append only new elements from incoming

```typescript
interface MergeStrategySelectorProps {
  strategy: 'merge' | 'replace' | 'append';
  onStrategyChange: (s: 'merge' | 'replace' | 'append') => void;
  diffSummary: DiffSummary;
}
```

### R4.5 Batch Export Settings

#### R4.5.1 Design Rationale

Round 2 batch export is a simple "select all → ZIP" flow. Production requires granular control: per-template selection, asset inclusion toggles, variable inclusion toggles, manifest with version metadata, and checksums for integrity verification.

#### R4.5.2 Batch Export Dialog

**File:** `frontend/views/dashboard/cert/templates/export/BatchExportDialog.tsx`

Replaces the simple "Export Selected" button to open a comprehensive batch configuration dialog.

**UI Structure:**
- `Dialog` with `maxWidth="md"`, `sx={{ p: 3 }}`
- Section 1 — Template Selection: `DataGrid` with checkboxes (columns: Title, Version, Last Modified, Elements count)
- Section 2 — Export Options (toggles):
  - `FormControlLabel` with `Checkbox`: "Include assets (background images)" — default ON
  - `FormControlLabel` with `Checkbox`: "Include variables" — default ON
  - `FormControlLabel` with `Checkbox`: "Include version metadata in manifest" — default ON
  - `FormControlLabel` with `Checkbox`: "Generate checksums" — default ON
- Section 3 — Progress tracker (reuses `ProgressTracker` from R4.2)

#### R4.5.3 Manifest Format

```json
{
  "manifestVersion": "1.0.0",
  "generatedAt": "2026-08-02T10:25:15.781Z",
  "exportedBy": { "userId": "uuid", "username": "admin" },
  "templates": [
    {
      "fileName": "template-001.json",
      "templateId": "uuid",
      "title": "Annual Completion Certificate",
      "schemaVersion": "1.2.0",
      "elementCount": 12,
      "variableCount": 4,
      "hasAssets": true,
      "checksum": "sha256:abc123..."
    }
  ],
  "totalCount": 3,
  "totalChecksum": "sha256:def456..."
}
```

#### R4.5.4 Store Additions

`templateExportStore` additions:

```typescript
interface BatchExportConfig {
  selectedTemplateIds: string[];
  includeAssets: boolean;
  includeVariables: boolean;
  includeVersionMetadata: boolean;
  generateChecksums: boolean;
}

// New state fields
batchConfig: BatchExportConfig;
setBatchConfig: (config: Partial<BatchExportConfig>) => void;
selectedTemplateIds: string[];
toggleTemplateSelection: (id: string) => void;
selectAllVisible: (ids: string[]) => void;
clearSelection: () => void;
```

### R4.6 Import Hooks

#### R4.6.1 Design Rationale

Production environments need custom transformation pipelines: version migration, field renaming, custom validation, and programmatic import via API. Round 4 defines a hook system with pre-import and post-import phases.

#### R4.6.2 Hook Pipeline

```
File Upload →
  Pre-Import Hooks (transformations) →
    1. Version Migration Hook (auto-upgrade schemaVersion)
    2. Field Renaming Hook (map legacy field names)
    3. Custom Adapter Hook (user-registered)
  Validation →
  Import Execution →
  Post-Import Hooks (validation) →
    1. Post-Import Validation Hook (referential integrity)
    2. Custom Post-Import Hook (user-registered)
```

#### R4.6.3 Hook Interface

**File:** `backend/services/cert/importHooks.ts`

```typescript
interface PreImportHook {
  name: string;
  priority: number;                    // lower runs first
  transform: (payload: RawTemplatePayload, ctx: HookContext) => Promise<TransformedTemplatePayload>;
}

interface PostImportHook {
  name: string;
  priority: number;
  validate: (template: ImportedTemplate, ctx: HookContext) => Promise<ValidationResult[]>;
}

interface HookContext {
  locale: string;
  t: TranslateFunction;
  logger: Logger;
  existingTemplates: TemplateSummary[];
}

interface ImportHookRegistry {
  preImportHooks: PreImportHook[];
  postImportHooks: PostImportHook[];
  registerPreImport: (hook: PreImportHook) => void;
  registerPostImport: (hook: PostImportHook) => void;
}
```

#### R4.6.4 Built-in Hooks

**Version Migration Hook:**
```typescript
const versionMigrationHook: PreImportHook = {
  name: 'version-migration',
  priority: 10,
  transform: async (payload, ctx) => {
    if (payload.schemaVersion === '1.0.0') {
      // Migrate 1.0.0 → 1.1.0: rename `text` element type → `textBox`
      payload.elements = payload.elements.map(el =>
        el.type === 'text' ? { ...el, type: 'textBox' } : el
      );
      payload.schemaVersion = '1.1.0';
      ctx.logger.info('Migrated schema 1.0.0 → 1.1.0', { templateTitle: payload.title });
    }
    return payload;
  },
};
```

**Field Renaming Hook:**
```typescript
const fieldRenamingHook: PreImportHook = {
  name: 'field-renaming',
  priority: 20,
  transform: async (payload) => {
    // Rename legacy field names
    const renames: Record<string, string> = {
      'bgImage': 'backgroundImage',
      'fontSize': 'textStyles.fontSize',
    };
    // Apply renames to element configs
    return applyFieldRenames(payload, renames);
  },
};
```

#### R4.6.5 Custom Import Adapter Spec

Users can register custom adapters for non-standard export formats:

```typescript
interface CustomImportAdapter {
  name: string;
  detect: (file: File) => boolean;                     // returns true if this adapter handles the file
  parse: (file: File) => Promise<RawTemplatePayload>;   // transform to canonical format
}

// Registration via GraphQL
builder.mutationField('registerImportAdapter', (t) =>
  t.field({
    type: 'Boolean',
    args: { adapterConfig: t.arg.string() },
    resolve: async (root, args, ctx) => {
      ctx.services.certificate.registerImportAdapter(JSON.parse(args.adapterConfig));
      return true;
    },
  }),
);
```

#### R4.6.6 API Endpoint for Programmatic Import

**File:** `app/api/cert/templates/import/route.ts`

```typescript
// POST /api/cert/templates/import
// Content-Type: multipart/form-data
// Body: file (upload) + options JSON
// Auth: Bearer token (Certificate Admin role)
// Response: { importedTemplateId, warnings[], validationResults[] }
```

This REST endpoint is for CI/CD pipelines and external integrations. It internally calls the same `certificateService.importTemplate()` used by the GraphQL resolver, ensuring consistent validation and hook execution.

### R4.7 Export Format Options

#### R4.7.1 Design Rationale

Round 2 supports JSON, ZIP, PDF, PNG, SVG. Production adds: JSON minimal (no assets), shareable read-only link, and embed code (iframe). Each format has distinct generation logic, storage implications, and UI options.

#### R4.7.2 Format Catalog

| Format | Description | File Extension | Max Size | Use Case |
|--------|-------------|----------------|----------|----------|
| JSON (full) | Complete template + assets (base64) | `.json` | 50MB | Backup/migration |
| JSON (minimal) | Template structure, no assets | `.json` | 5MB | Quick sharing, version control |
| ZIP | Template JSON + asset files | `.zip` | 50MB | Full archive with separate assets |
| PDF bundle | Template + sample rendered certificate | `.pdf` | 20MB | Client preview, print proof |
| Shareable link | Server-hosted read-only view | URL | N/A | Non-technical sharing |
| Embed code | iframe snippet for external sites | HTML | N/A | LMS / website embedding |

#### R4.7.3 Shareable Link

**GraphQL Mutation:**
```graphql
mutation CreateShareableLink($templateId: String!, $expiresInHours: Int) {
  createShareableLink(templateId: $templateId, expiresInHours: $expiresInHours) {
    url
    expiresAt
    token
  }
}
```

The URL points to `app/[locale]/cert/templates/shared/[token]/page.tsx` — a public read-only route that renders the template preview without authentication.

#### R4.7.4 Embed Code

Generated client-side as an HTML snippet:

```html
<iframe
  src="https://siraj.example.com/cert/templates/shared/{token}?embed=true"
  width="800"
  height="600"
  frameborder="0"
  allowfullscreen
></iframe>
```

The embed code is displayed in a `TextField` with `multiline`, `readOnly`, and a "Copy to Clipboard" `Button` (`IconButton` with `ContentCopyOutlined`).

#### R4.7.5 Format Selection UI Update

Export Step 1 format cards (Round 2 Task 2.15) update to 6 cards. Grid layout: `{ xs: 12, sm: 6, md: 4 }` — 3 columns on desktop, 2 on tablet, 1 on mobile (same as Round 2, cards just rearrange).

When "JSON (minimal)" is selected, Step 2 shows a warning `Alert` (severity="warning"): "Assets will be excluded. Template will reference external image URLs."

When "Shareable link" is selected, Step 2 shows:
- `TextField` for expiry duration (default 24 hours, max 720 hours/30 days)
- `RadioGroup` for access level: "Anyone with link" / "Organization members only"

### R4.8 Template Versioning

#### R4.8.1 Design Rationale

Round 2 treats import as a single operation. Production requires semantic versioning of templates: version bump on import, changelog generation, deprecated field handling, backward compatibility matrix, and migration scripts.

#### R4.8.2 Version Bump Strategy

On import (overwrite mode), the server performs an automatic version bump:

```typescript
type VersionBumpType = 'minor' | 'major' | 'patch';

interface VersionBumpConfig {
  bumpType: VersionBumpType;
  reason: string;                      // changelog entry
  breakingChanges: string[];          // for major bumps
}

function computeVersionBump(current: string, incoming: string, diff: TemplateDiff): VersionBumpConfig {
  if (diff.summary.removedCount > 0 || hasBreakingChanges(diff)) {
    return { bumpType: 'major', reason: 'Breaking changes detected', breakingChanges: extractBreakingChanges(diff) };
  }
  if (diff.summary.addedCount > 0 || diff.summary.modifiedCount > 0) {
    return { bumpType: 'minor', reason: 'Elements added or modified', breakingChanges: [] };
  }
  return { bumpType: 'patch', reason: 'No structural changes', breakingChanges: [] };
}
```

#### R4.8.3 Changelog Generation

After each import, a changelog entry is generated and stored:

```typescript
interface TemplateChangelogEntry {
  version: string;                     // e.g., "1.3.0"
  bumpType: VersionBumpType;
  timestamp: string;                   // ISO 8601
  importedBy: string;                  // username
  reason: string;
  changes: {
    added: string[];                   // element labels or variable names
    removed: string[];
    modified: string[];
  };
}
```

Stored in a `template_changelog` table:

```typescript
// backend/db/schema/templateChangelog.ts
export const templateChangelog = pgTable('template_changelog', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => templates.id),
  version: varchar('version', { length: 20 }).notNull(),
  bumpType: varchar('bump_type', { length: 10 }).notNull(),
  changelogData: jsonb('changelog_data').notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

#### R4.8.4 Deprecated Field Handling

Fields marked as deprecated in the schema version comparison trigger a warning (not an error). The import store surfaces these in the validation results:

```typescript
// In validation pipeline, Layer 3 (schema version check):
const deprecatedFields = detectDeprecatedFields(payload, currentSchemaVersion);
if (deprecatedFields.length > 0) {
  validationResults.push({
    check: 'schema',
    status: 'warning',
    message: `Deprecated fields detected: ${deprecatedFields.join(', ')}`,
    details: deprecatedFields.map(f => `Field "${f}" will be removed in schema v2.0.0`),
  });
}
```

#### R4.8.5 Backward Compatibility Matrix

**File:** `shared/constants/cert/compatibilityMatrix.ts`

```typescript
export const COMPATIBILITY_MATRIX: Record<string, CompatEntry> = {
  '1.0.0': { canImportTo: ['1.1.0', '1.2.0'], migrationRequired: true, deprecatedFields: ['bgImage'] },
  '1.1.0': { canImportTo: ['1.2.0'], migrationRequired: false, deprecatedFields: [] },
  '1.2.0': { canImportTo: [], migrationRequired: false, deprecatedFields: [] },
};
```

Displayed in the import wizard as a collapsible `Accordion` ("Show compatibility details").

#### R4.8.6 Migration Script Spec

For major version upgrades (e.g., 1.x → 2.x), the server provides migration scripts:

```typescript
// backend/services/cert/migrations/
interface MigrationScript {
  fromVersion: string;
  toVersion: string;
  migrate: (payload: RawTemplatePayload) => Promise<RawTemplatePayload>;
}
```

Scripts are automatically detected based on the `schemaVersion` gap and chained if multiple hops are needed.

### R4.9 Accessibility

#### R4.9.1 Design Rationale

Round 2 mentions keyboard navigation in acceptance criteria but doesn't specify ARIA patterns. Round 4 adds explicit accessibility specs for screen readers, ARIA roles, keyboard navigation, and error announcement.

#### R4.9.2 ARIA Roles for Wizard Steps

```typescript
// ExportWizardDialog.tsx and ImportWizardDialog.tsx
<Stepper
  activeStep={activeStep}
  aria-label="Import wizard steps"
  role="navigation"
>
  {steps.map((step, index) => (
    <Step
      key={step.label}
      completed={index < activeStep}
      aria-current={index === activeStep ? 'step' : undefined}
    >
      <StepLabel aria-label={`Step ${index + 1}: ${step.label}`}>
        {step.label}
      </StepLabel>
    </Step>
  ))}
</Stepper>
```

The `Stepper` container gets `role="navigation"` and `aria-label`. Each `StepLabel` receives `aria-label` with step number + label. The active step has `aria-current="step"`.

#### R4.9.3 Progress Announcement for Screen Readers

```typescript
// ProgressTracker.tsx
<Box
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  <Typography aria-label={`Progress: ${progress} percent. ${stepLabel}`}>
    {stepLabel}
  </Typography>
  <LinearProgress
    variant="determinate"
    value={progress}
    aria-label="Import progress"
    aria-valuetext={`${progress}%`}
  />
</Box>
```

`aria-live="polite"` ensures screen readers announce progress updates without interrupting other speech. `aria-atomic="true"` makes the entire region re-announced on each update.

#### R4.9.4 Keyboard Navigation Through File List

The batch export template selection `DataGrid` must support:
- `Tab` to enter the grid (focus on first row)
- `Arrow Up/Down` to move between rows
- `Space` to toggle checkbox selection
- `Enter` to open the row's detail (template metadata)
- `Escape` to exit the grid (focus returns to dialog)

Implementation uses MUI `DataGrid` built-in keyboard support, with `aria-label` on the grid: "Select templates for batch export".

#### R4.9.5 Error Announcement

```typescript
// When validation fails or import errors:
<Alert
  severity="error"
  role="alert"
  aria-live="assertive"
>
  {errorMessage}
</Alert>
```

`role="alert"` with `aria-live="assertive"` ensures screen readers immediately announce errors. Contrast with progress updates which use `polite`.

#### R4.9.6 Focus Management

- On step change: focus moves to the new step's heading (`Typography` with `tabIndex={-1}` + `ref.focus()`)
- On dialog open: focus moves to the dialog title
- On dialog close: focus returns to the trigger button (tracked via `ref`)
- On error: focus moves to the `Alert` component

### R4.10 Performance

#### R4.10.1 Design Rationale

Templates with many elements (50+) or large background images (8MB+) can cause UI jank during import/export. Round 4 specifies chunked file reading, streaming upload, background blob processing, Web Worker for compression, and memory management.

#### R4.10.2 Chunked File Reading

Large JSON files are read in 10MB chunks using the `File.blob().slice()` API:

```typescript
// frontend/common/utils/chunkedFileReader.ts
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB

async function readInChunks(file: File, onChunk: (chunk: Uint8Array, progress: number) => void): Promise<void> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    const buffer = await chunk.arrayBuffer();
    onChunk(new Uint8Array(buffer), ((i + 1) / totalChunks) * 100);
  }
}
```

This avoids loading the entire file into memory at once. Each chunk is passed to the parser incrementally (for JSON, a streaming JSON parser like `oboe.js` or native `ReadableStream` + `TextDecoder`).

#### R4.10.3 Streaming Upload

For large ZIP exports, the Blob is uploaded in chunks via the Fetch API's streaming body:

```typescript
// frontend/stores/cert/templateExportStore.ts
async streamUpload(blob: Blob, url: string, onProgress: (p: number) => void): Promise<void> {
  const TOTAL = blob.size;
  let uploaded = 0;
  const reader = blob.stream().getReader();
  const stream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) { controller.close(); return; }
      uploaded += value.byteLength;
      onProgress((uploaded / TOTAL) * 100);
      controller.enqueue(value);
    },
  });
  await fetch(url, { method: 'POST', body: stream, duplex: 'half' });
}
```

#### R4.10.4 Background Blob Processing

Blob creation (for ZIP, PDF) is offloaded to a Web Worker to avoid blocking the main thread:

**File:** `frontend/workers/compressionWorker.ts`

```typescript
// Web Worker — receives template data, returns compressed Blob
self.onmessage = async (e: MessageEvent<CompressionRequest>) => {
  const { templates, options } = e.data;
  const zip = await createZip(templates, options);
  const blob = new Blob([zip], { type: 'application/zip' });
  (self as unknown as Worker).postMessage(blob);
};
```

The main thread creates the worker via:

```typescript
const worker = new Worker(new URL('@/frontend/workers/compressionWorker.ts', import.meta.url), { type: 'module' });
```

#### R4.10.5 Web Worker for Compression

Dedicated worker for ZIP compression using `fflate` (lighter than JSZip for worker context):

```typescript
// frontend/workers/compressionWorker.ts
import { zipSync } from 'fflate';

self.onmessage = (e: MessageEvent) => {
  const files: Record<string, Uint8Array> = e.data.files;
  const compressed = zipSync(files, { level: 6 });
  const blob = new Blob([compressed], { type: 'application/zip' });
  (self as unknown as Worker).postMessage({ blob, size: compressed.length });
  self.close();
};
```

#### R4.10.6 Memory Management

```typescript
// frontend/stores/cert/templateExportStore.ts
// After export completes or is cancelled:
cleanup: () => {
  if (this.downloadUrl) {
    URL.revokeObjectURL(this.downloadUrl);
    this.downloadUrl = null;
  }
  this.abortController = null;
  this.perFileProgress.clear();
  this.batchConfig = { ...defaultBatchConfig };
},
```

The `reset` action (from Round 2) is extended to call `cleanup` first, then reset all state. Memory pressure is monitored via `performance.memory` (Chrome) or manual tracking of Blob sizes.

For large template payloads (>5MB JSON), the store uses `structuredClone` for deep copies only when strictly necessary (before transformation hooks), and otherwise uses destructive updates to avoid double-memory usage.

### R4.11 Round 4 Store Interface Summary

#### R4.11.1 Export Store (Final Round 4 Interface)

```typescript
interface ExportState {
  // Round 2 base
  open: boolean;
  templateId: string;
  format: 'json' | 'zip' | 'pdf' | 'png' | 'svg';
  options: ExportOptions;

  // Round 4 additions
  exportStep: 'idle' | 'collecting' | 'compressing' | 'uploading' | 'finalizing' | 'done' | 'cancelled' | 'error';
  stepLabel: string;
  stepLabelArgs: Record<string, unknown>;
  perFileProgress: Map<string, number>;
  estimatedTimeRemaining: number | null;
  cancelRequested: boolean;
  abortController: AbortController | null;
  batchConfig: BatchExportConfig;
  selectedTemplateIds: string[];

  // Round 2 progress (kept)
  isExporting: boolean;
  progress: number;
  downloadUrl: string | null;
  fileSize: number | null;
  error: string | null;

  // Actions — Round 2
  setOpen: (open: boolean) => void;
  setTemplateId: (id: string) => void;
  setFormat: (format: ExportState['format']) => void;
  setOption: <K extends keyof ExportState['options']>(key: K, value: ExportState['options'][K]) => void;
  startExport: () => Promise<void>;
  cancelExport: () => void;
  reset: () => void;

  // Actions — Round 4
  setExportStep: (step: ExportState['exportStep']) => void;
  setStepLabel: (label: string, args?: Record<string, unknown>) => void;
  setPerFileProgress: (id: string, percent: number) => void;
  setEstimatedTimeRemaining: (seconds: number | null) => void;
  toggleTemplateSelection: (id: string) => void;
  selectAllVisible: (ids: string[]) => void;
  clearSelection: () => void;
  setBatchConfig: (config: Partial<BatchExportConfig>) => void;
  cleanup: () => void;
}
```

#### R4.11.2 Import Store (Final Round 4 Interface)

```typescript
interface ImportState {
  // Round 2 base
  open: boolean;
  file: File | null;
  importUrl: string;
  pastedJson: string;
  validationResults: ValidationResult[];
  conflicts: ConflictInfo[];
  resolution: 'overwrite' | 'rename' | 'skip';
  renamedTitle: string;
  isImporting: boolean;
  progress: number;
  importedTemplateId: string | null;
  error: string | null;

  // Round 4 additions
  importStep: 'idle' | 'validating' | 'scanning' | 'importing' | 'finalizing' | 'done' | 'cancelled' | 'error';
  stepLabel: string;
  stepLabelArgs: Record<string, unknown>;
  perFileProgress: Map<string, number>;
  estimatedTimeRemaining: number | null;
  cancelRequested: boolean;
  abortController: AbortController | null;
  rollbackSnapshot: TemplateSnapshot | null;
  batchImportEntries: BatchImportEntry[];
  mergeStrategy: 'merge' | 'replace' | 'append';
  templateDiff: TemplateDiff | null;

  // Actions — Round 2
  setOpen: (open: boolean) => void;
  setFile: (file: File) => void;
  setUrl: (url: string) => void;
  setPastedJson: (json: string) => void;
  startValidation: () => Promise<void>;
  setResolution: (resolution: ImportState['resolution']) => void;
  setRenamedTitle: (title: string) => void;
  startImport: () => Promise<void>;
  reset: () => void;

  // Actions — Round 4
  setImportStep: (step: ImportState['importStep']) => void;
  setStepLabel: (label: string, args?: Record<string, unknown>) => void;
  setPerFileProgress: (id: string, percent: number) => void;
  setEstimatedTimeRemaining: (seconds: number | null) => void;
  retryFailedFile: (fileId: string) => Promise<void>;
  skipFailedAndContinue: () => void;
  setMergeStrategy: (strategy: ImportState['mergeStrategy']) => void;
  setTemplateDiff: (diff: TemplateDiff | null) => void;
  rollbackImport: () => Promise<void>;
  cleanup: () => void;
}
```

---

### R4.12 Round 4 File Inventory

| # | File | Layer | Action |
|---|------|-------|--------|
| 1 | `shared/constants/cert/templateValidation.ts` | Shared | New |
| 2 | `shared/constants/cert/compatibilityMatrix.ts` | Shared | New |
| 3 | `shared/locale/cert/importExport.ts` | Shared | Update (step labels) |
| 4 | `backend/graphql/pothos/types/virusScan.ts` | Backend GraphQL | New |
| 5 | `backend/services/certificate/virusScanService.ts` | Backend Service | New |
| 6 | `backend/services/cert/importHooks.ts` | Backend Service | New |
| 7 | `backend/services/cert/migrations/index.ts` | Backend Service | New |
| 8 | `backend/db/schema/templateChangelog.ts` | Backend Schema | New |
| 9 | `frontend/stores/cert/templateExportStore.ts` | Frontend Store | Update (R4 fields) |
| 10 | `frontend/stores/cert/templateImportStore.ts` | Frontend Store | Update (R4 fields) |
| 11 | `frontend/views/dashboard/cert/templates/import/ValidationResultList.tsx` | Frontend View | New |
| 12 | `frontend/views/dashboard/cert/templates/shared/ProgressTracker.tsx` | Frontend View | New |
| 13 | `frontend/views/dashboard/cert/templates/shared/ErrorLogDownloadButton.tsx` | Frontend View | New |
| 14 | `frontend/views/dashboard/cert/templates/import/TemplateDiffViewer.tsx` | Frontend View | New |
| 15 | `frontend/views/dashboard/cert/templates/export/BatchExportDialog.tsx` | Frontend View | New |
| 16 | `frontend/common/utils/chunkedFileReader.ts` | Frontend Utils | New |
| 17 | `frontend/workers/compressionWorker.ts` | Frontend Worker | New |
| 18 | `app/api/cert/templates/import/route.ts` | App Router | New |
| 19 | `app/[locale]/cert/templates/shared/[token]/page.tsx` | App Router | New |
