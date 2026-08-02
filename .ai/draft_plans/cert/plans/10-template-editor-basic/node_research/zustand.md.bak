# zustand v5.0.14 — Node Module Research

> **Research target**: Certificate template editor feature (Plans 08–18).
> **Package**: `zustand@5.0.14` installed at `node_modules/zustand`.
> **Peer deps**: `immer@11.1.8` (installed, optional), `@types/react` (optional), `use-sync-external-store` (optional).

---

## Package Overview

Zustand is a minimalist state-management library for React. A store is a React
hook; state is updated immutably; `set` merges by default. No context providers
required. TypeScript types shipped as `.d.ts` (CJS) and `.d.mts` (ESM) — both
identical in shape.

### Package layout (CJS root)

| File | Purpose |
|------|---------|
| `index.d.ts` | Re-exports `zustand/vanilla` + `zustand/react` |
| `vanilla.d.ts` | Framework-agnostic core: `StoreApi`, `StateCreator`, `createStore`, `Mutate`, `StoreMutatorIdentifier` |
| `react.d.ts` | React bindings: `create`, `useStore`, `UseBoundStore` |
| `middleware.d.ts` | Barrel for all middleware (`persist`, `devtools`, `subscribeWithSelector`, `combine`, `redux`, `ssrSafe`) |
| `middleware/*.d.ts` | Per-middleware type definitions |
| `shallow.d.ts` | Re-exports `shallow` (vanilla) + `useShallow` (react) |
| `traditional.d.ts` | `createWithEqualityFn`, `useStoreWithEqualityFn` (v4-style equality API) |

### Exports map (from `package.json`)

```
zustand                           → index.{js,d.ts}
zustand/vanilla                   → vanilla.{js,d.ts}
zustand/react                     → react.{js,d.ts}
zustand/middleware                → middleware.{js,d.ts}
zustand/middleware/persist        → middleware/persist.{js,d.ts}
zustand/middleware/devtools       → middleware/devtools.{js,d.ts}
zustand/middleware/subscribeWithSelector → middleware/subscribeWithSelector.{js,d.ts}
zustand/middleware/immer          → middleware/immer.{js,d.ts}
zustand/middleware/combine        → middleware/combine.{js,d.ts}
zustand/middleware/redux          → middleware/redux.{js,d.ts}
zustand/shallow                   → shallow.{js,d.ts}
zustand/traditional               → traditional.{js,d.ts}
```

`zustand/vanilla/shallow` and `zustand/react/shallow` subpaths also exist.

---

## TypeScript Types & Interfaces

### `StoreApi<T>` (vanilla.d.ts)

The non-React store interface. Every React hook store (`UseBoundStore`) also
inherits all these methods.

```ts
export interface StoreApi<T> {
  setState: SetStateInternal<T>;
  getState: () => T;
  getInitialState: () => T;
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;
}
```

**`SetStateInternal<T>`** — the full `setState` signature:

```ts
type SetStateInternal<T> = {
  // Merge mode (default): partial or full state or updater fn
  _(partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: false): void;
  // Replace mode: full state or updater fn, replace: true
  _(state: T | ((state: T) => T), replace: true): void;
}['_'];
```

- `set({ foo: 1 })` → merges into existing state (replace defaults to `false`).
- `set({ foo: 1 }, true)` → **replaces** entire state (wipes other keys!).
- `set(state => ({ count: state.count + 1 }))` → functional updater, merge mode.

### `StateCreator<T, Mis, Mos, U>` (vanilla.d.ts)

The initializer function passed to `create()`.

```ts
export type StateCreator<
  T,
  Mis extends [StoreMutatorIdentifier, unknown][] = [],
  Mos extends [StoreMutatorIdentifier, unknown][] = [],
  U = T
> = ((
  setState: Get<Mutate<StoreApi<T>, Mis>, 'setState', never>,
  getState: Get<Mutate<StoreApi<T>, Mis>, 'getState', never>,
  store: Mutate<StoreApi<T>, Mis>
) => U) & {
  $$storeMutators?: Mos;
};
```

- `T` = full state shape (data + actions).
- `Mis` = incoming mutators (middleware applied from outside).
- `Mos` = outgoing mutators (middleware applied inside).
- `U` = the return value of the initializer (defaults to `T`).
- The second and third arguments (`setState`, `getState`) are middleware-aware
  — `immer` middleware changes `setState`'s first param from `Partial<T>` to
  `Draft<T>`.

### `UseBoundStore<S>` (react.d.ts)

The return type of `create()`. It is both a callable hook AND a `StoreApi`.

```ts
export type UseBoundStore<S extends ReadonlyStoreApi<unknown>> = {
  (): ExtractState<S>;              // useStore() — entire state
  <U>(selector: (state: ExtractState<S>) => U): U;  // useStore(selector)
} & S;                              // also has .getState(), .setState(), .subscribe(), .getInitialState()
```

**`ReadonlyStoreApi<T>`** (internal) — `Pick<StoreApi<T>, 'getState' | 'getInitialState' | 'subscribe'>`.

**`ExtractState<S>`** — extracts the state type `T` from a store:

```ts
export type ExtractState<S> = S extends { getState: () => infer T } ? T : never;
```

### `Mutate<S, Ms>` (vanilla.d.ts)

Recursively applies middleware mutators to a `StoreApi`:

```ts
export type Mutate<S, Ms> = number extends Ms['length' & keyof Ms]
  ? S
  : Ms extends []
  ? S
  : Ms extends [[infer Mi, infer Ma], ...infer Mrs]
  ? Mutate<StoreMutators<S, Ma>[Mi & StoreMutatorIdentifier], Mrs>
  : never;
```

This is how `create<StoreType>()(persist(...))` type-safely adds `.persist` to
the hook's API surface.

### `StoreMutators<S, A>` & `StoreMutatorIdentifier` (vanilla.d.ts)

