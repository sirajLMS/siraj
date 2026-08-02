# qrcode v1.5.4 & @types/qrcode v1.5.6 — Node Module Research

## Package Overview

| Field | Value |
|-------|-------|
| **Package** | `qrcode` v1.5.4 |
| **Types** | `@types/qrcode` v1.5.6 (DefinitelyTyped) |
| **License** | MIT |
| **Author** | Ryan Day (`soldair@gmail.com`) |
| **Homepage** | http://github.com/soldair/node-qrcode |
| **Engines** | Node >= 10.13.0 |
| **Runtime Deps** | `dijkstrajs` ^1.0.1, `pngjs` ^5.0.0, `yargs` ^15.3.1 |
| **Type Deps** | `@types/node` * |
| **Entrypoint (server)** | `./lib/index.js` → `./lib/server.js` |
| **Entrypoint (browser)** | `./lib/browser.js` (via `package.json` `browser` field) |

The `qrcode` package is a full-featured QR Code / 2D barcode generator with:
- Both **server-side** (Node.js) and **client-side** (browser) support
- **CLI utility** (`qrcode` bin)
- Output formats: **PNG, SVG, UTF-8 terminal, JPEG/WebP** (data URL only)
- Support for Numeric, Alphanumeric, Kanji, and Byte encoding modes
- **Mixed mode** auto-optimization for smallest QR Code size
- Multibyte character support (emojis, Chinese, Cyrillic, Greek, Japanese)
- Promise / async-await and callback APIs

### Browser vs Server Entry Points

The `package.json` declares a `browser` field that rewrites:
```json
"browser": {
  "./lib/index.js": "./lib/browser.js",
  "fs": false
}
```

This means bundlers (Webpack, Turbopack) will use `lib/browser.js` (Canvas + SVG tag renderer) instead of `lib/server.js` (pngjs + fs). The `fs` module is stubbed out in browser context.

---

## TypeScript Types & Interfaces

All types are defined in `node_modules/@types/qrcode/index.d.ts`.

### Core Types

```typescript
// Error correction level — accepts both short and long forms
export type QRCodeErrorCorrectionLevel =
  | "low" | "medium" | "quartile" | "high"
  | "L" | "M" | "Q" | "H";

// Mask pattern 0–7 (auto-calculated if omitted)
export type QRCodeMaskPattern = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Kanji helper function type
export type QRCodeToSJISFunc = (codePoint: string) => number;
```

### QRCodeOptions (base options for `create()`)

```typescript
export interface QRCodeOptions {
  /** QR Code version (1–40). Auto-calculated if not specified. */
  version?: number | undefined;
  /** Error correction level. @default 'M' */
  errorCorrectionLevel?: QRCodeErrorCorrectionLevel | undefined;
  /** Mask pattern (0–7). Auto-calculated if not specified. */
  maskPattern?: QRCodeMaskPattern | undefined;
  /** Kanji to Shift JIS conversion function. */
  toSJISFunc?: QRCodeToSJISFunc | undefined;
}
```

### QRCodeRenderersOptions (extends QRCodeOptions — used by all renderers)

```typescript
export interface QRCodeRenderersOptions extends QRCodeOptions {
  /** Quiet zone width in modules. @default 4 */
  margin?: number | undefined;
  /** Scale factor: 1 = 1px per module. @default 4 */
  scale?: number | undefined;
  /** Forces specific width (px). Takes precedence over `scale`. Ignored if too small. */
  width?: number | undefined;
  /** Colors in hex RGBA format. */
  color?:
    | {
      /** Dark module color. @default '#000000ff' */
      dark?: string | undefined;
      /** Light module color. @default '#ffffffff' */
      light?: string | undefined;
    }
    | undefined;
}
```

### QRCodeToDataURLOptions

```typescript
export type QRCodeDataURLType = "image/png" | "image/jpeg" | "image/webp";
export type QRCodeToDataURLOptions = QRCodeToDataURLOptionsJpegWebp | QRCodeToDataURLOptionsOther;

// For JPEG/WebP — type is required, supports quality option
export interface QRCodeToDataURLOptionsJpegWebp extends QRCodeRenderersOptions {
  type: "image/jpeg" | "image/webp";
  rendererOpts?: { quality?: number | undefined } | undefined; // 0–1, default 0.92
}

// For PNG (default) — type is optional
export interface QRCodeToDataURLOptionsOther extends QRCodeRenderersOptions {
  type?: Exclude<QRCodeDataURLType, "image/jpeg" | "image/webp"> | undefined;
}
```

### QRCodeToStringOptions

