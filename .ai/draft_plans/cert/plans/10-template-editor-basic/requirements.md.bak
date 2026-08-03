# Requirements — Plan 10: Template Editor — Basic Info & Dimensions

> **Plan**: 10 — Template Editor — Basic Info & Dimensions
> **Depends On**: Plan 5 (GraphQL API)
> **Stakeholders**: Certificate admin, system admin
> **Related Docs**: MASTER_ARCHITECTURE.md; cgvs_analysis/01-generation-logic.md §2 (Template Structure), §4 (Template Elements); cgvs_analysis/04-template-ui.md §2 (Template Editor/Designer), §7 (Tab System); siraj_analysis/05-frontend-patterns.md; siraj_analysis/06-i18n-system.md

---

## 1. Introduction

### Overview

The Template Editor — Basic Info & Dimensions feature provides a multi-section form-based editor for certificate templates. It allows admins to edit template metadata (name, description, category), configure canvas dimensions and orientation, upload a background image, and set default font settings. The editor shell uses an accordion or tab-based layout to organize these settings. A live dimension preview shows the template's aspect ratio visually. The editor manages dirty state (unsaved changes), provides save/discard actions, and supports both desktop and mobile presentations.

### Business Value

- Admins can configure all template-level settings (non-visual) in a single organized editor
- Dimensions and orientation drive the PDF rendering canvas — correct values are critical for output quality
- Background image and font defaults provide the visual foundation for the template
- Dirty-state tracking prevents accidental data loss when navigating away
- Desktop and mobile parity ensures admins can edit templates from any device

### Scope

| In Scope | Out of Scope |
|----------|-------------|
| Template editor page at `/certificates/templates/[templateId]` | Visual canvas editor (Plan 11) |
| Editor shell with tab/accordion navigation (Basic Info, Dimensions, Background, Font Settings) | Element CRUD and positioning (Plan 12) |
| Basic Info form (name, description, category) | Template variable management (Plan 13) |
| Dimensions form (width, height, orientation: portrait/landscape, paper size: A4/Letter/Custom) | Recipient group management (Plan 14) |
| Background form (image upload via drag-drop or click, background color) | Template preview and publishing (Plan 15) |
| Font Settings form (font family, default font size, text color) | Template list and navigation (Plan 8) |
| Live dimension preview (visual rectangle showing aspect ratio) | Category management UI (Plan 9) |
| Zustand store (current template data, dirty flag, save indicator, active tab) | PDF rendering engine (Plan 6) |
| GraphQL documents (template by-ID query, update template mutation) | Storage service implementation (Plan 7) — this plan consumes it |
| Container + ViewModel + Desktop/Mobile presentation views | Backend schema, services, repos (Plan 1-4) |
| Permission gate: `CertificateTemplateManage` (`certificates.templates.manage`) | |
| Optimistic locking (expectedVersion on mutation) | |
| Orphan background image cleanup on discard | |
| Single-flight save guard (prevent auto-save vs manual-save races) | |
| Navigation guard (confirmed-pending-navigation pattern for SPA, beforeunload for tab close) | |
| Color picker via react-color + MUI Popover + hex TextField (a11y-safe) | |
| Font list from shared constant `CERT_ALLOWED_FONTS` (single source for editor + Plan 6 renderer) | |
| DPI standard: 72 DPI for all canvas dimensions (A4=595×842, Letter=612×792) per shared `CERT_CANVAS_DPI` | |
| i18n keys for all form labels, validation messages, section headers, save/discard dialogs | |
| Validation (name required, dimensions positive, orientation valid) | |
| Background image upload flow (select file → upload → signed URL → set as background) | |
| Auto-save indicator | |
| Unsaved-changes navigation guard (discard dialog) | |

---

## 2. Requirements

### REQ-10-01: Editor Page — Server Guard & Permission Check

**WHEN** a user navigates to `/certificates/templates/[templateId]`, **THE SYSTEM SHALL** verify authentication and `CertificateTemplateManage` permission before rendering the editor.

**Acceptance Criteria**:
- `app/(dashboard)/certificates/templates/[templateId]/page.tsx` is an async server component
- `getServerUserContext()` resolves `userId`; redirect to login if absent
- `requirePermissionForPage(userId, [AppPermission.CertificateTemplateManage], locale, context)` gates access
- `generateMetadata()` returns a translated page title using `getTranslations(locale).dashboardTranslations.certificateTemplateEditor.title`
- The page renders `<TemplateEditorContainer templateId={id} />`
- If the template ID is missing or invalid, the page still renders the container (which handles error state)

### REQ-10-02: Editor Shell — Tab/Accordion Navigation

**WHEN** the template editor loads, **THE SYSTEM SHALL** present a multi-section editor with navigation between four sections: Basic Info, Dimensions & Orientation, Background, and Font Settings.

**Acceptance Criteria**:
- Desktop presentation uses a tab bar (MUI `Tab` components) with section labels from i18n
- Mobile presentation uses collapsible accordion sections (MUI `Accordion` components)
- Active section state persists in Zustand store (`activeSection`) so it survives tier switching on resize
- Switching sections does NOT trigger data fetch (all sections use the same loaded template data)
- Each section renders as a form; a **single global save bar** in the editor header handles all sections (not per-section save)
- The editor header includes: back button (to template list), template name, template status badge (`Draft` / `Published` / `Archived`)
- The editor header shows an auto-save indicator (text + spinner/checkmark/error icon) and an unsaved-changes indicator when dirty flag is true
- **Desktop variant**: tab bar uses MUI `Tabs` with text labels, 2-column grid form layout, save/discard as text buttons in header
- **Mobile variant**: accordion sections (one open at a time, state in `activeSection` in store), single-column stacked form layout, save/discard in bottom sticky bar or icon buttons in header, auto-save indicator as a strip below header

### REQ-10-03: Basic Info Form