```ts
export interface StoreMutators<S, A> {}  // empty by default; augmented by middleware

export type StoreMutatorIdentifier = keyof StoreMutators<unknown, unknown>;
```

Each middleware augments `StoreMutators` via `declare module '../vanilla'`:

| Middleware | Identifier |
|------------|------------|
| `persist` | `'zustand/persist'` |
| `devtools` | `'zustand/devtools'` |
| `subscribeWithSelector` | `'zustand/subscribeWithSelector'` |
| `immer` | `'zustand/immer'` |
| `redux` | `'zustand/redux'` |

### `CreateStore` (vanilla.d.ts) / `Create` (react.d.ts)

Both have the same signature shape — a curried type that overloads for direct
vs curried usage:

```ts
type CreateStore = {
  // Direct: create<T>(initializer) → StoreApi<T>
  <T, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ): Mutate<StoreApi<T>, Mos>;
  // Curried: create<T>()(initializer) → needed for middleware in TypeScript
  <T>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ) => Mutate<StoreApi<T>, Mos>;
};
```

### `CreateWithEqualityFn` (traditional.d.ts)

Same shape as `Create` but accepts an optional `defaultEqualityFn`:

```ts
type CreateWithEqualityFn = {
  <T, Mos extends ...>(
    initializer: StateCreator<T, [], Mos>,
    defaultEqualityFn?: <U>(a: U, b: U) => boolean
  ): UseBoundStoreWithEqualityFn<Mutate<StoreApi<T>, Mos>>;
  <T>(): <Mos extends ...>(
    initializer: StateCreator<T, [], Mos>,
    defaultEqualityFn?: <U>(a: U, b: U) => boolean
  ) => UseBoundStoreWithEqualityFn<Mutate<StoreApi<T>, Mos>>;
};
```

### `PersistOptions<S, PersistedState, PersistReturn>` (middleware/persist.d.ts)

```ts
export interface PersistOptions<S, PersistedState = S, PersistReturn = unknown> {
  name: string;                          // unique storage key (required)
  storage?: PersistStorage<PersistedState, PersistReturn>;  // default: createJSONStorage(() => localStorage)
  partialize?: (state: S) => PersistedState;  // filter which fields to persist
  onRehydrateStorage?: (state: S) => ((state?: S, error?: unknown) => void) | void;
  version?: number;                      // bump to trigger migrate
  migrate?: (persistedState: unknown, version: number) => PersistedState | Promise<PersistedState>;
  merge?: (persistedState: unknown, currentState: S) => S;  // default: shallow merge
  skipHydration?: boolean;               // default: false; manual rehydrate for SSR
}
```

### `PersistStorage<S, R>` & `StateStorage<R>` (middleware/persist.d.ts)

```ts
export interface StateStorage<R = unknown> {
  getItem: (name: string) => string | null | Promise<string | null>;
  setItem: (name: string, value: string) => R;
  removeItem: (name: string) => R;
}

export type StorageValue<S> = {
  state: S;
  version?: number;
};

export interface PersistStorage<S, R = unknown> {
  getItem: (name: string) => StorageValue<S> | null | Promise<StorageValue<S> | null>;
  setItem: (name: string, value: StorageValue<S>) => R;
  removeItem: (name: string) => R;
}
```

**`createJSONStorage<S, R>`** wraps a `StateStorage` (like `localStorage`) into
a `PersistStorage` with `JSON.parse`/`JSON.stringify`. Accepts optional
`reviver` and `replacer` functions.

### `DevtoolsOptions` (middleware/devtools.d.ts)

```ts
export interface DevtoolsOptions extends Config {
  name?: string;              // store name shown in DevTools
  enabled?: boolean;          // toggle on/off (e.g., production)
  anonymousActionType?: string;
  store?: string;             // separate DevTools connection per store
}

export type NamedSet<T> = WithDevtools<StoreApi<T>>['setState'];
// NamedSet adds an optional 3rd arg: action name string or { type: string, ... }
```

### `shallow<T>` (vanilla/shallow.d.ts)

```ts
export declare function shallow<T>(valueA: T, valueB: T): boolean;
```

Compares two values with:
1. `Object.is` for primitives.
2. For objects: same prototype check + iterables compared by entries or
   iterators, plain objects compared by `Object.entries`.
3. Does NOT recurse deeply — only one level of keys/entries is compared.

### `useShallow<S, U>` (react/shallow.d.ts)

```ts
export declare function useShallow<S, U>(selector: (state: S) => U): (state: S) => U;
```

Returns a memoized selector that uses `shallow` to compare the previous and
next output. Prevents re-renders when the selector returns a new object/array
with the same content.

### Type helpers (internal, exported in .d.ts)

| Helper | Where | Purpose |
|--------|-------|---------|
| `ExtractState<S>` | vanilla | Infer `T` from a store |
| `Mutate<S, Ms>` | vanilla | Recursively apply middleware mutators |
| `StoreMutatorIdentifier` | vanilla | Union of all middleware identifiers |
| `Get<T, K, F>` | vanilla | Safe property access with fallback |
| `Write<T, U>` | middleware | `Omit<T, keyof U> & U` — overwrite props |
| `ReadonlyStoreApi<T>` | react | `Pick<StoreApi<T>, 'getState' | 'getInitialState' | 'subscribe'>` |

---

## Core API (create, getState, setState, subscribe)

### `create<T>()(...)` — curried form (required for middleware in TS)

```ts
import { create } from 'zustand';

// WITHOUT middleware — single-call form is fine:
const useStore = create<MyState>(set => ({ ... }));

// WITH middleware — MUST use curried form for TypeScript:
const useStore = create<MyState>()(
  persist(
    (set, get) => ({ ... }),
    { name: 'my-storage' },
  ),
);
```

**Why curried?** TypeScript cannot infer `T` when the initializer is wrapped in
middleware. `create<T>()(...)` provides the type parameter explicitly.

### Store methods (available on the hook itself)

