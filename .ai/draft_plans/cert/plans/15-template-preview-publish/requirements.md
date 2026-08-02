# Plan 15 — Template Preview & Publishing

## Document Info

| Field | Value |
|-------|-------|
| Plan ID | 15 |
| Title | Template Preview & Publishing |
| Status | Draft |
| Dependencies | Plan 5 (GraphQL API), Plan 6 (PDF Rendering — preview reference), Plan 11 (Visual Canvas — uses canvas elements) |
| Reference | `MASTER_ARCHITECTURE.md`, `cgvs_analysis/01-generation-logic.md` §7, §11, §14, `cgvs_analysis/04-template-ui.md`, `siraj_analysis/05-frontend-patterns.md`, `siraj_analysis/06-i18n-system.md` |

---

## 1. Introduction

### 1.1 Overview

This plan defines the template preview and publishing subsystem for the Siraj certificate module. It covers two major functional areas:

1. **Template Preview** — A client-side visual rendering of the template's background image and all positioned elements, allowing designers to see how the certificate will look with sample variable data populated. This is distinct from PDF rendering (Plan 6) — the preview renders React components positioned over the background image, not a generated PDF.

2. **Publishing Workflow** — A structured lifecycle for templates: draft → validated → published (with version snapshot) → archived. Includes version history tracking, revert-to-version capability, and confirmation dialogs for all state transitions.

### 1.2 Business Value

- Designers can visually verify template appearance before publishing, reducing errors in production certificates
- Publishing creates immutable version snapshots, ensuring certificates generated against a specific version remain consistent even when the template is later modified
- Archive/unarchive workflow allows retiring templates without invalidating existing certificates
- Version history provides audit trail of all published template versions

### 1.3 Scope

| In Scope | Out of Scope |
|----------|-------------|
| Client-side visual preview of template elements | PDF generation (Plan 6) |
| Variable preview with test value input | Canvas element editing (Plan 11) |
| Desktop and mobile preview rendering | Template CRUD operations (Plan 10) |
| Publish workflow with validation | Certificate generation (Plan 16+) |
| Version snapshot creation and history | PDF rendering engine internals |
| Archive and unarchive operations | Template import/export |
| Revert to previous version | Bulk template operations |
| Confirmation dialogs for state transitions | Template cloning |
| Publish validation checks | Template permission management |

---

## 2. Requirements

### 2.1 Template Preview — Visual Rendering

**REQ-PREVIEW-01: Background Image Display**

The system **SHALL** render the template's background image at the correct dimensions within the preview area.

**WHEN** the user opens the template preview,
**THEN** the system **SHALL** load and display the background image at the template's configured width and height,
**AND** the image **SHALL** be positioned as the base layer with all elements rendered on top.

Acceptance Criteria:
- Background image loads from the stored URL
- Image displays at template's configured dimensions (not stretched or distorted)
- Image serves as the positioning context for all elements
- Loading indicator shows while image is fetching

---

**REQ-PREVIEW-02: Element Positioning and Rendering**

The system **SHALL** render all template elements at their configured absolute positions over the background image.

**WHEN** the preview is displayed,
**THEN** each element **SHALL** be rendered at its (x, y) coordinates with its configured width and height,
**AND** each element **SHALL** be rendered according to its type (static_text, data_text, data_date, image, qr_code, barcode, shape),
**AND** text elements **SHALL** display their configured font, size, color, weight, and alignment,
**AND** image elements **SHALL** render with configured object-fit and opacity,
**AND** qr_code elements **SHALL** generate and display a QR code from the element's content (with variable resolution),
**AND** barcode elements **SHALL** generate and display a barcode from the element's content,
**AND** shape elements **SHALL** render as configured geometric shapes (rectangle, circle, line) with stroke/fill styling.

Acceptance Criteria:
- All element types from Plan 11 are rendered: static_text, data_text, data_date, image, qr_code, barcode, shape
- Elements positioned using absolute coordinates (xPct, yPct percentages) relative to the background image origin
- Element dimensions (widthPct, heightPct) respected
- Text rendering uses configured font family, size, color, weight, alignment, line-height, letter-spacing
- Image rendering uses object-fit (contain/cover/none) and opacity
- QR code elements generate QR codes client-side with configurable error correction level and size
- Barcode elements generate barcodes (Code128, EAN13) client-side
- Shape elements render rectangles, circles, lines with stroke width, stroke color, fill color
- Z-order matches element stacking order from element array index
- Data elements (data_text, data_date) resolve variable references ({{variableId}}) from testValues before rendering
- data_date elements format dates according to locale (using shared/locale compile-time i18n date formatting)

---

**REQ-PREVIEW-03: Variable Preview with Test Values**

The system **SHALL** allow users to enter test values for each template variable and see them rendered in the data elements that reference those variables.

**WHEN** the user enters a test value for a variable,
**THEN** all data elements referencing that variable **SHALL** update to display the test value,
**AND** the preview **SHALL** re-render immediately without requiring a page refresh,
**AND** test values **SHALL** be keyed by variableId (stable identifier) to prevent silent breakage on variable rename.