**WHEN** the user opens the Basic Info section, **THE SYSTEM SHALL** display a form with template name (required), description (optional, multiline), and category (select from category tree).

**Acceptance Criteria**:
- Name field: MUI `TextField` with `react-hook-form` `register('name')`, required, max 255 characters, pre-filled with current template name
- Description field: MUI `TextField` with `multiline` and `rows={4}`, optional, pre-filled, character counter `{length}/500`
- Category field: MUI `Autocomplete` with `react-hook-form` `Controller` wrapping, populated from `certificateCategoriesQueryDocument`, **optional** (nullable `categoryId`)
- Category options show: category name (and parent path breadcrumb for nested categories)
- Form fields use Zustand store for local editing state (survives tier switching); `react-hook-form` `useForm` with `zodResolver` handles validation
- Changing any field sets the dirty flag to true in the store (via `updateLocalField`)
- Validation: name is required (non-empty after trim), max 255 chars; category is optional (no validation error when empty)
- Validation errors display below each field using localized messages from Zod schema error mapping
- Save button is disabled when no changes detected (dirty flag false) or when validation fails (`formState.errors` non-empty)

### REQ-10-04: Dimensions & Orientation Form

**WHEN** the user opens the Dimensions section, **THE SYSTEM SHALL** display a form for width, height, orientation, and paper size preset.

**Acceptance Criteria**:
- Paper size preset: MUI `Select` or `ToggleButtonGroup` with options: A4, Letter, Custom
- When A4 is selected: width and height auto-fill with A4 dimensions (595 × 842 px at 72 DPI per `CERT_CANVAS_DPI`), fields become read-only
- When Letter is selected: width and height auto-fill with Letter dimensions (612 × 792 px at 72 DPI), fields become read-only
- When Custom is selected: width and height fields become editable
- Width field: numeric `TextField`, must be positive integer, min 100, max 10000 (pixels)
- Height field: numeric `TextField`, must be positive integer, min 100, max 10000 (pixels)
- Orientation: MUI `RadioGroup` or `ToggleButtonGroup` with options: Portrait, Landscape
- Selecting Portrait: if current width > height, swap width and height
- Selecting Landscape: if current height > width, swap width and height
- Changing dimensions/orientation updates the live dimension preview
- Live dimension preview: a visual rectangle (MUI `Box`) scaled to fit within a preview container, showing the template's aspect ratio with width × height labels
- Preview rectangle uses `sx` with theme colors (border from `theme.palette.primary.main`, background from `theme.palette.primaryContainer`)
- Changing any field sets dirty flag to true
- Validation: width and height must be positive integers within range; orientation must be a valid enum value (`portrait` | `landscape`)
- If paper size preset changes, a confirmation may appear if dimensions were custom-set (optional UX decision)

### REQ-10-05: Background Form

**WHEN** the user opens the Background section, **THE SYSTEM SHALL** display options for background image upload and background color.

**Acceptance Criteria**:
- Background image: drag-and-drop area (dashed border `Box`) OR click-to-open file picker
- Accepted file types: PNG, JPEG, WebP (configurable via template config `ALLOWED_FILE_TYPES`)
- Maximum file size enforced (configurable via `MAX_BACKGROUND_SIZE`); validation error on exceed
- Upload flow: select file → call upload mutation → receive signed URL → set as `backgroundImageUrl` in local state
- Upload progress indicator (linear or circular) while uploading
- Current background image preview (thumbnail) if one is set
- Remove background image button (clears `backgroundImageUrl` in local state, sets dirty flag)
- Background color: `ColorPickerField` component (react-color `ChromePicker` wrapped in MUI `Popover` with hex `TextField` for a11y), for solid color backgrounds
- Background image and background color are mutually exclusive in rendering but both can be stored (image takes precedence at render time)
- Changing any field sets dirty flag to true
- File object stored in `useRef` in the ViewModel hook (NOT in Zustand — non-serializable per store rules)

### REQ-10-06: Font Settings Form

**WHEN** the user opens the Font Settings section, **THE SYSTEM SHALL** display options for default font family, default font size, and default text color.

**Acceptance Criteria**:
- Font family: MUI `Select` populated from shared constant `CERT_ALLOWED_FONTS` (defined in `shared/constants/certificate.constants.ts` — single source for editor + Plan 6 renderer)
- Font family options include at minimum: Cairo, Tajawal, Amiri (Arabic), Inter, Roboto (English/Latin), System Default
- Default font size: numeric `TextField`, min 8, max 72, default 14 (px)
- Default text color: `ColorPickerField` widget (hex value with preview swatch). `ColorPickerField` is a shared component at `shared/components/ui/ColorPickerField.tsx` wrapping react-color `ChromePicker` in an MUI `Popover` with an accessible hex `TextField` trigger. Mobile variant uses full-screen overlay instead of `Popover`.
- Font settings serve as defaults for all elements in the template; individual elements can override
- Changing any field sets dirty flag to true
- Validation: font size must be positive integer 8-72; color must be valid hex format (`#RRGGBB` or `#RGB`)

### REQ-10-07: Save & Discard

**WHEN** the user triggers Save (global save bar in editor header), **THE SYSTEM SHALL** call the `updateTemplateEditor` mutation with the current form data and show feedback.

