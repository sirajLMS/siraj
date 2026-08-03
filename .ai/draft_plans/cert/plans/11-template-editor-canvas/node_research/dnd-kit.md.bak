# @dnd-kit — Node Module Research (core v6.3.1, sortable v10.0.0, utilities v3.2.2)

## Package Overview

Three `@dnd-kit` packages are installed in `node_modules`:

| Package | Version | Export Entry | Description |
|---------|---------|-------------|-------------|
| `@dnd-kit/core` | 6.3.1 | `dist/index.d.ts` | Core drag-and-drop primitives: `DndContext`, `DragOverlay`, `useDraggable`, `useDroppable`, sensors, collision detection, modifiers |
| `@dnd-kit/sortable` | 10.0.0 | `dist/index.d.ts` | Sortable list utilities: `SortableContext`, `useSortable`, sorting strategies, `arrayMove`, `arraySwap` |
| `@dnd-kit/utilities` | 3.2.2 | `dist/index.d.ts` | Utility functions: `CSS.Transform.toString()`, coordinate helpers, type guards, internal hooks |

**Additional installed package**: `@dnd-kit/accessibility` (dependency of core, provides `HiddenText`, `LiveRegion`, `useAnnouncement` for screen-reader announcements).

**NOT installed**: `@dnd-kit/modifiers` — the built-in modifier implementations (`restrictToHorizontalAxis`, `restrictToVerticalAxis`, `restrictToParentElement`, `restrictToWindowEdges`) are in a separate package that is **not** in `node_modules`. The `Modifier` *type* is defined in `@dnd-kit/core`, but the implementations must be installed separately or custom modifiers must be written.

### Import paths (all use the `@/` alias → project root)

```ts
import { DndContext, DragOverlay, useDraggable, useDroppable, useDndContext, useSensor, useSensors, PointerSensor, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, closestCorners, rectIntersection, pointerWithin, getFirstCollision } from '@dnd-kit/core';
import type { DragStartEvent, DragMoveEvent, DragEndEvent, DragCancelEvent, DragOverEvent, DragPendingEvent, DragAbortEvent, UniqueIdentifier, CollisionDetection, Modifier, Modifiers, AutoScrollOptions, Announcements, DndContextProps, DragOverlayProps, DropAnimation, UseDndContextReturnValue, UseDraggableArguments, UseDroppableArguments, DraggableAttributes } from '@dnd-kit/core';

import { SortableContext, useSortable, arrayMove, arraySwap, sortableKeyboardCoordinates, verticalListSortingStrategy, horizontalListSortingStrategy, rectSortingStrategy, rectSwappingStrategy, defaultAnimateLayoutChanges, defaultNewIndexGetter } from '@dnd-kit/sortable';
import type { SortableContextProps, UseSortableArguments, SortingStrategy, SortableData, AnimateLayoutChanges, NewIndexGetter, Disabled } from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';
import type { Transform, Transition } from '@dnd-kit/utilities';
```

---

## @dnd-kit/core

### Types & Interfaces

#### UniqueIdentifier
```ts
export type UniqueIdentifier = string | number;
```
Used as the identifier for all draggable and droppable items. String or number.

#### ClientRect
```ts
export interface ClientRect {
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
}
```
Measured bounding rectangle of a DOM element (viewport-relative).

#### Coordinates & Translate
```ts
export type { Coordinates } from '@dnd-kit/utilities';
// Coordinates = { x: number; y: number }

export type DistanceMeasurement = number | Coordinates | Pick<Coordinates, 'x'> | Pick<Coordinates, 'y'>;
export type Translate = Coordinates; // alias
export interface ScrollCoordinates {
  initial: Coordinates;
  current: Coordinates;
  delta: Coordinates;
}
```

#### Direction
```ts
export enum Direction {
  Forward = 1,
  Backward = -1,
}
```

#### SyntheticEventName
```ts
export type SyntheticEventName = keyof Without<React.DOMAttributes<any>, 'children' | 'dangerouslySetInnerHTML'>;
```

#### Drag Events

All events share a base `DragEvent` interface (not exported—the exported events below `Pick`/extend it):

```ts
interface DragEvent {
  activatorEvent: Event;     // the native DOM event that started the drag
  active: Active;             // the active draggable being dragged
  collisions: Collision[] | null;  // result of collision detection
  delta: Translate;            // x/y translation since drag start
  over: Over | null;           // the droppable currently under the pointer
}
```

```ts
/** Fired if a pending drag was aborted before it started (activation constraints). */
export interface DragAbortEvent {
  id: UniqueIdentifier;
}

/** Fired when a drag is about to start pending activation constraints. */
export interface DragPendingEvent {
  id: UniqueIdentifier;
  constraint: PointerActivationConstraint;
  initialCoordinates: Coordinates;
  offset?: Coordinates | undefined;
}

export interface DragStartEvent extends Pick<DragEvent, 'active' | 'activatorEvent'> {}

export interface DragMoveEvent extends DragEvent {}

export interface DragOverEvent extends DragMoveEvent {}

export interface DragEndEvent extends DragEvent {}

export interface DragCancelEvent extends DragEndEvent {}
```

#### Active, Over, and Store Types

```ts
export type Data<T = Record<string, any>> = T & Record<string, any>;
export type DataRef<T = Record<string, any>> = MutableRefObject<Data<T> | undefined>;

export interface Active {
  id: UniqueIdentifier;
  data: DataRef;
  rect: MutableRefObject<{
    initial: ClientRect | null;
    translated: ClientRect | null;
  }>;
}

export interface Over {
  id: UniqueIdentifier;
  rect: ClientRect;
  disabled: boolean;
  data: DataRef;
}

export type DraggableNode = {
  id: UniqueIdentifier;
  key: UniqueIdentifier;
  node: MutableRefObject<HTMLElement | null>;
  activatorNode: MutableRefObject<HTMLElement | null>;
  data: DataRef;
};

export type DraggableNodes = Map<UniqueIdentifier, DraggableNode | undefined>;
export type DroppableContainers = DroppableContainersMap;
export type RectMap = Map<UniqueIdentifier, ClientRect>;

export interface DroppableContainer {
  id: UniqueIdentifier;
  key: UniqueIdentifier;
  data: DataRef;
  disabled: boolean;
  node: MutableRefObject<HTMLElement | null>;
  rect: MutableRefObject<ClientRect | null>;
}
```

#### PublicContextDescriptor (returned by `useDndContext`)

