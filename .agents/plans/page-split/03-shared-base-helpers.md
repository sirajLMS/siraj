# Plan 3: Extract Shared Base Helpers (`*.base.tsx`)

## Context

The main orchestrator plan is at `~/.cursor/plans/page_container_header_tier_split_3f98d657.plan.md`.

This is the foundational Wave A plan. It MUST complete before Plans 1 (desktop primitives) and 2 (mobile primitives) run. The base helpers extracted here will be imported by the tier wrappers to avoid duplicating the shared layout logic.

## Existing source files you are refactoring

- `frontend/common/components/ui/container/page/PageContainer.tsx` (lines 1-65) — currently contains shared `Box` with `display: flex; flexDirection: column; gap: sectionGap; width: 100%; position: relative`, plus the theme/language change LinearProgress loading overlay at `top: 64px`.
- `frontend/common/components/ui/container/page/PageHeader.tsx` (lines 1-95) — currently contains shared `Breadcrumbs` + `Typography title` + `Typography subtitle` + `actions` row.

Read both files in full before editing.

## Goal

Extract two **internal-only helper modules** that contain only the truly shared rendering logic. They MUST NOT be exported from any public barrel — they are consumed only by the tier wrappers (`DesktopPageContainer`, `MobilePageContainer`, `DesktopPageHeader`, `MobilePageHeader`).

## Files to create

### `frontend/common/components/ui/container/page/pageContainerCore.base.tsx`

A non-component helper exporting a typed `PageContainerCoreProps` interface and a `PageContainerCore` React component that renders only:

```tsx
"use client";

import { Box, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";

export interface PageContainerCoreProps {
  readonly sx?: SxProps<Theme>;
  readonly children: ReactNode;
}

// INTERNAL: Do not import outside of tier wrappers (DesktopPageContainer / MobilePageContainer).
export function PageContainerCore({ sx, children }: PageContainerCoreProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: theme => theme.layout.sectionGap,
        width: "100%",
        position: "relative",
      }}
    >
      {children}
    </Box>
  );
}
```

Note: this base does NOT include the LinearProgress loading bar (that is desktop-specific because it assumes a 64px navbar). Tier wrappers add their own `sx` overrides and loading affordances.

### `frontend/common/components/ui/container/page/pageHeaderCore.base.tsx`

A non-component helper exporting `PageHeaderCoreProps`, `PageHeaderBreadcrumb`, and a `PageHeaderCore` React component that renders the title + breadcrumbs + subtitle + actions row. This component must accept a `titleVariant` prop (default `headlineLg`) so tier wrappers can override it (mobile uses `headlineMd`).

Shape (replace with the actual JSX from the existing `PageHeader.tsx`, parameterized):

```tsx
"use client";

import { ChevronRightOutlined } from "@mui/icons-material";
import { Box, Breadcrumbs, Link, Typography } from "@mui/material";
import type { TypographyProps } from "@mui/material/Typography";
import type { ReactNode } from "react";

export interface PageHeaderBreadcrumb {
  readonly label: string;
  readonly href?: string;
  readonly current?: boolean;
}

export interface PageHeaderCoreProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly titleVariant?: TypographyProps["variant"];
  readonly breadcrumbs?: readonly PageHeaderBreadcrumb[];
  readonly actions?: ReactNode;
}

// INTERNAL: Do not import outside of tier wrappers (DesktopPageHeader / MobilePageHeader).
export function PageHeaderCore({ title, subtitle, titleVariant = "headlineLg", breadcrumbs, actions }: PageHeaderCoreProps) {
  // ... same JSX as the current PageHeader.tsx body ...
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {/* breadcrumbs rendering — identical to current PageHeader.tsx */}
        <Typography variant={titleVariant} sx={theme => ({ color: theme.palette.primary.main })}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="bodyLg" sx={theme => ({ color: theme.palette.text.secondary, marginInlineStart: 2 })}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {actions ? <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>{actions}</Box> : null}
    </Box>
  );
}
```

## Files to NOT modify (in this plan)

- The existing `PageContainer.tsx` and `PageHeader.tsx` files stay in place for now — Plans 1, 2 import your `*.base.tsx` helpers but the tier wrappers can be built even while the old common files still exist. Plan 8 deletes the common `PageContainer.tsx`/`PageHeader.tsx` after all consumers are migrated.

- Do NOT modify the barrel `frontend/common/components/ui/container/page/index.ts` to export these new helpers. They are internal-only. Leave the barrel as-is (it still re-exports the existing `PageContainer`/`PageHeader` until Plan 8 removes those exports).

## Acceptance criteria

1. Both `*.base.tsx` files exist and pass `bun tsgo` for the file.
2. Both pass `bun biome:check`.
3. Both pass lint queue: `curl -s -X POST http://localhost:4777/lint -H "Content-Type: application/json" -d '{"id":"plan3","files":["frontend/common/components/ui/container/page/pageContainerCore.base.tsx","frontend/common/components/ui/container/page/pageHeaderCore.base.tsx"]}'` returns `success: true`.
4. Neither file is exported from any barrel.

## Nested parallel subagents (optional)

If you decide to parallelize, you can dispatch two nested subagents (one per `*.base.tsx` file) — they are disjoint. Each runs `scripts/health/sub-loop.ts <file> --lifecycle lint` to verify.

## When you are done

Report: list the two files created (or modified), confirm the acceptance criteria, and end. Do NOT proceed to Plan 1 or Plan 2 — let the orchestrator dispatch them.
