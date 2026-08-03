# @pdfme v6.1.12 — Node Module Research (common, ui, schemas)

## Package Overview

The `@pdfme` ecosystem (v6.1.12) is a TypeScript-based PDF generation and template editing library. It consists of three main packages:

| Package | Purpose |
|---------|---------|
| `@pdfme/common` | Core types, schemas (Zod), validation, utilities, constants, plugin registry |
| `@pdfme/ui` | React-based UI components: Designer (template editor), Viewer (read-only), Form (fill-in) |
| `@pdfme/schemas` | Built-in schema plugins: text, image, barcode, qrcode, svg, table, signature, etc. |

Additional internal sub-packages: `@pdfme/converter` (PDF conversion utilities) and `@pdfme/pdf-lib` (forked pdf-lib for PDF manipulation).

### Architecture Overview

```
Template (JSON) → Generator/Designer/Viewer/Form → Plugin System → PDF Output
                         ↑
                    @pdfme/ui (React)
                    @pdfme/schemas (plugins)
                    @pdfme/common (types, validation, utils)
```

---

## @pdfme/common Types & Interfaces

### Core Types (from `schema.d.ts` — Zod schemas)

#### Schema (Base)
```typescript
type Schema = {
  name: string;           // Unique name per page
  type: string;           // Plugin type (e.g. 'text', 'image', 'qrcode')
  content?: string;        // Default content / base64 data
  position: { x: number; y: number };  // Position in pt from top-left
  width: number;           // Width in pt
  height: number;          // Height in pt
  rotate?: number;         // Rotation in degrees (0-360)
  opacity?: number;        // 0-1 opacity
  readOnly?: boolean;      // Read-only in editor
  required?: boolean;      // Required field in form mode
  __splitRange?: { unit: string; start: number; end?: number };  // Dynamic layout split range
  __isSplit?: boolean;     // Whether this schema is a split fragment
  // Extensible: allows extra properties for plugin-specific schema fields
}
```
> Uses `z.core.$loose` in Zod — allows arbitrary additional properties for plugin extensions.

#### SchemaForUI
```typescript
type SchemaForUI = Schema & { id: string }  // Adds unique ID for UI rendering
```

#### Template
```typescript
type Template = {
  schemas: Schema[][];     // Array of pages, each page is an array of Schema objects
  basePdf: BasePdf;        // PDF background (blank or custom PDF)
  pdfmeVersion?: string;   // @pdfme version string
}
```
> **Multi-page support**: `schemas` is an array of arrays. `schemas[0]` = page 1 schemas, `schemas[1]` = page 2, etc. Empty array `[]` = blank page.

#### BasePdf (union)
```typescript
type BasePdf = CustomPdf | BlankPdf
```

#### BlankPdf
```typescript
type BlankPdf = {
  width: number;           // Page width in pt
  height: number;          // Page height in pt
  padding: [number, number, number, number];  // [top, right, bottom, left] in pt
  staticSchema?: Schema[];  // Static schemas rendered on every page (background)
}
```

#### CustomPdf
```typescript
type CustomPdf = string | ArrayBuffer | Uint8Array
// - string: base64-encoded PDF
// - ArrayBuffer/Uint8Array: binary PDF data
```

#### Font
```typescript
type Font = Record<string, {
  data: string | ArrayBuffer | Uint8Array;  // Font file data (TTF/OTF)
  fallback?: boolean;   // Whether this is the fallback font
  subset?: boolean;      // Whether to subset the font (reduces file size)
}>
```
> Default font name: `"Roboto"`. The fallback font is used when a schema's `fontName` is not found in the Font map.

#### CustomFont
```typescript
type CustomFont = {
  data: string | ArrayBuffer | Uint8Array;
  fallback?: boolean;
  subset?: boolean;
}
```

#### Plugin
```typescript
interface Plugin<T extends Schema = Schema> {
  pdf: (arg: PDFRenderProps<T>) => Promise<void> | void;  // Renders to PDF
  ui: (arg: UIRenderProps<T>) => Promise<void> | void;    // Renders to UI (React)
  propPanel: PropPanel<T>;  // Property panel configuration for designer
  icon?: string;            // Icon for the sidebar (SVG string)
  uninterruptedEditMode?: boolean;  // Stay in edit mode after dragging
}
```

#### PropPanel
```typescript
interface PropPanel<T extends Schema = Schema> {
  schema: ((props: PropPanelSchemaBuilderProps) => Record<string, PropPanelSchema>)
    | Record<string, PropPanelSchema>;  // Property panel field definitions
  widgets?: Record<string, (props: PropPanelWidgetProps) => unknown>;  // Custom widgets
  defaultSchema: T;  // Default schema values when creating new element
}
```

#### PropPanelSchema
```typescript
type PropPanelSchema = {
  title: string;             // Label for the property
  type: 'string' | 'boolean' | 'number' | 'object' | 'array' | 'select' | 'color' | 'widget' | 'group';
  widget?: string;           // Custom widget name
  props?: Record<string, unknown>;  // Additional widget props
  span?: number;             // Grid span (1-24, Ant Design grid)
  required?: boolean;
  description?: string;
  options?: { value: string; label: string }[];  // For 'select' type
  defaultValue?: unknown;
  onChange?: (arg: { key: string; value: unknown; schema: Schema; rootElement: HTMLElement }) => void;
  onSearch?: (arg: { keyword: string; schema: Schema }) => Promise<{ label: string; value: string }[]>;
  value?: (arg: { schema: Schema; i18n: (key: string) => string }) => unknown;
  visible?: (arg: { schema: Schema; i18n: (key: string) => string }) => boolean;
  buttons?: { icon: string; key: string; onClick: (arg: { schema: Schema; value: unknown; onChange: (arg: { key: string; value: unknown }) => void }) => void }[];
}
```

#### PropPanelSchemaBuilderProps
```typescript
type PropPanelSchemaBuilderProps = {
  i18n: (key: string) => string;
}
```

#### PropPanelWidgetProps
```typescript
type PropPanelWidgetProps = {
  i18n: (key: string) => string;
  schema: Schema;
  onChange: (arg: { key: string; value: unknown }) => void;
  onClick?: (arg: { key: string; value: unknown }) => void;
  rootElement: HTMLElement;
  value: unknown;
  theme: UITheme;
}
```

#### PDFRenderProps
```typescript
interface PDFRenderProps<T extends Schema = Schema> {
  value: string;            // Content value
  schema: T;                // Schema definition
  basePdf: BasePdf;
  pdfLib: typeof import('@pdfme/pdf-lib');  // pdf-lib module
  pdfDoc: PDFDocument;      // pdf-lib document being built
  page: PDFPage;            // Current page being rendered
  options: GeneratorOptions;
  _cache: Map<string | number, unknown>;
}
```

#### UIRenderProps
```typescript
interface UIRenderProps<T extends Schema = Schema> {
  schema: T;
  basePdf: BasePdf;
  mode: Mode;               // 'viewer' | 'form' | 'designer'
  tabIndex?: number;
  placeholder?: string;
  stopEditing?: () => void;
  value: string;
  onChange?: (arg: { key: string; value: unknown }) => void;
  rootElement: HTMLDivElement;
  options: UIOptions;
  theme: UITheme;
  i18n: (key: string) => string;
  scale: number;            // Zoom scale
  _cache: Map<string | number, unknown>;
}
```

#### Mode
```typescript
type Mode = 'viewer' | 'form' | 'designer'
```

#### UIMode
Not a separate type — Mode is used directly.

#### Lang
```typescript
type Lang = 'en' | 'zh' | 'ja' | 'ko' | 'ar' | 'th' | 'pl' | 'it' | 'de' | 'es' | 'fr'
```

#### ColorType
```typescript
type ColorType = 'rgb' | 'cmyk'
```

#### Size
```typescript
type Size = { width: number; height: number }
```

#### Inputs
```typescript
type Inputs = Record<string, string>[]
// Array of records, one per page. Each record maps schema names to content values.
// e.g. [{ name: 'John', date: '2024-01-01' }, { signature: '...' }]
```

#### Plugins
```typescript
type Plugins = Record<string, Plugin>
// Key: plugin label/name, Value: Plugin instance
// e.g. { text: textPlugin, image: imagePlugin }
```

### Options Types

#### CommonOptions
```typescript
type CommonOptions = {
  font?: Font;
}
```

