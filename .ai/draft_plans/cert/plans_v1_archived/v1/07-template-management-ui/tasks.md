# Tasks: Plan 07 — Certificate Template Management UI

## Document Information

- **Feature Name**: Certificate Template Management UI
- **Target Directory**: `.ai/draft_plans/cert/plans/07-template-management-ui`
- **Outcome Directory**: `.ai/draft_plans/cert/plans/07-template-management-ui/outcome`
- **Version**: 1.0
- **Date**: 2025-08-01
- **Author**: Copilot
- **Related Documents**:
  - Requirements: `requirements.md`
  - Design: `design.md`
  - Plan 05: GraphQL API
  - Plan 06: PDF Rendering Engine

---

## Pre-Execution Instructions

**Before starting any task:**
1. Read ALL existing files in `.ai/draft_plans/cert/plans/07-template-management-ui/outcome/`
2. Read the following AGENTS.md files:
   - `/home/ahmed/Projects/siraj-cert/AGENTS.md` (root)
   - `/home/ahmed/Projects/siraj-cert/frontend/AGENTS.md`
   - `/home/ahmed/Projects/siraj-cert/frontend/views/AGENTS.md`
3. Read the following instruction files:
   - `/home/ahmed/Projects/siraj-cert/.agents/instructions/frontend.instructions.md`
4. Read the following analysis files:
   - `.ai/draft_plans/cert/siraj_analysis/05-frontend-patterns.md` (three-location split, AppDataGrid, ViewModel pattern)
   - `.ai/draft_plans/cert/siraj_analysis/08-app-router-navigation.md` (routing, sidebar, permissions)
   - `.ai/draft_plans/cert/siraj_analysis/06-i18n-system.md` (compile-time translation system)
   - `.ai/draft_plans/cert/cgvs_analysis/04-template-ui.md` (CGVS template UI reference)

**After completing each task:**
1. Write outcome file: `.ai/draft_plans/cert/plans/07-template-management-ui/outcome/<task-id>-outcome.md`
2. Update task checkbox `[ ]` → `[x]` in this file
3. Run quality loop on modified files

---

## Task 1: GraphQL Documents — Certificate Template Queries & Mutations

- [ ] 1.1 Create `frontend/common/graphql/sharedDocuments/certificates/certificates.documents.ts`
  - Define fragments: `CertificateTemplateFragment`, `CertificateTemplateElementFragment`, `CertificateTemplateVariableFragment`, `CertificateCategoryFragment`
  - Define query documents: `CertificateTemplatesQueryDocument` (paginated list with search/status/category filters), `CertificateTemplateQueryDocument` (single template with elements + variables), `CertificateCategoriesQueryDocument` (hierarchical tree)
  - Define mutation documents: `CreateCertificateTemplateMutationDocument`, `UpdateCertificateTemplateMutationDocument`, `PublishCertificateTemplateMutationDocument`, `ArchiveCertificateTemplateMutationDocument`, `CreateCertificateCategoryMutationDocument`, `UpdateCertificateCategoryMutationDocument`, `DeleteCertificateCategoryMutationDocument`, `ReorderCertificateCategoriesMutationDocument`
  - All documents must include `id` field on every object type for Apollo cache normalization
  - Import `gql`, `TypedDocumentNode` from `@apollo/client`
  - Import `Types` and `Operations` from generated GraphQL types
  - Use `as TypedDocumentNode<Operations.X, Types.X>` casting pattern
  - _Requirements: Req 1, Req 2, Req 5, Req 7, Req 8_
  - **AGENTS.md to read**: `frontend/common/graphql/sharedDocuments/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/AGENTS.md`
  - **Instructions to verify**: `.agents/instructions/frontend.instructions.md`
- [ ] 1.2 Run quality loop on `certificates.documents.ts`
  ```bash
  bun tsgo
  bun biome:check
  curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
    -H "Content-Type: application/json" \
    -d '{"id":"task1","files":["frontend/common/graphql/sharedDocuments/certificates/certificates.documents.ts"]}'
  ```
  Fix all errors before proceeding.
- [ ] 1.3 Verify against AGENTS.md: Check `frontend/common/graphql/sharedDocuments/AGENTS.md` for document naming conventions, fragment patterns, and `id` field requirement
- [ ] 1.4 Write outcome file: `.ai/draft_plans/cert/plans/07-template-management-ui/outcome/task-01-outcome.md`

---

## Task 2: Zustand Store — Certificate Template Editor State