**Acceptance Criteria**:
- Save action calls `useMutation(updateTemplateEditorMutationDocument)` with the template ID, changed fields, and `expectedVersion` for optimistic locking
- Save is **global only** (no per-section save) — single save button in editor header covers all sections
- While saving: save button shows loading state (spinner), disabled
- **Single-flight save guard**: if a save is already in-flight, subsequent save attempts (manual or auto-save) are skipped to prevent race conditions (controlled by `saveInFlight` ref in ViewModel)
- On success: dirty flag resets to false, `serverTemplate` updated to new server state, `version` increments, success snackbar appears (localized message from `save.success` key)
- On failure (validation): error snackbar appears with localized error message, dirty flag remains true
- On failure (version conflict — 409): conflict dialog appears with "Reload" / "Overwrite" options (see REQ-10-13)
- Discard action: confirmation dialog (`DiscardDialog`) with localized title and Discard / Cancel buttons
- On discard confirm: local state reverts to last-saved server data via `resetLocalFromServer()`, dirty flag resets to false, orphan background image cleanup (if uploaded then discarded, `deleteFile` mutation called to delete the orphaned upload — see REQ-10-14)
- Auto-save is **OFF by default** (no debounce timer). May be enabled in a future plan as opt-in. When enabled in future, must respect single-flight guard.
- Auto-save indicator in header shows: "Saving...", "Saved", "Error", or hidden (idle) states — driven by `autoSaveStatus` store field

### REQ-10-08: Unsaved Changes Navigation Guard

**WHEN** the user attempts to navigate away from the editor with unsaved changes (dirty flag true), **THE SYSTEM SHALL** show a discard confirmation dialog.

**Acceptance Criteria**:
- Navigation guard triggers on: in-app route change (back button, sidebar nav, breadcrumb link) using `useGuardedNavigation` hook with `pendingNavigation` ref pattern
- Browser tab close: `beforeunload` event listener added (only active when dirty flag is true)
- `useGuardedNavigation` hook wraps Next.js `useRouter().push` and intercepts navigation when dirty; sets `pendingNavigation.current` to the target path; opens discard dialog
- Discard dialog: "You have unsaved changes. Discard and leave?" with Discard / Stay buttons (localized)
- "Discard" calls `resetLocalFromServer()`, clears dirty flag, allows navigation to pending path
- "Stay" cancels `pendingNavigation.current`, closes dialog, keeps editor open
- Guard does not trigger when dirty flag is false
- Guard is automatically bypassed when saving succeeds (dirty → false)

### REQ-10-09: Zustand Store — Template Editor State

**WHEN** the template editor is active, **THE SYSTEM SHALL** maintain a Zustand store for all mutable editor state.

**Acceptance Criteria**:
- Store name: `useCertTemplateEditorStore` (file: `frontend/common/stores/certTemplateEditorStore.ts`)
- Store state fields:
  - `templateId: string | null` — current template ID (UUID string)
  - `activeSection: EditorSection` — current active section (`basicInfo` | `dimensions` | `background` | `fontSettings`)
  - `localTemplate: TemplateFormData` — local editing state (name, description, categoryId, width, height, orientation, paperSize, backgroundImageUrl, backgroundColor, fontFamily, fontSize, textColor)
  - `serverTemplate: TemplateFormData` — last-saved server state (for diff/discard)
  - `dirty: boolean` — unsaved changes flag (computed by diffing local vs server)
  - `saving: boolean` — save in progress
  - `autoSaveStatus: AutoSaveStatus` — `idle` | `saving` | `saved` | `error`
  - `uploadingBackground: boolean` — background image upload in progress
  - `loading: boolean` — template query loading
  - `error: string | null` — template query/mutation error message
  - `version: number` — current template version (for optimistic locking)
- Store actions:
  - `initFromServer(template)` — initialize both `serverTemplate` and `localTemplate` from server data, set `version`, clear dirty/loading/error
  - `updateLocalField(field, value)` — update a single field in `localTemplate`, recompute dirty flag
  - `resetLocalFromServer()` — discard: copy `serverTemplate` to `localTemplate`, clear dirty
  - `commitServerFromLocal()` — save success: copy `localTemplate` to `serverTemplate`, increment `version`, clear dirty
  - `setTemplateId(id)` — set current template ID
  - `setActiveSection(section)` — switch active section
  - `setSaving(saving)` — set saving flag
  - `setAutoSaveStatus(status)` — set auto-save indicator
  - `setUploadingBackground(uploading)` — set upload-in-progress flag
  - `setLoading(loading)` — set loading flag
  - `setError(error)` — set/clear error message
  - `reset()` — reset entire store to initial state (used on unmount)
- Store is NOT persisted (in-memory only — no `persist` middleware)
- `File` / `Blob` objects are NOT stored in the store — kept in `useRef` in the ViewModel hook

### REQ-10-10: GraphQL Documents

**WHEN** the editor loads a template, **THE SYSTEM SHALL** fetch the template by ID with all editable fields. **WHEN** saving, **THE SYSTEM SHALL** call the update mutation.

**Acceptance Criteria**:
- `templateEditorQueryDocument` — fetches template by ID with fields: `id`, `name`, `description`, `categoryId`, `category { id name }`, `width`, `height`, `orientation`, `paperSize`, `backgroundImageUrl`, `backgroundColor`, `fontFamily`, `fontSize`, `textColor`, `status`, `version`, `createdAt`, `updatedAt`
- `updateTemplateEditorMutationDocument` — mutation accepting template ID and a partial update input (all editable fields optional except ID)
- Documents live in `frontend/common/graphql/sharedDocuments/certificates/templateEditor.documents.ts`
- Documents follow naming convention: `templateEditorQueryDocument`, `updateTemplateEditorMutationDocument`
- Include `id` field on all object types (Apollo cache normalization)
- Use `TypedDocumentNode<Operations.X, Types.QueryXArgs>` typing pattern
- Register in the `certificates/index.ts` barrel file
- Run `bun run generate:gqlSchema && bun codegen` after adding documents

### REQ-10-11: Live Dimension Preview

**WHEN** the Dimensions section is active, **THE SYSTEM SHALL** render a visual preview of the template's canvas dimensions.

