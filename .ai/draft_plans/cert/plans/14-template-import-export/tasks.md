# Plan 14: Template Import/Export — Implementation Tasks

## Document Information

| Field | Value |
|-------|-------|
| **Feature Name** | Certificate Template Import/Export |
| **Plan Number** | 14 |
| **Depends On** | Plan 05 (GraphQL API), Plan 07 (Storage) |
| **Parallel With** | Plan 10 (Template Editor), Plan 13 (Variables) |

> **Execution Model**: Parallel subagents per independent task group (see dependency graph for parallelization points)
>
> **Execution order**: 1.1 → 1.2 → (1.3, 1.5 via parallel subagents) → 1.4 → (2.1, 2.2, 2.8, 2.11 via parallel subagents) → (2.3, 2.13, 2.14, 2.21 via parallel subagents) → (2.4, 2.5, 2.22, 2.23 via parallel subagents) → (2.6, 2.9, 2.10, 2.15, 2.18, 2.19 via parallel subagents) → (2.7, 2.12, 2.16, 2.17, 2.20 via parallel subagents) → (2.24, 2.25, 3.1, 3.2, 3.3 via parallel subagents) → (2.26, 3.4 via parallel subagents) → 3.5 → (R4-T1, R4-T2, R4-T3 via parallel subagents) → R4-T11 → (3.6, 2.27, R4-T12 via parallel subagents — knowledge propagation)

---

## 1. Task Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Backend Core (Sequential)                                  │
├─────────────────────────────────────────────────────────────────────┤
│ 1.1  → 1.2  → 1.3  → 1.4  → 1.5                                    │
│ Export   Import   Batch    GraphQL    Audit    │                    │
│ Service  Service  Import   Mutations  Logging  │                    │
│          Service   Service  (export/import)    │                    │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Frontend Core (Parallel with Phase 1.3+)                   │
├─────────────────────────────────────────────────────────────────────┤
│ 2.1  2.2  2.3  2.4  2.5  2.6  2.7                                  │
│ State  File   Import   Export   Preview  Batch    Mobile           │
│ Store  Utils  Actions  Actions  Modal    Import   Adaptation       │
│                                                │                    │
│ 2.8  2.9  2.10 2.11 2.12                      │                    │
│ TypeScript  Role     Error   i18n      E2E   │                    │
│ Types    Matrix   Handling  Keys     Tests  │                    │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Integration & Quality (Sequential after 2.x)               │
├─────────────────────────────────────────────────────────────────────┤
│ 3.1  → 3.2  → 3.3  → 3.4  → 3.5                                    │
│ Unit   E2E   Access    Perf    Quality   Docs                      │
│ Tests  Tests ibility  Tests  Gate      + AGENTS.md                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Parallel Subagent Strategy

Tasks grouped by wave (each wave runs as parallel subagents):

### Wave 1: 1.1
- Tasks: 1.1 (Template Export Service)
- Rationale: Starting task — no within-plan dependencies. Must complete before downstream backend tasks.

### Wave 2: 1.2
- Tasks: 1.2 (Template Import Service)
- Rationale: Depends on 1.1 (export interface contract). Single dependency — sequential after Wave 1.

### Wave 3: 1.3, 1.5
- Tasks: 1.3 (Batch Import Service), 1.5 (Audit Logging)
- Rationale: 1.3 depends on 1.2; 1.5 depends on 1.1 and 1.2 — both satisfied after Wave 2. No interdependency between them.

### Wave 4: 1.4
- Tasks: 1.4 (GraphQL Export/Import Mutations)
- Rationale: Depends on 1.1, 1.2, 1.3 — all complete after Wave 3. Single task consolidating backend services into GraphQL layer.

### Wave 5: 2.1, 2.2, 2.8, 2.11
- Tasks: 2.1 (ImportExport Zustand Store), 2.2 (File Handling Utilities), 2.8 (TypeScript Type Definitions), 2.11 (i18n Keys Implementation)
- Rationale: All depend on Plan 05/GraphQL (external) or 1.4 (complete after Wave 4). No interdependencies among them — fully independent frontend foundation tasks.

### Wave 6: 2.3, 2.13, 2.14, 2.21
- Tasks: 2.3 (Client-Side Validation), 2.13 (Export Zustand Store), 2.14 (Import Zustand Store), 2.21 (FileDropZone Component)
- Rationale: 2.3 depends on 2.2; 2.13 and 2.14 depend on 1.4; 2.21 has no within-plan deps. All dependencies satisfied after Wave 5. No interdependencies among them.

### Wave 7: 2.4, 2.5, 2.22, 2.23
- Tasks: 2.4 (Export Actions), 2.5 (Import Actions & Preview), 2.22 (ConflictResolutionCard), 2.23 (File Validation Service)
- Rationale: 2.4 depends on 1.4 and 2.1; 2.5 depends on 1.4, 2.1, 2.3; 2.22 depends on 2.14; 2.23 depends on 2.3 — all complete after Wave 6. No interdependencies among them.

### Wave 8: 2.6, 2.9, 2.10, 2.15, 2.18, 2.19
- Tasks: 2.6 (Batch Results Summary), 2.9 (Role-Based Access Matrix), 2.10 (Error Handling), 2.15 (Export Step 1 — Format), 2.18 (Import Step 1 — Upload), 2.19 (Import Step 2 — Validation)
- Rationale: 2.6 depends on 2.5; 2.9 depends on 2.4 and 2.5; 2.10 depends on 2.5; 2.15 depends on 2.13; 2.18 depends on 2.14 and 2.21; 2.19 depends on 2.14 and 2.23 — all complete after Wave 7. No interdependencies among them.

### Wave 9: 2.7, 2.12, 2.16, 2.17, 2.20
- Tasks: 2.7 (Mobile/Desktop Adaptation), 2.12 (E2E Tests), 2.16 (Export Step 2 — Options), 2.17 (Export Step 3 — Progress), 2.20 (Import Steps 3+4 — Preview & Import)
- Rationale: 2.7 depends on 2.4, 2.5, 2.6; 2.12 depends on 2.4–2.7; 2.16 depends on 2.13 and 2.15; 2.17 depends on 2.13 and 2.15; 2.20 depends on 2.14, 2.22, 2.23 — all complete after Wave 8. No interdependencies among them.

### Wave 10: 2.24, 2.25, 3.1, 3.2, 3.3
- Tasks: 2.24 (Enhanced Component Tests), 2.25 (Enhanced E2E Tests), 3.1 (Backend Unit Tests), 3.2 (Frontend Unit Tests), 3.3 (Accessibility Audit)
- Rationale: 2.24 depends on all 2.13–2.23; 2.25 depends on 2.15–2.20; 3.1 depends on 1.1–1.3; 3.2 depends on 2.1–2.6; 3.3 depends on 2.5 and 2.6 — all complete after Wave 9. Test tasks are independent of each other (different test suites).

### Wave 11: 2.26, 3.4
- Tasks: 2.26 (Quality Loop Per File — Enhanced UI), 3.4 (Performance Tests)
- Rationale: 2.26 depends on all 2.13–2.25; 3.4 depends on 3.2 — both complete after Wave 10. No interdependency between them.

### Wave 12: 3.5
- Tasks: 3.5 (Quality Gate)
- Rationale: Depends on all above tasks. Must run alone — coordinates full quality-gate pipeline.

### Wave 13: R4-T1, R4-T2, R4-T3
- Tasks: R4-T1 (File Validation), R4-T2 (Progress Indicators), R4-T3 (Error Recovery System — includes TemplateDiff, BatchExport, Import Hooks, ExportFormats, Version Service, ExportWizard A11y, File Processing Utils as sub-items)
- Rationale: Round 4 enhancement tasks — each creates/modifies distinct files with no interdependencies. All build on patterns established by prior waves.

### Wave 14: R4-T11
- Tasks: R4-T11 (Component Tests for Round 4)
- Rationale: Depends on R4-T1–R4-T3. Tests the components created in Wave 13.

### Final Wave: Knowledge Propagation
- Tasks: 3.6 (Documentation & Knowledge Propagation), 2.27 (Knowledge Propagation — Enhanced UI), R4-T12 (Knowledge Propagation — Round 4)
- Rationale: Must run after all other tasks complete. Each documents a different phase (Phase 3, Enhanced UI, Round 4) — no interdependencies among them.

> **Subagent dispatch**: Each task in a wave is dispatched as a separate subagent. The orchestrator waits for all subagents in a wave to complete before starting the next wave.

---

## 2. Backend Tasks (Phase 1)

### TASK 1.1: Template Export Service
**Files to create/modify:**
- `backend/services/certificates/templateExport.service.ts` (new)
- `backend/services/certificates/template.service.ts` (add export methods)

**Requirements references:** REQ-EXP-001, REQ-EXP-002, REQ-EXP-003, REQ-EXP-004, REQ-EXP-005, REQ-EXP-007

**Subtasks:**
- [ ] Create `exportTemplate(templateId: string, userId: string)` returning `ExportedTemplate` interface
- [ ] Fetch template + elements + variables via repository (use DataLoader for efficiency)
- [ ] Handle background images: base64 encode for single export, extract file paths for batch
- [ ] Add metadata: `version: "1.0"`, `exportedAt: ISO8601`, `exportedBy: userId`
- [ ] Ensure all enum values match INTER_PLAN_CONTRACTS.md §4 canonical values
- [ ] Fire audit event `CERTIFICATE_TEMPLATE_EXPORTED` with templateId, userId, exportType
- [ ] Handle template not found → return typed error (use `tErrors` from `shared/locale`)

**Quality checks:**
- [ ] Unit test: `backend/db/test/services/templateExport.test.ts` (3+ test cases)
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts backend/services/certificates/templateExport.service.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts backend/services/certificates/template.service.ts --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `backend/services/AGENTS.md` — namespace export pattern
- [ ] Read `backend/types/AGENTS.md` — return type conventions
- [ ] Read `shared/AGENTS.md` — i18n for server-side errors

---

### TASK 1.2: Template Import Service (Single)
**Files to create/modify:**
- `backend/services/certificates/templateImport.service.ts` (new)

**Requirements references:** REQ-IMP-001, REQ-IMP-002, REQ-IMP-003, REQ-IMP-004, REQ-IMP-007

**Subtasks:**
- [ ] Create `importTemplate(input: ImportTemplateInput, userId: string)` returning imported template
- [ ] Implement validation pipeline (schema → structural → referential → business → security)
- [ ] Schema validation: Zod schema matching `ExportedTemplate` interface
- [ ] Structural: UUID format, enum validation against canonical values
- [ ] Referential: categoryId existence (if provided) → query category repo
- [ ] Business: element positions within canvas bounds, unique variable names, no duplicate IDs
- [ ] Security: file size check, no executable content in properties
- [ ] UUID regeneration: generate new UUID for template, all elements, all variables
- [ ] Background image: if base64 in `backgroundValue` → upload via Plan 07 `uploadFile` → store fileId
- [ ] Transaction boundary: all inserts in single `tx` (repository methods accept tx)
- [ ] Return: new template + warnings array (auto-renames, clamped elements, missing category)
- [ ] Fire audit event `CERTIFICATE_TEMPLATE_IMPORTED` with templateId, userId, sourceFileName

