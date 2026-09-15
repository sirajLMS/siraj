# Performance Improvement Plan — Parallel Subagent Execution

**Goal:** LCP <2.5s P75 (current 11.11s, worst 16.21s on `/dashboard`), INP <200ms (current 352ms).

**Started:** 2026-07-27.

**Execution model:** Parallel subagents (max 8 concurrent). Strict per-wave file-ownership isolation — no two subagents in the same wave edit the same file. Each subagent runs the per-file verification loop (`scripts/health/sub-loop.ts`) on its assigned files before declaring done. Orchestrator runs full `bun quality-gate` only between waves.

---

## Diagnosis (root causes)

### LCP — 11.11s P75 (16.21s on `/dashboard`)

1. **Static chrome forced through `"use client"`** — `DashboardLayout`, `TopNavbar`, sidebar, and `DesktopPageHeader` (the LCP `<Typography variant="headlineLg">`) are all client components gated behind `next/dynamic` + Suspense. They could render server-side but currently require 3–4 chunk round-trips before paint.
2. **No streaming** — zero `loading.tsx`/`error.tsx`/`not-found.tsx` in the entire `app/` tree (the single Suspense fallback is a bare `CircularProgress`).
3. **Render-blocking Google Fonts** — `app/index.css:1` previously used `@import url("https://fonts.googleapis.com/...")` instead of `next/font`. Every text render waited on a runtime external request.
4. **Apollo `me` fetched 3× before role dispatch** — `DashboardClientBridge:39` (polling), `UserStoreInitializer`, and again in `useDashboardContainerViewModel:53`. Role determination blocked on this round-trip, so the page rendered `"Loading..."` until all three resolved.
5. **Blocking client loaders** — `AppApolloProvider` and `AuthProvider` rendered full-viewport `<CircularProgress>`/error screens before any page content, instead of streaming children.

### INP — 352ms P75

6. **`TeacherDashboardContainer` is 483 lines** with 6 `useState` (should be Zustand per AGENTS.md), 6 mutations, and 2 queries registered on mount — heavy hydration work in one client component.
7. **`ColorSchemeStateBridge` `useEffect` imperatively mutates `<html>`** (writes `data-theme`, `lang`, `dir`, `colorScheme`) on every render — layout thrashing on hydration.

---

## Current state (verified from uncommitted changes)

| Item | Status | Notes |
|---|---|---|
| A. Fonts via `next/font/google` | ⚠️ **Partial** | `app/layout.tsx` loads `Inter` + `Hanken_Grotesk` with `variable: "--font-..."` and `className` on `<html>` (documented CSS-variable pattern in `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md`). `app/index.css` `@import` removed. **But `typography.ts` + `components.ts:260` still hardcode `'"Hanken Grotesk", "Inter", ...'` — the CSS vars aren't consumed, so fonts load but aren't applied.** |
| B. Route loading skeletons | ✅ | `app/(dashboard)/loading.tsx` + `app/(dashboard)/dashboard/loading.tsx` added with MUI `Skeleton`. |
| D. Dedup `me` in dashboard VM | ✅ | `useDashboardContainerViewModel` reads `userStore` synchronously; `loading: false`. Dead `loading` branch + `onRetry` remain in tier views. |
| F (partial). Apollo client unblocked | ✅ | `AppApolloProvider` builds client at module scope; only confirmed-offline blocks. |

---

## Pending waves

### Wave 1 — Finish font migration + dead-code cleanup (LCP)

**Subagents (4 in parallel — fully disjoint file ownership):**