**Acceptance Criteria**:
- Preview container: fixed-size `Box` (max 300px wide, 300px tall) centered in the form
- Preview rectangle: scaled to fit within container while preserving aspect ratio (width:height ratio)
- Preview rectangle border: `theme.palette.primary.main`, 2px dashed
- Preview rectangle background: `theme.palette.primaryContainer` (light fill)
- Dimension labels: width × height displayed below or inside the rectangle, using `Typography variant="labelMd"`
- Preview updates in real-time as width/height/orientation fields change
- If dimensions are 0 or invalid, preview shows a placeholder ("—" or "Invalid dimensions")
- Minimum preview size to avoid invisible rectangles for very narrow aspect ratios

### REQ-10-12: Background Image Upload Flow

**WHEN** the user selects a background image file, **THE SYSTEM SHALL** upload it and store the resulting signed URL.

**Acceptance Criteria**:
- File selection: drag-and-drop onto the upload area, or click to open native file picker
- Accepted types validated client-side before upload (MIME type check)
- File size validated client-side before upload (max size from template config)
- Upload triggers a storage mutation or API call (consumes Plan 7 storage service)
- Upload progress: linear progress bar or circular spinner in the upload area
- On success: signed URL stored in `localTemplate.backgroundImageUrl`, upload area replaced by thumbnail preview
- On failure: error message in upload area, file selection reset
- Remove button: clears `backgroundImageUrl` from local state, returns to upload area
- File object kept in `useRef` (not in Zustand store — non-serializable)

---

## 3a. Interaction State Requirements

### REQ-10-13: Loading & Error States

**WHEN** the template data is being fetched or fails to load, **THE SYSTEM SHALL** show appropriate loading or error UI.

**Acceptance Criteria**:
- Loading: skeleton placeholders for editor header (name, status badge) and form section content (3-4 input skeletons per section)
- Loading skeleton uses MUI `Skeleton` with `animation="wave"`
- Error (query failure): error message `Box` with localized `error.loadFailed` text and a Retry button
- Not found (template does not exist): centered "Template not found" message with a "Back to templates" button
- Permission denied (user lacks `CertificateTemplateManage`): renders read-only editor if user has `CertificateTemplateView`, otherwise a 403 page

### REQ-10-14: Saving & Conflict States

**WHEN** the user triggers a save and it succeeds or fails, **THE SYSTEM SHALL** show clear feedback.

**Acceptance Criteria**:
- Saving: save button shows `CircularProgress` spinner (size 20) and is disabled; auto-save indicator shows "Saving..."
- Success: snackbar with `save.success` message (auto-hides in 4s); auto-save indicator shows "Saved" for 3s then returns to idle
- Save error (network/server error): snackbar with `save.error` message, dirty flag remains true, auto-save indicator shows "Error"
- **Version conflict** (HTTP 409 from `expectedVersion` mismatch): conflict dialog appears with title `conflict.title`, body `conflict.message`, and two buttons:
  - "Reload" (`conflict.reload`): calls `initFromServer` with fresh server data, discards local changes
  - "Overwrite" (`conflict.overwrite`): retries save with `expectedVersion = null` (force overwrite, no optimistic lock)

### REQ-10-15: Orphan Background Image Cleanup

**WHEN** the user discards changes after uploading a background image, **THE SYSTEM SHALL** delete the orphaned upload to avoid storage waste.

**Acceptance Criteria**:
- If `localTemplate.backgroundImageUrl` differs from `serverTemplate.backgroundImageUrl` (i.e., a new upload was made), discard calls `deleteFile` mutation with the orphaned file URL
- `deleteFile` mutation is consumed from Plan 7 storage service
- Cleanup is fire-and-forget (failure logged but does not block discard)
- On save success, `serverTemplate.backgroundImageUrl` is updated, so no cleanup is needed
- Cleanup runs only on explicit discard, NOT on save-success or navigation-guard discard unless the user confirms discard

### REQ-10-16: Single-Flight Save Guard

**WHEN** a save is already in-flight, **THE SYSTEM SHALL** prevent concurrent save operations to avoid race conditions.

**Acceptance Criteria**:
- `saveInFlight` ref in ViewModel tracks whether a save is pending
- If `saveInFlight.current === true`, subsequent `handleSave` calls return early (no duplicate mutation)
- On save completion (success or failure), `saveInFlight.current` is reset to `false`
- This guard covers both manual save (button click) and future auto-save
- Store `saving` boolean is the UI-visible mirror of `saveInFlight` (for button disabled state)

### REQ-10-17: Explicit Mobile & Desktop Variants

**WHEN** the template editor is displayed on any device, **THE SYSTEM SHALL** render fully functional mobile and desktop views.

**Acceptance Criteria**:
- Desktop view (`templateEditor.desktop.tsx`): `Tabs` for section navigation, 2-column grid form layout, header with back/name/status/save/discard, sticky dimension preview to the right of dimensions form
- Mobile view (`templateEditor.mobile.tsx`): accordion sections via MUI `Accordion` (one open at a time driven by `activeSection` in store), single-column stacked form, bottom sticky bar with save/discard, simplified dimension preview above the dimensions form
- Both views share the same `ColorPickerField` component (mobile variant uses full-screen overlay instead of Popover), `DimensionPreview`, `BackgroundUploadZone`, and `DiscardDialog`
- `createLazyView()` + `ResponsiveViewSwitch` from `@/frontend/common/components/ui/container/` is used in the switcher to lazy-load views by tier
- Both views receive identical ViewModel props (RHF methods, store state, handlers) — only layout differs

---

## 2a. Cross-Role Access Matrix (Enhancement)