```typescript
export type QRCodeStringType = "utf8" | "svg" | "terminal";
export type QRCodeToStringOptions = QRCodeToStringOptionsTerminal | QRCodeToStringOptionsOther;

// Terminal output — supports `small` option
export interface QRCodeToStringOptionsTerminal extends QRCodeRenderersOptions {
  type: "terminal";
  small?: boolean | undefined; // default false
}

// UTF-8 or SVG output
export interface QRCodeToStringOptionsOther extends QRCodeRenderersOptions {
  type?: Exclude<QRCodeStringType, "terminal"> | undefined;
}
```

### QRCodeToFileOptions

```typescript
export type QRCodeFileType = "png" | "svg" | "utf8";
export type QRCodeToFileOptions = QRCodeToFileOptionsPng | QRCodeToFileOptionsOther;

export interface QRCodeToFileOptionsPng extends QRCodeRenderersOptions {
  type?: "png" | undefined;
  rendererOpts?: {
    deflateLevel?: number | undefined;  // default 9
    deflateStrategy?: number | undefined; // default 3
  } | undefined;
}

export interface QRCodeToFileOptionsOther extends QRCodeRenderersOptions {
  type: Exclude<QRCodeFileType, "png"> | undefined; // "svg" | "utf8"
}
```

### QRCodeToBufferOptions (server only — PNG only)

```typescript
export type QRCodeBufferType = "png";
export interface QRCodeToBufferOptions extends QRCodeRenderersOptions {
  type?: QRCodeBufferType | undefined;
  rendererOpts?: {
    deflateLevel?: number | undefined;  // default 9
    deflateStrategy?: number | undefined; // default 3
  } | undefined;
}
```

### QRCodeToFileStreamOptions (server only — PNG only)

```typescript
export type QRCodeFileStreamType = "png";
export interface QRCodeToFileStreamOptions extends QRCodeRenderersOptions {
  type?: QRCodeFileStreamType | undefined;
  rendererOpts?: {
    deflateLevel?: number | undefined;  // default 9
    deflateStrategy?: number | undefined; // default 3
  } | undefined;
}
```

### Segment Types (for manual mode)

```typescript
export type QRCodeSegmentMode = "alphanumeric" | "numeric" | "byte" | "kanji";

export type QRCodeSegment =
  | QRCodeNumericSegment
  | QRCodeAlphanumericSegment
  | QRCodeByteSegment
  | QRCodeKanjiSegment
  | { mode?: never; data: string | Buffer | Uint8ClampedArray | Uint8Array };

export interface QRCodeNumericSegment   { mode: "numeric";     data: string | number; }
export interface QRCodeAlphanumericSegment { mode: "alphanumeric"; data: string; }
export interface QRCodeByteSegment      { mode: "byte";        data: Buffer | Uint8ClampedArray | Uint8Array; }
export interface QRCodeKanjiSegment      { mode: "kanji";       data: string; }
```

### QRCode Result Object (from `create()`)

```typescript
export interface QRCode {
  modules: BitMatrix;              // BitMatrix with module data
  version: number;                 // Calculated QR Code version (1–40)
  errorCorrectionLevel: ErrorCorrectionLevel;
  maskPattern: QRCodeMaskPattern | undefined;
  segments: GeneratedQRCodeSegment[];
}

export interface BitMatrix {
  size: number;                   // Symbol size (modules per side)
  data: Uint8Array;
  reservedBit: Uint8Array;
  set(row: number, col: number, value: number, reserved: boolean): void;
  get(row: number, col: number): number;
  xor(row: number, col: number, value: number): void;
  isReserved(row: number, col: number): number;
}

export interface ErrorCorrectionLevel {
  bit: 0 | 1 | 2 | 3;
}

export type ModeId = "Numeric" | "Alphanumeric" | "Byte" | "Kanji";
export interface Mode<TModeId extends ModeId = ModeId> {
  id: TModeId;
  bit: number;
  ccBits: readonly number[];
}
```

---

## Available Functions

### `create(text, options?)` — Low-level QR Code data generation

```typescript
export function create(text: string | QRCodeSegment[], options?: QRCodeOptions): QRCode;
```

Creates a QR Code symbol and returns a `QRCode` object containing the `BitMatrix` modules data, version, error correction level, mask pattern, and segments. This is the core function used internally by all renderers. It does NOT produce an image — only the raw QR data structure.

**Throws**: `Error('No input text')` if data is empty/undefined. `Error('The amount of data is too big to be stored in a QR Code')` if data exceeds capacity.

---

### `toCanvas(canvasElement?, text, options?, callback?)` — Render to Canvas