#### GeneratorOptions
```typescript
type GeneratorOptions = CommonOptions & {
  colorType?: ColorType;           // 'rgb' (default) or 'cmyk'
  author?: string;
  basePdfPassword?: string;        // Password for encrypted base PDF
  creationDate?: Date;
  creator?: string;
  keywords?: string[];
  lang?: Lang;
  modificationDate?: Date;
  producer?: string;
  subject?: string;
  title?: string;
}
```

#### UIOptions
```typescript
type UIOptions = CommonOptions & {
  lang?: Lang;
  labels?: Record<string, string>;   // Custom labels for UI elements
  theme?: UIOptionsTheme;
  icons?: Record<string, string>;    // Custom icon overrides (SVG strings)
  requiredByDefault?: boolean;
  maxZoom?: number;                  // Max zoom multiplier (default: 2)
  sidebarOpen?: boolean;             // Designer sidebar open state
  zoomLevel?: number;                // Initial zoom level
}
```

#### UIOptionsTheme
```typescript
type UIOptionsTheme = {
  token?: {
    colorPrimary?: string;
    colorPrimaryBg?: string;
    colorWhite?: string;
    // ... Ant Design theme tokens
  };
  components?: Record<string, Record<string, unknown>>;
}
```

#### UITheme
```typescript
type UITheme = {
  token?: { [key: string]: unknown };
  components?: Record<string, Record<string, unknown>>;
}
```
> Uses Ant Design theme system (`ThemeConfig`).

### Props Types

#### UIProps
```typescript
type UIProps = {
  template: Template;
  plugins?: Plugins;
  domContainer: HTMLElement;
  options?: UIOptions;
}
```

#### PreviewProps
```typescript
type PreviewProps = UIProps & {
  inputs: Inputs;
}
```

#### DesignerProps
```typescript
type DesignerProps = UIProps  // No inputs field
```

#### GenerateProps
```typescript
type GenerateProps = {
  template: Template;
  plugins?: Plugins;
  inputs: Inputs;
  options?: GeneratorOptions;
}
```

### Plugin Registry Types

#### PluginRegistry
```typescript
interface PluginRegistry {
  plugins: Record<string, Plugin>;
  exists: () => boolean;
  values: () => Plugin[];
  entries: () => [string, Plugin][];
  findByType: (type: string) => Plugin | undefined;
  findWithLabelByType: (type: string) => [string, Plugin | undefined];
}
```

### Dynamic Layout Types

#### DynamicLayoutSplitRange
```typescript
type DynamicLayoutSplitRange = { unit: string; start: number; end?: number }
```

#### DynamicLayoutRange
```typescript
type DynamicLayoutRange = { unit: string; start: number; end: number }
```

#### DynamicLayoutArgs
```typescript
type DynamicLayoutArgs = {
  value: string;
  schema: Schema;
  basePdf: BasePdf;
  options: GeneratorOptions;
  _cache: Map<string | number, unknown>;
}
```

#### DynamicLayoutCallbackResult
```typescript
type DynamicLayoutCallbackResult = {
  heights: number[];
  schemasWithSplitRange: Schema[];
}
```

#### SchemaPageArray
```typescript
type SchemaPageArray = Schema[][]
```

### Misc Types

#### Dict
```typescript
type Dict = Record<string, string>  // i18n dictionary
```

#### ChangeSchemas
```typescript
type ChangeSchemas = (args: { key: string; value: unknown; schemaId: string }[]) => void
```

#### GenerateReport
Not defined as a named export. The generator module (`@pdfme/generator`) handles PDF generation but is not in the researched packages.

---

## @pdfme/common Functions

### Utility Functions (from `helper.d.ts`)

#### Clone & Validation
```typescript
cloneDeep<T>(value: T): T                              // Deep clone
getFallbackFontName(font: Font): string                 // Get fallback font name
getDefaultFont(): Font                                   // Get built-in default font (Roboto)
checkFont(arg: { font?: Font; template: Template }): void
checkPlugins(arg: { plugins: Plugins; template: Template }): void
checkInputs(data: { inputs: Inputs; template: Template }): void
checkTemplate(template: Template): void
checkUIOptions(data: { options: UIOptions }): void
checkPreviewProps(data: PreviewProps): void
checkDesignerProps(data: DesignerProps): void
checkUIProps(data: UIProps): void
checkGenerateProps(data: GenerateProps): void
```

#### Unit Conversions
```typescript
mm2pt(mm: number): number     // Millimeters → points
pt2mm(pt: number): number     // Points → millimeters
pt2px(pt: number): number     // Points → pixels
px2mm(px: number): number     // Pixels → millimeters
```

#### Color Validation
```typescript
isHexValid(hex: string): boolean
```

#### Template Operations
```typescript
migrateTemplate(template: Template): void               // Migrate legacy keyed format → array format
getInputFromTemplate(template: Template): Record<string, string>[]  // Extract input skeleton
getDynamicTemplate(arg: {
  template: Template;
  options: GeneratorOptions;
  _cache: Map<string | number, unknown>;
}): Promise<Template>                                    // Process dynamic heights
```

#### PDF / Base64 Operations
```typescript
getB64BasePdf(customPdf: CustomPdf): Promise<string>     // Get base64 from CustomPdf
isBlankPdf(basePdf: BasePdf): basePdf is BlankPdf        // Type guard
b64toUint8Array(base64: string): Uint8Array              // Base64 → Uint8Array
```

#### URL / Link Operations
```typescript
isUrlSafeToFetch(urlString: string): boolean
normalizeSafeLinkUri(uri: string): string | undefined
getInternalLinkTarget(href: string): string | undefined
normalizeInternalLinkHref(href: string): string | undefined
normalizeLinkHref(href: string): string | undefined
resetInternalLinkAnnotations(_cache: Map<string | number, unknown>): void
registerInternalLinkAnchor(arg: {
  pdfDoc: PDFDocument; page: PDFPage; _cache: Map;
  type: string; ...
}): void
registerInternalLinkAnnotation(arg: {
  _cache: Map; ...
}): void
applyInternalLinkAnnotations(arg: {
  pdfDoc: PDFDocument; _cache: Map; ...
}): void
```

#### Page Size Operations
```typescript
detectPaperSize(width: number, height: number, tolerance?: number): string | null
resolvePageSize(size?: string, orientation?: 'portrait' | 'landscape'): Size
```

#### Expression / Placeholder Replacement
```typescript
replacePlaceholders(arg: {
  content: string;
  variables: Record<string, unknown>;
  schemas: SchemaPageArray;
}): string
```

#### Dynamic Layout
```typescript
createDynamicLayoutSplitRange(unit: string, start: number, end?: number): DynamicLayoutSplitRange
getDynamicLayoutSplitRange(schema: Schema, unit: string): DynamicLayoutRange | undefined
```

#### Plugin Registry
```typescript
pluginRegistry(plugins: Plugins): PluginRegistry
```

### Constants (from `constants.d.ts`)

| Constant | Value | Description |
|----------|-------|-------------|
| `PDFME_VERSION` | `"6.1.12"` | Current @pdfme version |
| `PT_TO_PX_RATIO` | `1.333` | Points → pixels ratio |
| `PT_TO_MM_RATIO` | `0.3528` | Points → mm ratio |
| `MM_TO_PT_RATIO` | `2.8346` | mm → points ratio |
| `ZOOM` | ~3.78 | Base zoom factor |
| `DEFAULT_FONT_NAME` | `"Roboto"` | Default font key name |
| `BLANK_A4_PDF` | `{width: 595.28, height: 841.89, padding: [0,0,0,0]}` | Blank A4 PDF (BlankPdf) |
| `CUSTOM_A4_PDF` | base64 string | Base64-encoded A4 PDF |
| `BLANK_PDF` | base64 string | **@deprecated** — Use `BLANK_A4_PDF` or `CUSTOM_A4_PDF` instead |

### Page Size Presets (from `pageSize.d.ts`)

```typescript
PAGE_SIZE_PRESETS  // Record<string, Size> — all presets in mm
```

Supported presets (all in mm, portrait):
- **A3**: 297×420
- **A4**: 210×297
- **A5**: 148×210
- **A6**: 105×148
- **B4**: 250×353
- **B5**: 176×250
- **B6**: 125×176
- **Letter**: 215.9×279.4
- **Legal**: 215.9×355.6
- **Tabloid**: 279.4×431.8

Functions:
- `detectPaperSize(width, height, tolerance?)` — Detect paper size name from dimensions
- `resolvePageSize(size?, orientation?)` — Resolve to `{width, height}` from preset name

---