**Quality checks:**
- [ ] Unit test: `backend/db/test/services/templateImport.test.ts` (5+ test cases: valid, invalid schema, duplicate UUID, missing category, large image)
- [ ] Run per-file quality loop (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts backend/services/certificates/templateImport.service.ts --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `backend/services/AGENTS.md` — namespace export, error handling
- [ ] Read `backend/db/repo/AGENTS.md` — tx propagation, prepared statements
- [ ] Read `shared/AGENTS.md` — server-side i18n (`getServerTranslations`)

---

### TASK 1.3: Batch Import Service

> **Parallelizable**: This task runs as a subagent in Wave 3 alongside 1.5.

**Files to create/modify:**
- `backend/services/certificates/templateBatchImport.service.ts` (new)

**Requirements references:** REQ-IMP-005, REQ-IMP-007

**Subtasks:**
- [ ] Create `batchImportTemplates(items: TemplateImportItem[], userId: string)` returning batch result
- [ ] Process each item independently (catch per-item errors, continue)
- [ ] Reuse `importTemplate` logic from Task 1.2 (factor out shared validation)
- [ ] Aggregate results: `imported[]`, `skipped[]`, `errors[]`, `summary`
- [ ] Per-item result includes: `templateId` (if imported), `title`, `warnings`, `error` (if failed)
- [ ] Fire single batch audit event `CERTIFICATE_TEMPLATE_BATCH_IMPORTED` with counts
- [ ] Idempotency: accept `idempotencyKey` to prevent duplicate batch on retry

**Quality checks:**
- [ ] Unit test: `backend/db/test/services/templateBatchImport.test.ts` (3+ test cases)
- [ ] Run per-file quality loop (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts backend/services/certificates/templateBatchImport.service.ts --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `backend/services/AGENTS.md` — batch pattern
- [ ] Read `INTER_PLAN_CONTRACTS.md` §10 — batch generation pattern (adapt)

---

### TASK 1.4: GraphQL Export/Import Mutations
**Files to create/modify:**
- `backend/graphql/pothos/certificates/templateExport.resolver.ts` (new)
- `backend/graphql/pothos/certificates/templateImport.resolver.ts` (new)
- `backend/graphql/pothos/certificates/templateBatchImport.resolver.ts` (new)
- `backend/graphql/pothos/certificates/certificates.types.ts` (add output/input types)
- `frontend/common/graphql/sharedDocuments/certificates.importExport.documents.ts` (new)

**Requirements references:** REQ-EXP-001, REQ-IMP-001, REQ-IMP-005

**Subtasks:**
- [ ] Define Pothos types:
  - `ExportTemplateOutput` (template + metadata)
  - `ImportTemplateInput` (jsonContent: String!, idempotencyKey: String)
  - `ImportTemplateOutput` (template, warnings[])
  - `BatchImportTemplatesInput` (templates: [TemplateImportItem!]!, idempotencyKey: String)
  - `BatchImportTemplatesOutput` (imported[], skipped[], errors[], summary)
  - `ImportWarning`, `ImportError` with codes matching §3.4
- [ ] Export query: `exportTemplate(id: ID!)` → calls export service
- [ ] Import mutation: `importTemplate(input: ImportTemplateInput!)` → calls import service
- [ ] Batch import mutation: `batchImportTemplates(input: BatchImportTemplatesInput!)` → calls batch service
- [ ] Permission guards: `certificates.templates.view` for export, `certificates.templates.manage` for import
- [ ] Generate GraphQL schema: `bun run generate:gqlSchema`
- [ ] Generate TypeScript types: `bun codegen`
- [ ] Add Apollo hooks to frontend documents file

**Quality checks:**
- [ ] GraphQL integration test: `frontend/common/graphql/test/importExport.test.ts`
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts backend/graphql/pothos/certificates/templateExport.resolver.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts backend/graphql/pothos/certificates/templateImport.resolver.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts backend/graphql/pothos/certificates/templateBatchImport.resolver.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts backend/graphql/pothos/certificates/certificates.types.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/graphql/sharedDocuments/certificates.importExport.documents.ts --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `backend/graphql/AGENTS.md` — Pothos conventions, auth scopes
- [ ] Read `frontend/common/graphql/AGENTS.md` — document conventions, hook import from `@apollo/client/react`
- [ ] Read `INTER_PLAN_CONTRACTS.md` §5, §7 — service names, operation names

---

### TASK 1.5: Audit Logging

> **Parallelizable**: This task runs as a subagent in Wave 3 alongside 1.3.

**Files to create/modify:**
- `backend/services/certificates/audit.service.ts` (extend if exists)
- `backend/db/schema/auditLog.ts` (if new event types needed)

**Requirements references:** REQ-EXP-007, REQ-IMP-007

**Subtasks:**
- [ ] Add event types: `CERTIFICATE_TEMPLATE_EXPORTED`, `CERTIFICATE_TEMPLATE_IMPORTED`, `CERTIFICATE_TEMPLATE_BATCH_IMPORTED`
- [ ] Audit payload: userId, templateIds[], exportType/importType, sourceFileName, timestamp, counts
- [ ] Ensure audit writes use same transaction as import (Plan 04 pattern)
- [ ] Reference Plan 04 for audit service patterns

**Quality checks:**
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts backend/services/certificates/audit.service.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts backend/db/schema/auditLog.ts --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `backend/services/AGENTS.md` — audit patterns

---

## 3. Frontend Tasks (Phase 2)

### TASK 2.1: ImportExport Zustand Store

> **Parallelizable**: This task runs as a subagent in Wave 5 alongside 2.2, 2.8, 2.11.

**Files to create/modify:**
- `frontend/common/stores/importExportStore.ts` (new)

**Requirements references:** REQ-UX-004, design §3.6, §9

**Subtasks:**
- [ ] Define state machine types: `'idle' | 'fileSelected' | 'validating' | 'preview' | 'importing' | 'success' | 'error'`
- [ ] State fields: `importState`, `selectedFile` (File, non-persisted), `importType`, `preview`, `warnings`, `errors`, `previewModalOpen`, `confirmDialogOpen`, `importProgress`
- [ ] Actions: `resetImport()`, `setFile(file)`, `startValidation()`, `setPreview(data)`, `startImport()`, `markSuccess(templateId)`, `markError(error)`
- [ ] `partialize` excludes `selectedFile` (non-serializable)
- [ ] Export store for `useImportExportStore` hook
- [ ] Storybook story for store state transitions

**Quality checks:**
- [ ] Unit test: `test/ui/components/certificates/importExport/ImportStateMachine.spec.ts` (all states + invalid transitions)
- [ ] Run per-file quality loop (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/common/stores/importExportStore.ts --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `frontend/common/stores/AGENTS.md` — serialization safety, persist options
- [ ] Read `frontend/mobile/AGENTS.md` — tier-specific state if needed
- [ ] Read `INTER_PLAN_CONTRACTS.md` — no cross-tier state

---

### TASK 2.2: File Handling Utilities

> **Parallelizable**: This task runs as a subagent in Wave 5 alongside 2.1, 2.8, 2.11.

**Files to create/modify:**
- `frontend/common/views/dashboard/certificates/importExport/utils/fileReader.ts` (new)
- `frontend/common/views/dashboard/certificates/importExport/utils/downloadHelpers.ts` (new)
- `frontend/common/views/dashboard/certificates/importExport/utils/formatDetect.ts` (new)
- `frontend/common/views/dashboard/certificates/importExport/utils/idGenerator.ts` (new)

**Requirements references:** REQ-EXP-006, REQ-IMP-002, REQ-IMP-005

**Subtasks:**
- [ ] `readFileAsText(file: File): Promise<string>` — with size limit check
- [ ] `detectFormat(file: File): 'json' | 'zip' | 'unknown'` — MIME + magic bytes
- [ ] `parseJsonSafely(text: string): ParseResult` — try/catch, return success/error with line info
- [ ] `triggerDownload(fileName: string, blob: Blob): void` — blob URL + anchor click
- [ ] `generateExportBlob(template: ExportedTemplate): Blob` — JSON.stringify + blob
- [ ] `generateBatchZipBlob(templates: ExportedTemplate[]): Promise<Blob>` — using `libzip`
- [ ] `regenerateIds(data: ExportedTemplate): ExportedTemplate` — deep clone + new UUIDs
- [ ] `extractImagesFromZip(zipBlob: Blob): Map<string, Blob>` — for batch import

**Quality checks:**
- [ ] Unit test: `test/ui/components/certificates/importExport/ExportFileFormat.spec.ts` (valid JSON, ZIP, corrupt)
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/importExport/utils/fileReader.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/importExport/utils/downloadHelpers.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/importExport/utils/formatDetect.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/importExport/utils/idGenerator.ts --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `frontend/common/views/AGENTS.md` — utils location
- [ ] Read `frontend/AGENTS.md` — no console.log, use logger

---

### TASK 2.3: Import Validation (Client-Side)

> **Parallelizable**: This task runs as a subagent in Wave 6 alongside 2.13, 2.14, 2.21.

**Files to create/modify:**
- `frontend/common/views/dashboard/certificates/importExport/schemas/importSchema.ts` (new)
- `frontend/common/views/dashboard/certificates/importExport/shared/ImportValidationBadge.tsx` (new)

**Requirements references:** REQ-IMP-002, REQ-IMP-006

**Subtasks:**
- [ ] Zod schema matching `ExportedTemplate` interface (exportSchema.ts for reference)
- [ ] Validation function: `validateImportContent(json: string): ValidationResult`
  - Returns: `{ valid: boolean, data?: ExportedTemplate, warnings: ImportWarning[], errors: ImportError[] }`
- [ ] Warning codes: `MISSING_CATEGORY`, `LARGE_IMAGE`, `DEPRECATED_PROPERTY`, `DUPLICATE_NAME_RENAMED`, `ELEMENT_CLAMPED_TO_BOUNDS`
- [ ] Error codes: `INVALID_JSON`, `SCHEMA_MISMATCH`, `MISSING_REQUIRED_FIELD`, `INVALID_UUID`, `INVALID_ENUM_VALUE`
- [ ] Batch validation: map over each template in ZIP, aggregate results
- [ ] Component: `ImportValidationBadge` showing pass/fail + warning count + expandable details

**Quality checks:**
- [ ] Unit test: `test/ui/components/certificates/importExport/ImportFormatDetect.test.tsx` (format detection, validation edge cases)
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/importExport/schemas/importSchema.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/importExport/shared/ImportValidationBadge.tsx --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `frontend/common/components/ui/AGENTS.md` — component patterns
- [ ] Read `INTER_PLAN_CONTRACTS.md` §4 — enum values for validation

---

### TASK 2.4: Export Actions (Template List & Editor)

> **Parallelizable**: This task runs as a subagent in Wave 7 alongside 2.5, 2.22, 2.23.

**Files to create/modify:**
- `frontend/desktop/views/dashboard/certificates/importExport/TemplateExportDesktop.tsx` (new)
- `frontend/mobile/views/dashboard/certificates/importExport/TemplateExportMobileCard.tsx` (new)
- `frontend/common/views/dashboard/certificates/importExport/shared/ExportFormatSelector.tsx` (new)
- `frontend/common/views/dashboard/certificates/importExport/components/ExportDownloadLink.desktop.tsx` (new)

**Requirements references:** REQ-UX-001, REQ-UX-002, REQ-UX-004, REQ-EXP-001, REQ-EXP-006

**Subtasks:**
- [ ] Desktop: Dropdown button in PageHeader/SectionPanel with "Export Current", "Export Selected (ZIP)"
- [ ] Mobile: FAB or bottom sheet action with same options
- [ ] Single export: call `exportTemplate` query → trigger download
- [ ] Batch export: collect selected templateIds → call `exportBatch` → create ZIP client-side → trigger download
- [ ] Loading state: `ExportButton` with spinner while query runs
- [ ] Use `ExportButton` preset from COMPONENT_PATTERNS.md
- [ ] Wrap in `RequirePermission` with `certificates.templates.view`
- [ ] `ExportFormatSelector` component: radio for "JSON (single)" vs "ZIP (batch)"

**Quality checks:**
- [ ] Component test: `test/ui/components/certificates/importExport/TemplateExportActions.test.tsx` (export triggers, permissions, loading)
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/importExport/TemplateExportDesktop.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/importExport/TemplateExportMobileCard.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/importExport/shared/ExportFormatSelector.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/importExport/components/ExportDownloadLink.desktop.tsx --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `frontend/desktop/AGENTS.md` — tier-paired `.desktop.tsx` only
- [ ] Read `frontend/mobile/AGENTS.md` — Mobile* primitives (viewport-gated null return)
- [ ] Read `frontend/common/views/AGENTS.md` — switcher pattern
- [ ] Read `frontend/views/AGENTS.md` — RequirePermission wrapper

---

### TASK 2.5: Import Actions & Preview Modal

> **Parallelizable**: This task runs as a subagent in Wave 7 alongside 2.4, 2.22, 2.23.

**Files to create/modify:**
- `frontend/desktop/views/dashboard/certificates/importExport/TemplateImportDesktop.tsx` (new)
- `frontend/mobile/views/dashboard/certificates/importExport/TemplateImportMobileCard.tsx` (new)
- `frontend/desktop/views/dashboard/certificates/importExport/ImportPreviewModal.desktop.tsx` (new)
- `frontend/mobile/views/dashboard/certificates/importExport/ImportPreviewMobileFullscreen.tsx` (new)
- `frontend/common/views/dashboard/certificates/importExport/shared/ImportProgressIndicator.tsx` (new)

**Requirements references:** REQ-UX-001, REQ-UX-002, REQ-UX-004, REQ-IMP-001, REQ-IMP-006

**Subtasks:**
- [ ] Import trigger: `ImportButton` with file input (accept `.json,.zip`)
- [ ] File select → store in Zustand → run validation → show preview
- [ ] Preview modal (desktop): sheet format (400px width), shows:
  - Template title, category, dimensions, element/variable counts
  - Warnings list (expandable, yellow icons)
  - Errors list (expandable, red icons) — if any, disable "Import" button
  - "Import" button (primary) / "Cancel"
- [ ] Preview modal (mobile): full-screen, same content, bottom sheet animation
- [ ] Import action: call `importTemplate` / `batchImportTemplates` mutation
- [ ] Progress indicator: indeterminate during mutation, determinate for batch (current/total)
- [ ] Success: toast with i18n key, redirect to template editor (`/certificates/templates/[id]`)
- [ ] Error: toast with retry action (returns to preview state)
- [ ] Wrap import trigger in `RequirePermission` with `certificates.templates.manage`

**Quality checks:**
- [ ] Component test: `test/ui/components/certificates/importExport/ImportPreviewModal.test.tsx` (render warnings/errors, import button state, a11y)
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/importExport/TemplateImportDesktop.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/importExport/TemplateImportMobileCard.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/importExport/ImportPreviewModal.desktop.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/importExport/ImportPreviewMobileFullscreen.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/importExport/shared/ImportProgressIndicator.tsx --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `frontend/common/components/ui/AGENTS.md` — modal patterns, MUI v9 sx props
- [ ] Read `frontend/mobile/AGENTS.md` — full-screen modal, bottom sheet
- [ ] Read `frontend/AGENTS.md` — React 19 SubmitEvent, no console

---

### TASK 2.6: Batch Import Results Summary

> **Parallelizable**: This task runs as a subagent in Wave 8 alongside 2.9, 2.10, 2.15, 2.18, 2.19.

**Files to create/modify:**
- `frontend/desktop/views/dashboard/certificates/importExport/ImportResultsSummary.desktop.tsx` (new)
- `frontend/mobile/views/dashboard/certificates/importExport/ImportResultsMobileBottomSheet.tsx` (new)
- `frontend/common/views/dashboard/certificates/importExport/shared/ImportResultCard.tsx` (new)

**Requirements references:** REQ-IMP-005, REQ-IMP-007

**Subtasks:**
- [ ] Desktop: Dialog/sheet showing summary cards:
  - Header: "Batch Import Complete" + counts (imported/skipped/errors)
  - List: each template result with status icon, title, warnings, error message
  - "Open Template" link for imported items
  - "Close" button
- [ ] Mobile: Bottom sheet with same content, scrollable list
- [ ] `ImportResultCard` component: status badge (success/warning/error), title, details expand
- [ ] Link to template editor for successful imports
- [ ] Dismiss on close, auto-close after 10s (optional)

**Quality checks:**
- [ ] Component test: `test/ui/components/certificates/importExport/ImportResultsSummary.test.tsx`
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/importExport/ImportResultsSummary.desktop.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/importExport/ImportResultsMobileBottomSheet.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/importExport/shared/ImportResultCard.tsx --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `frontend/COMPONENT_PATTERNS.md` — StatusBadge usage
- [ ] Read `frontend/mobile/AGENTS.md` — bottom sheet pattern

---

### TASK 2.7: Mobile/Desktop Adaptation

> **Parallelizable**: This task runs as a subagent in Wave 9 alongside 2.12, 2.16, 2.17, 2.20.

**Files to create/modify:**
- `frontend/common/views/dashboard/certificates/importExport/ImportExportView.tsx` (switcher)
- `frontend/common/views/dashboard/certificates/importExport/ImportExportContainer.tsx`
- `frontend/common/views/dashboard/certificates/importExport/useImportExportViewModel.ts`
- Mobile/desktop tier files (from Tasks 2.4, 2.5, 2.6)

**Requirements references:** REQ-UX-004

**Subtasks:**
- [ ] ViewModel hook: dispatches Apollo queries/mutations, manages import state
- [ ] Container: calls ViewModel, passes to switcher
- [ ] Switcher: `ResponsiveViewSwitch` with lazy imports for mobile/desktop
- [ ] Mobile: FAB for import, bottom sheet for preview/results
- [ ] Desktop: header actions, sheet modals
- [ ] Verify no `useMediaQuery` or `useViewport` in tier files
- [ ] Verify no cross-imports between mobile/desktop
- [ ] Shared state via Zustand (survives tier switch on resize)

**Quality checks:**
- [ ] Static test: `bun run test:ui:static` (mobile-desktop isolation)
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/importExport/ImportExportView.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/importExport/ImportExportContainer.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/importExport/useImportExportViewModel.ts --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `.agents/instructions/mobile-desktop.instructions.md` — full switcher pattern
- [ ] Read `frontend/common/views/AGENTS.md` — ViewModel pattern, switcher
- [ ] Read `frontend/desktop/AGENTS.md` + `frontend/mobile/AGENTS.md` — tier isolation rules

---

### TASK 2.8: TypeScript Type Definitions

> **Parallelizable**: This task runs as a subagent in Wave 5 alongside 2.1, 2.2, 2.11.

**Files to create/modify:**
- `frontend/common/views/dashboard/certificates/importExport/types/index.ts` (new)

**Requirements references:** All

**Subtasks:**
- [ ] Define all shared types: `ExportedTemplate`, `ExportedElement`, `ExportedVariable`, `ImportTemplateInput`, `ImportPreview`, `ImportWarning`, `ImportError`, `BatchImportResult`
- [ ] Export types for both client and server (avoid duplication)
- [ ] Zod schema types inferred for validation
- [ ] Ensure types match GraphQL generated types (post-codegen)

**Quality checks:**
- [ ] Run per-file quality loop (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/importExport/types/index.ts --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `backend/types/AGENTS.md` — canonical type patterns
- [ ] Read `INTER_PLAN_CONTRACTS.md` §4 — enum values

---

### TASK 2.9: Role-Based Access Matrix Implementation

> **Parallelizable**: This task runs as a subagent in Wave 8 alongside 2.6, 2.10, 2.15, 2.18, 2.19.

**Files to create/modify:**
- Template List page (Plan 08 integration) — add actions
- Template Editor page (Plan 10/11/12 integration) — add actions

**Requirements references:** REQ-UX-003

**Subtasks:**
- [ ] Template List (Plan 08): PageHeader actions — Import button (`certificates.templates.manage`), Export button (`certificates.templates.view`)
- [ ] Bulk action bar (when selection > 0): "Export Selected" button (`certificates.templates.view`)
- [ ] Template Editor (Plan 10/11/12): Header actions — Export, Import (replace with confirm)
- [ ] Use `RequirePermission` wrapper for each action
- [ ] Test: verify UI hidden for Content Creator, Reviewer, Student, Parent, Teacher

**Quality checks:**
- [ ] E2E test: role-based visibility (see Task 3.4)
- [ ] Run per-file quality loop for each file modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/importExport/TemplateExportDesktop.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/importExport/TemplateImportDesktop.tsx --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `INTER_PLAN_CONTRACTS.md` §1 — permission keys
- [ ] Read `frontend/views/AGENTS.md` — RequirePermission pattern

---

### TASK 2.10: Error Handling & User Feedback

> **Parallelizable**: This task runs as a subagent in Wave 8 alongside 2.6, 2.9, 2.15, 2.18, 2.19.

**Files to create/modify:**
- `frontend/common/views/dashboard/certificates/importExport/utils/errorHandling.ts` (new)
- Toast notifications integration (existing pattern)

**Requirements references:** REQ-NFR-004

**Subtasks:**
- [ ] Map server error codes to i18n keys (from requirements §2.6)
- [ ] Network error: toast with retry button (calls mutation again)
- [ ] Validation errors: inline in preview modal, specific field paths
- [ ] File errors: in file picker area, clear on new file select
- [ ] Batch partial failure: results summary shows each error
- [ ] Server error: correlation ID in toast for support
- [ ] Use `logger.error` from `@/frontend/utils/logger` for client-side logging

**Quality checks:**
- [ ] Run per-file quality loop (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/importExport/utils/errorHandling.ts --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `frontend/AGENTS.md` — logging rules, React 19 events
- [ ] Read `frontend/common/components/ui/AGENTS.md` — toast patterns

---

### TASK 2.11: i18n Keys Implementation

> **Parallelizable**: This task runs as a subagent in Wave 5 alongside 2.1, 2.2, 2.8.

**Files to create/modify:**
- `shared/locale/certificates/templates/importExport.en.ts` (new)
- `shared/locale/certificates/templates/importExport.ar.ts` (new)
- `shared/locale/certificates/templates/index.ts` (register namespace)

**Requirements references:** §2.6 (all keys)

**Subtasks:**
- [ ] Implement all EN keys from requirements §2.6 table
- [ ] Implement all AR keys with proper Arabic translations
- [ ] Implement plural functions for count-based keys (zero/one/two/few/many/other)
- [ ] Implement interpolation functions for parameterized keys
- [ ] Register namespace in index.ts
- [ ] Use `useAppTranslation('certificates.templates.importExport')` in components

**Quality checks:**
- [ ] i18n test: verify English + Arabic render in Storybook
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts shared/locale/certificates/templates/importExport.en.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts shared/locale/certificates/templates/importExport.ar.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts shared/locale/certificates/templates/index.ts --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `shared/AGENTS.md` — compile-time i18n system
- [ ] Read `shared/locale/AGENTS.md` — namespace structure, plural/interpolation

---

### TASK 2.12: E2E Tests (Playwright)

> **Parallelizable**: This task runs as a subagent in Wave 9 alongside 2.7, 2.16, 2.17, 2.20.

**Files to create/modify:**
- `test/ui/e2e/importExport/importExport-flow.spec.ts` (new)
- `test/ui/e2e/importExport/importExport-batch.spec.ts` (new)

**Requirements references:** REQ-NFR-003, all AC

**Subtasks:**
- [ ] Single import flow: select file → preview → import → verify redirect to editor
- [ ] Single export flow: click export → verify download → verify file content
- [ ] Batch export: select 3 templates → export → verify ZIP contains 3 JSON + manifest
- [ ] Batch import: upload ZIP → preview → import → verify results summary
- [ ] Role test: login as Content Creator → verify import hidden, export visible
- [ ] Mobile viewport: test import/export on 375px width
- [ ] Error cases: corrupt JSON, oversized file, invalid enum

**Quality checks:**
- [ ] `bun run build:test` first (required for E2E)
- [ ] `bun run test:ui:e2e` passes
- [ ] Screenshots for visual regression (if configured)
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts test/ui/e2e/importExport/importExport-flow.spec.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts test/ui/e2e/importExport/importExport-batch.spec.ts --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `test/ui/AGENTS.md` — E2E test patterns
- [ ] Read `test/ui/e2e/` existing tests for patterns

---

## 4. Integration & Quality Tasks (Phase 3)

### TASK 3.1: Unit Tests (Backend)

> **Parallelizable**: This task runs as a subagent in Wave 10 alongside 2.24, 2.25, 3.2, 3.3.

**Files:** `backend/db/test/services/`
- [ ] `templateExport.test.ts` — 3+ cases (valid, not found, with image)
- [ ] `templateImport.test.ts` — 5+ cases (valid, invalid schema, duplicate UUID, missing category, large image)
- [ ] `templateBatchImport.test.ts` — 3+ cases (mixed success/fail, idempotency)

**Requirements:** All backend tasks use `bun run scripts/run-test/run-test.ts` for log capture

---

### TASK 3.2: Unit Tests (Frontend Components)

> **Parallelizable**: This task runs as a subagent in Wave 10 alongside 2.24, 2.25, 3.1, 3.3.

**Files:** `test/ui/components/certificates/importExport/`
- [ ] `TemplateExportActions.test.tsx` — 4+ cases
- [ ] `ImportPreviewModal.test.tsx` — 4+ cases (warnings, errors, a11y)
- [ ] `ImportStateMachine.spec.ts` — 8+ state transitions
- [ ] `ExportFileFormat.spec.ts` — 5+ schema variants
- [ ] `ImportFormatDetect.test.tsx` — 4+ format detections

---

### TASK 3.3: Accessibility Audit

> **Parallelizable**: This task runs as a subagent in Wave 10 alongside 2.24, 2.25, 3.1, 3.2.

- [ ] Run axe-core on import/export modals (automated in E2E)
- [ ] Manual keyboard navigation test (Tab, Enter, Escape)
- [ ] Screen reader test (NVDA/VoiceOver): progress announcements, error reading
- [ ] Color contrast verification (theme tokens used, no hardcoded colors)
- [ ] Focus trap in preview modal
- [ ] ARIA labels on file inputs, buttons, progress

---

### TASK 3.4: Performance Tests

> **Parallelizable**: This task runs as a subagent in Wave 11 alongside 2.26.

- [ ] Single export < 2s (template with 50 elements) — measure in E2E
- [ ] Batch export (50 templates) < 30s — measure in E2E
- [ ] Single import validation < 1s — unit test with performance.now()
- [ ] Batch import (50 templates) < 60s — measure in E2E
- [ ] Memory check: no leaks during batch ZIP creation

---

### TASK 3.5: Quality Gate
- [ ] Run `bun quality-gate` — must pass all stages:
  1. BASIC_CHECKS (tsgo, biome, lint)
  2. CODESCENE (no Large Method, no Duplication)
  3. SONAR_SCAN (no new issues)
  4. SONAR_RESULTS (existing cleared)
- [ ] If CODESCENE fails: run `bun run codescene --file <path>` per file
- [ ] If SONAR_RESULTS fails: `bun scripts/sonar-manager.ts list-files` → fix → delete
- [ ] Resume with `bun quality-gate` (picks up from last stage)

---

### TASK 3.6: Documentation & Knowledge Propagation

> **Parallelizable**: This task runs as a subagent in the Final Wave (knowledge propagation) alongside 2.27, R4-T12.

**Docs to create:**
- [ ] `docs/certificates/template-import-export.md` — feature guide with:
  - UX flow diagrams (import wizard, export options)
  - JSON schema reference (with examples)
  - Role permission matrix
  - Troubleshooting (common validation errors)
  - Migration from v1.0 (future-proofing)

**AGENTS.md updates:**
- [ ] `frontend/common/stores/AGENTS.md` — add importExportStore reference
- [ ] `frontend/common/views/dashboard/certificates/importExport/` — note in views AGENTS.md

**Instruction files:**
- [ ] No new instructions needed

**Skills:**
- [ ] Not applicable (follows existing patterns)

---

## 5. Execution Order Summary

| # | Task | Phase | Depends On | Est. Hours |
|---|------|-------|------------|------------|
| 1.1 | Template Export Service | 1 | Plan 04, 07 | 4 |
| 1.2 | Template Import Service | 1 | 1.1, Plan 07 | 6 |
| 1.3 | Batch Import Service | 1 | 1.2 | 3 |
| 1.4 | GraphQL Mutations | 1 | 1.1, 1.2, 1.3, Plan 05 | 4 |
| 1.5 | Audit Logging | 1 | 1.1, 1.2 | 2 |
| 2.1 | ImportExport Store | 2 | Plan 05 | 2 |
| 2.2 | File Utilities | 2 | - | 3 |
| 2.3 | Client Validation | 2 | 2.2 | 3 |
| 2.4 | Export Actions | 2 | 1.4, 2.1 | 3 |
| 2.5 | Import Actions + Preview | 2 | 1.4, 2.1, 2.3 | 5 |
| 2.6 | Batch Results Summary | 2 | 2.5 | 2 |
| 2.7 | Mobile/Desktop Adaptation | 2 | 2.4, 2.5, 2.6 | 3 |
| 2.8 | TypeScript Types | 2 | 1.4 | 1 |
| 2.9 | Role Matrix | 2 | 2.4, 2.5 (Plan 08/10 integration) | 2 |
| 2.10 | Error Handling | 2 | 2.5 | 2 |
| 2.11 | i18n Keys | 2 | - | 2 |
| 2.12 | E2E Tests | 2 | 2.4-2.7, build:test | 3 |
| 3.1 | Backend Unit Tests | 3 | 1.1-1.3 | 3 |
| 3.2 | Frontend Unit Tests | 3 | 2.1-2.6 | 3 |
| 3.3 | Accessibility Audit | 3 | 2.5, 2.6 | 2 |
| 3.4 | Performance Tests | 3 | 3.2 | 2 |
| 3.5 | Quality Gate | 3 | All above | 2 |
| 3.6 | Documentation | 3 | 3.5 | 2 |

**Total Estimated: ~60 hours**

---

## 6. Quality Loop Per Subtask

**For EVERY file created/modified:**
- Run per-file progressive verification via `scripts/health/sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene in one command, short-circuiting on first failure):
  ```bash
  bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene
  ```
- Run applicable tests (unit/component)
- Only proceed to next file after ALL pass

**For EACH task completion:**
- Verify all subtasks checked
- Run sub-loop on ALL modified files
- Commit with scoped message: `feat(cert:import-export): <task description>`

---

## 7. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| ZIP memory on mobile | Chunk ZIP creation, limit concurrent reads, show progress |
| Large image base64 | Size check before base64 encode, fallback to file upload |
| Import validation mismatch client/server | Share Zod schema (types + validation) between client/server |
| Tier switch during import | Zustand store survives (non-serializable in useRef) |
| Schema version drift | Version field in export, migration utility for v1.0 → v2.0 |
| Role permissions drift | Single source: `INTER_PLAN_CONTRACTS.md` §1, enforce in RequirePermission |

---

## 8. Acceptance Verification Checklist

### Backend
- [ ] Export query returns complete template JSON with all elements/variables
- [ ] Import mutation validates and creates new template with new UUIDs
- [ ] Batch import processes independently, returns per-item results
- [ ] Audit events fire for all operations
- [ ] Permission guards work correctly

### Frontend
- [ ] Export dropdown appears in Template List + Editor
- [ ] Import button appears with file picker
- [ ] Preview modal shows warnings/errors correctly
- [ ] Import succeeds, redirects to editor
- [ ] Batch export creates valid ZIP
- [ ] Batch import shows results summary
- [ ] Mobile: FAB + full-screen preview works
- [ ] Role-based: Content Creator sees export only
- [ ] All strings use i18n keys, Arabic renders RTL
- [ ] Accessibility: keyboard, screen reader, contrast pass

### Quality
- [ ] `bun quality-gate` passes
- [ ] All unit tests pass
- [ ] E2E tests pass
- [ ] Performance metrics met
---

## 9. Enhanced UI Tasks — Wizard Components (Phase 2.5)

These tasks cover the enhanced Export Wizard, Import Wizard, File Drop Zone, Conflict Resolution Card, dedicated Zustand stores, validation service, tests, and knowledge propagation. They augment Tasks 2.1–2.12 and should be executed after the Phase 1 backend tasks and in parallel with Phase 2.x front-end tasks.

---

### TASK 2.13: Export Zustand Store

> **Parallelizable**: This task runs as a subagent in Wave 6 alongside 2.3, 2.14, 2.21.

**Files to create/modify:**
- `frontend/stores/cert/templateExportStore.ts` (new)

**Requirements references:** REQ-EXP-001 through REQ-EXP-007, design §13, §15.2.1

**Subtasks:**
- [ ] Create `useExportStore` Zustand store using `create` with persist middleware
- [ ] Implement state: `open`, `templateId`, `format` ('json'|'zip'|'pdf'|'png'|'svg'), `options` object (includeAssets, prettyPrint, compress, includeThumbnails, quality, pageSize, resolution, transparent, embedFonts)
- [ ] Implement progress state: `isExporting`, `progress` (0-100), `downloadUrl` (string|null), `fileSize` (number|null), `error` (string|null)
- [ ] Implement actions: `setOpen`, `setTemplateId`, `setFormat`, `setOption<K>`, `startExport`, `cancelExport`, `reset`
- [ ] `setOption` is generic: `<K extends keyof Options>(key: K, value: Options[K]) => void`
- [ ] `startExport` dispatches per-format logic (Apollo query for JSON/ZIP, client-side render for PDF/PNG/SVG)
- [ ] `cancelExport` aborts in-flight Apollo query (AbortController) or cancels client generation
- [ ] `reset` clears all runtime state, revokes blob URL if present
- [ ] `partialize` excludes: `downloadUrl`, `fileSize`, `progress`, `isExporting` (runtime-only)
- [ ] No `console.*` — use `logger` from `@/frontend/utils/logger` for debug logging

**Quality checks:**
- [ ] Unit test: `test/ui/components/cert/templates/ExportStore.test.ts` — state transitions, partialize, reset
- [ ] Run per-file quality loop (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/stores/cert/templateExportStore.ts --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `frontend/stores/AGENTS.md` — Zustand conventions, persist, partialize
- [ ] Read `frontend/AGENTS.md` — no console, logger usage
- [ ] Read `frontend/views/dashboard/cert/AGENTS.md` (if exists) — domain store patterns

---

### TASK 2.14: Import Zustand Store

> **Parallelizable**: This task runs as a subagent in Wave 6 alongside 2.3, 2.13, 2.21.

**Files to create/modify:**
- `frontend/stores/cert/templateImportStore.ts` (new)

**Requirements references:** REQ-IMP-001 through REQ-IMP-007, design §14, §15.2.2

**Subtasks:**
- [ ] Create `useImportStore` Zustand store with persist middleware
- [ ] Implement state: `open`, `file` (File|null — NOT persisted), `importUrl`, `pastedJson`, `validationResults` (ValidationResult[]), `conflicts` (ConflictInfo[]), `resolution` ('overwrite'|'rename'|'skip'), `renamedTitle`, `isImporting`, `progress`, `importedTemplateId`, `error`
- [ ] Define `ValidationResult` interface: `{ check: 'schema'|'version'|'asset'|'variable', status: 'pass'|'warning'|'fail', message: string, details?: string[] }`
- [ ] Define `ConflictInfo` interface: `{ existingTemplateId, existingTitle, importedTitle }`
- [ ] Implement actions: `setOpen`, `setFile`, `setUrl`, `setPastedJson`, `startValidation`, `setResolution`, `setRenamedTitle`, `startImport`, `reset`
- [ ] `startValidation`: reads file via FileReader → detect format → Zod validate → populate `validationResults`
- [ ] `startImport`: builds graphql input from file/url/pastedJson + resolution → calls Apollo mutation → updates progress
- [ ] `partialize` excludes: `file` (non-serializable), `validationResults`, `progress`, `error`, `isImporting`
- [ ] `reset` clears all state including revoking any blob URLs

**Quality checks:**
- [ ] Unit test: `test/ui/components/cert/templates/ImportStore.test.ts` — state transitions, validation flow, conflict resolution
- [ ] Run per-file quality loop (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/stores/cert/templateImportStore.ts --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `frontend/stores/AGENTS.md` — persist, partialize for non-serializable
- [ ] Read `frontend/AGENTS.md` — logger usage, no console

---

### TASK 2.15: ExportWizardDialog — Step 1 (Format Selection)

> **Parallelizable**: This task runs as a subagent in Wave 8 alongside 2.6, 2.9, 2.10, 2.18, 2.19.

**Files to create/modify:**
- `frontend/views/dashboard/cert/templates/export/ExportWizardDialog.tsx` (new — main dialog shell)
- `frontend/views/dashboard/cert/templates/export/steps/ExportFormatStep.tsx` (new)

**Requirements references:** REQ-EXP-001, REQ-EXP-002, REQ-EXP-006, design §13 (Step 1)

**Subtasks:**
- [ ] Create `ExportWizardDialog` shell: MUI `Dialog` with responsive `fullScreen` + `maxWidth` (see design §16)
- [ ] Integrate MUI `Stepper` with 3 steps: "Format", "Options", "Progress"
- [ ] Render `ExportFormatStep` when active step === 0
- [ ] Format card grid: `Grid` container with `{ xs: 12, sm: 6, md: 4 }` items
- [ ] Each format card: clickable `Box` → icon (48px) → title → description → selected state border + tint
- [ ] 5 formats: JSON (`CodeOutlined`), ZIP (`FolderZipOutlined`), PDF (`PictureAsPdfOutlined`), PNG (`ImageOutlined`), SVG (`DrawOutlined`)
- [ ] On card click: `useExportStore.setFormat(format)`
- [ ] DialogActions: "Next" button (disabled if no format selected), "Cancel" (calls `onClose`)
- [ ] Responsive: `useMediaQuery` for mobile detection — `fullScreen` on <600px
- [ ] All text from i18n keys in `certificates.templates.importExport` namespace
- [ ] Use `useAppTranslation(Translation.Dashboard.CertificateImportExport)` hook

**Quality checks:**
- [ ] Component test: `test/ui/components/cert/templates/ExportFormatStep.test.tsx` — renders 5 cards, click selects format, Next disabled initially
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/export/ExportWizardDialog.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/export/steps/ExportFormatStep.tsx --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `frontend/AGENTS.md` — MUI v9 sx props, no style props
- [ ] Read `frontend/views/AGENTS.md` — component patterns, ResponsiveViewSwitch (if applicable)
- [ ] Read `frontend/views/dashboard/cert/templates/AGENTS.md` (if exists)
- [ ] Read `shared/AGENTS.md` — i18n `useAppTranslation`

---

### TASK 2.16: ExportWizardDialog — Step 2 (Format Options)

> **Parallelizable**: This task runs as a subagent in Wave 9 alongside 2.7, 2.12, 2.17, 2.20.

**Files to create/modify:**
- `frontend/views/dashboard/cert/templates/export/steps/ExportOptionsStep.tsx` (new)

**Requirements references:** REQ-EXP-002, REQ-EXP-005, REQ-EXP-006, design §13 (Step 2)

**Subtasks:**
- [ ] Render format-specific options based on `format` from `useExportStore`
- [ ] JSON options: `FormControlLabel` + `Checkbox` — includeAssets (default true), prettyPrint (default true)
- [ ] ZIP options: compress (default true), includeThumbnails (default false) — both `Checkbox`
- [ ] PDF options: quality `Select` (draft/standard/high, default `standard`), pageSize `Select` (A4/Letter/Custom, default `A4`)
- [ ] PNG options: resolution `Select` (1: "1x"/2: "2x"/3: "3x", default `2x` → value 2), transparent `Checkbox` (default false)
- [ ] SVG options: embedFonts `Checkbox` (default true)
- [ ] Each control calls `useExportStore.setOption(key, value)`
- [ ] Options wrapped in `Stack` with `spacing={3}`, `sx={{ p: 2 }}`
- [ ] DialogActions: "Back" (go to step 0), "Export" (go to step 2 + trigger `startExport`)
- [ ] Use `MenuItem` for `Select` options with i18n labels
- [ ] All MUI `sx` prop styling (no direct style props)

**Quality checks:**
- [ ] Component test: `test/ui/components/cert/templates/ExportOptionsStep.test.tsx` — renders correct options per format, checkbox/select changes update store
- [ ] Run per-file quality loop (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/export/steps/ExportOptionsStep.tsx --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `frontend/AGENTS.md` — MUI v9 form control patterns, `sx` prop
- [ ] Read `shared/AGENTS.md` — i18n for select labels

---

### TASK 2.17: ExportWizardDialog — Step 3 (Progress & Download)

> **Parallelizable**: This task runs as a subagent in Wave 9 alongside 2.7, 2.12, 2.16, 2.20.

**Files to create/modify:**
- `frontend/views/dashboard/cert/templates/export/steps/ExportProgressStep.tsx` (new)

**Requirements references:** REQ-EXP-001, REQ-NFR-003, design §13 (Step 3)

**Subtasks:**
- [ ] Render `LinearProgress` with `variant="determinate"`, value from `useExportStore.progress`
- [ ] File size display: `Typography` formatted as KB/MB (helper function `formatFileSize(bytes)`)
- [ ] Status text: "Exporting..." | "Complete!" | "Error: {message}" — i18n keys
- [ ] Download button: `Button` with `DownloadOutlined` icon — `disabled` unless `progress === 100 && downloadUrl !== null`
- [ ] On download click: create `<a>` with `href={downloadUrl}`, `download` attribute, trigger `.click()`
- [ ] Error state: `Alert` severity="error" with message + "Retry" button → calls `startExport` again
- [ ] Call `useExportStore.startExport()` on component mount (`useEffect` with `[]` deps)
- [ ] DialogActions: "Close" button (calls `onClose`), "Download" on success
- [ ] If `isExporting` and progress < 100: show indeterminate fallback if progress is 0

**Quality checks:**
- [ ] Component test: `test/ui/components/cert/templates/ExportProgressStep.test.tsx` — progress bar renders, download disabled until 100%, retry on error
- [ ] Run per-file quality loop (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/export/steps/ExportProgressStep.tsx --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `frontend/AGENTS.md` — MUI v9 LinearProgress, Alert, Button prop patterns
- [ ] Read `shared/AGENTS.md` — i18n status messages

---

### TASK 2.18: ImportWizardDialog — Step 1 (Upload)

> **Parallelizable**: This task runs as a subagent in Wave 8 alongside 2.6, 2.9, 2.10, 2.15, 2.19.

**Files to create/modify:**
- `frontend/views/dashboard/cert/templates/import/ImportWizardDialog.tsx` (new — main dialog shell)
- `frontend/views/dashboard/cert/templates/import/steps/ImportUploadStep.tsx` (new)

**Requirements references:** REQ-IMP-001, REQ-IMP-005, REQ-NFR-003, design §14 (Step 1)

**Subtasks:**
- [ ] Create `ImportWizardDialog` shell: MUI `Dialog` with responsive `fullScreen` + `maxWidth`
- [ ] Integrate MUI `Stepper` with 4 steps: "Upload", "Validation", "Preview & Conflicts", "Import"
- [ ] Render `ImportUploadStep` when active step === 0
- [ ] Render `FileDropZone` (Task 2.21) with `acceptedTypes={['.json', '.zip']}`, `maxSize={50 * 1024 * 1024}`, `urlInputEnabled={true}`
- [ ] On file selected/dropped: `useImportStore.setFile(file)` → auto-advance to step 1 (Validation)
- [ ] URL input toggle: reveals `TextField` with URL → fetch file → `setFile`
- [ ] Paste JSON toggle: reveals multiline `TextField` → "Validate" button → `setPastedJson` → `setFile` from text Blob
- [ ] Error feedback: `Alert` severity="error" if file too large or wrong type
- [ ] DialogActions: "Cancel" (calls `onClose`), no "Next" (auto-advance on file selection)
- [ ] Responsive: `useMediaQuery` for mobile `fullScreen`
- [ ] All text via `useAppTranslation(Translation.Dashboard.CertificateImportExport)`

**Quality checks:**
- [ ] Component test: `test/ui/components/cert/templates/ImportUploadStep.test.tsx` — drop zone renders, file select triggers store update, URL toggle works, paste toggle works
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/ImportWizardDialog.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/steps/ImportUploadStep.tsx --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `frontend/AGENTS.md` — MUI v9 Dialog, Stepper, Alert patterns
- [ ] Read `frontend/views/AGENTS.md` — dialog component structure
- [ ] Read `shared/AGENTS.md` — i18n system

---

### TASK 2.19: ImportWizardDialog — Step 2 (Validation Results)

> **Parallelizable**: This task runs as a subagent in Wave 8 alongside 2.6, 2.9, 2.10, 2.15, 2.18.

**Files to create/modify:**
- `frontend/views/dashboard/cert/templates/import/steps/ImportValidationStep.tsx` (new)

**Requirements references:** REQ-IMP-002, REQ-IMP-006, design §14 (Step 2)

**Subtasks:**
- [ ] Render validation results table from `useImportStore.validationResults`
- [ ] 4 validation check rows: Schema, Version, Asset, Variable
- [ ] Each row: icon (check/warning/error), label, status badge, expandable details
- [ ] Pass icon: `CheckCircleOutlined` (success.main color)
- [ ] Warning icon: `WarningAmberOutlined` (warning.main color)
- [ ] Fail icon: `ErrorOutlined` / `BrokenImageOutlined` / `ReportOutlined` (error.main color)
- [ ] Expandable details: `Collapse` with `Typography` listing specific field-level errors/warnings
- [ ] Blocking errors (fail status): disable "Next" button, show `Alert` severity="error" summary
- [ ] Non-blocking warnings: allow "Next" with confirmation `Alert` severity="warning"
- [ ] Auto-trigger `startValidation()` on step mount via `useEffect`
- [ ] DialogActions: "Back" (step 0), "Next" (disabled if blocking errors), "Cancel"
- [ ] Loading: `CircularProgress` while validation in flight (`isImporting` on store)

**Quality checks:**
- [ ] Component test: `test/ui/components/cert/templates/ImportValidationStep.test.tsx` — renders 4 checks, expandable details, Next disabled on blocking errors
- [ ] Run per-file quality loop (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/steps/ImportValidationStep.tsx --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `frontend/AGENTS.md` — MUI v9 Table, Collapse, Alert patterns
- [ ] Read `shared/AGENTS.md` — i18n for validation status messages

---

### TASK 2.20: ImportWizardDialog — Step 3 (Preview & Conflicts) + Step 4 (Import)

> **Parallelizable**: This task runs as a subagent in Wave 9 alongside 2.7, 2.12, 2.16, 2.17.

**Files to create/modify:**
- `frontend/views/dashboard/cert/templates/import/steps/ImportPreviewStep.tsx` (new)
- `frontend/views/dashboard/cert/templates/import/steps/ImportProgressStep.tsx` (new)

**Requirements references:** REQ-IMP-003, REQ-IMP-006, REQ-IMP-001, design §14 (Steps 3 & 4)

**Subtasks:**
**Step 3 — Preview & Conflicts (`ImportPreviewStep.tsx`):**
- [ ] Two-column layout: left = template preview (mini canvas), right = conflict resolution
- [ ] Left: `AspectRatio` wrapper with scaled canvas preview — shows template title, dimensions, element/variable counts
- [ ] Right: `ConflictResolutionCard` (Task 2.22) — renders only if `conflicts.length > 0`
- [ ] If no conflicts: show success `Alert` "No conflicts detected"
- [ ] On mobile: stack single-column (preview above conflicts)
- [ ] DialogActions: "Back" (step 1), "Import" (triggers `startImport` → advance to step 3)

**Step 4 — Import Progress (`ImportProgressStep.tsx`):**
- [ ] `LinearProgress` with `variant="determinate"`, value from `useImportStore.progress`
- [ ] Status text: "Importing template..." | "Import complete!" | "Import failed: {message}"
- [ ] Success: `Alert` severity="success" with summary (template name, element count, variable count)
- [ ] "View Template" button: calls `onImported(importedTemplateId)` → navigate to editor
- [ ] Error: `Alert` severity="error" + "Retry" button → returns to step 2 (Preview)
- [ ] DialogActions: "Close" always visible, "View Template" only on success
- [ ] Auto-trigger `startImport()` on step mount via `useEffect`

**Quality checks:**
- [ ] Component test: `test/ui/components/cert/templates/ImportPreviewStep.test.tsx` — preview renders, conflict card shows when conflicts exist, Import button triggers store action
- [ ] Component test: `test/ui/components/cert/templates/ImportProgressStep.test.tsx` — progress bar renders, View Template on success, Retry on error
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/steps/ImportPreviewStep.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/steps/ImportProgressStep.tsx --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `frontend/AGENTS.md` — MUI v9 Grid, Stack, LinearProgress, Alert tooltip
- [ ] Read `frontend/views/AGENTS.md` — responsive layout patterns
- [ ] Read `shared/AGENTS.md` — i18n messages

---

### TASK 2.21: FileDropZone Component

> **Parallelizable**: This task runs as a subagent in Wave 6 alongside 2.3, 2.13, 2.14.

**Files to create/modify:**
- `frontend/views/dashboard/cert/templates/import/FileDropZone.tsx` (new)

**Requirements references:** REQ-IMP-001, REQ-IMP-005, REQ-NFR-002, design §15.1

**Subtasks:**
- [ ] Implement props: `acceptedTypes`, `maxSize`, `onFileSelected`, `onFileDropped`, `urlInputEnabled`
- [ ] Root: `Box` with dashed border (2px `divider` color), padding 4, center alignment, cursor pointer, `transition` for hover/drag states
- [ ] Hidden `<input type="file" accept={acceptedTypes.join(',')} />` ref — triggered on click or keyboard Enter/Space
- [ ] `onDragOver`: `e.preventDefault()`, set state to `dragover` → border + background tint
- [ ] `onDragLeave`: reset to `idle` state
- [ ] `onDrop`: `e.preventDefault()`, extract `File` from `DataTransfer`, validate → call `onFileDropped` or set error
- [ ] Visual states: idle, dragover (primary.main 0.08 opacity), uploading (`CircularProgress` 40px), error (error.main border + `ErrorOutlined` icon + message), success (`CheckCircleOutlined` + filename)
- [ ] Icon: `CloudUploadOutlined` (64px idle), scales to 72px in dragover
- [ ] File validation: type check (`acceptedTypes`), size check (`maxSize`) — errors via `Alert` or inline text
- [ ] Accessibility: `role="button"`, `aria-label` (i18n `dropZoneText`), `tabIndex={0}`, keyboard handlers
- [ ] URL sub-component: `ToggleButton` reveals `TextField` (type url) + "Fetch" button → calls `onFileSelected` with fetched blob
- [ ] Paste sub-component: `ToggleButton` reveals `TextField` multiline (minRows=6, maxRows=12) + "Validate" button → creates Blob from text → `onFileSelected`
- [ ] Error states use `error.main` theme color, success uses `success.main`

**Quality checks:**
- [ ] Component test: `test/ui/components/cert/templates/FileDropZone.test.tsx` — renders idle state, drag-over visual, file dropped, oversize file error, wrong type error, URL toggle, paste toggle, keyboard accessible, aria-label
- [ ] Run per-file quality loop (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/FileDropZone.tsx --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `frontend/AGENTS.md` — MUI v9 Box sx props, drag-drop patterns, accessibility
- [ ] Read `shared/AGENTS.md` — i18n for drop zone text
- [ ] Read `frontend/views/AGENTS.md` — component structure

---

### TASK 2.22: ConflictResolutionCard Component

> **Parallelizable**: This task runs as a subagent in Wave 7 alongside 2.4, 2.5, 2.23.

**Files to create/modify:**
- `frontend/views/dashboard/cert/templates/import/ConflictResolutionCard.tsx` (new)

**Requirements references:** REQ-IMP-003, design §15.3

**Subtasks:**
- [ ] Implement props: `existingTitle`, `importedTitle`, `resolution`, `renamedTitle`, `onResolutionChange`, `onRenamedTitleChange`
- [ ] Root: `Card` with `sx={{ p: 3 }}`
- [ ] Header: `WarningAmberOutlined` icon, `CardHeader` title "Name Conflict Detected", subheader about existing template
- [ ] `RadioGroup` with 3 `FormControlLabel` options:
  - Option 1 "Overwrite": value `"overwrite"` — warning text "This will replace the current template. This action cannot be undone." in `error.main` color variant caption
  - Option 2 "Rename" (DEFAULT): value `"rename"` — editable `TextField` with auto-generated `{originalTitle} (Imported)`
  - Option 3 "Skip": value `"skip"` — "No changes will be made."
- [ ] Each option in `Box` with border, selected option: `primary.main` border + 0.04 opacity background tint
- [ ] `TextField` for renamed title: `disabled` unless `resolution === 'rename'`
- [ ] Icons next to each label: `WarningAmberOutlined` (overwrite), `CreateNewFolderOutlined` (rename), `SkipNextOutlined` (skip)
- [ ] Default selection: option 2 (Rename) — set in parent store on conflict detection
- [ ] All text from i18n keys

**Quality checks:**
- [ ] Component test: `test/ui/components/cert/templates/ConflictResolutionCard.test.tsx` — renders 3 options, default is rename, text field enabled only on rename, radio change updates store, overwrite warning visible
- [ ] Run per-file quality loop (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/ConflictResolutionCard.tsx --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `frontend/AGENTS.md` — MUI v9 Card, RadioGroup, FormControlLabel, TextField patterns
- [ ] Read `shared/AGENTS.md` — i18n for conflict messages

---

### TASK 2.23: File Validation Service (Schema, Version, Asset)

> **Parallelizable**: This task runs as a subagent in Wave 7 alongside 2.4, 2.5, 2.22.

**Files to create/modify:**
- `frontend/views/dashboard/cert/templates/import/validation/templateValidationService.ts` (new)
- `frontend/views/dashboard/cert/templates/import/validation/schemaValidator.ts` (new)
- `frontend/views/dashboard/cert/templates/import/validation/versionValidator.ts` (new)
- `frontend/views/dashboard/cert/templates/import/validation/assetValidator.ts` (new)
- `frontend/views/dashboard/cert/templates/import/validation/variableValidator.ts` (new)

**Requirements references:** REQ-IMP-002, design §5 (Validation Pipeline)

**Subtasks:**
- [ ] `templateValidationService.ts`: orchestrator function `runValidationPipeline(file: File): Promise<ValidationResult[]>`
  - Calls each sub-validator sequentially, aggregates results into ValidationResult[]
  - Each validator returns a `ValidationResult` with check name, status, message, details
- [ ] `schemaValidator.ts`: Zod schema validation against `ExportedTemplate` interface
  - Uses shared Zod schema from `importSchema.ts` (Task 2.3)
  - Returns: status pass/fail, message, details = Zod error paths
- [ ] `versionValidator.ts`: checks `version` field in export JSON
  - Current: "1.0" → pass
  - Future/deprecated versions → warning with migration note
  - Missing version → fail
- [ ] `assetValidator.ts`: validates background images and element images
  - Checks base64 validity if `backgroundType === 'image'`
  - Checks image element `properties.src` is valid base64 or file ref
  - Validates image size < 10MB
  - Returns: pass/warning/fail with asset count
- [ ] `variableValidator.ts`: validates variable definitions
  - Checks unique variable names (no duplicates)
  - Validates select type has non-empty options array
  - Validates defaultValue is compatible with type
  - Returns: pass/warning with auto-rename details
- [ ] All validators return `ValidationResult` types matching store interface
- [ ] No `console.*` — use `logger` for debug

**Quality checks:**
- [ ] Unit test: `test/ui/components/cert/templates/TemplateValidationService.test.ts` — schema pass/fail, version check, asset validation, variable duplicate detection (6+ cases)
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/validation/templateValidationService.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/validation/schemaValidator.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/validation/versionValidator.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/validation/assetValidator.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/validation/variableValidator.ts --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `frontend/views/AGENTS.md` — validation utility patterns
- [ ] Read `backend/types/AGENTS.md` — canonical types for validation
- [ ] Read `INTER_PLAN_CONTRACTS.md` §4 — enum values

---

### TASK 2.24: Enhanced Component Tests (6 Test Files)

> **Parallelizable**: This task runs as a subagent in Wave 10 alongside 2.25, 3.1, 3.2, 3.3.

**Files to create/modify:**
- `test/ui/components/cert/templates/ExportFormatStep.test.tsx` (new)
- `test/ui/components/cert/templates/ExportOptionsStep.test.tsx` (new)
- `test/ui/components/cert/templates/ExportProgressStep.test.tsx` (new)
- `test/ui/components/cert/templates/ImportUploadStep.test.tsx` (new)
- `test/ui/components/cert/templates/ImportValidationStep.test.tsx` (new)
- `test/ui/components/cert/templates/ImportPreviewStep.test.tsx` (new)
- `test/ui/components/cert/templates/ImportProgressStep.test.tsx` (new)
- `test/ui/components/cert/templates/FileDropZone.test.tsx` (new)
- `test/ui/components/cert/templates/ConflictResolutionCard.test.tsx` (new)
- `test/ui/components/cert/templates/ExportStore.test.ts` (new)
- `test/ui/components/cert/templates/ImportStore.test.ts` (new)
- `test/ui/components/cert/templates/TemplateValidationService.test.ts` (new)

**Requirements references:** All enhanced tasks, AC-004, AC-008

**Test framework:** Happy DOM + Vitest (via `bun run test:ui:components`), mock Apollo client and Zustand stores

**Subtasks:**

**ExportFormatStep.test.tsx:**
- [ ] Renders 5 format cards (JSON, ZIP, PDF, PNG, SVG)
- [ ] Clicking a card selects it (updates store)
- [ ] Next button disabled until format selected
- [ ] Correct icons render per format
- [ ] i18n labels render

**ExportOptionsStep.test.tsx:**
- [ ] Renders JSON options when format=json
- [ ] Renders ZIP options when format=zip
- [ ] Renders PDF options with quality + page size selects when format=pdf
- [ ] Renders PNG options with resolution + transparent when format=png
- [ ] Renders SVG options with embedFonts when format=svg
- [ ] Checkbox/select changes update store
- [ ] Back button returns to format step

**ExportProgressStep.test.tsx:**
- [ ] LinearProgress renders with correct value
- [ ] Download button disabled until progress=100
- [ ] Clicking download triggers browser download (mock anchor click)
- [ ] Error state shows Alert + Retry button
- [ ] File size formatted correctly (KB/MB)

**ImportUploadStep.test.tsx:**
- [ ] FileDropZone renders with correct accepted types
- [ ] File drop sets store file
- [ ] URL toggle reveals text field
- [ ] Paste JSON toggle reveals textarea
- [ ] Oversize file shows error alert
- [ ] Wrong file type shows error alert

**ImportValidationStep.test.tsx:**
- [ ] Renders 4 validation check rows
- [ ] Pass status shows CheckCircleOutlined
- [ ] Warning status shows WarningAmberOutlined
- [ ] Fail status shows ErrorOutlined
- [ ] Expandable details toggle on row click
- [ ] Next button disabled when blocking errors exist
- [ ] Next button enabled when only warnings

**ImportPreviewStep.test.tsx:**
- [ ] Mini canvas preview renders
- [ ] Conflict card renders when conflicts.length > 0
- [ ] No-conflict state shows success Alert
- [ ] Import button triggers startImport
- [ ] Template metadata (title, dimensions, counts) displayed

**ImportProgressStep.test.tsx:**
- [ ] LinearProgress renders
- [ ] Success shows Alert + View Template button
- [ ] Error shows Alert + Retry button
- [ ] View Template calls onImported

**FileDropZone.test.tsx:**
- [ ] Idle state renders dashed border + cloud icon + text
- [ ] Drag-over state changes border + background
- [ ] File dropped calls onFileDropped
- [ ] Click triggers hidden file input
- [ ] Oversize file error state
- [ ] Wrong type error state
- [ ] Keyboard accessible (Enter/Space triggers file input)
- [ ] aria-label set from i18n

**ConflictResolutionCard.test.tsx:**
- [ ] Renders 3 radio options
- [ ] Default selection is rename (option 2)
- [ ] Text field enabled only when resolution=rename
- [ ] Text field has auto-generated "{title} (Imported)" value
- [ ] Overwrite option shows warning text
- [ ] Skip option shows "No changes" text
- [ ] Radio change calls onResolutionChange

**ExportStore.test.ts:**
- [ ] Initial state correct
- [ ] setFormat updates format
- [ ] setOption updates specific option
- [ ] reset clears all state
- [ ] partialize excludes runtime fields
- [ ] startExport sets isExporting

**ImportStore.test.ts:**
- [ ] Initial state correct
- [ ] setFile updates file
- [ ] startValidation populates validationResults
- [ ] setResolution updates resolution
- [ ] startImport sets isImporting + progress
- [ ] reset clears all state
- [ ] partialize excludes File object

**TemplateValidationService.test.ts:**
- [ ] Valid template passes all 4 checks
- [ ] Missing required field → schema check returns fail
- [ ] Wrong schema version → version check returns warning
- [ ] Corrupt base64 image → asset check returns fail
- [ ] Duplicate variable names → variable check returns warning
- [ ] Empty export → appropriate errors

**Quality checks:**
- [ ] All test files pass via `bun run test:ui:components`
- [ ] Use mock Apollo client (`MockedProvider`) for GraphQL operations
- [ ] Use `renderHook` + `act` for Zustand store tests
- [ ] Accessible queries: `getByRole`, `getByLabelText` (not `getByTestId`)
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts test/ui/components/cert/templates/ExportFormatStep.test.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts test/ui/components/cert/templates/ExportOptionsStep.test.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts test/ui/components/cert/templates/ExportProgressStep.test.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts test/ui/components/cert/templates/ImportUploadStep.test.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts test/ui/components/cert/templates/ImportValidationStep.test.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts test/ui/components/cert/templates/ImportPreviewStep.test.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts test/ui/components/cert/templates/ImportProgressStep.test.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts test/ui/components/cert/templates/FileDropZone.test.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts test/ui/components/cert/templates/ConflictResolutionCard.test.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts test/ui/components/cert/templates/ExportStore.test.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts test/ui/components/cert/templates/ImportStore.test.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts test/ui/components/cert/templates/TemplateValidationService.test.ts --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `test/ui/AGENTS.md` — component test patterns
- [ ] Read `test/ui/components/AGENTS.md` (if exists) — Happy DOM setup
- [ ] Read `frontend/AGENTS.md` — testing conventions

---

### TASK 2.25: Enhanced E2E Tests (6 E2E Test Specs)

> **Parallelizable**: This task runs as a subagent in Wave 10 alongside 2.24, 3.1, 3.2, 3.3.

**Files to create/modify:**
- `test/ui/e2e/cert/templates/export-json.spec.ts` (new)
- `test/ui/e2e/cert/templates/export-zip.spec.ts` (new)
- `test/ui/e2e/cert/templates/import-json.spec.ts` (new)
- `test/ui/e2e/cert/templates/import-zip.spec.ts` (new)
- `test/ui/e2e/cert/templates/drag-drop.spec.ts` (new)
- `test/ui/e2e/cert/templates/conflict-resolution.spec.ts` (new)

**Requirements references:** All AC, REQ-NFR-003

**Prerequisite:** `bun run build:test` must complete before running E2E tests

**Subtasks:**

**export-json.spec.ts:**
- [ ] Login as Certificate Admin
- [ ] Navigate to Template List page
- [ ] Click Export on a template row
- [ ] Wizard opens → select JSON format → Next
- [ ] Verify format-specific options render → Next (Export)
- [ ] Progress bar animates → completion
- [ ] Download button enabled → click → verify file downloaded (.playwright downloads API)
- [ ] Verify downloaded file is valid JSON (parse + schema check)
- [ ] Verify audit log entry (if testable via API)

**export-zip.spec.ts:**
- [ ] Login as Certificate Admin
- [ ] Navigate to Template List page
- [ ] Select 3 templates via checkboxes
- [ ] Click "Export Selected" in bulk action bar
- [ ] Wizard opens → select ZIP format → Next
- [ ] Verify ZIP options render (compress, includeThumbnails) → Next (Export)
- [ ] Progress completes → download ZIP
- [ ] Verify ZIP contains 3 JSON files + manifest.json
- [ ] Verify each JSON is valid template schema

**import-json.spec.ts:**
- [ ] Login as Certificate Admin
- [ ] Navigate to Template List page
- [ ] Click Import button
- [ ] Wizard opens → upload a valid JSON template file (via test fixture)
- [ ] Validation step shows 4 green checks → Next
- [ ] Preview step shows template metadata + no conflicts → Import
- [ ] Progress bar → success Alert with "View Template" button
- [ ] Click View Template → verify navigation to Template Editor
- [ ] Verify imported template exists in Template List

**import-zip.spec.ts:**
- [ ] Login as Certificate Admin
- [ ] Navigate to Template List page
- [ ] Click Import button
- [ ] Upload a ZIP archive containing 3 templates (test fixture)
- [ ] Validation step shows per-template results
- [ ] Preview step shows batch template list
- [ ] Import → progress shows batch progress
- [ ] Verify results summary shows 3 imported
- [ ] Navigate Template List → verify 3 new templates

**drag-drop.spec.ts:**
- [ ] Login as Certificate Admin
- [ ] Open Import wizard
- [ ] Simulate file drag-drop via Playwright `setInputFiles` on drop zone input
- [ ] Verify drop zone visual state changes (border highlight)
- [ ] Verify file accepted → validation step
- [ ] Test URL import: toggle URL input → enter URL → fetch → validation
- [ ] Test paste JSON: toggle textarea → paste JSON → validate → progress

**conflict-resolution.spec.ts:**
- [ ] Login as Certificate Admin
- [ ] Import a template JSON file whose title matches an existing template
- [ ] Validation passes → Preview step shows ConflictResolutionCard
- [ ] Verify 3 radio options (Overwrite / Rename / Skip) rendered
- [ ] Default selection = Rename — verify text field with "(Imported)" suffix
- [ ] Click Overwrite → warning text visible → Import → verify existing template replaced
- [ ] Repeat with Rename → verify new template with "(Imported)" suffix created
- [ ] Repeat with Skip → verify no changes, wizard closes

**Quality checks:**
- [ ] All E2E specs pass via `bun run test:ui:e2e`
- [ ] `bun run build:test` completed before running
- [ ] Test fixtures: valid template JSON, valid ZIP archive, corrupted JSON, oversized file
- [ ] Use Playwright `page.waitForDownload()` and `page.waitForSelector()` appropriately
- [ ] Screenshots on failure (Playwright config)
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts test/ui/e2e/cert/templates/export-json.spec.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts test/ui/e2e/cert/templates/export-zip.spec.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts test/ui/e2e/cert/templates/import-json.spec.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts test/ui/e2e/cert/templates/import-zip.spec.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts test/ui/e2e/cert/templates/drag-drop.spec.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts test/ui/e2e/cert/templates/conflict-resolution.spec.ts --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `test/ui/AGENTS.md` — E2E test patterns, fixture conventions
- [ ] Read `test/ui/e2e/AGENTS.md` (if exists) — Playwright config

---

### TASK 2.26: Quality Loop Per File (Enhanced UI)

> **Parallelizable**: This task runs as a subagent in Wave 11 alongside 3.4.

**Files:** All files created in Tasks 2.13–2.25

**Subtasks:**
For each new file created in Tasks 2.13 through 2.25, run the per-file verification loop BEFORE importing or using the file elsewhere:

- [ ] Run per-file quality loop (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/stores/cert/templateExportStore.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/stores/cert/templateImportStore.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/export/ExportWizardDialog.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/export/steps/ExportFormatStep.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/export/steps/ExportOptionsStep.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/export/steps/ExportProgressStep.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/ImportWizardDialog.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/steps/ImportUploadStep.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/steps/ImportValidationStep.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/steps/ImportPreviewStep.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/steps/ImportProgressStep.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/FileDropZone.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/ConflictResolutionCard.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/validation/templateValidationService.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/validation/schemaValidator.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/validation/versionValidator.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/validation/assetValidator.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/import/validation/variableValidator.ts --lifecycle codescene
  ```
- [ ] Order: create component → verify → import in parent → verify parent → proceed

After all files pass individually:
- [ ] Run `bun quality-gate` — must pass all stages

**Instruction verification:**
- [ ] Read AGENTS.md §Verification Loop

---

### TASK 2.27: Knowledge Propagation (Enhanced UI)

> **Parallelizable**: This task runs as a subagent in the Final Wave (knowledge propagation) alongside 3.6, R4-T12.

**Files to create/modify:**
- `docs/certificates/template-import-export-wizard.md` (new)
- `frontend/stores/AGENTS.md` (update — add export/import store references)
- `frontend/views/dashboard/cert/templates/AGENTS.md` (new or update — wizard patterns)

**Subtasks:**

**docs/certificates/template-import-export-wizard.md:**
- [ ] Document Export Wizard 3-step flow (Format → Options → Progress)
- [ ] Document Import Wizard 4-step flow (Upload → Validation → Preview/Conflicts → Import)
- [ ] Include screenshots/ASCII diagrams of wizard layout
- [ ] Document FileDropZone visual states and props
- [ ] Document ConflictResolutionCard options and behavior
- [ ] Document Zustand store interfaces (export + import)
- [ ] Document responsive breakpoints (desktop/tablet/mobile)
- [ ] Document validation pipeline (schema, version, asset, variable)
- [ ] Include troubleshooting section (common export/import errors)

**frontend/stores/AGENTS.md:**
- [ ] Add section: `templateExportStore` — purpose, state shape, partialized fields, reset behavior
- [ ] Add section: `templateImportStore` — purpose, state shape, non-serializable File excluded, partialized fields
- [ ] Reference the wizard components that consume these stores
- [ ] Note pattern: per-feature store for ephemeral wizard state

**frontend/views/dashboard/cert/templates/AGENTS.md:**
- [ ] Document wizard dialog pattern (MUI Dialog + Stepper + Zustand store)
- [ ] Document FileDropZone drag-drop implementation
- [ ] Document conflict resolution radio group pattern
- [ ] Document responsive dialog (fullScreen on mobile, maxWidth on desktop/tablet)
- [ ] Reference design.md sections 13–16

**Quality checks:**
- [ ] Documentation files readable, no broken links
- [ ] AGENTS.md updates match actual code
- [ ] Store documentation matches interface in store files
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts docs/certificates/template-import-export-wizard.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/stores/AGENTS.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/AGENTS.md --lifecycle codescene
  ```

**Instruction verification:**
- [ ] Read `frontend/stores/AGENTS.md` — existing patterns
- [ ] Read `frontend/views/AGENTS.md` — existing patterns

---

## 10. Updated Execution Order (Enhanced UI)

| # | Task | Phase | Depends On | Est. Hours |
|---|------|-------|------------|------------|
| 2.13 | Export Zustand Store | 2.5 | 1.4 (GraphQL) | 2 |
| 2.14 | Import Zustand Store | 2.5 | 1.4 | 2 |
| 2.15 | Export Step 1 (Format) | 2.5 | 2.13 | 3 |
| 2.16 | Export Step 2 (Options) | 2.5 | 2.13, 2.15 | 2 |
| 2.17 | Export Step 3 (Progress) | 2.5 | 2.13, 2.15 | 2 |
| 2.18 | Import Step 1 (Upload) | 2.5 | 2.14, 2.21 | 3 |
| 2.19 | Import Step 2 (Validation) | 2.5 | 2.14, 2.23 | 3 |
| 2.20 | Import Steps 3+4 (Preview+Import) | 2.5 | 2.14, 2.22, 2.23 | 4 |
| 2.21 | FileDropZone Component | 2.5 | - | 3 |
| 2.22 | ConflictResolutionCard | 2.5 | 2.14 | 2 |
| 2.23 | File Validation Service | 2.5 | 2.3 (schema) | 4 |
| 2.24 | Enhanced Component Tests | 2.5 | All 2.13–2.23 | 6 |
| 2.25 | Enhanced E2E Tests | 2.5 | 2.15–2.20, build:test | 5 |
| 2.26 | Quality Loop Per File | 2.5 | All 2.13–2.25 | 3 |
| 2.27 | Knowledge Propagation | 2.5 | 2.26 | 2 |

**Additional Estimated: ~45 hours** (total project now ~105 hours)

---

## 11. Enhanced UI Acceptance Verification

### Export Wizard
- [ ] Clicking Export opens ExportWizardDialog with 3-step Stepper
- [ ] Step 1: 5 format cards with icons, selectable, Next disabled without selection
- [ ] Step 2: Format-specific options render correctly per selected format
- [ ] Step 3: Progress bar animates, download button enabled on 100%, file downloads successfully
- [ ] All format options save to Zustand store and persist across dialog re-open
- [ ] Dialog responsive: fullScreen on mobile, maxWidth on desktop/tablet

### Import Wizard
- [ ] Clicking Import opens ImportWizardDialog with 4-step Stepper
- [ ] Step 1: FileDropZone accepts drag-drop, click-to-browse, URL, paste JSON
- [ ] Step 2: 4 validation checks render with icons, expandable details, Next disabled on blocking errors
- [ ] Step 3: Mini canvas preview + ConflictResolutionCard (when conflicts exist)
- [ ] Step 4: Progress bar, success/error summary, View Template button on success
- [ ] Conflict resolution: 3 options, default rename, text field editable on rename
- [ ] Dialog responsive: fullScreen on mobile, maxWidth on desktop/tablet

### Stores
- [ ] Export store: format, options, progress state correctly managed
- [ ] Import store: file, validation, conflict, progress state correctly managed
- [ ] `partialize` excludes non-serializable / runtime-only fields
- [ ] `reset` clears all state and revokes blob URLs

### Validation Service
- [ ] Schema validator catches missing required fields
- [ ] Version validator warns on future/deprecated versions
- [ ] Asset validator checks base64 image validity
- [ ] Variable validator detects duplicate names

### Tests
- [ ] All 12 component tests pass
- [ ] All 6 E2E tests pass
- [ ] Accessibility: keyboard navigation, screen reader announcements, focus trap
- [ ] Responsive: mobile/tablet/desktop layouts correct

## Round 4 Enhancement Tasks

### R4-T1: File Validation Implementation

> **Parallelizable**: This task runs as a subagent in Wave 13 alongside R4-T2, R4-T3.

- [ ] Create `frontend/views/dashboard/certificates/template-import-export/components/FileValidator.tsx`
  - Max file size: 50MB for template JSON, 10MB per image asset
  - Format validation: JSON schema validation for template, PNG/JPG/SVG for images
  - Content validation: schema version check, required fields check
  - Virus scan: integration spec for ClamAV API
  - Validation result UI: green check or red X with error details
  - _Store: `importStore` adds `validationErrors: ValidationError[], validated: boolean`_
  - **Quality loop**: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/template-import-export/components/FileValidator.tsx --lifecycle codescene`

### R4-T2: Progress Indicators

> **Parallelizable**: This task runs as a subagent in Wave 13 alongside R4-T1, R4-T3.

- [ ] Create `frontend/views/dashboard/certificates/template-import-export/components/ProgressIndicator.tsx`
  - Overall progress bar: MUI v9 LinearProgress with percentage
  - Per-file progress for multi-file exports: list of file names + individual bars
  - Step labels: "Collecting assets...", "Compressing...", "Uploading..."
  - Estimated time remaining: calculated from current speed + remaining items
  - Cancel button: stops operation with cleanup of temp files
  - **Quality loop**: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/template-import-export/components/ProgressIndicator.tsx --lifecycle codescene`

### R4-T3: Error Recovery System

> **Parallelizable**: This task runs as a subagent in Wave 13 alongside R4-T1, R4-T2.

- [ ] Create `frontend/views/dashboard/certificates/template-import-export/components/ErrorRecovery.tsx`
  - Retry failed file: button per failed item with exponential backoff (1s, 2s, 4s, 8s)
  - Skip and continue: button to skip failed file
  - Error log: downloadable JSON report with all errors
  - Partial export/import resume: store progress, resume from last successful
  - Rollback to pre-import state: snapshot before import, restore on failure
  - _Store: `importStore` adds `failedItems: FailedItem[], retryItem(id), skipItem(id), rollback()`_
  - **Quality loop**: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/template-import-export/components/ErrorRecovery.tsx --lifecycle codescene`
- [ ] Create `frontend/views/dashboard/certificates/template-import-export/components/TemplateDiff.tsx`
  - Side-by-side diff: two columns showing current vs new version
  - Highlighted changes: green for added, red for removed, yellow for modified
  - Variable mapping preview: table showing variable name → value mapping
  - Element changes summary: count of added/removed/modified elements
  - Merge strategy selector: radio buttons (overwrite / merge / keep current)
  - **Quality loop**: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/template-import-export/components/TemplateDiff.tsx --lifecycle codescene`
- [ ] Create `frontend/views/dashboard/certificates/template-import-export/components/BatchExport.tsx`
  - Multi-select: checkbox list of templates to export
  - Export as ZIP: with manifest.json listing all templates
  - Include/exclude assets: Switch component
  - Include/exclude variables: Switch component
  - Version metadata in manifest: schema version, export date, template count
  - Checksums: SHA-256 per file in manifest for integrity verification
  - **Quality loop**: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/template-import-export/components/BatchExport.tsx --lifecycle codescene`
- [ ] Create `backend/services/template-import-hooks.ts`
  - Pre-import transformation: version migration function, field renaming function
  - Post-import validation: check all elements rendered, all variables resolved
  - Custom import adapter: interface for custom adapters
  - API endpoint: `POST /api/templates/import` with multipart upload
  - **Quality loop**: `bun run scripts/health/sub-loop.ts backend/services/template-import-hooks.ts --lifecycle codescene`
- [ ] Create `frontend/views/dashboard/certificates/template-import-export/components/ExportFormats.tsx`
  - JSON (full): complete template with assets inline
  - JSON (minimal): template without assets (assets referenced by URL)
  - ZIP (with assets): bundling template + image files
  - PDF bundle: template + one-page PDF sample
  - Shareable link: read-only URL with expiry (API route: `/api/templates/:id/share`)
  - Embed code: iframe HTML with src pointing to viewer page
  - Format selector: MUI v9 ToggleButtonGroup
  - **Quality loop**: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/template-import-export/components/ExportFormats.tsx --lifecycle codescene`
- [ ] Update `backend/services/template-version-service.ts`
  - Version bump on import: minor (patch), major (breaking changes)
  - Changelog generation: auto-detect changes from diff
  - Deprecated field handling: warn on import, auto-remove in next major
  - Backward compatibility matrix: table of supported versions
  - Migration script: `scripts/migrate-templates.ts` for batch updates
  - **Quality loop**: `bun run scripts/health/sub-loop.ts backend/services/template-version-service.ts --lifecycle codescene`
- [ ] Update `frontend/views/dashboard/certificates/template-import-export/components/ExportWizard.tsx`
  - Progress announcement: `aria-live="polite"` on progress bar
  - ARIA roles: `role="progressbar"` with `aria-valuenow`
  - Keyboard navigation: Tab through file list, Enter to select
  - Error announcement: `aria-live="assertive"` on error display
  - **Quality loop**: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/template-import-export/components/ExportWizard.tsx --lifecycle codescene`
- [ ] Create `frontend/views/dashboard/certificates/template-import-export/utils/fileProcessing.ts`
  - Chunked file reading: 10MB chunks with FileReader API
  - Streaming upload: `fetch` with `ReadableStream` body
  - Background blob processing: `Promise.all` with concurrency limit (3)
  - Web Worker for compression: separate thread for ZIP creation
  - Memory management: revoke object URLs after use
  - **Quality loop**: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/template-import-export/utils/fileProcessing.ts --lifecycle codescene`
### R4-T11: Component Tests

> **Parallelizable**: This task runs as a subagent in Wave 14 (alone — depends on all Round 4 enhancements).

- [ ] Create `test/ui/components/template-import-export/FileValidator.test.tsx`
  - Test file size limits
  - Test format validation
  - Test content validation
- [ ] Create `test/ui/components/template-import-export/ErrorRecovery.test.tsx`
  - Test retry with backoff
  - Test skip and continue
  - Test rollback on failure
- [ ] Create `test/ui/components/template-import-export/TemplateDiff.test.tsx`
  - Test side-by-side rendering
  - Test highlighted changes
  - Test merge strategy selection
- [ ] Run per-file quality loop for each file created (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts test/ui/components/template-import-export/FileValidator.test.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts test/ui/components/template-import-export/ErrorRecovery.test.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts test/ui/components/template-import-export/TemplateDiff.test.tsx --lifecycle codescene
  ```

### R4-T12: Knowledge Propagation

> **Parallelizable**: This task runs as a subagent in the Final Wave (knowledge propagation) alongside 3.6, 2.27.

- [ ] Create `docs/frontend/template-import-export-patterns.md`
  - Update `frontend/AGENTS.md` with reference
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts docs/frontend/template-import-export-patterns.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/AGENTS.md --lifecycle codescene
  ```