| Subagent | Files | Task |
|---|---|---|
| **1-A Typography wiring** | `frontend/common/providers/theme/typography.ts` | Replace all 18 `fontFamily` literals: `'"Hanken Grotesk", "Inter", "Segoe UI", sans-serif'` → `'var(--font-hanken-grotesk), var(--font-inter), "Segoe UI", sans-serif'`; `'"Hanken Grotesk", sans-serif'` → `'var(--font-hanken-grotesk), sans-serif'`; `'"Inter", sans-serif'` → `'var(--font-inter), sans-serif'`. |
| **1-B Components + dead tier-view code** | `frontend/common/providers/theme/components.ts`, `frontend/mobile/views/dashboard/dashboard/dashboard.mobile.tsx`, `frontend/desktop/views/dashboard/dashboard/dashboard.desktop.tsx` | Same `fontFamily` replacement in `components.ts:260`. Strip dead `loading` branch + `onRetry` prop usage from both dashboard tier views (since `loading` is now always `false`). |
| **1-C Variable font optimization** | `app/layout.tsx` | Switch the uncommitted `Inter` + `Hanken_Grotesk` from `weight: ["400","500","600","700"]` (4 @font-face files per family) to a single variable axis range (`weight: "100 900"`). Per docs (`node_modules/next/dist/docs/.../font.md:250-251`): "We recommend using variable fonts for the best performance and flexibility." Verify `subsets: ["latin", "latin-ext"]` stays (i18n needs Latin Extended). |
| **1-D Dead-dep removal (optional, low risk)** | `package.json` | Remove unused `lodash ^4.18.1` (zero `from 'lodash'` imports in source — verified), `@mui/lab ^9.0.0-beta.6` (zero imports), `@mui/styles ^6.4.8` (zero imports), and corresponding `@types/lodash`. Run `~/.bun/bin/bun install` to update lockfile. |

**Verification (per subagent):** `bun run scripts/health/sub-loop.ts <file> --lifecycle lint` (tsgo → biome → lint via queue client, short-circuits at first failure).

**Orchestrator after wave:** `bun quality-gate` (resumes from last stage). Visual smoke test: dashboard renders with correct heading + body fonts (no fallback sans-serif) at expected weights via browser devtools Computed Styles.

**Wave 1 cross-file deps:** None — all 4 subagents touch disjoint files.

---

### Wave 2 — Hoist LCP text into Server Components (LCP, biggest remaining win)

**i18n pattern:** Server Components use `getTranslations(locale).<namespace>` from `@/shared/locale/server` and `getLocale()` from `@/shared/locale/server-cookies` (matches the existing `DashboardLayoutContainer` and `app/layout.tsx` `generateMetadata` pattern). `next-intl` does NOT exist in this repo — see Wave 5 for the dead-reference cleanup.

**Subagents (6 in parallel — disjoint file ownership; the navbar split has an internal sub-step described in 2-C):**