```ts
// Get current state (non-reactive)
const state = useStore.getState();

// Set state (merge by default)
useStore.setState({ foo: 'bar' });
useStore.setState(state => ({ count: state.count + 1 }));
useStore.setState({ everything: 'gone' }, true);  // replace mode

// Subscribe to ALL state changes (fires synchronously)
const unsub = useStore.subscribe((state, prevState) => { ... });
unsub();

// Get the initial state (the state at store creation time)
const initial = useStore.getInitialState();
```

### `createStore(initializer)` — vanilla (non-React) store

```ts
import { createStore } from 'zustand/vanilla';

const store = createStore((set, get) => ({ ... }));
const { getState, setState, subscribe, getInitialState } = store;
```

Use with React via `useStore(vanillaStore, selector)`.

### `set` function behavior (critical)

| Call | Behavior |
|------|----------|
| `set({ key: value })` | Merge: `{ ...state, key: value }` |
| `set({ key: value }, true)` | **Replace**: entire state becomes `{ key: value }` |
| `set(state => ({ count: state.count + 1 }))` | Functional updater (merge) |
| `set(state => ({ ...state, data: null }), true)` | Functional updater (replace) |

**WARNING**: `set` with `replace: true` wipes all other keys, including
actions. Never use replace mode unless you intentionally want a full reset.

### `get` function

```ts
const useStore = create<MyState>((set, get) => ({
  count: 0,
  increment: (n: number) => {
    const current = get().count;    // read state without subscribing to changes
    set({ count: current + n });
  },
  hasPermission: (perm: string) => {
    const perms = get().user?.permissions || get().permissions || [];
    return perms.includes(perm);
  },
}));
```

---

## Middleware (persist, devtools, subscribeWithSelector)

### `persist` — Local/session/any storage persistence

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useStore = create<MyState>()(
  persist(
    (set) => ({ ... }),
    {
      name: 'my-key',                    // required: unique localStorage key
      storage: createJSONStorage(() => sessionStorage),  // optional: default = localStorage
      partialize: (state) => ({           // optional: only persist these fields
        filters: state.filters,
        // exclude: selectedFile, DOM elements, etc.
      }),
      version: 2,                        // optional: bump on breaking changes
      migrate: (persisted, version) => { // optional: migration logic
        if (version === 1) return { ...persisted, newField: 'default' };
        return persisted as MyState;
      },
      merge: (persisted, current) => {   // optional: default = shallow merge
        return { ...current, ...(persisted as Partial<MyState>) };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);     // track hydration status
      },
      skipHydration: false,              // optional: for SSR
    }
  )
);
```

**`persist` API on the store** (automatically added by the middleware):

```ts
useStore.persist.setOptions({...});      // update persist options at runtime
useStore.persist.clearStorage();         // delete the storage entry
useStore.persist.rehydrate();            // manually rehydrate (async)
useStore.persist.hasHydrated();          // boolean: has hydration finished?
useStore.persist.onHydrate(fn);          // subscribe to hydration start
useStore.persist.onFinishHydration(fn); // subscribe to hydration finish
useStore.persist.getOptions();           // read current options
```

### `devtools` — Redux DevTools integration

```ts
import { devtools } from 'zustand/middleware';

const useStore = create<MyState>()(
  devtools(
    (set) => ({
      count: 0,
      // Named actions show in DevTools:
      increment: () => set(state => ({ count: state.count + 1 }), undefined, 'increment'),
      // Or with typed payload:
      add: (n: number) => set(
        state => ({ count: state.count + n }),
        undefined,
        { type: 'add', count: n }
      ),
    }),
    {
      name: 'MyStore',       // shown in DevTools tab
      enabled: process.env.NODE_ENV !== 'production',
      store: 'myStoreName',  // separate DevTools connection per store
    }
  )
);

// Cleanup:
useStore.devtools.cleanup();
```

### `subscribeWithSelector` — Selective subscriptions outside React

```ts
import { subscribeWithSelector } from 'zustand/middleware';

const useStore = create<MyState>()(
  subscribeWithSelector(
    (set) => ({ paw: true, snout: true, fur: true })
  )
);

// Subscribe to a slice — only fires when that slice changes:
const unsub = useStore.subscribe(
  state => state.paw,
  (paw, prevPaw) => console.log(paw, prevPaw),
  { equalityFn: (a, b) => a === b, fireImmediately: false }
);

// Subscribe to multiple fields:
const unsub2 = useStore.subscribe(
  state => [state.paw, state.fur],
  ([paw, fur]) => { ... },
  { equalityFn: shallow }
);

unsub();
unsub2();
```

**Without `subscribeWithSelector`, `subscribe` only takes a single listener
with `(state, prevState)` — no selector support.**

### `combine` — Merge two state slices

```ts
import { combine } from 'zustand/middleware';

const useStore = create(
  combine(
    { count: 0 },                        // initial data state
    (set, get) => ({                     // actions
      increment: () => set({ count: get().count + 1 }),
    })
  )
);
// Result type: Write<{ count: 0 }, { increment: ... }>
```

### `immer` — Immutable updates with mutable syntax

```ts
import { immer } from 'zustand/middleware/immer';

const useStore = create<MyState>()(
  immer((set) => ({
    nested: { deep: { value: 0 } },
    update: () => set(state => {
      state.nested.deep.value += 1;     // mutable! immer tracks the change
    }),
  }))
);
```

**NOTE**: `immer@11.1.8` IS installed in this repo. The `zustand/middleware/immer`
type definitions are available. However, **no existing Siraj store uses the
immer middleware** — the codebase uses immutable spread patterns instead.

### `redux` — Redux-style reducer + dispatch

```ts
import { redux } from 'zustand/middleware';

const useStore = create(redux(reducer, initialState));
// adds: useStore.dispatch(action)
// in DevTools: shows full action.type names
```

### `unstable_ssrSafe` — SSR-safe wrapper

```ts
import { unstable_ssrSafe } from 'zustand/middleware';

