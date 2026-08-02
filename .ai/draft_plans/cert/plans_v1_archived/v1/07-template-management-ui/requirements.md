# Requirements: Plan 07 — Certificate Template Management UI

## Document Information

- **Feature Name**: Certificate Template Management UI
- **Target Directory**: `.ai/draft_plans/cert/plans/07-template-management-ui`
- **Outcome Directory**: `.ai/draft_plans/cert/plans/07-template-management-ui/outcome`
- **Version**: 1.0
- **Date**: 2025-08-01
- **Author**: Copilot
- **Stakeholders**: Academy Admin, Super Admin, Teachers (view-only)
- **Related Documents**:
  - Plan 05: GraphQL API for Certificate Templates
  - Plan 06: PDF Rendering Engine
  - Analysis: `siraj_analysis/05-frontend-patterns.md`
  - Analysis: `siraj_analysis/08-app-router-navigation.md`
  - Analysis: `cgvs_analysis/04-template-ui.md`
  - Analysis: `siraj_analysis/06-i18n-system.md`

---

## Introduction

The Certificate Template Management UI provides academy administrators and super admins with a visual interface for creating, editing, and publishing certificate templates. Templates define the layout, elements (text, images, QR codes, signatures, shapes), variables (placeholders filled at generation time), and category grouping used when generating individual certificates.

### Feature Summary

A full-featured template management interface with list/table view, visual canvas editor with drag-positioned elements, variable management, category tree, preview, and publish/archive workflows — supporting both desktop (full visual editor) and mobile (simplified form editor) experiences.

### Business Value

- Eliminates developer dependency for creating certificate templates — admins self-serve via visual editor
- Enables reusable, category-organized templates with versioned publishing
- Supports preview before publishing to catch layout issues early
- Provides mobile fallback for on-the-go template name/category/status management

### Scope

**In Scope:**
- Template list page with search, filters, pagination
- Template editor with multi-section form (basic info, dimensions, orientation, background, font)
- Visual canvas element editor (desktop) with drag-to-position
- Simplified element list editor (mobile)
- Variable management (create, edit, delete, type, default value, required flag)
- Template preview (client-side positioned React elements, no PDF rendering)
- Publish/archive workflow (draft → published version snapshot, archive published)
- Category tree management (create, rename, reorder)
- i18n via `useAppTranslation("certificates")` namespace
- Zustand store for editor state (selected element, positions, unsaved changes)

**Out of Scope:**
- PDF rendering (covered by Plan 06)
- Certificate generation/issuance (covered by Plan 08)
- Backend GraphQL API implementation (covered by Plan 05)
- Student/parent certificate viewing (covered by Plan 08)
- Template duplication/branching (deferred to future)

---

## Requirements

### Requirement 0: Execution Outcome Protocol & Task Progress Tracking

**User Story:** As an AI agent or developer, I want persistent task outcome tracking and progress updates, so that subsequent tasks do not repeat past research or analysis.

#### Acceptance Criteria

1. WHEN an executing agent starts any task THEN system SHALL read ALL existing outcome files in `.ai/draft_plans/cert/plans/07-template-management-ui/outcome/` to absorb prior research, search results, and pitfalls.
2. WHEN an executing agent completes any task THEN system SHALL write a new outcome document under `.ai/draft_plans/cert/plans/07-template-management-ui/outcome/<task-id>-outcome.md` detailing research findings, docs/web search results, implementation details, and carry-over points.
3. WHEN an executing agent completes any subtask THEN system SHALL update the corresponding task checkbox `[ ]` -> `[x]` in `tasks.md`.
4. WHEN any file is modified THEN system SHALL execute per-file verification (`tsgo` + `biome` + `lint-queue`) on that specific file.
5. WHEN any subtask is completed THEN system SHALL execute `bun tsgo`, `bun biome:check`, and `bun run lint` globally, exiting with zero errors and zero warnings.

---

### Requirement 1: Template List Page

**User Story:** As an academy admin, I want to browse all certificate templates in a paginated table with search and filters, so that I can find and manage templates efficiently.

