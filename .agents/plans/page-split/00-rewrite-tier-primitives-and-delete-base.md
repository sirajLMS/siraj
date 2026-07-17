# Plan A: Rewrite Tier Primitives (Inline Logic) and Delete Base Helpers

## Context

Main orchestrator plan: `~/.cursor/plans/true_tier_split_v2_4fcef152.plan.md`.

This is the FIRST plan to execute — its completion is a prerequisite for Plans B-G (because those plans create mobile/desktop views that import the new self-contained tier wrappers).

## Background — what is already on disk (DO NOT redo from scratch)

Plan 3 earlier created two shared "base helper" files in common, and Plans 1+2 created tier wrappers that import them. The user's revised architecture has forbidden shared-base components between tiers; each tier must own its full JSX. So:

- `frontend/common/components/ui/container/page/pageContainerCore.base.tsx` EXISTS — DELETE IT.
- `frontend/common/components/ui/container/page/pageHeaderCore.base.tsx` EXISTS — DELETE IT.
- `frontend/desktop/components/ui/container/page/DesktopPageContainer.tsx` EXISTS — currently imports `PageContainerCore`. REWRITE to inline the Box layout + the desktop LinearProgress loading bar. NO import of any `*.base.tsx`.
- `frontend/desktop/components/ui/container/page/DesktopPageHeader.tsx` EXISTS — currently imports `PageHeaderCore`. REWRITE to inline the Breadcrumbs + Typography JSX. NO import of any `*.base.tsx`.
- `frontend/mobile/components/ui/container/page/MobilePageContainer.tsx` EXISTS — currently imports `PageContainerCore`. REWRITE to inline the Box layout (no LinearProgress for mobile). NO import of any `*.base.tsx`.
- `frontend/mobile/components/ui/container/page/MobilePageHeader.tsx` EXISTS — currently imports `PageHeaderCore`. REWRITE to inline the Breadcrumbs + Typography JSX inside the `Box sx={headerSx}` wrapper (preserve edge-to-edge / sticky props and `titleVariant="headlineMd"` default). NO import of any `*.base.tsx`.

The existing barrels are correct:
- `frontend/desktop/components/ui/container/page/index.ts`
- `frontend/desktop/components/ui/container/index.ts`
- `frontend/desktop/components/ui/index.ts`
- `frontend/mobile/components/ui/container/page/index.ts` (exports `MobilePageContainer` and `MobilePageHeader`)
- `frontend/mobile/components/ui/container/index.ts` (re-exports `./container/page`)
- `frontend/mobile/components/ui/index.ts`

Do NOT modify any barrel — only the 4 component files and the 2 deletions.

## Reference source for inlining

Read the OLD `frontend/common/components/ui/container/page/PageContainer.tsx` (lines 1-65) — it's the desktop-flavored original (LinearProgress at `top: 64px`). Its JSX:
- Box with `sx={mergeSx({ display: "flex", flexDirection: "column", gap: theme => theme.layout.sectionGap, width: "100%", position: "relative" }, sx)}`
- Conditional `Box` (showProgressBar = isThemeChanging || isLanguageChanging) with `position: "fixed"; top: "64px"; left: 0; right: 0; zIndex: theme => theme.zIndex.appBar + 1; height: "4px"` containing a `LinearProgress` with `& .MuiLinearProgress-bar` backgroundColor `theme => theme.palette.primary.main`
- `{children}`

Read the OLD `frontend/common/components/ui/container/page/PageHeader.tsx` (lines 1-95) — it contains the full shared JSX:
- Outer Box with `display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 2`
- Inner Box with `display: "flex", flexDirection: "column", gap: 0.5`
- Conditional Breadcrumbs (when breadcrumbs?.length > 0) with `ChevronRightOutlined` separator (sx callback with `fontSize: 14, color: theme.palette.text.secondary`), `sx={{ mb: 1 }}`
- For each crumb: if `current` → Typography `variant="labelMd"` with `color: theme.palette.primary.main, fontWeight: 700`; if `href` → Link `underline="hover" variant="labelMd"` with `color: theme.palette.text.secondary`; else Typography `variant="labelMd"` with `color: theme.palette.text.secondary`
- Title Typography `variant={titleVariant}` with `color: theme.palette.primary.main`
- Optional subtitle Typography `variant="bodyLg"` with `color: theme.palette.text.secondary, marginInlineStart: 2`
- Optional actions Box with `display: "flex", gap: 1.5, flexWrap: "wrap"`

## Files to MODIFY (write self-contained — NO `*.base.tsx` imports)

### `frontend/desktop/components/ui/container/page/DesktopPageContainer.tsx`

Self-contained desktop wrapper. Inline everything from the existing common `PageContainer.tsx` JSX. Keep the `DesktopPageContainerProps` interface (`sx?`, `children`), named export `"use client"`. Imports:
- `Box`, `LinearProgress`, `SxProps`, `Theme` from `@mui/material`
- `ReactNode` from `react`
- `useLanguageSwitch` from `@/frontend/common/hooks/useLanguageSwitch`
- `useThemeMode` from `@/frontend/common/hooks/useThemeMode`
- `mergeSx` from `@/frontend/common/utils/sx/mergeSx`