```ts
export interface PublicContextDescriptor {
  activatorEvent: Event | null;
  active: Active | null;
  activeNode: HTMLElement | null;
  activeNodeRect: ClientRect | null;
  collisions: Collision[] | null;
  containerNodeRect: ClientRect | null;
  draggableNodes: DraggableNodes;
  droppableContainers: DroppableContainers;
  droppableRects: RectMap;
  over: Over | null;
  dragOverlay: {
    nodeRef: MutableRefObject<HTMLElement | null>;
    rect: ClientRect | null;
    setRef: (element: HTMLElement | null) => void;
  };
  scrollableAncestors: Element[];
  scrollableAncestorRects: ClientRect[];
  measuringConfiguration: DeepRequired<MeasuringConfiguration>;
  measureDroppableContainers(ids: UniqueIdentifier[]): void;
  measuringScheduled: boolean;
  windowRect: ClientRect | null;
}

export type UseDndContextReturnValue = ContextType<typeof PublicContext>;
```

#### Collision Types

```ts
export interface Collision {
  id: UniqueIdentifier;
  data?: Data;
}

export interface CollisionDescriptor extends Collision {
  data: {
    droppableContainer: DroppableContainer;
    value: number;
    [key: string]: any;
  };
}

export type CollisionDetection = (args: {
  active: Active;
  collisionRect: ClientRect;
  droppableRects: RectMap;
  droppableContainers: DroppableContainer[];
  pointerCoordinates: Coordinates | null;
}) => Collision[];
```

#### Modifier Types

```ts
export type Modifier = (args: {
  activatorEvent: Event | null;
  active: Active | null;
  activeNodeRect: ClientRect | null;
  draggingNodeRect: ClientRect | null;
  containerNodeRect: ClientRect | null;
  over: Over | null;
  overlayNodeRect: ClientRect | null;
  scrollableAncestors: Element[];
  scrollableAncestorRects: ClientRect[];
  transform: Transform;
  windowRect: ClientRect | null;
}) => Transform;

export type Modifiers = Modifier[];
```

#### Accessibility Types

```ts
export interface Announcements {
  onDragStart({ active }: Pick<Arguments, 'active'>): string | undefined;
  onDragMove?({ active, over }: Arguments): string | undefined;
  onDragOver({ active, over }: Arguments): string | undefined;
  onDragEnd({ active, over }: Arguments): string | undefined;
  onDragCancel({ active, over }: Arguments): string | undefined;
}

export interface ScreenReaderInstructions {
  draggable: string;  // screen reader instructions for draggable items
}
```

#### DropAnimation Types

```ts
export type DropAnimation = DropAnimationFunction | DropAnimationOptions;

export interface DropAnimationOptions {
  keyframes?: KeyframeResolver;   // custom keyframe resolver
  duration?: number;
  easing?: string;
  sideEffects?: DropAnimationSideEffects | null;
}

export type DropAnimationFunction = (args: DropAnimationFunctionArguments) => Promise<void> | void;

export interface DropAnimationFunctionArguments extends SharedParameters {
  transform: Transform;
}

export type KeyframeResolver = (parameters: KeyframeResolverParameters) => Keyframe[];

export interface KeyframeResolverParameters extends SharedParameters {
  transform: { initial: Transform; final: Transform; };
}

export type DropAnimationSideEffects = (parameters: DropAnimationSideEffectsParameters) => CleanupFunction | void;

// SharedParameters includes: active, dragOverlay, draggableNodes, droppableContainers, measuringConfiguration
```

#### Measuring Types

```ts
export type MeasuringFunction = (node: HTMLElement) => ClientRect;

export interface DraggableMeasuring extends Measuring {  // { measure: MeasuringFunction }
}

export interface DragOverlayMeasuring extends Measuring {}

export interface MeasuringConfiguration {
  draggable?: Partial<DraggableMeasuring>;
  droppable?: Partial<DroppableMeasuring>;
  dragOverlay?: Partial<DragOverlayMeasuring>;
}

export interface DroppableMeasuring {
  measure: MeasuringFunction;
  strategy: MeasuringStrategy;
  frequency: MeasuringFrequency | number;
}

export enum MeasuringStrategy {
  Always = 0,
  BeforeDragging = 1,
  WhileDragging = 2,
}

export enum MeasuringFrequency {
  Optimized = "optimized",
}
```

#### AutoScroll Types

```ts
export interface AutoScrollOptions {  // (exported as Options internally)
  acceleration?: number;
  activator?: AutoScrollActivator;
  canScroll?: (element: Element) => boolean;
  enabled?: boolean;
  interval?: number;
  layoutShiftCompensation?: boolean | { x: boolean; y: boolean; };
  order?: TraversalOrder;
  threshold?: { x: number; y: number; };
}

export enum AutoScrollActivator {
  Pointer = 0,
  DraggableRect = 1,
}

export enum TraversalOrder {
  TreeOrder = 0,
  ReversedTreeOrder = 1,
}
```

---

### Components

#### DndContext

The root provider component that manages all drag-and-drop state.

```ts
export interface Props {  // re-exported as DndContextProps
  id?: string;
  accessibility?: {
    announcements?: Announcements;
    container?: Element;
    restoreFocus?: boolean;
    screenReaderInstructions?: ScreenReaderInstructions;
  };
  autoScroll?: boolean | AutoScrollOptions;
  cancelDrop?: CancelDrop;
  children?: React.ReactNode;
  collisionDetection?: CollisionDetection;
  measuring?: MeasuringConfiguration;
  modifiers?: Modifiers;
  sensors?: SensorDescriptor<any>[];
  onDragAbort?(event: DragAbortEvent): void;
  onDragPending?(event: DragPendingEvent): void;
  onDragStart?(event: DragStartEvent): void;
  onDragMove?(event: DragMoveEvent): void;
  onDragOver?(event: DragOverEvent): void;
  onDragEnd?(event: DragEndEvent): void;
  onDragCancel?(event: DragCancelEvent): void;
}

export type CancelDrop = (args: CancelDropArguments) => boolean | Promise<boolean>;
export interface CancelDropArguments extends DragEndEvent {}

export declare const ActiveDraggableContext: React.Context<Transform>;
export declare const DndContext: React.NamedExoticComponent<Props>;
```

**Usage:**
```tsx
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  modifiers={[restrictToParentElement]}  // if @dnd-kit/modifiers installed
>
  {children}
</DndContext>
```

#### DragOverlay

Renders a portal overlay of the dragged item, separate from the original DOM node.

