# Plan 13: Template Variable Management — Tasks

> **Plan #:** 13
> **Dependencies:** Plan 5 (GraphQL API), Plan 10 (Template Editor Basic)
> **Total Tasks:** 11
> **Estimated Effort:** 22-33 hours
> **Execution Model**: Parallel subagents per independent task group (see dependency graph for parallelization points)

---

## Task Dependency Graph

```
T01 ──┐
      ├──→ T03 ──→ T04 ──→ T07 ──┐
T02 ──┘                    │      ├──→ T10 ──→ T11
      ├──→ T05 ────────────┤      │
      ├──→ T06 ────────────┤      │
      ├──→ T07 ────────────┘      │
      └──→ T08 ──────────────────┘
      └──→ T09 ──────────────────┘
```

| Task | Depends On | Blocks | Phase |
|------|-----------|--------|-------|
| T01 | — | T03, T04, T07 | 1 |
| T02 | — | T03, T04, T05, T06, T07, T09 | 1 |
| T03 | T01, T02 | T10 | 1 |
| T04 | T01, T02 | T07 | 1 |
| T05 | T02 | T07 | 2 |
| T06 | T02 | T07 | 2 |
| T07 | T04, T05, T06 | T10 | 2 |
| T08 | T02 | T10 | 3 |
| T09 | T02, T04 | T10 | 3 |
| T10 | T03, T07, T08, T09 | T11 | 4 |
| T11 | T10 | — | 4 |

**Execution order**: (T01, T02 via parallel subagents) → (T03, T04, T05, T06, T08 via parallel subagents) → (T07, T09 via parallel subagents) → T10 → T11

---

## Parallel Subagent Strategy

Tasks grouped by wave (each wave runs as parallel subagents):

### Wave 1: T01, T02
- Tasks: T01 (variablePanelStore), T02 (GraphQL Documents for Variable CRUD)
- Rationale: Both tasks have no dependencies — T01 creates the Zustand store, T02 creates GraphQL documents and backend resolvers. They touch completely different file sets (frontend stores vs backend GraphQL/types/services) and can proceed concurrently.

### Wave 2: T03, T04, T05, T06, T08
- Tasks: T03 (VariablePanel + VariableList + VariableRow), T04 (VariableForm), T05 (Text/Number type inputs), T06 (DateVariableInput), T08 (SystemVariableBadge + System Variable Initialization)
- Rationale: All five tasks depend only on T01 and/or T02 (both completed in Wave 1). T03 and T04 depend on T01+T02; T05, T06, and T08 depend only on T02. They create distinct component files with no interdependencies among each other (T07 wires them together later). T08 touches backend services while the others touch frontend components — no file conflicts.

### Wave 3: T07, T09
- Tasks: T07 (SelectOptionsEditor + Complete VariableForm Integration), T09 (DeleteBindingWarning + Variable Deletion Flow)
- Rationale: T07 depends on T04, T05, T06 (all completed in Wave 2) — it wires type-specific sub-components into the VariableForm. T09 depends on T02 and T04 (both completed in earlier waves) — it creates the deletion dialog and backend deletion logic. These two tasks modify different files (T07 works on select editor components and VariableForm; T09 works on delete dialogs and backend service) and can run concurrently.

### Wave 4: T10
- Tasks: T10 (MobileVariablePanel + Integrate with Template Editor)
- Rationale: T10 depends on T03, T07, T08, T09 — all completed in prior waves. It creates the mobile panel and integrates both desktop and mobile into the template editor. Single task, no parallelization within this wave.

### Final Wave: Knowledge Propagation
- Task: T11 (Docs + AGENTS.md Updates)
- Rationale: Must run after all other tasks complete — it documents the full variable system and updates AGENTS.md files with conventions referencing all created files.

> **Subagent dispatch**: Each task in a wave is dispatched as a separate subagent. The orchestrator waits for all subagents in a wave to complete before starting the next wave.

---

## Acceptance Criteria Mapping

| AC ID | Task(s) |
|-------|---------|
| AC-13-01a–f | T03 |
| AC-13-02a–h | T04, T05, T06, T07 |
| AC-13-03a–d | T05 |
| AC-13-04a–e | T05 |
| AC-13-05a–f | T06 |
| AC-13-06a–g | T06 (select part), T07 |
| AC-13-07a–h | T07 |
| AC-13-08a–h | T09 |
| AC-13-09a–g | T03 |
| AC-13-10a–i | T08 |
| AC-13-11a–g | T04, T07 |

---

## Instruction Verification Table

| Layer | AGENTS.md | Instruction File |
|---|---|---|
| Frontend Views | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| Frontend Stores | `frontend/common/stores/AGENTS.md`, `frontend/common/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| Frontend GraphQL | `frontend/common/graphql/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| Backend Services | `backend/services/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| Backend GraphQL | `backend/graphql/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| Backend Types | `backend/types/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| Shared | `shared/AGENTS.md` | — |

---

## Quality Loop (Per File)

> **Quality Model**: Per-file progressive verification via `scripts/health/sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene in one command, short-circuiting on first failure)

```bash
bun run scripts/health/sub-loop.ts <the-file> --lifecycle codescene
```

---

## Phase 1: Variable Panel Foundation (T01–T04)

### T01: Create variablePanelStore (Zustand)

**Estimated:** 2-3 hrs | **Depends on:** — | **Phase:** 1

> **Parallelizable**: This task runs as a subagent in Wave 1 alongside T02.

**Description:**
Create the Zustand store that manages the variable panel's local UI state — form open/close, draft values, validation errors, touched/dirty tracking, confirmation dialog states (type change, name change, delete).

**Files to Create:**
- `frontend/common/stores/variablePanelStore.ts`

**Files to Modify:**
- `frontend/common/stores/index.ts` (export baru)
- `shared/locale/en/certificates/variables/form.ts` (type schema for validation message keys)
- `shared/locale/ar/certificates/variables/form.ts`

**Subtasks:**

| # | Subtask | Details |
|---|--------|---------|
| 1 | Define store state interface | Fields: isFormOpen, editingVariableId, draft, errors, touched, isDirty, isSubmitting, confirmation dialog states (typeChange, nameChange, delete) |
| 2 | Implement raft type | VariableDraft interface: name, displayLabel, type, defaultValue, required, config (type-specific), displayOrder |
| 3 | Implement form actions | openCreateForm, openEditForm, closeForm, updateDraft, blurField, validateAll, setSubmitting |
| 4 | Implement confirmation dialog actions | requestTypeChange, confirmTypeChange, cancelTypeChange, requestNameChange, confirmNameChange, cancelNameChange, requestDelete, confirmDelete, cancelDelete |
| 5 | Implement reset action | Full store reset to initial state |
| 6 | Define i18n type schema for form validation keys | `form: { labelRequired: () => string; labelLength: () => string; ... }` pattern in `shared/locale/types/certificates/variables/form.ts` |

**Acceptance:**
- Store compiles with full TypeScript types
- All actions are pure and testable
- No direct GraphQL calls in store (store is UI-state only)
- i18n keys match the namespace structure defined in requirements.md

**Quality Loop:**
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
```bash
bun run scripts/health/sub-loop.ts frontend/common/stores/variablePanelStore.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/stores/index.ts --lifecycle codescene
```