const useStore = create(unstable_ssrSafe((set) => ({ ... }), isSSR));
```

Prevents hydration mismatches in SSR by suppressing initial state changes until
client mount. Unstable API — may change.

### Middleware composition order

```ts
// Outer middleware wraps inner middleware:
const useStore = create<State>()(
  devtools(           // outermost — sees named actions
    persist(          // middle — handles storage
      subscribeWithSelector(  // inner — adds selector subscribe
        (set) => ({ ... })
      ),
      { name: 'storage-key' }
    ),
    { name: 'MyStore' }
  )
);
```

**Convention in this repo**: when using `persist` alone, the pattern is:

```ts
create<State>()(
  persist(
    (set, get) => ({ ... }),
    { name: 'storage-key' }
  )
)
```

---

## Selectors & Equality

### Default behavior (v5): `Object.is` strict equality

```ts
// Primitive selector — re-renders only when value changes (===):
const count = useStore(state => state.count);

// Object selector — ALWAYS re-renders because {} !== {} on every render!
// ❌ BAD:
const { count, name } = useStore(state => ({ count: state.count, name: state.name }));

// ✅ GOOD — separate atomic picks:
const count = useStore(state => state.count);
const name = useStore(state => state.name);

// ✅ GOOD — useShallow:
import { useShallow } from 'zustand/react/shallow';
const { count, name } = useStore(
  useShallow(state => ({ count: state.count, name: state.name }))
);
```

### `useShallow` — Prevent unnecessary re-renders

```ts
import { useShallow } from 'zustand/react/shallow';

// Object pick — compares shallow (same keys + values):
const { nuts, honey } = useStore(
  useShallow(state => ({ nuts: state.nuts, honey: state.honey }))
);

// Array pick — shallow compares elements:
const [nuts, honey] = useStore(
  useShallow(state => [state.nuts, state.honey])
);

// Mapped pick — shallow compares keys:
const treats = useStore(useShallow(state => Object.keys(state.treats)));
```

### `shallow` — Lower-level equality function

```ts
import { shallow } from 'zustand/shallow';

// Used with subscribeWithSelector:
useStore.subscribe(
  state => [state.paw, state.fur],
  ([paw, fur]) => { ... },
  { equalityFn: shallow }
);

// Used with createWithEqualityFn:
import { createWithEqualityFn } from 'zustand/traditional';
const useStore = createWithEqualityFn(
  (set) => ({ ... }),
  shallow  // default equality for ALL selectors
);
```

### `createWithEqualityFn` — Custom default equality

```ts
import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

const useStore = createWithEqualityFn<MyState>(
  (set) => ({ ... }),
  shallow  // default equality fn for all selectors
);