#### Acceptance Criteria

1. WHEN admin navigates to `/dashboard/certificates/templates` THEN system SHALL display a paginated template list with columns: name, category, status (draft/published/archived), last updated at, and actions (edit, preview, publish/archive).
2. WHEN admin types in the search field THEN system SHALL filter templates by name with debounced search (300ms delay) and reset pagination to page 0.
3. WHEN admin selects a status filter (all/draft/published/archived) THEN system SHALL filter the template list by that status and reset pagination to page 0.
4. WHEN admin selects a category filter THEN system SHALL filter templates by the selected category (and its sub-categories) and reset pagination to page 0.
5. WHEN admin clicks the "Create Template" button THEN system SHALL navigate to the template editor page with a new draft template.
6. WHEN admin clicks "Edit" in the actions column THEN system SHALL navigate to `/dashboard/certificates/templates/[id]/edit`.
7. WHEN admin clicks "Preview" in the actions column THEN system SHALL open a preview dialog showing the certificate template rendered with placeholder variables.
8. WHEN admin clicks "Publish" on a draft template THEN system SHALL confirm the action and call the publish mutation, then update the template status to "published".
9. WHEN admin clicks "Archive" on a published template THEN system SHALL confirm the action and call the archive mutation, then update the template status to "archived".
10. WHEN the template list is empty THEN system SHALL display an empty state with "No templates found" message and a "Create Template" CTA button.
11. WHEN the GraphQL query is loading THEN system SHALL display a loading skeleton in the table area.
12. WHEN the GraphQL query returns an error THEN system SHALL display an error state with a retry button.
13. IF the user does not have `CERTIFICATES_MANAGE_TEMPLATE` permission THEN system SHALL redirect to the dashboard with a "not authorized" message.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 05 (GraphQL API), `AppPermission.CERTIFICATES_MANAGE_TEMPLATE`
- **Assumptions**: Template list returns `{ id, totalCount, rows { ...frag }, pageInfo { ... } }` pattern matching Siraj GraphQL conventions

---

### Requirement 2: Template Editor — Multi-Section Form

**User Story:** As an academy admin, I want to edit a certificate template's basic properties in a multi-section form, so that I can configure the template's metadata, dimensions, and appearance.

#### Acceptance Criteria

1. WHEN admin navigates to `/dashboard/certificates/templates/[id]/edit` THEN system SHALL display the template editor with sections for: Basic Info, Dimensions & Orientation, Background, Font, Elements, Variables, and Preview.
2. WHEN admin edits the "Basic Info" section THEN system SHALL accept: name (required, min 1 char, max 200), description (optional, max 1000 chars), and category (select from category tree).
3. WHEN admin edits the "Dimensions & Orientation" section THEN system SHALL accept: orientation (portrait/landscape), width (mm, min 100, max 1000), height (mm, min 100, max 1000), and margin (mm, min 0, max 50).
4. WHEN admin edits the "Background" section THEN system SHALL accept: background color (color picker, theme palette), background image URL (optional), and background opacity (0-100%).
5. WHEN admin edits the "Font" section THEN system SHALL accept: primary font family (select from system fonts), primary font size (pt, min 6, max 72), and secondary font family (optional).
6. WHEN admin changes any form field THEN system SHALL mark the template as having unsaved changes and enable the "Save" button.
7. WHEN admin clicks "Save" THEN system SHALL call the update mutation with the modified fields and display a success toast on completion.
8. WHEN admin clicks "Save" and the mutation fails THEN system SHALL display an error toast and retain the unsaved changes.
9. WHEN admin attempts to navigate away with unsaved changes THEN system SHALL show a confirmation dialog: "You have unsaved changes. Leave anyway?"
10. WHEN admin clicks "Cancel" on a field change THEN system SHALL revert to the last saved state.
11. IF the template is in "published" or "archived" status THEN system SHALL make all form fields read-only and display a banner: "This template is published. Create a new version to edit."
12. WHEN admin clicks "Create New Version" on a published template THEN system SHALL create a new draft template copying the published template's content and navigate to its editor.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Requirement 1, Plan 05 (GraphQL API)
- **Assumptions**: Template draft state persists in Zustand store; navigate-away guard uses Next.js router events