```typescript
// Browser: draw to existing HTMLCanvasElement
export function toCanvas(
  canvasElement: HTMLCanvasElement,
  text: string | QRCodeSegment[],
  callback: (error: Error | null | undefined) => void
): void;
export function toCanvas(
  canvasElement: HTMLCanvasElement,
  text: string | QRCodeSegment[],
  options?: QRCodeRenderersOptions
): Promise<void>;
export function toCanvas(
  canvasElement: HTMLCanvasElement,
  text: string | QRCodeSegment[],
  options: QRCodeRenderersOptions,
  callback: (error: Error | null | undefined) => void
): void;

// Browser: create new canvas element
export function toCanvas(text: string | QRCodeSegment[], options?: QRCodeRenderersOptions): Promise<HTMLCanvasElement>;
export function toCanvas(text: string | QRCodeSegment[], options: QRCodeRenderersOptions, callback: (error: Error | null | undefined, canvas: HTMLCanvasElement) => void): void;

// Server: draw to node-canvas (any compatible canvas object)
export function toCanvas(canvas: any, text: string | QRCodeSegment[], options?: QRCodeRenderersOptions): Promise<void>;
export function toCanvas(canvas: any, text: string | QRCodeSegment[], options: QRCodeRenderersOptions, callback: (error: Error | null | undefined) => void): void;
```

**Note**: Server-side `toCanvas` requires the `canvas` package (`node-canvas`) to be installed as a peer dependency. The `canvas` parameter is typed as `any` in the type definitions.

---

### `toDataURL(text, options?, callback?)` — Render to Data URL string

```typescript
// Server: returns Promise<string> (PNG data URL)
export function toDataURL(text: string | QRCodeSegment[], options?: QRCodeToDataURLOptions): Promise<string>;
export function toDataURL(text: string | QRCodeSegment[], options: QRCodeToDataURLOptions, callback: (error: Error | null | undefined, url: string) => void): void;
export function toDataURL(text: string | QRCodeSegment[], callback: (error: Error | null | undefined, url: string) => void): void;

// Browser: accepts optional HTMLCanvasElement as first arg
export function toDataURL(canvasElement: HTMLCanvasElement, text: string | QRCodeSegment[], options?: QRCodeToDataURLOptions): Promise<string>;
// ... plus callback overloads
```

**Server-side**: Only `image/png` is supported (uses `pngjs`). The data URL format is `data:image/png;base64,...`.

**Browser-side**: Supports `image/png`, `image/jpeg`, and `image/webp` (uses native Canvas `toDataURL()`).

---

### `toString(text, options?, callback?)` — Render to string

```typescript
export function toString(text: string | QRCodeSegment[], options?: QRCodeToStringOptions): Promise<string>;
export function toString(text: string | QRCodeSegment[], options: QRCodeToStringOptions, callback: (error: Error | null | undefined, string: string) => void): void;
export function toString(text: string | QRCodeSegment[], callback: (error: Error | null | undefined, string: string) => void): void;
```

**Output types** (via `options.type`):
- `"utf8"` (default) — ASCII art using block characters (██▀▄)
- `"terminal"` — terminal output with ANSI colors, supports `small` option
- `"svg"` — returns an SVG string (XML with `<svg>` tag, `<path>` elements)

**Server**: All three types supported via `lib/server.js`.
**Browser**: Only SVG supported via `lib/browser.js` (UTF-8 and terminal renderers are server-only).

---

### `toFile(path, text, options?, callback?)` — Save to file (server only)

```typescript
export function toFile(path: string, text: string | QRCodeSegment[], options?: QRCodeToFileOptions): Promise<void>;
export function toFile(path: string, text: string | QRCodeSegment[], options: QRCodeToFileOptions, callback: (error: Error | null | undefined) => void): void;
export function toFile(path: string, text: string | QRCodeSegment[], callback: (error: Error | null | undefined) => void): void;
```

Saves QR Code to an image file. If `options.type` is not specified, the format is **guessed from the file extension**. Recognized extensions: `.png`, `.svg`, `.txt`.

---

### `toBuffer(text, options?, callback?)` — Render to Buffer (server only)

```typescript
export function toBuffer(text: string | QRCodeSegment[], options?: QRCodeToBufferOptions): Promise<Buffer>;
export function toBuffer(text: string | QRCodeSegment[], options: QRCodeToBufferOptions, callback: (error: Error | null | undefined, buffer: Buffer) => void): void;
export function toBuffer(text: string | QRCodeSegment[], callback: (error: Error | null | undefined, buffer: Buffer) => void): void;
```

Returns a `Buffer` containing a PNG representation. **Only PNG format** is supported for buffer output.

---

### `toFileStream(stream, text, options?, callback?)` — Write to stream (server only)

