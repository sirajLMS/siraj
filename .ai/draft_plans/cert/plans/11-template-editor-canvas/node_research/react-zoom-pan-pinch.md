# react-zoom-pan-pinch v4.0.3 — Node Module Research

## Package Overview

| Field | Value |
|-------|-------|
| **Version** | 4.0.3 |
| **License** | MIT |
| **Peer Dependencies** | `react` >=16.8.0, `react-dom` >=16.8.0 |
| **External Dependencies** | None (zero runtime deps) |
| **Main Entry** | `dist/index.js` |
| **Types Entry** | `dist/index.d.ts` |
| **Module System** | CommonJS (`dist/index.js`) + ESM (`dist/index.esm.js`) |
| **Source** | TypeScript, compiled to `dist/` |
| **Side Effects** | `false` (tree-shakeable) |

### Exports Summary

**Components:** `TransformWrapper`, `TransformComponent`, `MiniMap`, `KeepScale`, `Virtualize`, `Context`
**Hooks:** `useControls`, `useTransformContext`, `useTransformEffect`, `useTransformInit`, `useTransformComponent`
**Utility Functions:** `roundScaleForTransform`, `getTransformStyles`, `getMatrixTransformStyles`, `getCenterPosition`
**Type Exports:** `ReactZoomPanPinchProps`, `ReactZoomPanPinchRef`, `ReactZoomPanPinchContentRef`, `ReactZoomPanPinchContextState`, `ReactZoomPanPinchHandlers`, `ReactZoomPanPinchState`, `MiniMapProps`, `VirtualizeProps`, `BoundsType`, `PositionType`, `StateType`, `SizeType`, `VelocityType`, `AnimationType`, `DeviceType`, `LibrarySetup`

> **Note:** There is NO standalone `Controls` component and NO `useTransform` hook exported from the package. The task's mention of these is based on v3 or incorrect info. In v4:
> - `Controls` → use `useControls()` hook or render-prop pattern instead
> - `useTransform` → exists only as a function returned by the internal `useZoomPanPinch` hook (not exported). For reactive state, use `useTransformComponent()` instead.
>
> **Note:** `AlignLayer`, `CenterContentAlignment`, `LimitToBounds`, `TransformProps`, `WheelProps`, `DoubleTouchProps` mentioned in the task do NOT exist as named types in v4. V4 uses inline types within `ReactZoomPanPinchProps`. See Props Reference below.

---

## TypeScript Types & Interfaces

### Core State Types

```typescript
// The current transform state
interface StateType {
  previousScale: number;
  scale: number;
  positionX: number;
  positionY: number;
}

// 2D position
interface PositionType { x: number; y: number; }

// 2D size
interface SizeType { width: number; height: number; }

// Velocity for inertia panning
interface VelocityType { velocityX: number; velocityY: number; total: number; }

// Bounds for limiting transform
interface BoundsType {
  maxPositionX: number;
  minPositionX: number;
  maxPositionY: number;
  minPositionY: number;
}

// Animation type names (14 available)
type AnimationType =
  | "easeOut" | "linear"
  | "easeInQuad" | "easeOutQuad" | "easeInOutQuad"
  | "easeInCubic" | "easeOutCubic" | "easeInOutCubic"
  | "easeInQuart" | "easeOutQuart" | "easeInOutQuart"
  | "easeInQuint" | "easeOutQuint" | "easeInOutQuint";

// Device type for velocity calculation
enum DeviceType { MOUSE = "mouse", TOUCH = "touch" }
```

### ReactZoomPanPinchRef (Imperative Ref)

The `ReactZoomPanPinchRef` is the intersection of `ReactZoomPanPinchContextState` and `ReactZoomPanPinchHandlers`:

```typescript
type ReactZoomPanPinchRef = ReactZoomPanPinchContextState & ReactZoomPanPinchHandlers;

// ContextState provides:
interface ReactZoomPanPinchContextState {
  instance: ReactZoomPanPinchContext;  // The ZoomPanPinch class instance
  state: ReactZoomPanPinchState;        // { previousScale, scale, positionX, positionY }
}

// Handlers provide imperative methods:
interface ReactZoomPanPinchHandlers {
  zoomIn: (step?: number, animationTime?: number, animationType?: AnimationType) => void;
  zoomOut: (step?: number, animationTime?: number, animationType?: AnimationType) => void;
  setTransform: (
    newPositionX: number, newPositionY: number, newScale: number,
    animationTime?: number, animationType?: AnimationType
  ) => void;
  resetTransform: (animationTime?: number, animationType?: AnimationType) => void;
  centerView: (scale?: number, animationTime?: number, animationType?: AnimationType) => void;
  zoomToElement: (
    node: HTMLElement | string,
    scale?: number,
    animationTime?: number,
    animationType?: AnimationType,
    offsetX?: number,
    offsetY?: number
  ) => void;
}

// ReactZoomPanPinchContentRef is the same as ReactZoomPanPinchRef
type ReactZoomPanPinchContentRef = ReactZoomPanPinchRef;
```

### ReactZoomPanPinchState

```typescript
interface ReactZoomPanPinchState {
  previousScale: number;
  scale: number;
  positionX: number;
  positionY: number;
}
```

### ReactZoomPanPinchContext (ZoomPanPinch Class Instance)