// Per-call override:
const treats = useStore(
  state => state.treats,
  (a, b) => compare(a, b)  // custom equality for this selector only
);
```

### v5 selector behavior changes

In v4, `create` accepted a second `defaultEqualityFn` argument. In v5, this
was **removed** from `create`. To use custom equality:
- Use `useShallow` hook (recommended for React components).
- Use `createWithEqualityFn` from `zustand/traditional` (v4-compatible API).
- Use `zustand/shallow` directly with `subscribeWithSelector`.

---

## v5 Breaking Changes from v4

### 1. `create` no longer accepts `defaultEqualityFn`

**v4**: `create(stateCreator, shallow)`  ❌ removed in v5
**v5**: `create(stateCreator)` — only `Object.is` equality by default.

Use `createWithEqualityFn` from `zustand/traditional` or `useShallow` from
`zustand/react/shallow` instead.

### 2. Curried `create<T>()(...)` now required for TypeScript + middleware

**v4**: `create<T>(persist(...))` worked (middleware exports a `StateCreator`
with proper generic flow).
**v5**: Middleware type inference changed. You MUST use the curried form
`create<T>()(persist(...))` when any middleware is applied.

For plain stores without middleware, `create<T>(set => ...)` still works.

### 3. `getInitialState()` added

New `StoreApi.getInitialState()` returns a snapshot of the state as it was at
store creation time. Available on both vanilla and React stores.

### 4. `useStore` hook is deprecated for direct import

**v4**: `import { useStore } from 'zustand'` was used alongside `create`.
**v5**: `useStore` from `zustand` is still exported but primarily for vanilla
store consumption. The hook returned by `create` is the primary API.

### 5. `shallow` and `useShallow` moved

| v4 import | v5 import |
|-----------|-----------|
| `import { shallow } from 'zustand/shallow'` | Same ✅ |
| `import { useShallow } from 'zustand/react/shallow'` | Same ✅ |

The barrel `zustand/shallow` re-exports both. No breaking change here — just
note that `useShallow` is the v5-recommended way to prevent re-renders.

### 6. `Map` and `Set` handling in `shallow`

The v5 `shallow` function handles iterables (including `Map` and `Set`) via
`compareEntries` and `compareIterables`. However, **this is for comparison
only** — persisting `Map`/`Set` to JSON still produces `{}` or `[]`, not the
original structure. See Serialization Rules below.

### 7. TypeScript minimum version

`zustand@5` requires TypeScript ≥ 4.5 (enforced via
`ts_version_4.5_and_above_is_required.d.ts`).

### 8. No more default middleware re-exports from `zustand`

Middleware must be imported from `zustand/middleware` (or subpaths), never
from `zustand` directly.

---

## Siraj Codebase Patterns (CRITICAL)

### Pattern Summary (from reading 12+ existing stores)

After reading the stores in `frontend/common/stores/`, the following patterns
are consistent across the entire codebase:

#### 1. Naming convention

```
useXxxStore    (camelCase, prefixed with "use" since it's a React hook)
XxxState       (PascalCase interface for the full state type)
```

Examples: `useDashboardStore`, `useLayoutStore`, `useSubjectManagementStore`,
`useSettingsStore`, `useCurrencyStore`, `usePermissionManagementStore`.

#### 2. Import

```ts
// Plain store (no middleware) — 95% of stores:
import { create } from "zustand";

// With persist middleware — only 2 stores:
import { create } from "zustand";
import { persist } from "zustand/middleware";
```

**Codebase statistics** (50+ stores):
- ~48 stores: `create` only (no middleware)
- 2 stores: `create` + `persist` (layoutStore, searchScheduleStore)
- 0 stores: `devtools`
- 0 stores: `subscribeWithSelector`
- 0 stores: `immer` middleware
- 0 stores: `createWithEqualityFn` / `traditional`
- 0 stores: `shallow` / `useShallow`

#### 3. Interface definition (state + actions together)

```ts
export interface XxxState {
  // --- Data fields ---
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly selectedItem: Item | null;

  // --- Actions ---
  readonly setLoading: (loading: boolean) => void;
  readonly setError: (error: string | null) => void;
  readonly reset: () => void;
}
```

**Key conventions**:
- State fields and actions are declared in ONE interface.
- Action functions use the `setXxx` / `openXxx` / `closeXxx` / `toggleXxx` naming.
- Most fields are `readonly` (especially in UI-state stores).
- Types imported from GraphQL generated types: `import type { User } from "@/frontend/common/graphql/generated/gql/graphql-types"`.
- When no GraphQL type exists, define a local interface or type.

#### 4. Store creation (two forms)

**Without middleware (direct form)**:
```ts
export const useXxxStore = create<XxxState>(set => ({ /* ... */ }));
```

**With middleware (curried form)**:
```ts
export const useXxxStore = create<XxxState>()(
  persist(
    set => ({ /* ... */ }),
    { name: "xxx-storage" }
  )
);
```

#### 5. `set` patterns

**Direct set** (most common):
```ts
setLoading: loading => set({ isLoading: loading }),
setError: error => set({ error }),
```

**Functional updater** (when reading previous state):
```ts
setDraft: draft => set(state => ({ draft: { ...state.draft, ...draft } })),
toggleXxx: () => set(state => ({ isOpen: !state.isOpen })),
```

**Spread for nested objects** (immutable update):
```ts
setFilters: filters => set(state => ({ filters: { ...state.filters, ...filters } })),
```

**Array operations**:
```ts
toggleDay: day =>
  set(state => ({
    days: state.days.map(d => (d.day === day ? { ...d, enabled: !d.enabled } : d)),
  })),
```

#### 6. `get` patterns (reading state in actions)

```ts
const useUserStore = create<UserState>((set, get) => ({
  hasPermission: permission => {
    const perms = get().user?.permissions || get().permissions || [];
    return perms.includes(permission);
  },
  // Guard against no-op writes:
  setActorIsSuperAdmin: actorIsSuperAdmin => {
    if (get().actorIsSuperAdmin === actorIsSuperAdmin) return;
    set({ actorIsSuperAdmin });
  },
}));
```

#### 7. `initialState` + `reset` pattern

```ts
const initialState = {
  isLoading: false,
  error: null as string | null,
  data: [] as Item[],
  // ...
};

export const useXxxStore = create<XxxState>(set => ({
  ...initialState,
  setLoading: loading => set({ isLoading: loading }),
  // ...
  reset: () => set(initialState),
}));
```

This pattern is used in `subjectManagementStore`, `permissionManagementStore`,
`environmentConfigSettingsStore`.

#### 8. Persist pattern (from layoutStore and searchScheduleStore)

**Simplified** (layoutStore — simple persist):
```ts
export const useLayoutStore = create<LayoutState>()(
  persist(
    set => ({ sidebarOpen: true, /* ... */ }),
    { name: "layout-storage" }
  )
);
```

**Full** (searchScheduleStore — with `partialize` + `merge` + `onRehydrateStorage`):
```ts
const STORAGE_KEY = "search-schedule-storage";

export const useSearchScheduleStore = create<SearchScheduleState>()(
  persist(
    (set, get) => ({
      // ... state + actions
      // Non-serializable fields in state but excluded from persist:
      sortMenuAnchorEl: null as HTMLElement | null,
      _hasHydrated: false,
    }),
    {
      name: STORAGE_KEY,
      partialize: (state): PersistedSearchScheduleState => ({
        // Only persist serializable fields:
        draftFilters: extractPersistedDraftFilters(state.draft),
        selectedTeacher: state.selectedTeacher,
        pageSize: state.pageSize,
        // sortMenuAnchorEl EXCLUDED — DOM element is non-serializable
        formFilterDrawerOpen: state.formFilterDrawerOpen,
        monthDrawerOpen: state.monthDrawerOpen,
        monthDrawerAnchorFromDate: state.monthDrawerAnchorFromDate,
        monthDrawerCurrentMonth: state.monthDrawerCurrentMonth,
        monthDrawerTeacher: state.monthDrawerTeacher,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as PersistedSearchScheduleState | undefined;
        return {
          ...currentState,
          draft: mergeDraftWithPersistedFilters(persisted?.draftFilters),
          selectedTeacher: persisted?.selectedTeacher ?? null,
          // Non-serializable fields reset on rehydrate:
          sortMenuAnchorEl: null,  // DOM element — always start closed
          _hasHydrated: false,     // set to true in onRehydrateStorage
        };
      },
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true);
      },
    }
  )
);
```

#### 9. Serialization pattern — `Record<string, boolean>` for sets

Instead of `Set<string>`, stores use `Record<string, boolean>`:

```ts
// billingTabsStore.ts — "visited tabs" set:
interface BillingTabsState {
  readonly visitedTabs: Record<BillingTabId, boolean>;
  readonly markTabVisited: (tab: BillingTabId) => void;
}

// usage:
markTabVisited: tab =>
  set(state => ({
    visitedTabs: { ...state.visitedTabs, [tab]: true },
  })),