---

### Requirement 3: Template Element Editor — Visual Canvas (Desktop)

**User Story:** As an academy admin on a desktop device, I want to visually position elements on a certificate canvas by dragging them, so that I can design the certificate layout without coding.

#### Acceptance Criteria

1. WHEN admin opens the "Elements" section of the editor on a desktop viewport THEN system SHALL display a visual canvas matching the template's dimensions (scaled to fit viewport) with positioned elements.
2. WHEN admin drags an element on the canvas THEN system SHALL update the element's x/y position in real-time and store the position in the Zustand store.
3. WHEN admin releases a dragged element THEN system SHALL snap the position to the nearest grid (if grid snapping is enabled, default 5px).
4. WHEN admin selects an element on the canvas THEN system SHALL highlight it with a selection border and display the property panel for that element.
5. WHEN admin clicks "Add Element" THEN system SHALL show a menu of element types: Text, Image, QR Code, Signature, Shape (Rectangle, Circle, Line).
6. WHEN admin selects an element type from the "Add Element" menu THEN system SHALL create a new element at the canvas center with default properties for that type.
7. WHEN admin deletes an element (via property panel or keyboard Delete) THEN system SHALL remove it from the canvas after a confirmation dialog.
8. WHEN admin resizes an element (via drag handles on the selection border) THEN system SHALL update the element's width and height in real-time.
9. WHEN admin rotates an element (via rotation handle) THEN system SHALL update the element's rotation angle (0-360 degrees).
10. WHEN admin toggles grid snapping THEN system SHALL show/hide grid lines on the canvas and enable/disable snap-to-grid behavior.
11. WHEN admin toggles element guidelines THEN system SHALL show alignment guides (center lines, edge alignment) when dragging elements.
12. WHEN admin copies an element (Ctrl+C) and pastes (Ctrl+V) THEN system SHALL create a duplicate element offset 10px from the original.
13. IF the viewport is mobile (width < 768px) THEN system SHALL NOT display the visual canvas and instead show the simplified list editor (Requirement 6).

#### Additional Details
- **Priority**: High
- **Complexity**: High
- **Dependencies**: Requirement 2, Zustand store for element positions
- **Assumptions**: Canvas uses CSS transform for scaling; drag implementation uses pointer events (not HTML5 drag-and-drop API for better control)

---

### Requirement 4: Template Element Property Panel

**User Story:** As an academy admin, I want to edit the properties of a selected element in a side panel, so that I can configure its content, styling, and behavior without leaving the canvas.

#### Acceptance Criteria

1. WHEN admin selects a Text element THEN system SHALL display in the property panel: content (text field or variable selector), font family, font size, font weight, text color, text align, line height, letter spacing.
2. WHEN admin selects an Image element THEN system SHALL display: image URL, alt text, opacity, border radius, object fit.
3. WHEN admin selects a QR Code element THEN system SHALL display: data source (static text or variable reference), size, error correction level (L/M/Q/H), foreground color, background color.
4. WHEN admin selects a Signature element THEN system SHALL display: signer type (fixed person/variable), signature image URL, width, height, and "draw signature" option (opens a drawing canvas dialog).
5. WHEN admin selects a Shape element THEN system SHALL display: shape type (rectangle/circle/line), fill color, border color, border width, border style (solid/dashed/dotted), border radius.
6. WHEN admin edits any property in the panel THEN system SHALL update the element on the canvas in real-time and mark the template as having unsaved changes.
7. WHEN admin changes the z-order (bring forward / send backward / bring to front / send to back) THEN system SHALL update the element's z-index and reorder the elements list.
8. WHEN admin locks an element THEN system SHALL make it non-draggable on the canvas and show a lock icon overlay.
9. WHEN admin toggles element visibility THEN system SHALL hide/show the element on the canvas without removing it.
10. WHEN no element is selected THEN system SHALL display the property panel with template-level properties (background, margins) instead.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Requirement 3
- **Assumptions**: Property panel is a fixed-width sidebar (350px) on the right side of the canvas

