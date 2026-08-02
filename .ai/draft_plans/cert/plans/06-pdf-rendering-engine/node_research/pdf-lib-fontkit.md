# pdf-lib v1.17.1 & @pdf-lib/fontkit v1.1.1 — Node Module Research

> Certificate generation feature — Plan 06 (PDF Rendering Engine) post-processing & Plans 11-12 (font handling)
> Source: `node_modules/pdf-lib` and `node_modules/@pdf-lib/fontkit` — all `.d.ts` files, README, and source verified

---

## Package Overview

### pdf-lib (v1.17.1)
- **Repository**: https://github.com/Hopding/pdf-lib
- **Docs**: https://pdf-lib.js.org
- **Purpose**: Create and modify PDF documents in any JavaScript runtime (Node, Browser, Deno, React Native)
- **Tagline**: "Designed to work in any modern JavaScript runtime"
- **No native dependencies** — pure TypeScript/JavaScript
- **Maintenance status**: The project README references a `MAINTAINERSHIP.md` doc and notes the library does NOT currently support encrypted documents. The library has not had major version bumps beyond 1.x. Some features (text extraction, HTML/CSS) are explicitly out of scope.
- **Entry point**: `node_modules/pdf-lib/cjs/index.js` (CommonJS bundle). Types in `node_modules/pdf-lib/cjs/index.d.ts`.

### @pdf-lib/fontkit (v1.1.1)
- **Repository**: https://github.com/Hopding/fontkit (fellow package by same author)
- **Purpose**: Custom font support (TTF, OTF, WOFF) for pdf-lib — provides glyph mapping, metrics, and subsetting
- **Usage**: `pdfDoc.registerFontkit(fontkit)` — synchronous registration; **MUST** be called before embedding any non-standard font
- **Entry point**: `node_modules/@pdf-lib/fontkit/fontkit.js`. Types in `node_modules/@pdf-lib/fontkit/fontkit.d.ts`.

---

## pdf-lib TypeScript Types & Interfaces

### Core Classes (from `index.d.ts` re-exports)

| Class | File | Purpose |
|-------|------|---------|
| `PDFDocument` | `api/PDFDocument.d.ts` | Top-level PDF document — create, load, save, embed fonts/images, copy pages, set metadata |
| `PDFPage` | `api/PDFPage.d.ts` | Single page — drawing operations (text, images, shapes), sizing, positioning |
| `PDFFont` | `api/PDFFont.d.ts` | Embedded font — text encoding, measurement |
| `PDFImage` | `api/PDFImage.d.ts` | Embedded JPG/PNG image — dimensions, scaling |
| `PDFEmbeddedPage` | `api/PDFEmbeddedPage.d.ts` | A page from another PDF embedded into current doc |

### Color Types (`api/colors.d.ts`)

```typescript
interface RGB { type: ColorTypes.RGB; red: number; green: number; blue: number }
interface Grayscale { type: ColorTypes.Grayscale; gray: number }
interface CMYK { type: ColorTypes.CMYK; cyan: number; magenta: number; yellow: number; key: number }
type Color = Grayscale | RGB | CMYK

enum ColorTypes { Grayscale = 'Grayscale', RGB = 'RGB', CMYK = 'CMYK' }

function rgb(red: number, green: number, blue: number): RGB       // values 0-1 (NOT 0-255!)
function grayscale(gray: number): Grayscale
function cmyk(cyan: number, magenta: number, yellow: number, key: number): CMYK
```

> **CRITICAL GOTCHA**: `rgb()` takes values in the **0-1 range**, NOT 0-255. Pass `rgb(1, 0, 0)` for pure red, not `rgb(255, 0, 0)`.

### Enums

#### `StandardFonts` (`api/StandardFonts.d.ts`)
```typescript
enum StandardFonts {
  Courier, CourierBold, CourierOblique, CourierBoldOblique,
  Helvetica, HelveticaBold, HelveticaOblique, HelveticaBoldOblique,
  TimesRoman, TimesRomanBold, TimesRomanItalic, TimesRomanBoldItalic,
  Symbol, ZapfDingbats
}
```
> The 14 PDF "base 14" fonts — guaranteed available in PDF readers, no embedding required. **Only support WinAnsi (Windows-1252) encoding — 218 Latin chars max.** Use custom fonts for any Unicode beyond Latin.

#### `PageSizes` (`api/sizes.d.ts`)
Object with named page dimensions as `[width, height]` tuples (in PDF points):
`A0`–`A10`, `B0`–`B10`, `C0`–`C10`, `RA0`–`RA4`, `SRA0`–`SRA4`, `Executive`, `Folio`, `Legal`, `Letter`, `Tabloid`.
Example: `PageSizes.A4 = [595.28, 841.89]`.

#### `RotationTypes` (`api/rotations.d.ts`)
```typescript
enum RotationTypes { Degrees = 'degrees', Radians = 'radians' }
interface Degrees { type: RotationTypes.Degrees; angle: number }
interface Radians { type: RotationTypes.Radians; angle: number }
type Rotation = Degrees | Radians

function degrees(angle: number): Degrees
function radians(angle: number): Radians
```

#### `BlendMode` (`api/PDFPageOptions.d.ts`)
```typescript
enum BlendMode {
  Normal, Multiply, Screen, Overlay, Darken, Lighten,
  ColorDodge, ColorBurn, HardLight, SoftLight, Difference, Exclusion
}
```

#### `LineCapStyle` (`api/operators.d.ts`)
```typescript
enum LineCapStyle { Butt = 0, Round = 1, Projecting = 2 }
enum LineJoinStyle { Miter = 0, Round = 1, Bevel = 2 }
enum TextRenderingMode {
  Fill = 0, Outline = 1, FillAndOutline = 2, Invisible = 3,
  FillAndClip = 4, OutlineAndClip = 5, FillAndOutlineAndClip = 6, Clip = 7
}
```