```typescript
export function toFileStream(stream: stream.Writable, text: string | QRCodeSegment[], options?: QRCodeToFileStreamOptions): Promise<void>;
export function toFileStream(stream: stream.Writable, text: string | QRCodeSegment[], options: QRCodeToFileStreamOptions, callback: (error: Error | null | undefined) => void): void;
export function toFileStream(stream: stream.Writable, text: string | QRCodeSegment[], callback: (error: Error | null | undefined) => void): void;
```

Writes QR Code PNG image to a Node.js writable stream. **Only PNG format** is supported.

---

## Options Reference

### QR Code Options (base — used by `create()` and all renderers)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `version` | `number` | auto | QR Code version (1–40). Auto-calculated if not specified. Higher = more modules = more data capacity. Version 1 = 21×21 modules, Version 40 = 177×177 modules. |
| `errorCorrectionLevel` | `"low" \| "medium" \| "quartile" \| "high" \| "L" \| "M" \| "Q" \| "H"` | `"M"` | Error correction level. Determines redundancy and data capacity. |
| `maskPattern` | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6 \| 7` | auto | Mask pattern used to mask the symbol. Auto-calculated for best readability if not specified. |
| `toSJISFunc` | `(codePoint: string) => number` | — | Helper function for Kanji mode. Required only if encoding Shift JIS characters. Import from `qrcode/helper/to-sjis`. |

### Renderer Options (extends QRCodeOptions — used by all render functions)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `margin` | `number` | `4` | Quiet zone width in modules. The blank border around the QR code. Minimum 0. |
| `scale` | `number` | `4` | Scale factor: 1 = 1px per module. Ignored if `width` is specified and large enough. |
| `width` | `number` | — | Forces specific output width in pixels. Takes precedence over `scale`. Ignored if too small to contain the QR symbol (minimum 21px for version 1). |
| `color.dark` | `string` | `"#000000ff"` | Dark module color in hex RGBA format (e.g., `"#000000ff"`, `"#000"`, `"#000000"`). Must be darker than `color.light`. |
| `color.light` | `string` | `"#ffffffff"` | Light module color in hex RGBA format. Use `"#0000"` or `"#00000000"` for transparent background. |

### Output Type Options (per function)

| Function | `type` values | Default | Notes |
|----------|---------------|---------|-------|
| `toDataURL` | `"image/png"` \| `"image/jpeg"` \| `"image/webp"` | `"image/png"` | Server: PNG only. Browser: all three. JPEG/WebP support `rendererOpts.quality` (0–1, default 0.92). |
| `toString` | `"utf8"` \| `"svg"` \| `"terminal"` | `"utf8"` | Terminal type supports `small` boolean option. |
| `toFile` | `"png"` \| `"svg"` \| `"utf8"` | guessed from extension | `.png` → PNG, `.svg` → SVG, `.txt` → UTF-8. PNG supports `rendererOpts.deflateLevel` (default 9) and `rendererOpts.deflateStrategy` (default 3). |
| `toBuffer` | `"png"` | `"png"` | PNG only. Supports `rendererOpts.deflateLevel` and `deflateStrategy`. |
| `toFileStream` | `"png"` | `"png"` | PNG only. |

### Error Correction Level Details

| Level | Resistance | Capacity (Byte mode) | Use Case |
|-------|-----------|---------------------|----------|
| **L** (Low) | ~7% | 2,953 chars | Clean environments, maximum data |
| **M** (Medium) | ~15% | 2,331 chars | Default, general purpose |
| **Q** (Quartile) | ~25% | 1,663 chars | Moderate damage risk |
| **H** (High) | ~30% | 1,273 chars | High damage risk, print, outdoor |

### QR Code Capacity (max characters by mode and error correction)

| Mode | L | M | Q | H |
|------|---|---|---|---|
| Numeric | 7,089 | 5,596 | 3,993 | 3,057 |
| Alphanumeric | 4,296 | 3,391 | 2,420 | 1,852 |
| Byte | 2,953 | 2,331 | 1,663 | 1,273 |
| Kanji | 1,817 | 1,435 | 1,024 | 784 |

### Color Format Details

The `color.dark` and `color.light` options accept hex strings in multiple formats:
- **3-digit hex**: `"#fff"` → expanded to `"#ffffff"` + default alpha `ff`
- **4-digit hex**: `"#fff0"` → expanded to `"#ffffff00"`
- **6-digit hex**: `"#000000"` → alpha defaults to `ff` (opaque)
- **8-digit hex (RGBA)**: `"#000000ff"` → full control

The color must always be a hex string (not a number). Invalid lengths (5, >8) throw `Error('Invalid hex color: ...')`.

For **transparent backgrounds**, set `color.light` to `"#0000"` or `"#00000000"`.

---

## Certificate Use Case

### Generating QR Codes for Verification URLs

For certificate generation, the QR code typically encodes a verification URL like:
```
https://app.example.com/verify/CERT-CODE-123
```

### Recommended Configuration for Certificates

```typescript
import QRCode from 'qrcode';

