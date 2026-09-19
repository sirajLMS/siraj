# Tasks — Plan 12: Template Editor — Element Management

| Field | Value |
|---|---|
| **Plan #** | 12 |
| **Feature** | Template Editor — Element Management |
| **Depends On** | Plan 5 (GraphQL API), Plan 11 (Visual Canvas) |
| **Estimated Total Effort** | ~48 hours |

> **Execution Model**: Parallel subagents per independent task group (see dependency graph for parallelization points)

---

## Dependency Graph

```
Task 1 (GraphQL Documents) ──────────────────────────────────────────────────┐
  │                                                                          │
  ▼                                                                          │
Task 2 (Zustand Store) ──────┐                                               │
  │                           │                                               │
  ▼                           ▼                                               │
Task 3 (ViewModel Hook) ────────────→ Task 4 (Utils: Validation + Defaults + Labels)
  │                                    │                                       │
  │                                    ▼                                       │
  │                              Task 5 (Shared Input Controls: Position/Opacity/Color/Font)
  │                                    │                                       │
  │                                    ▼                                       │
  │                              Task 6 (Common Properties Form)               │
  │                                    │                                       │
  │                                    ▼                                       │
  │                              Task 7 (Type-Specific Property Forms + Dispatcher)
  │                                    │                                       │
  ▼                                    ▼                                       │
Task 8 (Desktop Layer Panel — @dnd-kit)    Task 9 (Element Context Menu)          │
  │                                    │                                       │
  ▼                                    ▼                                       │
Task 10 (Desktop Property Panel) ──────────────────────────────────────────────┘
  │
  ▼
Task 11 (Desktop Element Editor Main View + Add Element Toolbar)
  │
  ▼
Task 12 (Mobile Element Editor: List + Dialog + MiniCanvas + BottomSheet)
  │
  ▼
Task 13 (i18n Namespace Implementation + Integration + Apollo Cache)
  │
  ▼
Task 14 (Accessibility Verification + Keyboard Navigation)
  │
  ▼
Task 15 (Knowledge Propagation)
  │
  ▼
Task 21 (Extended Zustand Element Store: Clipboard, Groups, History) ──┐
  │                                                                    │
  ▼                                                                    ▼
Task 16 (Element Properties Panel)    Task 17 (Alignment Guide Engine)  Task 18 (Element Context Menu)
  │                                    │                                │
  │                                    ▼                                │
  │                              Task 19 (Multi-Select Toolbar)         │
  │                                    │                                │
  ▼                                    ▼                                ▼
Task 20 (Element Library Palette) ──── Task 22 (Drag-and-Drop Palette → Canvas)
                                             │
                                             ▼
                                       Task 25 (Quality Loop Per File)
                                             │
                                             ▼
                                       Task 26 (Knowledge Propagation — New Components)
                                             │
                                           ▼
                                     Task 27 (Comprehensive Testing — Original)
```

---

## Execution Order

| # | Task | Depends On | Est. Hours |
|---|---|---|---|
| 1 | GraphQL Documents for Element CRUD | — | 2 |
| 2 | Zustand Element Editor Store | 1 | 2 |
| 3 | ViewModel Hook | 1, 2 | 3 |
| 4 | Utility Functions (Validation, Defaults, Labels) | 3 | 2 |
| 5 | Shared Input Controls (PositionSizeInputs, OpacitySlider, ColorPickerField, FontPicker) | 3, 4 | 4 |
| 6 | Common Properties Form | 3, 4, 5 | 2 |
| 7 | Type-Specific Property Forms + Dispatcher (7 components) | 3, 5, 6 | 5 |
| 8 | Desktop Layer Panel (@dnd-kit/sortable) | 3 | 3 |
| 9 | Desktop Element Context Menu | 3, 7 | 2 |
| 10 | Desktop Property Panel (Right Sidebar) | 5, 6, 7 | 3 |
| 11 | Desktop Element Editor Main View + Add Element Toolbar | 8, 9, 10 | 3 |
| 12 | Mobile Element Editor (List + Dialog + MiniCanvas + BottomSheet) | 5, 6, 7 | 4 |
| 13 | i18n Namespace Implementation + Integration + Apollo Cache | 1–12 | 4 |
| 14 | Accessibility Verification + Keyboard Navigation | 1–12 | 2 |
| 15 | Knowledge Propagation | 1–14 | 2 |
| 16 | Element Properties Panel (Right Sidebar) | 7, 14, 21 | 4 |
| 17 | Alignment Guide Engine | 11, 21 | 4 |
| 18 | Element Context Menu | 7, 21 | 3 |
| 19 | Multi-Select Toolbar + Selection Rectangle | 11, 21 | 3 |
| 20 | Element Library Palette (Left Sidebar) | 4, 21 | 4 |
| 21 | Extended Zustand Element Store (Clipboard, Groups, History) | 2 | 4 |
| 22 | Drag-and-Drop from Palette to Canvas | 11, 20, 21 | 2 |
| 25 | Quality Loop Per File | 16–22 | 3 |
| 26 | Knowledge Propagation (New Components) | 16–25 | 2 |
| 27 | Comprehensive Testing (Original) | 1–14 complete | 24 |

**Execution order**: T1 → T2 → T3, T21 (via parallel subagents) → T4, T8 (via parallel subagents) → T5 → T6 → T7 → T9, T10, T12 (via parallel subagents) → T11 → T13, T14 (via parallel subagents) → T15 → T16, T17, T18, T19, T20, T27 (via parallel subagents) → T22 → T25 → T26

---

## Parallel Subagent Strategy

Tasks grouped by wave (each wave runs as parallel subagents):

### Wave 1: T1
- Tasks: T1
- Rationale: No dependencies — single starting task

### Wave 2: T2
- Tasks: T2
- Rationale: Depends only on T1; no other task is ready

### Wave 3: T3, T21
- Tasks: T3, T21
- Rationale: T3 depends on T1+T2; T21 depends on T2 — both are ready after Wave 2 and have no interdependencies

### Wave 4: T4, T8
- Tasks: T4, T8
- Rationale: T4 depends on T3; T8 depends on T3 — both ready after Wave 3, independent of each other

### Wave 5: T5
- Tasks: T5
- Rationale: Depends on T3 + T4 — single task, no parallelization available

### Wave 6: T6
- Tasks: T6
- Rationale: Depends on T3 + T4 + T5 — single task

### Wave 7: T7
- Tasks: T7
- Rationale: Depends on T3 + T5 + T6 — single task

### Wave 8: T9, T10, T12
- Tasks: T9, T10, T12
- Rationale: T9 depends on T3 + T7; T10 depends on T5 + T6 + T7; T12 depends on T5 + T6 + T7 — all ready after Wave 7, no interdependencies

### Wave 9: T11
- Tasks: T11
- Rationale: Depends on T8 + T9 + T10 — single convergent task

### Wave 10: T13, T14
- Tasks: T13, T14
- Rationale: Both depend on Tasks 1–12 being complete — independent of each other, can run in parallel

### Wave 11: T15
- Tasks: T15
- Rationale: Knowledge propagation — depends on Tasks 1–14; final wave of the first phase

### Wave 12: T16, T17, T18, T19, T20, T27
- Tasks: T16, T17, T18, T19, T20, T27
- Rationale: T16 depends on T7 + T14 + T21; T17 depends on T11 + T21; T18 depends on T7 + T21; T19 depends on T11 + T21; T20 depends on T4 + T21; T27 depends on Tasks 1–14 complete — all ready after Wave 11, all independent

### Wave 13: T22
- Tasks: T22
- Rationale: Depends on T11 + T20 + T21 — single convergent task

### Wave 14: T25
- Tasks: T25
- Rationale: Quality loop depends on Tasks 16–22 — must wait for all prior waves

### Final Wave: Knowledge Propagation
- Task: T26
- Rationale: Must run after all other tasks complete (depends on Tasks 16–25)

> **Subagent dispatch**: Each task in a wave is dispatched as a separate subagent. The orchestrator waits for all subagents in a wave to complete before starting the next wave.

---

## Task 1 — GraphQL Documents for Element CRUD

**Goal**: Create the GraphQL document file with fragments and mutation documents for element CRUD operations.

**Files to Create:**
- `frontend/common/graphql/sharedDocuments/certificates/template-elements.documents.ts`
- Update `frontend/common/graphql/sharedDocuments/certificates/index.ts` (add re-export)

**Subtasks:**
1. Define `templateElementFragment` — base element fields + inline fragments for each type-specific sub-record (static_text, data_text, data_date, image, qr_code, shape)
2. Define `createTemplateElementMutationDocument` — mutation with input `{ templateId, type, x, y, width, height, expectedTemplateVersion }` returning the fragment
3. Define `updateTemplateElementMutationDocument` — mutation with input `{ id, input: ElementUpdateInput, expectedTemplateVersion }` returning the fragment
4. Define `deleteTemplateElementMutationDocument` — mutation with input `{ id, expectedTemplateVersion }` returning boolean
5. Define `duplicateTemplateElementMutationDocument` — mutation with input `{ id, expectedTemplateVersion }` returning the fragment
6. Define `reorderTemplateElementsMutationDocument` — mutation with input `{ templateId, items: [{ id, zIndex }], expectedTemplateVersion }` returning boolean
7. Define `setElementVisibilityMutationDocument` — mutation with input `{ id, isVisible, expectedTemplateVersion }` returning boolean
8. Define `setElementLockMutationDocument` — mutation with input `{ id, isLocked, expectedTemplateVersion }` returning boolean
9. Define `copyTemplateElementsMutationDocument` — mutation with input `{ templateId, elementIds: [ID], expectedTemplateVersion }` returning fragments (for clipboard paste between templates)
10. Run `bun run generate:gqlSchema && bun codegen` to generate TypeScript types

**Requirements References**: REQ-12.16, REQ-12.1 through REQ-12.5

**Instruction Verification:**
- Read: `frontend/common/graphql/AGENTS.md`, `frontend/common/graphql/sharedDocuments/AGENTS.md`
- All documents must include `id` field on every object type
- Import from `"@apollo/client"` (never `/core`); types from generated `gql/graphql-types.ts`
- Naming convention: `<entityName>QueryDocument` / `<entityName>MutationDocument`

**Quality Loop:**
- tsgo (type check passes with generated types)
- biome:check (formatting clean)
- lint via queue client on the new file

---

## Task 2 — Zustand Element Editor Store

**Goal**: Create the Zustand store managing element editor UI state, draft properties, clipboard, validation, and dialogue flags. This store ONLY manages UI state — `selectedIds`, `elements[]`, and `interactionState` are owned by Plan 11's canvas store (design.md DD: selection consolidation). This store reads selection via selector.

**Files to Create:**
- `frontend/common/stores/certificates/templateElementEditorStore.ts`

**Subtasks:**
1. Define `ElementDraftProperties` discriminated union by element type (matching `ElementWithDetails` from design.md §4.1 — includes all common + type-specific fields as optional editable values)
2. Define store interface with all state fields from design.md §4.3:
   - `draftProperties: ElementDraftProperties | null` (the element currently being edited in the property panel)
   - `isDirty: boolean` (draft differs from saved element)
   - `validationErrors: Record<string, string>` (field-path → i18n error key)
   - `isSaving: boolean` (mutation in flight)
   - `panelExpandedSections: Record<string, boolean>` (accordion section collapse state: position/text/appearance/advanced)
   - `layerPanelCollapsed: boolean`
   - `propertyPanelCollapsed: boolean`
   - `addElementMenuOpen: boolean`
   - `deleteDialogOpen: boolean`
   `unsavedChangesDialogOpen: boolean`
   `pendingAction: (() => void) | null` (action to run after unsaved-changes dialog resolves)
   `clipboard: { elementIds: string[] } | null` (for copy/paste between elements)
   `multiSelectIds: string[]` (when multiple elements selected — batch actions)
3. Implement setters for all state fields (following `createRecurringClassStore.ts` pattern)
4. Implement `loadElementProperties(element: ElementWithDetails)` — sets `draftProperties` from element, `isDirty = false`, clears `validationErrors`
5. Implement `updateDraftField<T extends keyof ElementDraftProperties>(field: T, value: ElementDraftProperties[T])` — updates draft, sets `isDirty = true`, clears that field's validation error
6. Implement `resetState()` that clears all state (called when template ID changes)
7. Implement `discardChanges(element: ElementWithDetails)` — resets draftProperties to element values, sets `isDirty = false`, clears `validationErrors`
8. Use `import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types"` for element type types
9. No `persist` middleware (session-only state)

**Requirements References**: REQ-12.18

**Instruction Verification:**
- Read: `frontend/common/stores/AGENTS.md`, `frontend/AGENTS.md`
- Read: `frontend/common/stores/createRecurringClassStore.ts` (reference for complex form store pattern)
- Strict typing with GraphQL generated types from `graphql-types.ts` (NOT `operations.ts`)
- All mutable UI state in Zustand
- No `useMediaQuery` / `useViewport` in stores
- `ElementDraftProperties` is a discriminated union — each variant has `type` as discriminant field

**Quality Loop:**
- tsgo + biome:check + lint via queue client

---

## Task 3 — ViewModel Hook

**Goal**: Create the ViewModel hook that provides element CRUD operations, validation callbacks, clipboard operations, z-order actions, visibility/lock toggles, and i18n labels to the property panel and layer panel. This ViewModel reads selection from Plan 11's canvas store via selector — does NOT own `selectedIds` or `elements[]`.

> **Parallelizable**: This task runs as a subagent in Wave 3 alongside T21.

**Files to Create:**
- `frontend/common/views/dashboard/certificates/template-editor/elements/useTemplateElementEditorViewModel.ts`
- `frontend/common/views/dashboard/certificates/template-editor/elements/types/elementEditor.types.ts`

**Subtasks:**
1. Define `ElementEditorViewModel` interface (all returned fields and callbacks from design.md §4.2)
2. Define `ElementWithDetails` discriminated union type (by element type) in `types/elementEditor.types.ts` — matching design.md §4.1
3. Define `VariableOption` type for dropdown population (id, name, type, previewValue)
4. Define `ValidationRule` type for validation rule constants
5. Implement `useTemplateElementEditorViewModel(templateId, templateDimensions)` hook:
   - Load template variables via `useQuery` (for data element dropdowns)
   - Read `elements[]` and `selectedIds[]` from Plan 11's canvas store via `useCanvasStore` selector (NOT a duplicate copy)
   - Wire `useMutation` for create/update/delete/duplicate/reorder/setVisibility/setLock operations
   - Implement Apollo cache update functions for each mutation (optimistic updates per DD-5)
   - Wire Zustand store actions to VM callbacks
   - Use `useAppTranslation(Translation.Dashboard.CertificateTemplateElements)` for i18n labels — takes a NamespaceHandle object, NOT a string
   - Implement `onCloseElement` with unsaved-changes check (sets `unsavedChangesDialogOpen` if dirty)
   - Implement `onSaveElement` — validate → mutate → clear dirty or show validation errors (see design.md §6 validation flow)
   - Implement `onCopyElements(elementIds)` — saves elementIds to store clipboard
   - Implement `onPasteElements()` — calls copyTemplateElementsMutation with clipboard contents
   - Implement `onToggleVisibility(elementId)` — calls setElementVisibilityMutation
   - Implement `onToggleLock(elementId)` — calls setElementLockMutation
   - Implement `onBatchReorder(items)` — calls reorderTemplateElementsMutation, z-index renormalized to dense 0..N
   - Implement `onZOrderAction(id, action)` — brings forward / sends backward / brings to front / sends to back (calls reorder with computed z-index array)
6. Export a flat view-model object (no nesting), same interface for both tiers
7. File upload object for images kept in `useRef` in ViewModel (NOT in Zustand — not serializable)

**Requirements References**: REQ-12.1 through REQ-12.5, REQ-12.13, REQ-12.16, REQ-12.18, REQ-12.22, REQ-12.23

**Instruction Verification:**
- Read: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `frontend/common/graphql/AGENTS.md`
- Read: `shared/AGENTS.md` (i18n NamespaceHandle pattern)
- No `useMediaQuery` / `useViewport` in ViewModel
- `useRouter` and permission checks live here (not in tier views)
- Import hooks from `"@apollo/client/react"` (never `"@apollo/client"`)
- No `useLazyQuery` — use stateful `useQuery` exclusively
- `fetchPolicy: "cache-and-network"` for element queries
- `expectedTemplateVersion` included in all mutation inputs (optimistic locking)
- Permission `certificates.templates.manage` checked and exposed as `canEdit` boolean in VM

**Quality Loop:**
- tsgo + biome:check + lint via queue client on both files

---

## Task 4 — Utility Functions (Validation, Defaults, Labels)

**Goal**: Create the pure utility functions for element validation, default property generation, and label derivation.

> **Parallelizable**: This task runs as a subagent in Wave 4 alongside T8.

**Files to Create:**
- `frontend/common/views/dashboard/certificates/template-editor/elements/utils/validateElement.ts`
- `frontend/common/views/dashboard/certificates/template-editor/elements/utils/elementValidationRules.ts`
- `frontend/common/views/dashboard/certificates/template-editor/elements/utils/elementDefaults.ts`
- `frontend/common/views/dashboard/certificates/template-editor/elements/utils/elementLabels.ts`

**Subtasks:**

**4a — elementValidationRules.ts:**
1. Export constant arrays defining validation rules per field: field name, validator function, error i18n key
2. Common rules: x (min 0, max templateWidth), y (min 0, max templateHeight), width (min 1, max templateWidth), height (min 1, max templateHeight), rotation (0–360), opacity (0–100)
3. Type-specific rules per design.md §6 validation pipeline:
   - `static_text`: textContent (required, max 1000 chars), fontSize (1–200), lineHeight (0.5–3.0)
   - `data_text`: variableId (required, must exist in templateVariables with type text/number), fontSize (1–200)
   - `data_date`: variableId (required, must exist with type date), customFormat (required when dateFormat = "custom")
   - `image`: imageUrl (required, max 500 chars), borderRadius (0–100)
   - `qr_code`: qrCustomText (required when dataSource = "custom_text"), qrSize (32–512), qrMargin (0–50)
   - `shape`: borderWidth (0–20), cornerRadius (0–100)

**4b — validateElement.ts:**
1. Create `validateElement(draft: ElementDraftProperties, templateDimensions: { width: number, height: number }, templateVariables: VariableOption[]): Record<string, string>`
2. Pipeline: strip whitespace → type-cast numeric → validate common properties → dispatch to type-specific validation
3. Return `Record<string, string>` of field-path → error-message-key (i18n keys, NO hardcoded strings)
4. Validation functions must be pure (no side effects, no React hooks)

**4c — elementDefaults.ts:**
1. Export `getDefaultElementProperties(type: ElementType, templateDimensions): ElementDraftProperties`
2. Default values per element type from design.md §6D Default Dimensions table:
   - static_text: { x: center, y: center, width: 200, height: 40, rotation: 0, opacity: 100, textContent: "", fontFamily: "Inter", fontSize: 16, fontWeight: "normal", textColor: "#000000", textAlign: "left", lineHeight: 1.5 }
   - data_text: { ...same as text but textContent omitted, variableId: null, textTransform: "none" }
   - data_date: { ..., dateFormat: "iso", customFormat: "", locale: "ar" }
   - image: { width: 150, height: 150, imageUrl: "", altText: "", fitMode: "contain", borderRadius: 0 }
   - qr_code: { width: 100, height: 100, qrDataSource: "verification_url", qrCustomText: "", qrSize: 100, qrErrorCorrection: "medium", qrMargin: 0 }
   - shape: { width: 100, height: 100, shapeType: "rectangle", fillColor: "#cccccc", strokeColor: "#000000", strokeWidth: 0, strokeStyle: "solid", cornerRadius: 0 }

**4d — elementLabels.ts:**
1. Export `getElementLabel(element: ElementWithDetails, labels: Record<string, string>): string`
2. Returns: first 30 chars of textContent for text elements, variableId display name for data elements, type label for shape/qr/image

**Requirements References**: REQ-12.17

**Instruction Verification:**
- Read: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
- Validation functions are pure (no side effects, no React hooks)
- All error keys match those defined in design.md §11 i18n catalog and requirements.md i18n section
- Template dimensions come from Plan 10's template query (passed as parameter)
- Rotation range is 0–360 (NOT -360..360)

**Quality Loop:**
- tsgo + biome:check + lint via queue client on all 4 files
- Run per-file verification loop BEFORE importing these utilities elsewhere

---

## Task 5 — Shared Input Controls (PositionSizeInputs, OpacitySlider, ColorPickerField, FontPicker)

**Goal**: Create the reusable input control components used by multiple property forms. These are shared between desktop and mobile and must be self-contained.

**Files to Create:**
- `frontend/common/views/dashboard/certificates/template-editor/elements/components/PositionSizeInputs.tsx`
- `frontend/common/views/dashboard/certificates/template-editor/elements/components/OpacitySlider.tsx`
- `frontend/common/views/dashboard/certificates/template-editor/elements/components/ColorPickerField.tsx`
- `frontend/common/views/dashboard/certificates/template-editor/elements/components/FontPicker.tsx`

**Subtasks:**

**5a — PositionSizeInputs:**
1. Renders 5 numeric `TextField` components: X, Y, Width, Height, Rotation (all in a responsive grid)
2. Each field has `type="number"`, validation helper text (from `validationErrors` prop), and `onChange` callback
3. Rotation field shows degree symbol suffix (°)
4. X/Y validated against template dimensions; Width/Height validated min 1; Rotation validated 0–360
5. Prop interface per design.md §4.5: `value: { x, y, width, height, rotation }`, `onChange`, `validationErrors`, `labels`

**5b — OpacitySlider:**
1. MUI `Slider` from 0–100 with label and value display
2. `valueLabelDisplay="auto"` with `%` suffix
3. Prop interface: `value: number`, `onChange: (value: number) => void`, `label: string`

**5c — ColorPickerField (design.md §4.5 + react-color node research):**
1. MUI `TextField` displaying hex color value (e.g. `"#ff0000"`) with a color swatch `IconButton` beside it
2. On swatch click, opens MUI `Popover` containing `ChromePicker` from `react-color`
3. `ChromePicker` configured with `disableAlpha={true}` (no alpha channel — opacity handled separately)
4. `ChromePicker` width defaults to 225px (do NOT override width)
5. On color change (`ColorResult.hex`), update the `TextField` value and call `onChange(hex)`
6. The hex `TextField` is also editable manually — validates hex format with regex `/^#[0-9a-fA-F]{6}$/`
7. Typing an invalid hex shows error helper text and does NOT call `onChange`
8. Popover closes on click-away (clicking outside popover) or Escape key
9. Import: `import { ChromePicker } from "react-color"` and `import type { ColorResult } from "react-color"`
10. Prop interface: `value: string` (hex), `onChange: (hex: string) => void`, `label: string`, `disabled?: boolean`
11. A11y: swatch `IconButton` has `aria-label` from i18n; `Popover` has `role="dialog"`

**5d — FontPicker:**
1. MUI `Autocomplete` with `options` from `ALLOWED_FONTS` constant (array of font family names)
2. `freeSolo={false}` — restricted to allowed fonts only
3. `renderInput` renders a `TextField` with the font name
4. Preview: each option renders in its own font family (use `sx={{ fontFamily: option }}` on the `MenuItem`)
5. Prop interface: `value: string`, `onChange: (fontFamily: string) => void`, `label: string`
6. `ALLOWED_FONTS` constant imported from `shared/constants/certificates/`

**Requirements References**: REQ-12.6, REQ-12.19 (color picker), REQ-12.20 (font picker)

**Instruction Verification:**
- Read: `frontend/AGENTS.md` (MUI v9 compliance)
- Read: node_research/react-color.md (ChromePicker API, ColorResult, MUI Popover wrapping pattern)
- `sx` prop for styling (no layout props like `mb`, `mt`)
- `*Outlined` icon naming (not `*Outline`)
- No hardcoded colors — swatch background uses the hex value from props
- Typography variants: `labelMd`, `bodyMd`
- Use `FormErrorSnackbar` from shared UI for error display (not custom)

**Quality Loop:**
- tsgo + biome:check + lint via queue client on all 4 files
- Run per-file verification loop on EACH component BEFORE importing into forms (Task 6/7)
- Verify `react-color` and `@types/react-color` are in `package.json` dependencies (install if missing)

---


## Task 6 — Common Properties Form

**Goal**: Create the common properties form component that uses PositionSizeInputs + OpacitySlider. Shared between desktop panel and mobile dialog.

**Files to Create:**
- `frontend/common/views/dashboard/certificates/template-editor/elements/components/CommonPropertiesForm.tsx`

**Subtasks:**
1. Render `PositionSizeInputs` (from Task 5) with values from `draft` common props
2. Render `OpacitySlider` (from Task 5) with value from `draft.opacity`
3. Render z-index as read-only `Typography` (display only — not editable)
4. All `onChange` callbacks route through `onFieldChange(field, value)` prop
5. Validation errors for common fields displayed as helper text under each input
6. Labels from i18n: `properties.x`, `properties.y`, `properties.width`, `properties.height`, `properties.rotation`, `properties.opacity`, `properties.zIndex`
7. MUI v9 compliance: `sx` prop for all layout; no hardcoded colors; Typography variants

**Requirements References**: REQ-12.6

**Instruction Verification:**
- Read: `frontend/AGENTS.md` (MUI v9, sx prop, Typography variants)
- Z-index is read-only display, not an editable input
- Rotation range 0–360

**Quality Loop:**
- tsgo + biome:check + lint via queue client
- Per-file verification loop BEFORE importing into desktop panel (Task 10) or mobile dialog (Task 12)

---

## Task 7 — Type-Specific Property Forms + Dispatcher (7 components)

**Goal**: Create 6 type-specific property form components + the dispatcher that renders the correct form based on element type.

**Files to Create:**
- `frontend/common/views/dashboard/certificates/template-editor/elements/components/StaticTextPropertiesForm.tsx`
- `frontend/common/views/dashboard/certificates/template-editor/elements/components/DataTextPropertiesForm.tsx`
- `frontend/common/views/dashboard/certificates/template-editor/elements/components/DataDatePropertiesForm.tsx`
- `frontend/common/views/dashboard/certificates/template-editor/elements/components/ImagePropertiesForm.tsx`
- `frontend/common/views/dashboard/certificates/template-editor/elements/components/QrCodePropertiesForm.tsx`
- `frontend/common/views/dashboard/certificates/template-editor/elements/components/ShapePropertiesForm.tsx`
- `frontend/common/views/dashboard/certificates/template-editor/elements/components/TypeSpecificFormDispatcher.tsx`
- `frontend/common/views/dashboard/certificates/template-editor/elements/components/VariablePlaceholderPreview.tsx`

**Subtasks:**

**7a — StaticTextPropertiesForm:**
1. Text content: multiline `TextField` (rows=3), validated for non-empty, max 1000 chars
2. Font family: `FontPicker` (from Task 5) populated from `ALLOWED_FONTS`
3. Font size: `TextField` type="number", range 1–200
4. Font weight: `Select` dropdown (normal/medium/bold) with translated labels from `fontWeights.*`
5. Text color: `ColorPickerField` (from Task 5)
6. Text alignment: `ToggleButtonGroup` (left/center/right) with `FormatAlignLeftOutlined`, `FormatAlignCenterOutlined`, `FormatAlignRightOutlined` icons
7. Line height: `TextField` type="number", range 0.5–3.0, step 0.1
8. All labels from i18n: `properties.textContent`, `properties.fontFamily`, `properties.fontSize`, `properties.fontWeight`, `properties.textColor`, `properties.textAlign`, `properties.lineHeight`

**7b — DataTextPropertiesForm:**
1. Variable reference: `Select` dropdown populated from `variables` prop (filtered to text/number types)
2. Font family, font size, text color, text alignment (same as StaticText using FontPicker + ColorPickerField)
3. Text transform: `Select` dropdown (none/uppercase/lowercase) with labels from `textTransforms.*`
4. Empty state when no variables: disabled `Select` with placeholder message (`emptyState.noVariables`)
5. `VariablePlaceholderPreview` shows preview value of selected variable (read-only)

**7c — DataDatePropertiesForm:**
1. Variable reference: `Select` dropdown filtered to date-type variables only
2. Date format: `Select` dropdown (iso, arabicFullMonth, numeric, custom) with translated labels
3. Custom format: `TextField` shown only when `dateFormat = "custom"` — required when visible
4. Locale: `Select` dropdown (ar, en)
5. Font family, font size, text color (same as StaticText)
6. `VariablePlaceholderPreview` shows formatted date preview

**7d — ImagePropertiesForm:**
1. Image URL: `TextField` + "Browse" `Button` that opens file picker (calls `onBrowseImage` callback prop from ViewModel — ViewModel handles the storage picker via Plan 7)
2. Alt text: `TextField`, max 200 chars
3. Fit mode: `Select` dropdown (contain/cover/fill) with labels from `fitModes.*`
4. Border radius: `TextField` type="number", range 0–100
5. File upload: drag-and-drop zone above the URL field — accepts image MIME types only; on drop calls `onImageDrop(file)` — file object kept in ViewModel `useRef` (NOT in Zustand — not serializable)

**7e — QrCodePropertiesForm:**
1. Data source: `Select` dropdown (verification_url / custom_text) with translated labels
2. Custom text: `TextField` shown only when `qrDataSource = "custom_text"` — required when visible
3. Size: `TextField` type="number", range 32–512
4. Error correction: `Select` dropdown with descriptive labels from `qrErrorCorrection.*` (low/medium/quartile/high with percentage descriptions)
5. Margin: `TextField` type="number", range 0–50

**7f — ShapePropertiesForm:**
1. Shape type: `Select` dropdown (rectangle/circle/line) with labels from `shapeTypes.*`
2. Fill color: `ColorPickerField` (disabled when shape type = "line")
3. Stroke color: `ColorPickerField`
4. Stroke width: `TextField` type="number", range 0–20
5. Stroke style: `Select` dropdown (solid/dashed/dotted/none)
6. Corner radius: `TextField` type="number", range 0–100 (disabled when shape type = "circle" or "line")

**7g — TypeSpecificFormDispatcher:**
1. Switch on `element.type` enum value
2. Render the corresponding form component, passing `element`, `draft`, `onChange`, `errors`, `labels`, `variables` props
3. Unknown type fallback: show `errors.unsupportedElementType` message (i18n key)

**7h — VariablePlaceholderPreview:**
1. Read-only `Typography` showing the variable's `previewValue` when a data element's `variableId` is set
2. Shows `emptyState.noPreviewAvailable` when `previewValue` is null
3. Styled as a subtle info box with `InfoOutlined` icon

**Requirements References**: REQ-12.7 through REQ-12.12, REQ-12.13

**Instruction Verification:**
- Read: `frontend/AGENTS.md` (MUI v9, icons, colors, typography variants)
- `sx` prop for all styling (no layout props)
- `*Outlined` icon naming (not `*Outline`)
- No hardcoded strings — all labels via i18n keys from `dashboard.certificateTemplateElements` namespace
- `ColorPickerField` outputs hex string format
- `ToggleButtonGroup` for alignment (not `ButtonGroup`)
- `Select` components use `MenuItem` children with translated labels
- `FontPicker` populated from `ALLOWED_FONTS` constant (not hardcoded)
- Image file objects in ViewModel `useRef`, NOT Zustand store (not serializable)

**Quality Loop:**
- tsgo + biome:check + lint via queue client on each file (run in parallel for all 8 files)
- Run per-file verification loop on each form component BEFORE importing into the dispatcher
- Run per-file verification loop on the dispatcher BEFORE importing into desktop/mobile panels

---

## Task 8 — Desktop Layer Panel (@dnd-kit/sortable)

**Goal**: Create the desktop layer panel (left sidebar) showing all elements sorted by z-index descending with visibility/lock toggles and drag-to-reorder using @dnd-kit/sortable.

> **Parallelizable**: This task runs as a subagent in Wave 4 alongside T4.

**Files to Create:**
- `frontend/desktop/views/dashboard/certificates/template-editor/elements/layerPanel/LayerPanelSection.desktop.tsx`
- `frontend/desktop/views/dashboard/certificates/template-editor/elements/layerPanel/LayerPanelItem.desktop.tsx`
- `frontend/desktop/views/dashboard/certificates/template-editor/elements/layerPanel/LayerPanelHeader.desktop.tsx`

**Subtasks:**

**8a — LayerPanelHeader:**
1. "Layers" label (i18n key `layerPanel.header`) + collapse toggle `IconButton` (expand/collapse icon)
2. Element count badge showing total elements

