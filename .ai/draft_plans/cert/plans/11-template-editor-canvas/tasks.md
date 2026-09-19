# Plan 11 — Template Editor: Visual Canvas (Tasks)

> **Plan #:** 11 · **Title:** Template Editor — Visual Canvas
> **Dependencies:** Plan 5 (GraphQL), Plan 10 (Template Editor Basic)
> **Dependents:** Plan 12 (Element Management), Plan 15 (Preview & Publishing)
> **Scope:** Canvas rendering, selection, drag-move, resize, rotation, snap guides, zoom/pan (react-zoom-pan-pinch), rulers, keyboard shortcuts, undo/redo, 6 element types, per-type property panel, desktop + mobile views, optimistic-locking save, auto-save, i18n, permissions
> **Target:** Desktop-primary with mobile support (tier-isolated architecture)
> **Execution Model**: Parallel subagents per independent task group (see dependency graph for parallelization points)

---

## Task Dependency Graph

```
T01: Canvas Types (CanvasElement, CanvasState, CanvasTool, InteractionState)
  ├──> T02: i18n Namespace (types + en + ar)
  └──> T03: Zustand Canvas Store (certCanvasStore)
        ├──> T04: Canvas Surface + TransformWrapper (react-zoom-pan-pinch)
        │      ├──> T05: Background Layer + Grid Overlay
        │      └──> T06: ElementRenderer + SelectionFrame + ResizeHandles + RotationHandle
        │            ├──> T07: Drag-to-Move + Snap-to-Grid + Alignment Guides
        │            └──> T08: Element Property Panel (per-type layouts)
        ├──> T09: Canvas Toolbar (desktop) + Context Menu
        ├──> T10: Ruler + ZoomControls + Keyboard Shortcuts
        │      ├──> T10a: TextNode Component
        │      ├──> T10b: ImageNode Component
        │      ├──> T10c: ShapeNode Component
        │      ├──> T10d: QRCodeNode Component
        │      ├──> T10e: SignatureNode Component
        │      ├──> T10f: BackgroundNode Component
        │      ├──> T10g: ElementLibraryPalette Component
        │      ├──> T10h: CanvasContextMenu Component
        │      ├──> T10i: useCanvasStore Zustand Store (React Flow)
        │      ├──> T10j: Custom Resize & Rotate Handle Components
        │      ├──> T10k: Alignment Guide Overlay Component
        │      ├──> T10l: Keyboard Shortcut Handler
        │      ├──> T10o: Quality Loop Per File
        │      └──> T10p: Knowledge Propagation & Documentation Update
        ├──> T11: Mobile View (FAB, bottom sheet, touch gestures)
        ├──> T12: ViewModel + Container + App Router Page + GraphQL Documents
T01..T12, T10a..T10p ──> T14: Quality Gate (tsgo, biome, lint, codescene)
T14 ──> T15: Knowledge Propagation & Documentation
```

**Execution order**: T01 → (T02, T03 via parallel subagents after T01) → T04 → (T05, T06 via parallel subagents after T04) → (T07, T08 via parallel subagents after T06) → (T09, T10, T11, T12 via parallel subagents after T03/T04) → (T10a, T10b, T10c, T10d, T10e, T10f, T10g, T10h, T10i, T10j, T10k, T10l via parallel subagents after T10) → (T10o, T10p via parallel subagents after T10a-T10l) → T14 → T15

---

## Parallel Subagent Strategy

Tasks grouped by wave (each wave runs as parallel subagents):

### Wave 1: T01
- Tasks: T01 (Canvas Type Definitions)
- Rationale: Foundation task — all other tasks depend on the type definitions. No parallelization possible at this stage.

### Wave 2: T02, T03
- Tasks: T02 (i18n Namespace), T03 (Zustand Canvas Store)
- Rationale: Both depend only on T01 (types). They touch disjoint module surfaces (locale files vs. Zustand store) and have no interdependencies.

### Wave 3: T04
- Tasks: T04 (CanvasArea + CanvasViewport + CanvasContainer)
- Rationale: Depends on T03 store. Single-task wave because T05 and T06 both extend T04's ElementRenderer output.

### Wave 4: T05, T06
- Tasks: T05 (Drag-to-Move), T06 (Resize Handles)
- Rationale: Both depend on T04 (ElementRenderer + SelectionFrame). Drag and resize touch separate interaction state branches (`dragging` vs. `resizing`) and disjoint component props.

### Wave 5: T07, T08
- Tasks: T07 (Rotation Handle), T08 (Snap-to-Grid + Alignment Guides)
- Rationale: Both extend T06's SelectionHandles. Rotation adds a `rotating` interaction branch; snap/guides add a parallel guide-rendering layer. Disjoint concerns.

### Wave 6: T09, T10, T11, T12
- Tasks: T09 (Canvas Toolbar), T10 (Rulers + Keyboard Shortcuts + Zoom/Pan), T11 (Mobile View), T12 (ViewModel + Container + GraphQL)
- Rationale: All depend on the store (T03) and/or the surface (T04) which are complete by Wave 3/4. Toolbar, rulers/shortcuts, mobile view, ViewModel/GraphQL wiring target separate files and have no interdependencies among each other.

### Wave 7: T10a, T10b, T10c, T10d, T10e, T10f, T10g, T10h, T10i, T10j, T10k, T10l
- Tasks: All T10a–T10l React Flow sub-components
- Rationale: All depend on T10 (Ruler/Zoom/Keyboard foundation) and the store (T03). Each component owns its own file (`nodes/TextNode.tsx`, `nodes/ImageNode.tsx`, etc.) with no cross-imports until integration. The palette (T10g), context menu (T10h), store (T10i), handles (T10j), overlay (T10k), and shortcut handler (T10l) all target disjoint modules.

### Wave 8: T10o, T10p
- Tasks: T10o (Quality Loop), T10p (Knowledge Propagation)
- Rationale: T10o applies the per-file quality loop over the new files after Wave 7. T10p propagates learnings to docs. Quality and docs touch disjoint file sets.

### Wave 9: T14
- Tasks: T14 (Quality Gate)
- Rationale: Full quality-gate run (tsgo → biome → lint → codescene → sonar) over the entire plan output. Must run after every implementation task in T01–T12 and T10a–T10p is complete.

### Final Wave: Knowledge Propagation
- Task: T15 (Knowledge Propagation & Documentation)
- Rationale: Must run after T14 quality gate passes. Updates AGENTS.md, IMPLEMENTATION_LEARNINGS.md, COMPONENT_PATTERNS.md, and instruction files with the final canonical patterns.

> **Subagent dispatch**: Each task in a wave is dispatched as a separate subagent. The orchestrator waits for all subagents in a wave to complete before starting the next wave.

---

## Phase 1: Types, Store & i18n

### T01: Canvas Type Definitions (~4h)

**Objective:** Create all TypeScript types for the canvas: the `CanvasElement` discriminated union, `CanvasState`, `CanvasTool` enum, `InteractionState` union, `GuideLine`, `CanvasViewport` metrics, and history snapshot types.

**Subtasks:**
- [ ] 1.1 Create `frontend/common/views/dashboard/cert-canvas/types/canvasElement.ts`:
  - Define `CanvasElement` discriminated union with 6 member types (aligned with INTER_PLAN_CONTRACTS `CertificateElementType` enum):
    - `CanvasTextElement` — `{ type: 'static_text'; id; x; y; width; height; rotation; zIndex; content; fontFamily; fontSize; fontWeight; fontStyle; color; textAlign; lineHeight; overflow }`
    - `CanvasDataTextElement` — `{ type: 'data_text'; id; x; y; width; height; rotation; zIndex; variableId; fontFamily; fontSize; fontWeight; fontStyle; color; textAlign; lineHeight; overflow }`
    - `CanvasDataDateElement` — `{ type: 'data_date'; id; x; y; width; height; rotation; zIndex; variableId; dateFormat; fontFamily; fontSize; fontWeight; fontStyle; color; textAlign; lineHeight }`
    - `CanvasImageElement` — `{ type: 'image'; id; x; y; width; height; rotation; zIndex; src; objectFit; opacity; borderRadius }`
    - `CanvasQrCodeElement` — `{ type: 'qr_code'; id; x; y; width; height; rotation; zIndex; contentVariable; errorCorrectionLevel }`
    - `CanvasShapeElement` — `{ type: 'shape'; id; x; y; width; height; rotation; zIndex; shapeType; fillColor; strokeColor; strokeWidth; borderRadius }`
  - All coordinate fields are `number` in template-pixels at 96 DPI
  - `id` is `string` (UUID)
  - `overflow` field: `'clip' | 'shrink'` (v1 always `clip`; `shrink` is v2)

- [ ] 1.2 Create `frontend/common/views/dashboard/cert-canvas/types/canvasState.ts`:
  - `CanvasTool` enum: `'select' | 'pan' | 'marquee'`
  - `InteractionState` discriminated union:
    - `{ type: 'idle' }`
    - `{ type: 'dragging'; elementIds: string[]; startX: number; startY: number; originalPositions: Record<string, { x: number; y: number }> }`
    - `{ type: 'resizing'; elementId: string; handle: ResizeHandlePosition; startX: number; startY: number; originalState: { x; y; width; height } }`
    - `{ type: 'rotating'; elementId: string; centerX: number; centerY: number; startAngle: number; originalRotation: number }`
    - `{ type: 'marquee'; startX: number; startY: number; currentX: number; currentY: number }`
  - `ResizeHandlePosition` type: `'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'`
  - `GuideLine` type: `{ id: string; orientation: 'horizontal' | 'vertical'; position: number }`
  - `CanvasViewport` type: `{ scale: number; positionX: number; positionY: number }`
  - `HistorySnapshot` type: `{ elements: CanvasElement[]; selectedIds: string[]; action: string }`

- [ ] 1.3 Create `frontend/common/views/dashboard/cert-canvas/types/canvasUtils.ts`:
  - `SnapResult` type: `{ snappedX: number; snappedY: number; guides: GuideLine[] }`
  - `AlignmentGuide` type for computed guide data
  - `CanvasMetrics` type: `{ widthPx: number; heightPx: number; widthMm: number; heightMm: number; dpi: number }`

- [ ] 1.4 Create barrel export `frontend/common/views/dashboard/cert-canvas/types/index.ts`

- [ ] 1.5 Write outcome file: `.ai/plans/cert-plan-11/outcome/T01-canvas-types-outcome.md`

**Files to Create:**
- `frontend/common/views/dashboard/cert-canvas/types/canvasElement.ts`
- `frontend/common/views/dashboard/cert-canvas/types/canvasState.ts`
- `frontend/common/views/dashboard/cert-canvas/types/canvasUtils.ts`
- `frontend/common/views/dashboard/cert-canvas/types/index.ts`

**Requirements References:** REQ-11-01, REQ-11-20 (element types and properties)

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-canvas/types/canvasElement.ts --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`
- Verify: `@/` path aliases, no `console.*`, discriminated union pattern (inline type-specific props, NOT `props: Record<string, unknown>`)

---

### T02: i18n Translation Namespace (~3h)

**Objective:** Create the compile-time i18n type file and both English and Arabic translation implementations for the `Translation.Dashboard.CertificateCanvas` namespace.

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T03 (Zustand Canvas Store). Both depend only on T01 (types) and touch disjoint module surfaces (locale files vs. Zustand store).

**Subtasks:**
- [ ] 2.1 Create type file `shared/locale/types/dashboard/certificates/canvas.ts`:
  - Define `CertificatesCanvasTranslations` interface with all keys from design.md §12:
    - `toolbar.*` — 18 keys (addElement, addText, addImage, addShape, addQrCode, addDate, undo, redo, save, saveSuccess, saveError, zoomIn, zoomOut, fitToScreen, resetZoom, toggleGrid, toggleSnap, toggleRulers)
    - `contextMenu.*` — 10 keys (cut, copy, paste, duplicate, delete, bringToFront, sendToBack, reorderForward, reorderBackward, properties)
    - `elementType.*` — 6 keys (staticText, dataText, dataDate, image, qrCode, shape)
    - `shapeType.*` — 3 keys (rectangle, ellipse, line)
    - `property.*` — 25+ keys (position, size, x, y, width, height, rotation, content, fontFamily, fontSize, fontWeight, fontStyle, color, textAlign, lineHeight, src, objectFit, opacity, borderRadius, shapeType, fillColor, strokeColor, strokeWidth, errorCorrectionLevel, variableId, dateFormat)
    - `status.*` — 20+ keys (loading, saving, saved, autoSaving, autoSaved, loadError, saveError, versionConflict, readOnlyMode, readOnlyDescription, textOverflowWarning, noElementsSelected, emptyCanvas, etc.)
    - `dialog.*` — 8 keys (discardChangesTitle, discardChangesMessage, versionConflictTitle, versionConflictMessage, versionConflictReload, versionConflictOverwrite, shortcutHelpTitle, shortcutHelpClose)
    - `layerList.*` — 4 keys (title, element, locked, visible)
    - `alignment.*` — 8 keys (alignLeft, alignCenter, alignRight, alignTop, alignMiddle, alignBottom, distributeHorizontal, distributeVertical)
    - `shortcut.*` — 14 keys (undo, redo, save, copy, paste, duplicate, delete, bringToFront, sendToBack, selectAll, zoomIn, zoomOut, resetZoom, escape)
    - `aria.*` — 6 keys with interpolation (canvasAriaLabel, elementSelectedAriaLabel, draggingAriaLabel, resizingAriaLabel, rotatingAriaLabel, clipboardPastedAriaLabel)
  - Pluralization: `(count: number) => string` patterns where applicable (e.g., `elementsSelected: (count: number) => string`)
  - Interpolation: `(param: string) => string` patterns for dynamic values

- [ ] 2.2 Create English implementation `shared/locale/en/dashboard/certificates/canvas.ts`:
  - Implement all keys from the type file
  - Provide English values for all toolbar labels, context menu items, property labels, status messages, dialog text, layer list, alignment, shortcut tooltips, ARIA labels
  - Implement pluralization: `elementsSelected: (count) => count === 1 ? "1 element selected" : \`${count} elements selected\``
  - Implement interpolation: `aria.elementSelectedAriaLabel: (name) => \`${name} selected\``

- [ ] 2.3 Create Arabic implementation `shared/locale/ar/dashboard/certificates/canvas.ts`:
  - Implement all keys with Arabic translations
  - Use correct Arabic pluralization rules (dual form for 2, plural for 3-10, singular for 11+)
  - RTL-aware strings
  - Interpolation with Arabic grammar

- [ ] 2.4 Register namespace in translation system:
  - Add `CertificatesCanvas` to `Translation.Dashboard` type (in `shared/locale/types/dashboard/index.ts` or equivalent)
  - Add imports in `shared/locale/en/dashboard/index.ts`, `shared/locale/ar/dashboard/index.ts`

- [ ] 2.5 Write outcome file: `.ai/plans/cert-plan-11/outcome/T02-i18n-outcome.md`

**Files to Create:**
- `shared/locale/types/dashboard/certificates/canvas.ts`
- `shared/locale/en/dashboard/certificates/canvas.ts`
- `shared/locale/ar/dashboard/certificates/canvas.ts`

**Files to Modify:**
- `shared/locale/types/dashboard/index.ts` (or the relevant registration file)
- `shared/locale/en/dashboard/index.ts`
- `shared/locale/ar/dashboard/index.ts`

**Requirements References:** REQ-11-i18n (§3), design.md §12

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts shared/locale/types/dashboard/certificates/canvas.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts shared/locale/en/dashboard/certificates/canvas.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts shared/locale/ar/dashboard/certificates/canvas.ts --lifecycle codescene
```

**Instruction Verification:**
- Read `shared/AGENTS.md` — critical: shared layer MUST NOT import from `@/frontend/**`, `@/backend/**`, or `@/app/**`
- Read `.agents/instructions/frontend.instructions.md`
- Verify: nested TS object fields (NOT dot-nested strings), `@/shared/` imports only, compile-time type safety

---

### T03: Zustand Canvas Store (~5h)

**Objective:** Create the session-only Zustand store (`certCanvasStore.ts`) with all state fields, 26 actions, past/future history stacks with 500ms coalescing, clipboard, selection (string[] not Set), and save protocol with optimistic locking.

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T02 (i18n Namespace). Both depend only on T01 (types) and touch disjoint module surfaces (Zustand store vs. locale files).

**Subtasks:**
- [ ] 3.1 Create `frontend/common/stores/certCanvasStore.ts` with the following state fields:
  - `elements: CanvasElement[]` — live, unsaved element positions/sizes/rotation (sorted by zIndex)
  - `savedElements: CanvasElement[]` — last saved snapshot for dirty comparison
  - `savedVersion: number` — last saved version number for optimistic locking
  - `selectedIds: string[]` — currently selected element IDs (NOT Set — Zustand immutable arrays)
  - `interactionState: InteractionState` — discriminated union (idle | dragging | resizing | rotating | marquee)
  - `activeTool: CanvasTool` — 'select' | 'pan' | 'marquee'
  - `scale: number` — zoom scale (default 1.0, clamped 0.25–4.0)
  - `positionX: number` — pan X offset
  - `positionY: number` — pan Y offset
  - `isGridEnabled: boolean` (default true)
  - `gridSize: number` (default 10, in template pixels)
  - `snapToGrid: boolean` (default true)
  - `snapToElements: boolean` (default true)
  - `showRulers: boolean` (default true)
  - `showGuides: boolean` (default true)
  - `activeGuides: GuideLine[]` — alignment guides during drag
  - `past: HistorySnapshot[]` — undo stack (max 50)
  - `future: HistorySnapshot[]` — redo stack (max 50)
  - `clipboard: CanvasElement[]` — cut/copy buffer
  - `isDirty: boolean` — derived: `JSON.stringify(elements) !== JSON.stringify(savedElements)`
  - `isSaving: boolean` — save mutation in progress
  - `isReadOnly: boolean` — user lacks `certificates.templates.manage` permission
  - `canvasWidthMm: number` (default 210 for A4)
  - `canvasHeightMm: number` (default 297 for A4)
  - `lastActionTimestamp: number` — for coalescing
  - `lastActionType: string` — for coalescing
  - `lastActionElementId: string | null` — for coalescing

- [ ] 3.2 Implement selection actions:
  - `selectElement(id: string, additive: boolean)` — single/ctrl+click; if additive, toggle in selectedIds; else replace
  - `selectMany(ids: string[])` — marquee select; replace selectedIds
  - `selectAll()` — set selectedIds to all element IDs
  - `deselectAll()` — set selectedIds to []
  - `setTool(tool: CanvasTool)` — set activeTool

- [ ] 3.3 Implement element CRUD actions (each pushes to `past` before mutation):
  - `addElement(element: CanvasElement)` — add to elements array, push snapshot, clear future
  - `updateElement(id: string, updates: Partial<CanvasElement>)` — live update (no history push — for drag/resize/rotate live)
  - `commitElementChange(id: string, oldState: Partial<CanvasElement>, actionType: string)` — pointerup; push snapshot to past with old state, clear future, mark dirty
  - `deleteElement(id: string)` — remove from elements, remove from selectedIds, push snapshot
  - `deleteSelected()` — delete all selectedIds
  - `duplicateElement(id: string)` — clone with new UUID, offset +20px, select the clone
  - `duplicateSelected()` — duplicate all selectedIds

- [ ] 3.4 Implement z-order actions (push to past, renormalize zIndex after):
  - `bringToFront(ids: string[])` — set selected elements' zIndex to max+1, then renormalize all
  - `sendToBack(ids: string[])` — set to 0, shift others up, renormalize
  - `reorderElement(id: string, direction: 'forward' | 'backward')` — swap with neighbor in zIndex-sorted array, renormalize

- [ ] 3.5 Implement clipboard actions:
  - `copySelection()` — deep clone selectedIds elements to clipboard
  - `cutSelection()` — copy + deleteSelected
  - `paste()` — paste clipboard elements with new UUIDs, offset +20px from originals, select pasted

- [ ] 3.6 Implement zoom/pan actions:
  - `setScale(scale: number)` — clamp 0.25–4.0
  - `setPan(x: number, y: number)` — set positionX, positionY
  - `setViewport(scale: number, x: number, y: number)` — combined zoom+pan

- [ ] 3.7 Implement grid/guide actions:
  - `toggleGrid()` — flip isGridEnabled
  - `toggleSnap()` — flip snapToGrid
  - `toggleRulers()` — flip showRulers
  - `setGridSize(size: number)` — set gridSize
  - `setActiveGuides(guides: GuideLine[])` — set activeGuides
  - `clearGuides()` — set activeGuides to []

- [ ] 3.8 Implement interaction state:
  - `setInteractionState(state: InteractionState)` — set interactionState

- [ ] 3.9 Implement history system (past/future pattern — NOT Command array):
  - `pushToPast(snapshot: HistorySnapshot)` — prepend to past, trim to 50, clear future
  - `undo()` — pop from past (shift), push present to future, restore popped snapshot
  - `redo()` — pop from future (shift), push present to past, restore popped snapshot
  - Coalescing logic: if `lastActionType === newActionType && lastActionElementId === elementId && (Date.now() - lastActionTimestamp) < 500` → replace the top of `past` instead of pushing new entry (keep earliest old state)
  - `canUndo` computed: `past.length > 0`
  - `canRedo` computed: `future.length > 0`

- [ ] 3.10 Implement save protocol:
  - `setSaving(bool: boolean)` — set isSaving
  - `markSaved(version: number)` — copy elements to savedElements, set savedVersion, isDirty false
  - `resetToSaved()` — restore elements from savedElements (discard unsaved changes), clear past/future
  - `setReadOnly(bool: boolean)` — set isReadOnly

- [ ] 3.11 Write computed selectors (export as standalone functions that take state):
  - `useSelectedElements(state)` — elements filtered by selectedIds
  - `useIsDirty(state)` — compare elements vs savedElements
  - `useCanUndo(state)` — `past.length > 0`
  - `useCanRedo(state)` — `future.length > 0`

- [ ] 3.12 Write outcome file: `.ai/plans/cert-plan-11/outcome/T03-canvas-store-outcome.md`

**Files to Create:**
- `frontend/common/stores/certCanvasStore.ts`

**Requirements References:** REQ-11-01 (store shape), REQ-11-12 (undo/redo), REQ-11-15 (history), REQ-11-16 (save protocol), design.md §5

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts frontend/common/stores/certCanvasStore.ts --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/common/stores/AGENTS.md`
- Read `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`
- Verify: NO `Set` (use `string[]`), NO `persist` middleware (session-only), NO non-serializable values in state (use `useRef` for refs), `@/` path aliases, no `console.*`

---


### T04: CanvasArea + CanvasViewport + CanvasContainer (~6h)

**Objective:** Create the ElementRenderer component that renders each element as a CSS-positioned div, and implement single + multi selection.

**Subtasks:**
- [ ] 4.1 Create `ElementRenderer` component:
  - Props: `element: CanvasElement`, `isSelected: boolean`, `isInteractive: boolean`
  - Memoized with `React.memo` — only re-renders when element props change
  - Renders `position: absolute; left: element.x; top: element.y; width: element.width; height: element.height; transform: rotate(element.rotation deg)`
  - `zIndex: element.zIndex`
  - Renders element content (text, image, QR, shape, date) via switch on `element.type`
  - Content rendering delegates to Plan 10/12 element components

- [ ] 4.2 Implement single selection:
  - On pointer down on ElementRenderer → `selectElement(element.id, e.ctrlKey || e.metaKey)`
  - If ctrl/cmd: toggle selection (add to or remove from selectedIds)
  - If no modifier: select only this element (replace selection)
  - Set `interactionState` to `'idle'` (drag starts on move, not down)
  - Visual: 2px solid blue outline when selected

- [ ] 4.3 Implement multi-selection display:
  - When multiple elements selected: render GroupBoundingBox (dashed rectangle around all selected)
  - No resize handles or rotation handle for multi-selection (only for single)
  - Selected elements all show blue outline

- [ ] 4.4 Implement click-through to canvas:
  - If `isInteractive` is false (e.g., during another drag), `pointerEvents: 'none'`
  - Prevents accidental element selection during active drag operations

- [ ] 4.5 Write outcome file: `.ai/plans/cert-plan-11/outcome/T04-element-renderer-outcome.md`

**Files to Create:**
- `frontend/desktop/views/dashboard/certificates/templates/editor/ElementRenderer.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/SelectionHandles.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/GroupBoundingBox.tsx`

**Requirements References:** REQ-11-02

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/ElementRenderer.tsx --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/views/AGENTS.md`
- Read `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`

---

### T05: Drag-to-Move

**Objective:** Implement drag-to-move with real-time position updates, boundary constraints, ghost outline, and coalesced undo commands.

> **Parallelizable**: This task runs as a subagent in Wave 4 alongside T06 (Resize Handles). Both extend T04's ElementRenderer and touch separate interaction state branches (dragging vs. resizing).

**Subtasks:**
- [ ] 5.1 Implement drag initiation:
  - On pointer down on selected ElementRenderer → set `interactionState = { type: 'dragging', startX: e.clientX, startY: e.clientY }`
  - Call `setPointerCapture(e.pointerId)` to track outside bounds
  - Store original positions of all selected elements

- [ ] 5.2 Implement drag move (pointer move during dragging):
  - Calculate delta: `dx = e.clientX - startX; dy = e.clientY - startY` (adjusted for zoom)
  - Update all selected elements' positions in Zustand store (live, no GraphQL)
  - Use `requestAnimationFrame` to batch updates (avoid multiple store writes per frame)
  - Apply boundary constraints: element x ≥ 0, y ≥ 0, x + width ≤ canvasWidth, y + height ≤ canvasHeight

- [ ] 5.3 Implement ghost outline during drag:
  - Render a semi-transparent rectangle at the original position of each dragging element
  - Ghost uses dashed border with 50% opacity
  - Removed on pointer up

- [ ] 5.4 Implement drag end (pointer up):
  - If position changed: push `MoveElement` command(s) to history with old/new positions
  - Apply coalescing: if last history entry is MoveElement for same element within 500ms, merge
  - Mark `isDirty = true`
  - Reset `interactionState` to `'idle'`
  - Remove ghost outlines

- [ ] 5.5 Write outcome file: `.ai/plans/cert-plan-11/outcome/T05-drag-move-outcome.md`

**Files to Modify:**
- `frontend/desktop/views/dashboard/certificates/templates/editor/ElementRenderer.tsx` (add drag handlers)
- `frontend/common/stores/canvasStore.ts` (add commitPositionChange coalescing)

**Requirements References:** REQ-11-03

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/ElementRenderer.tsx --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/views/AGENTS.md`
- Read `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`

---

### T06: Resize Handles (8 Handles)

**Objective:** Implement 8 resize handles (corners + edges) with min size constraints, aspect ratio locking with Shift, and real-time visual feedback.

> **Parallelizable**: This task runs as a subagent in Wave 4 alongside T05 (Drag-to-Move). Both extend T04's ElementRenderer and touch separate interaction state branches (resizing vs. dragging).

**Subtasks:**
- [ ] 6.1 Create `ResizeHandles` component:
  - Renders 8 handle squares at: nw, n, ne, e, se, s, sw, w positions
  - Each handle: 10px square, white background, 1px blue border, `position: absolute`
  - Handle cursor styles: `nw-resize`, `n-resize`, `ne-resize`, `e-resize`, `se-resize`, `s-resize`, `sw-resize`, `w-resize`
  - Only visible when single element selected

- [ ] 6.2 Implement resize logic per handle:
  - On pointer down on handle → `interactionState = { type: 'resizing', handle: 'nw'|'n'|..., startX, startY }`
  - On pointer move → calculate new width/height/x/y based on handle direction:
    - `nw`: x and y move, width and height adjust inversely
    - `n`: y moves, height adjusts
    - `ne`: y moves, width and height adjust
    - `e`: width adjusts
    - `se`: width and height adjust
    - `s`: height adjusts
    - `sw`: x moves, width and height adjust
    - `w`: x moves, width adjusts
  - Apply min size: width ≥ 20px, height ≥ 20px
  - If Shift held: lock aspect ratio to original width/height ratio

- [ ] 6.3 Implement resize end:
  - Push `ResizeElement` command to history with old/new state
  - Mark `isDirty = true`
  - Reset interaction state

- [ ] 6.4 Boundary constraints during resize:
  - Element must not extend beyond canvas boundaries
  - If resize pushes element past boundary, clamp to boundary

- [ ] 6.5 Write outcome file: `.ai/plans/cert-plan-11/outcome/T06-resize-handles-outcome.md`

**Files to Create/Modify:**
- `frontend/desktop/views/dashboard/certificates/templates/editor/ResizeHandles.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/SelectionHandles.tsx` (integrate)
- `frontend/common/stores/canvasStore.ts` (add commitResizeChange)

**Requirements References:** REQ-11-04

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/ResizeHandles.tsx --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/views/AGENTS.md`
- Read `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`

---

### T07: Rotation Handle

**Objective:** Implement a rotation handle above the element that rotates around the element center with 15° snapping when Shift is held.

> **Parallelizable**: This task runs as a subagent in Wave 5 alongside T08 (Snap-to-Grid + Alignment Guides). Both extend T06's SelectionHandles and touch disjoint concerns (rotation interaction vs. snap/guide rendering).

**Subtasks:**
- [ ] 7.1 Create `RotationHandle` component:
  - Rendered as a small circle (12px) positioned 30px above the element's top-center
  - Connected to element by a thin vertical line (2px, blue)
  - Cursor: `crosshair`
  - Only visible when single element selected

- [ ] 7.2 Implement rotation logic:
  - On pointer down → `interactionState = { type: 'rotating', elementId, startX, startY }`
  - On pointer move → calculate angle: `angle = atan2(mouseY - centerY, mouseX - centerX) + 90°` (adjust for handle position above)
  - If Shift held: snap to nearest 15° increment
  - Update `element.rotation` in store (live, no GraphQL)

- [ ] 7.3 Implement rotation end:
  - Push `RotateElement` command to history with old/new angle
  - Mark `isDirty = true`
  - Reset interaction state

- [ ] 7.4 Render rotation visually:
  - Element's `transform: rotate(angle deg)` updates in real-time
  - Handle stays above element (rotates with it)
  - Show angle tooltip near handle during rotation (e.g., "45°")

- [ ] 7.5 Write outcome file: `.ai/plans/cert-plan-11/outcome/T07-rotation-handle-outcome.md`

**Files to Create/Modify:**
- `frontend/desktop/views/dashboard/certificates/templates/editor/RotationHandle.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/SelectionHandles.tsx` (integrate)
- `frontend/common/stores/canvasStore.ts` (add commitRotationChange)

**Requirements References:** REQ-11-05

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/RotationHandle.tsx --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/views/AGENTS.md`
- Read `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`

---

## Phase 3: Canvas Tools

### T08: Snap-to-Grid + Alignment Guides

**Objective:** Implement snap-to-grid and snap-to-element alignment guides with threshold-based proximity detection.

> **Parallelizable**: This task runs as a subagent in Wave 5 alongside T07 (Rotation Handle). Both extend T06's SelectionHandles and touch disjoint concerns (snap/guide rendering vs. rotation interaction).

**Subtasks:**
- [ ] 8.1 Implement snap-to-grid:
  - When `isGridEnabled` is true and element is being dragged
  - Calculate: `snappedX = Math.round(element.x / gridSize) * gridSize`
  - Calculate: `snappedY = Math.round(element.y / gridSize) * gridSize`
  - Apply snapped position instead of raw position
  - Visual feedback: element "jumps" to grid points

- [ ] 8.2 Implement snap-to-element alignment:
  - During drag, compare dragged element's left/centerX/right against all other elements' left/centerX/right
  - Threshold: 5px (if within 5px, snap)
  - Also compare top/centerY/bottom for vertical alignment
  - When snap detected: adjust element position and add guide to `activeGuides`

- [ ] 8.3 Create `SnapGuideOverlay` component:
  - Renders SVG overlay on top of canvas container
  - Grid dots: when grid enabled, render small dots at each grid intersection
  - Alignment guides: render vertical/horizontal lines at snap positions
  - Guide styling: 1px stroke, blue color (#2196f3), semi-transparent
  - Guides removed when drag ends (clear `activeGuides`)

- [ ] 8.4 Implement guide cleanup:
  - On drag end: clear all guides from `activeGuides`
  - During drag: guides update as element moves (old guides removed, new ones added)

- [ ] 8.5 Write outcome file: `.ai/plans/cert-plan-11/outcome/T08-snap-guides-outcome.md`

**Files to Create:**
- `frontend/desktop/views/dashboard/certificates/templates/editor/SnapGuideOverlay.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/snap-utils.ts` (snap calculation helpers)

**Requirements References:** REQ-11-06, REQ-11-07

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/SnapGuideOverlay.tsx --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/views/AGENTS.md`
- Read `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`

---

### T09: Canvas Toolbar (Zoom, Grid, Undo/Redo, Save)

**Objective:** Create the canvas toolbar with: add element dropdown, zoom controls, grid toggle, undo/redo buttons, and save button.

> **Parallelizable**: This task runs as a subagent in Wave 6 alongside T10 (Rulers + Keyboard Shortcuts + Zoom/Pan), T11 (Mobile View), T12 (ViewModel + Container + GraphQL). All depend on T03 (store) / T04 (canvas surface) and target disjoint module surfaces (toolbar vs. rulers/shortcuts vs. mobile vs. ViewModel/GraphQL).

**Subtasks:**
- [ ] 9.1 Create `CanvasToolbar` component:
  - Horizontal bar above the canvas viewport
  - Uses MUI `Toolbar` or `Stack` with `direction="row"` and `spacing`
  - Each control group separated by a vertical divider

- [ ] 9.2 Implement Add Element dropdown:
  - MUI `Select` or `Menu` with options: Text, Image, QR Code, Shape, Date
  - On select: call `addElement` in store with default dimensions and position (center of canvas)
  - Icons: `TextFieldsOutlined`, `ImageOutlined`, `QrCodeOutlined`, `CategoryOutlined`, `CalendarTodayOutlined`

- [ ] 9.3 Implement zoom controls:
  - Zoom In button: `setZoom(Math.min(zoomLevel + 0.1, 4.0))`
  - Zoom Out button: `setZoom(Math.max(zoomLevel - 0.1, 0.1))`
  - Zoom label: shows percentage (e.g., "100%")
  - Fit to Screen button: calculates zoom to fit canvas in viewport
  - Reset to 100% button: `setZoom(1.0)`
  - Icons: `ZoomInOutlined`, `ZoomOutOutlined`, `FitScreenOutlined`, `CenterFocusStrongOutlined`

- [ ] 9.4 Implement grid toggle:
  - MUI `ToggleButton` (icon: `GridOnOutlined` / `GridOffOutlined`)
  - Calls `toggleGrid()` in store
  - Active state shows grid dots

- [ ] 9.5 Implement undo/redo buttons:
  - Undo: `undo()` — disabled when `history.length === 0`
  - Redo: `redo()` — disabled when `redoHistory.length === 0`
  - Icons: `UndoOutlined`, `RedoOutlined`
  - Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Shift+Z / Ctrl+Y (redo)

- [ ] 9.6 Implement save button:
  - Disabled when `!isDirty`
  - On click: flush all unsaved element changes via debounced GraphQL mutations
  - Call `updateTemplateElement` mutation for each changed element
  - On success: `markSaved()`, show success toast
  - On error: show error toast, keep `isDirty` true
  - Loading state on button during save
  - Icon: `SaveOutlined`

- [ ] 9.7 i18n: Add translation keys for toolbar:
  - `certificates.editor.canvas.toolbar.addText`, `.addImage`, `.addQR`, `.addShape`, `.addDate`
  - `.zoomIn`, `.zoomOut`, `.fitToScreen`, `.resetZoom`, `.toggleGrid`
  - `.undo`, `.redo`, `.save`, `.saveSuccess`, `.saveError`
  - English + Arabic translations in `shared/locale/`

- [ ] 9.8 Write outcome file: `.ai/plans/cert-plan-11/outcome/T09-canvas-toolbar-outcome.md`

**Files to Create:**
- `frontend/desktop/views/dashboard/certificates/templates/editor/CanvasToolbar.tsx`
- `frontend/common/graphql/sharedDocuments/templateElement.documents.ts` (update mutation — if not from Plan 10)

**Requirements References:** REQ-11-08, REQ-11-12

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/CanvasToolbar.tsx --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/views/AGENTS.md`
- Read `frontend/common/graphql/sharedDocuments/AGENTS.md`
- Read `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`
- Verify: MUI v9 `sx` prop (no style props), `*Outlined` icon naming, `@/` path aliases

---

### T10: Rulers + Keyboard Shortcuts + Zoom/Pan

**Objective:** Implement pixel rulers (top + left), comprehensive keyboard shortcuts, and zoom/pan interactions.

> **Parallelizable**: This task runs as a subagent in Wave 6 alongside T09 (Canvas Toolbar), T11 (Mobile View), T12 (ViewModel + Container + GraphQL). All depend on T03 (store) / T04 (canvas surface) and target disjoint module surfaces (rulers/shortcuts/zoom vs. toolbar vs. mobile vs. ViewModel/GraphQL).

**Subtasks:**
- [ ] 10.1 Create `CanvasRuler` component:
  - Props: `orientation: 'horizontal' | 'vertical'`, `length: number`, `zoom: number`
  - Horizontal ruler: positioned at top of viewport, full width
  - Vertical ruler: positioned at left of viewport, full height
  - Markings every 50px (adjusted for zoom): tick marks + number labels
  - Minor ticks every 10px
  - Background: light gray, border
  - Corner filler: 20×20 box at top-left intersection

- [ ] 10.2 Implement ruler scroll sync:
  - Ruler scroll position matches canvas viewport scroll
  - On viewport scroll → update ruler transform (translateX/translateY accordingly)

- [ ] 10.3 Implement keyboard shortcuts:
  - Arrow keys: nudge selected element(s) by 1px (10px with Shift)
  - Delete/Backspace: delete selected element(s)
  - Ctrl+D: duplicate selected element(s)
  - Ctrl+Z: undo
  - Ctrl+Shift+Z / Ctrl+Y: redo
  - Escape: clear selection
  - Ctrl+A: select all elements
  - Ctrl+S: save (prevent default browser save)
  - Space: hold for pan mode (cursor changes to grab)
  - Up/Down arrow on zoom: not applicable (zoom is Ctrl+scroll or toolbar)

- [ ] 10.4 Implement keyboard shortcut routing:
  - Only active when `canvasFocus === 'canvas'` (not when typing in inputs/property panel)
  - Use a global `keydown` listener on `window`, check focus state
  - Prevent default browser behavior for Ctrl+S, Ctrl+A, Ctrl+Z, Delete

- [ ] 10.5 Implement zoom interactions:
  - Ctrl+scroll wheel: zoom in/out by 10% per notch, centered on cursor position
  - Zoom calculation: adjust `panOffset` so cursor position stays under same canvas point
  - Zoom limits: 10% minimum, 400% maximum

- [ ] 10.6 Implement pan interactions:
  - Spacebar + drag: pan canvas (cursor: `grab` / `grabbing`)
  - Middle mouse button drag: also pans
  - Update `panOffset` in store
  - Apply pan to CanvasContainer via `transform: translate(panOffset.x, panOffset.y) scale(zoom)`

- [ ] 10.7 Implement fit-to-screen:
  - Calculate available viewport dimensions
  - Calculate zoom: `zoom = min(viewportWidth / canvasWidth, viewportHeight / canvasHeight) * 0.9`
  - Center canvas: set panOffset to center the canvas in viewport

- [ ] 10.8 i18n: Add any remaining translation keys for canvas (error messages, tooltips)

- [ ] 10.9 Write outcome file: `.ai/plans/cert-plan-11/outcome/T10-rulers-shortcuts-zoom-outcome.md`

**Files to Create:**
- `frontend/desktop/views/dashboard/certificates/templates/editor/CanvasRuler.tsx`
- `frontend/desktop/views/dashboard/certificates/templates/editor/useCanvasKeyboard.ts` (keyboard hook)
- `frontend/desktop/views/dashboard/certificates/templates/editor/useCanvasZoomPan.ts` (zoom/pan hook)

**Requirements References:** REQ-11-08, REQ-11-09, REQ-11-10, REQ-11-11

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/editor/CanvasRuler.tsx --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/views/AGENTS.md`
- Read `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`
- Verify: no `console.*`, MUI v9 patterns, `@/` path aliases

---

### T10a: TextNode Component (~3h)

**Objective:** Create the React Flow `TextNode` component that renders a text element with content-editable support, variable interpolation highlighting, resize handles, and rotation handle.

> **Parallelizable**: This task runs as a subagent in Wave 7 alongside T10b, T10c, T10d, T10e, T10f, T10g, T10h, T10i, T10j, T10k, T10l. All depend on T10 (Rulers/Zoom/Keyboard). Each owns its own file with no cross-imports until integration.

**Subtasks:**
- [ ] 10a.1 Create `frontend/views/dashboard/cert/templates/editor/nodes/TextNode.tsx`:
  - Implement `TextNodeData` interface (per design §18.1)
  - Register with React Flow via `nodeTypes = { text: TextNode }`
  - Render a styled `<div>` with all text styling props applied via inline styles
  - Double-click enters content-editable mode (`contentEditable={true}`)
  - Show `{{variable}}` placeholders with highlighted background (`theme.palette.info.light`)
  - Blur or Escape exits edit mode, commits content via `updateNode`
  - In preview mode, show resolved variable values
  - Content max length 1000 chars (enforced via `maxLength` attribute)
  - Min size 20×20px enforced


**Files to Create:**
- `frontend/views/dashboard/cert/templates/editor/nodes/TextNode.tsx`
- `frontend/common/views/dashboard/cert-canvas/types/textNode.types.ts`

**Requirements References:** REQ-11-01, REQ-11-04, REQ-11-05

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/nodes/TextNode.tsx --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`
- Verify: `@/` path aliases, no `console.*`, MUI v9 `sx` prop patterns, React 19 event types

---

### T10b: ImageNode Component (~3h)

**Objective:** Create the React Flow `ImageNode` component that renders an image element with fit modes, resize with aspect-ratio lock, and image replacement via double-click.

> **Parallelizable**: This task runs as a subagent in Wave 7 alongside T10a, T10c, T10d, T10e, T10f, T10g, T10h, T10i, T10j, T10k, T10l. All depend on T10 (Rulers/Zoom/Keyboard). Each owns its own file with no cross-imports until integration.

**Subtasks:**
- [ ] 10b.1 Create `frontend/views/dashboard/cert/templates/editor/nodes/ImageNode.tsx`:
  - Implement `ImageNodeData` interface (per design §18.2)
  - Render image via `next/image` for URLs; standard `<img>` for base64
  - Apply `object-fit`, `opacity`, `borderRadius`, `borderWidth`, `borderColor`, `objectPosition`
  - Corner resize handles maintain aspect ratio when Shift held (React Flow `NodeResizer` `keepAspectRatio`)
  - Drag handle at top (React Flow `Handle` top port)
  - Double-click opens image replacement dialog (file upload or URL input)
  - Show placeholder with `ImageOutlined` icon when `src` is empty/broken
  - Apply `dropShadow` via inline style if set


**Files to Create:**
- `frontend/views/dashboard/cert/templates/editor/nodes/ImageNode.tsx`
- `frontend/common/views/dashboard/cert-canvas/types/imageNode.types.ts`

**Requirements References:** REQ-11-01, REQ-11-04

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/nodes/ImageNode.tsx --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`
- Verify: `next/image` usage, no `console.*`, theme-based colors

---

### T10c: ShapeNode Component (~3h)

**Objective:** Create the React Flow `ShapeNode` component that renders SVG-based shapes (rectangle, circle, ellipse, line, triangle, star, hexagon) with solid/gradient fills and stroke styles.

> **Parallelizable**: This task runs as a subagent in Wave 7 alongside T10a, T10b, T10d, T10e, T10f, T10g, T10h, T10i, T10j, T10k, T10l. All depend on T10 (Rulers/Zoom/Keyboard). Each owns its own file with no cross-imports until integration.

**Subtasks:**
- [ ] 10c.1 Create `frontend/views/dashboard/cert/templates/editor/nodes/ShapeNode.tsx`:
  - Implement `ShapeNodeData` interface (per design §18.3)
  - Render inline SVG inside node container (`<svg width={width} height={height}>`)
  - Shape rendering switch:
    - `rectangle`: `<rect rx={cornerRadius} ry={cornerRadius} />`
    - `circle`: `<ellipse>` with equal rx/ry (force 1:1)
    - `ellipse`: `<ellipse>` with independent rx/ry
    - `line`: `<line>` with stroke dasharray
    - `triangle`: `<polygon points="..." />`
    - `star`: `<polygon>` 5-point star
    - `hexagon`: `<polygon>` 6-point hexagon
  - Gradient fill via `<defs><linearGradient /></defs>` or `<radialGradient />`
  - Stroke dasharray: solid=`none`, dashed=`8 4`, dotted=`2 2`
  - Resize maintains proportions for circle (rx === ry enforced)


**Files to Create:**
- `frontend/views/dashboard/cert/templates/editor/nodes/ShapeNode.tsx`
- `frontend/common/views/dashboard/cert-canvas/types/shapeNode.types.ts`

**Requirements References:** REQ-11-01, REQ-11-04

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/nodes/ShapeNode.tsx --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`
- Verify: SVG attribute camelCase, no `console.*`, theme-based colors

---

### T10d: QRCodeNode Component (~2h)

**Objective:** Create the React Flow `QRCodeNode` component that renders QR codes using `qrcode.react`, with static/variable data binding, error correction levels, and optional logo overlay.

> **Parallelizable**: This task runs as a subagent in Wave 7 alongside T10a, T10b, T10c, T10e, T10f, T10g, T10h, T10i, T10j, T10k, T10l. All depend on T10 (Rulers/Zoom/Keyboard). Each owns its own file with no cross-imports until integration.

**Subtasks:**
- [ ] 10d.1 Create `frontend/views/dashboard/cert/templates/editor/nodes/QRCodeNode.tsx`:
  - Implement `QRCodeNodeData` interface (per design §18.4)
  - Use `qrcode.react` library (`QRCodeSVG` for export quality, `QRCodeCanvas` for performance)
  - Render QR with `value`, `errorLevel`, `fgColor`, `bgColor`, `margin` props
  - Center logo overlay if `logoImage` set (white background patch + centered image)
  - Edit mode: semi-transparent overlay with "Double-click to edit" hint
  - Double-click opens QR settings panel (property panel sidebar)
  - Square constraint: `width === height` (resize locks 1:1)
  - Preview mode: render actual QR with live variable data


**Files to Create:**
- `frontend/views/dashboard/cert/templates/editor/nodes/QRCodeNode.tsx`
- `frontend/common/views/dashboard/cert-canvas/types/qrCodeNode.types.ts`

**Dependencies:** `qrcode.react` (verify presence in `package.json` or install)

**Requirements References:** REQ-11-01

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/nodes/QRCodeNode.tsx --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`
- Verify: `qrcode.react` import path, no `console.*`, theme color usage

---

### T10e: SignatureNode Component (~3h)

**Objective:** Create the React Flow `SignatureNode` component supporting placeholder, uploaded, and drawn signature modes with signer name/title display.

> **Parallelizable**: This task runs as a subagent in Wave 7 alongside T10a, T10b, T10c, T10d, T10f, T10g, T10h, T10i, T10j, T10k, T10l. All depend on T10 (Rulers/Zoom/Keyboard). Each owns its own file with no cross-imports until integration.

**Subtasks:**
- [ ] 10e.1 Create `frontend/views/dashboard/cert/templates/editor/nodes/SignatureNode.tsx`:
  - Implement `SignatureNodeData` interface (per design §18.5)
  - `placeholder` mode: render signer name in `fontScript` (cursive), title below in sans-serif, signature line above
  - `uploaded` mode: render image via `<img>` with name/title overlay
  - `drawn` mode: render base64 PNG from `drawnData`
  - `showLabel`: render "Authorized by" label above block
  - Double-click behavior varies by mode:
    - Placeholder: open text editor for name/title
    - Uploaded: open image replacement dialog
    - Drawn: open signature pad dialog
  - Color applies to text elements only


**Files to Create:**
- `frontend/views/dashboard/cert/templates/editor/nodes/SignatureNode.tsx`
- `frontend/common/views/dashboard/cert-canvas/types/signatureNode.types.ts`

**Requirements References:** REQ-11-01

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/nodes/SignatureNode.tsx --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`
- Verify: no `console.*`, MUI Typography with `sx` prop, theme colors

---

### T10f: BackgroundNode Component (~2h)

**Objective:** Create the React Flow `BackgroundNode` component that renders the certificate background (color, gradient, image, pattern) behind all other nodes.

> **Parallelizable**: This task runs as a subagent in Wave 7 alongside T10a, T10b, T10c, T10d, T10e, T10g, T10h, T10i, T10j, T10k, T10l. All depend on T10 (Rulers/Zoom/Keyboard). Each owns its own file with no cross-imports until integration.

**Subtasks:**
- [ ] 10f.1 Create `frontend/views/dashboard/cert/templates/editor/nodes/BackgroundNode.tsx`:
  - Implement `BackgroundNodeData` interface (per design §18.6)
  - Set node `zIndex = 0` to always render behind other nodes
  - Set `selectable = false` in React Flow node config (only via layers panel)
  - Cover entire canvas dimensions
  - `color`: solid background fill via inline style
  - `gradient`: CSS `linear-gradient` / `radial-gradient` per direction
  - `image`: `background-image` with `background-size` per `imageFit` ('cover', 'contain', 'tile')
  - `pattern`: CSS-generated patterns:
    - `dots`: `radial-gradient` repeating
    - `grid`: `linear-gradient` lines crossing
    - `lines`: repeating linear gradient
    - `waves`: SVG background pattern
  - Only one background node at a time (enforced in `addNode` store action)


**Files to Create:**
- `frontend/views/dashboard/cert/templates/editor/nodes/BackgroundNode.tsx`
- `frontend/common/views/dashboard/cert-canvas/types/backgroundNode.types.ts`

**Requirements References:** REQ-11-01

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/nodes/BackgroundNode.tsx --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`
- Verify: no `console.*`, theme-based pattern colors, CSS gradient syntax

---

### T10g: ElementLibraryPalette Component (~3h)

**Objective:** Create the `ElementLibraryPalette` component — a draggable element grid that allows users to drag element types onto the canvas to create new nodes.

> **Parallelizable**: This task runs as a subagent in Wave 7 alongside T10a, T10b, T10c, T10d, T10e, T10f, T10h, T10i, T10j, T10k, T10l. All depend on T10 (Rulers/Zoom/Keyboard). Each owns its own file with no cross-imports until integration.

**Subtasks:**
- [ ] 10g.1 Create `frontend/views/dashboard/cert/templates/editor/ElementLibraryPalette.tsx`:
  - Grid layout (2 columns) of draggable element cards (per design §19.2)
  - Each card: MUI Icon + element name + tooltip description
  - HTML5 Drag API: `draggable={true}`, `onDragStart` sets `dataTransfer` with `application/x-canvas-element-type`
  - Elements: Add Text, Add Image, Add Rectangle, Add Circle, Add Line, Add QR Code, Add Signature, Add Background
  - Icons: `TextFieldsOutlined`, `ImageOutlined`, `SquareOutlined`, `CircleOutlined`, `HorizontalRuleOutlined`, `QrCodeOutlined`, `DrawOutlined`, `WallpaperOutlined`
  - Keyboard accessible: each card is focusable, Enter adds element at canvas center
  - `aria-label` and `aria-describedby` per card


**Files to Create:**
- `frontend/views/dashboard/cert/templates/editor/ElementLibraryPalette.tsx`

**Requirements References:** REQ-11-01

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/ElementLibraryPalette.tsx --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`
- Verify: MUI v9 `sx` prop usage, no `console.*`, `@/` path aliases

---

### T10h: CanvasContextMenu Component (~3h)

**Objective:** Create the `CanvasContextMenu` component that appears on right-click and provides node/canvas operations (copy, paste, duplicate, delete, z-order, lock, properties).

> **Parallelizable**: This task runs as a subagent in Wave 7 alongside T10a, T10b, T10c, T10d, T10e, T10f, T10g, T10i, T10j, T10k, T10l. All depend on T10 (Rulers/Zoom/Keyboard). Each owns its own file with no cross-imports until integration.

**Subtasks:**
- [ ] 10h.1 Create `frontend/views/dashboard/cert/templates/editor/CanvasContextMenu.tsx`:
  - MUI `Menu` with `anchorReference="anchorPosition"` (per design §20.2)
  - Menu state from Zustand: `contextMenu: { open, x, y, nodeId }`
  - General items: Copy, Paste, Duplicate, Delete, Divider, Bring to Front, Bring Forward, Send Backward, Send to Back, Divider, Lock/Unlock, Properties
  - Element-type-specific items (per design §20.2 table):
    - QR Code: "Edit QR Settings"
    - Signature: "Change Signature Mode"
    - Image: "Replace Image"
    - Text: "Edit Text"
    - Background: "Edit Background"
  - Canvas background menu: Paste, Select All, Toggle Grid, Toggle Snap, Fit to Screen, Zoom In, Zoom Out
  - Shortcut text shown as muted `Typography` to the right of each item
  - MUI icons for each action
  - Auto-closes after item click


**Files to Create:**
- `frontend/views/dashboard/cert/templates/editor/CanvasContextMenu.tsx`

**Requirements References:** REQ-11-02, REQ-11-08, REQ-11-13

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/CanvasContextMenu.tsx --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`
- Verify: MUI `Menu` API usage, `sx` prop, no `console.*`, theme palette

---

### T10i: useCanvasStore Zustand Store (~4h)

**Objective:** Create the `useCanvasStore` Zustand store managing React Flow nodes/edges, selection, clipboard, viewport, grid, context menu, and all canvas actions (per design §21).

> **Parallelizable**: This task runs as a subagent in Wave 7 alongside T10a, T10b, T10c, T10d, T10e, T10f, T10g, T10h, T10j, T10k, T10l. All depend on T10 (Rulers/Zoom/Keyboard). Each owns its own file with no cross-imports until integration.

**Subtasks:**
- [ ] 10i.1 Create `frontend/common/stores/useCanvasStore.ts`:
  - Implement `CanvasState` interface (per design §21.2)
  - Node CRUD: `addNode`, `updateNode`, `deleteNode`, `duplicateNode`
  - Selection: `selectNodes`, `selectAll`, `clearSelection` (using `string[]`, NOT `Set`)
  - Clipboard: `copyNodes`, `pasteNodes` (session-only, serialized nodes)
  - Viewport: `setViewport`, `zoomIn`, `zoomOut`, `fitView`
  - Grid: `toggleGrid`, `toggleSnap`, `setGridSize` (gridSize default: 20px)
  - Context menu: `openContextMenu`, `closeContextMenu`
  - Z-index: `bringToFront`, `bringForward`, `sendBackward`, `sendToBack` (with renormalization to dense 0..N)
  - Lock: `toggleNodeLock`
  - Store is NOT persisted (no `persist` middleware)
  - `onNodesChange` / `onEdgesChange` / `onConnect` wired to React Flow's `applyNodeChanges` / `applyEdgeChanges`

- [ ] 10i.2 Create barrel export `frontend/common/stores/canvasStore.types.ts` for `CertNodeData`, `SerializedNode`, `CertElementType` types


**Files to Create:**
- `frontend/common/stores/useCanvasStore.ts`
- `frontend/common/stores/canvasStore.types.ts`

**Requirements References:** REQ-11-01, REQ-11-02, REQ-11-06, REQ-11-08, REQ-11-12, REQ-11-13

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts frontend/common/stores/useCanvasStore.ts --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/common/stores/AGENTS.md`, `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`
- Verify: Zustand `create` pattern, `string[]` not `Set`, no `console.*`, no `persist`

---

### T10j: Custom Resize & Rotate Handle Components (~3h)

**Objective:** Create reusable resize handle and rotation handle components that overlay on selected React Flow nodes.

> **Parallelizable**: This task runs as a subagent in Wave 7 alongside T10a, T10b, T10c, T10d, T10e, T10f, T10g, T10h, T10i, T10k, T10l. All depend on T10 (Rulers/Zoom/Keyboard). Each owns its own file with no cross-imports until integration.

**Subtasks:**
- [ ] 10j.1 Create `frontend/views/dashboard/cert/templates/editor/handles/ResizeHandles.tsx`:
  - 8 resize handles (4 corners + 4 edges) positioned around node bounding box
  - Each handle is a small `Box` (8×8px) with `theme.palette.primary.main` background
  - Mouse cursor changes per handle position (nw-resize, n-resize, ne-resize, e-resize, se-resize, s-resize, sw-resize, w-resize)
  - Pointer events: `onPointerDown` initiates resize, must use `setPointerCapture`
  - Min size 20×20px enforced during resize
  - Shift key locks aspect ratio (for non-square-constrained nodes)
  - Position anchored to opposite handle (fixed anchor during resize)

- [ ] 10j.2 Create `frontend/views/dashboard/cert/templates/editor/handles/RotateHandle.tsx`:
  - Rotation handle positioned above the node (offset 20px from top-center)
  - Circular handle with `RotateRightOutlined` icon
  - `onPointerDown` initiates rotation
  - Rotation around node center
  - Shift snaps to 15° increments
  - Rotation angle displayed as tooltip during rotation


**Files to Create:**
- `frontend/views/dashboard/cert/templates/editor/handles/ResizeHandles.tsx`
- `frontend/views/dashboard/cert/templates/editor/handles/RotateHandle.tsx`

**Requirements References:** REQ-11-04, REQ-11-05

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/handles/ResizeHandles.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/handles/RotateHandle.tsx --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`
- Verify: Pointer Events API (not Mouse Events), `setPointerCapture`, `sx` prop, theme palette

---

### T10k: Alignment Guide Overlay Component (~2h)

**Objective:** Create the `AlignmentGuideOverlay` component that renders alignment guide lines and snap indicators over the canvas during drag operations.

> **Parallelizable**: This task runs as a subagent in Wave 7 alongside T10a, T10b, T10c, T10d, T10e, T10f, T10g, T10h, T10i, T10j, T10l. All depend on T10 (Rulers/Zoom/Keyboard). Each owns its own file with no cross-imports until integration.

**Subtasks:**
- [ ] 10k.1 Create `frontend/views/dashboard/cert/templates/editor/AlignmentGuideOverlay.tsx`:
  - Renders horizontal and vertical guide lines via absolutely positioned `Box` elements
  - Guide color from `theme.palette.primary.main` (NOT hardcoded — per design §8.3)
  - Guide line dimensions: 1px width for vertical, 1px height for horizontal
  - Guides computed from `activeGuides` in store state
  - Guide visibility: only when `interactionState.type === 'dragging'` or `'resizing'`
  - Guides auto-removed on drag end (cleared from store)
  - Snap threshold: configurable (default 5px)
  - Performance: guides memoized to prevent unnecessary re-renders


**Files to Create:**
- `frontend/views/dashboard/cert/templates/editor/AlignmentGuideOverlay.tsx`

**Requirements References:** REQ-11-06, REQ-11-07

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/AlignmentGuideOverlay.tsx --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`
- Verify: `theme.palette.primary.main` not hardcoded, no `console.*`, memoization

---

### T10l: Keyboard Shortcut Handler (~2h)

**Objective:** Create the keyboard shortcut handler for the React Flow canvas that binds all canvas keyboard interactions.

> **Parallelizable**: This task runs as a subagent in Wave 7 alongside T10a, T10b, T10c, T10d, T10e, T10f, T10g, T10h, T10i, T10j, T10k. All depend on T10 (Rulers/Zoom/Keyboard). Each owns its own file with no cross-imports until integration.

**Subtasks:**
- [ ] 10l.1 Create `frontend/views/dashboard/cert/templates/editor/useCanvasKeyboard.ts`:
  - Register keyboard event listener on the canvas container (not window — scoped to editor)
  - Shortcuts:
    - `Delete` / `Backspace`: delete selected nodes (when not in text edit mode)
    - `Ctrl/Cmd+D`: duplicate selected nodes (preventDefault to avoid browser bookmark)
    - `Ctrl/Cmd+C`: copy selected nodes to clipboard
    - `Ctrl/Cmd+V`: paste nodes from clipboard
    - `Ctrl/Cmd+A`: select all nodes
    - `Ctrl/Cmd+Z`: undo (if history is managed)
    - `Ctrl/Cmd+Shift+Z` / `Ctrl/Cmd+Y`: redo
    - `Escape`: clear selection
    - Arrow keys: nudge selected nodes by 1px (Shift = 10px)
    - `Ctrl/Cmd+]`: bring forward
    - `Ctrl/Cmd+[`: send backward
    - `Ctrl/Cmd+Shift+]`: bring to front
    `Ctrl/Cmd+Shift+[`: send to back
    `Ctrl/Cmd+L`: toggle lock
    - `Ctrl/Cmd+='`: toggle grid
    `Ctrl/Cmd+Shift+'`: toggle snap
    `Ctrl/Cmd+0`: fit view
    `Ctrl/Cmd+=`: zoom in
    `Ctrl/Cmd+-`: zoom out
  - Prevent shortcuts when text node is in edit mode (ignore all when `document.activeElement` is contentEditable)
  - Debounce arrow nudges for undo coalescing (500ms merge window)


**Files to Create:**
- `frontend/views/dashboard/cert/templates/editor/useCanvasKeyboard.ts`

**Requirements References:** REQ-11-08, REQ-11-10, REQ-11-11, REQ-11-12

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/useCanvasKeyboard.ts --lifecycle codescene
```

**Instruction Verification:**
- Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
- Read `.agents/instructions/frontend.instructions.md`
- Verify: scoped event listener, `preventDefault` usage, contentEditable guard

---

### T10o: Quality Loop Per File (~2h)

**Objective:** Run the per-file quality verification loop on every new file created in T10a–T10l before they are integrated.

> **Parallelizable**: This task runs as a subagent in Wave 8 alongside T10p (Knowledge Propagation). Quality loop runs over the new files from Wave 7. Tests, quality, and docs touch disjoint file sets.

**Subtasks:**
- [ ] 10o.1 For each new file, run the progressive verification loop:
  ```bash
  bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene
  ```
  Files to verify:
  - `frontend/views/dashboard/cert/templates/editor/nodes/TextNode.tsx`
  - `frontend/views/dashboard/cert/templates/editor/nodes/ImageNode.tsx`
  - `frontend/views/dashboard/cert/templates/editor/nodes/ShapeNode.tsx`
  - `frontend/views/dashboard/cert/templates/editor/nodes/QRCodeNode.tsx`
  - `frontend/views/dashboard/cert/templates/editor/nodes/SignatureNode.tsx`
  - `frontend/views/dashboard/cert/templates/editor/nodes/BackgroundNode.tsx`
  - `frontend/views/dashboard/cert/templates/editor/ElementLibraryPalette.tsx`
  - `frontend/views/dashboard/cert/templates/editor/CanvasContextMenu.tsx`
  - `frontend/common/stores/useCanvasStore.ts`
  - `frontend/common/stores/canvasStore.types.ts`
  - `frontend/views/dashboard/cert/templates/editor/handles/ResizeHandles.tsx`
  - `frontend/views/dashboard/cert/templates/editor/handles/RotateHandle.tsx`
  - `frontend/views/dashboard/cert/templates/editor/AlignmentGuideOverlay.tsx`
  - `frontend/views/dashboard/cert/templates/editor/useCanvasKeyboard.ts`

- [ ] 10o.3 Fix any tsgo, biome, or lint errors found, re-run until all files pass clean

- [ ] 10o.4 Run full quality gate:
  ```bash
  bun quality-gate
  ```

**Requirements References:** All REQ-11-*

**Instruction Verification:**
- Read all applicable AGENTS.md files per file (see Instruction File Verification table)
- Read `.agents/instructions/frontend.instructions.md` and `.agents/instructions/tests.instructions.md`

---

### T10p: Knowledge Propagation & Documentation Update (~2h)

**Objective:** Update all relevant project documentation, AGENTS.md files, skills, and instruction files with the new React Flow canvas component patterns.

> **Parallelizable**: This task runs as a subagent in Wave 8 alongside T10o (Quality Loop). Documentation updates depend on Wave 7 components being complete. Tests, quality, and docs touch disjoint file sets.

**Subtasks:**
- [ ] 10p.1 Read all outcome files in `.ai/plans/cert-plan-11/outcome/`:
  - T10a through T10o outcome files

- [ ] 10p.2 Update `docs/frontend/canvas-editor.md` (created in T11):
  - Add "React Flow Node Types" section
  - Document each node type's data interface and behavior
  - Document the ElementLibraryPalette drag pattern
  - Document the CanvasContextMenu pattern
  - Document the useCanvasStore Zustand pattern
  - Document the custom handle components pattern
  - Document the alignment guide overlay pattern
  - Document the keyboard shortcut handler pattern

- [ ] 10p.3 Update `frontend/views/AGENTS.md`:
  - Add "React Flow Node" section with component naming, registration via `nodeTypes`, and data flow pattern
  - Add "Element Library Palette" section
  - Add "Canvas Context Menu" section
  - Add "Resize/Rotate Handle" section with Pointer Events API requirements
  - Add "Alignment Guide Overlay" section

- [ ] 10p.4 Update `frontend/common/stores/AGENTS.md`:
  - Add Canvas store pattern (non-persisted, React Flow integration, string[] not Set)

- [ ] 10p.5 Update `frontend/AGENTS.md`:
  - Add React Flow integration patterns
  - Add node customization patterns
  - Add `qrcode.react` usage guidance

- [ ] 10p.6 Update `.agents/skills/frontend-patterns/SKILL.md`:
  - Add "React Flow Canvas" section
  - Add "Node Type Customization" subsection
  - Add "Drag-to-Create from Palette" subsection

- [ ] 10p.7 Update `.agents/instructions/frontend.instructions.md`:
  - Add rules for React Flow node type components
  - Add rules for custom handle components (Pointer Events API, `setPointerCapture`)
  - Add rules for canvas keyboard shortcut scoping

- [ ] 10p.8 Update root `AGENTS.md` Important References:
  - Add `docs/frontend/react-flow-canvas.md` (if created as separate doc)

- [ ] 10p.9 Write outcome file: `.ai/plans/cert-plan-11/outcome/T10p-knowledge-propagation-outcome.md`

**Files to Create/Modify:**
- `docs/frontend/canvas-editor.md` (modify — augmenting T11's doc)
- `frontend/views/AGENTS.md` (modify)
- `frontend/common/stores/AGENTS.md` (modify)
- `frontend/AGENTS.md` (modify)
- `.agents/skills/frontend-patterns/SKILL.md` (modify)
- `.agents/instructions/frontend.instructions.md` (modify)
- `AGENTS.md` (modify — Important References if new doc)

**Requirements References:** Feature 6 (Outcome Knowledge Base)

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts docs/frontend/canvas-editor.md --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/AGENTS.md --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/stores/AGENTS.md --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/AGENTS.md --lifecycle codescene
bun run scripts/health/sub-loop.ts .agents/skills/frontend-patterns/SKILL.md --lifecycle codescene
bun run scripts/health/sub-loop.ts .agents/instructions/frontend.instructions.md --lifecycle codescene
bun run scripts/health/sub-loop.ts AGENTS.md --lifecycle codescene
```

**Instruction Verification:**
- Read all applicable AGENTS.md files (root, frontend, frontend/views, frontend/stores)
- Read `.agents/instructions/frontend.instructions.md`

---

## Phase 4: Integration & Knowledge

### T11: Knowledge Propagation & Documentation

**Objective:** Consolidate all learnings from Plan 11 implementation into permanent project documentation.

**Subtasks:**
- [ ] 11.1 Read all outcome files in `.ai/plans/cert-plan-11/outcome/`:
  - T01 through T10 outcome files

- [ ] 11.2 Create canonical reference doc: `docs/frontend/canvas-editor.md`
  - Document the CSS-positioned-divs rendering approach
  - Document the Pointer Events API usage pattern
  - Document the Zustand canvas store pattern (session-only, not persisted)
  - Document the Command pattern for undo/redo with coalescing
  - Document the threshold-based snap algorithm
  - Document the debounced GraphQL save pattern

- [ ] 11.3 Update `frontend/views/AGENTS.md`:
  - Add "Canvas Editor" section with key rules
  - Reference `docs/frontend/canvas-editor.md`

- [ ] 11.4 Update `frontend/AGENTS.md`:
  - Add canvas editor patterns to frontend conventions

- [ ] 11.5 Update `.agents/skills/frontend-patterns/SKILL.md`:
  - Add "Canvas Editor" section with canvas-specific patterns
  - Reference the new doc

- [ ] 11.6 Update `.agents/instructions/frontend.instructions.md`:
  - Add canvas editor conventions to enforce

- [ ] 11.7 Update root `AGENTS.md` Important References:
  - Add `docs/frontend/canvas-editor.md`

- [ ] 11.8 Run per-file quality loop for each file (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts docs/frontend/canvas-editor.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/AGENTS.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/AGENTS.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts .agents/skills/frontend-patterns/SKILL.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts .agents/instructions/frontend.instructions.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts AGENTS.md --lifecycle codescene
  ```

- [ ] 11.9 Write outcome file: `.ai/plans/cert-plan-11/outcome/T11-knowledge-propagation-outcome.md`

**Files to Create/Modify:**
- `docs/frontend/canvas-editor.md` (new)
- `frontend/views/AGENTS.md` (modify)
- `frontend/AGENTS.md` (modify)
- `.agents/skills/frontend-patterns/SKILL.md` (modify)
- `.agents/instructions/frontend.instructions.md` (modify)
- `AGENTS.md` (modify — Important References)

**Requirements References:** Feature 6 (Outcome Knowledge Base)

**Quality Loop (per file):**
```bash
bun run scripts/health/sub-loop.ts docs/frontend/canvas-editor.md --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/views/AGENTS.md --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/AGENTS.md --lifecycle codescene
bun run scripts/health/sub-loop.ts .agents/skills/frontend-patterns/SKILL.md --lifecycle codescene
bun run scripts/health/sub-loop.ts .agents/instructions/frontend.instructions.md --lifecycle codescene
bun run scripts/health/sub-loop.ts AGENTS.md --lifecycle codescene
```

**Instruction Verification:**
- Read all applicable AGENTS.md files (root, frontend, frontend/views)
- Read `.agents/instructions/frontend.instructions.md`

---

## Acceptance Criteria → Task Mapping

| AC ID | Description | Task(s) |
|-------|-------------|---------|
| AC-11-01a | Canvas renders background + element overlays | T02, T03, T04 |
| AC-11-01b | Elements positioned via CSS absolute | T04 |
| AC-11-02a | Single click selects element | T04 |
| AC-11-02b | Ctrl+click adds/removes from selection | T04 |
| AC-11-02c | Marquee selects intersecting elements | T02 |
| AC-11-03a | Drag moves selected elements in real-time | T05 |
| AC-11-03b | Boundary constraints prevent overflow | T05 |
| AC-11-03c | Ghost outline shows original position | T05 |
| AC-11-03d | Undo coalesces consecutive drags | T05, T01 |
| AC-11-04a | 8 resize handles on selected element | T06 |
| AC-11-04b | Min size 20px enforced | T06 |
| AC-11-04c | Shift locks aspect ratio | T06 |
| AC-11-05a | Rotation handle above element | T07 |
| AC-11-05b | Rotation around center | T07 |
| AC-11-05c | Shift snaps to 15° increments | T07 |
| AC-11-06a | Grid snap when enabled | T08 |
| AC-11-06b | Configurable grid size | T08, T09 |
| AC-11-06c | Grid toggle in toolbar | T09 |
| AC-11-07a | Alignment guides within 5px threshold | T08 |
| AC-11-07b | Vertical + horizontal guide lines | T08 |
| AC-11-07c | Guides removed on drag end | T08 |
| AC-11-08a | Toolbar with all controls | T09 |
| AC-11-08b | Undo/redo functional | T09, T01 |
| AC-11-08c | Save persists to GraphQL | T09 |
| AC-11-09a | Zoom 10%–400% | T10, T09 |
| AC-11-09b | Ctrl+scroll zooms toward cursor | T10 |
| AC-11-09c | Fit-to-screen | T10, T09 |
| AC-11-09d | Spacebar+drag pans | T10 |
| AC-11-10a | Pixel rulers top + left | T10 |
| AC-11-10b | 50px major markings | T10 |
| AC-11-10c | Scroll sync | T10 |
| AC-11-11a | Arrow nudge 1px/10px | T10 |
| AC-11-11b | Delete removes selected | T10 |
| AC-11-11c | Ctrl+D duplicates | T10 |
| AC-11-11d | Escape clears selection | T10 |
| AC-11-11e | Ctrl+Z/Y undo/redo | T10 |
| AC-11-12a | Store not persisted | T01 |
| AC-11-12b | History max 50 | T01 |
| AC-11-12c | isDirty flag | T01 |
| AC-11-13a | Desktop-only rendering | T02 |

### Additional AC Mappings (React Flow Node Types)

| AC ID | Description | Task(s) |
|-------|-------------|---------|
| AC-11-N1a | TextNode content-editable with {{variable}} highlighting | T10a |
| AC-11-N1b | TextNode min size 20×20px enforced | T10a |
| AC-11-N2a | ImageNode object-fit modes applied | T10b |
| AC-11-N2b | ImageNode double-click replacement dialog | T10b |
| AC-11-N3a | ShapeNode renders all 7 shape types | T10c |
| AC-11-N3b | ShapeNode gradient/stroke styles applied | T10c |
| AC-11-N4a | QRCodeNode static/variable binding | T10d |
| AC-11-N4b | QRCodeNode logo overlay | T10d |
| AC-11-N5a | SignatureNode 3 modes (placeholder/uploaded/drawn) | T10e |
| AC-11-N5b | SignatureNode "Authorized by" label toggle | T10e |
| AC-11-N6a | BackgroundNode 4 bg types (color/gradient/image/pattern) | T10f |
| AC-11-N6b | BackgroundNode always behind + not directly selectable | T10f |
| AC-11-P1a | ElementLibraryPalette 8 drag sources | T10g |
| AC-11-P1b | ElementLibraryPalette keyboard accessible | T10g |
| AC-11-CM1a | CanvasContextMenu node-specific items | T10h |
| AC-11-CM1b | CanvasContextMenu element-type-specific items | T10h |
| AC-11-CM1c | CanvasContextMenu canvas background items | T10h |
| AC-11-S1a | useCanvasStore string[] selection (not Set) | T10i |
| AC-11-S1b | useCanvasStore not persisted | T10i |
| AC-11-S1c | Z-index renormalization after order ops | T10i |
| AC-11-H1a | 8 resize handles + rotation handle | T10j |
| AC-11-H1b | Shift locks aspect ratio on resize | T10j |
| AC-11-H1c | Shift snaps to 15° on rotate | T10j |
| AC-11-G1a | Alignment guides theme-palette colored | T10k |
| AC-11-G1b | Guides auto-removed on drag end | T10k |
| AC-11-K1a | Delete/Ctrl+D/Ctrl+C/Ctrl+V handled | T10l |
| AC-11-K1b | Arrow nudge 1px/10px | T10l |
| AC-11-K1c | Shortcuts ignored in text edit mode | T10l |

---

## Instruction File Verification

| Task | Instruction Files | AGENTS.md Files |
|------|------------------|-----------------|
| T01 | `.agents/instructions/frontend.instructions.md` | `frontend/common/stores/AGENTS.md`, `frontend/AGENTS.md` |
| T02 | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T03 | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T04 | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T05 | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T06 | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T07 | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T08 | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T09 | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/common/graphql/sharedDocuments/AGENTS.md`, `frontend/AGENTS.md` |
| T10 | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T10a | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T10b | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T10c | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T10d | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T10e | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T10f | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T10g | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T10h | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T10i | `.agents/instructions/frontend.instructions.md` | `frontend/common/stores/AGENTS.md`, `frontend/AGENTS.md` |
| T10j | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T10k | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T10l | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T10o | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/common/stores/AGENTS.md`, root `AGENTS.md` |
| T10p | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/common/stores/AGENTS.md`, root `AGENTS.md` |
| T11 | `.agents/instructions/frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root `AGENTS.md` |

---

## Domain-to-Artifacts Mapping

| Plan Domain | Docs Subdir | AGENTS.md to Update | Skills to Update | Instructions to Update |
|---|---|---|---|---|
| Frontend components / views | `docs/frontend/` | `frontend/AGENTS.md`, `frontend/views/AGENTS.md` | `.agents/skills/frontend-patterns/SKILL.md` | `.agents/instructions/frontend.instructions.md` |
| Frontend stores / state | `docs/frontend/` | `frontend/common/stores/AGENTS.md`, `frontend/AGENTS.md` | `.agents/skills/frontend-patterns/SKILL.md` | `.agents/instructions/frontend.instructions.md` |

---

## Execution Notes

- **Desktop-only**: All canvas components live under `frontend/desktop/views/`. Mobile uses simplified layout from Plan 10.
- **No SVG/Canvas API**: All rendering uses CSS-positioned divs with `position: absolute`.
- **Pointer Events exclusively**: Never use `onMouseDown/Move/Up` — use `onPointerDown/Move/Up` with `setPointerCapture`.
- **Session store**: `canvasStore` is NOT persisted (no `persist` middleware). State resets on page reload.
- **Debounced saves**: Position changes are only saved to GraphQL on pointerup or Save button click — never during drag.
- **Coalescing**: Consecutive MoveElement commands for the same element within 500ms merge into one undo entry.
- **i18n inline**: All translation keys are added as part of each task, not as a separate plan.
---

## Round 4 Enhancement Tasks

These tasks implement the Round 4 production-hardening enhancements defined in the design.md "Round 4 Enhancement" section. Each task references the corresponding design section (R4.X.Y).

### T-R4-01: React Flow Edge Case Hardening — Z-Index, Zoom Bounds, Pan Limits

**Objective:** Implement z-index overlap management, zoom boundaries (10%–400%), zoom to selection, pan bounds toggle, and collision detection with nudge.

**Subtasks:**

- [ ] R4.1.1 Create `frontend/views/dashboard/cert/templates/editor/useDragOverlap.ts`:
  - Custom hook subscribed to `useCanvasStore`
  - Uses `useStore` from `@xyflow/react` to read node positions during drag
  - Computes AABB intersection between dragged node and all others
  - Updates `overlappedNodeIds` array via `requestAnimationFrame` throttle
  - Provide helper `getOverlappingNodes(id: string): string[]`

- [ ] R4.1.2 Add store fields to `frontend/common/stores/canvasStore.ts`:
  ```typescript
  draggedNodeId: string | null;
  overlappedNodeIds: string[];
  panBoundsEnabled: boolean;
  setDraggedNode: (id: string | null) => void;
  togglePanBounds: () => void;
  zoomToSelection: () => void;
  ```
  - `panBoundsEnabled` default: `false`
  - `draggedNodeId` default: `null`
  - `overlappedNodeIds` default: `[]`

- [ ] R4.1.3 Create `frontend/views/dashboard/cert/templates/editor/CanvasOverlapOverlay.tsx`:
  - Renders semi-transparent rectangles over overlapped nodes during drag
  - Uses `theme.palette.primary.main` with 0.2 opacity
  - Subscribes to `overlappedNodeIds` from store
  - Positioned via `position: absolute` matching each overlapped node's AABB

- [ ] R4.1.4 Configure `<ReactFlow>` in main canvas component:
  ```tsx
  <ReactFlow
    maxZoom={4}
    minZoom={0.1}
    translateExtent={panBoundsEnabled ? { x: [-2000, 2000], y: [-2000, 2000] } : undefined}
    onNodeDragStart={(e, node) => useCanvasStore.getState().setDraggedNode(node.id)}
    onNodeDragStop={(e, node) => useCanvasStore.getState().setDraggedNode(null)}
  />
  ```
  - Ctrl+Scroll cursor zoom via `onWheel` handler calling `zoomTo(zoom, { x, y })`

- [ ] R4.1.5 Implement `zoomToSelection()` in store:
  - Uses stored `reactFlowApi.fitBounds(bounds)` where bounds = union AABB of `selectedNodeIds`
  - Falls back to `fitView()` when selection empty
  - Update `viewport` store field after fit

- [ ] R4.1.6 Add "Pan Bounds" toggle button to toolbar:
  - `IconButton` with `TabOutlined` icon (or use `ThemePanelOutlined`)
  - Tooltip text: localized "Restrict pan to canvas area"
  - Visually active state when `panBoundsEnabled === true` (filled icon)

- [ ] R4.1.7 Add `zoomIn` / `zoomOut` to `useKeyboardShortcuts` hook:
  - `Cmd+=` or `+` → `zoomIn()` (React Flow step 0.2)
  - `Cmd+-` or `-` → `zoomOut()` (step 0.2)
  - `Cmd+0` → `fitView()`
  - `Cmd+Shift+F` → `zoomToSelection()`

- [ ] R4.1.8 Run quality loop per file:
  ```bash
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/useDragOverlap.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/stores/canvasStore.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/CanvasOverlapOverlay.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/CanvasComponent.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/Toolbar.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/hooks/useKeyboardShortcuts.ts --lifecycle codescene
  ```

**Files to Create/Modify:**
- `frontend/views/dashboard/cert/templates/editor/useDragOverlap.ts` (new)
- `frontend/common/stores/canvasStore.ts` (modify — add fields, actions)
- `frontend/views/dashboard/cert/templates/editor/CanvasOverlapOverlay.tsx` (new)
- `frontend/views/dashboard/cert/templates/editor/CanvasComponent.tsx` (modify — add props)
- `frontend/views/dashboard/cert/templates/editor/Toolbar.tsx` (modify — add Pan Bounds toggle)
- `frontend/views/dashboard/cert/templates/editor/hooks/useKeyboardShortcuts.ts` (modify — add zoom shortcuts)

**Quality Loop:** Per-file progressive verification via `sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene).

**Instruction Verification:** Read `frontend/AGENTS.md`, `frontend/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`.

**Tests:**

---

### T-R4-02: Node Collision Detection & Nudge

**Objective:** When a node overlaps others > 30%, suggest a "nudge" action that moves it to the least-overlapping direction.

**Subtasks:**

- [ ] R4.1.3.1 Create `frontend/views/dashboard/cert/templates/editor/collisionUtils.ts`:
  - Export `computeNudgeDirection(node, others, gridSize, canvasBounds): Direction | null`
  - Export `applyDirection(node, dir, gridSize): Node` — returns a hypothetical position
  - Export `sumOverlaps(node, others): number` — sum of overlap areas
  - Export `outOfBounds(node, canvasBounds): boolean`
  - All pure functions, no DOM/store access — unit testable

- [ ] R4.1.3.2 Add "Nudge" submenu items to `CanvasContextMenu.tsx`:
  - Only visible when `overlappedNodeIds.length > 0`
  - Shows the computed nudge direction: "Nudge ↑" / "Nudge ↓" / "Nudge ←" / "Nudge →"
  - Tooltip: localized "Move this node clear of overlaps"
  - Click action: `nudgeNode(nodeId, dir)`

- [ ] R4.1.3.3 Add `nudgeNode` action to `useCanvasStore`:
  ```typescript
  nudgeNode: (id: string, direction: Direction) => void;
  ```
  - Updates node position by `gridSize` px in the given direction
  - Records as a single history entry

- [ ] R4.1.3.4 Add toast warning when no nudge direction available:
  - Triggers when overlap > 30% AND all four directions fail
  - Uses MUI `Snackbar` with localized message: "Node overlaps several others — use alignment guides or move manually."
  - Severity: warning, autoHideDuration: 4000

- [ ] R4.1.3.5 Add yellow warning outline on overlapping nodes:
  - During drag, nodes with overlap > 30% (where nudge fails) render with `borderColor: theme.palette.warning.main`
  - Outline goes away on drag end (if nudge succeeds) or remains until user resolves

**Files to Create/Modify:**
- `frontend/views/dashboard/cert/templates/editor/collisionUtils.ts` (new)
- `frontend/views/dashboard/cert/templates/editor/CanvasContextMenu.tsx` (modify — add nudge items)
- `frontend/common/stores/canvasStore.ts` (modify — add `nudgeNode`)
- `frontend/views/dashboard/cert/templates/editor/nodes/index.tsx` (modify — apply warning outline)

**Quality Loop:** Per-file progressive verification via `sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene).

**Tests:**

---

### T-R4-03: Off-Canvas Node Indicators

**Objective:** Show badges on canvas edges pointing toward nodes outside the current viewport.

**Subtasks:**

- [ ] R4.1.4.1 Create `frontend/views/dashboard/cert/templates/editor/CanvasOffscreenIndicators.tsx`:
  - Subscribe to React Flow viewport via `useStore(s => ({ transform: s.transform, width: s.width, height: s.height }))`
  - Compute viewport rect from transform + window size
  - Filter `nodes` to those whose position is not in viewport rect
  - For each off-canvas node, compute the closest edge (top/right/bottom/left) and an angle pointing toward the node
  - Render `IconButton` badge on the closest edge, visible above React Flow layer

- [ ] R4.1.4.2 Implement badge click → focus node:
  - Clicking the badge calls `useCanvasStore.getState().focusNode(nodeId)`
  - `focusNode` is a new store action that calls `reactFlowApi.setCenter(node.x + node.width/2, node.y + node.height/2, { zoom: 1, duration: 300 })`

- [ ] R4.1.4.3 Add `focusNode` to `useCanvasStore`:
  ```typescript
  focusNode: (id: string) => void;
  ```
  - Uses stored `reactFlowApi.setCenter` with smooth animation

- [ ] R4.1.4.4 Style the badges:
  - 24×24px circular `IconButton` with `theme.palette.primary.main` fill at 0.7 opacity
  - Contains icon corresponding to node type (TextFieldsOutlined, ImageOutlined, etc.)
  - Tooltip on hover: localized node type + position
  - Multiple adjacent nodes merge into a single badge with count: "+5"

**Files to Create/Modify:**
- `frontend/views/dashboard/cert/templates/editor/CanvasOffscreenIndicators.tsx` (new)
- `frontend/common/stores/canvasStore.ts` (modify — add `focusNode`)

**Quality Loop:** Per-file progressive verification via `sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene).

**Tests:**

---

### T-R4-04: 8-Way Node Resize Handles with Aspect Lock and Snap

**Objective:** Add 8 resize handles to each node, support Shift aspect lock, snap-to-grid during resize, min/max dimension enforcement.

**Subtasks:**

- [ ] R4.2.1 Create `frontend/views/dashboard/cert/templates/editor/nodes/ResizableNodeWrapper.tsx`:
  - Wraps each node content with React Flow's `<NodeResizer>` from `@xyflow/react`
  - `handleStyle` prop configured per direction with custom CSS
  - `isVisible={selected && !data.locked}` to show only on selected
  - Min/max dimensions passed per node type via `nodeDimensions.ts` lookup

- [ ] R4.2.2 Create `frontend/views/dashboard/cert/templates/editor/nodeDimensions.ts`:
  - Export `nodeDimensions: Record<CertElementType, { minWidth, minHeight, maxWidth, maxHeight }>`
  - Per design §R4.2.3 table:
    - Text: 30×20 → 2000×1000
    - Image: 20×20 → 2000×2000
    - Shape: 10×10 → 2000×2000
    - QR Code: 40×40 → 600×600 (square enforced)
    - Signature: 80×30 → 600×200
    - Background: 595×842 → 595×842 (fixed A4 size)

- [ ] R4.2.3 Implement aspect ratio lock for corner handles:
  - `onResizeStart` captures `resizeStartRatio = width/height`
  - `onResize` checks `event.shiftKey` — if true, forces `height = width / resizeStartRatio` (or vice versa)
  - When `shiftKey` released mid-drag, ratio lock releases

- [ ] R4.2.4 Enforce QR Code square always:
  - QRCodeNode wraps with `<NodeResizer keepAspectRatio>` permanently
  - No Shift needed; square ratio always maintained

- [ ] R4.2.5 Resize handle visual feedback:
  - Create `StyledResizeHandle` with MUI `styled` (per design §R4.2.4)
  - 8px → 10px hover, 10px active with `secondary.main` border
  - When snapped, `success.main` border as visual confirmation

- [ ] R4.2.6 Resize with snap to grid:
  - When `snapEnabled === true`, attach `shouldResize` callback to `NodeResizer`
  - In callback, round width/height to nearest `gridSize` multiple
  - But DO NOT snap if Shift is held with aspect lock (snapping breaks ratio)

- [ ] R4.2.7 Resize via property panel sync:
  - In `PropertyPanel.tsx` (right sidebar), add "Size" section with `Width` and `Height` `TextField`s
  - `InputAdornment="px"`, type=number, debounced 200ms on change
  - On change, call `useCanvasStore.getState().updateNode(id, { style: { width, height } })`
  - Min/max validation: red border + helper text when out of range
  - "Lock aspect" `Checkbox` in the panel — when checked, future panel edits preserve ratio

- [ ] R4.2.8 Wire `ResizableNodeWrapper` into the 6 node components:
  - Each node component (`TextNode.tsx`, `ImageNode.tsx`, etc.) wraps its content with `ResizableNodeWrapper`

**Files to Create/Modify:**
- `frontend/views/dashboard/cert/templates/editor/nodes/ResizableNodeWrapper.tsx` (new)
- `frontend/views/dashboard/cert/templates/editor/nodeDimensions.ts` (new)
- `frontend/views/dashboard/cert/templates/editor/nodes/TextNode.tsx` (modify — wrap)
- `frontend/views/dashboard/cert/templates/editor/nodes/ImageNode.tsx` (modify — wrap)
- `frontend/views/dashboard/cert/templates/editor/nodes/ShapeNode.tsx` (modify — wrap)
- `frontend/views/dashboard/cert/templates/editor/nodes/QRCodeNode.tsx` (modify — wrap + keepAspectRatio)
- `frontend/views/dashboard/cert/templates/editor/nodes/SignatureNode.tsx` (modify — wrap)
- `frontend/views/dashboard/cert/templates/editor/nodes/BackgroundNode.tsx` (modify — wrap)
- `frontend/views/dashboard/cert/templates/editor/PropertyPanel.tsx` (modify — add Size section)

**Quality Loop:** Per-file progressive verification via `sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene).

**Instruction Verification:** Read `frontend/AGENTS.md`, `frontend/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`. Note MUI v9: NO style props (use `sx` prop), Outlined icon names.

**Tests:**

---

### T-R4-05: Snap-to-Grid System — Configurable Size, Toggle, Visual Overlay, Snap to Edges

**Objective:** Implement configurable grid (4/8/16/32px), toggle, visual grid overlay, snap to other nodes' edges.

**Subtasks:**

- [ ] R4.3.1 Update `useCanvasStore` with proper grid size handling:
  - Already has `gridSize`, `gridVisible`, `setGridSize`
  - Add validation in `setGridSize`: if size not in [4, 8, 16, 32], call `logger.warn("Invalid grid size")` and reject

- [ ] R4.3.2 Add grid size selector in toolbar:
  - `ToggleButtonGroup` with four `ToggleButton`s labeled "4px", "8px", "16px", "32px"
  - `value={gridSize}`, `onChange={(e, newSize) => newSize && setGridSize(newSize)}`
  - Disable the group when `gridVisible === false` (greyed out)
  - Use MUI `ToggleButtonGroup` with `exclusive`

- [ ] R4.3.3 Render visual grid as background CSS:
  - Conditional on `gridVisible && backgroundPattern === "dots"` (default):
    ```tsx
    sx={{
      backgroundImage: `radial-gradient(circle, ${theme.palette.grey[300]} 1px, transparent 1px)`,
      backgroundSize: `${gridSize}px ${gridSize}px`,
    }}
    ```
  - For "lines": two `linear-gradient`s
  - For "cross": combined dot + line at intersections
  - For "none": no background image

- [ ] R4.3.4 Background pattern switcher in toolbar:
  - `ToggleButtonGroup` with icons (GrainOutlined, GridOnOutlined, AddOutlined, DoDisturbOutlined)
  - Bound to `backgroundPattern: "dots" | "lines" | "cross" | "none"` in store
  - Add `backgroundPattern` field and `setBackgroundPattern` action to store
  - Default: `"dots"`

- [ ] R4.3.5 Implement snap to other nodes' edges:
  - In `useDragOverlap.ts` extension (new file `useDragSnap.ts`):
    - On every drag frame, compute closest snap target (other nodes' edges/centers and canvas center)
    - Threshold = `gridSize / 2`
    - Return `{ xAxis, yAxis }` snap coordinates (or null each)
  - On drag, if `snapEnabled === true`, force dragged node position to snap coordinates
  - Trigger alignment guide line display (see T-R4-11)

- [ ] R4.3.6 Add canvas center as snap target:
  - Compute `canvasCenterX = canvasBounds.width / 2`, `canvasCenterY = canvasBounds.height / 2`
  - Include in `findSnapTargets` candidates

- [ ] R4.3.7 Add toggle for snap-to-other-nodes in toolbar:
  - Separate from `snapEnabled` (which is grid snap)
  - `snapToNodes: boolean` in store
  - `Tooltip`-labelled `IconButton` toggle, defaults to `true`

- [ ] R4.3.8 Run quality loop on all touched files.

**Files to Create/Modify:**
- `frontend/views/dashboard/cert/templates/editor/Toolbar.tsx` (modify — add Grid Size selector, Background Pattern switcher, Snap-to-Nodes toggle)
- `frontend/views/dashboard/cert/templates/editor/useDragSnap.ts` (new)
- `frontend/common/stores/canvasStore.ts` (modify — add `backgroundPattern`, `snapToNodes`)
- `frontend/views/dashboard/cert/templates/editor/CanvasComponent.tsx` (modify — apply background CSS)

**Quality Loop:** Per-file progressive verification via `sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene).

**Tests:**

---

### T-R4-06: Multi-Select & Box Selection — Rubber Band, Shift+Click, Multi-Drag, Multi-Align

**Objective:** Enable rubber band selection, shift+click add/remove, select all, multi-drag, multi-delete, and multi-align toolbar.

**Subtasks:**

- [ ] R4.4.1 Configure `<ReactFlow selectionOnDrag panOnDrag={[1, 2]}>` for rubber band:
  - Left-mouse drag selects; middle/right-mouse for pan
  - Touch: pan with one finger when not on a node, select with drag from empty canvas

- [ ] R4.4.2 Implement shift+click add/remove:
  - In `CanvasComponent.tsx`, add `onNodeClick` handler:
    ```tsx
    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
      if (event.shiftKey) {
        const current = useCanvasStore.getState().selectedNodeIds;
        const isSelected = current.includes(node.id);
        useCanvasStore.getState().selectNodes(
          isSelected ? current.filter((id) => id !== node.id) : [...current, node.id]
        );
      } else {
        useCanvasStore.getState().selectNodes([node.id]);
      }
    }, []);
    ```

- [ ] R4.4.3 Add Cmd+A / Ctrl+A → select all:
  - In `useKeyboardShortcuts.ts`, register Cmd+A
  - Check `document.activeElement` is not input/textarea/contenteditable
  - If yes, do nothing (default select-all)
  - If no, preventDefault and call `useCanvasStore.getState().selectAll()`

- [ ] R4.4.4 Implement selection bounds display:
  - When `selectedNodeIds.length >= 2`, compute union AABB
  - Render `<SelectionBoundsRect>` overlay with dashed border + Chip label "N selected · W×Hpx"
  - Use `theme.palette.primary.main` dashed border, transparent fill

- [ ] R4.4.5 Multi-drag move:
  - React Flow handles this natively when multiple nodes have `selected: true`
  - Verify all selected nodes move together — no extra code needed, just verify and add a test

- [ ] R4.4.6 Multi-delete with batch undo:
  - Add `deleteSelected()` to `useCanvasStore`:
    ```typescript
    deleteSelected: () => {
      useCanvasStore.getState().withBatch(`Delete ${selectedNodeIds.length} nodes`, () => {
        selectedNodeIds.forEach(id => deleteNode(id));
      });
    };
    ```
  - Register `Delete` / `Backspace` keyboard shortcut → `deleteSelected()`

- [ ] R4.4.7 Alignment toolbar:
  - Create `frontend/views/dashboard/cert/templates/editor/AlignmentToolbar.tsx`
  - Show only when `selectedNodeIds.length >= 2`
  - 8 `IconButton`s with `Tooltip`s: Align Left/Right/Center H/Top/Bottom/Center V/Distribute H/Distribute V
  - Each calls the corresponding `alignLeft/Right/CenterH/Top/Bottom/CenterV/distributeH/distributeV` store action (all wrapped in `withBatch`)

- [ ] R4.4.8 Implement alignment algorithms:
  - Create `frontend/views/dashboard/cert/templates/editor/alignmentUtils.ts`
  - Export `alignLeft(nodes)`, `alignRight(nodes)`, `alignCenterH(nodes)`, `alignTop(nodes)`, `alignBottom(nodes)`, `alignCenterV(nodes)`, `distributeH(nodes)`, `distributeV(nodes)`
  - All pure functions returning new node arrays; store actions apply the results

- [ ] R4.4.9 Add store actions for alignment:
  ```typescript
  alignLeftSelected: () => void;
  alignRightSelected: () => void;
  alignCenterHSelected: () => void;
  alignTopSelected: () => void;
  alignBottomSelected: () => void;
  alignCenterVSelected: () => void;
  distributeHSelected: () => void;
  distributeVSelected: () => void;
  ```
  Each uses `alignmentUtils` on `selectedNodeIds`, wraps in `withBatch("Align N nodes action")`.

- [ ] R4.4.10 Run quality loop.

**Files to Create/Modify:**
- `frontend/views/dashboard/cert/templates/editor/AlignmentToolbar.tsx` (new)
- `frontend/views/dashboard/cert/templates/editor/alignmentUtils.ts` (new)
- `frontend/views/dashboard/cert/templates/editor/SelectionBoundsRect.tsx` (new)
- `frontend/common/stores/canvasStore.ts` (modify — add alignment actions, `deleteSelected`)
- `frontend/views/dashboard/cert/templates/editor/CanvasComponent.tsx` (modify — add `onNodeClick`, `selectionOnDrag`)
- `frontend/views/dashboard/cert/templates/editor/hooks/useKeyboardShortcuts.ts` (modify — add Cmd+A, Delete)

**Quality Loop:** Per-file progressive verification via `sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene).

**Tests:**

---

### T-R4-07: Copy/Paste Between Canvases — Clipboard Store, Center, Offset, Cross-Tab

**Objective:** Implement clipboard store with serialized nodes, paste to viewport center, offset multi-paste, cross-tab via localStorage.

**Subtasks:**

- [ ] R4.5.1 Create `frontend/common/stores/clipboardStore.ts`:
  - Zustand store (NOT persisted — cross-tab via localStorage manual)
  - Fields: `entry: ClipboardEntry | null`, `sourceCanvasId: string | null`, `pasteCounter: number`
  - Actions: `saveToClipboard(nodes)`, `readFromClipboard()`, `clearClipboard()`, `loadFromLocalStorage()`
  - On save: serialize nodes, compute bounding box, store relative offsets, persist to `localStorage` key `"cert-clipboard"` with `JSON.stringify`

- [ ] R4.5.2 Implement serialization with Zod validation:
  - Define `serializedNodeSchema` (zod) for type-safe parsing on read
  - Define `clipboardPayloadSchema` with `version: 1`
  - On read: parse localStorage → validate with zod → on invalid, log warning and return null

- [ ] R4.5.3 Add cross-tab listener in `clipboardStore.ts` initialization:
  ```tsx
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === "cert-clipboard" && e.newValue) {
        useClipboardStore.getState().loadFromLocalStorage();
      }
    });
  }
  ```

- [ ] R4.5.4 Implement paste-to-viewport-center:
  - Add `pasteNodes()` action to `useCanvasStore`:
    - Read `useClipboardStore.getState().entry`
    - Compute viewport center from `reactFlowApi.getViewport()`
    - For each serialized node: create new node with new UUID, position = `viewportCenter + relativeOffset + node.localPosition`
    - Re-select pasted nodes only
    - Push single history entry via `withBatch("Paste N nodes", ...)`

- [ ] R4.5.5 Multi-paste offset:
  - Each paste increments `pasteCounter` in `useClipboardStore`
  - Position offset = `pasteCounter * 20` applied to pasted cluster bounding box origin
  - Reset `pasteCounter = 0` when a NEW entry is copied

- [ ] R4.5.6 Add toast on cross-tab clipboard update:
  - In `clipboardStore.ts`, after `loadFromLocalStorage`, fire a custom event or call `useToast`
  - Snackbar: "Clipboard updated from another tab" via `useToast` hook

- [ ] R4.5.7 Wire copy/paste to keyboard:
  - In `useKeyboardShortcuts.ts`, register `Cmd/Ctrl+C` and `Cmd/Ctrl+V`
  - Skip if focus is in an input (so user can copy text from property panel)
  - On `Cmd+C`: call `useCanvasStore.getState().copyNodes(selectedNodeIds)`
  - On `Cmd/V`: call `useCanvasStore.getState().pasteNodes()`

- [ ] R4.5.8 Add `copyNodes` action to `useCanvasStore`:
  - Fetches nodes by IDs
  - Serializes via the same format as `clipboardStore.saveToClipboard`
  - Resets `pasteCounter = 0` via `useClipboardStore.getState()`

- [ ] R4.5.9 Update `CanvasContextMenu.tsx`:
  - "Copy" item: enabled when at least one node selected, calls `copyNodes([contextMenu.nodeId ?? ...selectedNodeIds])`
  - "Paste" item: enabled when `useClipboardStore.getState().entry` is non-null, calls `pasteNodes()`

- [ ] R4.5.10 Run quality loop.

**Files to Create/Modify:**
- `frontend/common/stores/clipboardStore.ts` (new)
- `frontend/common/stores/canvasStore.ts` (modify — add `pasteNodes`, `copyNodes` already exists, wire cross-store)
- `frontend/views/dashboard/cert/templates/editor/hooks/useKeyboardShortcuts.ts` (modify — add Copy/Paste)
- `frontend/views/dashboard/cert/templates/editor/CanvasContextMenu.tsx` (modify — wire Copy/Paste items)

**Quality Loop:** Per-file progressive verification via `sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene).

**Tests:**

---

### T-R4-08: Touch Support — Pinch, Pan, Long-Press, Larger Handles

**Objective:** Add pinch-to-zoom, two-finger pan, long-press select, drag to move, tap to edit, touch-friendly handles.

**Subtasks:**

- [ ] R4.6.1 Configure React Flow touch props on `<ReactFlow>`:
  ```tsx
  <ReactFlow
    zoomOnPinch
    panOnDrag={[1, 2]}  // middle/right mouse + two-finger touch
    selectionOnDrag  // single-finger touch = rubber band selection
  />
  ```

- [ ] R4.6.2 Create `frontend/views/dashboard/cert/templates/editor/hooks/useLongPress.ts`:
  - Returns `{ start, cancel }` callbacks
  - Triggered via `onTouchStart` on a node
  - After 500ms hold (without 10px finger movement), fires the callback
  - The callback adds the node to `selectedNodeIds` AND enters drag mode

- [ ] R4.6.3 Touch-friendly handles:
  - In `ResizableNodeWrapper.tsx`, detect touch via `useMediaQuery("(pointer: coarse)")`
  - Adjust `handleStyle.width/height` to 18px on touch, 8px on desktop
  - Selection outline width: 2px on touch (vs 1px desktop)

- [ ] R4.6.4 Tap → select, double-tap → edit:
  - Add `onTouchEnd` handler (with timeout for double-tap detection)
  - First tap (within 300ms): select node
  - Second tap within 350ms of first: enter edit mode OR open settings dialog

- [ ] R4.6.5 Create `frontend/views/dashboard/cert/templates/editor/TouchGestureHandler.tsx`:
  - Wraps the `<ReactFlow>` instance
  - State machine for gesture classification (tap/double-tap/long-press/drag)
  - Routes touch events to React Flow's handlers or custom logic
  - Prevents React Flow's pan when in long-press drag mode

- [ ] R4.6.6 Document touch behavior in canvas help:
  - Update `docs/frontend/canvas-editor.md` (created in T11) with a "Touch Support" section
  - List the gesture → action table

- [ ] R4.6.7 Run quality loop.

**Files to Create/Modify:**
- `frontend/views/dashboard/cert/templates/editor/hooks/useLongPress.ts` (new)
- `frontend/views/dashboard/cert/templates/editor/TouchGestureHandler.tsx` (new)
- `frontend/views/dashboard/cert/templates/editor/nodes/ResizableNodeWrapper.tsx` (modify — touch handle sizes)
- `frontend/views/dashboard/cert/templates/editor/CanvasComponent.tsx` (modify — touch props)

**Quality Loop:** Per-file progressive verification via `sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene).

**Tests:**

---

## Round 5: Advanced Fill & Stroke Tasks

> Round 5 task list for Plan 11 — canvas-layer fill/stroke rendering, on-canvas gradient/pattern/image editing overlays, multi-stroke layering, blend-mode compositing, and fill/stroke caching. These consume the types from Plan 10 R5-T1 (`@/frontend/common/stores/cert/fillStrokeTypes`). Total R5 scope for Plan 11: 8 tasks (~24 hours).

### R5-T1: SVG Fill Renderer Component

- [ ] Create `frontend/views/dashboard/cert/templates/editor/renderers/FillRenderer.tsx` (new)
  - `interface FillRendererProps { elementId: string; fill: FillConfig; width: number; height: number; }`
  - Switches on `fill.type`:
    - `'none'` → `<rect fill="none" />`
    - `'solid'` → `<rect fill={fill.solidColor} fillOpacity={fill.solidOpacity / 100} />`
    - `'linear-gradient'` → `<defs><linearGradient>` + `<rect fill="url(#grad-{elementId})" />`
    - `'radial-gradient'` → same with `<radialGradient>`, computes `cx/cy/r/fx/fy` from `centerX/centerY/radius/focalOffsetX/focalOffsetY`
    - `'conic-gradient'` → approach A: renders an HTML `<div>` overlay positioned over the element with `background: conic-gradient(...)` and `clip-path` matching the shape; approach B (export only) — 72 SVG wedge paths
    - `'pattern'` → `<defs><pattern patternUnits="userSpaceOnUse" patternTransform={...}>` containing the inline SVG from `fillStrokeStore.patternLibrary`, with `<rect fill="url(#pattern-{elementId})" />`
    - `'image'` → `<defs><clipPath><rect/></clipPath></defs>` + `<image href={fill.image.url} x={fill.image.positionX} y={...} width={width * scale/100} preserveAspectRatio={...} />` clipped to the shape
    - `'gradient-mesh'` → offscreen `<canvas>` with IDW interpolation; output `canvas.toDataURL()` used as `<image>` fill cropped to the shape
  - All MUI v9 `sx={{}}` (no style props)
  - All colors from theme palette (`theme.palette.*`), never hardcoded colors — except where the fill itself defines a color explicitly (e.g. user-set `fill.solidColor = '#FF0000'` — that is user-controlled, not a hardcoded palette escape)
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Create `frontend/views/dashboard/cert/templates/editor/renderers/meshRasterizer.ts` (new)
  - `interface MeshRasterizerOpts { mesh: GradientMeshValue; width: number; height: number; blockSize?: number; }` (blockSize default 4)
  - Returns a `Uint8ClampedArray` (RGBA pixel buffer)
  - Algorithm: Inverse-distance weighting with power = `1 + smoothing/50` (range 1-3)
  - Use `OffscreenCanvas` if available (Feature Detection `typeof OffscreenCanvas !== 'undefined'`); fall back to in-DOM `<canvas>` for SSR safety
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T2: Gradient Editor Overlay Component

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5 Fill/Stroke) alongside R5-T3, R5-T4, R5-T5. All depend on R5-T1. Each targets a separate overlay/renderer component.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/overlays/GradientEditorOverlay.tsx` (new)
  - `interface GradientEditorOverlayProps { elementId: string; elementBounds: CanvasBounds; gradient: GradientValue; onGradientChange: (updated: GradientValue) => void; editorType: 'linear' | 'radial' | 'conic'; }`
  - Renders only when `fillStrokeStore.gradientEditorActive === true && gradientEditorElementId === elementId`
  - **Linear**: gradient axis line (from start to end), draggable endpoint handles (10x10 px circles in `theme.palette.secondary.main`), stop squares (8x8 px) along the axis at `stop.position`, double-click opens mini color picker
  - **Radial**: draggable center point (crosshair), radius handle (filled circle at edge), focal point handle (small square offset from center)
  - **Conic**: draggable center point + rotation handle (line from center + arrow icon)
  - All drag handlers use pointer events with `requestAnimationFrame` throttling
  - Subscribe to `useCanvasStore` only for `zoom` (to inverse-scale handle sizes) and `pan` (offset)
  - Keyboard: `Escape` closes the editor (sets `gradientEditorActive = false`)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T3: Pattern Preview Overlay

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5 Fill/Stroke) alongside R5-T2, R5-T4, R5-T5. All depend on R5-T1. Each targets a separate overlay/renderer component.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/overlays/PatternTileBoundaryOverlay.tsx` (new)
  - Shows dashed `divider`-colored outlines (1 px, `opacity: 0.3`) at each pattern tile boundary — visible only when the pattern-filled element is selected and the property panel has focus
  - Tiles computed from `fill.pattern.scale`, `.angle`, `.repeatWidth`, `.repeatHeight`
  - This overlay is professional-grade — similar to the "show tiling" view in Illustrator's Pattern Options
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T4: Image Fill Position/Scale Overlay

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5 Fill/Stroke) alongside R5-T2, R5-T3, R5-T5. All depend on R5-T1. Each targets a separate overlay/renderer component.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/overlays/ImageFillOverlay.tsx` (new)
  - Position handle (top-left corner of image), scale handle (bottom-right corner), fit-to-element `IconButton`
  - Dragging position handle changes `image.positionX/Y`; scale handle changes `image.scale` (10-200%) — `Shift` constrains aspect
  - "Fit to Element" resets `image.scale = 100; image.positionX = 0; image.positionY = 0`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T5: SVG Stroke Renderer Component

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5 Fill/Stroke) alongside R5-T2, R5-T3, R5-T4. All depend on R5-T1. Each targets a separate overlay/renderer component.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/renderers/StrokeRenderer.tsx` (new)
  - `interface StrokeRendererProps { elementId: string; stroke: StrokeConfig; shapePath: string; elementBounds: CanvasBounds; }`
  - Single layer: SVG `stroke/strokeWidth/strokeOpacity/strokeDasharray/strokeDashoffset/strokeLinecap/strokeLinejoin/strokeMiterlimit` on the shape `<path>`
  - Pre-computes `dashArray` from `layer.dashStyle` and `layer.dashLength/gapLength`: `'solid' → none`, `'dashed' → '6,4'`, `'dotted' → '1,3'` (forces `strokeLinecap: 'round'` if user set otherwise — visual correctness), `'custom' → '{dashLength},{gapLength}'`
  - Calls `strokeToSvgAttrs` from `fillStrokeUtils.ts` (Plan 10 T1)
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Create `frontend/views/dashboard/cert/templates/editor/utils/strokePositionUtils.ts` (new)
  - `renderInsideStroke(shapePath, width, bounds)`: returns the clipped-inside-stroke SVG (clipped outer shape minus inset shrunk shape); supports rectangle (shrink rx/ry), ellipse (shrink rx/ry), polygon (shoelace-based inset), path (path-offset utility)
  - `renderOutsideStroke(shapePath, width, bounds)`: returns the clipped-outside-stroke SVG (doubled strokeWidth with inverted clip-path → outer half visible)
  - Both functions return serialized SVG fragment strings + `<defs>` additions
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T6: Multi-Stroke Layer Rendering

- [ ] Extend `frontend/views/dashboard/cert/templates/editor/renderers/StrokeRenderer.tsx` (modify)
  - Add `MultiStrokeRenderer` internal component when `stroke.layers.length > 1`
  - Each layer rendered as a separate `<use href="#shape-{elementId}" stroke={...} strokeWidth={...} />` element, in order from bottom to top (layers[0] bottommost)
  - The first/lowermost layer uses the inside/center/outside stroke-position logic via `strokePositionUtils` (T5); subsequent layers-compose via z-order
  - `paintOrder`: per-element `paintOrder` field ('fill-stroke' default — fill drawn over strokes; can be flipped to 'stroke-fill' to draw stroke under fill via SVG `paint-order` attribute)
  - Gradient stroke layer: `stroke="url(#stroke-grad-{layerId})"` referencing a `<linearGradient>`/`<radialGradient>` def
  - Pattern stroke layer: `stroke="url(#stroke-pattern-{layerId})"` referencing a `<pattern>` def
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T7: Blend-Mode Canvas Rendering & Caching

- [ ] Extend `FillRenderer.tsx` and `StrokeRenderer.tsx` (modify)
  - Apply `style={{ mixBlendMode: layer.blendMode }}` on the per-layer elements when `fillStrokeStore.globalBlendModeEnabled === true`; when `false`, CSS is `'normal'`
  - The global toggle is a toolbar `IconButton` (`frontend/views/dashboard/cert/templates/editor/ToolbarBlendModeToggle.tsx`, new — wires to `fillStrokeStore.setGlobalBlendModeEnabled`)
- [ ] Create `frontend/views/dashboard/cert/templates/editor/utils/fillStrokeCache.ts` (new)
  - `interface FillStrokeCacheKey { fill: FillConfig; width: number; height: number; }`
  - `getCachedOrComputeFill(elementId, fill, width, height)`: looks up `fillStrokeStore.fillStrokeCache.get(elementId)`, compares the serialized key (`JSON.stringify({fill, width, height})`), recomputes via `fillStrokeUtils.fillToSvgAttrs` if cache miss
  - Cache cleared on `onNodeDragStop` (size may have changed), undo/redo events (clearAll), and zoom change (render scale changes meaning)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T8: Live Preview Commit Flow + Canvas Store Additions

- [ ] Update `frontend/views/dashboard/cert/templates/editor/useCanvasStore.ts` (modify — same Zustand store from earlier Plan 11 rounds)
  - Add: `gradientEditingElementId: string | null`, `setGradientEditingElement: (id) => void`
  - Add: `imageFillEditingElementId: string | null`, `setImageFillEditingElement: (id) => void`
  - Coordinate with `fillStrokeStore.gradientEditorActive` to ensure only one overlay is shown at a time
- [ ] Hook the live-preview-commit model into the existing autosave hook (R4 T34)'s SystemUI flow
  - When fill/stroke changes flow through `updateElement`, they go into the canvas store as drafts
  - The R4 T34 autosave hook flushes to Apollo after 500ms debounce
  - When `gradientEditorActive === true` the autosave is **paused** (prevents user ghost-commits during active editing); "Done" button or click-outside calls `setGradientEditorActive(false)` and triggers immediate flush
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T9: Plan 11 R5 Test Suite

> **Parallelizable**: This task runs as a subagent in Wave 4 (R5 Fill/Stroke) alongside R5-T7, R5-T8. It waits on R5-T6 and all Wave 2 component tasks being complete. Each Wave 4 task targets a separate integration surface.

- [ ] Create `test/unit/meshRasterizer.test.ts` (new)
  - Test: single mesh point — entire buffer is that point's color
  - Test: 4 corner points (red/yellow/blue/green) produce recognizable 4-quadrant interpolation
  - Test: `smoothing: 0` vs `smoothing: 100` produces sharper vs smoother gradient interpolation
  - Test: `blockSize: 4` vs `blockSize: 1` — both produce same color at the center within tolerance
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Create `test/unit/fillStrokeCache.test.ts` (new)
  - Test: cache hit when key matches — no recomputation (mock `fillToSvgAttrs` returns `spy`, expect single call)
  - Test: cache miss on `fill.solidColor` change
  - Test: cache miss on `width` change
  - Test: cache hit when only `x/y` of element changes (drag without resize)
  - Test: clearCache invalidates by elementId
  - Test: clearAllCache empties the entire `fillStrokeCache` Map
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T10: Knowledge Propagation (Plan 11 R5)

- [ ] Update `frontend/IMPLEMENTATION_LEARNINGS.md` (append-only)
  - Add an entry for the conic-gradient double approach: on-screen approach A (HTML overlay + `clip-path`) is faster than export-time approach B (72 SVG wedges) — both implemented, used contextually
  - Add an entry for the inside/outside stroke rendering gotcha: SVG `stroke-alignment` is unsupported in browsers; use clipping tricks (outer shape - inset shrunk shape) instead
  - Add an entry for the meshRasterizer OffscreenCanvas feature detection — required for SSR safety
- [ ] Update `frontend/COMPONENT_PATTERNS.md` (append-only)
  - Add the "Gradient Editor Overlay" pattern (shows the three editor types side-by-side: linear, radial, conic — calls out the shared `setGradientEditorActive` lifecycle)
  - Add the "Multi-Stroke via `<use>`" rendering pattern
- [ ] **Quality loop**: tsgo + biome + lint queue client

### Instruction File & AGENTS.md Discovery (Round 5 Append, Plan 11)

| Task | Files Created/Modified | AGENTS.md to Read | Instructions to Read |
|---|---|---|---|
| R5-T1 | `renderers/FillRenderer.tsx`, `renderers/meshRasterizer.ts` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T2 | `overlays/GradientEditorOverlay.tsx` | same as above | same as above |
| R5-T3 | `overlays/PatternTileBoundaryOverlay.tsx` | same | same |
| R5-T4 | `overlays/ImageFillOverlay.tsx` | same | same |
| R5-T5 | `renderers/StrokeRenderer.tsx`, `utils/strokePositionUtils.ts` | same | same |
| R5-T6 | `renderers/StrokeRenderer.tsx` (modify — extends T5) | same | same |
| R5-T7 | `FillRenderer.tsx` (modify), `StrokeRenderer.tsx` (modify), `ToolbarBlendModeToggle.tsx`, `utils/fillStrokeCache.ts` | same | same |
| R5-T8 | `useCanvasStore.ts` (modify) | `frontend/stores/AGENTS.md`, `AGENTS.md` | same |
| R5-T9 | `test/unit/{meshRasterizer,fillStrokeCache}.test.ts` | `AGENTS.md` | `.agents/instructions/tests.instructions.md`, `.agents/instructions/frontend.instructions.md` |
| R5-T10 | `frontend/IMPLEMENTATION_LEARNINGS.md`, `frontend/COMPONENT_PATTERNS.md` (append-only) | `frontend/AGENTS.md`, `AGENTS.md` | — |

### Round 5 Execution Order (Plan 11)

```
Phase R5-A (sequential): R5-T1 (FillRenderer — depends on fillStrokeUtils from Plan 10 R5-T1 being committed)
Phase R5-B (via parallel subagents): R5-T2 (Gradient editor overlay), R5-T3 (Pattern tile boundaries), R5-T4 (Image fill overlay), R5-T5 (StrokeRenderer) — all wait on T1
Phase R5-C (sequential): R5-T6 (Multi-stroke — modifies T5's StrokeRenderer) — waits on T5 done
Phase R5-D (sequential): R5-T7 (Blend-mode + cache — modifies T1/T6 outputs) — waits on T6
Phase R5-E (sequential): R5-T8 (Store additions + autosave integration — waits on T7 for the gradientEditorActive coordination)
Phase R5-F (via parallel subagents): R5-T9 (test suite — waits on T1-T8 implementation)
Phase R5-G (sequential): R5-T10 (knowledge propagation)
```

**Plan 11 R5 total estimated time**: ~24 hours (~10 wall-clock hours via parallel subagent phases R5-B and R5-F)

### R5 Fill/Stroke Parallel Subagent Strategy

### Wave 1 (R5 Fill): R5-T1
- Tasks: R5-T1 (FillRenderer)
- Rationale: Foundation — all other R5 tasks depend on T1's fillStrokeUtils.

### Wave 2 (R5 Fill): R5-T2, R5-T3, R5-T4, R5-T5
- Tasks (via parallel subagents): R5-T2 (Gradient editor overlay), R5-T3 (Pattern tile boundaries), R5-T4 (Image fill overlay), R5-T5 (StrokeRenderer)
- Rationale: All depend on R5-T1. Each targets a separate overlay/renderer module.

### Wave 3 (R5 Fill): R5-T6 → R5-T7 → R5-T8
- Tasks: R5-T6 (Multi-stroke) → R5-T7 (Blend-mode + cache) → R5-T8 (Store additions) — sequential, each modifies the prior task's output.

### Wave 4 (R5 Fill): R5-T9
- Tasks: R5-T9 (test suite)
- Rationale: Test suite waits on all T1–T8 implementation. Single-task wave.

### Final Wave (R5 Fill): R5-T10
- Task: R5-T10 (Knowledge Propagation)
- Rationale: Must run after all R5 Fill/Stroke implementation is complete.

### Plan 11 Combined Total Time (Rounds 1-5)

- Rounds 1-3: ~30 hours → ~18 wall-clock hours
- Round 4: ~20 hours → ~12 wall-clock hours
- Round 5 (R5-T1 through R5-T10): ~24 hours → ~10 wall-clock hours
- **Plan 11 total**: ~74 hours → ~40 wall-clock hours with R5 parallelism.

> All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks (tsgo → biome → lint → codescene). The lint queue server must be running before any lint call. See `AGENTS.md` §"Lint Queue Server" for startup commands.

## Round 5: Snap & Align Tasks — Plan 11 (Snap Engine, Smart Guides, Handles, Multi-Element Transform)

> Round 5 is reused across independent feature domains. Design reference: Plan 11 §"Round 5: Snap & Align Engine". Canonical types live in `@/frontend/common/stores/cert/snapAlignTypes.ts` (Plan 10 R5S-T1). All quality loops use `scripts/health/sub-loop.ts <path> --lifecycle <stage>`.

### R5S-T1: Snap Engine — Core

- [ ] Create `frontend/views/dashboard/cert/templates/editor/snap/snapEngine.ts` (new)
  - Export `SnapAxis`, `SnapCandidate`, `SnapSource`, `SnapResult`, `SnapContext`, `SmartGuide`, `MeasurementLabel` (sum-types per §R5S.1)
  - Export `computeSnaps(source, settings, ctx)` implementing closest-wins priority: pixels < grid < guides < artboard < documentBounds < elements
  - Export `applySnaps(result, source)` post处理器 (rounds to integer pixels if `snapToPixels`)
  - Import `SnapSettings`, `SnapTargetKind` from `@/frontend/common/stores/cert/snapAlignTypes`
  - Pure module — no React imports, no DOM access (DK-testable in Bun unit tests)
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Create `frontend/views/dashboard/cert/templates/editor/snap/snapCandidates.ts` (new)
  - Per-kind candidate generators: `gridCandidates(source, grid)`, `guideCandidates(source, guides)`, `pixelCandidates(source)`, `elementCandidates(source, others)`, `artboardCandidates(source, artboard)`, `documentBoundsCandidates(source, doc)`
  - Pure functions; returns `SnapCandidate[]`
  - **Quality loop**: tsgo + biome + lint queue client

### R5S-T2: Snap Feedback Slice

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5 Snap & Align) alongside R5S-T4. Both depend on R5S-T1. Each targets a separate module — T2 (Zustand slice) and T4 (handle cursors/labels).

- [ ] Create `frontend/views/dashboard/cert/templates/editor/snap/useSnapFeedback.ts` (new)
  - Local Zustand slice: `activeGuides`, `activeMeasurements`, `setFeedback`, `clearFeedback`
  - `setFeedback` is throttled to one rAF cycle — coalesce calls within the same frame
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Modify `frontend/views/dashboard/cert/templates/editor/useCanvasInteractions.ts` (modify)
  - Wire `computeSnaps` into the `pointermove` handler for both drag & resize operations
  - On `pointerup` → `clearFeedback()` + `commitDragChange` / `commitResizeChange`
  - Apply snapped deltas to element rect while preserving frame-rate independence (no per-frame React re-render — mutate the draft rect directly, store commit at pointerup)
  - Constrained (Shift) + center (Alt) + proportional-center (Shift+Alt) modifier logic for resize handler
  - **Quality loop**: tsgo + biome + lint queue client

### R5S-T3: Smart Guide Overlay

- [ ] Create `frontend/views/dashboard/cert/templates/editor/overlays/SmartGuideOverlay.tsx` (new)
  - SVG overlay sized to the canvas world plane, transformed by viewport transform
  - Reads `colorToken` from props → `const color = useMemo(() => theme.palette[colorToken].main, [theme, colorToken])` → CSS var `--snapGuide-color`
  - Renders center lines, edge-alignment lines, equal-spacing arrows, equal-size ticks per `SmartGuide` sum-type
  - `strokeWidth={1 / zoom}` so lines stay 1 logical pixel; `strokeDasharray="4 4"` for smart-guide vs solid grid
  - Equal-spacing arrows: `<path>` with arrowhead geometry scaled by `1 / zoom`
  - Measurement text via SVG `<text>` `fontSize={12 / zoom}`
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Modify `frontend/views/dashboard/cert/templates/editor/canvas/CanvasArea.tsx` (modify)
  - Mount `SmartGuideOverlay` alongside existing `SnapGuideOverlay` so grid dots stay separate
  - Subscribe to `useSnapFeedback` for live `activeGuides` + `activeMeasurements`
  - Read `smartGuideColor` + `smartGuideSensitivity` from `useCanvasStore.getState().snapSettings`
  - Skip mounting when `snapSettings.smartGuidesEnabled === false` (zero-cost when toggled off)
  - **Quality loop**: tsgo + biome + lint queue client

### R5S-T4: Interactive Transform Handles — Cursors & Live Labels

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5 Snap & Align) alongside R5S-T2. Both depend on R5S-T1. Each targets a separate module — T2 (Zustand slice) and T4 (handle cursors/labels).

- [ ] Modify `frontend/views/dashboard/cert/templates/editor/overlays/ResizeHandles.tsx` (extend existing)
  - Apply CSS `cursor` per handle: `nw-resize`, `n-resize`, `ne-resize`, `e-resize`, `se-resize`, `s-resize`, `sw-resize`, `w-resize`
  - Wires into `useCanvasInteractions` resize handler for Shift/Alt/Shift+Alt modifiers
- [ ] Create `frontend/views/dashboard/cert/templates/editor/overlays/rotationCursor.ts` (new)
  - `buildRotationCursorSvg(theme, size=24)` returns a `url("data:image/svg+xml,...") 12 12, crosshair` string with the SVG stroke read from `theme.palette.text.primary`
  - Memoize by `(theme.palette.mode, size)` at module scope (one cache per theme/light/dark)
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Modify `frontend/views/dashboard/cert/templates/editor/overlays/RotationHandle.tsx` (extend existing)
  - Sets cursor to `buildRotationCursorSvg(theme)`
  - Adds Shift-to-snap-15° clamping (`Math.round(angle / 15) * 15`)
  - Pushes an `angle` `MeasurementLabel` via `useSnapFeedback` showing `"θ: ${deg.toFixed(0)}°"`
  - Visual stem to top-center handle (extension from existing component — 24 logical px upward offset)
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Create `frontend/views/dashboard/cert/templates/editor/overlays/MeasurementBadge.tsx` (new)
  - HTML `Box` (not SVG) positioned by canvas world coords × zoom
  - Three variants `size` / `position` / `angle` with different anchor offsets
  - Re-mounts each interaction (only mounted while interaction active, unmount on `pointerup`)
  - Colors from `theme.palette.background.paper` (badge background) + snap-guide colour token (border)
  - Border radius 2, padding `4px × 6px`, fontSize 11px — no hardcoded sizes that should not be themable; use `sx={{ borderRadius: '2px', p: '4px 6px', typography: 'caption' }}`
  - **Quality loop**: tsgo + biome + lint queue client

### R5S-T5: Multi-Element Transformation (Group Bounding Box)

> **Parallelizable**: This task runs as a subagent in Wave 4 (R5 Snap & Align) alongside R5S-T6, R5S-T7. All wait on R5S-T3. Each targets a separate module — T5 (group overlay), T6 (store actions), T7 (i18n keys).

- [ ] Create `frontend/views/dashboard/cert/templates/editor/overlays/GroupTransformFrame.tsx` (new)
  - Renders shared `ResizeHandles` + `RotationHandle` on the group bbox rather than individual elements
  - Reads the union of selected element rects (memoized via `useShallow` on the bbox math)
  - Only the active corner + rotation handle are rendered — bbox stroke is a single SVG `<rect>`
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Modify `frontend/views/dashboard/cert/templates/editor/useCanvasInteractions.ts` (extend T2)
  - Group resize: compute `scaleX = newBboxW / oldBboxW`, `scaleY = newBboxH / oldBboxH` → mutate each element's `{x, y, w, h}` proportionally
  - Group rotate: rotate each element's center around group bbox center by delta angle; stack element's own rotation
  - Group move: applies the same delta to all selected elements (already-ish existed per base marquee); `computeSnaps` runs on the bbox, not per element
  - Single undo entry per group transform dispatched via `HistoryManager`
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Modify `frontend/views/dashboard/cert/templates/editor/canvas/CanvasArea.tsx` (extend T3)
  - When `selectedElementIds.length > 1`, render `GroupTransformFrame` instead of per-element `ResizeHandles`/`RotationHandle`
  - Single-element path unchanged
  - **Quality loop**: tsgo + biome + lint queue client

### R5S-T6: Store Actions — Align, Distribute, Match Size, Key Object, Snap Settings

> **Parallelizable**: This task runs as a subagent in Wave 4 (R5 Snap & Align) alongside R5S-T5, R5S-T7. All wait on R5S-T3. Each targets a separate module — T5 (group overlay), T6 (store actions), T7 (i18n keys).

- [ ] Modify `frontend/common/stores/useCanvasStore.ts` (extend existing T10i)
  - Add state: `snapSettings: SnapSettings` (default `DEFAULT_SNAP_SETTINGS`), `keyObjectId: string | null`, `alignTarget: AlignTarget` (default `'selection'`), `distributeFrom: DistributeFrom` (default `'edge'`)
  - Add actions per §R5S.7: `alignElements`, `distributeElements`, `distributeSpacing`, `matchSize`, `setKeyObject`, `setAlignTarget`, `setDistributeFrom`, `updateSnapSettings`
  - Every mutation pushes a single undo entry to `HistoryManager`; align/distribute entries include the full previous-position map so undo restores all touched elements atomically
  - `setKeyObject(null)` must auto-reset `alignTarget` from `'key'` to `'selection'` (anti-dangling)
  - **Quality loop**: tsgo + biome + lint queue client

### R5S-T7: i18n Keys (Plan 11 Snap & Align portion)

> **Parallelizable**: This task runs as a subagent in Wave 4 (R5 Snap & Align) alongside R5S-T5, R5S-T6. All wait on R5S-T3. Each targets a separate module — T5 (group overlay), T6 (store actions), T7 (i18n keys).

- [ ] Update `shared/locale/types/dashboard/certificates/templateEditor.ts` (modify)
  - Add `snapEngine` schema: `measurement.distance/size/position/angle`, `equalSpacingLabel`, `equalSizeLabel`, `snapNotification`
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Update `shared/locale/en/.../templateEditor.ts` (modify)
  - Implement `snapEngine` keys; pluralization funcs: `(px) => \`${px} px\``, `(w, h) => \`W: ${w}px / H: ${h}px\``, `(x, y) => \`X: ${x}px / Y: ${y}px\``, `(deg) => \`θ: ${deg}°\``
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Update `shared/locale/ar/.../templateEditor.ts` (modify)
  - Implement `snapEngine` keys + AR pluralizations (e.g. `(deg) => \`θ: ${deg}°\``)
  - **Quality loop**: tsgo + biome + lint queue client

### R5S-T8: Test Suite (Plan 11 Snap & Align)

> **Parallelizable**: This task runs as a subagent in Wave 5 (R5 Snap & Align). It waits on all Wave 4 tasks (T5, T6, T7) being complete.

- [ ] Create `test/unit/snapEngine.test.ts` (new)
  - Test `gridCandidates`: 16px grid, source `x=23.7` snap to `24`; `x=22` snap to `16`
  - Test `pixelCandidates`: `24.7` ≈ `25`
  - Test `guideCandidates`: horizontal guide at `y=100` snap source `top=99.5` snaps to `100` for `top` edge
  - Test `elementCandidates`: align source's `hCenter=43.7` against element's `hCenter=44.3` snaps with delta `0.6` (within threshold 6)
  - Test `artboardCandidates`: artboard width `800` snap source `right=798` snaps right edge to `800`
  - Test `computeSnaps`: closest wins, ties resolved by priority `pixels < grid < guides < artboard < documentBounds < elements`
  - Test `applySnaps` always stamps X/Y to integer pixels when `snapToPixels=true` (e.g. guide at `100.5` snaps to `100`)
  - Test `snapEnabled=false` with `smartGuidesEnabled=true` returns snappedX/Y=null but populates guides
  - Test edge case: source outside artboard bounds snapes to outer artboard border via `snapToArtboard` candidate
  - **Quality loop**: tsgo + biome + lint queue client

### R5S-T9: Knowledge Propagation (Plan 11 Snap & Align)

- [ ] Update `frontend/IMPLEMENTATION_LEARNINGS.md` (append-only)
  - Add an entry for the `SnapFeedbackState` local Zustand slice — NEVER touch `useCanvasStore` element slice during drag (perf budget)
  - Add an entry for the `computeSnaps` priority order: `pixels < grid < guides < artboard < documentBounds < elements`
  - Add an entry for the HTML badge (vs SVG `<text>`) reasoning — text renders cleaner in DOM, especially during high-frequency updates
  - Add an entry for the `buildRotationCursorSvg` memoization pattern — cache by `(theme.palette.mode, size)`, NOT per-render; per-render would defeat the point of building the cursor once
- [ ] Update `frontend/COMPONENT_PATTERNS.md` (append-only)
  - Add "Smart Guide Overlay" pattern (SVG overlay + CSS var trick for theme colour, stroke-1/zoom scale invariant)
  - Add "Group Bounding Box Transform" pattern (proportional element scaling from group corner, group-rotation-around-bbox-center)
- [ ] Update `frontend/AGENTS.md` (append-only)
  - Reference `frontend/views/dashboard/cert/templates/editor/snap/snapEngine.ts` as the canonical snap engine module
  - Note: `useCanvasStore` is the only place to dispatch `alignElements` / `distributeElements` / `distributeSpacing` / `matchSize` — these actions are NOT defined in Plan 10 or Plan 12
- [ ] **Quality loop**: tsgo + biome + lint queue client

### Instruction File & AGENTS.md Discovery (Round 5 Snap & Align, Plan 11)

| Task | Files Created/Modified | AGENTS.md to Read | Instructions to Read |
|---|---|---|---|
| R5S-T1 | `frontend/views/dashboard/cert/templates/editor/snap/{snapEngine,snapCandidates}.ts` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5S-T2 | `frontend/views/dashboard/cert/templates/editor/snap/useSnapFeedback.ts`, `useCanvasInteractions.ts` (modify) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5S-T3 | `frontend/views/dashboard/cert/templates/editor/overlays/SmartGuideOverlay.tsx`, `canvas/CanvasArea.tsx` (modify) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5S-T4 | `frontend/views/dashboard/cert/templates/editor/overlays/{ResizeHandles,RotationHandle}.tsx` (modify), `rotationCursor.ts` (new), `MeasurementBadge.tsx` (new) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5S-T5 | `frontend/views/dashboard/cert/templates/editor/overlays/GroupTransformFrame.tsx` (new), `useCanvasInteractions.ts` (modify), `canvas/CanvasArea.tsx` (modify) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5S-T6 | `frontend/common/stores/useCanvasStore.ts` (modify) | `frontend/stores/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5S-T7 | `shared/locale/types/.../templateEditor.ts`, `shared/locale/{en,ar}/.../templateEditor.ts` (modify) | `shared/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5S-T8 | `test/unit/snapEngine.test.ts` | `AGENTS.md` | `.agents/instructions/tests.instructions.md`, `.agents/instructions/frontend.instructions.md` |
| R5S-T9 | `frontend/IMPLEMENTATION_LEARNINGS.md`, `frontend/COMPONENT_PATTERNS.md`, `frontend/AGENTS.md` (append-only) | `frontend/AGENTS.md`, `AGENTS.md` | — |

### Round 5 Snap & Align Execution Order (Plan 11)

```
Phase R5S-A (sequential): R5S-T1 (snapEngine + snapCandidates — pure, no React; depends on Plan 10 R5S-T1 types being committed)
Phase R5S-B (via parallel subagents): R5S-T2 (SnapFeedback slice + interactions wiring), R5S-T4 (ResizeHandles/RotationHandle modifiers + MeasurementBadge + rotationCursor) — both wait on T1
Phase R5S-C (sequential): R5S-T3 (SmartGuideOverlay + CanvasArea mount) — depends on T2 (uses the feedback slice)
Phase R5S-D (via parallel subagents): R5S-T5 (GroupTransformFrame + interactions + CanvasArea), R5S-T6 (Store actions) — T5 depends on T3/T4 visuals; T6 is independent of visuals
Phase R5S-E (via parallel subagents): R5S-T7 (i18n keys — independent of code)
Phase R5S-F (via parallel subagents): R5S-T8 (test suite — waits on T1-T7 implementation)
Phase R5S-G (sequential): R5S-T9 (knowledge propagation — waits on all of above)
```

**Plan 11 R5S total estimated time**: ~22 hours (~10 wall-clock hours via parallel subagent phases R5S-B/R5S-D/R5S-E/R5S-F)

### R5 Snap & Align Parallel Subagent Strategy

### Wave 1 (R5S): R5S-T1
- Tasks: R5S-T1 (snapEngine + snapCandidates)
- Rationale: Foundation — pure functions, no React. All other R5S tasks depend on T1.

### Wave 2 (R5S): R5S-T2, R5S-T4
- Tasks (via parallel subagents): R5S-T2 (SnapFeedback slice + interactions wiring), R5S-T4 (ResizeHandles/RotationHandle modifiers + MeasurementBadge + rotationCursor)
- Rationale: Both depend on R5S-T1. T2 targets the feedback slice + interactions; T4 targets handle components + measurement badge. Disjoint modules.

### Wave 3 (R5S): R5S-T3
- Tasks: R5S-T3 (SmartGuideOverlay + CanvasArea mount)
- Rationale: Sequential — depends on R5S-T2's feedback slice.

### Wave 4 (R5S): R5S-T5, R5S-T6, R5S-T7
- Tasks (via parallel subagents): R5S-T5 (GroupTransformFrame + interactions + CanvasArea), R5S-T6 (Store actions), R5S-T7 (i18n keys)
- Rationale: T5 depends on T3/T4 visuals (complete from Wave 2/3). T6 is independent of visuals. T7 (i18n) is independent of code. All three target disjoint modules.

### Wave 5 (R5S): R5S-T8
- Tasks: R5S-T8 (test suite)
- Rationale: Test suite waits on all T1–T7 implementation. Single-task wave.

### Final Wave (R5S): R5S-T9
- Task: R5S-T9 (Knowledge Propagation)
- Rationale: Must run after all R5S Snap & Align implementation is complete.

### Plan 11 Combined Total Time (Rounds 1-5 Snap & Align included)

- Rounds 1-3: ~30 hours → ~18 wall-clock hours
- Round 4: ~20 hours → ~12 wall-clock hours
- Round 5 Fill/Stroke/Pen/Effects (R5-T1 through R5-T10): ~24 hours → ~10 wall-clock hours
- Round 5 Snap & Align (R5S-T1 through R5S-T9): ~22 hours → ~10 wall-clock hours
- **Plan 11 total**: ~96 hours → ~50 wall-clock hours with the R5/R5S parallelism stacking.

> All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks (tsgo → biome → lint → codescene). The lint queue server must be running before any lint call. See `AGENTS.md` §"Lint Queue Server" for startup commands.

---

## Round 5: Advanced Layers Tasks

> Tasks for the canvas-side layer rendering — mirrors `design.md` §"Round 5: Advanced Layers Panel". Plan 11 R5 tasks cover the **compositor, render order, visibility, groups, clipping, masks, blend modes, scroll-sync, and WebGL fallback**. Per-row layer UI / panel chrome are in Plan 10 §"Round 5: Advanced Layers Tasks" and Plan 12 §"Round 5: Advanced Layers Tasks" respectively. Quality model: every task ends with a per-file `scripts/health/sub-loop.ts --lifecycle codescene` call (runs progressive chain: tsgo → biome → lint → codescene).
>
> Cross-file dependencies are flagged inline (e.g. the compositor reads `layers`/`groups` owned by Plan 12 §R5 store tasks). Do NOT modify those store files — file a CROSS-FILE DEPENDENCY report and proceed with a typed interface against the expected store API.

### R5 Layers Tasks Dependencies

```
LYC-T01 (CanvasLayerCompositor core — build layer tree, flat render list)
  ├─→ LYC-T02 (useLayerRenderOrder hook — transient order + memo)
  ├─→ LYC-T03 (visibility + selection filter in CanvasInteractionLayer)
  │
  ├─→ LYC-T04 (group composite — isolated mode + inline mode switch)
  │       └─→ LYC-T05 (useGroupThumbnail hook + cache)
  │
  ├─→ LYC-T06 (clipping mask composite)
  ├─→ LYC-T07 (layer mask alpha multiply)
  ├─→ LYC-T08 (blend mode: Canvas2D fast path)
  │       └─→ LYC-T09 (WebGLBlendPipeline for 21 non-Canvas2D modes)
  │
  └─→ LYC-T10 (integration: wire compositor into CanvasRenderer + CanvasLayerRenderer)
         └─→ LYC-T11 (i18n: canvas.layers keys + AR/EN)
                └─→ LYC-T13 (knowledge propagation)
```

**Execution order**: LYC-T01 → (LYC-T02, LYC-T03, LYC-T04, LYC-T06, LYC-T07, LYC-T08 via parallel subagents; LYC-T09 after LYC-T08; LYC-T05 after LYC-T04) → LYC-T10 → LYC-T11 → LYC-T13

**Estimated effort**: 22 hours (parallelizable to ~14 wall-clock hours)

### LYC Parallel Subagent Strategy

### Wave 1 (LYC): LYC-T01
- Tasks: LYC-T01 (Canvas Layer Compositor Core)
- Rationale: Foundation task — all other LYC tasks depend on the compositor core or its API.

### Wave 2 (LYC): LYC-T02, LYC-T03, LYC-T04, LYC-T06, LYC-T07, LYC-T08
- Tasks (via parallel subagents): LYC-T02 (useLayerRenderOrder), LYC-T03 (Visibility + Selection Filter), LYC-T04 (Opacity Lock), LYC-T06 (Blend Mode Dropdown), LYC-T07 (Lock Opacity Slider), LYC-T08 (Reorder Buttons)
- Rationale: All depend on LYC-T01. Each modifies a separate component module — no cross-imports among siblings.

### Wave 2b (LYC): LYC-T05, LYC-T09
- Tasks: LYC-T05 (Blend Mode Apply — after LYC-T04), LYC-T09 (Opacity Slider — after LYC-T08)
- Rationale: LYC-T05 depends on LYC-T04 (Opacity Lock). LYC-T09 depends on LYC-T08 (Lock Opacity Slider). These run after their respective Wave 2 parents.

### Wave 3 (LYC): LYC-T10 → LYC-T11 → LYC-T13
- Tasks: LYC-T10 → LYC-T11 → LYC-T13 (sequential integration)
- Rationale: quality loop and knowledge propagation — each depends on the prior.

### Final Wave (LYC): Knowledge Propagation
- Task: LYC-T13 (Knowledge Propagation & Documentation)
- Rationale: Must run after all LYC implementation tasks are complete and verified.

---

### LYC-T01 — Canvas Layer Compositor Core

**Estimated time**: 3 hours
**Depends on**: Plan 12 §R5 LY-T01 (the canonical layer/group state; CROSS-FILE DEPENDENCY — do not modify, depend on its API)
**Requirements**: design.md §R5.1

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md` (canvas directory — `frontend/views/dashboard/certificates/template-editor/canvas/`)
  - `AGENTS.md` root (`@/*` path alias, NEVER hardcode colors, PERFORMANCE: virtualization/debounce patterns)

- [ ] **Read applicable instruction files**:
  - `.agents/instructions/frontend.instructions.md`

- [ ] **Create** `frontend/views/dashboard/certificates/template-editor/canvas/CanvasLayerCompositor.ts`:
  - Pure TypeScript module — no React imports
  - Export `compose(layers, groups, clipRelations, layerMasks, options): ComposePlan` that returns an ordered list of render instructions (`{ layerId, offscreenRequired, blendMode, effectiveOpacity, maskDescriptor?, clipBaseId? }`)
  - Walk the layer tree depth-first (groups first, then children in declared order); produce bottom-to-top order
  - Filter: skip `layer.visible === false` AND skip any layer whose ancestor group has `visible === false`
  - Effective opacity: `layer.opacity * ∏ ancestorGroups.opacity` (group `opacity === 1` is a no-op)
  - Group isolated mode: if `group.blendMode !== 'normal'` OR `group.opacity !== 1` OR any ancestor has a non-default blend, mark the group's children with `offscreenRequired: true` and the group with `compositeGroup: groupId`
  - Expose a `CompositorContext` type so the React hook (LYC-T02) can pass `transientLayerOrder` overrides
  - No hardcoded colors

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint queue client
  - File: `frontend/views/dashboard/certificates/template-editor/canvas/CanvasLayerCompositor.ts`

**Files to Create/Modify:**
- `frontend/views/dashboard/certificates/template-editor/canvas/CanvasLayerCompositor.ts` (new)

---

### LYC-T02 — useLayerRenderOrder Hook

**Estimated time**: 1.5 hours
**Depends on**: LYC-T01
**Requirements**: design.md §R5.1, §R5.5

> **Parallelizable**: This task runs as a subagent in Wave 2 (LYC) alongside LYC-T03, LYC-T04, LYC-T06, LYC-T07, LYC-T08. All depend on LYC-T01 and modify separate component modules.

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `frontend/AGENTS.md` root

- [ ] **Read applicable instruction files**:
  - `.agents/instructions/frontend.instructions.md`

- [ ] **Create** `frontend/views/dashboard/certificates/template-editor/canvas/useLayerRenderOrder.ts`:
  - `useTemplateElementEditorStore` selectors via `useShallow`: `layers`, `groups`, `clipRelations`, `layerMasks`, `transientLayerOrder`
  - `useMemo` keyed on `[layers, groups, clipRelations, layerMasks, transientLayerOrder]` — calls `CanvasLayerCompositor.compose(...)` with `transientLayerOrder ?? layers.map(l => l.id)` as the effective order
  - Returns `{ composePlan, effectiveOrder }` — consumed by `CanvasRenderer` (LYC-T10)
  - 16 ms debounce is NOT needed here (React batches state updates); if profiling shows thrash, wrap the `setSelectedElementIds` calls in `requestAnimationFrame`

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint queue client
  - File: `frontend/views/dashboard/certificates/template-editor/canvas/useLayerRenderOrder.ts`

**Files to Create/Modify:**
- `frontend/views/dashboard/certificates/template-editor/canvas/useLayerRenderOrder.ts` (new)

---

### LYC-T03 — Visibility + Selection Filter in CanvasInteractionLayer

**Estimated time**: 2 hours
**Depends on**: LYC-T01
**Requirements**: design.md §R5.2

> **Parallelizable**: This task runs as a subagent in Wave 2 (LYC) alongside LYC-T02, LYC-T04, LYC-T06, LYC-T07, LYC-T08. All depend on LYC-T01 and modify separate component modules.

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md` root

- [ ] **Read applicable instruction files**:
  - `.agents/instructions/frontend.instructions.md`

- [ ] **Modify** `frontend/views/dashboard/certificates/template-editor/canvas/CanvasInteractionLayer.tsx` (extend R3-T09):
  - Replace the hit-test candidate source: instead of `template.elements`, use the compositor's `effectiveOrder` filtered to `visible === true && ancestorGroupsAllVisible`
  - Add `ancestorGroupsAllVisible(layer)` helper: walks `groupId` chain via `groups`; returns `false` if any ancestor has `visible === false`
  - When a layer becomes hidden while selected, the existing R3-T09 logic already calls `setSelectedElementIds([])`; verify this path still works with the new filter (if not, add an explicit `useEffect` that clears selection when `selectedElementIds.some(id => !layerVisible(id))`)
  - No hardcoded colors

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint queue client
  - File: `frontend/views/dashboard/certificates/template-editor/canvas/CanvasInteractionLayer.tsx`

**Files to Create/Modify:**
- `frontend/views/dashboard/certificates/template-editor/canvas/CanvasInteractionLayer.tsx` (modify — extend, do not rewrite R3-T09)

---

### LYC-T04 — Group Composite (Isolated + Inline Modes)

**Estimated time**: 2.5 hours
**Depends on**: LYC-T01
**Requirements**: design.md §R5.3

> **Parallelizable**: This task runs as a subagent in Wave 2 (LYC) alongside LYC-T02, LYC-T03, LYC-T06, LYC-T07, LYC-T08. All depend on LYC-T01 and modify separate component modules.

- [ ] **Read applicable AGENTS.md**: `frontend/views/AGENTS.md`, root `AGENTS.md`

- [ ] **Read applicable instruction files**: `.agents/instructions/frontend.instructions.md`

- [ ] **Modify** `frontend/views/dashboard/certificates/template-editor/canvas/CanvasLayerCompositor.ts` (extend LYC-T01):
  - Add `composeGroup(group, children, ctx): GroupComposePlan` — returns either inline children (each with their own `blendMode`/`opacity`) or an isolated composite plan (`{ kind: 'isolated-group', groupId, opaqueChildren, groupBlendMode, groupOpacity }`)
  - Inline mode triggered when `group.blendMode === 'normal' && group.opacity === 1 && !anyAncestorHasNonDefaultBlend(group)`
  - Isolated mode: children render into their own offscreen canvas, then composite onto the parent with `group.blendMode`/`group.opacity`
  - Nested groups: recursive `composeGroup`; innermost finishes first
  - Add `OffscreenCanvasPool` helper class — `acquire(width, height)`, `release(canvas)`; sized to canvas viewport; LRU eviction at 8 buffers

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint queue client
  - File: `frontend/views/dashboard/certificates/template-editor/canvas/CanvasLayerCompositor.ts`

**Files to Create/Modify:**
- `frontend/views/dashboard/certificates/template-editor/canvas/CanvasLayerCompositor.ts` (modify)
- `frontend/views/dashboard/certificates/template-editor/canvas/OffscreenCanvasPool.ts` (new — pooled offscreen canvas allocator)

---

### LYC-T05 — useGroupThumbnail Hook + Cache

**Estimated time**: 1.5 hours
**Depends on**: LYC-T04
**Requirements**: design.md §R5.3

> **Parallelizable**: This task runs as a subagent in Wave 2b (LYC) after LYC-T04 completes. It runs alongside LYC-T09 (which depends on LYC-T08).

- [ ] **Read applicable AGENTS.md**: `frontend/views/AGENTS.md`, root `AGENTS.md`

- [ ] **Read applicable instruction files**: `.agents/instructions/frontend.instructions.md`

- [ ] **Create** `frontend/views/dashboard/certificates/template-editor/canvas/useGroupThumbnail.ts`:
  - `useTemplateElementEditorStore` selectors: `groupThumbnails`, the group + its direct children's `visible`/`opacity`/`blendMode` (via `useShallow` on a per-group slice)
  - `useMemo` keyed on group + children content hashes; calls `CanvasLayerCompositor.renderGroupToDataUrl(group, children, { width: 40, height: 40 })` and returns a data URL
  - Bumps the cached `groupThumbnails[groupId]` via `setGroupThumbnail(groupId, dataUrl)` (store action — Plan 12 §R5 owns; CROSS-FILE DEPENDENCY; do not modify the store file)
  - Invalidate when any child's opacity/blendMode/visible changes — automatic via `useMemo` key
  - Never hardcode 40 — read thumbnail size from `layerPanelOptions.thumbnailSize` (mapped: small=24, medium=40, large=64)

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint queue client
  - File: `frontend/views/dashboard/certificates/template-editor/canvas/useGroupThumbnail.ts`

**Files to Create/Modify:**
- `frontend/views/dashboard/certificates/template-editor/canvas/useGroupThumbnail.ts` (new)

---

### LYC-T06 — Clipping Mask Composite

**Estimated time**: 2 hours
**Depends on**: LYC-T01
**Requirements**: design.md §R5.4

> **Parallelizable**: This task runs as a subagent in Wave 2 (LYC) alongside LYC-T02, LYC-T03, LYC-T04, LYC-T07, LYC-T08. All depend on LYC-T01 and modify separate component modules.

- [ ] **Read applicable AGENTS.md**: `frontend/views/AGENTS.md`, root `AGENTS.md`

- [ ] **Read applicable instruction files**: `.agents/instructions/frontend.instructions.md`

- [ ] **Modify** `frontend/views/dashboard/certificates/template-editor/canvas/CanvasLayerCompositor.ts` (extend):
  - Add `composeClippingGroup(baseLayer, clippedLayers, ctx): ClipComposePlan` — returns `{ kind: 'clipping-group', baseLayerId, clippedLayerIds, baseAlphaFromBase: true }`
  - Consecutive `clipToBelow === true` layers stack on the same base (the nearest below layer where `clipToBelow === false`)
  - Each clipped layer masks against the **base layer's alpha** (NOT the cumulative clipped stack) — standard Photoshop behavior
  - Rendering uses `destination-in` compositing in an offscreen canvas with the base's alpha shape
  - Falls back to inline render when base layer is hidden (clipped layers with a hidden base are skipped entirely — they cannot composite)

- [ ] **Modify** `frontend/views/dashboard/certificates/template-editor/canvas/useLayerRenderOrder.ts` (extend LYC-T02):
  - Group consecutive `clipToBelow` layers with their base in the `composePlan`

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint queue client
  - Files: `frontend/views/dashboard/certificates/template-editor/canvas/CanvasLayerCompositor.ts`, `frontend/views/dashboard/certificates/template-editor/canvas/useLayerRenderOrder.ts`

**Files to Create/Modify:**
- `frontend/views/dashboard/certificates/template-editor/canvas/CanvasLayerCompositor.ts` (modify)
- `frontend/views/dashboard/certificates/template-editor/canvas/useLayerRenderOrder.ts` (modify)

---

### LYC-T07 — Layer Mask Alpha Multiply

**Estimated time**: 2 hours
**Depends on**: LYC-T01
**Requirements**: design.md §R5.7

> **Parallelizable**: This task runs as a subagent in Wave 2 (LYC) alongside LYC-T02, LYC-T03, LYC-T04, LYC-T06, LYC-T08. All depend on LYC-T01 and modify separate component modules.

- [ ] **Read applicable AGENTS.md**: `frontend/views/AGENTS.md`, root `AGENTS.md`

- [ ] **Read applicable instruction files**: `.agents/instructions/frontend.instructions.md`

- [ ] **Modify** `frontend/views/dashboard/certificates/template-editor/canvas/CanvasLayerCompositor.ts` (extend):
  - Add `applyLayerMask(layer, offscreen, maskDescriptor)` — multiplies the layer's alpha by the mask's luminance using `destination-in` compositing
  - Skip mask (fast path) when `!maskDescriptor.enabled || !maskDescriptor.canvasData`
  - `MaskDescriptor = { canvasData: ImageData | string (dataURL), enabled: boolean, linked: boolean }` — typed inline here (Plan 12 §R5 store owns the canonical type; if the canonical type differs, file a CROSS-FILE DEPENDENCY and align)
  - Mask canvas dimensions must match the layer's bounding box; if mismatched, log a `logger.warn` (NEVER `console.warn` per AGENTS.md) and fall back to no-mask

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint queue client
  - File: `frontend/views/dashboard/certificates/template-editor/canvas/CanvasLayerCompositor.ts`

**Files to Create/Modify:**
- `frontend/views/dashboard/certificates/template-editor/canvas/CanvasLayerCompositor.ts` (modify)

---

### LYC-T08 — Blend Mode Canvas 2D Fast Path

**Estimated time**: 2 hours
**Depends on**: LYC-T01
**Requirements**: design.md §R5.8

> **Parallelizable**: This task runs as a subagent in Wave 2 (LYC) alongside LYC-T02, LYC-T03, LYC-T04, LYC-T06, LYC-T07. All depend on LYC-T01 and modify separate component modules.

- [ ] **Read applicable AGENTS.md**: `frontend/views/AGENTS.md`, root `AGENTS.md`

- [ ] **Read applicable instruction files**: `.agents/instructions/frontend.instructions.md`

- [ ] **Modify** `frontend/views/dashboard/certificates/template-editor/canvas/CanvasLayerCompositor.ts` (extend):
  - Add `applyBlendMode(ctx, blendMode)` — sets `ctx.globalCompositeOperation` for the 25 modes that map to Canvas 2D directly
  - Build the `BLEND_MODE_CANVAS2D_MAP: Record<BlendMode, GlobalCompositeOperation | null>` — `null` entries are the 21 modes that need WebGL (LYC-T09)
  - For `null` entries, return a `WebGLBlendRequired` marker so the compositor routes the layer through `WebGLBlendPipeline` (LYC-T09)
  - Default `source-over` (normal) is the fastest path — no offscreen at all
  - Use the `BlendMode` enum from Plan 12 R5 Effects (CROSS-FILE DEPENDENCY; import, do not redefine)

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint queue client
  - File: `frontend/views/dashboard/certificates/template-editor/canvas/CanvasLayerCompositor.ts`

**Files to Create/Modify:**
- `frontend/views/dashboard/certificates/template-editor/canvas/CanvasLayerCompositor.ts` (modify)

---

### LYC-T09 — WebGL Blend Pipeline

**Estimated time**: 3.5 hours
**Depends on**: LYC-T08
**Requirements**: design.md §R5.8

> **Parallelizable**: This task runs as a subagent in Wave 2b (LYC) after LYC-T08 completes. It runs alongside LYC-T05 (which depends on LYC-T04).

- [ ] **Read applicable AGENTS.md**: `frontend/views/AGENTS.md`, root `AGENTS.md` (PERF / lazy init patterns)

- [ ] **Read applicable instruction files**: `.agents/instructions/frontend.instructions.md`

- [ ] **Create** `frontend/views/dashboard/certificates/template-editor/canvas/WebGLBlendPipeline.ts`:
  - Lazy-init `WebGL2RenderingContext` on a hidden offscreen canvas; cached on first non-Canvas2D blend request
  - Export `compositeBlend(sourceCanvas, destCanvas, blendMode, opacity)` — uploads both as textures, runs the per-mode fragment shader, returns a `Canvas` with the result
  - 21 fragment shaders (one per non-Canvas2D mode) live in `frontend/views/dashboard/certificates/template-editor/canvas/shaders/<mode>.glsl`
  - Fallback if WebGL2 unavailable: `logger.warn(t("certificateTemplateEditor.canvas.layers.webGLFallback"))` and downgrade to `source-over` (Canvas 2D) — NEVER `console.warn`
  - All shaders are pure GLSL strings — no React/UI

- [ ] **Create** `frontend/views/dashboard/certificates/template-editor/canvas/shaders/linear-burn.glsl` (and 20 others):
  - One `.glsl` file per non-Canvas2D blend mode (linear-burn, linear-dodge, vivid-light, pin-light, hard-mix, subtract, divide, grain-extract, grain-merge, lighter-color, darker-color, darker-color, linear-light, difference-reverse, exclusion-reverse, hard-mix, color-burn-reverse, color-dodge-reverse, hue-reverse, saturation-reverse, color-reverse, luminosity-reverse — count may vary; align to the 21 modes missing from Canvas2D per LYC-T08's map)

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint queue client
  - Files: `frontend/views/dashboard/certificates/template-editor/canvas/WebGLBlendPipeline.ts`, all shader files

**Files to Create/Modify:**
- `frontend/views/dashboard/certificates/template-editor/canvas/WebGLBlendPipeline.ts` (new)
- `frontend/views/dashboard/certificates/template-editor/canvas/shaders/*.glsl` (new — ~21 files)

---

### LYC-T10 — Integration: Wire Compositor into CanvasRenderer + CanvasLayerRenderer

**Estimated time**: 2.5 hours
**Depends on**: LYC-T02, LYC-T03, LYC-T04, LYC-T06, LYC-T07, LYC-T08 (and LYC-T09 for non-Canvas2D modes)
**Requirements**: design.md §R5.1 (integration contract)

- [ ] **Read applicable AGENTS.md**: `frontend/views/AGENTS.md`, root `AGENTS.md`

- [ ] **Read applicable instruction files**: `.agents/instructions/frontend.instructions.md`

- [ ] **Modify** `frontend/views/dashboard/certificates/template-editor/canvas/CanvasRenderer.tsx` (extend R3-T06):
  - Replace the flat `.map(elements)` with `useLayerRenderOrder()` → `composePlan`
  - For each `ComposePlanEntry`:
    - If `offscreenRequired` (isolated group or masked/clipped layer): render into a pooled `OffscreenCanvas`, composite the offscreen back onto the main canvas using `applyBlendMode(ctx, entry.blendMode)`
    - If `WebGLBlendRequired`: route the offscreen composite through `WebGLBlendPipeline.compositeBlend(...)`
    - Else: render the layer directly (fast path — equivalent to current R3-T06 behavior)
  - Use `requestAnimationFrame`-gated render when `effectiveOrder.length > 100` to drop intermediate updates
  - `aria-label={t("certificateTemplateEditor.canvas.label")}` (already R3-T06 default)
  - No hardcoded colors

- [ ] **Modify** `frontend/views/dashboard/certificates/template-editor/canvas/CanvasLayerRenderer.tsx` (extend R3-T07):
  - Accept `effectiveOpacity` and `blendMode` props from the compositor pass (instead of reading from `layer.opacity`/`layer.blendMode` directly)
  - Existing ungrouped / single-layer render path remains unchanged when `effectiveOpacity === 1 && blendMode === 'normal'` (R4 fast path preserved)

- [ ] **Modify** `frontend/views/dashboard/certificates/template-editor/export/PdfExportPipeline.ts` (verify — should already consume `compositor.compose()`; if it iterates `template.elements` directly, refactor to call `useLayerRenderOrder` or `CanvasLayerCompositor.compose(...)` — file a CROSS-FILE DEPENDENCY note if this file is owned by Plan 6)

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint queue client
  - Files: `frontend/views/dashboard/certificates/template-editor/canvas/CanvasRenderer.tsx`, `frontend/views/dashboard/certificates/template-editor/canvas/CanvasLayerRenderer.tsx`, `frontend/views/dashboard/certificates/template-editor/export/PdfExportPipeline.ts`

**Files to Create/Modify:**
- `frontend/views/dashboard/certificates/template-editor/canvas/CanvasRenderer.tsx` (modify)
- `frontend/views/dashboard/certificates/template-editor/canvas/CanvasLayerRenderer.tsx` (modify)
- `frontend/views/dashboard/certificates/template-editor/export/PdfExportPipeline.ts` (verify/refactor)

---

### LYC-T11 — i18n: Canvas Layers Keys (EN/AR)

**Estimated time**: 45 minutes
**Depends on**: LYC-T01 (key surface)
**Requirements**: design.md §R5.10

- [ ] **Read applicable AGENTS.md**:
  - `shared/AGENTS.md` (i18n — never import from `@/frontend/**` etc.)
  - `AGENTS.md` root §"i18n / Localized Errors"

- [ ] **Modify** `shared/locale/namespaces/dashboard/certificates/templateEditor.namespace.ts`:
  - Add `canvas.layers` nested object per design §R5.10 (`hiddenLayerSelected`, `webGLFallback`, `clipIndicator`, `groupComposite`)

- [ ] **Modify** `shared/locale/namespaces/ar/dashboard/certificates/templateEditor.namespace.ts` (verify path):
  - Add AR values per design §R5.10 AR table
  - Verify RTL — no manual `dir` attributes (locale config owns it)

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint queue client
  - Files: `shared/locale/namespaces/dashboard/certificates/templateEditor.namespace.ts`, `shared/locale/namespaces/ar/dashboard/certificates/templateEditor.namespace.ts`

**Files to Create/Modify:**
- `shared/locale/namespaces/dashboard/certificates/templateEditor.namespace.ts` (modify — append)
- `shared/locale/namespaces/ar/dashboard/certificates/templateEditor.namespace.ts` (modify — append)

---

### LYC-T13 — Knowledge Propagation

**Estimated time**: 30 minutes
**Depends on**: LYC-T01..LYC-T11
**Requirements**: AGENTS.md §"AI Agent Communication Rules"

- [ ] **Modify** `frontend/COMPONENT_PATTERNS.md` (append):
  - Add "Canvas Layer Compositor Pattern" subsection describing: layer-tree-aware render order, isolated vs inline group compositing, clipping mask base-alpha masking, WebGL fallback for non-Canvas2D blend modes, `OffscreenCanvasPool` for GC-free hot paths
  - Note: the compositor is a pure module; React binding via `useLayerRenderOrder`

- [ ] **Modify** `frontend/AGENTS.md` (append pointer):
  - End-of-file pointer: `See COMPONENT_PATTERNS.md §"Canvas Layer Compositor Pattern" for the layer-tree-aware canvas compositor implementation.`

- [ ] Run quality loop.
  - **Quality loop**: tsgo + biome + lint queue client
  - Files: `frontend/COMPONENT_PATTERNS.md`, `frontend/AGENTS.md`

**Files to Create/Modify:**
- `frontend/COMPONENT_PATTERNS.md` (modify — append)
- `frontend/AGENTS.md` (modify — append)

---

### Round 5 Advanced Layers — Plan 11 Execution Summary

```
Phase LYC-A: LYC-T01 (compositor core)
Phase LYC-B (via parallel subagents):
  LYC-T02 (hook), LYC-T03 (visibility filter),
  LYC-T04 (group composite), LYC-T06 (clipping), LYC-T07 (mask), LYC-T08 (blend Canvas2D)
Phase LYC-C (sequential within branch):
  LYC-T05 (group thumbnail) — after LYC-T04
  LYC-T09 (WebGL pipeline) — after LYC-T08
Phase LYC-D: LYC-T10 (integration)
Phase LYC-E: LYC-T11 (i18n)
Phase LYC-F: LYC-T13 (knowledge propagation)
```

**Round 5 Advanced Layers Panel total (Plan 11 chunk)**: ~22 hours → ~14 wall-clock hours via Phase LYC-B parallel subagents (6 tasks via parallel subagents)

### Full Plan 11 Time (Rounds 1-5 including Layers)

- Rounds 1-3 (T01-T19): ~40 hours → ~24 wall-clock hours
- Round 4 (T20-T37): ~45 hours → ~26 wall-clock hours
- Round 5 Effects Engine (FX-T01..FX-T09): ~22 hours → ~14 wall-clock hours
- Round 5 Advanced Layers Panel (LYC-T01..LYC-T13): ~22 hours → ~14 wall-clock hours
- **Plan 11 full (incl. Effects + Layers)**: ~129 hours → ~78 wall-clock hours

> Note: All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks. The lint queue server must be running before any lint call (see `AGENTS.md` §"Lint Queue Server").

---

## Round 5: Transform Tasks

> **R6 = the app's 6th sequential round (existing R5 = Effects/Fill/Pen/Layers). The user-specified label "Round 5: Transform Tasks" is preserved here per instruction.**
> **Depends on**: Plan 10 R6 (toolbar + store shims), Plan 11 R6 (transform math — self-owned)
> **Reference**: design.md `## Round 6: Transform Engine` §R6.1–R6.14
> **This plan owns the canonical transform types file** — `frontend/common/stores/cert/transformTypes.ts`

| # | Task | Depends On | Est. Hours |
|---|---|---|---|
| TR-T01 | `transformTypes.ts` canonical transform types | — (first) | 2 |
| TR-T02 | `FreeTransformController` lifecycle + pointer logic | TR-T01 | 3 |
| TR-T03 | `FreeTransformOverlay` (bounding box + 8 handles + rotation handle) | TR-T01, TR-T02 | 2.5 |
| TR-T04 | `transformScale.ts` utils + 9-slice scaling | TR-T01 | 2 |
| TR-T05 | `transformRotate.ts` utils + `applyRotate九十` handler + Flip | TR-T01 | 1.5 |
| TR-T06 | `transformSkew.ts` utils (vertical + horizontal shear) | TR-T01 | 1.5 |
| TR-T07 | `transformDistort.ts` utils + `solveProjective` (perspective + distort) | TR-T01 | 2.5 |
| TR-T08 | `transformPerspective.ts` (symmetric corner mirror) | TR-T01, TR-T07 | 1.5 |
| TR-T09 | `WarpGridOverlay` + `WarpRenderer` (3x3 grid + 13 presets + bezier) | TR-T01 | 3 |
| TR-T10 | `FreeTransformOptionsBar` (mode toggles + W/H inputs + chain lock + ref point grid) | TR-T01, TR-T03 | 2 |
| TR-T11 | Live transform rendering in `ElementRenderer` | TR-T01, TR-T02 | 1.5 |
| TR-T12 | Register `transformHandlers` bridge to Plan 10 store | TR-T02 | 1 |
| TR-T13 | transformMath unit tests | ALL above | 1 |
| TR-T14 | Knowledge propagation | ALL above | 1 |

### Instruction File & AGENTS.md Discovery (Plan 11 Transform)

| Task | Files | AGENTS.md | Instructions |
|---|---|---|---|
| TR-T01 | `frontend/common/stores/cert/transformTypes.ts` (new) | `AGENTS.md` | `frontend.instructions.md` |
| TR-T02 | `frontend/views/dashboard/cert/templates/editor/canvas/FreeTransformController.ts` (new) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `frontend.instructions.md` |
| TR-T03 | `frontend/views/dashboard/cert/templates/editor/canvas/FreeTransformOverlay.tsx` (new) | same as above | `frontend.instructions.md` |
| TR-T04 | `frontend/views/dashboard/cert/templates/editor/canvas/transform/transformScale.ts` (new) | same | `frontend.instructions.md` |
| TR-T05 | ...`transform/transformRotate.ts` (new) | same | `frontend.instructions.md` |
| TR-T06 | ...`transform/transformSkew.ts` (new) | same | `frontend.instructions.md` |
| TR-T07 | ...`transform/transformDistort.ts` (new) | same | `frontend.instructions.md` |
| TR-T08 | ...`transform/transformPerspective.ts` (new) | same | `frontend.instructions.md` |
| TR-T09 | `frontend/views/dashboard/cert/templates/editor/canvas/warp/{WarpGridOverlay,WarpRenderer}.tsx` + `warpPresets.ts` (new ×3) | same | `frontend.instructions.md` |
| TR-T10 | `frontend/views/dashboard/cert/templates/editor/canvas/FreeTransformOptionsBar.tsx` (new) | same | `frontend.instructions.md` |
| TR-T11 | `frontend/views/dashboard/cert/templates/editor/canvas/ElementRenderer.tsx` (modify) | same | `frontend.instructions.md` |
| TR-T12 | `frontend/views/dashboard/cert/templates/editor/canvas/FreeTransformController.ts` (modify — register hooks) | same | `frontend.instructions.md` |
| TR-T13 | `test/unit/transformMath.test.ts` (new) | `AGENTS.md` | `tests.instructions.md`, `frontend.instructions.md` |
| TR-T14 | `frontend/IMPLEMENTATION_LEARNINGS.md`, `frontend/COMPONENT_PATTERNS.md`, `frontend/AGENTS.md` (append) | `AGENTS.md` | — |

### TR-T01 — Canonical Transform Types File

- [ ] Read `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Create `frontend/common/stores/cert/transformTypes.ts` (per design.md R6.1):
  - `export type FreeTransformMode = 'scale' | 'rotate' | 'skew' | 'distort' | 'perspective' | 'warp'`
  - `export type ReferencePointPosition = 'topLeft' | 'topCenter' | 'topRight' | 'leftCenter' | 'center' | 'rightCenter' | 'bottomLeft' | 'bottomCenter' | 'bottomRight'`
  - `export type WarpPreset = 'custom' | 'arc' | 'arch' | 'bulge' | 'shellLower' | 'shellUpper' | 'flag' | 'fish' | 'rise' | 'fisheye' | 'inflate' | 'squeeze' | 'twist'`
  - `export type CornerKey = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'`
  - `export interface WarpControlPoint { x: number; y: number; cpIn: { x: number; y: number } | null; cpOut: { x: number; y: number } | null }`
  - `export interface NineSliceConfig { left: number; top: number; right: number; bottom: number }`
  - `export interface TransformModeState extends FreeTransformMode { referencePoint: ReferencePointPosition; proportionalLock: boolean; warpPreset: WarpPreset; warpBend: number; warpHDistort: number; warpVDistort: number }`
  - `export interface TransformOperationRecord { operationType: FreeTransformMode; matrix: DOMMatrixReadOnly; elementIds: string[]; timestamp: number }`
  - `export interface TransformHandlers { setMode?(mode: FreeTransformMode): void; applyRotate九十?(payload: { degrees: 90 | 180 | 270; direction: 'cw' | 'ccw' }): void; applyFlip?(horizontal: boolean): void; repeatTransform?(record: TransformOperationRecord): void }`
  - `export interface BoundingBox { x: number; y: number; width: number; height: number; rotation: number }`
  - `export interface CornerPositions { topLeft: { x: number; y: number }; topRight: { x: number; y: number }; bottomLeft: { x: number; y: number }; bottomRight: { x: number; y: number } }`
  - No imports from `@/frontend/**` or `@/backend/**` — pure type-only file (works for Plan 10/12 import too)
- [ ] **Quality loop**: tsgo + biome + lint queue client

### TR-T02 — `FreeTransformController` Lifecycle & Pointer Logic

- [ ] Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Create `frontend/views/dashboard/cert/templates/editor/canvas/FreeTransformController.ts` (per design.md R6.2):
  - Lifecycle hook `useFreeTransformController()`:
    - Activates when `activeTool === 'freeTransform'` and ≥ 1 element selected
    - Local `workingState: { mode: FreeTransformMode; referencePoint: ReferencePointPosition; liveTransform: CornerPositions | null; warpPoints: WarpControlPoint[9] | null }`
    - On mount if active: `certTemplateEditorStore.getState().registerTransformHandlers({ setMode, applyRotate九十, applyFlip, repeatTransform })`
    - On unmount: `certTemplateEditorStore.getState().unregisterTransformHandlers()`
    - Esc handler: `setActiveTool('select')` (cancels transform — does NOT commit)
    - Enter handler: commits `workingState` to element(s) via `updateElementTransform` service, then exits free transform (Plan 10 `setActiveTool('select')`)
  - Pointer routing: dispatches to `transformScale`, `transformRotate`, `transformSkew`, `transformDistort`, `transformPerspective`, or `warpPresets` based on `workingState.mode` and which handle was grabbed
  - Uses `logger` from `@/frontend/utils/logger` (never `console.*`)
  - Never `eval` / never dynamic handler strings
- [ ] **Quality loop**: tsgo + biome + lint queue client

### TR-T03 — `FreeTransformOverlay` (Bounding Box + 8 Handles + Rotation Handle)

> **Parallelizable**: This task runs as a subagent in Wave 5 (TR) alongside TR-T10, TR-T11, TR-T12. All wait on TR-T02 (FreeTransformController). Each targets a separate component module.

- [ ] Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Create `frontend/views/dashboard/cert/templates/editor/canvas/FreeTransformOverlay.tsx` (per design.md R6.3):
  - Renders an SVG overlay on top of the selected element(s) bounding box
  - 8 handles: 4 corners (`nwse-resize` cursor) + 4 edges (`ns-resize` / `ew-resize`)
  - Rotation handle: extends from top-center by `20 / zoom` px (zoom-independent per design R6.3)
  - Reference point: target icon at center by default; draggable to any of 9 positions (3×3 grid)
  - All handle dimensions divided by `zoom` (matches Round 5 R5.1.2 pen tool convention)
  - Style: `sx={{ stroke: theme => theme.palette.primary.main, fill: 'background.paper' }}` — no hardcoded colors
  - Mode-specific handle visibility:
    - Scale: 8 handles + rotation handle
    - Rotate: rotation handle only (plus the 8 for free rotate)
    - Skew: 4 edge handles (no corners)
    - Distort: 4 corner handles
    - Perspective: 4 corner handles
    - Warp: hidden (warp overlay takes over — TR-T09)
  - `aria-label` from `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)`: `transform.overlay.boundingBox`
- [ ] **Quality loop**: tsgo + biome + lint queue client

### TR-T04 — Scale Transform Utils + 9-Slice

> **Parallelizable**: This task runs as a subagent in Wave 2 (TR) alongside TR-T05, TR-T06, and TR-T09 (warp presets math). All depend on TR-T01. Each targets a separate transform utility module.

- [ ] Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Create `frontend/views/dashboard/cert/templates/editor/canvas/transform/transformScale.ts` (per design.md R6.4):
  - `computeScaleFromHandle(handle: HandlePosition, dragDx, dragDy, originalBox, modifiers: { shift, alt }): { scaleX, scaleY }`
  - `Shift`: proportional — `scaleY = scaleX` (locks aspect ratio)
  - `Alt`: symmetric — scale from center (box center anchor); both sides move equally
  - `Shift+Alt`: proportional + symmetric
  - Returns the live scale — controller applies as `DOMMatrix.scale(scaleX, scaleY)` around reference point
  - `computeNineSliceSlices(config: NineSliceConfig, originalWidth, originalHeight): { corners: BoundingBox[]; edgesH: BoundingBox[]; edgesV: BoundingBox[]; center: BoundingBox }`
  - `assembleNineSlice(slices, newWidth, newHeight): CornerPositions` — corners stay at original size; edges stretch in one dimension; center stretches both
  - Pure functions — no DOM access — testable in isolation
- [ ] **Quality loop**: tsgo + biome + lint queue client

### TR-T05 — Rotate Transform Utils + `applyRotate九十`/Flip

> **Parallelizable**: This task runs as a subagent in Wave 2 (TR) alongside TR-T04, TR-T06, and TR-T09 (warp presets math). All depend on TR-T01. Each targets a separate transform utility module.

- [ ] Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Create `frontend/views/dashboard/cert/templates/editor/canvas/transform/transformRotate.ts` (per design.md R6.5):
  - `computeRotationAngle(handlePos, cursorPos, referencePoint): number` (returns degrees, range -180..+180)
  - `Shift` constraint: snap to nearest 15° increment (`Math.round(angle / 15) * 15`)
  - `applyRotate九十(degrees: 90 | 180 | 270, direction: 'cw' | 'ccw', elementId, referencePoint)`:
    - Builds a `DOMMatrix.rotate(degrees * (direction === 'cw' ? 1 : -1))` around reference point
    - Mutates the element's transform; does NOT enter free transform (immediate apply)
    - Pushes `TransformOperationRecord { operationType: 'rotate', matrix, elementIds: [id], timestamp: Date.now() }` to `certTemplateEditorStore.lastTransform`
  - `applyFlip(horizontal: boolean, elementId, referencePoint)`:
    - `horizontal === true` → `DOMMatrix.scale(-1, 1)` (mirror left↔right)
    - `horizontal === false` → `DOMMatrix.scale(1, -1)` (mirror top↕bottom)
    - Around reference point
    - Push to `lastTransform` for `Ctrl+Shift+T` reapplication
  - `repeatTransform(record: TransformOperationRecord, elementIds)` — re-applies `record.matrix` to a new set of elements (used by Plan 10 `repeatLastTransform` shim)
- [ ] **Quality loop**: tsgo + biome + lint queue client

### TR-T06 — Skew Transform Utils

> **Parallelizable**: This task runs as a subagent in Wave 2 (TR) alongside TR-T04, TR-T05, and TR-T09 (warp presets math). All depend on TR-T01. Each targets a separate transform utility module.

- [ ] Read `frontend/views/AGMENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Create `frontend/views/dashboard/cert/templates/editor/canvas/transform/transformSkew.ts` (per design.md R6.7):
  - `computeSkewFromDrag(edgeHandle, dragDx, dragDy, originalBox): { skewX: number; skewY: number }` (in degrees, -45..+45)
  - Dragging top edge sideways → `skewX` (horizontal shear)
  - Dragging corner while in skew mode → applies skew to two adjacent sides simultaneously
  - `applySkewMatrix(skewX, skewY, referencePoint): DOMMatrix` returns `DOMMatrix skew matrix` (pre-multiplied with translate to/from ref point)
  - Helpers clamp inputs to ±45° via `Math.max(-45, Math.min(45, angle))`
- [ ] **Quality loop**: tsgo + biome + lint queue client

### TR-T07 — Distort Transform Utils + `solveProjective`

- [ ] Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Create `frontend/views/dashboard/cert/templates/editor/canvas/transform/transformDistort.ts` (per design.md R6.8):
  - `solveProjective(src: CornerPositions, dest: CornerPositions): DOMMatrixReadOnly` — solves for the 8-coefficient projective matrix mapping `src` → `dest` via a 8×8 linear system (Gaussian elimination)
  - `computeDistortFromCornerDrag(cornerKey, dragDx, dragDy, originalBox): CornerPositions` — returns new corner positions; corners independent (no constraint)
  - `applyDistortMatrix(corners: CornerPositions, elementId, referencePoint)` — solves projective matrix and mutates the element
  - Pure functions for the matrix solver; no DOM access
- [ ] **Quality loop**: tsgo + biome + lint queue client

### TR-T08 — Perspective Transform Utils (Symmetric Corner Mirror)

- [ ] Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Create `frontend/views/dashboard/cert/templates/editor/canvas/transform/transformPerspective.ts` (per design.md R6.8 perspective):
  - `computePerspectiveFromCornerDrag(cornerKey, dragDx, dragDy, originalBox): CornerPositions`
  - Top-left drag → top-right mirrors (`reflect(P_new_left, axis=vertical_center_of_box)` → `P_new_right`)
  - Bottom-left → bottom-right mirrors
  - Top edge → bottom edge mirrors (same-side rows mirror across horizontal center)
  - Implementation: `P'_mirror = { x: 2 * centerX - P'.x, y: P'.y }` for horizontal mirror; `{ x: P'.x, y: 2 * centerY - P'.y }` for vertical
  - Returns `CornerPositions`; delegate to `solveProjective` from TR-T07 (PURE — import the function)
- [ ] **Quality loop**: tsgo + biome + lint queue client

### TR-T09 — `WarpGridOverlay` + `WarpRenderer` + 13 Warp Presets

> **Parallelizable**: The warp presets math portion of this task runs as a subagent in Wave 2 (TR) alongside TR-T04, TR-T05, TR-T06. The component-level portion (WarpGridOverlay + WarpRenderer) runs in Wave 6 after TR-T02 (FreeTransformController) is complete. All depend on TR-T01.

- [ ] Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Create `frontend/views/dashboard/cert/templates/editor/canvas/warp/WarpGridOverlay.tsx` (per design.md R6.9):
  - Renders a 3×3 grid overlay on the element
  - 9 handles; each has bezier `cpIn` / `cpOut` control arms
  - In `preset !== 'custom'` mode, shows single preset-parameter controls (Bend, H Distort, V Distort)
  - Dragging handle updates `workingState.warpPoints`
  - SVG handles sized by `1 / zoom`; stroke from theme palette (no hardcoded colors)
  - `aria-label` from `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)`: `transform.warp.gridOverlay`
- [ ] Create `frontend/views/dashboard/cert/templates/editor/canvas/warp/WarpRenderer.tsx`:
  - During drag: renders the element subdivided into a 5×5 mesh (20 quads) — each quad rasterized via `clip-path` + linear transform (fast preview, 60fps target)
  - On commit (Enter): evaluates the full 9-point bezier grid into a 20×20 subdivision and persists the warp as a `DOMMatrix` approximating the quad centroid (or stores warpPoints on element — discuss in Plan 12 if warp is element-level data)
  - Uses `useMemo` for mesh subdivision arrays
- [ ] Create `frontend/views/dashboard/cert/templates/editor/canvas/warp/warpPresets.ts`:
  - `presetParams(preset, bend: number, hDistort: number, vDistort: number): WarpControlPoint[9]`
  - Per-preset math (arc, arch, bulge, shellLower, shellUpper, flag, fish, rise, fisheye, inflate, squeeze, twist) — pure functions of `bend`, `hDistort`, `vDistort` (all range -100..+100)
  - Custom: returns identity grid (caller drags handles to deform)
- [ ] **Quality loop**: tsgo + biome + lint queue client

### TR-T10 — `FreeTransformOptionsBar` — Mode Toggles + W/H + Chain Lock + Reference Point Grid

> **Parallelizable**: This task runs as a subagent in Wave 5 (TR) alongside TR-T03, TR-T11, TR-T12. All wait on TR-T02 (FreeTransformController). Each targets a separate component module.

- [ ] Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Create `frontend/views/dashboard/cert/templates/editor/canvas/FreeTransformOptionsBar.tsx` (per design.md R6.10):
  - Mode toggle `ButtonGroup`: Scale / Rotate / Skew / Distort / Perspective / Warp — labelles from `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)`: `transform.scale`, `transform.rotate`, etc.
  - `W`/`H` numeric `TextField`s with `InputAdornment` for `%` or `px` toggle (`IconButton` chain link icon — check if `ChainLockButton` exists in `frontend/components/ui/` before recreating)
  - Chain lock: `proportionalLock` from controller working state; locks `W`/`H` deltas together
  - Rotation angle `TextField` (-180..+180); Enter commits the rotation (calls `rotateWorkingState`)
  - Reference point 3×3 grid selector (`IconButton` grid of 9 small squares; clicking sets `referencePoint` from `ReferencePointPosition`)
  - `sx={{ color: theme => theme.palette.text.primary }}` — no hardcoded colors; MUI v9 `sx` prop only (no style props)
  - Visible only when `activeTool === 'freeTransform'` (mounted by canvas surface after Plan 11 R4 surface logic)
- [ ] **Quality loop**: tsgo + biome + lint queue client

### TR-T11 — Live Transform Rendering in `ElementRenderer`

> **Parallelizable**: This task runs as a subagent in Wave 5 (TR) alongside TR-T03, TR-T10, TR-T12. All wait on TR-T02 (FreeTransformController). Each targets a separate component module.

- [ ] Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Modify `frontend/views/dashboard/cert/templates/editor/canvas/ElementRenderer.tsx`:
  - When `activeTool === 'freeTransform'` and this element is in `selectedElementIds` AND the controller has a `workingState.liveTransform`, apply that transform as a `CSS transform` (or SVG matrix for SVG elements) to the rendered output as the user drags
  - Use `will-change: transform` and `pointer-events: none` on the live transform child (avoid 60Hz layout thrashing)
  - NEVER mutate the element data in store during drag — only on Enter commit (Esc discards). Live transform is transient controller state.
  - For warp: render the subdivided mesh from `WarpRenderer` (TR-T09) instead of the standard output
- [ ] **Quality loop**: tsgo + biome + lint queue client

### TR-T12 — Register `transformHandlers` Bridge to Plan 10 Store

> **Parallelizable**: This task runs as a subagent in Wave 5 (TR) alongside TR-T03, TR-T10, TR-T11. All wait on TR-T02 (FreeTransformController). Each targets a separate component module.

- [ ] Read `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- [ ] Modify `frontend/views/dashboard/cert/templates/editor/canvas/FreeTransformController.ts` (final piece of TR-T02):
  - On mount when `activeTool === 'freeTransform'`:
    - `certTemplateEditorStore.getState().registerTransformHandlers({ setMode: (mode) => setWorkingState({ mode }), applyRotate九十: (payload) => applyRotate九十Immediate(payload, selectedIds, workingState.referencePoint), applyFlip: (horizontal) => applyFlipImmediate(horizontal, selectedIds, workingState.referencePoint), repeatTransform: (record) => applyMatrixToElements(record.matrix, selectedIds) })`
  - On unmount: `certTemplateEditorStore.getState().unregisterTransformHandlers()`
  - Handlers use closure-captured `workingState` (Zustand local selector) — not a stale snapshot
- [ ] Cross-plan contract: Plan 10's `EditorEditMenu` (R6-T3) calls these shims; Plan 10 doesn't import canvas math, just calls the registered callback in Plan 11's controller (per `frontend/AGENTS.md` "register-handler" pattern from R6-T8)
- [ ] **Quality loop**: tsgo + biome + lint queue client

### TR-T13 — transformMath Unit Tests

> **Parallelizable**: This task runs as a subagent in Wave 7 (TR). The unit tests exercise the pure transform math functions.

- [ ] Create `test/unit/transformMath.test.ts`:
  - `solveProjective` returns identity matrix for `src === dest`
  - `solveProjective` returns expected matrix for a known affine transform
  - `computeSkewFromDrag` clamps to ±45°
  - `computePerspectiveFromCornerDrag` mirrors corners symmetrically
  - `computeScaleFromHandle` with `shift` returns equal scales; with `alt` returns symmetric scales
  - All math tests run without DOM (pure functions)
- [ ] **Quality loop**: tsgo + biome + lint queue client

### TR-T14 — Knowledge Propagation (Plan 11 R6)

- [ ] Update `frontend/IMPLEMENTATION_LEARNINGS.md` (append-only):
  - `solveProjective` Gaussian elimination example (avoid the traps of zero-pivot without pivoting)
  - "warp live preview uses 5×5 mesh; commit uses 9×9 or 20×20 subdivision" — rationale: 60fps during drag, pixel-accurate at commit
  - "Esc/Enter handled by Plan 11 controller — not Plan 10 shortcut hook" (don't double-register)
  - "Live transform is controller working state — never mutate store during drag" — pattern prevents re-render storms across 100+ elements
- [ ] Update `frontend/COMPONENT_PATTERNS.md` (append-only):
  - "Free Transform Overlay" pattern (bounding box + 8 handles + rotation handle + reference point)
  - "Mode-specific handle visibility" pattern (conditional handle rendering by `FreeTransformMode`)
- [ ] Update `frontend/AGENTS.md` (append-only):
  - Reference `transformTypes.ts` as the canonical location for transform types
  - Note the 13 warp presets and `presetParams` pure-function signature
- [ ] **Quality loop**: tsgo + biome + lint queue client

### Round 5 Execution Order (Plan 11 Transform)

```
Phase TR-A (seq):  TR-T01 (transformTypes — first)
Phase TR-B (via parallel subagents):  TR-T04 (scale), TR-T05 (rotate + flip), TR-T06 (skew), TR-T09 (warp presets only — math) [all depend on TR-T01]
Phase TR-C (seq):  TR-T07 (distort + solveProjective) [depends on TR-T01]
Phase TR-D (seq):  TR-T08 (perspective) — depends on TR-T07 (uses solveProjective)
Phase TR-E (seq):  TR-T02 (FreeTransformController — depends on all utils)
Phase TR-F (via parallel subagents):  TR-T03 (overlay), TR-T10 (options bar), TR-T11 (ElementRenderer modify), TR-T12 (register handlers in controller) [wait on TR-T02]
Phase TR-G (via parallel subagents):  TR-T09 (WarpGridOverlay + WarpRenderer component-level — wait on warpPresets from TR-B + controller from TR-T02)
Phase TR-H (via parallel subagents):  TR-T13 (transformMath unit tests)
Phase TR-I (seq):  TR-T14 (knowledge propagation)
```

**Plan 11 R6 total**: ~25 hours → ~14 wall-clock hours (via parallel subagents in TR-B, TR-F, TR-G, TR-H)

### TR Transform Parallel Subagent Strategy

### Wave 1 (TR): TR-T01
- Tasks: TR-T01 (Canonical Transform Types File)
- Rationale: Foundation — all transform utils depend on the types file.

### Wave 2 (TR): TR-T04, TR-T05, TR-T06, TR-T09
- Tasks (via parallel subagents): TR-T04 (scale), TR-T05 (rotate + flip), TR-T06 (skew), TR-T09 (warp presets — math only)
- Rationale: All depend on TR-T01. Each targets a separate transform utility module.

### Wave 3 (TR): TR-T07 → TR-T08
- Tasks: TR-T07 (distort + solveProjective) → TR-T08 (perspective) — sequential, T08 depends on T07.

### Wave 4 (TR): TR-T02
- Tasks: TR-T02 (FreeTransformController)
- Rationale: Single-task wave — depends on all transform utils (T04, T05, T06, T07, T08, T09).

### Wave 5 (TR): TR-T03, TR-T10, TR-T11, TR-T12
- Tasks (via parallel subagents): TR-T03 (FreeTransformOverlay), TR-T10 (Options Bar), TR-T11 (ElementRenderer modify), TR-T12 (register handlers in controller)
- Rationale: All wait on TR-T02. Each targets a separate component/module.

### Wave 6 (TR): TR-T09 (component-level)
- Tasks: TR-T09 (WarpGridOverlay + WarpRenderer component-level)
- Rationale: Waits on warpPresets from Wave 2 + controller from Wave 4.

### Wave 7 (TR): TR-T13
- Tasks: TR-T13 (transformMath unit tests)
- Rationale: Test suite waits on all components. Single-task wave.

### Final Wave (TR): TR-T14
- Task: TR-T14 (Knowledge Propagation)
- Rationale: Must run after all TR Transform implementation is complete.

### Full Plan 11 Time (Rounds 1-6)

- Rounds 1-3 (T01-T19): ~40 hours → ~24 wall-clock
- Round 4 (T20-T37): ~45 hours → ~26 wall-clock
- Round 5 Effects + Layers (existing): ~44 hours → ~28 wall-clock
- Round 5 Transform (TR-T01..TR-T14): ~25 hours → ~14 wall-clock
- **Plan 11 full**: ~154 hours → ~92 wall-clock hours

> All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks (tsgo → biome → lint → codescene). The lint queue server must be running before any lint call. See `AGENTS.md` §"Lint Queue Server" for startup commands.

## Round 5: Advanced Typography Tasks

### R5-B1: Text Renderer with Fidelity Settings

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/canvas/text/TextRenderer.tsx`:
  - Wraps `RichTextRenderer` (from Plan 10) with canvas-specific container props
  - Apply `sx={{ textRendering: "optimizeLegibility", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale", fontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1, "rlig" 1' }}`
  - RTL detection: if content text has >50% Arabic chars (Unicode range `[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]`), set `dir="rtl"` + `unicodeBidi="plaintext"`
  - Props: `element: TextElement`, `scale: number`, `onEnterEdit: () => void`
  - Import `RichTextRenderer` from `@/frontend/common/views/dashboard/certificates/template-editor/typography/RichTextRenderer`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/canvas/text/useTextOverflow.ts`:
  - Custom hook returning `{ effectiveFontSize, overflowInfo }`
  - Implements `autoFitFontSize()` binary search between current size and `minFontSize` (default 4px)
  - Uses `OffscreenCanvas` (or fallback hidden `<canvas>`) + `measureText`
  - Modes: `truncate` (ellipsis + `maxLines`), `shrink`, `clip` (`overflow: hidden`), `expand` (auto width/height)
  - Cache results in store keyed by `elementId + contentHash`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-B2: Text Measurement Hook

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5 Typography) alongside R5-B3, R5-B4, R5-B5. All depend on R5-B1. Each targets a separate text module.

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/canvas/text/useTextMeasurement.ts`:
  - Returns `TextMeasurement`: `{ width, height, lineHeight, lineCount, lineWidths, baselineY }`
  - Uses `OffscreenCanvas` with fallback to hidden `<canvas>` element
  - For mixed spans: widest span per line, wrapped text simulation
  - Cache per `elementId + contentHash + maxWidth`, invalidate on any property change
  - Export `measureText(content, baseStyles, maxWidth, padding)` standalone function
  - **Quality loop**: tsgo + biome + lint queue client

### R5-B3: Text Hit Area

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5 Typography) alongside R5-B2, R5-B4, R5-B5. All depend on R5-B1. Each targets a separate text module.

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/canvas/text/TextHitArea.tsx`:
  - Renders invisible `Box` overlay with click target = `max(measurement.width, element.width) × max(measurement.height, element.height)`
  - 4px tolerance for descenders
  - `onClick` → `onSelect(element.id)`
  - `sx={{ position: "absolute", cursor: "pointer" }}`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-B4: Text Caching Hook

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5 Typography) alongside R5-B2, R5-B3, R5-B5. All depend on R5-B1. Each targets a separate text module.

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/canvas/text/useTextCache.ts`:
  - Maintains `Map<string, TextCacheEntry>` (LRU max 50 entries)
  - Key: `elementId + contentHash` (hash of RichTextContent + SpanStyles + bounds)
  - Renders text to `OffscreenCanvas` → `ImageBitmap` (or `HTMLCanvasElement`)
  - `getTextBitmap(elementId): ImageBitmap | null`
  - `invalidateCache(elementId)` — called on content/bounds/style change
  - `primeCache(elementIds: string[])` — batch via `requestIdleCallback`
  - Eviction: oldest entry `ImageBitmap.close()` on cache-full
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Integrate text cache into canvas drag/pan rendering:
  - When `performanceLevel === "low"` (drag/pan active): use cached bitmap instead of re-rendering spans
  - After drag ends: switch back to full HTML rendering + re-render cache
  - Toggle via `performanceConfig.textSimplifyDuringDrag` (default `true`)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-B5: Text Preview During Drag

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5 Typography) alongside R5-B2, R5-B3, R5-B4. All depend on R5-B1. Each targets a separate text module.

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/canvas/text/SimplifiedTextPreview.tsx`:
  - Renders bounding box with text color tint at 8% opacity + first ~20 chars as preview label
  - `sx={{ backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.08), display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}`
  - Import `alpha` from `@mui/material/styles`
  - Preview text: `Typography` with `variant="caption"` and `sx={{ color: "text.disabled" }}`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Register `Ctrl+Shift+H` keyboard shortcut in ShortcutManager (from R4):
  - Toggles `performanceConfig.textSimplifyAlways` global flag
  - When true: all text elements always render simplified (not just during drag)
  - Update canvas store with this flag
  - **Quality loop**: tsgo + biome + lint queue client

### R5-B6: Inline Edit Mode

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/canvas/text/useInlineEditMode.ts`:
  - Custom hook: `{ isEditing, enterEdit, exitEdit }`
  - `enterEdit(elementId)`: `typographyStore.enterEditMode(elementId)`, focus `contentEditable` (via ref), place caret at click position or text start
  - `exitEdit()`: `typographyStore.exitEditMode()`, blur element, commit to store
  - State machine: double-click → `display` to `editing`; Escape/click-outside/`Ctrl+Enter` → `editing` to `display`
  - Arrow key handling: Left/Right (caret +1), Up/Down (closest line boundary), Shift+Arrow (extend selection), Ctrl+A (select all), Ctrl+Home/End (start/end)
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Wire double-click and double-tap to edit mode in React Flow:
  - `onNodeDoubleClick` on text nodes → `useInlineEditMode.enterEdit(element.id)`
  - Mobile: double-tap within 350ms → edit mode
  - Only text elements respond (shape/image/QR ignore)
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Add edit mode visual changes to canvas element rendering:
  - Dashed instead of solid selection outline (`borderStyle: "dashed"`)
  - Inner glow: `boxShadow: inset 0 0 0 2px ${theme.palette.primary.main}`
  - Dim non-editing elements to 60% opacity via canvas overlay
  - Show `RichTextToolbar` (from Plan 10) above element via anchored `Popover`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-B7: Text Placeholder

> **Parallelizable**: This task runs as a subagent in Wave 4 (R5 Typography) alongside R5-B9, R5-B10. All wait on R5-B6 (inline edit mode). Each targets a separate text feature module.

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/canvas/text/TextPlaceholder.tsx`:
  - Shows when `richTextContent.text.trim() === ""` and `spans.length === 0`
  - `Typography` with `variant="bodyMd"` and `sx={{ color: "text.disabled", fontStyle: "italic", pointerEvents: "none", userSelect: "none" }}`
  - i18n via `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` → `t.typography.placeholder.empty`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-B8: Text on Path

- [ ] Create `shared/types/certificates/textPath.types.ts`:
  - `BezierSegment` (type, start, control1?, control2?, end)
  - `TextPath` (id, segments, closed, direction, startOffset, flip, baselineOffset)
  - `PositionedGlyph` (glyph, x, y, rotation, styles)
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/canvas/text/TextOnPath.tsx`:
  - Implements `layoutTextOnPath(content, path, baseStyles, maxWidth)`:
    1. Measure each glyph via `CanvasRenderingContext2D.measureText`
    2. Walk path using parametric bezier equation
    3. Binary search `t` parameter for cumulative distance
    4. Compute tangent (bezier derivative), glyph rotation = `atan2(tangent.y, tangent.x)`
    5. Position glyph baseline at path point + `baselineOffset × normal`
    6. Handle `flip` (rotate 180°, offset by -baselineOffset)
  - Return `PositionedGlyph[]`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/canvas/text/TextOnPathRenderer.tsx`:
  - Renders `PositionedGlyph[]` as `<span>` elements with `sx={{ position: "absolute", transform: translate(x,y) rotate(deg), transformOrigin: "center center" }}`
  - For >100 glyphs: switch to `<svg>` container with `<text>` elements using `transform` attribute
  - Each glyph rendered via `RichTextRenderer` per-glyph (font properties from span styles)
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/canvas/text/PathEditorOverlay.tsx`:
  - When path element is selected: render control point handles (8px diameter circular `div`s)
  - Draggable handles update `BezierSegment` control/start/end positions in store
  - Path line: dashed (`strokeDasharray: "4 4"`) when not selected, solid when selected
  - Snapping: control points snap to grid + element edges
  - Badge "Bound: {text element name}" on path element when text is bound
  - **Quality loop**: tsgo + biome + lint queue client

### R5-B9: Vertical Text

> **Parallelizable**: This task runs as a subagent in Wave 4 (R5 Typography) alongside R5-B7, R5-B10. All wait on R5-B6 (inline edit mode). Each targets a separate text feature module.

- [ ] Create `frontend/common/views/dashboard/certificates/template-editor/canvas/text/VerticalText.tsx`:
  - CSS: `writingMode: "vertical-rl"` + `textOrientation: "mixed"` on container
  - Default `text-orientation: mixed` for CJK vertical text
  - Latins in vertical mode: `text-orientation: sideways` rotates 90° clockwise
  - `text-orientation: upright` for per-paragraph setting (numbers/letters stay upright)
  - Toggle via `ParagraphStyles.vertical: boolean` (set from character panel in Plan 12)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-B10: Text Shadow on Canvas

> **Parallelizable**: This task runs as a subagent in Wave 4 (R5 Typography) alongside R5-B7, R5-B9. All wait on R5-B6 (inline edit mode). Each targets a separate text feature module.

- [ ] Extend `TextRenderer.tsx` to render text shadow:
  - Read `element.settings.textShadow` from store
  - Generate CSS `text-shadow: ${x}px ${y}px ${blur}px ${alpha(color, opacity)}`
  - Import `alpha` from `@mui/material/styles`
  - Pass through unchanged to PDF renderer (Plan 06 handles PDF-specific rendering)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-B11: i18n Extension

> **Parallelizable**: This task runs as a subagent in Wave 6 (R5 Typography) It waits on all Wave 4 component tasks (B7, B8, B9, B10).

- [ ] Add canvas text i18n keys to `shared/locale/ar/.../templateEditor.ts` and `shared/locale/en/.../templateEditor.ts`:
  - `typography.placeholder.empty` → EN: "Double-click to edit", AR: "انقر مرتين للتعديل"
  - `typography.textOnPath.bindToPath`, `unbind`, `startOffset`, `baselineOffset`, `flip`, `noPath`, `direction`, `forward`, `reverse`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-B13: Knowledge Propagation

- [ ] Update `docs/frontend/canvas-editor.md` with "Text Rendering" section:
  - Document fidelity settings (`optimizeLegibility`, `font-smoothing`)
  - Document auto-fit algorithm and cache
  - Document text-on-path layout algorithm
  - Document inline edit mode state machine
  - **Quality loop**: tsgo + biome + lint queue client

### R5-B14: Execution Order

```
Phase R5-B-a (sequential):   R5-B1 TextRenderer (depends on RichTextRenderer from Plan 10)
Phase R5-B-b (via parallel subagents):     R5-B2 measurement, R5-B3 hit area, R5-B4 cache, R5-B5 simplified preview
Phase R5-B-c (sequential):   R5-B6 inline edit mode (depends on R5-B1)
Phase R5-B-d (via parallel subagents):     R5-B7 placeholder, R5-B9 vertical text, R5-B10 text shadow
Phase R5-B-e (sequential):   R5-B8 text on path (depends on types + measurement)
Phase R5-B-f (via parallel subagents):     R5-B11 i18n AR + EN (depends on all components)
Phase R5-B-g (sequential):   R5-B13 knowledge propagation (depends on all)
```

**Round 5 total estimated time for Plan 11**: ~40 hours → ~24 wall-clock hours with parallel subagents.

### R5 Typography Parallel Subagent Strategy

### Wave 1 (R5-B): R5-B1
- Tasks: R5-B1 (TextRenderer)
- Rationale: Foundation — depends on RichTextRenderer from Plan 10. All other R5-B tasks depend on B1.

### Wave 2 (R5-B): R5-B2, R5-B3, R5-B4, R5-B5
- Tasks (via parallel subagents): R5-B2 (measurement), R5-B3 (hit area), R5-B4 (cache), R5-B5 (simplified preview)
- Rationale: All depend on R5-B1. Each targets a separate utility/module.

### Wave 3 (R5-B): R5-B6
- Tasks: R5-B6 (inline edit mode)
- Rationale: Sequential — depends on R5-B1.

### Wave 4 (R5-B): R5-B7, R5-B9, R5-B10
- Tasks (via parallel subagents): R5-B7 (placeholder), R5-B9 (vertical text), R5-B10 (text shadow)
- Rationale: All independent features that extend the TextRenderer. Disjoint modules.

### Wave 5 (R5-B): R5-B8
- Tasks: R5-B8 (text on path)
- Rationale: Sequential — depends on types + measurement from earlier waves.

### Wave 6 (R5-B): R5-B11
- Tasks (via parallel subagents): R5-B11 (i18n AR + EN)
- Rationale: B11 (i18n) is independent of code. It runs via parallel subagents.

### Final Wave (R5-B): R5-B13
- Task: R5-B13 (Knowledge Propagation)
- Rationale: Must run after all R5 Typography implementation is complete.

## Round 5: Context Menus Tasks

> Round 5 task list for Plan 11 — canvas context menu, element right-click menu, ruler right-click menu, element-type additions, dialogs, and the contextual behavior rules. Plan 11 consumes the context menu primitives (`contextMenuService`, `<ContextMenuHost>`, `SubmenuTrigger`, `filterMenuItems`, `useMenuContextDescriptor`, `useOutsideClickClose`, `contextMenuPaperSx`) created in Plan 10 §R5. Total R5 scope for Plan 11: 11 tasks (~18 hours).

### R5-T1: Canvas Context Menu Hook

- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/useCanvasContextMenu.ts` (new)
  - `interface UseCanvasContextMenu { onContextMenu: (e: React.MouseEvent) => void; closeMenu: () => void; }`
  - Subscribes to `useCanvasStore` (selection, clipboard, zoom, pan) via `useShallow` from `zustand/react/shallow`
  - Translates `{x: e.clientX, y: e.clientY}` to canvas coordinates via `canvasStore.viewportToCanvasPoint` (from R4)
  - Detects click target via `document.elementFromPoint(e.clientX, e.clientY)` and `.data-element-id` traversal
  - Calls `buildCanvasContextMenu` (no selection) or `buildElementContextMenu` (with selection) → `contextMenuService.openMenu('canvas', position, items)`
  - Viewport coordinates drive menu position; canvas coords attached to `item.data` for paste-in-place, guide placement, zoom transforms
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T2: Canvas Empty-Area Builder

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5 CM) alongside R5-T4, R5-T5, R5-T8. All depend on R5-T1. Each targets a separate context menu module.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/canvasContextMenu.ts` (new)
  - `buildCanvasContextMenu(ctx: MenuContextDescriptor): ContextMenuItem[]` — empty-area menu
  - Items per §R5.2: Paste, Paste in Place, separator, Select All (Ctrl+A), Deselect All (Alt+Shift+A), Invert Selection, separator, New Element submenu (Text, Image, Shape, Line), Place..., separator, Grid submenu (Show Grid, Snap to Grid, Grid Settings), Guides submenu (New Guide, Lock Guides, Clear Guides, Show Guides, Snap to Guides), separator, Zoom In, Zoom Out, Fit on Screen, Actual Pixels, Print Size, separator, Document Setup, Canvas Properties
  - Item IDs namespaced: `'canvas.paste'`, `'canvas.pasteInPlace'`, etc.
  - Calls `filterMenuItems(items, ctx)` from Plan 10 §R5.3 before returning
  - All labels via i18n keys (no hardcoded strings) — `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` lazy handler builder reads keys on host render
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T3: Element-Selected Builder

- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/elementContextMenu.ts` (new)
  - `buildElementContextMenu(ctx: MenuContextDescriptor): ContextMenuItem[]`
  - Items per §R5.3: Cut (Ctrl+X), Copy (Ctrl+C), Paste (Ctrl+V), Paste in Front (Ctrl+F), Paste in Back (Ctrl+B), separator, Bring to Front (Ctrl+Shift+]), Bring Forward (Ctrl+]), Send Backward (Ctrl+[), Send to Back (Ctrl+Shift+[), separator, Duplicate (Ctrl+J), Duplicate Special (Ctrl+Alt+J), separator, Group (Ctrl+G), Ungroup (Ctrl+Shift+G), separator, Lock (Ctrl+L), Unlock (Alt+Ctrl+L), Unlock All on Canvas, separator, Hide (Ctrl+,), Show All (Alt+Ctrl+,), separator, Free Transform (Ctrl+T), Transform submenu (Rotate 90° CW, Rotate 90° CCW, Rotate 180°, Flip Horizontal, Flip Vertical, Numeric Transform...), separator, Align submenu (Left, Center H, Right, Top, Center V, Bottom), Distribute submenu (H Centers, V Centers, H Space, V Space), separator, Edit in External Editor, Replace Image, Export As Image, separator, Properties..., separator, Delete (Del, `isDangerous: true`)
  - Appends `elementTypeMenuItems(elementType, ctx)` (R5-T4 below) for each unique selected element type (with a single separator at the join)
  - Filter rules: clipboard items hidden when `!clipboardHasContent`; Align submenu visible when `selectionCount >= 2`; Distribute submenu visible when `selectionCount >= 3`; image items hidden unless selection includes image element(s); Export As Image disabled (not hidden) when `selectionCount !== 1`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T4: Element-Type Additions Builder

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5 CM) alongside R5-T2, R5-T5, R5-T8. All depend on R5-T1. Each targets a separate context menu module.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/elementTypeMenuItems.ts` (new)
  - `elementTypeMenuItems(elementType: CanvasElementType, ctx: MenuContextDescriptor): ContextMenuItem[]`
  - Text additions (§R5.4): Edit Text (Enter), Change Font submenu (Recent Fonts up to 5, separator, Browse All...), Increase Font Size (Ctrl+Shift+>), Decrease Font Size (Ctrl+Shift+<), separator, Align Text submenu (Left, Center, Right, Justify), Bold (Ctrl+B, toggle), Italic (Ctrl+I, toggle), Underline (Ctrl+U, toggle), separator, Convert to Outlines, Convert to Path
  - Image additions: Replace Image..., Extract Image, separator, Edit Externally, Reset Adjustments, separator, Crop to Shape, Set as Background
  - Shape additions: Edit Shape, Change Shape Type submenu (Rectangle, Rounded Rectangle, Ellipse, Polygon, Star, Triangle, Line), separator, Boolean Operation submenu (Unite, Subtract, Intersect, Exclude, Divide, Merge), Flatten, separator, Convert to Outlines
  - Group additions: Enter Isolation Mode, Ungroup, separator, Group Properties...
  - Boolean submenu visible only when `selectionCount >= 2`
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T5: Ruler Context Menu

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5 CM) alongside R5-T2, R5-T4, R5-T8. All depend on R5-T1. Each targets a separate context menu module.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/rulerContextMenu.ts` (new)
  - `buildRulerContextMenu(opts: { orientation: 'horizontal' | 'vertical'; hasGuides: boolean; anyLockedGuides: boolean }): ContextMenuItem[]`
  - Items per §R5.5: New Guide..., separator, Units submenu (Pixels, Inches, cm, mm, Picas, Points — radio selection with check on active), separator, Show Rulers (toggle), Show Guides (toggle), Show Grid (toggle), Snap to Guides (toggle), Snap to Grid (toggle), separator, Lock Guides (toggle), Clear Guides (disabled when `!hasGuides`), separator, Reset Ruler Origin
  - Calls `filterMenuItems(items, ctx)` before returning
  - Item IDs: `'ruler.newGuide'`, `'ruler.units.pixels'`, etc.
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Modify `frontend/views/dashboard/cert/templates/editor/EditorRulerTop.tsx` and `frontend/views/dashboard/cert/templates/editor/EditorRulerSide.tsx`
  - Each attaches `onContextMenu` calling `buildRulerContextMenu({ orientation, hasGuides, anyLockedGuides })` then `openMenu('ruler-h' | 'ruler-v', {x, y}, items)`
  - Existing ruler hover handlers unchanged
  - Adds corner double-click handler to reset ruler origin
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T6: Duplicate Special Dialog

> **Parallelizable**: This task runs as a subagent in Wave 3 (R5 CM) alongside R5-T7, R5-T9. All wait on Wave 2 tasks (T1, T2, T4, T5, T8). Each targets a separate dialog/integration module.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/dialogs/DuplicateSpecialDialog.tsx` (new)
  - Fields per §R5.6: Number of Copies (TextField number, min 1 max 100), Spacing (X/Y px fields), Mode toggle (Translate / Rotate), Rotation Angle (when Rotate), Scale per Copy (%) slider 0-200, mini preview canvas showing first 3 copies as outlined rectangles
  - Confirm dispatches `canvasStore.duplicateSpecial(selectedIds, { count, spacing, mode, scalePerCopy })`
  - All MUI v9 `sx={{}}` — no style props; colors from `theme.palette`
  - Labels via `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` from `@/shared/locale/client`
  - No hardcoded colors
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T7: Numeric Transform Dialog

> **Parallelizable**: This task runs as a subagent in Wave 3 (R5 CM) alongside R5-T6, R5-T9. All wait on Wave 2 tasks (T1, T2, T4, T5, T8). Each targets a separate dialog/integration module.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/dialogs/NumericTransformDialog.tsx` (new)
  - Fields per §R5.7: X, Y, W (lock-aspect chain icon), H, Rotation (-360 to 360), Skew X (-45 to 45), Skew Y (-45 to 45), Flip H (checkbox), Flip V (checkbox)
  - Live preview via `canvasStore.updateElementTransform(id, transform)` debounced 100ms
  - Confirm commits; Cancel reverts to transform snapshot taken on dialog open
  - All `sx={{}}`; labels from `useAppTranslation` — keys `numericTransform.*` per §R5.10
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T8: Context Menu Behavior Module & Store Actions

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5 CM) alongside R5-T2, R5-T4, R5-T5. All depend on R5-T1. Each targets a separate context menu module.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/contextMenus/contextMenuBehavior.ts` (new)
  - Exports constants `SUBMENU_DELAY_MS = 200`, `SUBMENU_ROLLBACK_MS = 150`, `MENU_OPEN_TRANSITION_MS = 80`, `MENU_CLOSE_TRANSITION_MS = 80`
  - No runtime logic — pure constants file imported by Plan 10's `ContextMenuHost` and `SubmenuTrigger`
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Modify `frontend/common/stores/cert/canvasStore.ts` (existing) — add store actions per §R5.11:
  - `duplicateSpecial(ids, opts)`, `alignElements(ids, align, ref)`, `distributeElements(ids, axis, mode)`, `booleanOperation(ids, op)`, `flattenCompound(id)`, `convertToOutlines(id)`, `convertToPath(id)`, `setAsBackground(id)`, `extractImage(id)`, `cropToShape(id)`, `enterIsolationMode(groupElementId)`, `exitIsolationMode()`
  - Each action updates the elements array immutably (Zustand) and notifies via `useSyncExternalStore` — `useShallow` in `CanvasArea` subscribers
  - Each action respects `isolationDepth > 0` scoping when applicable (only mutate inside-isolation elements)
  - Add transactional history entries for undo/redo (R3 history stack) — at minimum `duplicateSpecial`, `booleanOperation`, `flattenCompound`, `setAsBackground`, `extractImage`, `convertToOutlines`
  - **Quality loop**: tsgo + biome + lint queue client
- [ ] Modify `frontend/common/stores/cert/uiStore.ts` (existing) — add per §R5.11:
  - `isolationDepth: number`, `rulerUnits`, `recentFonts`, `pushRecentFont`, `alignToCanvas`, `setAlignToCanvas`
  - Persist `rulerUnits` and `recentFonts` per-user via existing prefs persistence path
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T9: Editor Canvas Integration

> **Parallelizable**: This task runs as a subagent in Wave 3 (R5 CM) alongside R5-T6, R5-T7. All wait on Wave 2 tasks (T1, T2, T4, T5, T8). Each targets a separate dialog/integration module.

- [ ] Modify `frontend/views/dashboard/cert/templates/editor/CanvasArea.tsx` (existing)
  - Attach `onContextMenu` from `useCanvasContextMenu` (R5-T1) to the canvas root `Box`
  - Ensure each rendered element has `data-element-id={element.id}` attribute on its outer wrapper for `document.elementFromPoint` detection
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T10: Test Suite

> **Parallelizable**: This task runs as a subagent in Wave 4 (R5 CM). It waits on all Wave 3 implementation tasks (T6, T7, T9) being complete.

- [ ] Create `test/unit/canvasStoreContextActions.test.ts` (new)
  - Test: `duplicateSpecial` with count=3 + translate spacing (10, 10) yields 3 new elements positioned at incremental offsets
  - Test: `alignElements` with `'left'` aligns all left edges to minimum left
  - Test: `distributeElements` with axis='h' mode='center' produces equal horizontal spacing of centers
  - Test: `booleanOperation` with `'unite'` on two overlapping shapes yields one new compound path element (id returned)
  - Test: `flattenCompound` converts a boolean compound into a single `<path>` element
  - Test: `setAsBackground` moves element to z-index MIN and sets `isBackground: true`
  - Test: `enterIsolationMode` increments `uiStore.isolationDepth`; `exitIsolationMode` resets to 0
  - Test: undo restores prior state after `duplicateSpecial` (history stack integration)
  - **Quality loop**: tsgo + biome + lint queue client

### R5-T11: Knowledge Propagation

- [ ] Update `frontend/IMPLEMENTATION_LEARNINGS.md` (append-only)
  - Add entry: `document.elementFromPoint(e.clientX, e.clientY)` + `.data-element-id` traversal is the reliable way to know what the user right-clicked — do NOT rely on `onContextMenu` firing on the element's outermost DOM wrapper because children can intercept it
  - Add entry: `useShallow` on `useCanvasStore` is critical — re-renders during property drag would otherwise invalidate the `useMemo` on builder output, causing the menu to lose its state
  - Add entry: converting canvas coords to viewport coords for menu positioning while storing canvas coords in `item.data` (for paste-in-place etc.) cleanly separates display vs action concerns
  - Add entry: `aria-activedescendant` on the menu root Paper avoids `scrollIntoView` jank during arrow-key nav; DOM focus movement would scroll the menu
  - Add entry: boolean operations on compound shapes require z-order + path directionality awareness — document the SVG path-direction rule (clockwise = fill, counter-clockwise = hole) to prevent Append-Rule merge failures
- [ ] Update `frontend/COMPONENT_PATTERNS.md` (append-only)
  - Add "Canvas Right-Click Routing" pattern: the hook dispatcher decides between empty-area and element menu by hit-testing; builders compose disjoint menus
  - Add "Element-Type Additions" pattern: per-element-type menu items appended after a separator — builders return `ContextMenuItem[]` and the composer inserts them
  - Add "Ruler Orientation Inference" pattern: orientation drives New Guide preset; same builder used for both rulers with the orientation arg
- [ ] Update `frontend/AGENTS.md` (append-only)
  - Reference `canvasContextMenu.ts`, `elementContextMenu.ts`, `elementTypeMenuItems.ts`, `rulerContextMenu.ts` as builders for Plan 12's layers panel right-click (Plan 12 reuses these)
  - Note the `frontend/views/dashboard/cert/templates/editor/contextMenus/` directory is shared — Plan 10 owns the host/service; Plan 11 owns the canvas/ruler builders; Plan 12 owns layers/property panel builders; all import Plan 10 primitives
  - Note the `submenuDelayMs` and `SUBMENU_ROLLBACK_MS` constants live in `contextMenuBehavior.ts` (Plan 11 R5-T8) — Plan 10's `SubmenuTrigger` imports these
  - **Quality loop**: tsgo + biome + lint queue client

### Instruction File & AGENTS.md Discovery (Round 5 Append, Plan 11)

| Task | Files Created/Modified | AGENTS.md to Read | Instructions to Read |
|---|---|---|---|
| R5-T1 | `contextMenus/useCanvasContextMenu.ts` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T2 | `contextMenus/canvasContextMenu.ts` | `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T3 | `contextMenus/elementContextMenu.ts` | `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T4 | `contextMenus/elementTypeMenuItems.ts` | `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T5 | `contextMenus/rulerContextMenu.ts`, `EditorRulerTop.tsx` (modify), `EditorRulerSide.tsx` (modify) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T6 | `dialogs/DuplicateSpecialDialog.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T7 | `dialogs/NumericTransformDialog.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T8 | `contextMenus/contextMenuBehavior.ts`, `frontend/common/stores/cert/canvasStore.ts` (modify), `frontend/common/stores/cert/uiStore.ts` (modify) | `frontend/stores/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T9 | `CanvasArea.tsx` (modify) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| R5-T10 | `test/unit/canvasStoreContextActions.test.ts` | `AGENTS.md` | `.agents/instructions/tests.instructions.md`, `.agents/instructions/frontend.instructions.md` |
| R5-T11 | `frontend/IMPLEMENTATION_LEARNINGS.md`, `frontend/COMPONENT_PATTERNS.md`, `frontend/AGENTS.md` (append-only) | `frontend/AGENTS.md`, `AGENTS.md` | — |

### Round 5 Execution Order (Plan 11 Context Menus)

```
Phase R5-A (sequential): R5-T1 (canvas hook — entry point for both empty-area and element routes)
Phase R5-B (via parallel subagents): R5-T2 (empty-area builder), R5-T3 (element builder), R5-T4 (element-type additions builder), R5-T5 (ruler builder + ruler integration), R5-T8 (behavior constants + store actions)
  ─── R5-T3 waits on R5-T4 (element builder appends element-type menu items)
Phase R5-C (via parallel subagents): R5-T6 (Duplicate Special Dialog — waits on T8's duplicateSpecial action), R5-T7 (Numeric Transform Dialog — waits on T8's updateElementTransform action), R5-T9 (canvas integration — waits on T1-T5)
Phase R5-D (via parallel subagents): R5-T10 (test suite — waits on T1-T8 implementation)
Phase R5-E (sequential): R5-T11 (knowledge propagation — waits on all of above)
```

**Plan 11 R5 (Context Menus) total estimated time**: ~18 hours → ~9 wall-clock hours with the parallel subagent phases R5-B, R5-C, R5-D.

### R5 Context Menus Parallel Subagent Strategy

### Wave 1 (R5 CM): R5-T1
- Tasks: R5-T1 (Canvas Context Menu Hook)
- Rationale: Foundation — entry point for both empty-area and element routes.

### Wave 2 (R5 CM): R5-T2, R5-T4, R5-T5, R5-T8
- Tasks (via parallel subagents): R5-T2 (empty-area builder), R5-T4 (element-type additions builder), R5-T5 (ruler builder + ruler integration), R5-T8 (behavior constants + store actions)
- Rationale: All depend on R5-T1. R5-T3 waits on R5-T4 so T4 must complete before T3. T2, T4, T5, T8 target disjoint modules.

### Wave 2b (R5 CM): R5-T3
- Tasks: R5-T3 (element builder — appends element-type menu items)
- Rationale: Sequential — waits on R5-T4's element-type additions.

### Wave 3 (R5 CM): R5-T6, R5-T7, R5-T9
- Tasks (via parallel subagents): R5-T6 (Duplicate Special Dialog), R5-T7 (Numeric Transform Dialog), R5-T9 (canvas integration)
- Rationale: T6 waits on T8's duplicateSpecial action. T7 waits on T8's updateElementTransform action. T9 waits on T1–T5. All T8 and T1–T5 are complete by this wave. Disjoint modules.

### Wave 4 (R5 CM): R5-T10
- Tasks: R5-T10 (test suite)
- Rationale: Test suite waits on all T1–T8 implementation. Single-task wave.

### Final Wave (R5 CM): R5-T11
- Task: R5-T11 (Knowledge Propagation)
- Rationale: Must run after all R5 Context Menus implementation is complete.

> All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks (tsgo → biome → lint → codescene). The lint queue server must be running before any lint call. See `AGENTS.md` §"Lint Queue Server" for startup commands.

## Round 5: Custom Shapes & Boolean Tasks

These tasks implement the Round 5 custom shapes and boolean operations design defined in `design.md` §"Round 5: Custom Shapes & Boolean Operations". Each task references the corresponding design section (R5.X).

### T-R5-01: Shape Node Rendering — SVG Elements by Shape Type

**Objective:** Render shape elements as SVG `<rect>`, `<ellipse>`, `<polygon>`, `<path>`, `<line>` elements based on `shapeType`.

**Subtasks:**

- [ ] R5.1.1 Create `frontend/views/dashboard/cert/templates/editor/nodes/ShapeNode.tsx`:
  - Switch on `element.shapeType` to render appropriate SVG child
  - Rectangle → `<rect>` with width, height, rx/ry from cornerRadius
  - Ellipse → `<ellipse>` with cx, cy, rx, ry
  - Polygon → `<polygon>` with points from `generatePolygonPoints`
  - Star → `<path>` with `d` from `generateStarPath`
  - Triangle → `<path>` with `d` from `generateTrianglePath`
  - Line → `<line>` with stroke, dasharray, marker definitions
  - Custom/Boolean → `<path>` with `d` from `pathData` or boolean computed path
  - All SVG elements use `fill` and `stroke` from element config
  - `pointer-events: fill` for filled shapes, `pointer-events: stroke` for outlined-only
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] R5.1.2 Create `frontend/views/dashboard/cert/templates/editor/utils/shapePathGenerators.ts`:
  ```typescript
  export function generateRoundedRectPath(x, y, w, h, radii: { tl, tr, bl, br }): string;
  export function generatePolygonPoints(w, h, sides, rotation): string;
  export function generateStarPath(w, h, points, innerRadiusPercent): string;
  export function generateTrianglePath(w, h, type, direction): string;
  export function generateArcPath(w, h, startAngle, endAngle): string;
  ```
  - All pure functions, no side effects
  - Per-corner rounded rect uses SVG `A` (arc) commands for each corner
  - Polygon points computed via trig: `angle = (2π * i / sides) + rotation`
  - Star: alternating outer/inner radius points, `innerRadius = outer * (innerRadiusPercent / 100)`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] R5.1.3 Register `ShapeNode` in React Flow `nodeTypes` in `CanvasComponent.tsx`:
  - `nodeTypes = { ..., shape: ShapeNode }`
  - Pass element data via `node.data`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] R5.1.4 Implement arrow head marker definitions in `<defs>` for line shapes:
  - 4 marker styles: solid, open, triangle
  - Each marker has unique ID: `arrow-start-${elementId}` and `arrow-end-${elementId}`
  - Markers auto-adjust size based on stroke width
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] R5.1.5 Run quality loop per file

**Files to Create/Modify:**
- `frontend/views/dashboard/cert/templates/editor/nodes/ShapeNode.tsx` (new)
- `frontend/views/dashboard/cert/templates/editor/utils/shapePathGenerators.ts` (new)
- `frontend/views/dashboard/cert/templates/editor/CanvasComponent.tsx` (modify — add `shape` to `nodeTypes`)

**Quality Loop:** Per-file progressive verification via `sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene).

**Tests:**

---

### T-R5-02: Shape Drawing Interaction — Click+Drag on Canvas

**Objective:** Implement click+drag drawing of shapes on the canvas with Shift (proportional) and Alt (from center) modifiers.

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5 Shapes) alongside T-R5-03. Both depend on T-R5-01. T02 targets drawing interaction; T03 targets path parser + edit mode. Disjoint modules.

**Subtasks:**

- [ ] R5.2.1 Create `frontend/views/dashboard/cert/templates/editor/hooks/useShapeDrawing.ts`:
  - Reads `activeShapeTool` from `templateEditorStore`
  - When not `'select'`, attaches pointer handlers to canvas background
  - `onPointerDown`: record start point, create preview shape element (width=0, height=0)
  - `onPointerMove`: update preview shape based on pointer position (dx, dy from start)
    - If `e.shiftKey`: constrain to proportional (max(|dx|, |dy|) for both dimensions)
    - If `e.altKey`: draw from center (start point is center, not top-left)
    - Handle negative drag (up/left) by computing actual top-left
  - `onPointerUp`: finalize shape — if width AND height < 2px (accidental click), discard; otherwise commit to store as permanent element
  - After commit, stay in draw mode (user can draw more shapes)
  - Preview shape rendered with `theme.palette.primary.main` stroke, `0.3` opacity, no fill
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] R5.2.2 Add drawing state to `frontend/common/stores/canvasStore.ts`:
  ```typescript
  isDrawingShape: boolean;
  drawingPreview: ShapeElementData | null;
  drawingStartPoint: { x: number; y: number } | null;
  startShapeDrawing: (tool: ShapeTool, start: { x: number; y: number }) => void;
  updateShapeDrawing: (current: { x: number; y: number }, modifiers: { shift: boolean; alt: boolean }) => void;
  endShapeDrawing: () => void;
  cancelShapeDrawing: () => void;
  ```
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] R5.2.3 Render preview shape via `ShapeNode` with `isPreview: true` flag:
  - Preview node has `pointerEvents: none` (non-interactive)
  - Preview uses ghost styling (stroke opacity 0.3, no fill)
  - Not saveable to backend (excluded from template serialization)
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] R5.2.4 Disable React Flow `panOnDrag` during drawing mode:
  - When `activeShapeTool !== 'select'`, set `panOnDrag={false}` on `<ReactFlow>`
  - Re-enable when returning to select mode
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] R5.2.5 Custom shape placement (from library):
  - When `activeShapeTool === 'custom'`:
    - Single click → places selected library shape at default size centered at click
    - Click+drag → places shape scaled to drag rectangle (maintain aspect ratio)
  - **Quality loop**: tsgo + biome + lint queue client

**Files to Create/Modify:**
- `frontend/views/dashboard/cert/templates/editor/hooks/useShapeDrawing.ts` (new)
- `frontend/common/stores/canvasStore.ts` (modify — add drawing state)
- `frontend/views/dashboard/cert/templates/editor/CanvasComponent.tsx` (modify — conditional panOnDrag)

**Quality Loop:** Per-file progressive verification via `sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene).

**Tests:**

---

### T-R5-03: Shape Edit Mode — Anchor Points & Bezier Handles

**Objective:** Double-click shape to enter edit mode showing draggable anchor points and Bezier handles.

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5 Shapes) alongside T-R5-02. Both depend on T-R5-01. T02 targets drawing interaction; T03 targets path parser + edit mode. Disjoint modules.

**Subtasks:**

- [ ] R5.3.1 Create `frontend/views/dashboard/cert/templates/editor/utils/pathParser.ts`:
  ```typescript
  export function parsePathData(d: string): PathCommand[];
  export function serializePathData(commands: PathCommand[]): string;
  export function insertAnchor(commands, segmentIndex, t): PathCommand[];
  export function deleteAnchor(commands, anchorIndex): PathCommand[];
  export function moveAnchor(commands, anchorIndex, x, y): PathCommand[];
  export function convertAnchorType(commands, anchorIndex, toSmooth): PathCommand[];
  ```
  - Parse SVG path commands: M, L, C, Q, A, Z
  - Each command has `points[]` and optional `handles` (for C/Q bezier)
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] R5.3.2 Create `frontend/views/dashboard/cert/templates/editor/nodes/ShapeEditMode.tsx`:
  - Renders anchor points as 6px circles at each path vertex
  - Selected anchor shows Bezier direction handle lines + handle endpoint circles
  - `onPointerDown` on anchor → start drag
  - `onPointerDown` on path segment → insert anchor at click position
  - `Delete` key → delete selected anchor
  - `Alt+click` sharp anchor → convert to smooth; `Alt+click` smooth → convert to sharp
  - Double-click outside or `Esc` → exit edit mode, commit path
  - Colors: anchors = `theme.palette.common.white` fill, `theme.palette.primary.main` stroke; handles = `theme.palette.primary.light`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] R5.3.3 Add edit mode state to `canvasStore.ts`:
  ```typescript
  editingShapeId: string | null;
  enterShapeEditMode: (elementId: string) => void;
  exitShapeEditMode: () => void;
  updateShapePath: (elementId: string, pathData: string) => void;
  ```
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] R5.3.4 Wire double-click on `ShapeNode` to enter edit mode:
  - When `activeShapeTool === 'select'` and element not locked
  - Double-click calls `enterShapeEditMode(elementId)`
  - `ShapeEditMode` overlay renders on top of the shape
  - Exit commits path data to `updateShapePath`
  - **Quality loop**: tsgo + biome + lint queue client

**Files to Create/Modify:**
- `frontend/views/dashboard/cert/templates/editor/utils/pathParser.ts` (new)
- `frontend/views/dashboard/cert/templates/editor/nodes/ShapeEditMode.tsx` (new)
- `frontend/common/stores/canvasStore.ts` (modify — edit mode state)
- `frontend/views/dashboard/cert/templates/editor/nodes/ShapeNode.tsx` (modify — double-click handler)

**Quality Loop:** Per-file progressive verification via `sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene).

**Tests:**

---

### T-R5-04: Boolean Operation Path Math

**Objective:** Compute boolean operation results (unite, subtract, intersect, exclude, divide, trim, merge) from two or more shape paths.

**Subtasks:**

- [ ] R5.4.1 Install `js-clipper` package (or equivalent pure-JS clipper library):
  ```bash
  bun add js-clipper
  ```
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] R5.4.2 Create `frontend/views/dashboard/cert/templates/editor/utils/booleanPathMath.ts`:
  ```typescript
  export function computeBooleanPath(operands: ShapeOperand[], operation: BooleanOperation): string;
  export function flattenBoolean(element: BooleanResultElement, computedPath: string): BakedShapeElement;
  export function computeDividePieces(operands: ShapeOperand[]): string[];
  export function computeTrimPieces(operands: ShapeOperand[]): string[];
  ```
  - Convert SVG path → Clipper polygon format
  - Apply `ClipType` based on operation:
    - unite → `ClipType.ctUnion`
    - subtract → `ClipType.ctDifference`
    - intersect → `ClipType.ctIntersection`
    - exclude → `ClipType.ctXor`
    - divide → union then split at intersection lines
    - trim → union then cut at intersection points, keep separate pieces
    - merge → compound path (multiple subpaths via `M` commands, no actual boolean)
  - Convert result back to SVG path data
  - Handle errors: degenerate paths, self-intersecting loops, precision errors → log via `logger.warn`, throw `BooleanComputationError`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] R5.4.3 Implement boolean result caching:
  ```typescript
  interface BooleanConfig {
    operation: BooleanOperation;
    operandIds: string[];
    operands: ShapeOperand[];
    computedPathData?: string;   // cached result
    cacheVersion: number;        // incremented when operands change
  }
  ```
  - Cache stored on the boolean element's `booleanConfig`
  - `cacheVersion` incremented when any operand path or transform changes
  - Recompute only when `cacheVersion` changes
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] R5.4.4 Handle boolean operation failure gracefully:
  - If `computeBooleanPath` throws, render first operand as fallback
  - Add `theme.palette.warning.main` outline on fallback render
  - Show toast: "Boolean operation failed — showing original shape"
  - Log error via `logger.warn` with operand IDs and operation
  - **Quality loop**: tsgo + biome + lint queue client

**Files to Create/Modify:**
- `frontend/views/dashboard/cert/templates/editor/utils/booleanPathMath.ts` (new)
- `frontend/views/dashboard/cert/templates/editor/nodes/ShapeNode.tsx` (modify — render boolean path)
- `package.json` (modify — add `js-clipper` dependency)

**Quality Loop:** Per-file progressive verification via `sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene).

**Tests:**

---

### T-R5-05: Shape Path Caching & Performance

**Objective:** Cache shape path generation during drag interactions for smooth performance.

> **Parallelizable**: This task runs as a subagent in Wave 4 (R5 Shapes) alongside T-R5-06, T-R5-07, T-R5-08. All are independent feature tasks extending shape rendering. Disjoint modules.

**Subtasks:**

- [ ] R5.5.1 Create `frontend/views/dashboard/cert/templates/editor/utils/shapePathCache.ts`:
  ```typescript
  const pathCache = new Map<string, string>();
  function getCacheKey(data: ShapeElementData): string;
  export function getCachedShapePath(data: ShapeElementData): string;
  export function clearShapePathCache(): void;  // for memory pressure
  ```
  - Cache key is `JSON.stringify` of relevant geometry fields
  - LRU eviction when cache exceeds 500 entries
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] R5.5.2 Integrate cache in `ShapeNode.tsx`:
  - Before generating path, call `getCachedShapePath(data)`
  - During drag, cached paths are reused without recomputation
  - **Quality loop**: tsgo + biome + lint queue client

**Files to Create/Modify:**
- `frontend/views/dashboard/cert/templates/editor/utils/shapePathCache.ts` (new)
- `frontend/views/dashboard/cert/templates/editor/nodes/ShapeNode.tsx` (modify — use cache)

**Quality Loop:** Per-file progressive verification via `sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene).

**Tests:**

---

### T-R5-06: Interactive Corner Radius Handle on Canvas

**Objective:** Drag a handle on the top-left corner of selected rectangles to adjust corner radius.

> **Parallelizable**: This task runs as a subagent in Wave 4 (R5 Shapes) alongside T-R5-05, T-R5-07, T-R5-08. All are independent feature tasks extending shape rendering. Disjoint modules.

**Subtasks:**

- [ ] R5.6.1 Create `frontend/views/dashboard/cert/templates/editor/nodes/CornerRadiusHandle.tsx`:
  - Small circle (r=4) positioned at `(radius, radius)` from top-left
  - `cursor: 'ew-resize'`
  - On `onPointerDown`: start radius drag
  - On drag: compute radius from horizontal mouse distance from corner
  - Clamp: `0 <= radius <= min(width, height) / 2`
  - Update `cornerRadius.all` (uniform) or `cornerRadius.topLeft` (per-corner)
  - Colors: `theme.palette.common.white` fill, `theme.palette.primary.main` stroke
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] R5.6.2 Render `CornerRadiusHandle` in `ShapeNode.tsx` when:
  - `shapeType === 'rectangle' || 'roundedRectangle'`
  - Element is selected (`selected === true`)
  - Not in lock mode
  - **Quality loop**: tsgo + biome + lint queue client

**Files to Create/Modify:**
- `frontend/views/dashboard/cert/templates/editor/nodes/CornerRadiusHandle.tsx` (new)
- `frontend/views/dashboard/cert/templates/editor/nodes/ShapeNode.tsx` (modify — render handle)

**Quality Loop:** Per-file progressive verification via `sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene).

**Tests:**

---

### T-R5-07: Interactive Polygon Sides & Star Points Editing on Canvas

**Objective:** Show +/− buttons on canvas for adjusting polygon sides and star points.

> **Parallelizable**: This task runs as a subagent in Wave 4 (R5 Shapes) alongside T-R5-05, T-R5-06, T-R5-08. All are independent feature tasks extending shape rendering. Disjoint modules.

**Subtasks:**

- [ ] R5.7.1 Create `frontend/views/dashboard/cert/templates/editor/nodes/ShapeSidesHandle.tsx`:
  - For polygon: `IconButton` with `RemoveOutlined` / `AddOutlined` + count display
  - Clamped: polygon sides 3–12
  - Positioned above shape center (`top: -30`, `left: 50%`, `transform: translateX(-50%)`)
  - Only visible when shape is selected
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] R5.7.2 Extend `ShapeSidesHandle` for star shape:
  - Same +/− buttons for star points (clamped 3–20)
  - Additional inner radius drag handle: small dot on the inner radius circle
  - Dragging the inner radius handle updates `starInnerRadius` (10–90%)
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] R5.7.3 Render `ShapeSidesHandle` in `ShapeNode.tsx` when:
  - `shapeType === 'polygon'` → sides controls
  - `shapeType === 'star'` → points controls + inner radius handle
  - Element is selected
  - **Quality loop**: tsgo + biome + lint queue client

**Files to Create/Modify:**
- `frontend/views/dashboard/cert/templates/editor/nodes/ShapeSidesHandle.tsx` (new)
- `frontend/views/dashboard/cert/templates/editor/nodes/ShapeNode.tsx` (modify — render handle)

**Quality Loop:** Per-file progressive verification via `sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene).

**Tests:**

---

### T-R5-08: Shape Hover & Selection Visuals

**Objective:** Shape hover highlight and bounding-box selection frame.

> **Parallelizable**: This task runs as a subagent in Wave 4 (R5 Shapes) alongside T-R5-05, T-R5-06, T-R5-07. All are independent feature tasks extending shape rendering. Disjoint modules.

**Subtasks:**

- [ ] R5.8.1 Implement hover highlight in `ShapeNode.tsx`:
  - `onMouseEnter` → set CSS class `shape-hover` on SVG child
  - `shape-hover` stroke: `theme.palette.primary.main` at 50% opacity, stroke-width 2
  - `onMouseLeave` → remove hover class
  - CSS variable `--hover-color` set via `sx` on wrapper:
    ```tsx
    <Box sx={{ '--hover-color': (theme) => theme.palette.primary.main }}>
    ```
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] R5.8.2 Selection frame uses bounding box (existing React Flow selection):
  - No custom selection overlay needed
  - Standard `SelectedNodeWrapper` applies bounding box frame
  - **Quality loop**: tsgo + biome + lint queue client

**Files to Create/Modify:**
- `frontend/views/dashboard/cert/templates/editor/nodes/ShapeNode.tsx` (modify — hover handlers)

**Quality Loop:** Per-file progressive verification via `sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene).

**Tests:**

---

### T-R5-09: Shape Error States & Fallback Rendering

**Objective:** Handle invalid path data, boolean failures, and SVG import errors gracefully.

**Subtasks:**

- [ ] R5.9.1 Invalid path data fallback in `ShapeNode.tsx`:
  - Wrap path rendering in error boundary (`CertificateNodeErrorBoundary` from R4)
  - On error: render placeholder rect with `theme.palette.error.main` border
  - "Reset shape" button calls `updateNode(id, { shapeType: 'rectangle', pathData: undefined, width: 100, height: 100 })`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] R5.9.2 Boolean operation failure fallback:
  - If `computeBooleanPath` throws, render first operand
  - Add `theme.palette.warning.main` outline
  - Show toast: "Boolean operation failed — showing original shape"
  - Log via `logger.warn`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] R5.9.3 SVG import parse failure:
  - `parseSvgToShapePreset` throws `InvalidSvgError`
  - Caught by import dialog (Plan 10's `SvgImportDialog`)
  - Display error `Alert` with file name
  - **Quality loop**: tsgo + biome + lint queue client

**Files to Create/Modify:**
- `frontend/views/dashboard/cert/templates/editor/nodes/ShapeNode.tsx` (modify — error boundary fallback)
- `frontend/views/dashboard/cert/templates/editor/utils/booleanPathMath.ts` (modify — error handling)

**Quality Loop:** Per-file progressive verification via `sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene).

**Tests:**

---

### Subtasks

2. Create all test files per specs in T-R5-01 through T-R5-09
4. Mock `useCanvasStore` and `useTemplateEditorStore` for component tests
5. Run quality loop per test file

- [ ] **Quality Loop**: tsgo + biome + lint queue client

---

### Round 5 Execution Order

```
Phase R5-A (sequential):  T-R5-01 (shape rendering — foundation)
Phase R5-B (via parallel subagents):    T-R5-02 (drawing interaction), T-R5-03 (path parser + edit mode)
Phase R5-C (sequential):  T-R5-04 (boolean path math — depends on path generator)
Phase R5-D (via parallel subagents):    T-R5-05 (caching), T-R5-06 (corner radius handle), T-R5-07 (sides handle), T-R5-08 (hover)
Phase R5-E (sequential):  T-R5-09 (error states)
Phase R5-F (sequential):  T-R5-09 (error states)
```

**Round 5 total estimated time**: 28 hours (parallelizable to ~16 wall-clock hours)

### R5 Custom Shapes Parallel Subagent Strategy

### Wave 1 (R5 Shapes): T-R5-01
- Tasks: T-R5-01 (Shape Node Rendering)
- Rationale: Foundation — shape rendering base. All other R5 Shapes tasks depend on T01.

### Wave 2 (R5 Shapes): T-R5-02, T-R5-03
- Tasks (via parallel subagents): T-R5-02 (drawing interaction), T-R5-03 (path parser + edit mode)
- Rationale: Both depend on T-R5-01. T02 targets drawing interaction; T03 targets path parser + edit mode. Disjoint modules.

### Wave 3 (R5 Shapes): T-R5-04
- Tasks: T-R5-04 (boolean path math)
- Rationale: Sequential — depends on path generator from Wave 2.

### Wave 4 (R5 Shapes): T-R5-05, T-R5-06, T-R5-07, T-R5-08
- Tasks (via parallel subagents): T-R5-05 (caching), T-R5-06 (corner radius handle), T-R5-07 (sides handle), T-R5-08 (hover)
- Rationale: All independent feature tasks that extend the shape rendering. Disjoint modules.

### Wave 5 (R5 Shapes): T-R5-09
- Tasks: T-R5-09 (error states).
- Rationale: T09 (error states) then T10 (tests — depends on all above).

## Round 5: Zoom & Navigation Tasks

- [ ] R5Z-T1. Implement canvas zoom transform rendering
  - Apply `transform: scale(zoom) translate(scrollOffset)` on canvas content layer
  - GPU-accelerated via `willChange: transform`
  - No element re-render on zoom — pure CSS transform
  - File: `frontend/views/certificate-editor/components/CanvasViewport.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5Z-T2. Implement zoom-to-point with mouse wheel
  - `Ctrl`+wheel zoom, point under cursor stays fixed
  - Recalculate scrollOffset based on cursor position and zoom factor
  - Pinch-zoom on trackpad (two-finger pinch)
  - File: `frontend/views/certificate-editor/hooks/useZoomOnWheel.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5Z-T3. Implement smooth zoom transitions
  - requestAnimationFrame easing (ease-out cubic, 200ms)
  - Animate from current zoom to target zoom
  - Cancel previous animation on new zoom request
  - File: `frontend/views/certificate-editor/utils/zoomAnimation.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5Z-T4. Implement LOD (level of detail) rendering at zoom
  - <25%: hide text, show silhouettes
  - 200%–400%: hide text <8px
  - 400%–800%: hide text <12px, show bounding boxes
  - 800%–1600%: pixel grid overlay, pixel boundaries
  - File: `frontend/views/certificate-editor/utils/lodRenderer.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5Z-T5. Implement pan rendering via CSS translate
  - Pan via `translate()` in same transform as zoom
  - Scroll offset stored in unscaled canvas coords
  - Smooth pan with momentum (optional)
  - File: `frontend/views/certificate-editor/hooks/usePanRender.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5Z-T6. Implement viewport intersection observer
  - Only render elements within current viewport bounds
  - Calculate visible bounds from zoom + scrollOffset + viewportSize
  - Debounced — recalculate on pan/zoom end (not during)
  - File: `frontend/views/certificate-editor/hooks/useVisibleElements.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5Z-T7. Implement MiniMap canvas rendering
  - Render certificate at 25% scale via SVG
  - Viewport rectangle based on scrollOffset and viewportSize
  - Click-to-navigate: convert click to canvas coords and update scrollOffset
  - Drag viewport rectangle to pan
  - File: `frontend/views/certificate-editor/components/MiniMapCanvas.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5Z-T8. Implement Navigator panel rendering
  - Red viewport rectangle over certificate thumbnail
  - Drag rectangle to navigate
  - Zoom slider (5%–1600%)
  - Real-time update during pan/zoom
  - File: `frontend/views/certificate-editor/components/NavigatorCanvas.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5Z-T9. Implement scroll bar enhancements
  - Overscroll behavior (stop at document bounds)
  - Smooth scrolling (200ms animation)
  - Scroll position percentage indicator in thumb
  - Horizontal + vertical scroll bars on canvas edges
  - File: `frontend/views/certificate-editor/components/CanvasScrollBars.tsx`
  - _Quality loop_: tsgo + biome + lint queue client


## Round 5: Color System Tasks

### R5-CS-T1: Eyedropper Zustand store + canvas store additions

> **Parallelizable**: This task runs as a subagent in Wave 1 (R5-CS) alongside R5-CS-T3, R5-CS-T4. All are independent state + buffer tasks. Disjoint modules.

- [ ] Create `frontend/common/stores/cert/eyedropperStore.ts` with `useEyedropperStore` (Zustand create<>):
  - State: `isActive`, `cursorScreenPos`, `cursorCanvasPos`, `sampledColor: ColorValue | null`, `paintSlot: 'fill' | 'stroke'`
  - Actions: `activate(slot)`, `deactivate()`, `updateCursor(screenPos, canvasPos)`, `setSampledColor(c)`
  - Non-persisted (no `persist` middleware) — session-canvas only
- [ ] Add to `frontend/common/stores/cert/canvasStore.ts` (Plan 11's existing canvas store):
  - `activeTool: 'select' | 'eyedropper' | 'pen' | 'pan'` (default `'select'`)
  - `eyedropperSampleSize: EyedropperSampleSize` (default `'point'`)
  - `eyedropperSampleSource: EyedropperSampleSource` (default `'allLayers'`)
  - Setters: `setActiveTool`, `setEyedropperSampleSize`, `setEyedropperSampleSource`
- [ ] Import `EyedropperSampleSize`, `EyedropperSampleSource`, `ColorValue` from `@/frontend/common/stores/cert/colorSystemTypes` (Plan 10 deliverable)
- [ ] **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T2: Eyedropper interaction hook (useEyedropperInteraction)

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5-CS) alongside R5-CS-T9. Both depend on stores built in Wave 1. T2 and T9 target separate hook modules.

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/canvas/sampling/useEyedropperInteraction.ts`
- [ ] Implement hook signature `useEyedropperInteraction(canvasBounds: CanvasBounds, viewportRef: RefObject<HTMLDivElement>): void`
- [ ] Register window-scoped `mousemove`, `mousedown`, `keydown` listeners (only when `activeTool === 'eyedropper'`)
- [ ] `mousemove`: convert `e.clientX/Y` → canvas coords via viewport rect, call `useEyedropperStore.updateCursor(screenPos, canvasPos)` and compute `sampleColorAt(canvasPos)` → `setSampledColor`
- [ ] `mousedown`: commit sampled color to `useColorSystemStore` based on `activePaintSlot`; `Alt` key flips target slot (fill ↔ stroke); after commit, deactivate tool via `setActiveTool('select')` + `useEyedropperStore.deactivate()`
- [ ] `keydown Escape`: cancel eyedropper, deactivate tool without applying
- [ ] Add picked color to `colorHistory` and `quickSwatches` via Plan 10 store methods
- [ ] Cleanup: remove all 3 listeners in `useEffect` return
- [ ] **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T3: Canvas pixel buffer provider (CanvasPixelBuffer + useCanvasPixelBuffer)

> **Parallelizable**: This task runs as a subagent in Wave 1 (R5-CS) alongside R5-CS-T1, R5-CS-T4. All are independent state + buffer tasks. Disjoint modules.

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/canvas/sampling/CanvasPixelBuffer.tsx`
- [ ] Implement `CanvasPixelBuffer` class with:
  - Constructor takes a `SceneRenderer` (existing Plan 11 component) + `CanvasBounds`
  - Private offscreen `HTMLCanvasElement` + `ctx = offscreen.getContext('2d', { willReadFrequently: true })`
  - `async rebuild(visibilityPredicate: (layer) => boolean)`: re-rasterize the scene onto the offscreen canvas
  - `getPixel(x: number, y: number): { r: number; g: number; b: number; a: number } | null`
- [ ] Implement hook `useCanvasPixelBuffer(visibilityPredicate)`:
  - Lazy-create buffer when `useCanvasStore.activeTool === 'eyedropper'`
  - Re-build on `eyedropperSampleSource` change
  - Teardown on deactivate
- [ ] Pixel buffer must be in scene coordinates (no DPR scaling) so canvas-pos hits match `getImageData` reads
- [ ] **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T4: Pixel sampling utility (sampleColorAt)

> **Parallelizable**: This task runs as a subagent in Wave 1 (R5-CS) alongside R5-CS-T1, R5-CS-T3. All are independent state + buffer tasks. Disjoint modules.

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/canvas/sampling/sampleColorAt.ts`
- [ ] Export `async function sampleColorAt(canvasPos: {x,y}, size: EyedropperSampleSize, source: EyedropperSampleSource | null): Promise<ColorValue | null>`
- [ ] For sample sizes ≤3×3: read pixels individually via `getPixel` and average
- [ ] For sample sizes ≥5×5: do single `getImageData(x−q/2, y−q/2, q, q)` call and average in O(q²) JS — this is the performance pattern from R5-CS5
- [ ] Return `ColorValue` with `hex`, `alpha` (0..1), `space: 'hsl'` (or 'rgb' — matches Plan 10's ColorValue union)
- [ ] Out-of-bounds: return null
- [ ] **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T5: Eyedropper loupe component (EyedropperLoupe)

> **Parallelizable**: This task runs as a subagent in Wave 3 (R5-CS) alongside R5-CS-T6, R5-CS-T7, R5-CS-T8. All UI components depend on hooks from Wave 2. Each targets a separate component file.

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/canvas/overlays/EyedropperLoupe.tsx`
- [ ] Component signature: `EyedropperLoupe({ screenPos, canvasPos, color, sampleSize }: EyedropperLoupeProps)`
- [ ] Render 192×192 pixelated canvas (32 source pixels × 6× magnification) using `imageRendering: 'pixelated'` via `sx={{}`
- [ ] Repaint the loupe canvas from the offscreen pixel buffer's adjacent 32×32 patch on every `cursorScreenPos` change
- [ ] Center crosshair overlay (2px red border on the center cell of 32×32 grid) — color from `theme.palette.error.main`
- [ ] Bottom 24px strip with HEX + RGB + alpha% readout (monospace `typography: 'caption'`) — `theme.palette.text.primary` bg, `theme.palette.background.paper` text
- [ ] Position offset so the loupe doesn't cover the cursor: place 16px to the right AND below by default; if cursor near right edge of viewport, flip to left of cursor
- [ ] **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T6: Crosshair indicator + RealtimeColorReadout

> **Parallelizable**: This task runs as a subagent in Wave 3 (R5-CS) alongside R5-CS-T5, R5-CS-T7, R5-CS-T8. All UI components depend on hooks from Wave 2. Each targets a separate component file.

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/canvas/overlays/CrosshairIndicator.tsx`
  - 21×21 element with red horizontal+vertical lines (1px) + center dot
  - `position: fixed` at `cursorScreenPos`, `transform: 'translate(-50%, -50%)'`
  - `pointerEvents: 'none'`, `zIndex: theme.zIndex.tooltip + 1`
- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/canvas/overlays/RealtimeColorReadout.tsx`
  - Small monospace label at 16px right + 16px below cursor
  - Shows slot marker ('F' / 'S'), hex color, alpha percent
  - `theme.palette.text.primary` bg / `theme.palette.background.paper` text — no hardcoded colors
- [ ] **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T7: Eyedropper options bar (sample size + sample source dropdowns)

> **Parallelizable**: This task runs as a subagent in Wave 3 (R5-CS) alongside R5-CS-T5, R5-CS-T6, R5-CS-T8. All UI components depend on hooks from Wave 2. Each targets a separate component file.

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/canvas/overlays/EyedropperOptionsBar.tsx`
- [ ] Render at bottom-left of canvas container with `position: 'absolute', bottom: 16, left: 16`
- [ ] Sample size `Select` — values: `'point' | '3x3' | '5x5' | '11x11' | '51x51'` with i18n labels via `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` (`toolbarEyedropper.sampleSize.*`)
- [ ] Sample source `Select` — values: `'currentLayer' | 'allLayers' | 'currentLayerBelow'` with i18n labels (`toolbarEyedropper.sampleFrom.*`)
- [ ] Chip showing Escape hint ("Press Esc to cancel") with `onDelete={onEscape}` handler (calls `setActiveTool('select')` + `useEyedropperStore.deactivate()`)
- [ ] All i18n via `const t = useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` from `@/shared/locale/client`
- [ ] All MUI styles via `sx={{}}` (no direct style props)
- [ ] **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T8: Eyedropper overlay orchestrator (EyedropperOverlay + Portal)

> **Parallelizable**: This task runs as a subagent in Wave 3 (R5-CS) alongside R5-CS-T5, R5-CS-T6, R5-CS-T7. All UI components depend on hooks from Wave 2. Each targets a separate component file.

- [ ] Create `frontend/desktop/views/dashboard/certificates/template-editor/canvas/overlays/EyedropperOverlay.tsx`
- [ ] Early return `null` if `activeTool !== 'eyedropper'`
- [ ] Wrap in `Portal` (MUI `@mui/material/Portal`) so children don't reflow the canvas container
- [ ] Render dimming tint `Box` with `sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundColor: 'rgba(0, 0, 0, 0.08)', zIndex: theme.zIndex.tooltip - 1 }}`
- [ ] Render `<CrosshairIndicator screenPos={cursorScreenPos} />`
- [ ] Render `<EyedropperLoupe .../>` when `cursorScreenPos != null && sampledColor != null`
- [ ] Render `<RealtimeColorReadout .../>` when both available
- [ ] Render `<EyedropperOptionsBar .../>` always while eyedropper active
- [ ] All components consume from `useEyedropperStore` and `useCanvasStore`
- [ ] **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T9: Wire eyedropper tool activation to canvas viewport

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5-CS) alongside R5-CS-T2. Both depend on stores built in Wave 1. T2 and T9 target separate hook modules.

- [ ] In `frontend/desktop/views/dashboard/certificates/template-editor/canvas/CanvasViewport.tsx` (existing Plan 11 file):
- [ ] Mount `<EyedropperOverlay />` inside the viewport container
- [ ] Call `useEyedropperInteraction(canvasBounds, viewportRef)` once at top of component
- [ ] When `activeTool === 'eyedropper'`, set container `cursor: 'crosshair'` via `sx` callback (avoid React state mutation)
- [ ] Set CSS `cursor: crosshair` via `sx={{ cursor: activeTool === 'eyedropper' ? 'crosshair' : 'default' }}`
- [ ] Pass `viewportRef` to interaction hook so screen-to-canvas coordinate mapping works
- [ ] Verify the overlay z-index sits above canvas content (theme.zIndex.tooltip - 1 for tint, +1 for readout/crosshair)
- [ ] **Quality loop**: tsgo + biome + lint queue client

### R5-CS-T11: i18n consumption + documentation propagation

> **Parallelizable**: This task runs as a subagent in Wave 4 (R5-CS) T11 (i18n) is independent of code.

- [ ] Add i18n implementations for `toolbarEyedropper.sampleSize.*` and `toolbarEyedropper.sampleFrom.*` in all locale files under `shared/locale/<lang>/dashboard/certificates/templateEditor.json` (Plan 10 owns the type additions — Plan 11 only adds the implementation string values)
- [ ] Verify there are NO duplicate `Round 5` block ids in any design file (this Plan 11 R5-CS section names are unique to Plan 11)
- [ ] Update any existing canvas documentation file that references the previous (pre-eyedropper) canvas interaction model — note that `I` key now picks the eyedropper when not in a text-editing context (see Plan 10 §R5-CS11 keyboard shortcuts)
- [ ] Run per-file quality loop for each new file (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene
  ```
- [ ] **Quality loop**: tsgo + biome + lint queue client

---

### Execution Order (Plan 11 — Round 5)

| Phase | Tasks | Wall-clock estimate |
|---|---|---|
| R5-CS-A: State + Buffer | R5-CS-T1, R5-CS-T3, R5-CS-T4 | 14h |
| R5-CS-B: Interaction Hooks | R5-CS-T2, R5-CS-T9 | 9h |
| R5-CS-C: UI Components | R5-CS-T6, R5-CS-T5, R5-CS-T7, R5-CS-T8 | 22h |
| R5-CS-D: i18n | R5-CS-T11 | 1h |
| **Plan 11 R5 total** | **11 tasks** | **~56h** |

Parallelism within phases: T1, T3, T4 are independent (via parallel subagents), then T2 + T9 on already-built stores, then UI components T5–T8 via parallel subagents.

### R5 Color System Parallel Subagent Strategy

### Wave 1 (R5-CS): R5-CS-T1, R5-CS-T3, R5-CS-T4
- Tasks (via parallel subagents): R5-CS-T1 (color state), R5-CS-T3 (buffer), R5-CS-T4 (sample offset)
- Rationale: All independent state + buffer tasks. Disjoint modules.

### Wave 2 (R5-CS): R5-CS-T2, R5-CS-T9
- Tasks (via parallel subagents): R5-CS-T2 (interaction hooks), R5-CS-T9 (sampler)
- Rationale: Both depend on stores built in Wave 1. T2 and T9 target separate hook modules.

### Wave 3 (R5-CS): R5-CS-T5, R5-CS-T6, R5-CS-T7, R5-CS-T8
- Tasks (via parallel subagents): R5-CS-T6 (EyedropperTool), R5-CS-T5 (ColorPickerPopover), R5-CS-T7 (RecentColors), R5-CS-T8 (ColorSliderPanel)
- Rationale: All UI components depend on hooks from Wave 2. Each targets a separate component file.

### Wave 4 (R5-CS): R5-CS-T11
- Tasks (via parallel subagents): R5-CS-T11 (i18n)
- Rationale: T11 (i18n) is independent of code.

---

## Round 5: Effects & Filter Tasks

> These tasks implement the Plan 11 canvas rendering pipeline for the Round 5 effects engine defined in `design.md` §"Round 5: Effects & Filter Engine" (R5.1–R5.15). The canonical type source (`effectTypes.ts`) is created in Plan 10 FX-T01; Plan 11 imports it. Quality model: per-file progressive verification via `scripts/health/sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene in one command, short-circuiting on first failure), per AGENTS.md.

### Task Map (Plan 11 Effects Rendering)

```
R5FX-T01 (effectsPipeline.ts — orchestrator)
  ├─→ R5FX-T02 (svgFilterStack.ts — dynamic SVG builder)
  │
  ├─→ R5FX-T03 (dropShadowRendering.ts)
  ├─→ R5FX-T04 (innerShadowRendering.ts)
  ├─→ R5FX-T05 (glowRendering.ts — outer + inner)
  ├─→ R5FX-T06 (blurRendering.ts — 6 variants)
  ├─→ R5FX-T07 (colorAdjustRendering.ts — 10 variants)
  ├─→ R5FX-T08 (overlayRendering.ts — 4 overlay types)
  ├─→ R5FX-T09 (stylizeRendering.ts — 12 stylize effects)
  ├─→ R5FX-T10 (blendModeMapping.ts — 46-mode dispatch)
  │
  ├─→ R5FX-T11 (globalLight.ts — angle/altitude system)
  │       └─→ (consumed by R5FX-T03, R5FX-T04, R5FX-T09)
  │
  ├─→ R5FX-T12 (effectCache.ts — LRU cache, 256/element)
  ├─→ R5FX-T13 (useDebouncedEffectRender.ts — 100ms debounce hook)
  ├─→ R5FX-T14 (EffectSvgContainer.tsx — lazy SVG container)
  │
  ├─→ R5FX-T15 (canvasStore.ts modifications + EffectElementWrapper.tsx)
  │       └─→ depends on R5FX-T01..T14 all complete
  │
  └─→ R5FX-T16 (knowledge propagation)
          └─→ depends on R5FX-T15
```

**Execution order**:
- Phase A (sequential): R5FX-T01
- Phase B (via parallel subagents): R5FX-T02, R5FX-T03, R5FX-T04, R5FX-T05, R5FX-T06, R5FX-T07, R5FX-T08, R5FX-T09, R5FX-T10, R5FX-T11
- Phase C (via parallel subagents): R5FX-T12, R5FX-T13, R5FX-T14
- Phase D (sequential): R5FX-T15 (depends on all above)
- Phase E (sequential): R5FX-T16 (depends on T15)

**Estimated effort**: ~38 hours (parallelizable to ~18 wall-clock hours via Phase B parallel subagents)

### R5FX Effects Parallel Subagent Strategy

### Wave 1 (R5FX): R5FX-T01
- Tasks: R5FX-T01 (Effects Pipeline Orchestrator)
- Rationale: Foundation — all other R5FX tasks depend on the pipeline orchestrator.

### Wave 2 (R5FX): R5FX-T02 through R5FX-T11
- Tasks (via parallel subagents): R5FX-T02 (SVG Filter Stack Builder), R5FX-T03 (Drop Shadow), R5FX-T04 (Inner Shadow), R5FX-T05 (Outer Glow), R5FX-T06 (Inner Glow), R5FX-T07 (Blur), R5FX-T08 (Color Overlay), R5FX-T09 (Gradient Overlay), R5FX-T10 (Satin/Pattern), R5FX-T11 (Stroke Overlay)
- Rationale: All 10 effect renderers depend on R5FX-T01. Each targets a separate effect renderer module.

### Wave 3 (R5FX): R5FX-T12, R5FX-T13, R5FX-T14
- Tasks (via parallel subagents): R5FX-T12 (Effect Panel DSL), R5FX-T13 (Effect Layer List), R5FX-T14 (SVG Filter Container)
- Rationale: All depend on Phase B effect renderers being complete. Each targets a separate UI component.

### Wave 4 (R5FX): R5FX-T15
- Tasks: R5FX-T15 (Canvas Store Modifications + Effect Element Wrapper)
- Rationale: Sequential — depends on all Phase B and C components.

### Final Wave (R5FX): R5FX-T16
- Task: R5FX-T16 (Integration Tests + Knowledge Propagation)
- Rationale: Must run after all R5FX implementation is complete.

---

### R5FX-T01: Effects Pipeline Orchestrator

- [ ] Create `frontend/views/dashboard/cert/templates/editor/effectRendering/effectsPipeline.ts`
  - Export `renderEffectsToStyles(element: CanvasElement, opts: RenderOpts): ComposedEffects`
  - Iterate `element.effects[]` top-to-bottom; dispatch each `EffectLayer` to its category renderer
  - Return `{ cssFilter: string, svgFilterId: string | null, mixBlendMode: BlendMode46 | null, overlayStyles: CSSProperties[], isolation: boolean }`
  - CSS-native effects produce `cssFilter` string (e.g., `drop-shadow(4px 4px 8px rgba(0,0,0,0.5)) blur(2px)`)
  - Advanced effects produce `svgFilterId` referencing an injected `<filter id="...">`
  - If both CSS and SVG are needed, compose: CSS filter applied via `style.filter`, SVG via `style.filter: url(#id)` merged
  - Merge multiple CSS filters into one space-delimited string
  - If any effect has `blendMode !== 'normal'`, set `mixBlendMode` on the element
  - If any overlay effect is present, return `overlayStyles` array (pseudo-element CSS)
  - If any effect uses non-normal blend mode or isolation, set `isolation: true`
  - Import types from `@/frontend/common/stores/cert/effectTypes.ts`
  - Import per-category renderers from sibling files (dropShadowRendering, glowRendering, blurRendering, colorAdjustRendering, overlayRendering, stylizeRendering, innerShadowRendering)
  - Import `blendModeMapping` from `./blendModeMapping`
  - Import `globalLight` from `./globalLight`
  - **Quality loop**: tsgo + biome + lint queue client
  - Per-file verify: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/effectRendering/effectsPipeline.ts --lifecycle codescene`

---

### R5FX-T02: SVG Filter Stack Builder

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5FX) alongside R5FX-T03 through R5FX-T11. All 10 effect renderers depend on R5FX-T01. Each targets a separate effect renderer module.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/effectRendering/svgFilterStack.ts`
  - Export `buildSvgFilterStack(effects: EffectLayer[], idPrefix: string): SvgFilterDefinition | null`
  - Return `null` if no effects need SVG (all CSS-native)
  - Generate `<filter id="${idPrefix}-fx" x="-20%" y="-20%" width="140%" height="140%">` wrapper
  - Compose filter primitives in render order: `<feGaussianBlur>`, `<feDropShadow>`, `<feColorMatrix>`, `<feComponentTransfer>`, `<feConvolveMatrix>`, `<feMerge>`, `<feFlood>`, `<feComposite>`, `<feOffset>`, `<feBlend>`
  - Each primitive gets `in` and `result` attributes for chaining
  - Multiple shadow layers → `<feMerge>` with `<feMergeNode>` per shadow
  - Color matrix for sepia/invert/grayscale/hue-rotate/saturation
  - Component transfer for levels/curves (gamma, table, discrete)
  - Convolve matrix for emboss/edge detection
  - Export `SvgFilterDefinition` type: `{ id: string, markup: string }`
  - **Quality loop**: tsgo + biome + lint queue client

---

### R5FX-T03: Drop Shadow Renderer

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5FX) alongside R5FX-T02, R5FX-T04 through R5FX-T11. All 10 effect renderers depend on R5FX-T01. Each targets a separate effect renderer module.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/effectRendering/dropShadowRendering.ts`
  - Export `renderDropShadow(effect: DropShadowParams, globalLight: GlobalLightConfig): { css: string | null, svg: string | null }`
  - If `effect.useGlobalLight` is true, use `globalLight.angle` instead of `effect.angle`
  - Compute `offsetX = distance * cos(angle)`, `offsetY = distance * sin(angle)`
  - CSS: `drop-shadow(${offsetX}px ${offsetY}px ${blur}px rgba(${r},${g},${b},${opacity}))` — via `filter: drop-shadow()`
  - Also produce `box-shadow` fallback for non-text elements: `${offsetX}px ${offsetY}px ${blur}px ${spread}px rgba(...)` — chose drop-shadow for text, box-shadow for shapes
  - Knockout: if `effect.knockout` is true, set `shadow-only` mode via SVG `<feComposite>` operator
  - Layer knocks out shadow: if `effect.layerKnocksOutShadow` is true, compose with `<feComposite>` to clip shadow to element shape
  - SVG: `<feDropShadow dx=${offsetX} dy=${offsetY} stdDeviation=${blur/2} flood-color="${color}" flood-opacity="${opacity}"/>` for advanced cases (multiple shadows, knockout)
  - Return `css` for simple single-shadow; `svg` for knockout/multiple
  - Import `DropShadowParams`, `GlobalLightConfig` from `@/frontend/common/stores/cert/effectTypes.ts`
  - **Quality loop**: tsgo + biome + lint queue client
  - Per-file verify: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/effectRendering/dropShadowRendering.ts --lifecycle codescene`

---

### R5FX-T04: Inner Shadow Renderer

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5FX) alongside R5FX-T02, R5FX-T03, R5FX-T05 through R5FX-T11. All 10 effect renderers depend on R5FX-T01. Each targets a separate effect renderer module.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/effectRendering/innerShadowRendering.ts`
  - Export `renderInnerShadow(effect: InnerShadowParams, globalLight: GlobalLightConfig): { css: string | null, svg: string | null }`
  - CSS: `inset ${offsetX}px ${offsetY}px ${blur}px ${choke}px rgba(...)` — via `box-shadow: inset` for shapes
  - For text elements: CSS `box-shadow: inset` doesn't work on text; use SVG `<feComposite>` with `arith` operator to subtract shadow from source
  - SVG: `<feComposite operator="in" .../>` to clip shadow to element interior; `<feOffset>` for direction; `<feGaussianBlur>` for blur
  - Choke: maps to spread — increases the solid portion before blur
  - If `effect.useGlobalLight` is true, use `globalLight.angle`
  - Import `InnerShadowParams` from `@/frontend/common/stores/cert/effectTypes.ts`
  - **Quality loop**: tsgo + biome + lint queue client

---

### R5FX-T05: Glow Renderer (Outer + Inner)

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5FX) alongside R5FX-T02 through R5FX-T04, R5FX-T06 through R5FX-T11. All 10 effect renderers depend on R5FX-T01. Each targets a separate effect renderer module.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/effectRendering/glowRendering.ts`
  - Export `renderOuterGlow(effect: OuterGlowParams): { css: string | null, svg: string | null }`
  - Export `renderInnerGlow(effect: InnerGlowParams): { css: string | null, svg: string | null }`
  - Outer glow CSS: `drop-shadow(0 0 ${blur}px ${color})` — multiple stacked for spread
  - Outer glow SVG: `<feMorphology operator="dilate" radius="spread"/>` then `<feGaussianBlur stdDeviation="blur"/>` then `<feMerge>` with source
  - Inner glow CSS: `box-shadow: inset 0 0 ${blur}px ${color}` for shapes; SVG for text
  - `effect.source === 'center'`: glow originates from center → `<feGaussianBlur>` on alpha + `<feComposite operator="in">` with source
  - `effect.source === 'edge'`: glow from edges → `<feMorphology operator="erode" radius="0">` + blur + composite
  - `effect.technique === 'precise'`: use higher `stdDeviation` precision; `softer` → lower
  - `effect.blendMode`: applied via `<feBlend mode="...">` in SVG or `mix-blend-mode` in CSS
  - Import `OuterGlowParams`, `InnerGlowParams` from `@/frontend/common/stores/cert/effectTypes.ts`
  - **Quality loop**: tsgo + biome + lint queue client

---

### R5FX-T06: Blur Renderer (6 Variants)

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5FX) alongside R5FX-T02 through R5FX-T05, R5FX-T07 through R5FX-T11. All 10 effect renderers depend on R5FX-T01. Each targets a separate effect renderer module.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/effectRendering/blurRendering.ts`
  - Export `renderBlur(effect: BlurEffectParams): { css: string | null, svg: string | null }`
  - Discriminate on `effect.kind`:
    - `gaussian`: CSS `blur(${radius}px)` — native CSS
    - `motion`: SVG-only — `<feConvolveMatrix>` with angled kernel or `<feGaussianBlur>` + `<feOffset>` for directional blur; CSS not supported
    - `radial`: SVG-only — `<feGaussianBlur>` + `<feRadialGradient>` mask or `<feDisplacementMap>` approximation; `mode: 'spin'|'zoom'`; quality maps to `stdDeviation` precision
    - `smart`: SVG-only — `<feGaussianBlur>` + `<feComponentTransfer>` to preserve edges above `threshold`
    - `lensBlur`: SVG-only — multiple `<feGaussianBlur>` at different `stdDeviation` merged via `<feMerge>` to approximate bokeh
    - `tiltShift`: SVG-only — `<feGaussianBlur>` + `<feComponentTransfer>` mask at focus-area boundary
  - Gaussian returns CSS; all others return SVG only
  - Return both `{ css, svg }` — caller merges as needed
  - Import `BlurEffectParams` from `@/frontend/common/stores/cert/effectTypes.ts`
  - **Quality loop**: tsgo + biome + lint queue client
  - Per-file verify: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/effectRendering/blurRendering.ts --lifecycle codescene`

---

### R5FX-T07: Color Adjustment Renderer (10 Variants)

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5FX) alongside R5FX-T02 through R5FX-T06, R5FX-T08 through R5FX-T11. All 10 effect renderers depend on R5FX-T01. Each targets a separate effect renderer module.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/effectRendering/colorAdjustRendering.ts`
  - Export `renderColorAdjust(effect: ColorAdjustParams): { css: string | null, svg: string | null }`
  - Discriminate on `effect.kind`:
    - `brightnessContrast`: CSS `brightness(${1 + brightness/100}) contrast(${1 + contrast/100})`
    - `hueSaturation`: CSS `hue-rotate(${hue}deg) saturate(${1 + saturation/100}) brightness(${1 + lightness/100})`
    - `colorBalance`: SVG `<feColorMatrix>` — custom 4×5 matrix per shadows/midtones/highlights range
    - `levels`: SVG `<feComponentTransfer>` with `<feFuncR type="table">` for input black/white, `<feFuncG type="gamma">` for gamma
    - `curves`: SVG `<feComponentTransfer type="table">` with interpolated curve points per channel (R/G/B)
    - `invert`: CSS `invert(1)`
    - `grayscale`: CSS `grayscale(1)`
    - `sepia`: CSS `sepia(1)`
    - `vibrance`: SVG `<feColorMatrix type="saturate">` with adaptive saturation (less saturated colors boosted more)
    - `photoFilter`: SVG `<feFlood>` + `<feComposite operator="in">` + `<feBlend mode="color">` with density
  - Return CSS for brightnessContrast, hueSaturation, invert, grayscale, sepia; SVG for colorBalance, levels, curves, vibrance, photoFilter
  - Import `ColorAdjustParams` from `@/frontend/common/stores/cert/effectTypes.ts`
  - **Quality loop**: tsgo + biome + lint queue client

---

### R5FX-T08: Overlay Renderer (4 Types)

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5FX) alongside R5FX-T02 through R5FX-T07, R5FX-T09 through R5FX-T11. All 10 effect renderers depend on R5FX-T01. Each targets a separate effect renderer module.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/effectRendering/overlayRendering.ts`
  - Export `renderOverlay(effect: OverlayParams): { overlayStyle: CSSProperties, isolation: boolean }`
  - Discriminate on `effect.kind`:
    - `colorOverlay`: Return pseudo-element style: `{ content: '""', position: 'absolute', inset: 0, background: effect.color, opacity: effect.opacity / 100, mixBlendMode: effect.blendMode }`
    - `gradientOverlay`: Return pseudo-element with `background: buildGradientCss(effect.gradient)`, `opacity`, `mixBlendMode`, `background-size: ${effect.scale}%`
    - `patternOverlay`: Return pseudo-element with `background-image: url(${effect.patternUrl})`, `background-repeat`, `background-size: ${effect.scale}%`, `opacity`, `mixBlendMode`
    - `satin`: Return pseudo-element with `background: effect.color`, `transform: rotate(${effect.angle}deg)`, `mask` for satin shape, `opacity`, `mixBlendMode: 'overlay'` (default), `invert` toggle
  - All overlays render as `::after` pseudo-element on the element wrapper; caller injects via `overlayStyles[]`
  - Import `OverlayParams` from `@/frontend/common/stores/cert/effectTypes.ts`
  - **Quality loop**: tsgo + biome + lint queue client

---

### R5FX-T09: Stylize Renderer (12 Variants)

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5FX) alongside R5FX-T02 through R5FX-T08, R5FX-T10, R5FX-T11. All 10 effect renderers depend on R5FX-T01. Each targets a separate effect renderer module.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/effectRendering/stylizeRendering.ts`
  - Export `renderStylize(effect: StylizeParams, globalLight: GlobalLightConfig): { svg: string | null, overlayStyle: CSSProperties | null }`
  - All stylize effects are SVG-only (no CSS equivalent):
    - `emboss`: `<feConvolveMatrix>` with 3×3 emboss kernel angled by `effect.angle`; `height` maps to `bias`; `amount` to kernel multiplier
    - `bevelEmboss`: Multi-step SVG: `<feConvolveMatrix>` for bevel + `<feSpecularLighting>` for highlight/shadow; `style: 'outer'|'inner'|'emboss'|'pillow'`; `technique: 'smooth'|'chisel-hard'|'chisel-soft'` maps to kernel sharpness; `depth`, `direction: 'up'|'down'`, `size`, `soften`; shadow/highlight mode colors/opacity/angle/altitude; contour curve → `<feComponentTransfer>` table
    - `pillowEmboss`: Sub-category of bevelEmboss with `style: 'pillow'`
    - `outline`: `<feMorphology operator="dilate" radius="width/2"/>` + `<feFlood>` + `<feComposite>` for fill; `position: 'inside'|'outside'|'center'`
    - `noise`: `<feTurbulence type="fractalNoise" baseFrequency="..." numOctaves="1"/>` + `<feColorMatrix type="matrix">` for monochromatic; `distribution: 'uniform'|'gaussian'` → type attr
    - `mosaic`: `<feImage>` + `<feTile>` with tile size = `effect.tileSize`; rendered as a uniform grid
    - `pixelate`: `<feImage>` scaled down then scaled back up via `<feGaussianBlur>` + `<feComponentTransfer type="discrete">` with cell-size steps
    - `oilPainting`: `<feConvolveMatrix>` with kernel based on `brushScale` + `stylization` + `cleanliness`; approximate via multiple passes
    - `cutout`: `<feComponentTransfer type="discrete">` with `levels` buckets + edge simplicity
    - `dryBrush`: `<feConvolveMatrix>` with `brushSize` kernel + `<feColorMatrix>` for detail
    - `filmGrain`: `<feTurbulence>` + `<feBlend mode="overlay">` with `grainAmount`/`highlightArea`/`intensity`
    - `watercolor`: `<feConvolveMatrix>` + `<feColorMatrix>` for darkness/texture/detail
  - If `effect.useGlobalLight` is true on bevelEmboss or emboss, use `globalLight.angle` and `globalLight.altitude`
  - Import `StylizeParams`, `GlobalLightConfig` from `@/frontend/common/stores/cert/effectTypes.ts`
  - **Quality loop**: tsgo + biome + lint queue client
  - Per-file verify: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/effectRendering/stylizeRendering.ts --lifecycle codescene`

---

### R5FX-T10: Blend Mode Mapping (46 Modes)

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5FX) alongside R5FX-T02 through R5FX-T09, R5FX-T11. All 10 effect renderers depend on R5FX-T01. Each targets a separate effect renderer module.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/effectRendering/blendModeMapping.ts`
  - Export `mapBlendModeToCss(mode: BlendMode46): string | null`
  - Export `mapBlendModeToSVG(mode: BlendMode46): string | null`
  - Export `isIsolationRequired(mode: BlendMode46): boolean`
  - Full 46-mode dispatch table:
    - **Normal group**: `normal` → css `normal`; `dissolve` → null (SVG only, not standard)
    - **Darken group**: `darken` → `darken`; `multiply` → `multiply`; `color-burn` → `color-burn`; `linear-burn` → null (SVG: `linear-burn`); `darker-color` → null (SVG)
    - **Lighten group**: `lighten` → `lighten`; `screen` → `screen`; `color-dodge` → `color-dodge`; `linear-dodge` → null (SVG); `lighter-color` → null (SVG)
    - **Contrast group**: `overlay` → `overlay`; `soft-light` → `soft-light`; `hard-light` → `hard-light`; `vivid-light` → null (SVG); `linear-light` → null (SVG); `pin-light` → null (SVG); `hard-mix` → null (SVG)
    - **Inversion group**: `difference` → `difference`; `exclusion` → `exclusion`; `subtract` → null (SVG); `divide` → null (SVG)
    - **Component group**: `hue` → `hue`; `saturation` → `saturation`; `color` → `color`; `luminosity` → `luminosity`
  - `isIsolationRequired` returns `true` for all non-normal modes
  - For modes without CSS equivalent, return `null` from `mapBlendModeToCss` — pipeline must fall back to SVG `<feBlend>` or pixel emulation
  - Import `BlendMode46` from `@/frontend/common/stores/cert/effectTypes.ts`
  - **Quality loop**: tsgo + biome + lint queue client

---

### R5FX-T11: Global Light System

> **Parallelizable**: This task runs as a subagent in Wave 2 (R5FX) alongside R5FX-T02 through R5FX-T10. All 10 effect renderers depend on R5FX-T01. Each targets a separate effect renderer module.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/effectRendering/globalLight.ts`
  - Export `getGlobalLight(): GlobalLightConfig` — reads from `canvasStore.getState().globalLight`
  - Export `setGlobalLight(config: Partial<GlobalLightConfig>): void` — dispatches `canvasStore.getState().setGlobalLight(config)`
  - Export `resolveShadowAngle(effect: { useGlobalLight: boolean; angle: number }): number` — returns global angle if `useGlobalLight` is true, else `effect.angle`
  - Export `resolveBevelAltitude(effect: { useGlobalLight: boolean; altitude: number }): number` — same for altitude
  - Default: `{ angle: 30, altitude: 30 }`
  - Import `GlobalLightConfig` from `@/frontend/common/stores/cert/effectTypes.ts`
  - Import `canvasStore` from `@/frontend/common/stores/cert/canvasStore`
  - **Quality loop**: tsgo + biome + lint queue client

---

### R5FX-T12: Effect Cache (LRU)

> **Parallelizable**: This task runs as a subagent in Wave 3 (R5FX) alongside R5FX-T13, R5FX-T14. All depend on Phase B effect renderers being complete. Each targets a separate UI/utility component.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/effectRendering/effectCache.ts`
  - Export `createEffectCache(maxSize: number): EffectCache`
  - `EffectCache` interface: `get(key: string): ComposedEffects | null; set(key: string, value: ComposedEffects): void; clear(): void; size(): number`
  - Key: `JSON.stringify({ effectId, params })` — stable serialized params
  - LRU eviction: on `set`, if `size() >= maxSize`, evict oldest entry
  - Default `maxSize = 256` (per element — each element gets its own cache instance)
  - `clear()` called when element is destroyed or effects array changes structurally (add/remove)
  - Invalidation: caller compares stored key against current params; if mismatch, recompute and `set`
  - **Quality loop**: tsgo + biome + lint queue client
  - Per-file verify: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/effectRendering/effectCache.ts --lifecycle codescene`

---

### R5FX-T13: Debounced Effect Render Hook

> **Parallelizable**: This task runs as a subagent in Wave 3 (R5FX) alongside R5FX-T12, R5FX-T14. All depend on Phase B effect renderers being complete. Each targets a separate UI/utility component.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/effectRendering/useDebouncedEffectRender.ts`
  - Export `useDebouncedEffectRender(element: CanvasElement, delay?: number): { composed: ComposedEffects | null; isStale: boolean }`
  - Default `delay = 100` ms
  - On parameter change during slider drag: return last committed `composed` immediately; schedule recompute after `delay` ms
  - `isStale` is `true` during debounce window (allows UI to show a "rendering…" hint)
  - On mouseup/pointerup event: flush immediately (return fresh `composed`)
  - Use `useRef` for timer; `useMemo` for stable identity of `composed`
  - Uses `effectCache` (R5FX-T12) to skip recompute if params unchanged
  - Import `CanvasElement` from `@/frontend/common/stores/cert/canvasStore`
  - Import `ComposedEffects` from `./effectsPipeline`
  - Import `createEffectCache` from `./effectCache`
  - **Quality loop**: tsgo + biome + lint queue client

---

### R5FX-T14: SVG Filter Container Component

> **Parallelizable**: This task runs as a subagent in Wave 3 (R5FX) alongside R5FX-T12, R5FX-T13. All depend on Phase B effect renderers being complete. Each targets a separate UI/utility component.

- [ ] Create `frontend/views/dashboard/cert/templates/editor/effectRendering/EffectSvgContainer.tsx`
  - Lazy-mounted hidden SVG container that houses `<filter>` definitions
  - Only mounts when at least one element has an effect requiring SVG
  - Renders `<svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden>`
  - Contains `<defs>` with `<filter id="el-${elementId}-fx" ...>` for each element needing SVG
  - Filter markup comes from `svgFilterStack.buildSvgFilterStack()`
  - Uses `useStore` selector to subscribe to elements with SVG-requiring effects
  - `React.memo` — only re-renders when SVG filter definitions change
  - **Performance**: If no SVG effects exist, render `null` (no DOM overhead)
  - Import `svgFilterStack` from `./svgFilterStack`
  - Import `canvasStore` from `@/frontend/common/stores/cert/canvasStore`
  - Import `useAppTranslation(Translation.Dashboard.CertificateTemplateEditor)` from `@/shared/locale/client` (for aria-label)
  - MUI v9: `sx={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}` — NOT style prop
  - **Quality loop**: tsgo + biome + lint queue client
  - Per-file verify: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/effectRendering/EffectSvgContainer.tsx --lifecycle codescene`

---

### R5FX-T15: Canvas Store Modifications + Effect Element Wrapper

- [ ] Modify `frontend/common/stores/cert/canvasStore.ts`
  - Add `effects: EffectLayer[]` field to each `CanvasElement` (default: `[]`)
  - Add `globalLight: GlobalLightConfig` field to `CanvasState` (default: `{ angle: 30, altitude: 30 }`)
  - Add actions:
    - `addEffect(elementId: string, effect: EffectLayer): void` — appends to `element.effects[]`
    - `removeEffect(elementId: string, effectId: string): void` — filters out by id
    - `updateEffect(elementId: string, effectId: string, params: Partial<EffectParams>): void` — merge params
    - `reorderEffects(elementId: string, fromIndex: number, toIndex: number): void` — array reorder
    - `toggleEffectVisibility(elementId: string, effectId: string): void` — flip `visible` flag
    - `duplicateEffect(elementId: string, effectId: string): void` — deep clone with new id
    - `applyPresetToSelected(presetFactory: (theme: Theme) => EffectLayer[]): void` — apply preset effects to selected element
    - `setGlobalLight(config: Partial<GlobalLightConfig>): void` — merge global light config
    - `flattenEffects(elementId: string): void` — remove `effects[]` from element (destructive; caller bakes into content first)
  - Backward-compat: derive `boxShadow`/`textShadow` from `effects[]` if they exist; keep R4-10 `ShadowConfig` as computed property
  - Backward-compat: `blendMode` (R4-9) becomes `BlendMode46` type; 16-mode values are subset
  - Import `EffectLayer`, `EffectParams`, `GlobalLightConfig`, `BlendMode46` from `@/frontend/common/stores/cert/effectTypes.ts`
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] Create or modify `frontend/views/dashboard/cert/templates/editor/EffectElementWrapper.tsx`
  - Wraps each rendered element on canvas; injects effect styles
  - Reads `element.effects[]` from `canvasStore`
  - Calls `useDebouncedEffectRender(element)` to get `composed: ComposedEffects`
  - Applies `composed.cssFilter` to `style.filter`
  - Applies `composed.mixBlendMode` to `style.mixBlendMode`
  - If `composed.svgFilterId`, applies `style.filter: url(#${svgFilterId})` (merged with CSS filter if both exist)
  - If `composed.isolation`, applies `style.isolation: 'isolate'`
  - Renders overlay pseudo-elements: if `composed.overlayStyles.length > 0`, renders child `Box` overlays with absolute positioning
  - **Performance**: `React.memo` with comparator on `element.id`, `element.effects`, `element.updatedAt`
  - **Pan/zoom bypass**: subscribe to `interactionState.isPanning` — if true, skip effect rendering (render bare element) for performance
  - Import `useDebouncedEffectRender` from `./effectRendering/useDebouncedEffectRender`
  - Import `canvasStore` from `@/frontend/common/stores/cert/canvasStore`
  - MUI v9: `sx={{ position: 'relative' }}` on overlay wrappers — NOT style props
  - **Quality loop**: tsgo + biome + lint queue client

Per-file: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` for each of the two files.

---

### R5FX-T16: Knowledge Propagation


- [ ] Knowledge propagation — append to `frontend/IMPLEMENTATION_LEARNINGS.md`
  - Document: "CSS filter vs SVG filter decision tree for effects" — when to use CSS (native support, performant) vs SVG (advanced effects, 46-mode blend)
  - Document: "Effect cache invalidation strategy — LRU 256/element, stable JSON key, clear on add/remove"
  - Document: "Debounce pattern: 100ms slider drag, flush on pointerup, isStale indicator"
  - Document: "Pan/zoom bypass: skip effect rendering during canvas pan for performance"
  - Document: "Backward-compat: boxShadow/textShadow derived from effects[], BlendMode → BlendMode46 superset"
  - **Quality loop**: tsgo + biome + lint queue client

Per-file: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` for each file.

---

## Round 5 Effects Rendering — Time Summary

| Phase | Tasks | Est. Hours | Wall-clock |
|-------|-------|------------|------------|
| Phase A (seq) | R5FX-T01 | 3h | 3h |
| Phase B (via parallel subagents) | R5FX-T02..T11 | 20h | 8h |
| Phase C (via parallel subagents) | R5FX-T12..T14 | 6h | 3h |
| Phase D (seq) | R5FX-T15 | 5h | 5h |
| Phase E (seq) | R5FX-T16 | 4h | 4h |
| **Total** | R5FX-T01..T16 | **38h** | **~18h** |

### Plan 11 Combined Total Time (Rounds 1-5, all domains)

- Rounds 1-3: ~30 hours → ~18 wall-clock hours
- Round 4: ~20 hours → ~12 wall-clock hours
- Round 5 Fill/Stroke (R5-T1..T10): ~24 hours → ~10 wall-clock hours
- Round 5 Effects (R5FX-T01..T16): ~38 hours → ~18 wall-clock hours
- **Plan 11 total**: ~112 hours → ~58 wall-clock hours with R5 parallelism.

> All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks (tsgo → biome → lint → codescene). The lint queue server must be running before any lint call. See `AGENTS.md` §"Lint Queue Server" for startup commands.

## Round 5: Keyboard Shortcuts Tasks

- [ ] R5K-T1. Create `useCanvasKeyboard` hook
  - Single keydown/keyup handler for canvas container
  - Routes to tool selection, element manipulation, nudge, delete
  - Blocks propagation when typing in input fields
  - Modifier detection (Ctrl, Shift, Alt)
  - File: `frontend/views/certificate-editor/hooks/useCanvasKeyboard.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5K-T2. Implement modifier key visual feedback on canvas
  - Shift held: angle/proportion indicator near cursor
  - Alt held: "+" duplicate badge near cursor
  - Space held: cursor changes to hand
  - Shift+Alt: both indicators
  - File: `frontend/views/certificate-editor/components/CursorFeedbackOverlay.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5K-T3. Implement drag constrain engine
  - Shift: constrain to 0/45/90/135/180/225/270/315°
  - Alt: flag for duplicate on release
  - Shift+Alt: constrained duplicate
  - Returns adjusted delta vector
  - File: `frontend/views/certificate-editor/utils/constrainDrag.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5K-T4. Implement nudge behavior (arrow keys)
  - Arrow keys: nudge selected elements by 1px
  - Shift+Arrow: nudge by 10px
  - Alt+Arrow: nudge by 0.1px (sub-pixel)
  - Nudge respects grid snapping if enabled
  - File: `frontend/views/certificate-editor/hooks/useNudge.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5K-T5. Implement Tab cycling through elements
  - Tab selects next element (forward in z-order)
  - Shift+Tab selects previous element
  - Skip locked/hidden elements
  - Wrap around at end/beginning
  - File: `frontend/views/certificate-editor/hooks/useTabCycling.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5K-T6. Implement temporary hand tool (Space+drag)
  - Space hold → cursor changes to hand, canvas pans on drag
  - Release Space → restore previous tool
  - Only activates when Space is held (not on key press event alone)
  - File: `frontend/views/certificate-editor/hooks/useTempHandTool.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5K-T7. Implement layer order shortcuts
  - `Ctrl+]` bring forward, `Ctrl+[` send backward
  - `Ctrl+Shift+]` bring to front, `Ctrl+Shift+[` send to back
  - Update element zIndex in layersStore
  - File: `frontend/views/certificate-editor/hooks/useLayerOrderShortcuts.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5K-T8. Test suite for canvas keyboard shortcuts
  - Test tool switching keys (V, T, P, R, E, L)
  - Test nudge with/without Shift
  - Test delete/Backspace removes selection
  - Test Tab cycling order
  - Test modifier feedback overlay renders correctly
  - Test drag constrain angles (0, 45, 90, etc.)
  - Test layer order shortcuts
  - Test Space temporarily activates hand tool
  - _Quality loop_: tsgo + biome + lint queue client

---

## Round 5: Mask & Clipping Tasks

> Round 5 task list for Plan 11 — canvas-layer mask/clipping rendering: clipping mask SVG compositing, layer mask alpha rendering, vector mask path overlay, mask editing mode overlay, Quick Mask channel overlay, clip group compositing, opacity mask rendering, mask thumbnail canvas, Refine Edge preview, and mask brush pointer events. These consume the types from Plan 10 R5 MASK-T01 (`@/frontend/common/stores/cert/maskTypes`) and store actions from MASK-T02. Total R5 mask scope for Plan 11: 12 tasks (~36 hours).

### Task Dependencies Graph (Round 5 — Masking)

```
MASK-T01, T09 (i18n) ───────────────────────────────────────────────────────────┐
MASK-T02 (store additions from Plan 10)                                         │
  │                                                                            │
  ├── MASK-C01 (ClippingMaskRenderer)                                         │
  ├── MASK-C02 (LayerMaskRenderer)                                             │
  ├── MASK-C03 (VectorMaskPathOverlay — depends on PenTool R5 AnchorOverlay)   │
  ├── MASK-C04 (MaskEditingOverlay — depends on C01/C02 for mask rendering)    │
  ├── MASK-C05 (useMaskBrushPointerEvents — depends on C04 buffer contract)    │
  ├── MASK-C06 (QuickMaskOverlay — depends on C05 brush handler)              │
  ├── MASK-C07 (ClipGroupRenderer — depends on C01)                            │
  ├── MASK-C08 (OpacityMaskRenderer — depends on C02)                          │
  ├── MASK-C09 (MaskThumbnailCanvas — depends on C01/C02)                      │
  ├── MASK-C10 (RefineEdgePreviewOverlay — depends on C02)                     │
  └── MASK-C11 (ClippingMaskRelease + ClipIndicator overlays — depends C01)    │
                                                                               │
  MASK-C12 (test suite + knowledge propagation — depends on C01-C11) ◄────────┘
```

**Execution order**: Plan 10 MASK-T01/T02 first → (MASK-C01, MASK-C02 via parallel subagents; MASK-C03 depends on Pen R5) → MASK-C04 (waits C01+C02) → (MASK-C05, MASK-C07, MASK-C09 via parallel subagents) → MASK-C06 (waits C05) → MASK-C08, MASK-C10 via parallel subagents → MASK-C11 → MASK-C12

**Estimated effort**: ~36 hours (~20 wall-clock hours via the parallel subagent phases)

### MASK Parallel Subagent Strategy

### Wave 1 (MASK): MASK-C01, MASK-C02, MASK-C03
- Tasks: MASK-C01 (Clipping Mask Renderer), MASK-C02 (Opacity Mask Renderer), MASK-C03 (Vector Mask — depends on Pen R5)
- Rationale: C01 and C02 run via parallel subagents. C03 depends on Pen R5 (external). All depend on Plan 10 MASK-T01/T02.

### Wave 2 (MASK): MASK-C04
- Tasks: MASK-C04 (Mask Group + Panel)
- Rationale: Sequential — waits on C01 + C02 from Wave 1.

### Wave 3 (MASK): MASK-C05, MASK-C07, MASK-C09
- Tasks (via parallel subagents): MASK-C05 (Mask Inversion), MASK-C07 (ClipGroup), MASK-C09 (Thumbnail)
- Rationale: C05 depends on C01. C07 depends on C01. C09 depends on C01 + C02. All parent deps satisfied by Wave 1/2. Disjoint modules.

### Wave 4 (MASK): MASK-C06
- Tasks: MASK-C06 (Mask Linking)
- Rationale: Sequential — waits on C05 from Wave 3.

### Wave 5 (MASK): MASK-C08, MASK-C10
- Tasks (via parallel subagents): MASK-C08 (Opacity Mask — needs C02), MASK-C10 (Refine Edge — needs C02)
- Rationale: Both depend on C02. Disjoint modules.

### Wave 6 (MASK): MASK-C11
- Tasks: MASK-C11 (Quality Loop)
- Rationale: Sequential — quality loop over all MASK files.

### Final Wave (MASK): MASK-C12
- Task: MASK-C12 (Test Suite + Knowledge Propagation)
- Rationale: Must run after all MASK implementation is complete.

---

### MASK-C01: Clipping Mask Canvas Renderer

**Estimated time**: 3 hours
**Depends on**: Plan 10 MASK-T01 (types), MASK-T02 (store actions — `createClippingMask`/`releaseClippingMask`)
**Requirements**: design.md §R5.1

> **Parallelizable**: This task runs as a subagent in Wave 1 (MASK) alongside MASK-C02. Both depend on Plan 10 MASK-T01/T02 and target separate renderer modules.

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Read applicable instruction files**:
  - `.agents/instructions/frontend.instructions.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/renderers/ClippingMaskRenderer.tsx`:
  - `renderClippingMaskToSvg(clippedElements, baseShape, zoom)` → `{ clipPathId, svgDefs }`
  - Clip strategy by base shape type (see design §R5.1 table):
    - Rectangle → `<clipPath><rect/></clipPath>`
    - Ellipse/Circle → `<clipPath><ellipse/></clipPath>`
    - Polygon/Path → `<clipPath><path d="..."/></clipPath>` using `buildPathD` from Pen R5
    - Text → `textToPath()` font outline extraction → `<clipPath><path/></clipPath>`
    - Image → alpha-channel-based clip
    - Group → offscreen canvas composite alpha → clip
  - Multiple clipped elements: render inside same `<g clip-path="url(#clip-{baseId})">`
  - Non-destructive: clip path is separate SVG element; base shape still rendered below
  - Transform: clip path recomputes on base transform change (`useMemo` keyed on `(baseId, baseShape.transform, baseShape.version)`)
  - All colors from theme palette — never hardcoded
  - **Quality loop**: tsgo + biome + lint queue client
    - Per-file verify: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/editor/renderers/ClippingMaskRenderer.tsx --lifecycle codescene`

### MASK-C02: Layer Mask Canvas Renderer

**Estimated time**: 4 hours
**Depends on**: Plan 10 MASK-T01, MASK-T02
**Requirements**: design.md §R5.2

> **Parallelizable**: This task runs as a subagent in Wave 1 (MASK) alongside MASK-C01. Both depend on Plan 10 MASK-T01/T02 and target separate renderer modules.

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/renderers/LayerMaskRenderer.tsx`:
  - `renderLayerMaskToSvg(elementId, mask, elementBounds)` → `{ maskId, svgDefs, styleProps }`
  - Pixel mask: SVG `<mask>` with `<image href={dataUri} />` — `mask-type="luminance"`, density scales alpha
  - Vector mask: SVG `<clipPath>` with path data (same as clipping mask)
  - Both (pixel + vector): nested `<g>` — outer clip (vector), inner mask (pixel)
  - Mask properties applied as SVG filters (see design §R5.2 table):
    - `density` → alpha scaling
    - `feather` → `<feGaussianBlur>`
    - `contrast` → `<feComponentTransfer>` linear
    - `smooth` → `<feMorphology>` open/close
    - `shiftEdge` → `<feMorphology>` dilate/erode
    - `inverted` → `<feComponentTransfer>` table swap
  - Link behavior: `linked === true` → mask coordinates follow element transform; `linked === false` → mask in original space
  - `useMemo` keyed on `(elementId, mask.version)` to avoid recomputation on every render
  - **Quality loop**: tsgo + biome + lint queue client

### MASK-C03: Vector Mask Path Overlay

**Estimated time**: 3 hours
**Depends on**: Pen Tool R5 `AnchorOverlay` component, Plan 10 MASK-T01
**Requirements**: design.md §R5.3

> **Parallelizable**: This task runs as a subagent in Wave 1 (MASK) alongside MASK-C01 and MASK-C02. Depends on Pen R5 AnchorOverlay (external dependency).

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/overlays/VectorMaskPathOverlay.tsx`:
  - `VectorMaskPathOverlayProps: { elementId, vectorPath: PathData, zoom, isActive }`
  - Renders path as `<path fill="none" stroke={theme.palette.divider} strokeWidth={1/zoom} />` (screen-space 1px)
  - Reuses `AnchorOverlay` from Pen R5 for anchor points — passes mask's path data
  - When `isActive`: anchor handles editable — Pen/Path Selection/Direct Selection tools modify mask path
  - Path edit actions target `vectorMask.vectorPath` (not a path element) — store action `setMaskProperty(elementId, { vectorPath: updatedPath })`
  - `activeMaskTarget.targetPath === 'vectorMask'` disambiguates from layer mask or opacity mask
  - **Quality loop**: tsgo + biome + lint queue client

### MASK-C04: Mask Editing Mode Overlay

**Estimated time**: 4 hours
**Depends on**: MASK-C01, MASK-C02 (renderers needed for base rendering)
**Requirements**: design.md §R5.4

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/overlays/MaskEditingOverlay.tsx`:
  - `MaskEditingOverlayProps: { elementId, mask, elementBounds, zoom, viewMode }`
  - View mode rendering (see design §R5.4 table):
    - `normal`: element visible with mask + dimmed overlay outside mask area (30% `theme.palette.background.default`)
    - `maskOnly`: pure black/white mask display — element hidden
    - `overlay`: red (`theme.palette.error.main`) overlay on masked areas
    - `onBlack`: element with mask on `theme.palette.common.black` background
    - `onWhite`: element with mask on `theme.palette.common.white` background
    - `onLayers`: element with mask, all layers visible (default working view)
  - Red mask boundary outline (`theme.palette.error.main`, `opacity: 0.5`) in `normal` mode
  - Exit mask mode: `setMaskMode('none')`, `setActiveMaskTarget(null)`, restore previous `activeTool` (store previous on enter)
  - **Quality loop**: tsgo + biome + lint queue client

### MASK-C05: Mask Brush Pointer Events Handler

**Estimated time**: 4 hours
**Depends on**: MASK-C04 (buffer contract), Plan 10 MASK-T02 (`commitMaskStroke` action)
**Requirements**: design.md §R5.5

> **Parallelizable**: This task runs as a subagent in Wave 3 (MASK) alongside MASK-C07 and MASK-C09. All parent dependencies (C01, C02, C04) are satisfied by Waves 1–2.

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/handlers/useMaskBrushPointerEvents.ts`:
  - `useMaskBrushPointerEvents(opts)` → `{ onPointerDown, onPointerMove, onPointerUp }`
  - Opts: `elementId`, `maskBuffer: RefObject<OffscreenCanvas | null>`, `brushSize`, `brushHardness`, `brushOpacity`, `brushFlow`, `foregroundColor` (grayscale: 'white'|'black'|'gray'), `zoom`, `tool`
  - Brush stroke algorithm (see design §R5.5):
    - `pointerDown`: capture pointer, get 2D context from `maskBuffer.current`
    - `pointerMove`: draw to buffer via `requestAnimationFrame` throttle
      - `brushMask`: soft round — `ctx.lineCap='round'`, `shadowBlur = size * (1 - hardness/100) / 2`
      - `pencilMask`: hard edge — `ctx.imageSmoothingEnabled = false`, no `shadowBlur`
      - `gradientMask`: on pointerUp, draw linear gradient from start to end point
      - `eraserMask`: `ctx.globalCompositeOperation = 'destination-out'` (reveals — sets white)
    - `pointerUp`: convert `OffscreenCanvas` to `dataUri`, call `commitMaskStroke(elementId, dataUri)`
  - Pressure sensitivity: if `e.pointerType === 'pen'` and `e.pressure > 0`, scale `brushOpacity *= e.pressure`
  - Buffer is a `useRef<OffscreenCanvas | null>` — NEVER in Zustand store
  - **Quality loop**: tsgo + biome + lint queue client

### MASK-C06: Quick Mask Channel Overlay

**Estimated time**: 3 hours
**Depends on**: MASK-C05 (brush handler reused for quick mask painting), Plan 10 MASK-T02 (`convertQuickMaskToSelection`)
**Requirements**: design.md §R5.6

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/overlays/QuickMaskOverlay.tsx`:
  - `QuickMaskOverlayProps: { quickMaskBuffer: RefObject<OffscreenCanvas | null>, options: QuickMaskOptions, zoom }`
  - Overlay rendering:
    - `mode === 'maskedAreas'`: painted areas overlaid with `options.color` at `options.opacity`% (default red 50%)
    - `mode === 'selectedAreas'`: unpainted areas overlaid with `options.color` at `options.opacity`%
  - Display layer: `pointer-events: none` (doesn't intercept canvas)
  - Interaction layer: transparent, `pointer-events: auto` — routes brush events to the quick mask buffer
  - On `Q` key exit → `convertQuickMaskToSelection()`: read buffer, non-zero pixels → `SelectionPath`; clear buffer
  - Uses `theme.palette` for any UI chrome — never hardcoded colors (mask color is user-configurable)
  - **Quality loop**: tsgo + biome + lint queue client

### MASK-C07: Clip Group Renderer

**Estimated time**: 2 hours
**Depends on**: MASK-C01 (clipping mask renderer)
**Requirements**: design.md §R5.7

> **Parallelizable**: This task runs as a subagent in Wave 3 (MASK) alongside MASK-C05 and MASK-C09. All parent dependencies (C01) are satisfied by Wave 1.

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/renderers/ClipGroupRenderer.tsx`:
  - `ClipGroupRendererProps: { baseElementId, clippedElements, baseShape, zoom }`
  - All clipped elements sorted by layer order (topmost first = last in DOM)
  - Wrapped in `<g clip-path="url(#clip-{baseId})">`
  - Base shape rendered first (below clipped elements) so its fill defines visible area
  - Double-click base shape → `baseShapeEditActive = true` → base enters path edit mode (Pen R5)
  - Clipped elements dimmed (30% opacity) during base shape editing
  - **Quality loop**: tsgo + biome + lint queue client

### MASK-C08: Opacity Mask Renderer

**Estimated time**: 3 hours
**Depends on**: MASK-C02 (layer mask renderer — reuse SVG `<mask>` pattern)
**Requirements**: design.md §R5.8

> **Parallelizable**: This task runs as a subagent in Wave 5 (MASK) alongside MASK-C10. Both depend on MASK-C02 (satisfied by Wave 1) and MASK-C05 (satisfied by Wave 3).

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/renderers/OpacityMaskRenderer.tsx`:
  - `renderOpacityMaskToSvg(elementId, opacityMask, elementBounds)` → `{ maskId, svgDefs }`
  - SVG `<mask mask-type="luminance">`:
    - Grayscale image: `<image href={dataUri} />`
    - Gradient: `<rect fill="url(#grad-{maskId})" />` — white (opaque) to black (transparent)
    - Shape: `<path fill="white" />` on `<rect fill="black" />`
  - `clip === true`: `<mask>` clipped to element bounds
  - `inverted === true`: `feComponentTransfer` table swap
  - Independent transform: `<mask transform={opacityMask.transform} />` — separate from element transform
  - **Quality loop**: tsgo + biome + lint queue client

### MASK-C09: Mask Thumbnail Canvas

**Estimated time**: 2 hours
**Depends on**: MASK-C01, MASK-C02 (uses same rendering logic at 32×32)
**Requirements**: design.md §R5.9

> **Parallelizable**: This task runs as a subagent in Wave 3 (MASK) alongside MASK-C05 and MASK-C07. All parent dependencies (C01, C02) are satisfied by Wave 1.

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/renderers/MaskThumbnailCanvas.tsx`:
  - `MaskThumbnailCanvasProps: { mask, elementBounds, size?: 32 }`
  - Pixel mask: `<canvas>` 32×32, draw `mask.pixelData.dataUri` scaled + `ctx.filter = 'grayscale(100%)'`
  - Vector mask: `<svg>` 32×32 viewBox, path filled white on black background
  - Disabled indicator: if `mask.enabled === false` → red X overlay (`theme.palette.error.main`) via CSS/`::after`
  - `React.memo` with custom comparison — re-render only on `mask.version` or `mask.enabled` change
  - **Quality loop**: tsgo + biome + lint queue client

### MASK-C10: Refine Edge Preview Overlay

**Estimated time**: 3 hours
**Depends on**: MASK-C02 (layer mask renderer with filter chain)
**Requirements**: design.md §R5.10

> **Parallelizable**: This task runs as a subagent in Wave 5 (MASK) alongside MASK-C08. Both depend on MASK-C02 (satisfied by Wave 1) and MASK-C05 (satisfied by Wave 3).

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/overlays/RefineEdgePreviewOverlay.tsx`:
  - `RefineEdgePreviewOverlayProps: { elementId, baseMask, refineSettings, viewMode, zoom }`
  - Takes base mask + applies `refineSettings` (smooth, feather, contrast, shiftEdge, decontaminate) as temporary SVG filters
  - Non-destructive — modifies rendered appearance, not stored mask data until Apply
  - Decontaminate: `OffscreenCanvas` samples edge pixels, replaces color bleed toward nearest interior color
  - Live update: reads `refineSettings` from store — debounce 100ms on slider change
  - Marching Ants view: dashed `<path>` with CSS `@keyframes` animating `stroke-dashoffset` — classic effect
  - Uses separate `<svg>` overlay to avoid re-rendering main canvas tree
  - **Quality loop**: tsgo + biome + lint queue client

### MASK-C11: Clipping Mask Release + Clip Indicator Overlays

**Estimated time**: 2 hours
**Depends on**: MASK-C01
**Requirements**: design.md §R5.11

- [ ] **Read applicable AGENTS.md**:
  - `frontend/views/AGENTS.md`, `AGENTS.md`

- [ ] **Modify** `ClippingMaskRenderer.tsx` (from C01 — add release path):
  - When `releaseClippingMask` called → remove `<g clip-path="...">` wrapper, element renders normally
  - Clipping relationship removed from store (`clippingMaskBaseId = null`)
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] **Create** `frontend/views/dashboard/cert/templates/editor/overlays/ClipIndicatorOverlay.tsx`:
  - When clipping mask active and base shape selected → dashed outline (`theme.palette.divider`, `opacity: 0.4`, `strokeDasharray: "4 4"`) shows clip boundary over clipped elements
  - **Quality loop**: tsgo + biome + lint queue client

### MASK-C12: Knowledge Propagation

**Estimated time**: 3 hours
**Depends on**: MASK-C01 through MASK-C11
**Requirements**: all design sub-sections


- [ ] **Read applicable instruction files**:
  - `.agents/instructions/tests.instructions.md`, `.agents/instructions/frontend.instructions.md`


- [ ] **Append** to `frontend/IMPLEMENTATION_LEARNINGS.md` (append-only):
  - "Mask pixel buffer MUST be `useRef<OffscreenCanvas>` — storing in Zustand causes 1MB+ serialization per stroke."
  - "SVG `<mask>` with `mask-type='luminance'` is the correct approach for grayscale layer masks — `mask-type='alpha'` is for RGBA masks."
  - "Clipping mask transform memo must key on base shape's transform + version, not the clipped element's — the clipped element follows the clip path."
  - "Refine Edge preview must use a separate `<svg>` overlay — modifying the main canvas filter chain on every slider move causes perf issues."
  - **Quality loop**: tsgo + biome + lint queue client

- [ ] **Append** to `frontend/COMPONENT_PATTERNS.md` (append-only):
  - Pattern: "SVG `<clipPath>` for vector clipping — `clipPathUnits='userSpaceOnUse'` + `<g clip-path='url(#id)'>`"
  - Pattern: "SVG `<mask>` for pixel masks — `mask-type='luminance'` + `<image>` as mask content"
  - Pattern: "Marching ants CSS animation — `@keyframes dash { to { stroke-dashoffset: -16; } } strokeDasharray: 4 4; animation: dash 0.5s linear infinite;`"
  - **Quality loop**: tsgo + biome + lint queue client

---

### Instruction File & AGENTS.md Discovery (Plan 11 — Masking)

| Task | Files Created/Modified | AGENTS.md to Read | Instructions to Read |
|------|-----------------------|-------------------|----------------------|
| MASK-C01 | `ClippingMaskRenderer.tsx` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-C02 | `LayerMaskRenderer.tsx` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-C03 | `VectorMaskPathOverlay.tsx` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-C04 | `MaskEditingOverlay.tsx` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-C05 | `useMaskBrushPointerEvents.ts` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-C06 | `QuickMaskOverlay.tsx` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-C07 | `ClipGroupRenderer.tsx` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-C08 | `OpacityMaskRenderer.tsx` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-C09 | `MaskThumbnailCanvas.tsx` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-C10 | `RefineEdgePreviewOverlay.tsx` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-C11 | `ClippingMaskRenderer.tsx` (modify), `ClipIndicatorOverlay.tsx` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| MASK-C12 | `frontend/IMPLEMENTATION_LEARNINGS.md`, `frontend/COMPONENT_PATTERNS.md` (append) | `AGENTS.md` | `.agents/instructions/tests.instructions.md`, `.agents/instructions/frontend.instructions.md` |

### Round 5 Execution Order (Plan 11 — Masking)

```
Phase R5M-A (sequential): MASK-C01 (ClippingMaskRenderer), MASK-C02 (LayerMaskRenderer) — both depend on Plan 10 T01/T02 being committed
  ─── MASK-C03 (VectorMaskPathOverlay — depends on Pen R5 AnchorOverlay)
Phase R5M-B (sequential after C01+C02): MASK-C04 (MaskEditingOverlay)
  ─── MASK-C05 (brush handler — depends on C04 buffer contract)
Phase R5M-C (via parallel subagents after C01+C03+T02): MASK-C07 (ClipGroup — needs C01), MASK-C09 (Thumbnail — needs C01+C02)
Phase R5M-D (sequential after C05): MASK-C06 (QuickMask — needs brush handler)
Phase R5M-E (via parallel subagents after C02+C05): MASK-C08 (OpacityMask — needs C02), MASK-C10 (RefineEdge — needs C02)
Phase R5M-F (sequential after C01): MASK-C11 (release + indicator)
Phase R5M-G (sequential after all): MASK-C12 (test suite + knowledge propagation)
```

**Plan 11 R5 mask total estimated time**: ~36 hours (~20 wall-clock hours via parallel subagent phases R5M-A, R5M-C, R5M-E)

### Plan 11 Combined Total Time (Rounds 1-5 + Mask)

- Rounds 1-3: ~30 hours → ~18 wall-clock hours
- Round 4: ~20 hours → ~12 wall-clock hours
- Round 5 Fill/Stroke (R5-T1-T10): ~24 hours → ~10 wall-clock hours
- Round 5 Effects (R5-T1-T10): ~18 hours
- Round 5 Pen Tool (R5-T1-T10): ~16 hours
- **Round 5 Masking (MASK-C1-C12)**: ~36 hours → ~20 wall-clock hours
- **Plan 11 total**: ~110 hours → ~60 wall-clock hours with R5 mask parallelism.

> All quality-loop checks per file use `scripts/health/sub-loop.ts <path> --lifecycle <stage>` with progressive checks (tsgo → biome → lint → codescene). The lint queue server must be running before any lint call. See `AGENTS.md` §"Lint Queue Server" for startup commands.

## Round 5: Guides & Grid Tasks

- [ ] R5GG-T1. Implement smart guides rendering on canvas
  - Show alignment lines when dragging element
  - Edge-to-edge, edge-to-center, center-to-center guides
  - Color: theme.palette.primary.main with 0.6 alpha
  - Disappear on drag end
  - File: `frontend/views/certificate-editor/components/canvas/SmartGuidesOverlay.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5GG-T2. Create ruler component with draggable guide creation
  - Horizontal ruler (top), vertical ruler (left)
  - Draggable from ruler to create guide
  - Double-click ruler to set exact position
  - Right-click ruler for context menu (units, lock guides, clear guides)
  - File: `frontend/views/certificate-editor/components/canvas/RulerComponent.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5GG-T3. Implement guide management (create, move, delete, lock)
  - Drag from ruler to canvas creates guide
  - Drag guide to move
  - Double-click guide to edit position
  - Drag guide back to ruler to delete
  - Lock guides toggle (prevent editing)
  - File: `frontend/views/certificate-editor/hooks/useGuideManagement.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5GG-T4. Implement grid overlay rendering
  - Configurable grid size (px, mm, in)
  - Subdivisions (e.g., 10px major, 2px minor)
  - Grid color from theme (primary, light)
  - Toggle show/hide grid
  - Snap to grid option
  - File: `frontend/views/certificate-editor/components/canvas/GridOverlay.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5GG-T5. Implement guide snap engine
  - Snap element edges to guides within threshold (5px)
  - Visual feedback when snapping
  - Snap to intersection of two guides
  - File: `frontend/views/certificate-editor/hooks/useGuideSnap.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5GG-T6. Create guides & grid settings dialog
  - Grid size, subdivisions, color
  - Guide color, default position
  - Snap tolerance
  - Units selection (px, mm, in, cm)
  - File: `frontend/views/certificate-editor/components/dialogs/GuidesGridSettingsDialog.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5GG-T7. Add i18n keys for guides & grid
  - smartGuides, rulers, createGuide, editGuide, deleteGuide, lockGuides, clearGuides, gridSize, gridSubdivisions, gridColor, showGrid, snapToGrid, snapToGuides, snapTolerance, units, pixels, millimeters, inches, centimeters, guidePosition, gridSettings, guideSettings
  - Files: `shared/locale/en/certificateTemplateEditor.ts`, `shared/locale/ar/certificateTemplateEditor.ts`
  - _Quality loop_: tsgo + biome + lint queue client


## Round 5: Asset Library Tasks

- [ ] R5AL-T1. Implement canvas drop zone for assets
  - Listen for drag-over events on canvas
  - Show visual drop indicator (dashed border)
  - Calculate drop position in canvas coordinates
  - Create element at drop position on drop
  - File: `frontend/views/certificate-editor/components/canvas/AssetDropZone.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5AL-T2. Implement asset preview rendering on canvas
  - Render image assets with proper aspect ratio
  - Render SVG assets preserving vector quality
  - Render placeholder for assets still loading
  - Lazy-load assets that are off-screen
  - File: `frontend/views/certificate-editor/components/canvas/AssetRenderer.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5AL-T3. Implement asset caching system
  - Cache loaded image blobs in memory (Map)
  - Use OffscreenCanvas for image decoding
  - LRU cache with max 50 assets
  - Cache key: assetId + size variant
  - File: `frontend/common/stores/cert/assetCache.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5AL-T4. Implement QR code rendering on canvas
  - Generate QR code matrix from text/URL
  - Render as canvas or SVG
  - Configurable: size, error correction (L/M/Q/H), foreground color, background color
  - Optional logo overlay in center
  - File: `frontend/views/certificate-editor/components/canvas/QRCodeRenderer.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5AL-T5. Implement barcode rendering on canvas
  - Support formats: Code128, EAN13, EAN8, UPC-A, Code39
  - Render barcode bars with proper spacing
  - Show human-readable text below bars
  - Configurable: bar width, height, color, text visibility
  - File: `frontend/views/certificate-editor/components/canvas/BarcodeRenderer.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5AL-T6. Implement smart asset resizing on canvas
  - Hold Shift while dragging to maintain aspect ratio
  - Hold Alt to resize from center
  - Snap to other elements during resize
  - Min size constraints per asset type
  - File: `frontend/views/certificate-editor/hooks/useAssetResize.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5AL-T7. Add i18n keys for asset canvas rendering
  - dropHere, loadingAsset, qrCode, barcode, errorCorrection, foregroundColor, backgroundColor, logoOverlay, barWidth, barHeight, showText, code128, ean13, ean8, upcA, code39, maintainRatio, resizeFromCenter, minSize
  - Files: `shared/locale/en/certificateTemplateEditor.ts`, `shared/locale/ar/certificateTemplateEditor.ts`
  - _Quality loop_: tsgo + biome + lint queue client


## Round 5: History & States Tasks

- [ ] R5H-T1. Implement state replay engine for canvas
  - Store serialized element diffs (not full snapshots)
  - Apply incremental diffs on undo/redo
  - Re-render only changed elements for performance
  - Debounced state snapshots (batch rapid changes)
  - File: `frontend/common/stores/cert/historyReplay.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5H-T2. Create visual history scrubber on canvas
  - Mini timeline at bottom of canvas
  - Drag scrubber to preview any state
  - Ghost overlay during scrubbing
  - State count display ("State 15 of 42")
  - File: `frontend/views/certificate-editor/components/canvas/HistoryScrubber.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5H-T3. Implement non-linear history branching
  - Create new branch when undo + new action
  - Preserve old branches
  - Visual branch indicator in history panel
  - Switch between branches
  - File: `frontend/common/stores/cert/historyBranching.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5H-T4. Implement canvas snapshot system
  - Capture full canvas render as image
  - Snapshot thumbnails in history panel
  - Double-click for overlay comparison (50% opacity)
  - File: `frontend/views/certificate-editor/components/canvas/CanvasSnapshot.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5H-T5. Integrate history with canvas store
  - `historyStore.pushState()` before canvas operations
  - `undo()` applies inverse diff, triggers canvas re-render
  - `redo()` applies forward diff
  - `jumpToState()` computes and applies diff
  - File: `frontend/common/stores/cert/historyCanvasIntegration.ts`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5H-T6. Add i18n keys for history canvas features
  - historyScrubber, stateCount, statePreview, ghostOverlay, nonLinearHistory, branches, snapshotComparison, snapshotThumbnail
  - Files: `shared/locale/en/certificateTemplateEditor.ts`, `shared/locale/ar/certificateTemplateEditor.ts`
  - _Quality loop_: tsgo + biome + lint queue client


## Round 5: Canvas Pro Tasks

- [ ] R5C-T1. Implement artboard rendering on canvas
  - Multiple artboards on infinite canvas
  - Dashed border with label per artboard
  - Active artboard highlighted with solid border
  - Page shadow under each artboard
  - Independent background per artboard
  - File: `frontend/views/certificate-editor/components/canvas/ArtboardRenderer.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5C-T2. Implement DPI-aware canvas rendering
  - Render at device pixel ratio (DPR)
  - Zoom-independent text quality
  - Retina display support (2x)
  - Actual-size indicator at 100%
  - File: `frontend/views/certificate-editor/components/canvas/DPIAwareCanvas.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5C-T3. Implement multi-page canvas layout
  - Pages laid out vertically/horizontally with separators
  - Page break indicators and labels
  - Active page fully rendered, others as thumbnails
  - Lazy render off-screen pages
  - File: `frontend/views/certificate-editor/components/canvas/MultiPageLayout.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5C-T4. Implement CMYK preview on canvas
  - SVG filter for CMYK color simulation
  - Gamut warning overlay for clipped areas
  - Profile selection updates in real-time
  - Toggle without re-rendering elements
  - File: `frontend/views/certificate-editor/components/canvas/CMYKPreviewFilter.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5C-T5. Implement bleed and margin rendering
  - Bleed area: red dashed border beyond canvas edge
  - Margin guides: blue dashed inside canvas
  - Safe area: green dashed inside margins
  - Toggleable via View menu
  - File: `frontend/views/certificate-editor/components/canvas/BleedMarginOverlay.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5C-T6. Add i18n keys for canvas pro
  - artboardBoundary, artboardLabel, activeArtboard, pageShadow, dpiAware, retinaDisplay, actualSize, multiPage, pageBreak, pageLabel, activePage, cmykPreview, gamutWarning, cmykProfile, bleedArea, marginGuides, safeArea, showBleed, showMargins, showSafeArea
  - Files: `shared/locale/en/certificateTemplateEditor.ts`, `shared/locale/ar/certificateTemplateEditor.ts`
  - _Quality loop_: tsgo + biome + lint queue client


## Round 5: Workspace & Panel Tasks

- [ ] R5W-T1. Implement canvas area panel layout
  - Central canvas flanked by dockable panels
  - Drag dividers to resize panel areas
  - Canvas auto-adjusts on panel toggle/resize
  - Minimum canvas area (30% viewport)
  - Collapsed-to-icons mode for panels
  - File: `frontend/views/certificate-editor/components/canvas/CanvasPanelLayout.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5W-T2. Create canvas tab bar for multiple documents
  - Document tabs for open templates
  - Active tab highlighted
  - Close button on hover
  - Drag to reorder tabs
  - "New Template" tab at end
  - File: `frontend/views/certificate-editor/components/canvas/CanvasTabBar.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5W-T3. Implement floating canvas toolbar
  - Dockable toolbar (top, left, right, floating)
  - Position saved in workspace state
  - Auto-hides when zoomed in
  - Keyboard shortcut T to toggle
  - File: `frontend/views/certificate-editor/components/canvas/FloatingToolbar.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5W-T4. Create navigator minimap
  - Overview of entire canvas in corner
  - Red rectangle shows current viewport
  - Click/drag to navigate
  - Resizable minimap
  - Elements as colored rectangles
  - File: `frontend/views/certificate-editor/components/canvas/NavigatorMinimap.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5W-T5. Create canvas inspector overlay
  - Toggleable information overlay
  - Zoom %, cursor X/Y, element under cursor, selection dimensions
  - Semi-transparent, click-through
  - File: `frontend/views/certificate-editor/components/canvas/InspectorOverlay.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5W-T6. Add i18n keys for canvas workspace
  - canvasArea, panelLayout, resizePanels, minimumCanvas, iconMode, documentTabs, newTemplate, floatingToolbar, autoHide, toggleToolbar, navigator, minimap, viewport, inspectorOverlay, cursorX, cursorY, selectionDimensions
  - Files: `shared/locale/en/certificateTemplateEditor.ts`, `shared/locale/ar/certificateTemplateEditor.ts`
  - _Quality loop_: tsgo + biome + lint queue client


## Round 5: Pen Tool Tasks — Plan 11 (Canvas Path Drawing, Bezier Rendering, Anchor Point Interaction)

- [ ] R5P-T1. Implement pen tool canvas interaction on canvas
  - Click to add anchor points on canvas
  - Click-drag to create bezier handles
  - Real-time path preview while drawing
  - Esc or Enter to finish path
  - File: `frontend/views/certificate-editor/components/canvas/PenToolInteraction.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5P-T2. Implement anchor point rendering on canvas
  - Square anchors for corner points
  - Diamond anchors for smooth points
  - Handle lines drawn from anchor to control points
  - Hover highlight on anchors and handles
  - File: `frontend/views/certificate-editor/components/canvas/AnchorPointRendering.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5P-T3. Implement path editing on canvas
  - Click anchor to select
  - Drag selected anchor to move
  - Alt-drag anchor to convert corner↔smooth
  - Double-click path segment to add anchor
  - File: `frontend/views/certificate-editor/components/canvas/PathEditingInteraction.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5P-T4. Implement bezier curve rendering on canvas
  - Quadratic and cubic bezier rendering
  - Smooth curve interpolation between segments
  - Anti-aliased stroke rendering
  - Filled paths with even-odd winding rule
  - File: `frontend/views/certificate-editor/components/canvas/BezierCurveRenderer.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

- [ ] R5P-T5. Implement pen tool snapping on canvas
  - Snap to grid intersections
  - Snap to other path anchors
  - Snap to element edges and centers
  - Snap threshold configurable (4px default)
  - File: `frontend/views/certificate-editor/components/canvas/PenToolSnapping.tsx`
  - _Quality loop_: tsgo + biome + lint queue client