The `instance` property on `ReactZoomPanPinchContextState` is the `ZoomPanPinch` class with:

**Properties:**
- `isPanning: boolean` — currently panning
- `isWheelPanning: boolean` — currently panning via wheel
- `isPinching: boolean` — currently pinching (touch)
- `isAnimating: boolean` — animation in progress
- `isInitialized: boolean` — instance initialized
- `mounted: boolean` — component mounted
- `props: ReactZoomPanPinchProps` — current merged props
- `setup: LibrarySetup` — computed setup from props (all resolved defaults)
- `wrapperComponent: HTMLDivElement | null` — the wrapper DOM node
- `contentComponent: HTMLDivElement | null` — the content DOM node
- `bounds: BoundsType | null` — current transform bounds
- `velocity: VelocityType | null` — current velocity for inertia
- `pressedKeys: string[]` — currently pressed modifier keys
- `state: StateType` — current transform state

**Methods:**
- `setCenter(scale?, positionX?, positionY?)` — set center point
- `handleTransformStyles(x, y, scale): string` — returns `translate(${x}px, ${y}px) scale(${scale})`
- `getContext(): ReactZoomPanPinchContextState` — returns `{ instance, state }`
- `applyTransformation(scale, positionX, positionY)` — applies transform to DOM
- `setState(scale, positionX, positionY)` — updates state + triggers callbacks
- `onTransform(callback): () => void` — subscribe to transform changes (returns unsubscribe)
- `onChange(callback): () => void` — subscribe to state changes
- `onInit(callback): () => void` — subscribe to init event
- `init(wrapper, content)` — initialize with DOM refs
- `mount()` / `unmount()` — lifecycle
- `update(props)` — update props
- `isPressingKeys(keys): boolean` — check if specific keys are pressed
- `cleanupWindowEvents()` — remove all window event listeners

### MiniMapProps

```typescript
interface MiniMapProps {
  children: React.ReactNode;
  width?: number;        // default: 200
  height?: number;       // default: 200
  borderColor?: string;  // default: "red"
  previewStyle?: React.CSSProperties;
  wrapperClassName?: string;
  previewClassName?: string;
  panning?: boolean;     // default: true — click-to-pan enabled
  // Also accepts all standard div HTML attributes via spread
}
```

### VirtualizeProps

```typescript
interface VirtualizeProps {
  x: number;       // position in content (unscaled) space
  y: number;       // position in content (unscaled) space
  width: number;   // size in content (unscaled) space
  height: number;  // size in content (unscaled) space
  margin?: number;     // default: 0 — extra pixels for early mounting
  threshold?: number;  // default: 0 — fraction 0-1 of overlap required
  placeholder?: React.ReactNode;  // default: null — rendered when out of viewport
  onShow?: () => void;
  onHide?: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
```

### LibrarySetup (Resolved Props)

```typescript
type LibrarySetup = Omit<NonNullable<ReactZoomPanPinchProps>, "children" | "ref">;
```

This is the fully-resolved props object with all defaults filled in. Accessible via `instance.setup`.

---

## Components

### TransformWrapper

The main component that creates the zoom/pan context and provides it to children.

```typescript
const TransformWrapper: React.ForwardRefExoticComponent<
  Omit<ReactZoomPanPinchProps, "ref"> &
  React.RefAttributes<ReactZoomPanPinchContentRef>
>;
```

**Usage patterns:**

1. **Standard (with TransformComponent children and ref):**
```tsx
const ref = useRef<ReactZoomPanPinchRef>(null);

<TransformWrapper
  ref={ref}
  initialScale={1}
  minScale={0.5}
  maxScale={4}
  limitToBounds={true}
  wheel={{ step: 0.1 }}
  doubleClick={{ mode: "zoomIn", step: 0.7 }}
  panning={{ velocityDisabled: false }}
  pinch={{ step: 5 }}
>
  <TransformComponent>
    <CertificateCanvas />
  </TransformComponent>
</TransformWrapper>
```

2. **Render prop pattern (no TransformComponent needed):**
```tsx
<TransformWrapper>
  {(controls) => (
    <div>
      <button onClick={() => controls.zoomIn()}>Zoom In</button>
      <button onClick={() => controls.zoomOut()}>Zoom Out</button>
      <button onClick={() => controls.resetTransform()}>Reset</button>
      <div style={{ transform: controls.instance.handleTransformStyles(
        controls.state.positionX, controls.state.positionY, controls.state.scale
      )}}>
        Content here
      </div>
    </div>
  )}
</TransformWrapper>
```

**Key behavior:**
- Creates a `Context.Provider` with a `ZoomPanPinch` instance
- Merges props with `initialSetup` defaults
- Exposes imperative controls via `ref` (using `useImperativeHandle`)
- Exposes controls via render-prop children callback
- The ref type is `ReactZoomPanPinchContentRef` (= `ReactZoomPanPinchRef`)

### TransformComponent

The container that renders children with the CSS transform applied.

```typescript
interface TransformComponentProps {
  children: React.ReactNode;
  wrapperClass?: string;       // default: undefined
  contentClass?: string;       // default: undefined
  wrapperStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  wrapperProps?: React.HTMLAttributes<HTMLDivElement>;
  contentProps?: React.HTMLAttributes<HTMLDivElement>;
  infinite?: boolean;          // default: false — NEW in v4
}
```