- [ ] 2.1 Create `frontend/common/stores/certificate-template.store.ts`
  - State: `selectedElementId: string | null`, `elements: CertificateTemplateElement[]`, `variables: CertificateTemplateVariable[]`, `isDirty: boolean`, `gridSnapEnabled: boolean`, `showGuides: boolean`, `clipboard: CertificateTemplateElement | null`, `expandedSections: string[]`, `previewMode: boolean`
  - Actions: `setSelectedElementId`, `updateElementPosition`, `updateElementSize`, `updateElementRotation`, `updateElementProperties`, `addElement`, `deleteElement`, `duplicateElement`, `reorderElement`, `toggleElementLock`, `toggleElementVisibility`, `setDirty`, `setGridSnap`, `setGuides`, `copyToClipboard`, `pasteFromClipboard`, `toggleSection`, `setPreviewMode`, `reset`
  - Use Zustand `create` with TypeScript types
  - Follow Siraj Zustand store patterns (see existing stores in `frontend/common/stores/`)
  - _Requirements: Req 3, Req 4, Req 6, Req 9_
  - **AGENTS.md to read**: `backend/stores/AGENTS.md` if exists, else `frontend/AGENTS.md` for store patterns
  - **Instructions to verify**: `.agents/instructions/frontend.instructions.md`
- [ ] 2.2 Run quality loop on `certificate-template.store.ts`
  ```bash
  bun tsgo
  bun biome:check
  curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
    -H "Content-Type: application/json" \
    -d '{"id":"task2","files":["frontend/common/stores/certificate-template.store.ts"]}'
  ```
- [ ] 2.3 Verify against `frontend/AGENTS.md` for Zustand store conventions
- [ ] 2.4 Write outcome file: `.ai/draft_plans/cert/plans/07-template-management-ui/outcome/task-02-outcome.md`

---

## Task 3: Template List Page — Container + Desktop View + Mobile View + App Route

- [ ] 3.1 Create app route: `app/(dashboard)/[locale]/dashboard/certificates/templates/page.tsx`
  - Server Component: auth check via `requirePermissionForPage(userId, [AppPermission.CERTIFICATES_MANAGE_TEMPLATE], locale, context)`
  - Generate metadata via `generateMetadata` with i18n translations
  - Render `<TemplateListContainer />` (client component)
  - _Requirements: Req 1_
  - **AGENTS.md to read**: `app/AGENTS.md`, `frontend/AGENTS.md`
  - **Instructions to verify**: `.agents/instructions/frontend.instructions.md`
- [ ] 3.2 Create ViewModel hook: `frontend/common/views/dashboard/certificates/templates/useTemplateListViewModel.ts`
  - `useQuery(CertificateTemplatesQueryDocument, { variables: { search, statusFilter, categoryId, page, pageSize }, fetchPolicy: "cache-and-network" })`
  - State: `search` (debounced 300ms), `statusFilter`, `categoryId`, `page`
  - Mutations: `useMutation(PublishCertificateTemplateMutationDocument)`, `useMutation(ArchiveCertificateTemplateMutationDocument)`
  - Navigation: `useRouter().push` for create/edit
  - Return `TemplateListViewModel` interface (see design.md Component 1)
  - `canManage` boolean based on permissions (false for teachers)
  - _Requirements: Req 1_
- [ ] 3.3 Create Container: `frontend/common/views/dashboard/certificates/templates/TemplateListContainer.tsx`
  - Wrap in `<RequirePermission permission={AppPermission.CERTIFICATES_MANAGE_TEMPLATE}>`
  - Call `useTemplateListViewModel()` hook
  - Render `<ResponsiveViewSwitch desktop={<TemplateListDesktop {...vm} />} mobile={<TemplateListMobile {...vm} />} />`
  - Pass ViewModel return as props to both tier views
  - _Requirements: Req 1_
- [ ] 3.4 Create Desktop view: `frontend/desktop/views/dashboard/certificates/templates/TemplateListDesktop.tsx`
  - Use `DesktopAppDataGrid` with columns: name, category (chip), status (chip with theme colors), updatedAt (formatted date), actions (edit, preview, publish/archive)
  - Server-side pagination via `buildServerPaginationOptions()`
  - `slots.pagination = GridPagination` (forced by AppDataGrid)
  - No `useMediaQuery`, no `useViewport` (ESLint enforced)
  - All labels via `useAppTranslation(Translation.Dashboard.Certificates)` namespace
  - Toolbar: search field (debounced), status filter (Select), category filter (Select), "Create Template" button
  - Color-blind accessible: status uses both color + text label + icon
  - _Requirements: Req 1, Req 10_