const verificationUrl = 'https://app.example.com/verify/CERT-CODE-123';

const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
  errorCorrectionLevel: 'M',    // ~15% error resistance — sufficient for printed certificates
  // errorCorrectionLevel: 'Q',  // Alternative: ~25% if certificates may be damaged
  margin: 4,                     // Standard quiet zone (4 modules)
  width: 200,                    // 200px output — crisp at 96 DPI, scannable at print
  color: {
    dark: '#000000ff',           // Black modules (default)
    light: '#ffffffff',          // White background (default)
  },
});
// → "data:image/png;base64,iVBORw0KGgo..."
```

### Error Correction Level Recommendation

| Scenario | Recommended Level | Rationale |
|----------|-------------------|-----------|
| Digital certificates (screen only) | `'M'` (Medium) | Clean display, no damage risk. 15% is sufficient. |
| Printed certificates (standard) | `'M'` or `'Q'` | Print is generally clean. `'M'` suffices for most cases. |
| Printed certificates (outdoor/handled) | `'Q'` (Quartile) | May be folded, smudged, or faded. 25% resistance. |
| Industrial/harsh environments | `'H'` (High) | Maximum 30% resistance. Reduces data capacity but URLs are short. |

**For Siraj certificates**: Use `'M'` as default. URLs are short (< 100 chars), so even `'Q'` or `'H'` would work without capacity issues. If certificates are printed and may be handled frequently, prefer `'Q'`.

### Embedding QR Code in HTML for Puppeteer PDF Render

```typescript
// Step 1: Generate QR code as data URL (server-side)
import QRCode from 'qrcode';

async function generateCertificateHtml(certificateCode: string, verifyBaseUrl: string): Promise<string> {
  const verificationUrl = `${verifyBaseUrl}/verify/${certificateCode}`;
  
  // Generate QR code as base64 PNG data URL
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'M',
    width: 200,
    margin: 2,
  });

  // Embed directly in HTML — no external image file needed
  return `
    <div class="certificate">
      <h1>Certificate of Completion</h1>
      <p>Certificate Code: ${certificateCode}</p>
      <div class="qr-code">
        <img src="${qrCodeDataUrl}" alt="Scan to verify" width="200" height="200" />
      </div>
      <p>Verify online: ${verificationUrl}</p>
    </div>
  `;
}

// Step 2: Pass HTML to Puppeteer for PDF rendering
// (Puppeteer renders the <img> tag with the data URL directly — no file I/O needed)
```

### Key Advantage: Data URL Embedding

The `toDataURL()` function returns a `data:image/png;base64,...` string that can be embedded directly in HTML `<img src="...">` tags. This is ideal for Puppeteer PDF rendering because:
1. **No file I/O** — the QR code is inlined in the HTML
2. **No temp files to clean up** — everything is in-memory
3. **Single render pass** — Puppeteer loads the HTML with the QR already embedded
4. **Works in headless Chrome** — data URLs are fully supported

---

## SVG vs PNG

### SVG Generation

The `qrcode` package supports SVG output via `toString()` with `type: 'svg'`:

```typescript
import QRCode from 'qrcode';

// Generate SVG string
const svgString = await QRCode.toString('https://example.com/verify/CERT-123', {
  type: 'svg',
  errorCorrectionLevel: 'M',
  margin: 2,
});
// Returns: '<?xml version="1.0" encoding="utf-8"?><!DOCTYPE svg...><svg xmlns="...">...</svg>'
```

The SVG renderer (`lib/renderer/svg-tag.js`) generates an SVG with:
- `<svg>` root with `xmlns`, `viewBox`, `shape-rendering="crispEdges"`
- Optional `width`/`height` attributes (only if `width` option is set)
- Background `<path>` with light color fill (omitted if transparent)
- Foreground `<path>` with dark color stroke, using optimized path commands (`M`, `m`, `h`)
- Alpha channel support via `fill-opacity` / `stroke-opacity` attributes

### SVG vs PNG Comparison for Certificate PDFs

| Aspect | PNG (via `toDataURL`) | SVG (via `toString`) |
|--------|----------------------|---------------------|
| **Format** | Raster (base64 data URL) | Vector (XML string) |
| **Scalability** | Fixed resolution — may pixelate when scaled | Infinitely scalable — crisp at any size |
| **File size** | Larger (base64-encoded pixel data) | Smaller (compact path data) |
| **Puppeteer rendering** | Native `<img src="data:...">` support | Inline `<svg>` or `<img src="data:image/svg+xml;...">` |
| **Print quality** | Dependent on `width` option — use 300+ for print | Always crisp — ideal for print certificates |
| **Color control** | RGBA hex (8-digit) | RGBA hex with separate opacity attributes |
| **Transparency** | `color.light: '#0000'` | Omit background or `color.light: '#0000'` |
| **Server dependency** | `pngjs` (bundled) | None (pure string generation) |
| **Browser support** | Native Canvas API | DOM injection or innerHTML |

### Recommendation for Certificates

**Use SVG for printed certificates** — vector format ensures the QR code renders crisply at any DPI in the final PDF. Puppeteer's headless Chrome renders inline SVG perfectly.

**Use PNG (data URL) for digital certificates** or when simplicity is preferred — the `<img src="data:image/png;base64,...">` pattern is simpler and universally supported.

### SVG Embedding Pattern for Puppeteer

```typescript
// Generate SVG string
const svgString = await QRCode.toString(verificationUrl, {
  type: 'svg',
  errorCorrectionLevel: 'M',
  margin: 2,
});

