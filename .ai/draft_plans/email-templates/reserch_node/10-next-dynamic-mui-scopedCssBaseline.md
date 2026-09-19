# Research 10 — editor-wrapper dependencies (next/dynamic, ScopedCssBaseline, 'use client')

Single concern: verify that the editor wrapper requirements (next/dynamic with `{ ssr: false }`, MUI v9 `ScopedCssBaseline`, and `'use client'` directive) are accurate against the installed Next.js 16.2.12 + MUI 9.2.0 + React 19 + the repo's existing conventions.

## 1. Confirmed package versions

| Package | Installed version | Source |
|---|---|---|
| `next` | `16.2.12` | `node_modules/next/package.json` (line `"version": "16.2.12"`) |
| `@mui/material` | `9.2.0` | `node_modules/@mui/material/package.json` (line `"version": "9.2.0"`) |
| React | 19.x (peer) | `@mui/material` peerDependencies `react: ^19.0.0` |

Both match expectations.

## 2. `next/dynamic` deprecation status — NOT deprecated; `{ ssr: false }` still valid (in Client Components)

### Type definitions

File: `node_modules/next/dist/shared/lib/dynamic.d.ts`

```ts
export type DynamicOptions<P = {}> = LoadableGeneratedOptions & {
  loading?: (loadingProps: DynamicOptionsLoadingProps) => React.ReactNode;
  loader?: Loader<P> | LoaderMap;
  loadableGenerated?: LoadableGeneratedOptions;
  ssr?: boolean;        // <-- ssr option still declared
};
export default function dynamic<P = {}>(
  dynamicOptions: DynamicOptions<P> | Loader<P>,
  options?: DynamicOptions<P>,
): React.ComponentType<P>;
```

The above is the live type signature. There is **NO `@deprecated` JSDoc tag** anywhere in `node_modules/next/dynamic.d.ts` or `node_modules/next/dist/shared/lib/dynamic.d.ts`. The only JSDoc on the `dynamic` function reads:

> "This function lets you dynamically import a component. It uses [React.lazy()](https://react.dev/reference/react/lazy) with [Suspense](https://react.dev/reference/react/Suspense) under the hood."

i.e. `next/dynamic` is a thin wrapper over `React.lazy` + Suspense, **not** a deprecated API replaced by `React.lazy`. `React.lazy` is the underlying primitive, not a replacement.

### `{ ssr: false }` validity

`ssr?: boolean` is still a declared option in `DynamicOptions` (see .d.ts above). It type-checks without issue.

### Local Next.js 16 docs — file `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`

The local doc (version `16.2.12`, lastUpdated `2026-03-10`) explicitly documents the pattern:

> "There are two ways you can implement lazy loading in Next.js:
> 1. Using Dynamic Imports with `next/dynamic`
> 2. Using `React.lazy()` with Suspense"

And:

> "`next/dynamic` is a composite of `React.lazy()` and Suspense."

Example given in the doc (App Router):

```jsx filename="app/page.js"
'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'

const ComponentC = dynamic(() => import('../components/C'), { ssr: false })
```

### CRITICAL caveat added in Next.js 16

From the same doc (and confirmed by an upstream Next.js fixture):

> "Note: `ssr: false` option is not supported in Server Components. You will see an error if you try to use it in Server Components. `ssr: false` is not allowed with `next/dynamic` in Server Components. Please move it into a Client Component."

So `{ ssr: false }` is **only legal inside a Client Component** (a file with `'use client'`). The `'use client'` directive on `EmailTemplateEditorPage.tsx` combined with `{ ssr: false }` is correct and required. Removing either the directive or the `ssr: false` option would break the wrapper.