#### `TextAlignment` (`api/text/alignment.d.ts`)
```typescript
enum TextAlignment { Left = 0, Center = 1, Right = 2 }
```

#### `ParseSpeeds` (`api/PDFDocumentOptions.d.ts`)
```typescript
enum ParseSpeeds { Fastest = Infinity, Fast = 1500, Medium = 500, Slow = 100 }
```

### Option Interfaces (`api/PDFDocumentOptions.d.ts`)

#### `LoadOptions`
```typescript
interface LoadOptions {
  ignoreEncryption?: boolean       // default false; throws EncryptedPDFError if true not set
  parseSpeed?: ParseSpeeds | number // default ParseSpeeds.Speed (500). Infinity is fastest.
  throwOnInvalidObject?: boolean    // default false
  updateMetadata?: boolean          // default true — updates Producer/Creator + dates on load
  capNumbers?: boolean              // default false — caps JS numbers to ±Number.MAX_VALUE
}
```

#### `SaveOptions`
```typescript
interface SaveOptions {
  useObjectStreams?: boolean   // default true — smaller file size
  addDefaultPage?: boolean     // default true — adds blank page if doc has none
  objectsPerTick?: number      // default 50 — yield to event loop every N objects
  updateFieldAppearances?: boolean // default true — regenerate form field appearances
}
```

#### `Base64SaveOptions extends SaveOptions`
```typescript
interface Base64SaveOptions extends SaveOptions {
  dataUri?: boolean  // default false — if true, returns data: URI string
}
```

#### `CreateOptions` (for `PDFDocument.create`)
Not heavily documented in .d.ts; uses similar defaults. Primarily for internal use; `create()` usually called with no args.

#### `EmbedFontOptions`
```typescript
interface EmbedFontOptions {
  subset?: boolean        // default false — only embeds glyphs that are used
  customName?: string     // custom PostScript name for the embedded font
  features?: TypeFeatures // OpenType/AAT feature settings (ligatures etc.)
}
```

#### `SetTitleOptions`
```typescript
interface SetTitleOptions { showInWindowTitleBar?: boolean }
```

#### `AttachmentOptions`
```typescript
interface AttachmentOptions {
  mimeType?: string
  description?: string
  creationDate?: Date
  modificationDate?: Date
  checksum?: string
}
```

### Draw Option Interfaces (`api/PDFPageOptions.d.ts`)

#### `PDFPageDrawTextOptions`
```typescript
interface PDFPageDrawTextOptions {
  x?: number; y?: number
  font?: PDFFont; size?: number
  color?: Color; opacity?: number; blendMode?: BlendMode
  rotate?: Rotation; xSkew?: Rotation; ySkew?: Rotation
  lineHeight?: number; maxWidth?: number
  wordBreaks?: string[]  // default [' '] — chars where wrapping may occur
}
```

#### `PDFPageDrawImageOptions`
```typescript
interface PDFPageDrawImageOptions {
  x?: number; y?: number
  width?: number; height?: number
  rotate?: Rotation; xSkew?: Rotation; ySkew?: Rotation
  opacity?: number; blendMode?: BlendMode
}
```

#### `PDFPageDrawRectangleOptions`
```typescript
interface PDFPageDrawRectangleOptions {
  x?: number; y?: number
  width?: number; height?: number
  rotate?: Rotation; xSkew?: Rotation; ySkew?: Rotation
  borderWidth?: number
  color?: Color; opacity?: number; borderColor?: Color; borderOpacity?: number
  borderDashArray?: number[]; borderDashPhase?: number
  borderLineCap?: LineCapStyle; blendMode?: BlendMode
}
```

#### `PDFPageDrawLineOptions`
```typescript
interface PDFPageDrawLineOptions {
  start: { x: number; y: number }  // REQUIRED
  end: { x: number; y: number }    // REQUIRED
  thickness?: number; color?: Color; opacity?: number
  lineCap?: LineCapStyle
  dashArray?: number[]; dashPhase?: number
  blendMode?: BlendMode
}
```

#### `PDFPageDrawPageOptions` (for `page.drawPage`)
```typescript
interface PDFPageDrawPageOptions {
  x?: number; y?: number
  xScale?: number; yScale?: number
  width?: number; height?: number
  rotate?: Rotation; xSkew?: Rotation; ySkew?: Rotation
  opacity?: number; blendMode?: BlendMode
  graphicsState?: string
}
```

### Errors (`api/errors.d.ts`)
```typescript
class EncryptedPDFError extends Error     // load() on encrypted doc without ignoreEncryption
class FontkitNotRegisteredError extends Error // embedFont(customFont) without registerFontkit
class ForeignPageError extends Error      // adding a page from another doc without copying
class RemovePageFromEmptyDocumentError extends Error
class NoSuchFieldError extends Error
class UnexpectedFieldTypeError extends Error
class FieldAlreadyExistsError extends Error
class InvalidFieldNamePartError extends Error
// + form-related: MissingOnValueCheckError, FieldExistsAsNonTerminalError,
//   RichTextFieldReadError, CombedTextLayoutError, ExceededMaxLengthError, InvalidMaxLengthError
```

---

## PDFDocument API

### `PDFDocument.create(options?: CreateOptions): Promise<PDFDocument>`
Creates a new empty PDFDocument. Usually `await PDFDocument.create()` with no args.
```typescript
const pdfDoc = await PDFDocument.create()
const page = pdfDoc.addPage([595.28, 841.89])  // A4
```