**Instruction Verification:**
| Layer | AGENTS.md | Instruction File |
|---|---|---|
| Frontend Stores | `frontend/common/stores/AGENTS.md`, `frontend/common/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| Shared | `shared/AGENTS.md` | — |

---

### T02: Create GraphQL Documents for Variable CRUD

**Estimated:** 2-3 hrs | **Depends on:** — | **Phase:** 1

> **Parallelizable**: This task runs as a subagent in Wave 1 alongside T01.

**Description:**
Create all GraphQL query and mutation documents for variable management: list query, bindings query, create/update/rename/changeType/delete/reorder mutations. These documents drive the Apollo hooks used by the variable panel components.

**Files to Create:**
- `frontend/common/graphql/sharedDocuments/certificates/variable.documents.ts`

**Files to Modify:**
- `backend/graphql/pothos/certificates/variable.pothos.ts` (Pothos resolvers — if not created in Plan 5, create minimum needed)
- `backend/types/certificates/variable.types.ts` (type definitions for variable operations)
- `backend/services/certificates/variable.service.ts` (service layer for variable business logic)

**Subtasks:**

| # | Subtask | Details |
|---|--------|---------|
| 1 | Define VariableType Pothos object type | Fields: id, name, displayLabel, type (enum), defaultValue, required, isSystem, displayOrder, config (JSON scalar) |
| 2 | Define VariableTypeEnum in Pothos | TEXT, NUMBER, DATE, SELECT |
| 3 | Define mutation input types | CreateVariableInput, UpdateVariableInput, RenameVariableInput, ChangeVariableTypeInput, DeleteVariableInput, ReorderVariablesInput |
| 4 | Define result types | RenameResultType (variable + affectedCount), DeleteResultType (affectedCount) |
| 5 | Implement resolvers | templateVariables query, variableBindings query, create/update/rename/changeType/delete/reorder mutations with permission checks |
| 6 | Create variable service methods | getVariablesByTemplate, createVariable, updateVariable, renameVariable, changeVariableType, deleteVariable, reorderVariables, getBoundElements, validateVariableName, initializeSystemVariables |
| 7 | Create React Apollo hooks (auto-generated via codegen) | useTemplateVariablesQuery, useCreateVariableMutation, etc. |
| 8 | Implement Apollo cache `update` functions | Optimistic updates for create (append), update (modify by id), delete (remove), reorder (reorder list) |
| 9 | Run `bun run generate:gqlSchema` and `bun codegen` | Generate schema and TypeScript types |

**Acceptance:**
- All documents include `id` field on every object type for Apollo cache normalization
- Hooks import from `"@apollo/client/react"` (not `@apollo/client`)
- `useQuery` used for queries (never `useLazyQuery`)
- Permission checks on all mutations (`CERT_TEMPLATE_MANAGE`)
- `bun codegen` completes without errors

**Quality Loop:**
- [ ] Generate GraphQL schema and TypeScript types:
```bash
bun run generate:gqlSchema && bun codegen
```
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
```bash
bun run scripts/health/sub-loop.ts backend/graphql/pothos/certificates/variable.pothos.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts backend/types/certificates/variable.types.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts backend/services/certificates/variable.service.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/graphql/sharedDocuments/certificates/variable.documents.ts --lifecycle codescene
```

**Instruction Verification:**
| Layer | AGENTS.md | Instruction File |
|---|---|---|
| Backend Services | `backend/services/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| Backend GraphQL | `backend/graphql/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| Backend Types | `backend/types/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| Frontend GraphQL | `frontend/common/graphql/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |

---

### T03: Create VariablePanel + VariableList + VariableRow (Desktop)

**Estimated:** 3-4 hrs | **Depends on:** T01, T02 | **Phase:** 1

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T04, T05, T06, T08.

**Description:**
Create the desktop variable panel container, the variable list (with system and user groups), and the individual variable row component. The panel lives in the template editor's right sidebar and displays all variables for the current template.

**Files to Create:**
- `frontend/desktop/views/dashboard/certificates/templates/editor/VariablePanel.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/VariableList.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/VariableRow.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/VariablePanelHeader.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/DefaultValuePreview.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/SystemVariableBadge.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/RequiredIndicator.tsx`

**Files to Modify:**
- `frontend/common/views/dashboard/certificates/templates/editor/TemplateEditorView.tsx` (integrate VariablePanel into right sidebar)
- `shared/locale/en/certificates/variables/list.ts` (list panel i18n strings)
- `shared/locale/ar/certificates/variables/list.ts`
- `shared/locale/en/certificates/variables/type.ts` (type label strings)
- `shared/locale/ar/certificates/variables/type.ts`
- `shared/locale/index.ts` (register new namespaces)

**Subtasks:**

| # | Subtask | Details |
|---|--------|---------|
| 1 | Implement VariablePanel container | Renders VariablePanelHeader + VariableList; receives templateId; uses `useTemplateVariablesQuery` Apollo hook; renders VariableForm when `variablePanelStore.isFormOpen` is true |
| 2 | Implement VariablePanelHeader | Title (`certificates.variables.list.title`), "Add Variable" button with `@/shared/locale/client` translation, collapse toggle for tablet |
| 3 | Implement VariableList | Splits into SystemVariableGroup (locked at top) and UserVariableGroup (sortable via drag-and-drop using `@dnd-kit/sortable` or equivalent); maps variables to VariableRow |
| 4 | Implement VariableRow | Displays drag handle, type icon (from `certificates.variables.type.*Icon`), name + display label, required indicator, DefaultValuePreview chip, edit/delete buttons (hidden for system variables), SystemVariableBadge for system variables |
| 5 | Implement DefaultValuePreview | Renders MUI Chip with `size="small"`, `color="default"`, format based on type: text (truncate 30 chars), number (apply decimal places), date (format with locale), select (option label), empty (`certificates.variables.list.noDefault`) |
| 6 | Implement SystemVariableBadge | MUI Badge with lock icon + "System" text (`certificates.variables.list.systemBadge`) |
| 7 | Implement RequiredIndicator | MUI asterisk or `@mui/icons-material/Star` icon with `color="error"` |
| 8 | Implement drag-to-reorder | Use `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop; `ReorderVariablesMutation` on drop; optimistic cache update |
| 9 | Integrate into TemplateEditorView | Add VariablePanel to right sidebar slot; pass templateId; wire active panel state from templateEditorStore |
| 10 | Create i18n strings | All keys from `certificates.variables.list.*` and `certificates.variables.type.*` namespaces |

**Acceptance:**
- AC-13-01a: List renders within 200ms (memoized rows, no expensive re-renders)
- AC-13-01b: Each row shows name, label, type icon, required indicator, default value preview
- AC-13-01c: System variables at top with lock icon and "System" badge
- AC-13-01d: Drag-to-reorder works for user variables only
- AC-13-01e: Empty state message displays
- AC-13-01f: List auto-refreshes via Apollo cache update
- AC-13-09a–g: Preview chip renders correctly per type
- No `console.*` — use `logger` from `@/frontend/utils/logger`
- No `useLazyQuery` — use `useQuery`
- MUI v9 `sx` prop (not style props)
- All colors from theme palette (no hardcoded colors)

**Quality Loop:**
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
```bash
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/VariablePanel.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/VariableList.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/VariableRow.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/VariablePanelHeader.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/DefaultValuePreview.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/SystemVariableBadge.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/RequiredIndicator.tsx --lifecycle codescene
```

**Instruction Verification:**
| Layer | AGENTS.md | Instruction File |
|---|---|---|
| Frontend Views | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| Frontend GraphQL | `frontend/common/graphql/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| Shared | `shared/AGENTS.md` | — |

---

### T04: Create VariableForm (Create/Edit Form)

**Estimated:** 3-4 hrs | **Depends on:** T01, T02 | **Phase:** 1

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T03, T05, T06, T08.

**Description:**
Create the variable creation/editing form with all shared fields (name, display label, type selector, required checkbox, default value) and type-specific sub-forms rendered conditionally. The form integrates real-time validation via `variablePanelStore` and submits via Apollo mutations.

**Files to Create:**
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/VariableForm.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/VariableTypeSelector.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/DefaultValueInput.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/TypeChangeWarningDialog.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/NameChangeBindingWarningDialog.tsx`

**Files to Modify:**
- `shared/locale/en/certificates/variables/form.ts` (add form-specific keys)
- `shared/locale/ar/certificates/variables/form.ts`

**Subtasks:**

| # | Subtask | Details |
|---|--------|---------|
| 1 | Implement VariableForm container | Reads `variablePanelStore` for draft, errors, touched; renders NameInput, DisplayLabelInput, VariableTypeSelector, RequiredCheckbox, DefaultValueInput, FormActions; determines create vs edit mode from `editingVariableId` |
| 2 | Implement NameInput | MUI TextField with `fullWidth`; real-time validation: required, snake_case pattern `^[a-z][a-z0-9_]*$`, length 3-50; debounced uniqueness check (300ms) via `VariableBindingsQueryDocument` or dedicated query; inline error with `aria-live="polite"` |
| 3 | Implement DisplayLabelInput | MUI TextField with `fullWidth`; validation: required, 1-100 chars |
| 4 | Implement VariableTypeSelector | MUI `RadioGroup` with 4 options (text/number/date/select); each option has icon + label from `certificates.variables.type.*`; system variable names are read-only with lock icon; on type change, trigger `requestTypeChange` → TypeChangeWarningDialog |
| 5 | Implement RequiredCheckbox | MUI Checkbox with label `certificates.variables.form.fieldRequired`; disabled for system required variables (student_name) |
| 6 | Implement DefaultValueInput | Conditional render based on `draft.type`: text → TextField (200 char max), number → TextField (numeric, with decimal places selector), date → DateVariableInput (T06), select → SelectOptionsEditor (T07); if variable is required AND no default value, show info message that default is optional |
| 7 | Implement FormActions | Save button (disabled if any errors or isSubmitting), Cancel button (calls closeForm) |
| 8 | Implement TypeChangeWarningDialog | MUI Dialog; message with interpolated current default value (`certificates.variables.form.typeChangeWarning` with `{value}`); buttons: "Clear and Change" / "Cancel"; on confirm → `confirmTypeChange` which clears default + config in draft; on cancel → `cancelTypeChange` |
| 9 | Implement NameChangeBindingWarningDialog | MUI Dialog; queries bound elements via `VariableBindingsQueryDocument`; message with interpolated count and Arabic pluralization (`certificates.variables.form.nameChangeBindingWarning` with `{count}`); lists affected element IDs and content; buttons: "Update All Bindings" / "Cancel"; on confirm → `RenameVariableMutation`; on cancel → `cancelNameChange` |
| 10 | Wire save logic | Create mode → `CreateVariableMutation`; Edit mode → `UpdateVariableMutation`; on success → toast + closeForm + Apollo cache update; on error → error toast |

**Acceptance:**
- AC-13-02a–h: All create form behaviors
- AC-13-07a–h: All edit form behaviors
- AC-13-11a–g: All validation rules enforced
- Save button disabled when any validation error exists
- Real-time name uniqueness check debounced at 300ms
- System variable name field is read-only with lock icon
- Type change shows confirmation dialog with current default value
- Name change shows binding warning with affected elements listed
- French/Arabic pluralization works for binding count
- No `console.*` — use `logger`
- No `useLazyQuery` — use `useQuery` for bindings query (stateful)
- MUI v9 `sx` prop (not style props)
- All strings from i18n (no hardcoded text)

**Quality Loop:**
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
```bash
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/VariableForm.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/VariableTypeSelector.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/DefaultValueInput.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/TypeChangeWarningDialog.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/NameChangeBindingWarningDialog.tsx --lifecycle codescene
```

**Instruction Verification:**
| Layer | AGENTS.md | Instruction File |
|---|---|---|
| Frontend Views | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| Frontend Stores | `frontend/common/stores/AGENTS.md`, `frontend/common/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| Frontend GraphQL | `frontend/common/graphql/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| Shared | `shared/AGENTS.md` | — |

---

## Phase 2: Type-Specific Inputs (T05–T07)

### T05: Create VariableTypeSelector + DefaultValueInput for Text/Number

**Estimated:** 2-3 hrs | **Depends on:** T02 | **Phase:** 2

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T03, T04, T06, T08.

**Description:**
Complete the text and number type-specific configuration and default value inputs. This includes min/max length for text, min/max value and decimal places for number, and the number formatting for preview chips.