Online cross-ref (https://nextjs.org/docs/app/guides/lazy-loading, version 16.2.12) matches the local doc verbatim.

## 3. `ScopedCssBaseline` import path — both root and subpath resolve

### Root export

File `node_modules/@mui/material/index.d.ts` lines 183-184:

```ts
export { default as ScopedCssBaseline } from "./ScopedCssBaseline/index.js";
export * from "./ScopedCssBaseline/index.js";
```

So `import { ScopedCssBaseline } from "@mui/material"` works.

### Subpath export

File `node_modules/@mui/material/ScopedCssBaseline/index.d.ts`:

```ts
export { default } from "./ScopedCssBaseline.js";
export * from "./ScopedCssBaseline.js";
export { default as scopedCssBaselineClasses } from "./scopedCssBaselineClasses.js";
export * from "./scopedCssBaselineClasses.js";
```

And the `exports` map in `node_modules/@mui/material/package.json` (lines 1558-1569) explicitly registers the subpath:

```json
"./ScopedCssBaseline": {
  "import": { "types": "./ScopedCssBaseline/index.d.mts", "default": "./ScopedCssBaseline/index.mjs" },
  "require": { "types": "./ScopedCssBaseline/index.d.ts",  "default": "./ScopedCssBaseline/index.js" }
}
```

So **both** are valid:
- `import { ScopedCssBaseline } from "@mui/material"` (root — preferred for tree-shaking & matching the root `CssBaseline` import the rest of the repo already uses)
- `import ScopedCssBaseline from "@mui/material/ScopedCssBaseline"` (subpath — valid, but unnecessary)

The physical directory `node_modules/@mui/material/ScopedCssBaseline/` exists, confirming the subpath is real, not a phantom `exports` entry.

### `useTheme` cross-check

The `useTheme` export lives in `@mui/material/styles` (it is NOT re-exported from the root `@mui/material/index.d.ts`). `import { useTheme } from "@mui/material/styles"` is the correct path. (Grep of the root `@mui/material/index.d.ts` for `useTheme` returns zero hits; the styles subpath is the canonical import.)

There is **no existing `ScopedCssBaseline` usage anywhere in the repo** (Grep across `frontend/`, `app/`, `backend/` returned no matches). This will be the first consumer.

## 4. Existing repo usage of `next/dynamic` with `ssr: false`

Grep for `from ['"]next/dynamic['"]` (excluding `node_modules`) found these consumers:
- `frontend/common/components/ui/container/createLazyView.ts`
- `frontend/common/views/dashboard/dashboard/DashboardContainerView.tsx`
- (research markdown files only — not code)

Grep for `ssr: false` (excluding `node_modules`) found **zero** matches in actual source (only the research `.md` files mention it). The repo's existing lazy loaders all use `{ ssr: true }` or omit `ssr`.

Sample existing usage — `frontend/common/views/dashboard/dashboard/DashboardContainerView.tsx` lines 1-22:

```tsx
"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
// ...
const LazyParentDashboardContainer = dynamic(
  () => import("@/frontend/common/views/dashboard/parent/dashboard/ParentDashboardContainer").then(m => ({ default: m.ParentDashboardContainer })),
  { ssr: true }
);
```

And the factory at `frontend/common/components/ui/container/createLazyView.ts` lines 1-26:

```ts
"use client";
import dynamic from "next/dynamic";
import type { ComponentType, ReactNode } from "react";

export function createLazyView<T>(
  mobileImporter: () => Promise<{ default: ComponentType<ViewProps<T>> }>,
  desktopImporter: () => Promise<{ default: ComponentType<ViewProps<T>> }>,
  options?: { readonly ssr?: boolean; readonly loading?: () => ReactNode }
): CreateLazyViewResult<T> {
  const ssr = options?.ssr ?? true;
  // ...
  return {
    mobile: dynamic(mobileImporter, { ssr, loading }),
    desktop: dynamic(desktopImporter, { ssr, loading }),
  };
}
```

The repo pattern confirms:
1. `next/dynamic` is the canonical lazy-load mechanism in this repo (not raw `React.lazy`).
2. Every existing usage carries a `'use client'` directive at the top of the file — this is the established convention.
3. `dynamic()` is called at module top level (not inside render) — required by Next.js for chunk preloading, also enforced by the local doc line: *"dynamic() can't be used inside of React rendering ... needs to be marked in the top level of the module."* The pattern (`const EmailEditor = dynamic(() => import(...).then(...), { ssr: false })` at module top) matches this constraint.

No repo file uses `ssr: false` today. The editor wrapper will introduce the first `ssr: false` usage. That is consistent with the docs (TipTap touches `window` at module load → must skip SSR).

## 5. `'use client'` directive model in Next.js 16

The `'use client'` directive is **still required** in Next.js 16 App Router for any component that:
- uses hooks (`useState`, `useEffect`, `useRef`, …),
- touches browser globals (`window`, `document`, …),
- uses event handlers (`onClick`, etc.),
- uses `next/dynamic` with `{ ssr: false }` (cannot be in a Server Component).

Confirmed by:
- The local doc `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` every code sample using `dynamic` + `ssr: false` starts with `'use client'`.
- 20+ files across `frontend/` carry `'use client'` / `"use client"` at the top (see Grep results — `frontend/mobile/views/dashboard/admin/payment-catalogs/components/paymentCatalogCard.mobile.tsx`, `frontend/common/views/dashboard/classes/recurring/CreateRecurringClassView.tsx`, etc.). The convention is `"use client";` (double quotes, semicolon).
- The repo established convention in `frontend/common/components/ui/container/createLazyView.ts` and `DashboardContainerView.tsx` is `"use client";` as line 1.

A `'use client'` directive on `EmailTemplateEditorPage.tsx` is required and matches repo convention.

## 6. Any alternative patterns (`React.lazy` + Suspense)

`React.lazy` + `Suspense` is the alternative the Next.js doc presents for plain lazy loading **without** `ssr: false`. It has **no native SSR-skip option** — to skip SSR you must use `next/dynamic` with `{ ssr: false }`.

The repo does NOT use `React.lazy` anywhere for lazy-loading components (Grep for `React.lazy` returned zero source matches; only the `Suspense` import in `DashboardContainerView.tsx` appears alongside `next/dynamic`). The established pattern is `next/dynamic`.

There is no reason in Next.js 16 to migrate the editor wrapper to `React.lazy` + Suspense: doing so would lose the `ssr: false` capability that is the entire reason for wrapping TipTap.

## 7. Online-docs cross-ref

- https://nextjs.org/docs/app/guides/lazy-loading (version 16.2.12, lastUpdated 2026-03-10) — matches local doc; explicitly states `ssr: false` only works in Client Components and recommends moving it there when a Server Component errors.
- https://react.dev/reference/react/lazy — `React.lazy` is the primitive, not a deprecated-superseding replacement for `next/dynamic`. Next.js's own doc describes `next/dynamic` as a composite built on `React.lazy` + Suspense.
- The build-time error string `"\`ssr: false\` is not allowed with \`next/dynamic\` in Server Components. Please move it into a Client Component."` is raised by the compiler — so the `'use client'` directive is enforced at compile time, not just by convention.

## 8. One-line verdict

**VERIFIED.** The editor-wrapper requirements are all correct against Next.js 16.2.12 + MUI 9.2.0:
- `next/dynamic` is NOT deprecated; `ssr?: boolean` is still in `DynamicOptions` (`node_modules/next/dist/shared/lib/dynamic.d.ts`); `{ ssr: false }` type-checks and is required to skip TipTap's `window` access — but **only inside a Client Component**.
- `'use client'` directive is mandatory and must remain — `ssr: false` raises a hard compile-time error in Server Components in Next.js 16.
- `ScopedCssBaseline` is exported from `@mui/material` root (`node_modules/@mui/material/index.d.ts:183`) and also via the subpath `@mui/material/ScopedCssBaseline` (`package.json` exports map lines 1558-1569). Prefer the root import to match the existing `CssBaseline` import style used elsewhere in the repo.
- `useTheme` must be imported from `@mui/material/styles` (NOT from `@mui/material` root).
- Existing repo pattern (`createLazyView.ts`, `DashboardContainerView.tsx`) uses `next/dynamic` at module top level with `"use client";` on line 1 — the editor wrapper should match this exact convention.

No corrections needed; only a non-blocking recommendation to import `ScopedCssBaseline` from the root `@mui/material` (rather than the subpath) for consistency with how the rest of the codebase imports MUI components, and to keep the `const EmailEditor = dynamic(...)` statement at module top level (not inside the component function) so Next.js can preload the chunk.