### `PDFDocument.load(pdf: string | Uint8Array | ArrayBuffer, options?: LoadOptions): Promise<PDFDocument>`
Loads an existing PDF. Accepts:
- **Base64-encoded string**
- **Data URI string** (`data:application/pdf;base64,...`)
- **Raw bytes** (`Uint8Array`)
- **`ArrayBuffer`**

```typescript
const pdfDoc = await PDFDocument.load(pdfBytes, {
  ignoreEncryption: false,
  updateMetadata: false,  // CRITICAL: set to false if you want to PRESERVE original metadata
})
```

> **GOTCHA**: `updateMetadata: true` (the default) updates the Producer, Creator, and modification date on load. Set `updateMetadata: false` if you want to preserve original values.

### `pdfDoc.save(options?: SaveOptions): Promise<Uint8Array>`
Serializes the document to bytes.
```typescript
const pdfBytes = await pdfDoc.save({
  useObjectStreams: true,   // smaller file size (default true)
  addDefaultPage: false,     // don't auto-add blank page (default true)
  objectsPerTick: 50,
})
```

### `pdfDoc.saveAsBase64(options?: Base64SaveOptions): Promise<string>`
Same as `save()` but returns Base64 string. Set `dataUri: true` to get a `data:application/pdf;base64,...` URI.

### `pdfDoc.copyPages(sourceDoc: PDFDocument, indices: number[]): Promise<PDFPage[]>`
Copies pages from **another** `PDFDocument` instance into this one. Returns array of copied `PDFPage` objects that can be added with `addPage()`.
```typescript
const srcDoc = await PDFDocument.load(srcBytes)
const [copiedPage] = await pdfDoc.copyPages(srcDoc, [0])
pdfDoc.addPage(copiedPage)
```

### `pdfDoc.copy(): Promise<PDFDocument>`
Returns a deep copy of the document. **WARNING**: Per the .d.ts comment — "won't copy acroforms, outlines, interactive features, etc." Use for content-only copies.

### `pdfDoc.embedFont(font: StandardFonts | string | Uint8Array | ArrayBuffer, options?: EmbedFontOptions): Promise<PDFFont>`
Embeds a font. Accepts:
- `StandardFonts` enum (no fontkit needed — see `embedStandardFont` for sync variant)
- **Base64 string** or **data URI**
- **`Uint8Array`** of TTF/OTF/WOFF bytes (requires `registerFontkit` first)

```typescript
pdfDoc.registerFontkit(fontkit)
const fontBytes = await readFile('./assets/Amiri-Regular.ttf')
const font = await pdfDoc.embedFont(fontBytes, {
  subset: true,        // smaller PDF — only embeds used glyphs
  customName: 'Amiri',  // PostScript name
})
```

> **CRITICAL**: For non-StandardFonts, you MUST call `pdfDoc.registerFontkit(fontkit)` BEFORE calling `embedFont()`, otherwise `FontkitNotRegisteredError` is thrown.

### `pdfDoc.embedStandardFont(font: StandardFonts, customName?: string): PDFFont`
**Synchronous** variant for standard fonts only. No fontkit required.
```typescript
const helv = pdfDoc.embedStandardFont(StandardFonts.HelveticaBold)
```

### `pdfDoc.embedJpg(jpg: string | Uint8Array | ArrayBuffer): Promise<PDFImage>`
Embeds a JPG. Accepts Base64/data URI/bytes.

### `pdfDoc.embedPng(png: string | Uint8Array | ArrayBuffer): Promise<PDFImage>`
Embeds a PNG. Accepts Base64/data URI/bytes.

### `pdfDoc.embedPdf(pdf: string | Uint8Array | ArrayBuffer | PDFDocument, indices?: number[]): Promise<PDFEmbeddedPage[]>`
Embeds pages from another PDF as `PDFEmbeddedPage` objects (for use with `page.drawPage()`). Accepts bytes or an existing `PDFDocument`.

