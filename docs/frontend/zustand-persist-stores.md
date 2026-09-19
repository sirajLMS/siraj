# Persisted Zustand Filter Stores

## Overview

Dashboard filter/tab state uses flat Zustand stores with the `persist` middleware (localStorage),
sibling stores all following one idiom. Server-side pagination is driven from the persisted store
pages: the ViewModel derives GraphQL `offset = pageIndex * pageSize` variables from the store.

## The idiom

```ts
"use client";

const defaultState = (): FilterStore => ({
  activeTab: TABS[0],
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
});

export const useFilterStore = create<FilterStore>()(
  persist(() => ({ ...defaultState() }), { name: STORAGE_KEY }),
);
```

- `"use client"` directive; module-level default-state factory and a module-level storage-key
  constant (never an inline literal in the persist call).
- Per-field selectors in consumers; setters `useCallback`-wrapped so consumers get stable
  identities.

## Key invariants

- **Page clamping**: page setters clamp through a non-negative page helper (NaN/∞ → 0,
  negatives → 0, truncation), so a stale persisted page can never produce a negative offset.
- **Page reset on filter change**: a filter setter that changes the result set (e.g. a new
  month/period) also zeroes every tab's page index — a stale page against a new filter's
  row count shows an empty or misaligned page.
- **Serialization**: all persisted state must be JSON-serializable (strings, numbers, enum
  values); no files, promises, or class instances. If most state is serializable and a field
  is not, use `partialize` to exclude it.
- **Enum value imports at runtime**: a runtime default like `CurrencyCode.Sar` requires the
  generated enum as a *value* import (type-only imports erase at runtime); if the generated
  enum and the domain enum differ, bridge per docs/graphql/dual-enum-bridges.md.
- **Const tuple + derived union**: export a tab/segment list as a `readonly [...]` tuple with
  a derived union type, so ordered UI lists (MUI `Tabs`) and type checks share one source.
- **No user-facing strings** in the store — labels belong to the translation namespace in the
  ViewModel/views layer, not the persisted state.
- **`reset`** restores pristine state including a fresh current-period default, not a stale
  persisted one.