```ts
export interface Props {  // re-exported as DragOverlayProps
  // extends Pick<PositionedOverlayProps, 'adjustScale' | 'children' | 'className' | 'style' | 'transition'>
  dropAnimation?: DropAnimation | null | undefined;
  modifiers?: Modifiers;
  wrapperElement?: keyof JSX.IntrinsicElements;  // e.g. 'div', 'span'
  zIndex?: number;
  // Inherited from PositionedOverlayProps:
  adjustScale?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  transition?: string | ((activatorEvent: Event | null) => React.CSSProperties['transition'] | undefined);
}

export declare const DragOverlay: React.MemoExoticComponent<...>;
```

**Default constants:**
```ts
export declare const defaultDropAnimation: Required<DropAnimationOptions>;
export declare const defaultDropAnimationSideEffects: (options: {
  className?: { active?: string; dragOverlay?: string; };
  styles?: { active?: Styles; dragOverlay?: Styles; };
}) => DropAnimationSideEffects;
```

**Usage:**
```tsx
<DragOverlay dropAnimation={defaultDropAnimation}>
  {activeId ? <DragPreviewItem id={activeId} /> : null}
</DragOverlay>
```

#### Accessibility (internal component)
```ts
// auto-rendered by DndContext, not typically used directly
export { defaultAnnouncements, defaultScreenReaderInstructions } from './defaults';
```

---

### Hooks

#### useDraggable

```ts
export interface UseDraggableArguments {
  id: UniqueIdentifier;
  data?: Data;
  disabled?: boolean;
  attributes?: {
    role?: string;
    roleDescription?: string;
    tabIndex?: number;
  };
}

export interface DraggableAttributes {
  role: string;
  tabIndex: number;
  'aria-disabled': boolean;
  'aria-pressed': boolean | undefined;
  'aria-roledescription': string;
  'aria-describedby': string;
}

export type DraggableSyntheticListeners = SyntheticListenerMap | undefined;

export declare function useDraggable({ id, data, disabled, attributes }: UseDraggableArguments): {
  active: Active | null;
  activatorEvent: Event | null;
  activeNodeRect: ClientRect | null;
  attributes: DraggableAttributes;
  isDragging: boolean;
  listeners: SyntheticListenerMap | undefined;
  node: MutableRefObject<HTMLElement | null>;
  over: Over | null;
  setNodeRef: (element: HTMLElement | null) => void;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
  transform: Transform | null;
};
```

**Usage:**
```tsx
const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
<div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform) }} {...attributes} {...listeners}>
  Drag me
</div>
```

#### useDroppable

```ts
interface ResizeObserverConfig {
  disabled?: boolean;
  updateMeasurementsFor?: UniqueIdentifier[];  // re-measure these containers on resize
  timeout?: number;  // debounce timeout
}

export interface UseDroppableArguments {
  id: UniqueIdentifier;
  disabled?: boolean;
  data?: Data;
  resizeObserverConfig?: ResizeObserverConfig;
}

export declare function useDroppable({ data, disabled, id, resizeObserverConfig }: UseDroppableArguments): {
  active: Active | null;
  rect: MutableRefObject<ClientRect | null>;
  isOver: boolean;
  node: MutableRefObject<HTMLElement | null>;
  over: Over | null;
  setNodeRef: (element: HTMLElement | null) => void;
};
```

**Usage:**
```tsx
const { setNodeRef, isOver } = useDroppable({ id: 'drop-zone' });
<div ref={setNodeRef} style={{ background: isOver ? 'green' : 'gray' }}>Drop here</div>
```

#### useDndContext

```ts
export declare function useDndContext(): PublicContextDescriptor;
```
Returns the full DndContext state (active, over, collisions, draggableNodes, droppableContainers, droppableRects, dragOverlay, etc.). Useful for child components that need to observe drag state without subscribing to specific events.

#### useDndMonitor