```

```ts
// environmentConfigSettingsStore.ts — keyed maps as Records:
readonly revealedKeys: Readonly<Record<string, boolean>>;
readonly savingKeys: Readonly<Record<string, boolean>>;

toggleSecretRevealed: key =>
  set(state => ({
    revealedKeys: { ...state.revealedKeys, [key]: !state.revealedKeys[key] },
  })),
```

**✅ This is the canonical pattern for "sets" in Siraj stores —
`Record<string, boolean>`, NOT `Set<string>`.**

#### 10. Array collections (arrays, not Sets)

```ts
// permissionManagementStore.ts:
selectedGroupIds: string[];     // ← array, not Set
selectedUserIds: string[];
selectedPermissionIds: string[];

setSelectedGroupIds: ids => set({ selectedGroupIds: ids }),
```

#### 11. Hydration tracking pattern

```ts
interface SearchScheduleState {
  readonly _hasHydrated: boolean;
  readonly setHasHydrated: (hasHydrated: boolean) => void;
  // ...
}

// In persist options:
onRehydrateStorage: () => state => {
  state?.setHasHydrated(true);
},
```

#### 12. Types-only files (separate from store)

When state interfaces are large or shared, they live in a `.ts` file:

```
studentDashboardTypes.ts  → StudentDashboardState export
teacherDashboardTypes.ts  → TeacherDashboardState export
recurring-schedule-types.ts → shared schedule types
```

The store file imports the type and implements it:

```ts
// studentDashboardStore.ts
import type { StudentDashboardState } from "@/frontend/common/stores/studentDashboardTypes";
export const useStudentDashboardStore = create<StudentDashboardState>(set => ({ ... }));
```

#### 13. Factory pattern for generic stores

```ts
// createTabbedPaneStore.ts — generic "tab visited" store factory:
export function createTabbedPaneStore<TabId extends string>(allTabIds: readonly TabId[]) {
  interface TabbedPaneState {
    readonly visitedTabs: Record<TabId, boolean>;
    readonly markTabVisited: (tab: TabId) => void;
  }
  return create<TabbedPaneState>(set => ({ ... }));
}

// Usage:
export const useBillingTabsStore = createTabbedPaneStore<BillingTabId>(BILLING_TAB_IDS);
```

---

## Serialization Rules (from stores AGENTS.md)

The `frontend/common/stores/AGENTS.md` defines three serialization rules:

### 1. Never store non-serializable values in persist-enabled stores

> Never store `File`, `Blob`, `FormData`, `Promise`, or other
> non-JSON-serializable values in `persist`-enabled Zustand stores.
> `JSON.stringify(new File(...))` produces `{}`, destroying the value on
> rehydration.

### 2. Three mitigation strategies (choose one)

1. **Non-persisted store**: Create the store WITHOUT `persist`. State survives
   SPA navigation (in-memory) but not page refresh. Acceptable for `File`
   objects since browsers cannot restore them across refresh anyway.

2. **`partialize` exclusion**: Use `partialize` in the `persist` config to
   exclude non-serializable fields:

   ```ts
   partialize: (state) => ({
     ...state,
     selectedFile: undefined,  // excluded — must be re-selected on refresh
   }),
   ```

3. **`useRef` in ViewModel hook**: Keep `File` objects in a `useRef` inside the
   `useXxViewModel()` hook. The hook lives above the tier-switch unmount
   boundary, so the ref survives. Store only serializable metadata (e.g.,
   `documentName: string`) in Zustand.

### 3. Recommended for file uploads

Option 3 (`useRef` in ViewModel) is the recommended pattern.

### 4. JS `Set` / `Map` are non-serializable

`JSON.stringify(new Set(["a", "b"]))` produces `"{}"` — the set structure is
lost. Same for `Map` → `"{}"`. Use `string[]` arrays or `Record<string, boolean>`
instead.

### 5. DOM elements are non-serializable

`HTMLElement` references (popover anchors, menu anchors) survive in-memory but
cannot be JSON-serialized. Exclude via `partialize` and reset to `null` in the
`merge` function (see searchScheduleStore pattern above).

### 6. No ESLint enforcement yet

Serialization rules are manual — developers must self-enforce. Plan review
should check stores using `persist` for non-serializable fields.

---

## Deprecations

### In v5.0.14

| API | Status | Replacement |
|-----|--------|-------------|
| `create(stateCreator, defaultEqualityFn)` | **Removed** (v4 only) | `createWithEqualityFn` from `zustand/traditional` or `useShallow` |
| Direct `useStore` from `zustand` | Still works but prefer the `create`-returned hook | Use the hook returned by `create()` |
| `zustand/middleware/immer` | Available but requires `immer` peer dep | Immer IS installed (v11.1.8) but no Siraj store uses it |
| `unstable_ssrSafe` | Unstable API, may change | Use with caution; no Siraj store uses it |

### TypeScript deprecation notes

- `ts_version_4.5_and_above_is_required.d.ts` — empty file that enforces
  TS ≥ 4.5 at the type system level. Siraj uses `tsgo` (much newer TS).
- `typesVersions` in `package.json` maps old TS versions to the empty .d.ts
  file (they get no types).

---

## Usage Examples

### Example 1: Certificate template list store (non-persisted, UI state only)

Following the `subjectManagementStore` + `permissionManagementStore` pattern:

```ts
import { create } from "zustand";
import type { CertificateTemplate } from "@/frontend/common/graphql/generated/gql/graphql-types";

export type TemplateDialogMode = "create" | "edit" | "delete" | null;

interface TemplateListState {
  // --- Data ---
  readonly templates: readonly CertificateTemplate[];
  readonly isLoading: boolean;
  readonly error: string | null;

  // --- Selection ---
  readonly selectedTemplateId: string | null;

  // --- Dialog state ---
  readonly dialogMode: TemplateDialogMode;
  readonly isDeleteDialogOpen: boolean;
  readonly pendingDeleteId: string | null;

  // --- Pagination ---
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;

