# Frontend Common Views Layer Rules

This document governs the **tier-neutral home** for switchers, Containers, ViewModels, schemas, types, utils, and shared components in `frontend/common/views/`.

## Module Contract

- **Location**: `frontend/common/views/dashboard/<domain>/`
- **Imports allowed from**:
  - `@/frontend/common/...` (components, stores, hooks, utils, graphql)
  - `@/shared/...` (messages, types, lib)
  - `@/backend/types/...` (canonical type definitions)
- **MUST NOT import statically** from `@/frontend/mobile/...` or `@/frontend/desktop/...` — tier views are consumed via dynamic `import()` in switchers only
- **Tier views import their ViewModel type** from `@/frontend/common/views/dashboard/<domain>/useXxViewModel` (type-only imports are fine)
- **Metric cards:** Presentation lives in tier views — they must use only `MobileMetricCardGrid` / `DesktopMetricCardGrid` (never the card primitives). See `frontend/mobile/AGENTS.md` and `frontend/desktop/AGENTS.md`.

## Directory Structure per Domain

```
frontend/common/views/dashboard/<domain>/
  useXxViewModel.ts          # business logic hook (viewport-agnostic)
  XxView.tsx                 # switcher — createLazyView + ResponsiveViewSwitch
  XxContainer.tsx            # calls hook, renders <XxView {...viewModel} />
  types/                     # shared type definitions
  schemas/                   # Zod validation schemas
  utils/                     # shared utilities
  components/                # shared non-tiered components (NOT .mobile/.desktop)
```

## Switcher Pattern (Lazy Loading)

The switcher (`XxView.tsx`) is the ONLY file in this layer that orchestrates tier selection. It uses `createLazyView` with static import paths to the tier-specific views:

```tsx
"use client";
import { createLazyView, ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { type XxViewModel, type UseXxViewModelProps, useXxViewModel } from "./useXxViewModel";

const lazyViews = createLazyView<XxViewModel>(
  () => import("@/frontend/mobile/views/dashboard/<domain>/xx.mobile").then(m => ({ default: m.XxMobileView })),
  () => import("@/frontend/desktop/views/dashboard/<domain>/xx.desktop").then(m => ({ default: m.XxDesktopView })),
);

export function XxView(props: Readonly<UseXxViewModelProps>) {
  const viewModel = useXxViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
```

## ViewModel Pattern

- `useXxViewModel()` encapsulates ALL business logic (data fetching, state, handlers, derived values)
- Returns a **flat plain object** (the "view model") — same interface for both tiers
- **"Flat" means handlers and state** — `loading`, `rows`, `onSave`, dialog open flags, etc. stay top-level. **Translation copy is grouped** under `labels` or `labelsBySection` (see Rule 7), not spread as 20+ `*Label: string` fields.
- **ViewModel owns all view-layer translations** — loads namespace(s) via `useAppTranslation(handle)`; tier views (`.mobile.tsx`, `.desktop.tsx`) and domain components under `components/` receive `labels` via props and **must not** call `useAppTranslation`.
- **Exception:** `frontend/common/components/ui/` shared primitives (TagInput, CurrencySelect, etc.) — self-contained widgets may keep the hook.
- **No viewport logic**: never import `useMediaQuery`, `useViewport`, or `ViewportContext`
- **All mutable state in Zustand stores** (`frontend/common/stores/`) to survive tier switch
- **Serialization safety**: non-serializable values (`File`, `Blob`, `FormData`, `Promise`) in `useRef` inside the hook, NOT in Zustand `persist` stores

## Rule 7: Labels Object Pass-Down

**Problem:** Many ViewModels flatten 20+ `*Label: string` fields; tier views destructure them; column builders immediately re-bundle via `Pick<>`.

### ViewModel return shape

Handlers and state stay top-level; group **copy only**:

```typescript
// Multi-area screen
export interface SupportedCurrenciesViewModel {
  readonly labelsBySection: {
    readonly shell: SupportedCurrenciesShellLabels;
    readonly columns: SupportedCurrenciesColumnLabels;
    readonly actions: SupportedCurrenciesActionLabels;
    readonly dialogs: SupportedCurrenciesDialogLabels;
    readonly notifications: SupportedCurrenciesNotificationLabels;
  };
  readonly rows: readonly SupportedCurrencyRow[];
  readonly loading: boolean;
  // handlers, dialog state, etc. stay top-level
}

// Simple screen (single UI area)
export interface LoginViewModel {
  readonly labels: AuthLoginLabels;
  // ...
}
```

