# @xyflow/react (React Flow v12) — Fit Evaluation for the Siraj Certificate Template Editor Canvas

> **Scope:** Plan 11 — Template Editor: Visual Canvas (`.ai/draft_plans/cert/plans/11-template-editor-canvas/`).
> **Question:** Is `@xyflow/react` v12.11.2 a good replacement for the current bespoke canvas
> (custom absolute-positioned divs + `react-zoom-pan-pinch` for zoom/pan + `@dnd-kit` for drag)?
> **Sources read:**
> - `plans/11-template-editor-canvas/design.md` (canvas plan, 874 lines)
> - `plans/11-template-editor-canvas/node_research/react-zoom-pan-pinch.md` (rzpp v4.0.3)
> - `plans/11-template-editor-canvas/node_research/dnd-kit.md` (dnd-kit core 6.3.1 / sortable 10.0.0)
> - `plans/11-template-editor-canvas/node_research/react-color.md` (plan 12 color picker)
> - `node_modules/@xyflow/react/README.md`, `/package.json`, `/dist/esm/types/nodes.d.ts`,
>   `/dist/esm/types/component-props.d.ts`, and the system types in `@xyflow/system`.
> - `plans/12-template-editor-elements/design.md` (peer plan — element property forms + layer panel)
> - `plans/INTER_PLAN_CONTRACTS.md` and existing `plans/xyflow-api-research.md`
> **Verdict (TL;DR):** **Not a good fit. Do not adopt.** React Flow is an excellent node-graph editor, but
> the Siraj canvas is a *fixed-size, pixel-accurate, printable* design surface with no edges between
> elements. Adopting it would import an unused edge/connection model, fight its coordinate system to
> constrain it to A4, and add new risk to the Puppeteer PDF export path. The bespoke canvas already
> solves the actual hard problem (snap guides, rotated resize, rulers) and the installed
> `react-zoom-pan-pinch` + `@dnd-kit` cover the generic parts.

---

## 1. Use-Case Fit — Is React Flow Designed for This?

### 1.1 React Flow's stated purpose

React Flow describes itself, in its own `package.json` `description` field and the top of its README, as:

> "A highly customizable React component for building **interactive graphs and node-based editors**."
> — `node_modules/@xyflow/react/package.json` line 4

> "A highly customizable React component for building **node-based editors and interactive flow charts**."
> — `node_modules/@xyflow/react/README.md` line 11

The README's "Key Features" are entirely graph-oriented:

- "Seamless zooming and panning, single- and multi selection of graph elements and keyboard shortcuts"
- "Different **node and edge types**… support for custom nodes with multiple handles and custom edges"
- "Hooks for handling **nodes, edges** and the viewport and graph helper functions"

The credits even name the original motivating application:

> "React Flow was initially developed for **datablocks**, a **graph-based editor** for transforming,
> analyzing and visualizing data in the browser."
> — `README.md` lines 127

The dependency list confirms the same mental model — it is built on graph primitives, not document-layout primitives:

> Under the hood, React Flow depends on these great libraries:
> - **d3-zoom** — used for zoom, pan and drag interactions with the graph canvas
> - **d3-drag** — used for making the nodes draggable
> - **zustand** — internal state management
> — `README.md` lines 129–131

### 1.2 What the Siraj canvas actually is

Plan 11's own architecture diagram describes a fundamentally different surface:

> "Canvas Container (position: relative, CSS transform: scale)
>   Background Image Layer (template background)
>   Element Overlays (position: absolute, per element)
>     Text · Image · QR  ← ElementRenderer"
> — `design.md` lines 26–32

The element model is a flat list of design primitives positioned in **template pixels on a fixed A4 sheet**, with no relational semantics:

> "`type` `text` / `image` / `qr` / `shape` / `date`; `x`, `y`, `width`, `height`, `rotation`,
> `zIndex`, `props`"
> — `design.md` §5.2, lines 247–254

There are **no edges, no connections, no source/target handles, no data-flow semantics** anywhere in
the plan. The closest analog in design-tool land is Figma/Canva, not a node editor.

### 1.3 Conclusion on fit

| Question | Answer |
|----------|--------|
| Is React Flow *designed* for printable A4 design canvases? | No. Its README, package.json description, and dependency graph (d3-zoom/d3-drag for *graphs*) all target node-graph/flowchart editors. |
| Could it be *bent* into one? | Possibly — its nodes are arbitrary React — but you would be disabling or ignoring ~40% of its surface area (edges, handles, connection logic, `addEdge`, auto-layout by edges). |
| Is that bending a good idea? | No. The bespoke canvas in Plan 11 is *less* code than the React Flow configuration needed to neutralize its graph behavior, and the bespoke code is already tailored to the PDF export contract. |