  // --- Actions ---
  readonly setTemplates: (templates: readonly CertificateTemplate[]) => void;
  readonly setLoading: (loading: boolean) => void;
  readonly setError: (error: string | null) => void;
  readonly setSelectedTemplateId: (id: string | null) => void;
  readonly openCreateDialog: () => void;
  readonly openEditDialog: (id: string) => void;
  readonly openDeleteDialog: (id: string) => void;
  readonly closeDialog: () => void;
  readonly setPage: (page: number) => void;
  readonly setTotalCount: (count: number) => void;
  readonly reset: () => void;
}

const initialState = {
  templates: [] as readonly CertificateTemplate[],
  isLoading: false,
  error: null as string | null,
  selectedTemplateId: null as string | null,
  dialogMode: null as TemplateDialogMode,
  isDeleteDialogOpen: false,
  pendingDeleteId: null as string | null,
  page: 0,
  pageSize: 10,
  totalCount: 0,
};

export const useTemplateListStore = create<TemplateListState>(set => ({
  ...initialState,
  setTemplates: templates => set({ templates }),
  setLoading: loading => set({ isLoading: loading }),
  setError: error => set({ error }),
  setSelectedTemplateId: id => set({ selectedTemplateId: id }),
  openCreateDialog: () => set({ dialogMode: "create" }),
  openEditDialog: id => set({ dialogMode: "edit", selectedTemplateId: id }),
  openDeleteDialog: id => set({ isDeleteDialogOpen: true, pendingDeleteId: id }),
  closeDialog: () =>
    set({ dialogMode: null, isDeleteDialogOpen: false, pendingDeleteId: null }),
  setPage: page => set({ page }),
  setTotalCount: totalCount => set({ totalCount }),
  reset: () => set(initialState),
}));
```

### Example 2: Certificate template editor store (non-persisted, draft state)

Following the `studentPortalProfileStore` + `environmentConfigSettingsStore` pattern:

```ts
import { create } from "zustand";

interface TemplateEditorDraft {
  readonly name: string;
  readonly description: string;
  readonly orientation: "portrait" | "landscape";
  readonly enabled: boolean;
  readonly font: string;
  readonly fontSize: number;
  readonly primaryColor: string;
  readonly layout: readonly string[];   // ← array, NOT Set
}

interface TemplateEditorState {
  readonly isEditing: boolean;
  readonly isDirty: boolean;
  readonly draft: TemplateEditorDraft;
  readonly saving: boolean;

  readonly setIsEditing: (editing: boolean) => void;
  readonly setDraft: (draft: TemplateEditorDraft) => void;
  readonly patchDraft: (patch: Partial<TemplateEditorDraft>) => void;
  readonly setSaving: (saving: boolean) => void;
  readonly reset: () => void;
}

const EMPTY_DRAFT: TemplateEditorDraft = {
  name: "",
  description: "",
  orientation: "portrait",
  enabled: true,
  font: "Inter",
  fontSize: 14,
  primaryColor: "",
  layout: [],
};

const initialState = {
  isEditing: false,
  isDirty: false,
  draft: EMPTY_DRAFT,
  saving: false,
};

export const useTemplateEditorStore = create<TemplateEditorState>(set => ({
  ...initialState,
  setIsEditing: isEditing => set({ isEditing }),
  setDraft: draft => set({ draft, isDirty: true }),
  patchDraft: patch =>
    set(state => ({ draft: { ...state.draft, ...patch }, isDirty: true })),
  setSaving: saving => set({ saving }),
  reset: () => set({ ...initialState, draft: EMPTY_DRAFT }),
}));
```

### Example 3: Persisted certificate settings store (with partialize)

Following the `searchScheduleStore` pattern:

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "certificate-template-settings-storage";

interface TemplateSettingsState {
  // Persisted:
  readonly defaultOrientation: "portrait" | "landscape";
  readonly defaultFont: string;
  readonly defaultPageSize: number;

  // NOT persisted (non-serializable or transient):
  readonly previewAnchorEl: HTMLElement | null;
  readonly _hasHydrated: boolean;

  readonly setDefaultOrientation: (o: "portrait" | "landscape") => void;
  readonly setDefaultFont: (font: string) => void;
  readonly setDefaultPageSize: (size: number) => void;
  readonly setPreviewAnchorEl: (el: HTMLElement | null) => void;
  readonly setHasHydrated: (hydrated: boolean) => void;
}

interface PersistedTemplateSettings {
  defaultOrientation: "portrait" | "landscape";
  defaultFont: string;
  defaultPageSize: number;
}

export const useTemplateSettingsStore = create<TemplateSettingsState>()(
  persist(
    set => ({
      defaultOrientation: "portrait",
      defaultFont: "Inter",
      defaultPageSize: 10,
      previewAnchorEl: null,    // non-serializable — excluded from persist
      _hasHydrated: false,
      setDefaultOrientation: defaultOrientation => set({ defaultOrientation }),
      setDefaultFont: defaultFont => set({ defaultFont }),
      setDefaultPageSize: defaultPageSize => set({ defaultPageSize }),
      setPreviewAnchorEl: previewAnchorEl => set({ previewAnchorEl }),
      setHasHydrated: _hasHydrated => set({ _hasHydrated }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state): PersistedTemplateSettings => ({
        defaultOrientation: state.defaultOrientation,
        defaultFont: state.defaultFont,
        defaultPageSize: state.defaultPageSize,
        // previewAnchorEl EXCLUDED — DOM element
        // _hasHydrated EXCLUDED — transient
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as PersistedTemplateSettings | undefined;
        return {
          ...currentState,
          defaultOrientation: persisted?.defaultOrientation ?? "portrait",
          defaultFont: persisted?.defaultFont ?? "Inter",
          defaultPageSize: persisted?.defaultPageSize ?? 10,
          previewAnchorEl: null,   // always reset — non-serializable
          _hasHydrated: false,     // set true in onRehydrateStorage
        };
      },
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true);
      },
    }
  )
);
```

