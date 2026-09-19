# Requirements — Plan 12: Template Editor — Element Management

| Field | Value |
|---|---|
| **Plan #** | 12 |
| **Feature** | Template Editor — Element Management |
| **Depends On** | Plan 5 (GraphQL API), Plan 11 (Visual Canvas) |
| **Stakeholders** | Admin (template designer), Teachers (template viewers) |
| **Related Docs** | `MASTER_ARCHITECTURE.md`, `cgvs_analysis/01-generation-logic.md` §4, `cgvs_analysis/04-template-ui.md` §2, `siraj_analysis/05-frontend-patterns.md` |

---

## 1. Introduction

### Overview

This plan defines the **element management layer** of the template editor — the CRUD operations, property panel, layer panel, and mobile element editor that allow an admin to compose certificate templates from individual elements (static text, data text, data date, image, QR code, shape). It builds on the visual canvas from Plan 11 (drag/position/selection) by providing the forms and mutations to create, edit, duplicate, delete, and reorder those elements.

### Business Value

Without element management, the canvas from Plan 11 can display and position elements but cannot create new ones or modify their type-specific properties. This plan enables the full template-design workflow: adding text/logo/QR/shape elements, configuring their visual properties, binding them to template variables, and managing layer ordering — all validated against the template's dimensions and variable definitions.

### Scope

| In Scope | Out of Scope |
|---|---|
| Element CRUD mutations (create, update, delete, duplicate) | PDF rendering of elements (Plan 6) |
| Element reorder (z-index bring forward/backward, drag-reorder via @dnd-kit) | Drag-and-drop canvas (Plan 11) |
| Copy/paste elements (Ctrl+C/Ctrl+V, clipboard in Zustand) | Template variable CRUD (Plan 13) |
| Property panel — common properties (position, size, rotation, z-index, opacity) | Image upload to storage (Plan 7) |
| Property panel — per-type properties (static_text, data_text, data_date, image, qr_code, shape) | Template meta/dimensions (Plan 10) |
| Color picker (react-color ChromePicker in MUI Popover with hex TextField) | Recipient groups (Plan 14) |
| Font picker (MUI Autocomplete with font preview) | Certificate generation (Plan 17) |
| Image file upload (file picker + drag-and-drop, Plan 7 storage integration) | Template preview/publish (Plan 15) |
| Layer panel (desktop sidebar — @dnd-kit/sortable, visibility toggle, lock toggle, drag reorder) | |
| Element context menu (desktop, right-click: z-order, duplicate, copy/paste, delete) | |
| Multi-select property panel (batch delete, batch lock) | |
| Mobile element editor (list + full-screen dialog, mini-canvas thumbnail, no canvas) | |
| Form validation (bounds, size > 0, text not empty, variable ref valid, rotation 0–360) | |
| Optimistic locking (expectedTemplateVersion on all mutations) | |
| i18n keys for all property labels, element type names, validation messages, context menu items, dialog messages | |
| Zustand store for element editor state (draftProperties, clipboard, panel state, dialog state) | |
| Accessibility: keyboard reorder, dialog focus traps, labeled inputs, screen reader announcements | |

---

## 2. Requirements

### REQ-12.1 — Element Creation

**WHEN** the admin clicks the "Add Element" button in the canvas toolbar, **THE SYSTEM SHALL** display a dropdown menu of element types (Static Text, Data Text, Data Date, Image, QR Code, Shape).

**WHEN** the admin selects an element type from the dropdown, **THEN** the system SHALL create a new element record of that type with: default position (center of template), default size per type, z-index = current max + 1, and type-appropriate default property values, **AND** shall select the new element on the canvas and open the property panel.

**Acceptance Criteria:**
- New element appears on canvas immediately after creation (optimistic update)
- Property panel opens and shows the newly created element's properties
- Element type is persisted to the database via GraphQL mutation
- `certificates.templates.manage` permission checked on mutation (single canonical permission)
- On desktop: "Add Element" `Button` → MUI `Menu` with 6 type options (icon + translated label)
- On mobile: "Add Element" FAB → `AddElementBottomSheet` (MUI `BottomSheet`) with 6 type options
- New element is positioned at template center (x = templateWidth/2 - defaultWidth/2, y = templateHeight/2 - defaultHeight/2)
- Default dimensions per type: static_text (200×40), data_text (200×40), data_date (150×40), image (150×150), qr_code (128×128), shape (100×100)
- New element gets highest z-index (max existing z-index + 1)
- New element is auto-selected (`setSelectedIds([newElementId])`) → property panel immediately populated
- `isDirty` is false initially (element was just created with valid defaults)
- Creation mutation includes `expectedTemplateVersion` for optimistic locking
- If template is in "published" state, creation is blocked with error toast
- If no permission, "Add Element" button is hidden (not just disabled)

---

### REQ-12.2 — Element Update

**WHEN** the admin modifies a property in the property panel for the selected element, **THEN** the system SHALL update the element draft state in the Zustand store and mark the form as dirty.

**WHEN** the admin clicks the "Save" button on a dirty element form, **THEN** the system SHALL validate the form, and if valid, persist the changes via GraphQL mutation, show a success toast, and mark the form as clean.

**WHEN** the admin modifies properties on the canvas (drag, resize, rotate — from Plan 11), **THEN** the system SHALL sync those values into the property panel form fields and mark the form dirty.

**Acceptance Criteria:**
- All common and type-specific properties are saved in a single mutation
- Form dirty state tracked; unsaved changes warning when navigating away
- `certificates.templates.manage` permission checked on mutation (single canonical permission)
- Semantic error messages via i18n keys (not raw GraphQL errors)
- Canvas↔panel sync: common props (X/Y/W/H/rotation) READ from canvas store; type-specific + opacity live in draftProperties
- During active canvas drag/resize: PositionSizeInputs show "Dragging..." placeholder until `pointerup` (re-render throttling)
- Save button: `disabled={!isDirty || isSaving}`; shows `CircularProgress` when `isSaving`
- Discard button: visible only when `isDirty`; resets draft to persisted values
- When selecting a different element with dirty draft: "Unsaved changes" dialog with 3 options (Save, Discard, Cancel)
- Update mutation includes `expectedTemplateVersion` for optimistic locking
- If optimistic lock fails (version mismatch): error toast "Template modified by another user. Please refresh."
- Locked element: all form inputs `disabled` + banner "This element is locked"
- No-permission state: all input fields `disabled`, Save/Delete buttons hidden

---

### REQ-12.3 — Element Deletion

**WHEN** the admin selects an element and clicks the "Delete" button (or context menu item), **THEN** the system SHALL show a confirmation dialog, and upon confirmation, SHALL delete the element and its type-specific sub-record from the database, remove it from the canvas, and clear the property panel.

**Acceptance Criteria:**
- Confirmation dialog with element type name and a preview of content (first 30 chars of text or "Image"/"QR Code"/"Shape")
- Confirmation dialog uses interpolation: "Are you sure you want to delete this {elementType}?"
- Element removed from canvas immediately after deletion (optimistic update via Apollo cache eviction)
- If the deleted element was selected, property panel closes and selection clears
- `certificates.templates.manage` permission checked on mutation (single canonical permission)
- Delete via keyboard: `Delete` key opens confirmation dialog (not instant delete)
- Delete via context menu: right-click on canvas element → "Delete" (red text) → confirmation dialog
- On mobile: Delete button in edit dialog footer (outline variant, full width) → confirmation dialog
- Delete mutation includes `expectedTemplateVersion` for optimistic locking
- After deletion: remaining elements' z-indices are NOT renormalized (only batch reorder renormalizes)
- Snack bar announcement: "Element deleted" (i18n key)

---

### REQ-12.4 — Element Duplication & Copy/Paste

**WHEN** the admin selects an element and clicks the "Duplicate" button (or context menu item, or Ctrl+D), **THEN** the system SHALL create a new element of the same type with all properties cloned, position offset by +20px on both x and y axes, z-index = current max + 1, and shall select the duplicated element on the canvas.

**WHEN** the admin presses Ctrl+C on a selected element, **THEN** the system SHALL copy the element's properties to an internal clipboard (Zustand store, NOT OS clipboard).

**WHEN** the admin presses Ctrl+V and the clipboard has an element, **THEN** the system SHALL create a new element from the clipboard entry with position offset by +20px from the original (or +20px from last paste if sequential pastes), z-index = current max + 1, and select the new element.

**Acceptance Criteria:**
- Duplicated element is identical to original except position and z-index
- Duplicate appears on canvas and is auto-selected
- Type-specific sub-record is also duplicated (e.g., static text content is copied)
- `certificates.templates.manage` permission checked on mutation (single canonical permission)
- Ctrl+D: keyboard shortcut for duplicate (desktop only)
- Ctrl+C: keyboard shortcut for copy (desktop only; stores in Zustand clipboard, not OS clipboard)
- Ctrl+V: keyboard shortcut for paste (desktop only; disabled if clipboard empty)
- Context menu "Copy" and "Paste" items: Paste is disabled (grayed) when clipboard is empty
- Copy/paste/duplicate are NOT available on mobile (no keyboard shortcuts, no context menu)
- Duplicate mutation: `duplicateTemplateElement` GraphQL mutation
- Paste: uses `createTemplateElement` mutation with clipboard properties

---

### REQ-12.5 — Element Reorder (Z-Index)

**WHEN** the admin selects an element and clicks "Bring Forward" or "Send Backward" in the context menu or layer panel, **THEN** the system SHALL swap the z-index of the selected element with the adjacent element in the z-order, persist via mutation, and update the layer panel ordering.

**WHEN** the admin drags an element in the layer panel to a new position, **THEN** the system SHALL persist the new z-index ordering for all affected elements via a batch reorder mutation.