---

### Requirement 5: Template Variable Management

**User Story:** As an academy admin, I want to manage template variables that act as placeholders filled at certificate generation time, so that I can define what data gets injected into each certificate.

#### Acceptance Criteria

1. WHEN admin opens the "Variables" section THEN system SHALL display a list of all variables defined for the current template with columns: name, type, default value, required flag, and actions (edit, delete).
2. WHEN admin clicks "Add Variable" THEN system SHALL open a variable creation form with fields: name (required, unique within template, min 1 char, max 100, alphanumeric + underscore only), type (dropdown: TEXT, DATE, NAME, EMAIL, CUSTOM), default value (type-specific input), required flag (checkbox).
3. WHEN admin selects type "TEXT" THEN system SHALL show a single-line text input for the default value.
4. WHEN admin selects type "DATE" THEN system SHALL show a date picker for the default value and a date format field (default `YYYY-MM-DD`).
5. WHEN admin selects type "NAME" THEN system SHALL show a text input for the default value (free text, no validation beyond length).
6. WHEN admin selects type "EMAIL" THEN system SHALL show an email input with email format validation for the default value.
7. WHEN admin selects type "CUSTOM" THEN system SHALL show a JSON text area for complex default values and a description field.
8. WHEN admin clicks "Delete" on a variable THEN system SHALL show a confirmation dialog: "Delete variable '{name}'? Elements using this variable will show placeholder text."
9. WHEN admin clicks "Edit" on a variable THEN system SHALL open the edit form pre-populated with the variable's current values.
10. WHEN a variable is used by an element (content references `{{variableName}}`) THEN system SHALL show a "used" badge next to the variable name.
11. WHEN admin attempts to save a variable with a duplicate name THEN system SHALL show a validation error: "Variable name must be unique."
12. WHEN admin saves a new or edited variable THEN system SHALL update the element editor's available variables list so elements can reference them.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Requirement 2, Requirement 3
- **Assumptions**: Variables are stored on the template entity; the GraphQL mutation for updating a template accepts nested variable definitions

---

### Requirement 6: Template Preview

**User Story:** As an academy admin, I want to preview a certificate template with placeholder data, so that I can verify the layout looks correct before publishing.

#### Acceptance Criteria

1. WHEN admin opens the "Preview" section or clicks the preview button THEN system SHALL render the template using positioned React elements (client-side, no PDF generation) with placeholder variable values.
2. WHEN rendering the preview THEN system SHALL replace each `{{variableName}}` reference in element content with the variable's default value, or with a placeholder string `"<variableName>"` if no default is set.
3. WHEN rendering the preview THEN system SHALL draw the template background (color or image) and all positioned elements at their specified x/y coordinates on a scaled canvas.
4. WHEN admin clicks "Download Preview" THEN system SHALL NOT generate a PDF (deferred to Plan 06) and instead show a tooltip: "PDF generation is not available in preview mode."
5. WHEN admin changes any element or property and returns to the preview THEN system SHALL update the preview to reflect the latest changes from the Zustand store.
6. WHEN the template has no elements THEN system SHALL display an empty preview with text: "No elements. Add elements to see a preview."
7. WHEN the preview is loading THEN system SHALL display a loading spinner overlay on the preview canvas.
8. IF the viewport is mobile THEN system SHALL display the preview in a vertical scrollable container (since the visual canvas editor is not available on mobile, the preview still renders the final layout).

#### Additional Details
- **Priority**: Medium
- **Complexity**: Medium
- **Dependencies**: Requirement 3, Requirement 5
- **Assumptions**: Preview component reuses the element rendering logic from the canvas but in a read-only mode; no drag/select interactions

---

### Requirement 7: Template Publishing & Archiving

**User Story:** As an academy admin, I want to publish a draft template to make it available for certificate generation, and archive templates that are no longer needed, so that only active templates are used.

#### Acceptance Criteria