## @pdfme/ui — Designer Class

### Class Hierarchy
```
BaseUIClass (abstract)
  ├── Designer extends BaseUIClass
  └── PreviewUI (abstract)
        ├── Viewer extends PreviewUI
        └── Form extends PreviewUI
```

### BaseUIClass (abstract base — from `class.d.ts`)
```typescript
abstract class BaseUIClass {
  constructor(props: UIProps);

  // Getters
  getLang(): Lang;
  getFont(): Font;
  getPluginsRegistry(): PluginRegistry;
  getOptions(): UIOptions;
  getTemplate(): Template;

  // Mutations
  updateTemplate(template: Template): void;
  updateOptions(options: UIOptions): void;

  // Lifecycle
  destroy(): void;
  protected mount(renderFunc: () => React.ReactNode): void;

  // Abstract
  abstract render(): React.ReactNode;
}
```

### Designer Class (from `Designer.d.ts`)

#### Constructor
```typescript
new Designer(props: DesignerProps): Designer
// DesignerProps = { template, plugins?, domContainer, options? }
```

#### Methods
```typescript
class Designer extends BaseUIClass {
  // Template operations
  saveTemplate(): Template                 // Save current template state
  
  // Selection operations
  getSelection(): DesignerSelection       // Current selection info
  getSelectedSchemas(): SchemaForUI[]      // Currently selected schema objects
  selectSchemas(
    targets: DesignerSchemaSelectionTarget[],
    options?: DesignerSelectSchemasOptions
  ): void                                  // Programmatically select schemas

  // Page navigation
  getPageCursor(): number                  // Current page index (0-based)
  getTotalPages(): number                  // Total number of pages
}
```

Inherited from BaseUIClass: `getLang()`, `getFont()`, `getPluginsRegistry()`, `getOptions()`, `getTemplate()`, `updateTemplate()`, `updateOptions()`, `destroy()`.

#### Event Handlers
```typescript
// Register callbacks:
onSaveTemplate(cb: (template: Template) => void): void     // Called on save (Ctrl+S / save button)
onChangeTemplate(cb: (template: Template) => void): void   // Called on any template change
onPageChange(cb: (page: number) => void): void             // Called when current page index changes
onChangeSelection(cb: (selection: DesignerSelection) => void): void  // Called when selection changes
```

#### Available Options (via `options` in constructor)
```typescript
UIOptions = {
  font?: Font;                    // Custom fonts
  lang?: Lang;                    // UI language (default: 'en')
  labels?: Record<string, string>;  // Custom labels
  theme?: UIOptionsTheme;         // Ant Design theme tokens
  icons?: Record<string, string>; // Custom icon SVGs
  requiredByDefault?: boolean;    // All new schemas required by default
  maxZoom?: number;               // Max zoom (default: 2)
  sidebarOpen?: boolean;          // Sidebar open state
  zoomLevel?: number;             // Initial zoom level
}
```

### Designer Selection Types (from `designerSelection.d.ts`)

#### DesignerSelection
```typescript
type DesignerSelection = {
  bounds: DesignerSelectionBounds | null;  // Bounding box of selection
  pageIndex: number;                       // Page index (0-based)
  schemas: DesignerSelectedSchema[];        // Selected schema details
}
```

#### DesignerSelectedSchema
```typescript
type DesignerSelectedSchema = {
  name: string;
  pageIndex: number;
  schema: Schema;
  schemaId: string;
  schemaIndex: number;
  type: string;
}
```

#### DesignerSelectionBounds
```typescript
type DesignerSelectionBounds = {
  height: number;
  width: number;
  x: number;
  y: number;
}
```

#### DesignerSchemaSelectionTarget
```typescript
type DesignerSchemaSelectionTarget = string | {
  name?: string;
  pageIndex?: number;
  schemaId?: string;
  schemaIndex?: number;
}
```

#### DesignerSelectSchemasOptions
```typescript
type DesignerSelectSchemasOptions = {
  pageIndex?: number;
  scroll?: boolean;  // Scroll to the selection
}
```

### UI Constants (from `constants.d.ts`)

| Constant | Value | Description |
|----------|-------|-------------|
| `DEFAULT_LANG` | `"en"` | Default UI language |
| `DESTROYED_ERR_MSG` | `"[@pdfme/ui] this instance is already destroyed"` | Error message |
| `SELECTABLE_CLASSNAME` | `"selectable"` | CSS class for selectable elements |
| `RULER_HEIGHT` | `30` | Ruler height in px |
| `PAGE_GAP` | `10` | Gap between pages in px |
| `LEFT_SIDEBAR_WIDTH` | `45` | Left sidebar width in px |
| `RIGHT_SIDEBAR_WIDTH` | `400` | Right sidebar (property panel) width in px |
| `BACKGROUND_COLOR` | `"rgb(74, 74, 74)"` | Editor background color |
| `DEFAULT_MAX_ZOOM` | `2` | Default max zoom |
| `DESIGNER_CLASSNAME` | `"pdfme-designer-"` | CSS prefix for Designer |
| `UI_CLASSNAME` | `"pdfme-ui-"` | CSS prefix for Viewer/Form |

### UI Helper Functions (from `helper.d.ts`)

```typescript
uuid(): string                                                     // Generate UUID
debounce<T>(cb: T, wait?: number): T                              // Debounce function
round(number: number, precision: number): number                   // Round number
flatten<T>(arr: T[][]): T[]                                        // Flatten 2D array
initShortCuts(arg: {                                                // Register keyboard shortcuts
  move: (cmd: "up"|"down"|"left"|"right", isShift: boolean) => void;
  remove: () => void; esc: () => void;
  copy: () => void; paste: () => void;
  redo: () => void; undo: () => void;
  save: () => void; selectAll: () => void;
}): void
destroyShortCuts(): void
arrayBufferToBase64(arrayBuffer: ArrayBuffer): string
template2SchemasList(template: Template): Promise<SchemaForUI[][]>   // Template → UI schema list
schemasList2template(schemasList: SchemaForUI[][], basePdf: BasePdf): Template
getUniqueSchemaName(arg: {
  copiedSchemaName: string;
  schema: SchemaForUI[];
  stackUniqueSchemaNames: string[];
}): string
moveCommandToChangeSchemasArg(props: {
  command: "up"|"down"|"left"|"right";
  activeSchemas: SchemaForUI[];
  isShift: boolean;
  pageSize: Size;
}): { key: string; value: number; schemaId: string }[]
getPagesScrollTopByIndex(pageSizes: Size[], index: number, scale: number): number
changeSchemas(args: {
  objs: { key: string; value: unknown; schemaId: string }[];
  schemas: SchemaForUI[];
  basePdf: BasePdf;
  pluginsRegistry: PluginRegistry;
  pageSize: Size;
  commitSchemas: (newSchemas: SchemaForUI[]) => void;
}): void
getDynamicHeightReflowChanges(args: {
  schemas: SchemaForUI[];
  schema: SchemaForUI;
  height: unknown;
}): { key: string; value: unknown; schemaId: string }[]
useMaxZoom(): number
setFontNameRecursively(obj: Record<string, unknown>, fontName: string, seen?: WeakSet): void
```

#### Zoom Helpers
```typescript
type ZoomMode = 'manual' | 'fit-width' | 'fit-height'
type ZoomAnchor = { pageIndex: number; localX: number; localY: number; clientX: number; clientY: number }
MIN_ZOOM = 0.25
clampZoomLevel(zoomLevel: number, maxZoom: number, minZoom?: number): number
getFitZoomLevel(arg: { mode, pageSize, container, baseScale, maxZoom, hasRulers? }): number
getZoomAnchor(arg: { pageIndex, paper, clientX, clientY, scale }): ZoomAnchor | null
restoreZoomAnchor(arg: { container, paper, anchor, scale }): void
```

### UI Hooks (from `hooks.d.ts`)

```typescript
usePrevious<T>(value: T): T | null
useUIPreProcessor(props: {
  template: Template; size: Size; zoomLevel: number; maxZoom: number;
}): {
  backgrounds: string[];
  pageSizes: Size[];
  baseScale: number;
  scale: number;
  error: Error | null;
  refresh: (template: Template) => Promise<void>;
}
useZoom(props: {
  baseScale: number; maxZoom: number; pageCursor: number;
  pageSizes: Size[]; containerRef; paperRefs; size: Size;
  hasRulers?: boolean; initialZoomLevel?: number; onZoomCommit?: () => void;
}): {
  displayScale: number; renderScale: number; zoomLevel: number;
  zoomMode: ZoomMode; setZoomLevel: (next: number) => void;
  fitWidth: () => void; fitHeight: () => void;
}
useScrollPageCursor(props: {
  ref; paperRefs; pageSizes: Size[]; scale: number;
  pageCursor: number; onChangePageCursor: (page: number) => void;
}): void
useMountStatus(): boolean
useInitEvents(params: UseInitEventsParams): void
```