### `pdfDoc.embedPage(page: PDFPage, boundingBox?, transformationMatrix?): Promise<PDFEmbeddedPage>`
Embeds a single `PDFPage` from another doc as an embedded page (for compositing onto the current doc's pages).

### `pdfDoc.embedPages(pages: PDFPage[], boundingBoxes?, transformationMatrices?): Promise<PDFEmbeddedPage[]>`
Batch version of `embedPage`.

### `pdfDoc.registerFontkit(fontkit: Fontkit): void`
**Synchronous** registration of the fontkit instance. **MUST be called before any `embedFont()` with non-standard fonts.**
```typescript
import fontkit from '@pdf-lib/fontkit'
pdfDoc.registerFontkit(fontkit)
```

### `pdfDoc.attach(attachment: string | Uint8Array | ArrayBuffer, name: string, options?: AttachmentOptions): Promise<void>`
Attaches a file to the PDF (embedded file attachment).

### `pdfDoc.addJavaScript(name: string, script: string): void`
Adds a JavaScript action to the document (executed on open). Use with caution.

### Page Accessors
```typescript
pdfDoc.addPage(page?: PDFPage | [number, number]): PDFPage      // append page
pdfDoc.insertPage(index: number, page?: PDFPage | [number, number]): PDFPage
pdfDoc.removePage(index: number): void
pdfDoc.getPageCount(): number
pdfDoc.getPages(): PDFPage[]
pdfDoc.getPageIndices(): number[]
```

---

## Post-Processing API (CRITICAL for certificate metadata)

These methods are the **primary use case for pdf-lib in the certificate pipeline** — set metadata on a Puppeteer-rendered PDF after generation.

### Metadata Setters

```typescript
pdfDoc.setTitle(title: string, options?: SetTitleOptions): void
// SetTitleOptions: { showInWindowTitleBar?: boolean }

pdfDoc.setAuthor(author: string): void
pdfDoc.setSubject(subject: string): void
pdfDoc.setKeywords(keywords: string[]): void    // NOTE: takes an ARRAY of strings
pdfDoc.setCreator(creator: string): void
pdfDoc.setProducer(producer: string): void
pdfDoc.setLanguage(language: string): void     // RFC 3066 Language-Tag (e.g. 'ar', 'en-US')
pdfDoc.setCreationDate(creationDate: Date): void
pdfDoc.setModificationDate(modificationDate: Date): void
```

### Metadata Getters

```typescript
pdfDoc.getTitle(): string | undefined
pdfDoc.getAuthor(): string | undefined
pdfDoc.getSubject(): string | undefined
pdfDoc.getKeywords(): string[] | undefined
pdfDoc.getCreator(): string | undefined
pdfDoc.getProducer(): string | undefined
pdfDoc.getLanguage(): string | undefined
pdfDoc.getCreationDate(): Date | undefined
pdfDoc.getModificationDate(): Date | undefined
```

### Merging Multiple PDFs (Post-Processing Pattern)

```typescript
import { PDFDocument } from 'pdf-lib'

async function mergePdfs(mainDocBytes: Uint8Array, overlayDocBytes: Uint8Array): Promise<Uint8Array> {
  const mainDoc = await PDFDocument.load(mainDocBytes)
  const overlayDoc = await PDFDocument.load(overlayDocBytes)

  // Copy all pages from overlay into main
  const overlayPages = await mainDoc.copyPages(overlayDoc, overlayDoc.getPageIndices())
  overlayPages.forEach(page => mainDoc.addPage(page))

  return mainDoc.save()
}
```

### Alternative: Overlaying Content (Stamping)
Use `embedPage`/`embedPages` to composite one PDF's pages onto another's pages rather than appending:
```typescript
const [embeddedOverlay] = await mainDoc.embedPdf(overlayBytes, [0])
mainDoc.getPages()[0].drawPage(embeddedOverlay, { x: 0, y: 0 })
```

---

## Page Operations

### Adding and Inserting Pages
```typescript
pdfDoc.addPage(page?: PDFPage | [number, number]): PDFPage
pdfDoc.insertPage(index: number, page?: PDFPage | [number, number]): PDFPage
```
- Pass `[width, height]` dimensions (in PDF points — 1pt = 1/72 inch)
- Pass nothing for default size (`Letter`: 612×792)
- Pass an existing `PDFPage` to add a copied page

### Sizing
```typescript
page.setSize(width: number, height: number): void
page.getWidth(): number
page.getHeight(): number
page.getSize(): { width: number; height: number }
```

### Rotation
```typescript
page.setRotation(angle: Rotation): void
page.getRotation(): Rotation
```

### Box Operations (PDF standard boxes)
```typescript
page.setMediaBox(x, y, width, height): void    page.getMediaBox(): { x, y, width, height }
page.setCropBox(x, y, width, height): void     page.getCropBox()
page.setBleedBox(x, y, width, height): void    page.getBleedBox()
page.setTrimBox(x, y, width, height): void     page.getTrimBox()
page.setArtBox(x, y, width, height): void      page.getArtBox()
```

### Text Rendering
```typescript
page.drawText(text: string, options?: PDFPageDrawTextOptions): void
```
Options: `x`, `y`, `font`, `size`, `color`, `opacity`, `rotate`, `xSkew`, `ySkew`, `lineHeight`, `maxWidth`, `wordBreaks`, `blendMode`.

> **IMPORTANT**: `drawText` does NOT do word-wrapping or shaping. Use `layoutMultilineText` / `layoutSinglelineText` helpers for multiline layout, then iterate results and call `drawText` per line.

### Image Rendering
```typescript
page.drawImage(image: PDFImage, options?: PDFPageDrawImageOptions): void
```
Options: `x`, `y`, `width`, `height`, `rotate`, `xSkew`, `ySkew`, `opacity`, `blendMode`.
**Must provide `width`/`height`** to a known value (or compute from `image.width`/`image.height`).

### Drawing Another PDF Page (Compositing)
```typescript
page.drawPage(embeddedPage: PDFEmbeddedPage, options?: PDFPageDrawPageOptions): void
```

### Shapes
```typescript
page.drawLine(options: PDFPageDrawLineOptions): void        // start: {x,y}, end: {x,y} REQUIRED
page.drawRectangle(options?: PDFPageDrawRectangleOptions): void
page.drawSquare(options?): void  // convenience — same as rectangle with equal width/height
page.drawEllipse(options?): void
page.drawCircle(options?): void  // convenience — ellipse with equal xScale/yScale
page.drawSvgPath(path: string, options?: PDFPageDrawSVGOptions): void  // SVG path "d" syntax
```

### Text Layout Helpers (`api/text/layout.d.ts`)
Used for advanced text layout BEFORE calling `drawText`:
```typescript
layoutMultilineText(text: string, {
  alignment,  // TextAlignment enum
  fontSize, font, bounds: { width, height }, lineHeight?
}): { lines: TextPosition[] }   // each TextPosition has x, y, encodedText

layoutSinglelineText(text: string, {
  font, fontSize, bounds: { width }, alignment
}): { lines: TextPosition[] }

layoutCombedText(text, {
  font, fontSize, bounds, fontSize?
}): { ..., lineLength, cellCount }
```

### Position Helpers (cursor-like API)
```typescript
page.moveTo(x, y): void
page.moveUp(y): void; page.moveDown(y): void; page.moveLeft(x): void; page.moveRight(x): void
page.getPosition(): { x, y }
page.getX(): number; page.getY(): number
page.resetPosition(): void
```

### Font Helpers (page-level defaults)
```typescript
page.setFont(font: PDFFont): void
page.setFontSize(size: number): void
page.setFontColor(color: Color): void
page.setLineHeight(lineHeight: number): void
```

### Scaling
```typescript
page.scale(ratio: number): void                  // scales everything on the page
page.scaleContent(ratio: number): void           // scales page content
page.scaleAnnotations(ratio: number): void
page.translateContent(x: number, y: number): void
```

### Font Measurement (PDFFont)
```typescript
font.encodeText(text: string): PDFHexString              // returns encoded text for PDF operators
font.widthOfTextAtSize(text: string, size: number): number  // width in points
font.heightAtSize(size: number, options?: { descender?: boolean }): number
font.sizeAtHeight(height: number): number                // fontSize for given text height
font.getCharacterSet(): number[]                         // array of supported Unicode codepoints
font.name: string                                        // PostScript name (readonly)
font.ref: PDFRef                                          // PDF indirect ref (readonly)
```

### Image Measurement (PDFImage)
```typescript
image.width: number
image.height: number
image.scale(factor: number): { width, height }       // computed scaled dimensions
image.scaleToFit(width: number, height: number): { width, height }  // fit within box
image.size(): { width, height }
```

### Embedded Page Measurement (PDFEmbeddedPage)
```typescript
embeddedPage.width: number
embeddedPage.height: number
embeddedPage.scale(factor: number): { width, height }
embeddedPage.size(): { width, height }
```

---

## @pdf-lib/fontkit

### Export (`fontkit.d.ts`)
```typescript
export default function create(buffer: Uint8Array, postscriptName?: string): Font
export { Font, Subset, Glyph, GlyphRun, GlyphPosition, BoundingBox, Path,
         OpenTypeFeatures, AATFeatures, TypeFeatures }
```

### The `Fontkit` interface (consumed by pdf-lib)
In pdf-lib's internal types (`types/fontkit.d.ts`), the `Fontkit` interface is just:
```typescript
interface Fontkit { create(buffer: Uint8Array, postscriptName?: string): Font }
```
So @pdf-lib/fontkit's default export (the `create` function) satisfies this — `pdfDoc.registerFontkit(fontkit)` just needs any object with a `create()` method.

### The `Font` Interface (key fields)
```typescript
interface Font {
  postscriptName: string | null         // PostScript name (e.g. 'Amiri-Regular')
  familyName: string | null             // Family (e.g. 'Amiri')
  subfamilyName: string | null          // Style (e.g. 'Regular', 'Bold')
  copyright: string | null
  version: string | null
  // Metrics (all in font-design units; divide by unitsPerEm to get ratios)
  unitsPerEm: number
  ascent: number; descent: number
  lineGap: number; capHeight: number | null
  xHeight: number | null
  italicAngle: number
  // Glyph mapping
  getGlyph(glyphId: number, codePoints?: number[]): Glyph
  characterToGlyphMapping: Record<number, number>  // unicode -> glyph id
  numberOfGlyphs: number
  // Layout
  layout(str: string, features?: TypeFeatures): GlyphRun
  // Subsetting
  createSubset(): Subset
}
```

### `GlyphRun` (shaping result)
```typescript
interface GlyphRun {
  glyphs: Glyph[]                // ordered glyph ids after shaping
  positions: GlyphPosition[]    // x,y offsets + advance per glyph
  advanceWidth: number
  direction: 'ltr' | 'rtl' | null  // ★ fontkit DOES detect RTL direction
  fontSize: number
}
```

> **Key observation**: `GlyphRun.direction: 'ltr' | 'rtl' | null` — fontkit's `Font.layout()` method returns the **direction** of the run, so fontkit HAS the shaping machinery to detect and report RTL.

### `OpenTypeFeatures` (Arabic-relevant fields)
```typescript
interface OpenTypeFeatures {
  init?: boolean; medi?: boolean; fina?: boolean; fin2?: boolean; fin3?: boolean; isol?: boolean
  rlig?: boolean  // required ligatures (Arabic uses this tag)
  rtla?: boolean  // Right-to-left alternates
  rtlm?: boolean  // Right-to-left mirrored forms
  curs?: boolean  // Cursive positioning (Arabic)
  ccmp?: boolean  // Glyph composition/decomposition (Arabic)
  mark?: boolean; mkmk?: boolean  // Mark positioning
  // ... non-Arabic features like kern, liga, calt, dlig, smcp, c2sc, etc.
}
```
- These entries are the standard OpenType feature tags used by Arabic shaping engines (`init`/`medi`/`fina`/`isol` = positional forms; `rlig` = required ligatures; `curs` = cursive joining).
- **TypeFeatures = OpenTypeFeatures & AATFeatures**

### `CustomFontEmbedder` (`core/embedders/CustomFontEmbedder.d.ts`)
This is what pdf-lib uses internally when you call `embedFont(customFontBytes)`:
```typescript
class CustomFontEmbedder {
  static for(fontkit: Fontkit, fontData: Uint8Array, customName?: string, fontFeatures?: TypeFeatures): Promise<CustomFontEmbedder>

  // Encodes text for embedding into content stream
  encodeText(text: string): [PDFHexString, number[]]
  widthOfTextAtSize(text: string, size: number): number
  heightOfFontAtSize(size: number, options?: { descender?: boolean }): number

  // Embedded into PDF context
  embedIntoContext(font: PDFFont, ref: PDFRef): Promise<void>

  // Properties
  font: Font                  // the loaded fontkit Font
  // ... metrics getters
}
```

> **CRITICAL**: Look at `encodeText(text)` — it returns `[PDFHexString, number[]]`. The implementation maps the JavaScript string characters to glyph IDs and builds a hex string of glyph IDs. It does NOT call `Font.layout()` (the shaping method) in its main path — it's a character-to-glyph mapping, not a full text-shaping pipeline.

---

## Arabic Text Limitation (CRITICAL)

### TL;DR

**pdf-lib CANNOT properly render Arabic/RTL text via `page.drawText()`. Use Puppeteer + HTML/CSS for the visual certificate, then use pdf-lib ONLY for post-processing (metadata, merging).**

### Detailed Analysis

#### What fontkit supports
- `@pdf-lib/fontkit`'s `Font.layout(str, features?)` method **does** perform OpenType shaping: it returns a `GlyphRun` with `glyphs`, `positions`, and crucially `direction: 'ltr' | 'rtl' | null`.
- Arabic-relevant OpenType features (`init`, `medi`, `fina`, `isol`, `rlig`, `curs`, `ccmp`, `mark`, `mkmk`) are defined in `OpenTypeFeatures`, and `EmbedFontOptions.features` exists to pass these to pdf-lib when embedding.
- So **fontkit itself has the shaping pipeline** that Arabic requires.

#### What pdf-lib does NOT do
- pdf-lib's `page.drawText(text, options)` does NOT invoke the fontkit layout/shaping pipeline.
- Trace: `drawText()` → `font.encodeText(text)` → `CustomFontEmbedder.encodeText()` → directly maps each JS string codepoint to a glyph via `Font.characterToGlyphMapping` and builds a hex string of glyph ids.
- There is **no call to `Font.layout()`** in the text-rendering path. Therefore:
  - Arabic positional forms (initial/medial/final/isolated) are NOT selected — only the **isolated form** (or whichever glyph the codepoint maps to in the cmap) is used.
  - Required ligatures (`rlig`) and contextual alternates are NOT applied.
  - Marks (harakat) are NOT positioned via `mark`/`mkmk`.
  - **No BiDi (bidirectional) algorithm** — the text is emitted in the JavaScript string's logical order, but the glyphs are placed LEFT-TO-RIGHT at increasing x-position by the PDF content stream.
- pdf-lib has NO built-in BiDi engine or Unicode bidirectional algorithm implementation. The README's "Fonts and Unicode" section discusses WinAnsi limits but does NOT mention RTL or complex-script support.

#### Practical Result
If you pass an Arabic string like `"السلام"` to `page.drawText()`:
1. Each Arabic character's codepoint maps to its **isolated** glyph form (no joining/ligatures).
2. Characters render in **string order** (logical order), which for Arabic is RIGHT-TO-LEFT, but pdf-lib advances x in **increasing** direction (LTR), so the text appears **reversed**.
3. No harakat (diacritics) positioning.
4. The output will be **unreadable, broken Arabic** — disconnected letters in wrong order.

### What to do instead

**For the Siraj certificate generation feature:**

1. **Render the visual PDF using Puppeteer + HTML/CSS** — the browser's text engine handles BiDi, Arabic shaping, ligatures, mark positioning, and font features natively. This is the standard approach for Arabic/RTL PDFs in Node.js.

2. **Use pdf-lib ONLY for post-processing**:
   - Set PDF metadata (title, author, subject, keywords, creator, producer, language, dates)
   - Merge multiple PDFs (e.g., cover page + certificate pages)
   - Add file attachments
   - (Optionally) overlay stamps/watermarks using `drawPage()` with positioning — but only if those don't contain Arabic text.

3. **Do NOT attempt to use `page.drawText()` for Arabic strings** even with an embedded Arabic TTF/OTF — the result will be visually broken.

### What `pdfDoc.setLanguage()` is good for
- Setting `pdfDoc.setLanguage('ar')` sets the PDF's `/Lang` entry (RFC 3066 Language-Tag). This helps screen readers and accessibility tools, but has **no effect on visual text rendering**.

---

## Deprecations

### In pdf-lib v1.17.1
| File | Location | Deprecated symbol | Replacement / Note |
|------|----------|-------------------|-------------------|
| `cjs/api/operations.d.ts` | line 73 | `drawEllipsePath` (low-level operator generator) | Use `drawEllipse` operator instead. `drawEllipsePath` was the internal helper drawEllipse now wraps. |
| `cjs/core/objects/PDFName.d.ts` | line 34 | `PDFName.decode` (a method on the internal PDFName object) | Use `PDFName.asString()` instead. |
| `cjs/core/objects/PDFNumber.d.ts` | line 8 | `PDFNumber.value` (a getter on the internal PDFNumber object) | Use `PDFNumber.asNumber()` instead. |

These are all low-level/internal PDF object model symbols — none affect the public high-level API (`PDFDocument`, `PDFPage`, `PDFFont`, etc.). They will not appear in normal usage.

### In @pdf-lib/fontkit v1.1.1
- **No `@deprecated` annotations** found in any `.d.ts` file.

### Maintenance Status
- pdf-lib v1.17.1 — the project is stable but the major-version cadence is slow. README lists explicit "Limitations" (no text extraction from pages, no HTML/CSS embedding — recommends Puppeteer for HTML→PDF; no encryption support). These limitations are documented and stable as of this version.
- The README's "Prior Art" section mentions Puppeteer as the recommended tool when HTML/CSS rendering is needed, reinforcing the approach recommended above for Arabic.

---

## Usage Examples

### Example 1: Post-Process a Puppeteer-Rendered Certificate PDF (PRIMARY USE CASE)

```typescript
import { PDFDocument, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { readFile, writeFile } from 'fs/promises'

async function postProcessCertificate(
  puppeteerPdfPath: string,
  outPath: string,
  meta: {
    title: string
    author: string
    subject: string
    keywords: string[]
    creator: string
    recipientName: string
    issueDate: Date
  }
): Promise<void> {
  // 1. Load the Puppeteer-rendered PDF
  const pdfBytes = await readFile(puppeteerPdfPath)
  const pdfDoc = await PDFDocument.load(pdfBytes, {
    // IMPORTANT: do NOT let pdf-lib overwrite Producer/Creator/dates
    updateMetadata: false,
  })

  // 2. Apply our own metadata (Arabic-friendly — values are UTF-8 strings)
  pdfDoc.setTitle(meta.title)
  pdfDoc.setAuthor(meta.author)
  pdfDoc.setSubject(meta.subject)
  pdfDoc.setKeywords(meta.keywords)   // array of strings
  pdfDoc.setCreator(meta.creator)
  pdfDoc.setProducer('Siraj Certificate Engine')  // overrides 'pdf-lib' default
  pdfDoc.setLanguage('ar')
  pdfDoc.setCreationDate(meta.issueDate)
  pdfDoc.setModificationDate(new Date())

  // 3. (Optional) Embed a signature image and stamp on the certificate
  const sigPngBytes = await readFile('./assets/signature.png')
  const sigImage = await pdfDoc.embedPng(sigPngBytes)
  const pages = pdfDoc.getPages()
  const firstPage = pages[0]
  const pageWidth = firstPage.getWidth()
  firstPage.drawImage(sigImage, {
    x: pageWidth - 200,
    y: 80,
    width: 120,
    height: 60,
  })

  // 4. Save — useObjectStreams:true keeps file size down
  const outBytes = await pdfDoc.save({ useObjectStreams: true })
  await writeFile(outPath, outBytes)
}
```

> **Note on Arabic metadata**: PDF metadata strings are stored as UTF-16 text strings in the document's Info dictionary. pdf-lib writes them via `PDFString.of(...)` which supports UTF-16BE. So setting `setTitle('شهادة إتمام')` etc. should work — the metadata is NOT rendered via the font shaping pipeline. (Verify with a PDF reader's "Document Properties" panel.)