**Files to Create:**
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/TextTypeConfigFields.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/NumberTypeConfigFields.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/TextDefaultValueInput.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/NumberDefaultValueInput.tsx`

**Files to Modify:**
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/VariableTypeSelector.tsx` (complete with all 4 options wiring)
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/DefaultValueInput.tsx` (wire text and number sub-components)
- `shared/locale/en/certificates/variables/form.ts` (add min/max label keys)
- `shared/locale/ar/certificates/variables/form.ts`

**Subtasks:**

| # | Subtask | Details |
|---|--------|---------|
| 1 | Implement TextTypeConfigFields | MUI Box with `sx` flex row: MinLength number input, MaxLength number input; label keys: `fieldMinLength`, `fieldMaxLength`; validation: min ≤ max, max ≤ 200; update `draft.config.minLength` / `draft.config.maxLength` |
| 2 | Implement NumberTypeConfigFields | MUI Box: MinValue number input, MaxValue number input, DecimalPlaces select (0-4); label keys: `fieldMinValue`, `fieldMaxValue`, `fieldDecimalPlaces`; validation: min < max, decimal 0-4; update `draft.config` |
| 3 | Implement TextDefaultValueInput | MUI TextField with `fullWidth`; max 200 chars enforced via `inputProps.maxLength`; show char counter (`${value.length}/200`); validate against min/max length if configured |
| 4 | Implement NumberDefaultValueInput | MUI TextField with `type="number"`; accepts numeric input only; format preview with decimal places; validate against min/max value |
| 5 | Complete VariableTypeSelector | Ensure all 4 options render with icon + label; wire type change to `requestTypeChange` in store; lock T06 and T07 sub-components as placeholders that render when type is selected |
| 6 | Wire DefaultValueInput dispatcher | Switch on `draft.type`: text → TextDefaultValueInput, number → NumberDefaultValueInput, date → DateVariableInput (T06), select → SelectOptionsEditor (T07) |

**Acceptance:**
- AC-13-03a–d: Text type config and default value
- AC-13-04a–e: Number type config and default value
- Number input accepts numeric characters only
- Decimal places dropdown offers 0, 1, 2, 3, 4
- Min/max validation enforced
- No `console.*` — use `logger`
- MUI v9 `sx` prop (not style props)
- All strings from i18n

**Quality Loop:**
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
```bash
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/TextTypeConfigFields.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/NumberTypeConfigFields.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/TextDefaultValueInput.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/NumberDefaultValueInput.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/VariableTypeSelector.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/DefaultValueInput.tsx --lifecycle codescene
```

**Instruction Verification:**
| Layer | AGENTS.md | Instruction File |
|---|---|---|
| Frontend Views | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| Shared | `shared/AGENTS.md` | — |

---

### T06: Create DateVariableInput (Date Picker, Format Selector, Relative Date)

**Estimated:** 2-3 hrs | **Depends on:** T02 | **Phase:** 2

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T03, T04, T05, T08.

**Description:**
Create the date-specific variable input with a date picker, format selector (short/medium/long), and optional relative date expression input. Also implement locale-aware date preview formatting.

**Files to Create:**
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/DateVariableInput.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/DateFormatSelector.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/RelativeDateInput.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/DateTypeConfigFields.tsx`

**Files to Modify:**
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/DefaultValueInput.tsx` (wire date sub-component)
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/DefaultValuePreview.tsx` (date preview formatting)
- `shared/locale/en/certificates/variables/date.ts` (date format labels, relative date hint)
- `shared/locale/ar/certificates/variables/date.ts`

**Subtasks:**

| # | Subtask | Details |
|---|--------|---------|
| 1 | Implement DateVariableInput container | MUI Box vertical stack: MUI `DatePicker` (from `@mui/x-date-pickers`), DateFormatSelector, RelativeDateInput |
| 2 | Implement DateFormatSelector | MUI `RadioGroup` with 3 options: short (`formatShort`), medium (`formatMedium`), long (`formatLong`); medium pre-selected; required validation (`date.formatRequired`); update `draft.config.dateFormat` |
| 3 | Implement RelativeDateInput | MUI TextField with placeholder hint (`date.relativeHint`): "e.g., today + 30 days"; optional; validate format if non-empty (basic regex or parser); update `draft.config.relativeDate` |
| 4 | Implement DatePicker integration | MUI `DatePicker` from `@mui/x-date-pickers`; locale-aware; update `draft.defaultValue` with ISO date string; format preview uses selected format |
| 5 | Implement date preview formatting | In DefaultValuePreview: for date type, format the stored ISO date using `draft.config.dateFormat` (short/medium/long) and current locale; use `Intl.DateTimeFormat` with locale + options |
| 6 | Wire to DefaultValueInput | Switch case for `type === "date"` renders DateVariableInput |

**Acceptance:**
- AC-13-05a–f: All date type behaviors
- Date picker renders for default value input
- Format radio group offers short/medium/long with medium pre-selected
- Relative date field renders with placeholder example
- Date format selection is required (cannot save without selecting)
- Preview chip shows formatted date using selected format and locale
- Date variable available in element binding dropdown (handled by T03/T04)
- No `console.*` — use `logger`
- MUI v9 `sx` prop
- All strings from i18n

**Quality Loop:**
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
```bash
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/DateVariableInput.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/DateFormatSelector.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/RelativeDateInput.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/DateTypeConfigFields.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/DefaultValueInput.tsx --lifecycle codescene
```

**Instruction Verification:**
| Layer | AGENTS.md | Instruction File |
|---|---|---|
| Frontend Views | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| Shared | `shared/AGENTS.md` | — |

---

### T07: Create SelectOptionsEditor + Complete VariableForm Integration

**Estimated:** 2-3 hrs | **Depends on:** T04, T05, T06 | **Phase:** 2

> **Parallelizable**: This task runs as a subagent in Wave 3 alongside T09.

**Description:**
Create the select options editor (key-value pair list with add/remove capabilities), the select default value dropdown, and complete the VariableForm integration by wiring all type-specific sub-components together with the full validation flow.

**Files to Create:**
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/SelectOptionsEditor.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/SelectOptionRow.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/SelectDefaultValueInput.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/SelectTypeConfigFields.tsx`

**Files to Modify:**
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/VariableForm.tsx` (wire all type config + complete validation flow)
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/DefaultValueInput.tsx` (wire select sub-component)
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/DefaultValuePreview.tsx` (select preview)
- `shared/locale/en/certificates/variables/select.ts` (select option labels, min/unique keys)
- `shared/locale/ar/certificates/variables/select.ts`

**Subtasks:**

| # | Subtask | Details |
|---|--------|---------|
| 1 | Implement SelectOptionRow | MUI Stack horizontal: KeyInput (TextField, placeholder `fieldOptionsKey`), LabelInput (TextField, placeholder `fieldOptionsLabel`), RemoveButton (IconButton, disabled if only 2 rows remain); inline error for empty key/label |
| 2 | Implement SelectOptionsEditor | Container: renders list of SelectOptionRow from `draft.config.options`; AddOptionButton at bottom (label `buttonAddOption`); real-time validation: min 2 options (`select.minOptions`), unique keys (`select.uniqueKeys`), key+label required per option (`select.keyRequired`, `select.labelRequired`); update `draft.config.options` array |
| 3 | Implement SelectDefaultValueInput | MUI `Select` dropdown populated from `draft.config.options` (filled options only); label `fieldDefaultSelection`; update `draft.defaultValue` with selected key |
| 4 | Implement select preview | In DefaultValuePreview: for select type, find option by `draft.defaultValue` key and show its label |
| 5 | Wire full validation flow in VariableForm | On save: call `variablePanelStore.validateAll()` which runs all validation (name, label, type, type-specific config, select options); disable save if any errors; show all inline errors |
| 6 | Wire type-specific rendering | VariableForm renders TextTypeConfigFields (T05) when type=text, NumberTypeConfigFields (T05) when type=number, DateTypeConfigFields (T06) when type=date, SelectTypeConfigFields (T07) when type=select |
| 7 | Wire system variable handling | In edit mode for system variables: name field read-only, type field read-only (both with lock icon); only display label + default value + required editable (required locked if student_name) |

**Acceptance:**
- AC-13-06a–g: All select type behaviors
- AC-13-11a–g: Full validation flow
- Options editor renders with 2 initial empty rows
- Add/remove option buttons work
- Key uniqueness validated in real-time
- Both key and label required per row
- Default selection dropdown populated from options
- Select preview shows selected option's label
- System variable fields read-only where applicable
- No `console.*` — use `logger`
- MUI v9 `sx` prop
- All strings from i18n

**Quality Loop:**
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
```bash
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/SelectOptionsEditor.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/SelectOptionRow.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/SelectDefaultValueInput.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/SelectTypeConfigFields.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/VariableForm.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/DefaultValueInput.tsx --lifecycle codescene
```

**Instruction Verification:**
| Layer | AGENTS.md | Instruction File |
|---|---|---|
| Frontend Views | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| Shared | `shared/AGENTS.md` | — |

---

## Phase 3: System Variables & Validation (T08–T09)

### T08: Create SystemVariableBadge + System Variable Initialization

**Estimated:** 2-3 hrs | **Depends on:** T02 | **Phase:** 3

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T03, T04, T05, T06.

**Description:**
Implement system variable initialization (triggered on template creation) and the visual system variable badge component. System variables are pre-defined when a template is created and are immutable in name and type.

**Files to Create:**
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/SystemVariableBadge.tsx` (complete component with lock icon + badge)
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/SystemVariableGroup.tsx` (groups system variables at top of list)

**Files to Modify:**
- `backend/services/certificates/variable.service.ts` (implement `initializeSystemVariables` method)
- `backend/services/certificates/template.service.ts` (call `variableService.initializeSystemVariables` after template creation)
- `shared/locale/en/certificates/variables/system.ts` (7 system variable label keys)
- `shared/locale/ar/certificates/variables/system.ts`
- `shared/locale/index.ts` (register system namespace)

**Subtasks:**