// Embed inline in HTML (recommended for Puppeteer)
const html = `
  <div class="qr-container">
    ${svgString}
  </div>
`;

// OR embed as data URL
const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`;
const html = `<img src="${svgDataUrl}" alt="QR Code" />`;
```

---

## Server-side vs Client-side Generation

### Server-side (Node.js — `lib/server.js`)

Used when importing `qrcode` in a Node.js environment (no bundler browser field redirect):

| Function | Available | Output Formats |
|----------|-----------|----------------|
| `create()` | ✅ | QR data object |
| `toCanvas()` | ✅ (requires `canvas` package) | node-canvas |
| `toDataURL()` | ✅ | PNG only (via `pngjs`) |
| `toString()` | ✅ | `utf8`, `svg`, `terminal` |
| `toFile()` | ✅ | `png`, `svg`, `utf8` (guessed from extension) |
| `toBuffer()` | ✅ | PNG only |
| `toFileStream()` | ✅ | PNG only |

**Key differences**:
- Server-side `toDataURL` uses `pngjs` for PNG encoding (not native Canvas)
- Server-side `toCanvas` requires the `canvas` (node-canvas) package to be installed
- `toFile`, `toBuffer`, `toFileStream` are server-only functions (require `fs`)

### Client-side (Browser — `lib/browser.js`)

The `package.json` `browser` field redirects `./lib/index.js` → `./lib/browser.js` and stubs `fs`:

| Function | Available | Output Formats |
|----------|-----------|----------------|
| `create()` | ✅ | QR data object |
| `toCanvas()` | ✅ | HTMLCanvasElement (native browser Canvas API) |
| `toDataURL()` | ✅ | `image/png`, `image/jpeg`, `image/webp` (native Canvas `toDataURL()`) |
| `toString()` | ✅ | `svg` only (terminal and utf8 renderers are not available in browser) |
| `toFile()` | ❌ | N/A (no `fs`) |
| `toBuffer()` | ❌ | N/A (no `Buffer`) |
| `toFileStream()` | ❌ | N/A (no Node streams) |

### Next.js Considerations

Since Siraj uses Next.js 16 with Turbopack:
- **Server Components / API routes / Server Actions**: Import `qrcode` normally — server entry point is used. `toDataURL` and `toString` work directly (async/await).
- **Client Components**: The `browser` field in `package.json` will redirect to `lib/browser.js`. `toCanvas` and `toDataURL` (with JPEG/WebP support) work in the browser. `toString` only supports SVG in browser context.
- **SSR considerations**: `toCanvas` in server context requires `node-canvas`. For server-side QR generation, prefer `toDataURL` (returns string) or `toString(type: 'svg')` (returns string) — neither requires a Canvas dependency.

### Recommended Pattern for Siraj

```typescript
// Server-side: Generate in API route or Server Component
import QRCode from 'qrcode';

export async function generateCertificateQrCode(certificateCode: string): Promise<string> {
  const url = `${process.env.PUBLIC_BASE_URL}/verify/${certificateCode}`;
  
  // Returns base64 PNG data URL — no canvas dependency needed
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    width: 200,
    margin: 2,
  });
}
```

---

## Deprecations

**No `@deprecated` tags found** in either the `@types/qrcode` type definitions (`index.d.ts`) or the `qrcode` library source code (`lib/`).

The package is clean with no deprecated functions or options.

---

## Usage Examples

### 1. Basic PNG Data URL (server-side, async/await)

```typescript
import QRCode from 'qrcode';

const url = 'https://app.example.com/verify/CERT-2024-001';
const dataUrl = await QRCode.toDataURL(url, {
  errorCorrectionLevel: 'M',
  width: 200,
  margin: 2,
});
// → "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
```