### Example 2: Merge Multiple Certificates into One PDF

```typescript
import { PDFDocument } from 'pdf-lib'
import { readFile, writeFile } from 'fs/promises'

async function mergeCertificates(paths: string[], outPath: string): Promise<void> {
  const outDoc = await PDFDocument.create()

  for (const path of paths) {
    const bytes = await readFile(path)
    const srcDoc = await PDFDocument.load(bytes)
    const copied = await outDoc.copyPages(srcDoc, srcDoc.getPageIndices())
    copied.forEach(p => outDoc.addPage(p))
  }

  // Single set of metadata for the merged document
  outDoc.setTitle('ملف الشهادات المجمّع')
  outDoc.setAuthor('Siraj')
  outDoc.setKeywords(['شهادة', 'certificate', 'siraj'])

  const out = await outDoc.save()
  await writeFile(outPath, out)
}
```

### Example 3: Overlay a Watermark PDF onto a Certificate

```typescript
import { PDFDocument } from 'pdf-lib'
import { readFile, writeFile } from 'fs/promises'

async function stampWatermark(certPath: string, watermarkPath: string, outPath: string) {
  const certDoc = await PDFDocument.load(await readFile(certPath))
  const [watermarkPage] = await certDoc.embedPdf(await readFile(watermarkPath), [0])

  for (const page of certDoc.getPages()) {
    page.drawPage(watermarkPage, {
      x: 0, y: 0,
      width: page.getWidth(), height: page.getHeight(),
    })
  }

  const out = await certDoc.save()
  await writeFile(outPath, out)
}
```