1. WHEN admin clicks "Publish" on a draft template with all required fields filled (name, at least 1 element) THEN system SHALL call the publish mutation which creates a version snapshot of the current template state and changes status to "published".
2. WHEN admin clicks "Publish" on a draft template missing required fields THEN system SHALL display validation errors: "Template name is required" and "At least one element is required" — and prevent publishing.
3. WHEN publishing succeeds THEN system SHALL display a success toast: "Template published. Version {versionNumber} created." and update the template status to "published".
4. WHEN admin clicks "Archive" on a published template THEN system SHALL show a confirmation dialog: "Archive this template? It will no longer be available for new certificate generation. Existing certificates using this template will remain unchanged."
5. WHEN archiving is confirmed THEN system SHALL call the archive mutation and update the template status to "archived".
6. WHEN admin visits an archived template's editor THEN system SHALL display all fields read-only with a banner: "This template is archived."
7. WHEN a published template has been used to generate certificates THEN system SHALL show a "certificates issued" count badge on the template list and in the editor header.
8. WHEN publishing creates a version snapshot THEN system SHALL store the complete template state (elements, variables, dimensions, background, font) in the version record so historical certificates can reference the exact version.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Requirement 1, Requirement 2, Plan 05 (GraphQL API)
- **Assumptions**: Version snapshots are created server-side by the publish mutation; the UI only triggers the mutation and displays results

---

### Requirement 8: Category Tree Management

**User Story:** As an academy admin, I want to organize templates into a hierarchical category tree, so that I can group related templates and filter the template list by category.

#### Acceptance Criteria

1. WHEN admin navigates to `/dashboard/certificates/categories` THEN system SHALL display a category tree on the left and a category detail panel on the right.
2. WHEN admin clicks a category node THEN system SHALL highlight it and display its details (name, description, template count, sub-categories) in the right panel.
3. WHEN admin clicks "Add Category" THEN system SHALL open a form to create a new category with: name (required, min 1, max 100), description (optional, max 500), and parent category (dropdown of existing categories, nullable for root-level).
4. WHEN admin clicks "Rename" on a category THEN system SHALL enable inline editing of the category name in the tree node.
5. WHEN admin clicks "Delete" on a category THEN system SHALL check if it has templates or sub-categories — if yes, show: "Cannot delete category with templates or sub-categories. Move or delete them first." — if no, show a confirmation dialog and delete on confirm.
6. WHEN admin drags a category node to reorder THEN system SHALL update the display order and persist via mutation.
7. WHEN admin drags a category node onto another category THEN system SHALL make it a sub-category of the target (if max depth not exceeded, default max depth: 3 levels).
8. WHEN the category tree is loading THEN system SHALL display a loading skeleton in the tree area.
9. WHEN admin expands/collapses a category node THEN system SHALL persist the expansion state in the Zustand store (survives page navigation within session).
10. WHEN admin selects a category filter in the template list page THEN system SHALL filter templates by that category and all its descendant categories.
11. WHEN a category has 0 templates THEN system SHALL show a "(0 templates)" label next to the category name.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Medium
- **Dependencies**: Requirement 1, Plan 05 (GraphQL API)
- **Assumptions**: Categories are a flat table with `parentId` self-reference; max depth enforced client-side and server-side

---

### Requirement 9: Mobile vs Desktop Element Editor

**User Story:** As an academy admin on a mobile device, I want a simplified template editor without the drag canvas, so that I can manage template properties and elements from my phone.

#### Acceptance Criteria

