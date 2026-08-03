# @xyflow/react v12.11.2 & @xyflow/system v0.0.79 — API Research

> Researched from type declarations in `node_modules/@xyflow/` (only `.d.ts` files read).
> @xyflow/react@12.11.2 (main entry `react/dist/esm/index.d.ts`).
> @xyflow/system@0.0.79 (main entry `system/dist/esm/index.d.ts`).

## Package Versions & Entry Points

- `@xyflow/react@12.11.2` — `dist/esm/index.d.ts`
- `@xyflow/system@0.0.79` — `dist/esm/index.d.ts`

`@xyflow/react` re-exports many types/utilities from `@xyflow/system`, so most types can be imported from either package. Prefer `@xyflow/react` for app code.

---

## Top-Level Exports from `@xyflow/react`

(re-exported by `react/dist/esm/index.d.ts`)

### Components
- `ReactFlow` (default + named) — see [ReactFlow component](#reactflow-component)
- `ReactFlowProvider` — see [ReactFlowProvider](#reactflowprovider)
- `Handle`, `EdgeText`
- Built-in edges: `StraightEdge`, `StepEdge`, `BezierEdge`, `SimpleBezierEdge`, `SmoothStepEdge`, `BaseEdge`
- `Panel`, `EdgeLabelRenderer`, `ViewportPortal`
- Additional components via `export * from './additional-components'`: `Background`, `Controls`, `MiniMap`, `NodeResizer`, `NodeResizeControl`, `NodeToolbar`, `EdgeToolbar` (see [Additional Components](#additional-components))

### Hooks
- `useReactFlow` — see [Hooks](#hooks)
- `useUpdateNodeInternals`, `useNodes`, `useEdges`, `useViewport`, `useKeyPress`
- `useNodesState`, `useEdgesState` — see [Utilities](#utilities)
- `useStore`, `useStoreApi`
- `useOnViewportChange`, `useOnSelectionChange`
- `useNodesInitialized`, `useHandleConnections`, `useNodeConnections`, `useNodesData`
- `useConnection`, `useInternalNode`, `useNodeId`
- `experimental_useOnNodesChangeMiddleware`, `experimental_useOnEdgesChangeMiddleware`

### Utilities
- `applyNodeChanges`, `applyEdgeChanges`, `addEdge`, `reconnectEdge`
- `isNode`, `isEdge`

### Re-exports from `@xyflow/system`
- Edge geometry: `getBezierEdgeCenter`, `getBezierPath`, `getEdgeCenter`, `getSmoothStepPath`, `getStraightPath`
- Viewport: `getViewportForBounds`, `getNodesBounds`
- Graph helpers: `getIncomers`, `getOutgoers`, `getConnectedEdges`
- Path-options types: `GetBezierPathParams`, `GetSmoothStepPathParams`, `GetStraightPathParams`
- Many type-only re-exports (Node, Edge, Connection, Viewport, etc.) — see [Types](#types)

---

## ReactFlow Component

Source: `react/dist/esm/types/component-props.d.ts` (654 lines) + `react/dist/esm/container/ReactFlow/Wrapper.d.ts`

`ReactFlowProps` extends `Omit<HTMLAttributes<HTMLDivElement>, 'onError'>` and adds ~80+ props:

```typescript
import type { HTMLAttributes } from 'react';
import type {
  Node, Edge, Connection, EdgeTypes, NodeTypes, OnConnect, OnConnectStart, OnConnectEnd,
  OnNodesChange, OnEdgesChange, OnMove, OnMoveStart, OnMoveEnd, OnError,
  IsValidConnection, ConnectionMode, PanOnScrollMode, SelectionMode,
  FitViewOptions, Viewport, SnapGrid, CoordinateExtent, NodeOrigin,
  ProOptions, ColorMode, OnBeforeDelete, OnSelectionDrag, DefaultEdgeOptions,
  NodeDimension, ZIndexMode, EdgeTypes, NodeTypes, AriaLabelConfig,
  ConnectionLineComponent, ConnectionLineType, OnReconnect,
} from '@xyflow/system';

export type ReactFlowProps<NodeType extends Node = Node, EdgeType extends Edge = Edge>
  = Omit<HTMLAttributes<HTMLDivElement>, 'onError'> & {

  // ── Nodes & Edges ──
  nodes?: NodeType[];
  edges?: EdgeType[];
  defaultNodes?: NodeType[];
  defaultEdges?: EdgeType[];
  onNodesChange?: OnNodesChange<NodeType>;
  onEdgesChange?: OnEdgesChange<EdgeType>;
  onConnect?: OnConnect;
  onConnectStart?: OnConnectStart<NodeType>;
  onConnectEnd?: OnConnectEnd<NodeType>;
  onReconnect?: OnReconnect<EdgeType>;
  onReconnectStart?: OnReconnectStart<EdgeType>;
  onReconnectEnd?: OnReconnectEnd<NodeType, EdgeType>;
  onBeforeDelete?: OnBeforeDelete<NodeType, EdgeType>;

  // ── Node/Edge Types ──
  nodeTypes?: NodeTypes;
  edgeTypes?: EdgeTypes;
  /** @default false */
  deleteKeyCode?: KeyCode | null | KeyCode[];
  /** @default ['Backspace'] */
  multiSelectionKeyCode?: KeyCode | null | KeyCode[];
  /** @default ['Meta', 'Control'] */
  selectionKeyCode?: KeyCode | null | KeyCode[];
  /** @default ['Shift'] */
  panActivationKeyCode?: KeyCode | null | KeyCode[];
  /** @default null — array of zoom KeyCode strings that when pressed zoom instead of pan */
  zoomActivationKeyCode?: KeyCode | null | KeyCode[];
  /** @default ['Space'] */
  fitViewOptions?: FitViewOptions<NodeType>;
  multiSelectionKeyCode?: KeyCode | null | KeyCode[];

  // ── Viewport & Zoom ──
  /** @default true */
  fitView?: boolean;
  minZoom?: number;        // @default 0.5
  maxZoom?: number;        // @default 2
  /** @default undefined */
  translateExtent?: CoordinateExtent;
  /** @default undefined */
  nodeExtent?: CoordinateExtent;
  /** @default false */
  zoomOnScroll?: boolean;
  /** @default false */
  zoomOnPinch?: boolean;   // @default true
  /** @default false */
  panOnScroll?: boolean;
  panOnScrollMode?: PanOnScrollMode;
  /** @default true */
  zoomOnDoubleClick?: boolean;
  /** @default true */
  panOnDrag?: boolean | KeyCode[];
  /** @default false */
  selectionOnDrag?: boolean;
  /** @default false */
  autoPanOnConnect?: boolean;  // @default true
  /** @default true */
  autoPanOnNodeDrag?: boolean;
  /** @default false */
  restoreViewportOnNodeDrag?: boolean; // @default true

  // ── Selection & Interaction ──
  selectionMode?: SelectionMode;   // @default 'partial'
  /** @default false */
  selectNodesOnDrag?: boolean;    // @default true
  /** @default true */
  nodesDraggable?: boolean;
  /** @default true */
  nodesConnectable?: boolean;
  /** @default true */
  nodesFocusable?: boolean;
  /** @default true */
  edgesFocusable?: boolean;
  /** @default true */
  elementsSelectable?: boolean;
  /** @default true */
  elevateNodesOnSelect?: boolean;
  /** @default true */
  elevateEdgesOnSelect?: boolean;
  /** @default true */
  resizeX?: boolean;
  /** @default true */
  resizeY?: boolean;

  // ── Connection ──
  connectionMode?: ConnectionMode;  // @default 'strict'
  /** @default false */
  connectionLineType?: ConnectionLineType;
  connectionLineStyle?: CSSProperties;
  connectionLineComponent?: ConnectionLineComponent<EdgeType>;
  connectionLineContainerStyle?: CSSProperties;
  defaultEdgeOptions?: DefaultEdgeOptions;
  isValidConnection?: IsValidConnection<EdgeType>;
  onSelectionChange?: OnSelectionChangeFunc;
  onSelectionDrag?: OnSelectionDrag;
  onSelectionEnd?: OnSelectionDrag;
  onSelectionStart?: OnSelectionDrag;

  // ── Events ──
  onMove?: OnMove;
  onMoveStart?: OnMoveStart;
  onMoveEnd?: OnMoveEnd;
  onError?: OnError;
  onNodeDrag?: NodeMouseHandler;
  onNodeDragStop?: NodeMouseHandler;
  onNodeDragStart?: NodeMouseHandler;
  onNodeClick?: NodeMouseHandler;
  onNodeDoubleClick?: NodeMouseHandler;
  onNodeMouseEnter?: NodeMouseHandler;
  onNodeMouseLeave?: NodeMouseHandler;
  onNodeContextMenu?: NodeMouseHandler;
  onEdgeClick?: EdgeMouseHandler;
  onEdgeDoubleClick?: EdgeMouseHandler;
  onEdgeMouseEnter?: EdgeMouseHandler;
  onEdgeMouseLeave?: EdgeMouseHandler;
  onEdgeContextMenu?: EdgeMouseHandler;
  onInit?: (instance: ReactFlowInstance) => void;

  // ── Grid & Snapping ──
  /** @default false */
  snapToGrid?: boolean;
  snapGrid?: SnapGrid;
  /** @default false */
  snapStart?: boolean;

  // ── Layout ──
  nodeOrigin?: NodeOrigin;     // @default [0, 0]
  nodeDimensions?: NodeDimension;
  zIndexMode?: ZIndexMode;    // @default 'auto'

  // ── Appearance ──
  colorMode?: ColorMode;      // 'light' | 'dark' | 'system'
  proOptions?: ProOptions;
  className?: string;
  style?: CSSProperties;
  /** @default true */
  onlyRenderVisibleElements?: boolean;
  defaultNodes?: Node[];
  defaultEdges?: Edge[];

  // ── Accessibility ──
  ariaLabel?: string;
  ariaLabelConfig?: AriaLabelConfig;

  // ── Debug ──
  /** @default false */
  debug?: boolean;
};
```

The `ReactFlow` component is the default export and also exported as named:

```typescript
export { default as ReactFlow } from './container/ReactFlow';
```

## ReactFlowProvider

Source: `react/dist/esm/components/ReactFlowProvider/index.d.ts`

```typescript
export type ReactFlowProviderProps = {
  initialNodes?: Node[];       // initial nodes, not dynamic
  initialEdges?: Edge[];       // initial edges, not dynamic
  defaultNodes?: Node[];
  defaultEdges?: Edge[];
  initialWidth?: number;       // needed for SSR fitView
  initialHeight?: number;      // needed for SSR fitView
  fitView?: boolean;
  initialFitViewOptions?: FitViewOptions;
  initialMinZoom?: number;
  initialMaxZoom?: number;
  nodeOrigin?: NodeOrigin;     // @default [0, 0]
  nodeExtent?: CoordinateExtent;
  children: ReactNode;
  zIndexMode?: ZIndexMode;
};

export declare function ReactFlowProvider(
  props: ReactFlowProviderProps
): JSX.Element;
```

- Context provider that allows hooks to access flow state **outside** the `<ReactFlow>` component.
- For router-based apps, place `<ReactFlowProvider>` *outside* the router so state persists across routes.
- For multiple flows on the same page, use a separate `<ReactFlowProvider>` for each flow.

## Hooks

### useReactFlow

Source: `react/dist/esm/hooks/useReactFlow.d.ts`

```typescript
export declare function useReactFlow(): ReactFlowInstance;
```

Returns a `ReactFlowInstance` (see [ReactFlowInstance type](#reactflowinstance-type)) with all helper methods:

```typescript
// General helpers
getNodes(): Node[];
setNodes(payload: Node[] | ((nodes: Node[]) => Node[])): void;
addNodes(payload: Node[] | Node): void;
getNode(id: string): Node | undefined;
getInternalNode(id: string): InternalNode | undefined;
getEdges(): Edge[];
setEdges(payload: Edge[] | ((edges: Edge[]) => Edge[])): void;
addEdges(payload: Edge[] | Edge): void;
getEdge(id: string): Edge | undefined;
toObject(): { nodes: Node[]; edges: Edge[]; viewport: Viewport };
deleteElements(params: { nodes?: ...; edges?: ... }): Promise<{ deletedNodes; deletedEdges }>;
getIntersectingNodes(node: Node | { id } | Rect, partially?: boolean, nodes?: Node[]): Node[];
isNodeIntersecting(node: Node | { id } | Rect, area: Rect, partially?: boolean): boolean;
updateNode(id: string, nodeUpdate: Partial<Node> | ((node: Node) => Partial<Node>), options?: { replace: boolean }): void;
updateNodeData(id: string, dataUpdate: Partial<Node['data']> | ((node: Node) => Partial<Node['data']>), options?: { replace: boolean }): void;
updateEdge(id: string, edgeUpdate: Partial<Edge> | ((edge: Edge) => Partial<Edge>), options?: { replace: boolean }): void;
updateEdgeData(id: string, dataUpdate: Partial<Edge['data']>, options?: { replace: boolean }): void;
getNodesBounds(nodes: (Node | InternalNode | string)[]): Rect;
getHandleConnections({ type, nodeId, id }): HandleConnection[];  // @deprecated — use getNodeConnections
getNodeConnections({ type?, nodeId, handleId? }): NodeConnection[];
fitView(options?: FitViewOptions): Promise<boolean>;

// Viewport helpers
zoomIn(options?): Promise<boolean>;
zoomOut(options?): Promise<boolean>;
zoomTo(zoomLevel: number, options?): Promise<boolean>;
getZoom(): number;
setViewport(viewport: Viewport, options?): Promise<boolean>;
getViewport(): Viewport;
setCenter(x: number, y: number, options?: SetCenterOptions): Promise<boolean>;
fitBounds(bounds: Rect, options?: FitBoundsOptions): Promise<boolean>;
screenToFlowPosition(position: { x: number; y: number }, options?: { snapToGrid?: boolean }): XYPosition;
flowToScreenPosition(position: { x: number; y: number }): XYPosition;

// Other
viewportInitialized: boolean;
```

### useNodes / useEdges

Source: `react/dist/esm/hooks/useNodes.d.ts`, `react/dist/esm/hooks/useEdges.d.ts`

```typescript
export declare function useNodes<NodeType extends Node = Node>(): NodeType[];
export declare function useEdges<EdgeType extends Edge = Edge>(): EdgeType[];
```

- Re-render whenever **any** node/edge changes (including selection or movement).

### useOnSelectionChange

Source: `react/dist/esm/hooks/useOnSelectionChange.d.ts`

```typescript
export type UseOnSelectionChangeOptions<
  NodeType extends Node = Node,
  EdgeType extends Edge = Edge
> = {
  onChange: OnSelectionChangeFunc<NodeType, EdgeType>;
};

export declare function useOnSelectionChange<
  NodeType extends Node = Node,
  EdgeType extends Edge = Edge
>(options: UseOnSelectionChangeOptions<NodeType, EdgeType>): void;
```

- Callback receives `{ nodes, edges }` arrays.
- **Must** memoize the `onChange` handler.

### useConnection

Source: `react/dist/esm/hooks/useConnection.d.ts`

```typescript
export declare function useConnection<
  NodeType extends Node = Node,
  SelectorReturn = ConnectionState<InternalNode<NodeType>>
>(
  connectionSelector?: (connection: ConnectionState<InternalNode<NodeType>>) => SelectorReturn
): SelectorReturn;
```

- Returns current `ConnectionState` (or a slice via selector) during an active connection interaction.
- `null`/`NoConnection` when no connection is in progress.
- Use case: colorize handles based on connection validity.

### useUpdateNodeInternals

Source: `react/dist/esm/hooks/useUpdateNodeInternals.d.ts`

```typescript
export declare function useUpdateNodeInternals(): UpdateNodeInternals;
// where UpdateNodeInternals = (nodeId: string | string[]) => void;
```

- Call when you programmatically add/remove handles or change handle positions.
- Triggers re-measurement of node dimensions and handle positions.

### useStore / useStoreApi

Source: `react/dist/esm/hooks/useStore.d.ts`

```typescript
// Zustand-based store hooks
export declare function useStore<T>(selector: (state: ReactFlowState) => T, equalityFn?: (a: T, b: T) => boolean): T;
export declare function useStoreApi(): UseBoundStore<StoreApi<ReactFlowState>>;
```

- `useStore` — subscribe to a slice of the internal Zustand store with a selector.
- `useStoreApi` — get the raw store API object for imperative access.

### useNodeId

Source: `react/dist/esm/contexts/NodeIdContext.d.ts`

```typescript
export declare function useNodeId(): string | null;
```

- Returns the node id from `NodeIdContext`. Returns `null` when used outside a custom node.

### useViewport

Source: `react/dist/esm/hooks/useViewport.d.ts`

```typescript
export declare function useViewport(): Viewport;
// Returns { x, y, zoom }
```

- Re-renders whenever the viewport changes.

### useKeyPress

Source: `react/dist/esm/hooks/useKeyPress.d.ts`

```typescript
export type UseKeyPressOptions = {
  target?: Window | Document | HTMLElement | ShadowRoot | null;  // @default document
  actInsideInputWithModifier?: boolean;  // @default true
  preventDefault?: boolean;
};

export declare function useKeyPress(
  keyCode?: KeyCode | null,
  options?: UseKeyPressOptions
): boolean;
```

- `KeyCode = string | Array<string>`.
- Single key: `'a'`, combination: `'Meta+s'`, alternatives: `['Meta+s', 'Strg+s']`.

### useNodesInitialized

Source: `react/dist/esm/hooks/useNodesInitialized.d.ts`

```typescript
export type UseNodesInitializedOptions = {
  includeHiddenNodes?: boolean;  // @default false
};

export declare function useNodesInitialized(options?: UseNodesInitializedOptions): boolean;
```

- Returns `true` once all nodes have been measured and given dimensions.
- Useful for triggering layout algorithms after initialization.

### useHandleConnections (@deprecated)

Source: `react/dist/esm/hooks/useHandleConnections.d.ts`

```typescript
type UseHandleConnectionsParams = {
  type: HandleType;
  id?: string | null;
  nodeId?: string;
  onConnect?: (connections: Connection[]) => void;
  onDisconnect?: (connections: Connection[]) => void;
};

/** @deprecated Use `useNodeConnections` instead. */
export declare function useHandleConnections(
  params: UseHandleConnectionsParams
): HandleConnection[];
```

### useNodeConnections

Source: `react/dist/esm/hooks/useNodeConnections.d.ts`

```typescript
export declare function useNodeConnections(
  params?: UseNodeConnectionsParams
): NodeConnection[];

// UseNodeConnectionsParams from @xyflow/system:
type UseNodeConnectionsParams = {
  id?: string;
  onConnect?: (connections: HandleConnection[]) => void;
  onDisconnect?: (connections: HandleConnection[]) => void;
} & (
  | { handleType: HandleType; handleId?: string }
  | { handleType?: HandleType; handleId?: never }
);
```

- Replacement for `useHandleConnections`.
- Returns connections on a specific node, optionally filtered by handle type/id.
- `onConnect` and `onDisconnect` callbacks fire when connections are established/removed.

### useNodesData

Source: `react/dist/esm/hooks/useNodesData.d.ts`

```typescript
export declare function useNodesData<NodeType extends Node = Node>(
  nodeId: string
): DistributivePick<NodeType, 'id' | 'type' | 'data'> | null;

export declare function useNodesData<NodeType extends Node = Node>(
  nodeIds: string[]
): DistributivePick<NodeType, 'id' | 'type' | 'data'>[];
```

- Subscribe to specific node `data` by id (single or array).
- Returns `{ id, type, data }` objects; `null` for non-existent single-node lookups.

### useInternalNode

Source: `react/dist/esm/hooks/useInternalNode.d.ts`

```typescript
export declare function useInternalNode<NodeType extends Node = Node>(
  id: string
): InternalNode<NodeType> | undefined;
```

- Returns the internal node representation (includes `internals.positionAbsolute`, `internals.z`, handle bounds, etc.).

### useOnViewportChange

Source: `react/dist/esm/hooks/useOnViewportChange.d.ts`

```typescript
export type UseOnViewportChangeOptions = {
  onStart?: OnViewportChange;  // (viewport: Viewport) => void
  onChange?: OnViewportChange;
  onEnd?: OnViewportChange;
};

export declare function useOnViewportChange(options: UseOnViewportChangeOptions): void;
```

### experimental_useOnNodesChangeMiddleware / experimental_useOnEdgesChangeMiddleware

Source: `react/dist/esm/index.d.ts` line 31-32

```typescript
export { experimental_useOnNodesChangeMiddleware } from './hooks/useOnNodesChangeMiddleware';
export { experimental_useOnEdgesChangeMiddleware } from './hooks/useOnEdgesChangeMiddleware';
```

- Experimental middleware hooks for intercepting node/edge changes.

## Types

### Node & Edge Types

Source: `react/dist/esm/types/nodes.d.ts`, `react/dist/esm/types/edges.d.ts`, `system/dist/esm/types/nodes.d.ts`, `system/dist/esm/types/edges.d.ts`

```typescript
// ── Node Types ──
type Node<NodeData extends Record<string, unknown> = Record<string, unknown>, NodeType extends string | undefined = string | undefined> = NodeBase<NodeData, NodeType> & {
  // NodeBase provides: id, position, data, type?, width?, height?, selected?, ...
  position: XYPosition;
  data: NodeData;
};

// InternalNode — extends Node with internal computed fields
type InternalNode<NodeType extends Node = Node> = InternalNodeBase<NodeType> & {
  internals: {
    positionAbsolute: XYPosition;
    z: number;
    handleBounds: NodeHandleBounds | null;
    handleBoundsCache: { ... };
    isParent: boolean;
  };
};

// NodeProps — props passed to custom node components
type NodeProps<NodeType extends Node = Node> = {
  id: string;
  data: NodeType['data'];
  type: NodeType['type'];
  selected: boolean;
  width: number | undefined;
  height: number | undefined;
  dragging: boolean;
  dragHandle?: NodeDragItem;
  sourcePosition: Position | undefined;
  targetPosition: Position | undefined;
  zIndex: number;
  isConnectable: boolean;
  positionAbsoluteX: number;
  positionAbsoluteY: number;
  numHandles: number;
  parentRef: ref | null;
  ... // and more internal props
};

// BuiltInNode — union of built-in node types
type BuiltInNode = input | output | default | group;

// ── Edge Types ──
type Edge<EdgeData = unknown, EdgeType extends string | undefined = string | undefined> = EdgeBase<EdgeData, EdgeType> & {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

// EdgeProps — props passed to custom edge components
type EdgeProps<EdgeType extends Edge = Edge> = {
  id: string;
  data: EdgeType['data'];
  type: EdgeType['type'];
  selected: boolean;
  source: string;
  target: string;
  sourceHandleId?: string | null;
  targetHandleId?: string | null;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  markerStart?: string;
  markerEnd?: string;
  InteractionControl?: React.FC;
};

// ── ConnectionLineComponentProps ──
type ConnectionLineComponentProps<EdgeType extends Edge = Edge> = {
  connectionLineType: ConnectionLineType;
  fromX: number;
  fromY: number;
  fromPosition: Position;
  toX: number;
  toY: number;
  toPosition: Position;
  fromHandle?: Handle;
  fromNode?: InternalNode;
  toHandle?: Handle | null;
  toNode?: InternalNode | null;
  connectionStatus?: string;
  isValidConnection?: IsValidConnection<EdgeType>;
};

// ── DefaultEdgeOptions ──
type DefaultEdgeOptions = DefaultEdgeOptionsBase & {
  markerEnd?: string;
  markerStart?: string;
};
```

### NodeChange & EdgeChange

Source: `system/dist/esm/types/changes.d.ts`

```typescript
// NodeChange — union of all node change types
type NodeChange<NodeType extends Node = Node> =
  | NodeDimensionChange
  | NodePositionChange
  | NodeSelectionChange
  | NodeRemoveChange
  | NodeAddChange<NodeType>
  | NodeReplaceChange<NodeType>;

type NodeDimensionChange   = { id: string; type: 'dimensions'; dimensions: { width: number; height: number }; };
type NodePositionChange    = { id: string; type: 'position'; position: XYPosition; dragging?: boolean; };
type NodeSelectionChange    = { id: string; type: 'select'; selected: boolean; };
type NodeRemoveChange      = { id: string; type: 'remove'; };
type NodeAddChange<N>       = { type: 'add'; item: N; };
type NodeReplaceChange<N>   = { type: 'replace'; item: N; };

// EdgeChange — union of all edge change types
type EdgeChange<EdgeType extends Edge = Edge> =
  | EdgeSelectionChange
  | EdgeRemoveChange
  | EdgeAddChange<EdgeType>
  | EdgeReplaceChange<EdgeType>;

type EdgeSelectionChange  = { id: string; type: 'select'; selected: boolean; };
type EdgeRemoveChange     = { id: string; type: 'remove'; };
type EdgeAddChange<E>      = { type: 'add'; item: E; };
type EdgeReplaceChange<E>  = { type: 'replace'; item: E; };
```

### OnNodesChange, OnEdgesChange, OnConnect

Source: `react/dist/esm/types/general.d.ts`, `system/dist/esm/types/general.d.ts`

```typescript
type OnNodesChange<NodeType extends Node = Node> = (changes: NodeChange<NodeType>[]) => void;
type OnEdgesChange<EdgeType extends Edge = Edge> = (changes: EdgeChange<EdgeType>[]) => void;
type OnConnect = (connection: Connection) => void;
type OnConnectStart = (event: MouseEvent | TouchEvent, params: OnConnectStartParams) => void;
type OnConnectEnd<NodeType extends NodeBase = NodeBase> = (
  event: MouseEvent | TouchEvent,
  connectionState: FinalConnectionState<InternalNodeBase<NodeType>>
) => void;
type OnConnectStartParams = { nodeId: string | null; handleId: string | null; handleType: HandleType | null; };
```

### ReactFlowInstance Type

Source: `react/dist/esm/types/instance.d.ts`

```typescript
type ReactFlowInstance<NodeType extends Node = Node, EdgeType extends Edge = Edge> =
  GeneralHelpers<NodeType, EdgeType> &
  ViewportHelperFunctions &
  { viewportInitialized: boolean };

// GeneralHelpers includes:
//   getNodes, setNodes, addNodes, getNode, getInternalNode,
//   getEdges, setEdges, addEdges, getEdge, toObject,
//   deleteElements, getIntersectingNodes, isNodeIntersecting,
//   updateNode, updateNodeData, updateEdge, updateEdgeData,
//   getNodesBounds, getHandleConnections (@deprecated), getNodeConnections, fitView

// ViewportHelperFunctions includes:
//   zoomIn, zoomOut, zoomTo, getZoom, setViewport, getViewport, setCenter, fitBounds,
//   screenToFlowPosition, flowToScreenPosition
```

### Core System Types

Source: `system/dist/esm/types/general.d.ts`, `system/dist/esm/types/utils.d.ts`

```typescript
// ── Position Enum ──
enum Position { Left = 'left', Top = 'top', Right = 'right', Bottom = 'bottom' }

// ── ConnectionMode Enum ──
enum ConnectionMode { Strict = 'strict', Loose = 'loose' }

// ── SelectionMode Enum ──
enum SelectionMode { Partial = 'partial', Full = 'full' }

// ── PanOnScrollMode Enum ──
enum PanOnScrollMode { Free = 'free', Vertical = 'vertical', Horizontal = 'horizontal' }

// ── ColorMode ──
type ColorMode = 'light' | 'dark' | 'system';
type ColorModeClass = 'light' | 'dark';

// ── ZIndexMode ──
type ZIndexMode = 'auto' | 'basic' | 'manual';

// ── Viewport ──
type Viewport = { x: number; y: number; zoom: number };

// ── SnapGrid ──
type SnapGrid = [number, number];

// ── XYPosition / XYZPosition ──
type XYPosition = { x: number; y: number };
type XYZPosition = XYPosition & { z: number };

// ── Dimensions ──
type Dimensions = { width: number; height: number };

// ── NodeDimension ──
type NodeDimension = { width?: number; height?: number };

// ── NodeOrigin ──
type NodeOrigin = [number, number];  // [0,0]=top-left, [0.5,0.5]=center

// ── Rect / Box / Transform / CoordinateExtent ──
type Rect = { x: number; y: number; width: number; height: number };
type Box = { x: number; y: number; ...height, width } | ...;
type Transform = { x: number; y: number; z: number };
type CoordinateExtent = [[number, number], [number, number]];

// ── Connection ──
type Connection = {
  source: string;
  target: string;
  sourceHandle: string | null;
  targetHandle: string | null;
};

// ── HandleConnection / NodeConnection ──
type HandleConnection = Connection & { edgeId: string };
type NodeConnection = Connection & { edgeId: string };

// ── IsValidConnection ──
type IsValidConnection<EdgeType extends EdgeBase = EdgeBase> = (edge: EdgeType | Connection) => boolean;

// ── PanelPosition ──
type PanelPosition = 'top-left' | 'top-center' | 'top-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'center-left' | 'center-right';

// ── ProOptions ──
type ProOptions = { account?: string; hideAttribution: boolean };

// ── OnError ──
type OnError = (id: string, message: string) => void;

// ── AriaLabelConfig ──
type AriaLabelConfig = Partial<{
  default: string;
  nodes: string;
  edges: string;
  controls: string;
  minimap: string;
  ... // most string keys
}>;

// ── FitViewOptions ──
type FitViewOptionsBase<NodeType extends NodeBase = NodeBase> = {
  padding?: Padding;
  includeHiddenNodes?: boolean;
  minZoom?: number;
  maxZoom?: number;
  duration?: number;
  ease?: (t: number) => number;
  interpolate?: 'smooth' | 'linear';
  nodes?: (NodeType | { id: string })[];
};
type FitViewOptions<NodeType extends Node = Node> = FitViewOptionsBase<NodeType>;

// ── Padding (for FitViewOptions) ──
type PaddingUnit = 'px' | '%';
type PaddingWithUnit = `${number}${PaddingUnit}` | number;
type Padding = PaddingWithUnit | {
  top?: PaddingWithUnit; right?: PaddingWithUnit;
  bottom?: PaddingWithUnit; left?: PaddingWithUnit;
  x?: PaddingWithUnit; y?: PaddingWithUnit;
};

// ── ConnectionState ──
type NoConnection = {
  inProgress: false; isValid: null; from: null; fromHandle: null;
  fromPosition: null; fromNode: null; to: null; toHandle: null;
  toPosition: null; toNode: null; pointer: null;
};
type ConnectionInProgress<NodeType> = {
  inProgress: true; isValid: boolean | null;
  from: XYPosition; fromHandle: Handle; fromPosition: Position; fromNode: NodeType;
  to: XYPosition; toHandle: Handle | null; toPosition: Position; toNode: NodeType | null;
  pointer: XYPosition;
};
type ConnectionState<NodeType> = ConnectionInProgress<NodeType> | NoConnection;
type FinalConnectionState<NodeType> = ... // like ConnectionInProgress but with `inProgress` and `to` optional

// ── ConnectionLineType Enum ──
enum ConnectionLineType {
  Bezier = 'default',
  Straight = 'straight',
  Step = 'step',
  SmoothStep = 'smoothstep',
  SimpleBezier = 'simplebezier',
}

// ── MarkerType Enum ──
enum MarkerType { Arrow = 'arrow', ArrowClosed = 'arrowclosed' }

// ── HandleType ──
type HandleType = 'source' | 'target';
type Handle = { type: HandleType; position: Position; ... nodeId, id, ... };
```

## Utilities

### applyNodeChanges / applyEdgeChanges

Source: `react/dist/esm/utils/changes.d.ts`

```typescript
export declare function applyNodeChanges<NodeType extends Node>(
  changes: NodeChange<NodeType>[],
  nodes: NodeType[]
): NodeType[];

export declare function applyEdgeChanges<EdgeType extends Edge>(
  changes: EdgeChange<EdgeType>[],
  edges: EdgeType[]
): EdgeType[];
```

- Apply an array of `NodeChange`/`EdgeChange` items to the current nodes/edges array.
- Used in `onNodesChange`/`onEdgesChange` handlers for controlled flows.

### addEdge / reconnectEdge

Source: `react/dist/esm/utils/edges.d.ts`

```typescript
export declare function addEdge<EdgeType extends Edge>(
  edgeParams: EdgeType | Connection,
  edges: EdgeType[]
): EdgeType[];

export declare function reconnectEdge<EdgeType extends Edge>(
  oldEdge: EdgeType,
  newConnection: Connection,
  edges: EdgeType[]
): EdgeType[];
```

- `addEdge`: adds an edge from a `Connection` or full `Edge` object. Returns a new array.
- `reconnectEdge`: removes old edge and adds a new one based on the `newConnection`.

### useNodesState / useEdgesState

Source: `react/dist/esm/hooks/useNodesEdgesState.d.ts`

```typescript
export declare function useNodesState<NodeType extends Node = Node>(
  initialNodes: NodeType[]
): [NodeType[], Dispatch<SetStateAction<NodeType[]>>, OnNodesChange<NodeType>];

export declare function useEdgesState<EdgeType extends Edge = Edge>(
  initialEdges: EdgeType[]
): [EdgeType[], Dispatch<SetStateAction<EdgeType[]>>, OnEdgesChange<EdgeType>];
```

- Returns a **tuple** of `[nodes, setNodes, onNodesChange]` (or `[edges, setEdges, onEdgesChange]`).
- Wraps `useState` + `applyNodeChanges`/`applyEdgeChanges` internally — the returned `onNodesChange`/`onEdgesChange` handler auto-applies changes.

### isNode / isEdge

Source: `react/dist/esm/utils/general.d.ts`

```typescript
export declare function isNode<NodeType extends Node = Node>(element: unknown): element is NodeType;
export declare function isEdge<EdgeType extends Edge = Edge>(element: unknown): element is EdgeType;
```

- Type guards for distinguishing nodes from edges in generic element arrays.

### Edge Geometry Utilities

Re-exported from `@xyflow/system`:

```typescript
getBezierPath(params: GetBezierPathParams): [path: string, labelX: number, labelY: number, ...];
getSimpleBezierPath(params): [path: string, labelX, labelY, ...];
getSmoothStepPath(params: GetSmoothStepPathParams): [path: string, labelX, labelY, offsetX, offsetY, ...];
getStraightPath(params: GetStraightPathParams): [path: string, labelX, labelY, offsetX, offsetY];
getBezierEdgeCenter(...): { x: number; y: number };
getEdgeCenter(sourceX, sourceY, targetX, targetY): { x: number; y: number };
getViewportForBounds(bounds: Rect, ...): Viewport;
getNodesBounds(nodes: Node[]): Rect;
getIncomers(node: Node, nodes: Node[], edges: Edge[]): Node[];
getOutgoers(node: Node, nodes: Node[], edges: Edge[]): Node[];
getConnectedEdges(nodes: Node[], edges: Edge[]): Edge[];
```

## Additional Components

### Background

Source: `react/dist/esm/additional-components/Background/types.d.ts`, `Background.d.ts`

```typescript
enum BackgroundVariant { Lines = 'lines', Dots = 'dots', Cross = 'cross' }

type BackgroundProps = {
  id?: string;
  variant?: BackgroundVariant;  // @default BackgroundVariant.Dots
  gap?: number;                 // @default 15 (lines) / 18 (dots)
  size?: number;                // dot size
  lineWidth?: number | string;  // line width
  offset?: number;              // pattern offset
  color?: string;               // line/dot color
  bgColor?: string;             // background fill
  style?: CSSProperties;
  className?: string;
  patternClassName?: string;
};

export declare const Background: MemoExoticComponent<typeof BackgroundComponent>;
```

- Renders three background variants: lines, dots, cross.
- When stacking multiple `<Background>` components, give each a unique `id`.

### Controls

Source: `react/dist/esm/additional-components/Controls/types.d.ts`, `Controls.d.ts`

```typescript
type ControlProps = {
  style?: CSSProperties;
  className?: string;
  showZoom?: boolean;          // @default true
  showFitView?: boolean;        // @default true
  showInteractive?: boolean;    // @default true
  fitViewOptions?: FitViewOptions;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onInteractiveChange?: (interactive: boolean) => void;
  position?: PanelPosition;     // @default 'bottom-left'
  orientation?: 'horizontal' | 'vertical';  // @default 'horizontal'
  'aria-label'?: string;
  children?: ReactNode;         // additional control buttons
};

// ControlButton — for custom controls
type ControlButtonProps = {
  onClick: () => void;
  className?: string;
  children?: ReactNode;
  'aria-label'?: string;
};

export declare const Controls: MemoExoticComponent<typeof ControlsComponent>;
```

### MiniMap

Source: `react/dist/esm/additional-components/MiniMap/types.d.ts`, `MiniMap.d.ts`

```typescript
type MiniMapProps<NodeType extends Node = Node> = {
  style?: CSSProperties;
  className?: string;
  nodeStrokeColor?: string | ((node: NodeType) => string);
  nodeColor?: string | ((node: NodeType) => string);
  nodeClassName?: string | ((node: NodeType) => string);
  nodeBorderRadius?: number;
  nodeStrokeWidth?: number;
  nodeComponent?: React.ComponentType<MiniMapNodeProps<NodeType>>;
  bgColor?: string;
  maskColor?: string;           // @default 'rgb(240, 240, 240, 0.6)'
  maskStrokeColor?: string;
  maskStrokeWidth?: number;
  position?: PanelPosition;     // @default 'bottom-right'
  onClick?: (event: MouseEvent, position: XYPosition) => void;
  onNodeClick?: (event: MouseEvent, node: NodeType) => void;
  pannable?: boolean;           // @default false
  zoomable?: boolean;           // @default true
  ariaLabel?: string;
  inversePan?: boolean;         // @default false
  zoomStep?: number;            // @default 0.1
  offsetScale?: number;         // @default 1
};

type MiniMapNodeProps<NodeType extends Node = Node> = {
  x: number; y: number; width: number; height: number;
  selected: boolean;
  color?: string;
  strokeColor?: string;
  borderRadius?: number;
  strokeWidth?: number;
  className?: string;
  onClick?: (event: MouseEvent, node: NodeType) => void;
};

export declare const MiniMap: typeof MiniMapComponent;
```

### Panel

Source: `react/dist/esm/components/Panel/index.d.ts`

```typescript
type PanelProps = HTMLAttributes<HTMLDivElement> & {
  position?: PanelPosition;  // @default 'top-left'
};
export declare function Panel(props: PanelProps): JSX.Element;
```

- Renders a div positioned relative to the flow viewport.

### Handle

Source: `react/dist/esm/components/Handle/index.d.ts`

```typescript
type HandleProps = Omit<HTMLAttributes<HTMLDivElement>, 'id'> &
  HandlePropsBase & {
    onConnect?: OnConnect;
  };
// HandlePropsBase from @xyflow/system:
// {
//   type: HandleType;              // 'source' | 'target'
//   position: Position;
//   id?: string | null;
//   isConnectable?: boolean | number;  // @default true
//   isValidConnection?: IsValidConnection;
//   connectableStart?: boolean;     // @default true
//   connectableEnd?: boolean;       // @default true
//   connectionCount?: number;
//   onConnect?: OnConnect;
// }

export declare const Handle: MemoExoticComponent<typeof HandleComponent>;
```

### EdgeLabelRenderer

Source: `react/dist/esm/components/EdgeLabelRenderer/index.d.ts`

```typescript
type EdgeLabelRendererProps = { children: ReactNode };
export declare function EdgeLabelRenderer(props: EdgeLabelRendererProps): ReactPortal | null;
```

- Portal for rendering edge labels in a div-based renderer (HTML instead of SVG).
- No pointer events by default — set `pointerEvents: 'all'` and `nodrag nopan` classes for interactive labels.

### ViewportPortal

Source: `react/dist/esm/components/ViewportPortal/index.d.ts`

```typescript
export declare function ViewportPortal(props: { children: ReactNode }): ReactPortal | null;
```

- Renders children in the same coordinate system as nodes/edges.
- Children are affected by zooming and panning.

### NodeResizer

Source: `react/dist/esm/additional-components/NodeResizer/types.d.ts`

```typescript
type NodeResizerProps = {
  nodeId?: string;
  isVisible?: boolean;          // @default true (when node selected)
  color?: string;              // @default theme
  handleClassName?: string;
  handleStyle?: CSSProperties;
  lineClassName?: string;
  lineStyle?: CSSProperties;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  keepAspectRatio?: boolean;
  shouldResize?: ShouldResize;
  onResizeStart?: OnResizeStart;
  onResize?: OnResize;
  onResizeEnd?: OnResizeEnd;
};

type ResizeControlVariant = 'line' | 'handle';
```

### NodeToolbar

Source: `react/dist/esm/additional-components/NodeToolbar/types.d.ts`

```typescript
type NodeToolbarProps = HTMLAttributes<HTMLDivElement> & {
  nodeId?: string | string[];
  isVisible?: boolean;         // @default false (visible only when node selected)
  position?: Position;         // @default Position.Top
  offset?: number;             // @default 10
  align?: Align;               // @default 'center'
};
// type Align = 'start' | 'center' | 'end';
```

### EdgeToolbar

Source: `react/dist/esm/additional-components/EdgeToolbar/types.d.ts`

```typescript
type EdgeToolbarProps = EdgeToolbarBaseProps & HTMLAttributes<HTMLDivElement> & {
  edgeId: string;
  children?: ReactNode;
};
```

## Deprecations

### @deprecated in @xyflow/react .d.ts files

Searched all `.d.ts` files under `react/dist/esm/` and `system/dist/esm/` for `@deprecated` JSDoc tags.

**Only 2 `@deprecated` items found in `@xyflow/react` (excluding zustand's internal deprecations):**

1. **`useHandleConnections`** — `react/dist/esm/hooks/useHandleConnections.d.ts`
   ```typescript
   /**
    * @public
    * @deprecated Use `useNodeConnections` instead.
    */
   export declare function useHandleConnections(
     params: UseHandleConnectionsParams
   ): HandleConnection[];
   ```
   - **Replacement**: `useNodeConnections` hook.
   - Same functionality but with a different API (uses `handleType` instead of `type`, `handleId` instead of `id`).

2. **`getHandleConnections`** (on `ReactFlowInstance`) — `react/dist/esm/types/instance.d.ts`
   ```typescript
   /**
    * @deprecated
    */
   getHandleConnections: (params: { type: HandleType; nodeId: string; id?: string | null }) => HandleConnection[];
   ```
   - **Replacement**: `getNodeConnections` method on `ReactFlowInstance`.
   - `getNodeConnections` uses `{ type?, nodeId, handleId? }` params instead of `{ type, nodeId, id }`.

### v11 → v12 Migration Notes (inferred from type changes)

- **Package renames**: `reactflow` → `@xyflow/react` (and new `@xyflow/system` subpackage for framework-agnostic core).
- **`RConnectionLineType`** → renamed to **`ConnectionLineType`** (also moved to `@xyflow/system`).
- **`getRectOfNodes`** → appears removed; use `getNodesBounds` instead.
- **`getHandleConnections`** → deprecated; use `getNodeConnections`.
- **`useHandleConnections`** → deprecated; use `useNodeConnections`.
- **`onReconnect` / `onReconnectStart` / `onReconnectEnd`** — new reconnection event handlers added.
- **`reconnectEdge`** utility — new utility for edge reconnection.
- **EdgeToolbar** — new component for edge toolbars (mirrors NodeToolbar).
- **`experimental_useOnNodesChangeMiddleware` / `experimental_useOnEdgesChangeMiddleware`** — new experimental middleware hooks.
- **`useNodeConnections`** and **`useNodesData`** — new hooks replacing deprecated patterns.
- **`updateNode`, `updateNodeData`, `updateEdge`, `updateEdgeData`** — new imperative update methods on `ReactFlowInstance`.
- **`colorMode`** prop replaces separate dark mode handling (`ColorMode = 'light' | 'dark' | 'system'`).
- **`zIndexMode`** — new prop for z-index strategy (`'auto' | 'basic' | 'manual'`).
- **`AriaLabelConfig`** — new accessibility config prop.
- **`onBeforeDelete`** — new intercept hook for deletion confirmation.
- **`NodeResizer` / `NodeToolbar`** — moved from separate packages into `@xyflow/react` additional components.
- **`autoPanOnConnect`, `restoreViewportOnNodeDrag`, `elevateNodesOnSelect`, `elevateEdgesOnSelect`** — new behavioral props.
- **`snapStart`** — new snapping prop for snap-to-start behavior.