### Example 4: WRONG — Do NOT Do This With Arabic

```typescript
// ❌ BROKEN — Arabic text will be reversed and disconnected
const font = await pdfDoc.embedFont(arabicFontBytes, { subset: true })
page.drawText('شهادة إتمام', { font, size: 24, x: 100, y: 500 })
// Each Arabic letter appears isolated (no joining), in wrong (LTR) order.
// The `features: { rlig: true, fina: true, medi: true, init: true, isol: true }`
// option is IGNORED — it's stored but never applied by drawText().
```

### Example 5: Register fontkit (CORRECT ordering)

```typescript
import { PDFDocument } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

const pdfDoc = await PDFDocument.create()
// MUST call this BEFORE embedFont with custom font bytes
pdfDoc.registerFontkit(fontkit)

// Now safe to embed custom TTF/OTF
const fontBytes = await readFile('./assets/Amiri-Regular.ttf')
const font = await pdfDoc.embedFont(fontBytes, { subset: true })
```

---

## Gotchas & Warnings

### CRITICAL — Arabic / RTL
1. **`page.drawText()` cannot render Arabic correctly** — see "Arabic Text Limitation" section. Use Puppeteer + HTML/CSS for any Arabic visual text. Use pdf-lib only for metadata and merging.

### Metadata & Loading
2. **`updateMetadata: true` is the DEFAULT on `PDFDocument.load()`** — it overwrites the Producer, Creator, and modification date. If you're post-processing someone else's PDF and want to preserve original metadata, pass `updateMetadata: false` then apply your own setters explicitly.

