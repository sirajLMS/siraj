# react-color v2.19.3 & @types/react-color v3.0.13 — Node Module Research

## Package Overview

| Field | Value |
|-------|-------|
| Package | `react-color` v2.19.3 |
| Types | `@types/react-color` v3.0.13 |
| Author | Case Sandberg (`case@casesandberg.com`) |
| License | MIT |
| Repo | https://github.com/casesandberg/react-color |
| Homepage | http://casesandberg.github.io/react-color/ |
| Entry (CJS) | `lib/index.js` |
| Entry (ESM) | `es/index.js` |
| Peer deps | `react: "*"` (no version constraint — works with React 19) |
| Dependencies | `@icons/material` ^0.2.4, `lodash` ^4.17.15, `lodash-es` ^4.17.15, `material-colors` ^1.2.6, `prop-types` ^15.5.10, `reactcss` ^1.2.0, `tinycolor2` ^1.4.1 |

### Maintenance Status

**⚠️ react-color is effectively unmaintained.** The last published version is v2.19.3 (released circa 2021). The GitHub repo (`casesandberg/react-color`) has not had significant activity in years. The package still works with React 19 due to its minimal React API surface (uses only `React.createElement`, `PureComponent`, and `getDerivedStateFromProps` — no deprecated lifecycle methods). However, no new features or bug fixes are expected.

The `@types/react-color` v3.0.13 types are community-maintained via DefinitelyTyped and are well-aligned with the package's actual exports.

---

## TypeScript Types & Interfaces

### Core Types (from `@types/react-color/index.d.ts`)

```typescript
// RGB color object — used for input and in ColorResult
interface RGBColor {
  r: number;
  g: number;
  b: number;
  a?: number;  // alpha 0–1, optional (defaults to 1 internally)
}

// HSL color object
interface HSLColor {
  h: number;  // 0–360
  s: number;  // 0–1
  l: number;  // 0–1
  a?: number; // alpha 0–1, optional
}

// Color input — accepts hex string, RGB object, or HSL object
type Color = string | HSLColor | RGBColor;

// Result returned by onChange / onChangeComplete callbacks
interface ColorResult {
  hex: string;       // e.g. "#ff0000" or "transparent"
  hsl: HSLColor;     // { h, s, l, a }
  rgb: RGBColor;     // { r, g, b, a }
}

// Change handler signature
type ColorChangeHandler = (
  color: ColorResult,
  event: React.ChangeEvent<HTMLInputElement>
) => void;
```

### ⚠️ TypeScript Types vs. Runtime — `hsv` and `oldHue` Discrepancy

The `@types/react-color` type definitions for `ColorResult` do **NOT** include `hsv` or `oldHue`, but the **runtime** `toState()` function (in `es/helpers/color.js`) returns them:

```javascript
// Runtime ColorResult (from helpers/color.js → toState()):
{
  hsl: { h, s, l, a },   // ✅ in types
  hex: string,            // ✅ in types
  rgb: { r, g, b, a },   // ✅ in types
  hsv: { h, s, v, a },   // ❌ NOT in @types — runtime only
  oldHue: number,         // ❌ NOT in @types — runtime only
  source: string | undefined, // ❌ NOT in @types — runtime only
}
```

**If you need `hsv` or `oldHue` in TypeScript**, you must cast: `(color as ColorResult & { hsv: { h: number; s: number; v: number; a: number }; oldHue: number })`. Or define a `RuntimeColorResult` extension type.