---

## 2. Comparison to the Current Stack

The current Plan 11 design uses three layers, all analyzed in `node_research/`:

1. **`react-zoom-pan-pinch` v4.0.3** — canvas zoom/pan (zero runtime deps, MIT, v4 API as researched).
2. **`@dnd-kit/core` 6.3.1 + `@dnd-kit/sortable` 10.0.0** — used for the layer-panel drag reorder in Plan 12 (per Plan 12's own review notes: "`@dnd-kit/sortable` is installed and is the canonical choice for sortable lists in this stack — use it, don't hand-roll drag reorder" — `12-template-editor-elements/design.md` §A/§B). Plan 11 itself uses **direct pointer-event handlers** for canvas-element drag (not dnd-kit), per its §3.2:
   > "Decision: Use Pointer Events API exclusively. `e.clientX/clientY` are available on all pointer events for coordinate calculations. Call `setPointerCapture(e.pointerId)` on pointer down to maintain tracking when cursor leaves the element."
   > — `design.md` lines 119
3. **Custom absolute-positioned divs** for the background, element overlays, selection handles, and snap-guide SVG overlay (`design.md` §4 component hierarchy, lines 169–200).

### 2.1 Zoom/pan: does React Flow replace `react-zoom-pan-pinch`?

**Yes, mechanically.** `ReactFlow` exposes `zoomOnScroll`, `panOnScroll`, `panOnDrag`, `minZoom`, `maxZoom`, `fitView`, `fitViewOptions`, `translateExtent`, and a `useViewport` hook
(`component-props.d.ts`: `zoomOnScroll?: boolean`, `panOnScroll?: boolean`, `panOnDrag?: boolean | number[]`, `translateExtent?: CoordinateExtent`, `fitView?: boolean`).

**But Plan 11 already rejected bespoke zoom math in favor of rzpp.** The SWE review of Plan 11 explicitly recommends it:

> "`react-zoom-pan-pinch` is *installed* and solves exactly this — strongly consider using it instead of the custom `transform: scale` + manual `panOffset`/`scrollLeft` plumbing (which has known edge cases with ruler sync and cursor-center math)."
> — `design.md` "SWE Expert Review Notes" §C, line 812

React Flow's viewport *is* d3-zoom wrapped, which is more battle-tested but also more oriented to
infinite graphs. rzpp v4 is *purpose-built for content-transform* applications (its researched
API exposes `zoomToElement`, `centerView`, `Virtualize`, and `MiniMap` — all design-canvas
oriented — `react-zoom-pan-pinch.md` lines 19–22, 88–105).

| Zoom/pan concern | `react-zoom-pan-pinch` v4 | React Flow v12 |
|-----------------|---------------------------|-----------------|
| Free zoom/pan | ✅ | ✅ (d3-zoom) |
| Cursor-centered wheel zoom | ✅ (built-in) | ✅ (built-in) |
| Zoom-to-element (e.g. "zoom to selected") | ✅ `zoomToElement(node, scale, …)` — `rzpp.md` line 97 | ✅ `fitView({ nodes })` |
| Fit fixed A4 to screen | ✅ `centerView(scale)` | ⚠️ `fitView` is computed over *node bounds*, not a fixed canvas rect — it would need a sentinel A4 "background" node to clamp to |
| Coordinate translation to Puppeteer page | ✅ rzpp leaves the inner DOM unchanged — `transform: translate/scale` is easy to strip for export | ❌ rf wraps content in a transformed `.react-flow__viewport` with its own transform string; export must undo it |
| Rulers that scroll-sync to pan | ✅ rzpp's render-prop exposes `positionX/Y` directly (`rzpp.md` lines 240–253) | ⚠️ `useViewport()` works but the scroll model is viewport-centered, not scrollbar-centered — Plan 11's `scrollLeft`/`scrollTop` ruler sync (`design.md` §6.4, lines 355–358) would need rework |

**Verdict:** React Flow is not a strict improvement over rzpp here; it ties on features and **loses** on the
"fixed A4 canvas" and "Puppeteer export translation" axis.

### 2.2 Drag: does React Flow replace `@dnd-kit` / direct pointer handling?

React Flow's drag is *node-position drag within the graph* (d3-drag, per README line 130), with
`onNodeDrag`/`onNodeDragStart`/`onNodeDragStop` callbacks and a `NodeProps.selected/dragging` flag
(`nodes.d.ts`: `Required<Pick<NodeType, 'type' | 'dragging' | 'zIndex' | 'selectable' | 'deletable' | 'selected' | 'draggable'>>`, plus `positionAbsoluteX/Y`).

**Yes, it replaces canvas-element drag.** The node-position model maps cleanly to the
`CanvasElement.{x,y}` model in `design.md` §5.2.

**But it does NOT replace the other dnd-kit usages in this plan group**:

- **Layer-panel reorder (Plan 12):** Plan 12 explicitly standardizes on `@dnd-kit/sortable`
  ("use it, don't hand-roll drag reorder" — `12-template-editor-elements/design.md` line 517).
  React Flow has no sortable-list concept. So even if the canvas adopted rf, the layer panel
  would still ship `@dnd-kit/sortable` — meaning **both** libraries in the bundle.
- **Toolbar "Add Element" drag-onto-canvas (if desired):** rf's `onDrop`/`onDragOver` is graph-oriented;
  adding a new text/imagine/qr node from the toolbar is easier with a plain `onDrop` handler on a div.

### 2.3 Is the node model a good fit for text/image/QR/signature/border elements?

**Weak fit.** The Node type itself is arbitrary-position-friendly:

```ts
// node_modules/@xyflow/react/dist/esm/types/nodes.d.ts
export type Node<…> = NodeBase<NodeData, NodeType> & {
  style?: CSSProperties;
  className?: string;
  resizing?: boolean;
  focusable?: boolean;
  ariaRole?: AriaRole;            // defaults to "group"
  domAttributes?: Omit<HTMLAttributes<HTMLDivElement>, …>;
};
```

The escape hatches (`style`, `className`, `domAttributes`, `ariaRole`) confirm you can render *any*
visuals. The plan's `props: Record<string, unknown>` for type-specific data maps onto rf's
`data: Record<string, unknown>` (the `NodeData` generic).

But the model carries graph baggage that is dead weight for a flat design canvas:

- Every node conceptually supports `sourcePosition`/`targetPosition` (`NodeProps` Pick of those —
  `@xyflow/system` `nodes.d.ts` line for `NodeProps`).
- `isConnectable` is a required field on `NodeProps` (`@xyflow/system` `nodes.d.ts`).
- `onConnect`, `addEdge`, `reconnectEdge`, `getIncomers`, `getOutgoers`, `getConnectedEdges` are
  all top-level exports — designed for graph traversal, unused here.

**Comparison of element model overhead:**

| Element model concern | Bespoke `CanvasElement` (Plan 11 §5.2) | React Flow `Node` |
|-----------------------|----------------------------------------|-------------------|
| `id`, `type`, `x`, `y`, `width`, `height`, `zIndex`, `props` | ✅ Direct, 8 fields | ✅ `data`/`position`/`width`/`height`/`zIndex`/`type`, plus graph fields |
| Rotation (0–360°, REQ-11-05) | ✅ First-class field | ❌ **No native rotation** — must DIY via `style: { transform: rotate() }` + custom hit-testing |
| 8-handle resize + min-size + aspect lock (REQ-11-04/05) | Already specced in §4, §7, §8 | ⚠️ `NodeResizer` / `NodeResizeControl` exist but are 4-side + 4-corner (not custom-aspect), no rotation-handle sibling |
| Type discriminated union (Plan 12 `ElementWithDetails`) | ✅ Maps to `props`/`data` | ⚠️ Must be encoded in `data` since `type` is the *rf node renderer key*, not the cert element type |

### 2.4 Fixed-size A4 canvas vs infinite auto-pan canvas

Plan 11 explicitly models a **fixed sheet**:

| Plan 11 fact | Source |
|--------------|--------|
| Canvas size = 595×842 (72 DPI) per REQ-11-01 | `design.md` §3.1 / SWE review §A.2 |
| Or 794×1123 (96 DPI) per Plan 10 — DPI is a known cross-plan contradiction flagged in `INTER_PLAN_CONTRACTS.md` line 611 | — |
| "Canvas bounds snap": `element.x >= 0`, `element.x + element.width <= canvasWidth` | `design.md` §8.4, lines 448–455 |
| Viewport = scrollable + pan-able container, canvas container renders at *template dimensions* with `transform: scale` | `design.md` §6.4, lines 354–358 |
| Rulers tuned to canvas pixel extent | `design.md` §1.2 / §4 component tree |

React Flow's default is an **infinite** (or `translateExtent`-bounded) surface with auto-fit-to-view.
To get the Siraj UX (a visible A4 "page" that the user pans *around* and never pans *off* of), you
have to:

1. Render one big "background" node sized to A4 as the page.
2. Set `translateExtent` to clamp panning so the page can't be dragged off-screen — but translateExtent
   constrains where **nodes** can be dragged, not where the **viewport** can scroll, so this is the
   wrong lever (`component-props.d.ts`: `translateExtent?: CoordinateExtent` and `nodeExtent?: CoordinateExtent`
   both refer to *node* extent, not viewport extent).
3. Disable `fitView` (false), pick a `defaultViewport` matching Plan 11's initial view, and prevent
   rf from re-fitting on data changes — rf tends to call `fitView` automatically when internal node
   measurements change (`reactFlowInstance.viewportInitialized` — `instance.d.ts`), which would yank
   the viewport during loading.

This is fighting the library, not using it.

### 2.5 Handle / connection system — help or hindrance?

**Pure hindrance for a non-node-graph editor.** A certificate template has no concept of "this text box
connects to that QR code". rf's handles and connection-line drag are entirely about wiring edges.
Workarounds:

- Set `nodesConnectable={false}` on `<ReactFlow>` to disable connection drag (`component-props.d.ts`:
  `nodesConnectable?: boolean`).
- Per-node: omit `<Handle>` in the custom node renderer — without rendered handles, rf shows no
  connection ports and `onConnect` never fires.

Both work, but you've now disabled one of the library's headline features. The remaining value
reduces to "zoned viewport + draggable boxes", which rzpp + absolute positioning already provide.

---

## 3. Custom Node Rendering

### 3.1 What `NodeProps` gives you

```ts
// @xyflow/system/dist/esm/types/nodes.d.ts
export type NodeProps<NodeType extends NodeBase> =
  Pick<NodeType, 'id' | 'data' | 'width' | 'height' | 'sourcePosition' | 'targetPosition' | 'dragHandle' | 'parentId'> &
  Required<Pick<NodeType, 'type' | 'dragging' | 'zIndex' | 'selectable' | 'deletable' | 'selected' | 'draggable'>> & {
    isConnectable: boolean;
    positionAbsoluteX: number;
    positionAbsoluteY: number;
  };
```

And the `Node` type explicitly carries:

```ts
// @xyflow/react/dist/esm/types/nodes.d.ts
export type Node<…> = NodeBase<…> & {
  style?: CSSProperties;
  className?: string;
  resizing?: boolean;
  focusable?: boolean;
  ariaRole?: AriaRole;
  domAttributes?: Omit<HTMLAttributes<HTMLDivElement>, …>;
};
```

### 3.2 Can custom node types render arbitrary React?

**Yes.** React Flow's customization model is `nodeTypes: Record<string, ComponentType<NodeProps>>`
(referenced in the imports of `component-props.d.ts`: `import type { … NodeTypes … }`). A custom
node component receives `NodeProps` and can render **any** JSX — MUI `Box`/`Typography`, `<img>`,
`<QRCodeSVG>`, etc. This is documented in the README's "Customizable" feature and confirmed by the
existence of a `style`/`className`/`domAttributes` escape hatch and `ariaRole="group"` default.

**So in principle** a custom node could render:

```tsx
const TextNode = ({ data }: NodeProps) => (
  <Box sx={{ width: '100%', height: '100%', p: 1 }}>
    <Typography>{data.content}</Typography>
  </Box>
);
const QrNode = ({ data }: NodeProps) => <QRCodeSVG value={data.value} />;
```

### 3.3 What hurts custom rendering here

| Concern | Impact |
|---------|--------|
| **Width/height are measured by rf from rendered content by default** — to get explicit `width`/`height` you must set node `width`/`height` and `style.width/height`, and rf will reflow when content changes (`useNodesInitialized` exists to track this) | Plan 11 requires user-controlled pixel widths with `minWidth` constraints (`design.md` §4.1 ResizeHandles "updateElementSize") — rf's autocorrecting measurements fight explicit sizing |
| **No first-class rotation handle** — must DIY | Direct regression vs Plan 11's spec (REQ-11-06) |
| **`NodeResizer` is 4-side + 4-corner**, no rotation sibling, no per-aspect min-size, no opposite-anchor-fixed geometry | The "rotated resize with opposite-anchor-fixed" complication flagged in `design.md` SWE §A.3 (lines 794) is *harder*, not easier, in rf |
| **MUI v9 styling** — Plan 11 (per `AGENTS.md`'s MUI rules) requires `sx` prop, no style props. rf injects its own `.react-flow__node` CSS via `dist/style.css` (side-effect import — `package.json` `sideEffects: ["*.css"]`) | Two styling systems coexist; must remember to override rf's CSS for MUI theme tokens (no hardcoded `#2196F3`, per Plan 11 review §Reality-Check 4) |

---

## 4. PDF Export Alignment (Puppeteer)

This is the area where the decision matters most, because the canvas is meant to populate — not
render — the PDF.

### 4.1 Plan 6's PDF contract (from `INTER_PLAN_CONTRACTS.md`)

Cross-plan contract line 441:
> "PDF export MUST scale from 96 DPI to 72 DPI (PDF point standard) via `scale: 72/96`."

Plan 6 uses **Puppeteer to render a separate HTML page** (the certificate render template), not to
snapshot the React canvas. The canvas is only the editor; the saved element model is what feeds the
render template. `INTER_PLAN_CONTRACTS.md` lines 206–234 enumerate the render service behavior, and
line 611 pins Plan 11's DPI to 794×1123 not 595×842.

This means: **the canvas does not need to be pixel-perfectly snapshot-able** — it needs to *serialize*
a model that Plan 6 renders in its own HTML. The bespoke Plan 11 design reflects exactly this — its
state shape (`design.md` §5.2) stores plain `{x, y, width, height, rotation, zIndex, props}` in
template pixels, which serialize trivially to JSON for Plan 6 to consume. The SWE review explicitly
endorses this:

> "Storing positions in template pixels (not %, not screen px) is the right call: it is
> resolution-independent, matches the PDF render surface (Plan 6), makes zoom/pan a pure view
> transform, and serializes trivially."
> — `design.md` "SWE Expert Review Notes" §A.2, line 793

### 4.2 What React Flow changes for export

If the editor canvas becomes React Flow:

1. **Element model gains graph fields.** The saved `nodes[]` array would carry rf's internal fields
   (`measured`, `positionAbsolute`, `dragging`, `selected`, etc.) unless you write a serializer that
   strips them. Plan 11's SWE review already calls out the need:

   > "Define an explicit `serializeCanvas(elements[]) → JSON` used by the Save mutation, distinct from
   > the live store state. Only elements[] (and z-order) persist to the server; viewport state never
   > persists." — `design.md` §B.3, line 801

   …but with rf the live state carries *even more* non-serializable graph state (handles, edges),
   so a custom `getSerializableState()` selector becomes more complex, not less.

2. **Viewport transform is non-trivial to undo** if you ever *did* want to snapshot the canvas DOM
   (e.g. for a thumbnail). React Flow applies `transform: translate(x, y) scale(z)` on a wrapper
   `.react-flow__viewport`. HTML-to-image / Puppeteer `page.screenshot` would capture this transform
   unless you set zoom=1 and pan=(0,0) before snapshot — extra state-machine coordination. rzpp
   applies the same kind of transform so this isn't strictly worse, but rf's transform lives in a
   CSS class managed by d3-zoom internals that are more brittle to override.

3. **Snap-to-grid vs free positioning.** React Flow ships a **snap grid** prop and ResizeControl
   snapping. Plan 11 needs *both* grid snap **and** element-alignment-guide snap (REQ-11-07/08,
   `design.md` §8.1/§8.2 — the latter renders SVG guide lines when 6 reference points per element
   fall within 5px). rf does not provide alignment guides out of the box — you would still build
   the `SnapGuideOverlay` SVG layer (`design.md` §4 component tree, lines 196–198). So **rf saves
   you grid snap but not the harder element-alignment snap.**

### 4.3 PDF export gotcha summary

| Gotcha | With bespoke canvas + rzpp | With React Flow |
|--------|----------------------------|------------------|
| Serialize model cleanly | ✅ plain `elements[]` | ⚠️ strip graph fields |
| Snap-to-grid (REQ-11-07) | ✅ DIY `Math.round(v / gridSize) * gridSize` — `design.md` §8.1 | ✅ built-in `snapGrid` |
| Element alignment guides (REQ-11-08) | ✅ DIY SVG overlay — `design.md` §8.2/§8.3 | ❌ still DIY — rf has no alignment guides |
| Position bounds clamp to A4 | ✅ §8.4 envelope check | ❌ translateExtent is wrong lever (constrains nodes not viewport) |
| Free positioning vs grid-only | ✅ both, toggleable | ✅ both (`snapGrid` toggleable) |
| Viewport transform undo for snapshot | ⚠️ strip rzpp transform | ❌ strip rf `__viewport` transform (more brittle) |
| Cursor-centered zoom formula | ✅ explicit in `design.md` §9.1 lines 473–476 | ✅ built-in |

---

## 5. Bundle Size / Dependencies

### 5.1 React Flow's dependency footprint

From `node_modules/@xyflow/react/package.json` lines 55–65:

```json
"dependencies":      { "classcat": "^5.0.3", "zustand": "^4.4.0", "@xyflow/system": "0.0.79" },
"peerDependencies":  { "@types/react": ">=17", "@types/react-dom": ">=17",
                       "react": ">=17", "react-dom": ">=17" },
```

- `classcat` — tiny (~1 KB) conditional className helper.
- `zustand` — Siraj already uses `zustand ^5.0.13` (`package.json` line grep above); rf pins **v4**
  not v5. Two major versions of zustand in the bundle is a real concern — the APIs differ enough
  (`create` signature differences, middleware) that sharing a store across rf and Siraj code is
  awkward. rf isolates its store via `ReactFlowProvider`, so this is a bundle-duplication cost, not a
  correctness cost.
- `@xyflow/system` — graph geometry, viewport, xstate-less internals. du -sh reports the whole
  `node_modules/@xyflow` tree at **5.2M on disk**, `react/dist/esm` alone at **1.7M**.
- **CSS** — `dist/style.css` + `dist/base.css` are *side-effect* imports (`package.json`
  `sideEffects: ["*.css"]`) — bundlers like Next/Turbopack will pull the CSS in when you import the
  lib, even if you only use one component. Not tree-shake-disableable.

### 5.2 Comparison vs installed alternatives

| Library | Installed? | Runtime deps | On-disk size | Notes |
|---------|-----------|--------------|--------------|-------|
| `@xyflow/react` | Not yet (would add) | `classcat`, `zustand^4`, `@xyflow/system` | ~5.2 MB | Two zustands; mandatory CSS |
| `react-zoom-pan-pinch` v4.0.3 | ✅ already in `package.json` | **None** (zero runtime deps — `rzpp.md` line 10) | tiny | v4 is tree-shakeable, `sideEffects: false` (`rzpp.md` line 15) |
| `@dnd-kit/core` + `sortable` + `utilities` | ✅ already in `package.json` | `@dnd-kit/accessibility` | small | Used by Plan 12 layer panel regardless; Plan 11 doesn't strictly need it for canvas drag |
| `react-color` v2.19.3 | ✅ already in `package.json` | `lodash`, `lodash-es`, `tinycolor2`, `reactcss`, `material-colors`, `@icons/material`, `prop-types` (`react-color.md` lines 15) | medium-ish | Plan 12 color picker; effectively unmaintained — flagged separately |
| `html-to-image` | ✅ already | — | small | Useful for canvas thumbnail/preview (not used by PDF path) |

React Flow is the **heaviest** of the candidates and the only one that would force a *new*
top-level dependency tree (zustand v4 + @xyflow/system). The current stack's heaviest add is rzpp
at *zero* runtime deps.

---

## 6. Risk of Adopting — Which Plans Change?

### 6.1 Plans that mention the canvas libs

From grep across `plans/`:

| Plan | Mentions | Source |
|------|----------|--------|
| 11 (canvas) | bespoke canvas; `react-zoom-pan-pinch` (review §C recommends adopting); 595×842 vs 794×1123 DPI; `Set<string>` concern; `expectedVersion` | `design.md` + `INTER_PLAN_CONTRACTS.md` line 611 |
| 12 (elements/layer panel) | `@dnd-kit/sortable` for layer-panel reorder (mandatory); `react-color` for color picker | `12/design.md` lines 517, 559, 572 |
| 13 (template variables) | mentions canvas/dnd-kit tangentially | `13/tasks.md` |
| 17 (cert generation dialog) | tangential canvas mention | `17/design.md` |
| 10 (template editor basic) | rzpp research file present | `10/node_research/react-zoom-pan-pinch.md` |
| 09 (category mgmt) | dnd-kit / sortable for list reordering | `09/{design,tasks,requirements}.md` |

### 6.2 What changes if we adopt React Flow

| Plan | What must change |
|------|------------------|
| **11** | Rewrite §1, §3.1–3.3, §4 component hierarchy, §6 coordinate system, §9 zoom/pan, §14 file map. Adopt `nodeTypes` registry. Replace rzpp usage with `<ReactFlow zoomOnScroll panOnDrag>`. Rewrite the §7 interaction state machine to use rf's `onNodeDrag*` + custom rotation boson. Add `nodesConnectable={false}` everywhere. Build the rotation handle (rf has none). Still DIY the alignment-guide SVG — Plan 11 §8.2/§8.3 stays. Serialize logic gets graph-field stripping. Estimate: Plan 11 design is ~70% rewritten; tasks.md (T01–T30) is ~80% rewritten. |
| **12** | Layer panel stays `@dnd-kit/sortable` — **but now dnd-kit AND xyflow coexist in the bundle** (more weight, more mental model for new contributors). Element type discriminated union (`ElementWithDetails`) must map onto rf's `data` field (smoothing). Property-panel sync becomes slightly harder because rf owns node state in its own zustand v4 store. |
| **13** | If template variables get rendered on-canvas as hint nodes, they would also use rf `nodeTypes` — extension, not blocking. Tangential. |
| **17** | Generation dialog uses a read-only canvas preview — would need `<ReactFlow nodesDraggable={false} nodesConnectable={false} panOnDrag>`; doable but heavier HTML than a single `img`/`html-to-image` snapshot. |
| **10** | rzpp research note becomes obsolete; re-research rf config instead. |
| **09** | `@dnd-kit/sortable` for category order remains — unaffected by canvas decision. |
| **inter-plan** | `INTER_PLAN_CONTRACTS.md` line 460–461 tables (`@dnd-kit/core` + `react-zoom-pan-pinch` for Plans 11/12) must be rewritten; line 611 "adopt `@dnd-kit`, `react-zoom-pan-pinch`" must become "adopt `@xyflow/react` + `@dnd-kit/sortable`". |

**Rough scope of adoption:** rewriting Plan 11 (design + tasks) + amending Plan 12 + rewriting
`INTER_PLAN_CONTRACTS.md` + re-doing node research. Realistically that's days to a week of plan
rework *before* implementation, plus new risk surface (rotation, alignment guides, serialize)
described in §3.3 and §4.

### 6.3 What we *would* gain by adopting

Genuinely valuable things React Flow provides that the bespoke canvas would otherwise build by hand:

- Zoom/pan with d3-zoom quality (already matched by rzpp).
- Built-in `Background` (dots/lines), `MiniMap`, `Controls` — the MiniMap is the one genuinely
  new feature Plan 11 doesn't currently spec.
- `NodeToolbar` — floating contextual toolbar anchored to a node (could replace the selection
  handles for some interactions, but Plan 11's §4 spec is more specific than rf's generic toolbar).
- Multi-select box + `SelectionDragHandler` (`nodes.d.ts` exports `SelectionDragHandler`).
- Tested accessibility for keyboard navigation between nodes (rf exposes Tab cycling when
  `nodesFocusable`).

These are nice but small relative to the cost — and the SWE review of Plan 11 (§B/§C) already
identifies that rzpp + dnd-kit + bespoke selection layers cover them.

---

## 7. Risk of NOT Adopting — What We Lose

Staying the course (rzpp + dnd-kit + bespoke absolute positioning) means:

### 7.1 Complexity we would be *avoiding* by adopting (small list)

| Item | Avoided by RF? | Sized |
|------|----------------|-------|
| Custom 8-handle resize geometry | Partially (`NodeResizer`) | Plan 11 §4/§7/§8 already specced in ~600 lines; rf shaves ~200 but adds rotation-handle DIY (~150 lines) |
| Custom rotation handle | ❌ rf has none | Net **adds** code, not removes |
| Custom snap-to-grid formula | ✅ `snapGrid` | ~5 lines saved (§8.1) |
| Custom marquee selection | ✅ built-in shift-drag | ~100 lines saved |
| Cursor-centered wheel zoom formula | ✅ built-in | ~10 lines saved |
| Pan-on-scroll-drag, Space-pan | ✅ built-in | ~80 lines saved |

**Total saved:** roughly 200–400 lines of interaction code.

### 7.2 Complexity we *take on* by NOT adopting (already specced in the plan)

| Item | Source | Effort |
|------|--------|--------|
| Snap-to-element alignment guides (the O(n²) guide scan) | `design.md` §8.2/§8.3 | ~250 lines; SWE review §C flags the O(n²) but at n≤50 it's fine |
| Rotated-resize (opposite-anchor-fixed) geometry | `design.md` §A.3 (review) flags as ~1500-line risk area | Same effort whether rf or bespoke — rf does *not* solve this; SWE recommends forbidding resize-when-rotated in v1 |
| Ruler sync to pan/scroll | `design.md` §6.4 / §9.2 | ~200 lines; shared burden |
| Undo/redo command pattern (Zustand, no precedent in repo) | SWE §B.2 recommends `zundo` | ~300 lines, same burden either way |

### 7.3 Risks we accept by staying bespoke

| Risk | Severity | Mitigation already in the plan |
|------|----------|-------------------------------|
| Hand-rolled pointer-event edge cases (touch, pen capture) | Medium | Plan 11 §3.2 mandates Pointer Events API + `setPointerCapture`; reviewed as correct |
| Bundling two drag systems (dnd-kit for layer panel, Pointer Events for canvas body) | Low | These serve different purposes (sortable list vs free-position drag); a single lib unifying them doesn't actually exist for design canvases |
| Bug surface in custom zoom/pan math | Medium | **Mitigation**: adopt `react-zoom-pan-pinch` (which the plan already recommends — Plan 11 review §C, line 812) instead of hand-rolled transform math |
| Alignment guide O(n²) scan at large n | Low | n ≤ 50; SWE review flagged but bounded scope is fine |
| No MiniMap affordance | Low | Not a REQ; could be a v2 add with rzpp's `MiniMap` component (`rzpp.md` line 19) |
| Maintenance of bespoke geometry forever | Medium | Bounded by 5–30 typical elements — this is a *bounded* complexity, not an ever-growing one |

### 7.4 What we genuinely give up

- **Built-in MiniMap** — minor UX nice-to-have; rzpp *also* ships a MiniMap (`rzpp.md` line 19) so
  this is not rf-exclusive.
- **Battle-tested d3-zoom/d3-drag** — but rzpp's transform plumbing is also battle-tested and is
  already installed with zero runtime deps.
- **Tab-cycling focus between nodes** — accessibility win, but Plan 11's SWE review §F (line 811)
  recommends adding Tab cycling to the bespoke canvas regardless, independent of rf adoption.

### 7.5 Summary

The bespoke canvas is *more* code, *but* it is **bounded** and **already tailored to the PDF export
contract + the Siraj MUI v9 / theme-palette / AGENTS.md styling rules**. React Flow would shave
~200–400 lines of generic interaction code at the cost of buying back: a graph model we don't use,
a CSS layer we have to override, a second zustand version, a transform that fights A4 bounds, an
empty rotation-handle slot we'd fill ourselves anyway, and new serialization surface for the PDF
path.

---

## 8. Final Recommendation

**Stay with the current bespoke canvas** (Plan 11 as written), with the two refinements the SWE
review already endorses:

1. **Adopt `react-zoom-pan-pinch` for zoom/pan** (instead of hand-rolled transform math) —
   already installed, zero deps, eliminates the cursor-center / ruler-sync edge-case risk
   (`design.md` §C recommendation, line 812).
2. **Keep `@dnd-kit/sortable` for the layer-panel reorder** (Plan 12) — orthogonal to the canvas-
   body drag, which correctly uses direct Pointer Events per Plan 11 §3.2.

**Adopt `@xyflow/react` only if** a future plan introduces a *genuine node-graph* surface — e.g. a
visual workflow/automation editor for content production. For a fixed-A4 printable certificate
template editor, the library's center of mass (edges, connections, auto-fit-to-node-bounds) is
the wrong fit and would import more risk than it removes.

---

## Appendix A — Evidence Index

| Claim | Source |
|-------|--------|
| rf is "node-based editors / interactive flow charts" | `@xyflow/react/README.md` line 11; `package.json` line 4 |
| rf depends on d3-zoom, d3-drag, zustand | README lines 129–131 |
| `NodeProps` provides `data/width/height/dragging/selected/isConnectable/positionAbsoluteX/Y` | `@xyflow/system/dist/esm/types/nodes.d.ts` `NodeProps` |
| `Node` carries `style/className/ariaRole/domAttributes` escapes | `@xyflow/react/dist/esm/types/nodes.d.ts` `Node` |
| `nodesConnectable?: boolean` exists, can disable connections | `component-props.d.ts` |
| `translateExtent`/`nodeExtent` are *node* extent, not viewport | `component-props.d.ts` |
| rf re-exports `NodeResizer`, `NodeResizeControl`, `NodeToolbar`, `MiniMap` | `plans/xyflow-api-research.md` line 26 |
| Plan 11 uses custom divs + rzpp + dnd-kit | `design.md` §1, §3.1–3.2, § component tree |
| Plan 11 fixed A4 + bounds clamp | `design.md` §6, §8.4 |
| Plan 11 already needs alignment-guide DIY | `design.md` §8.2/§8.3 |
| Plan 12 mandates `@dnd-kit/sortable` for layer panel | `12/design.md` line 517 |
| Plan 11 SWE review explicitly recommends rzpp over hand-rolled math | `design.md` line 812 |
| Plan 11 SWE review endorses bespoke as "sound for this scale" | `design.md` line 792–793 |
| rzpp has **zero runtime deps**, v4 is tree-shakeable | `rzpp.md` lines 10, 15 |
| `react-color` is unmaintained, deps-heavy | `react-color.md` lines 15, 20 |
| Inter-plan contracts mention both libs for Plans 11/12 | `INTER_PLAN_CONTRACTS.md` lines 460–461, 611–612 |
| PDF export scales 96→72 DPI; Puppeteer-based; separate render page | `INTER_PLAN_CONTRACTS.md` lines 441, 206–234 |
