# sharp v0.35.3 — Node Module Research

## Package Overview

**sharp** is a high-performance Node.js image processing module built on [libvips](https://github.com/libvips/libvips). It is the fastest module to resize JPEG, PNG, WebP, GIF, AVIF and TIFF images. It works with all JavaScript runtimes that support Node-API v9, including Node.js (>= 20.9.0), Deno, and Bun.

- **Version**: 0.35.3
- **License**: Apache-2.0
- **Author**: Lovell Fuller
- **Homepage**: https://sharp.pixelplumbing.com
- **Package type**: CommonJS (`"type": "commonjs"`) with ESM support
- **Entry points**:
  - CJS: `./dist/index.cjs`
  - ESM: `./dist/index.mjs`
  - Types: `./dist/index.d.mts` (ESM), `./dist/index.d.cts` (CJS)
- **Engine requirement**: `node >= 20.9.0`

### Supported Formats

| Format | Input | Output |
|--------|-------|--------|
| JPEG | ✅ | ✅ |
| PNG | ✅ | ✅ |
| WebP | ✅ | ✅ |
| AVIF | ✅ | ✅ |
| GIF | ✅ | ✅ |
| TIFF | ✅ | ✅ |
| SVG | ✅ | ✅ (rasterized to PNG by default) |
| JP2 (JPEG 2000) | ✅ (requires libvips + OpenJPEG) | ✅ (requires libvips + OpenJPEG) |
| JXL (JPEG XL) | ✅ (experimental, requires libjxl) | ✅ (experimental, requires libjxl) |
| HEIF/HEIC | ✅ (requires libheif + libde265 + x265) | ✅ (requires libheif) |
| PDF | ✅ (requires PDFium/Poppler) | ✅ |
| RAW pixel data | ✅ | ✅ |
| DZI (Deep Zoom) | — | ✅ |
| EXR, FITS, PPM, RAD | ✅ | — |

---

## TypeScript Types & Interfaces

The type definitions are in `node_modules/sharp/lib/index.d.ts` (also emitted as `dist/index.d.mts` and `dist/index.d.cts`). All types are exported under the `sharp` namespace via `export = sharp`.

### Import Pattern

```typescript
import sharp from 'sharp';
// Types are available on the sharp namespace
// e.g., sharp.SharpOptions, sharp.Metadata, sharp.ResizeOptions, etc.
```

### Sharp (interface)

The main chainable instance — extends `stream.Duplex`.

```typescript
interface Sharp extends Duplex {
  // Channel operations
  removeAlpha(): Sharp;
  ensureAlpha(alpha?: number): Sharp;
  extractChannel(channel: 0 | 1 | 2 | 3 | 'red' | 'green' | 'blue' | 'alpha'): Sharp;
  joinChannel(images: string | Buffer | ArrayLike<string | Buffer>, options?: SharpOptions): Sharp;
  bandbool(boolOp: 'and' | 'or' | 'eor'): Sharp;

  // Color operations
  tint(tint: ColorLike): Sharp;
  greyscale(greyscale?: boolean): Sharp;
  grayscale(grayscale?: boolean): Sharp;
  pipelineColourspace(colourspace?: string): Sharp;
  pipelineColorspace(colorspace?: string): Sharp;
  toColourspace(colourspace?: string): Sharp;
  toColorspace(colorspace: string): Sharp;

  // Composite
  composite(images: OverlayOptions[]): Sharp;

  // Input/metadata
  clone(): Sharp;
  metadata(callback?: (err: Error, metadata: Metadata) => void): Sharp | Promise<Metadata>;
  keepMetadata(): Sharp;
  stats(callback?: (err: Error, stats: Stats) => void): Sharp | Promise<Stats>;

  // Operations
  rotate(angle?: number, options?: RotateOptions): Sharp;
  autoOrient(): Sharp;
  flip(flip?: boolean): Sharp;
  flop(flop?: boolean): Sharp;
  affine(matrix: [number, number, number, number] | Matrix2x2, options?: AffineOptions): Sharp;
  sharpen(options?: SharpenOptions): Sharp;
  median(size?: number): Sharp;
  blur(sigma?: number | boolean | BlurOptions): Sharp;
  dilate(width?: number): Sharp;
  erode(width?: number): Sharp;
  flatten(flatten?: boolean | FlattenOptions): Sharp;
  unflatten(): Sharp;
  gamma(gamma?: number, gammaOut?: number): Sharp;
  negate(negate?: boolean | NegateOptions): Sharp;
  normalise(normalise?: NormaliseOptions): Sharp;
  normalize(normalize?: NormaliseOptions): Sharp;
  clahe(options: ClaheOptions): Sharp;
  convolve(kernel: Kernel): Sharp;
  threshold(threshold?: number, options?: ThresholdOptions): Sharp;
  boolean(operand: string | Buffer, operator: 'and' | 'or' | 'eor', options?: { raw: Raw }): Sharp;
  linear(a?: number | number[] | null, b?: number | number[]): Sharp;
  recomb(inputMatrix: Matrix3x3 | Matrix4x4): Sharp;
  modulate(options?: { brightness?: number; saturation?: number; hue?: number; lightness?: number }): Sharp;

  // Output
  toFile(fileOut: string, callback?: (err: Error, info: OutputInfo) => void): Sharp | Promise<OutputInfo>;
  toBuffer(options?: { resolveWithObject: boolean }): Promise<Buffer | { data: Buffer; info: OutputInfo }>;
  toUint8Array(): Promise<{ data: Uint8Array; info: OutputInfo }>;
  withDensity(density: number): Sharp;
  keepExif(): Sharp;
  withExif(exif: Exif): Sharp;
  withExifMerge(exif: Exif): Sharp;
  keepIccProfile(): Sharp;
  withIccProfile(icc: string, options?: WithIccProfileOptions): Sharp;
  keepXmp(): Sharp;
  withXmp(xmp: string): Sharp;
  withMetadata(withMetadata?: WriteableMetadata): Sharp;

  // Format outputs
  jpeg(options?: JpegOptions): Sharp;
  jp2(options?: Jp2Options): Sharp;
  jxl(options?: JxlOptions): Sharp;
  png(options?: PngOptions): Sharp;
  webp(options?: WebpOptions): Sharp;
  gif(options?: GifOptions): Sharp;
  avif(options?: AvifOptions): Sharp;
  heif(options?: HeifOptions): Sharp;
  tiff(options?: TiffOptions): Sharp;
  raw(options?: RawOptions): Sharp;
  toFormat(format: keyof FormatEnum | AvailableFormatInfo | 'avif', options?: OutputOptions | JpegOptions | PngOptions | WebpOptions | AvifOptions | HeifOptions | JxlOptions | GifOptions | Jp2Options | RawOptions | TiffOptions): Sharp;
  tile(tile?: TileOptions): Sharp;
  timeout(options: TimeoutOptions): Sharp;

  // Resize
  resize(widthOrOptions?: number | ResizeOptions | null, height?: number | null, options?: ResizeOptions): Sharp;
  extend(extend: number | ExtendOptions): Sharp;
  extract(region: Region): Sharp;
  trim(options?: TrimOptions): Sharp;
}
```

### SharpOptions

Creates a sharp instance with configuration. Used as the second argument to `sharp(input, options)` or as the only argument for `sharp(options)` (blank image creation).

```typescript
interface SharpOptions {
  autoOrient?: boolean;              // Auto-orient based on EXIF Orientation tag
  failOn?: 'none' | 'truncated' | 'error' | 'warning';  // Default: 'warning'
  limitInputPixels?: number | boolean;  // Default: 268402689 (0x3FFF x 0x3FFF)
  limitInputChannels?: number | boolean; // Default: 5
  unlimited?: boolean;               // Remove safety features (SVG, PNG). Default: false
  sequentialRead?: boolean;          // Default: true
  density?: number;                  // DPI for SVG/PDF rendering. Default: 72. Range: 1–100000
  ignoreIcc?: boolean;               // Ignore embedded ICC profile
  pages?: number;                    // Number of pages for multi-page input. -1 for all
  page?: number;                     // Starting page (zero-based). Default: 0
  tiff?: TiffInputOptions;           // TIFF-specific input options
  svg?: SvgInputOptions;             // SVG-specific input options
  pdf?: PdfInputOptions;             // PDF-specific input options (requires global libvips)
  openSlide?: OpenSlideInputOptions; // OpenSlide-specific input options
  jp2?: Jp2InputOptions;             // JPEG 2000 specific input options
  animated?: boolean;                // Read all frames of animated image. Default: false
  raw?: CreateRaw;                   // Raw pixel input description
  create?: Create;                    // Create a new blank image
  text?: CreateText;                  // Create a new text image
  join?: Join;                        // Join multiple input images

  // Deprecated:
  /** @deprecated Use SharpOptions.tiff instead */
  subifd?: number;
  /** @deprecated Use SharpOptions.pdf instead */
  pdfBackground?: ColorLike;
  /** @deprecated Use SharpOptions.openSlide instead */
  level?: number;
}
```

### SharpInput (type)

```typescript
type SharpInput =
  | Buffer
  | ArrayBuffer
  | Uint8Array
  | Uint8ClampedArray
  | Int8Array
  | Uint16Array
  | Int16Array
  | Uint32Array
  | Int32Array
  | Float32Array
  | Float64Array
  | string;
```

### OutputOptions

```typescript
interface OutputOptions {
  force?: boolean;  // Force format output. Default: true
}
```

### JpegOptions (extends OutputOptions)

```typescript
interface JpegOptions extends OutputOptions {
  quality?: number;              // 1-100. Default: 80
  progressive?: boolean;        // Interlace scan. Default: false
  chromaSubsampling?: string;   // '4:2:0' (default) or '4:4:4' (when quality <= 90)
  trellisQuantisation?: boolean; // Default: false
  overshootDeringing?: boolean;  // Default: false
  optimiseScans?: boolean;       // Force progressive. Default: false
  optimizeScans?: boolean;       // Alt spelling
  optimiseCoding?: boolean;     // Default: true
  optimizeCoding?: boolean;     // Alt spelling
  quantisationTable?: number;    // 0-8. Default: 0
  quantizationTable?: number;    // Alt spelling
  mozjpeg?: boolean;             // Use mozjpeg defaults. Default: false
}
```

### PngOptions (extends OutputOptions)

```typescript
interface PngOptions extends OutputOptions {
  progressive?: boolean;         // Interlace scan. Default: false
  compressionLevel?: number;     // zlib level 0-9. Default: 6
  adaptiveFiltering?: boolean;   // Default: false
  quality?: number;              // 1-100. Default: 100
  effort?: number;              // CPU effort 1-10, sets palette=true. Default: 7
  palette?: boolean;             // Quantize to palette. Default: false
  colours?: number;              // Max palette entries. Default: 256
  colors?: number;              // Alt spelling
  dither?: number;              // Floyd-Steinberg error diffusion. Default: 1.0
}
```

### WebpOptions (extends OutputOptions, AnimationOptions)

```typescript
interface WebpOptions extends OutputOptions, AnimationOptions {
  quality?: number;              // 1-100. Default: 80
  alphaQuality?: number;         // 0-100. Default: 100
  lossless?: boolean;            // Default: false
  nearLossless?: boolean;        // Default: false
  smartSubsample?: boolean;      // Default: false
  smartDeblock?: boolean;        // Default: false
  effort?: number;              // CPU effort 0-6. Default: 4
  minSize?: boolean;            // Default: false
  mixed?: boolean;               // Default: false
  preset?: 'default' | 'picture' | 'photo' | 'drawing' | 'icon' | 'text';  // Default: 'default'
  exact?: boolean;              // Preserve colour in transparent pixels. Default: false
}
```

### AvifOptions (extends OutputOptions)

```typescript
interface AvifOptions extends OutputOptions {
  quality?: number;              // 1-100. Default: 50
  lossless?: boolean;            // Default: false
  effort?: number;              // CPU effort 0-9. Default: 4
  chromaSubsampling?: string;   // Default: '4:4:4' ('4:2:0' possible)
  bitdepth?: 8 | 10 | 12;       // Default: 8
  tune?: 'auto' | 'iq' | 'psnr' | 'ssim';  // Default: 'auto'
}
```

### TiffOptions (extends OutputOptions)

```typescript
interface TiffOptions extends OutputOptions {
  quality?: number;              // 1-100. Default: 80
  compression?: string;         // none|jpeg|deflate|packbits|ccittfax4|lzw|webp|zstd|jp2k. Default: 'jpeg'
  bigtiff?: boolean;            // Default: false
  predictor?: string;           // none|horizontal|float. Default: 'horizontal'
  pyramid?: boolean;            // Default: false
  tile?: boolean;               // Default: false
  tileWidth?: number;           // Default: 256
  tileHeight?: number;          // Default: 256
  xres?: number;                // Pixels/mm. Default: 1.0
  yres?: number;                // Pixels/mm. Default: 1.0
  bitdepth?: 1 | 2 | 4;         // Reduced bitdepth
  miniswhite?: boolean;         // Default: false
  resolutionUnit?: 'inch' | 'cm';  // Default: 'inch'
}
```

### HeifOptions (extends OutputOptions)

```typescript
interface HeifOptions extends OutputOptions {
  quality?: number;              // 1-100. Default: 50
  compression?: 'av1' | 'hevc'; // Default: 'av1'
  lossless?: boolean;            // Default: false
  effort?: number;              // 0-9. Default: 4
  chromaSubsampling?: string;   // Default: '4:4:4'
  bitdepth?: 8 | 10 | 12;       // Default: 8
  tune?: 'auto' | 'iq' | 'psnr' | 'ssim';  // Default: 'auto'
}
```

### GifOptions (extends OutputOptions, AnimationOptions)

```typescript
interface GifOptions extends OutputOptions, AnimationOptions {
  reuse?: boolean;               // Re-use existing palette. Default: true
  progressive?: boolean;         // Interlace scan
  colours?: number;              // Max palette entries 2-256. Default: 256
  colors?: number;              // Alt spelling
  effort?: number;              // CPU effort 1-10. Default: 7
  dither?: number;              // Floyd-Steinberg 0-1. Default: 1.0
  interFrameMaxError?: number;  // 0 (lossless) - 32. Default: 0
  interPaletteMaxError?: number; // 0-256. Default: 3
  keepDuplicateFrames?: boolean; // Default: false
}
```

### JxlOptions (extends OutputOptions) — Experimental

```typescript
interface JxlOptions extends OutputOptions {
  distance?: number;            // 0 (highest) - 15 (lowest). Default: 1.0
  quality?: number;             // 1-100, overrides distance
  decodingTier?: number;        // 0-4. Default: 0
  lossless?: boolean;           // Default: false
  effort?: number;              // 3 (fastest) - 9 (slowest). Default: 7
}
```

### Jp2Options (extends OutputOptions)

```typescript
interface Jp2Options extends OutputOptions {
  quality?: number;             // 1-100. Default: 80
  lossless?: boolean;           // Default: false
  tileWidth?: number;          // Default: 512
  tileHeight?: number;         // Default: 512
  chromaSubsampling?: '4:4:4' | '4:2:0';  // Default: '4:4:4'
}
```

### ResizeOptions

```typescript
interface ResizeOptions {
  width?: number;               // Alternative to positional width arg
  height?: number;              // Alternative to positional height arg
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';  // Default: 'cover'
  position?: number | string;  // Position, gravity or strategy. Default: 'centre'
  background?: ColorLike;       // Background for 'contain' fit. Default: {r:0,g:0,b:0,alpha:1}
  kernel?: 'nearest' | 'cubic' | 'linear' | 'mitchell' | 'lanczos2' | 'lanczos3' | 'mks2013' | 'mks2021';  // Default: 'lanczos3'
  withoutEnlargement?: boolean; // Don't enlarge if already smaller. Default: false
  withoutReduction?: boolean;   // Don't reduce if already larger. Default: false
  fastShrinkOnLoad?: boolean;   // JPEG/WebP shrink-on-load. Default: true
}
```

### CompositeOptions / OverlayOptions (extends SharpOptions)

```typescript
interface OverlayOptions extends SharpOptions {
  input?: string | Buffer | { create: Create } | { text: CreateText } | { raw: CreateRaw };
  blend?: Blend;               // Blend mode. Default: 'over'
  gravity?: Gravity;           // Placement gravity. Default: 'centre'
  top?: number;                 // Pixel offset from top edge
  left?: number;                // Pixel offset from left edge
  tile?: boolean;               // Repeat overlay across image. Default: false
  premultiplied?: boolean;      // Avoid premultiplying below. Default: false
  density?: number;             // DPI for vector overlay. Default: 72
  animated?: boolean;           // Read all frames. Default: false
  failOn?: 'none' | 'truncated' | 'error' | 'warning';  // Default: 'warning'
  limitInputPixels?: number | boolean;  // Default: 268402689
  autoOrient?: boolean;
}
```

### Region

```typescript
interface Region {
  left: number;    // Zero-indexed offset from left edge (0–100000000)
  top: number;     // Zero-indexed offset from top edge (0–100000000)
  width: number;   // Extracted region width (0–100000000)
  height: number;  // Extracted region height (0–100000000)
}
```

### ExtendOptions

```typescript
interface ExtendOptions {
  top?: number;       // Pixels to extend top (0-10000). Default: 0
  left?: number;      // Pixels to extend left (0-10000). Default: 0
  bottom?: number;    // Pixels to extend bottom (0-10000). Default: 0
  right?: number;     // Pixels to extend right (0-10000). Default: 0
  background?: ColorLike;  // Default: {r:0,g:0,b:0,alpha:1}
  extendWith?: 'background' | 'copy' | 'repeat' | 'mirror';  // Default: 'background'
}
```

### TrimOptions

```typescript
interface TrimOptions {
  background?: ColorLike;  // Default: top-left pixel colour
  threshold?: number;      // Allowed colour difference. Default: 10
  lineArt?: boolean;       // For vector/line art input. Default: false
  margin?: number;         // Pixels of margin to keep (0-10000000). Default: 0
}
```

### Metadata

```typescript
interface Metadata {
  orientation?: number;          // EXIF Orientation value
  format: keyof FormatEnum;     // Decoder name (jpeg, png, webp, gif, svg, etc.)
  size?: number;                 // Total size in bytes (Stream/Buffer input only)
  width: number;                 // Pixels wide (ignores EXIF orientation)
  height: number;                // Pixels high (ignores EXIF orientation)
  autoOrient: {                  // Dimensions after EXIF orientation applied
    width: number;
    height: number;
  };
  space: keyof ColourspaceEnum;  // Colour space interpretation
  channels: Channels;           // Number of bands (3=sRGB, 4=CMYK or RGBA)
  depth: keyof DepthEnum;        // Pixel depth format (uchar, char, ushort, float, etc.)
  density?: number;              // Pixels per inch (DPI)
  chromaSubsampling?: string;    // JPEG chroma subsampling
  isProgressive: boolean;        // Progressive scan interlaced?
  isPalette: boolean;            // Palette-based? (GIF, PNG)
  bitsPerSample?: number;        // Bits per sample per channel (GIF, PNG)
  pages?: number;                // Pages/frames (TIFF, HEIF, PDF, animated GIF/WebP)
  pageHeight?: number;           // Pixel height per page
  loop?: number;                 // Animation loop count (0 = infinite)
  delay?: number[];              // Delay in ms between pages
  pagePrimary?: number;          // Primary page in HEIF
  hasProfile: boolean;           // Has embedded ICC profile?
  hasAlpha: boolean;             // Has alpha transparency channel?
  exif?: Buffer;                 // Raw EXIF data
  icc?: Buffer;                  // Raw ICC profile data
  iptc?: Buffer;                 // Raw IPTC data
  xmp?: Buffer;                  // Raw XMP data
  xmpAsString?: string;          // XMP as UTF-8 string
  tifftagPhotoshop?: Buffer;     // TIFF TIFFTAG_PHOTOSHOP data
  compression?: 'av1' | 'hevc';  // HEIF encoder
  background?: { r: number; g: number; b: number } | { gray: number };  // Default bKGD (PNG/GIF)
  levels?: LevelMetadata[];      // Multi-level image (OpenSlide)
  subifds?: number;              // Sub IFDs in OME-TIFF
  resolutionUnit?: 'inch' | 'cm';  // Density unit
  formatMagick?: string;         // Format for *magick loaded images
  comments?: CommentsMetadata[]; // PNG text blocks
  gainMap?: GainMapMetadata;     // HDR gain map
  mediaType?: MediaType;         // MIME type
}
```

### Stats

```typescript
interface Stats {
  channels: ChannelStats[];
  isOpaque: boolean;            // Is image opaque?
  entropy: number;              // Greyscale entropy estimate
  sharpness: number;            // Greyscale sharpness estimate
  dominant: { r: number; g: number; b: number };  // Dominant sRGB colour
}

interface ChannelStats {
  min: number;
  max: number;
  sum: number;
  squaresSum: number;
  mean: number;
  stdev: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
```

### OutputInfo

```typescript
interface OutputInfo {
  format: string;
  size: number;                // Bytes
  width: number;
  height: number;
  channels: Channels;
  premultiplied: boolean;
  hasAlpha: boolean;
  cropOffsetLeft?: number;     // Only with crop strategy
  cropOffsetTop?: number;      // Only with crop strategy
  trimOffsetLeft?: number;     // Only with trim
  trimOffsetTop?: number;      // Only with trim
  textAutofitDpi?: number;     // Only with text input
  attentionX?: number;         // Focal point (attention strategy)
  attentionY?: number;
  pages?: number;              // Animated output pages
  pageHeight?: number;
}
```

### AvailableFormatInfo

```typescript
interface AvailableFormatInfo {
  id: string;
  input: { file: boolean; buffer: boolean; stream: boolean; fileSuffix?: string[] };
  output: { file: boolean; buffer: boolean; stream: boolean; alias?: string[] };
}
```

### Enums & Constant Types

#### FormatEnum

```typescript
interface FormatEnum {
  dcraw: AvailableFormatInfo;
  dz: AvailableFormatInfo;
  exr: AvailableFormatInfo;
  fits: AvailableFormatInfo;
  gif: AvailableFormatInfo;
  heif: AvailableFormatInfo;
  jpeg: AvailableFormatInfo;
  jp2: AvailableFormatInfo;
  jxl: AvailableFormatInfo;
  magick: AvailableFormatInfo;
  openslide: AvailableFormatInfo;
  pdf: AvailableFormatInfo;
  png: AvailableFormatInfo;
  ppm: AvailableFormatInfo;
  rad: AvailableFormatInfo;
  raw: AvailableFormatInfo;
  svg: AvailableFormatInfo;
  tiff: AvailableFormatInfo;
  vips: AvailableFormatInfo;
  webp: AvailableFormatInfo;
}
```

#### FitEnum

```typescript
interface FitEnum {
  contain: 'contain';  // Embed within both dimensions (letterbox)
  cover: 'cover';      // Crop to cover both dimensions (default)
  fill: 'fill';        // Stretch ignoring aspect ratio
  inside: 'inside';    // Max dimensions, preserving aspect ratio
  outside: 'outside';  // Min dimensions, preserving aspect ratio
}
```

#### KernelEnum

```typescript
interface KernelEnum {
  nearest: 'nearest';
  cubic: 'cubic';
  linear: 'linear';
  mitchell: 'mitchell';
  lanczos2: 'lanczos2';
  lanczos3: 'lanczos3';   // Default
  mks2013: 'mks2013';     // Magic Kernel Sharp 2013 (Facebook)
  mks2021: 'mks2021';     // Magic Kernel Sharp 2021
}
```

#### GravityEnum

```typescript
interface GravityEnum {
  north: number; northeast: number;
  southeast: number; south: number;
  southwest: number; west: number;
  northwest: number; east: number;
  center: number; centre: number;
}
```

#### StrategyEnum

```typescript
interface StrategyEnum {
  entropy: number;    // Highest Shannon entropy region
  attention: number;  // Highest luminance frequency, colour saturation, skin tones
}
```

#### BoolEnum

```typescript
interface BoolEnum {
  and: 'and';
  or: 'or';
  eor: 'eor';
}
```

#### PresetEnum (WebP)

```typescript
interface PresetEnum {
  default: 'default';
  picture: 'picture';
  photo: 'photo';
  drawing: 'drawing';
  icon: 'icon';
  text: 'text';
}
```

#### ColourspaceEnum

```typescript
interface ColourspaceEnum {
  'b-w': string;  cmc: string;  cmyk: string;  fourier: string;
  grey16: string;  histogram: string;  hsv: string;  lab: string;
  labq: string;  labs: string;  lch: string;  matrix: string;
  multiband: string;  rgb: string;  rgb16: string;  scrgb: string;
  srgb: string;  xyz: string;  yxy: string;
}
```

#### DepthEnum

```typescript
interface DepthEnum {
  char: string;  complex: string;  double: string;  dpcomplex: string;
  float: string;  int: string;  short: string;  uchar: string;
  uint: string;  ushort: string;
}
```

#### Blend (type)

```typescript
type Blend =
  | 'clear' | 'source' | 'over' | 'in' | 'out' | 'atop'
  | 'dest' | 'dest-over' | 'dest-in' | 'dest-out' | 'dest-atop'
  | 'xor' | 'add' | 'saturate' | 'multiply' | 'screen' | 'overlay'
  | 'darken' | 'lighten'
  | 'color-dodge' | 'colour-dodge'
  | 'color-burn' | 'colour-burn'
  | 'hard-light' | 'soft-light'
  | 'difference' | 'exclusion';
```

#### Channels (type)

```typescript
type Channels = 1 | 2 | 3 | 4;
// 1 = grayscale, 2 = grayscale + alpha, 3 = sRGB, 4 = CMYK or RGBA
```

#### FailOnOptions (type)

```typescript
type FailOnOptions = 'none' | 'truncated' | 'error' | 'warning';
```

#### Interpolators

```typescript
interface Interpolators {
  nearest: 'nearest';
  bilinear: 'bilinear';
  bicubic: 'bicubic';                  // Default
  locallyBoundedBicubic: 'lbb';
  nohalo: 'nohalo';
  vertexSplitQuadraticBasisSpline: 'vsqbs';
}
```

#### Matrix Types

```typescript
type Matrix2x2 = [[number, number], [number, number]];
type Matrix3x3 = [[number, number, number], [number, number, number], [number, number, number]];
type Matrix4x4 = [[number, number, number, number], [number, number, number, number], [number, number, number, number], [number, number, number, number]];
```

#### Other Supporting Types

```typescript
type Color = ColorLike;  // from '@img/colour' — e.g. { r: 255, g: 0, b: 0, alpha: 0.5 } or '#ff0000'
type Colour = ColorLike;
type Gravity = number | string;
type ExtendWith = 'background' | 'copy' | 'repeat' | 'mirror';
type HeifCompression = 'av1' | 'hevc';
type HeifTune = 'auto' | 'iq' | 'psnr' | 'ssim';
type Unit = 'inch' | 'cm';
type Precision = 'integer' | 'float' | 'approximate';
type TextAlign = 'left' | 'centre' | 'center' | 'right';
type TextWrap = 'word' | 'char' | 'word-char' | 'none';
type HorizontalAlignment = 'left' | 'centre' | 'center' | 'right';
type VerticalAlignment = 'top' | 'centre' | 'center' | 'bottom';
type TileContainer = 'fs' | 'zip';
type TileLayout = 'dz' | 'iiif' | 'iiif3' | 'zoomify' | 'google';
```

---

## Core API

### `sharp(input?, options?)` — Constructor

Creates a sharp instance for image processing. Implements `stream.Duplex`.

```typescript
// No input — stream-based pipeline
sharp(): Sharp

// Options only — create a blank image or text image
sharp(options: SharpOptions): Sharp

// Input with optional options
sharp(input: SharpInput | SharpInput[], options?: SharpOptions): Sharp
```

**Input types:**
- `Buffer` — containing JPEG, PNG, WebP, AVIF, GIF, SVG or TIFF image data
- `ArrayBuffer` / `Uint8Array` / `Uint8ClampedArray` / TypedArrays — raw image data
- `string` — filesystem path to an image file
- `Array<SharpInput>` — multiple images to be joined (requires `options.join`)
- No input — can be piped into as a stream

**Options (SharpOptions):**
- `failOn` — When to abort on invalid pixel data. Default: `'warning'`
- `limitInputPixels` — Max pixel count. Default: `268402689` (set `0` or `false` to remove)
- `limitInputChannels` — Max channels. Default: `5`
- `unlimited` — Remove safety features. Default: `false`
- `autoOrient` — Auto-orient from EXIF. Default: `false`
- `sequentialRead` — Use sequential read. Default: `true`
- `density` — DPI for SVG/PDF. Default: `72`
- `animated` — Read all frames. Default: `false`
- `raw` — Raw pixel input description `{ width, height, channels }`
- `create` — Create blank image `{ width, height, channels, background }`
- `text` — Create text image `{ text, width, height, ... }`

**Example:**
```typescript
import sharp from 'sharp';

// From file path
const image = sharp('input.png');

// From buffer
const image = sharp(buffer, { failOn: 'error' });

// Stream-based (pipe into it)
const pipeline = sharp().resize(300);

// Create blank image
const blank = sharp({
  create: {
    width: 300,
    height: 200,
    channels: 4,
    background: { r: 255, g: 0, b: 0, alpha: 0.5 }
  }
});
```

### Namespace Constants

```typescript
sharp.format         // FormatEnum — available formats
sharp.versions       // Version info for sharp, libvips, dependencies
sharp.interpolators  // Interpolators object
sharp.queue          // EventEmitter for task queue changes
sharp.gravity        // GravityEnum
sharp.strategy       // StrategyEnum
sharp.kernel         // KernelEnum
sharp.fit            // FitEnum
sharp.bool           // BoolEnum
```

### Utility Functions

```typescript
sharp.cache(options?: boolean | CacheOptions): CacheResult;
sharp.concurrency(concurrency?: number): number;
sharp.counters(): SharpCounters;
sharp.simd(enable?: boolean): boolean;
sharp.block(options: { operation: string[] }): void;      // Since 0.32.4
sharp.unblock(options: { operation: string[] }): void;     // Since 0.32.4
```

---

## Image Operations

### `.resize(widthOrOptions?, height?, options?)`

Resize image to given dimensions. Only **one resize per pipeline** — previous calls are ignored.

```typescript
.resize(width: number | null): Sharp                    // Auto-scale height
.resize(width: number | null, height: number | null): Sharp
.resize(options: ResizeOptions): Sharp
.resize(width: number | null, height: number | null, options: ResizeOptions): Sharp
```

**Fit modes:**
| Fit | Description |
|-----|-------------|
| `cover` (default) | Crop to cover both dimensions, preserving aspect ratio |
| `contain` | Embed within both dimensions (letterbox), preserves aspect ratio |
| `fill` | Stretch to both dimensions, ignoring aspect ratio |
| `inside` | Resize as large as possible while ≤ both dimensions |
| `outside` | Resize as small as possible while ≥ both dimensions |

**Position options (for cover/contain):**
- `sharp.position`: `'top'`, `'right top'`, `'right'`, `'right bottom'`, `'bottom'`, `'left bottom'`, `'left'`, `'left top'`
- `sharp.gravity`: `'north'`, `'northeast'`, `'east'`, `'southeast'`, `'south'`, `'southwest'`, `'west'`, `'northwest'`, `'center'`/`'centre'`
- `sharp.strategy`: `'entropy'` (highest Shannon entropy), `'attention'` (luminance + saturation + skin tones) — cover only

**Kernels (downsampling):**
`nearest`, `linear`, `cubic`, `mitchell`, `lanczos2`, `lanczos3` (default), `mks2013`, `mks2021`

```typescript
// Simple resize to 300px wide, auto height
await sharp(input).resize(300).toFile('output.jpg');

// Resize with options
await sharp(input).resize({
  width: 200,
  height: 200,
  fit: 'cover',
  position: 'centre',
  kernel: 'lanczos3',
  withoutEnlargement: true,
  background: { r: 255, g: 255, b: 255, alpha: 1 }
}).toFile('output.jpg');
```

### `.composite(images)`

Overlay images on top of the processed image. Operations (resize, rotate, etc.) are applied to the base image **before** composition. Overlay images must be same size or smaller.

```typescript
.composite(images: OverlayOptions[]): Sharp
```

**OverlayOptions** (extends SharpOptions):
- `input` — Buffer, file path string, or `{ create: Create }` / `{ text: CreateText }` / `{ raw: CreateRaw }`
- `blend` — Blend mode (see `Blend` type above). Default: `'over'`
- `gravity` — Placement gravity. Default: `'centre'`
- `top` / `left` — Pixel offsets (take precedence over gravity)
- `tile` — Repeat overlay. Default: `false`
- `premultiplied` — Skip premultiplication. Default: `false`
- `density` — DPI for vector overlays. Default: `72`

```typescript
await sharp(background)
  .composite([
    { input: layer1, gravity: 'northwest' },
    { input: layer2, gravity: 'southeast', blend: 'multiply' },
    { input: 'watermark.png', top: 10, left: 10, blend: 'over' }
  ])
  .toFile('combined.png');
```

### `.rotate(angle?, options?)`

Rotate the output image.

```typescript
.rotate(): Sharp          // Auto-orient from EXIF (alias for autoOrient)
.rotate(angle: number, options?: { background?: ColorLike }): Sharp
```

- Angles are converted to valid positive rotations (e.g., `-450` → `270°`)
- Non-90° multiples require `background` option for fill colour
- **Only one rotation per pipeline** — previous calls are ignored
- Method order matters: `.rotate(x).extract(y)` ≠ `.extract(y).rotate(x)`

```typescript
// Auto-orient from EXIF
await sharp(input).rotate().toFile('output.jpg');

// Explicit 90° rotation
await sharp(input).rotate(90).toFile('output.jpg');

// Rotate by non-90° with background
await sharp(input).rotate(45, { background: '#ffffff' }).toFile('output.jpg');
```

### `.flip()` / `.flop()`

```typescript
.flip(flip?: boolean): Sharp   // Flip about vertical Y axis (mirror). Default: true
.flop(flop?: boolean): Sharp   // Flop about horizontal X axis. Default: true
```

Both always occur after rotation, if any.

### `.extract(region)`

Crop/extract a region of the image.

```typescript
.extract(region: Region): Sharp
// Region: { left: number; top: number; width: number; height: number }
```

- Use `extract()` **before** `resize()` for pre-resize extraction
- Use `extract()` **after** `resize()` for post-resize extraction

```typescript
// Extract top-left 100x100 region
await sharp(input)
  .extract({ left: 0, top: 0, width: 100, height: 100 })
  .toFile('cropped.png');
```

### `.trim(options?)`

Trim pixels from all edges that match the background colour.

```typescript
.trim(options?: TrimOptions): Sharp
// TrimOptions: { background?, threshold?, lineArt?, margin? }
```

```typescript
// Auto-trim borders (uses top-left pixel colour as reference)
await sharp(input).trim().toFile('trimmed.png');

// Trim with specific background and threshold
await sharp(input).trim({ background: '#ffffff', threshold: 20 }).toFile('trimmed.png');
```

### `.extend(extend)`

Extend/pad one or more edges of the image.

```typescript
.extend(extend: number | ExtendOptions): Sharp
```

```typescript
// Extend all edges by 10px with white background
await sharp(input).extend({
  top: 10, bottom: 10, left: 10, right: 10,
  background: { r: 255, g: 255, b: 255, alpha: 1 }
}).toFile('padded.png');

// Extend with mirror
await sharp(input).extend({ top: 20, extendWith: 'mirror' }).toFile('output.png');
```

### Other Operations

```typescript
.sharpen(options?: SharpenOptions): Sharp     // Sharpen image
.blur(sigma?: number | boolean | BlurOptions): Sharp  // Gaussian blur
.median(size?: number): Sharp                 // Median filter (default 3x3)
.flatten(flatten?: boolean | FlattenOptions): Sharp  // Merge alpha with background
.gamma(gamma?: number, gammaOut?: number): Sharp  // Gamma correction
.negate(negate?: boolean | NegateOptions): Sharp   // Produce negative image
.normalise(options?: NormaliseOptions): Sharp       // Enhance contrast
.clahe(options: ClaheOptions): Sharp                // CLAHE contrast enhancement
.convolve(kernel: Kernel): Sharp                    // Apply convolution kernel
.threshold(threshold?: number, options?: ThresholdOptions): Sharp  // Binarize
.tint(tint: ColorLike): Sharp                       // Tint image
.greyscale(greyscale?: boolean): Sharp             // Convert to greyscale
.modulate(options: { brightness?, saturation?, hue?, lightness? }): Sharp
```

---

## Format Conversion & Output

### Format-specific Output Methods

Each method sets the output format and its options. Returns `Sharp` for chaining.

```typescript
.jpeg(options?: JpegOptions): Sharp      // JPEG output
.png(options?: PngOptions): Sharp        // PNG output
.webp(options?: WebpOptions): Sharp      // WebP output
.avif(options?: AvifOptions): Sharp      // AVIF output
.heif(options?: HeifOptions): Sharp      // HEIF output
.tiff(options?: TiffOptions): Sharp      // TIFF output
.gif(options?: GifOptions): Sharp         // GIF output
.jp2(options?: Jp2Options): Sharp        // JPEG 2000 (requires OpenJPEG)
.jxl(options?: JxlOptions): Sharp        // JPEG XL (experimental)
.raw(options?: RawOptions): Sharp         // Raw uncompressed pixel data
```

### `.toFormat(format, options?)`

Force output to a given format. Can be used instead of format-specific methods.

```typescript
.toFormat(format: keyof FormatEnum | AvailableFormatInfo | 'avif', options?: OutputOptions | ...): Sharp
```

### `.toFile(path)` / `.toFile(path, callback)`

Write output to a file. Format is inferred from file extension if not explicitly set.

```typescript
.toFile(fileOut: string): Promise<OutputInfo>
.toFile(fileOut: string, callback: (err: Error, info: OutputInfo) => void): Sharp
```

- Cannot use same file for input and output
- Caller is responsible for directory structure and permissions
- `info` contains: `format`, `size` (bytes), `width`, `height`, `channels`, `premultiplied`, `hasAlpha`

### `.toBuffer(options?)`

Write output to a Buffer.

```typescript
.toBuffer(): Promise<Buffer>
.toBuffer(options: { resolveWithObject: false }): Promise<Buffer>
.toBuffer(options: { resolveWithObject: true }): Promise<{ data: Buffer; info: OutputInfo }>
.toBuffer(callback: (err: Error, buffer: Buffer, info: OutputInfo) => void): Sharp
```

If no explicit format is set, output format matches input (except SVG → PNG).

### `.toUint8Array()`

Write output to a `Uint8Array` backed by a **transferable** `ArrayBuffer`. **Since v0.35.0.**

```typescript
.toUint8Array(): Promise<{ data: Uint8Array; info: OutputInfo }>
```

Useful for transfer between worker threads.

### `.withMetadata(options?)`

Keep all metadata (EXIF, ICC, XMP, IPTC) from the input in the output. Also adds sRGB ICC profile.

```typescript
.withMetadata(withMetadata?: WriteableMetadata): Sharp
// WriteableMetadata: { density?, orientation?, icc? (deprecated), exif? (deprecated) }
```

**Prefer the newer granular methods:**
```typescript
.keepMetadata(): Sharp          // Keep ALL metadata
.keepExif(): Sharp             // Keep EXIF
.withExif(exif: Exif): Sharp    // Set EXIF (overwrites input)
.withExifMerge(exif: Exif): Sharp  // Merge EXIF with input
.keepIccProfile(): Sharp       // Keep ICC profile
.withIccProfile(icc: string, options?: { attach?: boolean }): Sharp  // Set ICC profile
.keepXmp(): Sharp              // Keep XMP
.withXmp(xmp: string): Sharp   // Set XMP
.withDensity(density: number): Sharp  // Set output DPI in EXIF
```

### `.timeout(options)`

Set a processing timeout.

```typescript
.timeout(options: TimeoutOptions): Sharp
// TimeoutOptions: { seconds: number }  // 0 = disabled (default)
```

---

## Metadata API

### `.metadata()` — Get Image Metadata

Fast access to uncached image metadata **without decoding compressed pixel data**.

```typescript
.metadata(): Promise<Metadata>
.metadata(callback: (err: Error, metadata: Metadata) => void): Sharp
```

Returns `Metadata` with:
- `format` — decoder name (jpeg, png, webp, gif, svg, etc.)
- `width`, `height` — pixel dimensions (ignoring EXIF orientation)
- `autoOrient.width`, `autoOrient.height` — dimensions after EXIF orientation
- `channels` — number of bands (1=gray, 3=sRGB, 4=CMYK/RGBA)
- `space` — colour space interpretation
- `depth` — pixel depth format
- `density` — DPI
- `hasAlpha` — boolean
- `hasProfile` — boolean (has ICC profile)
- `isProgressive` — boolean
- `isPalette` — boolean
- `exif`, `icc`, `iptc`, `xmp` — raw metadata Buffers
- `pages`, `pageHeight`, `loop`, `delay` — animated image info

### `.stats()` — Image Statistics

Pixel-derived statistics for every channel.

```typescript
.stats(): Promise<Stats>
.stats(callback: (err: Error, stats: Stats) => void): Sharp
```

Returns `Stats` with:
- `channels` — `ChannelStats[]` with min, max, sum, mean, stdev, minX, minY, maxX, maxY
- `isOpaque` — boolean
- `entropy` — greyscale entropy
- `sharpness` — greyscale sharpness
- `dominant` — dominant sRGB colour `{ r, g, b }`

```typescript
const metadata = await sharp(input).metadata();
console.log(`${metadata.width}x${metadata.height}, ${metadata.format}, ${metadata.channels} channels`);
console.log(`Has alpha: ${metadata.hasAlpha}, Has ICC: ${metadata.hasProfile}`);
```

---

## Certificate Use Cases

### 1. Thumbnail Generation from Template Preview Images

```typescript
import sharp from 'sharp';

async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  maxWidth = 300,
  maxHeight = 200
): Promise<void> {
  await sharp(inputPath)
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: true
    })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(outputPath);
}

// Multiple thumbnail sizes from single input stream
const sharpStream = sharp(inputPath);
const sizes = [
  { width: 800, suffix: 'large' },
  { width: 400, suffix: 'medium' },
  { width: 150, suffix: 'thumb' }
];
await Promise.all(sizes.map(({ width, suffix }) =>
  sharpStream.clone()
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(`certificate-${suffix}.jpg`)
));
```

### 2. Resizing Uploaded Images to Max Dimensions

```typescript
async function resizeUploadedImage(
  input: Buffer,
  maxWidth: number,
  maxHeight: number
): Promise<Buffer> {
  const metadata = await sharp(input).metadata();

  // Only resize if exceeds max dimensions
  if (metadata.width! <= maxWidth && metadata.height! <= maxHeight) {
    return input;  // Already within limits
  }

  return sharp(input)
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',       // Preserve aspect ratio, don't crop
      withoutEnlargement: true
    })
    .jpeg({ quality: 85 })
    .toBuffer();
}
```

### 3. Converting Formats (PNG → JPEG for Smaller Size)

```typescript
async function convertToJpeg(
  inputPath: string,
  outputPath: string,
  quality = 85
): Promise<void> {
  await sharp(inputPath)
    .flatten({ background: '#ffffff' })  // Flatten alpha onto white
    .jpeg({ quality, mozjpeg: true, progressive: true })
    .toFile(outputPath);
}

// PNG → WebP for even smaller files
async function convertToWebP(
  inputPath: string,
  outputPath: string,
  quality = 80
): Promise<void> {
  await sharp(inputPath)
    .webp({ quality, effort: 4 })
    .toFile(outputPath);
}

// Auto-convert based on content
async function smartConvert(input: Buffer): Promise<{ data: Buffer; format: string }> {
  const { data, info } = await sharp(input)
    .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  return { data, format: info.format };
}
```

### 4. QR Code Image Processing

```typescript
// Resize QR code to target size (maintain crispness)
async function processQrCode(
  qrBuffer: Buffer,
  targetSize: number
): Promise<Buffer> {
  return sharp(qrBuffer)
    .resize({
      width: targetSize,
      height: targetSize,
      fit: 'fill',         // Exact dimensions for QR codes
      kernel: 'nearest'    // Avoid interpolation artifacts on QR codes
    })
    .png()                 // Keep as PNG for lossless QR codes
    .toBuffer();
}

// Embed QR code on certificate template
async function embedQrOnCertificate(
  templatePath: string,
  qrBuffer: Buffer,
  outputPath: string,
  position: { top: number; left: number }
): Promise<void> {
  // Resize QR code to required dimensions
  const resizedQr = await sharp(qrBuffer)
    .resize({ width: 150, height: 150, fit: 'fill', kernel: 'nearest' })
    .flatten()  // Remove transparency for clean compositing
    .toBuffer();

  await sharp(templatePath)
    .composite([{
      input: resizedQr,
      top: position.top,
      left: position.left,
      blend: 'over'
    }])
    .jpeg({ quality: 90 })
    .toFile(outputPath);
}
```

### 5. Certificate Preview Image Processing

```typescript
// Generate preview from high-res certificate
async function generateCertificatePreview(
  certificatePath: string,
  outputPath: string
): Promise<void> {
  await sharp(certificatePath)
    .resize({
      width: 600,
      height: 850,       // A4 ratio
      fit: 'inside',
      background: '#ffffff'
    })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 75, progressive: true })
    .toFile(outputPath);
}

// Add watermark to certificate
async function addWatermark(
  imagePath: string,
  watermarkPath: string,
  outputPath: string
): Promise<void> {
  await sharp(imagePath)
    .composite([{
      input: watermarkPath,
      gravity: 'centre',
      blend: 'multiply'
    }])
    .jpeg({ quality: 90 })
    .toFile(outputPath);
}
```

---

## Deprecations & Breaking Changes

### Deprecated in v0.35.x

| Deprecated API | Replacement | Since |
|---------------|-------------|-------|
| `SharpOptions.subifd` | `SharpOptions.tiff` (with `subifd` property) | 0.33+ |
| `SharpOptions.pdfBackground` | `SharpOptions.pdf` (with `background` property) | 0.33+ |
| `SharpOptions.level` | `SharpOptions.openSlide` (with `level` property) | 0.33+ |
| `WriteableMetadata.icc` | `withIccProfile()` method | 0.33+ |
| `WriteableMetadata.exif` | `withExif()` / `withExifMerge()` methods | 0.33+ |

### Breaking Changes from v0.33/v0.34 to v0.35

1. **`withMetadata()` deprecated in favour of granular methods**: Use `keepMetadata()`, `keepExif()`, `withExif()`, `withExifMerge()`, `keepIccProfile()`, `withIccProfile()`, `keepXmp()`, `withXmp()`, `withDensity()` instead.

2. **`toUint8Array()` added in v0.35.0**: Returns a `Uint8Array` backed by a transferable `ArrayBuffer` — important for worker thread scenarios where `Buffer`'s `ArrayBuffer` may be marked non-transferable.

3. **`block()` and `unblock()` added in 0.32.4**: Runtime control over libvips operations. Block all untrusted operations or whitelist specific loaders.

4. **`limitInputChannels` added**: Control max input channels (default: 5).

5. **Node.js >= 20.9.0 required** (Node-API v9).

6. **`autoOrient()` method added** (0.33+): Explicit alias for `rotate()` without arguments.

7. **`keepExif()`, `withExif()`, `withExifMerge()`, `keepIccProfile()`, `keepXmp()`, `withXmp()`** (all since 0.33): Granular metadata control replacing `withMetadata()`.

8. **`withDensity()` added** (0.35.0): Set output DPI in EXIF metadata.

9. **`keepMetadata()` now uses bitwise flags**: Internally uses `|=` to combine metadata retention flags, allowing granular combination of `keepExif`, `keepIccProfile`, `keepXmp` etc.

10. **SVG input options**: `svg.highBitdepth` and `svg.stylesheet` — render SVG at 32-bits/channel or inject CSS.

11. **`join` option for multi-image input**: Join an array of input images as a grid or animated sequence.

12. **`text` input for text image creation**: Generate images from text with Pango markup support.

### Not Changed (Still Current)
- `resize()` API signature unchanged
- `composite()` API unchanged
- All format output methods (`.jpeg()`, `.png()`, `.webp()`, etc.) unchanged
- `metadata()` return shape unchanged (new fields added but backward compatible)
- `toFile()` / `toBuffer()` signatures unchanged
- Kernel, fit, gravity enums unchanged

---

## Usage Examples

### Complete Certificate Image Processing Pipeline

```typescript
import sharp from 'sharp';
import path from 'node:path';

interface ProcessOptions {
  inputPath: string;
  outputDir: string;
  baseName: string;
  sizes: { width: number; height: number; suffix: string }[];
  quality: number;
  format: 'jpeg' | 'webp' | 'png' | 'avif';
}

async function processCertificateImages(opts: ProcessOptions): Promise<void> {
  const sharpStream = sharp(opts.inputPath);

  // Get original metadata for logging
  const metadata = await sharpStream.clone().metadata();
  console.log(`Original: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

  // Generate multiple sizes in parallel
  const results = opts.sizes.map(({ width, height, suffix }) =>
    sharpStream
      .clone()
      .resize({
        width,
        height,
        fit: 'cover',
        position: 'centre',
        withoutEnlargement: true
      })
      .flatten({ background: '#ffffff' })
      .toFormat(opts.format, { quality: opts.quality })
      .toFile(path.join(opts.outputDir, `${opts.baseName}-${suffix}.${opts.format}`))
  );

  await Promise.all(results);
  console.log('All sizes generated');
}
```

### Stream-Based Processing (Pipe)

```typescript
import sharp from 'sharp';
import { Readable } from 'node:stream';
import { createWriteStream } from 'node:fs';