### React Contexts (from `contexts.d.ts`)
```typescript
I18nContext: React.Context<(key: string, dict?: Dict) => string>
FontContext: React.Context<Font>
PluginsRegistry: React.Context<PluginRegistry>
OptionsContext: React.Context<UIOptions>
CacheContext: React.Context<Map<string | number, unknown>>
```

### Shortcuts (Designer keyboard shortcuts)
The `initShortCuts` function registers the following keyboard shortcuts:
- **Arrow keys**: Move selected schema(s)
- **Shift + Arrow**: Move by larger increment
- **Delete/Backspace**: Remove selected schema(s)
- **Escape**: Deselect
- **Ctrl/Cmd + C**: Copy
- **Ctrl/Cmd + V**: Paste
- **Ctrl/Cmd + Z**: Undo
- **Ctrl/Cmd + Shift + Z / Ctrl+Y**: Redo
- **Ctrl/Cmd + S**: Save template
- **Ctrl/Cmd + A**: Select all

---

## @pdfme/ui — Viewer Class

### Viewer Class (from `Viewer.d.ts`)

#### Constructor
```typescript
new Viewer(props: PreviewProps): Viewer
// PreviewProps = { template, plugins?, domContainer, options?, inputs }
```

#### Methods
```typescript
class Viewer extends PreviewUI {
  // Inherited from BaseUIClass:
  getLang(): Lang
  getFont(): Font
  getPluginsRegistry(): PluginRegistry
  getOptions(): UIOptions
  getTemplate(): Template
  updateTemplate(template: Template): void
  updateOptions(options: UIOptions): void
  destroy(): void

  // Inherited from PreviewUI:
  getInputs(): Inputs
  setInputs(inputs: Inputs): void

  // Viewer-specific:
  getPageCursor(): number
  getTotalPages(): number
}
```

#### Event Handlers
```typescript
onPageChange(cb: (page: number) => void): void
```

#### Notes
- Viewer is **read-only** — users cannot edit fields or fill in forms.
- Used for preview/display of templates with filled data.
- Supports `inputs` for displaying content.

---

## @pdfme/ui — Form Class

### Form Class (from `Form.d.ts`)

#### Constructor
```typescript
new Form(props: PreviewProps): Form
// PreviewProps = { template, plugins?, domContainer, options?, inputs }
```

#### Methods
```typescript
class Form extends PreviewUI {
  // Inherited from BaseUIClass:
  getLang(): Lang
  getFont(): Font
  getPluginsRegistry(): PluginRegistry
  getOptions(): UIOptions
  getTemplate(): Template
  updateTemplate(template: Template): void
  updateOptions(options: UIOptions): void
  destroy(): void

  // Inherited from PreviewUI:
  getInputs(): Inputs
  setInputs(inputs: Inputs): void

  // Form-specific:
  getPageCursor(): number
  getTotalPages(): number
}
```

#### Event Handlers
```typescript
onChangeInput(cb: (arg: { index: number; value: string; key: string }) => void): void
onPageChange(cb: (page: number) => void): void
```

#### Notes
- Form mode allows users to **fill in** form fields.
- Non-readOnly schemas become editable inputs.
- `onChangeInput` fires when a user edits a field.
- `inputs` parameter provides default values for form fields.
- `required` schemas show validation indicators.

---

## @pdfme/schemas — Built-in Schema Types

### Exported Plugins (from `index.d.ts`)

```typescript
// Built-in plugins exported from @pdfme/schemas:
import {
  text,
  multiVariableText,
  list,
  image,
  signature,
  svg,
  table,
  barcodes,
  line,
  rectangle,
  ellipse,
  dateTime,
  date,
  time,
  select,
  radioGroup,
  checkbox,
  circleMark,
} from '@pdfme/schemas'
```

### Schema Type Definitions

#### TextSchema (from `text/types.d.ts`)
```typescript
type TextSchema = Schema & {
  fontName?: string;
  textFormat?: 'plain' | 'inline-markdown';  // Default: 'plain'
  fontVariants?: {
    bold?: { data: string | ArrayBuffer | Uint8Array; fallback?: boolean };
    italic?: { data: string | ArrayBuffer | Uint8Array; fallback?: boolean };
    boldItalic?: { data: string | ArrayBuffer | Uint8Array; fallback?: boolean };
    code?: { data: string | ArrayBuffer | Uint8Array; fallback?: boolean };
  };
  fontVariantFallback?: 'synthetic' | 'plain' | 'error';
  alignment: 'left' | 'center' | 'right' | 'justify';
  verticalAlignment: 'top' | 'middle' | 'bottom';
  fontSize: number;
  lineHeight: number;
  strikearrothrough?: boolean;
  underline?: boolean;
  characterSpacing: number;
  dynamicFontSize?: {
    min: number;
    max: number;
    fit: 'horizontal' | 'vertical';
  };
  overflow?: 'visible' | 'expand';
  fontColor: string;         // Hex color
  backgroundColor: string;   // Hex color
  borderColor?: string;       // Hex color
  borderWidth?: BoxDimension; // Border width per side
  padding?: BoxDimension;     // Padding per side
}

type BoxDimension = { top: number; right: number; bottom: number; left: number }
```

**Text inline-markdown support**: When `textFormat: 'inline-markdown'`, supports:
- `**bold**` → bold text
- `*italic*` → italic text
- `***bold+italic***` → bold italic
- `~~strikethrough~~` → strikethrough
- `__underline__` → underline
- `[text](url)` → hyperlinks
- `# Heading` → heading (not confirmed)

#### BarcodeSchema (from `barcodes/types.d.ts`)
```typescript
type BarcodeSchema = Schema & {
  type: BarcodeTypes;  // One of BARCODE_TYPES
  backgroundColor: string;  // Hex color
  barColor: string;          // Hex color (bar color)
  textColor?: string;        // Hex color (text below barcode)
  includetext?: boolean;     // Include human-readable text
}

type BarcodeTypes = (typeof BARCODE_TYPES)[number]
```

#### ImageSchema (from `graphics/image.d.ts`)
```typescript
type ImageSchema = Schema  // No extra properties — content holds base64 image data
// Supports: PNG, JPEG images via base64 content
```

#### SVGSchema (from `graphics/svg.d.ts`)
```typescript
type SVGSchema = Schema  // No extra properties — content holds SVG XML string
```

#### SignatureSchema (from `graphics/signature.d.ts`)
```typescript
type SignatureSchema = Schema  // No extra properties — content holds signature image/data
// Renders a drawable signature pad in form mode
```

#### LineSchema (from `shapes/line.d.ts`)
```typescript
type LineSchema = Schema & {
  color: string;  // Hex color — line color
}
```

#### ShapeSchema (from `shapes/rectAndEllipse.d.ts`)
```typescript
type ShapeSchema = Schema & {
  type: 'ellipse' | 'rectangle';
  borderWidth: number;
  borderColor: string;  // Hex color
  color: string;        // Hex color (fill color)
  radius?: number;      // Corner radius (rectangle only)
}
```

#### BoxSchema (from `box.d.ts`)
```typescript
type BoxSchema = Schema & {
  lineWidth: number;
  borderColor: string;
  innerColor: string;
}
```

#### TableSchema (from `tables/types.d.ts`)
```typescript
type CellStyle = {
  fontSize: number;
  alignment: 'left' | 'center' | 'right';  // Text alignment within cell
  verticalAlignment: 'top' | 'middle' | 'bottom';
  lineHeight: number;
  characterSpacing?: number;
  fontName?: string;
  fontVariants?: { /* same as TextSchema fontVariants */ };
  fontVariantFallback?: 'synthetic' | 'plain' | 'error';
  fontColor: string;
  backgroundColor: string;
  padding: BoxDimension;
  borderColor?: string;
  borderWidth?: BoxDimension;
}

type TableSchema = Schema & {
  showHead: boolean;
  head: string[];
  headWidthPercentages: number[];
  repeatHead?: boolean;
  tableStyles: { borderColor: string; borderWidth: number };
  headStyles: CellStyle;
  bodyStyles: CellStyle & { alternateBackgroundColor: string };
  columnStyles: {
    alignment?: Record<number, 'left' | 'center' | 'right'>;
  };
}
```