**Applied CSS classes:**
- Wrapper: `react-transform-wrapper` + CSS module wrapper class + custom `wrapperClass`
- Content: `react-transform-component` + CSS module content class + custom `contentClass`

**Applied CSS styles (inline):**
- Wrapper: `position: relative; overflow: hidden; user-select: none; transform: translate3d(0,0,0);`
- Content: `display: flex; flex-wrap: wrap; transform-origin: 0% 0%;`
- Content `img` elements get `pointer-events: none` (added via mutation observer)

**`infinite` prop (v4 NEW):**
When `true`, renders an infinite dot-grid background behind the content that scales and pans with the transform. This creates a visual "infinite canvas" feel. The background is a CSS radial-gradient that repositions based on the current transform.

**Key behavior:**
- The content div is where the CSS transform is applied: `translate(${x}px, ${y}px) scale(${scale})`
- Uses a `MutationObserver` to set `pointer-events: none` on all `img` children (prevents image drag interfering with pan)
- `detached` mode on TransformWrapper prevents transforms from being applied here
- Must be rendered inside a `TransformWrapper`

### MiniMap (v4 NEW)

A minimap overview showing the full content with a preview rectangle indicating the current viewport.

```tsx
<TransformWrapper>
  <div style={{ display: "flex" }}>
    <TransformComponent>
      <LargeCanvas />
    </TransformComponent>
    <MiniMap width={200} height={200} borderColor="blue" panning={true}>
      <LargeCanvasPreview />
    </MiniMap>
  </div>
</TransformWrapper>
```

- Preview rectangle shows the current visible area
- `panning={true}` enables click-to-pan on the minimap (click position = center viewport there)
- Children should be a scaled-down version of the same content

### KeepScale (v4 NEW)

Renders a div that inversely scales (1/scale) on every transform change — keeps its visual size constant regardless of zoom level. Useful for elements like labels, badges, or measurement overlays that should stay the same size.

```tsx
<TransformWrapper>
  <TransformComponent>
    <div>
      <HeavyContent />
      <KeepScale>
        <Badge>This stays the same size</Badge>
      </KeepScale>
    </div>
  </TransformComponent>
</TransformWrapper>
```

Type: `React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>`

### Virtualize (v4 NEW)

For viewport-based lazy mounting/unmounting of heavy children. Only renders children when they are visible within the current zoom/pan viewport.

```tsx
<TransformWrapper>
  <TransformComponent>
    <div style={{ width: 5000, height: 5000 }}>
      {items.map((item) => (
        <Virtualize
          key={item.id}
          x={item.x}
          y={item.y}
          width={200}
          height={100}
          margin={50}           // mount 50px before entering viewport
          placeholder={<div>Loading...</div>}
        >
          <ExpensiveCard item={item} />
        </Virtualize>
      ))}
    </div>
  </TransformComponent>
</TransformWrapper>
```

- `x, y, width, height` are in unscaled content coordinates
- `margin` adds extra pixels for early mounting (smooth scroll feel)
- `threshold` (0-1): fraction of overlap required before showing
- `onShow` / `onHide` callbacks for side effects

### Context

The raw React Context provider component — gives direct access to the context value. Advanced use only.

```typescript
// Context value type:
{ instance: ReactZoomPanPinchContext; state: ReactZoomPanPinchState }
```

---

## Hooks

### useControls()

Returns `ReactZoomPanPinchContentRef` (instance + state + all handler methods).

```typescript
function useControls(): ReactZoomPanPinchContentRef;
```

**⚠️ Must be used inside a `TransformWrapper`** — throws if context is null.

```tsx
function Toolbar() {
  const controls = useControls();

  return (
    <div>
      <button onClick={() => controls.zoomIn(0.5, 300, "easeOut")}>Zoom In</button>
      <button onClick={() => controls.zoomOut()}>Zoom Out</button>
      <button onClick={() => controls.resetTransform()}>Reset</button>
      <button onClick={() => controls.centerView(1)}>Center</button>
      <button onClick={() => controls.zoomToElement("element-id", 2)}>Focus Element</button>
    </div>
  );
}

<TransformWrapper>
  <Toolbar />
  <TransformComponent>
    <div id="element-id">Target</div>
  </TransformComponent>
</TransformWrapper>
```

### useTransformContext()

Returns the raw `ZoomPanPinch` instance (the class, not the ref wrapper).

```typescript
function useTransformContext(): ReactZoomPanPinchContext;
```

**⚠️ Must be used inside a `TransformWrapper`** — throws if context is null.

```tsx
function DebugInfo() {
  const instance = useTransformContext();
  return <div>Scale: {instance.state.scale}, Panning: {String(instance.isPanning)}</div>;
}
```

### useTransformEffect(callback)

Subscribes to transform changes — fires on every `onChange` event. The callback receives the full `ReactZoomPanPinchContextState`.

```typescript
function useTransformEffect(
  callback: (ref: ReactZoomPanPinchContextState) => void | (() => void)
): void;
```

The callback can return a cleanup function (like `useEffect`). Fires on every transform change.