**8b — LayerPanelSection (design.md §6A):**
1. Wrap content in `DndContext` with `sensors` (PointerSensor distance:8 + KeyboardSensor with `sortableKeyboardCoordinates`) and `collisionDetection={closestCenter}`
2. Inside `DndContext`, render `SortableContext` with `verticalListSortingStrategy` containing all `LayerPanelItem` components
3. `onDragEnd` handler: compute new order via `arrayMove`, call `onBatchReorder(items)` with renormalized z-index 0..N
4. `DragOverlay`: render a ghost copy of the dragged layer item (NOT the original — original gets opacity:0.4 during drag)
5. Sort elements by z-index descending (top layer first)
6. Collapsed state: section width shrinks to icon-only mode (toggle via `layerPanelCollapsed` in store)
7. Empty state: centered text `emptyState.noElements` (i18n key) with `AddOutlined` icon

**8c — LayerPanelItem (design.md §6A Layer Panel Item Anatomy):**
1. Use `useSortable({ id: element.id })` hook — returns `{ attributes, listeners, setNodeRef, transform, transition, isDragging }`
2. Apply `transform` and `transition` via `CSS.Transform.toString(transform)` (import from `@dnd-kit/utilities`)
3. Row contents (left to right):
   - Drag handle icon (`DragIndicatorOutlined`) with `{...listeners}` and `{...attributes}`
   - Element type icon: TextFieldsOutlined, DataObjectOutlined, CalendarMonthOutlined, ImageOutlined, QrCode2Outlined, CropDinOutlined (varies by type)
   - Element label (`Typography` variant `bodyMd`): derived via `getElementLabel()` utility (first 30 chars of text or type label)
   - Visibility `IconButton`: `VisibilityOutlined` when visible, `VisibilityOffOutlined` when hidden (calls `onToggleVisibility`)
   - Lock `IconButton`: `LockOutlined` when locked, `LockOpenOutlined` when unlocked (calls `onToggleLock`)
4. Selected state: row highlighted with `sx={{ backgroundColor: theme.palette.action.selected }}` (theme palette, not hardcoded)
5. Click row (not on icon buttons): calls `onSelectElement(id)` (delegates to canvas store selection)
6. Multi-select: `Ctrl+Click` adds to selection (canvas store handles multi-select)
7. `isDragging` state: set opacity to 0.4 on the original node during drag (DragOverlay shows ghost)

**Requirements References**: REQ-12.14