**Acceptance Criteria:**
- Z-index changes reflect immediately on canvas render order
- Layer panel reorders after z-index change
- Batch reorder mutation handles N elements atomically
- `certificates.templates.manage` permission checked on mutation (single canonical permission)
- Layer panel uses `@dnd-kit/sortable` (v10.0.0) with `SortableContext` and `verticalListSortingStrategy`
- Sensors: `PointerSensor` with `activationConstraint: { distance: 8 }` (prevents accidental drag on click) + `KeyboardSensor` with `sortableKeyboardCoordinates` (keyboard reorder)
- Collision detection: `closestCenter`
- Drag end handler calls `arrayMove` from `@dnd-kit/sortable` and fires `reorderTemplateElementsMutationDocument`
- Z-indices are renormalized to dense `0..N` after batch reorder (no gaps)
- `DragOverlay` renders translucent copy of dragged layer item; original item opacity 0.5 during drag
- Keyboard reorder in layer panel: `Tab` to focus, `Space` to pick up, `ArrowUp`/`ArrowDown` to move, `Space` to drop
- Z-order operations via context menu: "Bring Forward" (Ctrl+]), "Send Backward" (Ctrl+[), "Bring to Front", "Send to Back"
- On mobile: up/down `IconButton`s on each list row swap z-index with adjacent element (no drag reorder)
- Batch reorder mutation includes `expectedTemplateVersion` for optimistic locking

---

### REQ-12.6 — Common Properties Panel (All Element Types)

**THE SYSTEM SHALL** render a common properties section in the right sidebar for every element type, containing:

| Property | Input Type | Validation |
|---|---|---|
| Position X | Number input (px) | Within template bounds: 0 ≤ X ≤ templateWidth |
| Position Y | Number input (px) | Within template bounds: 0 ≤ Y ≤ templateHeight |
| Width | Number input (px) | > 0 |
| Height | Number input (px) | > 0 |
| Rotation | Number input (degrees) | 0 to 360 |
| Z-Index | Number input (read-only display, managed via reorder) | Integer ≥ 0 |
| Opacity | Slider (0–100) | 0 ≤ opacity ≤ 100 |

**WHEN** any common property is modified, **THEN** the canvas shall reflect the change in real time (live preview on the canvas element).

**Acceptance Criteria:**
- Position inputs bounded by template dimensions from Plan 10
- Invalid values show inline validation error messages
- Z-Index field is display-only; changes only via reorder operations
- Opacity slider updates element transparency live on canvas
- Desktop property panel renders 4 collapsible `Accordion` sections: Position, Content, Appearance, Advanced
- Position section (expanded by default): `PositionSizeInputs` (X, Y, width, height, rotation) + z-index display (read-only) + `OpacitySlider`
- Appearance section (collapsed by default): color fields + visibility toggle + lock toggle
- Advanced section (collapsed by default): element ID display + created/updated timestamps + z-index + hidden/locked toggles
- No element selected: empty state with `MouseOutlined` icon + "Select an element to edit its properties" text
- Locked element selected: all form inputs `disabled` + banner "This element is locked"
- No permission: all inputs `disabled`, Save/Delete buttons hidden
- Re-render throttling: during canvas drag/resize, PositionSizeInputs show "Dragging..." placeholder until pointerup

---

### REQ-12.7 — Static Text Element Properties

**THE SYSTEM SHALL** render the following type-specific properties for elements of type `static_text`:

| Property | Input Type | Validation | i18n Key |
|---|---|---|---|
| Text Content | Multiline text field | Not empty, max 1000 chars | `properties.textContent` |
| Font Family | Dropdown (system fonts + Arabic fonts) | One of allowed font list | `properties.fontFamily` |
| Font Size | Number input (px) | 1–200 | `properties.fontSize` |
| Font Weight | Dropdown (normal, medium, bold) | One of enum | `properties.fontWeight` |
| Text Color | Color picker (hex) | Valid hex color | `properties.textColor` |
| Text Alignment | Button group (left, center, right) | One of enum | `properties.textAlign` |
| Line Height | Number input (unitless multiplier) | 0.5–3.0 | `properties.lineHeight` |

**Acceptance Criteria:**
- Text content is required; empty content shows validation error
- Font family dropdown includes Arabic-capable fonts (Amiri, Cairo) when template locale is `ar`
- Color picker outputs hex string (e.g., "#FF0000")
- Changes preview live on canvas

---

### REQ-12.8 — Data Text Element Properties

**THE SYSTEM SHALL** render the following type-specific properties for elements of type `data_text`:

| Property | Input Type | Validation | i18n Key |
|---|---|---|---|
| Variable Reference | Dropdown of template variables (from Plan 13) filtered to type text/number | Must reference an existing variable | `properties.variableId` |
| Font Family | Dropdown (same as static text) | One of allowed font list | `properties.fontFamily` |
| Font Size | Number input (px) | 1–200 | `properties.fontSize` |
| Text Color | Color picker (hex) | Valid hex color | `properties.textColor` |
| Text Alignment | Button group (left, center, right) | One of enum | `properties.textAlign` |
| Text Transform | Dropdown (none, uppercase, lowercase) | One of enum | `properties.textTransform` |

**Acceptance Criteria:**
- Variable dropdown is populated from the template's variable list (Plan 13 dependency)
- If no variables exist, dropdown shows placeholder "No variables defined — create variables first"
- Variable reference is required; selecting "none" shows validation error
- Preview shows the variable's `previewValue` instead of the variable name on the canvas

---

### REQ-12.9 — Data Date Element Properties

**THE SYSTEM SHALL** render the following type-specific properties for elements of type `data_date`:

| Property | Input Type | Validation | i18n Key |
|---|---|---|---|
| Variable Reference | Dropdown of template variables filtered to type date | Must reference an existing date variable | `properties.variableId` |
| Date Format | Dropdown (ISO: YYYY-MM-DD, Arabic: DD MMMM YYYY, Custom) | One of preset or custom pattern | `properties.dateFormat` |
| Custom Format | Text field (shown when format = custom) | Valid date format pattern | `properties.customFormat` |
| Locale | Dropdown (ar, en) | One of enum | `properties.locale` |
| Font Family | Dropdown (same as static text) | One of allowed font list | `properties.fontFamily` |
| Font Size | Number input (px) | 1–200 | `properties.fontSize` |
| Text Color | Color picker (hex) | Valid hex color | `properties.textColor` |

**Acceptance Criteria:**
- Date format dropdown includes presets: "YYYY-MM-DD" (ISO), "DD MMMM YYYY" (Arabic full month), "DD/MM/YYYY" (numeric)
- Custom format field accepts Unicode date format tokens
- Preview renders the variable's previewValue formatted with the selected format and locale
- Arabic month names used when locale = "ar"

---

### REQ-12.10 — Image Element Properties

**THE SYSTEM SHALL** render the following type-specific properties for elements of type `image`:

| Property | Input Type | Validation | i18n Key |
|---|---|---|---|
| Image Source URL | Text input (URL) + "Browse" button (opens storage picker from Plan 7) | Valid URL, max 500 chars | `properties.imageUrl` |
| Alt Text | Text input | Max 200 chars | `properties.altText` |
| Fit Mode | Dropdown (contain, cover, fill) | One of enum | `properties.fitMode` |
| Border Radius | Number input (px) | 0–100 | `properties.borderRadius` |

**Acceptance Criteria:**
- "Browse" button opens the storage file picker (Plan 7) to select an uploaded image
- Image URL field can also accept a manually entered URL
- Alt text is optional but recommended for accessibility
- Fit mode controls how the image fills its bounding box (CSS object-fit equivalents)
- Border radius applies rounded corners to the image element

---

### REQ-12.11 — QR Code Element Properties

**THE SYSTEM SHALL** render the following type-specific properties for elements of type `qr_code`:

| Property | Input Type | Validation | i18n Key |
|---|---|---|---|
| Data Source | Dropdown (verification URL, custom text) | One of enum | `properties.qrDataSource` |
| Custom Text | Text field (shown when data source = custom text) | Not empty when custom; max 500 chars | `properties.qrCustomText` |
| Size | Number input (px) | 32–512 | `properties.qrSize` |
| Error Correction Level | Dropdown (L, M, Q, H) | One of enum | `properties.qrErrorCorrection` |
| Margin | Number input (px) | 0–50 | `properties.qrMargin` |

**Acceptance Criteria:**
- When data source = "verification URL", the QR code will encode the verification URL pattern at render time (Plan 6 determines the final URL)
- When data source = "custom text", the custom text field is required
- Size controls both width and height (QR codes are always square)
- Error correction level dropdown shows descriptive labels: "Low (7%)", "Medium (15%)", "Quartile (25%)", "High (30%)"
- Preview renders a QR code placeholder on canvas

---

### REQ-12.12 — Shape Element Properties (Siraj Extension)

**THE SYSTEM SHALL** render the following type-specific properties for elements of type `shape`:

| Property | Input Type | Validation | i18n Key |
|---|---|---|---|
| Shape Type | Dropdown (rectangle, circle, line) | One of enum | `properties.shapeType` |
| Fill Color | Color picker (hex) | Valid hex color | `properties.fillColor` |
| Border Color | Color picker (hex) | Valid hex color | `properties.borderColor` |
| Border Width | Number input (px) | 0–20 | `properties.borderWidth` |
| Border Style | Dropdown (solid, dashed, dotted, none) | One of enum | `properties.borderStyle` |

**Acceptance Criteria:**
- Shape type dropdown changes the canvas rendering (rectangle = full box, circle = ellipse, line = stroke from top-left to bottom-right corner)
- Fill color disabled (not applicable) when shape type = "line"
- Border style "none" hides border rendering on canvas
- This element type is a Siraj extension beyond CGVS original 5 types

---

### REQ-12.13 — Element Type Form Switching

**WHEN** the selected element changes (via canvas click or layer panel click), **THEN** the property panel SHALL switch to the newly selected element's type-specific form within one render cycle.

**WHEN** the admin creates a new element of a different type while another element's properties are open and dirty, **THEN** the system SHALL show an unsaved changes warning dialog before switching.

**Acceptance Criteria:**
- Property panel form switches without flicker when element selection changes
- Type-specific fields render dynamically based on `element.type` enum value
- Dirty-state dialog appears when switching away from unsaved element
- Common properties section (position, size, etc.) is always visible regardless of element type
- "Content" section title changes per element type (e.g., "Text Content" for static_text, "Image" for image)
- Selecting a different element clears all validation errors (fresh form)
- Type-specific form dispatched via `TypeSpecificFormDispatcher` (switch on `element.type`)
- `TypeSpecificFormDispatcher` imports and renders: `StaticTextPropertiesForm`, `DataTextPropertiesForm`, `DataDatePropertiesForm`, `ImagePropertiesForm`, `QrCodePropertiesForm`, `ShapePropertiesForm`

---

### REQ-12.14 — Layer Panel (Desktop)

**THE SYSTEM SHALL** render a layer panel in the left sidebar of the desktop editor showing all elements sorted by z-index (topmost element at top of list), with each row displaying:

| Element | Type | Behavior |
|---|---|---|
| Visibility toggle (eye icon) | IconButton | Toggles `hidden` flag on element; hidden elements are not rendered on canvas or in PDF |
| Lock toggle (lock icon) | IconButton | Toggles `locked` flag; locked elements cannot be moved/resized on canvas |
| Element type icon | Icon | Shows type-specific icon (text/image/qr/shape) |
| Element label | Typography | Shows static text content (first 30 chars) or variable ref name or "Image"/"QR Code"/"Shape" |
| Drag handle | Icon | Allows drag to reorder z-index |

**WHEN** the admin clicks a row in the layer panel, **THEN** the system SHALL select that element on the canvas and show its properties in the property panel.

**Acceptance Criteria:**
- Layer panel syncs with canvas selection (selecting on canvas highlights layer panel row and vice versa)
- Drag reorder in layer panel triggers batch reorder mutation via `@dnd-kit/sortable`
- Visibility toggle hides element from canvas immediately
- Lock toggle prevents drag/resize on canvas (Plan 11 interaction)
- Empty state shows "No elements — add one to get started" message (i18n key `layerPanel.empty`)
- `DndContext` + `SortableContext` with `verticalListSortingStrategy` wraps items
- `PointerSensor` with distance 8px activation constraint (prevents accidental drag on click-to-select)
- `KeyboardSensor` with `sortableKeyboardCoordinates` for keyboard reorder
- `DragOverlay` renders translucent copy of dragged item; original item opacity 0.5
- Drag handle uses `DragIndicatorOutlined` icon with `listeners` from `useSortable`
- Element type icons: `TextFieldsOutlined` (text), `DataObjectOutlined` (data_text), `CalendarMonthOutlined` (data_date), `ImageOutlined` (image), `QrCode2Outlined` (qr_code), `CropDinOutlined` (shape)
- Selected row: `backgroundColor: theme.palette.action.selected`, `borderLeft: 3px solid theme.palette.primary.main`
- Unselected row: `borderLeft: 3px solid transparent`
- Layer panel header: "Layers" label + collapse toggle button
- Collapsed state: panel narrows to thin sidebar showing only collapse toggle button
- Layer panel does NOT require react-virtualized (typical element count < 50)

---

### REQ-12.15 — Mobile Element Editor

**THE SYSTEM SHALL** render a mobile-optimized element editor that replaces the visual canvas with a list-based interface:

| Component | Description |
|---|---|
| Element list view | Scrollable list of all elements sorted by z-index, each row showing type icon, label, up/down reorder buttons, and a chevron icon |
| Add element FAB | Floating action button with element type selection bottom sheet (`AddElementBottomSheet`) |
| Edit dialog | Full-screen `Dialog` (`fullScreen` prop) opened on element tap, containing: mini canvas thumbnail, common properties section, type-specific properties section, save/delete buttons |
| No drag interaction | Mobile uses numeric inputs for position/size (no touch drag on canvas) |
| Reorder | Up/down `IconButton`s on each list row to change z-index (swap with adjacent) |

**WHEN** the admin taps an element in the list, **THEN** the system SHALL open a full-screen edit dialog with that element's common and type-specific properties.

**Acceptance Criteria:**
- Mobile element list is sorted by z-index (same as layer panel)
- Edit dialog includes all common and type-specific properties in a scrollable form
- Edit dialog `fullScreen` prop on MUI `Dialog` — uses full viewport height/width
- Edit dialog header: element type label + close button (`CloseOutlined`) + Save button
- `MiniCanvasThumbnail` (120×80px) at top of dialog: scaled-down read-only preview showing element position on a mini-canvas for spatial feedback
- Dialog body: collapsible accordions for Position, Content (type-specific), Appearance
- Dialog footer: Save button (full width) + Delete button (outline variant, full width)
- Up/down reorder buttons swap z-index with adjacent element via mobile reorder (optimistic)
- Row swipe-right: reveal Delete action (MUI `SwipeableDrawer` pattern)
- Row swipe-left: reveal Lock/Unlock toggle
- Save button in dialog validates and persists via mutation
- Delete button in dialog shows confirmation before deletion
- No `useMediaQuery` or `useViewport` imports in `.mobile.tsx` files (ESLint enforced)
- Dialog `open` state is local in `ElementListView.mobile` (not in Zustand — avoids stale state on tier switch)
- On close with dirty state: show "Unsaved changes" confirmation dialog
- Mobile shows same fields as desktop (not a reduced set) because numeric inputs replace canvas drag/resize
- Add element FAB: `AddIcon` with `aria-label` from i18n
- Same `CommonPropertiesForm` and `TypeSpecificFormDispatcher` shared components as desktop

---

### REQ-12.16 — GraphQL Documents

**THE SYSTEM SHALL** define the following GraphQL documents in `frontend/common/graphql/sharedDocuments/certificates/template-elements.documents.ts`:

| Document | Type | Purpose |
|---|---|---|
| `templateElementFragment` | Fragment | Base element fields + type-specific sub-record via union/interface selection |
| `createTemplateElementMutationDocument` | Mutation | Create element with type + default position + type-specific input |
| `updateTemplateElementMutationDocument` | Mutation | Update element common + type-specific properties |
| `deleteTemplateElementMutationDocument` | Mutation | Delete element + type-specific sub-record |
| `duplicateTemplateElementMutationDocument` | Mutation | Clone element with offset position |
| `reorderTemplateElementsMutationDocument` | Mutation | Batch update z-index for N elements |

**Acceptance Criteria:**
- All documents include `id` field on every object type for Apollo cache normalization
- Documents import from `"@apollo/client"` (never `/core`); types from generated `graphql-types.ts`
- Mutation documents update Apollo cache after mutation (evict deleted element, update modified element)
- Fragment is reusable and spread into queries from Plan 11

---

### REQ-12.17 — Validation Rules

**THE SYSTEM SHALL** validate element properties before persisting:

| Rule | Condition | Error i18n Key |
|---|---|---|
| Position within bounds | 0 ≤ x ≤ templateWidth AND 0 ≤ y ≤ templateHeight | `errors.positionOutOfBounds` |
| Size positive | width > 0 AND height > 0 | `errors.sizeMustBePositive` |
| Static text not empty | static_text.content.trim() !== "" | `errors.textContentRequired` |
| Variable reference valid | data_text/data_date variableId exists in template variables | `errors.variableRequired`, `errors.variableMustBeDate` (for data_date) |
| Image URL valid | image.imageUrl is non-empty string ≤ 500 chars | `errors.imageUrlRequired` |
| QR custom text | if qr_dataSource = custom_text, customText.trim() !== "" | `errors.qrCustomTextRequired` |
| Font size range | 1 ≤ fontSize ≤ 200 (when specified) | `errors.fontSizeRange` |
| Opacity range | 0 ≤ opacity ≤ 100 | `errors.opacityRange` |
| Rotation range | 0 ≤ rotation ≤ 360 | `errors.rotationRange` |

**WHEN** validation fails, **THEN** the system SHALL show inline error messages on the offending form fields and prevent the save mutation from firing.

**WHEN** validation passes, **THEN** the system SHALL persist via mutation and show a success toast.

**Acceptance Criteria:**
- All validation errors use i18n keys (no hardcoded strings)
- Validation runs on form submit, not on every keystroke (debounced for UX)
- Validation for position bounds uses template dimensions from Plan 10 (via parent template query)
- Multiple validation errors can be shown simultaneously (all fields validated at once)

---

### REQ-12.18 — Zustand Store

**THE SYSTEM SHALL** maintain a Zustand store `useTemplateElementEditorStore` that holds:

| State | Type | Description |
|---|---|---|
| `draftProperties` | ElementDraftProperties \| null | Edited-but-unsaved property values for selected element (discriminated union by type) |
| `isDirty` | boolean | Whether draft has unsaved changes |
| `clipboard` | ElementDraftProperties \| null | Copied element properties for paste |
| `layerPanelCollapsed` | boolean | Whether desktop layer panel is collapsed |
| `propertyPanelCollapsed` | boolean | Whether desktop property panel is collapsed |
| `expandedAccordion` | string \| null | Currently expanded accordion section ID |
| `isSaving` | boolean | Whether a save mutation is in-flight |
| `validationErrors` | Record<string, string> | Field-path → error message key |
| `deleteDialogOpen` | boolean | Whether the delete confirmation dialog is open |
| `unsavedChangesDialogOpen` | boolean | Whether the unsaved-changes warning is open |

**Acceptance Criteria:**
- Store is non-persisted (session-only state); no `persist` middleware
- All mutable UI state lives in Zustand (survives tier switching on resize)
- Store uses redundant type imports from `graphql-types.ts` (not redefining types)
- Actions reset state when template ID changes (navigating to a different template)
- Store does NOT own `selectedIds` or `elements` — those live in Plan 11's canvas store (selection consolidation)
- Store does NOT own file objects for image upload — those live in `useRef` in the ViewModel (files are not serializable)
- `draftProperties` is a discriminated union matching `ElementWithDetails` — ensures type-safe field access

> **NOTE:** `selectedElementId`, `selectedIds`, and `elements` are owned by Plan 11's canvas store (`useCanvasStore`). Plan 12 reads these via selector — it does NOT duplicate selection state.

---

### REQ-12.19 — Color Picker (react-color Integration)

**THE SYSTEM SHALL** provide a `ColorPickerField` component for all color-type properties (textColor, fillColor, borderColor), implemented as:

1. An MUI `TextField` (read-only hex value display) + a color swatch `IconButton`
2. Click the swatch → MUI `Popover` opens with `ChromePicker` from `react-color` (`disableAlpha: true`, default width 225px)
3. On color change: `ChromePicker` `onChange` → `ColorResult.hex` → update draft + hex TextField
4. Hex `TextField` is also editable (manual hex input for a11y): validates against regex `/^#[0-9A-Fa-f]{6}$/`

**Acceptance Criteria:**
- Uses `react-color` (v2.19.3) `ChromePicker` — NOT `SketchPicker` (ChromePicker is more complete)
- `disableAlpha: true` — no alpha channel (certificates are print-oriented)
- Color swatch button: renders a 24×24px colored rectangle showing current color value
- Swatch button: `aria-label="Open color picker for {fieldLabel}"` for screen readers
- Hex TextField: `label` from i18n, `aria-label` includes field name (e.g., "Text color hex value")
- Popover closes on: click-away, Escape key, or selecting a color and clicking outside
- Invalid hex input (not matching `#RRGGBB`): shows inline error with i18n key `errors.invalidHexColor`
- All colors output as hex strings (e.g., `"#FF5733"`) — NOT RGB objects
- Color swatch uses theme palette borders: `sx={{ border: \`1px solid ${theme.palette.divider}\` }}`
- No hardcoded colors — Popover background and text use theme palette

---

### REQ-12.20 — Font Picker (Autocomplete)

**THE SYSTEM SHALL** provide a `FontPicker` component (`Autocomplete` + `TextField`) for font family properties on text-bearing element types (static_text, data_text, data_date).

**Acceptance Criteria:**
- Uses MUI `Autocomplete` with `TextField` — NOT a plain `Select` (supports type-to-search for large font lists)
- Font list includes system fonts + Arabic-capable fonts (Amiri, Cairo) when template locale is `ar`
- Each dropdown item renders font name in that font (font preview in dropdown)
- Font list is static (no async loading) — defined in a constants file in `shared/constants/`
- When no font selected: shows placeholder "Select a font"
- Font family change previews live on canvas element text
- Autocomplete is `freeSolo: false` — only listed fonts are valid (no custom font names)
- Filter: case-insensitive substring match on font name
- `aria-label` from i18n `properties.fontFamily`

---

### REQ-12.21 — File Upload for Image Elements

**WHEN** the admin clicks the "Browse" button on the image element editor, **THEN** the system SHALL open a file picker dialog (accept="image/*") to select an image file, upload it via Plan 7's storage API, and populate the `imageUrl` field with the returned URL.

**Acceptance Criteria:**
- "Browse" button is an `IconButton` with `UploadFileOutlined` icon + text "Browse"
- File picker `accept="image/*"` — only image files are selectable
- File size limit: 5MB max (defined in shared constants, enforced client-side before upload)
- Upload progress: `LinearProgress` bar while uploading (disabled imageUrl field during upload)
- Upload error: inline error message with i18n key `errors.uploadFailed`
- Selected `File` object lives in `useRef` in the ViewModel (NOT in Zustand — not serializable)
- After upload completes: `imageUrl` TextField populated with the returned URL, form becomes dirty
- Alternative: imageUrl can be manually entered as a URL (paste from clipboard or external URL)
- Drag-and-drop on the image element editor area (bonus interaction) — accepts a dropped image file

---

### REQ-12.22 — Element Context Menu (Desktop)

**WHEN** the admin right-clicks on a canvas element (desktop only), **THEN** the system SHALL open an `ElementContextMenu` with items:

| Menu Item | i18n Key | Behavior | Disabled When |
|---|---|---|---|
| Bring Forward | `actions.bringForward` | Swap z-index with element above | Element is at top already |
| Send Backward | `actions.sendBackward` | Swap z-index with element below | Element is at bottom already |
| Bring to Front | `actions.bringToFront` | Set z-index to max+1 | Element is at top already |
| Send to Back | `actions.sendToBack` | Set z-index to 0, shift others up | Element is at bottom already |
| — (divider) | — | — | — |
| Duplicate | `actions.duplicate` | Clone with +20px offset | Clipboard full or element locked |
| Copy | `actions.copy` | Copy to clipboard | Element locked |
| Paste | `actions.paste` | Paste from clipboard | Clipboard is empty |
| — (divider) | — | — | — |
| Delete | `actions.delete` | Open delete confirmation | Element locked |

**Acceptance Criteria:**
- Delete menu item renders in red text: `sx={{ color: theme.palette.error.main }}`
- Context menu uses MUI `Menu` with `position: absolute` at cursor x/y
- Keyboard shortcuts shown in menu items where applicable (Ctrl+D, Ctrl+C, Ctrl+V)
- Context menu closes after an action is performed or on click-away
- Context menu is NOT available on mobile (no right-click on touch devices)

---

### REQ-12.23 — Multi-Select Property Panel

**WHEN** the admin selects multiple elements (via shift-click on canvas or ctrl+click in layer panel), **THEN** the property panel SHALL show a `MultiSelectBadge` instead of element-specific forms:

**Acceptance Criteria:**
- `MultiSelectBadge`: "N elements selected" (i18n key `multiSelect.elementsSelected` with count interpolation)
- Batch actions: "Delete Selected" (`multiSelect.batchDelete`), "Lock Selected" (`multiSelect.batchLock`)
- Batch delete opens confirmation: "Delete N elements? This cannot be undone."
- Batch lock toggles `locked` for all selected elements via batch update mutation
- Individual property editing is NOT available in multi-select mode (batch property editing is out of scope)
- Clearing multi-select (Escape or click empty canvas area) returns to no-selection empty state
- Multi-select uses pluralization: `(count: number) => string` for Arabic one/few/many rules

---

### REQ-12.24 — Accessibility (a11y)

**THE SYSTEM SHALL** meet the following accessibility requirements:

**Layer Panel a11y:**
- `LayerPanelSection` root: `role="listbox"`, `aria-label` from i18n "Layers panel"
- Each `LayerPanelItem`: `role="option"`, `aria-selected={selected}`, `aria-label` = element type + label
- Drag handle: `aria-label="Drag to reorder {elementLabel}"`
- Visibility toggle: `aria-label="Hide element {elementLabel}"` / `"Show element {elementLabel}"`
- Lock toggle: `aria-label="Lock element {elementLabel}"` / `"Unlock element {elementLabel}"`
- Keyboard reorder: `Tab` to focus, `Space` to pick up, `ArrowUp`/`ArrowDown` to move, `Space` to drop

**Property Panel a11y:**
- All MUI `TextField`s have `label` from i18n (MUI renders `<label>` automatically)
- All `Select`s have `label` from i18n
- `ColorPickerField`: hex `TextField` has `label` + `aria-label` includes field name
- `ColorPickerField` swatch button: `aria-label="Open color picker for {fieldLabel}"`
- Accordion section titles: `AccordionSummary` renders as a button with accessible name from i18n
- All color from theme palette (no hardcoded colors)

**Dialog a11y:**
- All `Dialog`s use `aria-labelledby` pointing to dialog title
- Focus trap automatically provided by MUI `Dialog`
- Focus restoration: MUI Dialog restores focus to triggering element on close

**Screen Reader Announcements:**
- Layer panel drag: `DndContext` `accessibility.announcements` for pick up/move/drop
- Form validation errors: `aria-live="polite"` region displays error count
- Save success: snackbar announcement "Element saved"
- Delete success: snackbar announcement "Element deleted"

---

## 3. i18n Requirements

### Namespace

`dashboard.certificateTemplateElements` — flat dashboard namespace registration (NOT nested certificates subgroup). Uses `useAppTranslation(Translation.Dashboard.CertificateTemplateElements)` from `@/shared/locale/client` (handle pattern — takes `NamespaceHandle` object, NOT a string).

Namespace sub-domains: `elementTypes.*`, `properties.*`, `sections.*`, `actions.*`, `errors.*`, `dialogs.*`, `qrErrorCorrection.*`, `shapeTypes.*`, `fitModes.*`, `fontWeights.*`, `textTransforms.*`, `layerPanel.*`, `emptyState.*`, `multiSelect.*`

### Element Type Labels

| Key | English | Arabic |
|---|---|---|
| `elementTypes.staticText` | "Static Text" | "نص ثابت" |
| `elementTypes.dataText` | "Data Text" | "نص بيانات" |
| `elementTypes.dataDate` | "Data Date" | "تاريخ بيانات" |
| `elementTypes.image` | "Image" | "صورة" |
| `elementTypes.qrCode` | "QR Code" | "رمز QR" |
| `elementTypes.shape` | "Shape" | "شكل" |

### Common Property Labels

| Key | English | Arabic |
|---|---|---|
| `properties.position` | "Position" | "الموضع" |
| `properties.positionX` | "X" | "س" |
| `properties.positionY` | "Y" | "ص" |
| `properties.size` | "Size" | "الحجم" |
| `properties.width` | "Width" | "العرض" |
| `properties.height` | "Height" | "الارتفاع" |
| `properties.rotation` | "Rotation" | "الدوران" |
| `properties.zIndex` | "Layer Order" | "ترتيب الطبقة" |
| `properties.opacity` | "Opacity" | "الشفافية" |

### Type-Specific Property Labels

| Key | English | Arabic |
|---|---|---|
| `properties.textContent` | "Text Content" | "محتوى النص" |
| `properties.fontFamily` | "Font Family" | "عائلة الخط" |
| `properties.fontSize` | "Font Size" | "حجم الخط" |
| `properties.fontWeight` | "Font Weight" | "وزن الخط" |
| `properties.textColor` | "Text Color" | "لون النص" |
| `properties.textAlign` | "Text Alignment" | "محاذاة النص" |
| `properties.lineHeight` | "Line Height" | "ارتفاع السطر" |
| `properties.variableId` | "Variable" | "المتغير" |
| `properties.textTransform` | "Text Transform" | "تحويل النص" |
| `properties.dateFormat` | "Date Format" | "تنسيق التاريخ" |
| `properties.customFormat` | "Custom Format" | "تنسيق مخصص" |
| `properties.locale` | "Locale" | "اللغة المحلية" |
| `properties.imageUrl` | "Image URL" | "رابط الصورة" |
| `properties.altText` | "Alt Text" | "النص البديل" |
| `properties.fitMode` | "Fit Mode" | "وضع الملاءمة" |
| `properties.borderRadius` | "Border Radius" | "نصف قطر الحدود" |
| `properties.qrDataSource` | "Data Source" | "مصدر البيانات" |
| `properties.qrCustomText` | "Custom Text" | "نص مخصص" |
| `properties.qrSize` | "Size" | "الحجم" |
| `properties.qrErrorCorrection` | "Error Correction" | "تصحيح الأخطاء" |
| `properties.qrMargin` | "Margin" | "الهامش" |
| `properties.shapeType` | "Shape Type" | "نوع الشكل" |
| `properties.fillColor` | "Fill Color" | "لون التعبئة" |
| `properties.borderColor` | "Border Color" | "لون الحدود" |
| `properties.borderWidth` | "Border Width" | "عرض الحدود" |
| `properties.borderStyle` | "Border Style" | "نمط الحدود" |

### Context Menu / Action Labels

| Key | English | Arabic |
|---|---|---|
| `actions.save` | "Save" | "حفظ" |
| `actions.discard` | "Discard" | "تجاهل" |
| `actions.delete` | "Delete" | "حذف" |
| `actions.duplicate` | "Duplicate" | "نسخ مكرر" |
| `actions.copy` | "Copy" | "نسخ" |
| `actions.paste` | "Paste" | "لصق" |
| `actions.bringForward` | "Bring Forward" | "إحضار للأمام" |
| `actions.sendBackward` | "Send Backward" | "إرسال للخلف" |
| `actions.bringToFront` | "Bring to Front" | "إحضار للمقدمة" |
| `actions.sendToBack` | "Send to Back" | "إرسال للمؤخرة" |
| `actions.addElement` | "Add Element" | "إضافة عنصر" |
| `actions.close` | "Close" | "إغلاق" |
| `actions.uploadImage` | "Browse" | "تصفح" |
| `actions.confirmDelete` | "Confirm Delete" | "تأكيد الحذف" |
| `actions.cancel` | "Cancel" | "إلغاء" |
| `actions.saveAnyway` | "Save Anyway" | "حفظ على أي حال" |
| `actions.discardChanges` | "Discard Changes" | "تجاهل التغييرات" |

### Validation Messages

| Key | English | Arabic |
|---|---|---|
| `errors.textContentRequired` | "Text content is required" | "محتوى النص مطلوب" |
| `errors.textContentTooLong` | "Text content must be at most 1000 characters" | "يجب ألا يتجاوز محتوى النص 1000 حرف" |
| `errors.fontSizeRange` | "Font size must be between 1 and 200" | "حجم الخط يجب أن يكون بين 1 و 200" |
| `errors.lineHeightRange` | "Line height must be between 0.5 and 3.0" | "ارتفاع السطر يجب أن يكون بين 0.5 و 3.0" |
| `errors.variableRequired` | "A variable must be selected" | "يجب اختيار متغير" |
| `errors.variableMustBeDate` | "A date-type variable must be selected" | "يجب اختيار متغير من نوع تاريخ" |
| `errors.customFormatRequired` | "Custom format is required when date format is 'custom'" | "التنسيق المخصص مطلوب عندما يكون تنسيق التاريخ 'مخصص'" |
| `errors.imageUrlRequired` | "Image URL is required" | "رابط الصورة مطلوب" |
| `errors.imageUrlTooLong` | "Image URL must be at most 500 characters" | "يجب ألا يتجاوز رابط الصورة 500 حرف" |
| `errors.qrCustomTextRequired` | "Custom QR text is required when data source is 'custom text'" | "نص QR المخصص مطلوب عندما يكون مصدر البيانات 'نص مخصص'" |
| `errors.qrSizeRange` | "QR size must be between 32 and 512" | "حجم QR يجب أن يكون بين 32 و 512" |
| `errors.qrMarginRange` | "QR margin must be between 0 and 50" | "هامش QR يجب أن يكون بين 0 و 50" |
| `errors.borderWidthRange` | "Border width must be between 0 and 20" | "عرض الحدود يجب أن يكون بين 0 و 20" |
| `errors.xOutOfRange` | "X position must be within template bounds" | "الموضع X يجب أن يكون ضمن حدود القالب" |
| `errors.yOutOfRange` | "Y position must be within template bounds" | "الموضع Y يجب أن يكون ضمن حدود القالب" |
| `errors.widthMustBePositive` | "Width must be greater than 0" | "العرض يجب أن يكون أكبر من 0" |
| `errors.heightMustBePositive` | "Height must be greater than 0" | "الارتفاع يجب أن يكون أكبر من 0" |
| `errors.rotationRange` | "Rotation must be between 0 and 360" | "التدوير يجب أن يكون بين 0 و 360" |
| `errors.opacityRange` | "Opacity must be between 0 and 100" | "الشفافية يجب أن تكون بين 0 و 100" |
| `errors.invalidHexColor` | "Color must be a valid hex value (e.g., #FF5733)" | "اللون يجب أن يكون قيمة سداسية عشرية صالحة" |
| `errors.permissionDenied` | "You do not have permission to manage template elements" | "ليس لديك صلاحية لإدارة عناصر القالب" |
| `errors.templatePublished` | "Cannot edit elements of a published template" | "لا يمكن تعديل عناصر قالب منشور" |
| `errors.elementNotFound` | "Element not found" | "العنصر غير موجود" |
| `errors.uploadFailed` | "Image upload failed" | "فشل رفع الصورة" |
| `errors.optimisticLockFailed` | "This template has been modified by another user. Please refresh and try again." | "تم تعديل هذا القالب بواسطة مستخدم آخر. يرجى التحديث والمحاولة مرة أخرى." |

### Dialog Messages

| Key | English | Arabic |
|---|---|---|
| `dialogs.deleteTitle` | "Delete Element" | "حذف العنصر" |
| `dialogs.deleteMessage` | "Are you sure you want to delete this {elementType}? This action cannot be undone." | "هل أنت متأكد من حذف هذا {elementType}؟ لا يمكن التراجع عن هذا الإجراء." |
| `dialogs.unsavedTitle` | "Unsaved Changes" | "تغييرات غير محفوظة" |
| `dialogs.unsavedMessage` | "You have unsaved changes. Do you want to save before switching?" | "لديك تغييرات غير محفوظة. هل تريد الحفظ قبل التبديل؟" |
| `dialogs.emptyLayerPanel` | "No elements — add one to get started" | "لا توجد عناصر - أضف عنصراً للبدء" |

### Interpolation

- `deleteMessage`: parameter `{elementType}` (string) — the translated element type label

### QR Error Correction Level Labels

| Key | English | Arabic |
|---|---|---|
| `qrErrorCorrection.levelL` | "Low (7%)" | "منخفض (7%)" |
| `qrErrorCorrection.levelM` | "Medium (15%)" | "متوسط (15%)" |
| `qrErrorCorrection.levelQ` | "Quartile (25%)" | "ربع (25%)" |
| `qrErrorCorrection.levelH` | "High (30%)" | "عالي (30%)" |

### Shape Type Labels

| Key | English | Arabic |
|---|---|---|
| `shapeTypes.rectangle` | "Rectangle" | "مستطيل" |
| `shapeTypes.circle` | "Circle" | "دائرة" |
| `shapeTypes.line` | "Line" | "خط" |

### Fit Mode Labels

| Key | English | Arabic |
|---|---|---|
| `fitModes.contain` | "Contain" | "احتواء" |
| `fitModes.cover` | "Cover" | "تغطية" |
| `fitModes.fill` | "Fill" | "ملء" |

### Font Weight Labels

| Key | English | Arabic |
|---|---|---|
| `fontWeights.normal` | "Normal" | "عادي" |
| `fontWeights.medium` | "Medium" | "متوسط" |
| `fontWeights.bold` | "Bold" | "عريض" |

### Text Transform Labels

| Key | English | Arabic |
|---|---|---|
| `textTransforms.none` | "None" | "بدون" |
| `textTransforms.uppercase` | "Uppercase" | "أحرف كبيرة" |
| `textTransforms.lowercase` | "Lowercase" | "أحرف صغيرة" |

### Section Headers

| Key | English | Arabic |
|---|---|---|
| `sections.position` | "Position" | "الموضع" |
| `sections.content` | "Content" | "المحتوى" |
| `sections.appearance` | "Appearance" | "المظهر" |
| `sections.advanced` | "Advanced" | "متقدم" |
| `sections.textContent` | "Text Content" | "محتوى النص" |
| `sections.dataText` | "Data Text" | "نص البيانات" |
| `sections.dateFormat` | "Date Format" | "تنسيق التاريخ" |
| `sections.image` | "Image" | "الصورة" |
| `sections.qrCode` | "QR Code" | "رمز QR" |
| `sections.shape` | "Shape" | "الشكل" |

### Layer Panel Labels

| Key | English | Arabic |
|---|---|---|
| `layerPanel.header` | "Layers" | "الطبقات" |
| `layerPanel.empty` | "No elements yet. Click 'Add Element' to begin." | "لا توجد عناصر بعد. انقر على 'إضافة عنصر' للبدء." |
| `layerPanel.showElement` | "Show element" | "إظهار العنصر" |
| `layerPanel.hideElement` | "Hide element" | "إخفاء العنصر" |
| `layerPanel.lockElement` | "Lock element" | "قفل العنصر" |
| `layerPanel.unlockElement` | "Unlock element" | "فتح العنصر" |
| `layerPanel.dragToReorder` | "Drag to reorder" | "اسحب لإعادة الترتيب" |

### Empty State

| Key | English | Arabic |
|---|---|---|
| `emptyState.selectElement` | "Select an element to edit its properties" | "اختر عنصراً لتعديل خصائصه" |

### Multi-Select Labels

| Key | English | Arabic |
|---|---|---|
| `multiSelect.elementsSelected` | "{count} elements selected" | "{count} عناصر محددة" |
| `multiSelect.batchDelete` | "Delete Selected" | "حذف المحدد" |
| `multiSelect.batchLock` | "Lock Selected" | "قفل المحدد" |

### Pluralization

- `multiSelect.elementsSelected`: `(count: number) => string` — plural form for Arabic (one/few/many rules)

---

## 4. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-12.1 | The element property panel SHALL load and display element properties within 100ms of selection. |
| NFR-12.2 | Drag-and-drop reordering in the layer panel SHALL complete within 16ms per frame (60fps). |
| NFR-12.3 | The mobile edit dialog SHALL open within 200ms of tapping an element row. |
| NFR-12.4 | Color picker popover SHALL open within 50ms of clicking the color swatch. |
| NFR-12.5 | Validation SHALL complete and display errors within 50ms of field change. |
| NFR-12.6 | The mini-canvas thumbnail on mobile SHALL render within 50ms of dialog open. |
| NFR-12.7 | All user-facing text SHALL use the compile-time i18n system (shared/locale) with both English and Arabic translations. |
| NFR-12.8 | All color values SHALL be sourced from the MUI theme palette — no hardcoded hex colors in components. |
| NFR-12.9 | All form inputs SHALL have accessible labels (WCAG 2.1 AA) with `aria-label` or `label` prop. |
| NFR-12.10 | Keyboard navigation SHALL work across layer panel → canvas → property panel with logical Tab order. |
| NFR-12.11 | Error messages SHALL use i18n keys (no hardcoded strings) and display with `aria-live="polite"`. |
| NFR-12.12 | The editor SHALL handle templates with up to 200 elements without performance degradation. |
| NFR-12.13 | Loading states SHALL be shown for all async operations (mutations, file uploads, variable fetching). |
| NFR-12.14 | Empty states SHALL display helpful messages with appropriate icons (no elements, no variables, no preview). |
| NFR-12.15 | Interaction states SHALL be visually distinct: selected, hovered, dragging, resizing, focused, disabled. |

---

## 5. Outcome Knowledge Base & Progress Tracking

### Knowledge Captured

- Element type system design (6 types with polymorphic sub-records)
- Property panel architecture (common + type-specific dynamic forms)
- Mobile vs desktop element editing strategy (list+dialog vs canvas+panel)
- Validation rules for element properties against template bounds

### Progress Indicators

- [ ] GraphQL documents created and codegen passes
- [ ] Zustand store implemented with all state/actions
- [ ] Color picker (react-color ChromePicker in MUI Popover) integrated
- [ ] Font picker (Autocomplete with font preview) implemented
- [ ] File upload for image elements (Plan 7 storage integration) implemented
- [ ] Desktop property panel renders all 6 element type forms
- [ ] Desktop layer panel with @dnd-kit/sortable, visibility/lock/reorder
- [ ] Desktop context menu (right-click on canvas element) implemented
- [ ] Copy/paste/duplicate keyboard shortcuts (Ctrl+C/V/D) implemented
- [ ] Multi-select property panel with batch actions
- [ ] Mobile element editor (list + full-screen dialog + mini-canvas thumbnail)
- [ ] Mobile add element bottom sheet implemented
- [ ] All validation rules implemented and tested (rotation 0–360, not -360..360)
- [ ] Optimistic locking via expectedTemplateVersion in all mutations
- [ ] i18n keys defined in `shared/locale/` for both `en` and `ar` (all sub-domains)
- [ ] Apollo cache updates work for all CRUD operations
- [ ] Accessibility: layer panel keyboard reorder, dialog focus traps, labeled inputs, screen reader announcements
- [ ] Permission check: `certificates.templates.manage` on all mutations

---

## 6. UX / Navigation Specification (NEW — Round 2 Enhancement)

### 6.1 Routes & Sidebar Placement

| Route | Purpose | Layout Region | Access |
|-------|---------|---------------|--------|
| `/[locale]/dashboard/certificates/templates/[templateId]/edit` | Template Editor main page (canvas + sidebars) | **Center**: Canvas (Plan 11)<br>**Left Sidebar**: Layer Panel (this plan)<br>**Right Sidebar**: Property Panel (this plan)<br>**Top Toolbar**: Add Element Toolbar (this plan) | `certificates.templates.manage` |
| `/[locale]/dashboard/certificates/templates/[templateId]/edit?mobile=true` | Mobile Template Editor (list + dialog) | **Full Screen**: Element List + Edit Dialog + Mini-Canvas Thumbnail | `certificates.templates.manage` |

**Sidebar State Persistence**: Both left (Layer Panel) and right (Property Panel) sidebar collapse states are persisted in `useTemplateElementEditorStore` and survive tier switching (desktop ↔ mobile).

### 6.2 Role-Based Access Matrix (8 Roles)

| Role | View Editor | Add Element | Edit Properties | Delete Element | Reorder Layers | Duplicate Element | Copy/Paste | Bulk Actions |
|------|-------------|-------------|-----------------|----------------|----------------|-------------------|------------|--------------|
| `super_admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `org_admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `template_manager` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `certificate_designer` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `certificate_issuer` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `viewer` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `api_client` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `anonymous` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Permission Gate**: All mutations require `certificates.templates.manage` (single canonical permission from `INTER_PLAN_CONTRACTS.md`). UI elements (toolbar items, context menu, buttons) are conditionally rendered based on this permission via `useHasPermission('certificates.templates.manage')` hook.

### 6.3 Navigation Flow

```
Template List (Plan 10)
    │
    ▼ Click "Edit Template"
Template Editor (Plan 11 Canvas + Plan 12 Sidebars)
    │
    ├── Left Sidebar: Layer Panel ──► Drag to reorder z-index
    ├── Center: Canvas ──► Click element → selects in Layer Panel & Property Panel
    ├── Right Sidebar: Property Panel ──► Edit props → Auto-save on blur / Enter
    ├── Top Toolbar: Add Element ──► Dropdown → Creates element at center of viewport
    └── Right-click on Canvas Element → Context Menu (Z-order, Duplicate, Delete)
```

---

## 7. Complete i18n Key Definitions (EN + AR Inline) (NEW — Round 2 Enhancement)

**Namespace**: `dashboard.certificateTemplateElements` (flat, per `INTER_PLAN_CONTRACTS.md`)

### 7.1 Panel & Section Labels

| i18n Key | EN | AR |
|----------|-----|-----|
| `panels.layerPanel.title` | Layers | الطبقات |
| `panels.layerPanel.collapse` | Collapse layers | طي الطبقات |
| `panels.layerPanel.expand` | Expand layers | توسيع الطبقات |
| `panels.propertyPanel.title` | Properties | الخصائص |
| `panels.propertyPanel.collapse` | Collapse properties | طي الخصائص |
| `panels.propertyPanel.expand` | Expand properties | توسيع الخصائص |
| `panels.propertyPanel.empty` | Select an element to edit its properties | حدد عنصراً لتحرير خصائصه |
| `panels.propertyPanel.multiSelect` | {count} elements selected | تم تحديد {count} عنصر |

### 7.2 Element Type Labels

| i18n Key | EN | AR |
|----------|-----|-----|
| `elementTypes.static_text` | Static Text | نص ثابت |
| `elementTypes.data_text` | Data Text | نص متغير |
| `elementTypes.data_date` | Data Date | تاريخ متغير |
| `elementTypes.image` | Image | صورة |
| `elementTypes.qr_code` | QR Code | رمز QR |
| `elementTypes.shape` | Shape | شكل |

### 7.3 Common Properties (Position, Size, Rotation, Opacity, Z-Index)

| i18n Key | EN | AR |
|----------|-----|-----|
| `properties.common.position` | Position | الموضع |
| `properties.common.x` | X | س |
| `properties.common.y` | Y | ص |
| `properties.common.size` | Size | الحجم |
| `properties.common.width` | Width | العرض |
| `properties.common.height` | Height | الارتفاع |
| `properties.common.rotation` | Rotation (°) | الدوران (°) |
| `properties.common.opacity` | Opacity | الشفافية |
| `properties.common.zIndex` | Z-Index (Layer Order) | مؤشر الطبقة (ترتيب الطبقة) |
| `properties.common.visibility` | Visibility | الرؤية |
| `properties.common.lock` | Lock | قفل |
| `properties.common.hidden` | Hidden | مخفي |
| `properties.common.locked` | Locked | مقفل |

### 7.4 Static Text Properties

| i18n Key | EN | AR |
|----------|-----|-----|
| `properties.static_text.content` | Text Content | محتوى النص |
| `properties.static_text.fontFamily` | Font Family | عائلة الخط |
| `properties.static_text.fontSize` | Font Size | حجم الخط |
| `properties.static_text.fontWeight` | Font Weight | سماكة الخط |
| `properties.static_text.textColor` | Text Color | لون النص |
| `properties.static_text.textAlign` | Text Alignment | محاذاة النص |
| `properties.static_text.lineHeight` | Line Height | ارتفاع السطر |
| `properties.static_text.align.left` | Left | يسار |
| `properties.static_text.align.center` | Center | مركز |
| `properties.static_text.align.right` | Right | يمين |
| `properties.static_text.align.justify` | Justify | ضبط |
| `properties.static_text.weight.normal` | Normal | عادي |
| `properties.static_text.weight.medium` | Medium | متوسط |
| `properties.static_text.weight.bold` | Bold | غامق |
| `properties.static_text.weight.extraBold` | Extra Bold | غامق جداً |

### 7.5 Data Text Properties

| i18n Key | EN | AR |
|----------|-----|-----|
| `properties.data_text.variable` | Variable | المتغير |
| `properties.data_text.selectVariable` | Select variable... | اختر متغيراً... |
| `properties.data_text.fontFamily` | Font Family | عائلة الخط |
| `properties.data_text.fontSize` | Font Size | حجم الخط |
| `properties.data_text.textColor` | Text Color | لون النص |
| `properties.data_text.textAlign` | Text Alignment | محاذاة النص |
| `properties.data_text.textTransform` | Text Transform | تحويل النص |
| `properties.data_text.transform.none` | None | لا شيء |
| `properties.data_text.transform.uppercase` | Uppercase | أحرف كبيرة |
| `properties.data_text.transform.lowercase` | Lowercase | أحرف صغيرة |
| `properties.data_text.transform.capitalize` | Capitalize | أول حرف كبير |

### 7.6 Data Date Properties

| i18n Key | EN | AR |
|----------|-----|-----|
| `properties.data_date.variable` | Variable | المتغير |
| `properties.data_date.selectVariable` | Select variable... | اختر متغيراً... |
| `properties.data_date.format` | Date Format | تنسيق التاريخ |
| `properties.data_date.format.iso` | ISO (YYYY-MM-DD) | أيزو (YYYY-MM-DD) |
| `properties.data_date.format.arabicFullMonth` | Arabic Full Month (D MMMM YYYY) | الشهر العربي الكامل (D MMMM YYYY) |
| `properties.data_date.format.numeric` | Numeric (DD/MM/YYYY) | رقمي (DD/MM/YYYY) |
| `properties.data_date.format.custom` | Custom | مخصص |
| `properties.data_date.customFormat` | Custom Format | تنسيق مخصص |
| `properties.data_date.locale` | Locale | اللغة |
| `properties.data_date.fontFamily` | Font Family | عائلة الخط |
| `properties.data_date.fontSize` | Font Size | حجم الخط |
| `properties.data_date.textColor` | Text Color | لون النص |

### 7.7 Image Properties

| i18n Key | EN | AR |
|----------|-----|-----|
| `properties.image.url` | Image URL | رابط الصورة |
| `properties.image.browse` | Browse... | استعراض... |
| `properties.image.altText` | Alt Text | نص بديل |
| `properties.image.fitMode` | Fit Mode | وضع التعبئة |
| `properties.image.fit.contain` | Contain | احتواء |
| `properties.image.fit.cover` | Cover | تغطية |
| `properties.image.fit.fill` | Fill | تعبئة |
| `properties.image.fit.none` | None | لا شيء |
| `properties.image.borderRadius` | Border Radius | نصف قطر الحواف |

### 7.8 QR Code Properties

| i18n Key | EN | AR |
|----------|-----|-----|
| `properties.qr_code.dataSource` | Data Source | مصدر البيانات |
| `properties.qr_code.source.variable` | Variable | متغير |
| `properties.qr_code.source.custom` | Custom Text | نص مخصص |
| `properties.qr_code.source.verificationUrl` | Verification URL | رابط التحقق |
| `properties.qr_code.variable` | Variable | المتغير |
| `properties.qr_code.customText` | Custom Text | النص المخصص |
| `properties.qr_code.size` | QR Size | حجم QR |
| `properties.qr_code.errorCorrection` | Error Correction | تصحيح الخطأ |
| `properties.qr_code.correction.L` | Low (L) | منخفض (L) |
| `properties.qr_code.correction.M` | Medium (M) | متوسط (M) |
| `properties.qr_code.correction.Q` | Quartile (Q) | ربعي (Q) |
| `properties.qr_code.correction.H` | High (H) | عالي (H) |
| `properties.qr_code.margin` | Margin | هامش |

### 7.9 Shape Properties

| i18n Key | EN | AR |
|----------|-----|-----|
| `properties.shape.type` | Shape Type | نوع الشكل |
| `properties.shape.type.rectangle` | Rectangle | مستطيل |
| `properties.shape.type.circle` | Circle | دائرة |
| `properties.shape.type.line` | Line | خط |
| `properties.shape.fillColor` | Fill Color | لون التعبئة |
| `properties.shape.borderColor` | Border Color | لون الحد |
| `properties.shape.borderWidth` | Border Width | عرض الحد |
| `properties.shape.borderStyle` | Border Style | نمط الحد |
| `properties.shape.style.solid` | Solid | متصل |
| `properties.shape.style.dashed` | Dashed | متقطع |
| `properties.shape.style.none` | None | لا شيء |

### 7.10 Actions & Toolbar

| i18n Key | EN | AR |
|----------|-----|-----|
| `actions.addElement` | Add Element | إضافة عنصر |
| `actions.addStaticText` | Add Static Text | إضافة نص ثابت |
| `actions.addDataText` | Add Data Text | إضافة نص متغير |
| `actions.addDataDate` | Add Data Date | إضافة تاريخ متغير |
| `actions.addImage` | Add Image | إضافة صورة |
| `actions.addQrCode` | Add QR Code | إضافة رمز QR |
| `actions.addShape` | Add Shape | إضافة شكل |
| `actions.save` | Save | حفظ |
| `actions.cancel` | Cancel | إلغاء |
| `actions.delete` | Delete | حذف |
| `actions.duplicate` | Duplicate | تكرار |
| `actions.copy` | Copy | نسخ |
| `actions.paste` | Paste | لصق |
| `actions.bringForward` | Bring Forward | تقديم للطبقة الأمامية |
| `actions.sendBackward` | Send Backward | تأخير للطبقة الخلفية |
| `actions.bringToFront` | Bring to Front | تقديم للأمام |
| `actions.sendToBack` | Send to Back | تأخير للخلف |
| `actions.undo` | Undo | تراجع |
| `actions.redo` | Redo | إعادة |

### 7.11 Dialogs & Confirmations

| i18n Key | EN | AR |
|----------|-----|-----|
| `dialogs.deleteElement.title` | Delete Element | حذف العنصر |
| `dialogs.deleteElement.message` | Are you sure you want to delete this element? This action cannot be undone. | هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء. |
| `dialogs.deleteElement.confirm` | Delete | حذف |
| `dialogs.unsavedChanges.title` | Unsaved Changes | تغييرات غير محفوظة |
| `dialogs.unsavedChanges.message` | You have unsaved changes. Do you want to save before leaving? | لديك تغييرات غير محفوظة. هل تريد الحفظ قبل المغادرة؟ |
| `dialogs.unsavedChanges.save` | Save | حفظ |
| `dialogs.unsavedChanges.discard` | Discard | تجاهل |
| `dialogs.unsavedChanges.cancel` | Cancel | إلغاء |
| `dialogs.copyConflict.title` | Version Conflict | تعارض الإصدار |
| `dialogs.copyConflict.message` | The template was modified by another user. Reload to see latest changes. | تم تعديل القالب من قبل مستخدم آخر. أعد التحميل لرؤية أحدث التغييرات. |
| `dialogs.copyConflict.reload` | Reload | إعادة تحميل |

### 7.12 Validation & Error Messages

| i18n Key | EN | AR |
|----------|-----|-----|
| `validation.required` | This field is required | هذا الحقل مطلوب |
| `validation.min` | Value must be at least {min} | يجب أن تكون القيمة {min} على الأقل |
| `validation.max` | Value must be at most {max} | يجب أن تكون القيمة {max} كحد أقصى |
| `validation.integer` | Value must be an integer | يجب أن تكون القيمة عدداً صحيحاً |
| `validation.number` | Value must be a number | يجب أن تكون القيمة عدداً |
| `validation.rotationRange` | Rotation must be between 0 and 360 degrees | يجب أن يكون الدوران بين 0 و 360 درجة |
| `validation.opacityRange` | Opacity must be between 0 and 100 | يجب أن تكون الشفافية بين 0 و 100 |
| `validation.widthMin` | Width must be at least {min}px | يجب أن يكون العرض {min}px على الأقل |
| `validation.heightMin` | Height must be at least {min}px | يجب أن يكون الارتفاع {min}px على الأقل |
| `validation.elementOutOfBounds` | Element exceeds template boundaries | العنصر يتجاوز حدود القالب |
| `validation.duplicateName` | An element with this name already exists | يوجد عنصر بهذا الاسم بالفعل |
| `validation.noVariableSelected` | Please select a variable | يرجى اختيار متغير |
| `validation.invalidColor` | Invalid color format | تنسيق لون غير صالح |
| `validation.invalidHexColor` | Color must be a valid hex value (e.g., #FF0000) | يجب أن يكون اللون قيمة هيكس صالحة (مثال: #FF0000) |
| `errors.networkError` | Network error. Please check your connection. | خطأ في الشبكة. يرجى التحقق من اتصالك. |
| `errors.permissionDenied` | You do not have permission to perform this action. | ليس لديك صلاحية لتنفيذ هذا الإجراء. |
| `errors.elementNotFound` | Element not found. It may have been deleted. | العنصر غير موجود. قد تم حذفه. |
| `errors.templateVersionMismatch` | Template version mismatch. Please reload and try again. | تعارض إصدار القالب. يرجى إعادة التحميل والمحاولة مرة أخرى. |
| `errors.serverError` | An unexpected error occurred. Please try again. | حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى. |

### 7.13 Layer Panel Item States

| i18n Key | EN | AR |
|----------|-----|-----|
| `layerPanel.visibility.on` | Visible | مرئي |
| `layerPanel.visibility.off` | Hidden | مخفي |
| `layerPanel.lock.on` | Locked | مقفل |
| `layerPanel.lock.off` | Unlocked | غير مقفل |
| `layerPanel.dragHint` | Drag to reorder | اسحب لإعادة الترتيب |

### 7.14 Mobile-Specific

| i18n Key | EN | AR |
|----------|-----|-----|
| `mobile.elementList.title` | Elements | العناصر |
| `mobile.addElement.fab` | Add Element | إضافة عنصر |
| `mobile.editDialog.title` | Edit Element | تحرير العنصر |
| `mobile.miniCanvas.alt` | Element position preview | معاينة موضع العنصر |
| `mobile.reorder.up` | Move Up | تحريك لأعلى |
| `mobile.reorder.down` | Move Down | تحريك لأسفل |

---

## 8. Non-Functional Requirements (NFRs) — Complete (NEW — Round 2 Enhancement)

### 8.1 Accessibility (WCAG 2.1 AA)

| NFR ID | Requirement | Verification Method |
|--------|-------------|-------------|
| NFR-12.A11Y-1 | All interactive elements have accessible names via `aria-label` or visible labels | axe-core automated + manual screen reader (NVDA/VoiceOver) |
| NFR-12.A11Y-2 | Layer panel implements `role="listbox"` with `role="option"` items; keyboard navigation via ↑/↓ arrows, Space to select | Keyboard-only test |
| NFR-12.A11Y-3 | All dialogs (Delete, Unsaved Changes, Mobile Edit) use MUI `Dialog` with `aria-labelledby` pointing to title; focus trap active on open | axe-core + focus order test |
| NFR-12.A11Y-4 | Color picker provides hex `TextField` as keyboard-accessible alternative to `react-color` ChromePicker | Keyboard test on color field |
| NFR-12.A11Y-5 | Focus indicators visible (2px outline offset 2px) on all interactive elements in both light/dark themes | Manual check |
| NFR-12.A11Y-6 | RTL: Layer panel and property panel mirror horizontally; text alignment RTL for Arabic locale | RTL manual test |
| NFR-12.A11Y-7 | Screen reader announces element selection, property changes, and drag reorder operations | NVDA/VoiceOver manual test |
| NFR-12.A11Y-8 | Mobile FAB has `aria-label="Add Element"`; bottom sheet options are `role="menuitem"` | axe-core mobile |

### 8.2 Mobile Responsive

| NFR ID | Requirement | Verification Method |
|--------|-------------|-------------|
| NFR-12.MOB-1 | Breakpoint: ≤768px → Mobile tier (`ResponsiveViewSwitch`); >768px → Desktop tier | Viewport resize test |
| NFR-12.MOB-2 | Mobile element list: touch targets ≥48×48px; row height ≥56px | Touch target audit |
| NFR-12.MOB-3 | Mobile edit dialog: full-screen `Dialog` with `maxWidth="xs"`; scrollable body | Viewport test |
| NFR-12.MOB-4 | Mobile mini-canvas thumbnail: 120×170px (A4 aspect 1:1.414) read-only preview | Visual test |
| NFR-12.MOB-5 | No `useMediaQuery` in any `.mobile.tsx` file; tier isolation enforced by `ResponsiveViewSwitch` | Lint rule check |
| NFR-12.MOB-6 | Add element bottom sheet: `Modal` with `anchorEl` on FAB; 6 type options with icons | Touch interaction test |

### 8.3 Performance Metrics

| NFR ID | Requirement | Target | Verification Method |
|--------|-------------|--------|-------------|
| NFR-12.PERF-1 | Canvas render (100 elements) | 60fps sustained | React Profiler + Lighthouse |
| NFR-12.PERF-2 | Property panel update latency (keystroke → UI) | <100ms | Performance.mark API |
| NFR-12.PERF-3 | Layer panel reorder (50 elements) drag→drop | <200ms | User timing API |
| NFR-12.PERF-4 | Initial template editor load (cold) | <2.5s LCP | Lighthouse |
| NFR-12.PERF-5 | Apollo cache update after mutation | <50ms | Network timing |
| NFR-12.PERF-6 | Mobile edit dialog open animation | <300ms | Performance observer |
| NFR-12.PERF-7 | Bundle size increase from Plan 12 | <50KB gzipped | `next build` analyzer |

### 8.4 Error Handling & Edge Cases (Per Interaction Point)

| Interaction Point | Edge Cases | Expected Behavior |
|-------------------|------------|-------------------|
| **Add Element** | Template at max elements (configurable limit) | Disable add toolbar, show toast: "Maximum elements reached" |
| | No permission | Hide add toolbar entirely |
| | Network failure mid-create | Rollback optimistic cache, show error toast, retry button |
| **Edit Properties (Property Panel)** | Concurrent edit by another user | On save: 409 conflict → show reload dialog, preserve draft in store |
| | Invalid input (out of bounds, invalid hex) | Inline validation error (red helper text), disable Save button |
| | Navigate away with dirty state | Show Unsaved Changes dialog (Save/Discard/Cancel) |
| | Rotation input: -45 or 405 | Normalize to 315 and 45 respectively; show corrected value |
| | Opacity input: -10 or 150 | Clamp to 0–100; show corrected value |
| **Delete Element** | Last element in template | Allow deletion; layer panel shows empty state |
| | Element locked | Show confirmation: "Element is locked. Delete anyway?" |
| | Network failure | Retry with exponential backoff (3 attempts) |
| **Duplicate Element** | Duplicate would exceed max elements | Block duplicate, show toast |
| | Template version mismatch | Refetch, re-duplicate, notify user |
| **Reorder (Drag in Layer Panel)** | Drop outside drop zone | Cancel drag, no mutation |
| | Multiple rapid reorders | Debounce 300ms, batch into single mutation |
| | Z-index collision (same z-index) | Renormalize to dense 0..N before mutation |
| **Copy/Paste** | Paste into different template | Verify same element types supported; adjust positions to center |
| | Clipboard expired (>5min) | Clear clipboard, show "Clipboard empty" toast |
| | Cross-tab paste | Broadcast via `BroadcastChannel` API |
| **Mobile Reorder (Up/Down Buttons)** | First element → Up disabled | Disable Up button visually and functionally |
| | Last element → Down disabled | Disable Down button visually and functionally |
| **Image Upload** | File > 5MB | Reject with error: "File too large (max 5MB)" |
| | Invalid MIME type | Accept only image/jpeg, image/png, image/webp, image/svg+xml |
| | Upload failure | Retry 3x, then show "Upload failed. Use URL instead." |
| **Font Picker** | Font not loaded | Fallback to `Inter`; show warning toast |
| | Custom font (future) | Not supported in v1; restrict to `ALLOWED_FONTS` |
| **Color Picker** | Alpha channel selected | Ignore alpha; use RGB only; show "Alpha not supported" toast |
| | Invalid hex paste | Revert to previous valid color; show inline error |

---

## 9. Knowledge Propagation Plan (NEW — Round 2 Enhancement)

### 9.1 Documentation to Create/Update

| Document | Location | Owner | Description |
|----------|----------|-------|-------------|
| `ELEMENT_TYPES.md` | `docs/certificates/` | Plan 12 lead | Complete element type reference: all 6 types, properties, validation rules, default values |
| `PROPERTY_PANEL_ARCHITECTURE.md` | `docs/frontend/` | Plan 12 lead | Property panel design: common + type-specific forms, dispatcher pattern, shared controls |
| `LAYER_PANEL_DRAG_REORDER.md` | `docs/frontend/` | Plan 12 lead | @dnd-kit integration: SortableContext, keyboard reorder, accessibility |
| `MOBILE_ELEMENT_EDITOR.md` | `docs/frontend/` | Plan 12 lead | Mobile list + dialog pattern, mini-canvas thumbnail, bottom sheet |
| `ELEMENT_VALIDATION_RULES.md` | `docs/certificates/` | Plan 12 lead | All client + server validation rules per element type with i18n keys |

### 9.2 AGENTS.md Updates Required

| File | Updates Needed |
|------|----------------|
| `frontend/common/views/dashboard/certificates/template-editor/elements/AGENTS.md` | Create new — document ViewModel pattern, type-specific form dispatcher, validation wiring |
| `frontend/desktop/views/dashboard/certificates/template-editor/elements/AGENTS.md` | Create new — document property panel, layer panel, context menu, add element toolbar patterns |
| `frontend/mobile/views/dashboard/certificates/template-editor/elements/AGENTS.md` | Create new — document mobile list, edit dialog, mini-canvas, bottom sheet patterns |
| `frontend/common/stores/AGENTS.md` | Add `templateElementEditorStore` pattern: draft properties, dirty tracking, panel collapse flags |
| `shared/locale/AGENTS.md` | Add `dashboard.certificateTemplateElements` namespace registration pattern |

### 9.3 Skills & Instructions Updates

| Skill/Instruction | Update |
|-------------------|--------|
| `frontend-patterns` skill | Add element property form dispatcher pattern, @dnd-kit sortable integration, mobile list+dialog pattern |
| `fix-import-aliases` skill | Ensure new files use `@/` path aliases correctly |
| `quality-gate` skill | Add Plan 12 specific checks: rotation 0-360 normalization, z-index renormalization, optimistic locking |

---

## 10. Implementation Guide (NEW — Round 2 Enhancement)

### 10.1 Drizzle: Push vs Migrate

| Scenario | Command | When |
|----------|---------|------|
| Local development schema changes (Plan 12 only touches frontend) | `bun run db:push` | Not applicable — Plan 12 has **no database changes**. Database schema for elements was created in Plans 1–4. |
| CI/CD pipeline | `bun run db:migrate` | Run migrations generated by Plans 1–4. Plan 12 does not generate migrations. |

### 10.2 Quality Loop Per File (Mandatory Before Importing Elsewhere)

For **each new file created** in Plan 12, run this sequence BEFORE importing it in another file:

```bash
# 1. Type check (tsgo - fast TypeScript)
bun tsgo --project tsconfig.json <new-file-path>

# 2. Biome format + lint
bun biome:check <new-file-path>

# 3. Lint via queue client (file-scoped, fast)
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"plan12-verify","files":["<new-file-path>"]}'

# 4. If all pass → safe to import elsewhere
```

**Do not skip** — this catches issues at file level before they propagate to the full quality gate.

### 10.3 GraphQL Codegen (After Task 1)

```bash
bun run generate:gqlSchema  # Generate schema from Pothos
bun codegen                 # Generate TypeScript types from schema
```

Run **both** after creating `template-elements.documents.ts`. Verify generated types match `ElementWithDetails` discriminated union in `types/elementEditor.types.ts`.

### 10.4 Test Execution Order

```bash
# Database tests (if any backend changes - Plan 12 has none)
# bun run test:db

# Integration tests (GraphQL - requires dev server)
bun run test:graphql
```

### 10.5 i18n Key Registration (After Task 13)

1. Add namespace to `shared/locale/namespaces/dashboard/certificates/templateElements.namespace.ts`
2. Implement `en/dashboard/certificates/templateElements.ts` and `ar/dashboard/certificates/templateElements.ts`
3. Run `bun tsgo` to verify compile-time type safety
4. Import in ViewModel: `const t = useAppTranslation('dashboard.certificateTemplateElements')`