| Role | Editor Access | Read-Only Access | Save | Discard | Upload Background | View Published Only |
|------|--------------|------------------|------|---------|-------------------|---------------------|
| Superadmin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Supervisor | ✅ (owned templates) | ✅ | ✅ (owned) | ✅ (owned) | ✅ (owned) | ✅ |
| Teacher | ❌ | ✅ (owned templates) | ❌ | ❌ | ❌ | ✅ |
| Staff | ❌ | ✅ (assigned templates) | ❌ | ❌ | ❌ | ✅ |
| Parent | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Student | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Notes**:
- Supervisor/Teacher/Staff access scoped by `createdById` ownership on template (per INTER_PLAN_CONTRACTS.md §14)
- Parent/Student roles have no template editor access — certificate viewing only via public verification page (Plan 19)
- Read-only mode renders all form fields `disabled`, no Save/Discard buttons, no upload zone
- All roles must pass authentication (`getServerUserContext()`) before permission check

---

## 2b. Mobile-Specific Requirements (Enhancement)

**REQ-10-18: Mobile Touch Targets & Accessibility**

**WHEN** the template editor is rendered on mobile viewport (< 600px), **THE SYSTEM SHALL** meet WCAG 2.1 AA touch target and spacing requirements.

**Acceptance Criteria**:
- All interactive elements (buttons, inputs, accordion triggers) have minimum 48×48dp touch target size
- Accordion summaries have minimum 48dp height with adequate padding
- Form fields have minimum 48dp height (MUI `TextField` `size="small"` not used on mobile — use default)
- Bottom sticky action bar has minimum 56dp height
- Touch targets have minimum 8dp spacing between adjacent interactive elements
- No hover-only interactions — all functionality accessible via tap

**REQ-10-19: Mobile Keyboard Handling**

**WHEN** a form field receives focus on mobile, **THE SYSTEM SHALL** ensure the field is visible above the virtual keyboard.

**Acceptance Criteria**:
- `ScrollView` or `Box` with `overflow: auto` wraps form content to enable scroll-to-field
- On field focus, viewport scrolls to keep field and its label visible (React Hook Form `scrollErrors` + custom handler for mobile)
- Accordion section auto-expands when a field inside it receives focus via programmatic navigation
- Virtual keyboard does not obscure the active field or the bottom sticky action bar

**REQ-10-20: Mobile Background Upload**

**WHEN** the user uploads a background image on mobile, **THE SYSTEM SHALL** provide a touch-optimized upload flow.

**Acceptance Criteria**:
- Tap-to-select is the primary interaction (drag-and-drop is secondary/desktop-only)
- File picker opens native OS file chooser (via `<input type="file" capture="environment" accept="image/*">`)
- Image preview displayed at full width with aspect ratio preserved
- Remove button is touch-friendly (minimum 48×48dp hit area)
- Upload progress indicator visible during upload
- Error state shown with retry action

---

## 2c. Accessibility Requirements (WCAG 2.1 AA) (Enhancement)

**REQ-10-21: Semantic HTML & ARIA**

**WHEN** the template editor renders, **THE SYSTEM SHALL** use semantic HTML and proper ARIA attributes.

**Acceptance Criteria**:
- Page has `<main>` landmark with `aria-label="Template Editor"`
- Tab bar uses `role="tablist"`, tabs use `role="tab"`, panels use `role="tabpanel"` (MUI `Tabs` provides this)
- Mobile accordion uses `Accordion`/`AccordionSummary`/`AccordionDetails` (MUI provides proper ARIA)
- Form fields have associated `<label>` elements (MUI `TextField` `label` prop)
- Required fields have `aria-required="true"` (via RHF `required` validation)
- Error messages linked via `aria-describedby` pointing to error element (MUI `TextField` `error` + `helperText`)
- Status badge uses `role="status"` or `aria-live="polite"` for auto-save indicator changes
- Dialogs use `role="dialog"` with `aria-modal="true"` and `aria-labelledby`/`aria-describedby` (MUI `Dialog`)

**REQ-10-22: Keyboard Navigation**

**WHEN** the user navigates via keyboard, **THE SYSTEM SHALL** provide full keyboard operability.

**Acceptance Criteria**:
- Tab order: Back button → Tab/Accordion triggers → Form fields (top to bottom) → Save/Discard buttons
- `Enter`/`Space` activates buttons, toggles accordion, selects radio options
- `Escape` closes Discard Dialog, Conflict Dialog, Color Picker popover/modal
- `ArrowLeft`/`ArrowRight` navigate between tabs (desktop) and radio group options
- `ArrowUp`/`ArrowDown` navigate accordion items (mobile)
- Focus visible outline on all interactive elements (MUI default + theme `focusVisible` override)
- No keyboard traps — focus can always escape dialogs and popovers

**REQ-10-23: Color Contrast & Visual Indicators**

**WHEN** the template editor displays content, **THE SYSTEM SHALL** meet WCAG 2.1 AA contrast ratios.

**Acceptance Criteria**:
- Text and icons: minimum 4.5:1 contrast ratio against background (theme palette ensures this)
- Form field borders: minimum 3:1 contrast ratio (MUI outlined inputs)
- Focus indicators: minimum 3:1 contrast against adjacent colors
- Error states: red error text + icon (not color-only) — MUI `TextField` `error` provides this
- Required field indicator: asterisk (*) + "Required" in helper text (not color-only)
- Status badges: text label + color (Chip with label), not color-only

**REQ-10-24: Screen Reader Support**

**WHEN** a screen reader user accesses the editor, **THE SYSTEM SHALL** announce all relevant state changes.

**Acceptance Criteria**:
- Auto-save status changes announced via `aria-live="polite"` region
- Validation errors announced on field blur (RHF + MUI `error` + `helperText`)
- Save success/error announced via snackbar `aria-live="assertive"`
- Tab/accordion changes announced (MUI `Tabs`/`Accordion` handle this)
- File upload progress announced via `aria-live="polite"` in upload zone
- Discard/Conflict dialog title and message read on open

---

## 2d. i18n & RTL Requirements (Enhancement)

**REQ-10-25: RTL Layout Support**

**WHEN** the locale is Arabic (RTL), **THE SYSTEM SHALL** render the editor with correct RTL layout.