#### MultiVariableTextSchema (from `multiVariableText/types.d.ts`)
```typescript
type MultiVariableTextSchema = TextSchema & {
  text: string;      // Template text with {variable} placeholders
  variables: string[];  // Available variable names
}
```

#### ListSchema (from `list/types.d.ts`)
```typescript
type ListSchema = TextSchema & {
  listStyle: 'bullet' | 'ordered';
  markerWidth: number;
  markerGap: number;
  indentSize?: number;
  itemSpacing: number;
}
```

#### DateSchema (from `date/types.d.ts`)
```typescript
type DateSchema = Schema & {
  format: string;        // Date format string (e.g. 'yyyy-mm-dd')
  fontName?: string;
  alignment: 'left' | 'center' | 'right';
  fontSize: number;
  characterSpacing: number;
  fontColor: string;
  backgroundColor: string;
  locale?: string;
}
```

#### TimeSchema (from `time/types.d.ts`)
```typescript
type TimeSchema = Schema & {
  format: string;        // Time format string
  fontName?: string;
  alignment: 'left' | 'center' | 'right';
  fontSize: number;
  lineHeight: number;
  characterSpacing: number;
  fontColor: string;
  backgroundColor: string;
}
```

#### DateTimeSchema (from `dateTime/types.d.ts`)
```typescript
type DateTimeSchema = Schema & {
  format: string;        // DateTime format string
  fontName?: string;
  alignment: 'left' | 'center' | 'right';
  fontSize: number;
  lineHeight: number;
  characterSpacing: number;
  fontColor: string;
  backgroundColor: string;
}
```

#### SelectSchema (from `select/types.d.ts`)
```typescript
type SelectSchema = TextSchema & {
  options: string[];  // Available options for dropdown
}
```

#### RadioGroupSchema (from `radioGroup/types.d.ts`)
```typescript
type RadioGroupSchema = Schema & {
  group: string;   // Radio group identifier
  color: string;   // Hex color for radio button
}
```

#### CheckboxSchema (from `checkbox/types.d.ts`)
```typescript
type CheckboxSchema = Schema & {
  color: string;  // Hex color for check mark
}
```

#### CircleMarkSchema (from `circleMark/types.d.ts`)
```typescript
type CircleMarkSchema = Schema & {
  color: string;      // Hex color
  borderWidth: number;
}
```

### Barcode Types (from `barcodes/constants.d.ts`)

```typescript
const BARCODE_TYPES = [
  'qrcode',
  'japanpost',
  'ean13',
  'ean8',
  'code39',
  'code128',
  'nw7',
  'itf14',
  'upca',
  'upce',
  'gs1datamatrix',
  'pdf417',
] as const
```

**12 supported barcode formats**:
| Type | Description |
|------|-------------|
| `qrcode` | QR Code (2D) |
| `japanpost` | Japan Post barcode |
| `ean13` | EAN-13 (13-digit ISBN/product) |
| `ean8` | EAN-8 (8-digit) |
| `code39` | Code 39 (alphanumeric) |
| `code128` | Code 128 (full ASCII) |
| `nw7` | NW-7 / Codabar |
| `itf14` | ITF-14 (Interleaved 2 of 5, 14-digit) |
| `upca` | UPC-A (12-digit product) |
| `upce` | UPC-E (compressed UPC) |
| `gs1datamatrix` | GS1 DataMatrix (2D) |
| `pdf417` | PDF417 (2D, high capacity) |

### Dynamic Layout Split Units (from `splitRange.d.ts`)

```typescript
BUILT_IN_DYNAMIC_LAYOUT_SPLIT_UNITS = {
  tableBody: "tableBody",
  listItem: "listItem",
  textLine: "textLine",
}

// Helper functions:
createTableBodySplitRange(start: number, end?: number): DynamicLayoutSplitRange
createListItemSplitRange(start: number, end?: number): DynamicLayoutSplitRange
createTextLineSplitRange(start: number, end?: number): DynamicLayoutSplitRange
getTableBodyRange(schema: Schema): DynamicLayoutRange | undefined
getListItemRange(schema: Schema): DynamicLayoutRange | undefined
getTextLineRange(schema: Schema): DynamicLayoutRange | undefined

// Dynamic layout helpers:
isDynamicLayoutSchema(schema: Schema): boolean
getDynamicLayoutForSchema(value: string, args: DynamicLayoutArgs): Promise<DynamicLayoutCallbackResult>
getDynamicHeightsForTable(value: string, args: DynamicLayoutArgs): Promise<number[]>
getDynamicLayoutForTable(value: string, args: DynamicLayoutArgs): Promise<DynamicLayoutCallbackResult>
getDynamicLayoutForList(value: string, args: DynamicLayoutArgs): Promise<DynamicLayoutCallbackResult>
```

### Text Extra Formatters (from `text/extraFormatter.d.ts`)

```typescript
enum Formatter {
  STRIKETHROUGH = "strikethrough",
  UNDERLINE = "underline",
  ALIGNMENT = "alignment",
  VERTICAL_ALIGNMENT = "verticalAlignment"
}

getExtraFormatterSchema(i18n: (key: string) => string): {
  title: string; widget: string; buttons: GroupButton[]; span: number;
}
```

---

## Template Model

### Structure
```typescript
type Template = {
  schemas: Schema[][];  // Pages array
  basePdf: BasePdf;     // Background PDF
  pdfmeVersion?: string;
}
```

### Multi-Page Templates

```typescript
// Example: 2-page certificate template
const template: Template = {
  basePdf: BLANK_A4_PDF,  // or CUSTOM_A4_PDF, or custom base64/binary
  schemas: [
    // Page 1
    [
      {
        name: 'certificate_title',
        type: 'text',
        position: { x: 100, y: 50 },
        width: 400,
        height: 40,
        content: 'Certificate of Achievement',
        // TextSchema properties:
        fontSize: 36,
        alignment: 'center',
        verticalAlignment: 'middle',
        lineHeight: 1,
        characterSpacing: 0,
        fontColor: '#000000',
        backgroundColor: '#ffffff00',  // transparent
      },
      {
        name: 'recipient_name',
        type: 'text',
        position: { x: 150, y: 200 },
        width: 300,
        height: 30,
        content: '',
        fontSize: 24,
        alignment: 'center',
        // ...
      },
    ],
    // Page 2
    [
      {
        name: 'signature',
        type: 'signature',
        position: { x: 100, y: 700 },
        width: 200,
        height: 80,
      },
    ],
  ],
}
```

### Legacy Template Migration

Pre-v6 templates used keyed objects instead of arrays:
```typescript
// Legacy format (pre-v6):
{ schemas: { 'field1': {...}, 'field2': {...} } }

// v6 format:
{ schemas: [ [{...}, {...}], [{...}] ] }
```

Use `migrateTemplate(template: Template): void` to migrate old templates.

### BlankPdf vs CustomPdf

**BlankPdf**: Define page dimensions and padding explicitly:
```typescript
const blankPdf: BlankPdf = {
  width: 595.28,   // A4 width in pt (210mm)
  height: 841.89,  // A4 height in pt (297mm)
  padding: [40, 40, 40, 40],  // [top, right, bottom, left]
  staticSchema: [],  // Optional background schemas
}
```

**CustomPdf**: Use an existing PDF as background:
```typescript
const customPdf: CustomPdf = 'data:application/pdf;base64,JVBERi0xLjQ...'  // base64
// Or:
const customPdf: CustomPdf = new ArrayBuffer(...)  // binary PDF data
```

### Position & Dimensions

All positions are in **points (pt)** from the top-left corner:
- `position.x`: Horizontal distance from left edge
- `position.y`: Vertical distance from top edge
- `width`: Element width in pt
- `height`: Element height in pt
- `rotate`: Rotation in degrees (clockwise)
- `opacity`: 0–1 (0 = fully transparent, 1 = fully opaque)

### Input Model

Inputs are arrays of records, one per page:
```typescript
// inputs[0] = page 1 values, inputs[1] = page 2, etc.
const inputs: Inputs = [
  { certificate_title: 'Certificate of Achievement', recipient_name: 'John Doe' },
  { signature: '...' },
]
```

Each record maps `schema.name` → content value.

---

## Schema Model