1. WHEN the viewport is mobile (width < 768px) THEN system SHALL display `TemplateEditorMobile` instead of `TemplateEditorDesktop`.
2. WHEN mobile editor renders THEN system SHALL display all form sections (Basic Info, Dimensions, Background, Font, Variables, Preview) as collapsible accordions.
3. WHEN mobile editor renders the "Elements" section THEN system SHALL display a list of elements (not a visual canvas) with each element as a card showing: type icon, name/content preview, position (x, y), size (width, height), and action buttons (edit, delete, reorder).
4. WHEN admin taps an element card on mobile THEN system SHALL open a full-screen edit form for that element's properties (same fields as desktop property panel but in a form layout).
5. WHEN admin taps "Add Element" on mobile THEN system SHALL show a bottom sheet with element type options.
6. WHEN admin reorders elements on mobile THEN system SHALL use up/down arrow buttons on each element card to change z-order.
7. WHEN admin previews on mobile THEN system SHALL render the preview in a vertical scrollable container with pinch-to-zoom support.
8. WHEN admin edits element position on mobile THEN system SHALL display numeric x/y input fields in the edit form (no drag) with live preview of the scaled template outline showing the element's position marker.
9. WHILE on mobile THEN system SHALL NOT render the drag canvas, selection borders, resize handles, or alignment guide overlays.
10. WHEN admin switches from mobile to desktop (viewport change or device rotation) THEN system SHALL transparently switch to the desktop editor with all unsaved changes preserved in the Zustand store.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Medium
- **Dependencies**: Requirement 3, Requirement 4, Zustand store
- **Assumptions**: Tier switching uses `ResponsiveViewSwitch` pattern; Zustand store survives tier switches by design

---

### Requirement 10: i18n — All Labels via useAppTranslation("certificates")

**User Story:** As an Arabic-speaking admin, I want all template management UI labels in Arabic, so that I can use the interface in my preferred language.

#### Acceptance Criteria

1. WHEN any template management UI component renders text THEN system SHALL use `useAppTranslation(Translation.Dashboard.Certificates)` (or the equivalent namespace handle) for all labels, buttons, errors, and messages.
2. WHEN the locale is Arabic (`ar`) THEN system SHALL display all template management labels in Arabic with RTL layout.
3. WHEN the locale is English (`en`) THEN system SHALL display all template management labels in English with LTR layout.
4. WHEN an error message is displayed THEN system SHALL use the compile-time translation function (e.g., `t.errors.templateNameRequired`) — never hardcoded strings.
5. WHEN a pluralization is needed (e.g., "X templates", "X elements") THEN system SHALL define the translation as `(count: number) => string` in the namespace type schema and implement in both locale files.
6. WHEN a dynamic value is interpolated (e.g., "Delete variable '{name}'?") THEN system SHALL define the translation as `(name: string) => string` in the namespace type schema and implement in both locale files.
7. WHEN new translation keys are added THEN system SHALL update both `shared/locale/ar/` and `shared/locale/en/` locale files and the namespace type definition.
8. WHERE a new namespace is created for certificates THEN system SHALL register it in the `Translation` const tree in `shared/locale/namespaces/translation.ts` following the convention `Translation.Dashboard.Certificates`.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: `siraj_analysis/06-i18n-system.md`, `shared/AGENTS.md`
- **Assumptions**: Namespace handle follows `defineNamespace` pattern; two locales only (ar default, en)

---

## UX/Navigation Requirements (MANDATORY)

### New Routes & Role-Based Access

| Route | Purpose | Permission | Roles with Access |
|-------|---------|------------|-------------------|
| `/dashboard/certificates/templates` | Template list with search, filters, pagination | `CERTIFICATES_MANAGE_TEMPLATE` | SUPER_ADMIN, ACADEMY_ADMIN |
| `/dashboard/certificates/templates/[id]/edit` | Template editor (visual canvas on desktop, simplified on mobile) | `CERTIFICATES_MANAGE_TEMPLATE` | SUPER_ADMIN, ACADEMY_ADMIN |
| `/dashboard/certificates/categories` | Category tree management | `CERTIFICATES_MANAGE_TEMPLATE` | SUPER_ADMIN, ACADEMY_ADMIN |

> Teacher role (`teacher_default`) has view-only access to the template list (with `CERTIFICATES_VIEW_OTHER` permission) but cannot create, edit, publish, or archive. The "Create" and action buttons are hidden for teachers.

### Sidebar Navigation Placement

- **New Group**: `grp_certificates` — "Certificates" group in the sidebar
- **Section**: `"main"` section
- **Icon**: `Certificate` icon (add to `navIconKeys.ts` + `navIconRegistry.tsx`)
- **Children**:
  1. Templates — `/dashboard/certificates/templates`
  2. Categories — `/dashboard/certificates/categories`
  3. (Future: Certificates — Plan 08)