Use `labels` for simple screens; use `labelsBySection` when a screen has multiple UI areas.

### Section naming (`labelsBySection`)

Use only the sections the screen needs:

| Section | Typical contents |
| --- | --- |
| `shell` | `pageTitle`, `pageSubtitle`, `emptyMessage`, tab chrome |
| `columns` | DataGrid header strings |
| `filters` | Filter bar labels |
| `dialogs` | Modal titles, bodies, confirm/cancel |
| `actions` | Button labels, row action tooltips |
| `notifications` | Toast success/error messages |
| `form` | Field labels, placeholders, validation messages |

Pass section slices to children: `labelsBySection.shell` → page chrome, `labelsBySection.columns` → column builder, etc.

### Thresholds

- **3+ related translation strings** at the same boundary (component props, util params, column builder args) → must be one `labels` object, not individual string props.
- ViewModels with **8+ label fields total** → must use `labels` or `labelsBySection`; no flat `*Label: string` fields on the ViewModel interface.

### Type placement

1. **Exact match** → import `XLabels` from `@/shared/locale/types/...` directly.
2. **Subset** → `Pick<BillingLabels, "pageTitle" | "pageSubtitle">` or a dedicated `*ShellLabels` in domain types.
3. **View-shaped** → new exported type in `frontend/common/views/dashboard/<domain>/types/<feature>.types.ts`.
4. **Component-only, props interface already in the `.tsx` file** → extend that props interface in place.

**Default:** new label shapes go in domain `types/*.types.ts`. **Exception:** when the component file already defines its props interface, update it there. Never inline ad-hoc `{ foo: string; bar: string }` on public props when the shape is reused or has 3+ label fields.

View-layer types may `Pick` / compose canonical `*Labels` from `@/shared/locale/types` — they must not redefine copy keys.

### Reference patterns

- `frontend/common/views/dashboard/settings/types/settingsAudit.types.ts` — `SettingsAuditLabels` with `filters`, `columns`, `entityTypes`, `actions`
- Login pilot — `labels: AuthLoginLabels` passed ViewModel → components
- Column builders that already take one `labels` object — extend that shape up to ViewModels

### Anti-patterns

| Anti-pattern | Fix |
| --- | --- |
| Flat VM label fields (~25 strings) | `labelsBySection: { shell, columns, actions, dialogs, notifications }` |
| Exploded props at component boundary | Pass `labels: ScheduleFilterLabels` |
| Mixed utils with individual string params | Group under `labels.headers` / `labels.actions` |

### Migration verification

Every file touched in a translation/labels migration PR must pass:

```bash
bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene
```

Runs progressive checks: tsgo → biome → lint (queue) → codescene. Fix until exit 0. Lint queue server must be running before dispatch.

## Cross-References

- `.agents/instructions/mobile-desktop.instructions.md` — full tier isolation rules, ESLint config, primitive catalog
- `frontend/mobile/AGENTS.md` — Mobile* primitives (3 behavioral categories)
- `frontend/desktop/AGENTS.md` — tier-paired `.desktop.*` variants only
- `frontend/common/components/ui/AGENTS.md` — viewport-agnostic primitives layer
- `frontend/views/AGENTS.md` — ViewModel conventions (legacy location, will point here after Block 2)

## Oxlint Rules (CRITICAL — NO `oxlint-disable` comments allowed)

Oxlint is the project's linter (`bun run oxlint`). It uses type-aware mode (`typeAware: true`, `typeCheck: true` in `oxlint.config.mts`). NEVER add `oxlint-disable` comments — fix the root cause instead.

### no-unsafe-type-assertion (STRICT — stricter than ESLint)

Oxlint's `no-unsafe-type-assertion` rule flags ALL `as Type` assertions that narrow from a wider type to a narrower one. **`as unknown as Type` (double assertion) does NOT bypass this rule.**

**Use type guards instead of `as`:**
```ts
// WRONG — flagged by oxlint
const record = value as Record<string, unknown>;
const error = caught as Error;
const row = result as EntitySelectType;

// RIGHT — type guard (not flagged)
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
const record = isRecord(value) ? value : {};

// RIGHT — instanceof for errors
if (error instanceof Error) return error;
throw new Error(String(error));

// RIGHT — find() with widening cast for enum narrowing
const match = Object.values(SomeEnum).find(v => (v as string) === value);
// `(v as string)` is a widening cast (safe, not flagged)
```

**For Drizzle pgEnum columns** (inferred as `string` not the enum type):
- Add `.$type<EnumType>()` to the column definition in the schema to fix at source
- OR use type guards: `function isStatus(value: string): value is Status { return (Object.values(Status) as readonly string[]).includes(value); }`

