# Plan 10 — Template Editor Basic: Tasks

> **Feature**: Certificate Module — Template Editor Basic Info Tab (Frontend)
> **Plan #**: 10
> **Dependencies**: Plan 5 (GraphQL API), Plan 7 (File Upload), Plan 8 (Navigation Config), Plan 9 (Category Management)
> **Execution Model**: Parallel subagents per independent task group (see dependency graph for parallelization points)
> **Quality Model**: Per-file tsgo + biome + lint + codescene via `scripts/health/sub-loop.ts --lifecycle codescene`
> **Time Budget**: 2-4 hours per task

---

## Task Dependency Graph

```
T01 (i18n type schema) ─────┐
                            ├─→ T02 (i18n AR impl)
                            ├─→ T03 (i18n EN impl)
                            ├─→ T04 (i18n namespace + registration)
                            │
T05 (shared constants) ─────┤ (CERT_CANVAS_DPI, CERT_ALLOWED_FONTS, paper presets)
                            │
T06 (GraphQL documents) ────┤ (after T04 for codegen)
                            │
T07 (Zustand store) ────────┤
                            ├─→ T08 (Zod schema)
                            │         │
                            │         ├─→ T09 (ViewModel hook)
                            │         │         │
                            │         │         ├─→ T10 (Container + switcher)
                            │         │         │         │
T11 (Basic Info form) ───────┤         │         │         │
T12 (Dimensions form) ───────┤         │         │         │
T13 (Background form) ───────┤         │         │         ├─→ T17 (desktop view)
T14 (Font Settings form) ───┤         │         │         │
T15 (ColorPickerField) ──────┤         │         │         ├─→ T18 (mobile view)
T16 (BackgroundUploadZone)──┤         │         │         │
                                        │         │         ├─→ T19 (App Router page)
                                        │         │         │
                                        │         │         └─→ T20 (integration verification)
                                        │         │                     │
                                        │         │                     └─→ T21 (knowledge propagation)
```

**Execution order**: T01 → (T02, T03 via parallel subagents) → T04 → T05 → T06 → T07 → T08 → T09 → (T11, T12, T13, T14, T15, T16 via parallel subagents) → T10 → (T17, T18 via parallel subagents) → T19 → T20 → T21

---

## Parallel Subagent Strategy

Tasks grouped by wave (each wave runs as parallel subagents):

### Wave 1: T01
- Tasks: T01 (i18n type schema)
- Rationale: No dependencies — foundational type schema all subsequent i18n tasks import

### Wave 2: T02, T03
- Tasks: T02 (AR i18n impl), T03 (EN i18n impl)
- Rationale: Both depend only on T01 (completed); AR and EN implementations are independent of each other

### Wave 3: T04, T05
- Tasks: T04 (i18n namespace registration), T05 (shared constants)
- Rationale: T04 depends on T01-T03 (completed); T05 depends only on T01 (completed); no interdependencies between T04 and T05

### Wave 4: T06
- Tasks: T06 (GraphQL documents)
- Rationale: Depends on T04 (completed); codegen requires namespace wiring before document generation

### Wave 5: T07
- Tasks: T07 (view-model types)
- Rationale: Depends on T05, T06 (completed); types must exist before ViewModel hook consumes them

### Wave 6: T08
- Tasks: T08 (ViewModel hook)
- Rationale: Depends on T04, T05, T06, T07 (all completed); central integration hook that all form sections import

### Wave 7: T09
- Tasks: T09 (Container component)
- Rationale: Depends on T08 (completed); container orchestrates form sections and responsive view switch

### Wave 8: T10, T11, T12, T13, T14
- Tasks: T10 (Basic Info form), T11 (Dimensions form), T12 (Background form), T13 (Title form), T14 (Validity Period form)
- Rationale: All depend only on T08, T09 (completed); each form section is a self-contained component with no interdependencies — maximum parallelism

### Wave 9: T15, T16
- Tasks: T15 (desktop view), T16 (mobile view)
- Rationale: Both depend on T09 (completed) and T10-T14 (completed); desktop (tabs) and mobile (accordion) views are independent tier-specific components

### Wave 10: T17
- Tasks: T17 (App Router page)
- Rationale: Depends on T09, T15, T16 (completed); page wires container into App Router with metadata

### Wave 11: T18
- Tasks: T18 (integration verification)
- Rationale: Depends on T01-T17 all complete; full-system verification across all acceptance criteria

### Final Wave: Knowledge Propagation
- Task: T19 (knowledge propagation)
- Rationale: Must run after all other tasks complete — documents patterns and prepares handoff notes

> **Subagent dispatch**: Each task in a wave is dispatched as a separate subagent. The orchestrator waits for all subagents in a wave to complete before starting the next wave.

---

## T01 — Create i18n Type Schema for Template Editor

**Estimated time**: 2.5 hours
**Depends on**: Plan 2 (Types), Plan 5 (GraphQL schema)
**Requirements**: REQ-10-01 through REQ-10-12, §3.1 (i18n keys catalog)

### Subtasks

1. **Read applicable AGENTS.md**:
   - `shared/AGENTS.md` — i18n system rules (compile-time TypeScript, function-per-key)
   - `AGENTS.md` root — path aliases, logging

2. **Read applicable instruction files**:
   - `.agents/instructions/frontend.instructions.md`

3. **Create type schema** `shared/locale/types/dashboard/certificates/templateEditor.ts`:
   - One function type per key listed in requirements.md §3 i18n table (~60 keys)
   - Keys with no params: `string`
   - Keys with params: `(max: number) => string`, `(width: number, height: number) => string`, `(min: number, max: number) => string`, `(maxSize: string) => string`
   - Interpolation keys:
     - `preview.dimensions(width, height)`: `(width: number, height: number) => string`
     - `upload.fileTooLarge(maxSize)`: `(maxSize: string) => string`
     - `validation.nameTooLong(max)`: `(max: number) => string`
     - `validation.descriptionTooLong(max)`: `(max: number) => string`
     - `validation.dimensionsRange(min, max)`: `(min: number, max: number) => string`
     - `validation.fontSizeRange(min, max)`: `(min: number, max: number) => string`
   - No pluralization needed (all counts are static labels)
   - Export the aggregate type as `CertificateTemplateEditorLabels`

4. **No separate error type file** — error keys (`error.loadFailed`, `error.notFound`, `error.permissionDenied`, `save.error`, `upload.uploadFailed`, `conflict.*`) are included directly in the `CertificateTemplateEditorLabels` type.

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts shared/locale/types/dashboard/certificates/templateEditor.ts --lifecycle codescene
```

### Instruction Verification
- Verify against `shared/AGENTS.md` — i18n compile-time TypeScript rules, function-per-key pattern
- Verify against `frontend/instructions.md` — type safety, no `any`, path aliases
- Verify against root `AGENTS.md` — no `console.*`, logging patterns

### Verification
- All ~60 keys from requirements.md §3 i18n table have corresponding type entries
- Interpolation keys have correct parameter types per requirements.md
- Error/interaction-state keys (`error.*`, `conflict.*`, `buttons.retry`, `buttons.backToList`) included
- No pluralization functions (not needed)

---

## T02 — Create Arabic i18n Implementation

**Estimated time**: 2 hours
**Depends on**: T01 (type schema exists)
> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T03.
**Requirements**: §3.1, §3.2, §3.3

### Subtasks

1. **Read applicable AGENTS.md**:
   - `shared/AGENTS.md` — Arabic translation patterns
   - `AGENTS.md` root

2. **Create** `shared/locale/ar/dashboard/certificates/templateEditor.ts`:
   - Export `dashboardCertificateTemplateEditorAr` typed as `CertificateTemplateEditorLabels`
   - One const function/constant per key matching the type schema exactly
   - Arabic translations from requirements.md §3 and design.md §10 AR column
   - Interpolation functions use template literals with the correct parameter names
   - Interaction-state keys translated (e.g., `error.loadFailed` → `"فشل تحميل القالب"`, `conflict.title` → `"تعارض الإصدار"`, etc.)
   - No pluralization functions needed

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts shared/locale/ar/dashboard/certificates/templateEditor.ts --lifecycle codescene
```

### Verification
- All ~60 keys present with Arabic translations
- Template literals use correct parameter names from requirements.md
- Interaction-state keys (`error.*`, `conflict.*`, `buttons.*`) translated to Arabic
- Type-checks pass against `CertificateTemplateEditorLabels`

---

## T03 — Create English i18n Implementation

**Estimated time**: 1.5 hours
**Depends on**: T01 (type schema exists)
> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T02.
**Requirements**: §3.1, §3.2, §3.3

### Subtasks

1. **Read applicable AGENTS.md**:
   - `shared/AGENTS.md` — English translation patterns
   - `AGENTS.md` root

2. **Create** `shared/locale/en/dashboard/certificates/templateEditor.ts`:
   - Export `dashboardCertificateTemplateEditorEn` typed as `CertificateTemplateEditorLabels`
   - One const function/constant per key matching the type schema exactly
   - English translations from requirements.md §3 and design.md §10 EN column
   - Interpolation functions use template literals with correct parameter names
   - Interaction-state keys translated (e.g., `error.loadFailed` → `"Failed to load template"`, `conflict.title` → `"Version Conflict"`, etc.)

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts shared/locale/en/dashboard/certificates/templateEditor.ts --lifecycle codescene
```

### Verification
- All ~60 keys present with English translations
- Template literals use correct parameter names
- Interaction-state keys present in English
- Type-checks pass against `CertificateTemplateEditorLabels`

---

## T04 — Create i18n Namespace Registration and Wire Exports

**Estimated time**: 1 hour
**Depends on**: T01 (type schema), T02 (AR impl), T03 (EN impl)
> **Parallelizable**: This task runs as a subagent in Wave 3 alongside T05.
**Requirements**: §3.1, §3.4

### Subtasks

1. **Read applicable AGENTS.md**:
   - `shared/AGENTS.md` — namespace registration pattern
   - `AGENTS.md` root

2. **Create namespace file** `shared/locale/namespaces/dashboard/certificates/templateEditor.namespace.ts`:
   - Use `defineNamespace("dashboard.certificateTemplateEditor", ...)` with lazy loaders for AR and EN
   - AR loader: `() => import("@/shared/locale/ar/dashboard/certificates/templateEditor").then(m => m.dashboardCertificateTemplateEditorAr)`
   - EN loader: `() => import("@/shared/locale/en/dashboard/certificates/templateEditor").then(m => m.dashboardCertificateTemplateEditorEn)`

3. **Modify** `shared/locale/namespaces/translation.ts`:
   - Add `CertificateTemplateEditor: DashboardCertificateTemplateEditor` to `Translation.Dashboard`

4. **Modify** `shared/locale/types/message.ts` (or equivalent):
   - Add `certificateTemplateEditor: CertificateTemplateEditorLabels` to `DashboardTranslations`

5. **Modify** `shared/locale/ar/messages.ts`:
   - Import `dashboardCertificateTemplateEditorAr` and include it in the `dashboardTranslations.certificateTemplateEditor` assignment

6. **Modify** `shared/locale/en/messages.ts`:
   - Import `dashboardCertificateTemplateEditorEn` and include it in the `dashboardTranslations.certificateTemplateEditor` assignment

### Quality Loop

For each modified file:
```bash
bun run scripts/health/sub-loop.ts <file> --lifecycle codescene
```

### Verification
- `bun tsgo` passes — namespace registered correctly
- Both AR and EN message files include the template editor translations
- Access pattern `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` resolves

---

## T05 — Create Shared Constants for Certificates

**Estimated time**: 1 hour
**Depends on**: T01 (i18n type schema, for label keys referenced by constants)
> **Parallelizable**: This task runs as a subagent in Wave 3 alongside T04.
**Requirements**: REQ-10-04 (DPI), REQ-10-06 (font list), design.md §7 (DPI standard), §12.8 (font list source)

### Subtasks

1. **Read applicable AGENTS.md**:
   - `shared/AGENTS.md` — shared layer rules (no imports from frontend/backend/app)
   - `AGENTS.md` root — path aliases, shared constants

2. **Read applicable instruction files**:
   - `.agents/instructions/frontend.instructions.md` (shared constants consumed by frontend)

3. **Create** `shared/constants/certificate.constants.ts`:
   - `CERT_CANVAS_DPI = 72` — DPI constant for all certificate canvas dimensions (per design.md §7, SWE Review §D)
   - `CERT_PAPER_SIZES` — map of paper size presets to their pixel dimensions at 72 DPI:
     - `A4`: `{ width: 595, height: 842 }`
     - `letter`: `{ width: 612, height: 792 }`
     - `custom`: no preset (fields are editable)
   - `CERT_ALLOWED_FONTS` — array of `{ value: string; labelKey: string }` objects:
     - `{ value: "Cairo", labelKey: "font.cairo" }`
     - `{ value: "Tajawal", labelKey: "font.tajawal" }`
     - `{ value: "Amiri", labelKey: "font.amiri" }`
     - `{ value: "Inter", labelKey: "font.inter" }`
     - `{ value: "Roboto", labelKey: "font.roboto" }`
     - `{ value: "system-default", labelKey: "font.systemDefault" }`
   - `CERT_DIMENSION_MIN = 100` — minimum canvas dimension (px)
   - `CERT_DIMENSION_MAX = 10000` — maximum canvas dimension (px)
   - `CERT_FONT_SIZE_MIN = 8` — minimum font size (px)
   - `CERT_FONT_SIZE_MAX = 72` — maximum font size (px)
   - `CERT_MAX_FILE_SIZE` — max background upload size (bytes, from config or constant)
   - `CERT_ALLOWED_FILE_TYPES` — array of allowed MIME types: `["image/png", "image/jpeg", "image/webp"]`

4. **Modify** `shared/constants/index.ts` (if barrel exists): export from `certificate.constants.ts`

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts shared/constants/certificate.constants.ts --lifecycle codescene
```

### Verification
- `CERT_CANVAS_DPI` is `72` (NOT 96 — per SWE Review §D and design.md §7)
- A4 preset: width=595, height=842 (72 DPI standard)
- Letter preset: width=612, height=792 (72 DPI standard)
- No Legal, A3, A5, or Tabloid presets (out of scope)
- `CERT_ALLOWED_FONTS` includes both Arabic and Latin fonts
- No imports from `@/frontend/**`, `@/backend/**`, or `@/app/**` (shared layer rule)
- No `console.*` — use `logger` if logging needed (unlikely for constants file)

---

## T06 — Create GraphQL Documents for Template Editor

**Estimated time**: 2 hours
**Depends on**: Plan 5 (GraphQL API complete), T04 (i18n wired for codegen)
**Requirements**: REQ-10-01, REQ-10-10, design.md §6

### Subtasks

1. **Read applicable AGENTS.md**:
  - `frontend/common/graphql/sharedDocuments/AGENTS.md` — document naming conventions, `TypedDocumentNode` pattern
  - `frontend/common/graphql/AGENTS.md` — Apollo Client v4 patterns, `useQuery` vs `useLazyQuery`
  - `AGENTS.md` root — path aliases, `id` on all objects, no `useLazyQuery`

2. **Read applicable instruction files**:
  - `.agents/instructions/frontend.instructions.md`

3. **Create** `frontend/common/graphql/sharedDocuments/certificates/templateEditor.documents.ts`:
  - Fragment: `TemplateEditorFragment` — all template fields needed for editor:
    - `id` (cache normalization), `name`, `description`, `categoryId`
    - `category { id name parentCategory { id name } }` — for breadcrumb display
    - `width`, `height`, `orientation`, `paperSize`
    - `backgroundImageUrl`, `backgroundColor`
    - `fontFamily`, `fontSize`, `textColor`
    - `status`, `version` (for optimistic locking), `createdAt`, `updatedAt`
  - Query: `templateEditorQueryDocument` — single template by ID
    - Variable: `{ id: ID! }`
    - Returns: `TemplateEditorFragment` fields
    - Type: `TypedDocumentNode<Operations.TemplateEditorQuery, Types.QueryTemplateByIdArgs>`
  - Query: `certificateCategoriesQueryDocument` — for category autocomplete options
    - Returns: `{ id, name, parentCategory { id, name } }[]`
    - If Plan 9 already exports a reusable category query document, import it instead of redeclaring
  - Mutation: `updateTemplateEditorMutationDocument` — partial update with optimistic lock
    - Variables: `{ id: ID!, input: TemplateEditorUpdateInput!, expectedVersion: Int }`
    - `TemplateEditorUpdateInput` fields (all optional — partial update): `name`, `description`, `categoryId`, `width`, `height`, `orientation`, `paperSize`, `backgroundImageUrl`, `backgroundColor`, `fontFamily`, `fontSize`, `textColor`
    - Returns: updated template with `TemplateEditorFragment` fields (includes new `version`)
    - Type: `TypedDocumentNode<Operations.UpdateTemplateEditorMutation, Types.MutationUpdateTemplateArgs>`
  - `id` field on all object types for Apollo cache normalization
  - NO `certificateTitle`, `certificateTitleFontSize`, `certificateTitleFontFamily`, `certificateTitleColor`, `defaultValidityPeriodDays`, `defaultValidityExpiryType` — these are out of scope for Plan 10

4. **Create** `frontend/common/graphql/sharedDocuments/certificates/index.ts` (barrel file):
  - Export all template editor documents from the barrel
  - Pattern: `export * from "./templateEditor.documents"`

5. **Run codegen**:
  - `bun run generate:gqlSchema && bun codegen`

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/common/graphql/sharedDocuments/certificates/templateEditor.documents.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/graphql/sharedDocuments/certificates/index.ts --lifecycle codescene
```

### Verification
- Fragment includes ALL editable fields from design.md §6 (NO certificate title or validity period fields)
- `id` field on all object types (Apollo cache normalization)
- `expectedVersion: Int` present on mutation (optimistic locking per SWE Review §A)
- Codegen passes without errors
- No `useLazyQuery` usage in documents (query documents are consumed via `useQuery` with `skip`)
- `certificateCategoriesQueryDocument` declared or imported from Plan 9
- File is at `frontend/common/graphql/sharedDocuments/certificates/templateEditor.documents.ts` (NOT `cert/` sub-dir)

---

## T07 — Create Template Editor View-Model Types

**Estimated time**: 1 hour
**Depends on**: T05 (GraphQL codegen types), T06 (store for state types)
**Requirements**: design.md §5

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md` — view-model type patterns
   - `AGENTS.md` root — canonical type pattern

2. **Create** `frontend/common/views/dashboard/certificates/templateEditor/types/index.ts`:
   - `TemplateEditorViewModel` — the full view model interface (all fields from design.md §5 return table)
   - Includes: `templateId`, `formData`, `originalData`, `isDirty`, `isSaving`, `isUploadingBackground`, `autoSaveEnabled`, `validationErrors`, `activeTab`, `canEdit`, `labels`, and all action handlers
   - `PaperSizeOption` — `{ value: string; label: string; width: number; height: number }`
   - `FontOption` — `{ value: string; label: string }`
   - `ColorPreset` — `{ name: string; value: string }`

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templateEditor/types/index.ts --lifecycle codescene
```

### Verification
- `TemplateEditorViewModel` includes all fields from design.md §5
- Action handler signatures match the store actions + mutation handlers
- No duplicate type definitions that conflict with `backend/types/`

---

## T08 — Create ViewModel Hook

**Estimated time**: 3 hours
**Depends on**: T04 (i18n), T05 (GraphQL documents), T06 (store), T07 (types)
**Requirements**: REQ-10-01 through REQ-10-12, design.md §5

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md` — ViewModel hook patterns, Apollo data fetching
   - `frontend/common/graphql/AGENTS.md` — `useQuery` + `useMutation` patterns
   - `AGENTS.md` root — logging, Apollo cache update patterns

2. **Read applicable instruction files**:
   - `.agents/instructions/frontend.instructions.md`

3. **Create** `frontend/common/views/dashboard/certificates/templateEditor/useTemplateEditorViewModel.ts`:
   - Accept `templateId: string` as parameter
   - Uses `useQuery(templateEditorQueryDocument, { variables: { id: templateId }, skip: !templateId })` to load template
   - On data received: calls `store.loadTemplate(data.template)` to populate form state
   - Uses `useMutation(updateTemplateEditorMutationDocument)` for save
   - `onSave()`: validates all fields (per §7 validation rules), calls mutation with `formData`, on success shows snackbar with `labels.snackbar.saved(name)`, updates `originalData` from mutation result, sets `isDirty` false
   - `onDiscard()`: calls `store.discardChanges()` — resets form to `originalData`, clears `backgroundImageFile`
   - `onFieldChange(field, value)`: calls `store.updateField(field, value)`, validates that field, clears validation error if valid
   - `onBackgroundFileSelected(file)`: calls `store.setBackgroundImageFile(file)`, triggers upload via Plan 7 storage service mutation (per §8), on success updates `backgroundImageId` and `backgroundImageUrl`, on failure shows snackbar with `labels.snackbar.backgroundUploadError(fileName)`
   - `onAutoSaveToggle(enabled)`: calls `store.setAutoSaveEnabled(enabled)`, starts/stops 30s debounced auto-save timer (per DD-05)
   - `autoSave()`: if `isDirty`, calls `onSave()` silently — no snackbar on success, just `labels.snackbar.autoSaveSaved` notification (optional toast)
   - `canEdit`: `useUserStore().hasPermission(AppPermission.CERTIFICATES_TEMPLATES_EDIT)` OR template status is "draft" (per REQ-10-11)
   - Navigation guard: `useEffect` on `isDirty` — registers `beforeunload` event listener when dirty, and intercepts route changes (per DD-07)
   - `onNavigateAway()`: if `isDirty`, show `discardDialog` confirmation; on confirm: `onDiscard()` then navigate; on cancel: stay
   - Labels from `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)`
   - All mutation handlers return `Promise<void>` and show success/error snackbar with localized messages
   - Returns `TemplateEditorViewModel`

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templateEditor/useTemplateEditorViewModel.ts --lifecycle codescene
```

### Verification
- No `useLazyQuery` — uses `useQuery` with `skip`
- `onSave` validates all fields before mutation (per §7 validation rules)
- Auto-save: 30s debounce timer, only saves when `isDirty` (per DD-05)
- Navigation guard: `beforeunload` + route interception (per DD-07)
- `canEdit` permission check + template status check (per REQ-10-11)
- All error messages use localized keys
- No `console.*`

---

## T09 — Create Container Component with Navigation Guard

**Estimated time**: 2 hours
**Depends on**: T08 (ViewModel hook)
**Requirements**: REQ-10-01, REQ-10-09, REQ-10-10, design.md §3

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md` — Container pattern, `RequirePermission`
   - `app/AGENTS.md` — App Router page conventions
   - `AGENTS.md` root

2. **Read applicable instruction files**:
   - `.agents/instructions/frontend.instructions.md`

3. **Create** `frontend/common/views/dashboard/certificates/templateEditor/TemplateEditorContainer.tsx`:
   - Accept `templateId: string` as prop (from page params)
   - Calls `useTemplateEditorViewModel(templateId)`
   - Wraps content in `<RequirePermission permissions={[AppPermission.CERTIFICATES_TEMPLATES_EDIT]}>` (view-only users can see the editor in read-only mode if permitted; editing is gated by `canEdit` in the ViewModel)
   - Renders `<ResponsiveViewSwitch desktop={...} mobile={...} />` passing the ViewModel
   - Renders the Save/Discard action bar at container level (shared across tiers, per §3)
   - Renders the Discard Confirmation Dialog at container level
   - Navigation guard logic is in the ViewModel's `useEffect`, but the Container renders the UI for the discard dialog

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templateEditor/TemplateEditorContainer.tsx --lifecycle codescene
```

### Verification
- Container uses `RequirePermission` wrapper
- Save/Discard action bar rendered at container level (shared across tiers)
- Discard Confirmation Dialog rendered at container level
- No `useMediaQuery` in container

---

## T10 — Create Basic Info Form Section

**Estimated time**: 2 hours
**Depends on**: T08 (ViewModel), T09 (Container)
> **Parallelizable**: This task runs as a subagent in Wave 8 alongside T11, T12, T13, T14.
**Requirements**: REQ-10-02, REQ-10-03, design.md §7.1

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md` — form section patterns
   - `frontend/AGENTS.md` — MUI v9 form rules, `TextField` usage, no style props
   - `AGENTS.md` root — theme palette, i18n

2. **Read applicable instruction files**:
   - `.agents/instructions/frontend.instructions.md`

3. **Create** `frontend/common/views/dashboard/certificates/templateEditor/sections/BasicInfoSection.tsx`:
   - Props: `viewModel: TemplateEditorViewModel`
   - Fields:
     - Name: MUI `TextField` (required, max 255 chars), helper text `labels.fields.name.helperText(255)`, error if empty, error text `labels.validation.nameRequired`
     - Description: MUI `TextField` multiline (optional, max 1000 chars), rows 4
     - Category: `CategoryPicker` (from Plan 09 T11), value is `formData.categoryId`, onChange calls `viewModel.onFieldChange("categoryId", value)`
   - All fields disabled if `!viewModel.canEdit`
   - Validation errors displayed below each field using MUI `TextField` `error` + `helperText`
   - onChange handlers call `viewModel.onFieldChange(field, value)`
   - No hardcoded strings — all labels from `viewModel.labels`

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templateEditor/sections/BasicInfoSection.tsx --lifecycle codescene
```

### Verification
- `CategoryPicker` imported from Plan 09 (cross-plan dependency confirmed)
- All fields disabled when `!canEdit`
- Helper text uses interpolation `(maxLength: number) => string`
- No hardcoded user-facing strings
- No style props on `TextField` — use `sx` prop

---

## T11 — Create Dimensions and Orientation Form Section

**Estimated time**: 2.5 hours
**Depends on**: T08 (ViewModel), T09 (Container)
> **Parallelizable**: This task runs as a subagent in Wave 8 alongside T10, T12, T13, T14.
**Requirements**: REQ-10-04, REQ-10-05, design.md §7.2

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md` — form section patterns
   - `frontend/AGENTS.md` — MUI v9 form rules
   - `AGENTS.md` root

2. **Read applicable instruction files**:
   - `.agents/instructions/frontend.instructions.md`

3. **Create** `frontend/common/views/dashboard/certificates/templateEditor/sections/DimensionsSection.tsx`:
   - Fields:
     - Paper Size: MUI `Select` dropdown with options: A4, Letter, Legal, A3, A5, Tabloid, Custom — selecting a preset auto-fills width/height
     - Orientation: MUI `ToggleButtonGroup` (Portrait, Landscape) — selecting orientation swaps width/height values
     - Width: MUI `TextField` type "number" (min 100, max 5000), unit label "px"
     - Height: MUI `TextField` type "number" (min 100, max 5000), unit label "px"
     - Helper text: `labels.fields.dimensions.helperText("px")`
   - Validation:
     - Width/Height: `>= 100` and `<= 5000` — error text `labels.validation.betweenValues(100, 5000)`
     - Must be `> 0` — error text `labels.validation.greaterThanZero`
   - Paper size preset selection auto-updates width/height fields
   - Custom selection allows manual width/height entry
   - Orientation toggle swaps width/height values (e.g., 595×842 portrait → 842×595 landscape)
   - All fields disabled if `!canEdit`
   - No hardcoded strings

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templateEditor/sections/DimensionsSection.tsx --lifecycle codescene
```

### Verification
- Paper size presets auto-fill correct dimensions (A4 = 595×842, Letter = 612×792, etc.)
- Orientation toggle swaps width/height values
- Validation: `betweenValues(100, 5000)` and `greaterThanZero`
- Helper text uses interpolation `(unit: string) => string`
- No hardcoded strings or numeric constants in strings

---

## T12 — Create Background Form Section

**Estimated time**: 3 hours
**Depends on**: T08 (ViewModel), T09 (Container)
> **Parallelizable**: This task runs as a subagent in Wave 8 alongside T10, T11, T13, T14.
**Requirements**: REQ-10-06, REQ-10-07, design.md §7.3, §8

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md` — form patterns, file upload
   - `frontend/AGENTS.md` — MUI v9
   - `AGENTS.md` root

2. **Read applicable instruction files**:
   - `.agents/instructions/frontend.instructions.md`

3. **Create** `frontend/common/views/dashboard/certificates/templateEditor/sections/BackgroundSection.tsx`:
   - Fields:
     - Background Color: MUI color picker (or `TextField` type "color" + hex input) — value is `formData.backgroundColor`, onChange calls `viewModel.onFieldChange("backgroundColor", value)`
     - Background Image: Drag-and-drop file upload zone (MUI `Box` with `onDrop` handler) + preview thumbnail + "Remove" button
     - Color presets: row of preset color swatches from `viewModel.labels.fields.background.colorPresets` (or constant array)
   - Validation:
     - Color: valid hex format (`/^#[0-9A-Fa-f]{6}$/`) — error text `labels.validation.invalidColor`
     - File name: max 255 chars — error text `labels.validation.fileNameTooLong(255)`
   - File upload flow per design.md §8:
     - User drops file → `viewModel.onBackgroundFileSelected(file)`
     - Shows upload progress indicator while `isUploadingBackground`
     - On success: preview image displayed + `backgroundImageId` stored
     - On failure: snackbar `labels.snackbar.backgroundUploadError(fileName)`
   - "Remove" button: clears `backgroundImageId`, `backgroundImageUrl`, and `backgroundImageFile`
   - All fields disabled if `!canEdit`
   - Drag-and-drop uses HTML5 `onDrop` / `onDragOver` events (no external library per §8)

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templateEditor/sections/BackgroundSection.tsx --lifecycle codescene
```

### Verification
- File upload flow matches design.md §8 (drop → preview → upload → success/fail)
- Drag-and-drop uses native HTML5 events (no extra DnD library)
- Color validation: hex regex, error message from i18n
- Upload progress indicator shown during `isUploadingBackground`
- No hardcoded strings

---

## T13 — Create Certificate Title Form Section

**Estimated time**: 1.5 hours
**Depends on**: T08 (ViewModel), T09 (Container)
> **Parallelizable**: This task runs as a subagent in Wave 8 alongside T10, T11, T12, T14.
**Requirements**: REQ-10-08, design.md §7.4

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md` — form patterns
   - `frontend/AGENTS.md` — MUI v9
   - `AGENTS.md` root

2. **Read applicable instruction files**:
   - `.agents/instructions/frontend.instructions.md`

3. **Create** `frontend/common/views/dashboard/certificates/templateEditor/sections/CertificateTitleSection.tsx`:
   - Fields:
     - Title Text: MUI `TextField` (max 200 chars) — value is `formData.certificateTitle`
     - Font Family: MUI `Select` — options from a constant font list (or a shared font list from `shared/constants/` if available)
     - Font Size: MUI `TextField` type "number" (min 8, max 72) — value is `formData.certificateTitleFontSize`
     - Font Color: MUI color picker — value is `formData.certificateTitleColor`
   - Helper text: `labels.fields.certificateTitle.helperText`
   - Validation:
     - Font size: `>= 8` and `<= 72` — `labels.validation.betweenValues(8, 72)`
     - Color: valid hex format — `labels.validation.invalidColor`
   - All fields disabled if `!canEdit`
   - No hardcoded strings

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templateEditor/sections/CertificateTitleSection.tsx --lifecycle codescene
```

### Verification
- Font family select populated from a shared constant (not hardcoded in component)
- Font size validation: `betweenValues(8, 72)`
- Color validation: hex regex
- No hardcoded strings

---

## T14 — Create Default Validity Period Form Section

**Estimated time**: 1.5 hours
**Depends on**: T08 (ViewModel), T09 (Container)
> **Parallelizable**: This task runs as a subagent in Wave 8 alongside T10, T11, T12, T13.
**Requirements**: REQ-10-08, design.md §7.5

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md` — form patterns
   - `frontend/AGENTS.md` — MUI v9
   - `AGENTS.md` root

2. **Read applicable instruction files**:
   - `.agents/instructions/frontend.instructions.md`

3. **Create** `frontend/common/views/dashboard/certificates/templateEditor/sections/ValidityPeriodSection.tsx`:
   - Fields:
     - Expiry Type: MUI `ToggleButtonGroup` or `RadioGroup` — three options: Fixed Date, Rolling Days, No Expiry — labels from `labels.fields.validityPeriod.expiryType.*`
     - Duration Days: MUI `TextField` type "number" (visible only when expiry type is "rollingDays") — min 1, max 3650
     - Helper text: `labels.fields.validityPeriod.durationHelper(value)` — shows "X days" interpolating the current input value
   - Validation:
     - Duration days: `>= 1` and `<= 3650` — `labels.validation.betweenValues(1, 3650)`, `labels.validation.greaterThanZero`
   - Expiry type change: show/hide duration days field
   - All fields disabled if `!canEdit`
   - No hardcoded strings

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templateEditor/sections/ValidityPeriodSection.tsx --lifecycle codescene
```

### Verification
- Expiry type toggle reveals/hides duration days field
- Duration helper text uses interpolation `(value: string) => string`
- Validation: `betweenValues(1, 3650)` and `greaterThanZero`
- No hardcoded strings

---

## T15 — Create Desktop Template Editor View

**Estimated time**: 2 hours
**Depends on**: T09 (Container), T10-T14 (form sections)
> **Parallelizable**: This task runs as a subagent in Wave 9 alongside T16.
**Requirements**: REQ-10-01, REQ-10-02, design.md §3, §13

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md` — desktop view assembly, `DesktopPageHeader`
   - `frontend/AGENTS.md` — MUI v9, `Tab` / `Tabs` component
   - `AGENTS.md` root

2. **Read applicable instruction files**:
   - `.agents/instructions/frontend.instructions.md`

3. **Create** `frontend/desktop/views/dashboard/certificates/templateEditor/templateEditorView.desktop.tsx`:
   - `DesktopPageHeader` with title (`labels.pageTitle(templateName)` interpolated), back button to templates list
   - MUI `Tabs` component for tab navigation (per DD-01): tabs are Basic Info, Dimensions, Background, Certificate Title, Validity Period — labels from `labels.tabs.*`
   - Active tab content rendered from form sections (T10-T14)
   - Save/Discard action bar rendered below tabs (from Container, but the desktop view positions it)
   - Auto-save toggle in the header (MUI `Switch` with label `labels.autoSave.toggle`)
   - All form fields disabled if `!canEdit` (read-only mode for non-editors)
   - No `useMediaQuery` — desktop-only component

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templateEditor/templateEditorView.desktop.tsx --lifecycle codescene
```

### Verification
- MUI `Tabs` + `Tab` used (not accordion) for desktop per DD-01
- Active tab state managed by ViewModel `activeTab`
- Auto-save toggle in header
- Back button navigation uses `router.back()` or explicit route
- No `useMediaQuery`
- No hardcoded strings

---

## T16 — Create Mobile Template Editor View

**Estimated time**: 2 hours
**Depends on**: T09 (Container), T10-T14 (form sections)
> **Parallelizable**: This task runs as a subagent in Wave 9 alongside T15.
**Requirements**: REQ-10-01, REQ-10-02, design.md §3, §13

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md` — mobile view patterns, `MobilePageContainer`, `MobilePageHeader`
   - `frontend/AGENTS.md` — MUI v9, `Accordion` / `AccordionSummary` / `AccordionDetails`
   - `AGENTS.md` root

2. **Read applicable instruction files**:
   - `.agents/instructions/frontend.instructions.md`

3. **Create** `frontend/mobile/views/dashboard/certificates/templateEditor/templateEditorView.mobile.tsx`:
   - `MobilePageHeader` with title (`labels.pageTitle(templateName)`), back button
   - MUI `Accordion` components for each section (per DD-01: accordion on mobile): Basic Info, Dimensions, Background, Certificate Title, Validity Period — labels from `labels.tabs.*`
   - Only one accordion expanded at a time (controlled by `activeTab` in the store)
   - Save/Discard action bar as `MobileActionBar` at the bottom (sticky)
   - Auto-save toggle in the header (MUI `Switch`)
   - All form fields disabled if `!canEdit`
   - No `useMediaQuery` — mobile-only component

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/templateEditor/templateEditorView.mobile.tsx --lifecycle codescene
```

### Verification
- MUI `Accordion` used (not tabs) for mobile per DD-01
- Only one accordion expanded at a time
- Save/Discard as `MobileActionBar` (sticky bottom)
- Auto-save toggle in header
- No `useMediaQuery`
- No hardcoded strings

---

## T17 — Create App Router Page

**Estimated time**: 1 hour
**Depends on**: T09 (Container), T15 (desktop view), T16 (mobile view)
**Requirements**: REQ-10-01, design.md §13

### Subtasks

1. **Read applicable AGENTS.md**:
   - `app/AGENTS.md` — App Router page conventions, dynamic routes, `generateMetadata`
   - `shared/AGENTS.md` — `getTranslations` pattern
   - `AGENTS.md` root

2. **Read applicable instruction files**:
   - `.agents/instructions/frontend.instructions.md`

3. **Create** `app/(dashboard)/certificates/templates/[id]/page.tsx`:
   - Async server component
   - Extract `id` from `params` — this is the template ID
   - `getLocale()` to get current locale
   - `generateMetadata()` returns title from `getTranslations(locale).dashboardTranslations.certificateTemplateEditor.pageTitle("")`
   - `getServerUserContext()` — redirect to login if no userId
   - `requirePermissionForPage(userId, [AppPermission.CERTIFICATES_TEMPLATES_VIEW], locale, context)` — view permission is sufficient to see the editor (editing gated by `canEdit` in the ViewModel)
   - Renders `<TemplateEditorContainer templateId={id} />`
   - Without permission: user redirected to forbidden page

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts app/\(dashboard\)/certificates/templates/[id]/page.tsx --lifecycle codescene
```

### Verification
- Page is a server component (no `"use client"`)
- Dynamic route `[id]` parameter extracted correctly
- `generateMetadata` uses `getTranslations` for translated title
- `requirePermissionForPage` uses CERTIFICATES_TEMPLATES_VIEW (not _EDIT — editing gated by ViewModel)
- Container rendered with `templateId` prop

---

## T18 — Integration Verification

**Estimated time**: 1 hour
**Depends on**: T01-T17 all complete
**Requirements**: All acceptance criteria (AC-01 through AC-12)

### Subtasks

1. **Run per-file quality loop** (full progressive chain: tsgo → biome → lint → codescene) for each template editor file:
   ```bash
   bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templateEditor/ --lifecycle codescene
   bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templateEditor/ --lifecycle codescene
   bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/templateEditor/ --lifecycle codescene
   bun run scripts/health/sub-loop.ts frontend/common/stores/templateEditorStore.ts --lifecycle codescene
   bun run scripts/health/sub-loop.ts frontend/common/graphql/sharedDocuments/cert/templateEditor-documents.ts --lifecycle codescene
   bun run scripts/health/sub-loop.ts shared/locale/types/dashboard/certificates/templateEditor.ts --lifecycle codescene
   bun run scripts/health/sub-loop.ts shared/locale/ar/dashboard/certificates/templateEditor.ts --lifecycle codescene
   bun run scripts/health/sub-loop.ts shared/locale/en/dashboard/certificates/templateEditor.ts --lifecycle codescene
   ```

4. **Review acceptance criteria** from requirements.md §5:
   - AC-01: Template editor loads template by ID
   - AC-02: All basic info fields editable and validated
   - AC-03: Dimensions and orientation auto-fill and swap
   - AC-04: Background image upload via drag-drop
   - AC-05: Certificate title fields editable
   - AC-06: Validity period with expiry type branching
   - AC-07: Save persists via mutation
   - AC-08: Discard resets to original
   - AC-09: Auto-save toggle with 30s debounce
   - AC-10: Navigation guard when dirty
   - AC-11: Read-only mode for non-editors
   - AC-12: i18n all keys present

### Verification
- All AC items pass
- `bun tsgo` clean
- `bun biome:check` clean on all template editor files
- Lint queue returns exitCode 0
- No hardcoded user-facing strings
- No `useLazyQuery` in any file
- No `console.*` calls
- `CategoryPicker` from Plan 09 imported correctly (cross-plan dependency verified)

---

## T19 — Knowledge Propagation

**Estimated time**: 1 hour
**Depends on**: T18 complete
**Requirements**: §3 (Knowledge Base Updates), design.md §14

### Subtasks

1. **Document patterns for future plans**:
   - Template editor form pattern: tabs (desktop) vs accordion (mobile), Zustand dirty tracking, auto-save debounce, navigation guard — note for `frontend/COMPONENT_PATTERNS.md`
   - Form validation pattern: per-field validation in ViewModel, error map in Zustand store — note for future form-heavy plans
   - Background upload flow: drag-drop + signed URL via Plan 7 storage service mutation — note for `frontend/IMPLEMENTATION_LEARNINGS.md`
   - Do NOT create markdown summary files

2. **Update session todos**: Ensure every task in this plan is marked `done` in the session SQLite `todos` table.

3. **Prepare handoff notes for Plan 11 (Template Editor Layout)**:
   - The Zustand store (`useTemplateEditorStore`) is the source of truth for template form data
   - Plan 11 should extend the store with layout-related fields (element positioning, element properties)
   - The `TemplateEditorViewModel` pattern (hook returning a ViewModel interface) is established here
   - The `activeTab` field can be extended with additional tabs ("Layout", "Elements", etc.)
   - List all exported store fields, actions, and ViewModel return shape

4. **Prepare handoff notes for Plan 15 (Preview & Publishing)**:
   - The editor Zustand store (`useTemplateEditorStore`) contains the form data needed for preview
   - The `formData` field has all background and title settings
   - Plan 15's preview reads from this store (no additional GraphQL query needed for preview data)

5. **Prepare AGENTS.md update notes** (for Plan 21 to incorporate):
   - `frontend/common/stores/AGENTS.md`: note about `File` in `useRef` pattern for file upload state (not in Zustand serializable state)
   - `frontend/views/AGENTS.md`: note about tabs vs accordion per tier pattern
   - `frontend/common/graphql/sharedDocuments/AGENTS.md`: example of editor query + update mutation pattern with all editable fields

6. **Do NOT create summary markdown files** — per `AGENTS.md` rules. Knowledge transfer via inline comments + session todos + design.md/tasks.md files.

### Verification
- All session todos for Plan 10 are `done`
- No `.md` summary files created in the repo
- `design.md` interface contracts match the implemented component props and ViewModel returns
- Plan 11 has sufficient information to extend the Zustand store and ViewModel
- Plan 15 has sufficient information to read from the editor store for preview

---

## T20 — Create useEditorStore Zustand Store

> **File**: `frontend/stores/cert/templateEditorStore.ts`
> **Depends On**: T06 (base store), T07 (types)
> **Time Budget**: 1-2 hours

### Subtasks

1. Create `frontend/stores/cert/templateEditorStore.ts`
2. Define `TemplateSnapshot` type (deep clone + timestamp + actionLabel)
3. Implement `EditorState` interface per design §12.12 with all fields and actions
4. Implement undo/redo stacks with `maxHistorySize` enforcement (shift oldest when full)
5. Implement `setZoom` with clamping to `[minZoom, maxZoom]`
6. Implement `toggleGrid`, `toggleSnap` actions
7. Implement panel actions (`setActiveLeftPanel`, `setActiveRightPanel`, `setLeftPanelWidth`, `setRightPanelWidth`)
8. Implement `setSelectedElement` with id validation (must exist in template elements; null = deselect)
9. Implement `pushUndo` that snapshots current state before mutation
10. Wire `save()` action to clear `isDirty` + set `lastSavedAt` on success

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/stores/cert/templateEditorStore.ts --lifecycle codescene
```

### Verification
- `bun tsgo` passes with the new store types
- Undo/redo stack size never exceeds `maxHistorySize`
- `setZoom` never returns values outside `[minZoom, maxZoom]`
- Store is non-persisted (no `persist` middleware)

---

## T21 — Create Keyboard Shortcut Handler Hook

> **File**: `frontend/views/dashboard/cert/templates/editor/useEditorShortcuts.ts`
> **Depends On**: T20 (store)
> **Time Budget**: 1-2 hours

### Subtasks

1. Create `frontend/views/dashboard/cert/templates/editor/useEditorShortcuts.ts`
2. Define hook props: `{ onSave: () => void; onDeleteElement: () => void; isModalOpen: () => boolean }`
3. Register single `keydown` listener on `window`
4. Implement all shortcuts from design §12.13 (Ctrl+S, Ctrl+Z, Ctrl+Y/Ctrl+Shift+Z, Ctrl++/=/- , Ctrl+0, Ctrl+G, Ctrl+Shift+S, Escape, Delete/Backspace)
5. Call `preventDefault()` for all Ctrl+ combos
6. Suppress text-editing shortcuts when focus is in `input`, `textarea`, or `[contenteditable]` (only Escape + Ctrl+S active)
7. Disable shortcuts when `isModalOpen()` returns true
8. Cleanup listener on unmount

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/useEditorShortcuts.ts --lifecycle codescene
```

### Verification
- Ctrl+S triggers save and prevents browser save dialog
- Undo/redo are no-ops when stacks empty
- Delete does nothing when cursor is in a text field
- All shortcuts disabled when a modal dialog is open

---

## T22 — Create TemplateEditorToolbar Component

> **File**: `frontend/views/dashboard/cert/templates/editor/EditorToolbar.tsx`
> **Depends On**: T20 (store), T21 (shortcuts)
> **Time Budget**: 2-3 hours

### Subtasks

1. Create `frontend/views/dashboard/cert/templates/editor/EditorToolbar.tsx`
2. Implement `TemplateEditorToolbarProps` interface per design §12.9
3. MUI `AppBar` (`position="sticky"`, `color="default"`, `elevation={1}`) with single `Toolbar`
4. Left region: template name (readonly Typography) + "Edited" Badge when `isDirty`
5. Center region: Save, Undo (disabled when `!canUndo`), Redo (disabled when `!canRedo`), Divider, Zoom Out, Zoom %, Zoom In, Reset, Divider, Grid Toggle, Snap Toggle
6. Right region: Preview button (outlined), Publish button (contained, disabled when `isDirty`)
7. Every IconButton has `aria-label` + `Tooltip`
8. Responsive: mobile wraps to second row; less-used buttons collapse into `More` menu (`IconButton` + `Menu`)
9. Tablet: Publish button becomes icon-only

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/EditorToolbar.tsx --lifecycle codescene
```

### Verification
- Toolbar renders all buttons with correct disabled states
- "Edited" badge shows only when `isDirty === true`
- Mobile layout wraps and shows More menu
- No `console.*` — use `logger` if logging needed

---

## T23 — Create TemplateEditorLayout Component

> **File**: `frontend/views/dashboard/cert/templates/editor/EditorLayout.tsx`
> **Depends On**: T20 (store)
> **Time Budget**: 2-3 hours

### Subtasks

1. Install `react-resizable-panels` if not present: `bun add react-resizable-panels`
2. Create `frontend/views/dashboard/cert/templates/editor/EditorLayout.tsx`
3. Implement `TemplateEditorLayoutProps` with `leftPanelContent`, `centerPanelContent`, `rightPanelContent` ReactNode props
4. Use `PanelGroup` with 3 panels: Left (280px default, 200-400px range), Center (flex 1), Right (320px default, 240-500px range)
5. Style `PanelResizeHandle` — 4px wide, `cursor="col-resize"`, hover bg `theme.palette.action.hover`
6. Left panel: MUI `Tabs` (Elements | Layers | Variables), active tab from store `activeLeftPanel`
7. Right panel: MUI `Tabs` (Properties | Style | History), active tab from store `activeRightPanel`
8. Persist panel widths to store on resize (`setLeftPanelWidth`, `setRightPanelWidth`)
9. Tablet: left panel collapsible via toggle button; right panel becomes `Drawer` (anchor="right", variant="temporary")
10. Mobile: panels stack vertically as `Accordion` collapsible sections via vertical `Stack`
11. Use `useMediaQuery(theme.breakpoints)` at layout level for tier switching (permitted at tier boundary)

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/EditorLayout.tsx --lifecycle codescene
```

### Verification
- Panels resize within min/max bounds
- Panel widths persist to store (session-only)
- Tab switching updates store active panel
- Mobile stacks vertically with accordions
- `react-resizable-panels` handles available in bundle

---

## T24 — Create TemplateEditorStatusBar Component

> **File**: `frontend/views/dashboard/cert/templates/editor/EditorStatusBar.tsx`
> **Depends On**: T20 (store)
> **Time Budget**: 1-2 hours

### Subtasks

1. Create `frontend/views/dashboard/cert/templates/editor/EditorStatusBar.tsx`
2. Implement `TemplateEditorStatusBarProps` per design §12.11
3. Fixed bottom bar: height 28px, `position="fixed"`, `bottom: 0`, `left: 0`, `right: 0`
4. Background `theme.palette.background.default`, top border `1px solid theme.palette.divider`
5. Left: selected element type + name (or "No selection")
6. Center: cursor coordinates `x: ${cursorX.toFixed(1)}, y: ${cursorY.toFixed(1)}`
7. Right: `${zoomLevel}% · Grid ${gridSize}px · Snap: On/Off`
8. Typography `variant="caption"`, `color="text.secondary"`
9. Hidden on mobile via `useMediaQuery(theme.breakpoints.down('md'))` returning `null`
10. Tablet: hidden when keyboard open (via `visualViewport` resize listener)

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/EditorStatusBar.tsx --lifecycle codescene
```

### Verification
- Status bar shows correct selection info, cursor coords, zoom, grid, snap
- Hidden on mobile
- Reads from store via `useEditorStore` selectors

---

## T27 — Quality Loop for All Editor Chrome Files

> **Files**: All files created in T20–T24
> **Depends On**: T20, T21, T22, T23, T24
> **Time Budget**: 1-2 hours

### Subtasks

1. Run per-file quality loop (full progressive chain: tsgo → biome → lint → codescene) for each editor chrome file — see the Quality Loop block below
2. Fix any type/lint/biome/codescene issues in editor chrome files
3. Verify no regression in existing tests: `bun run test`

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/stores/cert/templateEditorStore.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/useEditorShortcuts.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/EditorToolbar.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/EditorLayout.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/EditorStatusBar.tsx --lifecycle codescene
```

### Verification
- Per-file quality loop (`sub-loop.ts --lifecycle codescene`) passes clean for all editor chrome files
- All CodeScene health checks pass for editor chrome files
- No new SonarQube duplications introduced

---

## T28 — Knowledge Propagation for Editor Chrome

> **Depends On**: T27 (quality gates pass)
> **Time Budget**: 1-2 hours

### Subtasks

1. Document the `useEditorStore` undo/redo pattern — this is the first undo/redo store in the codebase; pattern propagates to Plans 11-15
2. Add inline comments in `templateEditorStore.ts` explaining the `TemplateSnapshot` deep-clone strategy and `maxHistorySize` shift-on-overflow behavior
3. Document the `react-resizable-panels` integration pattern in `frontend/COMPONENT_PATTERNS.md` (append-only — no modifications to existing content)
4. Document the keyboard shortcut hook pattern (`useEditorShortcuts`) for reuse in Plans 11-15 (canvas shortcuts, element-specific shortcuts)
5. Add to `frontend/IMPLEMENTATION_LEARNINGS.md` (append-only): note the `Ctrl+Shift+S` vs `Ctrl+S` disambiguation and the text-field suppression strategy
6. Verify `design.md` §12.9–§12.13 interface contracts match the implemented component props and store actions
7. Confirm Plan 11 has sufficient information to: extend the store with canvas-specific state, consume `zoomLevel`/`gridVisible`/`snapEnabled` from store, write cursor coordinates to store for status bar
8. Confirm Plan 15 has sufficient information to: read `isDirty` + `canPublish` from store, call `save()` before publish, open the publish dialog from the toolbar's Publish button
9. **Do NOT create summary markdown files** — per `AGENTS.md` rules; knowledge transfer via inline comments + session todos + design.md/tasks.md

### Verification
- All session todos for editor chrome tasks are `done`
- No `.md` summary files created in the repo
- `design.md` §12.9–§12.13 interface contracts match the implemented component props and store shapes
- Plan 11 has sufficient information to extend the store and consume editor chrome state
- Plan 15 has sufficient information to integrate the Publish button

---

## Instruction File & AGENTS.md Discovery Summary

| Task | Files Created/Modified | AGENTS.md to Read | Instructions to Read |
|---|---|---|---|
| T01 | `shared/locale/types/dashboard/certificates/templateEditor.ts`, error types | `shared/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T02 | `shared/locale/ar/dashboard/certificates/templateEditor.ts`, AR errors | `shared/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T03 | `shared/locale/en/dashboard/certificates/templateEditor.ts`, EN errors | `shared/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T04 | `shared/locale/namespaces/.../templateEditor.namespace.ts`, `translation.ts`, `message.ts`, `ar/messages.ts`, `en/messages.ts` (modify) | `shared/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T05 | `frontend/common/graphql/sharedDocuments/cert/templateEditor-documents.ts`, `cert/index.ts` (modify) | `frontend/common/graphql/sharedDocuments/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T06 | `frontend/common/stores/templateEditorStore.ts` | `frontend/common/stores/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T07 | `frontend/common/views/dashboard/certificates/templateEditor/types/index.ts` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T08 | `frontend/common/views/dashboard/certificates/templateEditor/useTemplateEditorViewModel.ts` | `frontend/views/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T09 | `frontend/common/views/dashboard/certificates/templateEditor/TemplateEditorContainer.tsx` | `frontend/views/AGENTS.md`, `app/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T10 | `frontend/common/views/dashboard/certificates/templateEditor/sections/BasicInfoSection.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T11 | `frontend/common/views/dashboard/certificates/templateEditor/sections/DimensionsSection.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T12 | `frontend/common/views/dashboard/certificates/templateEditor/sections/BackgroundSection.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T13 | `frontend/common/views/dashboard/certificates/templateEditor/sections/CertificateTitleSection.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T14 | `frontend/common/views/dashboard/certificates/templateEditor/sections/ValidityPeriodSection.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T15 | `frontend/desktop/views/dashboard/certificates/templateEditor/templateEditorView.desktop.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T16 | `frontend/mobile/views/dashboard/certificates/templateEditor/templateEditorView.mobile.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T17 | `app/(dashboard)/certificates/templates/[id]/page.tsx` | `app/AGENTS.md`, `shared/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T18 | (verification only — no file changes) | — | — |
| T19 | (knowledge propagation — no file changes except inline comments) | `AGENTS.md` | — |

---

## Execution Order

```
Phase A (sequential):  T01 (i18n type schema)
Phase B (parallel):    T02 (AR impl), T03 (EN impl)
Phase C (sequential):  T04 (namespace + registration)
Phase D (sequential):  T05 (GraphQL documents + codegen)
Phase E (sequential):  T06 (Zustand store)
Phase F (sequential):  T07 (types)
Phase G (sequential):  T08 (ViewModel hook)
Phase H (parallel):    T10, T11, T12, T13, T14 (form sections)
Phase I (sequential):  T09 (Container)
Phase J (parallel):    T15 (desktop view), T16 (mobile view)
Phase K (sequential):  T17 (App Router page)
Phase L (sequential):  T18 (integration verification)
Phase M (sequential):  T19 (knowledge propagation)
```

**Total estimated time**: 35 hours (parallelizable to ~20 wall-clock hours with 5-way parallelism in Phase H and 2-way in Phase J)

---

## Quality Gate Reference

Per-file verification loop for every file created/modified:

```bash
# Progressive: tsgo → biome → lint (short-circuits at first failure)
bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene
```

Full plan verification (after T18): run `bun quality-gate` (sequential: tsgo → biome → lint → codescene → sonar).

---

## Round 4 Enhancement Tasks

> These tasks (T29–T44) implement the Round 4 production-hardening design (see `design.md` §"Round 4 Enhancement — Production Hardening"). Each task includes: file paths, MUI v9 components with `sx` prop usage, Zustand store updates to `templateEditorStore.ts`, quality loop commands, instruction-file verification, and tests. Dependencies reference the Round 1–3 tasks (T20–T28) unless otherwise noted.

### Task Dependencies Graph (Round 4)

```
T29 (store) ─┬─> T30 (toolbar overflow)
              ├─> T31 (panel animations)
              ├─> T32 (shortcut manager)
              ├─> T34 (auto-save hook)
              ├─> T35 (skeletons)
              ├─> T36 (error boundaries)
              ├─> T38 (responsive)
              ├─> T40 (tab management)
              └─> T41 (status bar enhancements)
T33 (unsaved changes guard) depends on T29
T33 → T34 (auto-save uses guard for "Save" button)
T37 (accessibility) depends on T31, T36
T39 (performance budgets) depends on T29 (store), T34 (autosave)
T42 (i18n) depends on T29 (needs key types)
```

---

## T29 — Round 4 Store Additions + Persist Middleware

> **Files**:
> - `frontend/stores/cert/templateEditorStore.ts` (modify — add all R4 state, actions, persist middleware)
> **Depends On**: T20 (store from Round 1), T27 (quality gate passed)
> **Time Budget**: 3-4 hours

### Subtasks

1. Read `frontend/stores/AGENTS.md` (re-confirm: Zustand, no `File`/`Blob` in persisted state, `useRef` for `File`)
2. Add all R4 state fields per `design.md` §R4.13:
   - Panel collapse: `leftCollapsed`, `rightCollapsed`, `bottomCollapsed`, `leftPanelWidth`, `rightPanelWidth`, `bottomPanelHeight`
   - Shortcut conflicts: `activeShortcutScope`, `customShortcuts`, `disabledShortcuts`
   - Auto-save: `autoSaveDelay` (default 3000), `autoSaveRetryCount`, `autoSaveRetryDelay`, `conflictDialogOpen`
   - Loading: `loading`
   - Error states: `networkOnline` (default `true`), `offlineQueue`
   - Responsive: `activeMobilePanel` (default `'canvas'`), `sidebarPanelMode` (default `'layers'`)
   - Tab management: `openTemplates`, `activeTemplateId`, `recentTemplateIds`
   - Status bar: `environmentBranch`
3. Add all R4 actions per `design.md` §R4.13:
   - `togglePanel`, `setPanelWidth` (with min/max clamping: `Math.max(200, Math.min(600, width))`)
   - `setActiveShortcutScope`, `setCustomShortcut`, `disableShortcut`, `enableShortcut`
   - `setAutoSaveDelay`, `clearConflictDialog`
   - `setLoading`
   - `setNetworkOnline`, `queueOfflineChange`, `flushOfflineQueue`
   - `setActiveMobilePanel`, `setSidebarPanelMode`
   - `openTemplate`, `closeTemplate`, `reorderTemplates`, `setActiveTemplate`
   - `setEnvironmentBranch`
4. Add Zustand `persist` middleware with `partialize` (per `design.md` §R4.13):
   ```ts
   persist(
     (set, get) => ({ /* all state + actions */ }),
     {
       name: 'cert-template-editor-layout',
       storage: createJSONStorage(() => localStorage),
       partialize: (state) => ({
         leftCollapsed: state.leftCollapsed,
         rightCollapsed: state.rightCollapsed,
         bottomCollapsed: state.bottomCollapsed,
         leftPanelWidth: state.leftPanelWidth,
         rightPanelWidth: state.rightPanelWidth,
         bottomPanelHeight: state.bottomPanelHeight,
         customShortcuts: state.customShortcuts,
         disabledShortcuts: state.disabledShortcuts,
         recentTemplateIds: state.recentTemplateIds,
         offlineQueue: state.offlineQueue,
       }),
     }
   )
   ```
5. Add `performance.now()` timing to `togglePanel` and `setActiveTool` actions — log delta via `logger.debug` if it exceeds the budget (50ms / 100ms per R4.10). Use `@/frontend/utils/logger` (NOT `console.*`).
6. Add inline comments documenting:
   - The persist partializer rationale (which fields are persisted and why; `File`/`Blob` excluded per AGENTS.md)
   - The offline queue survival strategy (persisted to localStorage so edits survive reload)
   - The `maxHistorySize` + `shift-on-overflow` — already added in Round 2; add note that the persist does NOT touch undo/redo stacks (they are session-only)

### AGENTS.md & Instruction Files to Read

- `AGENTS.md` (root — always)
- `frontend/stores/AGENTS.md` (Zustand persist + File/Blob rules)
- `.agents/instructions/frontend.instructions.md`

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/stores/cert/templateEditorStore.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/stores/cert/templateEditorStore.ts --lifecycle codescene
```

### Verification

- `bun tsgo` passes clean (no type errors in the modified store)
- `bun biome:check` passes clean (formatting + lint)
- Lint queue client returns `exitCode: 0`
- Persist partializer does NOT include `File`, `Blob`, undo/redo stacks, or `currentTemplate` (they are non-serializable or session-only)
- No `console.*` usage — all logging via `@/frontend/utils/logger`

---

## T30 — Toolbar Overflow Menu

> **Files**:
> - `frontend/views/dashboard/cert/templates/editor/ToolbarOverflow.tsx` (create)
> - `frontend/views/dashboard/cert/templates/editor/EditorToolbar.tsx` (modify — wrap in overflow, add priorities, add aria-labels)
> **Depends On**: T29 (store), T22 (EditorToolbar from Round 2)
> **Time Budget**: 3-4 hours

### Subtasks

1. Read AGENTS.md: `frontend/views/AGENTS.md`, `frontend/AGENTS.md` (MUI v9 sx prop, icon naming `*Outlined`)
2. Read `.agents/instructions/frontend.instructions.md`
3. Create `ToolbarOverflow.tsx`:
   - Export a component `ToolbarOverflow` that accepts `children: React.ReactNode` and renders them in a flex `Box` with `ref` for `ResizeObserver`.
   - Each child must be a `ToolbarOverflowItem` — a component that accepts `id: string`, `priority: number`, `label: string`, `tooltip: string`, and `children` (the actual button).
   - The `useToolbarOverflow` hook (inside the same file) uses `ResizeObserver` to compute the cutoff: items with `priority >= cutoff` are moved to an MUI `Menu` (the overflow menu).
   - The overflow trigger is an MUI `IconButton` with `MoreVertOutlined` icon, `aria-label="More actions"`, wrapped in a `Tooltip`.
   - MUI v9 usage: all styling via `sx` prop (no style props on `Box`, `IconButton`, `Menu`, `MenuItem`, `Tooltip`).
   - `sx` examples: `<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden' }}>`, `<IconButton sx={{ p: 0.5 }}>`
   - Debounce the `ResizeObserver` callback by 50ms (`useRef<ReturnType<typeof setTimeout>>`)
   - Each `ToolbarOverflowItem` wrapping a visible button is rendered directly; overflowed items are rendered inside `Menu > MenuItem`.
4. Modify `EditorToolbar.tsx`:
   - Wrap the action buttons in `<ToolbarOverflow>`.
   - Tag each button with priority: Save=0, Publish=5, Undo=10, Redo=20, Zoom In=30, Zoom Out=40, Zoom Reset=50, Grid=60, Snap=70.
   - Add `aria-label` to each `IconButton` matching the tooltip text + shortcut, e.g. `aria-label="Save template (Ctrl+S)"`.
   - Wrap each button in MUI `Tooltip` with `title={label + ' (' + shortcut + ')'}`, `enterDelay={500}`.
   - When `loading === true` (from store), set `disabled={true}` on all buttons.

### MUI v9 Compliance Checklist

- [ ] No style props (`fontWeight`, `display`, `gap`) directly on `Box`/`IconButton`/`Tooltip` — all via `sx`
- [ ] Icon names use `*Outlined` suffix (`MoreVertOutlined`, `SaveOutlined`, `EditOutlined`, `CheckCircleOutlined`, `ErrorOutlined`)
- [ ] `Tooltip` `TransitionComponent` not needed (default `Fade` is fine for MUI v9)
- [ ] `Menu` uses `anchorEl` state pattern (not `open` prop on container)

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/ToolbarOverflow.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/EditorToolbar.tsx --lifecycle codescene
```

### Verification

- `bun tsgo` passes for both files
- `bun biome:check` passes
- Lint queue client returns `exitCode: 0`
- Toolbar items collapse into the overflow menu when the container is < 600px wide
- `aria-label` present on all `IconButton` components
- `Tooltip` renders on hover with shortcut text
- Overflow trigger is keyboard accessible (`Tab` to focus, `Enter` to open)

---

## T31 — Panel Collapse/Expand Animations

> **Files**:
> - `frontend/views/dashboard/cert/templates/editor/EditorLayout.tsx` (modify — add Framer Motion animations, panel collapse state, double-click divider, resize with min/max)
> **Depends On**: T29 (store with panel state), T21 (EditorLayout from Round 2)
> **Time Budget**: 2-3 hours

### Subtasks

1. Read AGENTS.md: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
2. Verify `framer-motion` is in `package.json` (it is — confirmed in the SWE review's codebase check)
3. Modify `EditorLayout.tsx`:
   - Import `motion`, `AnimatePresence` from `framer-motion`.
   - Wrap each panel in `motion.div` with `initial={{ width: 0 }}`, `animate={{ width: collapsed ? 0 : panelWidth }}`, `exit={{ width: 0 }}`, `transition={{ type: 'spring', stiffness: 300, damping: 30 }}`.
   - Wrap panels in `<AnimatePresence mode="wait">` to avoid unmount race conditions.
   - Read `leftCollapsed`, `rightCollapsed`, `bottomCollapsed`, `leftPanelWidth`, `rightPanelWidth`, `bottomPanelHeight` from the store.
   - Call `togglePanel('left')` / `togglePanel('right')` / `togglePanel('bottom')` from the store.
   - The `PanelResizeHandle` `onDoubleClick` calls `togglePanel` for that panel.
   - Set `minSize`/`maxSize` props on `react-resizable-panels` `Panel` to enforce the store's `setPanelWidth` min/max (200px min, 600px max).
   - The `onResize` callback calls `setPanelWidth` with the new pixel width (converted from percentage).
4. Add `sx` styling for divider: `<PanelResizeHandle sx={{ width: 4, cursor: 'col-resize', '&:hover': { bgcolor: 'action.hover } }} />` (MUI v9 — `sx` prop, no direct style props).
5. Add `aria-label` to the resize handle: `aria-label="Resize panel"`.

### MUI v9 Compliance Checklist

- [ ] `sx` prop on `PanelResizeHandle` for cursor + hover bg
- [ ] No style props directly on `Box`/`Stack`/`Grid` — all via `sx`
- [ ] `framer-motion` `motion.div` is a plain HTML element, not MUI — no `sx` needed on it (use regular `style` for clinical display logic)

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/EditorLayout.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/EditorLayout.tsx --lifecycle codescene
```

### Verification

- `bun tsgo` passes
- `bun biome:check` passes
- Lint queue client returns `exitCode: 0`
- Panel collapse/expand animates with spring transition (manual test in dev server)
- Double-click on divider toggles collapse
- Resize handle respects min 200px / max 600px
- Reload restores panel collapse state from localStorage (persistence works)

---

## T32 — Keyboard Shortcut Conflict Resolution

> **Files**:
> - `frontend/views/dashboard/cert/templates/editor/ShortcutManager.ts` (create)
> - `frontend/views/dashboard/cert/templates/editor/ShortcutSettingsDialog.tsx` (create)
> - `frontend/views/dashboard/cert/templates/editor/useEditorShortcuts.ts` (modify — refactor to use ShortcutManager)
> **Depends On**: T29 (store with shortcut state), T23 (useEditorShortcuts from Round 2)
> **Time Budget**: 4-5 hours

### Subtasks

1. Read AGENTS.md: `frontend/views/AGENTS.md`, `AGENTS.md`
2. Read `.agents/instructions/frontend.instructions.md`
3. Create `ShortcutManager.ts`:
   - Module-level singleton with a `Map<string, { combo: string; handler: () => void; scope: string; priority: number }>` registry.
   - `registerShortcut(combo, handler, scope, priority)`: returns `boolean`. On conflict (same combo, overlapping scope):
     - If `priority === existing.priority` → `logger.warn` + return `false` (rejected)
     - If `priority > existing.priority` → replace + return `true`
     - If `priority < existing.priority` → return `false` (suppressed)
   - `unregisterShortcut(combo, scope)`: removes from registry.
   - `dispatch(combo, activeScope)`: finds matching handlers, sorts by priority desc, fires the highest that matches the active scope (`'editor'` is always active). Disabled shortcuts (in `disabledShortcuts`) are skipped.
   - Combo normalization: lowercase, replace `Cmd` → `cmd`, support `Ctrl+Shift+S`, `Alt+X`, `Cmd+K`, etc. Use `navigator.platform` (via `typeof navigator !== 'undefined'`) to detect mac for `Cmd` vs `Ctrl` default.
4. Create `ShortcutSettingsDialog.tsx`:
   - MUI `Dialog` with `DialogProps.open` controlled by store (`shortcutSettingsOpen: boolean` — add to store if not present).
   - Lists all registered shortcuts in a `Table` (MUI `Table`, `TableHead`, `TableBody`, `TableRow`, `TableCell`).
   - Each row: action name | combo (editable via a "Press a key" capture `TextField`) | scope | enable/disable toggle | conflict indicator (red text if conflict found).
   - The "Press a key" `TextField` captures `keydown` and displays the combo string (e.g. "Ctrl+S").
   - Save button calls `setCustomShortcut(actionId, combo)`; disable toggle calls `disableShortcut(actionId)` / `enableShortcut(actionId)`.
   - MUI v9: all styling via `sx` on `Dialog`, `Table`, `TableCell`, `TextField`, `Switch`, `Button`. No direct style props.
   - `aria-label` on all buttons: `aria-label="Save shortcut"`, `aria-label="Disable shortcut"`.
5. Refactor `useEditorShortcuts.ts`:
   - Instead of registering a single `keydown` listener with a big switch, register each shortcut via `ShortcutManager.registerShortcut(combo, handler, scope, priority)`.
   - The hook reads `activeShortcutScope`, `customShortcuts`, `disabledShortcuts` from the store.
   - On `keydown`, call `ShortcutManager.dispatch(normalizedCombo, activeScope)`.
   - Cleanup: `unregisterShortcut` for all on unmount.
   - Preserve the text-field suppression (active element is input/textarea → only Escape + Ctrl+S active) and modal-open suppression.

### MUI v9 Compliance Checklist

- [ ] `Dialog` `sx` for `maxWidth`, `maxHeight` — no `maxWidth` prop (use `sx={{ maxWidth: 600 }}`)
- [ ] `Table`, `TableCell` styled via `sx` (padding, fontSize)
- [ ] `Switch` uses `sx` for color tokens (`color: 'primary'` is fine, but `sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' } }}` for custom)
- [ ] Icon naming: `*Outlined` suffix (`EditOutlined`, `DeleteOutlined`)

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/ShortcutManager.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/ShortcutSettingsDialog.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/useEditorShortcuts.ts --lifecycle codescene
```

### Verification

- `bun tsgo` passes for all three files
- `bun biome:check` passes
- Lint returns `exitCode: 0`
- Two handlers with same combo + equal priority → second registration rejected, `logger.warn` emitted
- Custom shortcut binding persists in localStorage (reload restores)
- Disabled shortcut does not fire

---

## T33 — Unsaved Changes Warning + Navigation Guard

> **Files**:
> - `frontend/views/dashboard/cert/templates/editor/useUnsavedChangesGuard.ts` (create)
> - `frontend/views/dashboard/cert/templates/editor/UnsavedChangesDialog.tsx` (create)
> - `frontend/views/dashboard/cert/templates/editor/AutosaveIndicator.tsx` (create)
> **Depends On**: T29 (store with `isDirty`), T20 (existing store from Round 1)
> **Time Budget**: 3-4 hours

### Subtasks

1. Read AGENTS.md: `frontend/views/AGENTS.md`, `AGENTS.md` (React 19 changes — `React.SyntheticEvent`)
2. Read `.agents/instructions/frontend.instructions.md`
3. Create `useUnsavedChangesGuard.ts`:
   - A hook called once in the editor container: `useUnsavedChangesGuard({ router, save, reset }).`
   - Registers `beforeunload` listener: if `isDirty` (read from store via `useCertTemplateEditorStore.getState().isDirty`), call `event.preventDefault()` and set `event.returnValue = ''`.
   - Patches `router.push` and `router.replace` via a module-level wrapper:
     - Stores the original `push`/`replace` in a `useRef`.
     - On `isDirty`, shows `UnsavedChangesDialog` (sets `unsavedDialogOpen: true` in store — add if needed, or manage via local React state in a container component).
     - Stores `pendingNavigation` URL string. On dialog "Save" → `await save()` then `originalPush(pendingNavigation)`. On "Don't Save" → `reset()` then `originalPush(...)`. On "Cancel" → clear `pendingNavigation`.
   - Returns nothing (side-effect hook).
4. Create `UnsavedChangesDialog.tsx`:
   - MUI `Dialog` with `DialogTitle`, `DialogContent`, `DialogContentText`, `DialogActions`.
   - Three `Button`s: "Save" (`variant="contained"`, `color="primary"`), "Don't Save" (`variant="outlined"`, `color="error"`), "Cancel" (`variant="outlined"`).
   - Props: `open: boolean`, `onSave: () => void`, `onDontSave: () => void`, `onCancel: () => void`.
   - `aria-label="Unsaved changes"` on the `Dialog`.
   - `DialogActions` `sx={{ gap: 1, p: 2 }}` (gap via sx, no direct prop).
   - i18n: labels from `shared/locale` — `unsavedChanges.title`, `.message`, `.save`, `.dontSave`, `.cancel`.
5. Create `AutosaveIndicator.tsx`:
   - Selects from store: `const { saving, autoSaveStatus, isDirty } = useCertTemplateEditorStore(s => ({ saving: s.saving, autoSaveStatus: s.autoSaveStatus, isDirty: s.isDirty }))` (memoized selector to avoid re-render churn).
   - Renders one of 4 states (see `design.md` §R4.4):
     - `idle && isDirty` → `Typography` "Unsaved" with `EditOutlined` icon, color amber: `sx={{ color: 'warning.main', display: 'flex', alignItems: 'center', gap: 0.5 }}`.
     - `saving` → `CircularProgress` size 16 + "Saving…" — `sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}`.
     - `!isDirty && autoSaveStatus === 'saved'` → "Saved" with `CheckCircleOutlined`, color green: `sx={{ color: 'success.main' }}`.
     - `autoSaveStatus === 'error'` → "Save failed" with `ErrorOutlined`, color red: `sx={{ color: 'error.main' }}`.
   - i18n: `unsavedChanges.indicatorUnsaved`, `.indicatorSaving`, `.indicatorSaved`, `.indicatorError`.
   - `aria-live="polite"` so screen readers announce status changes (in lieu of the separate `SrLiveRegion` from T37 — but `SrLiveRegion` is still used for full announcements; this component just renders visually).

### MUI v9 Compliance Checklist

- [ ] `Dialog` `sx` for max dimensions — no `maxWidth` prop
- [ ] `Button` `variant`/`color` props OK; additional styling via `sx`
- [ ] `CircularProgress` `size` prop OK (it's a component prop, not a style prop)
- [ ] No `fontWeight`/`mb`/`display` direct props on `Typography` — via `sx`

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/useUnsavedChangesGuard.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/UnsavedChangesDialog.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/AutosaveIndicator.tsx --lifecycle codescene
```

### Verification

- `bun tsgo` passes
- `bun biome:check` passes
- Lint returns `exitCode: 0`
- beforeunload fires when `isDirty`
- In-app navigation shows dialog when `isDirty`
- "Save" saves then navigates; "Don't Save" discards then navigates; "Cancel" stays

---

## T34 — Auto-Save System (Debounce, Retry, Conflict, Queue)

> **Files**:
> - `frontend/views/dashboard/cert/templates/editor/useAutosave.ts` (create)
> - `frontend/views/dashboard/cert/templates/editor/ConflictDialog.tsx` (create)
> **Depends On**: T29 (store with auto-save state), T33 (unsaved changes guard — auto-save "Save" button uses `save()`)
> **Time Budget**: 4-5 hours

### Subtasks

1. Read AGENTS.md: `frontend/views/AGENTS.md`, `AGENTS.md`
2. Read `.agents/instructions/frontend.instructions.md`
3. Create `useAutosave.ts`:
   - Hook called once in the editor container: `useAutosave({ save })`.
   - Debounce: `useRef<ReturnType<typeof setTimeout>>`. On each `isDirty` → `true` transition (via `useEffect` watching `isDirty`), set a timeout for `autoSaveDelay` (from store, default 3000ms). Clear and re-set on each subsequent field change.
   - On timeout fire: call `save()` (the store action wrapped with single-flight guard).
   - Single-flight: a `useRef<boolean> isSavingRef`. If `true` when timeout fires, queue the save in `useRef<(() => void) | null> pendingSaveRef`. When the in-flight save completes, flush the pending save (only the latest — overwrites the ref on each new queue).
   - Retry with exponential backoff: inside the store's `save()` action (modify store here per R4.5), wrap the mutation `.catch(err)`:
     - If error is a network error (Apollo `NetworkError`) and `autoSaveRetryCount < 5`:
       - `set({ autoSaveRetryCount: count + 1, autoSaveRetryDelay: Math.min(1000 * 2 ** count, 30000) })`
       - `setTimeout(() => get().save(), get().autoSaveRetryDelay)`
     - On success: reset `autoSaveRetryCount: 0`, `autoSaveRetryDelay: 0`.
     - On conflict (server returns `conflict` code): set `conflictDialogOpen: true`, `autoSaveStatus: 'error'`.
   - The hook cleans up the debounce timeout on unmount.
4. Create `ConflictDialog.tsx`:
   - MUI `Dialog` with `DialogTitle` "Template was modified elsewhere", `DialogContent` showing a summary of the conflict (server version number vs local version number).
   - Three `Button`s: "Keep mine (overwrite)", "Use theirs (reload)", "Cancel".
   - "Keep mine" calls `save({ force: true })` (add `force` param to store's save to bypass version check).
   - "Use theirs" calls `resetLocalFromServer()` (= `initFromServer`).
   - "Cancel" calls `clearConflictDialog()`.
   - i18n: `autosave.conflictTitle`, `.conflictKeepMine`, `.conflictUseTheirs`, `.conflictCancel`.
   - MUI v9: `Dialog` `sx={{ maxWidth: 480 }}`, `DialogActions` `sx={{ gap: 1, p: 2 }}`.

### MUI v9 Compliance Checklist

- [ ] `Dialog` `sx` for dimensions
- [ ] `Button` `variant`/`color` props OK; `sx` for additional styling
- [ ] No style props on `Box`/`Typography` — all via `sx`

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/useAutosave.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/ConflictDialog.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/stores/cert/templateEditorStore.ts --lifecycle codescene
```

### Verification

- `bun tsgo` passes for all three files
- `bun biome:check` passes
- Lint returns `exitCode: 0`
- Auto-save fires 3s after last edit
- Network error triggers retry with exponential backoff (mock in unit test)
- Conflict error opens `ConflictDialog`
- Single-flight: only one save mutation in-flight at a time (assert no double-save in test)

---

## T35 — Loading & Skeleton States

> **Files**:
> - `frontend/views/dashboard/cert/templates/editor/EditorSkeletons.tsx` (create)
> - `frontend/views/dashboard/cert/templates/editor/EditorToolbar.tsx` (modify — show skeleton for metadata while loading)
> **Depends On**: T29 (store with `loading`), T22 (EditorToolbar), T30 (ToolbarOverflow)
> **Time Budget**: 2-3 hours

### Subtasks

1. Read AGENTS.md: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
2. Create `EditorSkeletons.tsx` exporting three components:
   - `CanvasSkeleton`: MUI `Skeleton` `variant="rectangular"` with `sx={{ width: '100%', height: '100%', minHeight: 400 }}`.
   - `PanelSkeleton`: MUI `Skeleton` `variant="rounded"` repeated 5 times (a vertical list) `sx={{ width: '100%', height: 40, mb: 1, borderRadius: 1 }}`.
   - `MetadataSkeleton`: MUI `Skeleton` `variant="text"` `sx={{ width: 120 }}`.
   - All use `Skeleton` from `@mui/material` (MUI v9 — confirmed in package.json).
3. Modify `EditorToolbar.tsx`:
   - Read `loading` from store.
   - When `loading`, render `<MetadataSkeleton />` in place of the template name + status badge.
   - All toolbar buttons `disabled={loading}` (already done in T30).
4. Modify `EditorLayout.tsx` (if needed):
   - Read `loading` from store.
   - When `loading`, render `<CanvasSkeleton />` in the canvas panel and `<PanelSkeleton />` in the side/bottom panels.
   - Otherwise render the actual content.

### MUI v9 Compliance Checklist

- [ ] `Skeleton` `variant` prop is OK (it's a component prop)
- [ ] Dimensions via `sx` (no `width`/`height` as direct style props — use `sx`)
- [ ] Animation: `Skeleton` default `animation="wave"`; MUI v9 supports `animation={false}` prop if smooth load preferred.

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/EditorSkeletons.tsx --lifecycle codescene
```

### Verification

- `bun tsgo` passes
- `bun biome:check` passes
- Lint returns `exitCode: 0`
- Skeletons render while `loading === true`
- All toolbar buttons disabled while loading

---

## T36 — Error States: Error Boundaries + Snackbars

> **Files**:
> - `frontend/views/dashboard/cert/templates/editor/CanvasErrorBoundary.tsx` (create)
> - `frontend/views/dashboard/cert/templates/editor/PanelErrorBoundary.tsx` (create)
> - `frontend/views/dashboard/cert/templates/editor/EditorLayout.tsx` (modify — wrap panels in `PanelErrorBoundary`)
> **Depends On**: T29 (store), T31 (EditorLayout)
> **Time Budget**: 3-4 hours

### Subtasks

1. Read AGENTS.md: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
2. Create `CanvasErrorBoundary.tsx`:
   - Class component implementing `componentDidCatch` + `getDerivedStateFromError`.
   - On error: `setState({ hasError: true, error: err })`.
   - Fallback render: `Box` with `sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 4 }}` containing:
     - `ErrorOutlined` icon (MUI v9 — `*Outlined` suffix), `sx={{ fontSize: 48, color: 'error.main' }}`.
     - `Typography` "Something went wrong rendering the canvas" (i18n: `errors.canvasRender`).
     - Two `Button`s: "Retry" (`variant="contained"`, `onClick` resets `hasError: false`), "Report" (`variant="outlined"`, `onClick` calls `logger.error` with the captured error — NOT `console.error`).
   - `aria-label` on the fallback container: `aria-label="Canvas error"`.
3. Create `PanelErrorBoundary.tsx`:
   - Generic class component accepting `panelName: string` and `children: React.ReactNode`.
   - Same fallback pattern: `ErrorOutlined`, "Failed to load {panelName}", "Retry" + "Report" buttons.
   - `aria-label="Panel error"`.
4. Modify `EditorLayout.tsx` (T31):
   - Import `PanelErrorBoundary` and `CanvasErrorBoundary`.
   - Wrap each panel in `<PanelErrorBoundary panelName="Layers">...</PanelErrorBoundary>` (et passim for Properties, Timeline/Bottom).
   - Wrap the canvas in `<CanvasErrorBoundary>...</CanvasErrorBoundary>`.
5. Add an MUI `Snackbar` for auto-save errors in the editor container:
   - Read `autoSaveStatus` from store.
   - When `autoSaveStatus === 'error'`, render `<Snackbar open anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} message="Auto-save failed. Your changes are not saved." action={<Button onClick={save}>Retry now</Button>} />`.
   - MUI v9: `Snackbar` `open` + `anchorOrigin` props are OK (component props); `sx` for custom styling.
6. Add network error indicator in status bar (delegates to T41 — just pass `networkOnline` to `EditorStatusBar`).

### MUI v9 Compliance Checklist

- [ ] `ErrorOutlined` icon (confirmed: `*Outline` → `*Outlined` per MUI v9 migration)
- [ ] `Box` `sx` for layout (no direct `display`/`flexDirection` props — via `sx`)
- [ ] `Button` `variant`/`color` props OK
- [ ] `Snackbar` `open`/`anchorOrigin` props OK; custom styling via `sx`

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/CanvasErrorBoundary.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/PanelErrorBoundary.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/EditorLayout.tsx --lifecycle codescene
```

### Verification

- `bun tsgo` passes for all
- `bun biome:check` passes
- Lint returns `exitCode: 0`
- Throwing in a canvas render shows the fallback UI with "Retry"
- Auto-save error shows Snackbar with "Retry now" action
- No `console.*` — all errors via `logger.error`

---

## T37 — Accessibility: ARIA Roles, Labels, Focus, Live Region

> **Files**:
> - `frontend/views/dashboard/cert/templates/editor/SrLiveRegion.tsx` (create)
> - `frontend/views/dashboard/cert/templates/editor/EditorLayout.tsx` (modify — add ARIA roles, focus management)
> **Depends On**: T29 (store), T31 (EditorLayout animations), T36 (Error boundaries)
> **Time Budget**: 3-4 hours

### Subtasks

1. Read AGENTS.md: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `frontend/AGENTS.md` accessibility section
2. Read `.agents/instructions/frontend.instructions.md`
3. Create `SrLiveRegion.tsx`:
   - A `<div aria-live="polite" aria-atomic="true" className="sr-only" />` — the `sr-only` class must be defined via `sx={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}` (the visually-hidden CSS pattern).
   - Props: `message: string`. A `useEffect` updates the `ref.current.textContent = message` when `message` changes.
   - Reads `autoSaveStatus` from store and maps: `saving` → "Saving…", `saved` → "Saved", `error` → "Save failed".
   - Also announces panel toggles: "Layers panel collapsed" / "Layers panel expanded" etc.
4. Modify `EditorLayout.tsx`:
   - Root container: `role="application"`, `aria-label="Template editor"`.
   - Toolbar container slot: `role="toolbar"`, `aria-label="Template editor toolbar"` (set in `EditorToolbar` per T30).
   - Left panel: `role="complementary"`, `aria-label="Layers panel"`.
   - Right panel: `role="complementary"`, `aria-label="Properties panel"`.
   - Canvas: `role="main"`, `aria-label="Certificate canvas"`.
   - Status bar: `role="contentinfo"`, `aria-label="Editor status bar"` (set in `EditorStatusBar` per T41).
   - Focus management on panel toggle: a `useEffect` watching `leftCollapsed`, `rightCollapsed`, `bottomCollapsed` — when a panel collapses, move focus to the next visible panel container; when it expands, move focus to the panel's first focusable element (via `querySelector` on the panel ref).
   - Render `<SrLiveRegion />` in the layout root.
5. Keyboard trap prevention: inside each panel, use MUI `TrapFocus` (or manual Tab cycle). When `Escape` is pressed inside a panel, focus exits to the canvas.
6. Add ARIA labels to all toolbar buttons (already done in T30) and ensure the overflow trigger has `aria-label="More actions"`.

### MUI v9 Compliance Checklist

- [ ] `Box` `sx` for `sr-only` styling (position absolute, width 1, etc.) — no direct style props
- [ ] `role` and `aria-label` are valid HTML attributes (pass through fine)
- [ ] If using MUI `TrapFocus`, follow MUI v9 API (check `frontend/AGENTS.md` for any v9-specific TrapFocus changes)

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/SrLiveRegion.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/EditorLayout.tsx --lifecycle codescene
```

### Verification

- `bun tsgo` passes
- `bun biome:check` passes
- Lint returns `exitCode: 0`
- All ARIA roles present on the layout (test via axe or manual inspection)
- Screen reader announces save status changes (manual test with VoiceOver/NVDA)
- Tab cycle stays within a panel when it's the active region
- `Escape` exits panel focus to canvas

---

## T38 — Responsive: Mobile/Tablet/Desktop Panel Layouts

> **Files**:
> - `frontend/views/dashboard/cert/templates/editor/EditorLayout.tsx` (modify — add responsive layout switch)
> - `frontend/views/dashboard/cert/templates/editor/EditorMobileLayout.tsx` (create — single-panel swipe nav)
> - `frontend/views/dashboard/cert/templates/editor/EditorTabletLayout.tsx` (create — 2-panel collapsible sidebar)
> **Depends On**: T29 (store with `activeMobilePanel`, `sidebarPanelMode`), T31 (desktop layout)
> **Time Budget**: 4-5 hours

### Subtasks

1. Read AGENTS.md: `frontend/views/AGENTS.md` (no `useMediaQuery` inside tier views; allowed in containers — but this is in the shared `common/views` editor layer, which is shared; the actual `useMediaQuery` decision happens in the container component, not a tier view)
2. Create `EditorMobileLayout.tsx`:
   - Three MUI `SwipeableDrawer` (left for Layers, right for Properties) or a single `BottomNavigation` with three tabs.
   - Renders the active panel (`activeMobilePanel` from store): `'layers'` | `'canvas'` | `'properties'`.
   - The canvas is always visible (center); swipe from left edge opens Layers drawer; swipe from right opens Properties drawer.
   - The toolbar is simplified (handled by T30 overflow — on mobile, it collapses aggressively).
   - A bottom action bar: `Box sx={{ position: 'sticky', bottom: 0, display: 'flex', gap: 1, p: 1, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}` containing: Save button (`Button variant="contained" color="primary"`), element count (`Typography sx={{ fontSize: 'caption.fontSize' }}`), zoom controls (`IconButton`).
3. Create `EditorTabletLayout.tsx`:
   - Two-panel layout: canvas (left 60%) + collapsible sidebar (right 40%).
   - Sidebar has a `ToggleButtonGroup` at the top switching between Layers and Properties (`sidebarPanelMode`).
   - Sidebar collapses via a `IconButton` toggle that calls `togglePanel('right')`.
   - State bar is visible but condensed (no word count, no connection status — only template name + version, zoom, saved time).
4. Modify `EditorLayout.tsx` (or create a separate switcher):
   - Use `useMediaQuery('(max-width: 767px)')` and `(min-width: 768px) and (max-width: 1023px)` to switch between the three layouts.
   - The `useMediaQuery` is called in the container component (`TemplateEditorContainer`), passing the rendered layout as props to a presentation component, OR called in `EditorLayout` itself (since `EditorLayout` is a shared editor chrome layer, not a tier view).
   - Invariant: the same store state drives all three; the layout just renders different subsets.

### MUI v9 Compliance Checklist

- [ ] `SwipeableDrawer` from `@mui/material` (MUI v9 API — check `node_modules/next/dist/docs/` or MUI v9 docs for changes)
- [ ] `BottomNavigation` + `BottomNavigationAction` for mobile tabs
- [ ] `ToggleButtonGroup` + `ToggleButton` for tablet sidebar mode
- [ ] `Box sx={{ position: 'sticky' }}` for bottom action bar

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/EditorMobileLayout.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/EditorTabletLayout.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/EditorLayout.tsx --lifecycle codescene
```

### Verification

- `bun tsgo` passes for all three
- `bun biome:check` passes
- Lint returns `exitCode: 0`
- Mobile (< 768px): single panel, swipe drawer, bottom action bar
- Tablet (768-1023px): two-panel, sidebar toggle, condensed status bar
- Desktop (> 1023px): three-panel resizable (from T31, unchanged)

---

## T39 — Performance Budget Instrumentation

> **Files**:
> - `frontend/stores/cert/templateEditorStore.ts` (modify — add `performance.now()` timing)
> - `frontend/views/dashboard/cert/templates/editor/useAutosave.ts` (modify — measure auto-save round-trip)
> **Depends On**: T29 (store), T34 (auto-save hook)
> **Time Budget**: 1-2 hours

### Subtasks

1. Read AGENTS.md (root), `frontend/stores/AGENTS.md`
2. Modify `templateEditorStore.ts`:
   - In `togglePanel`: `const start = performance.now();` before state mutation, `const delta = performance.now() - start;` after. If `delta > 50`, `logger.debug('Panel toggle exceeded budget: ' + delta + 'ms')`.
   - In `setActiveTool` (if it exists in the store — if not in Round 1-3, skip): same pattern with budget 100ms.
3. Modify `useAutosave.ts`:
   - Before calling `save()`, `const start = performance.now();`.
   - In the `.then/.catch`/`onCompleted` handler, compute `delta = performance.now() - start`.
   - If `delta > 500`, `logger.debug('Auto-save exceeded budget: ' + delta + 'ms')`.
4. Document the 80KB bundle budget in `frontend/COMPONENT_PATTERNS.md` (append-only — no modifying existing content): note the editor chrome directory bundle budget (80KB gzipped) and reference this plan as the source of the budget.

### MUI v9 Compliance Checklist

- [ ] No MUI-specific changes; this is logic-only.
- [ ] `logger.debug`/`logger.info` from `@/frontend/utils/logger` — NOT `console.*`.

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/stores/cert/templateEditorStore.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/useAutosave.ts --lifecycle codescene
```

### Verification

- `bun tsgo` passes
- `bun biome:check` passes
- Lint returns `exitCode: 0`
- `performance.now()` calls include a fallback to `Date.now()` if unavailable.
- No `console.*` usage.

---

## T40 — Tab Management: Tab Bar + Drag Reorder

> **Files**:
> - `frontend/views/dashboard/cert/templates/editor/EditorTabBar.tsx` (create)
> - `frontend/views/dashboard/cert/templates/editor/RecentTemplatesList.tsx` (create)
> **Depends On**: T29 (store with `openTemplates`, `activeTemplateId`, `recentTemplateIds`), T33 (UnsavedChangesDialog for tab close warning)
> **Time Budget**: 3-4 hours

### Subtasks

1. Read AGENTS.md: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
2. Verify `@dnd-kit/sortable` and `@dnd-kit/core` are in `package.json` (confirmed; the project uses dnd-kit)
3. Create `EditorTabBar.tsx`:
   - Uses `DndContext` + `SortableContext` from `@dnd-kit/core` + `@dnd-kit/sortable`.
   - Maps `openTemplates` from store to `SortableTab` items.
   - Each tab: `Tab label={template.name}` with a close `IconButton` (`CloseOutlined` icon).
   - Active tab styled: `sx={{ borderBottom: 2, borderColor: 'primary.main' }}`.
   - Close handler: if `isDirty` for that template, show `UnsavedChangesDialog`. On "Save"/"Don't Save", call `closeTemplate(id)`.
   - Drag end: call `reorderTemplates(fromIndex, toIndex)` from store.
   - Tab click: call `setActiveTemplate(id)`.
   - MUI v9: `Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}` wrapping the tabs.
   - `aria-label="Editor tabs"` on the container.
4. Create `RecentTemplatesList.tsx`:
   - Shown in the editor root when `openTemplates.length === 0`.
   - Renders a `List` of `ListItem` items from `recentTemplateIds` (map to names — may need a GraphQL query or cache lookup).
   - Each `ListItem` `onClick` calls `openTemplate(id, name)` from store.
   - MUI v9: `List sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}`, `ListItem` with `ListItemAvatar` (`TemplateOutlined` icon) + `ListItemText`.
   - `aria-label="Recent templates"`.

### MUI v9 Compliance Checklist

- [ ] `Tab` from `@mui/material` — MUI v9 API (check `frontend/AGENTS.md` for any v9 changes to Tabs)
- [ ] `IconButton` `sx` for close icon styling
- [ ] `List`/`ListItem` styled via `sx` (padding, borderRadius)
- [ ] Icon: `CloseOutlined`, `TemplateOutlined` (vide supra, MUI v9 naming)

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/EditorTabBar.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/RecentTemplatesList.tsx --lifecycle codescene
```

### Verification

- `bun tsgo` passes
- `bun biome:check` passes
- Lint returns `exitCode: 0`
- Dragging tabs reorders them
- Closing a dirty tab shows `UnsavedChangesDialog`
- Opening with no tabs shows `RecentTemplatesList`

---

## T41 — Status Bar Enhancements

> **Files**:
> - `frontend/views/dashboard/cert/templates/editor/EditorStatusBar.tsx` (modify — add template name+version, element count, saved time, connection, branch)
> **Depends On**: T29 (store with `environmentBranch`), T24 (EditorStatusBar from Round 2), T34 (auto-save produces `lastSavedAt`)
> **Time Budget**: 2-3 hours

### Subtasks

1. Read AGENTS.md: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
2. Modify `EditorStatusBar.tsx`:
   - Add cells (left to right):
     - Template name + version: `Typography sx={{ fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}`. Reads from ViewModel (template name + version from Apollo).
     - Element count: `Typography` showing `"N elements"` (i18n: `statusBar.elementCount(count)` pluralization). For a selected text element, also shows word count (`statusBar.wordCount(count)`).
     - Zoom level: `Typography` showing `"{zoomLevel}%"`. On hover shows `Tooltip`; on click opens a `Popover` with a `Slider` for zoom control.
     - Last saved: `Typography` showing `"Saved {relativeTime}"` via a `formatRelativeTime` utility (or `Intl.RelativeTimeFormat`). A `useEffect` with `setInterval` every 30s re-renders to update the relative time.
     - Connection status: `IconButton` showing `WifiOutlined` (online) or `WifiOffOutlined` (offline). Color: `success.main` online, `warning.main` offline. `Tooltip` on hover: "Connected" / "Offline — changes will be saved when connection returns".
     - Branch info (non-prod only): `Typography` showing `environmentBranch` (from store). Hidden when `process.env.NODE_ENV === 'production'`.
   - The status bar `role="contentinfo"` + `aria-label="Editor status bar"` (per T37).
3. Add a `formatRelativeTime` utility in `frontend/views/dashboard/cert/templates/editor/utils/formatRelativeTime.ts` (or use `Intl.RelativeTimeFormat`). Implementing locally keeps it simple and avoids a dependency.

### MUI v9 Compliance Checklist

- [ ] `Typography` `sx` for `fontWeight`, `maxWidth`, `textOverflow` — no direct style props (MUI v9 removed them).
- [ ] `IconButton` `sx` for color (use theme palette: `color: 'success.main'` / `color: 'warning.main'`).
- [ ] `Slider` from `@mui/material` inside `Popover` — MUI v9 API.
- [ ] Icons: `WifiOutlined`, `WifiOffOutlined` (MUI v9 naming).

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/EditorStatusBar.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/utils/formatRelativeTime.ts --lifecycle codescene
```

### Verification

- `bun tsgo` passes
- `bun biome:check` passes
- Lint returns `exitCode: 0`
- Status bar shows all new cells (manual test in dev server)
- "Saved 2 min ago" updates every 30s
- Connection status icon changes based on `navigator.onLine`
- Branch info hidden in production build
- No hardcoded colors — all theme palette refs

---

## T42 — i18n: Round 4 Translation Keys

> **Files**:
> - `shared/locale/types/dashboard/certificates/templateEditor.ts` (modify — add R4 keys to `TemplateEditorLabels`)
> - `shared/locale/ar/dashboard/certificates/templateEditor.ts` (modify — Arabic translations)
> - `shared/locale/en/dashboard/certificates/templateEditor.ts` (modify — English translations)
> **Depends On**: T29 (store — confirms key shape), all R4 component tasks (T30–T41) — to verify key usage
> **Time Budget**: 2-3 hours

### Subtasks

1. Read AGENTS.md: `shared/AGENTS.md` (i18n rules — compile-time system, `defineNamespace`, AR/EN interfaces must match the type schema)
2. Read `.agents/instructions/frontend.instructions.md`
3. Modify `TemplateEditorLabels` interface (in `shared/locale/types/dashboard/certificates/templateEditor.ts`):
   - Add nested key blocks per `design.md` §R4.17:
     - `toolbar.moreActions`, `toolbar.overflowPriority`
     - `shortcuts.settingsTitle`, `.conflictWarning`, `.rebindPrompt`, `.disabled`, `.scopeEditor`, `.scopeCanvas`, `.scopePanel`
     - `unsavedChanges.title`, `.message`, `.save`, `.dontSave`, `.cancel`, `.indicatorUnsaved`, `.indicatorSaving`, `.indicatorSaved`, `.indicatorError`
     - `autosave.retryFailed`, `.retrying` (function `(count: number) => string`), `.conflictTitle`, `.conflictKeepMine`, `.conflictUseTheirs`, `.conflictCancel`, `.savedRelative` (function `(time: string) => string`)
     - `loading.canvas`, `.panels`, `.metadata`
     - `errors.canvasRender`, `.panelLoad`, `.autosaveFailed`, `.retryNow`, `.reportError`, `.offlineMode`, `.backOnline`
     - `tabs.closeTabWarning`, `.recentTitle`, `.noOpenTabs`
     - `statusBar.elementCount` (`(count: number) => string`), `.wordCount` (`(count: number) => string`), `.savedAt`, `.connected`, `.disconnected`, `.branch`
4. Implement AR translations in `shared/locale/ar/dashboard/certificates/templateEditor.ts`:
   - All keys above in Arabic.
   - Pluralization functions: `(count: number) => string` using Arabic plural rules (one/two/few/many/other — see Arabic locale pack). Use the existing patterns verified in `shared/AGENTS.md`.
   - Interpolation functions: `(param: string) => string` using template literals. e.g. `savedRelative: (time) => \`حفظ منذ ${time}\``.
5. Implement EN translations in `shared/locale/en/dashboard/certificates/templateEditor.ts`:
   - All keys in English.
   - Pluralization using English rules (one/other).
   - Interpolation via template literals. e.g. `savedRelative: (time) => `Saved ${time} ago``.

### Compile-Time i18n Compliance Checklist

- [ ] AR and EN files satisfy the `TemplateEditorLabels` interface — TypeScript will error if not.
- [ ] Pluralization functions declared as `(count: number) => string` in the type and implemented in each locale.
- [ ] Interpolation functions declared as `(param: string) => string` and implemented.
- [ ] No hardcoded strings in components — all via the i18n system (`useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` for client components).
- [ ] Namespace registration: the namespace is already registered (`dashboard.certificateTemplateEditor`); no new namespace needed — just expand the existing `TemplateEditorLabels` interface.

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts shared/locale/types/dashboard/certificates/templateEditor.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts shared/locale/ar/dashboard/certificates/templateEditor.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts shared/locale/en/dashboard/certificates/templateEditor.ts --lifecycle codescene
```

### Verification

- `bun tsgo` passes for all three i18n files
- `bun biome:check` passes
- Lint returns `exitCode: 0`
- AR and EN translations match the type interface (TypeScript errors if not)

---

## T44 — Knowledge Propagation for Round 4

> **Depends On**: T27 (Round 1-3 quality gate)
> **Time Budget**: 2-3 hours

### Subtasks

1. Document the `ShortcutManager` singleton pattern — first keyboard shortcut conflict-resolution system in the codebase. Add inline comments in `ShortcutManager.ts` explaining the priority + scope + conflict detection semantics. This pattern propagates to Plans 11-15 for canvas/element/variable shortcuts.
2. Document the auto-save with single-flight + exponential backoff pattern. Add inline comments in `useAutosave.ts` explaining the debounce, the retry state machine, the single-flight queue, and the conflict detection flow. This propagates to Plans 11-12.
3. Document the navigation guard hook pattern (`useUnsavedChangesGuard`) — this is the codebase's first App Router navigation guard. Add inline comments explaining the module-level router patch and the `pendingNavigation` ref pattern. Reusable by all editor plans (11-15).
4. Document the Zustand persist partializer pattern (first in the cert feature; other stores may be non-persisted). Add inline comments in `templateEditorStore.ts` explaining which slices are persisted + why (`File`/`Blob` excluded per `frontend/stores/AGENTS.md`, undo/redo session-only).
5. Document the Framer Motion panel animation pattern in `frontend/COMPONENT_PATTERNS.md` (append-only — no modifying existing content). Note the spring transition config, the `AnimatePresence mode="wait"`, and how collapse state connects to the store.
6. Document the `CanvasErrorBoundary` + `PanelErrorBoundary` pattern in `frontend/IMPLEMENTATION_LEARNINGS.md` (append-only). Note the class component error-boundary scope (annotated with TypeScript) and how it preserves the rest of the editor when one panel crashes.
7. Add to `frontend/IMPLEMENTATION_LEARNINGS.md` (append-only): note the `ShortcutManager` priority scheme and how `Shift` distinguishes `Ctrl+S` (save) from `Ctrl+Shift+S` (snap toggle) via the combo normalization in the manager.
8. Verify `design.md` §R4.13 interface contracts match the implemented store shape (backward-compatible additions).
9. Confirm Plan 11 has sufficient information to:
   - Extend the `ShortcutManager` with canvas-specific shortcuts (pan, select, multiselect) using `scope: 'canvas'`.
   - Consume `leftCollapsed`/`rightCollapsed` from store in the canvas resize logic.
   - Read `autoSaveStatus` and `lastSavedAt` for the canvas save indicator.
   - Wrap the canvas in `CanvasErrorBoundary` (imported from Plan 10).
10. Confirm Plan 15 has sufficient information to:
    - Use `openTemplate()` for batch-template editing.
    - Call `save()` before publish, observing the single-flight guard.
    - Show the publish dialog and gate it on `!isDirty || saving === true` (publish-disabled while dirty).
11. Confirm Plan 17 (generation dialog) has sufficient context to:
    - Reuse `useUnsavedChangesGuard` for the generation dialog's unsaved-changes warning.
    - Read `networkOnline` + `offlineQueue` for offline dialog states.
12. **Do NOT create summary markdown files** — per `AGENTS.md` rules; knowledge transfer via inline comments + session todos + design.md/tasks.md.
13. Update the task AGENTS.md / instruction discovery table in this file (Task table at §"Instruction File & AGENTS.md Discovery Summary" — append rows for T29–T42; do not modify existing rows). The rows should list which AGENTS.md and instruction files apply to each new file, following the same mapping convention as the existing rows.

### Instruction File & AGENTS.md Discovery (Round 4 Append)

| Task | Files Created/Modified | AGENTS.md to Read | Instructions to Read |
|---|---|---|---|
| T29 | `frontend/stores/cert/templateEditorStore.ts` (modify) | `frontend/stores/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T30 | `frontend/views/dashboard/cert/templates/editor/ToolbarOverflow.tsx`, `EditorToolbar.tsx` (modify) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T31 | `EditorLayout.tsx` (modify) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T32 | `ShortcutManager.ts`, `ShortcutSettingsDialog.tsx`, `useEditorShortcuts.ts` (modify) | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T33 | `useUnsavedChangesGuard.ts`, `UnsavedChangesDialog.tsx`, `AutosaveIndicator.tsx` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T34 | `useAutosave.ts`, `ConflictDialog.tsx`, `templateEditorStore.ts` (modify) | `frontend/views/AGENTS.md`, `frontend/stores/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T35 | `EditorSkeletons.tsx`, `EditorToolbar.tsx` (modify) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T36 | `CanvasErrorBoundary.tsx`, `PanelErrorBoundary.tsx`, `EditorLayout.tsx` (modify) | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T37 | `SrLiveRegion.tsx`, `EditorLayout.tsx` (modify) | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T38 | `EditorMobileLayout.tsx`, `EditorTabletLayout.tsx`, `EditorLayout.tsx` (modify) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T39 | `templateEditorStore.ts` (modify), `useAutosave.ts` (modify), `frontend/COMPONENT_PATTERNS.md` (append-only) | `frontend/stores/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T40 | `EditorTabBar.tsx`, `RecentTemplatesList.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T41 | `EditorStatusBar.tsx` (modify), `utils/formatRelativeTime.ts` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T42 | `shared/locale/types/dashboard/certificates/templateEditor.ts` (modify), `shared/locale/ar/.../templateEditor.ts` (modify), `shared/locale/en/.../templateEditor.ts` (modify) | `shared/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T44 | Inline comments only (per Knowledge Propagation subtask) | `AGENTS.md` | — |

### Verification

- All session todos for R4 tasks are `done`
- No `.md` summary files created in the repo (per AGENTS.md rule)
- `design.md` §R4.13 interface contracts match the implemented store state and actions
- Inline documentation present in: `ShortcutManager.ts`, `useAutosave.ts`, `useUnsavedChangesGuard.ts`, `templateEditorStore.ts`
- `frontend/COMPONENT_PATTERNS.md` has a new Framer Motion section (append-only — existing content untouched)
- `frontend/IMPLEMENTATION_LEARNINGS.md` has new entries for error boundaries + ShortcutManager priority scheme (append-only)
- Plan 11 has sufficient R4 interface contracts (ShortcutManager API, panel collapse state, CanvasErrorBoundary import path)
- Plan 15 has sufficient R4 interface contracts (`openTemplate()` API, `save()` single-flight, dirty-publish gating)
- Plan 17 has sufficent R4 interface contracts (`useUnsavedChangesGuard` reuse, `networkOnline` + `offlineQueue` semantics)

---

## Round 4 Execution Order

```
Phase R4-A (sequential):  T29 (store additions)
Phase R4-B (parallel):    T30 (toolbar overflow), T31 (panel animations), T35 (skeletons), T40 (tab bar), T41 (status bar), T42 (i18n)
Phase R4-C (sequential):  T32 (shortcut manager — depends on T29 store)
Phase R4-D (sequential):  T33 (unsaved changes guard — depends on store + R4 partializer from T29)
Phase R4-E (sequential):  T34 (auto-save hook — depends on T33 guard + T29 store)
Phase R4-F (parallel):    T36 (error boundaries — depends on T31 animations), T38 (responsive — depends on store)
Phase R4-G (sequential):  T37 (accessibility — depends on T31 panel animation + T36 boundaries)
Phase R4-H (sequential):  T39 (performance budgets — depends on T34 hook)
Phase R4-J (sequential):  T44 (knowledge propagation — depends on T29–T42)
```

**Round 4 total estimated time**: 38 hours (parallelizable to ~22 wall-clock hours via the parallel phases R4-B and R4-F)

### Full Plan Time (Rounds 1-4 Combined)

- Rounds 1-3 (T20-T28): ~35 hours → ~20 wall-clock hours
- Round 4 (T29-T44): ~38 hours → ~22 wall-clock hours
- **Plan 10 total**: ~73 hours → ~42 wall-clock hours with 5-way parallelism in R4-B + 2-way in R4-F.

> Note: All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks (tsgo → biome → lint → codescene). The lint queue server must be running before any lint call. See `AGENTS.md` §"Lint Queue Server" for startup commands.

---

## Round 5: Effects & Filter Tasks

> These tasks implement the Round 5 effects engine toolbar integration defined in `design.md` §"Round 5". Round 5 is reused across independent feature domains (Fill & Stroke, Pen Tool, Effects). This is the third Round 5 domain. Quality model: per-file tsgo + biome + lint + codescene (via sub-loop --lifecycle codescene), per AGENTS.md.

### Task Map (Plan 10 Effects Engine)

```
FX-T01 (effectTypes.ts shared types + preset factories)
  ├─→ FX-T02 (QuickEffectsButton toolbar component)
  │       │
  │       └─→ FX-T03 (QuickEffectsMenu dropdown with presets)
  │              │
  │              └─→ FX-T04 (ShadowToggle + GlowToggle quick toggles + useQuickToggleEffects hook)
  │
  ├─→ FX-T05 (i18n keys: AR + EN, type schema extend)
  │       └─→ (FX-T06 integration verification — depends on FX-T01..FX-T05)
        └─→ FX-T08 (knowledge propagation — frontend patterns doc append)
```

**Execution order**: FX-T01 → (FX-T02 in parallel; FX-T05 type-schema branch) → FX-T03 → FX-T04 → FX-T06 → FX-T08

**Estimated effort**: 18 hours (parallelizable to ~12 wall-clock hours via the early FX-T02/FX-T05 split)

---

### FX-T01 — Effects & Filter Type Definitions + Preset Factories

**Estimated time**: 3 hours
**Depends on**: Plan 12 §R5 FX-T01 (canonical `EffectLayer` type — but Plan 10 only needs the preset factories and category enum; both files import from the same `effectTypes.ts` source)
**Requirements**: design.md §R5.5

- [ ] **Read applicable AGENTS.md** (before working in each):
  - `frontend/stores/AGENTS.md` (state file conventions)
  - `AGENTS.md` root (`@/*` path alias, MUI v9 style props → `sx={}` ban, NEVER hardcode colors)
  - `frontend/AGENTS.md`

- [ ] **Read applicable instruction files**:
  - `.agents/instructions/frontend.instructions.md`

- [ ] **Create** `frontend/common/stores/cert/effectTypes.ts`:
  - `EffectCategory` union: `'shadow' | 'glow' | 'blur' | 'colorAdjust' | 'stylize' | 'overlay'`
  - `EffectKind` union covering all 36 effect kinds listed in Plan 12 §R5.1 (dropShadow, innerShadow, outerGlow, innerGlow, gaussianBlur, motionBlur, radialBlur, smartBlur, lensBlur, tiltShift, brightnessContrast, hueSaturation, colorBalance, levels, curves, invert, grayscale, sepia, vibrance, photoFilter, emboss, bevelEmboss, pillowEmboss, outline, noise, mosaic, pixelate, oilPainting, cutout, dryBrush, filmGrain, watercolor, colorOverlay, gradientOverlay, patternOverlay, satin)
  - `EffectLayer` interface: `{ id: string; kind: EffectKind; enabled: boolean; params: EffectParams; blendMode?: BlendMode; }` where `EffectParams` is a discriminated union (see Plan 12 §R5.13 — this is the canonical type source)
  - *Note*: Plan 12 will add a per-kind param interface. Plan 10 just needs the import path and `EffectCategory`. Coordinate so Plan 10's FX-T01 lands first (Plan 12 FX-T01 extends this file)
  - `QuickEffectPreset` interface per design §R5.5
  - **Preset factories** (all accept a `Theme` argument — MUST NOT hardcode colors):
    - `createSoftDropPreset(theme): EffectLayer`
    - `createHardDropPreset(theme): EffectLayer`
    - `createLongShadowPreset(theme): EffectLayer[]`
    - `createInnerShadowPreset(theme): EffectLayer`
    - `createSoftGlowPreset(theme): EffectLayer`
    - `createNeonGlowPreset(theme): EffectLayer`
    - `createAutoEnhancePreset(): EffectLayer[]` (no theme colors — color effect stub only)
    - `createBWPreset(): EffectLayer`
    - `createVintagePreset(theme): EffectLayer[]`
    - `createVividPreset(): EffectLayer[]`
  - Preset registry: `export const QUICK_EFFECT_PRESETS: QuickEffectPreset[]` indexed by id
  - **No hardcoded hex** — use `theme.palette.common.black`, `theme.palette.common.white`, `theme.palette.primary.main`, `theme.palette.warning.light` as appropriate. If the existing R4-9 BlendMode type lives in `@/frontend/dashboard/views/.../blendModeUtils.ts`, re-import rather than redefine — but the FX section extends BlendMode to the full 46-mode list per §R5.7. Coordinate with Plan 12 FX-T03 for the canonical extended `BlendMode` type.

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
  - File: `frontend/common/stores/cert/effectTypes.ts`

**Files to Create/Modify:**
- `frontend/common/stores/cert/effectTypes.ts` (new — canonical type source shared with Plans 11, 12)

---

### FX-T02 — Quick Effects Toolbar Button

**Estimated time**: 2 hours
**Depends on**: FX-T01 (uses `EffectCategory`, `QUICK_EFFECT_PRESETS`)
**Requirements**: design.md §R5.1

- [ ] **Read applicable AGENTS.md**: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`

- [ ] **Read applicable instruction files**: `.agents/instructions/frontend.instructions.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/toolbar/QuickEffectsButton.tsx`:
  - `IconButton` with `sx={(theme) => ({ color: theme.palette.text.primary })}`
  - Disabled greyed when `selectedElementId === null` — use `sx={{ opacity: 0.38 }}` rather than `disabled` (so the tooltip still works; the `Tooltip` from a disabled `IconButton` is hidden by MUI).
  - Badge: 6px dot at top-left corner via `Badge`/`sx` badge, color `theme.palette.primary.main` — visible only when effect count > 0. Badge content is empty (just a colored dot). Use `<Badge variant="dot" color="primary">`.
  - Icon: `AutoFixHighOutlined` (MUI v9 — `Outlined` suffix)
  - Tooltip via `Tooltip` reading `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` key `effects.toolbar`
  - Menu open via state from `Toolbar` parent — controlled `onClick` + manual `useState` for `anchorEl`. Pass `anchorEl` and `open` to `QuickEffectsMenu`.
  - Keyboard shortcut `Ctrl+Shift+E` opens the menu (handled via the central `ShortcutManager` from R4-T32 — register a new keymap entry rather than a local handler)

- [ ] **Modify** `frontend/views/dashboard/cert/templates/editor/toolbar/EditorToolbar.tsx` (or the equivalent toolbar file in the same path the existing R4-T30 toolbar work uses — check both `cert/templates/editor/` and `cert-canvas/` per current Plan 11 §R4.7 conventions):
  - Insert `QuickEffectsButton` after the Pen Tool group, before the zoom controls
  - Provide `selectedElementId` prop (subscribed with `useShallow` to `templateElementEditorStore.selectedElementIds[0] ?? null`)
  - Provide a callback to apply a preset (calls `applyPresetToSelected` — Plan 11 store interface)

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

**Files to Create/Modify:**
- `frontend/views/dashboard/cert/templates/editor/toolbar/QuickEffectsButton.tsx` (new)
- `frontend/views/dashboard/cert/templates/editor/toolbar/EditorToolbar.tsx` (modify — insert button)

---

### FX-T03 — Quick Effects Dropdown Menu

**Estimated time**: 4 hours
**Depends on**: FX-T02 (modal mounted from the button)
**Requirements**: design.md §R5.2

- [ ] **Read applicable AGENTS.md**: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`

- [ ] **Read applicable instruction files**: `.agents/instructions/frontend.instructions.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/toolbar/QuickEffectsMenu.tsx`:
  - Anatomy: `Popover` with `Paper sx={{ width: 360, p: 2 }}`
  - Sections separated by `Divider`:
    1. Preset Shadows (`Typography variant="caption"` header with key `effects.quick.presetShadows`)
    2. Preset Glows (header `effects.quick.presetGlows`)
    3. Preset Adjustments (header `effects.quick.presetAdjustments`)
    4. More (`Button fullWidth` with `effects.quick.moreEffects`)
  - Each preset tile is a `Box` (96×72 px) with `sx={{ cursor: 'pointer', '&:hover': { backgroundColor: ... theme.palette.action.hover } }}`. Each tile renders a visual swatch and a label (small `Typography variant="body2"`). Hover/swatch selection uses `useAppTranslation` for the label.
  - On tile click: call `onApplyPresetFactory(factory)` — this delegates to the toolbar callback which calls the store's `applyPresetToSelected`. Close the menu. Show a toast (via the project toast system if available; otherwise a plain `Snackbar` opened via local state) with message `effects.presetApplied(name)` (interpolation).
  - "More Effects…" button: calls `onRequestMoreEffects()` which delegates to `useTemplateElementEditorStore.getState().setRightPanelTab('effects')`. Defensive try/catch — if the effects tab is not registered, a one-line `Snackbar` with `effects.quick.notAvailable`.
  - **No hardcoded colors**: all swatch backgrounds and palette colors come from the theme. Shadow preset swatch backgrounds use `theme.palette.common.white` over `theme.palette.grey[700]` for visibility. Glow preset swatches use `theme.palette.primary.main`. Adjustment preset swatches (sepia/vintage) use `theme.palette.warning.light` blends.
  - Memoize each preset tile with `React.memo`; the menu closes the popover and re-renders nothing else.

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

**Files to Create/Modify:**
- `frontend/views/dashboard/cert/templates/editor/toolbar/QuickEffectsMenu.tsx` (new)
- `frontend/views/dashboard/cert/templates/editor/toolbar/EditorToolbar.tsx` (modify — register menu state and pass `anchorEl`/`onClose`)

---

### FX-T04 — Quick Toggle Buttons (Shadow + Glow)

**Estimated time**: 2 hours
**Depends on**: FX-T03 (presets exist)
**Requirements**: design.md §R5.3

- [ ] **Read applicable AGENTS.md**: `frontend/stores/AGENTS.md` (store additions), `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Read applicable instruction files**: `.agents/instructions/frontend.instructions.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/toolbar/useQuickToggleEffects.ts`:
  - State persists in the existing `useCanvasStore` (Plan 11) or `useTemplateElementEditorStore` (Plan 12) — single Zustand store for session state. Pick the smaller of the two and add `lastShadowPresetId: string | null` and `lastGlowPresetId: string | null` fields.
  - Functions: `rememberShadowPreset(presetId)`, `rememberGlowPreset(presetId)`, `toggleLastShadow()`, `toggleLastGlow()`, `clearRememberedPresets()`
  - `toggleLastShadow()` calls `useCanvasStore.getState().toggleEffectOfPresetCategory('shadow')` — the store action handles adding an effect layer if none exists, removing the most recently applied shadow of that preset category if it does. If no preset has been remembered, defaults to `createSoftDropPreset(themeId)` — the theme lookup uses the nearest `Theme` via `useTheme()` but the toggle is in a hook so it must take `theme` as a parameter or read from `useTheme` at the component layer.
  - *Avoid the theme inside the store*: Zustand stores must not hold `Theme` references. The hook takes `theme` (passed from the React component via `useTheme()`) and the store stores only `id` strings — the actual factory takes the theme parameter at apply time. The hook bridges: store stores id, component code calls factory(id, theme) to produce the EffectLayer, then calls `applyPresetToSelected(layers)` from Zustand action.

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/toolbar/QuickToggleButtons.tsx`:
  - `ShadowToggle` `IconButton` and `GlowToggle` `IconButton` placed adjacent to the `QuickEffectsButton` in the toolbar
  - Each shows state via `sx={{ backgroundColor: theme.palette.action.selected }}` when active
  - Tooltips: `effects.toggleShadow` and `effects.toggleGlow`
  - Icons: `ShadowOutlined`? No — MUI v9 does not have a `Shadow` icon. Use `AdjustOutlined` for shadow, `LightModeOutlined` for glow, or `FilterTiltShiftOutlined` for the conceptual effect toggle. Document the chosen icon mapping in the file header (since these are not obvious).
  - `useTheme()` at the component layer provides the theme to `toggleLastShadow(theme)` / `toggleLastGlow(theme)` calls

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

**Files to Create/Modify:**
- `frontend/views/dashboard/cert/templates/editor/toolbar/useQuickToggleEffects.ts` (new)
- `frontend/views/dashboard/cert/templates/editor/toolbar/QuickToggleButtons.tsx` (new)
- `frontend/views/dashboard/cert/templates/editor/toolbar/EditorToolbar.tsx` (modify — insert toggle buttons after `QuickEffectsButton`)
- `frontend/common/views/dashboard/cert-canvas/canvasStore.ts` (modify — store additions for `lastShadowPresetId`, `lastGlowPresetId`, `toggleEffectOfPresetCategory(category, theme)`)
  - *Note*: `canvasStore.ts` is the canonical store; verify the exact file name per Plan 11 T03/T10i before modifying

---

### FX-T05 — i18n Keys (AR + EN + Type Schema)

**Estimated time**: 3 hours
**Depends on**: Plan 12 §R5 (which adds the bulk of effects i18n keys on the property panel side — Plan 10 only adds the toolbar-visible subset listed in design §R5.4)
**Requirements**: design.md §R5.4

- [ ] **Read applicable AGENTS.md**: `shared/AGENTS.md` (i18n compile-time rules — function-per-key for interpolation/pluralization; both locales must match type schema exactly)
- [ ] **Read applicable instruction files**: `.agents/instructions/frontend.instructions.md`

- [ ] **Extend** `shared/locale/types/dashboard/certificates/templateEditor.ts`:
  - Add `effects: { ... }` sub-tree per design §R5.4 type listing
  - Interpolation functions: `effects.presetApplied: (name: string) => string`, `effects.presetRemoved: (name: string) => string`
  - The rest are `string` keys
  - Coordinate with Plan 12 FX-T04 — Plan 12 adds a bigger `effects.*` sub-tree. Plan 10 + Plan 12 must both extend the SAME `effects` block in the existing schema file. Plan 10 lands first; Plan 12 merges its additions without clobbering Plan 10's keys.

- [ ] **Extend** `shared/locale/en/.../templateEditor.ts`:
  - Implement each English literal per the spec above
  - `effects.toolbar = "Effects"`, `effects.quick = "Quick Effects"`, etc.
  - `effects.presetApplied = (name) => \`${name} preset applied\``

- [ ] **Extend** `shared/locale/ar/.../templateEditor.ts`:
  - Translation strings for all the above (RTL ready by default — Arabic)
  - `effects.toolbar = "التأثيرات"`, `effects.quick = "تأثيرات سريعة"`, etc.
  - `effects.presetApplied = (name) => \`تم تطبيق ${name}\``

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

**Files to Create/Modify:**
- `shared/locale/types/dashboard/certificates/templateEditor.ts` (modify — extend existing `effects` block or add it; coordinate with Plan 12)
- `shared/locale/en/dashboard/certificates/templateEditor.ts` (modify — extend existing file)
- `shared/locale/ar/dashboard/certificates/templateEditor.ts` (modify — extend existing file)

---

### FX-T06 — Integration Verification

**Estimated time**: 2 hours
**Depends on**: FX-T01..FX-T05

- [ ] Verify the `QuickEffectsButton` renders with `null` selected (greyed) and with a selected element (active).
- [ ] Verify clicking the button opens the `QuickEffectsMenu` `Popover`.
- [ ] Verify each preset tile applies its effect layers to the selected element via the canvas store; closes menu; shows toast with preset name.
- [ ] Verify `"More Effects…"` calls `setRightPanelTab('effects')` if registered, and shows the not-available fallback otherwise. This requires Plan 12's effects property panel to be registered; verify cross-plan contract with `grep` for `setRightPanelTab` in `frontend/common/views/dashboard/cert-canvas/` or `frontend/common/views/dashboard/certificates/template-editor/elements/`.
- [ ] Verify `Ctrl+Shift+E` opens the menu via the central `ShortcutManager`.
- [ ] Verify `ShadowToggle` and `GlowToggle` toggle on/off remember preset on subsequent clicks.
- [ ] Run `bun run tsgo` once across the full repo (no isolated file defect after check).

- [ ] Run quality loop across modified files.
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

**Files to Create/Modify:**
- (No new files — this is verification only)

---

### FX-T08 — Knowledge Propagation

**Estimated time**: 1 hour
**Depends on**: FX-T07

- [ ] **Modify** `frontend/COMPONENT_PATTERNS.md` (append-only — existing content untouched):
  - New section header: `## Effects Toolbar Pattern` — describes the Quick Effects button + dropdown + quick toggle triple, why it lives after the Pen Tool group, and the "remember last preset" pattern
  - Reference the test file paths for the canonical example

- [ ] **Modify** `frontend/AGENTS.md` with a one-line pointer: `See COMPONENT_PATTERNS.md §"Effects Toolbar Pattern" for the quick effects dropdown implementation pattern.` (append to the appropriate section — under a "UI Patterns" or similar existing section; if no such section, add to the end as a new bullet item)

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

**Files to Create/Modify:**
- `frontend/COMPONENT_PATTERNS.md` (modify — append-only)
- `frontend/AGENTS.md` (modify — append-only pointers)

---

### Quick Effects Round 5 Execution Order

```
Phase FX-A (sequential):  FX-T01 (effectTypes.ts — canonical type source)
Phase FX-B (parallel):    FX-T02 (toolbar button), FX-T05 (i18n type schema branch)
Phase FX-C (sequential):  FX-T03 (dropdown menu)
Phase FX-D (sequential):  FX-T04 (quick toggles)
Phase FX-E (sequential):  FX-T06 (integration verification)
Phase FX-G (sequential):  FX-T08 (knowledge propagation)
```

**Round 5 effects engine total**: 20 hours (parallelizable to ~14 wall-clock hours via FX-B parallelism)

### Full Plan 10 Time (Rounds 1-5 including Effects Engine)

- Rounds 1-3 (T20-T28): ~35 hours → ~20 wall-clock hours
- Round 4 (T29-T44): ~38 hours → ~22 wall-clock hours
- Round 5 Effects Engine (FX-T01..FX-T08): ~20 hours → ~14 wall-clock hours
- **Plan 10 full (incl. Effects Engine)**: ~93 hours → ~56 wall-clock hours

> Note: All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks. The lint queue server must be running before any lint call (see `AGENTS.md` §"Lint Queue Server").

---

## Round 5: Advanced Fill & Stroke Tasks

> Round 5 task list for Plan 10 — toolbar-level fill/stroke quick controls, fill/stroke shared Zustand store, type definitions, and keyboard shortcuts. These complement the property panel in Plan 12 R5 tasks and the canvas rendering in Plan 11 R5 tasks. Total R5 scope for Plan 10: 6 tasks (~14 hours).

### R5-T1: Fill/Stroke Type Definitions & Utilities

- [ ] Create `frontend/common/stores/cert/fillStrokeTypes.ts` (new)
  - Export all types: `FillType`, `StrokeType`, `BlendMode`, `StrokePosition`, `StrokeCapStyle`, `StrokeJoinStyle`, `StrokeDashStyle`, `ImageFillMode`, `ColorStop`, `GradientValue`, `MeshPoint`, `GradientMeshValue`, `PatternDef`, `PatternFillConfig`, `ImageFillConfig`, `FillConfig`, `StrokeLayer`, `StrokeConfig`, `GradientPreset`, `CachedFillStroke`
  - Export default-config factory functions: `defaultFillConfig(elementType)`, `defaultStrokeConfig(elementType)`, `defaultGradientValue(type)`, `defaultPatternFillConfig()`, `defaultImageFillConfig()`, `defaultGradientMesh()`, `defaultStrokeLayer()`
  - The per-element-type default mapping matches Plan 10 §R5.3 (Shape: no fill, black 1px solid stroke; Text: black fill, no stroke; Image/QR/Signature: no fill, no stroke; Background: white fill, no stroke)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `frontend/common/stores/cert/fillStrokeUtils.ts` (new)
  - `fillToSvgAttrs(fill, width, height)`: Convert `FillConfig` to SVG attributes (returns `{ fill, fillOpacity, fillDef }` where `fillDef` is the SVG `<linearGradient>`/`<radialGradient>`/`<pattern>`/`<defs>` element string)
  - `fillToCss(fill, width, height)`: Convert to CSS `background`/`backgroundImage` clause (for HTML-backed fills)
  - `gradientToCss(gradient)`: Produce CSS gradient string (used by §R5.12 import/export)
  - `parseGradientCss(css)`: Reverse-parse a CSS gradient string into `GradientValue`
  - `strokeToSvgAttrs(layer)`: Convert `StrokeLayer` to SVG attributes object
  - `strokePositionToSvg(layer, shapePath, bounds)`: Generate clipped stroke SVG for inside/outside positions (returns Sibling SVG defs + `<path>` strings)
  - `computeFillStopId()`, `computeMeshPointId()`, `computeStrokeLayerId()`: ID generators (use crypto.randomUUID() or incremental)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Add i18n keys for Plan 10 R5 toolbar controls to `shared/locale/types/dashboard/certificates/templateEditor.ts`
  - Keys: `toolbar.fillSwatch`, `toolbar.strokeSwatch`, `toolbar.strokeWidth`, `toolbar.swapFillStroke`, `toolbar.resetFillStroke`, `toolbar.toggleFill`, `toolbar.toggleStroke`, `toolbar.blendModeToggle`, `toolbar.selectElementPrompt` (the "Select an element to edit fill" tooltip)
  - All plural / interpolation functions follow the compile-time i18n system (see `shared/AGENTS.md`)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Implement the new i18n keys in `shared/locale/ar/dashboard/certificates/templateEditor.ts` and `shared/locale/en/dashboard/certificates/templateEditor.ts`
  - All Arabic translations follow Modern Standard Arabic conventions
  - All English translations are sentence case
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-T2: Fill/Stroke Shared Zustand Store

- [ ] Create `frontend/common/stores/cert/fillStrokeStore.ts` (new)
  - State: `quickSwatches: string[]` (default 12 Material Design primary colors), `gradientPresets: GradientPreset[]`, `patternLibrary: PatternDef[]`, `gradientEditorActive: boolean`, `gradientEditorElementId: string | null`, `globalBlendModeEnabled: boolean`, `fillStrokeCache: Map<string, CachedFillStroke>`
  - Actions: `setQuickSwatches`, `addGradientPreset`, `removeGradientPreset`, `importGradientPreset(css)`, `addCustomPattern`, `removePattern`, `setGradientEditorActive`, `setGlobalBlendModeEnabled`, `setCachedFillStroke`, `clearCache`, `clearAllCache`
  - Non-persisted (session-only) store; the `globalBlendModeEnabled` is the only state that could optionally persist to localStorage (use `persist` middleware with a partializer)
  - Default 12 quick-swatches: `['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#FFC107', '#FF9800']`
  - Default gradient presets: 12 gradients loaded from `frontend/common/stores/cert/gradientPresets.config.ts` (a static config file holding preset definitions)
  - Default pattern library: 14 base patterns (Stripes-Horizontal/Vertical/Diagonal, Dots-Small/Large, Checkerboard, Herringbone, Weave, Cross-hatch, Diamond, Hex, Bubbles, Clouds, Waves, Topographic), each with inline SVG `svgData`, the latter four being "organic"
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `frontend/common/stores/cert/gradientPresets.config.ts` (new)
  - Static export: `DEFAULT_GRADIENT_PRESETS: GradientPreset[]` (12 entries)
  - 12 named presets: "Sunrise", "Ocean", "Forest", "Lavender", "Coral", "Mint", "Sunset", "Twilight", "Desert", "Aurora", "Gold", "Silver"
  - Each preset has 2-5 stops (varied to demonstrate the editor's range)
  - Linear gradients with angles 0/45/90/135/180/270° spread across presets
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `frontend/common/stores/cert/patternLibrary.config.ts` (new)
  - Static export: `DEFAULT_PATTERNS: PatternDef[]` (14 entries across categories — basic, geometric, organic)
  - Each pattern has an inline SVG `svgData` string (e.g. `<rect width="10" height="10" fill="currentColor"/><rect x="0" y="0" width="5" height="5" fill="white"/>` for small dots, scaled)
  - `repeatType` is `'square'` for most; `'hex'` for Hex pattern; the boundaries (`repeatWidth`, `repeatHeight`) reflect the base tile size
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-T3: Toolbar Fill Swatch Component

- [ ] Create `frontend/views/dashboard/cert/templates/editor/ToolbarFillSwatch.tsx` (new)
  - `interface ToolbarFillSwatchProps { elementId: string | null; fill: FillConfig; onFillChange: (fill: FillConfig) => void; }`
  - A `Box` swatch button (24×24 px clipped to a rounded square with `sx={{ borderRadius: 1 }}`) showing the current fill — solid color, gradient (CSS-gradient thumbnail), pattern thumbnail, image thumbnail, or the no-fill checkerboard with red diagonal slash overlay (SVG)
  - `Tooltip` showing i18n label + "(Shift+F)"
  - `Popover` opened on click: 12-color quick-swatch grid, hex `TextField` (validated 6-digit hex), opacity `Slider` (0-100%), and "Open Fill Panel" `Button` that calls `templateElementEditorStore.setLastEditedSection('fill')` and `setPanelExpanded('fill', true)`
  - Disabled state when `elementId` is null — `sx={{ opacity: 0.38 }}` and a "Select an element" tooltip
  - Use `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` from `@/shared/locale/client`
  - Use MUI v9 with `sx={{}}` (no style props on `Box`, `Typography`)
  - Use `useShallow` from `zustand/react/shallow` to pick `templateElementEditorStore.selectedElementIds` (avoid re-renders on position drag)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-T4: Toolbar Stroke Swatch & Width Input Components

- [ ] Create `frontend/views/dashboard/cert/templates/editor/ToolbarStrokeSwatch.tsx` (new)
  - Same structure as `ToolbarFillSwatch` (§R5-T3) but bound to `stroke.layers[0]` (the first stroke layer)
  - Color swatch grid in the popover plus 5 stroke-width `Chip` presets (`0, 1, 2, 5, 10px`) — clicking a chip sets `stroke.layers[0].width` and `stroke.layers[0].type = 'solid'` if it was `'none'`
  - `Tooltip` showing i18n label + "(Shift+S)"
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `frontend/views/dashboard/cert/templates/editor/ToolbarStrokeWidthInput.tsx` (new)
  - Numeric `TextField` (type: number, width 56px, step 0.5, min 0, max 50)
  - Up/down arrow steppers next to the field (use MUI `IconButton` with `ArrowDropUpOutlined`/`ArrowDropDownOutlined`)
  - Disabled when `elementId` is null or `stroke.enabled === false`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-T5: Fill/Stroke Toggle & Swap Toolbar Cluster

- [ ] Create `frontend/views/dashboard/cert/templates/editor/ToolbarFillStrokeToggle.tsx` (new)
  - `interface ToolbarFillStrokeToggleProps { fill: FillConfig; stroke: StrokeConfig; onSwap: () => void; onReset: () => void; onToggleFill: () => void; onToggleStroke: () => void; }`
  - Toggle Fill `IconButton` (`FormatColorFillOutlined`): active = full color, inactive = `sx={{ opacity: 0.3 }}`
  - Toggle Stroke `IconButton` (`BorderColorOutlined`): same pattern
  - Swap Fill/Stroke `IconButton` (`SwapHorizOutlined`): disabled when fill is gradient/pattern/image with no solid color (` Tooltip` for disabled state)
  - Reset to Default `IconButton` (`RestartAltOutlined`)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Update `frontend/views/dashboard/cert/templates/editor/EditorToolbar.tsx` (modify)
  - Add the `ToolbarFillSwatch` + `ToolbarFillStrokeToggle` + `ToolbarStrokeSwatch` + `ToolbarStrokeWidthInput` cluster in a `Box` between alignment tools and zoom controls (see design §R5.5)
  - Register the R5 cluster with `priority: 25` in the `ToolbarOverflow` system (per R4.1)
  - Each component shows a `Tooltip` with i18n label + keyboard shortcut
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-T6: Fill/Stroke Keyboard Shortcuts Hook

- [ ] Create `frontend/views/dashboard/cert/templates/editor/useFillStrokeShortcuts.ts` (new)
  - `useFillStrokeShortcuts(): void` — registers `Shift+F` (toggle fill), `Shift+S` (toggle stroke), `Shift+X` (swap), `Shift+R` (reset) via `ShortcutManager` (from R4.3)
  - Scope: `'editor'` (always active); priority: 15
  - Reads current selection from `templateElementEditorStore.selectedElementIds` and the element's fill/stroke via `useCanvasStore`
  - Dispatches via the same Apollo `useMutation` `updateTemplateElementsBulk` (used elsewhere in the editor)
  - The "reset" action uses `defaultFillConfig(elementType)` and `defaultStrokeConfig(elementType)` from `fillStrokeTypes.ts`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-T7: Plan 10 R5 Test Suite

- [ ] Create `test/unit/fillStrokeUtils.test.ts` (new)
  - Test `fillToSvgAttrs`: solid color returns `{ fill: '#FF0000' }`; linear gradient returns `{ fill: 'url(#grad-...)', fillDef: '<linearGradient>...</linearGradient>' }`
  - Test `fillToCss`: linear gradient returns `linear-gradient(90deg, #ff0000 0%, #0000ff 100%)`
  - Test `gradientToCss` round-trip: `parseGradientCss(gradientToCss(g))` deep-equals `g` (within tolerance)
  - Test `strokeToSvgAttrs` returns correct SVG attributes for solid, dashed, dotted, custom dash
  - Test `strokePositionToSvg` returns inside-stroke (clipped outer shape minus inner shrunk shape) and outside-stroke (doubled strokeWidth + inverted clip)
  - Test default-config factories return the per-element-type defaults per Plan 10 §R5.3
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-T8: Knowledge Propagation (Plan 10 R5)

- [ ] Update `frontend/IMPLEMENTATION_LEARNINGS.md` (append-only)
  - Add an entry for the fill/stroke cluster's overflow priority (25 — must stay between Undo(10) and GridToggle(60))
  - Add an entry for the `useShallow` pattern on `selectedElementIds` — essential to avoid toolbar re-render on every canvas drag
  - Add an entry for the swap-fill-stroke rule: when fill is a gradient/pattern/image, `swap` is disabled because the fill has no `solidColor` to give the stroke
- [ ] Update `frontend/COMPONENT_PATTERNS.md` (append-only)
  - Add a "Fill & Stroke Toolbar Cluster" pattern section: shows the layout, the swap/toggle/reset trio, the overflow behavior, and the per-element-type default config table
- [ ] Update `frontend/AGENTS.md` (append-only)
  - Reference `fillStrokeStore` and `fillStrokeTypes` as the canonical store/types for fill & stroke across Plans 10, 11, 12
  - Note the shared `frontend/common/stores/cert/fillStrokeTypes.ts` location — must be imported (not redefined) by Plan 11 and 12
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### Instruction File & AGENTS.md Discovery (Round 5 Append, Plan 10)

| Task | Files Created/Modified | AGENTS.md to Read | Instructions to Read |
|---|---|---|---|
| R5-T1 | `frontend/common/stores/cert/fillStrokeTypes.ts`, `fillStrokeUtils.ts`, `shared/locale/types/dashboard/certificates/templateEditor.ts`, `shared/locale/{ar,en}/.../templateEditor.ts` | `shared/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T2 | `frontend/common/stores/cert/fillStrokeStore.ts`, `gradientPresets.config.ts`, `patternLibrary.config.ts` | `frontend/stores/AGENTS.md` (or equivalent `frontend/common/stores/AGENTS.md`), `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T3 | `frontend/views/dashboard/cert/templates/editor/ToolbarFillSwatch.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T4 | `ToolbarStrokeSwatch.tsx`, `ToolbarStrokeWidthInput.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T5 | `ToolbarFillStrokeToggle.tsx`, `EditorToolbar.tsx` (modify) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T6 | `useFillStrokeShortcuts.ts` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T7 | `test/unit/fillStrokeUtils.test.ts` | `AGENTS.md` | `.agents/instructions/tests.instructions.md` |
| R5-T8 | `frontend/IMPLEMENTATION_LEARNINGS.md`, `frontend/COMPONENT_PATTERNS.md`, `frontend/AGENTS.md` (all append-only) | `frontend/AGENTS.md`, `AGENTS.md` | — |

### Round 5 Execution Order (Plan 10)

```
Phase R5-A (sequential): R5-T1 (types + utils first — everything depends on these types)
Phase R5-B (parallel): R5-T2 (store) — independent of T1 since it imports the types only after T1 to file-creates
  ─── R5-T3 (ToolbarFillSwatch) waits on T2 (quick swatches live in store)
Phase R5-C (parallel): R5-T4 (ToolbarStrokeSwatch + WidthInput), R5-T5 (Toggle + EditorToolbar modify) — both wait on T1
Phase R5-D (sequential): R5-T6 (shortcuts hook — waits on T3+T4+T5 components existing)
Phase R5-E (parallel): R5-T7 (test suite — waits on T3-T6 implementation)
Phase R5-F (sequential): R5-T8 (knowledge propagation — waits on all of above)
```

**Plan 10 R5 total estimated time**: ~14 hours (~6 wall-clock hours via the parallel phases R5-B, R5-C, R5-E)

### Plan 10 Combined Total Time (Rounds 1-5)

- Rounds 1-3 (T1-T28): ~20 hours → ~12 wall-clock hours
- Round 4 (T29-T44): ~22 hours → ~13 wall-clock hours
- Round 5 (R5-T1 through R5-T8): ~14 hours → ~6 wall-clock hours
- **Plan 10 total**: ~56 hours → ~31 wall-clock hours with the R5 parallelism stacking on R4-B/R4-F.

> All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks (tsgo → biome → lint → codescene). The lint queue server must be running before any lint call. See `AGENTS.md` §"Lint Queue Server" for startup commands.

## Round 5: Pen Tool Tasks

> These tasks implement the Round 5 pen tool and vector path drawing design (see `design.md` §"Round 5: Pen Tool & Vector Path Drawing"). Each task includes file paths, MUI v9 components with `sx` prop usage, Zustand store updates, quality loop commands, instruction-file verification, and tests. All tasks append to existing files — no rewriting.

### Task Dependencies Graph (Round 5)

```
T45 (types + store) ─┬─> T46 (pen tool toolbar group)
                     ├─> T47 (tool options bar)
                     ├─> T48 (keyboard shortcuts)
                     └─> T49 (i18n keys)

T45 → T46 → T47 (options bar depends on toolbar group + store state)
T45 → T48 (shortcuts depend on store actions)
T45 → T49 (i18n keys depend on type definitions)
T50 (tests) depends on T46–T49
```

---

## T45 — Round 5 Type Definitions + Store Additions

> **Files**:
> - `frontend/views/dashboard/certificates/template-editor/types/penTool.types.ts` (new)
> - `frontend/common/stores/certTemplateEditorStore.ts` (modify — add R5 state and actions)
> **Depends On**: T29 (store from Round 4), T27 (quality gate passed)
> **Time Budget**: 3-4 hours

### Subtasks

- [ ] Read `frontend/common/stores/AGENTS.md` (re-confirm: Zustand, no `File`/`Blob` in persisted state, `useRef` for `File`)
- [ ] Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
- [ ] Create `frontend/views/dashboard/certificates/template-editor/types/penTool.types.ts`:
  - `EditorTool` union type: `'select' | 'pen' | 'curvaturePen' | 'freeformPen' | 'addAnchor' | 'deleteAnchor' | 'convertPoint' | 'directSelection' | 'pathSelection' | 'text' | 'image' | 'shape' | 'qrCode' | 'signature'`
  - `PenToolType` union type: `'pen' | 'curvaturePen' | 'freeformPen' | 'addAnchor' | 'deleteAnchor' | 'convertPoint'`
  - `PenDrawingMode` union type: `'shape' | 'path' | 'selection'`
  - `PathOperation` union type: `'stroke' | 'fill' | 'toSelection' | 'strokeToShape' | 'toShape'`
  - `AnchorType` union type: `'corner' | 'smooth'`
  - `AnchorPoint` interface: `{ id, x, y, type: AnchorType, handleIn: { x, y } | null, handleOut: { x, y } | null }`
  - `Subpath` interface: `{ id, anchors: AnchorPoint[], closed: boolean }`
  - `PathData` interface: `{ anchors: AnchorPoint[], closed: boolean, fillRule: 'evenodd' | 'nonzero', subpaths: Subpath[] }`
  - `PathStrokeConfig` interface: `{ enabled, color, width: number (1-50), opacity: number (0-1), dashArray: string, linecap: 'butt'|'round'|'square', linejoin: 'miter'|'round'|'bevel' }`
  - `PathFillConfig` interface: `{ enabled, color, opacity: number (0-1) }`
  - `PathElement` interface extending `CanvasElement`: `{ type: 'path', pathData: PathData, stroke: PathStrokeConfig, fill: PathFillConfig }`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Modify `frontend/common/stores/certTemplateEditorStore.ts`:
  - Add R5 state fields per `design.md` §R5.4:
    - `activeTool: EditorTool` (default: `'select'`)
    - `penDrawingMode: PenDrawingMode` (default: `'path'`)
    - `autoAddDelete: boolean` (default: `true`)
    - `rubberBandPreview: boolean` (default: `true`)
    - `isDrawingPath: boolean` (default: `false`)
    - `drawingPathId: string | null` (default: `null`)
    - `selectedAnchorIds: string[]` (default: `[]`)
    - `activePathElementId: string | null` (default: `null`)
    - `pathOperationPending: PathOperation | null` (default: `null`)
  - Add R5 actions per `design.md` §R5.4:
    - `setActiveTool`, `setPenDrawingMode`, `setAutoAddDelete`, `setRubberBandPreview`
    - `startDrawingPath`, `finishDrawingPath`, `cancelDrawingPath`
    - `setSelectedAnchorIds`, `addSelectedAnchor`, `removeSelectedAnchor`, `clearSelectedAnchors`
    - `setActivePathElement`, `setPathOperation`
  - Do NOT add R5 fields to the `persist` partializer (pen tool state is ephemeral/session-only)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### Files to Create/Modify

- `frontend/views/dashboard/certificates/template-editor/types/penTool.types.ts` (new)
- `frontend/common/stores/certTemplateEditorStore.ts` (modify — add state, actions)

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/template-editor/types/penTool.types.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/stores/certTemplateEditorStore.ts --lifecycle codescene
```

---

## T46 — Pen Tool Toolbar Group

> **Files**:
> - `frontend/views/dashboard/certificates/template-editor/toolbar/PenToolGroup.tsx` (new)
> - `frontend/views/dashboard/certificates/template-editor/toolbar/PenNibIcon.tsx` (new)
> - `frontend/views/dashboard/certificates/template-editor/EditorToolbar.tsx` (modify — add tool group section)
> **Depends On**: T45 (types + store)
> **Time Budget**: 4 hours

### Subtasks

- [ ] Read `frontend/AGENTS.md` (MUI v9 rules: `sx` prop not style props, `*Outlined` icon suffix)
- [ ] Read `frontend/views/AGENTS.md`, `AGENTS.md`
- [ ] Create `frontend/views/dashboard/certificates/template-editor/toolbar/PenNibIcon.tsx`:
  - Custom `SvgIcon` with pen nib SVG path (from `design.md` §R5.1)
  - Uses `currentColor` (no hardcoded colors)
  - `viewBox="0 0 24 24"`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `frontend/views/dashboard/certificates/template-editor/toolbar/PenToolGroup.tsx`:
  - `PenToolGroupProps` interface with `activeTool`, `onToolChange`, `disabled` props
  - MUI `ToggleButtonGroup` (exclusive) as the main button showing active tool
  - MUI `IconButton` with `ArrowDropDownOutlined` for dropdown trigger
  - MUI `Menu` with `MenuItem`s for all 6 pen tool variants (from `design.md` §R5.1 table)
  - Each `MenuItem` uses `ListItemIcon` + `ListItemText` with i18n labels from `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` key `penTool.*`
  - Tooltips on each button: `Tooltip` with `enterDelay={500}`, showing label + keyboard hint (e.g., `"Pen Tool (P)"`)
  - Reads `activeTool` and `setActiveTool` from `useCertTemplateEditorStore`
  - All styling via `sx={{}}` — no MUI style props
  - `disabled={disabled || loading}` — disabled during template load
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Modify `frontend/views/dashboard/certificates/template-editor/EditorToolbar.tsx`:
  - Import `PenToolGroup` and add it to the toolbar row, positioned after zoom controls and before grid/snap toggles (as specified in `design.md` §R5.1)
  - Add `priority: 15` for the pen tool group (low priority = stays visible — between Zoom Out=40 and Grid=60 — adjust priorities: Save=0, Publish=5, PenToolGroup=15, Undo=10, Redo=20, Zoom In=30, Zoom Out=40, Zoom Reset=50, Grid=60, Snap=70)
  - Pass `activeTool` and `setActiveTool` from store to `PenToolGroup`
  - Pass `disabled={loading}` from existing toolbar prop
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### Files to Create/Modify

- `frontend/views/dashboard/certificates/template-editor/toolbar/PenNibIcon.tsx` (new)
- `frontend/views/dashboard/certificates/template-editor/toolbar/PenToolGroup.tsx` (new)
- `frontend/views/dashboard/certificates/template-editor/EditorToolbar.tsx` (modify — add tool group)

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/template-editor/toolbar/PenNibIcon.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/template-editor/toolbar/PenToolGroup.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/template-editor/EditorToolbar.tsx --lifecycle codescene
```

---

## T47 — Tool Options Bar

> **Files**:
> - `frontend/views/dashboard/certificates/template-editor/toolbar/PenToolOptionsBar.tsx` (new)
> - `frontend/views/dashboard/certificates/template-editor/EditorLayout.tsx` (modify — render options bar below toolbar)
> **Depends On**: T45 (store), T46 (toolbar group)
> **Time Budget**: 5 hours

### Subtasks

- [ ] Read `frontend/AGENTS.md`, `frontend/views/AGENTS.md`
- [ ] Create `frontend/views/dashboard/certificates/template-editor/toolbar/PenToolOptionsBar.tsx`:
  - `PenToolOptionsBarProps` interface per `design.md` §R5.2
  - **Drawing mode toggle**: MUI `ToggleButtonGroup` (exclusive) with 3 `ToggleButton`s (Shape, Path, Selection) using icons from `design.md` §R5.2 table
  - Rendered only when `activeTool` is `'pen'` or `'curvaturePen'`
  - **Auto-add/delete toggle**: MUI `Switch` with `FormControlLabel`, reads `autoAddDelete` and calls `setAutoAddDelete` from store
  - **Rubber band preview toggle**: MUI `Switch` with `FormControlLabel`, reads `rubberBandPreview` and calls `setRubberBandPreview`
  - **Path operations dropdown**: MUI `Select` with 5 `MenuItem`s (Stroke Path, Fill Path, Path to Selection, Stroke to Shape, Path to Shape) — shown only when `hasActivePath === true`
  - All labels from `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` keys `penTool.*`
  - Container: `Box` with `sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Modify `frontend/views/dashboard/certificates/template-editor/EditorLayout.tsx` (or equivalent layout file):
  - Import `PenToolOptionsBar` and render it conditionally between the `EditorToolbar` and the canvas area
  - Visibility: render when `activeTool` is any pen variant (`'pen'`, `'curvaturePen'`, `'freeformPen'`, `'addAnchor'`, `'deleteAnchor'`, `'convertPoint'`, `'directSelection'`, `'pathSelection'`)
  - Use Framer Motion `AnimatePresence` for slide-in/slide-out animation (consistent with R4-T31 panel animations): `initial={{ height: 0, opacity: 0 }}` → `animate={{ height: 'auto', opacity: 1 }}` → `exit={{ height: 0, opacity: 0 }}`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### Files to Create/Modify

- `frontend/views/dashboard/certificates/template-editor/toolbar/PenToolOptionsBar.tsx` (new)
- `frontend/views/dashboard/certificates/template-editor/EditorLayout.tsx` (modify — render options bar)

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/template-editor/toolbar/PenToolOptionsBar.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/template-editor/EditorLayout.tsx --lifecycle codescene
```

---

## T48 — Keyboard Shortcuts for Pen Tool

> **Files**:
> - `frontend/views/dashboard/certificates/template-editor/hooks/usePenToolShortcuts.ts` (new)
> - `frontend/views/dashboard/certificates/template-editor/ShortcutManager.ts` (modify — register pen tool shortcuts)
> **Depends On**: T45 (store), T32 (ShortcutManager from R4)
> **Time Budget**: 3 hours

### Subtasks

- [ ] Read `frontend/views/AGENTS.md`, `AGENTS.md`, and existing `ShortcutManager.ts` (from R4-T32)
- [ ] Create `frontend/views/dashboard/certificates/template-editor/hooks/usePenToolShortcuts.ts`:
  - Returns `useEffect` that registers pen tool shortcuts via `ShortcutManager.registerShortcut(combo, handler, scope, priority)`
  - All shortcuts use `scope: 'canvas'` and `priority: 200` (higher than canvas selection at 100)
  - Register all shortcuts from `design.md` §R5.3 table:
    - `P` → `setActiveTool('pen')`
    - `Shift+P` → cycle pen variants: `pen → curvaturePen → freeformPen → pen`
    - `A` → `setActiveTool('directSelection')`
    - `Shift+C` → `setActiveTool('convertPoint')`
    - `+` → `setActiveTool('addAnchor')`
    - `-` → `setActiveTool('deleteAnchor')`
    - `Escape` → if `isDrawingPath` then `cancelDrawingPath()` else `setActiveTool('select')`
    - `Enter` → if `isDrawingPath` then `finishDrawingPath()` (close path)
    - `Delete` / `Backspace` → if `isDrawingPath` then delete last anchor (Backspace); if `selectedAnchorIds.length > 0` then delete selected anchors (Delete)
  - Cleanup: unregister all shortcuts on unmount
  - Guards: shortcuts only fire when canvas is focused (check `document.activeElement` or active ref)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Modify `frontend/views/dashboard/certificates/template-editor/ShortcutManager.ts` (if needed):
  - Verify `registerShortcut` method signature supports the pen tool shortcut registrations
  - Verify conflict detection works for `Delete` at scope `'canvas'` priority 100 (element deletion) vs pen tool at priority 200 (anchor deletion, fires only when `selectedAnchorIds` is non-empty)
  - Add `unregisterAll(scope: string, ownerId: string)` method if not already present (for batch cleanup)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### Files to Create/Modify

- `frontend/views/dashboard/certificates/template-editor/hooks/usePenToolShortcuts.ts` (new)
- `frontend/views/dashboard/certificates/template-editor/ShortcutManager.ts` (modify — verify/add methods)

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/template-editor/hooks/usePenToolShortcuts.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/template-editor/ShortcutManager.ts --lifecycle codescene
```

---

## T49 — i18n Keys for Pen Tool

> **Files**:
> - `shared/locale/types/dashboard/certificates/templateEditor.ts` (modify — add `penTool` namespace interface)
> - `shared/locale/ar/dashboard/certificates/templateEditor.ts` (modify — add Arabic translations)
> - `shared/locale/en/dashboard/certificates/templateEditor.ts` (modify — add English translations)
> **Depends On**: T45 (type definitions)
> **Time Budget**: 2 hours

### Subtasks

- [ ] Read `shared/AGENTS.md` (i18n system rules: compile-time, per-locale implementation, pluralization functions)
- [ ] Modify `shared/locale/types/dashboard/certificates/templateEditor.ts`:
  - Add `penTool` interface per `design.md` §R5.5 with all 20+ keys
  - `anchorCount` pluralization: `(count: number) => string`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Modify `shared/locale/en/dashboard/certificates/templateEditor.ts`:
  - Add English translations for all `penTool.*` keys
  - `penTool.pen`: `"Pen Tool"`
  - `penTool.curvaturePen`: `"Curvature Pen Tool"`
  - `penTool.freeformPen`: `"Freeform Pen Tool"`
  - `penTool.addAnchor`: `"Add Anchor Point"`
  - `penTool.deleteAnchor`: `"Delete Anchor Point"`
  - `penTool.convertPoint`: `"Convert Point Tool"`
  - `penTool.modeShape`: `"Shape"`
  - `penTool.modePath`: `"Path"`
  - `penTool.modeSelection`: `"Selection"`
  - `penTool.autoAddDelete`: `"Auto Add/Delete"`
  - `penTool.rubberBand`: `"Rubber Band"`
  - `penTool.opStroke`: `"Stroke Path"`
  - `penTool.opFill`: `"Fill Path"`
  - `penTool.opToSelection`: `"Path to Selection"`
  - `penTool.opStrokeToShape`: `"Stroke to Shape"`
  - `penTool.opToShape`: `"Path to Shape"`
  - `penTool.tooltipPenGroup`: `"Pen Tool Group"`
  - `penTool.drawingHint`: `"Click to add anchor, drag for curve"`
  - `penTool.drawingHintCurvature`: `"Click and drag to draw smooth curves"`
  - `penTool.drawingHintFreeform`: `"Draw freely, path auto-traces your movement"`
  - `penTool.pathClosed`: `"Closed"`
  - `penTool.pathOpen`: `"Open"`
  - `penTool.anchorCount`: `(count: number) => count === 1 ? \`1 anchor\` : \`${count} anchors\``
  - `penTool.cancelDrawing`: `"Cancel Drawing"`
  - `penTool.closePath`: `"Close Path"`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Modify `shared/locale/ar/dashboard/certificates/templateEditor.ts`:
  - Add Arabic translations for all `penTool.*` keys
  - `penTool.pen`: `"أداة القلم"`
  - `penTool.curvaturePen`: `"أداة القلم المنحني"`
  - `penTool.freeformPen`: `"أداة القلم الحر"`
  - `penTool.addAnchor`: `"إضافة نقطة ربط"`
  - `penTool.deleteAnchor`: `"حذف نقطة ربط"`
  - `penTool.convertPoint`: `"أداة تحويل النقطة"`
  - `penTool.modeShape`: `"شكل"`
  - `penTool.modePath`: `"مسار"`
  - `penTool.modeSelection`: `"تحديد"`
  - `penTool.autoAddDelete`: `"إضافة/حذف تلقائي"`
  - `penTool.rubberBand`: `"شريط المطاط"`
  - `penTool.opStroke`: `"مسح المسار"`
  - `penTool.opFill`: `"تعبئة المسار"`
  - `penTool.opToSelection`: `"المسار إلى تحديد"`
  - `penTool.opStrokeToShape`: `"المسح إلى شكل"`
  - `penTool.opToShape`: `"المسار إلى شكل"`
  - `penTool.tooltipPenGroup`: `"مجموعة أداة القلم"`
  - `penTool.drawingHint`: `"انقر لإضافة نقطة ربط، اسحب لمنحنى"`
  - `penTool.drawingHintCurvature`: `"انقر واسحب لرسم منحنيات ناعمة"`
  - `penTool.drawingHintFreeform`: `"ارسم بحرية، يتتبع المسار حركتك تلقائياً"`
  - `penTool.pathClosed`: `"مغلق"`
  - `penTool.pathOpen`: `"مفتوح"`
  - `penTool.anchorCount`: `(count: number) => count === 1 ? \`1 نقطة ربط\` : \`${count} نقاط ربط\``
  - `penTool.cancelDrawing`: `"إلغاء الرسم"`
  - `penTool.closePath`: `"إغلاق المسار"`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### Files to Create/Modify

- `shared/locale/types/dashboard/certificates/templateEditor.ts` (modify — add penTool interface)
- `shared/locale/ar/dashboard/certificates/templateEditor.ts` (modify — add Arabic translations)
- `shared/locale/en/dashboard/certificates/templateEditor.ts` (modify — add English translations)

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts shared/locale/types/dashboard/certificates/templateEditor.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts shared/locale/ar/dashboard/certificates/templateEditor.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts shared/locale/en/dashboard/certificates/templateEditor.ts --lifecycle codescene
```

---

## Round 5 Execution Order

```
Phase R5-A (sequential):  T45 (types + store)
Phase R5-B (parallel):    T46 (pen tool toolbar group), T48 (keyboard shortcuts), T49 (i18n keys)
Phase R5-C (sequential):  T47 (tool options bar — depends on T46 toolbar group + T45 store)
```

**Round 5 total estimated time**: 20 hours (parallelizable to ~12 wall-clock hours via the parallel phase R5-B)

## Round 5: Context Menus Tasks

> Round 5 task list for Plan 10 — context menu system. Covers the canonical `contextMenuService` store + `ContextMenuHost`, shared builders/filters/keyboard nav/ submenu trigger, panel-level menus (swatches, properties, color), toolbar context menu, menu bar context menu, and the Shift+F10 / Context Menu key shortcut integration. Plan 11 §R5 and Plan 12 §R5 import from this round. Total R5 scope for Plan 10: 11 tasks (~16 hours).

### R5-T1: Context Menu Service & Host Component

- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/contextMenuService.ts` (new)
  - Zustand-backed service (exported as `useContextMenuService` hook)
  - `interface ContextMenuState { openMenuId: string | null; anchorPosition: { x: number; y: number } | null; menuItems: ContextMenuItem[]; closeOnBlur: boolean; openMenu: (id: string, position: { x: number; y: number }, items: ContextMenuItem[]) => void; closeMenu: () => void; updateItems: (items: ContextMenuItem[]) => void; }`
  - `ContextMenuItem` type (id, labelKey, label, shortcut, icon, disabled, hidden, checked, submenu, submenuDelayMs=200, onSelect, separator, isDangerous, confirmMessageKey)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/ContextMenuHost.tsx` (new)
  - Subscribes to the service via `useContextMenuService`
  - Renders an MUI v9 `Menu` with `anchorReference="anchorPosition"`, `anchorPosition={{ top: position.y, left: position.x }}`, open when `openMenuId !== null`
  - `sx={{}}` for Paper styled via `contextMenuPaperSx` (R5-T8 below) — no style props
  - Viewport-flip logic in `useLayoutEffect`: measures menu rect, flips openUp/openLeft if overflow
  - Closes on Escape / outside click / window blur — uses `useOutsideClickClose` (R5-T7)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-T2: Shared Menu Item Builders

- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/menuItemBuilders.ts` (new)
  - Pure functions: `buildToolbarContextMenu`, `buildSwatchesContextMenu`, `buildPropertiesContextMenu`, `buildColorContextMenu`, `buildMenuBarContextMenu`
  - Each returns `ContextMenuItem[]` with i18n `labelKey` (no hardcoded strings)
  - Each uses `id:` namespaces like `toolbar.editToolbar`, `swatches.new`, `color.copyAsHex` for unique `aria-activedescendant` keys
  - Item IDs also map back to keyboard-nav focus IDs
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-T3: Smart Item Filtering Helper

- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/menuItemFilter.ts` (new)
  - `interface MenuContextDescriptor { selectionTypes: CanvasElementType[]; selectionCount: number; clipboardHasContent: boolean; clipboardHasImage: boolean; clipboardHasText: boolean; panelMode: 'idle' | 'editing'; hasChildren: boolean; isGroup: boolean; }`
  - `export function filterMenuItems(items: ContextMenuItem[], ctx: MenuContextDescriptor): ContextMenuItem[]`
  - Rules: Cut/Copy disabled at selectionCount 0; Paste hidden when `!clipboardHasContent`; image-specific items hidden when selection has no image elements; Group disabled when `selectionCount <= 1` or all selected are groups; Ungroup disabled when none selected is a group; Lock toggle `checked` when all selected are locked
  - Items with `hidden: true` are not rendered; items with `disabled: true` render greyed
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/useMenuContextDescriptor.ts` (new)
  - Subscribes to `useCanvasStore` (selection / clipboard) with `useShallow` from `zustand/react/shallow`
  - Returns `MenuContextDescriptor` — re-renders only on selection/clipboard changes
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-T4: Keyboard Navigation & Submenu Trigger

- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/useMenuKeyboardNav.ts` (new)
  - `interface UseMenuKeyboardNavOpts { items: ContextMenuItem[] }`
  - Returns `{ activeIndex, setActiveIndex, onKeyDown }`
  - ArrowDown/Up moves among enabled+visible items (wraps); Home/End jump to first/last
  - Enter invokes `onSelect`; Escape closes; ArrowRight opens submenu; ArrowLeft collapses
  - Tab is suppressed inside menus
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/SubmenuTrigger.tsx` (new)
  - Props: `{ item: ContextMenuItem; onParentSelect: () => void; parentMenuId: string; closeAllMenus: () => void; }`
  - `onMouseEnter` starts 200ms timer (`submenuDelayMs`, default per item); fires submenu open
  - `onMouseLeave` clears the timer; if submenu open, start a 150ms rollback timer
  - Mouse-entering the submenu cancels the rollback timer (so the submenu stays open during diagonal mouse moves)
  - ArrowRight opens immediately (no delay); ArrowLeft collapses
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-T5: Toolbar Context Menu & Customize Dialog

- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/ToolbarContextMenu.tsx` (new)
  - Attaches `onContextMenu` to `EditorToolbar` root Box
  - Calls `buildToolbarContextMenu` from R5-T2
  - Invokes the `contextMenuService.openMenu('toolbar', { x, y }, items)`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `frontend/views/dashboard/cert/templates/editor/dialogs/CustomizeToolbarDialog.tsx` (new)
  - Two-column `List` of available / current tools, drag-between via `@dnd-kit/core`
  - Confirms via `uiStore.setToolbarCustomization(ids)` on dialog close
  - Cancel restores prior customization
  - All MUI v9 `sx={{}}` — no style props; all colors from `theme.palette`
  - All labels via `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` from `@/shared/locale/client`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/useToolbarContextMenu.ts` (new)
  - Returns `{ onContextMenu, visibleTools, iconSize, showToolNames, resetToolbar }`
  - Reads/writes `uiStore.toolbarCustomization`, `toolbarIconSize`, `toolbarShowToolNames`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-T6: Swatches Panel Context Menu

- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/SwatchesContextMenu.tsx` (new)
  - Menu: New Swatch, Edit Swatch, Delete Swatch (disabled if swatchCount <= 1 / no selection), separator, Import Swatches, Export Swatches, separator, Swatch View submenu (Small/Medium/Large)
  - On "empty area" right-click, suppress Edit/Delete (only show create/import — per Photoshop behavior)
  - On swatch right-click, full menu with Edit/Delete enabled per selection
  - Delete shows a confirm Mini Dialog (item has `isDangerous: true`)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `frontend/views/dashboard/cert/templates/editor/utils/swatchImportExport.ts` (new)
  - `parseAse(buffer: ArrayBuffer): Swatch[]` — Adobe Swatch Exchange parser
  - `parseAco(buffer: ArrayBuffer): Swatch[]` — Adobe Color parser
  - `parseJsonSwatches(text: string): Swatch[]`
  - `exportAse(swatches: Swatch[]): ArrayBuffer`
  - `exportAco(swatches: Swatch[]): ArrayBuffer`
  - `exportJson(swatches: Swatch[]): string`
  - `interface Swatch { name: string; hex: string; }`
  - Pure functions, no React, no `console.*` (use `logger` from `@/backend/lib/logger` if needed)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `frontend/common/stores/cert/swatchStore.ts` (new, if not already created in earlier rounds)
  - Zustand store: `swatches: Swatch[]`, `addSwatch`, `editSwatch`, `deleteSwatch`, `importSwatches`, `exportSwatches`, `setSwatchView`, `swatchView: 'small' | 'medium' | 'large'`
  - Dedupe on import by hex value
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-T7: Properties Panel & Color Panel Context Menus

- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/PropertiesPanelContextMenu.tsx` (new)
  - Menu: Copy Properties (disabled if no selection), Paste Properties (disabled if `clipboardStore.propertiesClipboard` is null), Reset to Defaults, separator, Properties Panel Options
  - "Properties Panel Options..." opens a small `Dialog` for configuring visible/collapsed sections + panel width
  - State persists in `uiStore.propertiesPanelPrefs`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/ColorPanelContextMenu.tsx` (new)
  - Menu: Add to Swatches (disabled if swatch already exists or limit reached), Copy Color as Hex, Copy Color as RGB, Copy Color as HSL, separator, Color Picker Mode submenu (HSL/RGB/HSV/CMYK)
  - Copy actions call `navigator.clipboard.writeText(formattedColor)`
  - Color Picker Mode selection persists in `uiStore.colorPickerMode`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `frontend/views/dashboard/cert/templates/editor/utils/colorFormatUtils.ts` (new)
  - `rgbToHex({r,g,b}): string`, `rgbToHsl({r,g,b}): {h,s,l}`, `rgbToHsv({r,g,b}): {h,s,v}`, `rgbToCmyk({r,g,b}): {c,m,y,k}`, `hslToRgb`, `hsvToRgb`, `cmykToRgb`
  - Pure math functions — no external packages
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-T8: Menu Bar Context Menu & Outside Click Close Hook

- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/MenuBarContextMenu.tsx` (new)
  - Menu: Customize Menu Bar, separator, Show Full Menus (toggle), separator, Reset Menu Bar
  - Reads/writes `uiStore.menuBarShowFullMenus`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/useOutsideClickClose.ts` (new)
  - Hook consumed by `ContextMenuHost`; attaches `pointerdown` on document, `keydown` for Escape, `blur` on window, `scroll` on canvas root
  - Calls `contextMenuService.closeMenu()` on any of these triggers
  - Also closes when any new editor-level keyboard shortcut starts (intercepts at editor root listener)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/contextMenuTheme.ts` (new)
  - `contextMenuPaperSx(theme: Theme): SxProps<Theme>` — `backgroundColor: theme.palette.background.paper`, `color: theme.palette.text.primary`, `boxShadow: theme.shadows[8]`, `border: 1px solid theme.palette.divider`
  - Item heights 32px, font 13px, disabled opacity 0.35 (not invisible), dangerous item via `theme.palette.error.main`
  - No hardcoded colors
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-T9: Keyboard Shortcuts Hook for Context Menu Invocation

- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/useContextMenuShortcuts.ts` (new)
  - Listens on the editor root for `Shift+F10` and `ContextMenu` key events
  - On `Shift+F10`: reads `document.activeElement`'s `data-context-menu-target` attribute → calls the corresponding menu builder + openMenu
  - On `ContextMenu` key: invokes the menu for the active selection, or the focused region if no selection
  - Uses `e.preventDefault()` to suppress the browser's default context menu where possible
  - Falls back to `Shift+F10` on Mac keyboards lacking the Context Menu key
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-T10: Test Suite

- [ ] Create `test/unit/colorFormatUtils.test.ts` (new)
  - Test: `rgbToHex({255,255,255}) === '#FFFFFF'`, `rgbToHex({0,0,0}) === '#000000'`
  - Test: round-trip `rgbToHsl` then `hslToRgb` within tolerance
  - Test: round-trip `rgbToHsv` then `hsvToRgb` within tolerance
  - Test: round-trip `rgbToCmyk` then `cmykToRgb` within tolerance
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `test/unit/swatchImportExport.test.ts` (new)
  - Test: `parseJsonSwatches`, `exportJson` round-trip stable
  - Test: `parseAse` handles a minimal valid sample
  - Test: `exportAse` produces a buffer with the "ASEF" magic header
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-T11: Knowledge Propagation

- [ ] Update `frontend/IMPLEMENTATION_LEARNINGS.md` (append-only)
  - Add entry: the submenu hover delay (200ms open + 150ms rollback) is essential to match Adobe UX; using state for the timer causes re-renders — use `useRef` timers
  - Add entry: `aria-activedescendant` for active-item tracking avoids `scrollIntoView` jank during arrow-key navigation
  - Add entry: viewport-flip on `ContextMenuHost` is `useLayoutEffect`-measured — not CSS-only — because the menu mount has to settle before measuring
- [ ] Update `frontend/COMPONENT_PATTERNS.md` (append-only)
  - Add "Context Menu Host" pattern: single-host architecture, avoiding per-target `Menu` mounts
  - Add "Smart Item Filtering" pattern: builder + `filterMenuItems` separation for testable menu composition
- [ ] Update `frontend/AGENTS.md` (append-only)
  - Reference `contextMenuService` and `ContextMenuItem` as the canonical context menu system for Plans 10, 11, 12
  - Note the shared `frontend/views/dashboard/cert/templates/editor/contextMenus/` location — must be imported (not redefined) by Plan 11 and 12
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### Instruction File & AGENTS.md Discovery (Round 5 Append, Plan 10)

| Task | Files Created/Modified | AGENTS.md to Read | Instructions to Read |
|---|---|---|---|
| R5-T1 | `contextMenus/contextMenuService.ts`, `contextMenus/ContextMenuHost.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T2 | `contextMenus/menuItemBuilders.ts` | `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T3 | `contextMenus/menuItemFilter.ts`, `contextMenus/useMenuContextDescriptor.ts` | `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T4 | `contextMenus/useMenuKeyboardNav.ts`, `contextMenus/SubmenuTrigger.tsx` | `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T5 | `contextMenus/ToolbarContextMenu.tsx`, `dialogs/CustomizeToolbarDialog.tsx`, `contextMenus/useToolbarContextMenu.ts` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T6 | `contextMenus/SwatchesContextMenu.tsx`, `utils/swatchImportExport.ts`, `frontend/common/stores/cert/swatchStore.ts` | `frontend/stores/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T7 | `contextMenus/PropertiesPanelContextMenu.tsx`, `contextMenus/ColorPanelContextMenu.tsx`, `utils/colorFormatUtils.ts` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T8 | `contextMenus/MenuBarContextMenu.tsx`, `contextMenus/useOutsideClickClose.ts`, `contextMenus/contextMenuTheme.ts` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T9 | `contextMenus/useContextMenuShortcuts.ts` | `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T10 | `test/unit/{colorFormatUtils,swatchImportExport}.test.ts` | `AGENTS.md` | `.agents/instructions/tests.instructions.md` |
| R5-T11 | `frontend/IMPLEMENTATION_LEARNINGS.md`, `frontend/COMPONENT_PATTERNS.md`, `frontend/AGENTS.md` (all append-only) | `frontend/AGENTS.md`, `AGENTS.md` | — |

### Round 5 Execution Order (Plan 10 Context Menus)

```
Phase R5-A (sequential): R5-T1 (service + host — the foundation everything else mounts into)
Phase R5-B (parallel): R5-T2 (builders), R5-T3 (filter + context descriptor hook)
Phase R5-C (sequential): R5-T4 (keyboard nav + submenu trigger — both wait on T1 host)
Phase R5-D (parallel): R5-T5 (toolbar + customize dialog), R5-T6 (swatches + import/export), R5-T7 (properties + color panel), R5-T8 (menu bar + outside-click + theme), R5-T9 (keyboard invocation hook) — all wait on T1-T4
Phase R5-E (parallel): R5-T10 (test suite — waits on T5-T9 implementation)
Phase R5-F (sequential): R5-T11 (knowledge propagation — waits on all of above)
```

**Plan 10 R5 (Context Menus) total estimated time**: ~16 hours → ~8 wall-clock hours with the parallel phases R5-B, R5-D, R5-E.

> All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks (tsgo → biome → lint → codescene). The lint queue server must be running before any lint call. See `AGENTS.md` §"Lint Queue Server" for startup commands.

---

## Round 5: Advanced Layers Tasks

> Tasks for the fourth Round 5 domain — **Advanced Layers Panel**. Mirrors `design.md` §"Round 5: Advanced Layers Panel". Quality model: every task ends with `**Quality loop**: per-file progressive verification via `scripts/health/sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene in one command, short-circuiting on first failure).
>
> **Note**: Per-row layer interactions, layer operations, groups, blending, clipping, and layer properties are tasks in Plan 12 §"Round 5: Advanced Layers Tasks". Plan 10 tasks cover only the **panel chrome** (workspace placement, header, list shell, options dialog, resize, i18n, store panel-state additions).

### R5 Layers Tasks Dependencies

```
LY-T01 (store: panel-chrome state + derived selectors)
  ├─→ LY-T02 (LayersWorkspacePanel shell — dock positions + resize)
  │       ├─→ LY-T03 (AdvancedLayersPanelHeader)
  │       └─→ LY-T04 (AdvancedLayersList shell — virtualizer + empty state)
  │
  ├─→ LY-T05 (i18n: type schema extend + AR/EN values)
  │       └─→ (LY-T06 integration — depends on LY-T02..LY-T05)
  │
  └─→ LY-T07 (LayerPanelOptionsDialog)
         └─→ LY-T09 (knowledge propagation)
```

**Execution order**: LY-T01 → LY-T02 → (LY-T03, LY-T04 in parallel; LY-T05 type-schema branch) → LY-T07 → LY-T06 → LY-T09

**Estimated effort**: 14 hours (parallelizable to ~9 wall-clock hours via LY-T03/LY-T04 parallelism)

---

### LY-T01 — Layers Panel Chrome Store Slice

**Estimated time**: 1.5 hours
**Depends on**: Plan 12 §R5 LY-T01 (the canonical `useTemplateElementEditorStore` — Plan 10 only adds panel-chrome fields; coordinate so Plan 12's store is the single owner)
**Requirements**: design.md §R5.8

- [ ] **Read applicable AGENTS.md** (before working):
  - `frontend/common/stores/AGENTS.md` (state file conventions — no `File`/`Blob` serialization)
  - `AGENTS.md` root (`@/*` path alias, NEVER hardcode colors)
  - `frontend/AGENTS.md`

- [ ] **Read applicable instruction files**:
  - `.agents/instructions/frontend.instructions.md`

- [ ] **Modify** `frontend/common/stores/certificates/templateElementEditorStore.ts`:
  - Add `LayerPanelOptions` interface: `{ thumbnailSize: 'small' | 'medium' | 'large'; showGroupThumbnails: boolean; sortOrder: 'top-to-bottom' | 'bottom-to-top' }`
  - Add `PanelDock` type: `'right' | 'left' | 'floating' | 'collapsed'`
  - Add `LayerQuickFilter` type: `'all' | 'visible' | 'locked' | 'text' | 'shapes' | 'selected'`
  - Add state fields: `layerPanelOptions`, `panelDock`, `panelWidth`, `panelHeight`, `layerFilterText`, `layerQuickFilter`, `layerFilterModified`
  - Add actions: `setLayerPanelOption`, `setPanelDock`, `setPanelWidth` (clamp 240–480), `setPanelHeight` (clamp 360–720), `setLayerFilterText`, `setLayerQuickFilter`, `setLayerFilterModified`
  - Add `selectFilteredLayerIds` selector (resolves name+quick+modified filters against `layers`/`groups` from Plan 12 §R5 LY-T01) — default export for `useShallow` consumers
  - Add `selectTopLevelLayerCount` derived selector
  - Defaults: `layerPanelOptions = { thumbnailSize: 'medium', showGroupThumbnails: true, sortOrder: 'top-to-bottom' }`, `panelDock = 'right'`, `panelWidth = 300`, `panelHeight = 480`, `layerFilterText = ''`, `layerQuickFilter = 'all'`, `layerFilterModified = false`
  - Filter text usage uses `name.normalize('NFC').toLocaleLowerCase(rootLocale)` for Unicode casefold (per design.md §R5.6)
  - **No hardcoded colors** in the store actions (the store does not own theme — the components do)

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
  - File: `frontend/common/stores/certificates/templateElementEditorStore.ts`

**Files to Create/Modify:**
- `frontend/common/stores/certificates/templateElementEditorStore.ts` (modify — extend, do not rewrite existing R4-T21 store actions)

---

### LY-T02 — Layers Workspace Panel Shell

**Estimated time**: 2.5 hours
**Depends on**: LY-T01
**Requirements**: design.md §R5.1, §R5.5

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
  - `AGENTS.md` root (`@/*` path alias, MUI v9: `sx={}` ban on style props, NEVER hardcode colors)

- [ ] **Read applicable instruction files**:
  - `.agents/instructions/frontend.instructions.md`

- [ ] **Create** `frontend/views/dashboard/certificates/template-editor/workspace/LayersWorkspacePanel.tsx`:
  - Imports `useTemplateElementEditorStore` (selectors: `panelDock`, `panelWidth`, `panelHeight`) via `useShallow` from `zustand/react/shallow`
  - Imports `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` from `@/shared/locale/client`
  - Renders children inside a dock-aware shell:
    - `right` / `left`: `flex` slot with `sx={{ width: panelWidth, flexShrink: 0, bgcolor: 'background.paper' }}` + resize bar on the inside edge
    - `floating`: renders a `Draggable` floating window as `Paper` with `elevation={6}`, `sx={{ position: 'absolute', width: panelWidth, height: panelHeight, backdropFilter: 'blur(2px)', bgcolor: (theme) => theme.palette.background.paper + 'CC', zIndex: 1300 }}`
    - `collapsed`: 48 px-wide icon strip with `LayersOutlined` `IconButton`; clicking calls `setPanelDock('right')` (restore to default)
  - Resize bar: `Box` with `sx={{ cursor: 'col-resize', width: 6, bgcolor: 'transparent', '&:hover': { bgcolor: 'action.hover' } }}`; `onMouseDown` starts a one-time `pointermove`/`pointerup` listener that updates `setPanelWidth` (clamp 240–480); for floating mode, also expose a bottom horizontal resize bar that updates `setPanelHeight` (clamp 360–720)
  - MUI `Grow`/`Slide` transitions on `panelDock` change (`Slide` `direction` derives from `dock`)
  - Children slot: `{children}` (the inner `AdvancedLayersPanel` from Plan 12 §R5 is rendered here by the editor layout)
  - Root `Box` with `sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}`; `role="region"` via `Box` automatically; `aria-label={t("certificateTemplateEditor.layersPanel.title")}` — NEVER hardcode "Layers" as a literal
  - All colors via theme palette; never literal hex

- [ ] **Modify** `frontend/views/dashboard/certificates/template-editor/TemplateEditorDesktopView.tsx` (extend existing from T22):
  - Replace the existing left-sidebar `LayerPanelSection.desktop` slot with `<LayersWorkspacePanel><AdvancedLayersPanel /></LayersWorkspacePanel>` placed in the **right** sidebar above the `PropertiesPanel`
  - The left-sidebar layer panel can be kept as a fallback or removed per design DD-1 — leave as-is for now (R5 always renders in right sidebar; removing R4 left-sidebar panel is a separate cleanup task)
  - Wire `panelDock` from store so the panel can fly out without losing the children tree

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
  - Files: `frontend/views/dashboard/certificates/template-editor/workspace/LayersWorkspacePanel.tsx`, `frontend/views/dashboard/certificates/template-editor/TemplateEditorDesktopView.tsx`

**Files to Create/Modify:**
- `frontend/views/dashboard/certificates/template-editor/workspace/LayersWorkspacePanel.tsx` (new)
- `frontend/views/dashboard/certificates/template-editor/TemplateEditorDesktopView.tsx` (modify — slot for R5 panel; do NOT remove R4-T7 layer section)

---

### LY-T03 — Advanced Layers Panel Header

**Estimated time**: 3 hours
**Depends on**: LY-T02
**Requirements**: design.md §R5.2

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
  - `AGENTS.md` root

- [ ] **Read applicable instruction files**:
  - `.agents/instructions/frontend.instructions.md`

- [ ] **Create** `frontend/views/dashboard/certificates/template-editor/layersPanel/AdvancedLayersPanelHeader.tsx`:
  - `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` from `@/shared/locale/client`
  - `useTemplateElementEditorStore` selectors (via `useShallow`): `selectTopLevelLayerCount`, `layerFilterText`, `setLayerFilterText`, `layerQuickFilter`, `setLayerQuickFilter`, `setPanelDock`
  - Title row: `Typography` ("Layers" from i18n) + count `Box` rendered as badge with `sx={{ borderRadius: '50%', minWidth: 20, height: 20, px: 0.5, bgcolor: (theme) => theme.palette.primary.main, color: (theme) => theme.palette.primary.contrastText, typography: 'caption', display: 'flex', alignItems: 'center', justifyContent: 'center' }}` — NEVER hardcode badge color
  - Options menu (≡): `IconButton` `MoreVertOutlined` opens `Menu`. Items per design §R5.2 (Panel Options…, Merge Visible, Flatten Image, Delete Hidden Layers, Dock → submenu, Close Panel). `Merge Visible` etc. dispatch the store actions defined in Plan 12 §R5 LY-T (this Plan 10 component calls into the shared store; do not duplicate logic)
  - `Delete Hidden Layers` shows a confirm `Dialog` before running (uses `t("certificateTemplateEditor.layersPanel.menu.deleteHiddenConfirm")` for the body)
  - Search/filter bar: `OutFilledInputBase` (or `TextField` `size="small"` `fullWidth`) with `StartAdornment={SearchOutlined}`, `EndAdornment` = clear (`X`) button visible only when `layerFilterText !== ''`; `onKeyDown` `Escape` clears; placeholder = `t("certificateTemplateEditor.layersPanel.searchPlaceholder")`; casefold via `name.normalize('NFC').toLocaleLowerCase(rootLocale)`
  - Quick filter `ToggleButtonGroup` (`exclusive`): All `SelectAllOutlined`, Visible `VisibilityOutlined`, Locked `LockOutlined`, Text `TextFieldsOutlined`, Shapes `CategoryOutlined`, Selected `CheckCircleOutlined`. `selected` `ToggleButton` `sx={{ bgcolor: (theme) => theme.palette.primary.main, color: (theme) => theme.palette.primary.contrastText }}` — NEVER hardcoded colors
  - Four vertical regions wrapped in `Stack` `direction="column"` `spacing={0}`; each region `Box` with bottom border `sx={{ borderBottom: 1, borderColor: 'divider' }}`
  - All `aria-label`s from i18n keys per design §R5.9; never literal "Layers"

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
  - File: `frontend/views/dashboard/certificates/template-editor/layersPanel/AdvancedLayersPanelHeader.tsx`

**Files to Create/Modify:**
- `frontend/views/dashboard/certificates/template-editor/layersPanel/AdvancedLayersPanelHeader.tsx` (new)

---

### LY-T04 — Advanced Layers List Shell

**Estimated time**: 2.5 hours
**Depends on**: LY-T02
**Requirements**: design.md §R5.3, §R5.6

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
  - `AGENTS.md` root (PERF: virtualization guidance)
  - `AGENTS.md` root §"Verification Loop"

- [ ] **Read applicable instruction files**:
  - `.agents/instructions/frontend.instructions.md`

- [ ] **Create** `frontend/views/dashboard/certificates/template-editor/layersPanel/AdvancedLayersList.tsx`:
  - `useTemplateElementEditorStore` selectors via `useShallow`: `selectFilteredLayerIds`, `selectTopLevelLayerCount`, `selectedElementIds`, `layerPanelOptions.sortOrder`
  - Virtualization gated behind threshold: `const [virtualized, setVirtualized] = useState(false);` — when `topLevelLayerCount >= 50` use `@tanstack/react-virtual`'s `useVirtualizer` with `measureElement` for dynamic row heights; below threshold, render a flat `List` of `AdvancedLayerRow` (Plan 12 §R5 LY-T05)
  - Sort order: `sortOrder === 'top-to-bottom'` → descending z-index (default); `bottom-to-top` → reversed
  - Indentation model: each row `sx={{ pl: layer.depth * 2 }}` where `l.depth` derives from group nesting
  - Empty state (when `topLevelLayerCount === 0`): `Box` `sx={{ p: 3, textAlign: 'center' }}` with `LayersOutlined` icon (48 px, `sx={{ color: 'text.disabled' }}`) + `Typography` `t("certificateTemplateEditor.layersPanel.emptyState")`. Quick filters + search are `disabled` in empty state
  - **Scroll-to-selected**: when `selectedElementIds` changes and the new selection is outside the current scroll window, call virtualizer `scrollToIndex(idx, { align: 'center' })`. 120 ms debounce so multi-shift marquee selection does not storm
  - Filter behaviour: non-matching rows hidden via `display: none` on wrapper (NOT unmounted — preserves `@dnd-kit` DndD-context + keyboard focus); use the virtualizer's `measureElement` filter hook
  - **Reorder via drag**: delegate to `@dnd-kit/sortable` (already installed in R4-T7); wraps rows in `DndContext` + `SortableContext` matching the R4-T7 pattern; on `onDragEnd` calls Plan 12 `reorderLayers(orderedIds)` (R4-T21 action)
  - Root `Box` `sx={{ overflowY: 'auto', flex: 1, height: '100%' }}`; `role="listbox"` + `aria-label={t("certificateTemplateEditor.layersPanel.title")}` for screen readers

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
  - File: `frontend/views/dashboard/certificates/template-editor/layersPanel/AdvancedLayersList.tsx`

- [ ] Install `@tanstack/react-virtual` only if missing:
  - `bun add @tanstack/react-virtual`

**Files to Create/Modify:**
- `frontend/views/dashboard/certificates/template-editor/layersPanel/AdvancedLayersList.tsx` (new)

---

### LY-T05 — i18n: Type Schema + AR/EN Values

**Estimated time**: 1.5 hours
**Depends on**: LY-T01 (type schema branch)
**Requirements**: design.md §R5.7

- [ ] **Read applicable AGENTS.md**:
  - `shared/AGENTS.md` (i18n — never import from `@/frontend/**` etc.)
  - `AGENTS.md` root §"i18n / Localized Errors"

- [ ] **Read applicable instruction files**: (none — i18n files have no instruction file mapping)

- [ ] **Modify** `shared/locale/namespaces/dashboard/certificates/templateEditor.namespace.ts`:
  - Add `layersPanel` nested object to the `TemplateEditorLabels` interface per design §R5.7 (title, expand, collapse, searchPlaceholder, filterAll, filterVisible, filterLocked, filterText, filterShapes, filterSelected, filterModified, emptyState, panelOptions.*, menu.*)
  - Add EN locale defaults per design §R5.7 EN table; values inserted in the EN locale factory function (the type schema and the EN values MUST match key-for-key)

- [ ] **Modify** `shared/locale/namespaces/ar/dashboard/certificates/templateEditor.namespace.ts` (or the AR locale file location per the existing structure):
  - Add AR locale values per design §R5.7 AR table
  - Verify RTL handling (`dir="rtl"` is automatic from the locale config; AR values mirror EN)

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
  - Files: `shared/locale/namespaces/dashboard/certificates/templateEditor.namespace.ts`, `shared/locale/namespaces/ar/dashboard/certificates/templateEditor.namespace.ts` (verify the AR path matches the existing Round 5 Effects i18n additions)

**Files to Create/Modify:**
- `shared/locale/namespaces/dashboard/certificates/templateEditor.namespace.ts` (modify — append keys)
- `shared/locale/namespaces/ar/dashboard/certificates/templateEditor.namespace.ts` (modify — append AR values)

---

### LY-T06 — Integration: Wire Header + List into Workspace

**Estimated time**: 1 hour
**Depends on**: LY-T02, LY-T03, LY-T04, LY-T05
**Requirements**: design.md §R5.1 (composition contract)

- [ ] **Modify** `frontend/views/dashboard/certificates/template-editor/workspace/LayersWorkspacePanel.tsx` (extend):
  - Inside the shell, compose `<AdvancedLayersPanelHeader />` + `<AdvancedLayersList />` in a vertical `Stack`
  - Verify the dock states (`right`, `left`, `floating`, `collapsed`) all render the children correctly; collapsed state renders an icon strip with the panel title as `aria-label`
  - Verify keyboard `Tab` order flows header → list naturally (no manual tabindex hacking)

- [ ] **Modify** `frontend/views/dashboard/certificates/template-editor/TemplateEditorDesktopView.tsx` (extend LY-T02 slot):
  - Verify `<LayersWorkspacePanel>` mounts in right sidebar above `<PropertiesPanel>` and that `AdvancedLayersPanel` (Plan 12 §R5 LY-T02 — external dependency) is passed as children
  - If Plan 12 §R5 LY-T02 is not yet landed, render `<AdvancedLayersPanelPlaceholder />` (`Box` `sx={{ p: 2, color: 'text.disabled' }}` with `t("certificateTemplateEditor.layersPanel.comingSoon")` if that key exists, else a `Skeleton`) and surface a CROSS-FILE DEPENDENCY note to the orchestrator

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
  - Files: `frontend/views/dashboard/certificates/template-editor/workspace/LayersWorkspacePanel.tsx`, `frontend/views/dashboard/certificates/template-editor/TemplateEditorDesktopView.tsx`

**Files to Create/Modify:**
- `frontend/views/dashboard/certificates/template-editor/workspace/LayersWorkspacePanel.tsx` (modify)
- `frontend/views/dashboard/certificates/template-editor/TemplateEditorDesktopView.tsx` (modify — verify slot)

---

### LY-T07 — Layer Panel Options Dialog

**Estimated time**: 1.5 hours
**Depends on**: LY-T01 (store), LY-T03 (header wiring)
**Requirements**: design.md §R5.4

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
  - `AGENTS.md` root

- [ ] **Read applicable instruction files**:
  - `.agents/instructions/frontend.instructions.md`

- [ ] **Create** `frontend/views/dashboard/certificates/template-editor/layersPanel/LayerPanelOptionsDialog.tsx`:
  - `useTemplateElementEditorStore` selectors: `layerPanelOptions`, `setLayerPanelOption`, `panelDock`, `setPanelDock`
  - `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)`
  - `Dialog` with `DialogTitle={t("certificateTemplateEditor.layersPanel.panelOptions.title")}`
  - Thumbnail size `ToggleButtonGroup` (exclusive): Small `t("...thumbnailSmall")` (24), Medium `t("...thumbnailMedium")` (40, default), Large `t("...thumbnailLarge")` (64). Selected `sx={{ bgcolor: (theme) => theme.palette.primary.main, color: (theme) => theme.palette.primary.contrastText }}`
  - Show group thumbnails `Switch` (default `true`)
  - Sort order `RadioGroup`: `top-to-bottom` (default), `bottom-to-top`
  - Dock position `RadioGroup`: Right/Left/Floating/Collapsed — calls `setPanelDock`; clamps width/height to dock-appropriate ranges on change
  - All labels from i18n keys; NO hardcoded strings
  - Close on `Escape` and backdrop click (MUI default)

- [ ] Wire from `AdvancedLayersPanelHeader` ≡ menu `Panel Options…` item — opens dialog (`useState` local open flag is fine; not store)

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
  - File: `frontend/views/dashboard/certificates/template-editor/layersPanel/LayerPanelOptionsDialog.tsx`

**Files to Create/Modify:**
- `frontend/views/dashboard/certificates/template-editor/layersPanel/LayerPanelOptionsDialog.tsx` (new)
- `frontend/views/dashboard/certificates/template-editor/layersPanel/AdvancedLayersPanelHeader.tsx` (modify — wire the options-menu open handler)

---

### LY-T09 — Knowledge Propagation

**Estimated time**: 30 minutes
**Depends on**: LY-T01..LY-T07
**Requirements**: AGENTS.md §"AI Agent Communication Rules" (no SUMMARY.md; DO chat summary)

- [ ] **Modify** `frontend/COMPONENT_PATTERNS.md` (append-only):
  - Add a "Layers Workspace Panel Pattern" subsection describing dock transitions, virtualization threshold (50 rows), resize-clamp ranges, and `role="region"` accessibility
  - Note that the layers panel is the canonical place for chrome-state ownership; per-row data lives in the layer store

- [ ] **Modify** `frontend/AGENTS.md` (append a one-line pointer):
  - Under an existing "UI Patterns"/"Component Patterns" section (or end): `See COMPONENT_PATTERNS.md §"Layers Workspace Panel Pattern" for the dockable panel + virtualized list implementation pattern.`

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
  - Files: `frontend/COMPONENT_PATTERNS.md`, `frontend/AGENTS.md`

**Files to Create/Modify:**
- `frontend/COMPONENT_PATTERNS.md` (modify — append-only)
- `frontend/AGENTS.md` (modify — append-only pointer)

---

### Round 5 Advanced Layers Panel — Quick Effects-Style Execution Order

```
Phase LY-A (sequential):  LY-T01 (store: panel-chrome state)
Phase LY-B (sequential):  LY-T02 (LayersWorkspacePanel shell)
Phase LY-C (parallel):    LY-T03 (header), LY-T04 (list shell), LY-T05 (i18n type-schema branch)
Phase LY-D (sequential):  LY-T07 (options dialog)
Phase LY-E (sequential):  LY-T06 (integration)
Phase LY-G (sequential):  LY-T09 (knowledge propagation)
```

**Round 5 Advanced Layers Panel total (Plan 10 chunk)**: ~14 hours (parallelizable to ~9 wall-clock hours via LY-C parallelism)

### Full Plan 10 Time (Rounds 1-5 including Effects + Layers)

- Rounds 1-3 (T20-T28): ~35 hours → ~20 wall-clock hours
- Round 4 (T29-T44): ~38 hours → ~22 wall-clock hours
- Round 5 Effects Engine (FX-T01..FX-T08): ~20 hours → ~14 wall-clock hours
- Round 5 Advanced Layers Panel (LY-T01..LY-T09): ~14 hours → ~9 wall-clock hours
- **Plan 10 full (incl. Effects + Layers)**: ~107 hours → ~65 wall-clock hours

> Note: All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks. The lint queue server must be running before any lint call (see `AGENTS.md` §"Lint Queue Server").

## Round 5: Snap & Align Tasks — Plan 10 (Align Toolbar, Distribute Toolbar, View Menu)

> Round 5 is reused across independent feature domains per the established convention (Fill, Pen, Effects, **Snap & Align**). Design reference: Plan 10 §"Round 5: Snap & Align Engine". All quality loops use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` progressive checks.

### R5S-T1: Snap & Align Shared Types (Plan 10 owns the file)

- [ ] Create `frontend/common/stores/cert/snapAlignTypes.ts` (new)
  - Export `AlignAxis`, `AlignTarget`, `DistributeMode`, `DistributeFrom`, `SnapTargetKind`, `SnapSettings`, `SmartGuideColorToken`, `DEFAULT_SNAP_SETTINGS`
  - Pure type constants file (no React, no hooks) — canonical source for Plans 10/11/12
  - Verify by running `bun run scripts/health/sub-loop.ts frontend/common/stores/cert/snapAlignTypes.ts --lifecycle codescene`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Update `shared/locale/types/dashboard/certificates/templateEditor.ts` (modify)
  - Append the `align`, `alignTo`, `distribute`, `view`, `snapTo`, `snapSettings` nested type schemas (per Plan 10 §R5S.7)
  - Add the `distributeWithGap: (gap: number) => string` pluralization slot
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Update `shared/locale/en/.../templateEditor.ts` (modify)
  - Implement the new keys + EN `distributeWithGap` pluralization function `(gap) => \`Distribute with ${gap}px gap\``
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Update `shared/locale/ar/.../templateEditor.ts` (modify)
  - Implement the new keys + AR `distributeWithGap` pluralization `(gap) => \`توزيع بفجوة ${gap}px\``
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5S-T2: Align Toolbar Cluster

- [ ] Create `frontend/views/dashboard/cert/templates/editor/toolbar/AlignToolbarCluster.tsx` (new)
  - `IconButton` per alignment axis (`HorizontalAlignLeftOutlined`, `HorizontalAlignCenterOutlined`, `HorizontalAlignRightOutlined`, `VerticalAlignTopOutlined`, `VerticalAlignCenterOutlined`, `VerticalAlignBottomOutlined`)
  - Each `Tooltip` includes label + shortcut key per §R5S.1
  - Colours via `sx={(theme) => ({ color: theme.palette.text.primary })}` — never hardcoded
  - Re-renders only on `selectedElementIds` change — wrap the store selector with `useShallow`
  - Hidden (CSS `display: none`) when `selectedElementIds.length < 2`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `frontend/views/dashboard/cert/templates/editor/toolbar/AlignToSelect.tsx` (new)
  - 4 options: selection/canvas/firstSelected/key (key disabled when no key object set)
  - Auto-reset to `selection` if `keyObjectId` becomes null
  - Compact `Select` with `size="small"` and `sx={{ width: 140 }}`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5S-T3: Distribute Toolbar Cluster

- [ ] Create `frontend/views/dashboard/cert/templates/editor/toolbar/DistributeToolbarCluster.tsx` (new)
  - 4 distribute `IconButton`s + gap `TextField` with `slotProps.htmlInput` `min/max/aria-label`
  - `DistributeFrom` state via local `useState`, lifted to store only when committed (per §R5S.3)
  - Last-touched gap axis tracked in local state to drive Enter-key press behaviour
  - Disabled when `selectedElementIds.length < 3`; disabled `Tooltip` shows `i18n('distribute.requiresThree')`
  - Use custom 20×20 gap icons built from `Box`/`Divider` with `sx` theme strokes — never hardcoded colors
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5S-T4: View Menu Snap Section + Snap Settings Dialog

- [ ] Create `frontend/views/dashboard/cert/templates/editor/toolbar/ViewMenuSnapSection.tsx` (new)
  - Top-level checkbox `view.snap` (covers all sub-toggles) + `view.smartGuides` checkbox
  - `Snap To ▸` submenu with 6 `SnapTargetKind` checkboxes
  - Submenu items greyed when `snapEnabled === false`
  - Bottom "Snap Settings…" `MenuItem` opens the dialog
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `frontend/views/dashboard/cert/templates/editor/toolbar/SnapSettingsDialog.tsx` (new)
  - `Slider` for `snapThreshold` (2–20, default 6) with value badge
  - `Slider` for `smartGuideSensitivity` (2–20, default 6)
  - `RadioGroup` of 4 `Box` swatches for `SmartGuideColorToken` (colour via `theme.palette[token].main`)
  - All inputs have `aria-label` from i18n keys
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Modify `frontend/views/dashboard/cert/templates/editor/toolbar/ViewMenu.tsx` (modify)
  - Bind `ViewMenuSnapSection` after the existing grid/rulers toggle block
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5S-T5: Key Object Badge

- [ ] Create `frontend/views/dashboard/cert/templates/editor/toolbar/KeyObjectBadge.tsx` (new)
  - Floats a chip in the toolbar when `keyObjectId !== null` showing the chosen element's icon + name
  - Clear button removes the key object (calls store mutator shipped by Plan 11)
  - `Esc` while hovering clears the key object
  - Colours from `theme.palette.primary.main` / `theme.palette.onPrimary` (no hardcoded)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5S-T6: Align & Distribute Keyboard Shortcuts

- [ ] Create `frontend/views/dashboard/cert/templates/editor/useAlignShortcuts.ts` (new)
  - `useAlignShortcuts(): void` — registers `Alt+A`, `Ctrl+Shift+Left`, `Ctrl+Shift+C`, `Ctrl+Shift+Right`, `Ctrl+Shift+Up`, `Ctrl+Shift+M`, `Ctrl+Shift+Down`, `Ctrl+Shift+Alt+H`, `Ctrl+Shift+Alt+V` via `ShortcutManager` (from R4.3)
  - Scope: `'editor'`; priority: 12 (must NOT collide with `useFillStrokeShortcuts` priority 15)
  - Bail if `document.activeElement` is `INPUT`/`TEXTAREA`
  - Reads current `selectedElementIds`, `alignTarget`, `distributeFrom` from `useCanvasStore.getState()`
  - Dispatches via the store's `alignElements` / `distributeElements` actions (Plan 11 ships those mutations)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5S-T7: Modify EditorToolbar to Host R5S Clusters

- [ ] Update `frontend/views/dashboard/cert/templates/editor/EditorToolbar.tsx` (modify)
  - Insert `AlignToolbarCluster` + `AlignToSelect` + `DistributeToolbarCluster` + `KeyObjectBadge` between alignment tools and zoom controls (per design §R5S.1)
  - Register the cluster with `priority: 30` in the `ToolbarOverflow` system (must stay between Fill/Stroke priority 25 and GridToggle priority 60 — verify does not collide)
  - Each contained component shows a `Tooltip` with i18n label + shortcut
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5S-T9: Knowledge Propagation (Plan 10 Snap & Align)

- [ ] Update `frontend/IMPLEMENTATION_LEARNINGS.md` (append-only)
  - Add an entry documenting the `R5S-T2` toolbar cluster overflow priority 30 — must stay between Fill/Stroke (25) and GridToggle (60)
  - Add the `useShallow` invariant on `selectedElementIds` for the toolbar — re-render count must be 0 during drag
  - Add a note about the `alignTo === 'key'` dangling-reference guard — auto-reset to `selection` when `keyObjectId` becomes null
- [ ] Update `frontend/COMPONENT_PATTERNS.md` (append-only)
  - Add "Align & Distribute Toolbar Cluster" pattern (toolbar dropdown layout, key-object chip, smart-guide color tokens table)
- [ ] Update `frontend/AGENTS.md` (append-only)
  - Reference `frontend/common/stores/cert/snapAlignTypes.ts` as the canonical types file shared across Plans 10/11/12 — must be imported, never redefined
  - Note the priority slot for the Align/Distribute cluster in the `ToolbarOverflow` system (30) and the dedicated `useAlignShortcuts` hook (priority 12, scope `'editor'`) distinct from `useFillStrokeShortcuts`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### Instruction File & AGENTS.md Discovery (Round 5 Snap & Align, Plan 10)

| Task | Files Created/Modified | AGENTS.md to Read | Instructions to Read |
|---|---|---|---|
| R5S-T1 | `frontend/common/stores/cert/snapAlignTypes.ts`, `shared/locale/types/.../templateEditor.ts`, `shared/locale/{en,ar}/.../templateEditor.ts` | `shared/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5S-T2 | `frontend/views/dashboard/cert/templates/editor/toolbar/{AlignToolbarCluster,AlignToSelect}.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5S-T3 | `frontend/views/dashboard/cert/templates/editor/toolbar/DistributeToolbarCluster.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5S-T4 | `frontend/views/dashboard/cert/templates/editor/toolbar/{ViewMenuSnapSection,SnapSettingsDialog}.tsx`, `ViewMenu.tsx` (modify) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5S-T5 | `frontend/views/dashboard/cert/templates/editor/toolbar/KeyObjectBadge.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5S-T6 | `frontend/views/dashboard/cert/templates/editor/useAlignShortcuts.ts` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5S-T7 | `EditorToolbar.tsx` (modify) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5S-T9 | `frontend/IMPLEMENTATION_LEARNINGS.md`, `frontend/COMPONENT_PATTERNS.md`, `frontend/AGENTS.md` (append-only) | `frontend/AGENTS.md`, `AGENTS.md` | — |

### Round 5 Snap & Align Execution Order (Plan 10)

```
Phase R5S-A (sequential): R5S-T1 (types + i18n keys — everything depends on these)
Phase R5S-B (parallel): R5S-T2 (Align cluster), R5S-T3 (Distribute cluster), R5S-T5 (Key object badge) — all wait on T1
Phase R5S-C (sequential): R5S-T4 (View menu + snap settings dialog) — depends on T1 only but interacts with T2/T3 visual layout
Phase R5S-D (parallel): R5S-T6 (shortcuts hook — waits on T2/T3 store actions), R5S-T7 (EditorToolbar modify — waits on T2/T3/T5) — both wait on the components existing
Phase R5S-F (sequential): R5S-T9 (knowledge propagation)
```

**Plan 10 R5S total estimated time**: ~16 hours (~7 wall-clock hours via parallel phases R5S-B, R5S-D, R5S-E)

### Plan 10 Combined Total Time (Rounds 1-5 Snap & Align included)

- Rounds 1-3 (T1-T28): ~20 hours → ~12 wall-clock hours
- Round 4 (T29-T44): ~22 hours → ~13 wall-clock hours
- Round 5 Fill/Stroke/Pen/Effects (R5-T1 through R5-T8): ~14 hours → ~6 wall-clock hours
- Round 5 Snap & Align (R5S-T1 through R5S-T9): ~16 hours → ~7 wall-clock hours
- **Plan 10 total**: ~72 hours → ~38 wall-clock hours with the R5/R5S parallelism stacking.

> All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks (tsgo → biome → lint → codescene). The lint queue server must be running before any lint call. See `AGENTS.md` §"Lint Queue Server" for startup commands.

## Round 5: Advanced Typography Tasks

### R5-A1: Shared Typography Type Definitions

- [ ] Create `shared/types/certificates/typography.types.ts`:
  - Define `FontWeightValue` union (100–900), `FontStyleValue`, `TextTransformValue`, `TextDecorationValue`, `TextDirectionValue`
  - Define `SpanStyles` interface (fontFamily, fontWeight, fontStyle, fontSize, textColor, textTransform, textDecoration, kerning, tracking, leading, baselineShift, horizontalScale, verticalScale, characterRotation, variableAxes, fontFamilyFallback)
  - Define `RichTextSpan` interface (id, start, end, styles: Partial<SpanStyles>)
  - Define `RichTextContent` interface (text: string, spans: RichTextSpan[], paragraphs: ParagraphStyles[])
  - Define `ParagraphStyles` interface (alignment, justificationMethod, spacingBefore/After, firstLineIndent, left/rightIndent, hangingIndent, textWrap, columns, columnGutter, columnWidth, listType, bulletStyle, bulletChar, numberingFormat, hyphenation, hyphenationLanguage, hyphenationMinWordLength, hyphenationMinFragments, orphanControl, widow Control)
  - Define `LoadedFont`, `FontCategory`, `FontLicense`, `VariableFontAxis` types
  - Define `FontPairing` interface (id, heading, body, label, description, suitableFor)
  - Export all types from `shared/types/certificates/index.ts`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] Create `shared/constants/certificates/googleFontsManifest.ts`:
  - Export `GOOGLE_FONTS_MANIFEST: GoogleFontEntry[]` with family, category, weights, styles, variableAxes, license
  - Include collections: serif (Playfair Display, Merriweather, Georgia), sans-serif (Inter, Roboto, Montserrat, Open Sans), display (Bebas Neue, Anton, Oswald), handwriting (Dancing Script, Caveat), monospace (Roboto Mono, JetBrains Mono), arabic (Amiri, Cairo, Tajawal, Noto Naskh Arabic, Reem Kufi)
  - Each entry: `{ family, displayName, category, weights: number[], styles: string[], variableAxes?: VariableFontAxis[], license: FontLicense }`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] Create `shared/constants/certificates/fontPairings.ts`:
  - Export `FONT_PAIRINGS: FontPairing[]` array with at least 6 curated pairings
  - Include `classic-serif`, `modern-sans`, `arabic-formal`, `arabic-modern`, `elegant-display`, `academic-traditional`
  - Each pairing: `{ id, heading: { family, weight }, body: { family, weight }, label, description, suitableFor: string[] }`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-A2: Typography Zustand Store Slice

- [ ] Create `frontend/common/stores/certificates/typographyStore.ts`:
  - Define `TypographyState` interface (editingElementId, caretPosition, selection, loadedFonts, fontSearchQuery, fontCategoryFilter, fontPreviewText, paragraphStylesOverrides)
  - Implement `enterEditMode(elementId)`, `exitEditMode()`, `setSelection(start, end)`, `setCaretPosition(pos)`
  - Implement `applySpanStyles(elementId, start, end, styles: Partial<SpanStyles>)` — updates span array, merging overlapping spans
  - Implement `updateRichTextContent(elementId, content: RichTextContent)` — replaces full content
  - Implement `applyParagraphStyles(elementId, paragraphIndex, styles: Partial<ParagraphStyles>)`
  - Implement `loadFont(family: string): Promise<void>` — uses CSS Font Loading API with AbortController
  - Implement `preloadTemplateFonts(elementIds: string[]): Promise<void>` — batch loads with concurrency limit 4
  - Implement `uploadFont(file: File): Promise<void>` — calls storage mutation, registers @font-face, caches in IndexedDB
  - Implement `removeCustomFont(family: string): Promise<void>` — removes from IndexedDB and unregisters
  - Implement `setFontSearchQuery(query)`, `setFontCategoryFilter(category)`, `setFontPreviewText(text)`
  - Use Zustand `create` with non-persisted mode (session-only per `frontend/common/stores/AGENTS.md`)
  - Import: `import { create } from "zustand"`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] Create `frontend/common/stores/certificates/fontIndexedDB.ts`:
  - Functions: `getCachedFont(family): Promise<Blob | null>`, `cacheFont(family, blob): Promise<void>`, `removeCachedFont(family): Promise<void>`, `getAllCachedFonts(): Promise<LoadedFont[]>`
  - Uses IndexedDB API with database `cert-fonts-cache`, object store `fonts`, keyPath `family`
  - Handles open errors gracefully (falls back to no-cache mode)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-A3: Rich Text Toolbar

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/typography/RichTextToolbar.tsx`:
  - Props: `elementId`, `selection`, `activeStyles: SpanStyles`, `onApplySpan`, `onFontFamilyChange`, `onFontSizeChange`, `onTextColorChange`, `onTextAlignChange`
  - Render MUI `Popover` anchored above the text element bounding box
  - Buttons (left-to-right): Bold (`FormatBoldOutlined`), Italic (`FormatItalicOutlined`), Underline (`FormatUnderlinedOutlined`), Strikethrough (`FormatStrikethroughOutlined`)
  - Divider (vertical), then Font family `Autocomplete` with live preview (`renderOption` applies `sx={{ fontFamily: option }}`), Font size `TextField` (type=number, 1–400) with preset dropdown
  - Text color via `ColorPickerField` (imported from `@/frontend/desktop/views/dashboard/certificates/template-editor/elements/controls/ColorPickerField`)
  - Divider, alignment `ToggleButtonGroup` (left/center/right/justify), divider, bullet/numbered list `IconButton`s
  - All i18n strings via `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` → `t.typography.toolbar.*`
  - All styling via `sx={{}}` (no style props), no hardcoded colors (use `theme.palette.*`)
  - Wrap in `React.memo` with custom comparator checking only `activeStyles` reference equality
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/typography/RichTextRenderer.tsx`:
  - Props: `content: RichTextContent`, `baseStyles: SpanStyles`, `elementId: string`
  - Implements `spanStylesToCSS(styles: Partial<SpanStyles>, theme: Theme): CSSProperties`
  - Sorts spans by start, merges adjacent identical-style spans, walks text string emitting `<span>` per range
  - Unstyled text between spans uses `baseStyles`
  - Each `<span>` wrapped in `React.memo` keyed by `span.id`
  - Applies `text-rendering: "optimizeLegibility"`, `font-smoothing: "antialiased"` at container level
  - RTL detection: if content text is predominantly Arabic characters, set `dir="rtl"` on container
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-A4: Inline Text Editor

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/typography/InlineTextEditor.tsx`:
  - `contentEditable`-based editor, replaces static renderer in edit mode
  - On focus → shows `RichTextToolbar` via callback prop
  - Tracks `window.getSelection()` → `{start, end}` offsets, passes to `typographyStore.setSelection`
  - Word selection (double-click), paragraph selection (triple-click), Shift+Arrow extend
  - Typing updates `content.text` and shifts span offsets (insert/delete handler)
  - Enter → inserts `\n`, creates `ParagraphStyles` entry
  - Escape → exits edit mode, calls `typographyStore.exitEditMode()`, commits to store
  - Caret rendered as 2px blinking `div` at caret offset (via `Range.getBoundingClientRect()`)
  - `spellCheck` attribute toggle from store
  - Clipboard: copy serializes `{type: "rich-text", text, spans}`, also writes `text/plain` fallback. Paste deserializes rich text or falls back to plain. Paste-as-plain-text via `Ctrl/Cmd+Shift+V`
  - Debounce store updates at 16ms (one frame)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-A5: Find & Replace Dialog

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/typography/FindReplaceDialog.tsx`:
  - MUI `Dialog` with find `TextField`, replace `TextField`, Replace All `Button`
  - Options: case-sensitive `Checkbox`, whole word `Checkbox`, regex `Checkbox`
  - Previous/Next `IconButton`s, match counter via `t.typography.findReplace.matchCount(count, total)`
  - Matches highlighted with `<mark>` (`sx={{ backgroundColor: (theme) => theme.palette.warning.light }}`)
  - Replace updates text + shifts span offsets; Replace All replaces all
  - Invalid regex → `FormErrorSnackbar` with `t.typography.findReplace.invalidRegex`
  - Triggered from toolbar overflow menu or `Ctrl/Cmd+F` while editing
  - i18n via `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` → `t.typography.findReplace.*`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-A6: Emoji & Special Characters Picker

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/typography/SpecialCharPicker.tsx`:
  - MUI `Dialog` with left `List` of categories + right grid of character `IconButton`s
  - Categories: arrows, math, currency, symbols, emoji, custom, recent
  - Click character → inserts at caret position via callback prop
  - Recent characters stored in localStorage (`cert-recent-chars`)
  - Custom characters: user-defined, stored in localStorage (`cert-custom-chars`)
  - i18n via `t.typography.specialChars.*`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-A7: Spell Check Hook

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/typography/useSpellCheck.ts`:
  - Custom hook returning `{ isChecking, suggestions, ignoreWord, addToDictionary, ignoreAll }`
  - Uses `contentEditable` `spellcheck` attribute + browser spell API
  - On misspelled word right-click → custom context menu with suggestions list
  - "Ignore" → session ignore list; "Add to dictionary" → localStorage `cert-dictionary-<locale>`
  - Language selector: `ar`, `en`, `auto` (RTL/LTR content ratio detection)
  - Toggle on/off via store flag
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-A8: Font Management Panel

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/fonts/useFontLoader.ts`:
  - Custom hook returning `{ loadFont, preloadTemplateFonts, uploadFont, removeCustomFont, getFontStatus }`
  - `loadFont(family)` uses CSS Font Loading API: `document.fonts.load("16px ${family}")` with `AbortController`
  - `preloadTemplateFonts(elementIds)` batch loads with `Promise.all` concurrency limit 4
  - `uploadFont(file: File)` calls `uploadFont` GraphQL mutation → registers `@font-face` → caches in IndexedDB
  - `removeCustomFont(family)` removes `@font-face` → removes from IndexedDB
  - Rejects non-font MIME types, 10MB file size limit
  - `@font-face` always uses `font-display: swap`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] Create `frontend/common/graphql/sharedDocuments/font.documents.ts`:
  - `UploadFontDocument` — mutation: `mutation UploadFont($file: Upload!) { uploadFont(file: $file) { url, family } }`
  - `DeleteFontDocument` — mutation: `mutation DeleteFont($family: String!) { deleteFont(family: $family) { success } }`
  - Import from `@apollo/client/react`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/fonts/FontCard.tsx`:
  - Props: `font: LoadedFont`, `sampleText?: string`, `onApply`, `onRemove?`
  - Renders font name + sample text in the font itself (`sx={{ fontFamily: font.family }}`)
  - Weights as `Chip` components (only available weights)
  - Variable badge `Chip` if `variableAxes` non-empty
  - License badge `Chip` with tooltip
  - "Apply" `IconButton` (`CheckOutlined`) and "Remove" `IconButton` (`DeleteOutlined`, custom fonts only)
  - Preview loads font on hover via `document.fonts.load`
  - i18n via `t.typography.fonts.*`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/fonts/FontManager.tsx`:
  - Left sidebar collapsible section (below element library from Plan 11)
  - MUI `Tabs` by category: all, serif, sans-serif, display, handwriting, monospace, arabic
  - Preview text `TextField` (default "The quick brown fox 123")
  - Search `TextField` filtering by family name
  - Font grid (`Grid`): 3-column desktop, 1-column mobile
  - "Upload font" `Button` opening file `input type="file"` accepting `.ttf,.otf,.woff,.woff2`
  - i18n via `t.typography.fonts.*`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-A9: Variable Font Controls

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/fonts/VariableFontControls.tsx`:
  - Renders `Slider` per variable font axis (wght, wdth, ital, opsz)
  - Each slider: min/max from `VariableFontAxis`, value display, numeric `TextField` beside slider
  - "Ital" axis renders as `ToggleButton` instead of slider (0/1)
  - Updates `SpanStyles.variableAxes` map in store
  - Applies via `font-variation-settings` CSS in renderer
  - i18n axis labels via `t.typography.fonts.variable` + axis-specific keys
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-A10: Font Pairing Suggestions

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/fonts/FontPairingSuggestions.tsx`:
  - Reads `FONT_PAIRINGS` from `@/shared/constants/certificates/fontPairings`
  - Cards with heading font preview + body font preview side-by-side
  - "Apply pairing" `Button` sets heading element font + body element font (by element role tags)
  - Description + suitable-for tags as `Chip`s
  - i18n via `t.typography.fonts.pairing.*`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-A11: GraphQL Integration for Rich Text Content

- [ ] Update element mutation documents to accept `RichTextContent` as JSON input:
  - Add `richTextContent: JSON` field to `UpdateTextElementInput` in `frontend/common/graphql/sharedDocuments/element.documents.ts`
  - The GraphQL scalar `JSON` must be added to the Pothos schema (Plan 05)
  - Element queries return `richTextContent` as a JSON object
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] Run GraphQL codegen after schema changes:
  - `bun run generate:gqlSchema` then `bun codegen`
  - Verify generated types include `RichTextContent` fields
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-A12: i18n Namespace Extension

- [ ] Extend `shared/locale/ar/.../templateEditor.ts` with all `typography.*` keys from design.md §R5.10:
  - Arabic translations for toolbar, findReplace, specialChars, spellCheck, fonts sections
  - Pluralization `matchCount: (count: number, total: number) => string` using Arabic pluralization rules
  - Weight labels in Arabic (Thin → خفيف جداً, Regular → عادي, Bold → عريض, etc.)
  - Category labels, license labels, pairing labels all in Arabic
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] Extend `shared/locale/en/.../templateEditor.ts` with all `typography.*` keys:
  - English translations matching the Arabic key structure
  - Pluralization: `(count, total) => \`${count} of ${total} matches\``
  - Weight labels: Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, Black
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-A14: Knowledge Propagation

- [ ] Create `docs/frontend/typography-engine.md`:
  - Document the RichTextContent data model (text + spans + paragraphs)
  - Document the span merge algorithm
  - Document the CSS property mapping (spanStylesToCSS)
  - Document the font loading pipeline (CSS Font Loading API, IndexedDB cache)
  - Document variable font axis support
  - Document fallback font chain
  - Update `frontend/AGENTS.md` with reference to this doc
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-A15: Execution Order

```
Phase R5-A (sequential):   R5-A1 (shared types + constants — everything depends on these)
Phase R5-B (parallel):     R5-A2 (store), R5-A8 font loader (depends on A1 types)
Phase R5-C (parallel):     R5-A3 toolbar + renderer, R5-A4 inline editor, R5-A5 find-replace, R5-A6 special chars, R5-A7 spell check  (all depend on A1 + A2)
Phase R5-D (parallel):     R5-A8 FontManager + FontCard, R5-A9 variable font controls, R5-A10 pairing suggestions
Phase R5-E (sequential):   R5-A11 GraphQL integration (depends on all components)
Phase R5-F (parallel):     R5-A12 i18n AR + EN (depends on A1 key structure)
Phase R5-H (sequential):   R5-A14 knowledge propagation (depends on all)
```

**Round 5 total estimated time**: ~52 hours → ~30 wall-clock hours with parallelism in phases B, C, D, G.

---

## Round 5: Transform Tasks

> **R6 = the app's 6th sequential round (existing R5 = Effects/Fill/Pen/Typography/Snap/Layers/Color). The user-specified label "Round 5: Transform Tasks" is preserved here per instruction.**
> **Depends on**: Plan 11 R6 (transform math engine — `transformTypes.ts`, `FreeTransformController`), Plan 12 R6 (numeric dialog)
> **Reference**: design.md `## Round 6: Transform Engine` §R6.1–R6.8

| # | Task | Depends On | Est. Hours |
|---|---|---|---|
| TR-T01 | `useLastTransformRecord` hook | TR-T06 (store shims) | 1.5 |
| TR-T02 | `ToolbarFreeTransformButton` | TR-T06 | 2 |
| TR-T03 | `EditorEditMenu` with Transform submenu | TR-T01, TR-T02, TR-T06 | 3 |
| TR-T04 | `useEditorShortcuts` — Ctrl+T, Ctrl+Shift+T, Shift+Ctrl+]/[ | TR-T06 | 1.5 |
| TR-T05 | Transform i18n keys (AR + EN) | TR-T03 (to confirm exact key list) | 1 |
| TR-T06 | `certTemplateEditorStore` action shims + `transformHandlers` surface | — (first) | 2 |
| TR-T08 | Knowledge propagation | TR-T01–TR-T06 | 1 |

### Instruction File & AGENTS.md Discovery (Plan 10 Transform)

| Task | Files | AGENTS.md | Instructions |
|---|---|---|---|
| TR-T01 | `frontend/views/dashboard/cert/templates/editor/useLastTransformRecord.ts` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `frontend.instructions.md` |
| TR-T02 | `frontend/views/dashboard/cert/templates/editor/ToolbarFreeTransformButton.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `frontend.instructions.md` |
| TR-T03 | `frontend/views/dashboard/cert/templates/editor/EditorEditMenu.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `frontend.instructions.md` |
| TR-T04 | `frontend/views/dashboard/cert/templates/editor/useEditorShortcuts.ts` (modify) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `frontend.instructions.md` |
| TR-T05 | `shared/locale/types/dashboard/certificates/templateEditor.ts`, `shared/locale/{ar,en}/dashboard/certificates/templateEditor.ts` (modify) | `shared/AGENTS.md`, `AGENTS.md` | `frontend.instructions.md` |
| TR-T06 | `frontend/common/stores/cert/certTemplateEditorStore.ts` (modify) | `frontend/stores/AGENTS.md`, `AGENTS.md` | `frontend.instructions.md` |
| TR-T08 | `frontend/IMPLEMENTATION_LEARNINGS.md`, `frontend/COMPONENT_PATTERNS.md`, `frontend/AGENTS.md` (append) | `AGENTS.md` | — |

### TR-T01 — `useLastTransformRecord` Hook

- [ ] Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Create `frontend/views/dashboard/cert/templates/editor/useLastTransformRecord.ts`
  - Returns `{ lastTransform, commitTransform, clearLastTransform }`
  - `lastTransform: TransformOperationRecord | null` — read via `useShallow` from `certTemplateEditorStore`
  - `commitTransform(record)` → `certTemplateEditorStore.setState({ lastTransform: record })`
  - `clearLastTransform()` → `certTemplateEditorStore.setState({ lastTransform: null })`
  - `TransformOperationRecord` interface: `{ operationType, matrix: DOMMatrixReadOnly, elementIds: string[], timestamp: number }` — defined in `@/frontend/common/stores/cert/transformTypes.ts` ( Plan 11 owner)
- [ ] Use `logger` from `@/frontend/utils/logger` (never `console.*`)
- [ ] **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### TR-T02 — `ToolbarFreeTransformButton` Component

- [ ] Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Create `frontend/views/dashboard/cert/templates/editor/ToolbarFreeTransformButton.tsx` (per design.md R6.2):
  - `IconButton` + `Tooltip`
  - Read `activeTool`, `selectedElementIds` from `certTemplateEditorStore` via `useShallow`
  - Disabled when `selectedElementIds.length !== 1` (single-element transform — multi-element is R7)
  - Active state: `sx={{ color: 'primary.main' }}` (no hardcoded colors)
  - `aria-label`, `aria-pressed`, `Tooltip title` — all from `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` namespace: `transform.freeTransform.tooltip`, `transform.freeTransform.ariaLabel`, `transform.freeTransform.disabledHint`
  - Icon: `CropFreeOutlined` from `@mui/icons-material` (MUI v9 — `*Outlined` suffix not `*Outline`)
- [ ] **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### TR-T03 — `EditorEditMenu` with Transform Submenu

- [ ] Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Create `frontend/views/dashboard/cert/templates/editor/EditorEditMenu.tsx` (per design.md R6.3):
  - `Button` ("Edit") + nested `Menu` `Transform` submenu:
    - Free Transform (`Ctrl+T`)
    - Scale / Rotate / Skew / Distort / Perspective / Warp (mode toggles — gated by `activeTool === 'freeTransform'`)
    - ── separator ──
    - Rotate 90° CW / Rotate 90° CCW / Rotate 180°
    - Flip Horizontal / Flip Vertical
    - ── separator ──
    - Numeric…
    - Transform Again (`Ctrl+Shift+T`) — disabled when `lastTransform === null`
  - Labels from `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)`: `editMenu.label`, `transform.*`
  - Each `MenuItem` `aria-keyshortcuts` (e.g., `Control+T`)
  - Gating: Mode-toggle items `disabled` when `activeTool !== 'freeTransform'`; Rotate/Flip/Again `disabled` when `selectedElementIds.length === 0`
  - MUI v9: `MenuItem disabled` prop, `ListItemText` + `<Typography variant="caption" sx={{ ml: 2, color: 'text.disabled' }}>` for shortcut caption (no style props, no hardcoded colors)
  - Handlers call Zustand store shims: `setActiveTool('freeTransform')`, `setFreeTransformMode(mode)`, `applyRotate九十({ degrees, direction })`, `applyFlip(horizontal)`, `openNumericTransformDialog()`, `repeatLastTransform()`
- [ ] **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### TR-T04 — `useEditorShortcuts` — Transform Shortcuts

- [ ] Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Modify `frontend/views/dashboard/cert/templates/editor/useEditorShortcuts.ts` (already exists from Round 5 pen tool):
  - Add `ShortcutBinding`s to the existing `ShortcutManager`:
    - `Ctrl+T` → `setActiveTool('freeTransform')` (predicate: `selectedElementIds.length === 1 && activeTool !== 'freeTransform'`)
    - `Ctrl+Shift+T` → `repeatLastTransform()` (predicate: `lastTransform !== null && selectedElementIds.length >= 1`)
    - `Shift+Ctrl+]` → `applyRotate九十({ degrees: 90, direction: 'cw' })` (predicate: `selectedElementIds.length >= 1`)
    - `Shift+Ctrl+[` → `applyRotate九十({ degrees: 90, direction: 'ccw' })` (predicate: `selectedElementIds.length >= 1`)
  - Use `ctrlKey` only (Linux target per AGENTS.md — don't gate on `metaKey`)
  - **No `eval` / no dynamic handler-string expansion** — handlers are function refs (security rule)
- [ ] **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### TR-T05 — Transform i18n Keys (Plan 10 Surface — AR + EN)

- [ ] Read `shared/AGENTS.md`, `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Modify `shared/locale/types/dashboard/certificates/templateEditor.ts` — append to `certificateEditor` namespace:
  - `transform: { freeTransform: { tooltip: string; ariaLabel: string; disabledHint: string }; submenuLabel: string; scale: string; rotate: string; skew: string; distort: string; perspective: string; warp: string; rotate九十Cw: string; rotate九十Ccw: string; rotate180: string; flipHorizontal: string; flipVertical: string; numeric: string; again: string }; editMenu: { label: string }`
  - All plain `string` (no interpolation, no pluralization per design.md R6.7)
- [ ] Modify `shared/locale/ar/dashboard/certificates/templateEditor.ts` — append Arabic implementations
- [ ] Modify `shared/locale/en/dashboard/certificates/templateEditor.ts` — append English implementations
- [ ] Per `shared/AGENTS.md`: plain strings are plain template literals; no interpolation → no `(param: string) => string` signature
- [ ] **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### TR-T06 — `certTemplateEditorStore` Transform Action Shims + Handler Surface

- [ ] Read `frontend/stores/AGENTS.md`, `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Modify `frontend/common/stores/cert/certTemplateEditorStore.ts` (per design.md R6.6):
  - Extend `CertTemplateEditorState` interface:
    - `lastTransform: TransformOperationRecord | null`
    - `transformHandlers: TransformHandlers | null`
    - `setFreeTransformMode(mode: FreeTransformMode): void`
    - `applyRotate九十(payload: { degrees: 90 | 180 | 270; direction: 'cw' | 'ccw' }): void`
    - `applyFlip(horizontal: boolean): void`
    - `openNumericTransformDialog(): void`
    - `repeatLastTransform(): void`
    - `registerTransformHandlers(handlers: TransformHandlers): void`
    - `unregisterTransformHandlers(): void`
  - Implement shims:
    - `setFreeTransformMode` → `get().transformHandlers?.setMode?.(mode)` — defensive `logger.warn` if `transformHandlers` is null
    - `applyRotate九十` → `get().transformHandlers?.applyRotate九十?.(payload)`
    - `applyFlip` → `get().transformHandlers?.applyFlip?.(horizontal)`
    - `openNumericTransformDialog` → delegates to `useTemplateElementEditorStore.getState().setNumericTransformDialogOpen(true)` (Plan 12 owns the dialog state)
    - `repeatLastTransform` → if `get().lastTransform` is null, `logger.warn` + return; else `get().transformHandlers?.repeatTransform?.(get().lastTransform!)`
    - `registerTransformHandlers(handlers)` → `set({ transformHandlers: handlers })`
    - `unregisterTransformHandlers()` → `set({ transformHandlers: null })`
  - `lastTransform` initializer: `null`
  - Import only `type { FreeTransformMode, TransformOperationRecord }` from `@/frontend/common/stores/cert/transformTypes` (Plan 11 owns the file)
  - Define `TransformHandlers` interface inline here: `{ setMode?, applyRotate九十?, applyFlip?, repeatTransform? }` — partials so Plan 11 can register a subset
- [ ] **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### TR-T08 — Knowledge Propagation (Plan 10 R6)

- [ ] Update `frontend/IMPLEMENTATION_LEARNINGS.md` (append-only):
  - "register-transform-handlers" pattern: Plan 10 declares shims, Plan 11/12 register bodies → avoids circular import
  - `Ctrl+T` entry shortcut owned by Plan 10; Esc/Enter commit/cancel owned by Plan 11 — no double-register
  - `lastTransform.matrix` persistence: session-only Zustand state — never serialized to backend
- [ ] Update `frontend/COMPONENT_PATTERNS.md` (append-only):
  - "Editor Edit Menu with Nested Submenu" pattern (parent + transform submenu + gating)
- [ ] Update `frontend/AGENTS.md` (append-only):
  - Reference `useLastTransformRecord` and `transformHandlers` registration surface
  - Note cross-plan contract: Plan 11 `FreeTransformController` calls `registerTransformHandlers` on mount, `unregisterTransformHandlers` on unmount
- [ ] **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### Round 5 Execution Order (Plan 10 Transform)

```
Phase TR-A (seq):  TR-T06 (store shims — first, no deps)
Phase TR-B (par):  TR-T01 (lastTransform hook), TR-T02 (toolbar button)          [wait on TR-T06]
Phase TR-C (par):  TR-T03 (edit menu), TR-T04 (shortcuts hook)                  [wait on TR-T06; TR-T03 also waits on TR-T01/T02]
Phase TR-D (seq):  TR-T05 (i18n — wait on TR-T03 for exact key refs)
Phase TR-F (seq):  TR-T08 (knowledge propagation)
```

**Plan 10 R6 total**: ~14 hours → ~6 wall-clock hours (parallelism in TR-B, TR-C, TR-E)

### Plan 10 Combined Total (Rounds 1-6)

- Rounds 1-3 (T1-T28): ~20 hours → ~12 wall-clock
- Round 4 (T29-T44): ~22 hours → ~13 wall-clock
- Round 5 Fill/Stroke/Pen/Effects/Snap/Layers/Typography (existing): ~96 hours → ~50 wall-clock
- Round 5 Transform (TR-T01..TR-T08): ~14 hours → ~6 wall-clock
- **Plan 10 total**: ~152 hours → ~81 wall-clock hours

> All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks (tsgo → biome → lint → codescene). The lint queue server must be running before any lint call. See `AGENTS.md` §"Lint Queue Server" for startup commands.

## Round 5: Color System Tasks

> Round 5 task list for Plan 10 — the shared color system types (`colorSystemTypes.ts`), color conversion utilities, the color system Zustand store (`colorSystemStore`), the toolbar color cluster (fill/stroke swatches, swap/reset, eyedropper button, quick swatches dropdown), the left-sidebar Swatches panel with ASE/ACO import/export, swatch presets, and color-system keyboard shortcuts. These are owned by Plan 10 because they're the foundation that Plan 11 (canvas color sampling — eyedropper overlay) and Plan 12 (color picker dialog + properties swatches) consume. Plan 10 creates the primitives and the toolbar; Plan 11 creates the canvas interactors; Plan 12 creates the dialogs. Total R5-CS scope for Plan 10: 12 tasks (~26 hours).

### R5-CS-T1: Color System Type Definitions

- [ ] Create `frontend/common/stores/cert/colorSystemTypes.ts` (new)
  - Define all color-system shared types: `ColorSpace`, `ColorPickerContext`, `ColorValue`, `ColorProfile`, `Swatch`, `SwatchGroup`, `HarmonyScheme`, `HarmonyColor`, `EyedropperSampleSource`, `EyedropperSampleSize`, `ActivePaintSlot`, `SwatchExportFormat`, `WebSafeSwatch`
  - Pure type file (no runtime exports) — importable by Plans 10/11/12 via `@/frontend/common/stores/cert/colorSystemTypes`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-CS-T2: Color Conversion Utilities

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/utils/colorConversionUtils.ts` (new)
  - Pure functions: `hexToRGB`, `rgbToHex`, `hexShorthandToFull`, `normalizeHex`, `rgbToHSL`, `hslToRGB`, `rgbToHSV`, `hsvToRGB`, `rgbToCMYK(r,g,b,profile?)`, `cmykToRGB(c,m,y,k,profile?)`, `hexToRgba`, `hexToHSL`, `hslToHex`, `rotateHue`, `adjustLightness`, `adjustSaturation`, `isOutOfGamut(color, targetProfile)`, `clamp`
  - CMYK conversion uses the formula for the selected `ColorProfile` — defaults to `'CMYK-SWOP-v2'`
  - No React — pure TS module; both frontend and store code import via `@/` alias
  - i18n: not needed (utility module)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `test/unit/colorConversionUtils.test.ts` (new)
  - Snapshot known conversions (R/G/B/W/K, mid-gray, saturated red, saturated blue out-of-CMYK-gamut case)
  - Round-trip: `rgbToHSL` → `hslToRGB`, `rgbToHSV` → `hsvToRGB` preserves value within ±1 tolerance
  - Shorthand expansion `#F0A` → `#FF00AA`; invalid input → `null` from `normalizeHex`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-CS-T3: Color System Zustand Store

- [ ] Create `frontend/common/stores/cert/colorSystemStore.ts` (new)
  - `useColorSystemStore = create<ColorSystemState>()(persist((set, get) => ({...}), {...}))`
  - State fields: `activePaintSlot`, `fillColor`, `strokeColor`, `hasFill`, `hasStroke`, `quickSwatches` (max 10), `colorHistory` (max 20), `customSwatches`, `swatchGroups`, `lastColorMode`, `activeProfile`, `colorPickerOpen`, `colorPickerContext`, `colorPickerColor`, `colorPickerPreviousColor`, `swatchDisplaySize`
  - Actions: `setActivePaintSlot`, `setFillColor`, `setStrokeColor`, `setHasFill`, `setHasStroke`, `swapFillStroke`, `resetColors`, `addToQuickSwatches`, `addToColorHistory`, `addCustomSwatch`, `removeCustomSwatch`, `updateCustomSwatchColor`, `addSwatchGroup`, `removeSwatchGroup`, `setLastColorMode`, `setActiveProfile`, `openColorPicker`, `closeColorPicker`, `setSwatchDisplaySize`, `importSwatches`
  - Persist subset: `fillColor`, `strokeColor`, `customSwatches`, `swatchGroups`, `lastColorMode`, `activeProfile`, `colorHistory`, `swatchDisplaySize`
  - Non-persisted (session-only): `colorPickerOpen`, `colorPickerContext`, `colorPickerColor`, `colorPickerPreviousColor`, `activePaintSlot`, `quickSwatches`
  - Storage key: `"certEditor.colorSystem"` → `localStorage`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-CS-T4: Toolbar Color Swatch Component

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/ToolbarColorSwatch.tsx` (new)
  - `interface ToolbarColorSwatchProps { slot: 'fill' | 'stroke'; color: ColorValue; active: boolean; hasColor: boolean; onClick: () => void; onOpenColorPicker: () => void; sx?: SxProps<Theme>; }`
  - 24×24 swatch with checkerboard behind for alpha, `sx={{ width: 24, height: 24, borderRadius: 0.5, border: '1px solid', borderColor: active ? theme.palette.primary.main : theme.palette.divider, position: 'relative', cursor: 'pointer', backgroundImage: CHECKERBOARD_PATTERN, backgroundColor: hexToRgba(color.hex, color.alpha), backgroundBlendMode: 'multiply' }}`
  - "No color" state (hasColor === false): diagonal red line via `&::after` CSS pseudo-element — `borderTop: '2px solid', borderColor: theme.palette.error.main, transform: 'rotate(-45deg)'` (no hardcoded colors)
  - Double-click opens color picker; single click selects the slot
  - i18n: `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` keys: `toolbarColors.fillActive`, `toolbarColors.strokeActive`, `toolbarColors.noFill`, `toolbarColors.noStroke`
  - `aria-label={slot === 'fill' ? t("toolbarColors.fillActive") : t("toolbarColors.strokeActive")}`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-CS-T5: Toolbar Color Cluster (Fill + Stroke + Swap + Reset + Eyedropper + Quick Swatches)

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/ToolbarColorCluster.tsx` (new)
  - `Stack direction="row"` containing two `ToolbarColorSwatch` instances overlapped (stroke behind, fill in front, classic Illustrator stack via `marginLeft: '-8px', marginTop: '8px'` on stroke)
  - Swap colors button (`SwapHorizontalOutlined` icon) — `IconButton size="small"` with `HtmlTooltip` showing `t("certificateTemplateEditor.toolbarColors.swapTooltip") + " (Shift+X)"`
  - Reset colors button (`DefaultColorsOutlined`) — `IconButton size="small"` with tooltip `t("certificateTemplateEditor.toolbarColors.resetTooltip") + " (D)"`
  - `ToolbarEyedropperButton` (T6) and `ToolbarQuickSwatchesDropdown` (T7) — imported and composed
  - `sx={{ alignItems: 'center' }}` on the outer Stack (no direct style props)
  - Reads fill/stroke/activePaintSlot via `useColorSystemStore` with `useShallow` selector — returns stable tuple so unrelated store changes don't re-render
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-CS-T6: Toolbar Eyedropper Button

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/ToolbarEyedropperButton.tsx` (new)
  - `interface ToolbarEyedropperButtonProps {}` — no props; reads/writes canvas store + color store
  - `ToggleButton value="eyedropper"` bound to `useCanvasStore((s) => s.activeTool === 'eyedropper')`
  - On click: if active, deactivate (`setActiveTool('select')` + `useEyedropperStore.getState().deactivate()`); else activate (`setActiveTool('eyedropper')` + `useEyedropperStore.getState().activate(activePaintSlot)`)
  - Icon: `ColorizeOutlined` (note: NO `ColorizeOutline` — MUI v9 uses `*Outlined` postfix; see frontend/AGENTS.md)
  - Tooltip: `t("certificateTemplateEditor.toolbarEyedropper.tooltip") + " (I)"`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-CS-T7: Toolbar Quick Swatches Dropdown

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/ToolbarQuickSwatchesDropdown.tsx` (new)
  - `IconButton size="small"` with `PaletteOutlined` icon → opens `Menu`
  - Inside `Menu`: `Grid container` (5 columns × 2 rows, total 10) of `ColorSwatchTile` from Plan 12 R5-CS-T9
  - Reads `quickSwatches` from `useColorSystemStore` with `useShallow`
  - Empty state: `Typography` "no recent colors" (`t("certificateTemplateEditor.toolbarColors.noRecent")`)
  - On swatch click: applies to `activePaintSlot` (set fill or stroke via store) and calls `addToQuickSwatches(c)` to bump recency
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-CS-T8: Color System Keyboard Shortcuts Hook

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/hooks/useColorSystemShortcuts.ts` (new)
  - `export function useColorSystemShortcuts(): void` — registered at editor screen mount
  - Binds `window.addEventListener('keydown', handler)` where handler dispatches:
    - `I` / `i` → activate eyedropper (`useCanvasStore.getState().setActiveTool('eyedropper')` + `useEyedropperStore.getState().activate(activePaintSlot)`)
    - `D` (without modifiers) → `useColorSystemStore.getState().resetColors()`
    - `Shift+X` → `useColorSystemStore.getState().swapFillStroke()`
    - `X` (without modifiers) → `toggleActivePaintSlot()` (fill → stroke and vice versa)
    - `,` → set fill black, `.` → set fill white (quick-apply defaults)
    - `/` → toggle `hasFill` / `hasStroke` on the active slot
    - `Escape` → if `useColorSystemStore.getState().colorPickerOpen` close picker; else if `activeTool === 'eyedropper'` deactivate eyedropper
  - Skips handler if `event.target` is a text input (`tag === 'input' && type === 'text'`, `tag === 'textarea'`, or `contentEditable` true)
  - Cleanup: `removeEventListener` on unmount
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-CS-T9: Swatches Presets + Web-Safe Palette

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/utils/swatchPresets.ts` (new)
  - `MATERIAL_PRESET: Array<{ hex: string; name: string }>` — 19 Material Design 500-shade entries
  - `WEB_SAFE_PRESET: Array<{ hex: string; name: string }>` — 216 colors, generated programmatically via nested loop over `[0x00, 0x33, 0x66, 0x99, 0xCC, 0xFF]` (R, G, B dims)
  - `PANTONE_PRESET: Array<{ hex: string; name: string }>` — ~36 curated Pantone Coatone entries
  - `generateWebSafePalette()` helper — memoized at module load (216 entries, <5KB)
  - No React — pure TS module
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-CS-T10: ASE/ACO/JSON Swatch Import/Export

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/utils/swatchImportExport.ts` (new)
  - `parseASE(buffer: ArrayBuffer): SwatchGroup[]` — reads ASEF header, version 1.0, block-by-block color entries; converts RGB/HSL/CMYK entries to `ColorValue`
  - `parseACO(buffer: ArrayBuffer): SwatchGroup[]` — ACO v1 (RGB-only) and v2 (with names)
  - `parseJSONToGroups(json: string): SwatchGroup[]` — strict parser matching `SwatchExportFormat`
  - `exportGroupsToJSON(groups: SwatchGroup[]): string`
  - `exportGroupsToASE(groups: SwatchGroup[]): ArrayBuffer`
  - `importSwatches(file: File): Promise<SwatchGroup[]>` — dispatcher reads `file.arrayBuffer()` then routes by extension (`.ase`/`.aco`/`.json`)
  - `exportSwatches(groups: SwatchGroup[], format: 'json' | 'ase'): Promise<void>` — triggers a `Blob` download via `URL.createObjectURL`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-CS-T11: Left Sidebar Swatches Panel

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/panels/SwatchesPanel.tsx` (new)
  - `CollapsiblePanelShell sectionId="swatches"` in left sidebar
  - Three-tab `Tabs`: Document (auto-derived from element fills/strokes), Custom (user-saved, persisted), Recent (session — last 10 colors)
  - `ToggleButtonGroup` for display size (Small 16px / Medium 24px / Large 32px)
  - Default palette preset dropdown: `presetMaterial`, `presetPantone`, `presetWebStandard`, `presetCustom`
  - Swatch group sub-grids: `DocumentSwatchesGrid`, `CustomSwatchesGrid`, `RecentSwatchesGrid`
  - Custom group has "+" button to add current color as new swatch; right-click context menu (Edit, Delete, Duplicate)
  - Double-click swatch → opens `ColorPickerDialog` from Plan 12 with `colorContext='swatch'`
  - Import button (hidden file input, accept `.ase,.aco,.json`) + Export button (triggers file dialog with format selector)
  - Empty state: `Typography` `t("certificateTemplateEditor.swatches.emptySwatches")`
  - i18n: `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` — all `swatches.*` keys declared in R5-CS-T12 below
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/panels/swatches/ColorSwatchTile.tsx` (new — Plan 10 sidebar version; Plan 12 will import the same component for its properties panel)
  - `interface ColorSwatchTileProps { color: ColorValue; size: 'small' | 'medium' | 'large'; isBase?: boolean; onClick?: () => void; onDoubleClick?: () => void; onContextMenu?: (e: React.MouseEvent) => void; tooltip?: string; }` — sizes are 16/24/32px
  - Renders a square `Box` with checkerboard behind (alpha indicator) and color overlay — `sx={{ width, height, borderRadius: 0.5, border: '1px solid', borderColor: theme.palette.divider, cursor: onClick ? 'pointer' : 'default', position: 'relative', backgroundImage: CHECKERBOARD_PATTERN, backgroundColor: hexToRgba(color.hex, color.alpha), backgroundBlendMode: 'multiply' }}`
  - Optional outline highlight (isBase): `sx={{ outline: \`2px solid ${theme.palette.primary.main}\` }}`
  - `Tooltip` for hover preview — `title` shows `${hex} (#RRGGBB ${Math.round(alpha*100)}%)`
  - `role="button"`, `tabindex={0}`, `aria-label={tooltip || color.hex}`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### R5-CS-T12: i18n Keys + Test Suite + Knowledge Propagation

- [ ] Modify `shared/locale/types/dashboard/certificates/templateEditor.ts` — add `toolbarColors`, `toolbarEyedropper`, `swatches` namespaces per §R5-CS12 spec
  - Append to existing `TemplateEditorLabels` interface
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Modify `shared/locale/en/dashboard/certificates/templateEditor.ts` — add EN translations
  - Examples: `toolbarColors.swapTooltip: "Swap fill and stroke colors"`, `swatches.presetMaterial: "Material Design"`, `swatches.export: "Export"`, `swatches.import: "Import"`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Modify `shared/locale/ar/dashboard/certificates/templateEditor.ts` — add AR translations
  - Native-Arabic-reviewed strings (no machine translation); matching existing style
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Create `test/unit/colorSystemStore.test.ts` (new) — tests pure store
  - Test `swapFillStroke` swaps colors + has flags
  - Test `resetColors` resets to white fill, black stroke
  - Test `addToQuickSwatches` dedups + caps at 10
  - Test `addToColorHistory` dedups + caps at 20
  - Test `addCustomSwatch` / `removeCustomSwatch`
  - Test `openColorPicker` captures `previousColor`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Update `frontend/IMPLEMENTATION_LEARNINGS.md` (append-only) — document gotchas:
  - MUI v9 has NO `ColorizeOutline` icon — use `ColorizeOutlined` (see frontend/AGENTS.md)
  - The diagonal "no color" indicator must come from a CSS pseudo-element, not an imported SVG; avoids fragile image assets
  - ASE spec uses UTF-16 strings — Reader must use `TextDecoder('utf-16be')` for swatch names
  - The state-store selector for the color cluster should return a stable tuple (useShallow) — unrelated store changes (dialog open/close, mode change) shouldn't trigger toolbar re-render
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
- [ ] Update `frontend/COMPONENT_PATTERNS.md` (append-only) — patterns for:
  - "Toolbar color cluster" (fill/stroke stack, swap, reset, eyedropper, quick swatches)
  - "Swatch tile" (small UI component used by toolbar dropdown + left sidebar + plan 12 properties panel)
  - "Persisted Zustand store with partialize" (color system store pattern)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### Round 5 Color System Execution Order (Plan 10)

```
Phase R5-CS-A (sequential): R5-CS-T1 (types — Plan 12 T2 and store T3 import from here)
Phase R5-CS-B (parallel): R5-CS-T2 (utils — pure module, no deps), R5-CS-T9 (presets — pure module, depends on T1 only for types)
Phase R5-CS-C (sequential): R5-CS-T3 (color system store — imports T1+T2)
Phase R5-CS-D (parallel): R5-CS-T4 (color swatch component), R5-CS-T6 (eyedropper button), R5-CS-T7 (quick swatches dropdown), R5-CS-T8 (keyboard shortcuts), R5-CS-T10 (ASE/ACO import/export — pure module) — all wait on T3 store
Phase R5-CS-E (sequential): R5-CS-T5 (color cluster — composes T4, T6, T7 in Stack; waits on those)
Phase R5-CS-F (sequential): R5-CS-T11 (swatches panel — waits on T3 store + imports `ColorSwatchTile` from T11 and existing `CollapsiblePanelShell`)
Phase R5-CS-G (sequential): R5-CS-T12 (i18n keys + tests + knowledge propagation — waits on T1-T11)
```

**Plan 10 R5-CS total estimated time**: ~26 hours (~14 wall-clock hours via parallel phases R5-CS-B, R5-CS-D)

### Plan 10 Combined Total Time (Rounds 1-5 — with Color System)

- Rounds 1-3 (T1-T28): ~20 hours → ~12 wall-clock hours
- Round 4 (T29-T44): ~22 hours → ~13 wall-clock hours
- Round 5 (R5-T1 through R5-T8 advanced fill/stroke + R5-T1-T6 effects engine): ~36 hours → ~19 wall-clock hours combined
- Round 5 (R5-CS-T1 through R5-CS-T12 color system): ~26 hours → ~14 wall-clock hours
- **Plan 10 total**: ~104 hours → ~58 wall-clock hours with R5-CS parallelism stacking on existing R5.

> All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks (tsgo → biome → lint → codescene). The lint queue server must be running before any lint call. See `AGENTS.md` §"Lint Queue Server" for startup commands.

---

## Round 5: Guides & Grid Tasks

> **Scope**: Round 5 adds Photoshop/Illustrator-grade rulers, guides, grid, smart guides, snap settings, and info bar capabilities to the **editor shell** (Plan 10). The View menu, toolbar toggles, keyboard shortcuts, i18n namespace, guide preset management UI, and the info bar component all live in Plan 10. Canvas-rendered overlays (rulers, guide lines, grid, smart guides) are implemented in Plan 11; settings dialogs are in Plan 12.
>
> **Conventions**: All tasks use `@/` path aliases. MUI v9 `sx={{}}` only — no style props. Colors via `theme.palette.*`. i18n via `useAppTranslation(Translation.Dashboard.CertificateCanvas)` (takes a namespace handle object, NOT a string). Zustand stores in `frontend/common/stores/cert/`. Shared types in `frontend/common/views/dashboard/cert-canvas/types/`.
>
> **Dependency**: The `guideGridStore` (§R5-G.13 in Plan 11 design) must exist before R5-G-T03, R5-G-T04, R5-G-T05. Implement R5-G-T01 (i18n) and R5-G-T02 (keyboard shortcuts) first; they have no store dependency.

### R5-G-T01: i18n Namespace — Ruler, Guide, Grid, SmartGuide, Snap, ViewMenu Labels (~5h)

**Objective:** Extend the compile-time i18n type schema with all ruler/guide/grid/smart-guide/snap/view-menu labels, interpolation functions, and pluralization functions. Implement both English and Arabic translation files.

**Subtasks:**
- [ ] 1.1 Extend `shared/locale/types/dashboard/certificates/canvas.ts`:
  - Add `RulerLabels` interface:
    - `title: string`
    - `showRulers: string`
    - `units: string`
    - `pixels: string`
    - `millimeters: string`
    - `centimeters: string`
    - `inches: string`
    - `picas: string`
    - `points: string`
    - `resetOrigin: string`
    - `originMoved: (x: string, y: string) => string` — interpolation
    - `cursorPosition: (x: string, y: string) => string` — interpolation
  - Add `GuideLabels` interface:
    - `title: string`
    - `showGuides: string`
    - `lockGuides: string`
    - `clearGuides: string`
    - `newGuide: string`
    - `newGuideDialog: { title: string; orientation: string; horizontal: string; vertical: string; position: string; create: string; cancel: string }`
    - `guidePreset: string`
    - `snapToGuides: string`
    - `guideSelected: (orientation: string, position: string) => string` — interpolation
    - `guideTooltip: (axis: string, value: string) => string` — interpolation
    - `guideCount: (count: number) => string` — pluralization
  - Add `GridLabels` interface:
    - `title: string`
    - `showGrid: string`
    - `gridSettings: string`
    - `gridType: string`
    - `square: string`
    - `baseline: string`
    - `modular: string`
    - `isometric: string`
    - `dot: string`
    - `gridSize: string`
    - `subdivisions: string`
    - `gridColor: string`
    - `gridOpacity: string`
    - `showAboveElements: string`
    - `snapToGrid: string`
    - `convertToGuides: string`
    - `columns: string`
    - `rows: string`
    - `columnWidth: string`
    - `rowHeight: string`
    - `gutterWidth: string`
    - `alignment: string`
    - `baselineSpacing: string`
    - `startPosition: string`
    - `relativeTo: string`
    - `isometricAngle: string`
    - `gridSpacing: string`
  - Add `SmartGuideLabels` interface:
    - `title: string`
    - `smartGuides: string`
    - `sensitivity: string`
    - `alignmentCenter: string`
    - `alignmentEdge: string`
    - `equalSpacing: string`
    - `equalSize: string`
    - `distanceLabel: (px: string) => string` — interpolation
  - Add `SnapLabels` interface:
    - `title: string`
    - `snapTo: string`
    - `grid: string`
    - `guides: string`
    - `layers: string`
    - `pixels: string`
    - `artboard: string`
    - `threshold: string`
    - `priority: string`
  - Add `ViewMenuLabels` interface:
    - `title: string`
    - `rulers: string`
    - `guides: string`
    - `grid: string`
    - `smartGuides: string`
    - `snapTo: string`
    - `newGuide: string`
    - `clearGuides: string`
    - `lockGuides: string`
    - `guidePresets: { title: string; safeArea: string; bleed: string; thirds: string; goldenRatio: string; center: string; grid: string; customPreset: string; managePresets: string; importPreset: string; exportPreset: string }`
    - `printPresets: { title: string; a4Portrait: string; a4Landscape: string; letterPortrait: string; letterLandscape: string; custom: string }`
    - `shortcuts: { showRulers: string; showGuides: string; lockGuides: string; showGrid: string; snapToGrid: string; smartGuides: string; newGuide: string; clearGuides: string }`
    - `zoomIn: string`
    - `zoomOut: string`
    - `fitToScreen: string`
    - `actualSize: string`
  - Add `InfoBarLabels` interface:
    - `cursorPosition: string`
    - `dimensions: string`
    - `position: string`
    - `zoom: string`
    - `colorMode: string`
    - `documentSize: string`
    - `deltaLabel: (dx: string, dy: string) => string` — interpolation
    - `newDimensions: (w: string, h: string) => string` — interpolation
    - `rotationAngle: (deg: string) => string` — interpolation
    - `guidePosition: (axis: string, value: string) => string` — interpolation
  - Add `BleedLabels` interface:
    - `bleed: string`
    - `slug: string`
    - `trim: string`
    - `bleedMargin: string`
    - `safeArea: string`
  - Extend `CertificatesCanvasTranslations` interface to include: `ruler: RulerLabels`, `guide: GuideLabels`, `grid: GridLabels`, `smartGuide: SmartGuideLabels`, `snap: SnapLabels`, `viewMenu: ViewMenuLabels`, `infoBar: InfoBarLabels`, `bleed: BleedLabels`

- [ ] 1.2 Extend `shared/locale/en/dashboard/certificates/canvas.ts`:
  - Implement all English values for every key above
  - Interpolation functions use template literals: e.g., `originMoved: (x, y) => \`Origin moved to (${x}, ${y})\``
  - Pluralization: `guideCount: (count) => count === 1 ? \`${count} guide\` : \`${count} guides\``

- [ ] 1.3 Extend `shared/locale/ar/dashboard/certificates/canvas.ts`:
  - Implement Arabic translations for all keys
  - Arabic interpolation: `originMoved: (x, y) => \`تم نقل الأصل إلى (${x}، ${y})\``
  - Arabic pluralization (dual form for count===2): `guideCount: (count) => count === 1 ? \`دليل واحد\` : count === 2 ? \`دليلان\` : \`${count} دلائل\``

- [ ] 1.4 Verify type schema exports are re-exported from barrel `shared/locale/types/dashboard/certificates/index.ts`

**Files to Create/Modify:**
- `shared/locale/types/dashboard/certificates/canvas.ts` (modify — extend)
- `shared/locale/en/dashboard/certificates/canvas.ts` (modify — extend)
- `shared/locale/ar/dashboard/certificates/canvas.ts` (modify — extend)
- `shared/locale/types/dashboard/certificates/index.ts` (verify barrel)

**Requirements References:** REQ-10-R5G-01 (i18n namespace)

**Quality Loop:** tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

**Quality loop:**
```bash
bun run scripts/health/sub-loop.ts shared/locale/types/dashboard/certificates/canvas.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts shared/locale/en/dashboard/certificates/canvas.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts shared/locale/ar/dashboard/certificates/canvas.ts --lifecycle codescene
```

**Instruction Verification:**
- Read `shared/AGENTS.md` — shared layer must never import from `@/frontend/**` or `@/backend/**`
- Read `.agents/instructions/frontend.instructions.md`
- Verify: no `next-intl` imports, compile-time type system pattern (interface + implementation), interpolation as `(param: string) => string`, pluralization as `(count: number) => string`

**Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

---

### R5-G-T02: Keyboard Shortcut Registration — Guides & Grid Shortcuts (~2h)

**Objective:** Register all ruler/guide/grid/smart-guide keyboard shortcuts in the central keyboard shortcut manager. These shortcuts toggle visibility, lock guides, create new guides, and snap settings.

**Subtasks:**
- [ ] 2.1 Create `frontend/common/views/dashboard/cert-template-editor/utils/guideGridShortcuts.ts`:
  - Export `GUIDE_GRID_SHORTCUTS` constant — array of `ShortcutDefinition` objects:
    - `{ id: 'toggle-rulers'; key: 'R'; ctrl: true; description: 'viewMenu.shortcuts.showRulers'; handler: () => void }`
    - `{ id: 'toggle-guides'; key: ';'; ctrl: true; description: 'viewMenu.shortcuts.showGuides'; handler: () => void }`
    - `{ id: 'lock-guides'; key: ';'; ctrl: true; shift: true; description: 'viewMenu.shortcuts.lockGuides'; handler: () => void }` — Alt+Ctrl+; toggles lock
    - `{ id: 'toggle-grid'; key: "'"; ctrl: true; description: 'viewMenu.shortcuts.showGrid'; handler: () => void }`
    - `{ id: 'snap-to-grid'; key: "'"; ctrl: true; shift: true; description: 'viewMenu.shortcuts.snapToGrid'; handler: () => void }`
    - `{ id: 'toggle-smart-guides'; key: ';'; alt: true; ctrl: true; description: 'viewMenu.shortcuts.smartGuides'; handler: () => void }`
    - `{ id: 'new-guide'; key: 'g'; ctrl: true; description: 'viewMenu.shortcuts.newGuide'; handler: () => void }`
    - `{ id: 'clear-guides'; key: ';'; alt: true; ctrl: true; shift: true; description: 'viewMenu.shortcuts.clearGuides'; handler: () => void }`
  - Each handler reads/writes from `useGuideGridStore` (via `useGuideGridStore.getState()`)
  - Use `useHotkeys` hook pattern (same as existing `useKeyboardShortcuts` hook in Plan 10)

- [ ] 2.2 Integrate shortcuts into `useKeyboardShortcuts` hook in `frontend/common/views/dashboard/cert-template-editor/hooks/useKeyboardShortcuts.ts`:
  - Import `GUIDE_GRID_SHORTCUTS` and merge with existing shortcut array
  - Ensure no key conflicts with existing shortcuts (R, G are currently used for rectangle/pen tools — when in guide-edit mode, these shortcuts should be overridden)

- [ ] 2.3 Create unit test hooks for keyboard shortcut conflict detection:
  - `frontend/common/views/dashboard/cert-template-editor/hooks/__tests__/gridHotkeyConflictRules.test.ts`
  - Test: no duplicate `id` values
  - Test: no conflicting key+modifier combos with existing shortcuts

**Files to Create/Modify:**
- `frontend/common/views/dashboard/cert-template-editor/utils/guideGridShortcuts.ts` (create)
- `frontend/common/views/dashboard/cert-template-editor/hooks/useKeyboardShortcuts.ts` (modify — merge)
- `frontend/common/views/dashboard/cert-template-editor/hooks/__tests__/gridHotkeyConflictRules.test.ts` (create)

**Requirements References:** REQ-10-R5G-02 (keyboard shortcuts)

**Quality loop:** tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

**Quality loop:**
```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-template-editor/utils/guideGridShortcuts.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-template-editor/hooks/useKeyboardShortcuts.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-template-editor/hooks/__tests__/gridHotkeyConflictRules.test.ts --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`
- Verify: `@/` path aliases, no `console.*` (use `logger`), discriminated `ShortcutDefinition` type

**Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

---

### R5-G-T03: ViewMenu Component — Rulers/Guides/Grid/SmartGuides Submenus (~6h)

**Objective:** Create the View menu dropdown component with submenus for Rulers, Guides, Grid, Smart Guides, Snap To, New Guide, Clear Guides, Lock Guides, Guide Presets, Print Presets, and zoom controls.

**Subtasks:**
- [ ] 3.1 Create `frontend/common/views/dashboard/cert-template-editor/components/ViewMenu.tsx`:
  - Uses MUI `Menu`, `MenuItem`, `ListItemIcon`, `ListItemSecondaryAction`, `Typography`
  - Top-level items:
    - "Rulers" toggle — `CheckOutlined` icon when on, checked state from `useGuideGridStore(s => s.showRulers)`, shortcut text: `Ctrl+R`
    - "Guides" submenu — expands to show: Show Guides toggle (`Ctrl+;`), Lock Guides toggle (`Ctrl+Shift+;`), Clear Guides action, New Guide action (`Ctrl+G`)
    - "Grid" submenu — expands to show: Show Grid toggle (`Ctrl+'`), Grid Settings action, Snap to Grid toggle (`Ctrl+Shift+'`), Convert Grid to Guides action
    - "Smart Guides" toggle — `CheckOutlined` when on, shortcut: `Alt+Ctrl+;`
    - "Snap To" submenu — expands to show checkboxes: Grid (`Ctrl+Shift+'`), Guides, Layers, Pixels, Artboard
    - "Guide Presets" submenu — expands to show preset list from `useGuideGridStore(s => s.guidePresets)`
    - "Print Presets" submenu — expands to show A4/Letter presets
    - Separator
    - "Zoom In" (`Ctrl++`), "Zoom Out" (`Ctrl+-`), "Fit to Screen" (`Ctrl+0`), "Actual Size" (`Ctrl+1`)
  - All `MenuItem`s use `sx={{}}` for styling — no style props
  - Text via `useAppTranslation(Translation.Dashboard.CertificateCanvas)` — keys under `viewMenu.*`
  - Shortcut text rendered as `Typography` in `ListItemSecondaryAction` with `sx={{ fontSize: '0.75rem', color: theme => theme.palette.text.secondary }}`
  - Color: `sx={{ color: theme => theme.palette.text.primary }}` for menu items

- [ ] 3.2 Create `frontend/common/views/dashboard/cert-template-editor/components/GuidePresetsSubmenu.tsx`:
  - Renders preset list with icons and "Apply" action
  - Built-in presets: Safe Area, Bleed, Thirds, Golden Ratio, Center, Grid
  - Custom presets from `useGuideGridStore(s => s.customPresets)`
  - "Manage Presets..." item → opens `GuidePresetManager` (Plan 12)
  - Uses `ListItemIcon` with domain-specific icons (`SecurityOutlined`, `FormatAlignCenterOutlined`, etc.)
  - All colors via `theme.palette.*`

- [ ] 3.3 Create `frontend/common/views/dashboard/cert-template-editor/components/PrintPresetsSubmenu.tsx`:
  - A4 Portrait (210×297mm), A4 Landscape (297×210mm)
  - Letter Portrait (8.5×11in), Letter Landscape (11×8.5in)
  - Custom... → opens dialog (Plan 12)
  - Each preset applies both page dimensions AND margin guides
  - Icons: `DescriptionOutlined` with orientation badge

- [ ] 3.4 Create barrel export `frontend/common/views/dashboard/cert-template-editor/components/viewMenu/index.ts`

- [ ] 3.5 Write outcome file: `.ai/plans/cert-plan-10/outcome/R5G-T03-view-menu-outcome.md`

**Files to Create:**
- `frontend/common/views/dashboard/cert-template-editor/components/ViewMenu.tsx`
- `frontend/common/views/dashboard/cert-template-editor/components/GuidePresetsSubmenu.tsx`
- `frontend/common/views/dashboard/cert-template-editor/components/PrintPresetsSubmenu.tsx`
- `frontend/common/views/dashboard/cert-template-editor/components/viewMenu/index.ts`

**Requirements References:** REQ-10-R5G-03 (View menu), REQ-10-R5G-04 (guide presets menu), REQ-10-R5G-05 (print presets)

**Quality loop:** tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

**Quality loop:**
```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-template-editor/components/ViewMenu.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-template-editor/components/GuidePresetsSubmenu.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-template-editor/components/PrintPresetsSubmenu.tsx --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/AGENTS.md` — MUI v9: `sx={{}}` only, no style props
- Read `frontend/views/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`
- Verify: `useAppTranslation(Translation.Dashboard.CertificateCanvas)` pattern, `ListItemIcon` imports from `@mui/material`, icon names end with `Outlined` (MUI v9), `sx={{ color: theme => theme.palette.text.primary }}` pattern

**Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

---

### R5-G-T04: Toolbar Toggle Buttons — Rulers/Grid/Guides/SmartGuides (~3h)

**Objective:** Add toolbar toggle buttons for rulers, guides, grid, and smart guides visibility. These are quick-access toggles in the main editor toolbar.

**Subtasks:**
- [ ] 4.1 Create `frontend/common/views/dashboard/cert-template-editor/components/GuideGridToolbarButtons.tsx`:
  - Four `IconButton` toggle buttons:
    - Rulers toggle — `StraightOutlined` icon, `aria-label` from i18n `ruler.showRulers`, `color="primary"` when on
    - Guides toggle — `HorizontalRuleOutlined` icon, `aria-label` from i18n `guide.showGuides`
    - Grid toggle — `GridOnOutlined` icon, `aria-label` from i18n `grid.showGrid`
    - Smart Guides toggle — `AutoFixHighOutlined` icon, `aria-label` from i18n `smartGuide.smartGuides`
  - Each button uses `sx={{ color: theme => active ? theme.palette.primary.main : theme.palette.text.secondary }}`
  - `onClick` calls `useGuideGridStore.getState().toggleRulers()` etc.
  - `Tooltip` on each button with i18n label and shortcut text
  - Toolbar `Divider` before and after these buttons

- [ ] 4.2 Create unit test:
  - `frontend/common/views/dashboard/cert-template-editor/components/__tests__/GuideGridToolbarButtons.test.ts`
  - Test: clicking rulers toggle calls `toggleRulers()`
  - Test: active state renders with `theme.palette.primary.main` color

**Files to Create:**
- `frontend/common/views/dashboard/cert-template-editor/components/GuideGridToolbarButtons.tsx`
- `frontend/common/views/dashboard/cert-template-editor/components/__tests__/GuideGridToolbarButtons.test.ts`

**Requirements References:** REQ-10-R5G-06 (toolbar toggles)

**Quality loop:** tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

**Quality loop:**
```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-template-editor/components/GuideGridToolbarButtons.tsx --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/AGENTS.md` — MUI v9 icon names end with `Outlined`, `sx={{}}` only, no hardcoded colors
- Read `.agents/instructions/frontend.instructions.md`

**Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

---

### R5-G-T05: InfoBar Component — Bottom Canvas Status Bar (~4h)

**Objective:** Create the info bar at the bottom of the canvas area showing cursor position, selection dimensions, zoom level, color mode, document size, and contextual drag/guide information.

**Subtasks:**
- [ ] 5.1 Create `frontend/common/views/dashboard/cert-canvas/components/InfoBar.tsx`:
  - `Box` with `sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 0.5, minHeight: 28, backgroundColor: theme => theme.palette.background.paper, borderTop: 1, borderTopColor: theme => theme.palette.divider, fontSize: '0.75rem', color: theme => theme.palette.text.secondary }}`
  - Left section — cursor position: `Typography` with `sx={{ fontSize: '0.75rem' }}` showing `cursorPosition: (x, y) => ...` from i18n `infoBar.cursorPosition`
  - Center section — selection info:
    - When element selected: `dimensions: (w, h) => ...` and `position: (x, y) => ...`
    - When no selection: show document size `documentSize: (w, h) => ...`
  - Right section — zoom % and color mode:
    - Zoom label: `${Math.round(zoom * 100)}%`
    - Color mode: `RGB` (v1 always RGB — CMYK deferred to v2)
  - During drag (from `useCanvasStore(s => s.interactionState)`):
    - `interactionState.type === 'dragging'` → show `deltaLabel: (dx, dy) => ...`
    - `interactionState.type === 'resizing'` → show `newDimensions: (w, h) => ...`
    - `interactionState.type === 'rotating'` → show `rotationAngle: (deg) => ...`
  - During guide drag (from `useGuideGridStore(s => s.guideDragState)`):
    - Show `guidePosition: (axis, value) => ...` with current units
  - All values formatted using current `rulerUnit` from `useGuideGridStore` — unit-aware formatting (px → integer, mm/cm/in → 2 decimals)

- [ ] 5.2 Create `frontend/common/views/dashboard/cert-canvas/utils/infoBarFormatter.ts`:
  - `formatCursorPosition(x: number, y: number, unit: RulerUnit): string` — converts px to current unit
  - `formatDimensions(w: number, h: number, unit: RulerUnit): string`
  - `formatDelta(dx: number, dy: number, unit: RulerUnit): string`
  - `formatZoom(zoom: number): string` — returns `${Math.round(zoom * 100)}%`
  - Uses `convertFromPx` utility from Plan 11 `rulerUnits.ts`

- [ ] 5.3 Create unit tests:
  - `frontend/common/views/dashboard/cert-canvas/utils/__tests__/infoBarFormatter.test.ts`
  - Test: `formatCursorPosition(100, 200, 'px')` → `"X: 100px, Y: 200px"`
  - Test: `formatCursorPosition(100, 200, 'mm')` → `"X: 26.46mm, Y: 52.92mm"` (approx)
  - Test: `formatZoom(1.5)` → `"150%"`
  - Test: `formatZoom(0.25)` → `"25%"`

**Files to Create:**
- `frontend/common/views/dashboard/cert-canvas/components/InfoBar.tsx`
- `frontend/common/views/dashboard/cert-canvas/utils/infoBarFormatter.ts`
- `frontend/common/views/dashboard/cert-canvas/utils/__tests__/infoBarFormatter.test.ts`

**Requirements References:** REQ-10-R5G-07 (info bar), REQ-10-R5G-08 (drag info)

**Quality loop:** tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

**Quality loop:**
```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-canvas/components/InfoBar.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-canvas/utils/infoBarFormatter.ts --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/AGENTS.md` — no `console.*`, `sx={{}}` only
- Read `frontend/views/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`
- Verify: `useAppTranslation(Translation.Dashboard.CertificateCanvas)` for i18n, `@/` path aliases, no hardcoded colors

**Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

---

### R5-G-T06: BleedIndicator Component — Visual Bleed Area on Canvas (~3h)

**Objective:** Render a visual indicator showing the bleed area (outside trim line) on the canvas viewport. This helps users understand safe/trim/bleed zones.

**Subtasks:**
- [ ] 6.1 Create `frontend/common/views/dashboard/cert-canvas/components/BleedIndicator.tsx`:
  - Renders an `Svg` overlay in the `CanvasViewport` showing:
    - Trim line: solid line at template edges
    - Bleed area: dashed line outside trim (default 3mm / 0.125in)
    - Safe area: dashed line inside trim (default 5% margin)
  - Colors from `theme.palette`:
    - Trim: `theme.palette.text.primary` at 50% opacity
    - Bleed: `theme.palette.warning.main` (amber/yellow)
    - Safe area: `theme.palette.success.main` (green)
  - Only renders when `useGuideGridStore(s => s.showBleedIndicator)` is `true`
  - Measurements come from `useGuideGridStore(s => s.bleedConfig)`:
    - `{ bleedMargin: number; safeAreaMargin: number; unit: RulerUnit }`
  - Lines use `strokeDasharray` for dashed style
  - Labels (optional): small `text` elements at corners showing "Trim", "Bleed", "Safe"
  - Uses `sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}`

- [ ] 6.2 Create unit test:
  - `frontend/common/views/dashboard/cert-canvas/components/__tests__/BleedIndicator.test.ts`
  - Test: renders only when `showBleedIndicator` is true
  - Test: SVG lines use correct `strokeDasharray` values
  - Test: colors match `theme.palette.warning.main` for bleed

**Files to Create:**
- `frontend/common/views/dashboard/cert-canvas/components/BleedIndicator.tsx`
- `frontend/common/views/dashboard/cert-canvas/components/__tests__/BleedIndicator.test.ts`

**Requirements References:** REQ-10-R5G-09 (bleed/slug display)

**Quality loop:** tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

**Quality loop:**
```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-canvas/components/BleedIndicator.tsx --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/AGENTS.md` — no hardcoded colors, use `theme.palette.*`
- Read `.agents/instructions/frontend.instructions.md`

**Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

---

### R5-G-T07: ShortcutDisplayUtility — Ruler/Guide/Grid Shortcut Tooltip Generator (~1h)

**Objective:** Create a utility function that generates display strings for keyboard shortcuts (e.g., "Ctrl+R", "Ctrl+Shift+;") for use in menus, tooltips, and the help panel.

**Subtasks:**
- [ ] 7.1 Create `frontend/common/views/dashboard/cert-template-editor/utils/shortcutDisplay.ts`:
  - `formatShortcut(def: ShortcutDefinition): string` — returns formatted string:
    - Mac: `⌘R`, `⌘;`, `⌘+'`, `⌘⇧;`, etc.
    - Windows/Linux: `Ctrl+R`, `Ctrl+;`, `Ctrl+'`, `Ctrl+Shift+;`, etc.
  - Detects platform via `navigator.platform` (with fallback to `process.platform`)
  - Uses Unicode symbols on Mac: `⌘` (Cmd), `⇧` (Shift), `⌥` (Alt), `⌃` (Ctrl)
  - Uses text on Windows/Linux: `Ctrl+`, `Shift+`, `Alt+`
  - Handles combined modifiers: `{ ctrl: true, shift: true, key: ';' }` → `⌘⇧;` on Mac, `Ctrl+Shift+;` on Win

- [ ] 7.2 Create unit tests:
  - `frontend/common/views/dashboard/cert-template-editor/utils/__tests__/shortcutDisplay.test.ts`
  - Test: Mac format for `{ ctrl: true, key: 'R' }` → `"⌘R"`
  - Test: Win format for `{ ctrl: true, key: 'R' }` → `"Ctrl+R"`
  - Test: `{ ctrl: true, shift: true, key: ';' }` → Mac `"⌘⇧;"`, Win `"Ctrl+Shift+;"`
  - Test: `{ ctrl: true, alt: true, key: ';' }` → Mac `"⌘⌥;"`, Win `"Ctrl+Alt+;"`

**Files to Create:**
- `frontend/common/views/dashboard/cert-template-editor/utils/shortcutDisplay.ts`
- `frontend/common/views/dashboard/cert-template-editor/utils/__tests__/shortcutDisplay.test.ts`

**Requirements References:** REQ-10-R5G-10 (shortcut display)

**Quality loop:** tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

**Quality loop:**
```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-template-editor/utils/shortcutDisplay.ts --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/AGENTS.md` — no `console.*`
- Read `.agents/instructions/frontend.instructions.md`

**Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

---

### Round 5 Guides & Grid Time Estimate (Plan 10 portion)

| Task | Hours |
|------|-------|
| R5-G-T01: i18n namespace | ~5h |
| R5-G-T02: Keyboard shortcuts | ~2h |
| R5-G-T03: ViewMenu component | ~6h |
| R5-G-T04: Toolbar toggle buttons | ~3h |
| R5-G-T05: InfoBar component | ~4h |
| R5-G-T06: BleedIndicator component | ~3h |
| R5-G-T07: Shortcut display utility | ~1h |
| **Total** | **~24h** |

> **Parallelism**: T01 + T02 can start immediately (no store dependency). T03–T06 depend on `guideGridStore` (Plan 11 §R5-G.13). T07 has no dependencies.
>
> **Dependency graph**: T01 → T03, T04 (i18n keys); T02 → T03 (shortcut labels); Plan 11 R5-G-T13 (store) → T03, T04, T05, T06


## Round 5: Custom Shapes & Boolean Tasks

> These tasks (T45–T58) implement the Round 5 custom shape tool system, custom shape library panel, boolean operation toolbar, shape settings, SVG/URL import, and i18n additions defined in `design.md` §"Round 5: Custom Shapes & Boolean Operations". Each task includes: file paths, MUI v9 components with `sx` prop usage, Zustand store updates to `templateEditorStore.ts`, quality loop commands, and instruction-file verification.

### Task Dependencies Graph (Round 5)

```
T45 (store additions) ─┬─> T46 (shape tool toolbar group)
                       ├─> T47 (shape library panel)
                       ├─> T48 (boolean toolbar)
                       ├─> T49 (shape tool settings dialog)
                       ├─> T50 (keyboard shortcuts: R/Shift+R/E/L/P/S/T/C)
                       └─> T54 (boolean keyboard shortcuts)
T47 ─> T51 (SVG import utility)
T47 ─> T52 (URL import utility)
T46 + T47 ─> T53 (shape tool settings dialog integration)
T45 ─> T55 (i18n keys for R5)
T45–T55 ─> T58 (knowledge propagation)
```

---

## T45 — Round 5 Store Additions for Shape Tool System

> **Files**:
> - `frontend/common/stores/templateEditorStore.ts` (modify — add R5 state, actions, persist fields)
> **Depends On**: T20 (store from Round 1), T29 (R4 store + persist middleware)
> **Time Budget**: 2-3 hours

### Subtasks

1. Read `frontend/common/stores/AGENTS.md` (re-confirm: Zustand, no `File`/`Blob` in persisted state, `useRef` for `File`)

2. Add R5 state fields per `design.md` §R5.6:
   ```typescript
   // Shape tool
   activeShapeTool: ShapeTool;                    // default 'select'
   shapeToolConfig: ShapeToolConfig;
   // Shape library
   shapeLibraryPanelOpen: boolean;                // default false
   recentShapeIds: string[];                      // cap 12
   customShapePresets: ShapePreset[];
   // Boolean operations
   booleanOperationsActive: boolean;              // computed
   ```

3. Add R5 actions:
   ```typescript
   setActiveShapeTool: (tool: ShapeTool) => void;
   setShapeToolConfig: (config: Partial<ShapeToolConfig>) => void;
   toggleShapeLibraryPanel: () => void;
   addRecentShape: (shapeId: string) => void;     // dedup, prepend, cap 12
   addCustomShapePreset: (preset: ShapePreset) => void;
   deleteCustomShapePreset: (id: string) => void;
   applyBooleanOperation: (op: BooleanOperation, operandIds: string[]) => string;
   flattenBoolean: (elementId: string) => void;
   ```

4. Add to Zustand `persist` `partialize`:
   - `shapeToolConfig`
   - `shapeLibraryPanelOpen`
   - `recentShapeIds`
   - `activeShapeTool` (persisted as 'select' — don't restore drawing mode on reload)

5. Create type definitions:
   - `shared/types/cert/shapeTypes.ts` — `ShapeTool`, `ShapeToolConfig`, `ShapeType`, `CornerRadiusConfig`, `BooleanConfig`, `ShapeOperand`, `ShapePreset`, `BooleanOperation`
   - `shared/constants/cert/shapeCategories.ts` — `ShapeCategory` union and labels

6. Run quality loop:
   ```bash
   bun run scripts/health/sub-loop.ts frontend/common/stores/templateEditorStore.ts --lifecycle codescene
   bun run scripts/health/sub-loop.ts shared/types/cert/shapeTypes.ts --lifecycle codescene
   bun run scripts/health/sub-loop.ts shared/constants/cert/shapeCategories.ts --lifecycle codescene
{"id":"r5-45","files":["frontend/common/stores/templateEditorStore.ts","shared/types/cert/shapeTypes.ts","shared/constants/cert/shapeCategories.ts"]}

- [ ] **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

---

## T46 — Shape Tool Toolbar Group

> **Files**:
> - `frontend/views/dashboard/cert/templates/editor/toolbar/ShapeToolGroup.tsx` (new)
> - `frontend/views/dashboard/cert/templates/editor/EditorToolbar.tsx` (modify — render `ShapeToolGroup`)
> **Depends On**: T45 (store), T30 (toolbar from R4)
> **Time Budget**: 2 hours

### Subtasks

1. Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md` for component conventions
2. Read `.agents/instructions/frontend.instructions.md`
3. Create `ShapeToolGroup.tsx`:
   - `ToggleButtonGroup` with `exclusive` mode
   - 8 `ToggleButton`s: rectangle, roundedRectangle, ellipse, polygon, star, triangle, line, custom
   - Each with MUI v9 icon: `CropSquareOutlined`, `RoundedCornerOutlined`, `CircleOutlined`, `HexagonOutlined`, `StarBorderOutlined`, `TriangleOutlined` (note: if `TriangleOutlined` doesn't exist in MUI v9, use `ChangeHistoryOutlined`), `RemoveOutlined`, `CategoryOutlined`
   - All tooltips via `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` key `shapes.tool.*`
   - Active tool state reads from `useTemplateEditorStore(s => s.activeShapeTool)`
   - On tool select, calls `setActiveShapeTool(tool)`
   - When `custom` is selected, also opens the shape library panel (`toggleShapeLibraryPanel`)
4. Add `ShapeToolGroup` to `EditorToolbar.tsx` after the existing tool groups
5. Run quality loop per file

- [ ] **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

---

## T47 — Custom Shape Library Panel

> **Files**:
> - `frontend/views/dashboard/cert/templates/editor/panels/ShapeLibraryPanel.tsx` (new)
> - `frontend/views/dashboard/cert/templates/editor/EditorLayout.tsx` (modify — add panel toggle to left sidebar)
> - `shared/constants/cert/shapePresets/basic.ts` (new — shape preset definitions for basic category)
> - `shared/constants/cert/shapePresets/arrows.ts` (new)
> - `shared/constants/cert/shapePresets/banners.ts` (new)
> - `shared/constants/cert/shapePresets/ornaments.ts` (new)
> - `shared/constants/cert/shapePresets/borders.ts` (new)
> - `shared/constants/cert/shapePresets/certificates.ts` (new)
> **Depends On**: T45 (store)
> **Time Budget**: 4-5 hours

### Subtasks

1. Read `shared/AGENTS.md` (shared layer rules — no imports from frontend/backend)
2. Create shape preset data files in `shared/constants/cert/shapePresets/`:
   - Each file exports `ShapePreset[]` with `id`, `category`, `labelKey`, `pathData`, `viewBox`, `defaultSize`, `tags`, `thumbnail`
   - Basic: rectangle, rounded rect, ellipse, polygon (6 sides), star (5 points), triangle, line, heart
   - Arrows: 6 arrow presets (straight, curved, double, chevron, hand-drawn, callout)
   - Banners: 5 banner presets (scroll, ribbon, flag, decorative, pennant)
   - Ornaments: 7 ornament presets (flourish, divider, corner ornament, fleur-de-lis, scrollwork, vine, filigree)
   - Borders: 5 border presets (rectangular, oval, scalloped, decorative, rope)
   - Certificates: 7 presets (seal, ribbon medallion, laurel wreath, medal, rosette, crest, crown)
3. Create `ShapeLibraryPanel.tsx`:
   - Search bar: MUI `TextField` with `InputProps` `SearchOutlined` icon, filters by `tags` case-insensitively
   - Category `Accordion` sections, lazily loading presets on first expand (import per file on demand)
   - `ImageList` with `cols={4}`, `gap={4}` for 64px thumbnail grid
   - Each thumbnail renders inline `<svg>` with shape's `pathData` scaled to fit 64px box
   - Fill color: `theme.palette.text.primary`; hover bg: `theme.palette.action.hover`
   - Selected shape border: `1px solid theme.palette.primary.main`
   - "Recently Used" section at top (collapsible) — reads `recentShapeIds` from store
   - "Custom" section — reads `customShapePresets` from store, with delete `IconButton` per item
   - "Import SVG" button (`Button` with `UploadFileOutlined`) — opens file input dialog
   - "Import from URL" button (`Button` with `LinkOutlined`) — opens URL input dialog
   - Empty states: "No custom shapes yet" / "No results found"
4. Modify `EditorLayout.tsx` to add panel toggle `IconButton` in left sidebar header:
   - `CategoryOutlined` icon toggles `shapeLibraryPanelOpen`
   - When open, `ShapeLibraryPanel` renders in the left sidebar column
5. Run quality loop per file
6. All MUI components use `sx={{}}` — never direct style props
7. All text uses `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` keys `shapeCategory.*` and `shapeLibrary.*`

- [ ] **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

---

## T48 — Boolean Operation Toolbar

> **Files**:
> - `frontend/views/dashboard/cert/templates/editor/toolbar/BooleanToolbar.tsx` (new)
> - `frontend/views/dashboard/cert/templates/editor/EditorToolbar.tsx` (modify — render `BooleanToolbar`)
> **Depends On**: T45 (store), T46 (shape tool group)
> **Time Budget**: 2 hours

### Subtasks

1. Read `frontend/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
2. Create `BooleanToolbar.tsx`:
   - Wrapped in MUI `Collapse` — `in={selectedShapeCount >= 2}` with `timeout={200}`
   - Contains `Paper` with `display: flex`, `gap: 0.5`, `p: 0.5`
   - 7 boolean operation `IconButton`s with MUI icons:
     - Unite: `JoinFullOutlined`
     - Subtract: `JoinLeftOutlined`
     - Intersect: `JoinInnerOutlined`
     - Exclude: `OpacityOutlined`
     - Divide: `CallSplitOutlined`
     - Trim: `ContentCutOutlined`
     - Merge: `MergeOutlined`
   - `Divider orientation="vertical" flexItem` between destructive/non-destructive ops
   - Flatten `IconButton` with `LayersClearOutlined`
   - All tooltips: `t("boolean.unite")`, `t("boolean.subtract")`, etc.
   - Each operation calls `applyBooleanOperation(op, selectedElementIds)` from store
   - Flatten calls `flattenBoolean(elementId)` — must show confirmation dialog first
   - Delete confirmation `Dialog` for flatten (since it's destructive)
3. Modify `EditorToolbar.tsx` to render `BooleanToolbar` below the main toolbar groups
4. `selectedShapeCount` is computed from `useCanvasStore(s => s.selectedElementIds)` filtering elements of `type === 'shape'`
5. Run quality loop per file

- [ ] **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

---

## T49 — Shape Tool Settings Dialog

> **Files**:
> - `frontend/views/dashboard/cert/templates/editor/dialogs/ShapeToolSettingsDialog.tsx` (new)
> - `frontend/views/dashboard/cert/templates/editor/toolbar/ShapeToolGroup.tsx` (modify — add settings dropdown button)
> **Depends On**: T45 (store), T46 (shape tool group)
> **Time Budget**: 2 hours

### Subtasks

1. Create `ShapeToolSettingsDialog.tsx`:
   - MUI `Dialog` with `maxWidth="sm"` and `fullWidth`
   - Default corner radius slider (0–100px) for rounded rectangles
   - Default polygon sides `TextField` (type=number, min=3, max=12)
   - Default star points `TextField` (type=number, min=3, max=20)
   - Default star inner radius `Slider` (10–90 percent)
   - Default line thickness `Slider` (1–20px)
   - Default fill enabled `Switch` (default true)
   - Default stroke enabled `Switch` (default false)
   - A live preview shape rendered with current settings (small `<svg>` 100×100px)
   - All controls update `shapeToolConfig` via `setShapeToolConfig`
   - All text via `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` keys `shapes.settings.*`
2. Modify `ShapeToolGroup.tsx` to add a dropdown arrow `IconButton` next to the active tool group that opens the settings dialog
3. Run quality loop per file

- [ ] **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

---

## T50 — Shape Tool Keyboard Shortcuts

> **Files**:
> - `frontend/views/dashboard/cert/templates/editor/hooks/useEditorShortcuts.ts` (modify — add shape tool shortcuts)
> **Depends On**: T45 (store), T32 (shortcut manager from R4)
> **Time Budget**: 1-2 hours

### Subtasks

1. Read `.agents/instructions/frontend.instructions.md` for keyboard event handling
2. Add shape tool shortcuts to `useEditorShortcuts`:
   - `R` → `setActiveShapeTool('rectangle')`
   - `Shift+R` → `setActiveShapeTool('roundedRectangle')`
   - `E` → `setActiveShapeTool('ellipse')`
   - `L` → `setActiveShapeTool('line')`
   - `P` → `setActiveShapeTool('polygon')`
   - `S` → `setActiveShapeTool('star')`
   - `T` → `setActiveShapeTool('triangle')`
   - `C` → `setActiveShapeTool('custom')` + `toggleShapeLibraryPanel()`
   - `Esc` → `setActiveShapeTool('select')` (exit drawing mode)
   - `V` → `setActiveShapeTool('select')` (alias for Esc, consistent with standard design tools)
3. All shortcuts must be disabled when text input has focus (same `ShortcutManager` scope-resolution from R4)
4. Register shortcuts in the `ShortcutManager` with scope `shape-tools` — active when no text input is focused
5. Run quality loop

- [ ] **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

---

## T51 — SVG Import Utility

> **Files**:
> - `frontend/views/dashboard/cert/templates/editor/utils/svgImport.ts` (new)
> - `frontend/views/dashboard/cert/templates/editor/panels/ShapeLibraryPanel.tsx` (modify — wire import button)
> - `frontend/views/dashboard/cert/templates/editor/dialogs/SvgImportDialog.tsx` (new)
> **Depends On**: T45 (store), T47 (shape library panel)
> **Time Budget**: 2-3 hours

### Subtasks

1. Create `svgImport.ts`:
   ```typescript
   export async function parseSvgToShapePreset(
     svgContent: string, label: string, category: ShapeCategory,
   ): Promise<ShapePreset>;
   export class InvalidSvgError extends Error {}
   ```
   - Uses `DOMParser` to parse SVG content
   - Extracts all `<path>` elements' `d` attributes and joins with space
   - Extracts viewBox dimensions
   - Validates: non-empty path data, valid viewBox
   - Creates `ShapePreset` with auto-generated ID (`custom-${Date.now()}`)
2. Create `SvgImportDialog.tsx`:
   - MUI `Dialog` with file drop zone (MUI `Card` with `onDrop`/`onDragOver`)
   - Accepts `.svg` files only (validate MIME type `image/svg+xml`)
   - Preview of imported shape (64px thumbnail)
   - Label `TextField` for the shape name
   - Category `Select` dropdown (default: custom)
   - "Import" button calls `parseSvgToShapePreset` then `addCustomShapePreset`
   - Error display: red `Alert` with error message on parse failure
3. Modify `ShapeLibraryPanel.tsx` import button to open `SvgImportDialog`
4. Run quality loop per file

- [ ] **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

---

## T52 — SVG URL Import Utility

> **Files**:
> - `frontend/views/dashboard/cert/templates/editor/utils/svgUrlImport.ts` (new)
> - `frontend/views/dashboard/cert/templates/editor/dialogs/UrlImportDialog.tsx` (new)
> - `frontend/views/dashboard/cert/templates/editor/panels/ShapeLibraryPanel.tsx` (modify — wire URL import button)
> **Depends On**: T45 (store), T51 (svgImport.ts for `parseSvgToShapePreset`)
> **Time Budget**: 1-2 hours

### Subtasks

1. Create `svgUrlImport.ts`:
   ```typescript
   export async function importShapeFromUrl(url: string): Promise<ShapePreset>;
   ```
   - Preflight CORS check: `fetch(url, { mode: 'cors', headers: { 'Accept': 'image/svg+xml' } })`
   - On non-200: throw `FetchError`
   - On non-SVG content (no `<svg`): throw `InvalidSvgError`
   - Extract filename from URL for default label
   - Calls `parseSvgToShapePreset` (from T51) to create the preset
2. Create `UrlImportDialog.tsx`:
   - MUI `Dialog` with `TextField` for URL input
   - "Import" button calls `importShapeFromUrl`
   - Loading state: `CircularProgress` while fetching
   - Error display: `Alert` with CORS error message or invalid SVG message
   - Success: preview shape + "Save to library" button
3. Modify `ShapeLibraryPanel.tsx` URL import button to open `UrlImportDialog`
4. Run quality loop per file

- [ ] **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

---

## T53 — Shape Tool Settings Integration

> **Files**:
> - `frontend/views/dashboard/cert/templates/editor/toolbar/ShapeToolGroup.tsx` (modify — add settings dropdown)
> - `frontend/views/dashboard/cert/templates/editor/dialogs/ShapeToolSettingsDialog.tsx` (wire from T49)
> **Depends On**: T46, T49
> **Time Budget**: 1 hour

### Subtasks

1. Add a dropdown `IconButton` (`ArrowDropDownOutlined`) next to the `ToggleButtonGroup` in `ShapeToolGroup.tsx`
2. Use MUI `Menu` anchored to the dropdown button
3. Menu item: "Shape Tool Settings..." → opens `ShapeToolSettingsDialog`
4. Menu item: "Reset to defaults" → calls `setShapeToolConfig` with default values
5. Run quality loop

- [ ] **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

---

## T54 — Boolean Operation Keyboard Shortcuts

> **Files**:
> - `frontend/views/dashboard/cert/templates/editor/hooks/useEditorShortcuts.ts` (modify — add boolean shortcuts)
> **Depends On**: T45 (store), T48 (boolean toolbar), T50 (shortcut hook)
> **Time Budget**: 1 hour

### Subtasks

1. Add boolean operation shortcuts to `useEditorShortcuts`:
   - `Ctrl+Shift+U` → `applyBooleanOperation('unite', selectedShapeIds)`
   - `Ctrl+Shift+S` → `applyBooleanOperation('subtract', selectedShapeIds)`
   - `Ctrl+I` → `applyBooleanOperation('intersect', selectedShapeIds)`
   - `Ctrl+Shift+X` → `applyBooleanOperation('exclude', selectedShapeIds)`
2. Add to `ShortcutManager` under scope `boolean-ops` — only active when `selectedShapeCount >= 2`
3. Run quality loop

- [ ] **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

---

## T55 — i18n Keys for Round 5

> **Files**:
> - `shared/locale/types/cert/certificateTemplateEditor.ts` (modify — add R5 key types)
> - `shared/locale/ar/.../certificateTemplateEditor.ts` (modify — add Arabic translations)
> - `shared/locale/en/.../certificateTemplateEditor.ts` (modify — add English translations)
> **Depends On**: T45 (store — needs the type definitions)
> **Time Budget**: 2 hours

### Subtasks

1. Read `shared/AGENTS.md` for i18n system rules (compile-time typed translations)
2. Add R5 i18n key types per `design.md` §R5.5:
   - `shapes.*` (tool group, tool names, draw mode hints, settings)
   - `shapeCategory.*` (7 categories)
   - `shapeLibrary.*` (panel title, search, import, recently used, custom shapes, errors)
   - `boolean.*` (all operation names, flatten confirm dialog, validation messages)
3. Implement Arabic translations in `shared/locale/ar/.../certificateTemplateEditor.ts`
4. Implement English translations in `shared/locale/en/.../certificateTemplateEditor.ts`
5. All pluralization functions follow `(count: number) => string` pattern
6. All interpolation functions follow `(param: string, ...) => string` pattern
7. Run quality loop per file

- [ ] **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

---

## T58 — Round 5 Knowledge Propagation

> **Files**:
> - `frontend/COMPONENT_PATTERNS.md` (append — shape tool patterns)
> - `frontend/IMPLEMENTATION_LEARNINGS.md` (append — shape rendering lessons)
> **Depends On**: T45–T55
> **Time Budget**: 1 hour

### Subtasks

1. Append to `frontend/COMPONENT_PATTERNS.md`:
   - "Shape Tool System" section: toolbar group pattern, shape library panel pattern, boolean toolbar pattern
   - Pattern for ToggleButtonGroup with keyboard shortcuts in toolbar
2. Append to `frontend/IMPLEMENTATION_LEARNINGS.md`:
   - Shape rendering lessons (SVG element types per shape, path generation)
   - Boolean operation caching strategies (LRU cache, cache invalidation)
   - SVG import gotchas (DOMParser, CORS validation)
3. Update task AGENTS.md discovery table with T45–T55 rows
4. Run quality checks

---

### Instruction File & AGENTS.md Discovery (Round 5 Append)

| Task | Files Created/Modified | AGENTS.md to Read | Instructions to Read |
|---|---|---|---|
| T45 | `frontend/common/stores/templateEditorStore.ts` (modify), `shared/types/cert/shapeTypes.ts` (new), `shared/constants/cert/shapeCategories.ts` (new) | `frontend/common/stores/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T46 | `frontend/views/dashboard/cert/templates/editor/toolbar/ShapeToolGroup.tsx` (new), `EditorToolbar.tsx` (modify) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T47 | `ShapeLibraryPanel.tsx` (new), `EditorLayout.tsx` (modify), `shared/constants/cert/shapePresets/*.ts` (new) | `frontend/views/AGENTS.md`, `shared/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T48 | `BooleanToolbar.tsx` (new), `EditorToolbar.tsx` (modify) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T49 | `ShapeToolSettingsDialog.tsx` (new), `ShapeToolGroup.tsx` (modify) | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T50 | `useEditorShortcuts.ts` (modify) | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T51 | `svgImport.ts` (new), `SvgImportDialog.tsx` (new), `ShapeLibraryPanel.tsx` (modify) | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T52 | `svgUrlImport.ts` (new), `UrlImportDialog.tsx` (new), `ShapeLibraryPanel.tsx` (modify) | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T53 | `ShapeToolGroup.tsx` (modify), `ShapeToolSettingsDialog.tsx` (wire) | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T54 | `useEditorShortcuts.ts` (modify) | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T55 | `shared/locale/types/cert/certificateTemplateEditor.ts` (modify), `shared/locale/ar/.../certificateTemplateEditor.ts` (modify), `shared/locale/en/.../certificateTemplateEditor.ts` (modify) | `shared/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| T58 | `frontend/COMPONENT_PATTERNS.md` (append), `frontend/IMPLEMENTATION_LEARNINGS.md` (append) | `AGENTS.md` | — |

### Verification

- All session todos for R5 tasks are `done`
- No `.md` summary files created in repo (per AGENTS.md rule)
- `design.md` §R5.6 store contract matches implemented `templateEditorStore.ts` R5 additions
- `design.md` §R5.5 i18n keys match `shared/locale/types/cert/certificateTemplateEditor.ts` R5 type additions
- Inline documentation present in: `ShapeToolGroup.tsx`, `ShapeLibraryPanel.tsx`, `BooleanToolbar.tsx`, `svgImport.ts`, `svgUrlImport.ts`
- Plan 11 has sufficient R5 interface contracts (`activeShapeTool`, `shapeToolConfig`, `ShapePreset` schema, boolean store actions)
- Plan 12 has sufficient R5 interface contracts (`ShapeElementData` properties, `updateShapeProperty`, `flattenBooleanElement`, `saveElementAsCustomShape`)

---

## Round 5 Execution Order

```
Phase R5-A (sequential):  T45 (store additions + type definitions)
Phase R5-B (parallel):    T46 (shape tool toolbar), T47 (shape library panel), T48 (boolean toolbar)
Phase R5-C (parallel):    T49 (settings dialog), T50 (shape shortcuts), T54 (boolean shortcuts)
Phase R5-D (parallel):    T51 (SVG import), T52 (URL import)
Phase R5-E (sequential):  T53 (settings integration — depends on T46+T49)
Phase R5-F (sequential):  T55 (i18n — depends on T45 type defs)
Phase R5-I (sequential):  T58 (knowledge propagation — depends on T45–T55)
```

**Round 5 total estimated time**: 22 hours (parallelizable to ~14 wall-clock hours via parallel phases R5-B, R5-C, R5-D)

### Full Plan Time (Rounds 1-5 Combined)

- Rounds 1-3 (T20-T28): ~35 hours → ~20 wall-clock hours
- Round 4 (T29-T44): ~38 hours → ~22 wall-clock hours
- Round 5 (T45-T58): ~22 hours → ~14 wall-clock hours
- **Plan 10 total**: ~95 hours → ~56 wall-clock hours

> Note: All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks (tsgo → biome → lint → codescene). The lint queue server must be running before any lint call. See `AGENTS.md` §"Lint Queue Server" for startup commands.

## Round 5: Zoom & Navigation Tasks

- [ ] R5Z-T1. Create `zoomStore.ts` Zustand store
  - State: `zoom` (number, default 1.0), `minZoom` (0.05), `maxZoom` (16), `scrollOffset` ({x,y}), `viewportSize` ({width,height}), `isPanning` (boolean), `panStartPoint` ({x,y}), `tempZoom` (number|null)
  - Actions: `setZoom`, `zoomIn`, `zoomOut`, `resetZoom`, `fitToScreen`, `actualSize`, `zoomToSelection`, `zoomToAll`, `setScrollOffset`, `startPan`, `endPan`, `setTempZoom`, `clearTempZoom`
  - Zoom levels array: [0.05, 0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 8, 16]
  - File: `frontend/common/stores/cert/zoomStore.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5Z-T2. Create `ZoomControlsToolbar` component
  - Props: none (reads from zoomStore)
  - Renders: ZoomOut button, percentage label (clickable dropdown), ZoomIn button, FitScreen button, ActualSize button, Reset button
  - Percentage dropdown: preset levels menu (25%, 50%, 75%, 100%, 150%, 200%, 400%, 800%)
  - i18n keys: `certificateEditor.zoomIn`, `certificateEditor.zoomOut`, `certificateEditor.fitToScreen`, `certificateEditor.actualSize`, `certificateEditor.resetZoom`, `certificateEditor.zoomLevel`
  - File: `frontend/views/certificate-editor/components/ZoomControlsToolbar.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
  - _Instructions: frontend.instructions.md, frontend/AGENTS.md_

- [ ] R5Z-T3. Create `NavigatorPanel` component (Photoshop-style)
  - Red viewport rectangle over certificate thumbnail
  - Drag rectangle to navigate
  - Zoom slider at bottom (5% to 1600%)
  - Zoom percentage display
  - Pannable certificate preview in panel
  - File: `frontend/views/certificate-editor/components/NavigatorPanel.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5Z-T4. Create `MiniMapPanel` component
  - Thumbnail of entire certificate (25% scale)
  - Blue viewport rectangle showing current view
  - Click to navigate — moves viewport to clicked position
  - Drag viewport rectangle to pan
  - Toggleable visibility
  - File: `frontend/views/certificate-editor/components/MiniMapPanel.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5Z-T5. Implement zoom-to-point with mouse wheel
  - Zoom toward cursor position (point under cursor stays fixed)
  - `Ctrl`+wheel for zoom (always, regardless of tool)
  - Pinch-zoom support on trackpad
  - Smooth zoom transitions (requestAnimationFrame easing)
  - File: `frontend/views/certificate-editor/hooks/useZoomOnWheel.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5Z-T6. Implement pan navigation
  - Spacebar+drag temporary pan mode
  - Middle mouse button pan
  - Hand tool from toolbar (persistent pan tool)
  - Scroll bar support (horizontal + vertical)
  - Trackpad two-finger drag pan
  - File: `frontend/views/certificate-editor/hooks/usePanNavigation.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5Z-T7. Implement keyboard zoom shortcuts
  - `Ctrl`+`+` zoom in, `Ctrl`+`-` zoom out
  - `Ctrl`+`1` actual size, `Ctrl`+`0` fit to screen
  - `Ctrl`+`Shift`+`0` reset zoom
  - `Ctrl`+`Shift`+`+` zoom to selection
  - `Ctrl`+`Alt`+`0` zoom to all
  - `Z` (hold) temp zoom 200%, `Alt`+`Z` temp zoom 50%
  - `X` (hold) toggle 100% and previous
  - File: `frontend/views/certificate-editor/hooks/useZoomShortcuts.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5Z-T8. Implement navigation shortcuts
  - `Home` scroll to top-left, `End` scroll to bottom-right
  - `Page Up`/`Page Down` scroll by viewport height
  - `Ctrl`+Arrow keys scroll in direction
  - Smooth scroll transitions (200ms animation)
  - File: `frontend/views/certificate-editor/hooks/useNavigationKeys.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5Z-T9. Implement scrubby zoom
  - `Space`+`Z`+drag: right to zoom in, left to zoom out
  - Continuous zoom following drag distance
  - Smooth transitions
  - File: `frontend/views/certificate-editor/hooks/useScrubbyZoom.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5Z-T10. Add i18n keys for zoom/navigation panel
  - Namespace: `certificateEditor`
  - Keys: zoomIn, zoomOut, fitToScreen, actualSize, resetZoom, zoomToSelection, zoomToAll, zoomLevel, fitWidth, fitHeight, navigatorPanel, miniMap, handTool, scrubbyZoom, tempZoomIn, tempZoomOut
  - Files: `shared/locale/en/certificateTemplateEditor.ts`, `shared/locale/ar/certificateTemplateEditor.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5Z-T11. Knowledge propagation & documentation
  - Read all outcome files
  - Create doc: `docs/frontend/certificate-zoom-navigation.md`
  - Update `frontend/AGENTS.md` with zoom/navigation patterns reference
  - Update root `AGENTS.md` Important References
  - Run: `bun tsgo`, `bun biome:check`, `bun run lint`
  - Write outcome file

## Round 5: Keyboard Shortcuts Tasks

- [ ] R5K-T1. Create `useKeyboardShortcuts` hook
  - Central hook managing all keyboard shortcuts
  - Reads active context from `useEditorContextStore` (canvas/text/panel/dialog/drag)
  - Dispatches to appropriate store action based on context
  - Supports modifier keys: Ctrl, Shift, Alt
  - Prevents browser default for captured shortcuts
  - File: `frontend/views/certificate-editor/hooks/useKeyboardShortcuts.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
  - _Instructions: frontend.instructions.md, frontend/AGENTS.md_

- [ ] R5K-T2. Create `KeyboardShortcutsDialog` component
  - Searchable list grouped by category (File, Edit, View, Tools, Elements, Layers, Arrange, Typography, Workspace, History)
  - Each row: action name, current binding text, edit button
  - Click edit → capture next key press as new binding
  - Conflict detection highlights conflicting shortcuts in red
  - "Reset to Default" button per row and global reset
  - Import/export shortcuts as JSON
  - Context filter dropdown
  - File: `frontend/views/certificate-editor/components/KeyboardShortcutsDialog.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5K-T3. Create `shortcutConfig.ts` with default bindings
  - All default shortcut definitions organized by category
  - Type: `ShortcutBinding = { action: string; category: ShortcutCategory; keys: string[]; context: ShortcutContext; }`
  - Categories: 'file', 'edit', 'view', 'tools', 'elements', 'layers', 'arrange', 'typography', 'workspace', 'history'
  - Contexts: 'global', 'canvas', 'text', 'panel', 'dialog', 'drag'
  - File: `frontend/views/certificate-editor/config/shortcutConfig.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5K-T4. Create `useShortcutCapture` hook
  - Captures next key combination when in rebinding mode
  - Combines modifier keys + key into normalized string
  - Supports single key, key+modifier, key+modifier+modifier
  - Esc cancels capture, Enter confirms
  - File: `frontend/views/certificate-editor/hooks/useShortcutCapture.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5K-T5. Create `ShortcutHelpOverlay` component
  - Full-screen overlay showing all shortcuts by category
  - Toggle with `?` key
  - Searchable filter field
  - Context-aware active shortcuts highlighted
  - Close on Esc or clicking overlay
  - File: `frontend/views/certificate-editor/components/ShortcutHelpOverlay.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5K-T6. Add shortcut display to menu items
  - Update all menu items to show shortcut binding on right
  - Use monospace font for shortcut text
  - Auto-update when shortcuts are rebound
  - File: `frontend/views/certificate-editor/components/MenuBar.tsx` (modify)
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5K-T7. Create `useShortcutCustomization` hook
  - Manages custom binding overrides in `useEditorSettingsStore`
  - `rebindShortcut(action, newKeys)`: updates binding, checks conflicts
  - `resetShortcut(action)`: resets to default
  - `resetAllShortcuts()`: resets all to defaults
  - `exportShortcuts()`: returns JSON of custom bindings
  - `importShortcuts(json)`: applies imported bindings
  - `detectConflicts()`: returns array of conflicting actions
  - File: `frontend/views/certificate-editor/hooks/useShortcutCustomization.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5K-T8. Add i18n keys for keyboard shortcuts dialog
  - Keys: keyboardShortcuts, searchShortcuts, shortcutCategory, currentBinding, newBinding, conflict, resetToDefault, resetAll, importShortcuts, exportShortcuts, file, edit, view, tools, elements, layers, arrange, typography, workspace, history, globalCtx, canvasCtx, textCtx, panelCtx, dialogCtx, dragCtx, showShortcuts, constrainAngle, duplicate, uniformScale, snapRotate
  - Files: `shared/locale/en/certificateTemplateEditor.ts`, `shared/locale/ar/certificateTemplateEditor.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5K-T9. Test suite for keyboard shortcuts
  - Test default bindings load correctly
  - Test shortcut capture produces correct key combination
  - Test conflict detection flags overlapping bindings
  - Test context-aware routing dispatches to correct action
  - Test import/export round-trip
  - Test reset to default
  - Test modifier key behavior (Shift constrain, Alt duplicate)
  - File: `test/unit/certificate-editor/keyboard-hotkeys.test.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5K-T10. Knowledge propagation & documentation
  - Read all outcome files
  - Create doc: `docs/frontend/certificate-keyboard-shortcuts.md`
  - Update `frontend/AGENTS.md` with keyboard shortcut patterns
  - Update root `AGENTS.md` Important References
  - Run: `bun tsgo`, `bun biome:check`, `bun run lint`
  - Write outcome file

---

## Round 5: Mask & Clipping Tasks

> Round 5 task list for Plan 10 — mask/clipping toolbar buttons, layer menu items, quick mask toolbar + options, mask brush tool group (selection only), layers panel mask add buttons + mask thumbnails + link icon + clipped layer indicators, Alt+click clipping handler, and keyboard shortcuts. These define shared types consumed by Plans 11 and 12. Total R5 mask scope for Plan 10: 10 tasks (~28 hours).

### Task Dependencies Graph (Round 5 — Masking)

```
MASK-T01 (maskTypes.ts shared types + MaskIcon custom SvgIcon)
  ├─→ MASK-T02 (store additions: mask actions + mask mode state + quick mask state + refactor-edge state)
  │       ├─→ MASK-T03 (ToolbarMaskButtons)
  │       │       └─→ MASK-T08 (useMaskShortcuts — waits on T03 for active tool wiring)
  │       ├─→ MASK-T04 (EditorLayerMenu — mask/clipping submenu items)
  │       ├─→ MASK-T05 (ToolbarQuickMaskButton + QuickMaskOptionsPopover)
  │       ├─→ MASK-T06 (ToolbarMaskBrushTools — tool selection only)
  │       └─→ MASK-T07 (LayersPanelMaskAddButtons + MaskIcon integration + LayerRowMaskThumbnail + LayersPanelAltClickHandler + LayerRow clipping indicator modify)
  ├─→ MASK-T09 (i18n: AR + EN keys + type schema extend)
  │       └─→ (MASK-T10 integration verification — depends on MASK-T01..T09)
  └─→ MASK-T10 (test verification + knowledge propagation)
```

**Execution order**: MASK-T01 → (MASK-T02 parallel; MASK-T09 type-schema branch) → MASK-T03, T04, T05, T06, T07 (parallel after T02) → MASK-T08 (waits on T03 ready) → MASK-T10 (waits on all)

**Estimated effort**: ~28 hours (~16 wall-clock hours via the early split and mid-phase parallelism)

---

### MASK-T01: Mask Types Definitions + MaskIcon Custom Icon

**Estimated time**: 3 hours
**Depends on**: Plan 11/12 R5-T1 (canonical `MaskElementExtension` type — but Plan 10 creates the file)
**Requirements**: design.md §R5.12

- [ ] **Read applicable AGENTS.md** (before working in each):
  - `frontend/stores/AGENTS.md` (state file conventions)
  - `AGENTS.md` root (`@/*` path alias, MUI v9 style props → `sx={}` ban, NEVER hardcode colors)
  - `frontend/AGENTS.md`

- [ ] **Read applicable instruction files**:
  - `.agents/instructions/frontend.instructions.md`

- [ ] **Create** `frontend/common/stores/cert/maskTypes.ts`:
  - `MaskType` union: `'pixel' | 'vector' | 'clipping'`
  - `MaskViewMode` union: `'normal' | 'maskOnly' | 'overlay' | 'onBlack' | 'onWhite' | 'onLayers'`
  - `MaskEditMode` union: `'none' | 'edit'`
  - `QuickMaskMode` union: `'maskedAreas' | 'selectedAreas'`
  - `LayerMaskData` interface (see design §R5.12): `id`, `type`, `enabled`, `linked`, `density` (0-100), `feather` (0-250px), `smooth` (0-100), `contrast` (-100 to +100), `shiftEdge` (-100 to +100), `decontaminate`, `decontaminateAmount` (0-100), `pixelData?: MaskPixelData`, `vectorPath?: PathData` (from `penTool.types.ts`), `inverted: boolean`
  - `MaskPixelData` interface: `width`, `height`, `dataUri: string`, optional internal `buffer?: Uint8ClampedArray`
  - `ClippingMaskData` interface: `baseElementId`, `clippedElementIds: string[]`
  - `QuickMaskOptions` interface: `mode: QuickMaskMode`, `color: string`, `opacity: number (0-100)`
  - `ActiveMaskTarget` interface: `elementId`, `maskType: 'layer' | 'vector'`, `targetPath?: 'layerMask' | 'vectorMask' | 'opacityMask'`
  - `RefineEdgeSettings` interface: `smooth (0-100)`, `feather (0-250px)`, `contrast (0-100)`, `shiftEdge (-100 to +100)`, `decontaminate: boolean`, `decontaminateAmount (0-100)`, `output: 'layerMask' | 'newDocument' | 'newLayerWithMask' | 'newSelection'`
  - `MaskElementExtension` interface: `layerMask?: LayerMaskData`, `vectorMask?: LayerMaskData`, `clippingMaskBaseId?: string`, `clippingMaskClippedIds?: string[]`, `opacityMask?: OpacityMaskData`
  - `OpacityMaskData` interface (see design §R5.12): `id`, `clip: boolean`, `inverted: boolean`, `maskContent` (discriminated union: `MaskPixelData | { type: 'gradient'; gradientId } | { type: 'shape'; shapeId }`), `transform?`
  - Import `PathData` from `@/frontend/common/stores/cert/penToolTypes` for `vectorPath`
  - All comments use `// R5: Mask` prefix to distinguish from other rounds
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
    ```bash
    bun run scripts/health/sub-loop.ts frontend/common/stores/cert/maskTypes.ts --lifecycle codescene
{"id":"r5m-plan10-t01","files":["frontend/common/stores/cert/maskTypes.ts"]}

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/panels/layers/MaskIcon.tsx`:
  - Custom `SvgIcon` component (rectangle with circle — "mask" metaphor)
  - Uses `currentColor` for stroke/fill — inherits theme palette, NEVER hardcoded
  - `viewBox="0 0 24 24"` with `<rect>` outline + `<circle>` filled at 50% opacity
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### MASK-T02: Store Additions — Mask Actions + Mask Mode State

**Estimated time**: 4 hours
**Depends on**: MASK-T01 (types must exist first)
**Requirements**: design.md §R5.13, Plan 12 §R5.9

- [ ] **Read applicable AGENTS.md**:
  - `frontend/stores/AGENTS.md` (state file conventions — no `File`/`Blob` in persisted state)
  - `AGENTS.md` root
  - `frontend/AGENTS.md`

- [ ] **Read applicable instruction files**:
  - `.agents/instructions/frontend.instructions.md`

- [ ] **Modify** `frontend/common/stores/cert/certTemplateEditorStore.ts` (or the applicable store — coordinate with existing store architecture):
  - Add state fields:
    - `maskMode: MaskEditMode` (default: `'none'`)
    - `activeMaskTarget: ActiveMaskTarget | null` (default: `null`)
    - `maskViewMode: MaskViewMode` (default: `'normal'`)
    - `quickMaskActive: boolean` (default: `false`)
    - `quickMaskOptions: QuickMaskOptions` (default: `{ mode: 'maskedAreas', color: '', opacity: 50 }` — color set from theme on init, not hardcoded)
    - `refineSettings: RefineEdgeSettings` (default: `{ smooth: 0, feather: 0, contrast: 0, shiftEdge: 0, decontaminate: false, decontaminateAmount: 50, output: 'layerMask' }`)
    - `hasActiveMask: boolean` (derived selector — true if selected element has any mask)
    - `maskDisabled: boolean` (derived — true if selected element's mask is disabled)
  - Add actions (see design §R5.13 / Plan 12 §R5.9 for full list):
    - `addLayerMask(elementId, type)`, `addVectorMask(elementId)`, `deleteMask(elementId, maskType?)`, `applyMask(elementId, maskType?)` (destructive), `toggleMaskEnabled(elementId, enabled?)`, `toggleMaskVisibility(elementId)`, `invertMask(elementId, maskType?)`, `commitMaskStroke(elementId, dataUri)`, `setMaskProperty(elementId, partial)`, `setMaskViewMode(mode)`, `setMaskMode(mode)`, `setActiveMaskTarget(elementId, maskType, targetPath?)`
    - `createClippingMask(topElementId, baseElementId)`, `releaseClippingMask(topElementId)`
    - `toggleQuickMask()`, `setQuickMaskOptions(partial)`, `convertQuickMaskToSelection()`
    - `setRefineEdgeSettings(partial)`, `applyRefineEdge(settings)`
    - `addOpacityMask(elementId)`, `deleteOpacityMask(elementId)`, `toggleOpacityMaskClip(elementId)`, `invertOpacityMask(elementId)`, `toggleOpacityMaskLink(elementId)`
    - `rasterizeVectorMask(elementId)` (converts vector mask to pixel mask)
  - **Do NOT add mask state to the `persist` partializer** — `maskMode`, `activeMaskTarget`, `quickMaskActive`, `quickMaskOptions`, `maskViewMode`, `refineSettings` are all ephemeral/session-only. Only `layerMask`, `vectorMask`, `clippingMaskBaseId`, `clippingMaskClippedIds`, `opacityMask` ON ELEMENTS are persisted.
  - `createClippingMask` sets `elements[topId].clippingMaskBaseId = baseId` and `elements[baseId].clippingMaskClippedIds = [...ids, topId]`
  - `releaseClippingMask` clears both fields and removes from array
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
    ```bash
    bun run scripts/health/sub-loop.ts frontend/common/stores/cert/certTemplateEditorStore.ts --lifecycle codescene
{"id":"r5m-plan10-t02","files":["frontend/common/stores/cert/certTemplateEditorStore.ts"]}

### MASK-T03: Toolbar Mask Buttons

**Estimated time**: 2 hours
**Depends on**: MASK-T02 (store actions must exist)
**Requirements**: design.md §R5.2

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`

- [ ] **Read applicable instruction files**:
  - `.agents/instructions/frontend.instructions.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/toolbar/ToolbarMaskButtons.tsx`:
  - `IconButton` + `Tooltip` cluster: Add Layer Mask (`AddCircleOutlineOutlined`), Add Vector Mask (`GestureOutlined`), Toggle Mask Visibility (`VisibilityOutlined`/`VisibilityOffOutlined`), Enter Mask Mode (`BrushOutlined`)
  - All `sx={{}}` — no style props. Active state: `sx={{ color: 'primary.main' }}`; inactive: `sx={{ color: 'text.secondary' }}`
  - Reads `selectedElementIds`, `hasActiveMask`, `maskDisabled` from store via `useShallow` selector
  - Disabled when zero or multiple elements selected (mask buttons require single selection)
  - `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` for all labels — keys: `mask.addLayerMask`, `mask.addVectorMask`, `mask.toggleVisibility`, `mask.enterMaskMode`
  - Keyboard shortcut hints in tooltips (not in i18n — appended in Tooltip `title` via template: `t('mask.addLayerMask')`)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
    ```bash
    bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/toolbar/ToolbarMaskButtons.tsx --lifecycle codescene
{"id":"r5m-plan10-t03","files":["frontend/views/dashboard/cert/templates/editor/toolbar/ToolbarMaskButtons.tsx"]}

- [ ] **Modify** `frontend/views/dashboard/cert/templates/editor/toolbar/EditorToolbar.tsx`:
  - Import `ToolbarMaskButtons` and insert after `PenToolGroup` cluster, before `AlignToolbarCluster`
  - Wrap in `React.memo` — re-renders only on `selectedElementIds` / `hasActiveMask` / `maskDisabled` change (via `useShallow`)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### MASK-T04: Editor Layer Menu (Mask & Clipping Submenus)

**Estimated time**: 3 hours
**Depends on**: MASK-T02 (store actions)
**Requirements**: design.md §R5.3

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/menubar/EditorLayerMenu.tsx`:
  - `Menu` anchored to "Layer" `Button` in editor menubar
  - Menu structure (see design §R5.3):
    - Create Clipping Mask (`Ctrl+Alt+G`) → `createClippingMask()`
    - Release Clipping Mask (`Ctrl+Alt+G`) → `releaseClippingMask()` (context-sensitive: label swaps based on whether top selected is clipped)
    - Layer Mask submenu: Add Pixel Mask, Add Vector Mask, Enable/Disable Mask, Apply Mask (destructive — confirmation `Dialog`), Delete Mask, Rasterize Vector Mask, Invert Mask
    - Quick Mask Mode (`Q`) → `toggleQuickMask()`
    - Quick Mask Options… → opens `QuickMaskOptionsPopover`
  - Each `MenuItem` uses `ListItemIcon` + `ListItemText` (shortcut in `ListItemText.secondary`)
  - No style props — spacing via `sx={{ py: 0.5 }}`
  - Context-sensitive disable: items disabled based on selection count, mask presence, mask type
  - Destructive operations (Apply, Rasterize) show confirmation `Dialog` with `DialogTitle`, `DialogContentText` (i18n: `mask.confirm.applyTitle`/`applyMessage`, `rasterizeTitle`/`rasterizeMessage`)
  - `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` — keys: `mask.createClippingMask`, `mask.releaseClippingMask`, `mask.layerMask`, `mask.addPixelMask`, `mask.addVectorMaskMenu`, `mask.enableMask`, `mask.disableMask`, `mask.applyMask`, `mask.deleteMask`, `mask.rasterizeVectorMask`, `mask.invertMask`, `mask.quickMask.tooltip`, `mask.quickMask.color`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
    ```bash
    bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/menubar/EditorLayerMenu.tsx --lifecycle codescene
{"id":"r5m-plan10-t04","files":["frontend/views/dashboard/cert/templates/editor/menubar/EditorLayerMenu.tsx"]}

### MASK-T05: Quick Mask Toolbar Button + Options Popover

**Estimated time**: 2 hours
**Depends on**: MASK-T02
**Requirements**: design.md §R5.4

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/toolbar/ToolbarQuickMaskButton.tsx`:
  - `IconButton` + `Tooltip` — toggles `quickMaskActive` via `toggleQuickMask()`
  - Active state: `sx={{ color: 'primary.main' }}`; inactive: `sx={{ color: 'text.secondary' }}`
  - Icon: `GradientOutlined` (MUI v9)
  - `aria-pressed={quickMaskActive}` for accessibility
  - i18n keys: `mask.quickMask.tooltip`, `mask.quickMask.ariaLabel`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/toolbar/QuickMaskOptionsPopover.tsx`:
  - `Popover` anchored to the Quick Mask button
  - Mode toggle (`ToggleButtonGroup`): "Masked Areas" → `quickMaskOptions.mode = 'maskedAreas'`; "Selected Areas" → `'selectedAreas'`
  - Color picker (reuse existing `ColorPicker` component from Plan 10 R5 color system) — default reads `theme.palette.error.main`, stored in `quickMaskOptions.color`
  - Opacity slider (`Slider` 0-100, default 50) — `aria-valuetext={`${value}%`}`
  - All `sx={{}}`, colors from theme palette — never hardcoded
  - Keyboard accessible: `Tab` cycles controls, `Enter` applies, `Esc` closes
  - i18n keys: `mask.quickMask.mode`, `mask.quickMask.maskedAreas`, `mask.quickMask.selectedAreas`, `mask.quickMask.color`, `mask.quickMask.opacity`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### MASK-T06: Mask Brush Tool Group (Toolbar Selection)

**Estimated time**: 2 hours
**Depends on**: MASK-T02
**Requirements**: design.md §R5.5

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/toolbar/ToolbarMaskBrushTools.tsx`:
  - `ToggleButtonGroup` flyout (same pattern as `PenToolGroup`)
  - Tools: brushMask (`B`), pencilMask (`N`), gradientMask (`G`), eraserMask (`E`)
  - Icons: `BrushOutlined`, `EditOutlined`, `GradientOutlined`, `AutoFixOffOutlined` (all MUI v9 `*Outlined` suffix)
  - Only enabled when `maskMode === 'edit'` AND `activeMaskTarget` is set — otherwise `disabled`
  - `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` — keys: `mask.brush`, `mask.pencil`, `mask.gradient`, `mask.eraser`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### MASK-T07: Layers Panel Mask Buttons + Thumbnails + Alt+Click + Clipped Indicators

**Estimated time**: 5 hours
**Depends on**: MASK-T02
**Requirements**: design.md §R5.6, §R5.7, §R5.8, §R5.9

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/panels/layers/LayersPanelMaskAddButtons.tsx`:
  - Two `IconButton`s: Add Layer Mask (`AddCircleOutlineOutlined` / or `MaskIcon` from T01), Add Vector Mask (`GestureOutlined`)
  - Disabled when no selection or element already has that mask type
  - Position: left of existing delete/trash button in layers panel footer
  - i18n: `mask.addLayerMask`, `mask.addVectorMask`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/panels/layers/LayerRowMaskThumbnail.tsx`:
  - Renders mask thumbnail (32×32) — the actual canvas rendering is Plan 11's `MaskThumbnailCanvas`; this component provides the click/alt-click/shift-click interaction layer and the link icon
  - Mask click → `setActiveMaskTarget(elementId, maskType)` + `setMaskMode('edit')`
  - Layer thumbnail click → `setActiveMaskTarget(null)` + `setMaskMode('none')`
  - Link icon toggle (`LinkOutlined` / `LinkOffOutlined`) → `setMaskProperty(elementId, { linked: !linked })`
  - Alt+click mask thumbnail → `setMaskViewMode('maskOnly')`; Alt+click again → restore
  - Shift+click mask thumbnail → `toggleMaskVisibility(elementId)` — shows red X overlay via `sx={{ '&::after': ... }}` using `theme.palette.error.main`
  - Disabled indicator (red X) when `mask.enabled === false`
  - All `sx={{}}`, no style props, no hardcoded colors
  - i18n: `mask.maskThumbnail`, `mask.linkMask`, `mask.unlinkMask`, `mask.maskDisabledOverlay`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/panels/layers/LayersPanelAltClickHandler.tsx`:
  - Hit-area overlay between two layer rows (thin bar)
  - Shows highlight when `isAltPressed` (global Alt key listener — `keydown`/`keyup` on `window`)
  - Click toggles: `createClippingMask(topId, baseId)` or `releaseClippingMask(topId)` based on current clipping state
  - Cursor: `pointer` when active, `default` otherwise
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] **Modify** `frontend/views/dashboard/cert/templates/editor/panels/layers/LayerRow.tsx`:
  - If `element.clippingMaskBaseId` is set: indent row (`sx={{ pl: 3 }}`) + `ArrowDownwardOutlined` icon (`sx={{ fontSize: 16, color: 'text.secondary' }}`) before thumbnail
  - If element is a clipping base (other elements have `clippingMaskBaseId === this.id`): underline layer name (`sx={{ textDecoration: 'underline' }}`)
  - If element has a mask: render `LayerRowMaskThumbnail` next to the layer thumbnail
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### MASK-T08: Mask Keyboard Shortcuts

**Estimated time**: 2 hours
**Depends on**: MASK-T03 (toggle/visibility actions wired into toolbar — shortcuts need the actions)
**Requirements**: design.md §R5.10

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/shortcuts/useMaskShortcuts.ts`:
  - Registers via existing `ShortcutManager` (from Plan 10 R4)
  - Shortcuts (see design §R5.10):
    - `Q` → `toggleQuickMask()` (always, editor focus)
    - `Ctrl+Alt+G` (Win) / `Cmd+Option+G` (Mac) → `createClippingMask()` or `releaseClippingMask()` (context toggle based on selection)
    - `\\` → `toggleMaskVisibility(selElementId)` (has mask)
    - `Alt+\\` → `invertMask(selElementId)` (has mask)
    - `Shift+\\` → `toggleMaskEnabled(selElementId, null)` → toggles (has mask)
    - `Enter` (in mask mode) → `exitMaskMode()` + `applyMask()` (confirm via dialog)
    - `Esc` (in mask mode) → `setMaskMode('none')` + `setActiveMaskTarget(null)` + restore previous tool
    - `B`/`N`/`G`/`E` → set `activeTool` to `brushMask`/`pencilMask`/`gradientMask`/`eraserMask` (only when `maskMode === 'edit'`)
  - macOS detection: `navigator.platform.includes('Mac')` swaps Ctrl → Cmd, Alt → Option
  - Returns cleanup function that unregisters on unmount
  - Context-gated: only active when editor canvas has focus (uses the same `ShortcutManager` context gating as existing shortcuts)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene
    ```bash
    bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/shortcuts/useMaskShortcuts.ts --lifecycle codescene
{"id":"r5m-plan10-t08","files":["frontend/views/dashboard/cert/templates/editor/shortcuts/useMaskShortcuts.ts"]}

### MASK-T09: i18n Keys (AR + EN) + Type Schema Extend

**Estimated time**: 2 hours
**Depends on**: MASK-T01 (types — need keys to match type fields)
**Requirements**: design.md §R5.11

- [ ] **Read applicable AGENTS.md**:
  - `shared/AGENTS.md` (i18n compile-time system rules)
  - `AGENTS.md`

- [ ] **Read applicable instruction files**:
  - `.agents/instructions/frontend.instructions.md`

- [ ] **Modify** `shared/locale/types/templateEditor.ts` (type schema):
  - Append `mask` namespace keys (see design §R5.11):
    - `addLayerMask`, `addVectorMask`, `toggleVisibility`, `enterMaskMode`
    - `createClippingMask`, `releaseClippingMask`, `layerMask`, `addPixelMask`, `addVectorMaskMenu`, `enableMask`, `disableMask`, `applyMask`, `applyMaskConfirm`, `applyMaskTitle`, `deleteMask`, `rasterizeVectorMask`, `rasterizeVectorMaskConfirm`, `rasterizeVectorMaskTitle`, `invertMask`
    - `quickMask: { tooltip, ariaLabel, mode, maskedAreas, selectedAreas, color, opacity }`
    - `brush`, `pencil`, `gradient`, `eraser`
    - `maskModeActive`, `maskOnlyView`, `refineEdge`
    - `maskThumbnail`, `linkMask`, `unlinkMask`, `maskDisabledOverlay`, `clippedIndicator`
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] **Modify** `shared/locale/ar/.../templateEditor.ts`:
  - Implement all `mask.*` keys in Arabic (RTL-aware — singular forms)
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] **Modify** `shared/locale/en/.../templateEditor.ts`:
  - Implement all `mask.*` keys in English
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

### MASK-T10: Test Verification + Knowledge Propagation

**Estimated time**: 3 hours
**Depends on**: MASK-T01 through MASK-T09
**Requirements**: all design sub-sections

- [ ] **Read applicable instruction files**:
  - `.agents/instructions/tests.instructions.md`, `.agents/instructions/frontend.instructions.md`

- [ ] **Append** to `frontend/IMPLEMENTATION_LEARNINGS.md` (append-only):
  - Entry: "Mask buttons require single-selection — multi-selection disables them. Alt+click between layers must use a global keydown/keyup listener (not per-row onClick) to avoid race conditions."
  - Entry: "Mask pixel data (`MaskPixelData.dataUri`) is persisted but OffscreenCanvas buffers are NOT — use `useRef` for buffers to avoid 1MB+ string serialization in store."
  - Entry: "Quick mask color must default from `theme.palette.error.main` — never hardcode '#FF0000'."
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] **Append** to `frontend/COMPONENT_PATTERNS.md` (append-only):
  - Pattern: "Mask toolbar button cluster — `IconButton` + `Tooltip` with active/inactive `sx={{ color: ... }}`"
  - Pattern: "Layer menu with context-sensitive labels — Create vs Release Clipping Mask based on element's `clippingMaskBaseId`"
  - **Quality loop**: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

---

### Instruction File & AGENTS.md Discovery (Plan 10 — Masking)

| Task | Files Created/Modified | AGENTS.md to Read | Instructions to Read |
|------|-----------------------|-------------------|----------------------|
| MASK-T01 | `maskTypes.ts`, `MaskIcon.tsx` | `frontend/stores/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-T02 | `certTemplateEditorStore.ts` (modify) | `frontend/stores/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-T03 | `ToolbarMaskButtons.tsx`, `EditorToolbar.tsx` (modify) | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-T04 | `EditorLayerMenu.tsx` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-T05 | `ToolbarQuickMaskButton.tsx`, `QuickMaskOptionsPopover.tsx` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-T06 | `ToolbarMaskBrushTools.tsx` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-T07 | `LayersPanelMaskAddButtons.tsx`, `LayerRowMaskThumbnail.tsx`, `LayersPanelAltClickHandler.tsx`, `LayerRow.tsx` (modify) | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-T08 | `useMaskShortcuts.ts` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-T09 | `shared/locale/types/templateEditor.ts`, `shared/locale/ar/.../templateEditor.ts`, `shared/locale/en/.../templateEditor.ts` | `shared/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-T10 | `frontend/IMPLEMENTATION_LEARNINGS.md`, `frontend/COMPONENT_PATTERNS.md` (append) | `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |

### Round 5 Execution Order (Plan 10 — Masking)

```
Phase R5M-A (sequential): MASK-T01 (types + icon — everything depends on maskTypes.ts)
Phase R5M-B (parallel after T01): MASK-T02 (store — imports types), MASK-T09 (i18n — imports nothing, pure locale)
Phase R5M-C (parallel after T02): MASK-T03 (ToolbarMaskButtons), MASK-T04 (EditorLayerMenu), MASK-T05 (QuickMask button+popover), MASK-T06 (MaskBrushTools), MASK-T07 (Layers panel mask UI)
  ─── MASK-T08 (shortcuts — waits on T03 for action wiring, can start T08 after T03's first commit)
Phase R5M-D (sequential after all): MASK-T10 (test verification + knowledge propagation)
```

**Plan 10 R5 mask total estimated time**: ~28 hours (~16 wall-clock hours via parallel phases R5M-B, R5M-C)

### Plan 10 Combined Total Time (Rounds 1-5 + Mask)

- Rounds 1-3 (T1-T28): ~20 hours → ~12 wall-clock hours
- Round 4 (T29-T44): ~22 hours → ~13 wall-clock hours
- Round 5 Fill/Stroke (R5-T1-T8): ~14 hours → ~6 wall-clock hours
- Round 5 Pen Tool (R5-T45+): ~6 hours
- Round 5 Layers/Assets/Context/Snap: ~20 hours
- **Round 5 Masking (MASK-T1-T10)**: ~28 hours → ~16 wall-clock hours
- **Plan 10 total**: ~84 hours → ~47 wall-clock hours with the R5 mask parallelism.

> All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks (tsgo → biome → lint → codescene). The lint queue server must be running before any lint call. See `AGENTS.md` §"Lint Queue Server" for startup commands.

## Round 5: Asset Library Tasks

- [ ] R5AL-T1. Create asset library toolbar button and menu
  - "Assets" button in editor toolbar
  - Dropdown menu: Browse Assets, Import Asset, Recent Assets
  - Opens Asset Library panel as left sidebar
  - File: `frontend/views/certificate-editor/components/toolbar/AssetLibraryButton.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5AL-T2. Create asset library panel (left sidebar)
  - Tabbed: Images, Icons, Shapes, QR Codes, Barcodes, Uploaded
  - Search bar with tag filtering
  - Category tree navigation
  - Grid view of assets with thumbnails
  - Drag from panel to canvas to place asset
  - File: `frontend/views/certificate-editor/components/panels/AssetLibraryPanel.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5AL-T3. Implement asset import functionality
  - Upload image (PNG, JPG, SVG, WebP)
  - Auto-extract metadata (dimensions, DPI, color space)
  - Assign to category, add tags
  - Store in Zustand asset store
  - File: `frontend/views/certificate-editor/hooks/useAssetImport.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5AL-T4. Implement drag-and-drop from asset library to canvas
  - Drag asset thumbnail from panel
  - Drop on canvas creates element at drop position
  - Auto-size element to asset dimensions
  - File: `frontend/views/certificate-editor/hooks/useAssetDragDrop.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5AL-T5. Add i18n keys for asset library
  - assetLibrary, browseAssets, importAsset, recentAssets, images, icons, shapes, qrCodes, barcodes, uploaded, searchAssets, categories, dragToCanvas, importImage, autoExtract, assetTags
  - Files: `shared/locale/en/certificateTemplateEditor.ts`, `shared/locale/ar/certificateTemplateEditor.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene


## Round 5: History & States Tasks

- [ ] R5H-T1. Create `HistoryPanel` component for editor sidebar
  - Linear list of history states with action type icons
  - Current state highlighted
  - Click any state to jump to it
  - scrolled into view
  - File: `frontend/views/certificate-editor/components/panels/HistoryPanel.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5H-T2. Create undo/redo toolbar buttons
  - `UndoButton` with ArrowBack icon, disabled when no undo
  - `RedoButton` with ArrowForward icon, disabled when no redo
  - Tooltip shows action name + shortcut
  - File: `frontend/views/certificate-editor/components/toolbar/HistoryToolbarButtons.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5H-T3. Implement Edit menu history items
  - Undo (Ctrl+Z), Redo (Ctrl+Shift+Z)
  - Step Forward (Ctrl+Shift+Y), Step Backward (Alt+Ctrl+Z)
  - Clear History, Purge History
  - New Snapshot, History Settings
  - Dynamic action name in menu label
  - File: `frontend/views/certificate-editor/components/menus/HistoryMenuItems.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5H-T4. Create history settings dialog
  - Max states slider (10-200, default 50)
  - Auto-flush threshold (default 25)
  - Non-linear history toggle
  - Snapshot interval input
  - File: `frontend/views/certificate-editor/components/dialogs/HistorySettingsDialog.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5H-T5. Implement history store slice
  - States array with actionType, data snapshot, timestamp
  - `undo()`, `redo()`, `jumpToState(index)`
  - `createSnapshot(name)`, `restoreSnapshot(id)`
  - `clearHistory()`, `purgeHistory()`
  - Non-linear branching support
  - File: `frontend/common/stores/cert/historyStore.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5H-T6. Implement snapshots feature
  - Create named snapshot of current state
  - Snapshot icon in history panel
  - Restore snapshot without losing current state
  - Snapshots persist across history truncation
  - File: `frontend/views/certificate-editor/components/panels/SnapshotManager.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5H-T7. Add i18n keys for history
  - history, undo, redo, stepForward, stepBackward, clearHistory, purgeHistory, newSnapshot, historySettings, maxStates, autoFlush, nonlinearHistory, snapshotInterval, restoreSnapshot
  - Files: `shared/locale/en/certificateTemplateEditor.ts`, `shared/locale/ar/certificateTemplateEditor.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

## Round 5: Canvas Pro Tasks

- [ ] R5C-T1. Create artboard system types and presets
  - `ArtboardConfig`: width, height, name, background, bleed
  - Presets: A4 Landscape, A4 Portrait, Letter, Certificate sizes
  - File: `frontend/common/stores/cert/artboardTypes.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5C-T2. Implement artboard management in File menu
  - New Artboard (File ▸ New Artboard)
  - Duplicate Artboard
  - Delete Artboard
  - Artboard Settings dialog (dimensions, background, bleed)
  - Export each artboard independently or all
  - File: `frontend/views/certificate-editor/components/menus/ArtboardMenuItems.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5C-T3. Create artboards panel (left sidebar tab)
  - List of all artboards with thumbnails
  - Click to switch active artboard
  - Drag to reorder
  - Rename via double-click
  - Add/delete buttons
  - File: `frontend/views/certificate-editor/components/panels/ArtboardsPanel.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5C-T4. Implement multi-page support
  - Pages tab in left sidebar
  - Add/delete/duplicate/reorder pages
  - Each page contains multiple artboards
  - Page numbering and naming
  - Navigate via Page Up/Page Down
  - Export all or specific page range
  - File: `frontend/views/certificate-editor/components/panels/PagesPanel.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5C-T5. Create document setup dialog
  - Document dimensions and unit
  - DPI (72, 150, 300, custom)
  - Color mode (RGB, CMYK, Grayscale)
  - Bleed settings
  - Background color
  - Margin/padding guides
  - File: `frontend/views/certificate-editor/components/dialogs/DocumentSetupDialog.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5C-T6. Implement CMYK preview mode
  - CMYK Preview toggle in View menu
  - Soft-proof RGB colors in CMYK
  - Gamut warning highlights out-of-gamut colors
  - CMYK profile selection dropdown
  - File: `frontend/views/certificate-editor/components/menus/CMYKPreviewMenuItem.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5C-T7. Create export options dialog
  - Format: PNG, JPG, SVG, PDF
  - DPI selection (72, 150, 300)
  - Quality slider for JPG
  - Area selection (artboard, all, range)
  - Color profile embedding
  - Background transparency toggle
  - File: `frontend/views/certificate-editor/components/dialogs/ExportOptionsDialog.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5C-T8. Add i18n keys for canvas pro
  - artboards, newArtboard, duplicateArtboard, deleteArtboard, artboardSettings, artboardPresets, a4Landscape, a4Portrait, letter, certificateSize, pages, addPage, deletePage, duplicatePage, documentSetup, dpi, colorMode, rgb, cmyk, grayscale, bleed, backgroundColor, cmykPreview, gamutWarning, colorProfile, exportAs, png, jpg, svg, pdf, quality, exportArea, currentArtboard, allArtboards, pageRange, embedColorProfile, transparency, artboardThumbnail
  - Files: `shared/locale/en/certificateTemplateEditor.ts`, `shared/locale/ar/certificateTemplateEditor.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

## Round 5: Workspace & Panel Tasks

- [ ] R5W-T1. Create Window menu with workspace presets
  - Default, Design, Minimal workspace presets
  - Save Current Workspace, Reset Workspace
  - Panel toggles: Properties, Layers, History, Colors, Character, Paragraph, Assets, Guides, Navigator
  - File: `frontend/views/certificate-editor/components/menus/WindowMenu.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5W-T2. Implement panel dock system
  - Dockable panels on left and right edges
  - Tab grouping
  - Float panels outside dock zones
  - Collapse/expand animations
  - Drag dividers to resize panel areas
  - File: `frontend/views/certificate-editor/components/workspace/PanelDock.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5W-T3. Create workspace Zustand store
  - Panel visibility states
  - Panel dock positions and sizes
  - Active workspace preset name
  - Custom workspace presets
  - Persist to localStorage via Zustand persist
  - File: `frontend/common/stores/cert/workspaceStore.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5W-T4. Implement customizable toolbar
  - Add/remove/reorder toolbar buttons
  - Customize Toolbar dialog (Edit ▸ Customize Toolbar)
  - Icon size option (small, large)
  - Toolbar position (top, left, right, floating)
  - File: `frontend/views/certificate-editor/components/toolbar/CustomizableToolbar.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5W-T5. Create application frame and status bar
  - Full-screen toggle (F11)
  - Title bar with document name and save status
  - Status bar: zoom level, document size, cursor coords, element count
  - Tabbed document interface
  - File: `frontend/views/certificate-editor/components/workspace/ApplicationFrame.tsx`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5W-T6. Implement workspace persistence
  - Save custom workspace layouts per user
  - Panel resize states persisted
  - Last used workspace auto-loads
  - Multiple named workspaces
  - File: `frontend/common/stores/cert/workspacePersist.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

- [ ] R5W-T7. Add i18n keys for workspace
  - window, workspace, defaultWorkspace, designWorkspace, minimalWorkspace, saveWorkspace, resetWorkspace, properties, layers, history, colors, character, paragraph, assets, guides, navigator, customizeToolbar, smallIcons, largeIcons, toolbarTop, toolbarLeft, toolbarRight, toolbarFloating, fullscreen, documentTitle, savedStatus, zoomLevel, documentSize, cursorPosition, elementCount
  - Files: `shared/locale/en/certificateTemplateEditor.ts`, `shared/locale/ar/certificateTemplateEditor.ts`
  - _Quality loop_: tsgo + biome + lint + codescene via sub-loop.ts --lifecycle codescene