- **Permission**: `CERTIFICATES_MANAGE_TEMPLATE` (any-of for group visibility)
- **Mobile Bottom Nav**: Not included (admin-only feature, desktop-first)

### Per-Audience Rendering

| Audience | Prominent Content |
|----------|-------------------|
| SUPER_ADMIN | Full CRUD: create, edit, publish, archive, category management |
| ACADEMY_ADMIN | Full CRUD: create, edit, publish, archive, category management |
| TEACHER | View-only: template list visible, no create/edit/publish/archive buttons, click-through to read-only preview |
| PARENT | N/A — no access to template management |
| STUDENT | N/A — no access to template management |

### Mobile vs Desktop

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Template List | `AppDataGrid` with all columns, sorting, server-side pagination | `MobileCardList` — card per template with name, status badge, category chip, last updated |
| Template Editor | Full visual canvas with drag, resize, rotate, property panel sidevar | Accordion form sections; elements as editable cards with numeric position inputs; no drag canvas |
| Category Tree | Split pane: tree on left, detail panel on right, drag-to-reorder | Full-screen tree with expand/collapse, tap to view details in a bottom sheet |
| Preview | In-editor preview tab, side-by-side with canvas | Full-screen scrollable preview with pinch-to-zoom |
| Navigation | Sidebar group "Certificates" | Hamburger menu → "Certificates" group |

---

## Non-Functional Requirements

### Performance Requirements

- WHEN the template list loads THEN system SHALL display initial results within 2 seconds (network-dependent, server-side pagination).
- WHEN the visual canvas renders THEN system SHALL render up to 50 elements without noticeable lag (frame rate > 30fps during drag operations).
- WHEN admin drags an element THEN system SHALL update the position with no perceptible delay (< 16ms per frame).
- IF the template has more than 100 elements THEN system SHALL virtualize non-visible elements to maintain performance.

### Security Requirements

- WHEN any template management page loads THEN system SHALL verify `CERTIFICATES_MANAGE_TEMPLATE` permission via server-side `requirePermissionForPage` AND client-side `<RequirePermission>`.
- WHEN a teacher attempts to access edit/publish/archive actions THEN system SHALL block the action and display "You do not have permission to perform this action."
- WHEN admin performs a publish or archive action THEN system SHALL block the action during impersonation sessions (prevent privilege escalation auditing gaps).
- WHEN template data is transmitted THEN system SHALL use the standard GraphQL endpoint with JWT authentication (no additional encryption needed for template metadata).

### Usability Requirements

- WHEN admin first opens the template editor THEN system SHALL show a brief onboarding tooltip on the canvas: "Drag elements to position them. Click an element to edit its properties."
- WHEN admin hovers over an element on the canvas THEN system SHALL show a tooltip with the element's type and name.
- WHEN admin uses keyboard shortcuts (Ctrl+C, Ctrl+V, Delete) THEN system SHALL provide the expected behavior for element manipulation.
- WHERE the UI uses color to convey status (draft/published/archived) THEN system SHALL also use text labels and icons for color-blind accessibility.

### Reliability Requirements

- WHEN a GraphQL mutation fails due to network error THEN system SHALL display the error toast and retain the user's input (no data loss).
- WHEN the browser tab is refreshed during editing THEN system SHALL restore unsaved changes from the Zustand store (persisted state).
- WHEN the publish mutation partially fails (version created but status not updated) THEN system SHALL poll the template status and reconcile if needed.

---

## Constraints and Assumptions

### Technical Constraints

- Frontend follows Siraj three-location split: `app/` Server Components, `frontend/common/views/` tier-neutral containers, `frontend/desktop/views/` and `frontend/mobile/views/` tier-specific presentation
- MUI v9: no style props, use `sx` prop with theme callbacks
- Apollo Client v4: import hooks from `@apollo/client/react`, no `useLazyQuery`, always include `id` field
- i18n: custom compile-time TypeScript system in `shared/locale/`, no `next-intl`
- Element drag uses Pointer Events API (not HTML5 drag-and-drop) for cross-device compatibility
- Zustand stores in `frontend/common/stores/` (or `frontend/stores/` per current convention)
- AppDataGrid used for desktop lists; MobileCardList for mobile