> **`HSVColor` is NOT exported from @types/react-color.** The task spec mentions it, but the type definitions only export `RGBColor` and `HSLColor`. The `hsv` object exists at runtime (via tinycolor2's `.toHsv()`) but has no TypeScript type. If you need to type it, define it inline:
> ```typescript
> interface HSVColor { h: number; s: number; v: number; a?: number }
> ```

### ColorPickerProps (Base Props Type)

All picker components extend this base interface:

```typescript
interface ColorPickerProps<A> extends ClassAttributes<A> {
  color?: Color;              // Current color — hex string or {r,g,b,a} or {h,s,l,a}
  className?: string;        // CSS class
  styles?: Partial<Classes<any>>; // reactcss style overrides
  onChange?: ColorChangeHandler;       // Fired on every change (drag, input, swatch click)
  onChangeComplete?: ColorChangeHandler; // Fired on release (debounced 100ms internally)
}
```

### CustomPickerProps (for building custom pickers)

```typescript
interface CustomPickerProps<A> extends ClassAttributes<A> {
  color?: Color;
  pointer?: ComponentType<{ direction?: "vertical" }>;  // Custom pointer element
  className?: string;
  styles?: Partial<Classes<any>>;
  onChange: ColorChangeHandler;  // required (not optional)
}

// InjectedColorProps — what ColorWrap injects into custom picker components
interface InjectedColorProps {
  hex?: string;
  hsl?: HSLColor;
  rgb?: RGBColor;
  onChange?: ColorWrapChangeHandler;
}
```

### ColorWrap & CustomPicker

`CustomPicker` is a HOC that wraps a custom component with color state management:

```typescript
function CustomPicker<A>(
  component: ComponentClass<A & InjectedColorProps> | FunctionComponent<A & InjectedColorProps>,
): ComponentClass<A & ExportedColorProps>;
```

---

## ColorResult Type

```typescript
interface ColorResult {
  hex: string;         // e.g. "#ff0000" (7-char) or "transparent"
  rgb: RGBColor;       // { r: 255, g: 0, b: 0, a: 1 } — a is 0–1
  hsl: HSLColor;       // { h: 0, s: 1, l: 0.5, a: 1 } — h is 0–360, s/l are 0–1
}
```

### Runtime-Only Extension (NOT in @types)

```typescript
// The actual runtime object returned by react-color helpers:
interface RuntimeColorResult extends ColorResult {
  hsv: { h: number; s: number; v: number; a: number }; // 0–360, 0–1, 0–1, 0–1
  oldHue: number;             // previous hue value (preserves hue when s=0)
  source?: string;            // 'hex' | 'rgb' | 'hsl' | undefined
}
```

### Practical Usage

```typescript
import type { ColorResult } from "react-color";

const handleChange = (color: ColorResult) => {
  console.log(color.hex);       // "#ff0000"
  console.log(color.rgb);       // { r: 255, g: 0, b: 0, a: 1 }
  console.log(color.rgb.a);     // 1 (alpha 0–1, NOT 0–255)
  console.log(color.hsl);       // { h: 0, s: 1, l: 0.5, a: 1 }
  // color.hsv  — runtime only, not typed
  // color.oldHue — runtime only, not typed
};
```

---

## Available Components

All 13 components are exported from `react-color`:

| Component | Import Name | Style | Alpha Support | Width (default) |
|-----------|-------------|-------|:-------------:|:---------------:|
| Chrome | `ChromePicker` | Google Chrome dev tools | ✅ | 225px |
| Sketch | `SketchPicker` | Sketch app | ✅ | 200px |
| Photoshop | `PhotoshopPicker` | Photoshop dialog | ❌ | 513px |
| Compact | `CompactPicker` | Compact palette + hex/rgb | ❌ | 240px |
| Swatches | `SwatchesPicker` | Scrollable swatch grid | ❌ | 320×240 |
| Twitter | `TwitterPicker` | Twitter palette + hex input | ❌ | 276px |
| Circle | `CirclePicker` | Circle swatches (Material) | ❌ | 252px |
| Slider | `SliderPicker` | Hue slider + swatches | ❌ | — |
| Alpha | `AlphaPicker` | Alpha channel slider | ✅ | 316×16 |
| Hue | `HuePicker` | Hue slider | ❌ | 316×16 |
| Block | `BlockPicker` | Block palette + hex input | ❌ | 170px |
| Github | `GithubPicker` | GitHub-style palette | ❌ | 200px |
| Material | `MaterialPicker` | Material design compact | ❌ | 98×98 |

> **Note:** `GooglePicker` (`GooglePicker`) also exists in the ES module (`es/index.js` line 16) but has **NO type definition** in `@types/react-color`. It is not documented. Avoid using it in TypeScript code.

---

## Props Reference (per component)

### Shared Props (inherited from `ColorPickerProps`)

All components accept:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `string \| RGBColor \| HSLColor` | `{ h:250, s:0.50, l:0.20, a:1 }` | Current color value |
| `onChange` | `(color: ColorResult, event?) => void` | — | Fired on every interaction (drag, input, swatch click) |
| `onChangeComplete` | `(color: ColorResult, event?) => void` | — | Fired on release; internally debounced 100ms |
| `className` | `string` | `""` | CSS class for the picker root div |
| `styles` | `Partial<Classes<...>>` | `{}` | reactcss style overrides (see per-component style keys) |

### Default Color (set by ColorWrap)

When no `color` prop is passed, `ColorWrap` defaults to:
```javascript
{ h: 250, s: 0.50, l: 0.20, a: 1 }  // dark blue-purple
// hex: approximately "#1a1a4d"
```

---

### ChromePicker Props

```typescript
interface ChromePickerProps extends ColorPickerProps<ChromePicker> {
  disableAlpha?: boolean;    // Default: false — hides alpha slider, shows hex/rgb/hsl toggle fields
  styles?: Partial<Classes<ChromePickerStylesProps>>;
  // Default width: 225 (number, not string)
}

// Style keys for overrides:
interface ChromePickerStylesProps {
  picker, saturation, Saturation, body, controls, color, swatch,
  active, toggles, hue, Hue, alpha, Alpha
}
```

**Default props:** `width: 225, disableAlpha: false, styles: {}`

**Special:** Chrome has a view toggle (HEX / RGB / HSL tabs) using `defaultView` prop (`"hex" | "rgb" | "hsl"`) — **but `defaultView` is NOT in the @types definitions**. You can still pass it; TypeScript will error. Cast as needed.

---

### SketchPicker Props

```typescript
interface SketchPickerProps extends ColorPickerProps<SketchPicker> {
  disableAlpha?: boolean;
  presetColors?: PresetColor[];  // Default: 15 preset colors (see below)
  width?: string;                // Default: "200" (note: string type, unlike Chrome's number)
  styles?: Partial<Classes<SketchPickerStylesProps>>;
  onSwatchHover?: (color: ColorResult, event: MouseEvent) => void;
}

type PresetColor = { color: string; title: string } | string;

// Default presetColors:
['#D0021B', '#F5A623', '#F8E71C', '#8B572A', '#7ED321', '#417505',
 '#BD10E0', '#9013FE', '#4A90E2', '#50E3C2', '#B8E986', '#000000',
 '#4A4A4A', '#9B9B9B', '#FFFFFF']
```

**Default props:** `disableAlpha: false, width: 200, styles: {}`

> **⚠️ Task spec note:** The task mentions `triangle: 'hide' | 'top'` for SketchPicker. This is **incorrect** — SketchPicker does **NOT** have a `triangle` prop. That prop belongs to `BlockPicker` (`'hide' | 'top'`) and `TwitterPicker` / `GithubPicker` (`'hide' | 'top-left' | 'top-right'`).

---

### PhotoshopPicker Props

```typescript
interface PhotoshopPickerProps extends ColorPickerProps<PhotoshopPicker> {
  header?: string;              // Default: "Color Picker"
  onAccept?: ColorChangeHandler; // OK button callback
  onCancel?: ColorChangeHandler; // Cancel button callback
  styles?: Partial<Classes<PhotoshopPickerStylesProps>>;
}

// Style keys: picker, head, body, saturation, hue, controls, top, previews, actions
```

**Default props:** `header: "Color Picker", styles: {}`
**Default width:** 513px (hardcoded in component styles, not a prop).
**No alpha support.** Has OK/Cancel buttons with `onAccept`/`onCancel` callbacks.

---

### CompactPicker Props

```typescript
interface CompactPickerProps extends ColorPickerProps<CompactPicker> {
  colors?: string[];  // Default: 35 preset colors
  onSwatchHover?: (color: ColorResult, event: MouseEvent) => void;
  styles?: Partial<Classes<CompactPickerStylesProps>>;
}

// Style keys: Compact, compact, clear
```

**Default colors:** 35 colors ranging from `#4D4D4D` to `#AB149E`.
**Default width:** 240px (hardcoded).

---

### SwatchesPicker Props

```typescript
interface SwatchesPickerProps extends ColorPickerProps<SwatchesPicker> {
  colors?: string[][];  // 2D array — groups of swatches. Default: 19 groups × 5 colors (Material palette)
  height?: number;      // Default: 240
  width?: number;       // Default: 320
  onSwatchHover?: (color: ColorResult, event: MouseEvent) => void;
  styles?: Partial<Classes<SwatchesPickerStylesProps>>;
}

// Style keys: picker, overflow, body, clear
```

**Default colors:** Full Material Design palette (red through blueGrey + grayscale), 19 groups of 5 shades each.
**Scrollable** — overflow-y auto-scroll.

---

### TwitterPicker Props

```typescript
interface TwitterPickerProps extends ColorPickerProps<TwitterPicker> {
  colors?: string[];                    // Default: 10 Twitter brand colors
  width?: string;                      // Default: "276"
  triangle?: "hide" | "top-left" | "top-right";  // Default: "top-left"
  onSwatchHover?: (color: ColorResult, event: MouseEvent) => void;
  styles?: Partial<Classes<TwitterPickerStylesProps>>;
}

// Default colors:
['#FF6900', '#FCB900', '#7BDCB5', '#00D084', '#8ED1FC',
 '#0693E3', '#ABB8C3', '#EB144C', '#F78DA7', '#9900EF']
```

---

### CirclePicker Props

```typescript
interface CirclePickerProps extends ColorPickerProps<CirclePicker> {
  colors?: string[];        // Default: 18 Material Design 500 colors
  width?: string;           // Default: "252"
  circleSize?: number;      // Default: 28 (px)
  circleSpacing?: number;   // Default: 14 (px)
  onSwatchHover?: (color: ColorResult, event: MouseEvent) => void;
  styles?: Partial<Classes<CirclePickerStylesProps>>;
}

// Style keys: card
```

**Default colors:** 18 Material Design 500-level colors (red, pink, purple, deepPurple, indigo, blue, lightBlue, cyan, teal, green, lightGreen, lime, yellow, amber, orange, deepOrange, brown, blueGrey).

---

### SliderPicker Props

```typescript
interface SliderPickerProps extends ColorPickerProps<SliderPicker> {
  styles?: Partial<Classes<SliderPickerStylesProps>>;
}

// Style keys: hue, Hue
```

Minimal — just a hue slider with swatch presets below. No width/height/alpha props.

---

### AlphaPicker Props

```typescript
interface AlphaPickerProps extends ColorPickerProps<AlphaPicker> {
  height?: string;   // Default: "16px"
  width?: string;    // Default: "316px"
  styles?: Partial<Classes<AlphaPickerStylesProps>>;
}

// Style keys: picker, alpha
```

**Note:** `direction` prop (`"horizontal" | "vertical"`) exists at runtime but is **NOT in @types**. Default: `"horizontal"`.

---

### HuePicker Props

```typescript
interface HuePickerProps extends ColorPickerProps<HuePicker> {
  height?: string;   // Default: "16px"
  width?: string;    // Default: "316px"
  styles?: Partial<Classes<HuePickerStylesProps>>;
}

// Style keys: picker, hue
```

**Note:** `direction` prop exists at runtime (default: `"horizontal"`) but is **NOT in @types**.

---

### BlockPicker Props

```typescript
interface BlockPickerProps extends ColorPickerProps<BlockPicker> {
  colors?: string[];   // Default: 9 colors
  width?: string;       // Default: "170"
  triangle?: "hide" | "top";  // Default: "top"
  onSwatchHover?: (color: ColorResult, event: MouseEvent) => void;
  styles?: Partial<Classes<BlockPickerStylesProps>>;
}

// Default colors:
['#D9E3F0', '#F47373', '#697689', '#37D67A', '#2CCCE4',
 '#555555', '#dce775', '#ff8a65', '#ba68c8']
```

**Note:** This is the ONLY picker with `triangle: "hide" | "top"`.

---

### GithubPicker Props

```typescript
interface GithubPickerProps extends ColorPickerProps<GithubPicker> {
  colors?: string[];     // Default: 16 colors
  width?: string;         // Default: "200"
  triangle?: "hide" | "top-left" | "top-right";  // Default: "top-left"
  onSwatchHover?: (color: ColorResult, event: MouseEvent) => void;
  styles?: Partial<Classes<GithubPickerStylesProps>>;
}
```

**Note:** Runtime `triangle` also supports `"bottom-left"` and `"bottom-right"` but those are **NOT in @types**.

---

### MaterialPicker Props

```typescript
interface MaterialPickerProps extends ColorPickerProps<MaterialPicker> {
  styles?: Partial<Classes<MaterialPickerStylesProps>>;
}

// Style keys: material, HEXwrap, HEXinput, HEXlabel, Hex, RGBwrap, RGBinput, RGBlabel, split, third
```

Compact Material Design style. **Not commonly used.** No color presets, alpha, or width props.

---

## MUI v9 Integration Pattern

### MUI v9 Does NOT Have a ColorPicker

MUI v9 (`@mui/material` ^9.2.0) does **not** ship a `<ColorPicker>` component. The `react-color` library fills this gap. This is confirmed in the Plan 10 design doc:

> *"MUI `ColorPicker` does not exist — use installed `react-color` (confirmed present) wrapped in MUI Popover + a hex `TextField` for a11y."*

### Recommended Pattern: `react-color` inside MUI `Popover`

The design docs for Plans 10–12 specify wrapping a `react-color` picker (typically `ChromePicker` or `SketchPicker`) inside an MUI `Popover`, with a hex `TextField` as the keyboard-accessible input path.

#### Shared Component Architecture

Per the project's `frontend/common/components/ui/` conventions, this should be a **viewport-agnostic** shared component:

```
frontend/common/components/ui/colorPicker/
├── ColorPicker.tsx           # Shared: MUI Popover + react-color + hex TextField
├── index.ts                  # Named exports only
└── components/
    └── ColorSwatchButton.tsx  # The trigger (clickable color preview)
```

#### Implementation Skeleton

```tsx
// frontend/common/components/ui/colorPicker/ColorPicker.tsx
"use client";

import { Popover, TextField, Box } from "@mui/material";
import { ChromePicker, type ColorResult } from "react-color";
import { useState, type SyntheticEvent } from "react";

export interface ColorPickerProps {
  value: string;                          // hex string, e.g. "#ff0000"
  onChange: (hex: string) => void;
  label: string;
  disabled?: boolean;
  disableAlpha?: boolean;
}

export function ColorPicker({
  value,
  onChange,
  label,
  disabled = false,
  disableAlpha = true,
}: Readonly<ColorPickerProps>) {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: SyntheticEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleColorChange = (color: ColorResult) => {
    onChange(disableAlpha ? color.hex : `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`);
  };

  return (
    <Box>
      <TextField
        label={label}
        value={value}
        onClick={handleClick}
        disabled={disabled}
        slotProps={{
          htmlInput: { autoComplete: "off" },
        }}
        // Click opens popover; typing also updates hex
        onChange={(e) => onChange(e.target.value)}
        sx={{ cursor: "pointer" }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <ChromePicker
          color={value}
          onChange={handleColorChange}
          disableAlpha={disableAlpha}
          onChangeComplete={handleColorChange}
        />
      </Popover>
    </Box>
  );
}
```

#### Key MUI v9 Compliance Notes

1. **Never use style props directly on MUI components** — always use `sx` prop
2. **Use `*Outlined` icon names** — not `*Outline`
3. **Never use `FormEvent`** — use `React.SyntheticEvent` or `React.SubmitEvent`
4. **Always use `label` on TextField** — never render a separate label above
5. **Theme colors only** — never hardcode hex colors in MUI components (the `react-color` picker itself uses hardcoded colors internally, but our wrapper should use theme tokens for its own chrome)
6. **Import from `@mui/material`** — not destructured

#### MUI Popover Usage in This Codebase

The codebase already uses `Popover` from `@mui/material` in several places (e.g., `dateRangePickerShared.tsx`, `LanguageSwitcher.tsx`, `LocaleAdornmentSwitch`). The pattern is:

```tsx
const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
// open on click, close on Popover onClose
```

---

## Deprecations & Alternatives

### react-color Maintenance Status

| Aspect | Status |
|--------|--------|
| Last release | v2.19.3 (circa 2021) |
| Active development | ❌ No — repo is effectively archived |
| React 19 compat | ✅ Works (uses only basic React APIs) |
| TypeScript support | ✅ Via `@types/react-color` v3.0.13 (DefinitelyTyped) |
| npm weekly downloads | Still high (legacy projects) |
| Known issues | No new issues being addressed |

**react-color is functionally deprecated** — it works but receives no updates. For a new project, `react-colorful` would be preferable (active maintenance, smaller bundle, better TypeScript support, hooks-based API). However, since `react-color` is already installed in this project and the design docs (Plans 10–12) explicitly call for it, we should use it.

### react-colorful (Alternative — NOT Installed)

| Aspect | react-colorful |
|--------|---------------|
| Latest version | v5.6.x+ |
| Bundle size | ~2 KB (vs ~50 KB for react-color) |
| API | Hooks-based (`useColor()`) |
| TypeScript | Built-in types (no @types needed) |
| React 19 | ✅ Full support |
| Maintenance | ✅ Active (2024+) |
| Pickers | Fewer (no Photoshop, Swatches, etc.) |
| Install status | ❌ Not installed in this project |

If `react-color` causes issues with React 19 in development, `react-colorful` is the recommended fallback. The migration would be minimal since the core interface is similar (`onChange` callback returning color data).

### Deprecated / Undocumented Components

- `GooglePicker` — exported at runtime but has **no type definitions**. Avoid in TypeScript code.
- `MaterialPicker` — has types but is rarely used and poorly documented.

### Deprecated / Undocumented Props

These props exist at **runtime** but are **NOT in the TypeScript types**:

| Component | Runtime Prop | @types | Notes |
|-----------|-------------|:------:|-------|
| ChromePicker | `defaultView` (`"hex" \| "rgb" \| "hsl"`) | ❌ | Controls which tab is active |
| AlphaPicker | `direction` (`"horizontal" \| "vertical"`) | ❌ | Slider direction |
| HuePicker | `direction` (`"horizontal" \| "vertical"`) | ❌ | Slider direction |
| GithubPicker | `triangle` with `"bottom-left"` / `"bottom-right"` | ❌ | Extra triangle positions |
| All pickers | `renderers` | ❌ | Internal canvas renderers |

---

## Usage Examples

### Example 1: ChromePicker in MUI Popover (Certificate Template Editor)

```tsx
"use client";

import { useState } from "react";
import { Popover, TextField, Box } from "@mui/material";
import { ChromePicker, type ColorResult } from "react-color";

interface ColorFieldProps {
  readonly value: string;
  readonly onChange: (hex: string) => void;
  readonly label: string;
}

export function ColorField({ value, onChange, label }: Readonly<ColorFieldProps>) {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleColorChange = (color: ColorResult) => {
    onChange(color.hex);
  };

  return (
    <Box>
      <TextField
        label={label}
        value={value}
        onClick={handleOpen}
        onChange={(e) => onChange(e.target.value)}
        slotProps={{ htmlInput: { autoComplete: "off" } }}
        sx={{ width: "100%" }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { p: 1 } } }}
      >
        <ChromePicker
          color={value}
          onChange={handleColorChange}
          disableAlpha
        />
      </Popover>
    </Box>
  );
}
```

### Example 2: SketchPicker with Preset Colors

```tsx
import { SketchPicker, type ColorResult } from "react-color";

const presetColors = [
  "#0062B1", // Siraj brand blue
  "#D33115", // Certification red
  "#FCC400", // Gold seal
  "#417505", // Approved green
  "#FFFFFF", // White
  "#000000", // Black
];

<SketchPicker
  color={currentColor}
  onChange={(color: ColorResult) => setCurrentColor(color.hex)}
  presetColors={presetColors}
  disableAlpha
  width="220px"
/>
```

### Example 3: Using RGB Color Object as Input

```tsx
import { ChromePicker } from "react-color";

// color prop accepts hex string OR {r,g,b,a} OR {h,s,l,a}
<ChromePicker
  color={{ r: 255, g: 100, b: 50, a: 0.8 }}
  onChange={(color) => {
    // color.rgb = { r: 255, g: 100, b: 50, a: 0.8 }
    // color.hex = "#ff6432" (no alpha in hex)
    // color.hsl = { h: 16, s: 1, l: 0.6, a: 0.8 }
  }}
/>
```

### Example 4: CirclePicker for Quick Theme Color Selection

```tsx
import { CirclePicker, type ColorResult } from "react-color";

const themeColors = [
  "#0062B1", "#D33115", "#FCC400", "#417505",
  "#FFFFFF", "#000000", "#808080", "#333333",
];

<CirclePicker
  color={selectedColor}
  onChange={(color: ColorResult) => setSelectedColor(color.hex)}
  colors={themeColors}
  circleSize={32}
  circleSpacing={12}
/>
```

### Example 5: Custom Picker (Advanced — building block approach)

```tsx
import { CustomPicker, Saturation, Hue, Alpha } from "react-color";

function MyPicker({ hex, hsl, hsv, rgb, onChange }) {
  return (
    <div>
      <Saturation hsl={hsl} hsv={hsv} onChange={onChange} />
      <Hue hsl={hsl} onChange={onChange} />
      <Alpha rgb={rgb} hsl={hsl} onChange={onChange} />
    </div>
  );
}

export default CustomPicker(MyPicker);
```

---

## Gotchas & Warnings

### 1. React 19 Compatibility

**Status: ✅ Works with React 19** — The package's React API surface is minimal:
- Uses `React.createElement` (still in React 19)
- Uses `PureComponent` (still in React 19)
- Uses `getDerivedStateFromProps` (React 16.3+, still supported in 19)
- No deprecated lifecycle methods (`componentWillMount`, `componentWillReceiveProps` are absent)
- No `ReactDOM.findDOMNode` usage

**Caveat:** `prop-types` peer dependency is included — this works fine with React 19 but is legacy. No runtime warnings expected.

### 2. `onChangeComplete` is Dynamically Debounced

The `ColorWrap` HOC debounces `onChangeComplete` with a **100ms delay** internally (via `lodash-es/debounce`). This means `onChangeComplete` does NOT fire immediately on release — it fires ~100ms later. If you need synchronous completion behavior, use `onChange` with your own debounce logic.

### 3. Alpha in `hex` Output

When `disableAlpha` is `false` (alpha enabled), the `ColorResult.hex` still returns **only 6-character hex** (e.g., `"#ff6432"`) without alpha encoding. To get alpha, always read `color.rgb.a` (0–1). The `hex` property returns `"transparent"` when `rgb.a === 0` and the hex is `#000000`.

### 4. `transparent` as a Valid Color

`react-color` treats `"transparent"` as a valid hex value (via `isValidHex()`). The `toState()` helper returns `hex: "transparent"` when `rgb.a === 0 && hex === "000000"`. Be aware of this when comparing hex values.

### 5. Inline Styles — No CSS Imports

All `react-color` components use 100% inline styles via the `reactcss` library. **No CSS imports required.** This means the pickers work in any CSS-in-JS or plain CSS environment. However, the visual appearance cannot be themed via CSS classes — only via the `styles` prop (reactcss overrides).

### 6. `width` Type Inconsistency Across Pickers

Some pickers type `width` as `number` (ChromePicker: default 225), others as `string` (SketchPicker: default "200", SwatchesPicker: number 320, TwitterPicker: string "276"). Always check the specific component's type. Passing a number where a string is expected will cause a TS error.

### 7. Hardcoded Colors Inside Pickers

The `react-color` pickers use hardcoded color values throughout (e.g., `background: '#fff'`, `boxShadow: '0 0 2px rgba(0,0,0,.3)'`). This means they will NOT follow your MUI theme's dark mode. If dark mode support is needed, you must override via the `styles` prop with theme-aware values, or wrap the picker in a light-colored container.

### 8. No Built-in Popover/Dialog

`react-color` pickers render as **inline** DOM elements. There is no built-in popover, dropdown, or dialog. You must wrap them yourself (e.g., in an MUI `Popover`). The `SketchPicker`, `TwitterPicker`, `BlockPicker`, and `GithubPicker` have visual "triangle" elements suggesting they're meant for popover use, but the popover behavior is not built in.

### 9. `presetColors` vs `colors` Prop Naming

| Picker | Preset prop name | Type |
|--------|-----------------|------|
| SketchPicker | `presetColors` | `PresetColor[]` (`{color, title} \| string`) |
| CompactPicker | `colors` | `string[]` |
| SwatchesPicker | `colors` | `string[][]` (2D array) |
| TwitterPicker | `colors` | `string[]` |
| CirclePicker | `colors` | `string[]` |
| BlockPicker | `colors` | `string[]` |
| GithubPicker | `colors` | `string[]` |

**Inconsistency:** SketchPicker uses `presetColors` (with optional `title` metadata), while all other palette pickers use `colors` (plain strings). SwatchesPicker is the only one using a 2D array.

### 10. Project-Specific Notes

- **Package is already installed** in `package.json` (`"react-color": "^2.19.3"`) and `"@types/react-color": "^3.0.13"` (devDeps).
- **Not installed: `react-colorful`** — the modern alternative. If migration is needed later, it's a drop-in conceptually.
- **Design docs (Plans 10–12)** explicitly call for `react-color` (`ChromePicker`/`SketchPicker`) wrapped in MUI `Popover` + hex `TextField` for accessibility. The hex `TextField` is the keyboard-accessible path since the visual pickers are mouse-only.
- **Accessibility:** The visual color picker (saturation area, hue slider) are mouse/touch-only. **Always provide a hex `TextField`** alongside the picker for keyboard users. This is noted in the Plan 10 design doc's accessibility risk section.
- **Recommended pickers for this project:**
  - `ChromePicker` — best for detailed color selection (hex/RGB/HSL tabs, alpha support)
  - `SketchPicker` — best for compact popover use (preset colors, clean UI)
  - `CirclePicker` — best for quick swatch selection (theme colors)
  - `BlockPicker` — good for small popover with hex input