- [ ] 3.5 Create Mobile view: `frontend/mobile/views/dashboard/certificates/templates/TemplateListMobile.tsx`
  - Card-based list (Stack of `Card` components)
  - Each card: template name (titleLg), status badge (chip), category chip, last updated (bodyMd)
  - Swipe/tap actions: edit, preview, publish, archive
  - "Load More" button or infinite scroll for pagination
  - No `useMediaQuery`, no `useViewport`
  - All labels via i18n
  - _Requirements: Req 1, Req 9, Req 10_
- [ ] 3.6 Run quality loop on all files created in this task
  ```bash
  bun tsgo
  bun biome:check
  curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
    -H "Content-Type: application/json" \
    -d '{"id":"task3","files":["app/(dashboard)/[locale]/dashboard/certificates/templates/page.tsx","frontend/common/views/dashboard/certificates/templates/useTemplateListViewModel.ts","frontend/common/views/dashboard/certificates/templates/TemplateListContainer.tsx","frontend/desktop/views/dashboard/certificates/templates/TemplateListDesktop.tsx","frontend/mobile/views/dashboard/certificates/templates/TemplateListMobile.tsx"]}'
  ```
- [ ] 3.7 Verify against `app/AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` for routing, Server Component, and three-location split rules
- [ ] 3.8 Verify against `.agents/instructions/frontend.instructions.md` for frontend conventions
- [ ] 3.9 Write outcome file: `.ai/draft_plans/cert/plans/07-template-management-ui/outcome/task-03-outcome.md`

---

## Task 4: Template Editor Page — Container + Desktop View + App Route

- [ ] 4.1 Create app route: `app/(dashboard)/[locale]/dashboard/certificates/templates/[id]/edit/page.tsx`
  - Server Component: auth + permission check
  - Generate metadata
  - Render `<TemplateEditorContainer templateId={params.id} />`
  - _Requirements: Req 2, Req 3_
  - **AGENTS.md to read**: `app/AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md`
- [ ] 4.2 Create ViewModel hook: `frontend/common/views/dashboard/certificates/templates/useTemplateEditorViewModel.ts`
  - `useQuery(CertificateTemplateQueryDocument, { variables: { id }, fetchPolicy: "cache-and-network" })`
  - Zustand store integration: read/write element positions, selected element, isDirty, grid snap, guides, clipboard, expanded sections
  - Mutations: `useMutation(UpdateCertificateTemplateMutationDocument)`, `useMutation(CreateCertificateTemplateMutationDocument)`, `useMutation(PublishCertificateTemplateMutationDocument)`, `useMutation(ArchiveCertificateTemplateMutationDocument)`
  - Unsaved changes guard: router back interception + Zustand `isDirty` check
  - `isReadOnly` computed: `template.status === "published" || template.status === "archived"`
  - Return `TemplateEditorViewModel` interface (see design.md Component 4)
  - _Requirements: Req 2, Req 3, Req 4_
- [ ] 4.3 Create Container: `frontend/common/views/dashboard/certificates/templates/TemplateEditorContainer.tsx`
  - Wrap in `<RequirePermission permission={AppPermission.CERTIFICATES_MANAGE_TEMPLATE}>`
  - Call `useTemplateEditorViewModel(templateId)` hook
  - Render `<ResponsiveViewSwitch desktop={<TemplateEditorDesktop {...vm} />} mobile={<TemplateEditorMobile {...vm} />} />`
  - _Requirements: Req 2, Req 3, Req 9_
- [ ] 4.4 Create Desktop view: `frontend/desktop/views/dashboard/certificates/templates/TemplateEditorDesktop.tsx`
  - Layout: Section tabs at top (Basic Info, Dimensions, Background, Font, Elements, Variables, Preview)
  - "Elements" section: split view — canvas (left, flexible) + property panel (right, 350px fixed)
  - Toolbar above canvas: Add Element (dropdown menu), Grid Snap toggle, Guides toggle, Zoom controls
  - Published/archived banner at top when `isReadOnly === true`
  - Save/Publish/Archive buttons in sticky footer or app bar
  - All styling via `sx` prop with theme callbacks, no style props, no hardcoded colors
  - All labels via i18n
  - _Requirements: Req 2, Req 3, Req 4, Req 10_
