# Plan 1: Build Desktop Page Primitives

## Context

Main orchestrator plan: `~/.cursor/plans/page_container_header_tier_split_3f98d657.plan.md`. Wave B plan, depends on Plan 3 (Wave A) which is COMPLETE — the shared base helpers exist:

- `frontend/common/components/ui/container/page/pageContainerCore.base.tsx` exports `PageContainerCore` + `PageContainerCoreProps` (renders Box with `display:flex; flexDirection:column; gap: theme.layout.sectionGap; width: 100%; position: relative` via `mergeSx`).
- `frontend/common/components/ui/container/page/pageHeaderCore.base.tsx` exports `PageHeaderCore`, `PageHeaderCoreProps`, `PageHeaderBreadcrumb`.

These helpers are internal-only — import directly from their file path, NOT from any barrel.

## Existing reference implementations

- The OLD `frontend/common/components/ui/container/page/PageContainer.tsx` (lines 1-65) — read it. It renders the desktop-specific LinearProgress loading bar at `top: 64px` (height of the navbar) using `useThemeMode().isThemeChanging` and `useLanguageSwitch().isPending`. You must preserve the SAME desktop loading bar behavior in `DesktopPageContainer`.
- The OLD `frontend/common/components/ui/container/page/PageHeader.tsx` — read it for the baseline JSX (already extracted into `PageHeaderCore`).

## Goal

Create the desktop-tier page UI primitives. They wrap the shared core helpers and add desktop-specific extras.

## Files to create

### `frontend/desktop/components/ui/container/page/DesktopPageContainer.tsx`

```tsx
"use client";

import { Box, LinearProgress, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import { useLanguageSwitch } from "@/frontend/common/hooks/useLanguageSwitch";
import { useThemeMode } from "@/frontend/common/hooks/useThemeMode";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { PageContainerCore } from "@/frontend/common/components/ui/container/page/pageContainerCore.base";

export interface DesktopPageContainerProps {
  readonly sx?: SxProps<Theme>;
  readonly children: ReactNode;
}

export function DesktopPageContainer({ sx, children }: DesktopPageContainerProps) {
  const { isThemeChanging } = useThemeMode();
  const { isPending: isLanguageChanging } = useLanguageSwitch();
  const showProgressBar = isThemeChanging || isLanguageChanging;

  return (
    <PageContainerCore sx={sx}>
      {showProgressBar ? (
        <Box
          sx={{
            position: "fixed",
            top: "64px",
            left: 0,
            right: 0,
            zIndex: theme => theme.zIndex.appBar + 1,
            height: "4px",
          }}
        >
          <LinearProgress
            sx={{
              width: "100%",
              height: "100%",
              "& .MuiLinearProgress-bar": {
                backgroundColor: theme => theme.palette.primary.main,
              },
            }}
          />
        </Box>
      ) : null}
      {children}
    </PageContainerCore>
  );
}
```

Notes:
- Default export NO. Named export `DesktopPageContainer` only.
- This file is NOT a `.desktop.tsx` tier-versioned file (the suffix-derived ESLint rules apply only to `.mobile.ts`/`.desktop.tsx` files). It lives under `frontend/desktop/` but has a regular `.tsx` extension. It can still import freely from `@/frontend/common/...` for the shared core helpers.
- Match the existing `PageContainer.tsx` JSDoc comment if helpful: "Standard page content wrapper. DashboardLayout already applies pageMargin — views must NOT add their own outer padding." Update to refer to DesktopPageContainer.

### `frontend/desktop/components/ui/container/page/DesktopPageHeader.tsx`

```tsx
"use client";

import type { TypographyProps } from "@mui/material/Typography";
import type { ReactNode } from "react";
import { PageHeaderCore, type PageHeaderBreadcrumb, type PageHeaderCoreProps } from "@/frontend/common/components/ui/container/page/pageHeaderCore.base";

export type { PageHeaderBreadcrumb };

export interface DesktopPageHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly titleVariant?: TypographyProps["variant"];
  readonly breadcrumbs?: readonly PageHeaderBreadcrumb[];
  readonly actions?: ReactNode;
}

export function DesktopPageHeader({ title, subtitle, titleVariant = "headlineLg", breadcrumbs, actions }: DesktopPageHeaderProps) {
  return (
    <PageHeaderCore
      title={title}
      subtitle={subtitle}
      titleVariant={titleVariant}
      breadcrumbs={breadcrumbs}
      actions={actions}
    />
  );
}
```