// Process from stream
const transformer = sharp()
  .resize(300)
  .jpeg()
  .on('info', (info) => {
    console.log(`Output: ${info.width}x${info.height}, ${info.size} bytes`);
  });

readableStream.pipe(transformer).pipe(createWriteStream('output.jpg'));

// Fetch + process + save
const { body } = await fetch('https://example.com/image.jpg');
const readableStream = Readable.fromWeb(body);
const transformer = sharp().resize(300).jpeg();
readableStream.pipe(transformer).pipe(createWriteStream('output.jpg'));
```

### Format Detection and Conversion

```typescript
async function detectAndConvert(input: Buffer): Promise<{ data: Buffer; format: string; info: sharp.OutputInfo }> {
  const meta = await sharp(input).metadata();

  let pipeline = sharp(input).resize({ width: 1200, withoutEnlargement: true });

  // Convert based on input format
  switch (meta.format) {
    case 'png':
      // Keep PNG for transparency, optimize
      pipeline = pipeline.png({ compressionLevel: 6, quality: 80, palette: true });
      break;
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: 85, mozjpeg: true, progressive: true });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality: 85 });
      break;
    case 'svg':
      // SVG → PNG rasterization (sharp's default for SVG output)
      pipeline = pipeline.png({ density: 300 });  // High DPI rendering
      break;
    default:
      // Default to JPEG with white background for unknown formats
      pipeline = pipeline
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: 85, mozjpeg: true });
  }

  return pipeline.toBuffer({ resolveWithObject: true }) as Promise<{ data: Buffer; info: sharp.OutputInfo }>;
}
```

---

## Gotchas & Warnings

### 1. Single Resize Per Pipeline
Only **one** `resize()` call takes effect per pipeline. If you call `resize()` multiple times, only the last call is used. Use `.clone()` for multiple output sizes from one input.

### 2. Single Rotation Per Pipeline
Only **one** rotation per pipeline (aside from an initial `rotate()` with no args for EXIF orientation). Previous `rotate()` calls are silently ignored.

### 3. Metadata is Stripped by Default
By default, **all metadata is removed** from output images (EXIF, ICC, XMP, IPTC) and images are converted to sRGB. Use `keepMetadata()`, `keepExif()`, `withExif()`, `keepIccProfile()`, `withIccProfile()`, `keepXmp()`, `withXmp()` to preserve specific metadata. `withMetadata()` still works but is deprecated in favor of granular methods.

### 4. SVG Output Goes to PNG
When input is SVG and no explicit output format is set, output defaults to **PNG** (rasterized). SVG is always rasterized — sharp does not output SVG.

### 5. Input Cannot Equal Output File
`toFile()` throws if the resolved input path equals the output path. Always write to a different file.

### 6. Alpha Channel Handling
- `flatten()` merges alpha with a background colour (default black) — use this when converting transparent PNG → JPEG (JPEG doesn't support alpha)
- `ensureAlpha()` adds a fully opaque alpha channel if missing
- `removeAlpha()` removes alpha channel if present
- For JPEG output, always `flatten()` if input has alpha — otherwise the default black background will show through transparent areas

### 7. QR Code Resizing — Use `kernel: 'nearest'`
QR codes and other pixel-art images should use `kernel: 'nearest'` when resizing to avoid interpolation artifacts that could make QR codes unreadable.

### 8. `withoutEnlargement` vs `withoutReduction`
- `withoutEnlargement: true` — don't upscale if already smaller than target
- `withoutReduction: true` — don't downscale if already larger than target
- Both can be combined — effectively "only resize if exact match needed"

### 9. `fit: 'inside'` vs `fit: 'outside'`
- `inside` — image will be **≤** both dimensions (like CSS `object-fit: scale-down`)
- `outside` — image will be **≥** both dimensions (rare, for "at least this big" use cases)

### 10. Memory Limits
- `limitInputPixels` defaults to `268402689` (16383 × 16383). Set to `0` or `false` to remove for very large images, but beware memory exhaustion
- `unlimited: true` removes safety features for SVG/PNG — use cautiously
- `timeout({ seconds: N })` can prevent long-running processing from hanging

### 11. `failOn` for Untrusted Input
When processing user-uploaded images, use `failOn: 'warning'` (default) or `'error'` to abort on invalid pixel data. `'none'` is least safe and should only be used for trusted input.

### 12. Bun Compatibility
sharp works with Bun (this project uses Bun). It uses Node-API v9, which Bun supports. No special configuration needed beyond `bun install sharp`.

### 13. `composite()` Position vs Gravity
If both `top` and `left` are provided in `OverlayOptions`, they take **precedence over** `gravity`. Use whichever is more appropriate for your use case.

### 14. `clone()` for Multiple Outputs
`.clone()` creates a new pipeline sharing the same input. This is the idiomatic way to produce multiple resized versions from a single input without re-reading it.

### 15. `resolveWithObject` for `toBuffer()`
By default, `toBuffer()` resolves with just a `Buffer`. Pass `{ resolveWithObject: true }` to get `{ data: Buffer, info: OutputInfo }` — useful when you need the output dimensions, format, or channels.

### 16. Thread Pool Concurrency
sharp processes images using libuv's thread pool (limited by `UV_THREADPOOL_SIZE`, default 4). Processing many images in parallel may saturate the thread pool. Use `sharp.concurrency()` to control thread count, and `sharp.queue` (EventEmitter) to monitor queue length.

### 17. `toUint8Array()` for Worker Threads
When transferring image data to worker threads, `Buffer`'s underlying `ArrayBuffer` may be non-transferable in some runtimes. Use `.toUint8Array()` (since v0.35.0) for guaranteed transferable `ArrayBuffer`.

### 18. Premultiplication
sharp automatically premultiplies alpha when processing. The `OutputInfo.premultiplied` field indicates whether premultiplication was used. If compositing with `premultiplied: true`, sharp skips premultiplication of the base layer — the input is assumed already premultiplied.

### 19. Colour Parsing
Colours are parsed by the `@img/colour` module. Accepted formats: hex strings (`'#ff0000'`), RGB objects (`{ r: 255, g: 0, b: 0 }`), RGBA objects (`{ r: 255, g: 0, b: 0, alpha: 0.5 }`), and CSS colour names.

### 20. `block()` / `unblock()` for Security
For processing untrusted images, consider blocking dangerous libvips operations at runtime:
```typescript
sharp.block({ operation: ['VipsForeignLoad'] });          // Block all loaders
sharp.unblock({ operation: ['VipsForeignLoadPngBuffer', 'VipsForeignLoadJpegBuffer'] });  // Allow PNG + JPEG from Buffer
```
This is in addition to the `VIPS_BLOCK_UNTRUSTED` environment variable.