```tsx
function ScrollSync() {
  useTransformEffect((ref) => {
    console.log("Transformed:", ref.state);
    return () => console.log("Cleanup on unmount");
  });
  return null;
}
```

### useTransformInit(callback)

Fires once when the `TransformWrapper` initializes. Receives the initial `ReactZoomPanPinchContextState`.

```typescript
function useTransformInit(
  callback: (ref: ReactZoomPanPinchContextState) => void | (() => void)
): void;
```

```tsx
function Initializer() {
  useTransformInit((ref) => {
    // Set initial zoom to fit certificate
    ref.centerView(1.5);
  });
  return null;
}
```

### useTransformComponent(callback)

Reactive state extraction — returns a computed value and re-renders the component when the transform state changes.

```typescript
function useTransformComponent<T>(
  callback: (state: ReactZoomPanPinchContextState) => T
): T;
```

```tsx
function ZoomIndicator() {
  const scale = useTransformComponent((state) => state.state.scale);
  const isPanning = useTransformComponent((state) => state.instance.isPanning);
  return (
    <div>
      Zoom: {Math.round(scale * 100)}% {isPanning && "(panning...)"}
    </div>
  );
}
```

---

## Imperative API (ReactZoomPanPinchRef)

All methods are available via `ref.current` or `useControls()` return value.

### zoomIn

```typescript
zoomIn(
  step?: number,         // default: 0.5 — amount to zoom in (relative scale multiplier or delta)
  animationTime?: number, // default: 300 — ms for animation
  animationType?: AnimationType  // default: "easeOut" — easing function name
): void
```

Zooms in toward the center of the viewport. Uses `handleZoomToViewCenter` internally — the zoom targets the center of the visible area.

### zoomOut

```typescript
zoomOut(
  step?: number,         // default: 0.5
  animationTime?: number, // default: 300
  animationType?: AnimationType  // default: "easeOut"
): void
```

Zooms out from the center of the viewport. Respects `minScale` bounds.

### setTransform

```typescript
setTransform(
  newPositionX: number,
  newPositionY: number,
  newScale: number,
  animationTime?: number,        // default: 300
  animationType?: AnimationType  // default: "easeOut"
): void
```

Sets an absolute transform (position + scale) with animation. Clamps to configured bounds if `limitToBounds` is `true`.

### resetTransform

```typescript
resetTransform(
  animationTime?: number,        // default: 200
  animationType?: AnimationType  // default: "easeOut"
): void
```

Resets to `initialScale` and `initialPositionX/Y`. Always animates (even if `smooth` is false, uses a 200ms animation).

### centerView

```typescript
centerView(
  scale?: number,                // default: undefined (uses current scale)
  animationTime?: number,        // default: 200
  animationType?: AnimationType  // default: "easeOut"
): void
```

Centers the content in the viewport at the given (or current) scale. Changes position to center the content but does not change scale unless `scale` is provided.

### zoomToElement

```typescript
zoomToElement(
  node: HTMLElement | string,    // DOM element or element ID
  scale?: number,                // default: undefined (uses current scale)
  animationTime?: number,        // default: 600
  animationType?: AnimationType, // default: "easeOut"
  offsetX?: number,              // default: 0 — additional horizontal offset
  offsetY?: number               // default: 0 — additional vertical offset
): void
```

Zooms and pans to center a specific element in the viewport. If `node` is a string, it's used as an element ID (`document.getElementById`). Calculates the element's position relative to the content component and centers it.

### State Properties (via ref.state)

```typescript
ref.state    // { previousScale, scale, positionX, positionY }
ref.instance // ZoomPanPinch class instance
```

### Instance Properties

```typescript
ref.instance.isPanning      // boolean — currently panning
ref.instance.isPinching     // boolean — currently pinching (touch)
ref.instance.isWheelPanning // boolean — currently panning via wheel trackpad
ref.instance.isAnimating    // boolean — animation in progress
ref.instance.isInitialized  // boolean — instance initialized
ref.instance.bounds         // BoundsType | null — current bounds
ref.instance.velocity       // VelocityType | null — current inertia velocity
ref.instance.pressedKeys    // string[] — modifier keys currently pressed
```

---

## Props Reference

### Structural & General Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode \| ((ref: ReactZoomPanPinchContentRef) => React.ReactNode)` | undefined | Content or render-prop receiving controls |
| `ref` | `React.Ref<ReactZoomPanPinchRef>` | undefined | Imperative ref for programmatic control |
| `detached` | `boolean` | `false` | When true, does NOT apply transform to content component directly. You apply it manually. |
| `disabled` | `boolean` | `false` | Disables ALL interactions (wheel, doubleClick, pan, pinch) |
| `disablePadding` | `boolean` | `false` | Disables the padding area that allows content to be panned slightly beyond bounds |
| `smooth` | `boolean` | `true` | Exponential scaling for smooth zoom (uses `scale * Math.exp(delta * step)` instead of linear `scale + delta * step`) |