### Base Schema Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | ✅ Yes | Unique identifier per page (duplicate names within page cause conflicts) |
| `type` | `string` | ✅ Yes | Plugin type key (e.g. `'text'`, `'image'`, `'qrcode'`) |
| `position` | `{x: number, y: number}` | ✅ Yes | Position from top-left in pt |
| `width` | `number` | ✅ Yes | Width in pt |
| `height` | `number` | ✅ Yes | Height in pt |
| `content` | `string` | ❌ Optional | Default content (text, base64 image, SVG XML) |
| `rotate` | `number` | ❌ Optional | Rotation in degrees (default: 0) |
| `opacity` | `number` | ❌ Optional | 0–1 opacity (default: 1) |
| `readOnly` | `boolean` | ❌ Optional | Read-only in designer (default: false) |
| `required` | `boolean` | ❌ Optional | Required in form mode (default: false) |
| `__splitRange` | `{unit, start, end?}` | ❌ Optional | Dynamic layout split range metadata |
| `__isSplit` | `boolean` | ❌ Optional | Whether this is a dynamic split fragment |

### SchemaForUI

Adds `id: string` — a unique UUID for DOM element identification in the UI.

### Plugin Extension Pattern

Schemas are extensible via plugin-specific properties. The base `Schema` type uses Zod's `z.core.$loose` to allow arbitrary additional properties. For example:

```typescript
// TextSchema extends Schema with text-specific properties:
type TextSchema = Schema & {
  fontSize: number;
  alignment: 'left' | 'center' | 'right' | 'justify';
  // ... more text properties
}
```

### Creating New Schema Elements

In the Designer, new schemas are created from the plugin's `propPanel.defaultSchema`:
```typescript
// Each plugin defines defaultSchema:
const textPlugin: Plugin<TextSchema> = {
  // ...
  propPanel: {
    defaultSchema: {
      name: 'text',
      type: 'text',
      position: { x: 0, y: 0 },
      width: 100,
      height: 20,
      content: '',
      fontSize: 14,
      alignment: 'left',
      verticalAlignment: 'top',
      lineHeight: 1,
      characterSpacing: 0,
      fontColor: '#000000',
      backgroundColor: '#ffffff00',
    },
    schema: { /* property panel configuration */ },
  },
  pdf: async (arg) => { /* render to PDF */ },
  ui: async (arg) => { /* render to DOM */ },
}
```

---

## Plugin System

### Plugin Interface

```typescript
interface Plugin<T extends Schema = Schema> {
  pdf: (arg: PDFRenderProps<T>) => Promise<void> | void;   // PDF rendering
  ui: (arg: UIRenderProps<T>) => Promise<void> | void;     // UI rendering
  propPanel: PropPanel<T>;                                  // Designer property panel
  icon?: string;                                            // SVG icon for sidebar
  uninterruptedEditMode?: boolean;                          // Keep edit mode after drag
}
```

### How Plugins Work

1. **PDF rendering** (`pdf` method): Called by the generator when rendering to PDF. Receives `PDFRenderProps` with the pdf-lib document and page. The plugin draws its content onto the PDF page.

2. **UI rendering** (`ui` method): Called by Designer/Viewer/Form when rendering to the DOM. Receives `UIRenderProps` with the root HTMLDivElement. The plugin renders a React component or DOM elements into the container.

3. **Property panel** (`propPanel`): Defines what controls appear in the right sidebar of the Designer when a schema is selected. Each field can be a string, boolean, number, color picker, dropdown, or custom widget.

### Creating a Custom Plugin

```typescript
import { type Plugin, type Schema, type PropPanel } from '@pdfme/common'

// 1. Define schema type (extends Schema)
type CustomSchema = Schema & {
  fillColor: string
  text: string
}

// 2. Define default schema
const defaultSchema: CustomSchema = {
  name: 'custom',
  type: 'custom',
  position: { x: 0, y: 0 },
  width: 100,
  height: 50,
  content: '',
  fillColor: '#ff0000',
  text: 'Hello',
}

// 3. Define prop panel
const propPanel: PropPanel<CustomSchema> = {
  defaultSchema,
  schema: {
    fillColor: { title: 'Fill Color', type: 'color' },
    text: { title: 'Text', type: 'string' },
  },
}

// 4. Create plugin
const customPlugin: Plugin<CustomSchema> = {
  pdf: async (arg) => {
    // Draw on PDF using arg.pdfLib, arg.page, arg.schema
    const { pdfLib, page, schema } = arg
    page.drawRectangle({
      x: schema.position.x,
      y: page.getHeight() - schema.position.y - schema.height,
      width: schema.width,
      height: schema.height,
      color: pdfLib.rgbFromHex((schema as CustomSchema).fillColor),
    })
  },
  ui: async (arg) => {
    // Render DOM element into arg.rootElement
    const { schema, rootElement } = arg
    rootElement.innerHTML = `<div style="background:${(schema as CustomSchema).fillColor}">${arg.value}</div>`
  },
  propPanel,
  icon: '<svg>...</svg>',
}

// 5. Register plugin in Designer/Viewer/Form
import { Designer } from '@pdfme/ui'
const designer = new Designer({
  domContainer: document.getElementById('container')!,
  template,
  plugins: { custom: customPlugin },
  options: { /* ... */ },
})
```

### Plugin Registry

Plugins are passed to the UI classes as a `Plugins` record:
```typescript
type Plugins = Record<string, Plugin>
// Key: plugin label/name, Value: Plugin instance
```

The `pluginRegistry` function wraps this into a `PluginRegistry` for lookups:
```typescript
const registry = pluginRegistry(plugins)
registry.findByType('text')       // Find plugin by type string
registry.findWithLabelByType('text')  // Find with label
registry.values()                 // All plugins
registry.entries()                // [label, plugin] pairs
```

### Using Built-in Plugins

```typescript
import { text, image, barcodes, svg, table, signature } from '@pdfme/schemas'
import { Designer } from '@pdfme/ui'

const plugins = {
  text,
  image,
  qrcode: barcodes,  // Note: barcodes plugin handles all barcode types
  svg,
  table,
  signature,
}

const designer = new Designer({
  domContainer,
  template,
  plugins,
  options: { font },
})
```

---

## Font Management

### Font Type
```typescript
type Font = Record<string, {
  data: string | ArrayBuffer | Uint8Array  // TTF/OTF font data
  fallback?: boolean       // Is this the fallback font?
  subset?: boolean         // Subset the font? (reduces PDF size)
}>
```

### Default Font

The built-in default font is **Roboto**:
```typescript
import { getDefaultFont, DEFAULT_FONT_NAME } from '@pdfme/common'

const defaultFont = getDefaultFont()
// { Roboto: { data: '...', fallback: true, subset: true } }
const defaultFontName = DEFAULT_FONT_NAME  // "Roboto"
```

### Loading Custom Fonts

```typescript
import { type Font } from '@pdfme/common'

// Load font from a URL (fetch + ArrayBuffer)
const font: Font = {
  Roboto: { data: robotoData, fallback: true, subset: true },
  'Noto Sans Arabic': {
    data: fetch('/fonts/NotoSansArabic.ttf').then(r => r.arrayBuffer()),
    subset: true,
  },
  CustomFont: {
    data: customFontData,  // ArrayBuffer or base64 string
    fallback: false,
    subset: true,
  },
}

// Pass to Designer/Viewer/Form/Generator
const designer = new Designer({
  domContainer,
  template,
  plugins,
  options: { font },
})
```

### Font Validation

Use `checkFont` to validate fonts against a template:
```typescript
import { checkFont } from '@pdfme/common'

checkFont({ font, template })  // Throws if a schema references an unknown font
```

### Font in Schemas

Text-like schemas specify fonts via `fontName`:
```typescript
const textSchema: TextSchema = {
  name: 'title',
  type: 'text',
  // ...
  fontName: 'Noto Sans Arabic',  // Must match key in Font map
}
```

If `fontName` doesn't match any key in the Font map, the fallback font (marked `fallback: true`) is used. Use `getFallbackFontName(font)` to find the fallback.

### Font Variants (bold, italic)

TextSchema supports font variants:
```typescript
fontVariants?: {
  bold?: { data: string | ArrayBuffer | Uint8Array; fallback?: boolean };
  italic?: { data: string | ArrayBuffer | Uint8Array; fallback?: boolean };
  boldItalic?: { data: string | ArrayBuffer | Uint8Array; fallback?: boolean };
  code?: { data: string | ArrayBuffer | Uint8Array; fallback?: boolean };
}
```