- [ ] 4.5 Run quality loop on all files in this task
  ```bash
  bun tsgo
  bun biome:check
  curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
    -H "Content-Type: application/json" \
    -d '{"id":"task4","files":["app/(dashboard)/[locale]/dashboard/certificates/templates/[id]/edit/page.tsx","frontend/common/views/dashboard/certificates/templates/useTemplateEditorViewModel.ts","frontend/common/views/dashboard/certificates/templates/TemplateEditorContainer.tsx","frontend/desktop/views/dashboard/certificates/templates/TemplateEditorDesktop.tsx"]}'
  ```
- [ ] 4.6 Verify against `frontend/views/AGENTS.md` and `.agents/instructions/frontend.instructions.md`
- [ ] 4.7 Write outcome file: `.ai/draft_plans/cert/plans/07-template-management-ui/outcome/task-04-outcome.md`

---

## Task 5: Template Element Canvas — Visual Drag Editor (Desktop)

- [ ] 5.1 Create `frontend/desktop/views/dashboard/certificates/templates/TemplateElementCanvas.tsx`
  - Render template background (color or image) scaled to fit viewport
  - Elements: absolutely positioned `div` with `CSS transform: translate(x, y) rotate(deg)`
  - Drag via Pointer Events: `onPointerDown` → `onPointerMove` (update position in Zustand) → `onPointerUp` (snap to grid if enabled, default 5px)
  - Resize: 8 drag handles (corners + edges) on selected element's selection border
  - Rotate: rotation handle above selection border
  - Grid lines: optional SVG or CSS background overlay when `gridSnapEnabled`
  - Alignment guides: dynamic lines shown during drag (center/edge alignment)
  - Scale factor: mm → screen pixels based on canvas container width
  - Keyboard: Arrow keys nudge, Delete removes, Ctrl+C/V copy/paste, Ctrl+D duplicate
  - Lock icon overlay on locked elements
  - _Requirements: Req 3_
  - **AGENTS.md to read**: `frontend/AGENTS.md`, `frontend/views/AGENTS.md`
  - **Instructions to verify**: `.agents/instructions/frontend.instructions.md`
- [ ] 5.2 Create element renderer components: `frontend/common/views/dashboard/certificates/templates/elements/`
  - `TextElementRenderer.tsx` — renders text with CSS font properties, `{{variable}}` substitution
  - `ImageElementRenderer.tsx` — `<img>` with object-fit, opacity, border radius
  - `QrCodeElementRenderer.tsx` — QR code generation (use `qrcode.react` or similar lightweight library)
  - `SignatureElementRenderer.tsx` — `<img>` for signature image
  - `ShapeElementRenderer.tsx` — SVG or CSS for rectangle/circle/line with fill/border
  - `index.ts` — barrel export + `ElementRenderer` dispatcher component that switches on `element.type`
  - Each renderer accepts `ElementRendererProps` (see design.md Component 12)
  - `readOnly` prop: true for preview, false for canvas interactive mode
  - _Requirements: Req 3, Req 6_
- [ ] 5.3 Run quality loop on all canvas and renderer files
  ```bash
  bun tsgo
  bun biome:check
  curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
    -H "Content-Type: application/json" \
    -d '{"id":"task5","files":["frontend/desktop/views/dashboard/certificates/templates/TemplateElementCanvas.tsx","frontend/common/views/dashboard/certificates/templates/elements/TextElementRenderer.tsx","frontend/common/views/dashboard/certificates/templates/elements/ImageElementRenderer.tsx","frontend/common/views/dashboard/certificates/templates/elements/QrCodeElementRenderer.tsx","frontend/common/views/dashboard/certificates/templates/elements/SignatureElementRenderer.tsx","frontend/common/views/dashboard/certificates/templates/elements/ShapeElementRenderer.tsx","frontend/common/views/dashboard/certificates/templates/elements/index.ts"]}'
  ```
- [ ] 5.4 Verify against `frontend/AGENTS.md` for MUI v9 compliance (no style props, `sx` prop only)
- [ ] 5.5 Verify against `.agents/instructions/frontend.instructions.md`
- [ ] 5.6 Write outcome file: `.ai/draft_plans/cert/plans/07-template-management-ui/outcome/task-05-outcome.md`

---

## Task 6: Template Property Panel — Element Configuration (Desktop)