### 2. SVG String (server-side, for Puppeteer PDF)

```typescript
import QRCode from 'qrcode';

const svg = await QRCode.toString('https://app.example.com/verify/CERT-2024-001', {
  type: 'svg',
  errorCorrectionLevel: 'M',
  margin: 2,
});
// → '<?xml version="1.0" encoding="utf-8"?><!DOCTYPE svg PUBLIC...><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" shape-rendering="crispEdges">...</svg>'
```

### 3. Save to File (server-side)

```typescript
import QRCode from 'qrcode';

// Format guessed from extension
await QRCode.toFile('cert-qr.png', 'https://app.example.com/verify/CERT-001', {
  errorCorrectionLevel: 'H',
  width: 300,
  color: {
    dark: '#000000ff',
    light: '#ffffffff',
  },
});

await QRCode.toFile('cert-qr.svg', 'https://app.example.com/verify/CERT-001', {
  type: 'svg',
  errorCorrectionLevel: 'H',
});
```

### 4. Render to Buffer (server-side)

```typescript
import QRCode from 'qrcode';

const buffer = await QRCode.toBuffer('https://app.example.com/verify/CERT-001', {
  errorCorrectionLevel: 'M',
  width: 200,
});
// → Buffer containing PNG image data
```

### 5. Terminal Output (server-side, for debugging)

```typescript
import QRCode from 'qrcode';

const output = await QRCode.toString('https://app.example.com/verify/CERT-001', {
  type: 'terminal',
  small: true,
});
console.log(output);
```

### 6. Manual Segment Mode (optimized encoding)

```typescript
import QRCode from 'qrcode';

const segments = [
  { mode: 'alphanumeric', data: 'CERT-2024-001' },
];

const dataUrl = await QRCode.toDataURL(segments, {
  errorCorrectionLevel: 'M',
  width: 200,
});
```

### 7. Full Certificate QR Generation Function

```typescript
import QRCode from 'qrcode';

interface QrCodeResult {
  dataUrl: string;       // PNG data URL for embedding in HTML
  svgString: string;     // SVG string for vector embedding
  verificationUrl: string;
}

export async function generateCertificateQrCode(
  certificateCode: string,
  options?: {
    baseUrl?: string;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    width?: number;
    format?: 'png' | 'svg';
  },
): Promise<QrCodeResult> {
  const baseUrl = options?.baseUrl ?? process.env.PUBLIC_BASE_URL ?? 'https://app.example.com';
  const verificationUrl = `${baseUrl}/verify/${certificateCode}`;
  const errorCorrectionLevel = options?.errorCorrectionLevel ?? 'M';
  const width = options?.width ?? 200;

  const sharedOpts = {
    errorCorrectionLevel,
    margin: 2,
    width,
    color: { dark: '#000000ff', light: '#ffffffff' },
  };

  const [dataUrl, svgString] = await Promise.all([
    QRCode.toDataURL(verificationUrl, sharedOpts),
    QRCode.toString(verificationUrl, { ...sharedOpts, type: 'svg' as const }),
  ]);

  return { dataUrl, svgString, verificationUrl };
}
```

### 8. Custom Colors (branded certificate)

```typescript
import QRCode from 'qrcode';

// Dark blue QR code on transparent background
const dataUrl = await QRCode.toDataURL('https://app.example.com/verify/CERT-001', {
  errorCorrectionLevel: 'M',
  width: 200,
  color: {
    dark: '#1a237eff',    // Indigo dark
    light: '#00000000',   // Transparent
  },
});
```

### 9. Callback Pattern (if not using async/await)

```typescript
import QRCode from 'qrcode';

QRCode.toDataURL('https://app.example.com/verify/CERT-001', {
  errorCorrectionLevel: 'M',
  width: 200,
}, (err, url) => {
  if (err) {
    console.error('QR generation failed:', err);
    return;
  }
  console.log('QR code data URL:', url);
});
```

---

## Gotchas & Warnings

### 1. Server-side `toDataURL` Only Supports PNG
On the server, `toDataURL` uses `pngjs` (not native Canvas), so only `image/png` is supported. JPEG and WebP data URLs are **browser-only** (they rely on the native Canvas `toDataURL()` API). If you try `type: 'image/jpeg'` on the server, it falls back to the PNG renderer (the `getRendererFromType` function defaults to PngRenderer for unknown/non-svg types).