3. **`setKeywords()` takes an ARRAY of strings**, not a comma-separated string. Passing `setKeywords('a, b')` is wrong — use `setKeywords(['a', 'b'])`.

4. **Metadata string values appear to support UTF-16** (PDF Info dictionary uses PDFTextStrings). Arabic metadata values like `setTitle('شهادة')` should be preserved correctly in the PDF file's properties — but verify in Adobe Reader / Preview "Document Properties" panel.

### Fonts
5. **`registerFontkit()` MUST be called before any `embedFont()` with custom (non-standard) fonts**, otherwise `FontkitNotRegisteredError` is thrown. The call is synchronous.

6. **`rgb()` takes 0-1 floats, not 0-255 ints.** `rgb(1, 0, 0)` is pure red. `rgb(255, 0, 0)` will silently produce white-ish garbage (since values >1 are clamped to 1).

7. **Standard fonts only support WinAnsi (Latin)** — 218 characters. Use embedded TTF/OTF for any Unicode beyond Latin (Arabic, Cyrillic, CJK, etc.). Note: even embedded fonts don't fix the Arabic shaping/BiDi problem (see above).

8. **Font subsetting (`subset: true`) does not work for all fonts** — README warns about this (issue #207). Test with your specific Arabic font if you attempt it.

9. **PDF "base 14" fonts don't need to be embedded** — use `pdfDoc.embedStandardFont(StandardFonts.Helvetica)` for the synchronous shortcut.

### Coordinates & Units
10. **Coordinates are in PDF points** (1 pt = 1/72 inch). Origin is at **bottom-left** (PDF default), not top-left like CSS/SVG. Y values increase UPWARD.

11. **Page size `[width, height]`** tuple is in points. `PageSizes.A4` = `[595.28, 841.89]`. `PageSizes.Letter` = `[612, 792]`.

### Saving
12. **`save()` returns `Uint8Array`, not a Buffer.** In Node, you may need `Buffer.from(outBytes)` for some APIs. `writeFile(path, outBytes)` works directly since Uint8Array is accepted.

13. **`useObjectStreams: true` (default) reduces file size** but produces less human-readable PDFs. Fine for production.

14. **`addDefaultPage: true` (default) auto-adds a blank page if the document has none.** If you're loading an existing multi-page PDF and saving, this won't add anything. If you `create()` and never `addPage()`, you'll get one blank page automatically.

### Merging
15. **`copyPages()` copies pages from one `PDFDocument` to another** — they become native pages of the destination. Use `addPage(copiedPage)` to append. Interactivity (forms, links, JavaScript) attached to the copied pages may not transfer reliably.

16. **`pdfDoc.copy()` does NOT copy acroforms, outlines, or interactive features** (per .d.ts comment). Use it only for content-only copies.

17. **`embedPdf()` produces `PDFEmbeddedPage` objects** for use with `page.drawPage()` — this composites one PDF's content into another page, rather than creating new pages.

### General
18. **pdf-lib does NOT support loading encrypted PDFs** by default — throws `EncryptedPDFError`. `{ ignoreEncryption: true }` allows loading but modifications may fail or corrupt the file. Avoid encrypted inputs.

19. **No HTML/CSS support** — explicitly called out in README's "Limitations" section. README recommends Puppeteer for HTML→PDF, matching our recommendation for Arabic.

20. **`Font.layout()` does the right shaping (incl. RTL detection)**, but pdf-lib's public text-drawing API bypasses it. This is the core reason `drawText()` can't do Arabic — not a fontkit limitation, a pdf-lib architectural limitation. Could potentially be worked around by manually calling `font.font.layout()` and writing glyph operators yourself, but that's far out of scope for the certificate pipeline.

---

## API Quick Reference (One-Liners)

```typescript
// Load / Save
const doc = await PDFDocument.create()
const doc = await PDFDocument.load(bytes, { updateMetadata: false })
const bytes: Uint8Array = await doc.save({ useObjectStreams: true })
const b64: string = await doc.saveAsBase64({ dataUri: true })

// Metadata
doc.setTitle('x'); doc.setAuthor('y'); doc.setSubject('z')
doc.setKeywords(['a','b']); doc.setCreator('c'); doc.setProducer('p')
doc.setLanguage('ar'); doc.setCreationDate(new Date()); doc.setModificationDate(new Date())

// Fonts
doc.registerFontkit(fontkit)                      // sync, BEFORE embedFont
const f = await doc.embedFont(StandardFonts.Helvetica)
const f = await doc.embedFont(fontBytes, { subset: true })
const f = doc.embedStandardFont(StandardFonts.HelveticaBold)  // sync, standard only
f.widthOfTextAtSize('Hello', 12); f.heightAtSize(12)
f.encodeText('Hello')  // -> PDFHexString

// Pages
const p = doc.addPage(PageSizes.A4)
const p = doc.addPage([595.28, 841.89])
const p = doc.insertPage(0)
const ps = doc.getPages(); doc.getPageCount()
p.getWidth(); p.getHeight(); p.setSize(w, h)

// Drawing
p.drawText('Hi', { font: f, size: 12, x: 100, y: 100, color: rgb(0,0,0) })
p.drawImage(img, { x: 0, y: 0, width: 200, height: 100 })
p.drawRectangle({ x: 10, y: 10, width: 100, height: 50, color: rgb(1,1,1), borderColor: rgb(0,0,0) })
p.drawLine({ start: {x:0,y:0}, end: {x:100,y:100}, thickness: 1, color: rgb(0,0,0) })

// Merging
const [copied] = await dest.copyPages(src, [0])
dest.addPage(copied)
const [embed] = await dest.embedPdf(srcBytes, [0])
dest.getPages()[0].drawPage(embed, { x: 0, y: 0, width: 612, height: 792 })
```

---

*End of research file. Source: node_modules/pdf-lib@1.17.1 + node_modules/@pdf-lib/fontkit@1.1.1 — all .d.ts files and README.md verified.*