- [ ] 6.1 Create `frontend/desktop/views/dashboard/certificates/templates/TemplatePropertyPanel.tsx`
  - Fixed-width sidebar (350px) on right side of canvas
  - Dynamic form based on `selectedElement.type`:
    - **Text**: content (TextField or variable dropdown), fontFamily, fontSize, fontWeight, color (ColorPicker), textAlign, lineHeight, letterSpacing
    - **Image**: imageURL, altText, opacity (Slider 0-100), borderRadius, objectFit (Select)
    - **QR Code**: dataSource (static or variable), size, errorCorrectionLevel (L/M/Q/H), foregroundColor, backgroundColor
    - **Signature**: signerType (fixed/variable), signatureImageURL, width, height, "Draw Signature" button
    - **Shape**: shapeType (rectangle/circle/line), fillColor, borderColor, borderWidth, borderStyle, borderRadius
  - Z-order controls at top: Back, Forward, Front, Backward icon buttons
  - Lock/Visibility toggle buttons at top
  - No element selected: show template-level properties (background, margins, font defaults)
  - All changes call `onElementUpdate(id, properties)` immediately (real-time canvas update)
  - All styling via `sx` prop, no style props
  - All labels via i18n
  - _Requirements: Req 4_
  - **AGENTS.md to read**: `frontend/AGENTS.md`, `frontend/views/AGENTS.md`
  - **Instructions to verify**: `.agents/instructions/frontend.instructions.md`
- [ ] 6.2 Run quality loop on `TemplatePropertyPanel.tsx`
  ```bash
  bun tsgo
  bun biome:check
  curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
    -H "Content-Type: application/json" \
    -d '{"id":"task6","files":["frontend/desktop/views/dashboard/certificates/templates/TemplatePropertyPanel.tsx"]}'
  ```
- [ ] 6.3 Verify against `frontend/AGENTS.md` for MUI v9 form component compliance
- [ ] 6.4 Write outcome file: `.ai/draft_plans/cert/plans/07-template-management-ui/outcome/task-06-outcome.md`

---

## Task 7: Template Editor Mobile View — Simplified Form-Based Editor

- [ ] 7.1 Create `frontend/mobile/views/dashboard/certificates/templates/TemplateEditorMobile.tsx`
  - Accordion sections (MUI `Accordion`): Basic Info, Dimensions, Background, Font, Elements, Variables, Preview
  - "Elements" accordion: list of element cards (Stack of Card)
    - Each card: type icon, content preview (first 30 chars), position (x, y), size (w, h), up/down reorder buttons, edit button, delete button
    - Tap edit → full-screen `ElementEditForm` with same fields as desktop property panel in form layout
    - Add element: FAB or "Add" button → bottom sheet with element type menu
    - Position editing: numeric X/Y inputs with small scaled template outline (200px wide) showing element position as dot marker
  - "Preview" section: full-screen scrollable with pinch-to-zoom (CSS `touch-action: pinch-zoom`)
  - No drag canvas, no selection borders, no resize/rotate handles, no alignment guides
  - Save/Publish buttons in sticky bottom bar
  - Published/archived banner at top when `isReadOnly === true`
  - All labels via i18n
  - _Requirements: Req 9_
  - **AGENTS.md to read**: `frontend/AGENTS.md`, `frontend/views/AGENTS.md`
  - **Instructions to verify**: `.agents/instructions/frontend.instructions.md`
- [ ] 7.2 Run quality loop on `TemplateEditorMobile.tsx`
  ```bash
  bun tsgo
  bun biome:check
  curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
    -H "Content-Type: application/json" \
    -d '{"id":"task7","files":["frontend/mobile/views/dashboard/certificates/templates/TemplateEditorMobile.tsx"]}'
  ```
- [ ] 7.3 Verify against `frontend/AGENTS.md` for mobile tier rules (no useMediaQuery, no useViewport)
- [ ] 7.4 Write outcome file: `.ai/draft_plans/cert/plans/07-template-management-ui/outcome/task-07-outcome.md`

---

## Task 8: Template Variable Management UI