**Acceptance Criteria**:
- Page `dir="rtl"` applied at `html` level (Next.js `[locale]` routing + layout handles this)
- Tab bar: tabs flow right-to-left, active indicator animates RTL
- Accordion: summary icon (expand/collapse) on right side, content flows RTL
- Form fields: labels right-aligned, input text RTL, helper text RTL
- Grid layout: columns reverse order (md=6 fields swap sides)
- Dimension preview: width × height label uses `×` character (neutral), values LTR
- Color picker: hex value LTR, color swatch unaffected
- Back button: `ArrowBackOutlined` icon flips to `ArrowForwardOutlined` in RTL (MUI handles via `direction`)
- Save/Discard button order reversed (Discard left, Save right in RTL)
- Bottom sticky bar: button order reversed

**REQ-10-26: Arabic Font Rendering**

**WHEN** the template editor displays Arabic content, **THE SYSTEM SHALL** use appropriate Arabic fonts.

**Acceptance Criteria**:
- Font family select includes Arabic fonts (Cairo, Tajawal, Amiri) as first options
- Default font for Arabic locale: Cairo (set via locale-aware default in ViewModel)
- Font preview in select shows font name rendered in that font
- Text color picker works identically for Arabic and Latin text

**REQ-10-27: Number Formatting**

**WHEN** displaying numeric values in Arabic locale, **THE SYSTEM SHALL** use Arabic-Indic numerals where appropriate.

**Acceptance Criteria**:
- Dimension values (width/height) displayed with Arabic-Indic numerals in RTL: `٥٩٥ × ٨٤٢`
- Font size values displayed with Arabic-Indic numerals
- Character counters (e.g., description `١٥٠/٥٠٠`) use Arabic-Indic numerals
- Input fields accept both Arabic-Indic and Western numerals (HTML `type="number"` handles this)
- Hex color values always LTR Western numerals (`#FF5733`)

---

## 2e. Edge Cases & Error Scenarios (Enhancement)

**REQ-10-28: Empty State — New Template (Not Implemented in Plan 10)**

**WHEN** creating a new template (future Plan 8+), **THE SYSTEM SHALL** handle empty initial state.

**Acceptance Criteria**:
- Not applicable for Plan 10 (editor only opens existing template by ID)
- Future: blank form with defaults (A4 portrait, Cairo font, size 12, black text)

**REQ-10-29: Network Interruption During Save**

**WHEN** the network fails during a save mutation, **THE SYSTEM SHALL** preserve local changes and allow retry.

**Acceptance Criteria**:
- Dirty flag remains `true` (local changes not lost)
- Error snackbar with `save.error` message and "Retry" action
- Retry button calls `handleSave()` again with current `formData`
- Auto-save indicator shows `autoSave.error` state
- No automatic retry (user must explicitly retry)

**REQ-10-30: Concurrent Edit Detection**

**WHEN** another user modifies the same template, **THE SYSTEM SHALL** detect and handle the conflict on save.

**Acceptance Criteria**:
- Mutation includes `expectedVersion` from `serverTemplate.version`
- Backend returns 409 Conflict with localized `conflict` error code
- Frontend shows Conflict Dialog with "Reload" (refetch + discard local) and "Overwrite" (retry without version) options
- "Reload": calls `initFromServer()` with fresh data, clears dirty flag
- "Overwrite": retries mutation with `expectedVersion: null` (force write)

**REQ-10-31: Browser Tab Close / Hard Refresh**

**WHEN** the user closes the tab or hard-refreshes with unsaved changes, **THE SYSTEM SHALL** prompt via `beforeunload`.

**Acceptance Criteria**:
- `beforeunload` event listener registered when `dirty === true`
- Browser shows native confirmation dialog (cannot customize text)
- If user cancels: stays on page, changes preserved
- If user confirms: tab closes, changes lost (no server call possible)
- `beforeunload` removed when `dirty === false`

**REQ-10-32: Large File Upload Handling**

**WHEN** the user attempts to upload a file exceeding size limit, **THE SYSTEM SHALL** reject client-side before server call.

**Acceptance Criteria**:
- Max file size from `CERT_MAX_FILE_SIZE` (default 5MB)
- Client-side check on file selection: if `file.size > CERT_MAX_FILE_SIZE`, show `upload.fileTooLarge(maxSize)` error immediately
- No upload mutation called for oversized files
- Error displayed in upload zone with "Try again" prompt

**REQ-10-33: Invalid File Type Upload**

**WHEN** the user attempts to upload a non-image file, **THE SYSTEM SHALL** reject client-side.

**Acceptance Criteria**:
- Allowed types: `CERT_ALLOWED_FILE_TYPES` = `["image/png", "image/jpeg", "image/webp"]`
- Client-side check on file selection: if `file.type` not in allowed list, show `upload.invalidType` error immediately
- No upload mutation called for invalid types

**REQ-10-34: Orientation Swap Edge Cases**

**WHEN** the user toggles orientation with custom dimensions, **THE SYSTEM SHALL** swap width/height correctly.

**Acceptance Criteria**:
- Portrait → Landscape: `width` becomes old `height`, `height` becomes old `width`
- Landscape → Portrait: same swap
- If paper size is preset (A4/Letter), orientation toggle updates preset to match (A4 portrait 595×842 → A4 landscape 842×595)
- Dimension preview updates immediately on orientation change

---

## 3. i18n Requirements

### Translation Namespace

Namespace: `certificates.templateEditor` under `Translation.Dashboard.CertificateTemplateEditor`

### Type Schema (`shared/locale/types/dashboard/certificates/templateEditor.ts`)