### Initial State Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialScale` | `number` | `1` | Starting scale value |
| `initialPositionX` | `number` | `0` | Starting X position |
| `initialPositionY` | `number` | `0` | Starting Y position |
| `minScale` | `number` | `1` | Minimum scale (clamped to ≥1e-7) |
| `maxScale` | `number` | `8` | Maximum scale |
| `minPositionX` | `null \| number` | `null` | Minimum X position (null = no limit) |
| `maxPositionX` | `null \| number` | `null` | Maximum X position (null = no limit) |
| `minPositionY` | `null \| number` | `null` | Minimum Y position (null = no limit) |
| `maxPositionY` | `null \| number` | `null` | Maximum Y position (null = no limit) |
| `limitToBounds` | `boolean` | `true` | Prevent panning/zooming beyond bounds |
| `centerZoomedOut` | `boolean` | `false` | Enable centering when zoomed out below minScale |
| `centerOnInit` | `boolean` | `false` | Center content on init (uses ResizeObserver, 5s timeout) |

> **Note on `centerContent`:** The task mentions a `centerContent: boolean | AlignLayer` prop. In v4, this is split into two props: `centerOnInit` (center on init) and `centerZoomedOut` (center when zoomed below minScale). There is no `AlignLayer` type. The autoAlignment section handles velocity-based centering via `sizeX`/`sizeY` instead.

### wheel

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `wheel.disabled` | `boolean` | `false` | Disable all wheel interactions |
| `wheel.wheelDisabled` | `boolean` | `false` | Disable mouse wheel specifically |
| `wheel.touchPadDisabled` | `boolean` | `false` | Disable trackpad specifically |
| `wheel.step` | `number` | `0.015` | Zoom step per wheel tick (NOT `stepSize`) |
| `wheel.activationKeys` | `string[] \| ((keys: string[]) => boolean)` | `[]` | Required keys for wheel zoom; or function returning boolean |
| `wheel.excluded` | `string[]` | `[]` | CSS selectors of elements where wheel is disabled |

> **⚠️ Important:** The field name is `step`, NOT `stepSize` as older docs may suggest. In smooth mode, the effective step is `step * Math.abs(event.deltaY)`.

### doubleClick

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `doubleClick.disabled` | `boolean` | `false` | Disable double-click zoom |
| `doubleClick.step` | `number` | `0.7` | Zoom amount per double-click |
| `doubleClick.mode` | `"zoomIn" \| "zoomOut" \| "reset" \| "toggle"` | `"zoomIn"` | Action mode |
| `doubleClick.animationTime` | `number` | `200` | Animation duration in ms |
| `doubleClick.animationType` | `AnimationType` | `"easeOut"` | Easing function |
| `doubleClick.excluded` | `string[]` | `[]` | CSS selectors of excluded elements |

### panning

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `panning.disabled` | `boolean` | `false` | Disable panning |
| `panning.velocityDisabled` | `boolean` | `false` | Disable inertia/velocity-based panning |
| `panning.lockAxisX` | `boolean` | `false` | Lock panning on X axis (horizontal only) |
| `panning.lockAxisY` | `boolean` | `false` | Lock panning on Y axis (vertical only) |
| `panning.allowLeftClickPan` | `boolean` | `true` | Allow panning with left mouse button |
| `panning.allowMiddleClickPan` | `boolean` | `true` | Allow panning with middle mouse button |
| `panning.allowRightClickPan` | `boolean` | `true` | Allow panning with right mouse button |
| `panning.activationKeys` | `string[] \| ((keys: string[]) => boolean)` | `[]` | Required keys for panning |
| `panning.excluded` | `string[]` | `[]` | CSS selectors of excluded elements |

### pinch

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pinch.disabled` | `boolean` | `false` | Disable pinch zoom |
| `pinch.step` | `number` | `5` | Pinch zoom step |
| `pinch.allowPanning` | `boolean` | `true` | Allow panning while pinching (multi-touch) |
| `pinch.excluded` | `string[]` | `[]` | CSS selectors of excluded elements |

### trackPadPanning (v4 NEW)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `trackPadPanning.disabled` | `boolean` | `true` | **Disabled by default!** Enable trackpad two-finger panning |
| `trackPadPanning.velocityDisabled` | `boolean` | `false` | Disable inertia for trackpad panning |
| `trackPadPanning.lockAxisX` | `boolean` | `false` | Lock X axis |
| `trackPadPanning.lockAxisY` | `boolean` | `false` | Lock Y axis |
| `trackPadPanning.activationKeys` | `string[] \| ((keys: string[]) => boolean)` | `[]` | Required keys |
| `trackPadPanning.excluded` | `string[]` | `[]` | Excluded elements |

### zoomAnimation (boundary padding)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `zoomAnimation.disabled` | `boolean` | `false` | Disable zoom animation |
| `zoomAnimation.size` | `number` | `0.4` | Padding size around min/max scale (allows slight overzoom) |
| `zoomAnimation.animationTime` | `number` | `200` | Animation duration in ms |
| `zoomAnimation.animationType` | `AnimationType` | `"easeOut"` | Easing function |

### autoAlignment (v4 NEW)

Controls velocity-based auto-correcting alignment (when panning velocity is low, content snaps to alignment).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `autoAlignment.disabled` | `boolean` | — | Disable auto alignment |
| `autoAlignment.sizeX` | `number` | `100` | Horizontal alignment padding percentage |
| `autoAlignment.sizeY` | `number` | `100` | Vertical alignment padding percentage |
| `autoAlignment.animationTime` | `number` | `200` | Animation duration |
| `autoAlignment.velocityAlignmentTime` | `number` | `400` | Time for velocity-based alignment |
| `autoAlignment.animationType` | `AnimationType` | `"easeOut"` | Easing function |

### velocityAnimation (inertia)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `velocityAnimation.disabled` | `boolean` | — | Disable inertia |
| `velocityAnimation.sensitivityTouch` | `number` | `1.2` | Touch sensitivity multiplier |
| `velocityAnimation.sensitivityMouse` | `number` | `1` | Mouse sensitivity multiplier |
| `velocityAnimation.maxStrengthMouse` | `number` | `20` | Max inertia strength for mouse |
| `velocityAnimation.maxStrengthTouch` | `number` | `40` | Max inertia strength for touch |
| `velocityAnimation.inertia` | `number` | `1` | Inertia multiplier |
| `velocityAnimation.animationTime` | `number` | `300` | Animation duration |
| `velocityAnimation.maxAnimationTime` | `number` | `800` | Max animation time cap |
| `velocityAnimation.animationType` | `AnimationType` | `"easeOut"` | Easing function |

### customTransform

```typescript
customTransform?: (x: number, y: number, scale: number) => string;
```

Custom function to override the transform CSS string. Default returns `translate(${x}px, ${y}px) scale(${scale})`. Use `getMatrixTransformStyles` for matrix3d format (fixes some Safari SVG rendering issues).

### Event Callbacks

All callbacks receive `(ref: ReactZoomPanPinchRef, event: Event) => void`:

```typescript
// Wheel events
onWheelStart?: (ref: ReactZoomPanPinchRef, event: WheelEvent) => void;
onWheel?: (ref: ReactZoomPanPinchRef, event: WheelEvent) => void;
onWheelStop?: (ref: ReactZoomPanPinchRef, event: WheelEvent) => void;