```ts
export interface DndMonitorListener {
  onDragAbort?(event: DragAbortEvent): void;
  onDragPending?(event: DragPendingEvent): void;
  onDragStart?(event: DragStartEvent): void;
  onDragMove?(event: DragMoveEvent): void;
  onDragOver?(event: DragOverEvent): void;
  onDragEnd?(event: DragEndEvent): void;
  onDragCancel?(event: DragCancelEvent): void;
}

export declare function useDndMonitor(listener: DndMonitorListener): void;
```
Allows any component within a `DndContext` to listen to drag events as a side effect (unlike `DndContext`'s event handlers, which only fire from the root). Multiple monitors can be registered; all fire for each event.

**Usage:**
```tsx
useDndMonitor({
  onDragStart: (event) => logger.info('Drag started', event.active.id),
  onDragEnd: (event) => logger.info('Drag ended', event.over?.id),
});
```

---

### Sensors

#### Sensor Type Hierarchy

```ts
export type SensorOptions = {};  // base for all sensor options

export interface SensorProps<T> {
  active: UniqueIdentifier;
  activeNode: DraggableNode;
  event: Event;
  context: MutableRefObject<SensorContext>;
  options: T;
  onAbort(id: UniqueIdentifier): void;
  onPending(id: UniqueIdentifier, constraint: PointerActivationConstraint, initialCoordinates: Coordinates, offset?: Coordinates): void;
  onStart(coordinates: Coordinates): void;
  onCancel(): void;
  onMove(coordinates: Coordinates): void;
  onEnd(): void;
}

export interface Sensor<T extends Object> {
  new (props: SensorProps<T>): SensorInstance;
  activators: Activators<T>;
  setup?(): Teardown | undefined;  // optional setup hook
}

export type SensorInstance = { autoScrollEnabled: boolean; };
export type Sensors = Sensor<any>[];
export type SensorDescriptor<T extends Object> = { sensor: Sensor<T>; options: T; };
export type Activator<T> = { eventName: SyntheticEventName; handler: SensorActivatorFunction<T>; };
export type Activators<T> = Activator<T>[];
```

#### PointerActivationConstraint

```ts
interface DistanceConstraint {
  distance: DistanceMeasurement;  // drag must exceed this distance to start
  tolerance?: DistanceMeasurement;
}

interface DelayConstraint {
  delay: number;            // milliseconds before drag starts
  tolerance: DistanceMeasurement;  // max movement allowed during delay
}

export type PointerActivationConstraint =
  | DelayConstraint
  | DistanceConstraint
  | (DelayConstraint & DistanceConstraint);
```

#### PointerSensor

```ts
export interface PointerSensorOptions extends AbstractPointerSensorOptions {}

// AbstractPointerSensorOptions:
export interface AbstractPointerSensorOptions extends SensorOptions {
  activationConstraint?: PointerActivationConstraint;
  bypassActivationConstraint?(props: { activeNode; event; options }): boolean;
  onActivation?({ event }: { event: Event }): void;
}

export class PointerSensor extends AbstractPointerSensor {
  constructor(props: PointerSensorProps);
  static activators: { eventName: "onPointerDown"; handler: (...) => boolean }[];
}
```

**Activation**: listens for `onPointerDown` events.

#### MouseSensor

```ts
export interface MouseSensorOptions extends AbstractPointerSensorOptions {}

export class MouseSensor extends AbstractPointerSensor {
  constructor(props: MouseSensorProps);
  static activators: { eventName: "onMouseDown"; handler: (...) => boolean }[];
}
```

**Activation**: listens for `onMouseDown`. Sequential with `PointerSensor` — use when you don't want touch events.

#### TouchSensor

```ts
export interface TouchSensorOptions extends PointerSensorOptions {}

export class TouchSensor extends AbstractPointerSensor {
  constructor(props: PointerSensorProps);
  static activators: { eventName: "onTouchStart"; handler: (...) => boolean }[];
  static setup(): () => void;  // adds `touch-action: none` CSS to prevent scrolling
}
```

**Activation**: listens for `onTouchStart`. Calls `setup()` which sets `touch-action: none` on the document.

#### KeyboardSensor

```ts
export enum KeyboardCode {
  Space = "Space",
  Down = "ArrowDown",
  Right = "ArrowRight",
  Left = "ArrowLeft",
  Up = "ArrowUp",
  Esc = "Escape",
  Enter = "Enter",
  Tab = "Tab",
}

export type KeyboardCodes = {
  start: KeyboardEvent['code'][];
  cancel: KeyboardEvent['code'][];
  end: KeyboardEvent['code'][];
};

export type KeyboardCoordinateGetter = (
  event: KeyboardEvent,
  args: { active: UniqueIdentifier; currentCoordinates: Coordinates; context: SensorContext; }
) => Coordinates | void;

export interface KeyboardSensorOptions extends SensorOptions {
  keyboardCodes?: KeyboardCodes;
  coordinateGetter?: KeyboardCoordinateGetter;
  scrollBehavior?: ScrollBehavior;
  onActivation?({ event }: { event: KeyboardEvent }): void;
}

export class KeyboardSensor implements SensorInstance {
  constructor(props: KeyboardSensorProps);
  static activators: Activators<KeyboardSensorOptions>;
}

// Defaults:
export const defaultKeyboardCodes: KeyboardCodes;
export const defaultKeyboardCoordinateGetter: KeyboardCoordinateGetter;
```

#### useSensor

```ts
export declare function useSensor<T extends SensorOptions>(
  sensor: Sensor<T>,
  options?: T
): SensorDescriptor<T>;
```

Creates a sensor descriptor with options. Pass to `useSensors`.

#### useSensors

```ts
export declare function useSensors(
  ...sensors: (SensorDescriptor<any> | undefined | null)[]
): SensorDescriptor<SensorOptions>[];
```

Combines multiple sensor descriptors into an array for `DndContext.sensors`. Filters out `null`/`undefined`.

**Usage:**
```tsx
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
);
```

---

### Collision Detection

All algorithms are `CollisionDetection` functions:

| Algorithm | Description |
|-----------|-------------|
| `rectIntersection` | Returns droppables with the greatest intersection area with the dragged rect |
| `closestCenter` | Returns the droppable whose center is closest to the dragged rect's center |
| `closestCorners` | Returns the droppable whose corner is closest to the dragged rect's corners |
| `pointerWithin` | Returns droppables that the pointer coordinates fall within |

```ts
export declare const rectIntersection: CollisionDetection;
export declare const closestCenter: CollisionDetection;
export declare const closestCorners: CollisionDetection;
export declare const pointerWithin: CollisionDetection;
```

#### Helper: getFirstCollision

```ts
export declare function getFirstCollision(collisions: Collision[] | null | undefined): Collision | null;
export declare function getFirstCollision<T extends keyof Collision>(
  collisions: Collision[] | null | undefined,
  property: T
): Collision[T] | null;
```
Returns the first collision (most relevant — collisions are sorted by the algorithm). If `property` is given, returns that property instead of the whole collision.

#### Helper: sortCollisionsAsc / sortCollisionsDesc
```ts
export function sortCollisionsAsc(a: CollisionDescriptor, b: CollisionDescriptor): number;  // smallest first
export function sortCollisionsDesc(a: CollisionDescriptor, b: CollisionDescriptor): number; // largest first
```

---

### Modifiers

**Important**: `@dnd-kit/modifiers` is NOT installed. The `Modifier` type is in core, but the implementations (`restrictToHorizontalAxis`, `restrictToVerticalAxis`, `restrictToParentElement`, `restrictToWindowEdges`) are in a separate package.

To restrict movement, either:
1. Install `@dnd-kit/modifiers` (not currently in package.json)
2. Write a custom modifier:

```ts
// Custom modifier example: restrict movement to the parent element
const restrictToParentElement: Modifier = ({ active, draggingNodeRect, containerNodeRect, transform }) => {
  if (!draggingNodeRect || !containerNodeRect) return transform;
  const value = { ...transform };
  // Clamp transform.x so the dragged rect stays within containerNodeRect
  if (draggingNodeRect.top + transform.y <= containerNodeRect.top)
    value.y = containerNodeRect.top - draggingNodeRect.top;
  if (draggingNodeRect.bottom + transform.y >= containerNodeRect.bottom)
    value.y = containerNodeRect.bottom - draggingNodeRect.bottom;
  if (draggingNodeRect.left + transform.x <= containerNodeRect.left)
    value.x = containerNodeRect.left - draggingNodeRect.left;
  if (draggingNodeRect.right + transform.x >= containerNodeRect.right)
    value.x = containerNodeRect.right - draggingNodeRect.right;
  return value;
};
```

#### applyModifiers

```ts
export declare function applyModifiers(
  modifiers: Modifiers | undefined,
  args: FirstArgument<Modifier>
): Transform;
```
Internal function that applies modifiers sequentially. Called by DndContext.

---

### Context Props & Events

See **DndContext** props above. Summary of event callbacks:

| Event | Interface | Key Fields | When fired |
|-------|-----------|------------|-----------|
| `onDragStart` | `DragStartEvent` | `active`, `activatorEvent` | Drag begins (after activation constraint) |
| `onDragMove` | `DragMoveEvent` | `active`, `over`, `delta`, `collisions`, `activatorEvent` | Pointer moves during drag |
| `onDragOver` | `DragOverEvent` | extends `DragMoveEvent` | Over target changes |
| `onDragEnd` | `DragEndEvent` | `active`, `over`, `delta`, `collisions`, `activatorEvent` | Drag ends (drop) |
| `onDragCancel` | `DragCancelEvent` | extends `DragEndEvent` | Drag is cancelled (Esc/minDelay expires) |
| `onDragPending` | `DragPendingEvent` | `id`, `constraint`, `initialCoordinates`, `offset?` | Android Chrome long-press pending |
| `onDragAbort` | `DragAbortEvent` | `id` | AbortController abort before start |

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `sensors` | `SensorDescriptor[]` | `defaultSensors` (Pointer + Keyboard) | Array from `useSensors()` |
| `collisionDetection` | `CollisionDetection` | `rectIntersection` | How to detect what's under the pointer |
| `modifiers` | `Modifier[]` | `[]` | Transform adjustments |
| `autoScroll` | `boolean \| AutoScrollOptions` | `true` | Enable/configure auto-scroll |
| `measuring` | `MeasuringConfiguration` | `defaultMeasuringConfiguration` | How to measure elements |
| `cancelDrop` | `(args) => boolean \| Promise<boolean>` | — | Can cancel a drop (return false) |
| `accessibility` | `{ announcements?, container?, restoreFocus?, screenReaderInstructions? }` | `defaultAnnouncements` / `defaultScreenReaderInstructions` | Screen reader announcements |

---

## @dnd-kit/sortable

### Types & Interfaces

#### SortableContextProps

```ts
export interface Props {  // re-exported as SortableContextProps
  children: React.ReactNode;
  items: (UniqueIdentifier | { id: UniqueIdentifier })[];
  strategy?: SortingStrategy;
  id?: string;  // container id
  disabled?: boolean | Disabled;
}
```

#### Disabled

```ts
export interface Disabled {
  draggable?: boolean;
  droppable?: boolean;
}
```

#### SortableData

```ts
export type SortableData = {
  sortable: {
    containerId: UniqueIdentifier;
    items: UniqueIdentifier[];
    index: number;
  };
};
```
Attached to `data.current` of sortable items via `useSortable`, containing container id, the full item list, and the item's index.

#### SortingStrategy

```ts
export type SortingStrategy = (args: {
  activeNodeRect: ClientRect | null;
  activeIndex: number;
  index: number;
  rects: ClientRect[];
  overIndex: number;
}) => Transform | null;
```
A pure function computing the `Transform` for a sortable item at `index` given the active item's rect/index, the over index, and the sorted rects.

#### UseSortableArguments

```ts
export interface Arguments  // re-exported as UseSortableArguments
  extends Omit<UseDraggableArguments, 'disabled'>,
          Pick<UseDroppableArguments, 'resizeObserverConfig'>
{
  animateLayoutChanges?: AnimateLayoutChanges;
  disabled?: boolean | Disabled;
  getNewIndex?: NewIndexGetter;
  strategy?: SortingStrategy;
  transition?: SortableTransition | null;
}
```

#### AnimateLayoutChanges

```ts
export type AnimateLayoutChanges = (args: {
  active: Active | null;
  containerId: UniqueIdentifier;
  isDragging: boolean;
  isSorting: boolean;
  id: UniqueIdentifier;
  index: number;
  items: UniqueIdentifier[];
  previousItems: UniqueIdentifier[];
  previousContainerId: UniqueIdentifier;
  newIndex: number;
  transition: SortableTransition | null;
  wasDragging: boolean;
}) => boolean;
```

#### NewIndexGetter

```ts
export interface NewIndexGetterArguments {
  id: UniqueIdentifier;
  items: UniqueIdentifier[];
  activeIndex: number;
  overIndex: number;
}

export type NewIndexGetter = (args: NewIndexGetterArguments) => number;
```

#### SortableTransition

```ts
export type SortableTransition = Pick<Transition, 'easing' | 'duration'>;
```

#### hasSortableData

```ts
export declare function hasSortableData<T extends Active | Over | DraggableNode | DroppableContainer>(
  entry: T | null | undefined
): entry is T & { data: { current: Data<SortableData> } };
```
Type guard narrowing an entry to one whose `data.current` is `Data<SortableData>`.

---

### Hooks

#### useSortable — full return type

```ts
export interface Arguments extends
  Omit<UseDraggableArguments, 'disabled'>,
  Pick<UseDroppableArguments, 'resizeObserverConfig'>
{
  animateLayoutChanges?: AnimateLayoutChanges;
  disabled?: boolean | Disabled;
  getNewIndex?: NewIndexGetter;
  strategy?: SortingStrategy;
  transition?: SortableTransition | null;
}

export declare function useSortable({
  animateLayoutChanges,
  attributes: userDefinedAttributes,
  disabled: localDisabled,
  data: customData,
  getNewIndex,
  id,
  strategy: localStrategy,
  resizeObserverConfig,
  transition,
}: Arguments): {
  active: Active | null;
  activeIndex: number;
  attributes: DraggableAttributes;
  data: SortableData & { [x: string]: any };
  rect: MutableRefObject<ClientRect | null>;
  index: number;
  newIndex: number;
  items: UniqueIdentifier[];
  isOver: boolean;
  isSorting: boolean;
  isDragging: boolean;
  listeners: SyntheticListenerMap | undefined;
  node: MutableRefObject<HTMLElement | null>;
  overIndex: number;
  over: Over | null;
  setNodeRef: (node: HTMLElement | null) => void;          // combined draggable + droppable ref
  setActivatorNodeRef: (element: HTMLElement | null) => void;
  setDroppableNodeRef: (element: HTMLElement | null) => void;
  setDraggableNodeRef: (element: HTMLElement | null) => void;
  transform: Transform | null;
  transition: string | undefined;
};
```

| Return field | Type | Description |
|---|---|---|
| `active` | `Active \| null` | Currently active draggable from context |
| `activeIndex` | `number` | Index of the active item |
| `attributes` | `DraggableAttributes` | ARIA attributes for the element |
| `data` | `SortableData & Record<string, any>` | Merged draggable + droppable data |
| `rect` | `MutableRefObject<ClientRect \| null>` | Latest measured rect |
| `index` | `number` | Current index of this item |
| `newIndex` | `number` | Projected new index after sort |
| `items` | `UniqueIdentifier[]` | IDs of all items in the container |
| `isOver` | `boolean` | Whether a draggable is over this item |
| `isSorting` | `boolean` | Whether a sort operation is in progress |
| `isDragging` | `boolean` | Whether THIS item is being dragged |
| `listeners` | `SyntheticListenerMap \| undefined` | Pointer/keyboard listeners for activation |
| `node` | `MutableRefObject<HTMLElement \| null>` | Ref to the combined node |
| `overIndex` | `number` | Index of the item currently being over'd |
| `over` | `Over \| null` | The over target from dnd context |
| `setNodeRef` | `(node: HTMLElement \| null) => void` | Combined draggable + droppable ref |
| `setActivatorNodeRef` | `(element: HTMLElement \| null) => void` | The activator element ref |
| `setDroppableNodeRef` | `(element: HTMLElement \| null) => void` | Droppable portion ref |
| `setDraggableNodeRef` | `(element: HTMLElement \| null) => void` | Draggable portion ref |
| `transform` | `Transform \| null` | Computed x/y/scale transform |
| `transition` | `string \| undefined` | Computed CSS transition string |

#### Defaults (exported)

```ts
export const defaultNewIndexGetter: NewIndexGetter;
export const defaultAnimateLayoutChanges: AnimateLayoutChanges;
export const defaultTransition: SortableTransition;
export const transitionProperty = "transform";
export const disabledTransition: string;
export const defaultAttributes: { roleDescription: string };
```

---

### Strategies

All four are `SortingStrategy` consts:

```ts
export declare const verticalListSortingStrategy: SortingStrategy;
export declare const horizontalListSortingStrategy: SortingStrategy;
export declare const rectSortingStrategy: SortingStrategy;
export declare const rectSwappingStrategy: SortingStrategy;
```

| Strategy | Use case |
|----------|----------|
| `verticalListSortingStrategy` | Vertical lists (items stack top-to-bottom) |
| `horizontalListSortingStrategy` | Horizontal lists (items stack left-to-right) |
| `rectSortingStrategy` | Grid layouts (rectangular grid arrangement) |
| `rectSwappingStrategy` | Grid with swap-based reordering (items swap positions instead of shifting) |

---

### Utilities

```ts
export { arrayMove } from './arrayMove';
export { arraySwap } from './arraySwap';
export { getSortedRects } from './getSortedRects';
export { isValidIndex } from './isValidIndex';
export { itemsEqual } from './itemsEqual';
export { normalizeDisabled } from './normalizeDisabled';
```

#### arrayMove

```ts
export declare function arrayMove<T>(array: T[], from: number, to: number): T[];
```
Returns a **new** array with the item at `from` moved to `to`. Does **not** mutate the input.

#### arraySwap

```ts
export declare function arraySwap<T>(array: T[], from: number, to: number): T[];
```
Returns a **new** array with the items at `from` and `to` swapped. Does **not** mutate the input.

#### getSortedRects

```ts
export declare function getSortedRects(
  items: UniqueIdentifier[],
  rects: UseDndContextReturnValue['droppableRects']
): ClientRect[];
```
Maps a list of item ids to their rects in order from the dnd context's `droppableRects`.

#### isValidIndex

```ts
export declare function isValidIndex(index: number | null): index is number;
```
Type guard for non-null number.

#### itemsEqual

```ts
export declare function itemsEqual(a: UniqueIdentifier[], b: UniqueIdentifier[]): boolean;
```
Returns true only when the two arrays contain the same identifiers in the same order.

#### normalizeDisabled

```ts
export declare function normalizeDisabled(disabled: boolean | Disabled): Disabled;
```
Converts a boolean or `{ draggable?, droppable? }` into the normalized `Disabled` shape.

---

### Components

#### SortableContext

```ts
export interface Props {  // re-exported as SortableContextProps
  children: React.ReactNode;
  items: (UniqueIdentifier | { id: UniqueIdentifier })[];
  strategy?: SortingStrategy;
  id?: string;
  disabled?: boolean | Disabled;
}

// Internal context descriptor (not exported, but flows through Context):
interface ContextDescriptor {
  activeIndex: number;
  containerId: string;
  disabled: Disabled;
  disableTransforms: boolean;
  items: UniqueIdentifier[];
  overIndex: number;
  useDragOverlay: boolean;
  sortedRects: ClientRect[];
  strategy: SortingStrategy;
}

export declare const Context: React.Context<ContextDescriptor>;
export declare function SortableContext({
  children,
  id,
  items: userDefinedItems,
  strategy,
  disabled: disabledProp,
}: Props): JSX.Element;
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | Sortable children |
| `items` | `(UniqueIdentifier \| { id: UniqueIdentifier })[]` | Ordered list of ids (or objects with `id`) |
| `strategy` | `SortingStrategy` | Sorting strategy (default `rectSortingStrategy`) |
| `id` | `string` | Container id, used in `SortableData.sortable.containerId` |
| `disabled` | `boolean \| Disabled` | Disable all items (bool) or fine-grained |

---

### Sensors (sortable-specific)

#### sortableKeyboardCoordinates

```ts
export declare const sortableKeyboardCoordinates: KeyboardCoordinateGetter;
```
A `KeyboardCoordinateGetter` tailored for sortable contexts — computes next coordinates when arrow-key navigating during a drag, using the sortable rects for spatial movement rather than a fixed step.

**Usage:**
```tsx
useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
```

---

## @dnd-kit/utilities

### CSS Utilities

```ts
export type Transform = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
};