### Example 4: Selected elements set (Record pattern, NOT JS Set)

```ts
// ✅ CORRECT — Record<string, boolean> is JSON-serializable:
interface TemplateEditorState {
  readonly selectedElementIds: Readonly<Record<string, boolean>>;
  readonly toggleElementSelected: (id: string) => void;
  readonly clearSelection: () => void;
}

const useTemplateEditorStore = create<TemplateEditorState>((set, get) => ({
  selectedElementIds: {},
  toggleElementSelected: id =>
    set(state => ({
      selectedElementIds: {
        ...state.selectedElementIds,
        [id]: !state.selectedElementIds[id],
      },
    })),
  clearSelection: () => set({ selectedElementIds: {} }),
}));

// ❌ WRONG — JS Set is NOT JSON-serializable and not used in Siraj:
// const useBadStore = create(() => ({
//   selectedIds: new Set<string>(),   // NEVER do this
// }));
```

---

## Gotchas & Warnings

### 1. NEVER use JS `Set` or `Map` in Zustand stores

- **`Set` is not JSON-serializable**. `JSON.stringify(new Set(["a"]))` → `"{}"`.
- On rehydration from `persist`, the `Set` becomes `{}` — data loss.
- **No existing Siraj store uses `Set` or `Map`** (verified via grep).
- **Use `string[]` arrays or `Record<string, boolean>` maps instead.**
- The `shallow` equality function can *compare* Sets/Maps for re-render
  prevention, but that's comparison only — not serialization safety.

### 2. Curried `create<T>()(...)` is REQUIRED with middleware in TypeScript

```ts
// ❌ TypeScript error with middleware:
const useStore = create<MyState>(persist(set => ({ ... }), { name: 'x' }));

// ✅ Correct — curried form:
const useStore = create<MyState>()(persist(set => ({ ... }), { name: 'x' }));
```

### 3. `set` with `replace: true` wipes everything

```ts
// ❌ This removes ALL other state, including actions:
set({ count: 0 }, true);

// ✅ To reset only data, spread initialState:
set(initialState);

// ✅ Or use merge mode (default):
set({ count: 0 });
```

### 4. Object/array selectors cause infinite re-renders

```ts
// ❌ New object every render → always re-renders:
const { a, b } = useStore(state => ({ a: state.a, b: state.b }));

// ✅ Atomic picks (no re-render unless a or b changes):
const a = useStore(state => state.a);
const b = useStore(state => state.b);

// ✅ Or useShallow:
import { useShallow } from "zustand/react/shallow";
const { a, b } = useStore(useShallow(state => ({ a: state.a, b: state.b })));
```

### 5. `persist` middleware stores state in `localStorage` by default

If the store contains non-serializable values, they will produce `"{}"` in
localStorage. Use `partialize` to exclude them, or skip `persist` entirely.

### 6. `subscribe` (without middleware) has no selector support

The base `subscribe(listener)` fires on EVERY state change. To subscribe to a
slice, you need `subscribeWithSelector` middleware.

### 7. `_hasHydrated` pattern for persist stores

Persist stores hydrate asynchronously. Components rendering before hydration
will see the default state. Use `_hasHydrated` + `onRehydrateStorage` to gate
UI:

```ts
const hasHydrated = useStore(state => state._hasHydrated);
if (!hasHydrated) return <LoadingSpinner />;
```

### 8. `readonly` modifiers on state fields

Many Siraj stores use `readonly` on state fields. This is a TypeScript
immutability aid — `set()` still produces a new state object. Actions
themselves are not marked `readonly` (they're functions, not data).

### 9. Import types from `graphql-types.ts`, NOT `operations.ts`

Per `frontend/common/stores/AGENTS.md`:

```ts
// ✅ Entity types (User, CertificateTemplate, etc.):
import type { CertificateTemplate } from "@/frontend/common/graphql/generated/gql/graphql-types";

// ✅ Operation result types (e.g., CreateTemplateMutationMutation):
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

// ❌ Don't import entity types from operations.ts — poorer type definitions
```

### 10. No `devtools` middleware in production codebase

Zero Siraj stores use `devtools`. If needed for debugging, add it temporarily
and remove before commit. It adds overhead and is not part of the codebase
convention.

### 11. `immer` middleware is available but unused

`immer@11.1.8` is installed. The `zustand/middleware/immer` types are present.
However, no Siraj store uses it. The codebase convention is immutable spread
patterns. If the template editor has deeply nested state, `immer` could be
considered — but follow existing patterns unless there's a strong reason.

### 12. Store naming: `useXxxStore` (not `useXxxState`)

The hook is named `use<Domain>Store`. The interface is `<Domain>State`.

```ts
// ✅ Convention:
export const useTemplateListStore = create<TemplateListState>(...);

// ❌ Don't name the hook useXxxState:
export const useTemplateListState = create<TemplateListState>(...);
```

### 13. Separate types file for large stores

If the state interface is large or shared (e.g., `studentDashboardTypes.ts`),
put it in a separate `<name>Types.ts` file. The store file imports from it.

### 14. Non-persisted stores survive SPA navigation but not page refresh

In-memory Zustand stores persist across client-side route changes (Next.js
App Router navigation) but are lost on a full page refresh (F5). For UI state
that doesn't need to survive refresh (dialog open/close, selection, draft
filters), non-persisted stores are the correct choice.

### 15. Mobile/Desktop tier switching requires state in Zustand

Per `frontend/AGENTS.md`: all mutable state must live in Zustand stores so it
survives viewport tier switching (mobile ↔ desktop). `useState` inside
`.mobile.tsx` or `.desktop.tsx` is reset on tier switch. Use Zustand for:
- Dialog open/close flags
- Selected item IDs
- Filter/search query strings
- Pagination state
- Tab selection

`useRef` values in the ViewModel hook also survive tier switches (the hook is
above the unmount boundary), but Zustand is the standard for reactive state.