### Business Constraints

- Only SUPER_ADMIN and ACADEMY_ADMIN can manage templates; teachers have view-only access
- Published templates are read-only; must create a new version to edit
- Categories max depth: 3 levels
- Template name max length: 200 characters
- Max elements per template: 200 (soft limit, performance warning above 100)

### Assumptions

- Plan 05 (GraphQL API) provides all necessary queries and mutations
- Plan 06 (PDF Rendering Engine) handles actual PDF generation; this plan's preview is client-side React elements only
- The `AppPermission.CERTIFICATES_MANAGE_TEMPLATE` permission will be added to the permission enum by Plan 01/02
- The certificate namespace will be registered in the i18n Translation tree as `Translation.Dashboard.Certificates`
- Existing navigation config (`navigationConfig.ts`) supports adding new groups

---

## Success Criteria

### Definition of Done

- [ ] All acceptance criteria are met
- [ ] Non-functional requirements are satisfied
- [ ] Template list, editor, variables, preview, publish/archive, and category tree all functional
- [ ] Mobile variants render correctly (no drag canvas, simplified list editor)
- [ ] i18n: all labels in both Arabic and English, RTL/LTR layout correct
- [ ] Quality gate passes: tsgo, biome, lint, zero errors zero warnings
- [ ] Navigation: sidebar "Certificates" group with Templates and Categories items
- [ ] Permission gate: server-side and client-side permission checks working

### Acceptance Metrics

- Template list page loads in < 2 seconds with 100 templates
- Canvas drag maintains > 30fps with 50 elements
- All E2E user journeys (create → edit → add elements → add variables → preview → publish → archive) complete without errors
- Both `ar` and `en` locales render all labels with no missing translations
- Mobile layout passes basic responsive checks (no horizontal scroll, cards stack correctly)

---

## Glossary

| Term | Definition |
|------|------------|
| Template | A reusable certificate layout definition with positioned elements and variables |
| Element | A positioned component on the certificate canvas (text, image, QR code, signature, shape) |
| Variable | A placeholder in a template that gets filled with data at certificate generation time |
| Category | A hierarchical grouping for organizing templates |
| Version Snapshot | An immutable copy of the template state created at publish time |
| Published | Template status indicating it is available for certificate generation |
| Draft | Template status indicating it is editable and not yet available for generation |
| Archived | Template status indicating it is no longer available for new certificate generation |
| Property Panel | Side panel showing configuration options for the currently selected element |
| Canvas | The visual editing area where elements are positioned via drag |
| Grid Snapping | Behavior that aligns element positions to a grid interval |
| Tier | Device classification (desktop or mobile) determining which view component renders |
| ResponsiveViewSwitch | Siraj component that renders mobile or desktop view based on viewport |

---

## Requirements Review Checklist

### Completeness
- [x] All user roles identified and addressed (SUPER_ADMIN, ACADEMY_ADMIN, TEACHER view-only)
- [x] Normal, edge, and error cases covered
- [x] Requirements are testable and measurable
- [x] No conflicting requirements
- [x] EARS format used consistently
- [x] Navigation/sidebar/tabs defined for all user types
- [x] Permissions mapped to all new routes/pages

### Quality
- [x] Requirements are written in active voice
- [x] Each acceptance criterion is testable
- [x] Requirements avoid implementation details (focus on what, not how)
- [x] Terminology is consistent throughout

### EARS Format Validation
- [x] WHEN statements describe specific events or triggers
- [x] IF statements describe clear conditions or states
- [x] WHILE statements describe continuous behaviors
- [x] WHERE statements describe specific contexts
- [x] All statements use SHALL for system responses

### Traceability
- [x] Requirements are numbered and organized
- [x] Dependencies between requirements are clear
- [x] Requirements link to business objectives
- [x] Assumptions and constraints are documented