| Subagent | Files | Task |
|---|---|---|
| **2-A DesktopPageHeader → Server Component** | `frontend/desktop/components/ui/container/page/DesktopPageHeader.tsx` | Convert to async Server Component (currently pure presentational, default `titleVariant="headlineLg"`, no hooks). i18n via `getTranslations(locale).<namespace>` from `@/shared/locale/server`. **Output a CROSS-FILE DEPENDENCY report** listing importers that are themselves client components (they'll need a thin client wrapper or move to a server boundary). Don't edit importers — just report. |
| **2-B MissedClassAlertBanner desktop → Server** | `frontend/desktop/views/dashboard/teachers/dashboard/components/missedClassAlertBanner.desktop.tsx` | Move `missedRow` read up to a cached `React.cache` wrapper around the existing teacher dashboard service; pass resolved row as prop. The `<Alert>` + `<Typography>` children render server-side; only the interactive dismiss action stays in a small client island `<DismissButton />` (new file: `frontend/desktop/views/dashboard/teachers/dashboard/components/dismissAlertButton.desktop.tsx`). Keep `position: fixed` overlay. |
| **2-C MissedClassAlertBanner mobile → Server** | `frontend/mobile/views/dashboard/teachers/dashboard/components/missedClassAlertBanner.mobile.tsx`, `frontend/mobile/views/dashboard/teachers/dashboard/components/dismissAlertButton.mobile.tsx` | Same pattern as 2-B but mobile tier. New `dismissAlertButton.mobile.tsx` for the dismiss action. |
| **2-D Navbar static shell split (server)** | `frontend/common/views/dashboard/components/DashboardLayoutContainer.tsx`, new file `frontend/common/views/dashboard/components/navbar/NavbarStaticShell.tsx` | Render the static navbar chrome (logo, app title, layout container) server-side via MUI `Box`/`Toolbar` primitives inside `DashboardLayoutContainer`. New `NavbarStaticShell.tsx` is the server-rendered shell. **Do not edit `topNavbar.desktop.tsx` or `dashboardLayout.desktop.tsx` — those are 2-E's files.** |
| **2-E TopNavbar desktop client-island split** | `frontend/desktop/views/dashboard/components/topNavbar.desktop.tsx`, new file `frontend/desktop/views/dashboard/components/topNavbarIsland.desktop.tsx` | Split into a Server-Component shell (logo + title + layout) and a client island `topNavbarIsland.desktop.tsx` for notification badge, user menu, theme toggle, mobile sidebar toggle. The shell renders inside `NavbarStaticShell` (2-D). The island is mounted where interactive bits are needed. **ESLint gotcha:** `.mobile.tsx`/`.desktop.tsx` files must NOT import `useMediaQuery`/`useViewport`. |
| **2-F DashboardLayout desktop client-island split** | `frontend/desktop/views/dashboard/components/dashboardLayout.desktop.tsx`, new file `frontend/desktop/views/dashboard/components/dashboardLayoutIsland.desktop.tsx` | Same split as 2-E but for the layout shell (sidebar, scroll area). New `dashboardLayoutIsland.desktop.tsx` for client-only interactive bits. The static markup moves to `NavbarStaticShell` (2-D). |

**Verification (per subagent):** `bun run scripts/health/sub-loop.ts <file> --lifecycle lint`.

**Orchestrator after wave:** `bun quality-gate`. Manual smoke test: dashboard navbar + page title render in initial HTML (view-source / devtools Network → doc response includes the markup), not only post-hydration.

**Wave 2 cross-file deps:** None at subagent boundary — each owns disjoint files. 2-B→2-C share the dismiss-button concept but in disjoint tier files. 2-D produces `NavbarStaticShell.tsx`; 2-E and 2-F consume it but only need it to exist at module-resolution time, not edit it. **Orchestrator dispatches 2-A through 2-F simultaneously**; any failure mid-wave is reported with the CORS-FILE DEPENDENCY format for next-wave coordination.

---

### Wave 3 — Provider unblock + streaming + config (LCP tail + bundle size)

**Verified via `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/optimizePackageImports.md`:** Next.js 16.2.10 auto-optimizes 27 packages by default — including `@mui/material` and `@mui/icons-material` (lines 39–40). Adding them to `experimental.optimizePackageImports` is redundant. The valid additions for this project are:
- `@mui/x-data-grid` — heavily used (63 import sites confirmed; not in default list)
- `@mui/x-date-pickers` — used via subpath imports (`@mui/x-date-pickers/DatePicker` etc.; not in default list)

Packages verified NOT to import (dead deps already removed in Wave 1-D): `lodash`, `@mui/lab`, `@mui/styles`. Do NOT add any of these.

**Subagents (3 in parallel — disjoint file ownership):**

| Subagent | Files | Task |
|---|---|---|
| **3-E optimizePackageImports** | `next.config.ts` | Add `experimental: { optimizePackageImports: ["@mui/x-data-grid", "@mui/x-date-pickers"] }`. **Do NOT add `@mui/material`, `@mui/icons-material` (already default per docs), `lodash` (dead dep).** |
| **3-F2 Unblock AuthProvider** | `frontend/common/providers/apollo/AuthProvider.tsx` | Stop rendering full-viewport `LoadingUI` while the mount-time `refreshToken` resolves. Render `children` immediately inside `<Suspense>`; refresh runs in background `useEffect`. The full-viewport error UI only shows on actual refresh failure, not in-flight. Coordinate with `useAuthRecoveryRegistration` from `AppApolloProvider`. |
| **3-G Suspense streaming around role containers** | `frontend/common/views/dashboard/dashboard/DashboardContainerView.tsx`, new file `frontend/common/views/dashboard/dashboard/DashboardRoleSkeleton.tsx` | Wrap each role-specific `<XxDashboardContainer>` in `<Suspense fallback={<DashboardRoleSkeleton />}>`. New `DashboardRoleSkeleton.tsx` mirrors the metric grid layout (consistent with `app/(dashboard)/dashboard/loading.tsx`). |

**Verification (per subagent):** `bun run scripts/health/sub-loop.ts <file> --lifecycle lint`.

**Orchestrator after wave:** `bun quality-gate`.

---

### Wave 4 — INP fixes

**Subagents (2 in parallel — disjoint file ownership):**

| Subagent | Files | Task |
|---|---|---|
| **4-H Extract TeacherDashboardContainer** | `frontend/common/views/dashboard/teachers/dashboard/TeacherDashboardContainer.tsx` (483 lines); new sub-components under `frontend/common/views/dashboard/teachers/dashboard/components/`; new Zustand store `frontend/common/stores/teacherDashboardStore.ts` | Slice into sub-components: `TeacherDashboardHeader`, `TeacherDashboardMetricsIsland`, `TeacherScheduleIsland`, `TeacherHandbookIsland`, etc. Move 6 `useState` hooks (lines 200–205) into the new Zustand store (per AGENTS.md mandate — mutable state must live in Zustand for tier-switch survival). Move 6 mutations into their respective feature islands so they only register when the island mounts. Target: coordinator file < 150 lines (CodeScene "Perfect Health"). Run `bun run tsgo` to verify type safety. This subagent may dispatch its own exploration sub-sub-agents (max 2 concurrent) for the sub-component extraction, but file ownership stays with 4-H. |
| **4-I Throttle ColorSchemeStateBridge** | `frontend/common/providers/theme/ThemeProvider.tsx` (lines 42–48) | Switch `useEffect` → `useLayoutEffect`; deep-diff against a ref before writing; batch all 4 attribute writes (`data-theme`, `colorScheme`, `lang`, `dir`) into a single DOM mutation pass. |

**Verification (per subagent):** `bun run scripts/health/sub-loop.ts <file> --lifecycle lint`.

**Orchestrator after wave:** `bun quality-gate` (full run adds CodeScene + Sonar stages — important here because Wave 4-H touches a 483-line file with potential CodeScene health regression).

---

### Wave 5 — Dead `next-intl` reference cleanup

`next-intl` does NOT exist in this repo. Verified:
- `package.json` — no `next-intl` dependency, no dev dependency, no transitive intl deps (only `@formatjs/intl-*` runtime helpers under MUI/Apollo).
- All `.ts`/`.tsx`/`.js`/`.mjs` source — zero imports of `next-intl`, `@next-intl/*`, or `useTranslations` from `next-intl`.
- `shared/messages/` directory does NOT exist (only `shared/locale/`).

The `shared/AGENTS.md:75` migration narrative and the `shared/messages/` references are stale doc artifacts. Every remaining `next-intl` mention is a **dead reference** — not legacy, not partial migration. Cleanup is purely removing false documentation that misleads AI agents into suggesting non-existent APIs.

**Subagents (5 in parallel — grouped for file-ownership isolation, max 8 concurrency):**

| Subagent | Files (all doc-only) | Task |
|---|---|---|
| **5-1 Root project docs** | `AGENTS.md`, `app/AGENTS.md`, `shared/AGENTS.md` | Update i18n description and "Legacy" blocks: `next-intl` is gone, `shared/messages/` is gone, only `shared/locale/` exists. `app/AGENTS.md` lines 104–105: `getTranslations()` from `next-intl/server` → `getTranslations(locale)` from `@/shared/locale/server`; delete `getMessages()` bullet. `shared/AGENTS.md` lines 75–81, 129, 142, 234: remove "migrating from next-intl" framing; delete `next-intl` import examples and "Legacy intact" note. |
| **5-2 Layer AGENTS.md (backend + frontend)** | `backend/services/AGENTS.md`, `backend/db/repo/AGENTS.md`, `backend/graphql/AGENTS.md`, `backend/db/test/AGENTS.md`, `frontend/views/AGENTS.md` | Replace `next-intl` (via `getBackendTranslations`) with the actual `shared/locale` error-message system in the three backend files. `backend/db/test/AGENTS.md` line 118: remove the "next-intl translation loader hang" justification (no loader exists). `frontend/views/AGENTS.md` line 52: drop `NextIntlClientProvider` Storybook wrapper claim; verify actual Storybook wrapper before rewriting. |
| **5-3 Instruction files** | `.agents/instructions/frontend.instructions.md`, `.agents/instructions/backend.instructions.md`, `.agents/instructions/tests.instructions.md` | `frontend.instructions.md` lines 65–66, 148–151: replace `next-intl` server/client patterns with `@/shared/locale/server` / `@/shared/locale/client` (`useAppTranslation`). `backend.instructions.md` line 69: replace `getBackendTranslations from next-intl` with current `shared/locale` backend surface. `tests.instructions.md` line 29: remove or rewrite the `getBackendTranslations` / next-intl loader-hang note. |
| **5-4 Agent + skill definition files** | `.agents/agents/review-frontend.agent.md`, `.agents/agents/review-backend.agent.md`, `.agents/agents/review-config.agent.md`, `.agents/skills/review-frontend/SKILL.md`, `.agents/skills/review-config/SKILL.md`, `.agents/skills/plan-review/SKILL.md` | Replace `next-intl` checks with `shared/locale` checks in all listed files. `plan-review/SKILL.md` line 42: replace "All user-facing strings must use `next-intl`" with the `shared/locale` rule. |
| **5-5 Other stale references** | `frontend/views/auth/login/README.md`, `frontend/page-prompt.md`, `frontend/STYLED_COMPONENTS_REFACTORING_GUIDE.md`, `frontend/IMPLEMENTATION_PLAN.md`, `frontend/IMPLEMENTATION_LEARNINGS.md`, `notifications_specs.md`, `specs.md` | Update `README.md:24`, `page-prompt.md:53,290`, `STYLED_COMPONENTS_REFACTORING_GUIDE.md:243`, `IMPLEMENTATION_PLAN.md:602`, `IMPLEMENTATION_LEARNINGS.md:33-34`. For `notifications_specs.md` + `specs.md`: update if still authoritative, otherwise mark as historical. Leave `.opencode/chat.md` as-is (historical chat log, not authoritative). |

**Scope verification post-cleanup:** Orchestrator runs a final confirmation grep (`grep -rE "next-intl|getBackendTranslations|NextIntlClientProvider|shared/messages/" --include="*.md" --include="*.ts" --include="*.tsx" --include="*.mjs" .` excluding `.opencode/chat.md`) to confirm zero authoritative references remain (only historical chat logs may carry the term).

**Verification (per subagent):** `bun run scripts/health/sub-loop.ts <file> --lifecycle lint` (mostly doc-only — biome + lint pass on touched `.md` files).

**Orchestrator after wave:** `bun quality-gate` (final, full run).

---

## Cross-cutting risks

- **Wave 2 RSC boundaries:** New Server Component shells must not transitively import client-only code (no `useAppTranslation`, no `useViewport`, no `useMediaQuery`). When using MUI components server-side, verify they don't pull client-only context. `<InitColorSchemeScript>` placement in `<body>` (per the noted Next.js 16 gotcha) is already correct and stays as-is.
- **Wave 3 F2 auth timing:** `refreshToken` + recovery registration interactions need careful testing before commit — affects session refresh lifecycle. Subagent 3-F2 must verify via existing auth tests.
- **Wave 4 H large refactor:** Run `bun tsgo` before the full quality-gate. May surface CodeScene health regression — subagent 4-H must verify each extracted sub-component < 150 lines.

---

## Verification strategy

**Per subagent:** `bun run scripts/health/sub-loop.ts <file> --lifecycle <stage>` — progressive loop (tsgo → biome → lint → codescene), short-circuits at first failure. Subagent fixes errors and re-runs until exit 0.

**Per wave (orchestrator):** `bun quality-gate` (resumes from last stage; runs tsgo, biome, lint, codescene, sonar-results). Advances to next wave only when the gate passes.

**Final (after Wave 5):** Full `bun quality-gate:fresh` for clean-slate verification.

---

## Execution order

```
Wave 1 (4 subagents: fonts + dead code)
  → sub-loop per file → orchestrator: bun quality-gate
Wave 2 (6 subagents: RSC hoisting — LCP)
  → sub-loop per file → orchestrator: bun quality-gate
Wave 3 (3 subagents: provider unblock + streaming + config)
  → sub-loop per file → orchestrator: bun quality-gate
Wave 4 (2 subagents: TeacherDashboardContainer + ColorSchemeStateBridge)
  → sub-loop per file → orchestrator: bun quality-gate
Wave 5 (5 subagents: dead next-intl doc cleanup)
  → sub-loop per file → orchestrator: bun quality-gate
Final: bun quality-gate:fresh
```

**Max parallelism per wave:** 4, 6, 3, 2, 5 (all within the 8-subagent cap).

## Subagent dispatch contract

Each subagent receives:
1. Its assigned files (read-only access to everything else for context).
2. Its specific task description from the table above.
3. The i18n rule (`@/shared/locale/...`, NOT `next-intl`).
4. The ESLint gotcha for `.mobile.tsx`/`.desktop.tsx` files (no `useMediaQuery`/`useViewport`).
5. The instruction to run `bun run scripts/health/sub-loop.ts <file> --lifecycle lint` on each assigned file before declaring done.
6. The instruction to emit a CROSS-FILE DEPENDENCY report (format from root `AGENTS.md`) if a fix requires editing a file outside its assignment — orchestrator dispatches a follow-up wave for the dependency.