### 2. `toCanvas` on Server Requires `canvas` Package
Server-side `toCanvas` requires the [`canvas`](https://github.com/Automattic/node-canvas) npm package (a native addon). It is listed as a **devDependency**, not a regular dependency. If you need server-side canvas rendering, you must install it separately: `npm install canvas`. For server-side QR generation without canvas, use `toDataURL` or `toString` instead.

### 3. Browser `toString` Only Supports SVG
In the browser (`lib/browser.js`), `toString` is bound to the SVG tag renderer only. The `utf8` and `terminal` renderers require Node.js and are not available in browser contexts. If you call `toString` with `type: 'terminal'` in the browser, it will silently fall back to SVG rendering.

### 4. `width` Option Minimum Is 21px
The `width` option is ignored if it's less than 21 (the size of a version 1 QR code: 21×21 modules). The code in `renderer/utils.js` explicitly checks: `const width = options.width && options.width >= 21 ? options.width : undefined`. If `width` is too small to contain the QR symbol + margin, the `scale` option is used instead.

### 5. `width` Takes Precedence Over `scale`
When both `width` and `scale` are specified, `width` wins. The effective scale is calculated as `width / (qrSize + margin * 2)`. The `scale` option is only used when `width` is not specified or is too small.

### 6. Color Format Must Be Hex String
Colors must be hex strings (not numbers). Valid formats: `"#fff"`, `"#ffff"` (4-digit with alpha), `"#ffffff"`, `"#ffffffff"`. Invalid: `"rgb(0,0,0)"`, named colors, or numeric values. Invalid lengths (5 or >8 hex digits after `#`) throw `Error('Invalid hex color: ...')`.

### 7. Alpha Channel in Colors
- 3-digit hex `"#000"` → alpha defaults to `ff` (opaque)
- 6-digit hex `"#000000"` → alpha defaults to `ff` (opaque)
- 8-digit hex `"#000000ff"` → explicit alpha
- For **transparent background**: use `color.light: '#0000'` or `'#00000000'`

### 8. Binary Data Encoding (TypeScript gotcha)
When encoding binary data as byte segments, the `@types/qrcode` types expect `data: Buffer | Uint8ClampedArray | Uint8Array` for `mode: 'byte'`. However, the README notes that TypeScript users may need `// @ts-ignore` above data segments that pass regular arrays, because the types are strict about the data type.

### 9. Promise Detection in Browser
The `can-promise.js` module checks `typeof Promise === 'function'`. In environments without Promise support (some React Native versions), callbacks are required. In modern browsers and Node.js, promises work by default.

### 10. No Built-in ECI Support
The library does not fully implement ECI (Extended Channel Interpretation). Multibyte characters (UTF-8) are encoded in Byte mode and most QR readers can recognize them without ECI, but this is not guaranteed by the QR standard.

### 11. Kanji Mode Requires External Helper
Kanji mode requires a Shift JIS conversion function (`toSJISFunc`). The conversion table is **not included** in the main bundle to keep size small. Import it separately: `require('qrcode/helper/to-sjis')`. Without this function, Kanji characters are encoded in Byte mode instead (less efficient but functional).

### 12. `version` Constraint Can Throw
If you specify a `version` that is too small to contain the data at the given error correction level, the library throws: `Error('The chosen QR Code version cannot contain this amount of data. Minimum version required to store current data is: N.')`. For URLs, leave `version` unspecified to let the library auto-detect the optimal version.

### 13. SVG Output Does Not Support `scale`
The SVG renderer ignores the `scale` option — it generates a viewBox-based vector that scales to any size. The `width` option, if specified, is applied as the `width`/`height` attributes on the `<svg>` tag. Without `width`, the SVG has no fixed dimensions and scales to fill its container.

### 14. File Type Auto-Detection from Extension
`toFile()` guesses the output format from the file extension if `options.type` is not specified. Recognized extensions: `.png`, `.svg`, `.txt`. Unrecognized extensions default to PNG. The extension extraction is: `path.slice((path.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase()`.

### 15. No Stream Support for SVG
`toFileStream()` only supports PNG. There is no streaming SVG output. For SVG, use `toString(type: 'svg')` and write the result string to your stream manually.

### 16. Import Style
Use `import QRCode from 'qrcode'` (default import). The module uses `module.exports` (CommonJS), so in ESM contexts the default import gets the entire exports object. Named imports are also possible with bundlers that interop CJS: `import { toDataURL, toString, create } from 'qrcode'`.

### 17. CLI Tool Available
The package ships a CLI bin at `./bin/qrcode`. Usage:
```
qrcode "https://example.com/verify/CERT-001"           # Draw in terminal
qrcode -o cert-qr.png "https://example.com/verify/..."  # Save as PNG
qrcode -t svg -o cert-qr.svg "https://example.com/..."  # Save as SVG
qrcode -e H -w 300 -o cert-qr.png "https://example..."   # High EC, 300px
```