// Panning events
onPanningStart?: (ref: ReactZoomPanPinchRef, event: TouchEvent | MouseEvent) => void;
onPanning?: (ref: ReactZoomPanPinchRef, event: TouchEvent | MouseEvent) => void;
onPanningStop?: (ref: ReactZoomPanPinchRef, event: TouchEvent | MouseEvent) => void;

// Pinch events
onPinchStart?: (ref: ReactZoomPanPinchRef, event: TouchEvent) => void;
onPinch?: (ref: ReactZoomPanPinchRef, event: TouchEvent) => void;
onPinchStop?: (ref: ReactZoomPanPinchRef, event: TouchEvent) => void;

// Zoom events (programmatic or wheel/pinch)
onZoomStart?: (ref: ReactZoomPanPinchRef, event: TouchEvent | MouseEvent) => void;
onZoom?: (ref: ReactZoomPanPinchRef, event: TouchEvent | MouseEvent) => void;
onZoomStop?: (ref: ReactZoomPanPinchRef, event: TouchEvent | MouseEvent) => void;

// Transform change (fires on every transform update)
onTransform?: (ref: ReactZoomPanPinchRef, state: { scale: number; positionX: number; positionY: number }) => void;

// Initialization
onInit?: (ref: ReactZoomPanPinchRef) => void;
```

### Utility Exports

```typescript
// Round scale to 8 decimal places (fixes binary float noise)
roundScaleForTransform(scale: number): number;

// Get standard transform string
getTransformStyles(x: number, y: number, scale: number): string;
// → `translate(${x}px, ${y}px) scale(${scale})`

// Get matrix3d transform string (better for Safari SVG)
getMatrixTransformStyles(x: number, y: number, scale: number): string;

// Calculate center position for given scale
getCenterPosition(
  scale: number,
  wrapperComponent: HTMLDivElement,
  contentComponent: HTMLDivElement,
  limitToBounds: boolean,
  centerZoomedOut: boolean
): { scale: number; positionX: number; positionY: number };
```

---

## Deprecations & Breaking Changes

### Deprecated APIs

**No `@deprecated` tags found** in the entire v4.0.3 codebase. A comprehensive search returned zero results.

### v4 Breaking Changes (inferred from code — no official changelog shipped)

| Change | v3 | v4 |
|--------|----|----|
| **wheel step** | Possibly `stepSize` | `step` (field renamed) |
| **Controls component** | May have existed | **Removed** — use `useControls()` hook or render-prop |
| **`centerContent` prop** | Single prop | Split into `centerOnInit` + `centerZoomedOut` |
| **`AlignLayer` type** | May have existed | **Does not exist** — replaced by `autoAlignment.sizeX`/`sizeY` |
| **`trackPadPanning`** | Not available | **NEW** — separate trackpad panning config (disabled by default) |
| **`smooth` prop** | Not available | **NEW** — exponential scaling for buttery zoom |
| **`autoAlignment` prop** | Not available | **NEW** — velocity-based alignment snap |
| **`detached` mode** | Not available | **NEW** — manual transform application |
| **`MiniMap` component** | Not available | **NEW** — overview minimap |
| **`KeepScale` component** | Not available | **NEW** — counter-scaled children |
| **`Virtualize` component** | Not available | **NEW** — viewport-based lazy mounting |
| **TransformComponent `infinite` prop** | Not available | **NEW** — infinite dot-grid background |
| **`panning.lockAxisX/Y`** | Not available | **NEW** — axis locking |
| **`panning.allowLeftClickPan` etc.** | Not available | **NEW** — per-button pan control |
| **`pinch.allowPanning`** | Not available | **NEW** — enable pan during pinch |
| **`velocityAnimation` config** | Simpler | **Expanded** — per-device sensitivity, maxStrength, inertia |
| **`useTransform` hook** | Possibly exported | **Not exported** — use `useTransformComponent()` instead |
| **Hooks renamed** | — | `useTransformContext`, `useTransformEffect`, `useTransformInit`, `useTransformComponent` |

---

## Usage Examples

### Basic Certificate Template Canvas

```tsx
import { useRef } from "react";
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