export interface Transition {
  property: string;
  easing: string;
  duration: number;
}

export const CSS: Readonly<{
  Translate: {
    toString(transform: Transform | null): string | undefined;
  };
  Scale: {
    toString(transform: Transform | null): string | undefined;
  };
  Transform: {
    toString(transform: Transform | null): string | undefined;
  };
  Transition: {
    toString({ property, duration, easing }: Transition): string;
  };
}>;
```

| Method | Output example | Use |
|--------|---------------|-----|
| `CSS.Transform.toString(transform)` | `"translate3d(10px, 20px, 0) scaleX(1) scaleY(1)"` | Full CSS transform for useSortable/useDraggable |
| `CSS.Translate.toString(transform)` | `"translate3d(10px, 20px, 0)"` | Just the translate portion |
| `CSS.Scale.toString(transform)` | `"scaleX(1) scaleY(1)"` | Just the scale portion |
| `CSS.Transition.toString({ property, duration, easing })` | `"transform 200ms ease"` | CSS transition string |

**Critical usage pattern for sortable items:**
```tsx
const { transform, transition } = useSortable({ id });
<div style={{ transform: CSS.Transform.toString(transform), transition }}>
  {children}
</div>
```

### Other Utilities

#### Adjustment
```ts
export const add: <T extends Record<U, number>, U extends string>(object: T, ...adjustments: Partial<T>[]) => T;
export const subtract: <T extends Record<U, number>, U extends string>(object: T, ...adjustments: Partial<T>[]) => T;
```
Add/subtract numeric properties of an object (used internally for coordinates).

#### Coordinates
```ts
export type Coordinates = { x: number; y: number };
export function getEventCoordinates(event: Event): Coordinates | null;
```

#### Event Type Guards
```ts
export function hasViewportRelativeCoordinates(event: Event): event is Event & Pick<PointerEvent, 'clientX' | 'clientY'>;
export function isKeyboardEvent(event: Event | undefined | null): event is KeyboardEvent;
export function isTouchEvent(event: Event | undefined | null): event is TouchEvent;
```

#### Execution Context
```ts
export const canUseDOM: boolean;
export function getOwnerDocument(target: Event['target']): Document;
export function getWindow(target: Event['target']): typeof window;
```

#### Focus
```ts
export function findFirstFocusableNode(element: HTMLElement): HTMLElement | null;
```

#### Type Guards
```ts
export function isDocument(node: Node): node is Document;
export function isHTMLElement(node: Node | Window): node is HTMLElement;
export function isNode(node: Object): node is Node;
export function isSVGElement(node: Node): node is SVGElement;
export function isWindow(element: Object): element is typeof window;
```

#### Hooks (used internally by @dnd-kit/core, safe to use but primarily internal)
```ts
export function useCombinedRefs<T>(...refs: ((node: T) => void)[]): (node: T) => void;
export function useEvent<T extends Function>(handler: T | undefined): (...args: any) => any;
export const useIsomorphicLayoutEffect: typeof useLayoutEffect;  // useEffect on server, useLayoutEffect on client
export function useInterval(): readonly [(listener: Function, duration: number) => void, () => void];
export function useLatestValue<T>(value: T, dependencies?: DependencyList): MutableRefObject<T>;
export function useLazyMemo<T>(callback: (prevValue: T | undefined) => T, dependencies: any[]): T;
export function useNodeRef(onChange?: (newEl: HTMLElement | null, prevEl: HTMLElement | null) => void): readonly [MutableRefObject<HTMLElement | null>, (element: HTMLElement | null) => void];
export function usePrevious<T>(value: T): T | undefined;
export function useUniqueId(prefix: string, value?: string): string;
```

#### Type Aliases
```ts
export type Arguments<T> = T extends (...args: infer U) => any ? U : never;
export type DeepRequired<T> = { [K in keyof T]-?: Required<T[K]>; };
export type FirstArgument<T> = T extends (firstArg: infer U, ...args: Array<any>) => any ? U : never;
export type Without<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
```

---

## Deprecations & Breaking Changes

### @deprecated search results

A grep for `@deprecated` across all `.d.ts` files in all three packages (and `@dnd-kit/accessibility`) returned **zero matches**. No deprecated APIs in these installed versions.

### Version-specific notes

**core v6.3.1**:
- `DragPendingEvent` and `DragAbortEvent` are present (these were added in v6.1.0 for Android Chrome long-press support / activation constraints). If upgrading from pre-v6.1, `onDragPending` and `onDragAbort` props are new.
- `ActiveDraggableContext` is exported as `React.Context<Transform>` — internal but available.

**sortable v10.0.0**:
- The major version bump (v9 → v10) typically includes breaking changes. The `.d.ts` files in this version show clean exports with no `@deprecated` tags.
- `useSortable` returns `setDroppableNodeRef` and `setDraggableNodeRef` in addition to `setNodeRef` — the combined `setNodeRef` is the primary ref to use for most cases. The separate refs are available when you need to separate the draggable and droppable DOM nodes (e.g., different elements for drag handle vs. drop target).

**utilities v3.2.2**:
- No breaking changes found. `CSS.Transform`, `CSS.Translate`, `CSS.Scale`, `CSS.Transition` are all stable.

### Note on @dnd-kit/modifiers

The `@dnd-kit/modifiers` package (which provides `restrictToHorizontalAxis`, `restrictToVerticalAxis`, `restrictToParentElement`, `restrictToWindowEdges`, `snapCenterToCursor`) is **NOT installed**. If the template editor needs axis-restricted dragging or parent-bounded dragging, either:
1. Add `@dnd-kit/modifiers` to `package.json` and install, or
2. Implement custom `Modifier` functions (the `Modifier` type is in `@dnd-kit/core`)

---

## Usage Examples

### Complete Example: Certificate Template Canvas Drag-and-Drop

This example shows a sortable list of template elements (text, image, QR code, logo) that can be reordered by dragging, with a drag overlay for visual feedback and keyboard accessibility.

```tsx
import { useCallback, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  type UniqueIdentifier,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Types ---
type TemplateElementType = 'text' | 'image' | 'qr' | 'logo';

interface TemplateElement {
  id: UniqueIdentifier;
  type: TemplateElementType;
  label: string;
}

// --- Sortable item component ---
interface SortableItemProps {
  element: TemplateElement;
}

function SortableItem({ element }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    padding: '12px 16px',
    margin: '4px 0',
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    cursor: 'grab',
    touchAction: 'none' as const,  // required for PointerSensor on touch devices
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {element.label}
    </div>
  );
}