| Key | Type | Description |
|-----|------|-------------|
| `pageTitle` | `string` | Page title (metadata) |
| `title` | `string` | Editor header title |
| `sections.basicInfo` | `string` | Tab/accordion label |
| `sections.dimensions` | `string` | Tab/accordion label |
| `sections.background` | `string` | Tab/accordion label |
| `sections.fontSettings` | `string` | Tab/accordion label |
| `fields.name` | `string` | Field label |
| `fields.namePlaceholder` | `string` | Placeholder |
| `fields.description` | `string` | Field label |
| `fields.descriptionPlaceholder` | `string` | Placeholder |
| `fields.category` | `string` | Field label |
| `fields.categoryPlaceholder` | `string` | Placeholder |
| `fields.width` | `string` | Field label |
| `fields.height` | `string` | Field label |
| `fields.orientation` | `string` | Field label |
| `fields.paperSize` | `string` | Field label |
| `fields.backgroundImage` | `string` | Field label |
| `fields.backgroundColor` | `string` | Field label |
| `fields.fontFamily` | `string` | Field label |
| `fields.fontSize` | `string` | Field label |
| `fields.textColor` | `string` | Field label |
| `orientation.portrait` | `string` | Radio/option label |
| `orientation.landscape` | `string` | Radio/option label |
| `paperSize.a4` | `string` | Option label |
| `paperSize.letter` | `string` | Option label |
| `paperSize.custom` | `string` | Option label |
| `buttons.save` | `string` | Save button |
| `buttons.discard` | `string` | Discard button |
| `buttons.removeImage` | `string` | Remove background image |
| `buttons.uploadImage` | `string` | Upload prompt text |
| `status.draft` | `string` | Status badge (Draft) |
| `status.published` | `string` | Status badge (Published) |
| `status.archived` | `string` | Status badge (Archived) |
| `unsavedIndicator` | `string` | Unsaved changes indicator text |
| `autoSave.saving` | `string` | Auto-save: saving |
| `autoSave.saved` | `string` | Auto-save: saved |
| `autoSave.error` | `string` | Auto-save: error |
| `preview.dimensions` | `(width: number, height: number) => string` | Preview label |
| `preview.noDimensions` | `string` | Placeholder when no dims |
| `upload.dragDrop` | `string` | Drag-and-drop prompt |
| `upload.orClick` | `string` | "or click to browse" |
| `upload.uploading` | `string` | Upload in progress |
| `upload.fileTooLarge` | `(maxSize: string) => string` | File too large error |
| `upload.invalidType` | `string` | Invalid file type |
| `upload.uploadFailed` | `string` | Upload error message |
| `save.success` | `string` | Save success snackbar |
| `save.error` | `string` | Save error snackbar |
| `discard.title` | `string` | Discard dialog title |
| `discard.message` | `string` | Discard dialog body |
| `discard.confirm` | `string` | Discard button (dialog) |
| `discard.cancel` | `string` | Stay / cancel button |
| `navGuard.title` | `string` | Navigation guard title |
| `navGuard.message` | `string` | Navigation guard body |
| `navGuard.discard` | `string` | Discard & leave button |
| `navGuard.stay` | `string` | Stay button |
| `validation.nameRequired` | `string` | Name required error |
| `validation.nameTooLong` | `(max: number) => string` | Name too long |
| `validation.descriptionTooLong` | `(max: number) => string` | Description too long (500 chars) |
| `validation.widthRequired` | `string` | Width required |
| `validation.heightRequired` | `string` | Height required |
| `validation.dimensionsPositive` | `string` | Dimensions must be positive |
| `validation.dimensionsRange` | `(min: number, max: number) => string` | Dim range error |
| `validation.fontSizeRange` | `(min: number, max: number) => string` | Font size range |
| `validation.invalidColor` | `string` | Invalid hex color |
| `validation.orientationRequired` | `string` | Orientation required |
| `error.loadFailed` | `string` | Template load failed error |
| `error.notFound` | `string` | Template not found message |
| `error.permissionDenied` | `string` | No permission to edit |
| `conflict.title` | `string` | Version conflict dialog title |
| `conflict.message` | `string` | Version conflict body |
| `conflict.reload` | `string` | Reload button (conflict dialog) |
| `conflict.overwrite` | `string` | Overwrite button (conflict dialog) |
| `buttons.retry` | `string` | Retry button |
| `buttons.backToList` | `string` | Back to templates list |
| `autoSave.idle` | `string` | Auto-save idle (hidden/empty) |

### Namespace Handle

- Handle: `Translation.Dashboard.CertificateTemplateEditor`
- Namespace ID: `"dashboard.certificateTemplateEditor"`
- AR loader: `() => import("@/shared/locale/ar/dashboard/certificates/templateEditor").then(m => m.dashboardCertificateTemplateEditorAr)`
- EN loader: `() => import("@/shared/locale/en/dashboard/certificates/templateEditor").then(m => m.dashboardCertificateTemplateEditorEn)`

### Pluralization

No pluralization needed for this plan — all labels are singular strings or interpolation functions.

### Interpolation Functions

- `preview.dimensions(width, height)` — e.g., EN: `"${width} × ${height} px"`, AR: `"${width} × ${height} بكسل"`
- `upload.fileTooLarge(maxSize)` — e.g., EN: `"File exceeds maximum size (${maxSize})"`, AR: `"حجم الملف يتجاوز الحد الأقصى (${maxSize})"`
- `validation.nameTooLong(max)` — e.g., EN: `"Name must be ${max} characters or less"`, AR: `"يجب أن لا يتجاوز الاسم ${max} حرفًا"`
- `validation.dimensionsRange(min, max)` — e.g., EN: `"Dimensions must be between ${min} and ${max} pixels"`, AR: `"يجب أن تكون الأبعاد بين ${min} و${max} بكسل"`
- `validation.fontSizeRange(min, max)` — e.g., EN: `"Font size must be between ${min} and ${max}"`, AR: `"حجم الخط يجب أن يكون بين ${min} و${max}"`
- `validation.descriptionTooLong(max)` — e.g., EN: `"Description must be ${max} characters or less"`, AR: `"يجب أن لا يتجاوز الوصف ${max} حرفًا"`

