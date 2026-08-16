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

## WhatsApp Settings Patterns

- **Canonical reference**: See `docs/frontend/whatsapp-ui-patterns.md` for the full pattern catalog (ViewModel hooks, URL-synced tabs, dialog state, per-row loading, i18n label helpers, animations, accessibility, testing, gotchas).
- **ViewModel composable hooks**: The WhatsApp ViewModel decomposes into 10+ sub-hooks (`useWhatsappQueries`, `useWhatsappMutations`, `useWhatsappDialogs`, etc.) assembled by `buildWhatsappViewModel`. When a ViewModel grows past ~120 lines, extract sub-hooks early to avoid CodeScene Large Method.
- **URL-synced tabs**: `useWhatsappTab()` reads `?tab=` from URL via `useSearchParams`, validates against `TAB_IDS` allowlist. Tab changes use `<Link>` hrefs — no `setActiveTab` needed.
- **Dialog state**: Single `dialogState: { type, accountId?, displayName? }` — no local `useState` for dialog open/close. `mutationError` tracks inline validation errors.
- **Per-row loading**: `creating`, `deletingId`, `updatingId`, `syncingId` (sentinel `"all"` for bulk sync).
- **i18n label helpers**: Record-based lookups (`getTemplateStatusLabelKey`, `getQualityLabelKey`, etc.) avoid `no-unsafe-enum-comparison`.
- **Missing backend resolvers**: `whatsappTemplates` and `whatsappOptInAudit` queries don't exist — documents are commented-out stubs with placeholder data.

## Linting Rules

- See `docs/quality/linting-rules.md` for Oxlint & ESLint/sonarjs fix recipes. NEVER use `oxlint-disable` comments.