- [ ] 8.1 Create `frontend/common/views/dashboard/certificates/templates/TemplateVariableManagement.tsx`
  - Tier-neutral component (responsive form layout, used by both desktop and mobile)
  - Table/list of variables: name, type (chip), default value, required flag, used count, actions (edit/delete)
  - "Add Variable" button → opens dialog form
  - Variable form fields by type:
    - Common: name (required, unique), type (Select: TEXT/DATE/NAME/EMAIL/CUSTOM), required (Checkbox)
    - TEXT: defaultValue (TextField)
    - DATE: defaultValue (DatePicker), format (TextField, default `YYYY-MM-DD`)
    - NAME: defaultValue (TextField)
    - EMAIL: defaultValue (TextField with email validation)
    - CUSTOM: defaultValue (TextArea, JSON), description (TextField)
  - Validation: name unique within template, alphanumeric + underscore only, min 1 max 100 chars
  - Delete confirmation dialog: `t.templates.variables.deleteConfirm(name)` (interpolated)
  - "Used" badge when element references `{{variableName}}`
  - All labels via `t.templates.variables.*` from i18n namespace
  - _Requirements: Req 5_
  - **AGENTS.md to read**: `frontend/AGENTS.md`, `frontend/views/AGENTS.md`
  - **Instructions to verify**: `.agents/instructions/frontend.instructions.md`
- [ ] 8.2 Run quality loop on `TemplateVariableManagement.tsx`
  ```bash
  bun tsgo
  bun biome:check
  curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
    -H "Content-Type: application/json" \
    -d '{"id":"task8","files":["frontend/common/views/dashboard/certificates/templates/TemplateVariableManagement.tsx"]}'
  ```
- [ ] 8.3 Verify against `frontend/AGENTS.md` for dialog and form patterns
- [ ] 8.4 Write outcome file: `.ai/draft_plans/cert/plans/07-template-management-ui/outcome/task-08-outcome.md`

---

## Task 9: Category Tree Management UI

- [ ] 9.1 Create app route: `app/(dashboard)/[locale]/dashboard/certificates/categories/page.tsx`
  - Server Component: auth + permission check (`CERTIFICATES_MANAGE_TEMPLATE`)
  - Generate metadata
  - Render `<CategoryTreeContainer />`
  - _Requirements: Req 8_
  - **AGENTS.md to read**: `app/AGENTS.md`, `frontend/AGENTS.md`
- [ ] 9.2 Create ViewModel: `frontend/common/views/dashboard/certificates/categories/useCategoryTreeViewModel.ts`
  - `useQuery(CertificateCategoriesQueryDocument)` for tree
  - `useMutation(CreateCertificateCategoryMutationDocument)`
  - `useMutation(UpdateCertificateCategoryMutationDocument)`
  - `useMutation(DeleteCertificateCategoryMutationDocument)`
  - `useMutation(ReorderCertificateCategoriesMutationDocument)`
  - Zustand: `expandedCategoryIds` state
  - _Requirements: Req 8_
- [ ] 9.3 Create Container: `frontend/common/views/dashboard/certificates/categories/CategoryTreeContainer.tsx`
  - Permission wrapper
  - ResponsiveViewSwitch for desktop/mobile
  - _Requirements: Req 8_
- [ ] 9.4 Create Desktop view: `frontend/desktop/views/dashboard/certificates/categories/CategoryTreeDesktop.tsx`
  - Split pane: tree (left, 300px) + detail panel (right, flexible)
  - Tree uses MUI `TreeView` with custom node rendering
  - Drag-to-reorder within tree (Pointer Events)
  - Node actions: Add Child, Rename (inline), Delete
  - Detail panel: name, description, template count, sub-category list
  - _Requirements: Req 8_
- [ ] 9.5 Create Mobile view: `frontend/mobile/views/dashboard/certificates/categories/CategoryTreeMobile.tsx`
  - Full-screen tree with expand/collapse (tap chevron)
  - Tap category → bottom sheet with details and actions
  - Reorder via up/down arrow buttons (no drag on mobile)
  - _Requirements: Req 8_
- [ ] 9.6 Run quality loop on all category files
  ```bash
  bun tsgo
  bun biome:check
  curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
    -H "Content-Type: application/json" \
    -d '{"id":"task9","files":["app/(dashboard)/[locale]/dashboard/certificates/categories/page.tsx","frontend/common/views/dashboard/certificates/categories/useCategoryTreeViewModel.ts","frontend/common/views/dashboard/certificates/categories/CategoryTreeContainer.tsx","frontend/desktop/views/dashboard/certificates/categories/CategoryTreeDesktop.tsx","frontend/mobile/views/dashboard/certificates/categories/CategoryTreeMobile.tsx"]}'
  ```
- [ ] 9.7 Verify against `app/AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md`
- [ ] 9.8 Write outcome file: `.ai/draft_plans/cert/plans/07-template-management-ui/outcome/task-09-outcome.md`

---

## Task 10: Template Preview Component