If a variant is not provided, the `fontVariantFallback` strategy is used:
- `'synthetic'` (default): Synthesize bold/italic from regular font
- `'plain'`: Use regular font for all variants
- `'error'`: Throw error if variant not found

---

## Deprecations & Breaking Changes

### Deprecated APIs

| API | Status | Replacement |
|-----|--------|-------------|
| `BLANK_PDF` | **@deprecated** | Use `BLANK_A4_PDF` or `CUSTOM_A4_PDF` instead. Will be removed in future version. |

### v6 Breaking Changes (from v5)

1. **Template schemas format changed**: `schemas` changed from keyed objects to arrays of arrays.
   - **v5**: `{ schemas: { 'field1': {...}, 'field2': {...} } }`
   - **v6**: `{ schemas: [ [{...}, {...}], [{...}] ] }`
   - Use `migrateTemplate()` to migrate old templates.

2. **BasePdf rename**: `basePDF` → `basePdf` (lowercase PDF).
   - **v5**: `{ basePDF: '...' }`
   - **v6**: `{ basePdf: '...' }`

3. **BLANK_PDF deprecated**: New `BLANK_A4_PDF` (BlankPdf type) and `CUSTOM_A4_PDF` (CustomPdf type) constants introduced.

4. **Plugin system changes**: Plugin interface unified with `pdf`, `ui`, and `propPanel` properties.

5. **Dynamic layout / split range**: New `__splitRange` and `__isSplit` schema properties for dynamic content height calculations (table body, list items, text lines).

6. **Page size presets**: New `PAGE_SIZE_PRESETS`, `detectPaperSize`, and `resolvePageSize` functions added.

7. **Font variant system**: New `fontVariants` and `fontVariantFallback` on TextSchema for explicit bold/italic font support.

8. **i18n expansion**: New languages added: `ar`, `th`, `pl`, `it`, `de`, `es`, `fr`.

9. **New schema types**: `table`, `multiVariableText`, `list`, `date`, `time`, `dateTime`, `select`, `radioGroup`, `checkbox`, `circleMark` added.

10. **Dynamic font sizing**: New `dynamicFontSize` on TextSchema with `min`, `max`, `fit` options.

11. **Text overflow**: New `overflow` property on TextSchema: `'visible'` or `'expand'`.

12. **Text formatting**: New `textFormat` property: `'plain'` or `'inline-markdown'` with markdown formatting support.

13. **Internal links**: New internal link/anchor system for navigation within PDFs.

14. **UI zoom system**: New `zoomLevel`, `maxZoom`, `ZoomMode` ('manual', 'fit-width', 'fit-height') system.

15. **Designer selection API**: New programmatic selection via `selectSchemas()`, `getSelection()`, `getSelectedSchemas()`.

---

## Usage Examples

### Designer Example (Certificate Template Editor)

```typescript
import { Designer } from '@pdfme/ui'
import { text, image, barcodes, svg, signature } from '@pdfme/schemas'
import { BLANK_A4_PDF, type Template, type Font } from '@pdfme/common'

// 1. Define certificate template
const template: Template = {
  basePdf: BLANK_A4_PDF,
  schemas: [
    [
      {
        name: 'title',
        type: 'text',
        position: { x: 100, y: 80 },
        width: 395,
        height: 50,
        content: 'Certificate of Achievement',
        fontSize: 36,
        alignment: 'center',
        verticalAlignment: 'middle',
        lineHeight: 1,
        characterSpacing: 0,
        fontColor: '#1a237e',
        backgroundColor: '#ffffff00',
      } as any,
      {
        name: 'recipient_name',
        type: 'text',
        position: { x: 100, y: 300 },
        width: 395,
        height: 40,
        content: '',
        fontSize: 28,
        alignment: 'center',
        verticalAlignment: 'middle',
        lineHeight: 1,
        characterSpacing: 0,
        fontColor: '#000000',
        backgroundColor: '#ffffff00',
      } as any,
      {
        name: 'date',
        type: 'text',
        position: { x: 100, y: 600 },
        width: 200,
        height: 25,
        content: '',
        fontSize: 14,
        alignment: 'left',
        verticalAlignment: 'top',
        lineHeight: 1,
        characterSpacing: 0,
        fontColor: '#333333',
        backgroundColor: '#ffffff00',
      } as any,
      {
        name: 'signature',
        type: 'signature',
        position: { x: 350, y: 650 },
        width: 145,
        height: 80,
        content: '',
      } as any,
    ],
  ],
}

// 2. Load custom fonts
const font = {
  Roboto: { data: robotoData, fallback: true, subset: true },
  'Noto Sans Arabic': { data: notoArabicData, subset: true },
}

// 3. Register plugins
const plugins = {
  text,
  image,  // Note: import image from schemas
  qrcode: barcodes,
  signature,
  svg,
}

// 4. Create Designer
const designer = new Designer({
  domContainer: document.getElementById('editor-container')!,
  template,
  plugins,
  options: { font, lang: 'en' },
})

// 5. Set up event handlers
designer.onChangeTemplate((updatedTemplate) => {
  console.log('Template changed:', updatedTemplate)
  // Save to backend
})

designer.onSaveTemplate((savedTemplate) => {
  console.log('Template saved:', savedTemplate)
  // Persist template to server
})

designer.onChangeSelection((selection) => {
  console.log('Selected:', selection.schemas)
})

designer.onPageChange((page) => {
  console.log('Current page:', page)
})

// 6. Programmatic operations
const currentTemplate = designer.getTemplate()
designer.updateTemplate(modifiedTemplate)

const currentPage = designer.getPageCursor()
const totalPages = designer.getTotalPages()

// Select specific schema
designer.selectSchemas(['title'], { scroll: true })

// Cleanup
designer.destroy()
```

### Viewer Example (Read-only Certificate Display)

```typescript
import { Viewer } from '@pdfme/ui'
import { text, image, barcodes, svg, signature } from '@pdfme/schemas'
import { BLANK_A4_PDF } from '@pdfme/common'

const viewer = new Viewer({
  domContainer: document.getElementById('viewer-container')!,
  template,  // Same template as designer
  plugins: { text, image, qrcode: barcodes, signature, svg },
  options: { font, lang: 'en' },
  inputs: [
    {
      title: 'Certificate of Achievement',
      recipient_name: 'John Doe',
      date: '2024-01-15',
      signature: '',  // Empty in viewer mode
    },
  ],
})

viewer.onPageChange((page) => {
  console.log('Viewing page:', page)
})

// Get current inputs
const inputs = viewer.getInputs()

// Update inputs
viewer.setInputs([{ ...inputs[0], recipient_name: 'Jane Smith' }])

// Cleanup
viewer.destroy()
```

### Form Example (Fillable Certificate)

```typescript
import { Form } from '@pdfme/ui'
import { text, image, barcodes, svg, signature } from '@pdfme/schemas'
import { BLANK_A4_PDF } from '@pdfme/common'

const form = new Form({
  domContainer: document.getElementById('form-container')!,
  template,  // Same template structure
  plugins: { text, image, qrcode: barcodes, signature, svg },
  options: { font, lang: 'en' },
  inputs: [
    {
      title: 'Certificate of Achievement',
      recipient_name: '',  // User fills this
      date: '',            // User fills this
      signature: '',
    },
  ],
})

form.onChangeInput(({ index, value, key }) => {
  console.log(`Page ${index}: ${key} = ${value}`)
  // Auto-save to backend
})

form.onPageChange((page) => {
  console.log('Current page:', page)
})

// Get the current form values
const inputs = form.getInputs()

// Cleanup
form.destroy()
```

### PDF Generation Example (using @pdfme/generator)

> Note: `@pdfme/generator` is a separate package. The `generate` function is typically imported from there, not from the researched packages.

```typescript
import { generate } from '@pdfme/generator'  // Separate package
import { text, barcodes, svg } from '@pdfme/schemas'
import { BLANK_A4_PDF, type Template, type Inputs } from '@pdfme/common'

const template: Template = {
  basePdf: BLANK_A4_PDF,
  schemas: [[/* schema definitions */]],
}

const inputs: Inputs = [
  { title: 'Certificate of Achievement', recipient_name: 'John Doe' },
]

const pdf = await generate({
  template,
  plugins: { text, qrcode: barcodes, svg },
  inputs,
  options: { font, colorType: 'rgb', title: 'Certificate.pdf' },
})

// Returns Uint8Array of PDF data
// Save or display the PDF:
// const blob = new Blob([pdf], { type: 'application/pdf' })
// const url = URL.createObjectURL(blob)
```