---

## 4. Form Field Specifications

### Basic Info Section

| Field | Component | Type | Required | Validation | i18n Key |
|-------|-----------|------|----------|------------|----------|
| Template Name | `TextField` + RHF `register('name')` | string | Yes | non-empty after trim, ≤255 chars | `fields.name` |
| Description | `TextField` (multiline, 4 rows) + RHF `register('description')` | string | No | ≤500 chars | `fields.description` |
| Category | `Autocomplete` + RHF `Controller` | string (nullable categoryId) | No | must be valid category ID if provided | `fields.category` |

### Dimensions Section

| Field | Component | Type | Required | Validation | i18n Key |
|-------|-----------|------|----------|------------|----------|
| Paper Size | `Select` / `ToggleButtonGroup` | enum: `A4` \| `Letter` \| `Custom` | Yes | must be valid enum | `fields.paperSize` |
| Width (px) | `TextField` (numeric) | number | Yes | integer 100-10000 | `fields.width` |
| Height (px) | `TextField` (numeric) | number | Yes | integer 100-10000 | `fields.height` |
| Orientation | `RadioGroup` / `ToggleButtonGroup` | enum: `portrait` \| `landscape` | Yes | must be valid enum | `fields.orientation` |

### Background Section

| Field | Component | Type | Required | Validation | i18n Key |
|-------|-----------|------|----------|------------|----------|
| Background Image | Drop zone / File picker | string (URL) | No | image MIME type, max size | `fields.backgroundImage` |
| Background Color | `ColorPickerField` (react-color + Popover + hex TextField) | string (hex) | No | valid hex `#RRGGBB` | `fields.backgroundColor` |

### Font Settings Section

| Field | Component | Type | Required | Validation | i18n Key |
|-------|-----------|------|----------|------------|----------|
| Font Family | `Select` (options from `CERT_ALLOWED_FONTS`) | string (font name) | No | from `CERT_ALLOWED_FONTS` list | `fields.fontFamily` |
| Default Font Size | `TextField` (numeric) + RHF `register('fontSize')` | number | Yes | integer 8-72 | `fields.fontSize` |
| Default Text Color | `ColorPickerField` (react-color + Popover + hex TextField) | string (hex) | No | valid hex `#RRGGBB` | `fields.textColor` |

---

## 5. Permission Requirements

| Permission | Usage |
|------------|-------|
| `CertificateTemplateManage` (`certificates.templates.manage`) | Required to access the editor page, save changes, upload background image |
| `CertificateTemplateView` (`certificates.templates.view`) | Read-only fallback — renders editor with all form fields disabled, no save/discard buttons, no upload |

---

## 6. Outcome Knowledge Base & Progress Tracking

### Knowledge Artifacts Produced

| Artifact | Location | Description |
|----------|----------|-------------|
| Template editor form patterns | `docs/certificates/template-editor-forms.md` | Form layout, section organization, dirty-state management patterns for future editor plans (11-15) |
| Background upload flow | `docs/certificates/background-upload-flow.md` | File upload → signed URL pattern for reuse in Plan 17 (certificate generation dialog) |
| Live preview pattern | `docs/certificates/live-dimension-preview.md` | Aspect-ratio preview component pattern for reuse in Plan 11 (visual canvas) |

### Progress Tracking

| Milestone | Status Field | Verification |
|-----------|---------------|-------------|
| Page guard + container | `plan10_page_guard` | Page renders with permission check |
| Editor shell + tabs | `plan10_editor_shell` | Tab/accordion navigation works |
| Form sections | `plan10_forms` | All 4 sections render and validate |
| Save/discard | `plan10_save_discard` | Save mutation works, discard reverts |
| Navigation guard | `plan10_nav_guard` | Discard dialog on navigate with dirty state |
| Live preview | `plan10_preview` | Dimension preview shows correct aspect ratio |
| Background upload | `plan10_upload` | File upload → signed URL → preview |
| Zustand store | `plan10_store` | State persists across tier switch |
| i18n | `plan10_i18n` | All labels in AR and EN |

---

## 7. Acceptance Criteria — Feature Level

1. User with `CertificateTemplateManage` permission can navigate to `/certificates/templates/[templateId]` and see the editor
2. User without permission is redirected/forbidden; user with `CertificateTemplateView` only sees read-only editor
3. All four sections (Basic Info, Dimensions, Background, Font Settings) render with correct form fields validated via react-hook-form + Zod
4. Changing any field sets the dirty indicator (deep-diff between `localTemplate` and `serverTemplate`)
5. Save persists changes to the server with `expectedVersion` optimistic lock and clears the dirty indicator
6. Discard reverts local state to last-saved server state via `resetLocalFromServer()`
7. Navigating away with unsaved changes shows the discard dialog (`pendingNavigation` pattern for SPA, `beforeunload` for tab close)
8. Live dimension preview updates as dimensions/orientation change, scaled to fit container preserving aspect ratio
9. Background image upload produces a signed URL, shows a thumbnail, and orphan cleanup on discard
10. Validation errors display below fields with localized messages from Zod schema error mapping via `zodResolver`
11. All labels, placeholders, and messages appear in both Arabic and English via `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)`
12. Desktop presentation renders tab navigation with 2-column grid form layout, save/discard in editor header
13. Mobile presentation renders accordion sections (one open at a time), stacked single-column fields, save/discard in bottom sticky bar
14. ColorPickerField component (react-color + MUI Popover + hex TextField) used for both background and text color on desktop; mobile uses full-screen overlay variant
15. Single-flight save guard prevents concurrent save operations (auto-save and manual save)
16. Version conflict (409) shows conflict dialog with "Reload" (discard local, refetch) and "Overwrite" (retry without version guard) options
17. Skeleton loading state, error state with retry button, not-found state, and permission-denied state all render correctly