**Instruction Verification:**
- Read: `frontend/AGENTS.md` (mobile/desktop isolation — `.desktop.tsx`), `frontend/views/AGENTS.md`
- Read: node_research/dnd-kit.md (@dnd-kit/sortable v10.0.0 + @dnd-kit/core v6.3.0 API)
- Read: Plan 11 design.md (canvas store owns selectedIds — layer panel calls canvas store's select action)
- NO `useMediaQuery` / `useViewport` imports (ESLint enforced in `.desktop.tsx`)
- NO cross-imports between `.mobile.tsx` and `.desktop.tsx`
- Icons: `*Outlined` not `*Outline`
- Colors from theme palette only (no hardcoded colors)
- Z-index renormalized to dense 0..N in `onDragEnd` (not sparse)
- Import: `import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core"`
- Import: `import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable"`
- Import: `import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"`
- Import: `import { CSS } from "@dnd-kit/utilities"`

**Quality Loop:**
- tsgo + biome:check + lint via queue client on all 3 files
- Run per-file verification loop on LayerPanelItem BEFORE importing into LayerPanelSection
- Run per-file verification loop on LayerPanelSection BEFORE importing into desktop main view (Task 11)
- Verify `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` are in `package.json` dependencies

---

## Task 9 — Desktop Element Context Menu

**Goal**: Create the desktop right-click context menu for selected elements on the canvas.

> **Parallelizable**: This task runs as a subagent in Wave 8 alongside T10 and T12.

**Files to Create:**
- `frontend/desktop/views/dashboard/certificates/template-editor/elements/ElementContextMenu.desktop.tsx`

**Subtasks:**
1. Render on right-click of a selected element on the canvas (wired via Plan 11's canvas — this component receives `open`, `anchorPosition`, `selectedIds`, and callbacks via props)
2. Menu items (with icons), all from i18n keys:
   - `actions.bringForward` (ArrowUpwardOutlined) → `onZOrderAction(id, "forward")`
   - `actions.sendBackward` (ArrowDownwardOutlined) → `onZOrderAction(id, "backward")`
   - `actions.bringToFront` (ArrowUpwardOutlined) → `onZOrderAction(id, "front")`
   - `actions.sendToBack` (ArrowDownwardOutlined) → `onZOrderAction(id, "back")`
   - Divider
   - `actions.duplicate` (ContentCopyOutlined) → `onDuplicateElement(id)`
   - `actions.copy` (ContentCopyOutlined) → `onCopyElements([id])`
   - `actions.paste` (ContentPasteOutlined) → `onPasteElements()` (disabled when clipboard empty)
   - Divider
   - `actions.delete` (DeleteOutlined) → open delete confirmation dialog
3. Delete item uses error color: `sx={{ color: theme.palette.error.main }}`
4. All items disabled when `canEdit` is false (no `certificates.templates.manage` permission)
5. Menu closes after any action is selected
6. Multi-select: when multiple elements are selected, show "N elements" in duplicate/delete labels

**Requirements References**: REQ-12.22, REQ-12.3, REQ-12.4, REQ-12.5

**Instruction Verification:**
- Read: `frontend/AGENTS.md` (desktop file, MUI v9, icons)
- Read: `frontend/views/AGENTS.md`
- All menu items translated — no hardcoded strings
- Permission check: `certificates.templates.manage` — UI hides action items when user lacks permission
- No `useMediaQuery` / `useViewport`
- Icons: `*Outlined` not `*Outline`
- Error color from theme palette: `theme.palette.error.main`

**Quality Loop:**
- tsgo + biome:check + lint via queue client
- Per-file verification loop BEFORE importing into desktop main view (Task 11)

---

## Task 10 — Desktop Property Panel (Right Sidebar)

**Goal**: Create the desktop right sidebar property panel that shows the selected element's properties in collapsible accordion sections.

> **Parallelizable**: This task runs as a subagent in Wave 8 alongside T9 and T12.

**Files to Create:**
- `frontend/desktop/views/dashboard/certificates/template-editor/elements/propertyPanel/PropertyPanelSection.desktop.tsx`
- `frontend/desktop/views/dashboard/certificates/template-editor/elements/propertyPanel/PropertyPanelHeader.desktop.tsx`
- `frontend/desktop/views/dashboard/certificates/template-editor/elements/propertyPanel/PropertyPanelEmptyState.desktop.tsx`
- `frontend/desktop/views/dashboard/certificates/template-editor/elements/propertyPanel/MultiSelectBadge.desktop.tsx`

**Subtasks:**

**10a — PropertyPanelEmptyState (design.md §6B Property Panel States):**
1. Centered `Stack` with `MouseOutlined` icon
2. Message: `emptyState.selectElementToEdit` (i18n key)
3. Subtle styling: muted typography color from theme

**10b — PropertyPanelHeader:**
1. Element type label (translated via `elementTypes.*`) + type icon
2. Save `Button` (primary, `SaveOutlined`) — calls `onSaveElement()`, disabled when `!isDirty` or `isSaving`
3. Delete `Button` (error variant, `DeleteOutlined`) — opens delete confirmation dialog, disabled when `!canEdit`
4. When `isDirty`: show "Discard" `Button` (text variant) — calls `onDiscardChanges()`
5. When `isSaving`: show `CircularProgress` in Save button

**10c — MultiSelectBadge (design.md §6B Multi-Select State):**
1. Shows when `multiSelectIds.length > 1`
2. Message: `multiSelect.elementsSelected(count)` (i18n interpolation function)
3. Batch actions: Delete All, Align (left/center/right/top/middle/bottom), Distribute (horizontal/vertical)
4. Batch actions disabled when `!canEdit`

**10d — PropertyPanelSection (design.md §6B Desktop Property Panel Layout):**
1. Right sidebar container — renders header + accordion sections + form dispatcher
2. States:
   - **No selection**: render `PropertyPanelEmptyState`
   - **Single selection**: render header + CommonPropertiesForm + TypeSpecificFormDispatcher
   - **Multi-selection**: render `MultiSelectBadge` with batch actions
   - **Locked element**: render read-only forms (all inputs disabled, show lock message)
   - **No permission**: render empty state with `emptyState.noPermission` message
3. Collapsible accordion sections (using MUI `Accordion` with `AccordionSummary` + `AccordionDetails`):
   - Section: `sections.position` — contains `CommonPropertiesForm` (X/Y/W/H/rotation/opacity/zIndex)
   - Section: `sections.text` (or type-specific name) — contains `TypeSpecificFormDispatcher`
   - Section: `sections.appearance` — contains opacity, visibility toggle (when applicable)
   - Section: `sections.advanced` — contains lock toggle, element ID display (read-only)
4. Section title varies by element type (design.md §6B Section Title Variations):
   - text types: `sections.text`
   - image: `sections.image`
   - qr: `sections.qrCode`
   - shape: `sections.shape`
5. Section collapse state persisted in store `panelExpandedSections` map
6. Re-render throttling (design.md §6B Re-render Throttling): debounce position updates (50ms) before writing to canvas store; type-specific fields write to draftProperties immediately

**Requirements References**: REQ-12.6, REQ-12.13, REQ-12.23

**Instruction Verification:**
- Read: `frontend/AGENTS.md` (MUI v9 — `Accordion`, `AccordionSummary` expand icon naming `ExpandMoreOutlined`, `sx` prop)
- Read: `frontend/views/AGENTS.md`
- Collapsible accordion sections use MUI `Accordion` (not custom)
- `sx` prop for all layout/spacing (no `mb`, `mt`, `p` style props)
- No hardcoded colors — theme palette only
- Icons: `*Outlined` not `*Outline`
- No `useMediaQuery` / `useViewport` (ESLint enforced in `.desktop.tsx`)
- `multiSelect.elementsSelected` uses interpolation function `(count: number) => string`

**Quality Loop:**
- tsgo + biome:check + lint via queue client on all 4 files
- Run per-file verification loop on empty state + header + badge BEFORE importing into PropertyPanelSection
- Run per-file verification loop on PropertyPanelSection BEFORE importing into desktop main view (Task 11)

---

## Task 11 — Desktop Element Editor Main View + Add Element Toolbar

**Goal**: Create the main desktop element editor view that composites layer panel + canvas + property panel, plus the add element toolbar.

**Files to Create:**
- `frontend/desktop/views/dashboard/certificates/template-editor/elements/elementEditor.desktop.tsx`
- `frontend/desktop/views/dashboard/certificates/template-editor/elements/AddElementToolbar.desktop.tsx`

**Subtasks:**

**11a — AddElementToolbar (design.md §6D Element Creation Flow):**
1. Render `Button` with `actions.addElement` label and `AddOutlined` icon
2. On click, open MUI `Menu` with 6 `MenuItem`s (one per element type, with translated type label + type icon):
   - `elementTypes.staticText` + `TextFieldsOutlined`
   - `elementTypes.dataText` + `DataObjectOutlined`
   - `elementTypes.dataDate` + `CalendarMonthOutlined`
   - `elementTypes.image` + `ImageOutlined`
   - `elementTypes.qrCode` + `QrCode2Outlined`
   - `elementTypes.shape` + `CropDinOutlined`
3. On menu item select, call `onCreateElement(elementType)` — ViewModel creates element with default properties at canvas center
4. Menu closes after selection
5. Button disabled when `!canEdit` (no `certificates.templates.manage` permission)

**11b — elementEditor.desktop.tsx (design.md §6B Three-Pane Desktop Layout):**
1. Three-pane layout: layer panel (left sidebar) + canvas (center) + property panel (right sidebar)
2. Layer panel: renders `LayerPanelSection` (from Task 8) — width 240px expanded, 56px collapsed
3. Canvas: renders Plan 11's canvas component (already exists) — center pane, flex: 1
4. Property panel: renders `PropertyPanelSection` (from Task 10) — width 320px
5. Add element toolbar: rendered as an `AppBar` or `Toolbar` above the three-pane layout
6. Element context menu: rendered at anchor position when context menu open (from Task 9)
7. Delete confirmation `Dialog` — message `dialogs.deleteMessage(elementType)` (i18n interpolation), `DialogActions` with Cancel + Delete (error variant)
8. Unsaved changes `Dialog` — message `dialogs.unsavedChanges`, actions: `dialogs.discard` (text) + `dialogs.cancel` (text) + `dialogs.save` (primary)
9. Keyboard shortcuts (design.md §6E Keyboard Shortcuts):
   - Ctrl+D → duplicate selected
   - Delete/Backspace → delete selected (with confirmation)
   - Ctrl+C → copy selected
   - Ctrl+V → paste from clipboard
   - Ctrl+] → bring forward
   - Ctrl+[ → send backward
   - Ctrl+Shift+] → bring to front
   - Ctrl+Shift+[ → send to back
   - Escape → deselect / close context menu
   - Ctrl+Z → undo (Plan 11 canvas store)
   - Ctrl+Shift+Z / Ctrl+Y → redo (Plan 11 canvas store)
10. Receives ViewModel via props (pure presentation — no direct API calls)

**Requirements References**: REQ-12.1, REQ-12.2, REQ-12.3, REQ-12.4, REQ-12.5, REQ-12.14

**Instruction Verification:**
- Read: `frontend/AGENTS.md`, `frontend/views/AGENTS.md`
- `.desktop.tsx` file — no `useMediaQuery` / `useViewport`
- No cross-imports from `.mobile.tsx` files
- `sx` prop for all layout (no style props)
- Icons: `*Outlined` not `*Outline`
- `dialogs.deleteMessage` uses interpolation function `(elementType: string) => string`
- Delete dialog confirmed before calling `onDeleteElement`
- Keyboard shortcuts only active when desktop editor has focus (not when typing in form fields)
- Permission: `canEdit` gates toolbar button, context menu, and Save/Delete buttons

**Quality Loop:**
- tsgo + biome:check + lint via queue client on both files
- Verify all tier components render together without errors
- Verify keyboard shortcuts do not interfere with text input fields (check `event.target` tagName)

---

## Task 12 — Mobile Element Editor (List + Dialog + MiniCanvas + BottomSheet)

**Goal**: Create the mobile element editor: scrollable element list, full-screen edit dialog, mini-canvas thumbnail, and add element bottom sheet.

> **Parallelizable**: This task runs as a subagent in Wave 8 alongside T9 and T10.

**Files to Create:**
- `frontend/mobile/views/dashboard/certificates/template-editor/elements/elementEditor.mobile.tsx`
- `frontend/mobile/views/dashboard/certificates/template-editor/elements/ElementListView.mobile.tsx`
- `frontend/mobile/views/dashboard/certificates/template-editor/elements/ElementListRow.mobile.tsx`
- `frontend/mobile/views/dashboard/certificates/template-editor/elements/ElementEditDialog.mobile.tsx`
- `frontend/mobile/views/dashboard/certificates/template-editor/elements/ElementEditDialogHeader.mobile.tsx`
- `frontend/mobile/views/dashboard/certificates/template-editor/elements/AddElementBottomSheet.mobile.tsx`
- `frontend/mobile/views/dashboard/certificates/template-editor/elements/MiniCanvasThumbnail.mobile.tsx`

**Subtasks:**

**12a — ElementListView (design.md §6C Element List):**
1. Scrollable `List` of elements sorted by z-index descending (top layer first)
2. Each row is an `ElementListRow` component
3. `FloatingActionButton` (extended, `AddOutlined` icon + `actions.addElement` label) at bottom-right
4. Empty state: centered `Stack` with `emptyState.noElements` message + FAB inline
5. FAB disabled when `!canEdit`

**12b — ElementListRow:**
1. Layout: type icon (left), label (center, `Typography` variant `bodyMd`), up arrow + down arrow `IconButtons` (right), chevron icon (rightmost)
2. Up/down buttons: `ArrowUpwardOutlined` / `ArrowDownwardOutlined` — call `onReorderElement(id, "up"/"down")`
3. Chevron / row tap: calls `onSelectElement(id)` which opens the edit dialog (sets store flag)
4. Visibility indicator: faded row opacity when element is hidden (`opacity: 0.5`)
5. Lock indicator: `LockOutlined` icon overlay when element is locked

**12c — ElementEditDialog (design.md §6C Edit Dialog):**
1. Full-screen `Dialog` (`fullScreen` prop)
2. Header: `ElementEditDialogHeader` (App bar with element type label + close `IconButton`)
3. Body: scrollable form containing:
   - `MiniCanvasThumbnail` (120×80px) at top showing element position spatially
   - `CommonPropertiesForm` (from Task 6 — shared component)
   - `TypeSpecificFormDispatcher` (from Task 7 — shared component)
4. Footer: `SaveButton` (primary, `SaveOutlined`) + `DeleteButton` (error variant, `DeleteOutlined`, opens confirmation `Dialog`)
5. Save button calls `onSaveElement()` — if successful, closes dialog; if validation errors, stays open
6. Delete button opens confirmation `Dialog` before calling `onDeleteElement()`
7. Unsaved changes check on close (sets `unsavedChangesDialogOpen` if dirty)
8. Discard button visible when `isDirty` (calls `onDiscardChanges()`)

**12d — ElementEditDialogHeader:**
1. MUI `AppBar` with `Toolbar`
2. Close `IconButton` (`CloseOutlined`) on left
3. Center: element type label (translated `elementTypes.*`) + type icon
4. Right: Save `IconButton` (`SaveOutlined`) — disabled when `!isDirty` or `isSaving`

**12e — AddElementBottomSheet (design.md §6C Mobile Simplification):**
1. MUI `Dialog` with `fullScreen={false}` and `slots={{ paper: BottomSheet }}` OR native `BottomSheet` pattern
2. 6 `ListItem`s, one per element type — each with type icon + translated `elementTypes.*` label
3. On tap: calls `onCreateElement(elementType)` and closes sheet
4. Cancel button at bottom

**12f — MiniCanvasThumbnail (design.md §6C Mini-Canvas):**
1. Read-only preview showing element position spatially (120×80px scaled from template dimensions)
2. Draws element bounding box as a `Box` with absolute positioning (scaled proportionally)
3. Type-specific color: text=primary, image=secondary, shape=info, qr=success (theme palette)
4. Shows element label text inside the bounding box (truncated)
5. Helps user understand spatial position when editing on mobile without full canvas

**12g — elementEditor.mobile.tsx:**
1. Main mobile view — renders `ElementListView`
2. Conditionally renders `ElementEditDialog` when an element is selected (store flag)
3. Conditionally renders `AddElementBottomSheet` when `addElementMenuOpen` is true
4. Conditionally renders delete confirmation `Dialog` when `deleteDialogOpen` is true
5. Conditionally renders unsaved-changes `Dialog` when `unsavedChangesDialogOpen` is true
6. Receives ViewModel via props (pure presentation)

**Requirements References**: REQ-12.15

**Instruction Verification:**
- Read: `frontend/AGENTS.md` (mobile/desktop isolation), `frontend/views/AGENTS.md`
- File naming: `.mobile.tsx` only; no `.desktop.tsx` cross-imports
- **Zero `useMediaQuery` and zero `useViewport`/`ViewportContext` imports** (ESLint `no-restricted-imports` enforced)
- `sx` prop for styling; Typography variants not hardcoded font sizes
- Shared components (`CommonPropertiesForm`, `TypeSpecificFormDispatcher`) imported from `frontend/common/views/`
- Icons: `*Outlined` not `*Outline`
- Mini-canvas thumbnail uses absolute positioning (`Box` with `sx={{ position: 'absolute' }}`)
- Colors from theme palette (primary, secondary, info, success, error)

**Quality Loop:**
- tsgo + biome:check + lint via queue client on all 7 files
- Run per-file verification loop on each mobile component BEFORE importing into the main view
- Verify shared components (CommonPropertiesForm, TypeSpecificFormDispatcher) render correctly inside the mobile dialog

---

## Task 13 — i18n Namespace Implementation + Integration + Apollo Cache

**Goal**: Implement the i18n namespace in `shared/locale/`, wire all components together, finalize Apollo cache update functions, and run codegen.

> **Parallelizable**: This task runs as a subagent in Wave 10 alongside T14.

**Files to Create:**
- `shared/locale/namespaces/dashboard/certificates/templateElements.namespace.ts`
- `shared/locale/en/dashboard/certificates/templateElements.ts`
- `shared/locale/ar/dashboard/certificates/templateElements.ts`

**Files to Modify:**
- `shared/locale/namespaces/translation.ts` (add `CertificateTemplateElements: DashboardCertificateTemplateElements` to `Translation.Dashboard`)
- `shared/locale/types/message.ts` (add `certificateTemplateElements: CertificateTemplateElementsLabels` to `DashboardTranslations`)
- `frontend/common/views/dashboard/certificates/template-editor/elements/useTemplateElementEditorViewModel.ts` (finalize cache updates)
- `frontend/common/views/dashboard/certificates/template-editor/elements/elementEditorContainer.tsx` (create if not already in Plan 11)

**Subtasks:**

**13a — i18n Namespace Registration:**
1. Register a flat dashboard namespace: `defineNamespace("dashboard.certificateTemplateElements", ...)` at `shared/locale/namespaces/dashboard/certificates/templateElements.namespace.ts`
2. Add `CertificateTemplateElements: DashboardCertificateTemplateElements` to `Translation.Dashboard` in `shared/locale/namespaces/translation.ts`
3. Add `certificateTemplateElements: CertificateTemplateElementsLabels` to `DashboardTranslations` in `shared/locale/types/message.ts`
4. Siraj uses FLAT dashboard keys — NOT a nested `certificates` subgroup (see `shared/locale/types/message.ts` and `translation.ts`)

**13b — Translation Files:**
1. EN implementation at `shared/locale/en/dashboard/certificates/templateElements.ts` — exports `dashboardCertificateTemplateElementsEn`; wire into `shared/locale/en/messages.ts` as `dashboardTranslations.certificateTemplateElements`
2. AR implementation at `shared/locale/ar/dashboard/certificates/templateElements.ts` — exports `dashboardCertificateTemplateElementsAr`; wire into `shared/locale/ar/messages.ts` as `dashboardTranslations.certificateTemplateElements`
3. Both files must export matching key structures (type-checked at compile time)
4. All 14 sub-domains from design.md §11 must be present:
   - `elementTypes`: 6 element type labels
   - `properties`: all property labels (x, y, width, height, rotation, opacity, zIndex, textContent, fontFamily, fontSize, fontWeight, textColor, textAlign, lineHeight, variableId, textTransform, dateFormat, customFormat, locale, imageUrl, altText, fitMode, borderRadius, qrDataSource, qrCustomText, qrSize, qrErrorCorrection, qrMargin, shapeType, fillColor, strokeColor, strokeWidth, strokeStyle, cornerRadius, visibility, isLocked)
   - `sections`: position, text, image, qrCode, shape, appearance, advanced
   - `actions`: addElement, save, discard, delete, duplicate, copy, paste, bringForward, sendBackward, bringToFront, sendToBack, toggleVisibility, toggleLock, cancel, confirm
   - `errors`: validation error keys (required, minMax, range, invalidHex, unsupportedElementType, etc.)
   - `dialogs`: deleteTitle, deleteMessage (interpolation: `(elementType: string) => string`), unsavedChangesTitle, unsavedChangesMessage, discard, save, cancel
   - `qrErrorCorrection`: low, medium, quartile, high (with percentage descriptions)
   - `shapeTypes`: rectangle, circle, line
   - `fitModes`: contain, cover, fill
   - `fontWeights`: normal, medium, bold
   - `textTransforms`: none, uppercase, lowercase
   - `layerPanel`: header, elementCount
   - `emptyState`: selectElementToEdit, noElements, noVariables, noPreviewAvailable, noPermission
   - `multiSelect`: elementsSelected (interpolation: `(count: number) => string`), deleteAll, alignLeft, alignCenter, alignRight, alignTop, alignMiddle, alignBottom
5. Interpolation functions:
   - `dialogs.deleteMessage`: `(elementType: string) => string`
   - `multiSelect.elementsSelected`: `(count: number) => string` — Arabic needs one/few/many pluralization rules
6. Arabic translations must be culturally appropriate (RTL-aware, proper date/month names)

**13c — Apollo Cache Updates:**
1. `createTemplateElementMutation` update: Read element list from cache → append new element → write back → auto-select new element
2. `deleteTemplateElementMutation` update: `cache.evict({ id: cacheId })` → if deleted was selected, clear selection → `cache.gc()`
3. `updateTemplateElementMutation` update: Apollo auto-normalizes (id in response) → set `isDirty = false` in store
4. `duplicateTemplateElementMutation` update: Append clone to cache → auto-select duplicate
5. `reorderTemplateElementsMutation` update: Update zIndex on all affected elements → layer panel re-renders from query
6. `setElementVisibilityMutation` update: Update `isVisible` field in cache
7. `setElementLockMutation` update: Update `isLocked` field in cache
8. All mutations include `expectedTemplateVersion` for optimistic locking — on conflict, refetch and show conflict dialog

**13d — Component Integration:**
1. Ensure desktop layout includes: layer panel (left), canvas (center from Plan 11), property panel (right)
2. Ensure mobile layout includes: element list (main), edit dialog (overlay)
3. Verify `elementEditorContainer.tsx` uses `createLazyView` with proper module paths for desktop/mobile
4. Verify `<RequirePermission permission={AppPermission.CertificatesTemplatesManage}>` wraps the element editor
5. Verify all ViewModel callbacks are wired to correct component props
6. Verify dirty state + unsaved changes dialog works when switching elements or closing editor

**13e — Codegen:**
1. Run `bun run generate:gqlSchema && bun codegen` to regenerate types
2. Verify all TypeScript types resolve correctly in tsgo

**Requirements References**: REQ-12.1 through REQ-12.24 (integration validation)

**Instruction Verification:**
- Read: `shared/AGENTS.md` (locale system rules — compile-time TypeScript, `shared/locale/` structure, NamespaceHandle pattern)
- Read: `frontend/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/common/stores/AGENTS.md`
- i18n keys match the compile-time translation system in `shared/locale/`
- Never import `next-intl` or `shared/messages`
- Arabic pluralization rules for `multiSelect.elementsSelected`: one (1), few (2-10), many (11+) — use `shared/locale` pluralization helpers
- All locale files must export matching key structures (type-checked at compile time)
- Permission key: `certificates.templates.manage` (NOT `cert.templates.elements.*`)
- Apollo cache updates use `cache.modify` / `cache.evict` / `cache.gc` (not raw writes)

**Quality Loop:**
- Run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on ALL modified/created files (progressive: tsgo → biome → lint → codescene, short-circuits on first failure)
- Verify both English and Arabic locale files have identical key structures (compile-time type check)
- Run `bun run generate:gqlSchema && bun codegen` — verify no type errors

---

## Task 14 — Accessibility Verification + Keyboard Navigation

**Goal**: Verify and fix accessibility issues across all element editor components: keyboard navigation, screen reader labels, focus management, and color contrast.

> **Parallelizable**: This task runs as a subagent in Wave 10 alongside T13.

**Files to Modify:**
- Any component files from Tasks 5-12 that fail accessibility checks (fix in place)

**Subtasks:**

**14a — Layer Panel Accessibility (design.md §6F):**
1. Each `LayerPanelItem` has `role="button"` and `aria-label` with element name + type
2. Drag handle has `aria-label` = `layerPanel.dragHandle` (i18n key)
3. Visibility toggle has `aria-label` = `actions.toggleVisibility` + current state
4. Lock toggle has `aria-label` = `actions.toggleLock` + current state
5. Keyboard reorder works: focus on layer item → Space/Enter to pick up → ArrowUp/ArrowDown to move → Space/Enter to drop (via @dnd-kit KeyboardSensor)
6. Screen reader announces reorder: "Element moved to position N"

**14b — Property Panel Accessibility:**
1. All form fields have `label` prop or surrounding `InputLabel` with `htmlFor`
2. All `IconButton` components have `aria-label`
3. `ColorPickerField` swatch button has `aria-label` = `properties.colorPicker` (i18n key)
4. Color picker `Popover` has `role="dialog"` and `aria-label`
5. `Accordion` sections have proper `aria-expanded` state (MUI handles this)
6. Form errors announced: `TextField` `error` prop + `FormHelperText` with `aria-live="polite"` on error container

**14c — Mobile Dialog Accessibility:**
1. `ElementEditDialog` full-screen `Dialog` traps focus (MUI handles this with `Dialog`)
2. Close button has `aria-label` = `actions.close` (i18n key)
3. Dialog title: element type label
4. Mini-canvas thumbnail has `role="img"` and `aria-label` describing element position
5. Bottom sheet has proper `role="dialog"` and dismissible via swipe-down or Escape

**14d — Keyboard Navigation:**
1. Tab order: layer panel → canvas → property panel (logical left-to-right flow)
2. Property panel: Tab moves through form fields in visual order
3. Enter/Space on buttons triggers onClick
4. Escape closes dialogs, context menus, and deselects elements
5. Arrow keys navigate accordion sections when focused on accordion header
6. No keyboard traps (every focusable element can be Tabbed away from)

**14e — Color Contrast:**
1. All text meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
2. Error messages use `theme.palette.error.main` (ensures sufficient contrast)
3. Selected layer item highlight uses `theme.palette.action.selected` (meets contrast)
4. Verify both light and dark theme modes

**Requirements References**: REQ-12.24

**Instruction Verification:**
- Read: `frontend/AGENTS.md` (accessibility rules)
- Read: `frontend/views/AGENTS.md`
- All `IconButton` components MUST have `aria-label`
- All form `TextField` components MUST have `label` prop or associated `InputLabel`
- MUI `Dialog` handles focus trapping — verify it works with full-screen dialog
- `aria-live="polite"` on error message containers
- No `console.*` for debugging (use `logger`)

**Quality Loop:**
- tsgo + biome:check + lint via queue client on any modified files
- Manual keyboard navigation test: Tab through all panels, verify no traps
- Verify screen reader (VoiceOver/NVDA) announces layer items, form labels, and dialog content

---

## Task 15 — Knowledge Propagation

**Goal**: Document patterns learned, update AGENTS.md if needed, and propagate knowledge to future plans (13–15) that will use similar form patterns.

**Files to Create/Modify:**
- `frontend/COMPONENT_PATTERNS.md` (add property panel + layer panel pattern documentation)
- Update `.agents/instructions/frontend.instructions.md` if new patterns emerge

**Subtasks:**
1. Document the polymorphic form pattern (type-specific form dispatch on discriminated union type) as a reusable pattern for Plans 13 (variable forms) and 14 (recipient group forms)
2. Document the Apollo cache update strategy for hierarchical entity mutations (create/evict/update on child entities of a parent template)
3. Document the mobile list-and-dialog pattern as the adaptation strategy for complex desktop design tools on mobile
4. Document the dirty-state + unsaved-changes dialog pattern for multi-element editors
5. Document @dnd-kit/sortable integration pattern for reorderable lists (sensors, collision detection, arrayMove, DragOverlay)
6. Document react-color ChromePicker in MUI Popover pattern for color picker fields
7. Document the mini-canvas thumbnail pattern for mobile spatial context
8. If the property panel + layer panel layout becomes a standard, add a note to `frontend/views/AGENTS.md`
9. Update any relevant `.agents/instructions/` files if new patterns emerge

**Requirements References**: All (cross-cutting knowledge)

**Instruction Verification:**
- Read: `AGENTS.md` (root — Knowledge Propagation section)
- Do NOT create SUMMARY.md, CHANGES.md, or REPORT.md files (project rule)
- Documentation files that are part of project structure (`.md` in `docs/` or `frontend/`) are allowed

**Quality Loop:**
- No tsgo/biome/lint needed for documentation files
- Verify no new patterns break existing AGENTS.md rules

---

## Task 16 — Element Properties Panel (Right Sidebar)

**Goal**: Create the `ElementPropertiesPanel` desktop右侧 sidebar component that renders a vertical accordion of position/size, appearance, and type-specific properties for the currently selected canvas element. Adapts to element type and supports multi-select batch state.

> **Parallelizable**: This task runs as a subagent in Wave 12 alongside T17, T18, T19, T20, and T27.

**Files to Create:**
- `frontend/views/dashboard/cert/templates/editor/panels/ElementPropertiesPanel.tsx`
- `frontend/views/dashboard/cert/templates/editor/panels/sections/PositionSizeSection.tsx`
- `frontend/views/dashboard/cert/templates/editor/panels/sections/AppearanceSection.tsx`
- `frontend/views/dashboard/cert/templates/editor/panels/sections/ElementSpecificSection.tsx`
- `frontend/views/dashboard/cert/templates/editor/panels/TypeSpecificPropertyForms.ts` (dispatcher map)

**Subtasks:**
1. Build the accordion shell (MUI `Accordion` ×3) with controlled expansion state synced to the Zustand store's `panelExpandedSections`
2. **Position & Size section**: X/Y/Width/Height number inputs (with `px` suffix label), rotation slider (-180 to 180 with `°` suffix), lock aspect ratio checkbox. Bind to canvas store common props (read-only during active drag — throttle with `interactionState`)
3. **Appearance section**: opacity slider (0-100), border radius number input (shapes only), shadow dropdown (None/Small/Medium/Large/Custom), z-index `IconButton` row (bring forward/backward, bring to front, send to back) wired to store z-order actions
4. **Element-Specific section**: dispatch to the appropriate type-specific form by `element.type`. Import and reuse the type-specific forms from Task 7 (`StaticTextPropertiesForm`, `DataTextPropertiesForm`, `DataDatePropertiesForm`, `ImagePropertiesForm`, `QrCodePropertiesForm`, `ShapePropertiesForm`). Add new forms for `signature` and `background` types (SignaturePropertiesForm: placeholder text, font style cursive/normal, ink color, stroke width; BackgroundPropertiesForm: fill type solid/gradient, colors, opacity)
5. Empty state: render `PropertyPanelEmptyState` (i18n message) when `selectedElementIds.length === 0`
6. Multi-select state: when `selectedElementIds.length > 1`, render `MultiSelectBadge` + batch action buttons (align, distribute, delete) instead of the accordion — delegate to Task 19's `MultiSelectToolbar`
7. All labels from i18n namespace `dashboard.certificateTemplateElements.properties.*`
8. No hardcoded colors — use `theme.palette.*`

**Requirements References**: REQ-12.13, REQ-12.2, REQ-12.4

**Instruction Verification:**
- Read: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- MUI v9: use `sx` prop for all style values (no style props on Typography/Stack/Box/Grid)
- All inputs must have `label` prop (MUI a11y requirement)
- Import `useAppTranslation(Translation.Dashboard.CertificateTemplateElements)` for i18n

**Quality Loop:**
- tsgo + biome:check + lint via queue client on each new file
- `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per file

---

## Task 17 — Alignment Guide Engine

**Goal**: Create the `AlignmentGuides` canvas overlay component that renders smart, edge, distribution, and page-center guide lines while dragging elements, with a 5px snap threshold.

> **Parallelizable**: This task runs as a subagent in Wave 12 alongside T16, T18, T19, T20, and T27.

**Files to Create:**
- `frontend/views/dashboard/cert/templates/editor/canvas/AlignmentGuides.tsx`
- `frontend/views/dashboard/cert/templates/editor/canvas/alignmentEngine.ts` (pure computation functions)

**Subtasks:**
1. Build `alignmentEngine.ts` with pure functions:
   - `computeSmartGuides(dragged, candidates, threshold)` → vertical/horizontal center-alignment lines
   - `computeEdgeGuides(dragged, candidates, threshold)` → edge-alignment lines (top/bottom/left/right)
   - `computeDistributionGuides(dragged, candidates, threshold)` → equal-spacing indicators (3+ elements)
   - `computePageGuides(dragged, canvasWidth, canvasHeight, threshold)` → page center + page edge guides
   - `snapToGuides(dragged, guides, threshold)` → adjusted `{ x, y }` position clamped to nearest guide
2. Build `AlignmentGuides.tsx` overlay component:
   - Reads dragged element id + pointer position from Plan 11 canvas store
   - Calls `computeSmartGuides` / `computeEdgeGuides` / `computeDistributionGuides` / `computePageGuides` via `useMemo`
   - Renders SVG `<line>` elements for each guide (`stroke = theme.palette.primary.main`, `strokeOpacity = 0.5`, `strokeWidth = 1`)
   - Guides disappear on drag end (component renders null when `interactionState === 'idle'`)
   - Snap threshold default 5px; configurable via prop `snapThreshold={number}`
3. Integration: overlay renders as the topmost layer in the React Flow canvas container (Plan 11) — `position: absolute`, `pointerEvents: 'none'`
4. Distribution guides rendered as double-headed arrows between elements (use SVG `<marker>` for arrowheads)

**Requirements References**: NFR-12.1 (performance — memoize), REQ-11 visual aids

**Instruction Verification:**
- Read: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- No `console.*` — use `logger` from `@/frontend/utils/logger` (only if debug logging needed)
- No hardcoded colors — guide color from `theme.palette.primary.main`
- Pure functions in `alignmentEngine.ts` are unit-testable without React

**Quality Loop:**
- tsgo + biome:check + lint via queue client on each new file
- `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per file

---

## Task 18 — Element Context Menu

**Goal**: Create the `ElementContextMenu` component with the full right-click menu: cut/copy/paste/duplicate/delete, z-order, align submenu, distribute submenu, group/ungroup.

> **Parallelizable**: This task runs as a subagent in Wave 12 alongside T16, T17, T19, T20, and T27.

**Files to Create:**
- `frontend/views/dashboard/cert/templates/editor/canvas/ElementContextMenu.tsx`

**Subtasks:**
1. Component renders a MUI `Menu` anchored at cursor `(clientX, clientY)`, clamped to viewport edges using `getBoundingClientRect` math on open
2. Menu items in this exact order: Cut, Copy, Paste, Duplicate, Delete, Divider, Bring to Front, Bring Forward, Send Backward, Send to Back, Divider, Align ▸ (submenu: Left, Center, Right, Top, Middle, Bottom), Distribute ▸ (submenu: Horizontally, Vertically), Divider, Group, Ungroup
3. Keyboard shortcuts shown as secondary text in each `MenuItem` (Ctrl+X, Ctrl+C, Ctrl+V, Ctrl+D, Del, Ctrl+G, Ctrl+Shift+G)
4. Disabled items: Paste disabled when clipboard empty (`store.clipboard.length === 0`); Align/Distribute disabled when `selectedElementIds.length < 2` (distribute requires 3+); Group disabled when `selectedElementIds.length < 2` or already in a group; Ungroup disabled when selection is not part of a group. Disabled state includes a tooltip explaining why (MUI `Tooltip`)
5. Submenus: use MUI `Menu` with `anchorEl` cascading (or `MenuItem` with nested `Menu`)
6. Wire all actions to Zustand store: `cutSelection()`, `copySelection()`, `pasteFromClipboard()`, `duplicateElement()`, `deleteElements()`, `bringToFront()`, `bringForward()`, `sendBackward()`, `sendToBack()`, `alignElements()`, `distributeElements()`, `group()`, `ungroup()`
7. RTL: menu mirrors in Arabic locale (MUI handles automatically via theme direction)
8. Keyboard: full arrow-key navigation, Escape closes, Enter triggers focused item

**Requirements References**: REQ-12.16, REQ-12.17, REQ-12.18

**Instruction Verification:**
- Read: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- MUI v9 `Menu` / `MenuItem` — use `sx` for styling, no style props
- All labels from i18n namespace — no hardcoded strings
- Each `MenuItem` with `IconButton` must have `aria-label`

**Quality Loop:**
- tsgo + biome:check + lint via queue client on each new file
- `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per file

---

## Task 19 — Multi-Select Toolbar + Selection Rectangle

**Goal**: Create the `MultiSelectToolbar` floating component that appears above the selection bounding box when 2+ elements are selected, with align/distribute/group/match-size/delete buttons. Also implement the marquee selection rectangle.

> **Parallelizable**: This task runs as a subagent in Wave 12 alongside T16, T17, T18, T20, and T27.

**Files to Create:**
- `frontend/views/dashboard/cert/templates/editor/canvas/MultiSelectToolbar.tsx`
- `frontend/views/dashboard/cert/templates/editor/canvas/SelectionRectangle.tsx`

**Subtasks:**
1. **MultiSelectToolbar**:
   - Renders when `selectedElementIds.length >= 2`; positioned at the top edge of the bounding box, centered horizontally
   - Button groups: Align left/center/right (3 `IconButton`s), Align top/middle/bottom (3 `IconButton`s), Distribute horizontally/vertically (2 `IconButton`s), Group (1 `IconButton`), Same Size (1 `IconButton`), Delete (1 `IconButton`)
   - Distribute buttons disabled (with tooltip) when `selectedElementIds.length < 3`
   - Same Size matches the width AND height of the first element in selection (topmost in z-order)
   - Bounding box: dashed rectangle (SVG or styled `div`) with `border: 1px dashed ${theme.palette.primary.main}` rendered behind the toolbar
   - Wire all actions to Zustand store: `alignElements()`, `distributeElements()`, `group()`, `matchSize()`, `deleteElements()`
2. **SelectionRectangle** (marquee):
   - Activated by click+drag on empty canvas (not on an element)
   - Renders a semi-transparent rectangle (`backgroundColor: alpha(theme.palette.primary.main, 0.1)`, `border: 1px dashed primary.main`) from the pointer-down point to current pointer position
   - On `pointerup`: compute which elements' bounding boxes intersect the rectangle → call `selectMultiple(ids)`
   - Escape cancels the marquee
3. All `IconButton`s must have `aria-label` from i18n
4. Toolbar buttons use MUI `ToggleButtonGroup` or `IconButton` row — no custom popover

**Requirements References**: REQ-12.17, NFR-12.10

**Instruction Verification:**
- Read: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- MUI v9: use `sx` prop, no style props
- No hardcoded colors — all from `theme.palette`
- All `IconButton` components have `aria-label`

**Quality Loop:**
- tsgo + biome:check + lint via queue client on each new file
- `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per file

---

## Task 20 — Element Library Palette (Left Sidebar)

**Goal**: Create the `ElementLibrary` left-sidebar palette with four collapsible sections (Text, Media, Shapes, Background) of draggable element templates that can be dropped onto the canvas or clicked to create an element at canvas center.

> **Parallelizable**: This task runs as a subagent in Wave 12 alongside T16, T17, T18, T19, and T27.

**Files to Create:**
- `frontend/views/dashboard/cert/templates/editor/panels/ElementLibrary.tsx`
- `frontend/views/dashboard/cert/templates/editor/panels/PaletteItem.tsx`
- `frontend/views/dashboard/cert/templates/editor/panels/paletteDefaults.ts` (default properties per item)

**Subtasks:**
1. **paletteDefaults.ts**: Export a `PALETTE_DEFAULTS` record mapping each palette item key to `{ elementType, defaults }` (Heading→static_text@32px, Subheading→static_text@20px, Body→16px, Small→12px, VariableText→data_text, Image, QRCode, Barcode, Signature, shapes, backgrounds — full table from design.md §13.E)
2. **PaletteItem.tsx**: A draggable row with icon + i18n label. Supports `onDragStart` (sets `DataTransfer` payload with `{ elementType, defaults }` JSON) and `onClick` (creates element at canvas center via `store.addElement(type, centerPos, defaults)`)
3. **ElementLibrary.tsx**: Four MUI `Accordion` sections matching the design.md §13.E layout (Text Elements, Media Elements, Shapes, Background). Each accordion contains `PaletteItem` rows for that section's items. First section expanded by default.
4. Items with element types that lack a backend mutation (e.g. `barcode`, `signature`, `background` if not yet implemented) render as disabled with `Tooltip`: "Coming soon" (i18n key `palette.comingSoon`)
5. Drag-and-drop integration: the canvas (Plan 11) accepts HTML5 `onDrop`, parses the `DataTransfer` payload, converts client XY to canvas coordinates, and calls `store.addElement(type, { x, y }, defaults)`. Co-ordinate with Plan 11 on the drop handler contract.
6. Click-to-add: computes canvas center as `(canvasWidth/2 - defaults.width/2, canvasHeight/2 - defaults.height/2)` from Plan 11 canvas store dimensions
7. All labels from i18n namespace `dashboard.certificateTemplateElements.palette.*`
8. Icons: Text→`FormatSize`, Image→`Image`, QRCode→`QrCode`, Barcode→`BarcodeRead`, Signature→`Draw`, Rectangle→`CropSquare`, Circle→`Circle`, Triangle→`ChangeHistory`, Line→`HorizontalRule`, Background→`Wallpaper`

**Requirements References**: REQ-12.1 (element creation), REQ-12.7-12.12

**Instruction Verification:**
- Read: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- MUI v9: use `sx` prop for all style values
- i18n: `useAppTranslation(Translation.Dashboard.CertificateTemplateElements)`
- No hardcoded colors — all from `theme.palette`

**Quality Loop:**
- tsgo + biome:check + lint via queue client on each new file
- `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per file

---

## Task 21 — Extended Zustand Element Store (Clipboard, Groups, History)

**Goal**: Extend the Task 2 `useTemplateElementEditorStore` with multi-select, clipboard, groups, align/distribute/matchSize, and undo/redo (history command pattern). Consolidate to be the single source of truth for `selectedElementIds` (remove duplicate selection state from Plan 11 canvas store).

> **Parallelizable**: This task runs as a subagent in Wave 3 alongside T3.

**Files to Create/Modify:**
- `frontend/common/stores/certificates/templateElementEditorStore.ts` (extend existing from Task 2)

**Subtasks:**
1. Add `selectedElementIds: string[]` (single source of truth — Plan 11 canvas reads via `useTemplateElementEditorStore((s) => s.selectedElementIds)`)
2. Add `clipboard: CanvasElement[]` (deep-cloned element snapshots for copy/paste between templates)
3. Add `groups: ElementGroup[]` (`{ id, name, elementIds, color }`)
4. Add `history: { past: HistoryCommand[]; future: HistoryCommand[] }` with 50-entry cap
5. Implement element lifecycle actions: `addElement`, `updateElement`, `deleteElements`, `duplicateElement` — each pushes a `HistoryCommand` to `past` and clears `future`
6. Implement selection actions: `selectElement(id, additive)`, `selectMultiple(ids)`, `selectAll`, `clearSelection` — these do NOT produce history entries
7. Implement clipboard actions: `copySelection` (deep-clone selected into clipboard), `cutSelection` (copy + delete as single command), `pasteFromClipboard(position)` (offset pasted elements 10px, push `addElement` command per pasted element)
8. Implement z-order: `bringToFront`, `bringForward`, `sendToBack`, `sendBackward`, `reorder` — each pushes a `reorder` command to history
9. Implement groups: `group(name, ids)` returns new groupId (pushes `group` command), `ungroup(groupId)` (pushes `ungroup` command), `addToGroup`, `removeFromGroup`
10. Implement alignment: `alignElements(alignment)` operates on `selectedElementIds`; `distributeElements(axis)` requires 3+ selected; `matchSize(referenceId)` matches width+height of first selected
11. Implement undo/redo: `undo()` pops `past`, applies inverse, pushes to `future`; `redo()` reverses; `canUndo()` / `canRedo()` selectors
12. Import types from `@/frontend/common/graphql/generated/gql/graphql-types` (never `operations.ts`)
13. No `persist` middleware (session-only)
14. Actions that mutate `elements[]` fire Apollo mutations (via the ViewModel, not directly in the store — store is data-agnostic, the ViewModel wraps store calls with Apollo `useMutation`)

**Requirements References**: REQ-12.18, REQ-12.21, REQ-12.17, REQ-12.5

**Instruction Verification:**
- Read: `frontend/common/stores/AGENTS.md`, `frontend/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- Read: `frontend/common/stores/createRecurringClassStore.ts` (reference for complex form store pattern)
- Strict typing with GraphQL generated types from `graphql-types.ts`
- No `useMediaQuery` / `useViewport` in stores
- `HistoryCommand` is a discriminated union — each variant carries before/after state

**Quality Loop:**
- tsgo + biome:check + lint via queue client on each new file
- `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per file

---

## Task 22 — Drag-and-Drop from Palette to Canvas

**Goal**: Implement the drag-and-drop integration between the `ElementLibrary` palette (Task 20) and the React Flow canvas (Plan 11) so dropping a palette item creates an element at the drop position with default properties.

**Files to Create/Modify:**
- `frontend/views/dashboard/cert/templates/editor/canvas/PaletteDropZone.tsx` (wrapper around the canvas that handles `onDrop`)
- Coordinate with Plan 11: add an `onDrop` handler to the React Flow container

**Subtasks:**
1. Create `PaletteDropZone` — a thin wrapper that renders children (the canvas) and attaches `onDrop` and `onDragOver` handlers
2. On `onDragOver`: call `event.preventDefault()` (required for drop to fire) — no visual change needed
3. On `onDrop`: parse `event.dataTransfer.getData('application/json')` → `{ elementType, defaults }` payload (set by `PaletteItem.onDragStart`)
4. Convert `event.clientX/clientY` to canvas coordinates using the canvas container's `getBoundingClientRect()` and the current zoom/pan from Plan 11's canvas store
5. Clamp the drop position within canvas bounds (`0 <= x <= canvasWidth - defaults.width`, `0 <= y <= canvasHeight - defaults.height`)
6. Call `store.addElement(elementType, { x, y }, defaults)` — the store action fires the Apollo create mutation via the ViewModel
7. Auto-select the new element (`store.selectElement(newId)`)
8. Provide visual feedback during dragover: change the canvas border to `2px dashed ${theme.palette.primary.main}` (optional — can be a follow-up enhancement)

**Requirements References**: REQ-12.1 (element creation via palette)

**Instruction Verification:**
- Read: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- Coordinate with Plan 11's React Flow canvas container for the drop event contract
- No hardcoded colors — use `theme.palette`

**Quality Loop:**
- tsgo + biome:check + lint via queue client on each new file
- `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per file

---

## Task 25 — Quality Loop Per File

**Goal**: Run the per-file quality loop (tsgo → biome → lint) on every new file created in Tasks 16–22 before marking the plan as complete.

**Files:** All files created in Tasks 16–22

**Subtasks:**
 1. For each new file, run: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`
 2. Fix all tsgo errors first (progressive enforcement — do not skip to biome/lint while tsgo fails)
 3. Fix all biome issues (formatting + unsafe fixes)
 4. Fix all lint errors (ESLint via queue client)
 5. Re-run full-project `bun run tsgo` then `bun biome:check` then `bun run lint` to ensure no regressions across the codebase
 6. Verify no required types from GraphQL codegen are missing — if any `graphql-types.ts` types are referenced for new element types (`barcode`, `signature`, `background`), run `bun run generate:gqlSchema && bun codegen`

**Instruction Verification:**
- Read: `AGENTS.md` (root) — Per-File Verification Loop section
- Read: `scripts/health/sub-loop.ts` — progressive lifecycle enforcement
- Progressive: tsgo → biome → lint → codescene (short-circuit on first failure — do not skip ahead)

**Quality Loop:**
- This task IS the quality loop — no additional gate needed beyond verification

---

## Task 26 — Knowledge Propagation

**Goal**: Document the new patterns learned from Tasks 16–22 and propagate knowledge to future plans and AGENTS.md files.

**Files to Create/Modify:**
- `frontend/COMPONENT_PATTERNS.md` (add: alignment guide overlay pattern, context menu pattern, multi-select toolbar pattern, drag-and-drop palette pattern, history command undo/redo pattern)
- Update `.agents/instructions/frontend.instructions.md` if new reusable patterns emerge
- Update `frontend/views/AGENTS.md` if the canvas overlay pattern becomes a standard

**Subtasks:**
1. Document the **alignment guide engine** pattern (pure computation functions + SVG overlay component, memoized, theme-driven colors) as a reusable pattern for any canvas-based editor in the Siraj codebase
2. Document the **right-click context menu** pattern (MUI Menu anchored at cursor, clamped to viewport, submenu cascade, disabled-state tooltips, i18n labels)
3. Document the **multi-select toolbar + marquee selection** pattern (floating toolbar above bounding box, HTML5 marquee rectangle, intersection-based selection)
4. Document the **drag-and-drop palette** pattern (DataTransfer payload, client→canvas coordinate conversion, drop position clamping, auto-select on drop)
5. Document the **history command undo/redo** Zustand pattern (discriminated union command types, before/after state, 50-entry cap, undo=inverse+push-future) as the canonical approach for undoable editor state in this codebase
6. Document the **extended Zustand element store** pattern (clippenaris, groups, z-order, align/distribute, matchSize) and how it consolidates selection as the single source of truth (per SWE review §A consolidation recommendation)
7. If the alignment guide + multi-select patterns become a standard for canvas-based editors, add a note to `frontend/views/AGENTS.md` cross-referencing Plan 12's implementation
8. Update `INTER_PLAN_CONTRACTS.md` (if maintained) to note that Plans 13–15 can reuse the history command pattern and multi-select pattern for their editor surfaces

**Requirements References**: All (cross-cutting knowledge)

**Instruction Verification:**
- Read: `AGENTS.md` (root — Knowledge Propagation section)
- Do NOT create SUMMARY.md, CHANGES.md, or REPORT.md files (project rule)
- Documentation files that are part of project structure (`.md` in `frontend/` or `docs/`) are allowed

**Quality Loop:**
- No tsgo/biome/lint needed for documentation files
- Verify no new patterns break existing AGENTS.md rules

---

## Task 27 — Comprehensive Testing (Original)

**Goal**: Achieve full test coverage for all Plan 12 components and integration points, following the project's layered testing strategy.

> **Parallelizable**: This task runs as a subagent in Wave 12 alongside T16, T17, T18, T19, and T20.

**Dependencies**: Tasks 1–14 complete

**Hours**: 24h

**Files to Create/Modify:**
- `backend/db/test/repo/elementRepository.test.ts` — Repository tests for element CRUD
- `backend/db/test/logic/elementLogic.test.ts` — Business logic integration tests
- `frontend/common/stores/templateElementEditorStore.test.ts` — Zustand store tests
- `frontend/common/hooks/useTemplateElementViewModel.test.ts` — ViewModel tests
- `frontend/common/graphql/test/certificateTemplateElements.integration.test.ts` — GraphQL integration tests

**Subtasks:**

### 16a — Database Repository Tests (backend/db/test/repo/)
1. `createElement` — inserts row with correct defaults per element type
2. `getElementById` — returns ElementWithDetails discriminated union with type-specific fields
3. `getElementsByTemplateId` — returns ordered by z_index asc
4. `updateElementProperties` — updates only provided fields; preserves type-specific fields
5. `updateElementZIndex` — single element z-index change
6. `batchUpdateZIndices` — renormalizes to dense 0..N sequence
7. `deleteElement` — cascades correctly (no orphan data)
8. `duplicateElement` — creates copy with offset position, new z-index at top
9. `setElementVisibility` / `setElementLock` — boolean toggles
10. Verify all queries use `tx` parameter (runInRollback wrapper)

### 16b — Business Logic Integration Tests (backend/db/test/logic/)
1. `validateElementProperties` per type — returns typed validation errors
2. `normalizeRotation` — maps any degree to 0..360 range
3. `computeMinSize` per element type — enforces minimums
4. `renormalizeZIndices` — produces dense 0..N from sparse input
5. `checkTemplateEditable` — returns false when template.status === 'published'
6. Optimistic locking: `expectedTemplateVersion` mismatch throws `OptimisticLockError`

### 16e — Zustand Store Tests
1. `draftElements` CRUD — createDraft, updateDraft, deleteDraft, clearDraft
2. `isDirty` flag — true after any edit; false after save/clear
3. `originalElements` snapshot — captured on first edit; used for dirty comparison
4. `reset()` — clears all draft state
5. Selectors — `selectDraftElement(id)`, `selectIsDirty()`, `selectOriginalElement(id)`

### 16f — ViewModel Hook Tests
1. `useTemplateElementViewModel` returns flat object with all actions
2. `createElement` — dispatches create mutation; updates local draft
3. `updateElement` — validates; dispatches update mutation; handles optimistic lock conflict
4. `deleteElement` — confirms; dispatches delete mutation; clears local draft
5. `duplicateElement` — creates copy with offset; dispatches create
6. `reorderElements` — calls batch z-index mutation; renormalizes
6. `setVisibility` / `setLock` — toggles boolean; dispatches mutation
7. `copyElement` / `pasteElement` — clipboard management
8. `handleSelectionChange` — syncs with canvas store selection
9. Permission gating — all actions no-op when `!canManage`

### 16g — GraphQL Integration Tests (dev server)
1. All 10 mutations (create/update/delete/duplicate/reorder/setVisibility/setLock/copy/paste/batchZIndex)
2. Query `templateElements(templateId)` returns ordered list with all type-specific fields
3. Subscription (if implemented) for real-time collaborative updates
4. Cache eviction/updates verified for each mutation

**Requirements References:**
- REQ-12.1 through REQ-12.24 (all functional requirements)
- NFR-12.1 through NFR-12.15 (all non-functional requirements)
- INTER_PLAN_CONTRACTS.md §27 (Plan 12 specific corrections)

**Instruction Verification:**
- Read: `scripts/run-test/AGENTS.md` — database tests MUST use `runInRollback` wrapper
- Read: `backend/db/test/AGENTS.md` — repo tests 100% coverage required
- Read: `frontend/common/graphql/AGENTS.md` — GraphQL tests use testClient, not raw fetch
- All test files follow naming convention: `*.test.ts` / `*.test.tsx`
- Database tests use entity-setup helpers from `backend/db/test/helpers/entity-setup.ts`
- No `console.*` in tests (use `logger`)

**Quality Loop:**
- `bun run test:db` for database tests (parallel via scripts/run-db-tests-parallel.ts)
- `bun run test:graphql` for GraphQL integration tests (dev server)
- `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on each new test file
- Target: 100% for repo layer

---

## Task Verification Checklist

After all **25 tasks** complete, verify:

- [ ] `bun run tsgo` passes with zero errors (including generated GraphQL types)
- [ ] `bun biome:check` passes with zero issues
- [ ] `bun run lint` passes on all files created/modified in this plan
- [ ] All 6 element type forms render correctly with translated labels
- [ ] Shared input controls (PositionSizeInputs, OpacitySlider, ColorPickerField, FontPicker) render and validate correctly
- [ ] Desktop property panel shows common + type-specific fields in collapsible accordion sections
- [ ] Desktop layer panel shows elements sorted by z-index with visibility/lock toggles and @dnd-kit drag-reorder
- [ ] `@dnd-kit/sortable` drag-reorder works with PointerSensor (distance:8) and KeyboardSensor (sortableKeyboardCoordinates)
- [ ] `DragOverlay` renders ghost copy during drag; original item opacity 0.4
- [ ] `ColorPickerField` opens ChromePicker in MUI Popover; hex TextField validates `/^#[0-9a-fA-F]{6}$/`
- [ ] `FontPicker` Autocomplete shows font previews in their own font family
- [ ] Desktop context menu shows z-order, duplicate, copy/paste, delete actions with correct icons
- [ ] Desktop keyboard shortcuts work (Ctrl+D, Delete, Ctrl+C/V, Ctrl+]/[, Ctrl+Shift+]/[, Escape, Ctrl+Z/Y)
- [ ] Mobile element list shows elements with tap-to-edit dialog and up/down reorder buttons
- [ ] Mobile edit dialog shows mini-canvas thumbnail + shared forms
- [ ] Mobile add element bottom sheet shows 6 element type options
- [ ] Element creation creates element at canvas center with default properties per type
- [ ] Validation prevents invalid saves and shows inline errors with i18n keys
- [ ] Apollo cache updates work for all mutation types (create/update/delete/duplicate/reorder/setVisibility/setLock)
- [ ] Optimistic locking: `expectedTemplateVersion` in all mutations; conflict shows error dialog
- [ ] i18n namespace `dashboard.certificateTemplateElements` registered with all 14 sub-domains in both EN and AR
- [ ] All i18n keys match between EN and AR locale files (compile-time type checked)
- [ ] `multiSelect.elementsSelected` Arabic pluralization correct (one/few/many)
- [ ] `dialogs.deleteMessage(elementType)` interpolation works in both EN and AR
- [ ] Permission `certificates.templates.manage` gates all editing actions (toolbar, context menu, save, delete)
- [ ] No `useMediaQuery` / `useViewport` in `.mobile.tsx` or `.desktop.tsx` files
- [ ] No hardcoded colors, no hardcoded strings, no `next-intl` imports
- [ ] No `useLazyQuery` (use stateful `useQuery` only)
- [ ] `bun codegen` passes after schema/document changes
- [ ] All `IconButton` components have `aria-label`
- [ ] All form `TextField` components have `label` prop
- [ ] Keyboard navigation works: Tab through all panels, no traps
- [ ] Z-index renormalized to dense 0..N after batch reorder (not sparse)
- [ ] All 25 tasks pass individual quality loops
- [ ] Test coverage targets met: 100% repo layer

---

## Acceptance Criteria Mapping (Requirements → Tasks)

| Requirement | Acceptance Criteria | Covered By Task(s) | Verification Method |
|---|---|---|---|
| **REQ-12.1** (6 element types) | All 6 element types (static_text, data_text, data_date, image, qr_code, shape) creatable and renderable | Task 3 (Desktop Property Panel), Task 5 (Mobile Edit Dialog), Task 7 (Element Creation), Task 16 (Testing) | Manual verification of all 6 types |
| **REQ-12.2** (Element properties) | Each element type has complete property form with all specified fields | Task 2 (Shared Controls), Task 3 (Type-specific fields), Task 5 (Mobile forms), Task 16 (Tests) | Form field inventory per type matches design.md spec |
| **REQ-12.3** (Layer panel) | Desktop layer panel shows elements by z-index with visibility/lock toggles and drag-reorder | Task 4 (Layer Panel), Task 10 (@dnd-kit integration), Task 16 (Tests) | Layer panel verification; manual drag reorder check |
| **REQ-12.4** (Property panel) | Desktop property panel shows common + type-specific fields in accordion sections | Task 3 (Property Panel), Task 16 (Tests) | Property panel manual verification |
| **REQ-12.5** (Mobile list) | Mobile element list with tap-to-edit dialog and reorder buttons | Task 5 (Element List + Edit Dialog), Task 6 (Add Element), Task 16 (Tests) | Manual verification of mobile list |
| **REQ-12.6** (Rotation 0–360) | Rotation normalized to 0–360 range; rotate handle works | Task 7 (Canvas interactions), Task 9 (Normalization utility), Task 16 (Tests) | Unit test for normalizeRotation; manual canvas check |
| **REQ-12.7** (Z-index renormalization) | Batch reorder produces dense 0..N z-indices | Task 8 (Batch z-index), Task 10 (Drag reorder), Task 16 (Tests) | Logic test for renormalizeZIndices |
| **REQ-12.8** (Image upload) | Image element supports file upload + preview + URL input | Task 11 (Image upload), Task 16 (Tests) | Image upload integration test |
| **REQ-12.9** (QR code config) | QR element has size, error correction, data source (variable/verification_url/custom) | Task 3 (QR form fields), Task 16 (Tests) | QR form field test |
| **REQ-12.10** (Shape config) | Shape element supports rectangle, circle, line with type-specific properties | Task 3 (Shape form fields), Task 16 (Tests) | Shape form field test |
| **REQ-12.11** (Data text variable binding) | data_text links to variable via autocomplete selector | Task 3 (Data text form), Task 16 (Tests) | Data text form test |
| **REQ-12.12** (Data date format) | data_date has format selector (iso, arabicFullMonth, numeric, custom) | Task 3 (Data date form), Task 16 (Tests) | Data date form test |
| **REQ-12.13** (Styling properties) | All styling props available: fontSize, fontWeight, fontFamily, color, textAlign, opacity, rotation, zIndex, borderWidth, borderColor, backgroundColor, borderRadius, padding | Task 2 (Shared controls), Task 3 (Type-specific), Task 16 (Tests) | Property inventory test |
| **REQ-12.14** (Resize handles) | 8 resize handles + rotate handle per element type; min size constraints | Task 7 (Canvas resize), Task 9 (Min size utility), Task 16 (Tests) | Min size unit test; manual canvas resize check |
| **REQ-12.15** (Interaction states) | Selected, hovered, dragging, resizing, rotating, focused, locked, hidden states implemented | Task 7 (Canvas states), Task 16 (Tests) | Manual state verification |
| **REQ-12.16** (Context menu) | Desktop right-click shows z-order, duplicate, copy/paste, delete | Task 4 (Context menu), Task 16 (Tests) | Manual context menu verification |
| **REQ-12.17** (Multi-select) | Shift+click multi-select; batch actions in context menu | Task 7 (Multi-select), Task 4 (Batch context menu), Task 16 (Tests) | Manual multi-select verification |
| **REQ-12.18** (Keyboard shortcuts) | All shortcuts work: Ctrl+D, Delete, Ctrl+C/V, Z-order, Escape, Undo/Redo | Task 7 (Canvas keyboard), Task 14 (Accessibility), Task 16 (Tests) | Manual keyboard shortcut verification |
| **REQ-12.19** (GraphQL mutations) | 10 mutations: create/update/delete/duplicate/reorder/setVisibility/setLock/copy/paste/batchZIndex | Task 1 (GraphQL documents), Task 16 (Integration tests) | GraphQL integration tests |
| **REQ-12.20** (Validation) | Client + server validation with inline i18n errors; save disabled when invalid | Task 3 (Validation), Task 9 (Validation utils), Task 16 (Tests) | Validation unit tests |
| **REQ-12.21** (Zustand store) | Draft state management with dirty tracking, original snapshot, selectors | Task 8 (Store), Task 16 (Store tests) | Store unit tests |
| **REQ-12.22** (Color picker) | ChromePicker in MUI Popover; hex TextField validates; no alpha | Task 2 (ColorPickerField), Task 16 (Tests) | ColorPickerField manual verification |
| **REQ-12.23** (Font picker) | Autocomplete with font preview in own font; from ALLOWED_FONTS | Task 2 (FontPicker), Task 16 (Tests) | FontPicker manual verification |
| **REQ-12.24** (Accessibility) | WCAG AA; ARIA labels; keyboard nav; focus trap; RTL; screen reader | Task 14 (Accessibility), Task 16 | A11y audit; screen reader check; manual RTL check |
| **NFR-12.1** (Performance) | Canvas renders 60fps with 100 elements; panel updates <100ms | Task 16 (Performance test) | Lighthouse / React Profiler |
| **NFR-12.2** (i18n compliance) | All user strings use compile-time translation; EN+AR keys match | Task 12 (i18n), Task 16 (i18n tests) | Build-time type check; locale diff |
| **NFR-12.3** (Theme palette) | No hardcoded colors; all from theme.palette | Task 16 | grep for hardcoded hex/rgb |
| **NFR-12.4–12.6** (A11y details) | Labels, keyboard nav, color contrast per WCAG AA | Task 14 (Accessibility), Task 16 (Tests) | Axe-core; manual keyboard test |
| **NFR-12.7** (Loading states) | Skeleton loaders for panel content; button loading states | Task 16 | Manual check with slow network |
| **NFR-12.8** (Empty states) | Layer panel, property panel, mobile list have empty state messages | Task 3, 4, 5 (Empty states), Task 16 (Tests) | Manual check of empty props |
| **NFR-12.9** (Error states) | Inline validation errors; toast for network/permission; dialog for conflicts | Task 3 (Validation), Task 16 (Error handling tests) | Error injection tests |
| **NFR-12.10** (Interaction states) | All 9 states visually distinct per element interaction states table | Task 7 (Canvas states), Task 16 | Manual visual check per state |
| **NFR-12.11** (Optimistic locking) | expectedTemplateVersion in all mutations; conflict dialog | Task 1 (GraphQL), Task 9 (Logic), Task 16 | Concurrency logic test |
| **NFR-12.12** (Permission gating) | certificates.templates.manage gates all edit UI | Task 13 (Permissions), Task 16 | Manual verification with/without permission |
| **NFR-12.13** (Mobile/desktop isolation) | No useMediaQuery in tier files; Switcher uses ResponsiveViewSwitch | Task 3, 4, 5, 6, 7 (Tier files), Task 16 (Lint check) | grep for useMediaQuery |
| **NFR-12.14** (RTL support) | Arabic locale mirrors panels; text alignment RTL | Task 14 (RTL), Task 16 | Manual RTL check |
| **NFR-12.15** (Dark mode) | Both themes work; colors from theme.palette | Task 16 | Manual theme toggle check |

---

## Applicable AGENTS.md and Instruction Files

| File Pattern | AGENTS.md Files | Instruction Files |
|---|---|---|
| `frontend/common/views/dashboard/certificates/...` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `frontend.instructions.md` |
| `frontend/common/stores/...` | `frontend/common/stores/AGENTS.md`, `frontend/AGENTS.md` | `frontend.instructions.md` |
| `frontend/common/graphql/sharedDocuments/...` | `frontend/common/graphql/AGENTS.md`, `frontend/common/graphql/sharedDocuments/AGENTS.md`, `frontend/AGENTS.md` | `frontend.instructions.md` |
| `frontend/desktop/views/...` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `frontend.instructions.md` |
| `frontend/mobile/views/...` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `frontend.instructions.md` |
| `shared/locale/...` | `shared/AGENTS.md` | — |
| `app/(dashboard)/certificates/...` | `app/AGENTS.md` | `frontend.instructions.md` |

## Round 4 Enhancement Tasks

### R4-T1: Property Panel Scroll & Section Collapse
- [ ] Update `frontend/views/dashboard/certificates/template-editor/properties/PropertiesPanel.tsx`
  - Sticky header: `sx={{ position: 'sticky', top: 0, zIndex: 1, bgcolor: 'background.paper' }}`
  - Collapsible sections with expand/collapse all toggle button
  - Section state in localStorage: `localStorage.getItem('properties-panel-sections')`
  - Scroll-to-active: `ref.scrollIntoView({ behavior: 'smooth' })` on element select
  - Section icons: MUI v9 icons per section (format, border, shadow, transform, etc.)
  - **Quality loop**: tsgo + biome + lint

### R4-T2: Color Picker Component
- [ ] Create `frontend/views/dashboard/certificates/template-editor/properties/ColorPicker.tsx`
  - MUI v9 styled color picker with hex/rgb/hsl tabs
  - Recent colors swatch (last 10): stored in Zustand `colorPickerStore`
  - Color palette presets: Material Design colors grid (20 colors)
  - Alpha channel: MUI v9 Slider (0-100%)
  - Color contrast checker: WCAG AA (4.5:1) and AAA (7:1) badges
  - Eyedropper: `navigator.clipboard` API for hex paste + color input
  - _Store: `elementStore` adds `recentColors: string[], addRecentColor(color)`_
  - **Quality loop**: tsgo + biome + lint

### R4-T3: Gradient Picker
- [ ] Create `frontend/views/dashboard/certificates/template-editor/properties/GradientPicker.tsx`
  - Toggle: linear vs radial (MUI v9 SegmentedControl or ToggleButtonGroup)
  - Gradient stops editor: add/remove/move stops with visual track
  - Angle selector: visual dial + numeric input (0-360°)
  - Gradient presets library: 12 presets (linear gradients)
  - Gradient preview thumbnail: 60px x 30px swatch
  - CSS export: `background: linear-gradient(45deg, #ff0000, #0000ff)`
  - **Quality loop**: tsgo + biome + lint

### R4-T4: Font Family Picker
- [ ] Create `frontend/views/dashboard/certificates/template-editor/properties/FontPicker.tsx`
  - System fonts + Google Fonts + custom uploaded fonts
  - Font preview: text rendered in selected font ("The quick brown fox")
  - Font weight selector: 100/300/400/500/700/900 (availability-aware)
  - Font style: italic/oblique/normal toggle
  - Font size: visual slider (8-120px) + numeric input
  - Line-height: slider (1-3, step 0.1) + numeric input
  - Letter-spacing: slider (-5px to 10px, step 0.5px)
  - Text-transform: dropdown (none/uppercase/lowercase/capitalize)
  - Text-decoration: dropdown (none/underline/overline/line-through)
  - **Quality loop**: tsgo + biome + lint

### R4-T5: Image Crop & Resize
- [ ] Create `frontend/views/dashboard/certificates/template-editor/properties/ImageCrop.tsx`
  - Image upload with drag-drop zone (MUI v9 Card with DnD events)
  - Crop aspect ratio presets: 1:1, 4:3, 16:9, free crop
  - Crop visual handles: 8 corner + edge handles
  - Resize quality slider: JPEG quality (10-100%)
  - Image filters: brightness, contrast, saturation sliders
  - Image replacement: "Replace image" button preserves size/position
  - SVG support: detect and preserve vector format
  - **Quality loop**: tsgo + biome + lint

### R4-T6: Alignment Edge Cases
- [ ] Update `frontend/views/dashboard/certificates/template-editor/properties/AlignmentPanel.tsx`
  - Single element: align to canvas center/edges
  - 2-element: align on baseline (top/center/bottom)
  - 3+ elements: distribute horizontally/vertically with spacing
  - Grid intersection alignment
  - Alignment with rotation: consider bounding box not actual box
  - Group locking: locked groups don't participate in alignment
  - **Quality loop**: tsgo + biome + lint

### R4-T7: Z-Index Management (Layer Panel)
- [ ] Create `frontend/views/dashboard/certificates/template-editor/properties/LayerPanel.tsx`
  - Layer list: sorted by z-index descending (top layer first)
  - Drag to reorder: update z-index on drop
  - Bring forward / backward / to front / to back buttons
  - Z-index numeric input field
  - Layer visibility toggle: eye icon
  - Layer lock: lock icon (prevent editing)
  - Layer name: editable with double-click
  - _Store: `elementStore` adds `layers: LayerInfo[], reorderLayers(), toggleLayerVisibility(id), lockLayer(id)`_
  - **Quality loop**: tsgo + biome + lint

### R4-T8: Element Grouping
- [ ] Update `frontend/views/dashboard/certificates/template-editor/canvas/CanvasArea.tsx`
  - Group/ungroup: Cmd+G / Cmd+Shift+G
  - Nested groups: allow groups within groups (max 3 levels)
  - Group selection: blue dashed bounding box around group
  - Group transform: move/scale/rotate as single unit
  - Group property inheritance: children share group properties
  - Group bounding box display: show combined bounds
  - _Store: `elementStore` adds `groups: GroupInfo[], createGroup(ids), ungroup(id)`_
  - **Quality loop**: tsgo + biome + lint

### R4-T9: Opacity & Blend Modes
- [ ] Create `frontend/views/dashboard/certificates/template-editor/properties/OpacityBlend.tsx`
  - Opacity slider: MUI v9 Slider (0-100%)
  - Blend mode dropdown: normal, multiply, screen, overlay, soft-light, color-dodge, difference
  - Blend mode preview: small canvas showing effect
  - **Quality loop**: tsgo + biome + lint

### R4-T10: Shadow & Effects
- [ ] Create `frontend/views/dashboard/certificates/template-editor/properties/ShadowEditor.tsx`
  - Box shadow: x, y, blur, spread inputs + color picker
  - Text shadow: same editor, applied to text elements
  - Inner shadow: toggle switch
  - Shadow presets: 6 presets (soft, hard, glow, inset, drop, long)
  - Glow effect: colored spread shadow
  - **Quality loop**: tsgo + biome + lint

### R4-T11: Border & Corner Radius
- [ ] Create `frontend/views/dashboard/certificates/template-editor/properties/BorderEditor.tsx`
  - Border style: solid/dashed/dotted (visual preview)
  - Border width: slider (0-20px)
  - Border color: reuse ColorPicker component
  - Corner radius: individual controls for top-left, top-right, bottom-left, bottom-right
  - Corner radius visual handle: semi-transparent circles at corners
  - **Quality loop**: tsgo + biome + lint

### R4-T12: Transform Panel
- [ ] Create `frontend/views/dashboard/certificates/template-editor/properties/TransformPanel.tsx`
  - Rotation: visual dial (drag to rotate) + numeric input
  - Skew: x and y sliders (-45° to 45°)
  - Flip: horizontal/vertical toggle buttons
  - Scale: uniform lock toggle + width/height percentage inputs
  - Transform origin: 9-point grid visual selector (top-left, top-center, etc.)
  - Rotation snap: 15° increments with Shift key
  - **Quality loop**: tsgo + biome + lint

### R4-T14: Knowledge Propagation
- [ ] Create `docs/frontend/element-properties-patterns.md`
  - Update `frontend/AGENTS.md` with reference
  - Run quality checks

---

## Round 5: Advanced Fill & Stroke Tasks

> Round 5 task list for Plan 12 — the Fill Property Panel, Stroke Property Panel, gradient/pattern picker dialogs, and online gradient mesh editor. These consume the types from Plan 10 R5-T1 (`@/frontend/common/stores/cert/fillStrokeTypes`). Personal-editing workspace path prefix: `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/fill-stroke/`. Total R5 scope for Plan 12: 14 tasks (~40 hours).

### R5-T1: Fill Property Panel Foundation + Fill Type Dropdown

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/fill-stroke/FillPropertyPanel.tsx` (new)
  - Container that switches sub-components based on `fill.type`
  - Imports `SolidFillEditor`, `GradientFillEditor`, `PatternFillEditor`, `ImageFillEditor`, `GradientMeshEditor`
  - MUI v9 `sx={{}}` only — never style props; `Typography` with `sx={{ fontWeight: 600, mb: 1 }}` (no `fontWeight={600}` prop)
  - `i18n: useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` keys: `fillTitle`, `fillType`, `fillOpacity`, `fillBlendMode`, `fillToggle`
  - Receives `elementId` and reads the element's `fill` from `templateElementEditorStore.elements[elementId]`
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/fill-stroke/FillTypeDropdown.tsx` (new)
  - `interface FillTypeDropdownProps { value: FillType; onChange: (type) => void; }`
  - MUI `Select` with `MenuItem`s: None (`fillTypeNone`), Solid (`fillTypeSolid`), Linear Gradient (`fillTypeLinear`), Radial Gradient (`fillTypeRadial`), Conic Gradient (`fillTypeConic`), Pattern (`fillTypePattern`), Image (`fillTypeImage`), Gradient Mesh (`fillTypeMesh`)
  - On change, calls `fillStrokeStore.setElementType(elementId, newType)` which migrates defaults (e.g. from `'solid'` → `'linear-gradient'` initializes 2 stops at 0%/100%)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T2: Solid Fill Editor

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/fill-stroke/SolidFillEditor.tsx` (new)
  - `interface SolidFillEditorProps { elementId: string; value: SolidFillValue; onChange: (v) => void; }`
  - Color swatch (`Box sx={{ width: 40, height: 40, borderRadius: 1, backgroundColor: value.color }}`)
  - Color picker popover using MUI `Popover` + `ChromePicker` from `react-color`
  - Tabs: HSL (`solidHSLTab`), RGB (`solidRGBTab`), Hex (`solidHexTab`) — segmented `ToggleButtonGroup`
  - Opacity `Slider` (0-100), labeled with i18n `fillOpacity` — `value={value.opacity}` displays as `'{val}%'`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T3: Gradient Fill Editor Component

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/fill-stroke/GradientFillEditor.tsx` (new)
  - `interface GradientFillEditorProps { elementId: string; value: GradientValue; onChange: (v) => void; }`
  - **Gradient preview bar**: `Box sx={{ height: 24, borderRadius: 1, background: 'linear-gradient(to right, ...)' }}` — click adds stop, drag moves, double-click opens color picker
  - **Stop list** (rendered below): each stop has a color swatch, position slider, opacity slider, delete button
  - **Gradient type toggle**: segmented `ToggleButtonGroup` — Linear (`gradTypeLinear`), Radial (`gradTypeRadial`), Conic (`gradTypeConic`)
  - **Linear**: angle dial `CircularDial` (custom small component, `frontend/desktop/views/dashboard/certificates/template-editor/elements/controls/CircularDial.tsx` — create separately) + numeric input
  - **Radial**: centerX/Y sliders, radius slider, focalOffsetX/Y sliders — uses i18n keys: `gradRadialCenterX`, `gradRadialCenterY`, `gradRadialRadius`, `gradRadialFocalOffset`
  - **Conic**: centerX/Y sliders, rotation slider with `CircularDial` — uses i18n keys: `gradConicCenterX`, `gradConicCenterY`, `gradConicRotation`
  - **Reverse gradient button**: `IconButton` flips stops; calls `value.stops = [...value.stops].reverse()`
  - **On-canvas edit button**: opens the canvas overlay (sets `fillStrokeStore.gradientEditorActive = true`) — uses i18n `gradEditOnCanvas`
  - **Full editor button**: opens the `GradientEditorDialog` (R5-T12)
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/controls/CircularDial.tsx` (new)
  - SVG circular angle dial with draggable needle
  - `interface CircularDialProps { value: number; onChange: (v: number) => void; size?: number; }`
  - 0° at right, counter-clockwise to top (matching CSS gradient convention: 0deg = bottom → top)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T4: Pattern Fill Editor

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/fill-stroke/PatternFillEditor.tsx` (new)
  - `interface PatternFillEditorProps { elementId: string; value: PatternFillValue; onChange: (v) => void; }`
  - Pattern type dropdown: i18n keys `patTypeStripes`, `patTypeDots`, `patTypeCheckerboard`, `patTypeHerringbone`, `patTypeWeave`, `patTypeCustom`
  - Pattern thumbnail preview
  - Scale `Slider` (10-200%) — i18n `patScale`
  - Angle `Slider` (0-360°) — i18n `patAngle`
  - OffsetX/Y `TextField` numerics — i18n `patOffsetX`, `patOffsetY`
  - "Browse Patterns" `Button` → opens `PatternPickerDialog` (R5-T13); callback writes selected `patternType` + fulfillment
  - "Upload Custom Pattern" `Button` → opens hidden file input (PNG/JPEG/SVG)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T5: Image Fill Editor

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/fill-stroke/ImageFillEditor.tsx` (new)
  - `interface ImageFillEditorProps { elementId: string; value: ImageFillValue; onChange: (v) => void; }`
  - Image preview thumbnail (`Box sx={{ width: 80, height: 80, backgroundImage: 'url(...)', backgroundSize: 'cover', ...}}`)
  - Upload `Button` (hidden file input) — accepts PNG/JPEG; reads as `dataURL` via `URL.createObjectURL(file)` and `FileReader` — writes `value.imageUrl`
  - URL `TextField` for direct URL paste — i18n `imageFillURL`
  - Fill mode `RadioGroup`: Fill (`imageModeFill`), Fit (`imageModeFit`), Stretch (`imageModeStretch`), Tile (`imageModeTile`)
  - Opacity `Slider` (0-100) — i18n `fillOpacity`
  - PositionX/Y `TextField` numerics
  - Scale `Slider` (10-200%) — i18n `imageScale`
  - "Fit to Element" `IconButton` resets position/scale
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T6: Gradient Mesh Editor

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/fill-stroke/GradientMeshEditor.tsx` (new)
  - Mini-canvas (300x200) using HTML `<canvas>`; rendered with `meshRasterizer.ts` (Plan 11 R5-T1)
  - Mesh point grid (default 2x2 = 4 points)
  - Each mesh point rendered as a clickable crosshair; hover highlights in `theme.palette.secondary.main`
  - Click selects the point — opens the mesh point toolbar (color picker + opacity slider + position X/Y)
  - "Add point" `Button` (inserts at midway; increments `meshPoints` array)
  - "Remove point" `Button` (disabled if `meshPoints.length === 4`)
  - Smoothing `Slider` (0-100) — i18n `meshSmoothing`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T7: Fill Global Controls

- [ ] Extend `FillPropertyPanel.tsx` (modify — appends to R5-T1's container)
  - Global opacity `Slider` (0-100) — applied on top of fill-type-specific opacity
  - Blend mode `Select` with 16 modes (Normal through Luminosity) — i18n `fillBlendMode` plus per-mode keys: `bmNormal`, `bmMultiply`, `bmScreen`, `bmOverlay`, `bmDarken`, `bmLighten`, `bmColorDodge`, `bmColorBurn`, `bmHardLight`, `bmSoftLight`, `bmDifference`, `bmExclusion`, `bmHue`, `bmSaturation`, `bmColor`, `bmLuminosity`
  - Fill on/off `Switch` — disables fill rendering on canvas but preserves settings on element
  - All controls use MUI v9 `sx={{}}` (no style props)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T8: Stroke Property Panel Foundation + Stroke Layer Editor

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/fill-stroke/StrokePropertyPanel.tsx` (new)
  - Container for stroke controls
  - Stroke on/off `Switch` — i18n `strokeToggle`
  - Renders `StrokeLayerEditor` for the active stroke layer (selected from `StrokeLayersList` if multi-stroke)
  - i18n keys: `strokeTitle`, `strokeType`, `strokeWidth`, `strokeOpacity`, `strokePosition`, `strokeStyle`, `strokeCap`, `strokeJoin`, `strokeMiterLimit`, `strokeDash`, `strokeGap`, `strokeDashOffset`, `strokeAlignment`, `strokeBlendMode`
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/fill-stroke/StrokeTypeDropdown.tsx` (new)
  - Options: None (`strokeTypeNone`), Solid (`strokeTypeSolid`), Gradient (`strokeTypeGradient`), Pattern (`strokeTypePattern`)
  - Gradient stroke opens an inline mini-gradient editor (similar to `GradientFillEditor`)
  - Pattern stroke opens a pattern-type dropdown + scale
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T9: Stroke Layer Editor (per-layer controls)

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/fill-stroke/StrokeLayerEditor.tsx` (new)
  - `interface StrokeLayerEditorProps { layer: StrokeLayerValue; onChange: (v) => void; }`
  - Color swatch + color picker (same `ChromePicker` popover as SolidFillEditor)
  - Width `Slider` (0-50) + `TextField` numeric — i18n `strokeWidth`
  - Position `ToggleButtonGroup` (segmented): Inside (`strokePosInside`), Center (`strokePosCenter`), Outside (`strokePosOutside`) with per-option icons (Inside: ingrown arrow, Center: middle line, Outside: outward arrow)
  - Opacity `Slider` (0-100) — i18n `strokeOpacity`
  - Style `ToggleButtonGroup`: Solid (`strokeStyleSolid`), Dashed (`strokeStyleDashed`), Dotted (`strokeStyleDotted`)
  - Custom dash controls (visible when style = 'dashed' or 'custom'): dash length `TextField`, gap length `TextField`, dash offset `TextField`
  - Cap `ToggleButtonGroup` with icons: Butt, Round, Square (icons in `frontend/desktop/views/dashboard/certificates/template-editor/elements/icons/StrokeCapIcons.tsx` — new file)
  - Join `ToggleButtonGroup` with icons: Miter, Round, Bevel (icons in `StrokeJoinIcons.tsx` — new file)
  - Miter limit `TextField` (1-20) — visible only when `join = 'miter'`
  - Blend mode `Select` (16 modes — same options as FillGlobalControls)
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/icons/StrokeCapIcons.tsx` (new)
  - 3 SVG `Icon` components ( Butt: flat-end line; Round: half-circle end; Square: square-end sticking beyond line)
- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/icons/StrokeJoinIcons.tsx` (new)
  - 3 SVG `Icon` components ( Miter: sharp corner; Round: rounded corner; Bevel: cut corner)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T10: Stroke Layers List (Multi-Stroke)

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/fill-stroke/StrokeLayersList.tsx` (new)
  - List of stroke layer rows (max 5 layers)
  - Each row: reorder drag handle (`@dnd-kit/sortable` `SortableContext`), layer thumbnail (stroke swatch), width label, visibility `IconButton` (toggle), delete `IconButton`
  - "Add Layer" `Button` at bottom — disabled at 5 layers
  - Selecting a row sets `templateElementEditorStore.activeStrokeLayerIndex`
  - Reordering updates `stroke.layers` array
  - Deleting removes the layer at its index; if 1 layer remains, multi-stroke mode auto-disables
  - Implements dnd-kit `DndContext` + `SortableContext` for horizontal drag
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T11: Gradient Editor Dialog

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/dialogs/GradientEditorDialog.tsx` (new)
  - Modal `Dialog` with 600x400 layout
  - **Large gradient preview bar** (400px wide) at top — click adds stop, drag moves stop, double-click opens color picker
  - **Stop list** below the bar: each stop has position `Slider` (0-100), color swatch + picker, opacity `Slider` — actions remove stop
  - **Gradient type toggle**: Linear/Radial/Conic segmented
  - **Gradient angle dial** (`CircularDial` from R5-T3) + numeric input
  - **Radial controls** (visible only when type=radial): centerX/Y sliders, radius slider, focal point X/Y sliders
  - **Conic controls** (visible only when type=conic): centerX/Y sliders, rotation slider with dial
  - **Save as preset**: `TextField` for preset name + `Button` → saves to `fillStrokeStore.gradientPresets` (max 50 presets, oldest FIFO)
  - **Preset library**: `Grid` with preset thumbnails (click to apply); side panel with delete preset `IconButton`, hover preview
  - **Import**: `TextField` for CSS gradient string + "Import" `Button`
  - **Export**: a read-only `TextField` showing CSS string + "Copy" `IconButton` (writes to clipboard)
  - **CSS import/export**: `cssToGradient(css)` and `gradientToCss(grad)` utilities in `frontend/common/stores/cert/fillStrokeUtils.ts` (extend Plan 10 T2)
  - **Actions**: Cancel / Apply (`Button` with onClick closing dialog and emitting `onChange`)
  - i18n keys: `gradEditorDialogTitle`, `gradEditorPreview`, `gradEditorStopPosition`, `gradEditorStopColor`, `gradEditorStopOpacity`, `gradEditorAngle`, `gradEditorType`, `gradEditorRadial`, `gradEditorConic`, `gradEditorSavePreset`, `gradEditorPresetName`, `gradEditorPresetLibrary`, `gradEditorImportCss`, `gradEditorExportCss`, `gradEditorCancel`, `gradEditorApply`, `gradEditorAddPreset`, `gradEditorDeletePreset`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T12: Pattern Picker Dialog

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/dialogs/PatternPickerDialog.tsx` (new)
  - Modal `Dialog` with 700x500 layout
  - **Category tabs**: Basic (`patCatBasic`), Geometric (`patCatGeometric`), Organic (`patCatOrganic`), Custom (`patCatCustom`) — `ToggleButtonGroup` or `Tabs`
  - **Pattern grid**: 6 columns, each tile shows tiling preview (50x50 swatch with `background-image: url(libraryEntry.svg)` and `background-repeat: repeat`)
  - **Search `TextField`** at top (filters by name)
  - **Custom upload `Button`** (PNG/JPG/SVG up to 500KB) — headers to `dataURL`, stored in `fillStrokeStore.customPatternLibrary` (max 20 patterns)
  - **Pattern info**: when a pattern selected, displays name, repeat type (Square/Hex/Custom), dimensions
  - **Apply / Cancel** `Button` actions
  - i18n keys: `patPickerDialogTitle`, `patPickerSearch`, `patPickerUpload`, `patPickerGrid`, `patPickerInfoName`, `patPickerInfoRepeat`, `patPickerInfoSize`, `patPickerApply`, `patPickerCancel`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T13: TemplateElementEditorStore Additions

- [ ] Extend `frontend/common/stores/cert/templateElementEditorStore.ts` (modify)
  - `activeStrokeLayerIndex: number` (default 0)
  - `setActiveStrokeLayerIndex: (idx: number) => void`
  - `fillStrokeExpanded: boolean` — whether the fill/stroke accordion section is open
  - `setFillStrokeExpanded: (val: boolean) => void`
  - `activeFillEditorType: 'solid' | 'gradient' | 'pattern' | 'image' | 'mesh' | null` — tracks which sub-editor is currently focused; needed for toolbar/shortcut coordination
  - `setActiveFillEditorType: (type) => void`
  - `activeStrokeEditorType: 'solid' | 'gradient' | 'pattern' | null`
  - `setActiveStrokeEditorType: (type) => void`
  - All non-persisted by default (not in `persistOptions.partialize`)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T14: Plan 12 R5 Test Suite + Knowledge Propagation

- [ ] Create `test/unit/fillStrokeUtils.test.ts` (new)
  - Test: `cssToGradient` parses linear, radial, conic strings (multiple variants)
  - Test: `gradientToCss` outputs valid CSS gradient strings
  - Test: Round-trip from gradient → CSS → gradient preserves identity (formatting-wise)
  - Test: `strokeToSvgAttrs` correctly serializes dash/round/butt/join/miterlimit values
  - Test: `setElementType(elementId, 'linear-gradient')` migrates to default 2-stop gradient at 0%/100% with theme `palette.primary.dark` → `palette.primary.light`
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Update `frontend/IMPLEMENTATION_LEARNINGS.md` (append)
  - Pattern: extended panels follow the "sub-component composition" pattern (used throughout Plan 12) — each fill sub-type has its own editor component, parent `FillPropertyPanel` switches on `fill.type`. This is the Plan 12 equivalent of Plan 11's `<use>` rendering strategy.
  - Pattern: `@dnd-kit/sortable` reorder needs `uniqueId` stable per layer; UUIDs must be assigned by `setElementType` migration (otherwise reorder fails silently)
  - Gotcha: MUI `RadioGroup`/`ToggleButtonGroup` require string values even for booleans — use `'true'/'false'` and translate in handler
  - Pattern: `ChromePicker` from `react-color` is the only stable external color picker for 2025 — MUI v9 has no native equivalent. It is devDependency only.
- [ ] Update `frontend/COMPONENT_PATTERNS.md` (append)
  - Pattern: "Multi-Layer Editor" — StrokeLayersList + StrokeLayerEditor, mirroring Photoshop's Stroke layer-style stacking
  - Pattern: "Modal Gradient/Pattern Picker Dialog" with shared preview-list structure
  - Pattern: "CircularDial Icon" — reusable SVG dial component for angles (gradient/pattern)
- [ ] **Quality loop**: tsgo + biome + lint queue client

### Instruction File & AGENTS.md Discovery (Round 5 Append, Plan 12)

| Task | Files Created/Modified | AGENTS.md to Read | Instructions to Read |
|---|---|---|---|
| R5-T1 | `panels/fill-stroke/FillPropertyPanel.tsx`, `panels/fill-stroke/FillTypeDropdown.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T2 | `panels/fill-stroke/SolidFillEditor.tsx` | same | same |
| R5-T3 | `panels/fill-stroke/GradientFillEditor.tsx`, `controls/CircularDial.tsx` | same | same |
| R5-T4 | `panels/fill-stroke/PatternFillEditor.tsx` | same | same |
| R5-T5 | `panels/fill-stroke/ImageFillEditor.tsx` | same | same |
| R5-T6 | `panels/fill-stroke/GradientMeshEditor.tsx` | same | same |
| R5-T7 | `panels/fill-stroke/FillPropertyPanel.tsx` (modify — extends T1) | same | same |
| R5-T8 | `panels/fill-stroke/StrokePropertyPanel.tsx`, `panels/fill-stroke/StrokeTypeDropdown.tsx` | same | same |
| R5-T9 | `panels/fill-stroke/StrokeLayerEditor.tsx`, `icons/StrokeCapIcons.tsx`, `icons/StrokeJoinIcons.tsx` | same | same |
| R5-T10 | `panels/fill-stroke/StrokeLayersList.tsx` | same | same |
| R5-T11 | `dialogs/GradientEditorDialog.tsx` | same | same |
| R5-T12 | `dialogs/PatternPickerDialog.tsx` | same | same |
| R5-T13 | `frontend/common/stores/cert/templateElementEditorStore.ts` (modify) | `frontend/common/stores/AGENTS.md` (if exists) or `frontend/stores/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T14 | `test/unit/fillStrokeUtils.test.ts`, `frontend/IMPLEMENTATION_LEARNINGS.md` (append), `frontend/COMPONENT_PATTERNS.md` (append) | `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/tests.instructions.md`, `.agents/instructions/frontend.instructions.md` |

### Round 5 Execution Order (Plan 12)

```
Phase R5-A (sequential): R5-T1 (FillPropertyPanel + FillTypeDropdown — depends on Plan 10 R5-T1 types being committed)
Phase R5-B (parallel): R5-T2 SolidFillEditor, R5-T3 GradientFillEditor + CircularDial, R5-T4 PatternFillEditor, R5-T5 ImageFillEditor, R5-T6 GradientMeshEditor — all wait on T1 done
Phase R5-C (sequential): R5-T7 (FillGlobalControls — modifies T1's FillPropertyPanel) — waits on T1's first commit done
Phase R5-D (sequential): R5-T8 (StrokePropertyPanel + TypeDropdown — can start in parallel with R5-B/T2-T6 since stroke panel is fundamentally disjoint from fill panel)
  ^ actually: R5-D is parallel with R5-B (no shared files with fill sub-editors)
Phase R5-E (sequential after T8): R5-T9 (StrokeLayerEditor + Cap/Join icons)
Phase R5-F (sequential after T9): R5-T10 (StrokeLayersList — imports StrokeLayerEditor)
Phase R5-G (parallel after all above): R5-T11 (GradientEditorDialog), R5-T12 (PatternPickerDialog)
  ^ both dialogs are independent of each other; both depend on FillPropertyPanel having sub-editors ready
Phase R5-H (parallel): R5-T13 (store additions) — can run any time before R5-T14
Phase R5-I (sequential after all above): R5-T14 (test suite + knowledge propagation)
```

**Plan 12 R5 total estimated time**: ~40 hours (~18 wall-clock hours via parallel for R5-B, R5-D/E/F, R5-G)

### Plan 12 Combined Total Time (Rounds 1-5)

- Rounds 1-3: ~36 hours → ~20 wall-clock hours
- Round 4: ~24 hours → ~14 wall-clock hours
- Round 5 (R5-T1 through R5-T14): ~40 hours → ~18 wall-clock hours with R5 parallelism
- **Plan 12 total**: ~100 hours → ~52 wall-clock hours.

> All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks (tsgo → biome → lint → codescene). The lint queue server must be running before any lint call. See `AGENTS.md` §"Lint Queue Server" for startup commands.

## Round 5: Color System Tasks

> Round 5 task list for Plan 12 — the advanced Color Picker Dialog, Color Harmony Engine, Swatches Panel, CMYK Print Preview, and Color Profile Management. These consume the shared types from Plan 10 R5-CS (`@/frontend/common/stores/cert/colorSystemTypes.ts`) and the store from Plan 10 R5-CS (`colorSystemStore`). Workspace path prefix: `frontend/desktop/views/dashboard/certificates/template-editor/elements/dialogs/color/` and `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/swatches/`. Total R5-CS scope for Plan 12: 14 tasks (~36 hours).

### R5-CS-T1: Color Conversion Utilities

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/utils/colorConversionUtils.ts` (new)
  - Pure functions: `hexToRGB`, `rgbToHex`, `hexShorthandToFull`, `rgbToHSL`, `hslToRGB`, `rgbToHSV`, `hsvToRGB`, `rgbToCMYK`, `cmykToRGB`, `hexToRgba`, `hexToHSL`, `hslToHex`, `rotateHue`, `adjustLightness`, `adjustSaturation`, `isOutOfGamut`, `clamp`
  - All conversion math adheres to standard color space formulas (HSL/HSV per W3C CSS Color spec; CMYK per ICC SWOP v2 conversion)
  - No React, no side effects — pure module importable from anywhere
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Create `test/unit/colorConversionUtils.test.ts` (new)
  - Snapshot known color conversions (red, green, blue, white, black, mid-gray)
  - Round-trip tests: `rgbToHSL` → `hslToRGB` preserves value within ±1 tolerance
  - Shorthand expansion: `#F0A` → `#FF00AA`
  - Out-of-gamut detection for known RGB values that exceed SWOP CMYK gamut (e.g. saturated blue)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T2: Color Picker 2D Area Component (HSL + HSV)

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/dialogs/color/ColorPicker2DArea.tsx` (new)
  - Canvas-based 2D saturation/lightness (HSL) or saturation/value (HSV) picker
  - `interface ColorPicker2DAreaProps { hue: number; saturation: number; lightnessOrValue: number; areaMode: 'saturation-lightness' | 'saturation-value'; onChange: (s: number, lv: number) => void; size?: number; }`
  - Mouse drag — `onMouseDown` + `onMouseMove` (window listener) + `onMouseUp`
  - Marker is a separate absolutely-positioned `Box` (not canvas-redraw) for smooth dragging
  - Canvas repaints only when `hue` changes — `useMemo` keyed on `[hue, areaMode, size]`
  - MUI v9: `sx={{ width: 220, height: 220, borderRadius: 1, border: '1px solid', borderColor: 'divider', cursor: 'crosshair' }}` — no style props
  - i18n: `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` keys: `colorPicker.hsl.saturation`, `colorPicker.hsl.lightness`, `colorPicker.hsv.value`
  - Keyboard: arrow keys move marker by 1% (5% with Shift) — `tabindex={0}`, `role="slider"`, `aria-label={t("colorPicker.2dArea")}`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T3: Hue Slider Ring Component

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/dialogs/color/HueSliderRing.tsx` (new)
  - Vertical MUI v9 `Slider` (0-360°, orientation="vertical", height 220px) with rainbow gradient rail
  - `interface HueSliderRingProps { hue: number; onChange: (h: number) => void; }`
  - Rainbow gradient via `sx={{ '& .MuiSlider-rail': { background: 'linear-gradient(to top, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' } }}` (no hardcoded hex outside the slider rainbow — this is the color spectrum primitive, not theme palette)
  - `aria-label={t("certificateTemplateEditor.colorPicker.hsl.hue")}`, `aria-valuetext={`${hue}°`}`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T4: Color Picker Dialog Skeleton (Mode Tabs + Alpha + Preview Split)

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/dialogs/color/ColorPickerDialog.tsx` (new)
  - `interface ColorPickerDialogProps { open: boolean; initialColor: ColorValue; previousColor: ColorValue | null; colorContext: ColorPickerContext; onConfirm: (c: ColorValue) => void; onCancel: () => void; rememberMode: boolean; }`
  - MUI `Dialog` (maxWidth="md"), `DialogTitle` shows `t(\`certificateEditor.colorPicker.context.${colorContext}\`)` — context-aware label
  - `Tabs` component: HSL, RGB, HSV, HEX, CMYK — full width
  - Mode persistence via `localStorage` key `"certEditor.colorPicker.mode"` (set by `rememberMode` prop)
  - `AlphaSlider` always visible at bottom
  - `ColorPreviewSplit` shows new vs old color with checkerboard transparency pattern
  - i18n: `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` — keys under `colorPicker.*`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T5: RGB Mode Inputs + HSV Mode Inputs

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/dialogs/color/RGBInputs.tsx` (new)
  - Three `Slider`+`TextField` pairs (R, G, B), each 0-255
  - Each slider rail shows visual gradient: `linear-gradient(to right, rgb(0,g,b), rgb(255,g,b))` for R channel, etc.
  - `sx={{ '& .MuiSlider-rail': { background: gradientString }, '& .MuiSlider-track': { display: 'none' } }}`
  - `TextField` is an adjacent numeric input (size="small", width 64)
  - i18n keys: `colorPicker.rgb.r`, `colorPicker.rgb.g`, `colorPicker.rgb.b`
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/dialogs/color/HSVInputs.tsx` (new)
  - Three `Slider`+`TextField` pairs: Hue (0-360°), Saturation (0-100%), Value (0-100%)
  - Visual gradient on each track (hue: rainbow; saturation: gray→color at current hue; value: color→black)
  - i18n keys: `colorPicker.hsv.hue`, `colorPicker.hsv.saturation`, `colorPicker.hsv.value`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T6: HEX Input + CMYK Inputs

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/dialogs/color/HEXInput.tsx` (new)
  - Two `TextField`s: full hex (`#RRGGBB`) and shorthand (`#RGB`)
  - Full hex validation: `/^#?[0-9A-Fa-f]{6}$/` — strips/dedupes leading `#`, normalizes to uppercase
  - Shorthand validation: `/^#?[0-9A-Fa-f]{3}$/` — expands `#F0A` → `#FF00AA`
  - On invalid input: `error={true}` on TextField + helper text `t("certificateTemplateEditor.colorPicker.hexInvalid")`
  - Color updates on `onBlur` (not `onChange`) so partial typing doesn't error
  - Small 40×40 color swatch preview below hex field, `sx={{ width: 40, height: 40, borderRadius: 1, border: '1px solid', borderColor: 'divider', backgroundColor: \`#${hex}\` }}`
  - i18n keys: `colorPicker.hex`, `colorPicker.hexShorthand`, `colorPicker.hexInvalid`
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/dialogs/color/CMYKInputs.tsx` (new)
  - Four labeled `Slider`+`TextField` pairs: C, M, Y, K (each 0-100%)
  - Each slider rail visual gradient: `linear-gradient(to right, cmykToHex(0, m, y, k), cmykToHex(100, m, y, k))` etc
  - `Select` dropdown for target CMYK profile: "U.S. Web Coated (SWOP) v2" (default), "Coated FOGRA39", "Japan Color 2001 Coated", "U.S. Sheetfed Coated v2"
  - `Typography` helper text: `t("certificateTemplateEditor.colorPicker.cmyk.printPreviewNotice")` — `sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem', mt: 1 }}`
  - i18n keys: `colorPicker.cmyk.c`, `.m`, `.y`, `.k`, `.printPreviewNotice`, `.profile`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T7: Alpha Slider + Color Preview Split + Color History

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/dialogs/color/AlphaSlider.tsx` (new)
  - Horizontal `Slider` (0-100%, full width), with checkerboard pattern in rail showing transparency
  - Track gradient: `linear-gradient(to right, transparent, hexToRgba(color.hex, 1))`
  - Adjacent `TextField` (size="small", type="number", max 100) for precise entry
  - Checkerboard preview swatch below the slider showing color at current alpha — uses `CHECKERBOARD_PATTERN` constant
  - `aria-label={t("certificateTemplateEditor.colorPicker.alpha")}`, `aria-valuetext={`${value}%`}`
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/dialogs/color/ColorPreviewSplit.tsx` (new)
  - Split swatch: left = old color, right = new color with checkerboard behind both
  - `interface ColorPreviewSplitProps { newColor: ColorValue; oldColor: ColorValue | null; }`
  - When `oldColor` is null, left half shows checkerboard only
  - Pinch divider line at center: `sx={{ position: 'absolute', left: '50%', width: 1, backgroundColor: theme.palette.divider }}`
  - Labels "Old"/"New" below: `t("colorPicker.previewOld")`, `t("colorPicker.previewNew")`
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/dialogs/color/ColorHistorySwatches.tsx` (new)
  - Wrappable `Stack` of color swatch `ColorSwatchTile` components, max 20
  - Reads history from `colorSystemStore.colorHistory` via `useShallow`
  - On swatch click → `onPick(color)` callback
  - i18n label: `colorPicker.history`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T8: Color Harmony Section

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/dialogs/color/ColorHarmonySection.tsx` (new)
  - `interface ColorHarmonySectionProps { baseColor: ColorValue; scheme: HarmonyScheme; onSchemeChange: (s: HarmonyScheme) => void; onPickColor: (c: ColorValue) => void; onSaveToSwatches: (group: HarmonyColor[]) => void; }`
  - `Select` dropdown with 7 options: complementary, analogous, triadic, tetradic, splitComplementary, monochromatic, square
  - Uses `computeHarmony(baseColor, scheme)` from `colorHarmonyUtils.ts`
  - Harmony swatches rendered as `ColorSwatchTile` (size="medium") — base color tile highlighted (`sx={{ outline: \`2px solid ${theme.palette.primary.main}\` }}`)
  - `useMemo` keyed on `[baseColor.hex, scheme]` — recomputes on color/scheme change only
  - "Apply all to swatches" `Button`: calls `colorSystemStore.addSwatchGroup(name, harmonyColors)` with auto-generated name e.g. `Complementary 2025-08-02`
  - i18n keys: `colorPicker.harmony.complementary` through `.square`, `colorPicker.harmony.applyToSwatches`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T9: Swatches Panel (Plan 12 portion — Properties panel section)

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/swatches/SwatchesPanel.tsx` (new)
  - `CollapsiblePanelShell` section (`sectionId="swatches"`) with `PaletteOutlined` icon
  - Three tabs: Document, Custom, Recent
  - `SwatchDisplaySizeToggle` (Small/Medium/Large: 16px/24px/32px) — `ToggleButtonGroup`
  - `DocumentSwatchesGrid`: scans all element fills/strokes via `templateElementEditorStore.elements`, memoized
  - `CustomSwatchesGrid`: reads `colorSystemStore.customSwatches`, persisted in `localStorage["certEditor.customSwatches"]`
  - `RecentSwatchesGrid`: reads `colorSystemStore.colorHistory.slice(0, 10)`
  - Import `Button` (accepts `.ase`, `.aco`, `.json` via hidden `<input>`)
  - Export `Button` (saves as `.json` primary, `.ase` alternative)
  - Preset palettes `Select`: `presetMaterial`, `presetPantone`, `presetWebStandard`, `presetCustom`
  - i18n keys: `swatches.*` namespace (`useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)`)
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/swatches/ColorSwatchTile.tsx` (new)
  - `interface ColorSwatchTileProps { color: ColorValue; size: 'small' | 'medium' | 'large'; isBase?: boolean; onClick?: () => void; onDoubleClick?: () => void; onDelete?: () => void; onEdit?: () => void; tooltip?: string; }`
  - Sizes map to 16/24/32px width
  - Renders color swatch `Box` with checkerboard behind (for alpha)
  - `role="button"`, `tabindex={0}`, `aria-label={tooltip || color.hex}`
  - Right-click `Menu` with "Edit", "Delete", "Duplicate" (only custom swatches have delete)
  - `Tooltip` shows hex + alpha on hover
  - Base color swatch gets outline: `sx={{ outline: isBase ? \`2px solid ${theme.palette.primary.main}\` : 'none' }}`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T10: Color Profile Indicator + Gamut Warning

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/dialogs/color/ColorProfileIndicator.tsx` (new)
  - MUI `Chip` showing active profile name ("sRGB" / "Adobe RGB" / "CMYK preview")
  - `onClick` opens `Menu` with 3 `MenuItem`s; on select calls `colorSystemStore.setActiveProfile(profile)`
  - `Tooltip`: `t("certificateTemplateEditor.colorProfile.tooltip")`
  - i18n keys: `colorProfile.sRGB`, `colorProfile.adobeRGB`, `colorProfile.cmykPreview`
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/dialogs/color/GamutWarning.tsx` (new)
  - Renders `WarningAmberOutlined` + caption when `isOutOfGamut(color, 'CMYK')` is true
  - `Tooltip` with detailed explanation: `t("certificateTemplateEditor.colorPicker.gamutWarning")`
  - `sx={{ color: theme.palette.warning.main }}` (no hardcoded colors)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T11: Harmonize Existing Fill/Stroke Editors with Color Picker Dialog

- [ ] Modify `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/fill-stroke/SolidFillEditor.tsx` (existing)
  - Replace `ChromePicker` popover import with `ColorPickerDialog` import (the dialog is opened with `colorContext='fill'`)
  - On color swatch click → calls `useTemplateElementEditorStore.openColorPicker('fill', currentColor)`
  - Honor `colorPickerOpen` store property — reads new color from store on confirm
  - Keep existing "Tab: HSL/RGB/Hex" tabbed UI as fallback but route full color picker to the new dialog
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Modify `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/fill-stroke/GradientFillEditor.tsx` (existing)
  - Stop double-click handlers route to `ColorPickerDialog` with `colorContext='gradientStop'`
  - `initialColor` = stop's color, `previousColor` = the color before double-click (capture at mousedown)
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Modify any shadow editor that exists in element properties to route color selection through `ColorPickerDialog` with `colorContext='shadow'`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T12: TemplateElementEditorStore Additions for Color Picker

- [ ] Modify `frontend/common/stores/certificates/templateElementEditorStore.ts` (existing) — append color system state
  - New state fields: `activeColorContext: ColorPickerContext`, `colorPickerOpen: boolean`, `colorPickerColor: ColorValue | null`, `colorPickerPreviousColor: ColorValue | null`
  - New actions: `setActiveColorContext(ctx)`, `openColorPicker(ctx, initial)`, `closeColorPicker()`
  - The `openColorPicker` action captures the current element's fill/stroke solid color as `previousColor` before storing `initial`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T13: i18n Keys — Color System (Plan 12 portion)

- [ ] Modify `shared/locale/types/dashboard/certificates/templateEditor.ts` — add `colorPicker`, `swatches`, `colorProfile` fields per §R5-CS15 spec
  - Append to existing `TemplateEditorLabels` interface
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Modify `shared/locale/en/dashboard/certificates/templateEditor.ts` — add EN translations for colorPicker, swatches, colorProfile
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Modify `shared/locale/ar/dashboard/certificates/templateEditor.ts` — add AR translations
  - All Arabic strings reviewed by native speaker
  - `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` keys remain identical (translate values only)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T14: Plan 12 R5 Color System Test Suite + Knowledge Propagation

- [ ] Update `frontend/IMPLEMENTATION_LEARNINGS.md` (append-only) — note gotchas:
  - The 2D area must NOT redraw canvas on marker drag (only on hue change) for performance
  - Lossless mode switching requires `{ hex, alpha }` as canonical; derived views (HSL/RGB) are display-only
  - CMYK mode does not affect the stored color — only the displayed numbers
- [ ] Update `frontend/COMPONENT_PATTERNS.md` (append-only) — pattern for swatch grids, color picker dialog
- [ ] Run all quality checks: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per file
  - **Quality loop**: tsgo + biome + lint queue client

### Round 5 Color System Execution Order (Plan 12)

```
Phase R5-CS-A (sequential): R5-CS-T1 (color conversion utils — everything else imports from here)
Phase R5-CS-B (parallel): R5-CS-T2 (2D area), R5-CS-T3 (hue slider), R5-CS-T5 (RGB+HSV inputs), R5-CS-T6 (HEX+CMYK inputs), R5-CS-T7 (alpha+preview+history) — all wait on T1
Phase R5-CS-C (parallel): R5-CS-T8 (harmony section — waits on T1 for utils), R5-CS-T10 (profile+gamut — waits on T1) — all wait on T1
Phase R5-CS-D (sequential): R5-CS-T4 (ColorPickerDialog — waits on T2, T3, T5, T6, T7, T8, T10 to import them)
Phase R5-CS-E (parallel): R5-CS-T9 (swatches panel + ColorSwatchTile — independent of T4), R5-CS-T12 (store additions — independent of T4)
Phase R5-CS-F (sequential): R5-CS-T11 (harmonize SolidFillEditor/GradientFillEditor with dialog — waits on T4 and T12 to use the dialog+store)
Phase R5-CS-G (sequential): R5-CS-T13 (i18n keys — waits on all UI components to surface which keys are actually used)
Phase R5-CS-H (sequential): R5-CS-T14 (tests + knowledge propagation — waits on all of the above)
```

**Plan 12 R5-CS total estimated time**: ~36 hours (~18 wall-clock hours via parallel phases R5-CS-B, R5-CS-C, R5-CS-E)

### Plan 12 Combined Total Time (Rounds 1-5 — Color System)

- Rounds 1-3: ~30 hours → ~18 wall-clock hours
- Round 4: ~20 hours → ~12 wall-clock hours
- Round 5 (R5-T1 through R5-T14 advanced fill/stroke): ~40 hours → ~20 wall-clock hours
- Round 5 (R5-CS-T1 through R5-CS-T14 color system): ~36 hours → ~18 wall-clock hours
- **Plan 12 total**: ~126 hours → ~68 wall-clock hours with R5 parallelism.

> All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks (tsgo → biome → lint → codescene). The lint queue server must be running before any lint call. See `AGENTS.md` §"Lint Queue Server" for startup commands.

## Round 5: Snap & Align Tasks — Plan 12

This is the **fourth** Round 5 task domain in Plan 12 (following Fill/Stroke R5, Pen Tool R5, Effects R5). Tasks cover **right-panel property UI only** — toolbar/View-menu (Plan 10), engine & overlay (Plan 11). Plan 12 panels call Plan 11's store actions directly and import Plan 10's canonical types.

### Instruction-file & AGENTS.md discovery

| File | Instruction files | AGENTS.md files |
|---|---|---|
| `frontend/views/dashboard/cert/templates/editor/properties/AlignPanel.tsx` | `frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root |
| `frontend/views/dashboard/cert/templates/editor/properties/DistributePanel.tsx` | same | same |
| `frontend/views/dashboard/cert/templates/editor/properties/SpacingControls.tsx` | same | same |
| `frontend/views/dashboard/cert/templates/editor/properties/MatchSizePanel.tsx` | same | same |
| `frontend/views/dashboard/cert/templates/editor/properties/SnapSettingsSubPanel.tsx` | same | same |
| `frontend/views/dashboard/cert/templates/editor/properties/RightPanelTabs.tsx` (edit) | same | same |
| `frontend/common/stores/templateElementEditorStore.ts` (edit) | (none — store) | `frontend/stores/AGENTS.md`, `frontend/AGENTS.md`, root |
| `shared/locale/en/.../templateEditor.ts` (edit) | `frontend.instructions.md` | `shared/AGENTS.md`, root |
| `shared/locale/ar/.../templateEditor.ts` (edit) | same | same |

### Execution order (Plan 12 contribution to Snap & Align)

| Phase | Task IDs | Files | Dependencies |
|---|---|---|---|
| R5S-A (Store) | R5S-T1 | `templateElementEditorStore.ts` edit | Plan 11 R5S-T6 (useCanvasStore actions) |
| R5S-B (Tabs) | R5S-T2 | `RightPanelTabs.tsx` edit | R5S-T1 |
| R5S-C (Panels) | R5S-T3–R5S-T6 | `AlignPanel.tsx`, `DistributePanel.tsx`, `SpacingControls.tsx`, `MatchSizePanel.tsx` | R5S-T1, R5S-T2, Plan 10 R5S-T1 (types), Plan 11 R5S-T6 (actions) |
| R5S-D (Settings sub-panel) | R5S-T7 | `SnapSettingsSubPanel.tsx` | R5S-T1, Plan 10 R5S-T5 (SnapSettings type & defaults) |
| R5S-E (i18n) | R5S-T8 | `shared/locale/.../templateEditor.ts` (en + ar) | All panel components landed |

*Total estimated time*: ~14h (with parallelism ~6h wall-clock).

### Tasks

- [ ] **R5S-T1: Extend `templateElementEditorStore` with Snap & Align panel UI state**
  - **File**: `frontend/common/stores/templateElementEditorStore.ts` (edit)
  - **Additions**:
    - State fields: `alignTarget: AlignTarget` (default `'selection'`), `distributeFrom: DistributeFrom` (default `'edge'`), `distributeGap: number` (default `20`), `matchSizeReferenceKind: 'first' | 'key' | 'largest' | 'smallest'` (default `'first'`), `matchSizeScope: 'width' | 'height' | 'both'` (default `'both'`), `keyObjectId: string | null` (mirror of `useCanvasStore.keyObjectId`).
    - Actions: `setAlignTarget(target)`, `setDistributeFrom(from)`, `setDistributeGap(px)`, `setMatchSizeReferenceKind(kind)`, `setMatchSizeScope(scope)`, `setKeyObjectMirrored(id)` (delegates to `useCanvasStore.setKeyObject`).
    - Subscribe-to-canvas-store bridge: use `subscribeWithSelector` to mirror `useCanvasStore.keyObjectId` into `templateElementEditorStore.keyObjectId` on every change (read-only subscriber).
  - **Imports**: types from `@/frontend/common/stores/cert/snapAlignTypes`.
  - **No hardcoded values** — defaults come from `DEFAULT_SNAP_SETTINGS` where applicable.
  - **Quality loop**: tsgo → biome → lint → codescene (progressive, short-circuits on first failure)
    ```bash
    bun run scripts/health/sub-loop.ts frontend/common/stores/templateElementEditorStore.ts --lifecycle codescene
    ```

- [ ] **R5S-T2: Add `'align'` tab to `RightPanelTabs`**
  - **File**: `frontend/views/dashboard/cert/templates/editor/properties/RightPanelTabs.tsx` (edit)
  - **Additions**:
    - New tab after `'transform'`: icon `VerticalAlignCenterOutlined`, label `i18n('rightPanel.tabs.align')`.
    - The panel header always renders (so user has snap settings affordance from any selection state).
    - Pass `alignTarget`, `distributeFrom`, `distributeGap`, `matchSizeReferenceKind`, `matchSizeScope`, `keyObjectId` from the panel store down to sub-panels.
  - **Quality loop**: tsgo → biome → lint → codescene (progressive, short-circuits on first failure)
    ```bash
    bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/properties/RightPanelTabs.tsx --lifecycle codescene
    ```

- [ ] **R5S-T3: Create `AlignPanel.tsx`**
  - **File**: `frontend/views/dashboard/cert/templates/editor/properties/AlignPanel.tsx` (new)
  - **Implements** §R5S.1 of Plan 12 design:
    - Align-To radio group (4 options: selection / canvas / first selected / key object).
    - 2-row × 3-col grid of `IconButton` (6 align actions).
    - Disabled state when `selectedElementIds.length < 2` AND `alignTarget !== 'canvas'`.
    - All colors from `theme.palette` via `sx={…}` callbacks (no hardcoded colors).
    - Each button Tooltip with keyboard shortcut from i18n.
    - Hint `Typography` (`aria-live="polite"`) when disabled.
    - `React.memo` with `useShallow` selector for `selectedElementIds`.
  - **Imports**: `AlignAxis`, `AlignTarget` from `@/frontend/common/stores/cert/snapAlignTypes`; `alignElements` action from `@/frontend/common/stores/useCanvasStore`.
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] **R5S-T4: Create `DistributePanel.tsx`**
  - **File**: `frontend/views/dashboard/cert/templates/editor/properties/DistributePanel.tsx` (new)
  - **Implements** §R5S.2:
    - Distribute-from `ToggleButtonGroup` (3 options; compact single row). Per R5S.3, optional `SpacingControls` could host this — Plan 12 keeps the inline version here for panel self-sufficiency, importing `SpacingControls` as an alternative layout under the distribute panel (use a `ToggleButtonGroup size="small"`).
    - Gap input `TextField type="number" size="small"` (from `templateElementEditorStore.distributeGap`), disabled when `from !== 'spacing'`.
    - Mode buttons grid (3 rows × 2 cols): H centers, V centers, L/R/T/B edges, H spacing, V spacing.
    - "Equal" badge overlay on edge-distribute icons — small `Box` at `sx={{ position: 'absolute', top: -4, right: -4, bgcolor: theme.palette.primary.main, color: theme.palette.onPrimary }}` (no hardcoded colors).
    - Disabled state: < 3 selected elements. Tooltip helper-text `i18n('distribute.requiresThree')`.
  - **Imports**: `DistributeMode`, `DistributeFrom` from `@/frontend/common/stores/cert/snapAlignTypes`; `distributeElements`, `distributeSpacing` actions from `@/frontend/common/stores/useCanvasStore`.
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] **R5S-T5: Create `SpacingControls.tsx`**
  - **File**: `frontend/views/dashboard/cert/templates/editor/properties/SpacingControls.tsx` (new)
  - **Implements** §R5S.3:
    - `ToggleButtonGroup` for `from` (single-row, 3 buttons). Icons optional — labels for clarity.
    - Gap `TextField` `type="number"` `size="small"` bound to `distributeGap`. Disabled when `from !== 'spacing'` (read-only visual).
  - Reused both inside the Align panel (its top section) and standalone inside the Distribute panel. Each consumer delegates to Plan 12 R5S-T7-type sub-panel (` SnapSettingsSubPanel`) — wait, typo, that's a separate task; this `SpacingControls` is downstream-of-prereqs-only.
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] **R5S-T6: Create `MatchSizePanel.tsx`**
  - **File**: `frontend/views/dashboard/cert/templates/editor/properties/MatchSizePanel.tsx` (new)
  - **Implements** §R5S.4:
    - Match scope row: 3 `Button`s (Match Width / Height / Size). Labels visible.
    - Reference-kind radio group: First / Key (disabled when no key) / Largest / Smallest.
    - All-disabled `< 2` selected elements; hint `i18n('matchSize.requiresTwo')`.
    - Notice `i18n('matchSize.allIdentical')` disables buttons when all selected elements are the same width×height (use `React.useMemo` on `selectedElementIds.map(el => el.width + '×' + el.height)` and a `Set` size check).
    - Tooltip helper-text for "key-object required" hint when user picks `key` reference without a key object.
  - **Imports**: `MatchSize` reference kind types — reused from the canonical `@/frontend/common/stores/cert/snapAlignTypes` (R5S-T1 in Plan 10 might already include these — re-use, no local type defs). The store's `matchSize` action is invoked.
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] **R5S-T7: Create `SnapSettingsSubPanel.tsx`**
  - **File**: `frontend/views/dashboard/cert/templates/editor/properties/SnapSettingsSubPanel.tsx` (new)
  - **Implements** §R5S.7:
    - `Accordion`-based sub-panel with 3 sections: Smart Guides / Snap Targets / Snap Threshold.
    - 4 swatches for smart-guide colour tokens, each rendered as a `Box` with `sx={{ bgcolor: (theme) => theme.palette[token].main }}`. Active swatch has ring border via `sx={{ outline: (theme) => '2px solid ' + (theme.palette[token].main), outlineOffset: 2 }}` (no hardcoded colours).
    - `Slider` 2–20 for snap threshold; `Slider` 2–20 for smart-guide sensitivity.
    - Reset-to-defaults `Button` calling `updateSnapSettings(DEFAULT_SNAP_SETTINGS)`.
    - Mount-on-expand (contents only rendered when accordion expanded) for perf.
  - **Imports**: `SnapSettings`, `SmartGuideColorToken`, `DEFAULT_SNAP_SETTINGS` from `@/frontend/common/stores/cert/snapAlignTypes`. `updateSnapSettings` action from `@/frontend/common/stores/useCanvasStore`.
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] **R5S-T8: i18n keys for Plan 12 Snap & Align**
  - **Files**: 
    - `shared/locale/en/cert/templateEditor.ts` (edit)
    - `shared/locale/ar/cert/templateEditor.ts` (edit)
  - **Additions**: All keys from §R5S.8 of Plan 12 design:
    - `rightPanel.tabs.{align,distribute,matchSize}`
    - `align.requiresTwo`
    - `matchSize.{matchWidth, matchHeight, matchBoth, referenceKind, referenceFirst, referenceKey, referenceLargest, referenceSmallest, requiresTwo, allIdentical, referenceNoKeyHint}`
    - `spacing.{gapLabel, fromEdge, fromCenter, fromSpacing, sectionTitle}`
    - `subpanels.{smartGuidesTitle, snapTargetsTitle, snapThresholdTitle, resetToDefaults}`
  - **Implementation**: pure arrow functions, no `next-intl` imports, no `shared/messages/` references. Per `shared/AGENTS.md` compile-time patterns.
  - **Both** en and ar locales must receive the same key set with proper RTL formatting for ar (when applicable — note: most labels are nouns/short phrases, so RTL mostly affects sentence layout, not strings themselves).
  - **Quality loop**: tsgo + biome + lint queue client

## Round 5: Custom Shapes & Boolean Tasks

### R5-T1: Shape Properties Panel Section

- [ ] Create `frontend/views/dashboard/certificates/template-editor/elements/panels/ShapePropertiesSection.tsx`
  - Collapsible `Accordion` section in `CollapsiblePanelShell` (from R4-T1)
  - Appears when selected element has `type === 'shape'`
  - Section icon: `TuneOutlined` (from R4-1 icon mapping)
  - **Shape type dropdown**: MUI v9 `Select` with 8 options (rectangle, roundedRectangle, ellipse, polygon, star, triangle, line, custom)
  - **Dimensions**: Two `TextField` (width, height) with chain-lock `IconButton` (`LinkOutlined` / `LinkOffOutlined`)
  - **Position**: Two `TextField` (x, y) with origin `ToggleButtonGroup` (top-left `NorthWestOutlined`, center `CenterFocusStrongOutlined`)
  - **Rotation**: `Slider` (−180 to 180) + `TextField` (° suffix) + reset `IconButton` (`RotateLeftOutlined`)
  - All text via `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` keys `shapeProperties.*`
  - All MUI components use `sx={{}}` — never direct style props
  - No hardcoded colors — use `theme.palette.*` via `sx` callback
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T2: Rectangle & Rounded Rectangle Controls

- [ ] Create `frontend/views/dashboard/certificates/template-editor/elements/panels/shapeControls/RectangleControls.tsx`
  - Corner radius: `Switch` for uniform vs per-corner mode
  - Uniform mode: `Slider` (0–100px) + `TextField` (px suffix)
  - Per-corner mode: `Grid` with 4 `TextField`s (topLeft, topRight, bottomLeft, bottomRight) with corner-position icons
  - Slider `max` clamped to `min(width, height) / 2` per element
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/views/dashboard/certificates/template-editor/elements/panels/shapeControls/CornerRadiusSlider.tsx`
  - Reusable `Slider` with 40×40px live preview of rounded corner
  - Preview renders inline `<svg>` with current radius value
  - Stroke color from `theme.palette.primary.main`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T3: Ellipse Controls (Arc/Pie)

- [ ] Create `frontend/views/dashboard/certificates/template-editor/elements/panels/shapeControls/EllipseControls.tsx`
  - Arc/Pie controls in `Collapse` (hidden when full ellipse: start=0, end=360)
  - Start angle: `Slider` (0–360°) + `TextField` (° suffix)
  - End angle: `Slider` (0–360°) + `TextField` (° suffix)
  - Arc mode `ToggleButtonGroup`: Arc (stroke-only, open) vs Pie (filled, closed to center)
  - Live preview: small inline `<svg>` showing the arc/pie shape
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T4: Triangle Controls

- [ ] Create `frontend/views/dashboard/certificates/template-editor/elements/panels/shapeControls/TriangleControls.tsx`
  - Triangle type `ToggleButtonGroup`: Equilateral, Isosceles, Scalene
  - Point direction `ToggleButtonGroup`: Up (`NorthOutlined`), Down (`SouthOutlined`), Left (`WestOutlined`), Right (`EastOutlined`)
  - Equilateral: locks width=height
  - Isosceles: width adjustable, height auto-computed
  - Scalene: both adjustable independently
  - Live preview: inline `<svg>` showing triangle in selected config
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T5: Polygon Controls

- [ ] Create `frontend/views/dashboard/certificates/template-editor/elements/panels/shapeControls/PolygonControls.tsx`
  - Sides count: `IconButton` (−) + `TextField` (type=number, min=3, max=12) + `IconButton` (+)
  - Uses `slotProps={{ htmlInput: { min: 3, max: 12 } }}` for min/max validation
  - Label: `t("shapeProperties.sides")`
  - Live preview: inline `<svg>` showing polygon with current sides count
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T6: Star Controls

- [ ] Create `frontend/views/dashboard/certificates/template-editor/elements/panels/shapeControls/StarControls.tsx`
  - Points count: `IconButton` (−) + `TextField` (min=3, max=20) + `IconButton` (+)
  - Inner radius: `Slider` (10–90%) + `TextField` (% suffix)
  - Outer radius: read-only `Typography` showing `max(width, height) / 2` px
  - Label keys: `shapeProperties.points`, `shapeProperties.innerRadius`, `shapeProperties.outerRadius`
  - Live preview: inline `<svg>` showing star with current config
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T7: Line Controls

- [ ] Create `frontend/views/dashboard/certificates/template-editor/elements/panels/shapeControls/LineControls.tsx`
  - Thickness: `Slider` (1–20px) + `TextField` (px suffix)
  - Style: `ToggleButtonGroup` with visual preview swatches — Solid, Dashed, Dotted
  - Arrow start: `Select` with 4 options (None, Solid, Open, Triangle) — each with `ListItemIcon` SVG preview
  - Arrow end: same `Select` as above
  - `ListItemIcon` renders mini SVG preview for each arrow style
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T8: Custom Shape Controls

- [ ] Create `frontend/views/dashboard/certificates/template-editor/elements/panels/shapeControls/CustomShapeControls.tsx`
  - Path data display: monospace `Typography` (read-only by default, truncated)
  - "Show full" / "Show less" toggle for long path data
  - Unlock `IconButton` (`LockOpenOutlined` / `LockOutlined`) — switches to editable `TextField` multiline
  - Warning tooltip on unlock: `t("shapeProperties.editPathWarning")`
  - "Save as Custom Shape" `Button` — calls `saveElementAsCustomShape(elementId, name)`
  - "Replace from Library" `Button` — calls `openShapePicker()` (opens Plan 10's `ShapePickerDialog`)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T9: Boolean Operation Controls

- [ ] Create `frontend/views/dashboard/certificates/template-editor/elements/panels/BooleanOperationControls.tsx`
  - `Accordion` with `MergeOutlined` icon in summary
  - Operation type `Select`: Unite, Subtract, Intersect, Exclude, Divide, Trim, Merge
  - Operand list: drag-reorderable `List` showing operand index, name, type icon, visibility toggle
  - Drag to reorder via `@dnd-kit` or MUI `ListItem` with `onDragStart`/`onDragEnd`
  - Visibility `IconButton`: `VisibilityOutlined` / `VisibilityOffOutlined` per operand
  - Flatten `Button` (fullWidth, `color="warning"`): `LayersClearOutlined` icon
  - Flatten confirmation `Dialog`: title, message, cancel button, confirm button (warning color)
  - Changing operation calls `updateBooleanOperation(elementId, op)`
  - Reordering calls `reorderBooleanOperands(elementId, fromIdx, toIdx)`
  - Visibility toggle calls `toggleOperandVisibility(elementId, operandId)`
  - Flatten confirm calls `flattenBooleanElement(elementId)`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T10: Shape Picker Dialog

- [ ] Create `frontend/views/dashboard/certificates/template-editor/dialogs/ShapePickerDialog.tsx`
  - MUI `Dialog` with `maxWidth="md"`
  - Wraps Plan 10's `ShapeLibraryPanel` component in full-width dialog
  - `onSelect` callback passes `ShapePreset` to caller + closes dialog
  - "Import SVG" and "Import from URL" buttons in dialog footer
  - `onClose` callback closes dialog without selection
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T11: Element Store Additions for Shape Properties

- [ ] Modify `frontend/common/stores/templateElementEditorStore.ts`
  - Add `updateShapeProperty(elementId, property, value)` — generic shape property update
  - Add `convertShapeType(elementId, newType)` — converts between shape types, preserving width/height/position/fill/stroke
  - Add `updateBooleanOperation(elementId, operation)` — changes boolean op type, triggers recompute
  - Add `reorderBooleanOperands(elementId, fromIndex, toIndex)` — array move
  - Add `toggleOperandVisibility(elementId, operandId)` — toggle operand `visible` flag
  - Add `flattenBooleanElement(elementId)` — calls `flattenBoolean` from booleanPathMath (Plan 11), replaces element
  - Add `shapePickerDialogOpen: boolean` + `openShapePicker()` / `closeShapePicker()`
  - Add `selectShapeFromPicker(preset, targetElementId?)` — replaces element pathData or creates new
  - Add `saveElementAsCustomShape(elementId, name)` — calls Plan 10's `addCustomShapePreset`
  - All actions use Zustand `set` / `get` pattern
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T12: i18n Keys for Shape Properties & Boolean Controls

- [ ] Modify `shared/locale/types/cert/certificateTemplateEditor.ts`
  - Add `shapeType.*` keys (8 shape type names)
  - Add `shapeProperties.*` keys per design.md §R5.6 (all property labels)
  - Add `booleanControls.*` keys (operation type, operands, visibility, drag hint)
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Modify `shared/locale/ar/.../certificateTemplateEditor.ts`
  - Implement Arabic translations for all R5 keys
  - Follow existing translation patterns in the file
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Modify `shared/locale/en/.../certificateTemplateEditor.ts`
  - Implement English translations for all R5 keys
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T14: Knowledge Propagation

- [ ] Create `docs/frontend/shape-properties-patterns.md`
  - Document shape-type-specific control component pattern
  - Document boolean operation non-destructive vs destructive model
  - Document shape picker dialog integration
- [ ] Update `frontend/COMPONENT_PATTERNS.md` (append-only)
  - "Shape Property Controls" section
  - Pattern for dynamic control rendering based on element sub-type
- [ ] Update `frontend/AGENTS.md` with reference to new docs
- [ ] Run quality checks

## Round 5: Zoom & Navigation Tasks

- [ ] R5Z-T1. Create `ZoomPropertyPanel` component
  - Zoom level display (editable text field)
  - Zoom slider (5%–1600%)
  - Preset zoom buttons (25%, 50%, 75%, 100%, 150%, 200%, 400%)
  - Fit to Screen, Actual Size, Zoom to Selection, Zoom to All buttons
  - Reads from `useZoomStore`
  - File: `frontend/views/certificate-editor/components/panels/ZoomPropertyPanel.tsx`
  - _Quality loop_: tsgo + biome + lint queue client
  - _Instructions: frontend.instructions.md, frontend/AGENTS.md_

- [ ] R5Z-T2. Create `NavigationPropertyPanel` component
  - Scroll position display (X, Y editable)
  - Viewport size display
  - Pan speed slider (1x–10x)
  - Center on Canvas / Center on Selection buttons
  - Scroll-to-element dropdown
  - File: `frontend/views/certificate-editor/components/panels/NavigationPropertyPanel.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5Z-T3. Create `ZoomSettingsPanel` component
  - Mouse wheel zoom toggle
  - Zoom modifier key selector (Ctrl/Alt/Shift/None)
  - Smooth zoom transitions toggle + duration slider
  - Zoom step size slider
  - Pixel grid at high zoom toggle
  - Show scrollbars toggle
  - File: `frontend/views/certificate-editor/components/panels/ZoomSettingsPanel.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5Z-T4. Create `NavigatorPropertyPanel` component
  - Preview size selector (Small/Medium/Large)
  - Viewport rectangle color picker
  - Preview quality selector (Draft/Standard/High)
  - Auto-update toggle
  - Show ruler markings toggle
  - File: `frontend/views/certificate-editor/components/panels/NavigatorPropertyPanel.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5Z-T5. Create `MiniMapPropertyPanel` component
  - Mini-map size selector (Small/Medium/Large)
  - Mini-map position selector (4 corners)
  - Thumbnail scale selector (10%/15%/25%/50%)
  - Viewport rectangle color picker
  - Show element names toggle
  - Opacity slider (30%–100%)
  - File: `frontend/views/certificate-editor/components/panels/MiniMapPropertyPanel.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5Z-T6. Add zoom/navigation settings to `useEditorSettingsStore`
  - `panSpeed` (number, default 3)
  - `zoomStep` (number, default 10)
  - `smoothScroll` (boolean, default true)
  - `scrollDuration` (number, default 200)
  - `overscrollBounce` (boolean, default false)
  - `arrowKeyPan` (boolean, default true)
  - `pageKeyScroll` (boolean, default true)
  - `mouseWheelZoom` (boolean, default true)
  - `zoomModifier` ('ctrl' | 'alt' | 'shift' | 'none', default 'ctrl')
  - `pixelGridAtHighZoom` (boolean, default true)
  - `showScrollbars` (boolean, default true)
  - File: `frontend/common/stores/cert/editorSettingsStore.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5Z-T7. Add i18n keys for zoom/navigation panels
  - Namespace: `certificateEditor`
  - Keys: zoomLevel, fitToScreen, actualSize, zoomToSelection, zoomToAll, panSpeed, smoothScroll, scrollDuration, overscrollBounce, arrowKeyPan, pageKeyScroll, mouseWheelZoom, zoomModifier, pixelGridAtHighZoom, showScrollbars, navigatorSize, viewportColor, previewQuality, autoUpdate, showRulerMarkings, miniMapSize, miniMapPosition, thumbnailScale, showElementNames, miniMapOpacity, scrollPosition, viewportSize, centerOnCanvas, centerOnSelection, scrollToElement
  - Files: `shared/locale/en/certificateTemplateEditor.ts`, `shared/locale/ar/certificateTemplateEditor.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5Z-T9. Knowledge propagation & documentation
  - Read all outcome files
  - Create doc: `docs/frontend/certificate-zoom-navigation.md`
  - Update `frontend/AGENTS.md` with zoom/navigation panel patterns
  - Update root `AGENTS.md` Important References
  - Run: `bun run scripts/health/sub-loop.ts docs/frontend/certificate-zoom-navigation.md --lifecycle codescene`
  - Write outcome file

## Round 5: Advanced Typography Tasks

### R5-C1: Character Panel — Font Family Picker (Enhanced)

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/FontFamilyPicker.tsx`:
  - MUI `Autocomplete` with `renderOption` rendering "ABCabc123" in each font (`sx={{ fontFamily: option.family }}`)
  - Group by category via `groupBy` (serif, sans-serif, display, handwriting, monospace, arabic, custom)
  - Loads font on hover via `document.fonts.load("14px ${family}")`
  - Loading glyph: `CircularProgress` at 14px beside option name; failed: `WarningOutlined`
  - `freeSolo={false}` — restricted to loaded + system + custom fonts
  - `aria-label` per option: `${family} — ${weightLabel} — ${licenseLabel}` (i18n)
  - Search filters by family name AND category label
  - On weight unavailable for new font → Snackbar warning ("Font X doesn't support Bold weight")
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/FontWeightSelector.tsx`:
  - MUI `Select` with weights Thin(100) through Black(900)
  - Only weights the selected font supports (`loadedFonts[family].weights`) are shown
  - Each option renders in target weight + selected font family (`sx={{ fontFamily: selectedFamily, fontWeight: option.value }}`)
  - Falls back to 400 if selected weight unavailable
  - i18n via `t.typography.character.fontWeight`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/FontSizeControl.tsx`:
  - `TextField` (type=number, min=1, max=400) + `Slider` (1–400) bidirectionally synced
  - Presets dropdown: 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72, 96, 128
  - Slider value display: "Npx" via `valueLabelFormat`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-C2: Character Panel — Style Controls

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/FontStyleControl.tsx`:
  - `ToggleButtonGroup`: Normal (`TextRotationNoneOutlined`), Italic (`FormatItalicOutlined`), Oblique (Greek-style icon or text label)
  - i18n aria-labels via `t.typography.character.normal|italic|oblique`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/KerningControl.tsx`:
  - `Slider` (-5em to +5em, step 0.05) + numeric `TextField`
  - Default 0, label "Kerning" via i18n
  - Layout: `Box sx={{ display: "flex", gap: 1, alignItems: "center" }}`, `TextField size="small" sx={{ width: 64 }}`, `Slider sx={{ flex: 1 }}`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/TrackingControl.tsx`:
  - Same layout as KerningControl
  - `Slider` (-10 to +10, step 1), numeric `TextField`, default 0
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/LeadingControl.tsx`:
  - Same layout
  - `Slider` (0.8 to 3.0, step 0.05), numeric `TextField`, default 1.5
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/BaselineShiftControl.tsx`:
  - `Slider` (-50 to +50px, step 1) + numeric `TextField`
  - Maps to CSS `verticalAlign` (negative = subscript, positive = superscript)
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/HorizontalScaleControl.tsx`:
  - `Slider` (50%–200%, step 1) + numeric `TextField` with `%` suffix
  - Stores integer 50–200; renderer divides by 100 for `scaleX`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/VerticalScaleControl.tsx`:
  - Same as HorizontalScaleControl, but for `scaleY`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/CharacterRotationControl.tsx`:
  - `Slider` (0°–360°, step 1) + numeric `TextField` with `°` suffix
  - Applies `transform: rotate()` at span level
  - **Quality loop**: tsgo + biome + lint queue client

### R5-C3: Character Panel — Color, Fill, Stroke

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/FillTypeSelector.tsx`:
  - `ToggleButtonGroup`: Solid / Gradient / Pattern (`InvertColorsOutlined`, `GradientOutlined`, `TextureOutlined`)
  - Solid: `ColorPickerField` (reused from R4-T2)
  - Gradient: `GradientPickerField` (reused from R4-T3)
  - Pattern: `PatternPickerField` (new in this task) — `Select` from `shared/constants/certificates/textPatterns.ts`
  - i18n via `t.typography.character.fillSolid|fillGradient|fillPattern`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `shared/constants/certificates/textPatterns.ts`:
  - Export `TEXT_PATTERNS: TextPattern[]` array with predefined tile patterns (stripes, dots, checkerboard, diagonal)
  - Each: `{ id, label, backgroundImage: string, repeat: "repeat" | "repeat-x" | "repeat-y" | "no-repeat" }`
  - Patterns reference SVG data URIs (no external images)
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/PatternPickerField.tsx`:
  - MUI `Select` listing `TextPattern` options
  - Swatch preview to the right of each option renders the pattern background
  - Selected pattern sets `element.settings.fillPattern` in store via callback
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/StrokeEditor.tsx`:
  - Props: `{ value: { color, width, position }, onChange, label }`
  - Stroke color: `ColorPickerField` (reused)
  - Stroke width: `Slider` 0–10px (step 0.5) + numeric
  - Position: `ToggleButtonGroup` Outside / Center / Inside
  - CSS mapping per `paint-order` from design.md §R5.1.8
  - **Quality loop**: tsgo + biome + lint queue client

### R5-C4: Character Panel — Shadow, Transform, Decoration, Direction

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/TextShadowEditor.tsx`:
  - Enable/disable `Switch` at top
  - X, Y, Blur each: `Slider` + numeric (±50px, ±50px, 0–50px)
  - Color: `ColorPickerField`, Opacity: `Slider` 0–100%
  - Reuse R4-T10 shadow presets (Soft Drop, Hard Shadow, Inner Glow — text variant)
  - Generate CSS via `text-shadow: ${x}px ${y}px ${blur}px ${alpha(color, opacity/100)}`
  - Import `alpha` from `@mui/material/styles`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/TextTransformControl.tsx`:
  - `ToggleButtonGroup`: None, Uppercase, Lowercase, Capitalize
  - CSS mapping: `text-transform` (none/uppercase/lowercase/capitalize)
  - i18n via `t.typography.character.transformNone|transformUppercase|transformLowercase|transformCapitalize`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/TextDecorationControl.tsx`:
  - Main `ToggleButtonGroup`: None, Underline, Strikethrough, Overline
  - "More" `IconButton` (`ExpandMoreOutlined`) opens `Menu` with: underline-double, underline-dotted, underline-dashed, underline-wavy
  - CSS mapping via `textDecorationToCSS()` function (from shared types utility)
  - i18n via `t.typography.character.decoration*`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/TextDirectionControl.tsx`:
  - `ToggleButtonGroup`: LTR, RTL, Auto
  - CSS mapping: LTR → `direction: ltr; unicode-bidi: normal;`, RTL → `direction: rtl; unicode-bidi: normal;`, Auto → `direction: ltr; unicode-bidi: plaintext;`
  - i18n via `t.typography.character.directionLTR|directionRTL|directionAuto`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-C5: Character Panel — Text on Path Section

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/TextOnPathSection.tsx`:
  - Collapsible sub-section at bottom of character panel
  - "Bind to path" `Autocomplete` listing all path elements (by name from `useCanvasStore`)
  - "Unbind" `IconButton` (`LinkOffOutlined`) clears `element.pathId`
  - When bound: `startOffset` `Slider` (0.0–1.0, step 0.01), `baselineOffset` `TextField` (-50 to +50px), `flip` `Checkbox`, "Direction" `ToggleButtonGroup` (Forward/Reverse)
  - i18n via `t.typography.character.textOnPath|bindToPath|unbind|startOffset|baselineOffset|flip|pathDirection|pathDirectionForward|pathDirectionReverse`
  - Updates `element.pathSettings` in store
  - **Quality loop**: tsgo + biome + lint queue client

### R5-C6: Character Panel — Vertical Text Toggle

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/VerticalTextToggle.tsx`:
  - `Switch` toggles `ParagraphStyles.vertical`
  - When enabled, renderer (Plan 11) sets `writingMode: "vertical-rl"`
  - i18n via `t.typography.character.verticalText` / `verticalTextToggle`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-C7: Character Panel Container

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/CharacterPanel.tsx`:
  - Collapsible card (`Accordion`-like) with header "CHARACTER" + `IconButton` to expand/collapse
  - Renders all sub-controls from R5-C1 through R5-C6 in dense 12-column MUI `Grid`
  - Reads `activeStyles` and `hasSelection` from `typographyStore`
  - Auto-expand on inline edit mode entry (double-click → `characterPanelCollapsed = false`)
  - Wraps each sub-control in `React.memo` to prevent cascading re-renders
  - Slider changes debounce at 16ms (one frame) before committing to store; local React state updates immediately for slider thumb
  - All i18n via `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` → `t.typography.character.*`
  - All styling via `sx={{}}`, no hardcoded colors
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Integrate character panel into right sidebar `PropertyPanelSection`:
  - Insert BELOW common properties section, ABOVE type-specific properties
  - Read `characterPanelCollapsed` from `useTemplateElementEditorStore` (extend with this field if not present)
  - On collapse change: `setCharacterPanelCollapsed(value)` in store
  - **Quality loop**: tsgo + biome + lint queue client

### R5-C8: Paragraph Panel — Alignment & Justification

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/TextAlignControl.tsx`:
  - `ToggleButtonGroup`: Left, Center, Right, Justify (`FormatAlign*Outlined` icons)
  - Updates `ParagraphStyles.alignment`
  - i18n via `t.typography.paragraph.alignmentLeft|Center|Right|Justify`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/JustificationMethodControl.tsx`:
  - MUI `Select`: Words, Characters, Auto
  - i18n via `t.typography.paragraph.justificationWords|Characters|Auto`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-C9: Paragraph Panel — Spacing & Indentation

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/SpacingIndentControls.tsx`:
  - Compound component rendering: spacing before/after, first-line indent, left/right indent, hanging indent
  - Each: `Slider` + numeric `TextField`
  - Ranges: before/after 0–100px, first-line 0–200px, L/R 0–500px, hanging 0–200px
  - CSS mapping: margins, text-indent (first-line/hanging via negative indent + padding-left)
  - i18n via `t.typography.paragraph.spacing*|Indent`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-C10: Paragraph Panel — Text Wrap, Columns

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/TextWrapControl.tsx`:
  - `ToggleButtonGroup`: None, To Shape, To Bounds, Custom
  - To Shape: reveals `Autocomplete` to select a shape element for `shape-outside` CSS
  - To Bounds: default `word-wrap: break-word`
  - Custom: reveals polygon point editor (advanced)
  - i18n via `t.typography.paragraph.textWrap*`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/ColumnsControl.tsx`:
  - Column count `Slider` 1–10 + numeric
  - Gutter `Slider` 0–50px
  - Width: `ToggleButtonGroup` Auto / Manual (reveals `Slider` for manual px)
  - CSS: `column-count`, `column-gap`, `column-width`
  - i18n via `t.typography.paragraph.columns|columnGutter|columnWidth*`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-C11: Paragraph Panel — Lists, Hyphenation, Orphan/Widow

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/ListControls.tsx`:
  - List type `ToggleButtonGroup`: None / Bullet / Numbered
  - Bullet style `Select`: Disc, Circle, Square, Custom (reveals `TextField` + `IconButton` → `SpecialCharPicker` from Plan 10)
  - Numbering format `Select`: 1., 1), (1), a., A., i., I.
  - List indent `Slider` 0–200px + numeric
  - CSS: `list-style-type` for bullets, CSS counters for numbered
  - i18n via `t.typography.paragraph.list*|bullet*|numbering*`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/HyphenationControl.tsx`:
  - Enable `Switch` (sets `hyphens: auto`)
  - Language `Select` (English, Arabic, French, German, Spanish, auto)
  - Min word length `Slider` + numeric (default 5)
  - Min fragments `Slider` + numeric (default 2)
  - i18n via `t.typography.paragraph.hyphenation*`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/OrphanWidowControl.tsx`:
  - Two `Switch`es: Orphan Control (sets `orphans: 2`), Widow Control (sets `widows: 2`)
  - i18n via `t.typography.paragraph.orphanControl|widowControl`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-C12: Paragraph Panel Container

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/elements/panels/ParagraphPanel.tsx`:
  - Collapsible card (default collapsed — `paragraphPanelCollapsed: true`)
  - Renders sub-controls from R5-C8 through R5-C11 in dense `Grid`
  - Active paragraph determined by caret position paragraph index
  - i18n via `t.typography.paragraph.title`
  - Wrap each control in `React.memo`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Integrate paragraph panel into right sidebar below character panel:
  - ADD field `paragraphPanelCollapsed: boolean` to `useTemplateElementEditorStore`
  - Receive `setParagraphPanelCollapsed(value)` action
  - **Quality loop**: tsgo + biome + lint queue client

### R5-C13: Typography Panel UI — Docking & Quick Access

- [ ] Update `PropertyPanelSection.desktop.tsx` to dock CharacterPanel + ParagraphPanel:
  - Insert BELOW common properties, ABOVE type-specific
  - Both collapsible, state from `useTemplateElementEditorStore`
  - Show only when selected element is text type
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Wire double-click → expand character panel:
  - Subscribe to `typographyStore.editingElementId`
  - When it transitions from null → non-null: `setCharacterPanelCollapsed(false)` + `scrollIntoView({ behavior: "smooth", block: "nearest" })` on character panel ref
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Register typography keyboard shortcuts in `ShortcutManager.tsx`:
  - `Alt+Shift+A` → expand character panel (`setCharacterPanelCollapsed(false)`)
  - `Alt+Shift+P` → expand paragraph panel (`setParagraphPanelCollapsed(false)`)
  - `Alt+Shift+C` → collapse both
  - Each shortcut description via i18n (`t.typography.shortcuts.openCharacter|openParagraph|collapseAll`)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-C14: Mobile Typography Bottom Sheets

- [ ] Create `frontend/mobile/views/dashboard/certificates/template-editor/elements/dialogs/CharacterPanelSheet.tsx`:
  - Bottom sheet max-height 80% viewport
  - Same controls as desktop, single-column scrollable layout
  - Accessible on narrow viewport, sliders full-width
  - Stroke position: stacked rows (not inline `ToggleButtonGroup`)
  - i18n via `t.typography.character.*`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/mobile/views/dashboard/certificates/template-editor/elements/dialogs/ParagraphPanelSheet.tsx`:
  - Same single-column adaptation of ParagraphPanel
  - Hyphenation language selector as full-screen modal (not inline `Select`)
  - i18n via `t.typography.paragraph.*`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Wire "Edit Typography" `IconButton` (`TextFieldsOutlined`) on mobile element action sheet:
  - Opens `CharacterPanelSheet` (paragraph panel reachable via tab/list navigation inside sheet)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-C15: i18n Namespace Extension

- [ ] Extend `shared/locale/ar/.../templateEditor.ts` with `typography.shortcuts.*`, `typography.character.*`, `typography.paragraph.*`, `typography.placeholder.*` keys from design.md §R5.4:
  - Arabic translations for all character panel labels, paragraph panel labels
  - Weight labels in Arabic (Thin → خفيف جداً, ExtraLight → خفيف جداً مفرط, Light → خفيف, Regular → عادي, Medium → متوسط, SemiBold → شبه عريض, Bold → عريض, ExtraBold → عريض جداً, Black → أسود)
  - Direction labels: LTR → من اليسار لليمين, RTL → من اليمين لليسار, Auto → تلقائي
  - List style labels in Arabic
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Extend `shared/locale/en/.../templateEditor.ts` with same key structure:
  - English translations matching Arabic keys exactly
  - **Quality loop**: tsgo + biome + lint queue client

### R5-C17: Knowledge Propagation

- [ ] Update `docs/frontend/typography-engine.md` (created in Plan 10 R5-A14) with panel UI section:
  - Document the Character/Paragraph panel layout
  - Document the stroking (paint-order) and shadow rendering
  - Document the typography keyboard shortcuts
  - Document mobile bottom sheet adaptation
  - **Quality loop**: tsgo + biome + lint queue client

### R5-C18: Execution Order

```
Phase R5-C-a (sequential):    R5-C1 FontFamilyPicker + FontWeightSelector + FontSizeControl (depend on typographyStore from Plan 10)
Phase R5-C-b (parallel):     R5-C2 style controls (kerning/tracking/leading/baseline/scale/rotation), R5-C3 fill/stroke, R5-C4 shadow/transform/decoration/direction
Phase R5-C-c (parallel):     R5-C5 text on path, R5-C6 vertical text, R5-C8 alignment controls, R5-C9 spacing/indent, R5-C10 wrap/columns, R5-C11 lists/hyphenation/orphan-widow
Phase R5-C-d (sequential):   R5-C7 CharacterPanel container (depends on R5-C1..C6), R5-C12 ParagraphPanel container (depends on R5-C8..C11)
Phase R5-C-e (sequential):   R5-C13 docking + quick access + keyboard shortcuts (depends on R5-C7, R5-C12)
Phase R5-C-f (parallel):     R5-C14 mobile sheets, R5-C15 i18n AR + EN
Phase R5-C-g (sequential):   R5-C17 knowledge propagation (depends on all)
```

**Round 5 total estimated time for Plan 12**: ~48 hours → ~28 wall-clock hours with parallelism.

## Round 5: Context Menus Tasks

> Round 5 task list for Plan 12 — layers panel right-click menu, properties panel right-click (element-level), element-specific right-click composer, dialogs, and store actions. Plan 12 consumes the context menu primitives (`contextMenuService`, `<ContextMenuHost>`, `SubmenuTrigger`, `filterMenuItems`, `useMenuContextDescriptor`, `outside-click close`, theme adapter) from Plan 10 §R5 and the canvas/element builders from Plan 11 §R5. Plan 12 owns three new builder modules, two dialogs, six store actions, and three component integrations. Total R5 scope for Plan 12: 11 tasks (~16 hours).

### R5-T1: Layers Panel Context Menu Builder

- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/layersPanelContextMenu.ts` (new)
  - `buildLayersPanelContextMenu(opts: LayersPanelMenuOpts): ContextMenuItem[]` per §R5.1 spec
  - Item order, IDs, and filter rules exactly match §R5.1
  - `filterMenuItems(items, ctx)` called before returning
  - Labels via i18n keys `contextMenu.layers.*` (no hardcoded strings)
  - Background layer exemptions: Delete disabled (not hidden), Duplicate disabled, Move to Front/Back hidden; Lock/Hide items visible (user can still lock/hide the background)
  - Mini Confirm text for `layers.delete` and `layers.flattenImage` uses pluralization helpers (singular when count=1, plural otherwise)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T2: Layer Properties Dialog

- [ ] Create `frontend/views/dashboard/cert/templates/editor/dialogs/LayerPropertiesDialog.tsx` (new)
  - Reads `contextMenuStore.lastAction.layerId` (the right-clicked layer) and renders the dialog
  - Fields per §R5.2: Name TextField (required), Color Tag 12-swatch grid, Opacity Slider 0-100 with live preview (debounced 100ms) via `canvasStore.updateLayerOpacity`
  - OK commits, Cancel reverts snapshot
  - All `sx={{}}`, no style props; colors from `theme.palette.*` (primary, secondary, error, warning, info, success, and grey[100]-grey[900] step 200)
  - Labels from `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` keys `layerProperties.*`
  - No hardcoded colors
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T3: Properties Panel Context Menu Builder

- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/propertiesPanelContextMenu.ts` (new)
  - `buildPropertiesPanelContextMenu(ctx: MenuContextDescriptor): ContextMenuItem[]` per §R5.3 spec
  - Items: Copy Properties, Paste Properties, Reset to Defaults (`isDangerous: true`), separator, Properties Panel Options...
  - Filter rules via `filterMenuItems(items, ctx)`: copyProperties disabled when `selectionCount === 0`; pasteProperties disabled when `!contextMenuStore.copiedProperties`; resetToDefaults disabled when `selectionCount === 0`; options always enabled
  - Reset confirm uses Mini Confirm pattern with `contextMenu.propertiesPanel.resetConfirm` key
  - Labels from `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` keys `contextMenu.propertiesPanel.*`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T4: Properties Panel Options Dialog

- [ ] Create `frontend/views/dashboard/cert/templates/editor/dialogs/PropertiesPanelOptionsDialog.tsx` (new)
  - Per §R5.4 spec — toggles which property groups are shown collapsed by default
  - Checkboxes for Transform, Appearance, Fill & Stroke, Effects, Typography (only visible when at least one text element in selection)
  - OK saves to `uiStore.propertyPanelCollapsedGroups`; Cancel reverts
  - All `sx={{}}` MUI v9; no hardcoded colors
  - Labels from `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` keys `propertiesPanelOptions.*`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T5: Element Menu Composer

- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/composeElementMenu.ts` (new)
  - Per §R5.5 spec — `composeElementMenu(ctx): ContextMenuItem[]` combines Plan 11's `buildElementContextMenu` and `elementTypeMenuItems` for each unique selected element type
  - Imports from Plan 11 (does NOT modify Plan 11 files)
  - Inserts a single separator between base menu and element-type additions
  - Used by properties panel kebab menu (R5-T8) — not used by canvas (canvas uses base menu only)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T6: Store Actions — Merge, Flatten, Smart Object, Clipping Mask, Rasterize

- [ ] Modify `frontend/common/stores/cert/canvasStore.ts` (existing) — add actions per §R5.8:
  - `mergeLayersDown(topId, bottomId)` — returns new group id; honors `isolationDepth === 0`; history entry
  - `mergeVisibleLayers()` — groups all visible non-background elements; returns new group id; history entry
  - `flattenImage()` — renders all elements to offscreen canvas via `drawToContext(ctx)` (R3) → exports bitmap → replaces with single image element; `isDangerous: true` in history
  - `convertToSmartObject(id)` — sets `isSmartObject: true`; stores source snapshot in `element.smartObjectData`
  - `rasterizeLayer(id)` — renders to bitmap and replaces with image element preserving transform/opacity/clipping
  - `createClippingMask(childId, parentId)` — sets `clippingMaskParentId`; auto-reorders child immediately above parent if needed
  - `releaseClippingMask(id)` — clears `clippingMaskParentId`
  - `selectSimilarLayers(referenceLayerId)` — selects all layers of same type
  - `findLayer(layerId)` — sets `uiStore.scrollToLayerId`; consumed by layers panel
  - All actions use immutable Zustand updates; history entries via existing R3 stack helpers
  - All actions respect isolation mode (no merges or flattens when `isolationDepth > 0`)
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Modify `frontend/common/stores/cert/uiStore.ts` (existing) — add per §R5.8:
  - `propertyPanelCollapsedGroups: Record<string, boolean>` (persisted)
  - `scrollToLayerId: string | null`
  - `clearScrollToLayerId()` self-clearing after consumption
  - `setCollapsedGroup(groupKey, collapsed)` mutator
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Modify `frontend/common/stores/cert/contextMenuStore.ts` (existing from Plan 10) — add per §R5.8:
  - `copiedProperties: Partial<CanvasElementProperties> | null`
  - `copyProperties(source: CanvasElement)` action — snapshot of relevant property fields
  - `pasteProperties(targets: string[])` action — applies snapshot to target elements via canvasStore
  - Reuses the `copiedProperties` data shape as defined in Plan 10 §R5.11 (single source of truth)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T7: i18n Keys

- [ ] Modify `shared/locale/types/certificateTemplateEditor.ts` — add type schema for:
  - `contextMenu.layers.*` (properties, duplicate, delete, deleteConfirm (count)=>string, mergeDown, mergeVisible, flattenImage, flattenConfirm, bringToFront, bringForward, sendBackward, sendToBack, group, ungroup, lock, unlock, hide, show, convertToSmartObject, rasterize, createClippingMask, releaseClippingMask, selectSimilar, findLayer)
  - `contextMenu.propertiesPanel.*` (copyProperties, pasteProperties, resetToDefaults, resetConfirm, options)
  - `layerProperties.*` (title, nameHelper, colorTag, opacity)
  - `propertiesPanelOptions.*` (title, transform, appearance, fillStroke, effects, typography)
- [ ] Modify each locale file (en.ts, ar.ts, etc.) — provide values for the new keys
  - Pluralization functions: `deleteConfirm: (count) => count === 1 ? 'Delete this layer?' : \`Delete \${count} layers?\``
  - Interpolation: `layerProperties.title: (name) => \`Layer Properties: \${name}\``
  - Arabic translations follow existing RTL conventions in the locale file
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T8: Layers Panel Component Integration

- [ ] Modify `frontend/views/dashboard/cert/templates/editor/EditorLayersPanel.tsx` (existing from Plan 11 R4) — per §R5.6 spec:
  - Attach `onContextMenu` to each layer row `Box` calling `buildLayersPanelContextMenu` then `contextMenuService.openMenu('layers', position, items)`
  - `data-element-id` attribute already present from Plan 11 R4 wiring
  - Double-click on group rows enters isolation mode via `canvasStore.enterIsolationMode(id)`; double-click on other types preserves existing rename behavior
  - Alt+click between rows creates clipping mask via `canvasStore.createClippingMask(childId, parentId)` — hit test via `data-above-layer-id` / `data-below-layer-id` attributes on 4px-tall divider `Box sx={{ height: 4 }}`
  - Consumes `uiStore.scrollToLayerId` via useEffect + `rowRefs.current[id]?.scrollIntoView({ block: 'center', behavior: 'smooth' })`
  - All `sx={{}}`; no style props; no hardcoded colors
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T9: Properties Panel Component Integration

- [ ] Modify `frontend/views/dashboard/cert/templates/editor/EditorPropertiesPanel.tsx` (existing from Plan 11 R4) — per §R5.7 spec:
  - Attach `onContextMenu` to the panel root `Box` calling `buildPropertiesPanelContextMenu` then `contextMenuService.openMenu('properties', position, items)`
  - Add kebab `IconButton` in panel header that opens a `Menu` with the same items (discoverability)
  - Kebab `IconButton sx={{ color: 'text.secondary' }}`; `Menu` uses `contextMenuPaperSx` from Plan 10 §R5.7
  - Consumes `uiStore.propertyPanelCollapsedGroups` to control which `<Accordion>` sections render collapsed
  - All `sx={{}}`; no style props; no hardcoded colors
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T10: Test Suite

- [ ] Create `test/unit/canvasStoreLayersActions.test.ts` (new)
  - Test: `mergeLayersDown(A, B)` returns new group id; original A and B removed; new group at B's z-index
  - Test: `mergeVisibleLayers` skips hidden elements and background
  - Test: `flattenImage` renders all visible elements via `drawToContext` and replaces with a single image element (stub `drawToContext` in tests returning a fixed bitmap)
  - Test: `convertToSmartObject` sets `isSmartObject: true` and stores snapshot in `smartObjectData`
  - Test: `rasterizeLayer` on a text element replaces with an image element preserving transform/opacity
  - Test: `createClippingMask(child, parent)` sets `clippingMaskParentId` on child; if child not immediately above parent, reorders it
  - Test: `releaseClippingMask` clears `clippingMaskParentId`
  - Test: `selectSimilarLayers(refTextId)` selects all text-type elements in the document
  - Test: `findLayer(id)` sets `uiStore.scrollToLayerId = id`
  - Test: all actions no-op when `isolationDepth > 0` (merge/flatten/smartObject/rasterize/clipping)
  - Test: undo after `mergeLayersDown` restores both original elements
  - Test: undo after `flattenImage` restores all originals (verified history entry was `isDangerous: true`)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T11: Knowledge Propagation

- [ ] Update `frontend/IMPLEMENTATION_LEARNINGS.md` (append-only)
  - Add entry: layers panel context menu builder must equilibrate `disabled` vs `hidden` — background layer Delete is disabled (greyed) rather than hidden because users need to learn the background is non-deletable; converting to Invisible Whisper rule: hide what's structurally inapplicable, disable what's contextually blocked
  - Add entry: clipping masks require z-order adjacency — auto-reordering the child to immediately above the parent when `createClippingMask` is called is the most robust approach; relying on the user to pre-arrange z-order is unergonomic and error-prone
  - Add entry: properties panel collapse state must persist per-user via `uiStore.propertyPanelCollapsedGroups`; reading the collapsed state from the store on panel mount avoids flash of expanded state before collapse snaps shut
  - Add entry: when composing element menus from multiple sources (base + element-type additions), insert exactly ONE separator at the join — multiple separators create dead visual space; the `composeElementMenu` helper centralizes this rule
  - Add entry: `flattenImage` must use HTML5 Canvas's `drawToContext` protocol per element (R3) rather than a DOM snapshot — DOM snapshots miss transform, shadows, and clipping that the canvas renderer applies post-rasterization
- [ ] Update `frontend/COMPONENT_PATTERNS.md` (append-only)
  - Add "Layers Panel Context Menu" pattern: layers panel uses `buildLayersPanelContextMenu` with a typed `opts` struct computed from the layer's element record and the canvas state
  - Add "Properties Panel Context Menu" pattern: properties panel uses both right-click and a kebab `IconButton` to surface the same menu — the kebab provides discoverability, the right-click provides efficiency
  - Add "Properties Copy/Paste" pattern: `contextMenuStore.copiedProperties` is a UI-level clipboard (separate from clipboard store for cut/copy of elements); copying snapshots a subset of properties, pasting applies them to all selected elements and preserves locked/hidden flags
  - Add "Clipping Mask via Alt+click Divider" pattern: a 4px-tall divider `Box` between layer rows handles alt+click to invoke `createClippingMask` — same affordance as Photoshop, same action as the context menu's Create Clipping Mask item
  - Add "Isolation Mode Entry via Double-Click" pattern: double-clicking a group layer row enters isolation mode; existing rename behavior is preserved by checking `type === 'group'` first
- [ ] Update `frontend/AGENTS.md` (append-only)
  - Reference `layersPanelContextMenu.ts`, `propertiesPanelContextMenu.ts`, `composeElementMenu.ts` as Plan 12's R5 builders; Plan 10 owns the host/service; Plan 11 owns the canvas/element/ruler builders; Plan 12 owns layers/properties panel builders
  - Note the `frontend/views/dashboard/cert/templates/editor/contextMenus/` directory is shared across Plans 10/11/12 — see Plan 11 §R5 cross-reference table already in this file
  - Note that `mergeLayersDown`, `mergeVisibleLayers`, `flattenImage`, `convertToSmartObject`, `rasterizeLayer`, `createClippingMask`, `releaseClippingMask`, `selectSimilarLayers`, `findLayer` are all in `canvasStore` (Plan 12 R5-T6) and all respect isolation mode (`isolationDepth === 0`)
  - **Quality loop**: tsgo + biome + lint queue client

### Instruction File & AGENTS.md Discovery (Round 5 Append, Plan 12)

| Task | Files Created/Modified | AGENTS.md to Read | Instructions to Read |
|---|---|---|---|
| R5-T1 | `contextMenus/layersPanelContextMenu.ts` | `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T2 | `dialogs/LayerPropertiesDialog.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T3 | `contextMenus/propertiesPanelContextMenu.ts` | `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T4 | `dialogs/PropertiesPanelOptionsDialog.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T5 | `contextMenus/composeElementMenu.ts` | `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T6 | `frontend/common/stores/cert/canvasStore.ts` (modify), `frontend/common/stores/cert/uiStore.ts` (modify), `frontend/common/stores/cert/contextMenuStore.ts` (modify) | `frontend/stores/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T7 | `shared/locale/types/certificateTemplateEditor.ts` (modify), `shared/locale/<locale>/<domain>.ts` files (modify) | `shared/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T8 | `EditorLayersPanel.tsx` (modify from Plan 11 R4) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T9 | `EditorPropertiesPanel.tsx` (modify from Plan 11 R4) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T10 | `test/unit/canvasStoreLayersActions.test.ts` | `AGENTS.md` | `.agents/instructions/tests.instructions.md`, `.agents/instructions/frontend.instructions.md` |
| R5-T11 | `frontend/IMPLEMENTATION_LEARNINGS.md`, `frontend/COMPONENT_PATTERNS.md`, `frontend/AGENTS.md` (append-only) | `frontend/AGENTS.md`, `AGENTS.md` | — |

### Round 5 Execution Order (Plan 12 Context Menus)

```
Phase R5-A (sequential): R5-T7 (i18n keys — other tasks reference keys in labels)
Phase R5-B (parallel): R5-T1 (layers panel builder), R5-T3 (properties panel builder), R5-T5 (composer — depends on Plan 11 builders already in place from Plan 11 R5)
  ─── R5-T5 waits until Plan 11 §R5 ships `elementTypeMenuItems` and `buildElementContextMenu`
Phase R5-C (parallel): R5-T2 (Layer Properties Dialog — waits on T7 keys), R5-T4 (Properties Panel Options Dialog — waits on T7 keys)
Phase R5-D (sequential with parallelism): R5-T6 (store actions — runs in parallel with T2/T4 — they consume the actions)
Phase R5-E (parallel): R5-T8 (layers panel integration — waits on T1, T2, T6), R5-T9 (properties panel integration — waits on T3, T4, T6)
  ─── R5-T8 has the Alt+click divider work (clipping mask) which needs T6's `createClippingMask`
Phase R5-F (parallel): R5-T10 (test suite — waits on T1-T9 implementation)
Phase R5-G (sequential): R5-T11 (knowledge propagation — waits on all of above)
```

**Plan 12 R5 (Context Menus) total estimated time**: ~16 hours → ~7 wall-clock hours with the parallel phases R5-B, R5-C, R5-D, R5-E, R5-F.

> All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks (tsgo → biome → lint → codescene). The lint queue server must be running before any lint call. See `AGENTS.md` §"Lint Queue Server" for startup commands.

> Plan 12 R5 cross-references Plan 10 §R5 (host, service, filter, theme adapter, keyboard nav, submenu trigger, outside-click close, context menu i18n keys) and Plan 11 §R5 (canvas/element builders, element-type additions, ruler menu, behavior constants). Implementers should read Plan 10 §R5.7, §R5.9, §R5.10, §R5.11, §R5.13, §R5.16, §R5.18 and Plan 11 §R5.1, §R5.2, §R5.3, §R5.4, §R5.9 before starting Plan 12 R5.

## Round 5: Keyboard Shortcuts Tasks

- [ ] R5K-T1. Create `ShortcutPropertiesPanel` component
  - Shows shortcuts applicable to selected element type
  - Read-only binding display
  - "Customize" link opens KeyboardShortcutsDialog filtered
  - Contextual help expandable per shortcut
  - File: `frontend/views/certificate-editor/components/panels/ShortcutPropertiesPanel.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5K-T2. Implement text editing typography shortcuts
  - `Ctrl+B` bold, `Ctrl+I` italic, `Ctrl+U` underline toggle
  - `Ctrl+Shift+>` / `<` font size ±1
  - `Ctrl+Alt+Shift+>` / `<` font size ±10
  - `Alt+Arrow` kerning adjust
  - `Alt+Shift+Arrow` leading adjust
  - `Ctrl+Arrow` word navigation
  - `Home`/`End` line start/end
  - `Ctrl+A` select all text in element
  - File: `frontend/views/certificate-editor/hooks/useTypographyShortcuts.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5K-T3. Implement shape element shortcuts
  - `[` / `]` corner radius ±1 for rounded rect
  - `Alt+[` / `Alt+]` sides ±1 for polygon
  - `Alt+Shift+[` / `Alt+Shift+]` points ±1 for star
  - File: `frontend/views/certificate-editor/hooks/useShapeShortcuts.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5K-T4. Implement layer panel keyboard navigation
  - Arrow Up/Down: select prev/next layer
  - Shift+Arrow: extend selection
  - Ctrl+Arrow Up/Down: move layer order
  - Space: toggle visibility
  - Ctrl+Space: toggle lock
  - Enter: rename layer
  - Delete: remove layer
  - File: `frontend/views/certificate-editor/hooks/useLayerPanelKeyboard.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5K-T5. Create `TypographyShortcutsPanel` component
  - Grid display of all text editing shortcuts
  - Each row: action name | key combination | context
  - "Learn More" link opens full shortcut overlay
  - Expandable section in properties panel
  - File: `frontend/views/certificate-editor/components/panels/TypographyShortcutsPanel.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5K-T6. Add shortcut hint badges to property fields
  - Position X/Y: arrow nudges hint
  - Rotation: R+drag hint
  - Width/Height: Shift+drag proportional hint
  - Font size: `[` `]` ±1 hint
  - Corner radius: `[` `]` hint
  - File: `frontend/views/certificate-editor/components/panels/PropertyFieldHints.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5K-T7. Add i18n keys for element-specific shortcuts
  - Keys: shortcutBold, shortcutItalic, shortcutUnderline, shortcutFontSizeUp, shortcutFontSizeDown, shortcutFontSizeUp10, shortcutFontSizeDown10, shortcutKerning, shortcutLeading, shortcutCornerRadius, shortcutPolygonSides, shortcutStarPoints, shortcutLayerSelect, shortcutLayerOrder, shortcutVisibility, shortcutLock, shortcutRename, shortcutTypographyPanel, shortcutLearnMore
  - Files: `shared/locale/en/certificateTemplateEditor.ts`, `shared/locale/ar/certificateTemplateEditor.ts`
  - _Quality loop_: tsgo + biome + lint queue client

---

## Round 5: Transform Tasks

> **R6 = the app's 6th sequential round (existing R5 = Effects/Fill/Stroke + Color System + Context Menus + Keyboard Shortcuts). User-specified label "Round 5: Transform Tasks" preserved per instruction.**
> **Depends on**: Plan 11 R6 (transform math — `transformTypes.ts`, controller, handlers), Plan 10 R6 (store shims)
> **Reference**: design.md `## Round 6: Transform Engine — Property Panel & Numeric Dialog` §R6.1–R6.6

| # | Task | Depends On | Est. Hours |
|---|---|---|---|
| TR-T01 | `TransformPropertyPanelSection` + `OriginSelector` | TR-T05 (i18n keys), Plan 11 TR-T01 | 3 |
| TR-T02 | `ChainLockButton` reuse check (search existing UI first) | — (first) | 0.5 |
| TR-T03 | `NumericTransformDialog` | TR-T05, Plan 11 TR-T01 | 2.5 |
| TR-T04 | `useTemplateElementEditorStore` additions (`numericTransformDialogOpen`) + reset handler | — (first) | 1 |
| TR-T05 | Transform i18n keys AR + EN (panel + dialog) | — (first) | 1 |
| TR-T07 | Knowledge propagation | ALL above | 1 |

### Instruction File & AGENTS.md Discovery (Plan 12 Transform)

| Task | Files | AGENTS.md | Instructions |
|---|---|---|---|
| TR-T01 | `frontend/views/dashboard/cert/templates/editor/property-panel/TransformPropertyPanelSection.tsx`, `...OriginSelector.tsx` (new ×2) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `frontend.instructions.md` |
| TR-T02 | Search `frontend/components/ui/` for existing `ChainLockButton` | `AGENTS.md` | `frontend.instructions.md` |
| TR-T03 | `frontend/views/dashboard/cert/templates/editor/property-panel/NumericTransformDialog.tsx` (new) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `frontend.instructions.md` |
| TR-T04 | `frontend/common/stores/cert/useTemplateElementEditorStore.ts` (modify) | `frontend/stores/AGENTS.md`, `AGENTS.md` | `frontend.instructions.md` |
| TR-T05 | `shared/locale/types/dashboard/certificates/templateEditor.ts`, `shared/locale/{ar,en}/dashboard/certificates/templateEditor.ts` (modify — append) | `shared/AGENTS.md`, `AGENTS.md` | `frontend.instructions.md` |
| TR-T07 | `frontend/IMPLEMENTATION_LEARNINGS.md`, `frontend/AGENTS.md` (append) | `AGENTS.md` | — |

### TR-T01 — `TransformPropertyPanelSection` + `OriginSelector`

- [ ] Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Create `frontend/views/dashboard/cert/templates/editor/property-panel/TransformPropertyPanelSection.tsx` (per design.md R6.2):
  - Reuse `CollapsiblePanelShell` (Round 5 R5.2 pattern — check `frontend/components/ui/` first)
  - Section fields (all `TextField`s read from selected element's `transform`):
    - Position X, Y (with `OriginSelector` accessory — top-left/center/bottom-right origin)
    - Width, Height with chain-lock icon (TR-T02 result — reuse if found, else create in `frontend/common/stores/cert/transformTypes.ts` types only)
    - Rotation angle slider + numeric `TextField` (-180..+180); `Slider` `valueLabelDisplay="auto"`
    - Skew X, Skew Y angle `TextField`s (-45..+45)
    - Flip H, Flip V quick `IconButton`s — call `applyFlip` from Plan 10 store shim (or call directly to Plan 11 handler if registered)
    - Reset button — calls `resetElementTransform(elementId)`
  - **Live update**: onChange commits to element store immediately (every keystroke throttle ~16ms via `setTimeout` debounce to keep 60fps)
  - **Undo**: each *committed* field change (not keystroke) is one undo step — manual `pushUndoSnapshot` before applying
  - **i18n labels**: `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` namespace — `transform.panel.position`, `.size`, `.rotation`, `.skewX`, `.skewY`, `.flipH`, `.flipV`, `.reset`, `.origin.*`
  - MUI v9: `sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}` — no style props
  - Theme palette colors only: `sx={{ color: 'text.primary' }}` (no hardcoded hex)
- [ ] Create `frontend/views/dashboard/cert/templates/editor/property-panel/OriginSelector.tsx`:
  - `IconButton` grid of 9 small squares (matches reference point 3×3 grid from Plan 11 options bar)
  - Three-row × three-column layout, selected square highlighted via `sx={{ backgroundColor: 'primary.main', color: 'onPrimary' }}`
  - `value`/`onChange` props of type `ReferencePointPosition` (import from `@/frontend/common/stores/cert/transformTypes`)
- [ ] **Quality loop**: tsgo + biome + lint queue client

### TR-T02 — `ChainLockButton` Reuse Check

- [ ] Read `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Grep `frontend/` for `ChainLockButton`, `chainLock`, `proportional` (search composited in case it was added during R5 fill/stroke)
- [ ] If found — reuse the existing one; don't recreate (DRY per AGENTS.md rule "single canonical")
- [ ] If not found — define `ChainLockButton` inline within `TransformPropertyPanelSection.tsx` (keep it local; no separate file unless reused elsewhere); once reused elsewhere, refactor to `frontend/components/ui/ChainLockButton.tsx` (and update this task's checklist reference)
- [ ] The icon: `LinkOutlined` from `@mui/icons-material` toggling to `LinkOffOutlined` when off — theme palette `primary.main`
- [ ] **Quality loop**: tsgo + biome + lint queue client (skip if no files created/modified during the grep check)

### TR-T03 — `NumericTransformDialog`

- [ ] Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Create `frontend/views/dashboard/cert/templates/editor/property-panel/NumericTransformDialog.tsx` (per design.md R6.3):
  - `Dialog` opened when `useTemplateElementEditorStore.getState().numericTransformDialogOpen === true`
  - Fields:
    - Position: X, Y (with `OriginSelector` accessory — same as panel) + relative/absolute `Switch` (`Switch` label from i18n `transform.dialog.absolute` / `.relative`)
    - Size: W, H with chain-lock icon (TR-T02 result)
    - Rotation: angle (-180..+180)
    - Skew: X angle, Y angle (-45..+45)
  - **Apply button** (default action): commits the transform to all elements in `selectedElementIds` (closure-captures from store); closes dialog
  - **Copy Transformed** button (secondary action): duplicates each selected element (clone service call — creates new IDs via nanoid), then applies transform to the duplicate(s) — dialog stays open for repeat use
  - Buttons in `DialogActions`; primary=`Apply` (`color="primary"`), `Copy Transformed` (`color="secondary"`), `Cancel` (`color="inherit"`)
  - `aria-label`s from `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)`: `transform.dialog.title`, `.apply`, `.copyTransformed`, `.cancel`, `.absolute`, `.relative`
  - **Live preview**: same debounce pattern as TR-T01 — preview during typing in dialog without committing (use a local draft state + `committed` snapshot on Apply)
  - **Undo**: each Apply is a single undo step that bundles all the field changes; Copy Transformed is a single undo step that bundles duplication + transform
- [ ] **Quality loop**: tsgo + biome + lint queue client

### TR-T04 — `useTemplateElementEditorStore` Numeric Dialog State + Reset Handler

- [ ] Read `frontend/stores/AGENTS.md`, `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Modify `frontend/common/stores/cert/useTemplateElementEditorStore.ts`:
  - Add `numericTransformDialogOpen: boolean` (default `false`)
  - `setNumericTransformDialogOpen(open: boolean): void`
  - `resetElementTransform(elementId: string): void`
    - Resets the element's `transform` field to identity: `{ x: element.attrs.x, y: element.attrs.y, width: element.attrs.width, height: element.attrs.height, rotation: 0, skewX: 0, skewY: 0, flipH: false, flipV: false }` (whatever the canonical `ElementTransform` shape is — confirm from existing `elementData.ts` types in Plan 11)
    - Pushes an undo snapshot BEFORE the reset (so reset is undoable)
    - Does NOT reset `warpPoints` (warp is committed separately per Plan 11 design R6.9 — reset warp is a future R7 task)
  - Persist `numericTransformDialogOpen` only in session state (NOT to localStorage — this is a dialog toggle; ephemeral)
  - `logger` from `@/frontend/utils/logger` per AGENTS.md logging rule (never `console.*`, never `@/backend/lib/logger` from frontend)
- [ ] **Quality loop**: tsgo + biome + lint queue client

### TR-T05 — Transform i18n Keys (Plan 12 Panel + Dialog)

- [ ] Read `shared/AGENTS.md`, `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Modify `shared/locale/types/dashboard/certificates/templateEditor.ts` — append to `certificateEditor.transform`:
  - `panel: { title: string; position: { x: string; y: string }; size: { width: string; height: string }; rotation: string; skewX: string; skewY: string; flipH: string; flipV: string; reset: string; origin: { topLeft: string; center: string; bottomRight: string } }`
  - `dialog: { title: string; absolute: string; relative: string; apply: string; copyTransformed: string; cancel: string }`
  - All plain `string` types per design.md R6.5 (no interpolation, no pluralization)
- [ ] Modify `shared/locale/ar/dashboard/certificates/templateEditor.ts` — append Arabic implementations
- [ ] Modify `shared/locale/en/dashboard/certificates/templateEditor.ts` — append English implementations
- [ ] Per `shared/AGENTS.md`: plain strings are plain template literals; no interpolation → no `(param: string) => string` signature
- [ ] **Quality loop**: tsgo + biome + lint queue client

### TR-T07 — Knowledge Propagation (Plan 12 R6)

- [ ] Update `frontend/IMPLEMENTATION_LEARNINGS.md` (append-only):
  - "Numeric dialog exposes `Apply` AND `Copy Transformed` — two actions on one `DialogActions` row; users sometimes expect copy to close the dialog — keep open for repeat uses (build patterns)"
  - "Numeric dialog live-preview is a local draft, NOT a store write — committing happens on Apply; rationale: dialog `Cancel` should be cheap"
  - "Property panel changes commit per-field with debounce; bundle undo snapshots so one keystroke is one undo step — don't over-fragment undo history"
  - "`OriginSelector` reused between options bar (Plan 11 R6-T10) and numeric dialog (Plan 12 R6-T3) — single source of truth"
- [ ] Update `frontend/COMPONENT_PATTERNS.md` (append-only):
  - "Property Panel Section with Live Update + Undo Bullets" pattern
  - "Numeric Input Dialog with Apply vs Copy Transformed" pattern
- [ ] Update `frontend/AGENTS.md` (append-only):
  - Reference `TransformPropertyPanelSection`, `NumericTransformDialog`, `resetElementTransform` and their canonical locations
  - Note the cross-plan contract: `OriginSelector` is owned by Plan 12 R6-T1; Plan 11 imports it (no duplication)
- [ ] **Quality loop**: tsgo + biome + lint queue client

### Round 5 Execution Order (Plan 12 Transform)

```
Phase TR-A (par):  TR-T02 (ChainLockButton search — first; decisive for TR-T01/T03)
                   TR-T04 (element editor store additions — independent)
                   TR-T05 (i18n — independent)
Phase TR-B (seq):  TR-T01 (TransformPropertyPanelSection — waits on TR-T02 + TR-T05)
Phase TR-C (seq):  TR-T03 (NumericTransformDialog — waits on TR-T02 + TR-T05)
Phase TR-E (seq):  TR-T07 (knowledge propagation)
```

**Plan 12 R6 total**: ~9 hours → ~5 wall-clock hours (parallelism in TR-A)

### Plan 12 Combined Total Time (Rounds 1-6)

- Rounds 1-3: ~30 hours → ~18 wall-clock
- Round 4: ~20 hours → ~12 wall-clock
- Round 5 Fill/Stroke + Color System + Context Menus + Keyboard Shortcuts (existing): ~112 hours → ~56 wall-clock
- Round 5 Transform (TR-T01..TR-T07): ~11 hours → ~6 wall-clock
- **Plan 12 total**: ~173 hours → ~92 wall-clock hours

> All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks (tsgo → biome → lint → codescene). The lint queue server must be running before any lint call. See `AGENTS.md` §"Lint Queue Server" for startup commands.

---

## Round 5: Mask & Clipping Tasks

> Round 5 task list for Plan 12 — mask/clipping property panel UI: mask properties panel (density/feather/smooth/contrast/shift edge/view modes/invert/apply/delete/disable), Refine Edge dialog, opacity mask editor, clipping mask properties, mask brush settings, Quick Mask panel, and i18n keys. These consume types from Plan 10 R5 MASK-T01 (`@/frontend/common/stores/cert/maskTypes`) and store actions from MASK-T02. The canvas renderers are Plan 11's MASK-C01-C11. Total R5 mask scope for Plan 12: 9 tasks (~30 hours).

### Task Dependencies Graph (Round 5 — Masking)

```
MASK-T01 (maskTypes.ts shared types — from Plan 10, already created)
  │
  ├── MASK-P01 (MaskPropertyPanel — density/feather/smooth/contrast/shiftEdge + view modes + buttons)
  │       └── MASK-P02 (RefineEdgeDialog — reads refineSettings from store, writes to store; canvas previews)
  │
  ├── MASK-P03 (OpacityMaskEditor — dual-thumbnail + clip/invert/link)
  │
  ├── MASK-P04 (ClippingMaskProperties — "clipped to" / "base for" display + release/edit buttons)
  │
  ├── MASK-P05 (MaskBrushSettings — size/hardness/opacity/flow/pressure/brush presets)
  │
  ├── MASK-P06 (QuickMaskPanel — mode/color/opacity — mirrored from Plan 10's popover)
  │
  ├── MASK-P07 (i18n: AR + EN keys + type schema extend)
  │
  ├── MASK-P08 (store additions refinement — ensure MaskPropertyPanel store actions are complete)
  │       └── (MASK-P09 integration verification — depends on MASK-P01..P08)
  │
  └── MASK-P09 (knowledge propagation)
```

**Execution order**: MASK-P01 first → (MASK-P02, MASK-P03, MASK-P04, MASK-P05, MASK-P06, MASK-P07, MASK-P08 parallel after P01) → MASK-P09 (waits all)

**Estimated effort**: ~30 hours (~18 wall-clock hours via mid-phase parallelism)

---

### MASK-P01: Mask Property Panel

**Estimated time**: 4 hours
**Depends on**: Plan 10 MASK-T01 (types), MASK-T02 (store actions: `setMaskProperty`, `setMaskViewMode`, `invertMask`, `applyMask`, `deleteMask`, `toggleMaskEnabled`)
**Requirements**: design.md §R5.1

- [ ] **Read applicable AGENTS.md** (before working in each):
  - `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`

- [ ] **Read applicable instruction files**:
  - `.agents/instructions/frontend.instructions.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/panels/MaskPropertyPanel.tsx`:
  - `MaskPropertyPanelProps: { elementId, mask: LayerMaskData | null, maskType, viewMode, on*Change callbacks }`
  - **Mask type indicator** (`Chip`) — "Pixel Mask" / "Vector Mask" / "Clipping Mask" — colors from theme palette:
    - pixel → `theme.palette.info.main`
    - vector → `theme.palette.success.main`
    - clipping → `theme.palette.warning.main`
  - **Density slider** (`Slider` 0-100, `%`) — `onChangeCommitted` → `setMaskProperty(elementId, { density })`; `aria-valuetext`
  - **Feather slider** (`Slider` 0-250, `px`) — same pattern
  - **Smooth slider** (`Slider` 0-100)
  - **Contrast slider** (`Slider` -100 to +100, `%`) — 0 centered
  - **Shift Edge slider** (`Slider` -100 to +100, `%`) — 0 centered
  - **View Mode** (`ToggleButtonGroup` exclusive, 6 modes) — each `ToggleButton` is icon + tooltip:
    - Marching Ants → `TimelineOutlined` icon, i18n: `mask.viewMode.marchingAnts`
    - Overlay → `LayersOutlined`, `mask.viewMode.overlay`
    - On Black → `Brightness2Outlined`, `mask.viewMode.onBlack`
    - On White → `Brightness7Outlined`, `mask.viewMode.onWhite`
    - On Layers → `CollectionsOutlined`, `mask.viewMode.onLayers`
    - Mask Only → `InvertColorsOutlined`, `mask.viewMode.maskOnly`
  - **Button row**: Invert (`Button` outlined), Apply (`Button` contained `color="primary"` — confirmation `Dialog`), Delete (`Button` outlined `color="error"` — confirmation `Dialog`), Disable (`Button` outlined — label toggles Enable/Disable)
  - All `sx={{}}` — no style props; all colors from theme palette — never hardcoded
  - `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` — keys: `mask.typeIndicator.*`, `mask.density`, `mask.feather`, `mask.smooth`, `mask.contrast`, `mask.shiftEdge`, `mask.viewMode.*`, `mask.invert`, `mask.apply`, `mask.delete`, `mask.enable`, `mask.disable`, `mask.confirm.*`
  - Subscribe to `mask` data via `useShallow` selector — re-renders only on `mask.density`/`feather`/`smooth`/`contrast`/`shiftEdge` change, not entire element
  - Confimation `Dialog` for Apply: `DialogTitle` + `DialogContentText` (`mask.confirm.applyTitle` / `applyMessage`) + `DialogActions` (Cancel / Confirm)
  - **Quality loop**: tsgo → biome → lint → codescene (progressive, short-circuits on first failure)
    ```bash
    bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/panels/MaskPropertyPanel.tsx --lifecycle codescene
    ```

### MASK-P02: Refine Edge Dialog

**Estimated time**: 4 hours
**Depends on**: MASK-P01 (mask properties panel — Refine Edge button launches this)
**Requirements**: design.md §R5.2

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Read applicable instruction files**:
  - `.agents/instructions/frontend.instructions.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/panels/RefineEdgeDialog.tsx`:
  - `RefineEdgeDialogProps: { open, onClose, onApply, elementId, initialSettings? }`
  - **Dialog layout** (MUI v9 `Dialog`):
    - View Mode `Select` dropdown — sets `maskViewMode` on store (canvas previews behind dialog)
    - Smooth `Slider` (0-100) → `setRefineEdgeSettings({ smooth })` on store
    - Feather `Slider` (0-250px) → `setRefineEdgeSettings({ feather })`
    - Contrast `Slider` (0-100%) → `setRefineEdgeSettings({ contrast })`
    - Shift Edge `Slider` (-100 to +100%) → `setRefineEdgeSettings({ shiftEdge })`
    - Decontaminate `Checkbox` → `setRefineEdgeSettings({ decontaminate })`
    - Decontaminate Amount `Slider` (0-100%) — disabled when Checkbox unchecked
    - Output to `RadioGroup` (4 options): Layer Mask / New Document / New Layer with Layer Mask / New Selection
    - Cancel `Button` + Apply `Button` (`color="primary"`)
  - **Live preview**: every slider/checkbox change → `setRefineEdgeSettings(partial)` on store — Plan 11's `RefineEdgePreviewOverlay` reads `refineSettings` and re-renders (debounced 100ms by Plan 11)
  - Dialog is **stateless** — reads/writes store, no local state to sync (ensures preview is authoritative)
  - `keepMounted` on `Dialog` — preview state persists across open/close
  - All `sx={{}}`, colors from theme palette
  - i18n keys: `mask.refineEdge.title`, `.smooth`, `.feather`, `.contrast`, `.shiftEdge`, `.decontaminate`, `.decontaminateAmount`, `.output.layerMask`/`.newDocument`/`.newLayerWithMask`/`.newSelection`, `.apply`
  - Accessibility: sliders announce `aria-valuetext`; RadioGroup has `aria-label`; Dialog has `aria-labelledby` for title
  - **Quality loop**: tsgo → biome → lint → codescene (progressive, short-circuits on first failure)
    ```bash
    bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/panels/RefineEdgeDialog.tsx --lifecycle codescene
    ```

### MASK-P03: Opacity Mask Editor

**Estimated time**: 3 hours
**Depends on**: Plan 10 MASK-T01/MASK-T02 (`addOpacityMask`, `setMaskProperty`, `toggleOpacityMaskLink`, `toggleOpacityMaskClip`, `invertOpacityMask`)
**Requirements**: design.md §R5.3

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/panels/OpacityMaskEditor.tsx`:
  - `OpacityMaskEditorProps: { elementId, opacityMask, onMaskContentEdit, onClipToggle, onInvert, onUnlink }`
  - **Dual thumbnails** (Illustrator-style):
    - Element thumbnail (left) — shows element content (read-only miniature, reuses existing element thumbnail component)
    - Link icon between thumbnails (`LinkOutlined` / `LinkOffOutlined` from MUI v9) — click toggles `toggleOpacityMaskLink`
    - Mask thumbnail (right) — shows opacity mask in grayscale. Click → `setActiveMaskTarget(elementId, 'layer', 'opacityMask')` + `setMaskMode('edit')` → enters mask editing mode for opacity mask
  - **Clip checkbox** — `toggleOpacityMaskClip(elementId)`
  - **Invert button** — `invertOpacityMask(elementId)`
  - "Click mask thumbnail to edit" hint text (`Typography variant="caption" sx={{ color: 'text.secondary' }}`)
  - All `sx={{}}`, no style props, no hardcoded colors
  - i18n keys: `mask.opacityMask.title`, `.link`, `.unlink`, `.clip`, `.invert`, `.editMask`, `.transformIndependent`
  - `React.memo` on dual thumbnails — re-render only on mask version change (not every element change)
  - **Quality loop**: tsgo → biome → lint → codescene (progressive, short-circuits on first failure)
    ```bash
    bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/panels/OpacityMaskEditor.tsx --lifecycle codescene
    ```

### MASK-P04: Clipping Mask Properties

**Estimated time**: 2 hours
**Depends on**: Plan 10 MASK-T02 (`releaseClippingMask`)
**Requirements**: design.md §R5.4

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/panels/ClippingMaskProperties.tsx`:
  - `ClippingMaskPropertiesProps: { elementId, isClipped, isBase, baseElementId?, clippedElementIds, onRelease, onEditBaseShape }`
  - If `isClipped`: `Typography` "Clipped to: {baseElementName}" — uses interpolation key `mask.clipping.clippedToName(baseName)`
  - "Release Clipping Mask" `Button` (`color="primary"` outlined) → `releaseClippingMask`
  - Masking type indicator: vector (shape base) vs raster (image/group base) — `Chip` with `theme.palette.warning.main`
  - If `isBase`: `Typography` "Clipping base for: {names}" — uses `mask.clipping.baseForList(names)` interpolation + `List` of `ListItem` names
  - "Edit Clipping Shape" `Button` → enters base shape path edit mode
  - Description text: `mask.clipping.description` ("Element visible only inside the base shape's area")
  - All `sx={{}}`, colors from theme palette
  - i18n keys: `mask.clipping.description`, `.clippedTo`, `.clippedToName(name)`, `.baseFor`, `.baseForList(names)`, `.release`, `.editShape`, `.vectorType`, `.rasterType`
  - **Quality loop**: tsgo → biome → lint → codescene (progressive, short-circuits on first failure)
    ```bash
    bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/panels/ClippingMaskProperties.tsx --lifecycle codescene
    ```

### MASK-P05: Mask Brush Settings Panel

**Estimated time**: 3 hours
**Depends on**: MASK-P01 (shares brush settings with mask editing mode)
**Requirements**: design.md §R5.5

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/panels/MaskBrushSettings.tsx`:
  - `MaskBrushSettingsProps: { brushSize, brushHardness, brushOpacity, brushFlow, activeTool, on*Change }`
  - **Brush Size** `Slider` (1-5000px) + `TextField` — `aria-valuetext`
  - **Hardness** `Slider` (0-100%) — 0 = fully soft, 100 = hard
  - **Opacity** `Slider` (0-100%) — max per stroke
  - **Flow** `Slider` (0-100%) — rate of application
  - **Pressure** `Checkbox` — disabled if no pen input (`navigator.maxTouchPoints === 0` and no `pointerType === 'pen'` events received). Status indicator: `Typography` "Pressure sensitivity: Active" / "Not detected" (`mask.brushSettings.pressureActive` / `.notDetected`)
  - **Default Brush** `Select`: "Soft Round" (default), "Hard Round", "Airbrush"
  - **Context-appropriate**: if `activeTool === 'gradientMask'`, show gradient start/end color pickers instead of hardness
  - All `sx={{}}`, colors from theme palette
  - i18n keys: `mask.brushSettings.title`, `.size`, `.hardness`, `.opacity`, `.flow`, `.pressure`, `.pressureActive`, `.notDetected`, `.defaultBrush`, `.softRound`, `.hardRound`, `.airbrush`
  - Brush settings stored in the store (or local state synced to store) — canvas reads them via `useStore` selector; panel doesn't cause canvas re-renders on every slider move (primitive numbers)
  - **Quality loop**: tsgo → biome → lint → codescene (progressive, short-circuits on first failure)
    ```bash
    bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/panels/MaskBrushSettings.tsx --lifecycle codescene
    ```

### MASK-P06: Quick Mask Panel

**Estimated time**: 2 hours
**Depends on**: Plan 10 MASK-T02 (`setQuickMaskOptions`)
**Requirements**: design.md §R5.6

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/panels/QuickMaskPanel.tsx`:
  - `QuickMaskPanelProps: { options, onModeChange, onColorChange, onOpacityChange }`
  - **Mode** `ToggleButtonGroup` (exclusive): "Masked Areas" (paint to hide, default) / "Selected Areas" (paint to select)
  - **Color** `ColorPicker` (reuse existing Plan 10 R5 color picker) — default `theme.palette.error.main` (red, from theme — never hardcoded)
  - **Opacity** `Slider` (0-100, default 50) — `aria-valuetext`
  - All `sx={{}}`, no style props, colors from theme palette
  - i18n keys: `mask.quickMaskPanel.title`, `mask.quickMask.mode`, `.maskedAreas`, `.selectedAreas`, `.color`, `.opacity`
  - **Quality loop**: tsgo → biome → lint → codescene (progressive, short-circuits on first failure)
    ```bash
    bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/panels/QuickMaskPanel.tsx --lifecycle codescene
    ```

### MASK-P07: i18n Keys (AR + EN) + Type Schema Extend

**Estimated time**: 3 hours
**Depends on**: Plan 10 MASK-T09 (shares the `mask.*` namespace — Plan 10 creates the base keys, Plan 12 extends with panel-specific keys)
**Requirements**: design.md §R5.7

- [ ] **Read applicable AGENTS.md**:
  - `shared/AGENTS.md` (i18n compile-time system rules — pluralization `(count: number) => string`, interpolation `(param: string) => string`)
  - `AGENTS.md`

- [ ] **Read applicable instruction files**:
  - `.agents/instructions/frontend.instructions.md`

- [ ] **Modify** `shared/locale/types/templateEditor.ts` (type schema — extend the `mask` namespace from Plan 10):
  - Append Plan 12-specific keys (see design §R5.7):
    - `typeIndicator: { pixel, vector, clipping }`
    - `density`, `feather`, `smooth`, `contrast`, `shiftEdge`
    - `viewMode: { marchingAnts, overlay, onBlack, onWhite, onLayers, maskOnly }`
    - `invert`, `apply`, `delete`, `enable`, `disable`
    - `refineEdge: { title, smooth, feather, contrast, shiftEdge, decontaminate, decontaminateAmount, output: { layerMask, newDocument, newLayerWithMask, newSelection }, apply }`
    - `opacityMask: { title, link, unlink, clip, invert, editMask, transformIndependent }`
    - `clipping: { description, clippedTo, clippedToName: (name: string) => string, baseFor, baseForList: (names: string) => string, release, editShape, vectorType, rasterType }`
    - `brushSettings: { title, size, hardness, opacity, flow, pressure, pressureActive, notDetected, defaultBrush, softRound, hardRound, airbrush }`
    - `quickMaskPanel: { title }`
    - `confirm: { applyTitle, applyMessage, deleteTitle, deleteMessage, rasterizeTitle, rasterizeMessage }`
  - Interpolation keys use `(param: string) => string` pattern per AGENTS.md i18n rules
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] **Modify** `shared/locale/ar/.../templateEditor.ts`:
  - Implement all Plan 12 `mask.*` keys in Arabic (RTL-aware)
  - Interpolation: `clippedToName: (name) => \`مقصوص على: \${name}\``, `baseForList: (names) => \`قاعدة القص لـ: \${names}\``
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] **Modify** `shared/locale/en/.../templateEditor.ts`:
  - Implement all Plan 12 `mask.*` keys in English
  - Interpolation: `clippedToName: (name) => \`Clipped to: \${name}\``, `baseForList: (names) => \`Clipping base for: \${names}\``
  - **Quality loop**: tsgo + biome + lint queue client

### MASK-P08: Store Additions Refinement

**Estimated time**: 2 hours
**Depends on**: Plan 10 MASK-T02 (store created — Plan 12 ensures it has all actions the panels need)
**Requirements**: design.md §R5.9

- [ ] **Read applicable AGENTS.md**:
  - `frontend/stores/AGENTS.md`, `AGENTS.md`

- [ ] **Read applicable instruction files**:
  - `.agents/instructions/frontend.instructions.md`

- [ ] **Verify/Modify** `frontend/common/stores/cert/certTemplateEditorStore.ts` (coordinate with Plan 10 MASK-T02):
  - Ensure all mask actions used by Plan 12 panels exist: `setMaskProperty`, `setMaskViewMode`, `invertMask`, `applyMask` (destructive), `deleteMask`, `toggleMaskEnabled`, `setMaskMode`, `setActiveMaskTarget`
  - `setRefineEdgeSettings(partial: Partial<RefineEdgeSettings>)` — writes to `refineSettings` state
  - `applyRefineEdge(settings)` — commits refine settings to mask data (bakes smooth/feather/contrast/shiftEdge into the stored `LayerMaskData`); if output = 'newDocument', dispatches `openNewDocument(maskElement)` action; if 'newLayerWithMask', creates new element + mask; if 'newSelection', converts to selection
  - `addOpacityMask`, `deleteOpacityMask`, `toggleOpacityMaskClip`, `invertOpacityMask`, `toggleOpacityMaskLink` — for `OpacityMaskEditor`
  - `setMaskProperty` must accept `Partial<LayerMaskData>` — updates only the specified fields, increments `mask.version`
  - Persistence: verify `maskMode`, `activeMaskTarget`, `quickMaskActive`, `quickMaskOptions`, `maskViewMode`, `refineSettings` are NOT in `persist` partializer (ephemeral). Only element-level `layerMask`/`vectorMask`/`clippingMaskBaseId`/`clippingMaskClippedIds`/`opacityMask` persisted.
  - **Quality loop**: tsgo → biome → lint → codescene (progressive, short-circuits on first failure)
    ```bash
    bun run scripts/health/sub-loop.ts frontend/common/stores/cert/certTemplateEditorStore.ts --lifecycle codescene
    ```

### MASK-P09: Knowledge Propagation

**Estimated time**: 4 hours
**Depends on**: MASK-P01 through MASK-P08
**Requirements**: all design sub-sections

- [ ] **Read applicable AGENTS.md**:
- [ ] **Append** to `frontend/IMPLEMENTATION_LEARNINGS.md` (append-only):
  - "Mask property panel sliders commit on `onChangeCommitted`, NOT `onChange` — per-move commits cause store churn and canvas re-render thrash."
  - "Refine Edge dialog is stateless — all slider changes write to `refineSettings` in the store, and Plan 11's preview reads from there. Never duplicate live-preview state in the dialog."
  - "Opacity mask `clip` checkbox: when true, content outside original element bounds is masked — implemented as `<mask>` with `clipPath` set to element bounds."
  - "Mask brush settings: `navigator.maxTouchPoints === 0` doesn't guarantee no pen — some pens register as mouse. Use `pointerType === 'pen'` detection in a preview pointer event."
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] **Append** to `frontend/COMPONENT_PATTERNS.md` (append-only):
  - Pattern: "Mask property panel — `Slider` + `onChangeCommitted` (not `onChange`) + `aria-valuetext` for screen readers"
  - Pattern: "Confirmation `Dialog` for destructive mask operations — `DialogTitle` + `DialogContentText` + `DialogActions` with Cancel/Confirm"
  - Pattern: "Refine Edge dialog — stateless dialog writing to store, canvas reads for live preview"
  - Pattern: "Dual-thumbnail opacity mask editor — `Stack` direction="row" with `IconButton` link icon between"
  - **Quality loop**: tsgo + biome + lint queue client

---

### Instruction File & AGENTS.md Discovery (Plan 12 — Masking)

| Task | Files Created/Modified | AGENTS.md to Read | Instructions to Read |
|------|-----------------------|-------------------|----------------------|
| MASK-P01 | `MaskPropertyPanel.tsx` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-P02 | `RefineEdgeDialog.tsx` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-P03 | `OpacityMaskEditor.tsx` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-P04 | `ClippingMaskProperties.tsx` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-P05 | `MaskBrushSettings.tsx` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-P06 | `QuickMaskPanel.tsx` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-P07 | `shared/locale/types/templateEditor.ts`, `shared/locale/ar/.../templateEditor.ts`, `shared/locale/en/.../templateEditor.ts` | `shared/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-P08 | `certTemplateEditorStore.ts` (verify/modify) | `frontend/stores/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-P09 | `frontend/IMPLEMENTATION_LEARNINGS.md`, `frontend/COMPONENT_PATTERNS.md` (append) | `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |

### Round 5 Execution Order (Plan 12 — Masking)

```
Phase R5M-A (sequential): MASK-P01 (MaskPropertyPanel — depends on Plan 10 T01/T02 being committed)
Phase R5M-B (parallel after P01): MASK-P02 (RefineEdgeDialog), MASK-P03 (OpacityMaskEditor), MASK-P04 (ClippingMaskProperties), MASK-P05 (MaskBrushSettings), MASK-P06 (QuickMaskPanel), MASK-P07 (i18n), MASK-P08 (store refinement)
  ^ all 7 are independent of each other — full parallel
Phase R5M-C (sequential after all): MASK-P09 (knowledge propagation)
```

**Plan 12 R5 mask total estimated time**: ~30 hours (~18 wall-clock hours via full-parallel Phase R5M-B)

### Plan 12 Combined Total Time (Rounds 1-5 + Mask)

- Rounds 1-3: ~36 hours → ~20 wall-clock hours
- Round 4: ~24 hours → ~14 wall-clock hours
- Round 5 Fill/Stroke (R5-T1-T14): ~40 hours → ~18 wall-clock hours
- Round 5 Pen Tool (R5-T1-T14): ~16 hours
- Round 5 Color System (R5-T1-T14): ~20 hours
- **Round 5 Masking (MASK-P1-P9)**: ~30 hours → ~18 wall-clock hours with full-parallel Phase B
- **Plan 12 total**: ~130 hours → ~70 wall-clock hours.

> All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks (tsgo → biome → lint → codescene). The lint queue server must be running before any lint call. See `AGENTS.md` §"Lint Queue Server" for startup commands.

## Round 5: Effects & Filter Tasks

- [ ] R5FX-T1. Create `EffectsPropertyPanel` component
  - Expandable section in properties panel
  - Shows all effects applicable to selected element
  - Toggle checkbox per effect
  - Expand/collapse settings per effect
  - Reset button per effect
  - File: `frontend/views/certificate-editor/components/panels/EffectsPropertyPanel.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5FX-T2. Create shadow effect controls (Drop Shadow + Inner Shadow)
  - Offset X/Y number inputs
  - Blur radius slider
  - Spread slider
  - Color picker integration
  - Opacity slider
  - Blend mode dropdown
  - File: `frontend/views/certificate-editor/components/panels/effects/ShadowEffectControls.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5FX-T3. Create glow effect controls (Outer Glow + Inner Glow)
  - Blur radius slider
  - Spread slider
  - Color picker
  - Opacity slider
  - File: `frontend/views/certificate-editor/components/panels/effects/GlowEffectControls.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5FX-T4. Create filter effect controls (Blur, Sharpen, Grayscale, etc.)
  - Gaussian blur slider
  - Sharpen amount
  - Grayscale/Sepia/Invert percentage
  - Brightness/Contrast percentage
  - Hue rotate degrees
  - Saturate percentage
  - File: `frontend/views/certificate-editor/components/panels/effects/FilterEffectControls.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5FX-T5. Implement effects stack ordering
  - Drag to reorder effects
  - Effects rendered in order (outer to inner)
  - Each row: drag handle, enable checkbox, name, expand, delete
  - File: `frontend/views/certificate-editor/components/panels/EffectsStackOrder.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5FX-T6. Create shadow presets component
  - "Soft Shadow", "Hard Shadow", "Inner Shadow", "Glow", "Text Shadow"
  - One-click apply presets
  - Customizable preset defaults
  - File: `frontend/views/certificate-editor/components/panels/effects/ShadowPresets.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5FX-T7. Create blend mode selector dropdown
  - All 15 blend modes
  - Live preview on canvas
  - File: `frontend/views/certificate-editor/components/panels/effects/BlendModeSelector.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5FX-T8. Implement CSS filter string generation
  - Compile effects to CSS `filter` property
  - Handle drop-shadow, blur, brightness, contrast, hue-rotate, saturate, grayscale, sepia, invert
  - File: `frontend/common/stores/cert/effectsCompiler.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5FX-T9. Add i18n keys for effects panel
  - shadow, innerShadow, outerGlow, innerGlow, blur, sharpen, grayscale, sepia, invert, brightness, contrast, hueRotate, saturate, blendMode, effectsTitle, resetEffect, softShadow, hardShadow, textShadow, opacity
  - Files: `shared/locale/en/certificateTemplateEditor.ts`, `shared/locale/ar/certificateTemplateEditor.ts`
  - _Quality loop_: tsgo + biome + lint queue client

## Round 5: Advanced Layers Tasks

- [ ] R5LY-T1. Create `LayersPanelEnhanced` component
  - Tree view with element z-order
  - Drag to reorder via dnd-kit
  - Group/ungroup support
  - Lock/Unlock per layer
  - Show/Hide per layer
  - Rename via double-click
  - Layer thumbnails (file node render)
  - Toggle clipping mask
  - File: `frontend/views/certificate-editor/components/panels/LayersPanelEnhanced.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5LY-T2. Implement layer drag-to-reorder
  - Use @dnd-kit/core for drag-and-drop
  - Drag handle on each layer row
  - Visual indicator during drag
  - Drop targets between layers
  - Collapse groups on hover
  - HSL color tag per layer
  - Opacity slider per layer (drop tooltip)
  - File: `frontend/views/certificate-editor/components/panels/LayerDragReorder.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5LY-T3. Implement layer thumbnails generation
  - Render mini preview per element
  - Cache thumbnails for performance
  - Regenerate on element change
  - Configurable thumbnail size
  - File: `frontend/views/certificate-editor/hooks/useLayerThumbnails.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5LY-T4. Implement layer panel keyboard navigation
  - Arrow Up/Down navigate layers
  - Enter edit name
  - Space toggle visibility
  - Ctrl+Space toggle lock
  - Delete remove layer
  - Ctrl+Arrow reorder
  - Shift+Arrow multi-select
  - File: `frontend/views/certificate-editor/hooks/useLayerKeyboardNav.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5LY-T5. Implement layer panel context menu
  - Duplicate, Delete, Merge Down, Flatten, Group, Ungroup
  - Lock/Unlock, Show/Hide, Isolate
  - Copy Style, Paste Style
  - Create/Release Clipping Mask
  - Convert to Smart Object, Rasterize
  - Export As SVG/PNG
  - File: `frontend/views/certificate-editor/components/panels/LayerContextMenu.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5LY-T6. Implement layer panel toolbar
  - New Layer, New Group, Delete, Duplicate buttons
  - Lock/Show toggle
  - Search bar with fuzzy filter
  - Filter dropdown (All, Visible, Locked, Effects)
  - Panel settings (thumbnail size)
  - File: `frontend/views/certificate-editor/components/panels/LayerPanelToolbar.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5LY-T7. Implement layer isolation mode
  - Click "isolate" to dim all other layers
  - Isolated layer highlighted
  - Exit isolation via Esc or toggle button
  - File: `frontend/views/certificate-editor/components/panels/LayerIsolation.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5LY-T8. Add i18n keys for layer panel
  - layerPanel, newLayer, newGroup, duplicate, delete, lock, unlock, show, hide, rename, mergeDown, flatten, mergeVisible, isolate, clipToBelow, releaseClip, copyStyle, pasteStyle, rasterize, exportAs, searchLayers, filterAll, filterVisible, filterLocked, filterEffects, thumbnailSize, opacity, blendMode, effectsCount
  - Files: `shared/locale/en/certificateTemplateEditor.ts`, `shared/locale/ar/certificateTemplateEditor.ts`
  - _Quality loop_: tsgo + biome + lint queue client

## Round 5: Asset Library Tasks

- [ ] R5AL-T1. Create `AssetPropertiesSection` component
  - Shows asset metadata (name, type, dimensions, file size, source)
  - For images: resolution, DPI, color space, transparency
  - For SVG: viewBox, path count, groups, layers
  - For QR/barcode: encoding type, error correction, module size
  - File: `frontend/views/certificate-editor/components/panels/AssetPropertiesSection.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5AL-T2. Implement "Replace Asset" action
  - Opens Asset Library dialog filtered to same type
  - Preserves element position, size, effects
  - Only swaps asset source
  - File: `frontend/views/certificate-editor/components/panels/ReplaceAssetButton.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5AL-T3. Create asset variations selector
  - Shows available variations of same asset
  - Select variation to swap in
  - Auto-fit checkboxes (maintain aspect ratio, cover, contain)
  - File: `frontend/views/certificate-editor/components/panels/AssetVariationsSelector.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5AL-T4. Implement asset usage indicator
  - Badge showing usage count across template
  - "Find All Uses" highlights elements using same asset
  - File: `frontend/views/certificate-editor/components/panels/AssetUsageIndicator.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5AL-T5. Implement asset export to library
  - Export selected element as asset to library
  - Set asset name, tags, category
  - Auto-crop transparent borders option
  - File: `frontend/views/certificate-editor/components/panels/ExportToAssetLibrary.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5AL-T6. Add i18n keys for asset properties
  - assetProperties, replaceAsset, assetVariations, autoFit, maintainRatio, cover, contain, usageCount, findAllUses, exportToLibrary, assetName, assetTags, assetCategory, autoCrop, resolution, dpi, colorSpace, transparency, viewBox, pathCount, iconCollection, encodingType, errorCorrection, moduleSize
  - Files: `shared/locale/en/certificateTemplateEditor.ts`, `shared/locale/ar/certificateTemplateEditor.ts`
  - _Quality loop_: tsgo + biome + lint queue client

## Round 5: Guides & Grid Tasks

- [ ] R5GG-T1. Create guides & grid properties panel section
  - Show current guide positions list
  - Add guide by position input
  - Delete guide from list
  - Lock/unlock guides toggle
  - Clear all guides button
  - File: `frontend/views/certificate-editor/components/panels/GuidesPanelSection.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5GG-T2. Create grid settings panel section
  - Grid size input (with unit selector)
  - Subdivisions input
  - Grid color picker (from theme palette)
  - Show/hide grid toggle
  - Snap to grid toggle
  - File: `frontend/views/certificate-editor/components/panels/GridSettingsPanel.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5GG-T3. Create snap tolerance control
  - Slider for snap threshold (1-20px)
  - Number input for precise value
  - Toggle snap to guides
  - Toggle snap to grid
  - Toggle snap to elements
  - File: `frontend/views/certificate-editor/components/panels/SnapToleranceControl.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5GG-T4. Add i18n keys for guides & grid properties panel
  - guidesList, addGuide, guidePosition, clearAll, gridSettings, gridSize, subdivisions, gridColor, showGrid, snapToGrid, snapToGuides, snapToElements, snapTolerance, lockGuides, unitsLabel
  - Files: `shared/locale/en/certificateTemplateEditor.ts`, `shared/locale/ar/certificateTemplateEditor.ts`
  - _Quality loop_: tsgo + biome + lint queue client

## Round 5: Pen Tool Tasks

- [ ] R5PV-T1. Create path properties panel section
  - Shows path data for selected vector element
  - Total path length
  - Number of anchor points
  - Number of segments
  - Open/closed path indicator
  - "Edit Path" button toggles path editing mode
  - File: `frontend/views/certificate-editor/components/panels/PathPropertiesSection.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5PV-T2. Create anchor point editor
  - Display anchor points as draggable handles
  - Show control handles for bezier curves
  - Click anchor to select, drag to move
  - Alt+click to convert smooth/corner point
  - Right-click for context menu (smooth, corner, delete)
  - File: `frontend/views/certificate-editor/components/panels/AnchorPointEditor.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5PV-T3. Create path operations panel
  - Close path / Open path toggle
  - Reverse path direction
  - Simplify path (reduce anchor points with tolerance)
  - Offset path (expand/contract by px)
  - Outline stroke (convert stroke to filled path)
  - File: `frontend/views/certificate-editor/components/panels/PathOperationsPanel.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5PV-T4. Create boolean operations UI for paths
  - Union (merge paths), Subtract, Intersect, Exclude
  - Division (cut path at intersection)
  - Show preview of boolean result
  - "Apply" bakes the boolean into a single path
  - File: `frontend/views/certificate-editor/components/panels/PathBooleanOperations.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5PV-T5. Implement path simplification algorithm
  - Douglas-Peucker or Visvalingam algorithm
  - Tolerance slider (0-10px)
  - Preserve sharp corners option
  - Live preview of simplified path
  - File: `frontend/common/stores/cert/pathSimplify.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5PV-T6. Add i18n keys for pen tool properties
  - pathProperties, pathLength, anchorPoints, segments, openPath, closedPath, editPath, anchorPoint, controlHandle, smoothPoint, cornerPoint, closePath, openPathAction, reversePath, simplifyPath, pathTolerance, offsetPath, outlineStroke, booleanUnion, booleanSubtract, booleanIntersect, booleanExclude, booleanDivide, applyBoolean
  - Files: `shared/locale/en/certificateTemplateEditor.ts`, `shared/locale/ar/certificateTemplateEditor.ts`
  - _Quality loop_: tsgo + biome + lint queue client

## Round 5: History & States Tasks

- [ ] R5H-T1. Create per-element history section in properties panel
  - Mini history dropdown (last 10 changes to this element)
  - Click to revert element to that state
  - "Element History" expandable section
  - File: `frontend/views/certificate-editor/components/panels/ElementHistorySection.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5H-T2. Implement properties snapshot on change
  - Snapshot before any property edit
  - Debounced 500ms undo checkpoints
  - Group rapid slider drag changes into single undo
  - "Revert to Previous" button
  - File: `frontend/views/certificate-editor/hooks/usePropertySnapshot.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5H-T3. Implement history brush for properties
  - Selective undo: undo only one property
  - Toggle history brush in properties panel
  - Drag slider shows previous values as ghost
  - File: `frontend/views/certificate-editor/components/panels/HistoryBrushToggle.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5H-T4. Create state comparison view
  - "Compare with Previous State" toggle
  - Diff view in properties panel
  - Changed properties highlighted in amber
  - Unchanged in normal color
  - File: `frontend/views/certificate-editor/components/panels/StateComparisonView.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5H-T5. Implement batch property history for multi-selection
  - Property changes apply to all selected elements
  - History entry covers all elements
  - Undo reverts all simultaneously
  - File: `frontend/views/certificate-editor/hooks/useBatchPropertyHistory.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5H-T6. Add i18n keys for element history
  - elementHistory, revertToPrevious, historyBrush, selectiveUndo, compareWithState, changedProperties, batchHistory, lastChanges
  - Files: `shared/locale/en/certificateTemplateEditor.ts`, `shared/locale/ar/certificateTemplateEditor.ts`
  - _Quality loop_: tsgo + biome + lint queue client

## Round 5: Canvas Pro Tasks

- [ ] R5C-T1. Implement DPI-aware property display
  - Show dimensions in document DPI unit
  - Toggle px/mm/in/cm for display
  - Actual rendered size in parenthesis at export DPI
  - "Print Size Preview" toggle
  - File: `frontend/views/certificate-editor/components/panels/DPIAwareDisplay.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5C-T2. Create artboard context properties
  - Show artboard-relative position
  - Toggle relative/absolute coordinates
  - Show page ownership
  - "Move to Page" dropdown
  - File: `frontend/views/certificate-editor/components/panels/ArtboardContextProperties.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5C-T3. Implement CMYK property values
  - Color picker shows CMYK alongside RGB/HEX/HSL
  - Editable CMYK fields (C%, M%, Y%, K%)
  - Gamut warning on CMYK fields
  - "Nearest CMYK" button
  - File: `frontend/views/certificate-editor/components/panels/CMYKPropertyValues.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5C-T4. Implement bleed awareness in properties
  - Warning if element extends beyond bleed area
  - "Fit to Bleed" button
  - Distance indicators from margins
  - File: `frontend/views/certificate-editor/components/panels/BleedAwarenessIndicator.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5C-T5. Implement export resolution properties
  - Per-element export resolution override
  - Dropdown: inherit, 72, 150, 300 DPI
  - High-res badge
  - Export validation warning for below 300 DPI
  - File: `frontend/views/certificate-editor/components/panels/ExportResolutionProperties.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5C-T6. Add i18n keys for canvas pro properties
  - dpiUnit, printSizePreview, artboardRelative, canvasAbsolute, pageOwnership, moveToPage, cmykValues, gamutWarning, nearestCMYK, bleedWarning, fitToBleed, distanceFromMargin, exportResolution, inheritFromDocument, highResBadge, dpiWarning
  - Files: `shared/locale/en/certificateTemplateEditor.ts`, `shared/locale/ar/certificateTemplateEditor.ts`
  - _Quality loop_: tsgo + biome + lint queue client

## Round 5: Workspace & Panel Tasks

- [ ] R5W-T1. Create properties panel tab system
  - Tabs: Properties, Transform, Effects, History, Asset
  - Customizable tab order
  - Tear-off into floating panels
  - Drag to reorder tabs
  - Active tab remembered per workspace
  - File: `frontend/views/certificate-editor/components/panels/PropertiesTabSystem.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5W-T2. Implement properties panel auto-collapse
  - Auto-collapse when element deselected
  - Reduce to icon-only when canvas space low
  - Expand on hover when collapsed
  - Pin button to keep expanded
  - File: `frontend/views/certificate-editor/components/panels/PropertiesAutoCollapse.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5W-T3. Implement contextual properties tabs
  - Adapt tabs to selection type
  - Text: Character + Paragraph
  - Shape: Fill + Stroke + Path
  - Image: Asset + Effects + Mask
  - Group: Layer + Blend + Transform
  - File: `frontend/views/certificate-editor/components/panels/ContextualPropertiesTabs.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5W-T4. Create properties panel size modes
  - Compact (3 properties per section)
  - Standard (5 properties per section)
  - Expanded (all properties)
  - Size mode toggle in panel header
  - Saved per workspace
  - File: `frontend/views/certificate-editor/components/panels/PropertiesSizeModes.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5W-T5. Implement quick properties access
  - Right-click element → Quick Properties
  - Compact mini-properties near cursor
  - Position, size, rotation, fill, opacity
  - Dismisses on Escape/click elsewhere
  - Quick switch to full panel
  - File: `frontend/views/certificate-editor/components/panels/QuickProperties.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5W-T6. Implement properties panel persistence
  - Last active tab saved per element type
  - Expanded sections saved per element instance
  - Custom layout saved per workspace
  - File: `frontend/common/stores/cert/propertiesPanelPersist.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5W-T7. Add i18n keys for properties panel workspace
  - propertiesTab, transformTab, effectsTab, historyTab, assetTab, tabOrder, tearOffPanel, contextualProperties, compactMode, standardMode, expandedMode, sizeMode, quickProperties, pinPanel, autoCollapse, lastActiveTab
  - Files: `shared/locale/en/certificateTemplateEditor.ts`, `shared/locale/ar/certificateTemplateEditor.ts`
  - _Quality loop_: tsgo + biome + lint queue client