### Custom Plugin Example (Certificate Seal)

```typescript
import { type Plugin, type Schema, type PropPanel } from '@pdfme/common'

type SealSchema = Schema & {
  sealColor: string
  sealText: string
}

const sealPlugin: Plugin<SealSchema> = {
  pdf: async (arg) => {
    const { pdfLib, page, schema, value } = arg
    const seal = schema as SealSchema
    // Draw circle
    page.drawCircle({
      x: seal.position.x + seal.width / 2,
      y: page.getHeight() - seal.position.y - seal.height / 2,
      size: Math.min(seal.width, seal.height) / 2,
      borderColor: pdfLib.rgbFromHex(seal.sealColor),
      borderWidth: 2,
    })
    // Draw text in center
    page.drawText(value || seal.sealText, {
      x: seal.position.x + 20,
      y: page.getHeight() - seal.position.y - seal.height / 2 - 5,
      size: 12,
      color: pdfLib.rgbFromHex(seal.sealColor),
    })
  },
  ui: async (arg) => {
    const { schema, rootElement, value } = arg
    const seal = schema as SealSchema
    rootElement.innerHTML = `
      <div style="
        width: 100%; height: 100%;
        border: 2px solid ${seal.sealColor};
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        color: ${seal.sealColor};
        font-size: 12px; text-align: center;
      ">${value || seal.sealText}</div>
    `
  },
  propPanel: {
    defaultSchema: {
      name: 'seal',
      type: 'seal',
      position: { x: 0, y: 0 },
      width: 80,
      height: 80,
      content: '',
      sealColor: '#c62828',
      sealText: 'APPROVED',
    },
    schema: {
      sealColor: { title: 'Seal Color', type: 'color' },
      sealText: { title: 'Seal Text', type: 'string' },
    },
  },
  icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
}

// Register
const designer = new Designer({
  domContainer,
  template,
  plugins: { text, image, seal: sealPlugin },
  options: { font },
})
```

---

## Gotchas & Warnings

### 1. Units — Everything is in Points (pt)
All positions, widths, and heights are in **points (pt)**, not pixels or mm.
- Use `mm2pt()`, `pt2mm()`, `pt2px()`, `px2mm()` helper functions for conversions.
- A4 dimensions: 595.28 × 841.89 pt (210 × 297 mm).
- `PT_TO_PX_RATIO = 1.333`, `MM_TO_PT_RATIO = 2.8346`.

### 2. BLANK_PDF is Deprecated
Use `BLANK_A4_PDF` (BlankPdf type with width/height/padding) or `CUSTOM_A4_PDF` (base64 encoded A4 PDF) instead. Using `BLANK_PDF` as `basePdf` will trigger deprecation warnings and will be removed in future versions.

### 3. BasePdf key is `basePdf` (camelCase), NOT `basePDF`
The v5 field name `basePDF` was renamed to `basePdf` in v6. Using the wrong casing will cause validation errors.

### 4. Template Migration Required for v5 Templates
Pre-v6 templates use keyed objects for schemas. Use `migrateTemplate(template)` to convert to array format.

### 5. Plugin Labels vs Types
When registering plugins, the **key** in the `plugins` object is a human-readable label (e.g. `'qrcode'`, `'text'`). The **`type`** field within each schema's definition determines which plugin is used for rendering. The plugin registry uses `findByType()` to match schema types to plugins.

### 6. Barcodes Plugin Handles All Barcode Types
The single `barcodes` plugin handles all 12 barcode formats (qrcode, ean13, code128, etc.). Set the `type` field on a BarcodeSchema to the specific barcode format, and the `type` on the schema itself should be the barcode type string (e.g. `'qrcode'`).

### 7. Font Fallback Behavior
If a schema's `fontName` doesn't match any key in the Font map, the font marked `fallback: true` is used. If no fallback is specified, the default "Roboto" font is used. Always provide a fallback font to avoid rendering errors.

### 8. Designer is Not SSR-Compatible
The Designer, Viewer, and Form classes require a browser DOM (`HTMLElement`). They must be initialized client-side only. In Next.js, use dynamic imports with `ssr: false` or mount in `useEffect`.

### 9. Schema Names Must Be Unique Per Page
Each schema's `name` must be unique within its page. Duplicate names will cause input mapping conflicts and UI issues.

### 10. Multi-Page Templates
`template.schemas` is an array of arrays:
- `schemas[0]` = page 1 schemas
- `schemas[1]` = page 2 schemas
- To add a blank page, set `schemas[n] = []`
- Inputs must match: `inputs[n]` = values for page n+1

### 11. Content vs Input Values
- `schema.content` is the **default** value stored in the template.
- When generating/viewing, actual values come from the **inputs** array: `inputs[pageIndex][schema.name]`.
- In Designer mode, content is editable and saved to the template.
- In Form mode, content is the default but user input overrides it.

### 12. Schema ForUI Adds `id`
When the Designer processes templates internally, it converts Schema to SchemaForUI (adds `id: string` — a UUID). This `id` is used for DOM element identification and React keying. The `id` is not persisted in the template — it's added during UI rendering.

### 13. Dynamic Layout / Split Range
The `__splitRange` and `__isSplit` fields are internal metadata for dynamic content layouts (tables, lists, text overflow). They should not be set manually. The dynamic layout system handles splitting content across multiple pages automatically.

### 14. checkTemplate Validates Structure
Always validate templates with `checkTemplate(template)` before passing to Designer/Viewer/Form/Generator. It checks for missing required fields, invalid types, and structural issues.

### 15. Destroy Instances
Always call `destroy()` on Designer/Viewer/Form instances when the component unmounts to clean up React nodes, event listeners, and keyboard shortcuts.

### 16. React Contexts
The UI uses React contexts internally: `I18nContext`, `FontContext`, `PluginsRegistry`, `OptionsContext`, `CacheContext`. Do not modify these directly.

### 17. Zoom System
- `zoomLevel` in options controls initial zoom.
- `maxZoom` (default: 2) limits maximum zoom.
- `MIN_ZOOM = 0.25` is the minimum zoom.
- Zoom modes: `'manual'`, `'fit-width'`, `'fit-height'`.
- The UI uses `baseScale` to fit the page in the container, then applies `zoomLevel` on top.

### 18. Internal Link System
@pdfme v6 includes an internal link/anchor system for navigation within PDFs. Use:
- `normalizeLinkHref()`, `normalizeInternalLinkHref()`, `getInternalLinkTarget()` for link processing
- `registerInternalLinkAnchor()`, `registerInternalLinkAnnotation()` for creating links
- `applyInternalLinkAnnotations()` to apply annotations to PDF
- `resetInternalLinkAnnotations()` to reset cache

### 19. Ant Design Theme
The UI uses Ant Design (antd) for the theme system. `UIOptionsTheme` maps to Ant Design's `ThemeConfig` with `token` and `components` sections. Custom themes can override `colorPrimary`, `colorPrimaryBg`, `colorWhite`, etc.

### 20. CUID Deprecation in Bundled JS
The bundled `ui/dist/index.js` contains internal deprecation warnings from the `cuid` library and Ant Design. These are internal dependencies and do not affect the public API. The @deprecated tag in the public API is only for `BLANK_PDF`.

### 21. PDF Rendering Coordinate System
PDF rendering uses a **bottom-left origin** coordinate system (pdf-lib), while the UI uses **top-left origin**. When writing custom plugins, convert: `pdfY = page.getHeight() - schema.position.y - schema.height`.

### 22. fillColor / backgroundColor Transparency
Use 8-digit hex with alpha for transparency: `'#ffffff00'` = white with 0% opacity. Standard 6-digit hex is opaque.

### 23. Not All Schema Types Have Extra Properties
`ImageSchema`, `SVGSchema`, `SignatureSchema` extend `Schema` without adding any extra properties. All their content is in the `content` field (base64 for images, SVG XML for SVGs, base64 for signatures).

### 24. Table Dynamic Height
Tables support dynamic height calculation via `getDynamicHeightsForTable()` and `getDynamicLayoutForTable()`. The `__splitRange` with `TABLE_BODY_SPLIT_UNIT` handles splitting table body content across pages.

### 25. i18n for Error Messages
Use the provided i18n system for any user-facing strings. The `Lang` type supports 11 languages. Custom plugins should use the `i18n` function passed in `PropPanelSchemaBuilderProps` and `PropPanelWidgetProps`.