// --- Main canvas component ---
export function TemplateCanvasEditor() {
  const [elements, setElements] = useState<TemplateElement[]>([
    { id: 'elem-1', type: 'text', label: 'Certificate Title' },
    { id: 'elem-2', type: 'image', label: 'Background Image' },
    { id: 'elem-3', type: 'qr', label: 'QR Code' },
    { id: 'elem-4', type: 'logo', label: 'Company Logo' },
  ]);

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },  // prevent accidental drags
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    setElements((prev) => {
      const oldIndex = prev.findIndex((e) => e.id === active.id);
      const newIndex = prev.findIndex((e) => e.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const activeElement = activeId
    ? elements.find((e) => e.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={elements}
        strategy={verticalListSortingStrategy}
      >
        {elements.map((element) => (
          <SortableItem key={element.id} element={element} />
        ))}
      </SortableContext>

      <DragOverlay>
        {activeElement ? (
          <div
            style={{
              padding: '12px 16px',
              background: '#f5f5f5',
              border: '1px solid #ccc',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {activeElement.label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
```

### Example: Custom Modifier (restrict to canvas bounds)

Since `@dnd-kit/modifiers` is not installed, here's a custom modifier to constrain dragging within the canvas:

```tsx
import type { Modifier } from '@dnd-kit/core';

const restrictToCanvas: Modifier = ({
  draggingNodeRect,
  containerNodeRect,
  transform,
}) => {
  if (!draggingNodeRect || !containerNodeRect) return transform;

  const value = { ...transform };

  // Clamp X within container
  if (draggingNodeRect.left + transform.x < containerNodeRect.left)
    value.x = containerNodeRect.left - draggingNodeRect.left;
  if (draggingNodeRect.right + transform.x > containerNodeRect.right)
    value.x = containerNodeRect.right - draggingNodeRect.right;

  // Clamp Y within container
  if (draggingNodeRect.top + transform.y < containerNodeRect.top)
    value.y = containerNodeRect.top - draggingNodeRect.top;
  if (draggingNodeRect.bottom + transform.y > containerNodeRect.bottom)
    value.y = containerNodeRect.bottom - draggingNodeRect.bottom;

  return value;
};

// Pass to DndContext:
<DndContext modifiers={[restrictToCanvas]} ...>
```

### Example: Grid Layout with rectSwappingStrategy

```tsx
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSwappingStrategy, arraySwap } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const items = ['1', '2', '3', '4', '5', '6'];

function GridItem({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        width: 100,
        height: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #ccc',
        touchAction: 'none',
      }}
      {...attributes}
      {...listeners}
    >
      Item {id}
    </div>
  );
}

function GridCanvas() {
  const [itemOrder, setItemOrder] = useState(items);
  const sensors = useSensors(useSensor(PointerSensor));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id) {
          setItemOrder((prev) => {
            const oldIndex = prev.indexOf(String(active.id));
            const newIndex = prev.indexOf(String(over.id));
            return arraySwap(prev, oldIndex, newIndex);
          });
        }
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 100px)', gap: 8 }}>
        <SortableContext items={itemOrder} strategy={rectSwappingStrategy}>
          {itemOrder.map((id) => <GridItem key={id} id={id} />)}
        </SortableContext>
      </div>
    </DndContext>
  );
}
```

---

## Gotchas & Warnings

1. **`touchAction: 'none'`**: Required on draggable elements when using `PointerSensor` on touch devices. Without it, touch events may start scrolling instead of dragging. The `TouchSensor` calls `setup()` which adds `touch-action: none` to the document, but `PointerSensor` does not — you must add it manually via inline style or CSS.

2. **`CSS.Transform.toString()` vs `CSS.Translate.toString()`**: Use `CSS.Transform.toString(transform)` for sortable items (includes scale). For simple draggables where you don't want scaling, `CSS.Translate.toString(transform)` omits the `scaleX/scaleY` portions.

3. **`useSortable` combined ref vs separate refs**: `useSortable` returns both `setNodeRef` (combined) and `setDroppableNodeRef` + `setDraggableNodeRef` (separate). For most use cases, `setNodeRef` is sufficient. Use the separate refs only when the drag handle is a different element from the drop target.

4. **`setActivatorNodeRef`**: When the drag handle is a child element (not the entire item), use `setActivatorNodeRef` on the handle element. Spread `listeners` on the same element that has `setActivatorNodeRef` (or `setNodeRef` if no separate handle).

5. **`arrayMove` vs `arraySwap`**: Use `arrayMove` with `verticalListSortingStrategy` and `horizontalListSortingStrategy` (items shift to accommodate). Use `arraySwap` with `rectSwappingStrategy` (items swap positions directly).

6. **`items` prop on `SortableContext`**: Accepts both `UniqueIdentifier[]` (strings/numbers) and `{ id: UniqueIdentifier }[]` (objects with an `id` field). The internal implementation normalizes both forms. Each item's `id` must match the `id` passed to `useSortable`.

7. **`transform` can be `null`**: Always guard against `null` when applying styles. `CSS.Transform.toString(null)` returns `undefined`, which is fine for CSS (omits the transform property).

8. **`onDragMove` is expensive**: Called on every pointer move. Avoid heavy computation in `onDragMove` — use `onDragOver` instead for droppable target changes.

9. **`onDragOver` vs `onDragMove`**: `DragOverEvent` only fires when the over target changes (the droppable under the pointer). `DragMoveEvent` fires on every move. For detecting which element you're over, use `onDragOver`.

10. **`KeyboardSensor` requires `coordinateGetter`**: The default `KeyboardSensor` uses `defaultKeyboardCoordinateGetter` which moves by fixed pixels. For sortable lists, pass `sortableKeyboardCoordinates` as the `coordinateGetter` to navigate between items rather than by pixels.

11. **`cancelDrop` is async-capable**: `cancelDrop` can return a `Promise<boolean>`. If it resolves to `false`, the drop is cancelled and `onDragCancel` fires instead of completing.

12. **`dragOverlay` in `useDndContext()`**: The `PublicContextDescriptor.dragOverlay` object contains `nodeRef`, `rect`, and `setRef`. The `DragOverlay` component uses these internally. You can check `dragOverlay.rect` to know the overlay's current position.

13. **Multiple `SortableContext` containers**: You can nest multiple `SortableContext` components within a single `DndContext`. Each `SortableContext` manages its own `items` and `strategy`. For cross-container dragging, check `over.data.current?.sortable.containerId` in `onDragEnd` to determine the target container.

14. **`data` on useDraggable/useSortable**: The `data` argument accepts arbitrary data (`Data<T>`). For sortable items, `useSortable` automatically injects `SortableData` (`{ sortable: { containerId, items, index } }`) into `data.current`. Custom data is merged alongside the `sortable` field.

15. **Performance — `MeasuringStrategy`**: The `measuring.droppable.strategy` controls when droppable rects are measured. `MeasuringStrategy.WhileDragging` (default) measures during drags for accuracy. `MeasuringStrategy.BeforeDragging` measures before each drag (less frequent). `MeasuringStrategy.Always` continuously measures.

16. **`@dnd-kit/modifiers` not installed**: The most commonly needed modifiers (`restrictToParentElement`, `restrictToHorizontalAxis`, `restrictToVerticalAxis`, `restrictToWindowEdges`, `snapCenterToCursor`) are in a separate package. See the custom modifier example above, or install `@dnd-kit/modifiers` if needed.

17. **React 19 / Next.js 16 Compatibility**: These packages are React hooks and components — they work with React 19. No known breaking changes. Ensure `touchAction: 'none'` is set via CSS object (not a string), which MUI v9's `sx` prop handles correctly: `sx={{ touchAction: 'none' }}`.

18. **`ActiveDraggableContext`**: Exported as `React.Context<Transform>`. It provides the active draggable's transform to child components. Rarely used directly — `useDraggable` and `useSortable` consume it internally.

19. **`useDndMonitor` vs `DndContext` event handlers**: `DndContext`'s `onDragStart`/`onDragEnd`/etc. fire from the root. `useDndMonitor` allows any descendant component to listen to the same events. Multiple monitors fire for each event; they do not override each other. Useful when a deep child needs to react to drag state changes without prop drilling.

20. **`hasSortableData` type guard**: When handling `onDragEnd`, use `hasSortableData(active)` and `hasSortableData(over)` to narrow the types and access `active.data.current?.sortable.index` and `over.data.current?.sortable.containerId` safely.