Acceptance Criteria:
- Test value input panel lists all template variables with their types (string, date, boolean, number, image)
- Each variable shows its current test value (defaults to the variable's `previewDefault` if set, empty otherwise)
- Data elements update in real-time as test values change
- Test values are session-only (not persisted to the database)
- Variable types are respected: string → text display, date → formatted date per locale, image → image URL display, boolean → true/false text, number → numeric display
- Test values keyed by variableId (stable UUID), NOT variable name — prevents breakage on variable rename
- Variable input fields rendered by type: text → TextField, date → DatePicker (from @mui/x-date-pickers), boolean → Switch, number → numeric TextField, image → TextField with URL validation
- "Reset to Defaults" button restores all test values to their `previewDefault` values
- Custom recipient entry: manual entry fields for name, email, date, and custom variables
- Sample recipient dropdown (Autocomplete) lists available sample recipients by name, selecting one loads their data into testValues keyed by variableId
- If template has no variables, panel shows "no variables" message
- Input validation: date fields validate date format, number fields validate numeric input, image fields validate URL format
- Placeholder text shows variable's previewDefault or "Enter test value..."
- Test values cleared when closing preview or switching to version preview mode

---

**REQ-PREVIEW-04: Desktop Preview — Full-Size and Zoomable**

The system **SHALL** provide a full-size, zoomable preview on desktop viewports.

**WHEN** the user views the preview on a desktop device,
**THEN** the preview **SHALL** render at the template's actual dimensions,
**AND** the user **SHALL** be able to zoom in and out (10%–200% range),
**AND** the user **SHALL** be able to pan the preview when zoomed beyond the viewport,
**AND** a zoom level indicator **SHALL** display the current zoom percentage,
**AND** zoom/pan state **SHALL** be preserved when switching between draft and version preview modes.

Acceptance Criteria:
- Default zoom level fits the template within the available viewport
- Zoom controls include: zoom in, zoom out, fit-to-screen, actual size (100%)
- Zoom range: minimum 10%, maximum 200%
- Panning enabled when zoomed content exceeds viewport (drag to pan, or click+drag on canvas)
- Zoom level displayed as percentage in toolbar
- Preview maintains rendering quality at all zoom levels (vector text stays crisp, images scale with CSS image-rendering)
- Zoom/pan state preserved when switching to version preview and back
- Keyboard shortcuts: Ctrl/Cmd + Scroll to zoom, Space + Drag to pan
- Double-click on canvas centers the click point and zooms to 100%
- Touch/trackpad pinch-to-zoom supported on compatible devices
- Zoom controls accessible via keyboard (Tab navigation, Enter/Space to activate)

---
 
**REQ-PREVIEW-05: Mobile Preview — Scaled to Screen Width**

The system **SHALL** provide a scaled preview on mobile viewports that fits the screen width.

**WHEN** the user views the preview on a mobile device,
**THEN** the preview **SHALL** be scaled proportionally to fit the screen width,
**AND** the user **SHALL** be able to scroll vertically to view the full template,
**AND** pinch-to-zoom **SHALL** be supported for detail inspection.

Acceptance Criteria:
- Scale factor calculated as: `screenWidth / templateWidth`
- Height adjusted proportionally to maintain aspect ratio
- Vertical scroll enabled when scaled height exceeds viewport
- Pinch-to-zoom supported within 10%–200% range
- No horizontal scroll at default scale (fits screen width)
- Touch scrolling: single finger scrolls vertically
- Two-finger pinch zooms in/out
- After pinch-zoom, single finger drags to pan
- Double-tap zooms to 100% centered on tap point
- Sample data panel collapses into a bottom sheet on mobile (swipe up to expand)
- Toolbar actions (publish, version history) accessible via overflow menu

---
 
**REQ-PREVIEW-06: Preview Rendering Modes**

The system **SHALL** support two preview rendering modes: Screen Mode (interactive) and PDF Simulation Mode (print-fidelity).

**WHEN** the user toggles the rendering mode,
**THEN** Screen Mode **SHALL** render using standard browser layout (CSS positioning, browser fonts, async image loading),
**AND** PDF Simulation Mode **SHALL** simulate PDF rendering constraints (page-break simulation, font subsetting approximation, synchronous image loading, print-media styles),
**AND** the mode **SHALL** be persistable per-user preference.

Acceptance Criteria:
- Screen Mode (default): interactive, zoomable, uses browser text rendering, images load asynchronously, CSS transforms for zoom/pan
- PDF Simulation Mode: disables interactions, applies `@media print` styles, simulates page boundaries if template spans multiple pages, forces synchronous image loading, uses `font-display: block` approximation
- Mode toggle in toolbar: "Screen" / "PDF Preview" (i18n-translated)
- PDF Simulation Mode shows a warning banner: "This simulates PDF output. Exact fidelity only at certificate generation (Plan 6)"
- User preference stored in localStorage with key `cert_preview_rendering_mode`
- Switching modes re-renders the canvas (preserves zoom/pan in Screen Mode, resets in PDF Simulation Mode)
- PDF Simulation Mode useful for checking element clipping at page boundaries, font availability
- Both modes use the SAME element renderer components (shared `PreviewElementRenderer`) — only container/styles differ

---

**REQ-PREVIEW-06b: Download Preview as PDF**

The system **SHALL** allow users to download the previewed template as a PDF file.

**WHEN** the user selects "Download PDF" from the toolbar,
**THEN** the system **SHALL** render the template with current sample data server-side,
**AND** the system **SHALL** generate a PDF file and trigger a browser download.

Acceptance Criteria:
- Download button in toolbar with format toggle (PDF / Image)
- PDF generation calls server endpoint at `app/api/certificates/templates/[templateId]/preview-pdf/route.ts`
- Server endpoint requires `CertificateTemplateView` permission
- PDF includes background image and all elements with current testValues resolved
- Download filename: `template-preview-{templateName}.pdf`
- Loading state shown during PDF generation
- Error state with retry option if generation fails
- PDF uses the same rendering pipeline as Plan 6 certificate generation (Puppeteer/Chrome headless)
- PDF generation passes current testValues (or version snapshot defaults in version preview mode)
- Generated PDF matches PDF Simulation Mode rendering as closely as possible
- Max generation timeout: 30 seconds
- If generation exceeds timeout, return error with suggestion to try Image download instead

---
 
**REQ-PREVIEW-06c: Download Preview as Image**

The system **SHALL** allow users to download the previewed template as a PNG image.

**WHEN** the user selects "Download Image" from the toolbar,
**THEN** the system **SHALL** capture the preview canvas client-side,
**AND** the system **SHALL** generate a PNG file and trigger a browser download.

Acceptance Criteria:
- Image download uses `html2canvas` or similar client-side capture library
- Captures the current canvas state (including zoom/pan if in Screen Mode, full template in PDF Simulation Mode)
- Download filename: `template-preview-{templateName}.png`
- Image quality: high DPI (2x device pixel ratio) for crisp output
- Loading state shown during capture
- Error state with retry option if capture fails
- Image download is instant (client-side, no server round-trip)
- Works in both Screen Mode and PDF Simulation Mode
- In PDF Simulation Mode, captures full template at 100% scale (not viewport-limited)

---
 
**REQ-PREVIEW-07: Concurrency and Unsaved Changes Handling**

The system **SHALL** handle concurrent edits and unsaved changes during preview and publish.

**WHEN** the user opens preview with unsaved editor changes,
**THEN** the preview **SHALL** display a warning banner: "You have unsaved changes in the editor. Preview shows last saved state. Save changes before publishing."
**AND** the Publish button **SHALL** be disabled with tooltip "Save your changes in the editor before publishing"

**WHEN** a concurrent publish occurs while the user has the preview open,
**THEN** the system **SHALL** display a toast: "Template was published by another user. Refreshing..."
**AND** the preview **SHALL** auto-refresh to show the new published version

Acceptance Criteria:
- Preview reads from Zustand editor store (Plan 11) for draft content
- Warning banner shown if Zustand store has `hasUnsavedChanges === true`
- Publish button disabled when `hasUnsavedChanges === true`
- Advisory lock acquired during publish mutation to prevent concurrent publishes
- If editor saves during preview, preview auto-updates (Zustand subscription)
- Concurrent publish detection via Apollo cache invalidation / refetch
- Version history auto-refreshes after successful publish by another user
- Toast notification with action: "View new version" link to version history
- Image download performed client-side via html2canvas or similar library
- Canvas captured at native resolution (not affected by zoom level)
- Download filename: `template-preview-{templateName}.png`
- Loading state shown during capture
- No server round-trip required for image download

---

**REQ-PREVIEW-06: Dedicated Preview Page Route**

The system **SHALL** render the preview on a dedicated page route at `app/(dashboard)/certificates/templates/[templateId]/preview/page.tsx`.

**WHEN** the user navigates to the preview (via editor "Preview" button or template list "Preview" action),
**THEN** the system **SHALL** render a full-page preview with template ID from the route parameter,
**AND** the page **SHALL** include: preview canvas (main area), sample data panel (side or bottom), and toolbar (zoom, download, publish, version history),
**AND** the user **SHALL** be able to navigate back to the editor via a "Back to Editor" button.

Acceptance Criteria:
- Route: `app/(dashboard)/certificates/templates/[templateId]/preview/page.tsx`
- Page is a Server Component that checks `CertificateTemplateView` permission, then renders `PreviewContainer`
- Page generates metadata with title "Preview Template — {templateName}"
- Deep linking supported via optional query params: `?version=<versionId>` (read-only version preview), `?recipient=<recipientId>` (pre-select sample recipient)
- Back navigation: toolbar "Back to Editor" button navigates to template editor route
- A lightweight `PreviewModal` is also available for inline quick-preview from the editor (reuses `CertificatePreviewCanvas` but does NOT include publish/archive/version history)

---

### 2.2 Publishing Workflow

**REQ-PUBLISH-01: Publish Validation**

The system **SHALL** validate the template before publishing. Publication **SHALL** be blocked if any validation check fails.

**WHEN** the user initiates a publish action,
**THEN** the system **SHALL** run all validation checks in parallel,
**AND** if any check fails, the system **SHALL** display a list of all validation errors,
**AND** the publish action **SHALL NOT** proceed.

Validation checks:
1. **Element presence** — Template has at least 1 element
2. **Variable defaults** — All variables marked as required have either a default value or a non-empty `previewValue`
3. **Data element references** — Every data element references a valid, existing template variable
4. **Valid dimensions** — Template has width > 0 and height > 0
5. **No duplicate element names** — (optional, warning-level) No two elements share the same name
6. **Background image** — Template has a valid background image URL (warning if missing, blocks if template has no elements that could provide visual content)
7. **Element bounds** — All elements have valid positions within the template canvas (xPct 0-100, yPct 0-100, widthPct > 0, heightPct > 0)

Acceptance Criteria:
- All validation checks run before any state transition
- All failures are collected and displayed together (not first-failure-stop)
- Each validation error includes: the check name, the specific element/variable at fault, and a human-readable message (i18n-translated)
- Optional checks (like duplicate names) produce warnings but do not block publishing
- Validation results are displayed in a dialog before the user confirms publish
- Validation errors are keyed by machine-readable codes for frontend handling: NO_ELEMENTS, MISSING_REQUIRED_DEFAULT(varName), INVALID_VARIABLE_REF(elementId, varId), INVALID_DIMENSIONS, DUPLICATE_NAMES(count), MISSING_BACKGROUND_IMAGE, INVALID_ELEMENT_BOUNDS(elementId)
- Warnings include: DUPLICATE_NAMES, MISSING_BACKGROUND_IMAGE (if elements exist)
- Validation runs within the publish mutation's transaction (atomic with snapshot creation)

---

**REQ-PUBLISH-02: Version Snapshot Creation**

The system **SHALL** create an immutable version snapshot when a template is published.

**WHEN** the template passes validation and the user confirms the publish action,
**THEN** the system **SHALL** create a version snapshot by copying the current template record (excluding draft-specific fields), all elements, and all variables into version-specific storage,
**AND** the snapshot **SHALL** be linked to the template as the current published version,
**AND** the snapshot **SHALL** reference the previous published version (if any) to form a version chain,
**AND** the template's status **SHALL** transition to "published".

Acceptance Criteria:
- Version snapshot includes: template metadata (name, description, dimensions, background image URL), all elements (with positions, styles, content), all variables (with types, defaults, previewValues)
- Snapshot is immutable — subsequent edits to the draft template do not affect published snapshots
- Version chain: each snapshot references the previous snapshot ID (or null for the first version)
- Version number increments: first publish = v1, subsequent = v2, v3, etc.
- Template status transitions from "draft" to "published"
- Snapshot creation is atomic (all-or-nothing)
- Existing certificates referencing previous versions remain valid

---

**REQ-PUBLISH-03: Cache Invalidation on Publish**

The system **SHALL** invalidate cached certificate renders when a template is published, so certificates generated against the old draft are re-generated using the new published version.

**WHEN** a template is successfully published,
**THEN** the system **SHALL** invalidate any cached renders for existing certificates that reference this template,
**AND** those certificates **SHALL** be re-rendered using the new published version on next access.

Acceptance Criteria:
- Cached certificate renders (from Plan 6 PDF rendering) for the published template are invalidated
- Cached preview entries are cleared
- Existing certificate records remain valid (their certificate data is unchanged — only the render cache is invalidated)
- Invalidation is fire-and-forget (does not block the publish operation)

---

**REQ-PUBLISH-04: Publish Confirmation Dialog**

The system **SHALL** display a confirmation dialog before publishing, summarizing the changes.

**WHEN** validation passes and the user initiates publish,
**THEN** the system **SHALL** display a confirmation dialog containing:
- Template name
- Summary: number of elements, number of variables, template dimensions
- Version number (next version to be created)
- Version notes input field (multiline text area for describing what changed in this version)
- Warning that existing certificates will be re-rendered with the new version
- Warning if the editor has unsaved changes (draft will use last saved state)
- Confirm and Cancel buttons

Acceptance Criteria:
- Dialog shows all summary information before the confirm button
- Version notes input: multiline TextField with label "Version Notes" and placeholder "Describe what changed..."
- Version notes are saved with the version snapshot (stored in `template_versions.notes`)
- Version notes are optional (can be empty)
- Confirm button is labeled "Publish" (i18n-translated)
- Confirm button disabled while mutation is in flight or if validation has errors
- Cancel button returns to preview without publishing
- Dialog text is fully i18n-translated

---

### 2.3 Archive and Unarchive

**REQ-ARCHIVE-01: Archive Template**

The system **SHALL** allow archiving a published template, which prevents new certificate generation while keeping existing certificates valid.

**WHEN** the user archives a published template,
**THEN** the template's status **SHALL** transition from "published" to "archived",
**AND** the template **SHALL NOT** appear as available for new certificate generation,
**AND** existing certificates generated from the template **SHALL** remain valid and accessible.

Acceptance Criteria:
- Status transitions from "published" to "archived"
- Archived templates are excluded from certificate generation template selection
- Existing certificate generation requests referencing the template are not affected (certificates already issued remain valid)
- Archived templates remain visible in the template management list (filtered to "archived" tab)
- Archived template's version history remains accessible

---

**REQ-ARCHIVE-02: Archive Confirmation Dialog**

The system **SHALL** display a warning confirmation dialog before archiving.

**WHEN** the user initiates archive action,
**THEN** the system **SHALL** display a dialog warning that:
- New certificate generation for this template will be prevented
- Existing certificates will remain valid
- The action can be reversed by unarchiving

Acceptance Criteria:
- Dialog clearly states the impact of archiving
- Confirm button labeled "Archive" (i18n-translated)
- Cancel button returns without archiving
- Dialog text is fully i18n-translated

---

**REQ-ARCHIVE-03: Unarchive Template**

The system **SHALL** allow unarchiving a template, returning it to "published" status.

**WHEN** the user unarchives an archived template,
**THEN** the template's status **SHALL** transition from "archived" to "published",
**AND** the template **SHALL** become available for new certificate generation again.

Acceptance Criteria:
- Status transitions from "archived" to "published"
- Template becomes available for certificate generation
- No conflict checks required (the template's published version snapshot remains intact)
- Confirmation dialog shows: the template name, confirmation that it will be available for new certificate generation

---

### 2.4 Revert to Version

**REQ-REVERT-01: Revert to Previous Version**

The system **SHALL** allow reverting the draft template to a previous published version's content.

**WHEN** the user selects a version from the version history and initiates revert,
**THEN** the system **SHALL** create a new draft from the selected version's snapshot (loading the snapshot's elements, variables, and template metadata into the draft),
**AND** the current draft content **SHALL** be replaced with the snapshot content,
**AND** the template's status **SHALL** remain "published" (if currently published) or "draft" (if currently draft).

Acceptance Criteria:
- Revert loads all elements, variables, and metadata from the selected version snapshot into the draft
- Current unsaved draft changes are lost (with confirmation)
- Revert does NOT create a new version (it modifies the draft)
- Revert does NOT change the template's published version — the published version remains intact until the next publish
- After revert, the draft contains the snapshot's content and can be further edited before re-publishing

---

**REQ-REVERT-02: Revert Confirmation Dialog**

The system **SHALL** display a warning dialog before reverting, informing the user that current draft content will be lost.

**WHEN** the user initiates revert to a specific version,
**THEN** the system **SHALL** display a dialog containing:
- The target version number and its publish date
- Warning that the current draft will be replaced
- Warning that any unsaved changes will be lost
- Confirm and Cancel buttons

Acceptance Criteria:
- Dialog shows target version number and date
- Warning text is clear about data loss (current draft replaced)
- Confirm button labeled "Revert to Version" (i18n-translated)
- Cancel button returns without reverting
- Dialog text is fully i18n-translated

---

### 2.5 Version History Panel

**REQ-VERSION-01: Version History Display**

The system **SHALL** display a version history panel showing all published versions of a template.

**WHEN** the user opens the version history panel,
**THEN** the system **SHALL** display a list of all published versions, each showing:
- Version number
- Publish date and time
- Number of elements
- Number of certificates generated from that version
- Revert button (if the version is not the current draft source)
- Published by (user name)

Acceptance Criteria:
- Versions ordered by version number, descending (latest first)
- Each version entry shows: version number, publish date, element count, certificate count
- Certificate count is the number of certificates generated against that specific version
- Revert button is disabled for the version that matches the current draft content
- Revert button hidden if user lacks `CertificateTemplateManage` permission
- Version history is read-only (no editing of published snapshots)
- On desktop, version history renders in a right-side Drawer (400px wide)
- On mobile, version history renders as a full-screen Dialog
- Every version entry has a "Preview" button that switches the canvas to read-only render of that version
- Clicking "Back to Draft" in the toolbar returns to the current draft preview
- Published by field shows the user name of who published the version
- Version notes (if provided during publish) are displayed in each version entry
- Version list supports keyboard navigation (arrow keys, Enter to preview)
- Loading state shown while fetching versions
- Empty state: "No published versions yet" when template has no published versions
- Pagination if more than 20 versions (load more button)
- Tooltip on element count showing breakdown: "X static text, Y data text, Z images, W QR codes, V shapes"

---
 
**REQ-VERSION-02: Version Snapshot Preview**

The system **SHALL** allow previewing a specific version's rendered output without affecting the current draft.

**WHEN** the user clicks "Preview" on a version history entry,
**THEN** the canvas **SHALL** render that version's elements with the background image (read-only),
**AND** the UI **SHALL** clearly indicate "Viewing Version X — Published on [date]" in a banner,
**AND** the test value panel **SHALL** be hidden (version snapshots use saved variable defaults, not test values),
**AND** a "Back to Draft" button **SHALL** be prominently displayed to return to draft editing.

Acceptance Criteria:
- Version preview renders elements from the snapshot (template_version_elements), not from the draft
- Background image from snapshot or current template if not in snapshot
- Test value panel hidden; data elements render with snapshot's variable default values
- Read-only mode: no element selection, no dragging, no editing
- Banner clearly distinguishes version preview from draft preview
- "Back to Draft" returns to draft with test value panel restored
- URL does NOT change when entering version preview (state managed in store, not URL)
- Switching between versions in preview updates the canvas instantly
- Version preview uses the same rendering logic as draft preview (shared element renderer)
- Version preview shows validation warnings if the version had warnings at publish time
- Version preview is not zoomable/panable in PDF Simulation Mode (read-only)
- Deep link supported via `?version=<versionId>` query param for direct version preview links
- Version preview can be shared via URL (includes templateId and versionId)

---
 
### 2.6 Template Status State Machine
 
**REQ-STATUS-01: Status Transitions**

The template status **SHALL** follow a defined state machine:

| From | To | Trigger | Condition |
|------|-----|---------|-----------|
| draft | published | Publish action | Validation passes + user confirms |
| published | archived | Archive action | User confirms |
| archived | published | Unarchive action | User confirms |
| published | draft | Revert to version (creates new draft) | User confirms |
| draft | published | Re-publish (new version) | Validation passes + user confirms |

Acceptance Criteria:
- Invalid transitions are blocked with an error message (e.g., cannot archive a draft template)
- Status is persisted in the template record's `status` field
- Status changes are auditable (timestamped)
- Publish mutation is idempotent: double-click or duplicate request does NOT create two versions (client-side + server-side guard)

---

### 2.7 Desktop Layout

**REQ-LAYOUT-01: Desktop Preview Layout**

The system **SHALL** provide a split-screen layout on desktop viewports (768px and above).

**WHEN** the preview page is rendered on a desktop viewport,
**THEN** the layout **SHALL** consist of:
- Top toolbar: zoom controls, download format toggle + button, publish button, version history button
- Left area (~70% width): preview canvas with pannable/zoomable viewport
- Right area (~30% width, fixed 360px): sample data panel with recipient dropdown and variable inputs
- Version history: opens as right-side Drawer (400px wide)
- All dialogs (publish, archive, revert): MUI Dialog with `maxWidth="sm"`

Acceptance Criteria:
- Layout uses CSS flexbox: toolbar on top, canvas + panel side-by-side below
- Canvas viewport supports horizontal/vertical panning via scroll when zoomed beyond viewport
- Sample data panel is vertically scrollable when content exceeds panel height
- At `lg` breakpoint, panel is 360px; at `md`, panel is 280px
- Dialogs render centered on screen (not full-screen) on desktop

---

### 2.8 Mobile Layout

**REQ-LAYOUT-02: Mobile Preview Layout**

The system **SHALL** provide a stacked layout on mobile viewports (below 768px).

**WHEN** the preview page is rendered on a mobile viewport,
**THEN** the layout **SHALL** consist of:
- Compact toolbar (horizontally scrollable): download button, publish action, version history button
- Full-width preview canvas with pinch-to-zoom support
- Collapsible bottom sheet for sample data panel (collapsed: 56px drag handle; expanded: 50dvh)
- Floating Action Button (FAB) bottom-right for publish (visible only if template is draft and user can publish)
- All dialogs rendered as full-screen MUI Dialog on mobile
- Version history rendered as full-screen dialog

Acceptance Criteria:
- Canvas scales to fit screen width at default zoom level
- Pinch-to-zoom supported via gesture wrapper (0.5x to 3x range)
- Bottom sheet for sample data collapsible via drag handle
- FAB uses theme palette primary color
- No horizontal scroll at default zoom level
- Vertical scroll enabled when canvas height exceeds viewport

---

### 2.9 Permission Requirements

**REQ-PERM-01: Permission Split**

The system **SHALL** enforce two distinct permission levels for preview and publish operations.

| Operation | Required Permission | Enforcement Layer |
|-----------|-------------------|-------------------|
| Open preview page | `certificates.templates.view` | Server Component (redirect if missing) |
| View version history | `certificates.templates.view` | GraphQL query resolver |
| Preview historical version | `certificates.templates.view` | GraphQL query resolver |
| Publish template | `certificates.templates.manage` | GraphQL mutation resolver + frontend UI |
| Archive/Unarchive template | `certificates.templates.manage` | GraphQL mutation resolver + frontend UI |
| Revert to version | `certificates.templates.manage` | GraphQL mutation resolver + frontend UI |

Acceptance Criteria:
- Users with only `CertificateTemplateView` can see preview but cannot publish/archive/revert
- Users with `CertificateTemplateManage` can perform all operations
- Publish/archive/revert buttons are hidden (not just disabled) when user lacks `CertificateTemplateManage`
- GraphQL mutations return `FORBIDDEN` error if mutation resolver check fails
- App Router page redirects to `/unauthorized` if user lacks `CertificateTemplateView`
- Teachers can only archive/unarchive templates they own (enforced in service layer)

---

### 2.10 Interaction States

**REQ-STATE-01: All Interaction States**

The system **SHALL** provide clear visual feedback for all interaction states.

| State | Visual Feedback |
|-------|----------------|
| Template loading | Skeleton placeholder matching template dimensions; toolbar disabled |
| Versions loading | Skeleton rows in version history panel |
| Publishing | CircularProgress on confirm button; dialog non-dismissible during flight |
| Archiving | CircularProgress on confirm button; dialog non-dismissible |
| Reverting | CircularProgress on confirm button; dialog non-dismissible |
| Downloading | CircularProgress on download button; format toggle disabled |
| Template not found | Centered empty state with "template not found" message and back button |
| Template access denied | Server redirect to /unauthorized |
| Template query error | Centered error icon with retry button in canvas |
| Publish error | Error Snackbar with failure message; dialog remains open for retry |
| Publish success | Success Snackbar with version number; dialog closes; status updates |
| Archive/Revert success/error | Snackbar notification (success or failure) |
| Empty template (no elements) | Centered "no elements" message in canvas |
| No variables | "No variables" message in sample data panel |
| No versions | "No published versions" in version history |
| Version preview mode | Read-only banner; inputs disabled; "Back to Draft" button replaces publish |
| Unsaved editor changes | Warning banner in publish dialog; dot indicator on publish button |

---

## 3. i18n Requirements

### 3.1 Namespace Structure

All translation keys for this plan reside in the `Dashboard` translation tree under sub-domain `certificatePreview`.

**Translation handle**: `Translation.Dashboard.CertificatePreview`
**Client access**: `useAppTranslation(Translation.Dashboard.CertificatePreview)` → `t.dashboardTranslations.certificatePreview.*`
**Server access**: `getTranslations(locale).dashboardTranslations.certificatePreview.*`

All keys are organized in sections: `shell`, `toolbar`, `sampleData`, `previewCanvas`, `publishDialog`, `validation`, `archive`, `unarchive`, `revert`, `versionHistory`, `notifications`.

See design.md §8.3 for the complete key list with EN/AR values for every key.

### 3.2 Key Sections Summary

The following sections are defined in design.md §8.3 with full EN/AR values. Requirements for each section:

| Section | Keys Cover | Pluralization | Interpolation |
|---------|-----------|---------------|---------------|
| `shell` | Page title, subtitle, back to editor, empty message, permission denied | — | — |
| `toolbar` | Zoom in/out, fit to screen, actual size, zoom level, download PDF/image, publish, version history, archive, unarchive, back to draft | `zoomLevel` (percentage) | — |
| `sampleData` | Title, select recipient, custom data, variable name, test value, placeholder, no variables, reset to defaults | — | — |
| `previewCanvas` | Loading, rendering, error, no background, empty template, version preview | — | `versionPreview` (version number) |
| `publishDialog` | Title, confirm title, confirm message, summary stats, version notes label/placeholder, warnings, success/failed, confirm/cancel | `elementCount`, `variableCount` | `confirmTitle` (version number), `dimensions` (width × height) |
| `validation` | Title, passed, failed, no elements, missing default, invalid ref, invalid dimensions, duplicate names | `failed` (count) | `missingDefaultValue` (name), `invalidVariableRef` (name) |
| `archive` | Title, confirm title/message, success/failed | `confirmMessage` (cert count) | — |
| `unarchive` | Confirm title/message, success/failed | — | — |
| `revert` | Title, confirm message, certs not affected warning, success/failed | — | `confirmMessage` (version + date), `success` (version) |
| `versionHistory` | Title, version number, published date, published by, element count, certificate count, no versions, current, preview, revert | `elementCount`, `certificateCount` | `versionNumber` (version) |
| `notifications` | Publish/archive/unarchive/revert success/failed with error interpolation | — | `publishSuccess` (version), `*Failed` (error) |
### 3.3 Pluralization & Interpolation

Pluralization and interpolation rules follow the patterns specified in design.md §8.4 and §8.5. Key requirements:

- Plural keys use `(count: number) => string` function type with Arabic grammar branching (zero/one/two/few/many)
- Interpolation keys use named-arg object pattern: `(params: { name: string, ... }) => string`
- All keys with `{paramName}` placeholders in EN must have corresponding `{paramName}` in AR
- Type definitions reside in `shared/locale/` compile-time TypeScript system
- No hardcoded error strings — all user-facing text uses typed translation functions


---

## 4. AGENTS.md & Instruction Files

### 4.1 Applicable AGENTS.md Files

The following AGENTS.md files apply to this plan's implementation:

| Layer | Path | Relevance |
|-------|------|-----------|
| Root | `AGENTS.md` | Always applicable — lint queue, quality gate, logging, path aliases |
| App Router | `app/AGENTS.md` | Route structure for template editor pages |
| Shared | `shared/AGENTS.md` | i18n namespace additions |
| Frontend Views | `frontend/views/AGENTS.md` | Container+ViewModel+DesktopView+MobileView pattern |
| Frontend Stores | `frontend/common/stores/AGENTS.md` | Zustand store creation |
| Frontend GraphQL | `frontend/common/graphql/AGENTS.md` | GraphQL document conventions |
| Backend Services | `backend/services/AGENTS.md` | Publish/archive/revert service methods |
| Backend GraphQL | `backend/graphql/AGENTS.md` | Pothos mutations and queries |
| Backend Types | `backend/types/AGENTS.md` | Type definitions for version snapshots |
| Backend Repositories | `backend/db/repo/AGENTS.md` | Version snapshot repository methods |

### 4.2 Applicable Instruction Files

| File | Path | Relevance |
|------|------|-----------|
| Frontend | `.github/instructions/frontend.instructions.md` | MUI v9, React 19, Apollo Client v4, Zustand patterns |
| Backend | `.github/instructions/backend.instructions.md` | Service patterns, repository patterns, Pothos patterns |

---

## 5. Outcome & Knowledge Tracking

### 5.1 Expected Outcomes

| Outcome | Description | Verification |
|---------|-------------|-------------|
| Preview rendering | Visual preview renders all element types over background image at correct positions | Manual verification in dev server |
| Variable preview | Test values update data elements in real-time | Manual verification — type a value, see it reflected |
| Desktop zoom | Zoom controls work within 10%–200% range | Manual verification — zoom in/out/fit/actual |
| Mobile scaling | Preview scales to screen width without horizontal scroll | Manual verification on mobile viewport |
| Publish workflow | Publish creates version snapshot, transitions status, invalidates cache | Integration test on GraphQL mutation |
| Validation | All 5 validation checks fire and block publishing when failed | Manual verification — create empty template, try publish |
| Archive/unarchive | Status transitions correctly, archived templates excluded from generation | Manual verification |
| Revert | Revert loads snapshot content into draft, shows confirmation dialog | Manual verification |
| Version history | Panel shows all published versions with correct metadata | Manual verification after multiple publishes |
| i18n | All keys present in both English and Arabic, pluralization correct | tsgo type check + manual verification |

### 5.2 Knowledge Propagation

| Knowledge Item | Description |
|----------------|-------------|
| Version snapshot schema | The `template_versions` table structure and its relationship to templates, elements, and variables |
| Publish mutation contract | The GraphQL publish mutation signature and response shape |
| Preview rendering approach | How client-side preview renders elements without PDF generation |
| Cache invalidation mechanism | How publish triggers render cache invalidation |
| State machine transitions | The valid status transitions and their triggers |

This knowledge must be captured in the design document and propagated to dependent plans (Plan 16+) through the design's Outcome & Knowledge Transfer section.

---

## 6. Testing Requirements

### 6.1 Component Tests (Happy DOM)

| Component | Test Cases | Mocks Required |
|----------|-----------|----------------|
| CertificatePreviewCanvas | Renders all 5 element types at correct positions; shows skeleton on loading; shows error on failure; shows empty state when no elements; renders read-only banner when readOnly=true | Apollo mock for template query |
| SampleDataPanel | Renders one input per variable type (text, date, boolean, number); shows "no variables" when empty; calls onTestValueChange on input; calls onResetSampleData on reset click; loads recipient data on selection | ViewModel mock |
| PreviewToolbar | Zoom buttons call correct handlers; download format toggle works; publish button disabled when not draft; version history button calls handler; archive button hidden without canManage; "Back to Draft" replaces publish in version mode | ViewModel mock |
| PublishDialog | Shows summary (name, dimensions, element count, variable count); version notes input updates on change; confirm disabled when loading or validation errors; shows unsaved changes warning when hasUnsavedChanges=true; shows re-render warning | ViewModel mock, validation result mock |
| ArchiveDialog | Shows template name; shows certificate count warning; confirm triggers mutation; cancel closes dialog | ViewModel mock |
| UnarchiveDialog | Shows confirm message; confirm triggers mutation; cancel closes | ViewModel mock |
| RevertDialog | Shows target version number and date; shows "certs not affected" warning; confirm triggers mutation; cancel closes | ViewModel mock |
| VersionHistory | Renders list of versions newest first; shows "no versions" when empty; preview button calls onPreviewVersion; revert button hidden without canManage; current version badge shows | Apollo mock for versions query |
| DownloadPreviewButton | PDF format triggers server call; image format triggers client-side canvas capture; loading spinner shown during download; disabled when no elements | html2canvas mock |

### 6.2 E2E Tests (Production Server)

| Test | Steps | Expected |
|------|-------|----------|
| Preview page loads | Navigate to `/certificates/templates/{id}/preview`; wait for canvas | Canvas shows background image + elements; toolbar visible; sample data panel visible |
| Sample data updates preview | Open preview; type a value in sample data panel for a variable | Canvas data element updates to show typed value |
| Zoom controls (desktop) | Click zoom in button 3 times; click zoom out; click fit to screen; click actual size | Canvas scales accordingly; zoom % label updates |
| Download as image | Click format toggle to "Image"; click download button | File download triggered with .png extension |
| Publish workflow | Click publish button; dialog opens; click confirm | Success snackbar shows version number; template status updates |
| Publish validation blocks | Create empty template (no elements); click publish | Dialog shows validation errors; confirm button disabled |
| Archive workflow | Click archive; dialog opens; click confirm | Success snackbar; status changes to archived; archive button replaced by unarchive |
| Version history | Publish a template; open version history | Version entry shows v1 with correct date/element count |
| Version preview | Open version history; click preview on v1 | Canvas switches to read-only mode; "Back to Draft" button visible |
| Revert to version | Open version history; click revert on v1; confirm | Success snackbar; canvas re-renders with v1 content |
| Deep link to version | Navigate to `?version={vId}` URL | Page loads in version preview mode directly |
| Permission gating | Login as user without `CertificateTemplateManage`; navigate to preview | Publish/archive/revert buttons hidden |

### 6.3 GraphQL Integration Tests

| Test | Description |
|------|-------------|
| PublishTemplate mutation | Mutation creates version snapshot, transitions status, returns version number |
| PublishTemplate validation failure | Mutation returns success=false with errors array when validation fails |
| PublishTemplate permission denied | Mutation returns FORBIDDEN when user lacks CertificateTemplateManage |
| ArchiveTemplate mutation | Transitions published→archived; returns updated template |
| ArchiveTemplate invalid state | Archiving a draft returns error (invalid transition) |
| UnarchiveTemplate mutation | Transitions archived→published; returns updated template |
| RevertTemplate mutation | Loads version snapshot into draft; returns success + sourceVersionNumber |
| TemplateVersions query | Returns all versions for a template, ordered by version number descending |
| TemplateForPreview query | Returns template with elements, variables, background for preview rendering |
| TemplateForPreview with versionId | Returns version-specific elements and variables instead of draft |

---

## 7. Acceptance Criteria Index

| AC ID | Requirement | Description |
|-------|-------------|-------------|
| AC-PREVIEW-01 | REQ-PREVIEW-01 | Background image displays at template dimensions without distortion |
| AC-PREVIEW-02 | REQ-PREVIEW-02 | All 5 element types (text, image, QR, barcode, data) render at correct positions with correct styling |
| AC-PREVIEW-03 | REQ-PREVIEW-03 | Entering test values in sample data panel updates data elements in real-time |
| AC-PREVIEW-04 | REQ-PREVIEW-04 | Desktop zoom controls work: in/out (10-200%), fit-to-screen, actual size, pannable |
| AC-PREVIEW-05 | REQ-PREVIEW-05 | Mobile preview scales to screen width, pinch-zoom works, vertical scroll enabled |
| AC-PREVIEW-06 | REQ-PREVIEW-06 | Preview page route renders correctly; back navigation works; metadata generated |
| AC-PREVIEW-06a | REQ-PREVIEW-06a | Sample data panel: recipient dropdown, variable inputs, reset button, no-variables state |
| AC-PREVIEW-06b | REQ-PREVIEW-06b | PDF download triggers server endpoint, returns blob, download filename correct |
| AC-PREVIEW-06c | REQ-PREVIEW-06c | Image download captures canvas client-side, downloads PNG, no server round-trip |
| AC-PUBLISH-01 | REQ-PUBLISH-01 | All 5 validation checks fire; failures collected and displayed together; blocking stops publish |
| AC-PUBLISH-02 | REQ-PUBLISH-02 | Version snapshot is atomic, immutable, includes all elements+variables, forms version chain |
| AC-PUBLISH-03 | REQ-PUBLISH-03 | Render cache invalidated on publish; existing certificates re-rendered on next access |
| AC-PUBLISH-04 | REQ-PUBLISH-04 | Publish dialog shows summary, version notes, warnings, confirm/cancel; notes saved with snapshot |
| AC-ARCHIVE-01 | REQ-ARCHIVE-01 | Archive transitions published→archived; archived excluded from generation; existing certs valid |
| AC-ARCHIVE-02 | REQ-ARCHIVE-02 | Archive dialog shows impact warnings; confirm/cancel labels i18n-translated |
| AC-ARCHIVE-03 | REQ-ARCHIVE-03 | Unarchive transitions archived→published; template available for generation again |
| AC-REVERT-01 | REQ-REVERT-01 | Revert loads version snapshot into draft; does not create new version; published version intact |
| AC-REVERT-02 | REQ-REVERT-02 | Revert dialog shows version number, date, data loss warning; confirm/cancel i18n-translated |
| AC-VERSION-01 | REQ-VERSION-01 | Version history shows all versions (newest first) with metadata; desktop=Drawer, mobile=Dialog |
| AC-VERSION-02 | REQ-VERSION-02 | Version preview: read-only banner, inputs disabled, Back to Draft replaces publish, deep link works |
| AC-STATUS-01 | REQ-STATUS-01 | State machine transitions valid; invalid transitions blocked; publish idempotent |
| AC-LAYOUT-01 | REQ-LAYOUT-01 | Desktop: split layout (canvas 70% + panel 30%), toolbar on top, drawer for versions |
| AC-LAYOUT-02 | REQ-LAYOUT-02 | Mobile: stacked layout, pinch zoom, bottom sheet, FAB, full-screen dialogs |
| AC-PERM-01 | REQ-PERM-01 | View permission gates page access; manage permission gates publish/archive/revert; teacher ownership |
| AC-STATE-01 | REQ-STATE-01 | All 17 interaction states show correct visual feedback (loading, error, success, empty, edge-case) |
| AC-I18N-01 | §3 | All keys in both EN/AR; pluralization follows Arabic rules; interpolation uses typed functions |