- [ ] 10.1 Create `frontend/common/views/dashboard/certificates/templates/TemplatePreview.tsx`
  - Tier-neutral, responsive component
  - Renders template background (color or image) at template's aspect ratio, scaled to fit container
  - Renders each element at x/y position using `ElementRenderer` subcomponents in `readOnly` mode
  - Variable substitution: `{{variableName}}` → default value or `<variableName>` placeholder
  - Read-only: no drag, no selection, no handles, no toolbar
  - Scale factor: same mm-to-pixel as canvas
  - Loading overlay: spinner while element data resolves
  - Empty state: `t.templates.preview.noElements` message
  - Mobile: scrollable container with `touch-action: pinch-zoom`
  - _Requirements: Req 6_
  - **AGENTS.md to read**: `frontend/AGENTS.md`, `frontend/views/AGENTS.md`
  - **Instructions to verify**: `.agents/instructions/frontend.instructions.md`
- [ ] 10.2 Run quality loop on `TemplatePreview.tsx`
  ```bash
  bun tsgo
  bun biome:check
  curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
    -H "Content-Type: application/json" \
    -d '{"id":"task10","files":["frontend/common/views/dashboard/certificates/templates/TemplatePreview.tsx"]}'
  ```
- [ ] 10.3 Verify against `frontend/AGENTS.md` for component patterns
- [ ] 10.4 Write outcome file: `.ai/draft_plans/cert/plans/07-template-management-ui/outcome/task-10-outcome.md`

---

## Task 11: Sidebar Navigation & Icon Registration

- [ ] 11.1 Add certificate icon to navigation
  - Add `certificate` to `navIconKeys.ts` (key in icon enum)
  - Register `CertificateOutlined` from `@mui/icons-material` in `navIconRegistry.tsx` (MUI v9 naming: `*Outlined` suffix)
  - _Requirements: UX/Nav spec_
  - **AGENTS.md to read**: `frontend/AGENTS.md` for navigation config location
  - **Instructions to verify**: `.agents/instructions/frontend.instructions.md`
- [ ] 11.2 Add navigation group and items to sidebar config
  - New group: `grp_certificates` — "Certificates" in the sidebar navigation config
  - Section: `"main"` section
  - Insertion order: After `grp_content` group, before `grp_finance` group
  - Children (ordered):
    1. `nav_certificates_templates` → `/dashboard/certificates/templates`
    2. `nav_certificates_categories` → `/dashboard/certificates/categories`
  - Permission: `CERTIFICATES_MANAGE_TEMPLATE` (any-of array for group visibility)
  - Mobile bottom nav: not included (admin-only)
  - _Requirements: UX/Nav spec_
- [ ] 11.3 Run quality loop on modified navigation files
  ```bash
  bun tsgo
  bun biome:check
  curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
    -H "Content-Type: application/json" \
    -d '{"id":"task11","files":["frontend/common/views/dashboard/config/navIconKeys.ts","frontend/common/views/dashboard/config/navIconRegistry.tsx","frontend/common/views/dashboard/config/navigationConfig.ts"]}'
  ```
  *(Adjust file paths to actual navigation config location discovered during implementation)*
- [ ] 11.4 Verify against `frontend/AGENTS.md` and `.agents/instructions/frontend.instructions.md`
- [ ] 11.5 Write outcome file: `.ai/draft_plans/cert/plans/07-template-management-ui/outcome/task-11-outcome.md`

---

## Task 12: Publish & Archive Workflows

- [ ] 12.1 Implement publish workflow in the template list and editor
  - "Publish" button on draft templates (hidden for teachers)
  - Validation: name required, at least 1 element required — show errors if missing
  - Confirmation dialog before calling `PublishCertificateTemplateMutationDocument`
  - Success toast: `t.templates.publishSuccess(versionNumber)` (interpolated)
  - Update Apollo cache: set template status to "published"
  - "Create New Version" button on published templates — creates a new draft copying template content
  - _Requirements: Req 7_
  - **AGENTS.md to read**: `frontend/AGENTS.md`, `frontend/views/AGENTS.md`
- [ ] 12.2 Implement archive workflow
  - "Archive" button on published templates (hidden for teachers)
  - Confirmation dialog: `t.templates.archiveConfirm` with explanation about existing certificates
  - Call `ArchiveCertificateTemplateMutationDocument`
  - Update Apollo cache: set template status to "archived"
  - Archived templates: editor shows read-only banner `t.templates.archivedBanner`
  - _Requirements: Req 7_