function CertificateCanvasEditor() {
  const ref = useRef<ReactZoomPanPinchRef>(null);

  return (
    <TransformWrapper
      ref={ref}
      initialScale={1}
      minScale={0.3}
      maxScale={5}
      limitToBounds={true}
      centerOnInit={true}
      wheel={{ step: 0.05 }}
      doubleClick={{ mode: "zoomIn", step: 0.5 }}
      panning={{ velocityDisabled: false, allowRightClickPan: false }}
      pinch={{ step: 5 }}
    >
      <Toolbar />
      <TransformComponent
        wrapperStyle={{ width: "100%", height: "100vh" }}
        contentStyle={{ cursor: "grab" }}
      >
        <div style={{ width: 794, height: 1123 /* A4 at 96dpi */ }}>
          {/* Certificate template elements: text, images, QR codes */}
          <CertificateTemplate />
        </div>
      </TransformComponent>
    </TransformWrapper>
  );
}
```

### With Toolbar Controls (useControls hook)

```tsx
function Toolbar() {
  const controls = useControls();

  return (
    <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000 }}>
      <button onClick={() => controls.zoomIn(0.3, 300, "easeOut")}>+</button>
      <button onClick={() => controls.zoomOut(0.3, 300, "easeOut")}>−</button>
      <button onClick={() => controls.resetTransform()}>Reset</button>
      <button onClick={() => controls.centerView(1)}>Fit</button>
      <span>Zoom: {Math.round(controls.state.scale * 100)}%</span>
    </div>
  );
}
```

### Programmatic Zoom to Element

```tsx
function zoomToSpecificElement(ref: ReactZoomPanPinchRef, elementId: string) {
  // Zoom to 2x scale, center the element, with 600ms easeOut animation
  ref.zoomToElement(elementId, 2, 600, "easeOut", 0, 0);
}

function zoomToNamedElement(ref: ReactZoomPanPinchRef, element: HTMLElement) {
  ref.zoomToElement(element, undefined, 400, "linear");
}
```

### Reactive Zoom Level Display

```tsx
function ZoomLevelDisplay() {
  const scale = useTransformComponent((state) => state.state.scale);
  const isPanning = useTransformComponent((state) => state.instance.isPanning);

  return (
    <div>
      {Math.round(scale * 100)}% {isPanning && "• Panning"}
    </div>
  );
}
```

### Detached Mode (Manual Transform Application)

```tsx
<TransformWrapper detached ref={ref} initialScale={1}>
  {() => (
    <CustomCanvas
      transform={ref.current?.instance.handleTransformStyles(
        ref.current?.state.positionX ?? 0,
        ref.current?.state.positionY ?? 0,
        ref.current?.state.scale ?? 1
      )}
    />
  )}
</TransformWrapper>
```

### With MiniMap for Large Canvases

```tsx
<TransformWrapper initialScale={1} minScale={0.2} maxScale={8} centerOnInit>
  <div style={{ display: "flex", gap: 10 }}>
    <TransformComponent wrapperStyle={{ width: 800, height: 600 }}>
      <CanvasContent />
    </TransformComponent>
    <MiniMap width={200} height={150} borderColor="#1976d2" panning={true}>
      <CanvasContent />
    </MiniMap>
  </div>
</TransformWrapper>
```

### Virtualize for Heavy Templates

```tsx
<TransformWrapper initialScale={1} minScale={0.1} maxScale={6}>
  <TransformComponent contentStyle={{ width: 5000, height: 5000 }}>
    {elements.map((el) => (
      <Virtualize key={el.id} x={el.x} y={el.y} width={300} height={200} margin={100}>
        <TemplateElement element={el} />
      </Virtualize>
    ))}
  </TransformComponent>
</TransformWrapper>
```

### Lock Axis Panning (Horizontal Only)

```tsx
<TransformWrapper panning={{ lockAxisY: true }} wheel={{ step: 0.05 }}>
  <TransformComponent>
    <ScrollableTimeline />
  </TransformComponent>
</TransformWrapper>
```

### Activation Keys (Ctrl + Wheel to Zoom)

```tsx
<TransformWrapper
  wheel={{ activationKeys: ["Control"] }}
  panning={{ activationKeys: ["Space"] }}
>
  <TransformComponent>
    <CanvasBlock />
  </TransformComponent>
</TransformWrapper>

// Or with function-based activation:
<TransformWrapper
  wheel={{
    activationKeys: (keys) => keys.includes("Control") || keys.includes("Meta")
  }}
>
  ...
</TransformWrapper>
```

### Custom Transform (Matrix3d for Safari SVG)

```tsx
import { getMatrixTransformStyles } from "react-zoom-pan-pinch";

