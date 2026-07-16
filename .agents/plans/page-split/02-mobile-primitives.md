# Plan 2: Build Mobile Page Primitives

## Context

Main orchestrator plan: `~/.cursor/plans/page_container_header_tier_split_3f98d657.plan.md`. Wave B plan, depends on Plan 3 (Wave A) which is COMPLETE — the shared base helpers exist:

- `frontend/common/components/ui/container/page/pageContainerCore.base.tsx` exports `PageContainerCore` + `PageContainerCoreProps`.
- `frontend/common/components/ui/container/page/pageHeaderCore.base.tsx` exports `PageHeaderCore`, `PageHeaderCoreProps`, `PageHeaderBreadcrumb`.

Import directly from the file paths (NOT from any barrel — they are internal-only).

## Existing reference

Read `frontend/mobile/components/ui/container/page/MobilePageHeader.tsx` (59 lines) — it currently imports `PageHeader` from `@/frontend/common/components/ui/container/page/PageHeader` and wraps it with mobile-specific styling (edge-to-edge padding, sticky behavior, default `titleVariant="headlineMd"`). You are MODIFYING this file to drop the `PageHeader` import (it's going away in Plan 8) and import `PageHeaderCore` instead.

## Goal

1. Modify MobilePageHeader to be self-contained — drop `import { PageHeader } from "@/frontend/common/components/ui/container/page/PageHeader"` and import `PageHeaderCore` from `pageHeaderCore.base.tsx`. Mobile-specific behavior (Box with edge-to-edge `px: {xs:2, md:3}, py: {xs:1, md:2}`, optional sticky position with `theme.zIndex.appBar`, default `titleVariant="headlineMd"`) stays in the wrapper.

2. Create new `MobilePageContainer.tsx` that wraps `PageContainerCore` plus mobile-specific layout (NO navbar progress bar, simpler structure).

3. Update `frontend/mobile/components/ui/container/page/index.ts` barrel to also export `MobilePageContainer`.

## File specs

### `frontend/mobile/components/ui/container/page/MobilePageContainer.tsx` (NEW)

```tsx
"use client";

import type { SxProps, Theme } from "@mui/material";
import type { ReactNode } from "react";
import { PageContainerCore } from "@/frontend/common/components/ui/container/page/pageContainerCore.base";

export interface MobilePageContainerProps {
  readonly sx?: SxProps<Theme>;
  readonly children: ReactNode;
}

// Mobile page wrapper. No navbar progress bar (mobile has no fixed 64px navbar).
// Outer padding/edge-to-edge layout is handled by DashboardLayout.pageMargin.
export function MobilePageContainer({ sx, children }: MobilePageContainerProps) {
  return <PageContainerCore sx={sx}>{children}</PageContainerCore>;
}
```

Notes:
- The wrapper is intentionally thin — it exists so mobile views import a tier-specific primitive (not the common PageContainer, which is going away). If you find you need mobile-specific layout (e.g. edge-to-edge overflow handling, safe-area-insets) add it here. Keep the wrapper's structure parallel to DesktopPageContainer for symmetry.
- Named export only. No default export.
- This is a regular `.tsx` file (NOT a `.mobile.tsx` tier-versioned file). It lives under `frontend/mobile/` but can import freely from `@/frontend/common/...` for the shared cores.

### `frontend/mobile/components/ui/container/page/MobilePageHeader.tsx` (MODIFY)

Current file (read it) does:

```
import { PageHeader } from "@/frontend/common/components/ui/container/page/PageHeader";
...
return (
  <Box sx={headerSx}>
    <PageHeader
      title={title}
      subtitle={subtitle}
      breadcrumbs={breadcrumbs}
      actions={actions}
      titleVariant="headlineMd"
    />
  </Box>
);
```

Change ONLY the import to use `PageHeaderCore` instead of `PageHeader`. Preserve everything else exactly:

- Same `MobilePageHeaderProps` interface (keep `edgeToEdge` and `sticky` props, `titleVariant` optional, `sx` optional)
- Same `headerSx` construction with `edgeToEdge` defaults `{ px: { xs: 2, md: 3 }, py: { xs: 1, md: 2 } }` and sticky `{ position: "sticky", top: 0, zIndex: theme => theme.zIndex.appBar, backgroundColor: theme => theme.palette.background.paper, borderBottom: theme => "1px solid " + theme.palette.divider }`
- Same passing of `titleVariant="headlineMd"` to the core
- Same `Box sx={headerSx}` wrapper with merge of `sx` prop

Do NOT change the props interface — current consumers depend on it. Just swap the underlying import.

The change is roughly:

```diff
- import { PageHeader } from "@/frontend/common/components/ui/container/page/PageHeader";
+ import { PageHeaderCore } from "@/frontend/common/components/ui/container/page/pageHeaderCore.base";
```

and

```diff
-     <PageHeader
+     <PageHeaderCore
```

	with everything else identical.

### `frontend/mobile/components/ui/container/page/index.ts` (MODIFY)

Current content:

```ts
export type { MobilePageHeaderProps } from "@/frontend/mobile/components/ui/container/page/MobilePageHeader";
export { MobilePageHeader } from "@/frontend/mobile/components/ui/container/page/MobilePageHeader";
```

Add `MobilePageContainer` exports:

```ts
export type { MobilePageContainerProps } from "@/frontend/mobile/components/ui/container/page/MobilePageContainer";
export { MobilePageContainer } from "@/frontend/mobile/components/ui/container/page/MobilePageContainer";
export type { MobilePageHeaderProps } from "@/frontend/mobile/components/ui/container/page/MobilePageHeader";
export { MobilePageHeader } from "@/frontend/mobile/components/ui/container/page/MobilePageHeader";
```

### `frontend/mobile/components/ui/container/index.ts` (VERIFY/MODIFY)

Read it first. Its current content is:

```ts
export type { MobileCardListProps, PaginationConfig } from "@/frontend/mobile/components/ui/container/MobileCardList";
export { MobileCardList } from "@/frontend/mobile/components/ui/container/MobileCardList";
export type { MobileContentStackProps } from "@/frontend/mobile/components/ui/container/MobileContentStack";
export { MobileContentStack } from "@/frontend/mobile/components/ui/container/MobileContentStack";
```

Add `export * from "@/frontend/mobile/components/ui/container/page";` so the top-level `@/frontend/mobile/components/ui` barrel picks up the page exports.

### `frontend/mobile/components/ui/container/page/MobilePageHeader.stories.tsx` (VERIFY)

The story file already exists. After your import swap from PageHeader → PageHeaderCore, the story should still work because `MobilePageHeader` keeps the exact same props and JSX. Read the story file to confirm it still imports `MobilePageHeader` by name — if so, no changes needed. Only modify it if it explicitly imports the common `PageHeader` directly (which would be a separate cleanup item — flag it but do NOT break the story).

## Verification

For each modified/created file run:
- `~/.bun/bin/bun tsgo` (full project)
- `~/.bun/bin/bun biome:check <path>` per file
- Lint queue submission:
  ```
  curl -s -X POST http://localhost:4777/lint -H "Content-Type: application/json" -d '{"id":"plan2-<file>","files":["<path>"]}'
  ```

The lint queue server should already be running from Plan 3. Verify with `curl -s http://localhost:4777/status`; start it if needed.

## Files to NOT modify

- The old `PageContainer.tsx` and `PageHeader.tsx` in common — leave in place; Plan 8 deletes them.
- The `*.base.tsx` shared cores from Plan 3.
- Any consumer file — that's Plans 5 and 7's job.
- Do NOT change the `MobilePageHeader` props interface (preserves consumer compat).

## Nested parallel subagents (optional)

If parallelizing: 3 nested subagents (MobilePageContainer new file, MobilePageHeader modify, barrel updates). The barrel updates can be done by one subagent since they're 2 small files. Each verifies its own files.

## Report when done

- Final contents (or path + summary) of each new/modified file
- Confirm tsgo, biome, lint-queue all pass for every file
- Any errors you couldn't fix

Do NOT proceed to Plan 5 (mobile import swap) — let the orchestrator dispatch it after Wave B completes.