(No import of `PageContainerCore`.)

### `frontend/desktop/components/ui/container/page/DesktopPageHeader.tsx`

Self-contained desktop header. Inline the full Breadcrumbs/Link/Typography JSX from the common `PageHeader.tsx`. Default `titleVariant = "headlineLg"`. Imports:
- `ChevronRightOutlined` from `@mui/icons-material`
- `Box`, `Breadcrumbs`, `Link`, `Typography` from `@mui/material`
- `TypographyProps` from `@mui/material/Typography`
- `ReactNode` from `react`

(No import of `PageHeaderCore`.) Preserve the existing JSDoc comment if helpful.

### `frontend/mobile/components/ui/container/page/MobilePageContainer.tsx`

Self-contained mobile wrapper. Inline the Box layout (without LinearProgress — mobile has no fixed 64px navbar). The body MUST differ structurally from desktop (mobile keeps the simpler Box-only shape; desktop has the loading bar). Imports:
- `Box`, `SxProps`, `Theme` from `@mui/material`
- `ReactNode` from `react`
- `mergeSx` from `@/frontend/common/utils/sx/mergeSx`

(No import of `PageContainerCore`.) The desktop and mobile containers must differ — the desktop has the LinearProgress loading bar, mobile doesn't.

### `frontend/mobile/components/ui/container/page/MobilePageHeader.tsx`

Self-contained mobile header. Inline the full Breadcrumbs/Link/Typography JSX from the common `PageHeader.tsx` INSIDE the existing `Box sx={headerSx}` wrapper. Preserve:
- `MobilePageHeaderProps` interface (do NOT change — keep `title`, `subtitle?`, `titleVariant?`, `breadcrumbs?`, `actions?`, `edgeToEdge? = true`, `sticky? = false`, `sx?`)
- The `headerSx` construction (edge-to-edge `px: {xs:2, md:3}, py: {xs:1, md:2}` and sticky `position: "sticky", top: 0, zIndex: theme => theme.zIndex.appBar, backgroundColor: theme => theme.palette.background.paper, borderBottom: theme => "1px solid " + theme.palette.divider`)
- Default `titleVariant="headlineMd"` passed to the inlined header JSX (this is the mobile-specific default that differs from desktop's `headlineLg`)

Imports:
- `ChevronRightOutlined` from `@mui/icons-material`
- `Box`, `Breadcrumbs`, `Link`, `Typography`, `SxProps`, `Theme` from `@mui/material`
- `TypographyProps` from `@mui/material/Typography`
- `ReactNode` from `react`

## Files to DELETE

- `frontend/common/components/ui/container/page/pageContainerCore.base.tsx`
- `frontend/common/components/ui/container/page/pageHeaderCore.base.tsx`

Use the `Delete` tool for each. Either order is fine.

## Files NOT to modify

- The OLD `frontend/common/components/ui/container/page/PageContainer.tsx` and `PageHeader.tsx` — leave them in place; Plan H deletes them later (after all consumers migrate).
- The existing barrels listed above.
- Any consumer file (no `.mobile.tsx` / `.desktop.tsx` view files).
- Anything else.

## Verification

For each modified file run:
1. `~/.bun/bin/bun tsgo` (full project — read-only, safe)
2. `~/.bun/bin/bun biome:check <path>`
3. Lint queue: ensure server running (`curl -s http://localhost:4777/status`); if not, start `~/.bun/bin/bun run scripts/lint-queue-server.ts &` in background and wait 2s. Then:
   ```
   curl -s -X POST http://localhost:4777/lint -H "Content-Type: application/json" -d '{"id":"planA-<file>","files":["<path>"]}'
   ```

Files to verify (4):
- `frontend/desktop/components/ui/container/page/DesktopPageContainer.tsx`
- `frontend/desktop/components/ui/container/page/DesktopPageHeader.tsx`
- `frontend/mobile/components/ui/container/page/MobilePageContainer.tsx`
- `frontend/mobile/components/ui/container/page/MobilePageHeader.tsx`

Also confirm via grep that nothing else in the codebase still imports `pageContainerCore.base` or `pageHeaderCore.base` — after the deletions, that grep should return zero.

If any verifier reports errors, fix the 4 component files and re-verify. Do NOT modify the old common files.

## Nested parallel subagents (RECOMMENDED)

To parallelize: dispatch 4 nested `Task` subagents (`subagent_type: "generalPurpose"`) — one per component file — in a single message. Each subagent has a small concrete prompt: rewrite the file per the spec above, verify with tsgo+biome+lint-queue, report.

Separately, after all 4 rewrites pass, you (the Plan A parent) delete the 2 `*.base.tsx` files via the `Delete` tool yourself — no nested subagent needed for deletions.

## Report when done

- Final contents (or path + summary) of each of the 4 rewritten files
- Confirmation that the 2 `*.base.tsx` files are deleted (zero remaining references to them)
- Confirm tsgo, biome, lint-queue all pass for every rewritten file
- Any errors you couldn't fix

Do NOT proceed to Plan B-G. Stay within Plan A's scope. Finish and report.