- [ ] 12.3 Add "certificates issued" count badge
  - Badge in template list and editor header showing `certificatesCount`
  - Only visible for published templates with count > 0
  - _Requirements: Req 7_
- [ ] 12.4 Run quality loop on modified files
  ```bash
  bun tsgo
  bun biome:check
  curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
    -H "Content-Type: application/json" \
    -d '{"id":"task12","files":["<all modified files>"]}'
  ```
- [ ] 12.5 Write outcome file: `.ai/draft_plans/cert/plans/07-template-management-ui/outcome/task-12-outcome.md`

---

## Task 13: Full Quality Loop Verification

- [ ] 13.1 Run global type check
  ```bash
  bun tsgo
  ```
  Fix all type errors in files created by this plan.
- [ ] 13.2 Run global biome check
  ```bash
  bun biome:check
  ```
  Fix all formatting/lint issues.
- [ ] 13.3 Run global ESLint via lint queue
  ```bash
  bun run lint
  ```
  Must exit with 0 errors, 0 warnings.
- [ ] 13.4 Verify no `console.*` usage — all logging via `logger` from `@/frontend/utils/logger`
- [ ] 13.5 Verify no hardcoded colors — all via theme palette
- [ ] 13.6 Verify no style props on MUI components — all via `sx` prop
- [ ] 13.7 Verify all i18n keys exist in both `ar` and `en` locale files
- [ ] 13.8 Verify all GraphQL documents include `id` field
- [ ] 13.9 Verify no `useLazyQuery` — only stateful `useQuery`
- [ ] 13.10 Verify imports from `@apollo/client/react`, not `@apollo/client`
- [ ] 13.11 Write outcome file: `.ai/draft_plans/cert/plans/07-template-management-ui/outcome/task-13-outcome.md`

---

## Task 14: Knowledge Propagation & Documentation

- [ ] 14.1 Read all outcome files in `.ai/draft_plans/cert/plans/07-template-management-ui/outcome/` to synthesize learnings
- [ ] 14.2 Create canonical reference doc: `docs/frontend/certificate-template-ui.md`
  - Document the three-location split pattern for template management
  - Document Pointer Events drag canvas pattern
  - Document Zustand store for editor state pattern
  - Document element renderer component pattern (shared between canvas and preview)
  - Document MUI v9 compliance notes for complex form layouts
  - Document i18n namespace usage for certificates
  - Include "What NOT to do" section with anti-patterns discovered
- [ ] 14.3 Update `frontend/AGENTS.md` with certificate template UI patterns and reference to new doc
- [ ] 14.4 Update `frontend/views/AGENTS.md` if new view patterns were introduced
- [ ] 14.5 Update `.agents/instructions/frontend.instructions.md` if new conventions should be enforced
- [ ] 14.6 Update root `AGENTS.md` Important References section with `docs/frontend/certificate-template-ui.md`
- [ ] 14.7 Update `.agents/skills/frontend-patterns/SKILL.md` if new patterns affect the skill's domain
- [ ] 14.8 Run final quality gate: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings)
- [ ] 14.9 Write outcome file: `.ai/draft_plans/cert/plans/07-template-management-ui/outcome/task-14-knowledge-propagation-outcome.md`
- [ ] 14.10 Mark all tasks as `[x]` in this file

---

## Dependency Graph

```
Task 1 (GraphQL Documents) ──┐
Task 2 (Zustand Store) ──────┤
                              ├── Task 3 (Template List Page)
                              ├── Task 4 (Template Editor Page)
                              │     ├── Task 5 (Canvas + Element Renderers)
                              │     ├── Task 6 (Property Panel)
                              │     ├── Task 7 (Mobile Editor)
                              │     ├── Task 8 (Variable Management)
                              │     └── Task 10 (Preview)
                              ├── Task 9 (Category Tree)
                              ├── Task 11 (Sidebar Nav & Icons)
                              └── Task 12 (Publish/Archive Workflows)
                                    └── Task 13 (Full Quality Loop)
                                          └── Task 14 (Knowledge Propagation)
```

## Execution Order

1. **Foundation** (parallel): Tasks 1, 2
2. **Pages** (parallel after 1+2): Tasks 3, 4, 9
3. **Editor Components** (parallel after 4): Tasks 5, 6, 7, 8, 10
4. **Navigation** (after 3): Task 11
5. **Workflows** (after 3, 4): Task 12
6. **Verification**: Task 13
7. **Documentation**: Task 14