**For `response.json()` (returns `any`):**
- Type the variable: `const data: SomeType = await response.json();`
- OR use a type guard: `const data: unknown = await response.json(); if (!isSomeType(data)) throw ...;`

### no-await-in-loop

`await` inside `for`, `while`, `do...while`, `for...of` loops is flagged.

**Use `Promise.all` for independent iterations:**
```ts
// WRONG
for (const item of items) { await process(item); }

// RIGHT — parallel
await Promise.all(items.map(item => process(item)));
```

**Use recursive helper for sequential iterations (shared transactions, ordered timestamps):**
```ts
async function processNext(index: number): Promise<void> {
  if (index >= items.length) return;
  await process(items[index]);
  return processNext(index + 1);
}
await processNext(0);
```

**Use `reduce` chain as alternative:**
```ts
await items.reduce(async (prev, item) => {
  await prev;
  return processOne(item);
}, Promise.resolve());
```

**`for await...of` is NOT flagged** (async iterable iteration).

**DO NOT parallelize when:** iterations share a DB transaction connection, each depends on the previous result, or ordering matters (e.g., sequential timestamps for pagination tests).

### consistent-function-scoping

Functions defined inside another function that don't capture any variables from the enclosing scope should be at module scope.

```ts
// WRONG — doesn't capture anything from parent
function component() {
  const helper = (x: string) => x.toUpperCase(); // flagged
  return helper("test");
}

// RIGHT — moved to module scope
const helper = (x: string) => x.toUpperCase();
function component() {
  return helper("test");
}
```

### no-object-type-as-default-prop

React component default props must not be object/array literals (re-created every render, breaks referential equality).

```ts
// WRONG
function Component({ options = {} }: Props) { ... }
function Component({ items = [] }: Props) { ... }

// RIGHT — stable module-level reference
const DEFAULT_OPTIONS = {};
const DEFAULT_ITEMS: readonly ItemType[] = [];
function Component({ options = DEFAULT_OPTIONS, items = DEFAULT_ITEMS }: Props) { ... }
```

### no-underscore-dangle

Identifiers with leading underscores are flagged. Fix by renaming, or use bracket notation for external API fields:

```ts
// WRONG
const value = obj._ref;
function _helper() { ... }

// RIGHT — rename
const value = obj.ref;
function helper() { ... }

// RIGHT — bracket notation for external API fields (not flagged)
const refKey = "_ref";
const value = obj[refKey];
// OR: const { _ref } = obj; (destructuring not flagged)
```

### no-unsafe-enum-comparison

Comparing values of different enum types (or enum vs string) is flagged.

```ts
// WRONG — enum vs string
if (row.status === SomeEnum.VALUE) { ... }

// RIGHT — both sides as string
if (String(row.status) === String(SomeEnum.VALUE)) { ... }
// OR use string literals
if (row.status === "VALUE") { ... }
// OR use Set-based lookup
const VALID_STATUSES = new Set(Object.values(SomeEnum) as string[]);
if (VALID_STATUSES.has(row.status)) { ... }
```

### no-shadow

Variable names shadowing an outer scope variable are flagged. Fix with destructuring rename or `_` prefix for unused params:

```ts
// WRONG
const studentHref = "...";
function Card({ studentHref }: Props) { ... } // shadows

// RIGHT — destructuring rename
function Card({ studentHref: href }: Props) { ... }

// RIGHT — unused param prefix (config: argsIgnorePattern: "^_")
async function test(_tx: DBTransaction) { ... }
```

### consistent-return

Functions must consistently return values or not return values (no mixing `return value` and `return;`).

```ts
// WRONG — mixes void and value returns
function getStatus(active: boolean) {
  if (active) return "ACTIVE";
  return; // void return — flagged
}

// RIGHT — consistent value returns
function getStatus(active: boolean) {
  if (active) return "ACTIVE";
  return undefined; // or return null;
}
```

**Config override exists** for `useEffect` callbacks (false positives — the rule doesn't understand React cleanup patterns). Already configured in `oxlint.config.mts`.

### Config Overrides (legitimate — NOT `oxlint-disable`)

The `oxlint.config.mts` has `overrides` for:
- **Test files**: `@typescript-eslint/unbound-method: "off"` (false positive for mock function references)
- **`useEffect` files**: `@typescript-eslint/consistent-return: "off"` (false positive for cleanup callbacks)
- **Logger/scripts**: `no-console: "off"` (intentional console usage)

These are config-level overrides, NOT inline `oxlint-disable` comments.