| # | Subtask | Details |
|---|--------|---------|
| 1 | Define system variables config | 7 system variables: student_name (text, required), student_id (text), grade_level (text), completion_date (date), certificate_id (text), issue_date (date), verification_code (text) — each with default display order, config (date format for date types) |
| 2 | Implement initializeSystemVariables service method | Takes templateId; creates 7 variable records with `is_system = true`, correct types, default config; runs in a transaction; called by template service after template creation |
| 3 | Wire into template creation | In `template.service.ts` create method: after template is created, call `variableService.initializeSystemVariables(templateId)` |
| 4 | Complete SystemVariableBadge | MUI Badge overlay: lock icon (`@mui/icons-material/LockOutlined`) + "System" text badge (`certificates.variables.list.systemBadge`); `color="default"`; positioned top-right of VariableRow |
| 5 | Implement SystemVariableGroup | MUI Box container with subtle border/background (`theme.palette.action.hover`); renders system variables only (filtered by `isSystem === true`); locked at top of VariableList (no drag) |
| 6 | Implement system variable label resolution | In VariableRow: for system variables, resolve display label via `useAppTranslation(Translation.Certificates.Variables.System)` (property access on the resolved label object, e.g. `systemLabels[variableName]`); if user has customized the label (stored in DB), use DB value instead |
| 7 | Create i18n strings | All 7 system variable label keys in en and ar |

**Acceptance:**
- AC-13-10a–i: All system variable behaviors
- Creating a template auto-creates all 7 system variables
- System variables have `is_system = true` in database
- Delete button hidden for system variables
- Name field is read-only with lock icon
- Type field is read-only
- Display label is editable
- Default value is editable
- System variables appear at top of list with "System" badge
- System variable labels render in current locale
- No `console.*` — use `logger`
- MUI v9 `sx` prop
- All strings from i18n

**Quality Loop:**
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
```bash
bun run scripts/health/sub-loop.ts backend/services/certificates/variable.service.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts backend/services/certificates/template.service.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/SystemVariableBadge.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/SystemVariableGroup.tsx --lifecycle codescene
```

**Instruction Verification:**
| Layer | AGENTS.md | Instruction File |
|---|---|---|
| Backend Services | `backend/services/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| Frontend Views | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| Shared | `shared/AGENTS.md` | — |

---

### T09: Create DeleteBindingWarning + Variable Deletion Flow

**Estimated:** 2-3 hrs | **Depends on:** T02, T04 | **Phase:** 3

> **Parallelizable**: This task runs as a subagent in Wave 3 alongside T07.

**Description:**
Implement the deletion flow for variables, including the binding warning dialog (shows affected template elements when a variable is bound), unbinding logic (elements fall back to static_text), and the simplified confirmation for variables with no bindings.

**Files to Create:**
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/DeleteBindingWarningDialog.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/DeleteConfirmDialog.tsx`

**Files to Modify:**
- `backend/services/certificates/variable.service.ts` (implement `deleteVariable` with unbinding logic)
- `backend/graphql/pothos/certificates/variable.pothos.ts` (wire delete mutation resolver)
- `frontend/desktop/views/dashboard/certificates/templates/editor/components/VariableRow.tsx` (wire delete button to deletion flow)
- `shared/locale/en/certificates/variables/delete.ts` (deletion confirmation, binding warning, success)
- `shared/locale/ar/certificates/variables/delete.ts`

**Subtasks:**

| # | Subtask | Details |
|---|--------|---------|
| 1 | Implement deleteVariable service method | Takes id + templateId; queries `certificate_template_elements` where `variable_id = id`; if elements found, sets `variable_id = null` and `data_source = 'static_text'` for each (fallback); deletes variable record; returns DeleteResult with affectedCount; runs in transaction |
| 2 | Implement DeleteBindingWarningDialog | MUI Dialog; queries bound elements via `VariableBindingsQueryDocument` (useQuery with skip until dialog opens); message with Arabic pluralization (`delete.bindingWarning` with `{count}`); lists element IDs and content; buttons: "Delete" / "Cancel"; on confirm → DeleteVariableMutation; on cancel → close |
| 3 | Implement DeleteConfirmDialog | MUI Dialog (simplified); message `delete.confirm`; buttons: "Delete" / "Cancel"; on confirm → DeleteVariableMutation; on cancel → close |
| 4 | Wire delete flow in VariableRow | On delete button click: call `variablePanelStore.requestDelete(variableId)`; component checks if bindings exist (via Apollo cache or query) and renders appropriate dialog; on success → toast (`delete.success`) + Apollo cache update (remove from list) |
| 5 | Implement Apollo cache update for delete | Remove variable from `templateVariables` cache list; evict any `variableBindings` queries for that variable; refetch template elements (to show updated static_text fallback) |
| 6 | Hide delete button for system variables | Delete button not rendered when `variable.isSystem === true` |

**Acceptance:**
- AC-13-08a–h: All deletion behaviors
- Delete button hidden for system variables
- If elements are bound, warning dialog lists all affected elements
- Binding warning shows element ID and content for each affected element
- Confirming deletion with bindings removes variable and updates elements to static_text fallback
- If no bindings, simple confirmation dialog appears
- Variable removed from list after deletion
- Element binding dropdowns no longer show deleted variable
- Success toast displays after deletion
- No `console.*` — use `logger`
- MUI v9 `sx` prop
- All strings from i18n
- Arabic pluralization for binding count

**Quality Loop:**
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
```bash
bun run scripts/health/sub-loop.ts backend/services/certificates/variable.service.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts backend/graphql/pothos/certificates/variable.pothos.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/DeleteBindingWarningDialog.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/DeleteConfirmDialog.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/components/VariableRow.tsx --lifecycle codescene
```

**Instruction Verification:**
| Layer | AGENTS.md | Instruction File |
|---|---|---|
| Backend Services | `backend/services/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| Backend GraphQL | `backend/graphql/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| Frontend Views | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| Shared | `shared/AGENTS.md` | — |

---

## Phase 4: Integration & Knowledge (T10–T11)

### T10: Create MobileVariablePanel + Integrate with Template Editor

**Estimated:** 3-4 hrs | **Depends on:** T03, T07, T08, T09 | **Phase:** 4

**Description:**
Create the mobile version of the variable panel (simplified list with bottom sheet form, no drag-to-reorder, move up/down buttons instead), and integrate the desktop and mobile panels into the template editor view with responsive switching.

**Files to Create:**
- `frontend/mobile/views/dashboard/certificates/templates/editor/VariablePanelMobile.tsx`
- `frontend/mobile/views/dashboard/certificates/templates/editor/components/VariableListMobile.tsx`
- `frontend/mobile/views/dashboard/certificates/templates/editor/components/VariableRowMobile.tsx`
- `frontend/mobile/views/dashboard/certificates/templates/editor/components/VariableFormMobile.tsx`
- `frontend/mobile/views/dashboard/certificates/templates/editor/components/MoveButtons.tsx`

**Files to Modify:**
- `frontend/common/views/dashboard/certificates/templates/editor/TemplateEditorView.tsx` (responsive panel switching: desktop → VariablePanel, mobile → VariablePanelMobile)
- `app/(dashboard)/certificates/templates/[id]/edit/page.tsx` (ensure server component passes locale + template data)

**Subtasks:**

| # | Subtask | Details |
|---|--------|---------|
| 1 | Implement VariablePanelMobile | Container: renders VariableListMobile; "Add Variable" button opens bottom sheet with VariableFormMobile; manages `variablePanelStore` (shared with desktop) |
| 2 | Implement VariableListMobile | Simplified list: system variables group at top, user variables below; no drag-and-drop; uses MUI `List` component with compact rows |
| 3 | Implement VariableRowMobile | Compact row: type icon, name + label, system badge if system; tap row → open edit bottom sheet; swipe left → delete; edit/delete actions via icon buttons; move up/down buttons at end of row |
| 4 | Implement VariableFormMobile | Bottom sheet (MUI `SwipeableDrawer` with `anchor="bottom"`); stacks all form fields vertically; same sub-components as desktop (VariableTypeSelector vertical, DateVariableInput, SelectOptionsEditor vertical); Save/Cancel at bottom |
| 5 | Implement MoveButtons | Up arrow and down arrow icons; disabled at boundaries (top/bottom of user variable list); triggers `ReorderVariablesMutation` with updated order |
| 6 | Integrate responsive panel switching | In TemplateEditorView: use `useMediaQuery('(min-width: 768px)')` (or equivalent theme breakpoint); desktop → render VariablePanel in right sidebar; mobile → render VariablePanelMobile in bottom tab |
| 7 | Ensure permission checks | Verify CERT_TEMPLATE_MANAGE on both desktop and mobile; show teeacher-only restriction on mobile |

**Acceptance:**
- Mobile variable list renders correctly on screens < 768px
- Bottom sheet form opens for create and edit
- All type-specific inputs work in mobile (vertical layout)
- Move up/down buttons work for reordering
- System variables locked (no edit, no delete, no move)
- no drag-to-reorder on mobile (uses buttons)
- Responsive switching between desktop and mobile panels
- No `console.*` — use `logger`
- MUI v9 `sx` prop
- All strings from i18n (shared with desktop)

**Quality Loop:**
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
```bash
bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/templates/editor/VariablePanelMobile.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/templates/editor/components/VariableListMobile.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/templates/editor/components/VariableRowMobile.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/templates/editor/components/VariableFormMobile.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/templates/editor/components/MoveButtons.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/editor/TemplateEditorView.tsx --lifecycle codescene
```