<TransformWrapper
  customTransform={(x, y, scale) => getMatrixTransformStyles(x, y, scale)}
>
  <TransformComponent>
    <CertificateSVG />
  </TransformComponent>
</TransformWrapper>
```

---

## Gotchas & Warnings

### 1. `wheel.step` NOT `wheel.stepSize`
The wheel zoom configuration field is `step`, not `stepSize`. If you use `stepSize`, it will be silently ignored.

### 2. `trackPadPanning` is Disabled by Default
In v4, trackpad two-finger panning has its own config section (`trackPadPanning`) and is **disabled by default** (`disabled: true`). If users report broken trackpad panning, enable it:
```tsx
<TransformWrapper trackPadPanning={{ disabled: false }}>
```

### 3. `smooth` Mode Changes Scale Calculation
When `smooth` is `true` (the default), the wheel zoom uses exponential scaling: `scale * Math.exp(delta * step)` instead of linear `scale + delta * step`. This makes zoom feel more natural (like Google Maps). The effective step is `step * Math.abs(event.deltaY)`. If you want linear zoom, set `smooth={false}`.

### 4. `centerOnInit` Uses ResizeObserver
`centerOnInit={true}` uses a `ResizeObserver` that waits for the content component to have non-zero dimensions. It has a **5-second timeout** — if the content doesn't have dimensions by then, centering won't happen. Make sure your content renders synchronously or has intrinsic dimensions.

### 5. `minScale` Clamped to ≥1e-7
If you set `minScale` to 0 or a negative number, it will be clamped to `1e-7` (0.0000001). The scale itself is also clamped to this minimum to prevent zero/negative scale (which would collapse the content).

### 6. Transform Uses Standard `translate` (Not `translate3d`)
The default transform is `translate(${x}px, ${y}px) scale(${scale})`, using standard `translate` instead of `translate3d`. This is intentional — it prevents **blurry SVG rendering on Safari**. The wrapper does use `translate3d(0,0,0)` for GPU layer promotion. If you need matrix transforms for complex cases, use `getMatrixTransformStyles` or `customTransform`.

### 7. `excluded` Uses CSS Selectors
The `excluded` arrays in `wheel`, `panning`, `pinch`, `doubleClick` use CSS selector strings. They match elements within the `.react-transform-wrapper` container. Example: `excluded={[".no-zoom", ".toolbar"]}` would disable interactions on elements with those classes.

### 8. `activationKeys` Accepts Both Array and Function
You can pass either `["Control", "Shift"]` (require all keys) or a predicate function `(keys) => boolean` for custom logic. The keys tracked are synced from real keyboard events via `syncModifierKeys` (handles iframe compatibility).

### 9. `zoomToElement` Accepts String (Element ID)
When passing a string to `zoomToElement`, it's used as an element ID: `document.getElementById(node)`. This means the element must have an `id` attribute (not just any CSS selector).

### 10. `detached` Mode Requires Manual Transform
When `detached={true}`, the `TransformComponent` won't apply the CSS transform automatically. You must read the state from `ref` and apply `instance.handleTransformStyles(x, y, scale)` yourself. Useful for custom canvas rendering (e.g., WebGL).

### 11. `Context` Export Exists but is Advanced
The raw `Context` is exported but using `useControls()` or the render-prop pattern is strongly preferred for most use cases. Only use `Context` directly if you need a custom Consumer pattern.

### 12. No Image Drag Interference
The library uses a `MutationObserver` to set `pointer-events: none` on all `img` elements inside the content. This prevents the browser's default image drag behavior from interfering with panning. If you need image click events, wrap images in a clickable container.

### 13. `ref.current` is Null on First Render
The ref isn't populated until after the first render. Don't call `ref.current?.zoomIn()` in the component body — wrap it in a `useEffect` or event handler.

### 14. `roundScaleForTransform` Fixes Binary Float Noise
JavaScript floating-point arithmetic can produce `1.00000000001` from repeated `* 0.1 + * 10`. The library rounds scales to 8 decimal places internally. If you read `state.scale`, it may have trailing precision noise — use `roundScaleForTransform()` to clean it up.

### 15. Transform Origin is Top-Left (0% 0%)
The CSS `transform-origin` is set to `0% 0%` (top-left), not the common `50% 50%`. This means scaling grows from the top-left corner. All position calculations in the library account for this. If you use custom transforms, keep this in mind.

### 16. Velocity Animation Tuning
For touch devices, the default `maxStrengthTouch: 40` can feel too fast. Reduce `sensitivityTouch` (default 1.2) or `maxStrengthTouch` for more controlled inertia:
```tsx
velocityAnimation={{ sensitivityTouch: 0.8, maxStrengthTouch: 20 }}
```

### 17. KeepScale is O(n) on Every Transform
The `KeepScale` component inversely scales on every transform change. For large numbers of KeepScale children, this can be a performance concern — batch them or use CSS transforms at a higher level instead.

### 18. `zoomAnimation.size` Controls Overzoom Padding
The `zoomAnimation.size` (default 0.4) adds padding around min/max scale, allowing the user to slightly overzoom/underzoom before the animation kicks in. If strict bounds are needed, reduce this to `0`.