Notes:
- Desktop uses `titleVariant="headlineLg"` as default (same as the current common `PageHeader`).
- DesktopPageHeader is a thin wrapper around PageHeaderCore — it exists primarily to (a) be the desktop tier public API and (b) potentially differentiate later (e.g. desktop-specific default breadcrumb behavior). Re-export the `PageHeaderBreadcrumb` type so consumers don't need to import it from a different location.

### `frontend/desktop/components/ui/container/page/index.ts` (new barrel)

```ts
export type { DesktopPageContainerProps } from "@/frontend/desktop/components/ui/container/page/DesktopPageContainer";
export { DesktopPageContainer } from "@/frontend/desktop/components/ui/container/page/DesktopPageContainer";
export type { DesktopPageHeaderProps, PageHeaderBreadcrumb } from "@/frontend/desktop/components/ui/container/page/DesktopPageHeader";
export { DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page/DesktopPageHeader";
```

### `frontend/desktop/components/ui/container/index.ts` (new barrel)

Currently MISSING on disk (per Plan 8 findings the entire `frontend/desktop/components/ui/index.ts` is missing). Create it:

```ts
export * from "@/frontend/desktop/components/ui/container/page";
```

(If other desktop container primitives need to be added later, they can be appended.)

### `frontend/desktop/components/ui/index.ts` (NEW top-level barrel — currently missing)

```ts
// Top-level desktop UI primitives barrel
export * from "@/frontend/desktop/components/ui/container";
export * from "@/frontend/desktop/components/ui/filter";
export * from "@/frontend/desktop/components/ui/input/localizedString";
```

Verify that the following existing per-group barrels exist before referencing them:
- `frontend/desktop/components/ui/filter/index.ts`
- `frontend/desktop/components/ui/input/localizedString/index.ts`

Read them first to confirm their exact exports (e.g., `DateNavigatorDesktop`, `LocaleAdornmentSwitchDesktop`, `LocalizedStringDrawerDesktop`). If the per-group barrels already exist and export those, your top-level `index.ts` should just `export *` them.

## Verification

For each new file run:
- `~/.bun/bin/bun tsgo` (full project; safe to run concurrently)
- `~/.bun/bin/bun biome:check <path>` per file
- Lint queue submission:
  ```
  curl -s -X POST http://localhost:4777/lint -H "Content-Type: application/json" -d '{"id":"plan1-<file>","files":["<path>"]}'
  ```

The lint queue server should already be running from Plan 3. Verify with `curl -s http://localhost:4777/status` first — if `running: false` or connection refused, start it: `~/.bun/bin/bun run scripts/lint-queue-server.ts &` (background it with `block_until_ms: 0`, then sleep 2s then check status).

## Files to NOT modify

- The old `PageContainer.tsx` and `PageHeader.tsx` in common — leave them in place. Plan 8 will delete them.
- The shared `*.base.tsx` helpers from Plan 3 — they are done.
- Any consumer file — that's Plans 4 and 6's job.

## Nested parallel subagents (optional)

If you want to parallelize: dispatch 5 nested subagents (one per file: DesktopPageContainer, DesktopPageHeader, page/index.ts, container/index.ts, ui/index.ts). Each verifies its own file. The 3 barrel files are tiny; the 2 component files are the bulk of the work. Use subagent_type="generalPurpose" for the two component files; barrels can be done inline or via quick subagents.

## Report when done

Report:
- Final contents (or path + summary) of each new file
- Confirm tsgo, biome, lint-queue all pass for every new file
- Any errors you couldn't fix

Do NOT proceed to Plan 4 (desktop import swap) — let the orchestrator dispatch it after Wave B completes.