**Instruction Verification:**
| Layer | AGENTS.md | Instruction File |
|---|---|---|
| Frontend Views | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| Frontend Stores | `frontend/common/stores/AGENTS.md`, `frontend/common/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| App Router | `app/AGENTS.md` | — |
| Shared | `shared/AGENTS.md` | — |

---

### T11: Knowledge Propagation (Docs + AGENTS.md Updates)

**Estimated:** 1-2 hrs | **Depends on:** T10 | **Phase:** 4

**Description:**
Create documentation for the certificate variable system, update relevant AGENTS.md files with variable-specific conventions, and ensure all knowledge is propagated for future development.

**Files to Create:**
- `docs/frontend/certificate-variables.md` (developer guide for variable management)

**Files to Modify:**
- `frontend/views/AGENTS.md` (add variable panel conventions section)
- `frontend/AGENTS.md` (add variable-related MUI patterns)
- `frontend/common/graphql/AGENTS.md` (reference variable documents)
- `shared/AGENTS.md` (reference variable i18n namespaces)

**Subtasks:**

| # | Subtask | Details |
|---|--------|---------|
| 1 | Create certificate-variables.md | Document: architecture overview, component hierarchy, GraphQL documents list, store design, system variables reference, i18n namespace catalogue, type-specific config structure, validation rules, mobile vs desktop differences, troubleshooting guide |
| 2 | Update frontend/views/AGENTS.md | Add section: "Certificate Variable Panel" — conventions for VariablePanel, VariableForm, type-specific components; patterns for confirmation dialogs; Apollo cache update patterns for variables |
| 3 | Update frontend/AGENTS.md | Add MUI patterns used by variable components (Chip for preview, RadioGroup for type selector, SwipeableDrawer for mobile, Badge for system variables); note on `@dnd-kit/sortable` usage |
| 4 | Update frontend/common/graphql/AGENTS.md | List all variable GraphQL documents (file path, constant names, operation types, variables, returns); Apollo cache update patterns specific to variables |
| 5 | Update shared/AGENTS.md | List all variable i18n namespaces (certificates.variables.list, form, type, system, delete, name, select, date); Arabic pluralization rules for binding count; interpolation keys |
| 6 | Update .agents/instructions/frontend.instructions.md | Add instruction: "When creating variable components, always use variablePanelStore for form state, never use Apollo cache for form drafts; system variables are immutable in name/type; always include `id` field in GraphQL documents for cache normalization" |
| 7 | Cross-reference Plan 5 and Plan 10 | In documentation, reference how Plan 5 GraphQL API connects to variable CRUD and how Plan 10 Template Editor integrates the variable panel |

**Acceptance:**
- Documentation file is comprehensive and developer-friendly
- All AGENTS.md files updated with relevant conventions
- No code snippets longer than 3 lines in documentation
- All file paths and component names accurately reference the actual files created
- i18n namespace catalogue matches the implemented namespaces
- Knowledge can be used by future agents to understand and extend the variable system

**Quality Loop:**
- [ ] Run per-file quality loop for the documentation file created/modified (full progressive chain: tsgo → biome → lint → codescene):
```bash
bun run scripts/health/sub-loop.ts docs/frontend/certificate-variables.md --lifecycle codescene
```

**Instruction Verification:**
| Layer | AGENTS.md | Instruction File |
|---|---|---|
| Documentation | — | — (documentation files do not need instruction verification) |

---

## Summary

| Phase | Tasks | Hours | Description |
|-------|-------|-------|-------------|
| Phase 1 | T01–T04 | 9-14 | Variable panel foundation (store, GraphQL, list, form) |
| Phase 2 | T05–T07 | 6-9 | Type-specific inputs (text/number, date, select + integration) |
| Phase 3 | T08–T09 | 4-6 | System variables & deletion flow |
| Phase 4 | T10–T11 | 4-6 | Mobile panel + knowledge propagation |
| **Total** | **11** | **24-36** | |

### Key Implementation Notes

1. **Apollo Client**: Use `useQuery` (NOT `useLazyQuery`) for the variableBindings query — control fetching via the `skip` option (skip until dialog opens).
2. **Zustand**: `variablePanelStore` is for form/draft/validation UI state only. The variable list lives in Apollo cache via `useTemplateVariablesQuery`. Never duplicate Apollo cache data into Zustand.
3. **i18n**: All namespaces follow the `certificates.variables.*` pattern. Arabic pluralization uses the `(count: number) => string` pattern for binding counts.
4. **System Variables**: Stored in DB with `is_system = true`. Labels resolved via i18n keys (overridable in DB). Always pre-created on template creation via `initializeSystemVariables` service method.
5. **Apollo Cache Updates**: All mutations use the `update` function for optimistic UI. Create → append to list; Update → modify by id; Delete → remove from list + evict bindings query; Reorder → reorder list.
6. **No Hardcoded Colors**: All MUI colors come from `theme.palette.*`. Use `sx` callback pattern: `sx={(theme) => ({ color: theme.palette.primary.main })}`.
7. **Logger**: Never use `console.*`. Import `logger` from `@/frontend/utils/logger` (frontend) or `@/backend/lib/logger` (backend).
8. **Path Aliases**: All imports use `@/` prefix. No relative imports (e.g., `@/frontend/common/stores/variablePanelStore`, `@@/backend/services/certificates/variable.service`).
9. **MUI v9**: No style props on Typography, Stack, Box, Grid. Always use `sx` prop. Icon names use `*Outlined` suffix (e.g., `LockOutlined`, not `LockOutline`).
10. **React 19**: Use `React.SyntheticEvent<HTMLFormElement>` for form events (not `FormEvent`).

---

## Phase 5: Testing & Quality (Round 2 Enhancement)

### 5.1 Component Tests

- [ ] **5.1.1** Variable List Display Tests
  - Test: Desktop `DesktopAppDataGrid` renders columns correctly (Name, Key, Type, Category, Default Value, Templates, Actions)
  - Test: Mobile `MobileCardList` renders card with Name, Key badge, Type icon, Category chip, Default Value truncated, Template Count badge
  - Test: Search filters list in real-time (debounced 300ms)
  - Test: Type filter dropdown filters by VariableDataType
  - Test: Category filter dropdown filters by VariableCategory
  - Test: Pagination works (pageSize 10/25/50)
  - Test: Sorting by Name, Key, Type, Category, Templates
  - **File:** `test/ui/components/template-variable-mgmt/VariableList.test.tsx`
  - **Requirements:** AC-13-01a, AC-13-01b, AC-13-01c, AC-13-01d, AC-13-01e, AC-13-01f
  - **Quality Loop:**
    ```bash
    bun run scripts/health/sub-loop.ts test/ui/components/template-variable-mgmt/VariableList.test.tsx --lifecycle codescene
    ```

- [ ] **5.1.2** Variable Form (Create/Edit) Tests
  - Test: Create form opens with empty fields, Save disabled until dirty
  - Test: Edit form pre-fills with variable data, key/type fields disabled
  - Test: Validation - required fields (name, key, type, category) show inline errors
  - Test: Key validation - pattern (lowercase + underscores), uniqueness check, system key reserved
  - Test: Type-specific sections render correctly:
    - Text: multiline toggle, min/max length, pattern
    - Number: step, precision, min/max, decimalPlaces
    - Date: showTime, minDate, maxDate, dateFormat
    - Select: options add/remove/reorder, min 2 options warning
    - Image: acceptedTypes, maxSize, preview
  - Test: Category-specific behavior:
    - Computed: defaultValue disabled with helper text
    - Dynamic: defaultValue shows hint
  - Test: Form dirty tracking - "Unsaved changes" badge, confirm on close
  - Test: Save button loading state during mutation
  - Test: Success toast on create/update, dialog closes
  - Test: Error toast on failure, form stays open with field errors
  - **File:** `test/ui/components/template-variable-mgmt/VariableForm.test.tsx`
  - **Requirements:** AC-13-02a, AC-13-02b, AC-13-02c, AC-13-02d, AC-13-02e, AC-13-02f, AC-13-02g, AC-13-02h
  - **Quality Loop:** Same as above

- [ ] **5.1.3** Delete Confirmation Tests
  - Test: Delete button opens confirm dialog with variable name
  - Test: Zero usage - shows "Safe to delete" message
  - Test: Non-zero usage - shows impact warning with element list (template → element)
  - Test: Force delete checkbox appears when bindings exist
  - Test: Confirm delete calls mutation with `force: true/false`
  - Test: Success toast, list refreshes, dialog closes
  - Test: Error toast, dialog stays open
  - **File:** `test/ui/components/template-variable-mgmt/DeleteConfirm.test.tsx`
  - **Requirements:** AC-13-07a, AC-13-07b, AC-13-07c, AC-13-07d, AC-13-07e, AC-13-07f, AC-13-07g
  - **Quality Loop:** Same as above

- [ ] **5.1.4** CSV Import Dialog Tests
  - Test: Dialog opens with upload stage (drag-drop zone + file picker)
  - Test: Template download button downloads CSV with correct headers
  - Test: Valid CSV parses → preview stage with valid/error/warning badges
  - Test: Invalid CSV rows show field-level errors (type, category, duplicate key, missing required)
  - Test: User can re-upload fixed file
  - Test: Import Valid Rows button enabled only when validCount > 0
  - Test: Importing stage shows progress bar
  - Test: Complete stage shows summary (imported/failed), auto-closes after 3s
  - Test: View Errors button shows detailed error list
  - **File:** `test/ui/components/template-variable-mgmt/CSVImportDialog.test.tsx`
  - **Requirements:** AC-13-10a, AC-13-10b, AC-13-10c, AC-13-10d, AC-13-10e, AC-13-10f, AC-13-10g, AC-13-10h, AC-13-10i
  - **Quality Loop:** Same as above

- [ ] **5.1.5** Variable Usage Display Tests
  - Test: Usage dialog opens with loading skeleton
  - Test: Empty state - "This variable is not used by any template element"
  - Test: List renders Template Name, Element Label, Element Type, Status badge, Last Used
  - Test: Row click navigates to Template Editor (Plan 10) with element focused
  - Test: Status badges: Draft (gray), Published (green), Archived (orange)
  - Test: Error state with retry button
  - **File:** `test/ui/components/template-variable-mgmt/VariableUsage.test.tsx`
  - **Requirements:** AC-13-09a, AC-13-09b, AC-13-09c, AC-13-09d, AC-13-09e, AC-13-09f, AC-13-09g
  - **Quality Loop:** Same as above

- [ ] **5.1.6** Variable Panel Store Tests
  - Test: Form open/close actions update state correctly
  - Test: Form data/setField/error/touched/dirty actions
  - Test: Validation runs all field validators
  - Test: Confirmation dialogs (delete, type change, key change) open/close
  - Test: CSV import state transitions (upload→preview→importing→complete)
  - Test: Filter actions (search, type, category, page, pageSize, sort)
  - Test: System variable key checks
  - **File:** `test/ui/components/template-variable-mgmt/variablePanelStore.test.ts`
  - **Requirements:** All ACs (store underpins all UI)
  - **Quality Loop:**
    ```bash
    bun run scripts/health/sub-loop.ts test/ui/components/template-variable-mgmt/variablePanelStore.test.ts --lifecycle codescene
    ```

### 5.2 E2E Tests

- [ ] **5.2.1** Full CRUD Flow E2E
  - Navigate to `/certificates/variables`
  - Click "Create Variable" → fill form (text type, static category) → save
  - Verify variable appears in list with correct data
  - Click edit → change name, defaultValue, description → save
  - Verify updated data in list
  - Click delete → confirm (zero usage) → verify removed from list
  - **File:** `test/ui/e2e/template-variable-mgmt/crud.spec.ts`
  - **Requirements:** AC-13-01, AC-13-02, AC-13-07
  - **Quality Loop:** `bun run build:test && bun run test:ui:e2e -- --project=template-variable-mgmt`

- [ ] **5.2.2** CSV Import Flow E2E
  - Navigate to variables page
  - Click "Import from CSV" → download template
  - Fill template with 5 valid rows (mixed types) + 1 invalid row
  - Upload CSV → verify preview shows 5 valid, 1 error
  - Click "Import Valid Rows" → verify summary shows 5 imported, 1 failed
  - Verify 5 new variables appear in list
  - **File:** `test/ui/e2e/template-variable-mgmt/csv-import.spec.ts`
  - **Requirements:** AC-13-10
  - **Quality Loop:** Same as above

- [ ] **5.2.3** Variable Usage Navigation E2E
  - Create variable
  - In Plan 10 Template Editor, bind variable to text element
  - Navigate to Variables page → click variable → open Usage dialog
  - Verify usage shows template + element
  - Click row → verify navigates to Template Editor at that element
  - **File:** `test/ui/e2e/template-variable-mgmt/usage-navigation.spec.ts`
  - **Requirements:** AC-13-09, Plan 10 integration
  - **Quality Loop:** Same as above

- [ ] **5.2.4** Mobile Responsive E2E
  - Set viewport to mobile (375px)
  - Verify MobileCardList renders instead of DataGrid
  - Verify full-screen dialogs for create/edit/delete/csv/usage
  - Verify mobile filter bar (chips + bottom sheet)
  - Test all CRUD flows on mobile
  - **File:** `test/ui/e2e/template-variable-mgmt/mobile.spec.ts`
  - **Requirements:** All ACs (mobile parity)
  - **Quality Loop:** Same as above

### 5.3 Backend Integration Tests

- [ ] **5.3.1** GraphQL Resolver Tests
  - Test: `certVariables` query with filter/pagination/sort
  - Test: `certVariable` detail query
  - Test: `certVariableBindings` query returns correct binding data
  - Test: `certVariableKeyExists` returns true/false correctly
  - Test: `createVariable` mutation validates input, creates record, returns full object
  - Test: `updateVariable` mutation ignores key/type changes, updates other fields
  - Test: `deleteVariable` without force fails when bindings exist
  - Test: `deleteVariable` with force succeeds, returns brokenBindingsCount
  - Test: `reorderVariableEnumValues` updates order
  - **File:** `backend/graphql/test/variables.resolver.test.ts`
  - **Requirements:** All GraphQL ACs
  - **Quality Loop:** `bun run test:graphql -- --testPathPattern=variables`

- [ ] **5.3.2** Service Layer Tests
  - Test: `variableService.create` validates, checks key uniqueness, creates
  - Test: `variableService.update` validates, ignores immutable fields
  - Test: `variableService.delete` checks bindings, handles force option
  - Test: `variableService.importCSV` batch creates, collects errors
  - Test: `variableService.getBindings` joins correctly
  - Test: System variable initialization on template creation
  - **File:** `backend/services/test/certificates/variable.service.test.ts`
  - **Requirements:** All service ACs
  - **Quality Loop:** `bun run test:services -- --testPathPattern=variable`

### 5.4 Accessibility Tests

- [ ] **5.4.1** Keyboard Navigation
  - Tab through list, dialogs, form fields in logical order
  - Escape closes dialogs
  - Enter/Space activates buttons
  - Arrow keys navigate radio groups, select options
  - **File:** `test/ui/components/template-variable-mgmt/a11y.keyboard.test.tsx`

- [ ] **5.4.2** Screen Reader
  - All form fields have labels (explicit or aria-label)
  - Error messages announced via aria-live
  - Dialogs have aria-labelledby/aria-describedby
  - Status badges have accessible names
  - **File:** `test/ui/components/template-variable-mgmt/a11y.screenreader.test.tsx`

- [ ] **5.4.3** Color Contrast & Focus
  - All text meets 4.5:1 contrast ratio
  - Focus indicators visible (2px solid outline)
  - Error states not color-only (icon + text)
  - **File:** `test/ui/components/template-variable-mgmt/a11y.visual.test.tsx`

---

## Phase 6: Knowledge Propagation (Round 2 Enhancement)

### 6.1 Documentation Creation

- [ ] **6.1.1** Create `docs/certificates/template-variables.md`
  - Architecture overview: global variables, dual classification (type + category), key/type immutability
  - Component hierarchy with file paths: Container → Switcher → DesktopView/MobileView → ViewModel → Store/GraphQL
  - GraphQL documents list: all queries/mutations/fragments with file paths and constant names
  - Store design: `variablePanelStore` state shape, actions, usage patterns
  - System variables reference: 7 keys, labels, immutability rules, initialization
  - i18n namespace catalogue: all 8 namespaces with key counts
  - Type-specific config structure: ValidationRules per type, SelectOption structure
  - Validation rules: key pattern, uniqueness, system reservation, type-specific rules
  - Mobile vs desktop differences: table vs cards, dialog sizing, filter patterns
  - Troubleshooting guide: common issues (key conflicts, binding breaks, CSV errors)
  - **File:** `docs/certificates/template-variables.md`
  - **Estimated:** 3-4 hrs
  - **Dependencies:** All implementation tasks complete
  - **Acceptance:** Comprehensive, developer-friendly, no code snippets >3 lines, accurate file paths

### 6.2 AGENTS.md Updates

- [ ] **6.2.1** Update `frontend/views/AGENTS.md`
  - Add section: "Certificate Variable Panel" conventions
  - VariablePanel component pattern (Container/ViewModel/Switcher)
  - VariableForm conventions: type-specific sections, category-driven UI, validation
  - Confirmation dialog patterns: delete impact, type change, key change
  - Apollo cache update patterns for variable mutations
  - **Estimated:** 1 hr

- [ ] **6.2.2** Update `frontend/AGENTS.md`
  - Add MUI patterns used by variable components:
    - Chip for type/category badges
    - RadioGroup for type selector (horizontal desktop, vertical mobile)
    - Sortable (dnd-kit) for select option reordering
    - Dialog fullScreen mobile pattern with sticky header/footer
    - Badge for system variable indicator
    - Skeleton for loading states
  - **Estimated:** 1 hr

- [ ] **6.2.3** Update `frontend/common/graphql/AGENTS.md`
  - List all variable GraphQL documents:
    - `variables.documents.ts` - CertVariablesQueryDocument, CertVariableDetailQueryDocument, CertVariableBindingsQueryDocument, CertVariableKeyExistsQueryDocument
    - Mutations: CreateVariableMutationDocument, UpdateVariableMutationDocument, DeleteVariableMutationDocument, ReorderVariableEnumValuesMutationDocument
    - Fragment: VariableFieldsFragment
  - Apollo cache update patterns specific to variables (create/append, update/modify, delete/remove+evict, reorder/reorder)
  - **Estimated:** 1 hr

- [ ] **6.2.4** Update `shared/AGENTS.md`
  - List all variable i18n namespaces:
    - `certificates.variables.list` (27 keys)
    - `certificates.variables.form` (50 keys)
    - `certificates.variables.delete` (18 keys)
    - `certificates.variables.csv` (25 keys)
    - `certificates.variables.usage` (12 keys)
    - `certificates.variables.type` (10 keys)
    - `certificates.variables.category` (8 keys)
  - Arabic pluralization rules for binding count: `(count: number) => string`
  - Interpolation keys: {name}, {count}, {fileName}, {fileSize}, {validCount}, {errorCount}, {row}, {value}, {field}, {templateName}, {elementLabel}, {elementType}, {imported}, {failed}
  - **Estimated:** 1 hr

- [ ] **6.2.5** Update `.agents/instructions/frontend.instructions.md`
  - Add instruction: "When creating variable components, always use variablePanelStore for form state, never use Apollo cache for form drafts; system variables are immutable in name/type; always include `id` field in GraphQL documents for cache normalization; use `useQuery` with `skip` for conditional fetching; CSV import uses PapaParse with row-level validation"
  - **Estimated:** 30 min

### 6.3 Cross-Plan References

- [ ] **6.3.1** Document Plan 5 Integration
  - How Plan 5 GraphQL API connects to variable CRUD
  - Resolver implementation details for computed fields (templateCount)
  - Binding table join strategy
  - **Estimated:** 30 min

- [ ] **6.3.2** Document Plan 10 Integration
  - How Template Editor integrates variable panel (Plan 10 scope)
  - Variable binding UI in element properties
  - Navigation from variable usage to template editor
  - **Estimated:** 30 min

- [ ] **6.3.3** Document Plan 1 & 2 Dependencies
  - Plan 1: `certificate_variables` table schema (global, not per-template)
  - Plan 2: `CertificateVariableCategory` enum (12th enum), `CertificateVariableType` enum, `SYSTEM_VARIABLE_KEYS` constant
  - **Estimated:** 30 min

---

## Updated Summary (Round 2)

| Phase | Tasks | Hours | Description |
|-------|-------|-------|-------------|
| Phase 1 | T01–T04 | 9-14 | Variable panel foundation (store, GraphQL, list, form) |
| Phase 2 | T05–T07 | 6-9 | Type-specific inputs (text/number, date, select + integration) |
| Phase 3 | T08–T09 | 4-6 | System variables & deletion flow |
| Phase 4 | T10–T11 | 4-6 | Mobile panel + knowledge propagation |
| **Phase 5** | **5.1–5.4** | **12-18** | **Testing & Quality (Component, E2E, Backend, A11y)** |
| **Phase 6** | **6.1–6.3** | **8-10** | **Knowledge Propagation (Docs, AGENTS.md, Cross-plan)** |
| **Total** | **23+** | **43-63** | |

---

## Quality Gate Checklist (Per Task)

Before marking any task complete, verify:

- [ ] Per-file quality loop passes (tsgo → biome → lint → codescene via `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`)
- [ ] All instruction files from Instruction Verification Table read and followed
- [ ] Component tests written and passing
- [ ] i18n keys added to both en/ar locale files
- [ ] No hardcoded colors (theme.palette only)
- [ ] No console.log (use logger)
- [ ] Path aliases @/ used throughout
- [ ] MUI v9: sx prop only, *Outlined icons
- [ ] React 19: SyntheticEvent for forms
- [ ] GraphQL documents include `id` field for cache normalization
- [ ] Arabic pluralization functions implemented for count-based strings
- [ ] Mobile responsive verified (375px viewport)
- [ ] Accessibility: keyboard nav, screen reader, contrast

---

## Phase 7: Template Editor Variable Components

### T12: useVariableStore Zustand Store

- [ ] **T12.1** Create `frontend/stores/variableStore.ts`
  - Define `VariableState` interface with systemVariables, customVariables, searchQuery, selectedCategory, recentVariableIds, pickerOpen, editorOpen, editingVariable
  - Implement actions: setSearchQuery, setSelectedCategory, openPicker, closePicker, openEditor, closeEditor, saveVariable, deleteVariable, addRecent, resolveVariable
  - resolveVariable looks up system + custom variables and interpolates from context
  - Seed systemVariables with the 16 pre-populated system variables
  - Use Zustand create() with TypeScript types
  - **Estimated:** 3 hr

- [ ] **T12.2** Add variableStore to mock stores for Storybook
  - Create `frontend/stores/__mocks__/variableStore.mock.ts`
  - **Estimated:** 30 min

### T13: VariablePanel Component (System + Custom Sections)

- [ ] **T13.1** Create `frontend/views/dashboard/cert/templates/variables/VariablePanel.tsx`
  - Right sidebar tab in template editor
  - Section 1: System Variables (read-only list with name, type badge, description tooltip)
  - Section 2: Custom Variables (Add button → opens VariableEditorDialog, list with edit/delete icons)
  - Delete confirmation dialog
  - Empty state for custom: "No custom variables yet. Click + to create one."
  - Use useVariableStore for state
  - **Estimated:** 4 hr

- [ ] **T13.2** Type badge component (colored chip: text=blue, date=green, number=purple, boolean=orange, image=red)
  - Extract as shared `VariableTypeBadge` component
  - **Estimated:** 1 hr

### T14: VariableEditorDialog Component

- [ ] **T14.1** Create `frontend/views/dashboard/cert/templates/variables/VariableEditorDialog.tsx`
  - Props: `{ open, variable (null=create mode), onSave, onClose }`
  - Form fields: Name (camelCase, unique, required), Display Name, Description, Type select
  - Conditional fields by type: date (format, locale), number (min, max), text (maxLength, pattern)
  - Default value field varies by type
  - Required toggle switch
  - Validation: name not matching system variable names, camelCase regex
  - **Estimated:** 5 hr

- [ ] **T14.2** i18n keys for editor dialog
  - Add namespace `certificates.variables.editor` to en/ar locale files
  - **Estimated:** 1 hr

### T15: VariablePickerDialog Component

- [ ] **T15.1** Create `frontend/views/dashboard/cert/templates/variables/VariablePickerDialog.tsx`
  - Props: `{ open, onClose, onSelect, allowedCategories? }`
  - Search bar at top, vertical category tabs left, 2-column card grid right
  - Each card: name (bold), type badge, description, sample value (code font)
  - Bottom: recently used chips horizontal scroll
  - Keyboard: Tab navigate, Enter select, Escape close
  - Empty state message
  - **Estimated:** 4 hr

- [ ] **T15.2** i18n keys for picker dialog
  - Add namespace `certificates.variables.picker` to en/ar locale files
  - **Estimated:** 1 hr

### T16: VariableAutocomplete Inline Component

- [ ] **T16.1** Create `frontend/views/dashboard/cert/templates/variables/VariableAutocomplete.tsx`
  - Triggers on `{{` typed in text element content field
  - Dropdown with filtered variables (system + custom)
  - Each item: name, type badge, description
  - Keyboard: Arrow Up/Down, Enter insert, Escape close
  - Insert as `{{variableName}}`, cursor after `}}`
  - Dismiss on insert, manual `}}`, or backspace past `{{`
  - **Estimated:** 4 hr

- [ ] **T16.2** i18n keys for autocomplete
  - Add namespace `certificates.variables.autocomplete` to en/ar locale files
  - **Estimated:** 30 min

---

## Phase 8: Variable Resolution Service

### T17: Preview Mode Resolution

- [ ] **T17.1** Create `backend/services/cert/variableResolutionService.ts`
  - resolveVariable(name, context) — looks up variable def, applies context value
  - resolveTemplateText(text, context) — finds all `{{varName}}` patterns, resolves each
  - Handle deleted variables: return `{{DELETED:varName}}` with warning flag
  - Type-specific formatting: date (format + locale), number (min/max clamping), boolean (true/false label), image (src URL)
  - **Estimated:** 4 hr

- [ ] **T17.2** Unit tests for variable resolution service
  - Test all type resolutions, deleted variable handling, mixed text
  - **Estimated:** 2 hr

---

## Phase 9: Component Tests

### T18: VariablePickerDialog Tests

- [ ] **T18.1** Create `test/ui/components/variables/VariablePickerDialog.test.tsx`
  - Render dialog, verify search filter, category tab switching, card click selection
  - Empty state when no results
  - Keyboard navigation (Enter, Escape)
  - **Estimated:** 2 hr

### T19: VariablePanel Tests

- [ ] **T19.1** Create `test/ui/components/variables/VariablePanel.test.tsx`
  - System variables list render
  - Custom variables CRUD interaction
  - Delete confirmation flow
  - Empty state for custom section
  - **Estimated:** 2 hr

### T20: VariableEditorDialog Tests

- [ ] **T20.1** Create `test/ui/components/variables/VariableEditorDialog.test.tsx`
  - Create mode (variable=null) renders empty form
  - Edit mode pre-fills fields
  - Validation: camelCase name, unique name, no system name conflicts
  - Conditional fields by type
  - Save calls onSave with correct payload
  - **Estimated:** 2 hr

### T21: VariableAutocomplete Tests

- [ ] **T21.1** Create `test/ui/components/variables/VariableAutocomplete.test.tsx`
  - Trigger on `{{` type
  - Filter list by typed text
  - Arrow navigation and Enter insert
  - Escape dismissal
  - Backspace past `{{` dismissal
  - **Estimated:** 2 hr

---

## Phase 10: E2E Tests

### T22: E2E — Create Custom Variable

- [ ] **T22.1** Create `test/ui/e2e/variables/create-custom-variable.spec.ts`
  - Open template editor, go to variable panel, click Add, fill form, save
  - Verify custom variable appears in panel list
  - **Estimated:** 1 hr

### T23: E2E — Bind Variable to Text

- [ ] **T23.1** Create `test/ui/e2e/variables/bind-variable-to-text.spec.ts`
  - Select text element, type `{{`, pick variable from autocomplete
  - Verify text element content becomes `{{variableName}}`
  - **Estimated:** 1 hr

### T24: E2E — Preview with Variables

- [ ] **T24.1** Create `test/ui/e2e/variables/preview-with-variables.spec.ts`
  - Bind variables, switch to preview mode, verify resolved values render
  - Date formatting, number formatting verified
  - **Estimated:** 1 hr

### T25: E2E — Delete Variable with Warning

- [ ] **T25.1** Create `test/ui/e2e/variables/delete-variable-warning.spec.ts`
  - Delete a bound custom variable, verify `{{DELETED:varName}}` warning in preview
  - Confirm delete dialog interaction
  - **Estimated:** 1 hr

---

## Phase 11: Quality Loop (Per File)

### T26: Per-File Quality Verification

- [ ] **T26.1** Run sub-loop on each new file:
  - `frontend/stores/variableStore.ts`
  - `frontend/views/dashboard/cert/templates/variables/VariablePanel.tsx`
  - `frontend/views/dashboard/cert/templates/variables/VariableEditorDialog.tsx`
  - `frontend/views/dashboard/cert/templates/variables/VariablePickerDialog.tsx`
  - `frontend/views/dashboard/cert/templates/variables/VariableAutocomplete.tsx`
  - `backend/services/cert/variableResolutionService.ts`
  - Command: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`
  - Fix all reported issues (tsgo → biome → lint → codescene)
  - **Estimated:** 2 hr

---

## Phase 12: Knowledge Propagation

### T27: Documentation & AGENTS.md Updates

- [ ] **T27.1** Update `frontend/views/AGENTS.md`
  - Document variable component location: `frontend/views/dashboard/cert/templates/variables/`
  - Document VariablePickerDialog, VariablePanel, VariableEditorDialog, VariableAutocomplete usage
  - **Estimated:** 30 min

- [ ] **T27.2** Update `frontend/stores/AGENTS.md`
  - Document variableStore: state shape, actions, resolveVariable pattern
  - Document mock store for Storybook
  - **Estimated:** 30 min

- [ ] **T27.3** Update `backend/services/AGENTS.md`
  - Document variableResolutionService: resolveVariable, resolveTemplateText, deleted variable handling
  - **Estimated:** 30 min

- [ ] **T27.4** Update `shared/AGENTS.md`
  - Add new i18n namespaces: `certificates.variables.editor`, `certificates.variables.picker`, `certificates.variables.autocomplete`
  - List keys and Arabic pluralization requirements
  - **Estimated:** 1 hr

- [ ] **T27.5** Update `.agents/instructions/frontend.instructions.md`
  - Add instruction: "Variable components use useVariableStore for state; VariableAutocomplete triggers on `{{`; type badge colors: text=blue, date=green, number=purple, boolean=orange, image=red; deleted variables render as `{{DELETED:name}}`"
  - **Estimated:** 30 min

---

## Updated Summary (Round 3)

| Phase | Tasks | Hours | Description |
|-------|-------|-------|-------------|
| Phase 1 | T01–T04 | 9-14 | Variable panel foundation (store, GraphQL, list, form) |
| Phase 2 | T05–T07 | 6-9 | Type-specific inputs (text/number, date, select + integration) |
| Phase 3 | T08–T09 | 4-6 | System variables & deletion flow |
| Phase 4 | T10–T11 | 4-6 | Mobile panel + knowledge propagation |
| Phase 5 | 5.1–5.4 | 12-18 | Testing & Quality (Component, E2E, Backend, A11y) |
| Phase 6 | 6.1–6.3 | 8-10 | Knowledge Propagation (Docs, AGENTS.md, Cross-plan) |
| **Phase 7** | **T12–T16** | **22-29** | **Template Editor Variable Components (store, panel, editor, picker, autocomplete)** |
| **Phase 8** | **T17** | **6** | **Variable Resolution Service** |
| **Phase 9** | **T18–T21** | **8** | **Component Tests (picker, panel, editor, autocomplete)** |
| **Phase 10** | **T22–T25** | **4** | **E2E Tests (create, bind, preview, delete)** |
| **Phase 11** | **T26** | **2** | **Per-File Quality Loop** |
| **Phase 12** | **T27** | **3** | **Knowledge Propagation** |
| **Total** | **40+** | **88-117** | |

## Round 4 Enhancement Tasks

### R4-T1: Variable Validation Rules
- [ ] Create `frontend/views/dashboard/certificates/variable-mgmt/components/ValidationEditor.tsx`
  - Required field toggle: Switch component
  - Min/max length for text: two number inputs with label
  - Min/max for numbers: Slider + numeric input
  - Date format validation: format selector (ISO, US, EU, custom)
  - Regex pattern: TextField with monospace font for pattern input
  - Custom validation: code editor textarea with syntax info
  - Validation error display: red text below field in variable editor
  - _Store: `variableStore` adds `validationRules: Record<string, ValidationRule>`_
  - **Quality loop**: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/variable-mgmt/components/ValidationEditor.tsx --lifecycle codescene` (tsgo → biome → lint → codescene)

### R4-T2: Type-Specific Variable Editors
- [ ] Create `frontend/views/dashboard/certificates/variable-mgmt/components/TypeEditors.tsx`
  - TextVariableEditor: rich text editor with bold/italic/underline (MUI v9 + contentEditable)
  - DateVariableEditor: MUI v9 DatePicker with locale-aware format
  - NumberVariableEditor: Slider + TextField with number validation
  - BooleanVariableEditor: MUI v9 Switch with label
  - ImageVariableEditor: file upload + preview thumbnail + dimensions display
  - URLVariableEditor: TextField with URL validation + link preview
  - Each editor returns typed value: `string | number | boolean | Date | File | URL`
  - **Quality loop**: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/variable-mgmt/components/TypeEditors.tsx --lifecycle codescene` (tsgo → biome → lint → codescene)
- [ ] Create `frontend/views/dashboard/certificates/variable-mgmt/components/VariableGroups.tsx`
  - Group sections: collapsible Card per group (Student Info, Course Info, Academy Info)
  - Drag to reorder groups: DnD within the groups list
  - Color tag groups: ColorPicker integration per group
  - Group-level required indicator: badge showing "X required"
  - _Store: `variableStore` adds `groups: VariableGroup[], createGroup(), reorderGroups()`_
  - **Quality loop**: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/variable-mgmt/components/VariableGroups.tsx --lifecycle codescene` (tsgo → biome → lint → codescene)

### R4-T4: CSV Import/Export
- [ ] Create `frontend/views/dashboard/certificates/variable-mgmt/components/CSVImportExport.tsx`
  - CSV template download: button to download CSV with variable names as headers
  - CSV upload: file input with drag-drop + format validation
  - Column mapping UI: Table showing CSV column → variable mapping
  - Auto-detect matching columns by name similarity
  - Validation per row: highlight invalid cells in red with error message
  - Error display: Dialog showing row number + invalid field + error
  - Preview: show first 5 rows before confirming import
  - Conflict resolution: skip/overwrite/rename radio per conflict
  - **Quality loop**: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/variable-mgmt/components/CSVImportExport.tsx --lifecycle codescene` (tsgo → biome → lint → codescene)
- [ ] Update `frontend/views/dashboard/certificates/variable-mgmt/VariableEditor.tsx`
  - Default value field per variable type
  - Fallback chain display: "Recipient → Template Default → Blank"
  - Null handling: "show placeholder text" option
  - "No data found" template text field
  - _Store: `variableStore` adds `defaultValues`, `fallbacks`, `nullDisplayMode`_
  - **Quality loop**: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/variable-mgmt/VariableEditor.tsx --lifecycle codescene` (tsgo → biome → lint → codescene)

### R4-T6: Computed Variables
- [ ] Create `frontend/views/dashboard/certificates/variable-mgmt/components/ComputedVariableEditor.tsx`
  - Formula editor: textarea with monospace font
  - Function library: concat, formatDate, toUpperCase, toLowerCase, conditional
  - Dependency graph: visual tree showing variable dependencies
  - Circular reference detection: validate on save
  - Auto-suggest: suggest variables by typing `$` prefix
  - **Quality loop**: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/variable-mgmt/components/ComputedVariableEditor.tsx --lifecycle codescene` (tsgo → biome → lint → codescene)
- [ ] Create `frontend/views/dashboard/certificates/variable-mgmt/components/UsageTracker.tsx`
  - Per-variable usage count display: badge in variable list
  - "Find all references" button: show list of elements using variable
  - Unused variable warnings: yellow icon next to unused variables
  - Delete with usage confirmation: "This variable is used in 3 elements. Delete anyway?"
  - **Quality loop**: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/variable-mgmt/components/UsageTracker.tsx --lifecycle codescene` (tsgo → biome → lint → codescene)
- [ ] Update `frontend/views/dashboard/certificates/template-editor/canvas/TextNodeEditor.tsx`
  - Auto-suggest dropdown when typing `{` character
  - Fuzzy search: match by partial name
  - Recently used at top of suggestions
  - Variable insertion: click or Enter to insert with `{variableName}` format
  - Inline preview: show current value in suggestion item
  - **Quality loop**: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/template-editor/canvas/TextNodeEditor.tsx --lifecycle codescene` (tsgo → biome → lint → codescene)
- [ ] Update `frontend/views/dashboard/certificates/variable-mgmt/VariableEditor.tsx`
  - Locale selector: MUI v9 Tabs (EN | AR)
  - Per-locale value fields: separate editor per locale
  - Fallback locale hierarchy: EN → AR → blank
  - RTL support for Arabic values: `dir="rtl"` on input fields
  - Mixed LTR/RTL rendering: per-variable direction detection
  - _Store: `variableStore` adds `localeValues: Record<string, Record<Locale, string>>`_
  - **Quality loop**: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/variable-mgmt/VariableEditor.tsx --lifecycle codescene` (tsgo → biome → lint → codescene)

### R4-T10: Search & Filter
- [ ] Create `frontend/views/dashboard/certificates/variable-mgmt/components/VariableSearch.tsx`
  - Search by name: debounced TextField (300ms)
  - Filter by type: dropdown (text/date/number/boolean/image/url)
  - Filter by group: group selector dropdown
  - Filter by required: Switch toggle
  - Search result highlighting: `<mark>` around matched text
  - **Quality loop**: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/variable-mgmt/components/VariableSearch.tsx --lifecycle codescene` (tsgo → biome → lint → codescene)
- [ ] Update `frontend/views/dashboard/certificates/variable-mgmt/components/VariablePickerDialog.tsx`
  - Keyboard navigation: Tab through variables, Enter to select, Esc to close
  - ARIA labels: `aria-label="Select variable"` per item
  - Screen reader: announce variable type and current value
  - Focus management: trap focus in dialog, restore on close
  - **Quality loop**: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/variable-mgmt/components/VariablePickerDialog.tsx --lifecycle codescene` (tsgo → biome → lint → codescene)
- [ ] Create `test/ui/components/variable-mgmt/ValidationEditor.test.tsx`
  - Test required field validation
  - Test min/max length for text
  - Test regex pattern matching
- [ ] Create `test/ui/components/variable-mgmt/CSVImportExport.test.tsx`
  - Test CSV template download
  - Test column mapping auto-detect
  - Test validation per row
  - Test conflict resolution
- [ ] Create `test/ui/components/variable-mgmt/ComputedVariables.test.tsx`
  - Test formula evaluation
  - Test circular reference detection
- [ ] Create `test/ui/components/variable-mgmt/TypeEditors.test.tsx`
  - Test each type editor renders correct input
  - Test type conversion on save

### R4-T13: Knowledge Propagation
- [ ] Create `docs/frontend/variable-management-patterns.md`
  - Update `frontend/AGENTS.md` with reference
  - Run quality checks
