# Update Tier-Module Docs & Conventions, then Relocate Switchers to `frontend/common/views/`

**Status:** Finalized
**Date:** 2026-07-13
**Sibling plans (both EXECUTED):**
- `.kilo/plans/1783924718404-move-mobile-components-to-mobile-module.md` — `frontend/mobile/` populated
- `.kilo/plans/1783924718404-move-desktop-components-to-desktop-module.md` — `frontend/desktop/` populated, `.bak` files deleted, leftover `mobile/`/`desktop/` dirs gone

This plan completes the deferred work both prior plans parked, PLUS the structural follow-up (switcher relocation) the user scoped in this planning round. It has two major blocks:

- **Block 1 (Phases A–G)** — Documentation & convention update. **No source migration.** Docs only.
- **Block 2 (Phases H–K)** — Physical relocation of the 27 `xxView.tsx` switchers and their tier-neutral domain trees into `frontend/common/views/`, plus ~42 cross-tier ViewModel type-import rewrites and `app/**` Container-import rewrites. **Source migration.**

Block 1 must fully complete (docs finalized, biome clean) before Block 2 begins.

---

## Audited actual primitive contract (verified 2026-07-13)

Migrated `frontend/mobile/components/ui/` primitives split into **three** behavioral categories — NOT the single category the placeholder `frontend/mobile/AGENTS.md` currently (falsely) claims.

### Mobile primitives (`frontend/mobile/components/ui/`)

| Primitive | Group | Category | Behavior (verified) |
|---|---|---|---|
| `MobileFab` | `button/` | **viewport-gated null-return** | `useViewport()`; `if (!isMobile) return null` |
| `MobileMetricCardGrid` | `card/` | **hybrid responsive** | `useViewport()`; 2-col grid on mobile, delegates to `MetricCardGrid` on desktop — does NOT null-return |
| `MobileCardListItem` | `card/` | **pure presentational** | no `useViewport`, no null-return |
| `MobileCardList` | `container/` | pure presentational | no `useViewport`, no null-return |
| `MobileContentStack` | `container/` | pure presentational | no `useViewport`, no null-return |
| `MobilePageHeader` | `container/page/` | pure presentational | no `useViewport`, no null-return (wraps `PageHeader`) |
| `MobileEmptyState` | `state/` | pure presentational | no `useViewport`, no null-return |
| `dateNavigator.mobile.tsx` | `filter/` | tier-paired variant | paired with `DateNavigator.tsx` parent in `common` |
| `localeAdornmentSwitch.mobile.tsx`, `localizedStringDrawer.mobile.tsx` | `input/localizedString/` | tier-paired variant | paired with parents in `common` |

### Desktop primitives (`frontend/desktop/components/ui/`)

NO `Desktop*`-prefixed standalone primitives exist. The desktop module's `components/ui/` holds ONLY the 3 tier-paired `.desktop.*` variants; none use `useViewport`/null-return (the parent switcher already guarantees the tier):
- `filter/dateNavigator.desktop.tsx` → `DateNavigatorDesktop`
- `input/localizedString/localeAdornmentSwitch.desktop.tsx` → `LocaleAdornmentSwitchDesktop`
- `input/localizedString/localizedStringDrawer.desktop.tsx` → `LocalizedStringDrawerDesktop`

Desktop tier **view** files consume shared primitives directly from `@/frontend/common/components/ui` (`AppDataGrid`, `PageHeader`, `SectionPanel`, `MetricCardGrid`, `StatusBadge`, `BaseCard`, `PageContainer`, …) — these stay in `common` because both tiers import them.

### Tier-paired parent switchers (in `common` — unchanged)

Three un-suffixed parents in `frontend/common/components/ui/` lazy-import BOTH tier halves (verified pattern from `LocaleAdornmentSwitch.tsx`): `filter/DateNavigator.tsx`, `input/localizedString/LocaleAdornmentSwitch.tsx`, `input/localizedString/LocalizedStringDrawer.tsx`. These files are NOT `.mobile.tsx`/`.desktop.tsx`; their cross-tier dynamic `import()` is allowed (ESLint cross-tier rule only fires on tier-versioned files).

---

## The new top-level module contract (what docs must state)

```
frontend/
├── common/                 # viewport-agnostic layer (BOTH tiers import)
│   ├── components/ui/       # shared primitives (AppDataGrid, PageHeader, SectionPanel, StatusBadge, BaseCard, PageContainer, …)
│   ├── stores/              # Zustand stores
│   ├── hooks/useViewport    # the ONLY viewport hook (used by ResponsiveViewSwitch + tier-gated primitives like MobileFab)
│   └── views/               # [NEW — Block 2] switchers + Containers + ViewModels + schemas + types + utils + shared components
├── mobile/                 # mobile-only layer
│   ├── components/ui/       # Mobile* primitives (3 categories — see table above)
│   └── views/dashboard/**  # .mobile.tsx views, mirroring frontend/common/views/dashboard/ minus the `mobile/` segment
├── desktop/                # desktop-only layer
│   ├── components/ui/       # tier-paired .desktop.* variants only (NO Desktop*-prefixed standalone primitives)
│   └── views/dashboard/**  # .desktop.tsx views, mirroring frontend/common/views/dashboard/ minus the `desktop/` segment
└── views/                  # DEPRECATED after Block 2 — emptied of switchers/Containers/ViewModels (only non-dashboard view trees remain, if any)
```

Rules docs must encode:
1. Mobile* / Desktop* primitives are exported ONLY from `@/frontend/mobile/components/ui` / `@/frontend/desktop/components/ui` — never from `@/frontend/common/components/ui`. Prior plans' clean-cut barrel rewrite made this binding; docs must forbid re-adding shim re-exports.
2. `.mobile.tsx` MUST NOT import `@/frontend/desktop/...` and vice versa — ESLint `no-restricted-imports` enforces (regex `\\.mobile(\\.tsx?)?$` / `\\.desktop(\\.tsx?)?$` end-anchors; paths like `@/frontend/mobile/components/ui/button/MobileFab` end in `MobileFab`, not `.mobile`, so they pass).
3. The three primitive behavioral categories (viewport-gated null-return / hybrid responsive / pure presentational) must be documented explicitly in `frontend/mobile/AGENTS.md`.
4. The shared/primitive distinction: `common` holds viewport-agnostic primitives both tiers use; `mobile`/`desktop` hold tier-specific primitives. No primitive lives in two places.
5. After Block 2, switchers/Containers/ViewModels/schemas/types/utils/shared components live in `frontend/common/views/dashboard/<domain>/`, and `app/[locale]/(dashboard)/<route>/page.tsx` imports `XxxContainer` from `@/frontend/common/views/dashboard/<domain>/XxxContainer`.

---

# BLOCK 1 — Documentation & convention update (Phases A–G)

Docs-only. No source migration. Run `bun biome:check` at the end (markdown is subject to biome if configured).

## Phase A — Audit & rewrite `frontend/common/components/ui/AGENTS.md` (read FIRST)

Read `frontend/common/components/ui/AGENTS.md` in full. Identify every section that references the deprecated `<domain>/{mobile,desktop,shared}/` layout, claims Mobile*/Desktop* primitives live in `common`, or documents the tier-paired parents as if they still statically import their variants.

**Why first:** Both prior plans named this file deferred but its current contents weren't read in their planning. Its contents (specifically the actual working primitive import examples) determine the exact phrasing other docs must use for the consistency pass. Do NOT edit any other doc until this one is read and its primitive import-path examples are extracted.

Edit:
- Drop any section listing Mobile*/Desktop* primitives as `common`-resident.
- Re-anchor any "shared primitives" list to clarify these are viewport-agnostic primitives (both tiers use).
- Add a one-line pointer to `frontend/mobile/AGENTS.md` / `frontend/desktop/AGENTS.md` for tier-specific primitives.

## Phase B — Rewrite `.agents/instructions/mobile-desktop.instructions.md` (source of truth)

This file is cross-referenced by `frontend/AGENTS.md`, `frontend/common/stores/AGENTS.md`, `COMPONENT_PATTERNS.md`. Rewrite:

1. **"Directory Structure"** (lines 13-31) — replace `<domain>/{mobile,desktop,shared}/` tree with the new `frontend/{common,mobile,desktop}/` top-level module tree from the contract above. Note switchers/Containers/ViewModels move to `frontend/common/views/` in Block 2.
2. **"Switcher Pattern (Lazy Loading)"** examples (lines 67-96) — update `import("./mobile/xx.mobile")` / `import("./desktop/xx.desktop")` to post-migration and post-Block-2 paths:
   ```tsx
   () => import("@/frontend/mobile/views/dashboard/<domain>/xx.mobile").then(m => ({ default: m.XxMobileView })),
   () => import("@/frontend/desktop/views/dashboard/<domain>/xx.desktop").then(m => ({ default: m.XxDesktopView })),
   ```
3. **"Mobile Shared Components (`frontend/components/ui/`)"** section (lines 119-130) — DELETE (Mobile* primitives now live at `@/frontend/mobile/components/ui/...`). Replace with a pointer to `frontend/mobile/AGENTS.md` and inline the three-category primitive table from "Audited actual primitive contract" above.
4. **"Desktop Shared Components (unchanged)"** section (lines 132-135) — REWRITE. Clarify: page-level "Desktop Shared Components" (`PageHeader`, `Grid`, `SectionPanel`, `AppDataGrid`, etc.) are SHARED primitives in `@/frontend/common/components/ui` (both tiers use them); `frontend/desktop/components/ui/` holds ONLY the 3 tier-paired `.desktop.*` variants; no standalone `Desktop*`-prefixed primitives exist.
5. **"Truly Shared (viewport-agnostic)"** section (lines 137-141) — verify listed primitives still in `common`; keep section, re-anchor heading to "viewport-agnostic primitives in `frontend/common/components/ui/`".
6. **ESLint Rules block** (lines 143-174) — VERIFIED against current `eslint.config.mjs`. KEEP rule patterns as-is. Only adjust surrounding prose if it implies the old in-domain layout.
7. **`applyTo` frontmatter** (line 2) `frontend/**/*.ts,frontend/**/*.tsx` — stays (new modules are still under `frontend/**`).

## Phase C — Rewrite `frontend/AGENTS.md`

1. Collapse the DUPLICATE "Mobile vs Desktop Isolation" section (currently appears twice, ~lines 197 and 224) into ONE canonical instance. `rg -c "## Mobile vs Desktop Isolation" frontend/AGENTS.md` must return `1` after.
2. Rewrite that single section to match Phase B's contract: new top-level layout, three primitive categories, switchers moving to `frontend/common/views/` post-Block-2, ViewModel import contract.
3. Replace the in-domain `mobile/`, `desktop/`, `shared/` directory convention tree (lines 208-222 / 235-250) with the new top-level three-block tree.
4. Cross-reference line (line 252) — keep pointing at `.agents/instructions/mobile-desktop.instructions.md` (now rewritten) and `frontend/views/AGENTS.md` (rewritten by Phase D).

## Phase D — Rewrite `frontend/views/AGENTS.md`

1. **"Directory structure per domain"** tree (lines 19-33) — replace with the new convention: mobile views `frontend/mobile/views/dashboard/<domain>/`, desktop views `frontend/desktop/views/dashboard/<domain>/`, switchers + ViewModels + Containers + schemas + types + utils + shared components move to `frontend/common/views/dashboard/<domain>/` in Block 2.
2. **"Switcher uses `ResponsiveViewSwitch`"** (line 16) — update import-path phrasing to post-migration `@/frontend/mobile/views/...` + `@/frontend/desktop/views/...` lazy specifiers.
3. **"Cross-reference"** (line 36) — add `frontend/mobile/AGENTS.md`, `frontend/desktop/AGENTS.md`. Keep `.agents/instructions/mobile-desktop.instructions.md`.

## Phase E — Fix the placeholder `frontend/mobile/AGENTS.md`

1. **Section "### 1. Mobile-Only Primitives"** — DELETE the false blanket claim ("All components use `useViewport()` internally and return `null` when `!isMobile`"). Replace with the audited three-category primitive table from "Audited actual primitive contract" above.
2. **Section "### 2. Mobile Views"** — KEEP (accurate).
3. **Section "### 3. Import Conventions"** — KEEP (example `import { MobileCardList, MobilePageHeader } from "@/frontend/mobile/components/ui"` is correct).
4. **Section "### 4. Switcher Pattern"** — FIX the line "Desktop variants: `frontend/views/**/desktop/*.desktop.tsx`" → post-migration `frontend/desktop/views/**/*.<x>.desktop.tsx`. After Block 2 also note switchers live at `frontend/common/views/...`.
5. **Section "### 5. Type Definitions"** — KEEP.
6. **"Common Mistakes to Avoid"** table — KEEP; verify each row. The row about importing `MobilePageHeader` from `@/frontend/common/components/ui/container` stays valid.

## Phase F — Fix the placeholder `frontend/desktop/AGENTS.md`

1. **Section "### 1. Desktop-Only Primitives"** — DELETE the false claim. State the truth: desktop `components/ui/` holds ONLY the 3 tier-paired `.desktop.*` variants; no standalone `Desktop*`-prefixed primitives use `useViewport`/null-return.
2. **"Import Conventions"** example — FIX. The placeholder's `import { DesktopDateNavigator, DesktopCardGrid }` references `DesktopCardGrid` which DOES NOT EXIST. Replace with the real example: `import { DateNavigatorDesktop } from "@/frontend/desktop/components/ui/filter"` + clarify desktop tier views consume shared primitives from `@/frontend/common/components/ui`.
3. **Section "### 2. Desktop Views"** — KEEP (accurate).
4. **Section "### 4. Switcher Pattern"** — VERIFY both halves cc'd as dynamically imported from their new paths.
5. **"Common Mistakes to Avoid"** table — remove any row implying `Desktop*`-prefixed standalone primitives exist.

## Phase G1 — Audit `COMPONENT_PATTERNS.md` and rewrite stale sections

`frontend/COMPONENT_PATTERNS.md` (521 lines) is heavily outdated. Audit found:
- It uses `@/frontend/components/ui` paths throughout (lines 30, 150, 164, 207, 231) — the correct base is `@/frontend/common/components/ui`. Rewrite ALL such import examples.
- It has an entire duplicate "## Mobile/Desktop Isolation" section (lines 306-428+) restating the deprecated `<domain>/{mobile,desktop,shared}/` layout, the old `import("./mobile/xx.mobile")` switcher example (line 389), and a duplicate ESLint rules block.
- Line 164 references a stale `src/components/ui/DateNavigator.tsx` path — `DateNavigator.tsx` lives at `@/frontend/common/components/ui/filter/DateNavigator.tsx`.

Rewrite:
- Replace every `@/frontend/components/ui` → `@/frontend/common/components/ui`.
- Delete the duplicate "## Mobile/Desktop Isolation" section; replace with a short pointer to `.agents/instructions/mobile-desktop.instructions.md` and `frontend/mobile/AGENTS.md` / `frontend/desktop/AGENTS.md`. Do NOT duplicate the in-domain tree.
- Fix the `DateNavigator` path literal at line 164.
- After Block 2 lands, re-visit the page-scaffold checklist (lines 278-302) to denote switchers live at `frontend/common/views/...`.

## Phase G2 — Audit `frontend/common/stores/AGENTS.md` pointer lines

`frontend/stores/AGENTS.md` does NOT exist. The stores AGENTS is at `frontend/common/stores/AGENTS.md` (added to root AGENTS layer table). /the AGENTS.md the user selected for pointer verification.

Two cross-reference lines found (lines 25, 49): `See frontend/views/AGENTS.md (ViewModel Pattern), .agents/instructions/mobile-desktop.instructions.md.`. After Block 2, the ViewModel Pattern lives at `frontend/common/views/AGENTS.md` (new) — update these pointers. Before Block 2, they're correct as-is.

## Phase G3 — Rewrite `NEW_PAGE_WORKFLOW.md` stale paths + tier scaffold note

`frontend/NEW_PAGE_WORKFLOW.md` (57 lines) has stale paths:
- Line 14: `.ai/ux/01_in_progress/` — verify the actual in-progress dir name (the plan-prompt.md cites `.ai/ux/01-in_progress/`).
- Line 20: `src/views/dashboard/config/navigationConfig.ts` → actual is `frontend/views/dashboard/config/navigationConfig.ts` (will move to `frontend/common/views/dashboard/config/navigationConfig.ts` in Block 2).
- Line 21: `src/stores/userStore.ts` → actual is `frontend/common/stores/userStore.ts`.
- Lines 16-18: `src/types/message.ts`, `src/messages/en.ts`, `src/messages/ar.ts` → actual are `shared/messages/types/message.ts`, `shared/messages/en.ts`, `shared/messages/ar.ts` (messages dir verified at `./shared/messages`).
- Line 40: `@/frontend/components/ui/form` → `@/frontend/common/components/ui/form`.

Add a "## Phase 0: Tier-aware scaffolding" note pointing at `frontend/mobile/AGENTS.md` + `frontend/desktop/AGENTS.md` + the new switcher contract, so new-page authors know mobile/desktop views live at `@/frontend/mobile/views/...` + `@/frontend/desktop/views/...` and the switcher lives at (post-Block-2) `frontend/common/views/...`.

## Phase G4 — Full rewrite of `frontend/page-prompt.md`

`frontend/page-prompt.md` (461 lines) describes a pre-tier scaffold: `src/views/[feature]/{components,schemas,actions}` + `[Feature]Container.tsx` + `[Feature]View.tsx` with NO mobile/desktop tier awareness, and stale `src/...` path prefixes throughout.

Rewrite:
1. **"### 1. File Structure"** (lines 60-106) — replace the pre-tier tree with the realistic current scaffold, including tier files:
   ```
   frontend/views/dashboard/<domain>/           # tier-neutral home (moves to frontend/common/views/<domain>/ after Block 2)
     XxxContainer.tsx                            # server-ish entry; app route imports this
     XxxView.tsx                                 # switcher — createLazyView + ResponsiveViewSwitch
     useXxViewModel.ts                           # business logic
     types/, schemas/, utils/, components/       # shared non-tiered
   frontend/mobile/views/dashboard/<domain>/
     <feature>.mobile.tsx                        # mobile tier view
     components/<featureCard>.mobile.tsx          # mobile-only
   frontend/desktop/views/dashboard/<domain>/
     <feature>.desktop.tsx                        # desktop tier view
     components/<featureGrid>.desktop.tsx          # desktop-only
   ```
2. Fix all `src/` path prefixes to the real `frontend/...` / `shared/messages/...` paths.
3. **"### 4. Internationalization"** (lines 243-292) — update `src/types/message.ts`, `src/messages/en.ts`, `src/messages/ar.ts` to `shared/messages/types/message.ts`, `shared/messages/en.ts`, `shared/messages/ar.ts`.
4. Cross-reference `NEW_PAGE_WORKFLOW.md` (rewritten by Phase G3) and the new `mobile/AGENTS.md` + `desktop/AGENTS.md` for the tier contract.

## Phase G5 — Final consistency pass & verification

1. Re-read all edited docs (instruction file + 8) end-to-end; confirm the module contract is stated consistently — no doc repeats the old `<domain>/{mobile,desktop,shared}/` layout, no doc repeats the false null-return blanket claim, no doc references the deprecated `@/frontend/components/ui` (non-`common`) location for Mobile* primitives.
2. Grep audits (must return empty or expected counts):
   - `rg "useViewport\(\) internally and return null"` → empty
   - `rg "frontend/components/ui/" frontend/**/*.md .agents/instructions/*.md` → empty
   - `rg -c "## Mobile vs Desktop Isolation" frontend/AGENTS.md` → `1`
   - `rg -n "src/views|src/stores|src/messages|src/types/message" frontend/page-prompt.md frontend/NEW_PAGE_WORKFLOW.md` → empty (after rewrite)
3. Run `bun biome:check` — fix any markdown formatting it flags; re-run.

**Block 1 acceptance criteria:**
- All four greps above pass.
- No doc silently implies `Desktop*`-prefixed standalone primitives exist.
- The three primitive behavioral categories documented in `frontend/mobile/AGENTS.md`.
- `bun biome:check` passes for the edited markdown files.

---

# BLOCK 2 — Switcher & tier-neutral tree relocation to `frontend/common/views/` (Phases H–K)

Source migration. ~27 domain subtrees. Verified totals:
- Switcher files with `createLazyView`: **27** (28 grep matches minus `frontend/views/AGENTS.md`).
- Tier files importing a ViewModel type from `@/frontend/views/dashboard/.../use*ViewModel`: **42** across `frontend/mobile/**` + `frontend/desktop/**`. These break on relocation and must be rewritten to `@/frontend/common/views/dashboard/.../use*ViewModel`.
- `app/[locale]/(dashboard)/<route>/page.tsx` files importing `XxxContainer` from `@/frontend/views/dashboard/...` to rewrite to `@/frontend/common/views/dashboard/.../XxxContainer`.
- Switcher filename casing is inconsistent (camelCase `resourcesView.tsx` vs PascalCase `ResourcesView.tsx`) — preserve each file's existing name when relocating; don't normalize.

`frontend/common/views/` does NOT yet exist.

## Phase H — Scaffolding & enumeration

1. Create `frontend/common/views/dashboard/` skeleton (no files yet).
2. Create `frontend/common/views/AGENTS.md` placeholder stating the module contract (tier-neutral home for switchers/Containers/ViewModels/schemas/types/utils/shared components; MAY import from `@/frontend/common/...` and `@/shared/...`; MUST NOT import `@/frontend/mobile/...`/`@/frontend/desktop/...` statically except via dynamic `import()` of tier views; tier views import their ViewModel **type** from `@/frontend/common/views/.../useXxViewModel`).
3. Re-enumerate: for the 27 switcher files, walk each domain subtree (`XxxContainer`, `XxxView`, `useXxViewModel`, `types/`, `schemas/`, `utils/`, shared `components/*.tsx` that are NOT `.mobile`/`.desktop`, `*.stories.tsx`) and produce a concrete move-list per domain. Skip any file that is itself a `.mobile.tsx`/`.desktop.tsx` (those already live in `frontend/mobile`/`frontend/desktop`).

## Phase I — Relocate domain subtrees via `git mv`

For each of the 27 domains, `git mv` the entire tier-neutral subtree (Container + View switcher + ViewModel + types/schemas/utils/components + stories) from `frontend/views/dashboard/<domain>/` → `frontend/common/views/dashboard/<domain>/`. Preserve existing filenames (do not normalize casing).

**Intra-subtree relative imports stay valid** (the relative tree moves intact). What breaks is cross-layer absolute imports:

1. **Inside each moved file**: any `@/frontend/views/dashboard/<own-domain>/...` absolute import becomes `@/frontend/common/views/dashboard/<own-domain>/...`. Audit each moved file's imports and rewrite.
2. **Mobile/desktop tier view files** (`frontend/mobile/**`, `frontend/desktop/**`): the **42** `import type { XxViewModel } from "@/frontend/views/dashboard/<domain>/useXxViewModel"` lines become `... from "@/frontend/common/views/dashboard/<domain>/useXxViewModel"`. Also any other `@/frontend/views/dashboard/<domain>/...` import a tier file makes toward a NOW-relocated sibling (types files, schemas, shared components) → rewrite to `@/frontend/common/views/dashboard/<domain>/...`.
3. **`app/[locale]/(dashboard)/<route>/page.tsx`**: every `import { XxxContainer } from "@/frontend/views/dashboard/<domain>/XxxContainer"` → `@/frontend/common/views/dashboard/<domain>/XxxContainer`.
4. **Cross-domain imports** (one domain importing another domain's helpers/types): audit `rg -n "@/frontend/views/dashboard/" frontend/common/views` post-move — any cross-domain absolute import that targets a NOW-relocated sibling → rewrite to `@/frontend/common/views/dashboard/...`. Cross-domain imports to DOMAINS NOT in the 27-switcher set (e.g. `frontend/views/dashboard/<other>/...` that has no tier-specific tree and didn't move) stay unchanged.

**Parallelization:** One subagent per dashboard domain subtree (27 subagents max). Each subagent owns: its `git mv`s + its intra-file `@/frontend/views/...` → `@/frontend/common/views/...` rewrites + per-file `bun tsgo` on its moved files. The 42 tier-file ViewModel-type rewrites belong to whichever subagent owns that domain's ViewModel (the ViewModel file moved; its consumer tier files get their import updated by that subagent). All subagents MUST use the lint queue server for lint, never raw `bun lint`.

**Verification (gates Phase J):** `bun tsgo` whole-tree exits 0. No broken `@/frontend/views/dashboard/<moved-domain>/...` import remains (`rg "@/frontend/views/dashboard/<moved-domain>" frontend app` returns empty for each moved domain — exact-replace per domain).

## Phase J — `frontend/views/` cleanup & doc handoffs

1. After all 27 subtrees move, `frontend/views/dashboard/` retains: `config/` (navigationConfig), non-dashboard view trees (if any), and any domain directories that had NO tier-specific subtree (no switcher). Verify with `ls frontend/views/dashboard/` and `rg -l "createLazyView" frontend/views` (must return empty after Block 2).
2. Delete now-empty domain directories left by `git mv`.
3. **Update `frontend/common/views/AGENTS.md`** (written in Phase H) — finalize the contract content (mirror the Phase G1 rewrite style).
4. **Update docs written in Block 1** that reference switcher location:
   - `.agents/instructions/mobile-desktop.instructions.md` — switcher code example & directory section already updated in Phase B to use `frontend/common/views/...`; re-verify post-move.
   - `frontend/views/AGENTS.md` (Phase D) — ViewModel Pattern section must now point at `frontend/common/views/AGENTS.md` (the relocated tier-neutral home).
   - `frontend/AGENTS.md` (Phase C) — top-level tree block must show `frontend/common/views/` as the switcher home, `frontend/views/` as deprecated/residual.
   - `frontend/common/stores/AGENTS.md` (Phase G2) — update the two pointer lines to `frontend/common/views/AGENTS.md` (ViewModel Pattern relocated).
   - `frontend/mobile/AGENTS.md` + `frontend/desktop/AGENTS.md` — fix the Switcher Pattern section's "switchers in `frontend/views/...`" line to `frontend/common/views/...`.

## Phase K — Verification gate

```bash
bun tsgo                          # Whole-tree — MUST exit 0
~/.bun/bin/bun run scripts/lint-queue-server.ts &   # start queue (if not running)
# per changed file via queue client:
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint -H "Content-Type: application/json" \
  -d '{"id":"verify","files":["<each changed file>"]}'
bun biome:check                   # whole tree
bun run build                     # Next.js production build — MUST succeed (dynamic imports must resolve)
```

**Block 2 acceptance criteria:**
- `bun tsgo` exits 0.
- `bun run build` succeeds.
- `rg -l "createLazyView" frontend/views` returns empty (all switchers relocated).
- `rg "@/frontend/views/dashboard/.*/use.*ViewModel" frontend/mobile frontend/desktop` returns empty (all 42 ViewModel-type imports rewritten to `@/frontend/common/views/...`).
- `rg "XxxContainer" app/\[locale\]/\(dashboard\)` — every Container import rewritten to `@/frontend/common/views/dashboard/...`.
- `frontend/common/views/dashboard/` mirrors the (collapsed) `frontend/views/dashboard/` paths for the 27 switcher domains.
- `frontend/views/dashboard/` still contains `config/` and any residual non-switcher trees verified, with no orphaned `createLazyView` users.
- All doc cross-references updated to the new switcher home; Block 1 greps still pass.

---

## Full risk register

| Risk | Mitigation |
|---|---|
| Doc still references an old link the Block 1 greps missed | Phase G5 consistency-pass RE-READS all 9 docs end-to-end. Greps are anchored; read-based audit is the backstop. |
| `frontend/common/components/ui/AGENTS.md` contents contradict the assumed contract | Phase A reads it FIRST; adjusts Phase B-F phrasing if it surfaces a contradicted fact. Do not edit other docs until Phase A completes. |
| Biome flags edited markdown | Phase G5 + Phase K3 run `bun biome:check`; fix flagged formatting; re-run. |
| `frontend/stores/AGENTS.md` path in earlier user Q (block 2 of refinements) — it does NOT exist; the real file is `frontend/common/stores/AGENTS.md` | Phase G2 operates on `frontend/common/stores/AGENTS.md`. Root AGENTS.md layer table already lists `frontend/stores/` per the AGENTS doc but the actual file is `frontend/common/stores/AGENTS.md` — do not create the non-existent path. |
| Switcher filename casing inconsistency (camelCase vs PascalCase) preserved incorrectly during `git mv` | Phase I preserves each file's existing name. Do NOT normalize. |
| A moved domain subtree has an absolute import to a sibling domain that is NOT in the 27-switcher set | Phase I step 4 cross-domain audit leaves non-moved siblings' imports unchanged; only rewrites absolute imports to NOW-relocated siblings. |
| Tier-view file imports BOTH the ViewModel type AND a shared non-tiered component from the same `@/frontend/views/dashboard/<domain>/...` path | The 42-count covers the ViewModel type; also audit tier files for any OTHER `@/frontend/views/dashboard/<moved-domain>/...` import (types, schemas, shared components) and rewrite in the same subagent pass. |
| `MobileMetricCardGrid` is a non-null-return hybrid responsive primitive — an agent might "fix" it to null-return thinking it violates contract | The corrected `frontend/mobile/AGENTS.md` (Phase E) explicitly documents the hybrid category. No code change is in scope. |
| `page-prompt.md` rewrite drifts from realistic scaffold | Phase G4 rewrites anchored to the verified post-migration tree (Container/View/ViewModel structure + `@/frontend/mobile/views/...` + `@/frontend/desktop/views/...` + verified `shared/messages/...`, `frontend/common/stores/...` paths). |
| Block 2 finds MORE than 27 switchers / 42 tier-type imports after re-enumeration | Phase H re-enumerates before any `git mv`; the totals 27/42 are planning-time estimates — adjust the acceptance criteria counts to the re-enumerated totals at execution time. |
| Lint queue contention from Block 2's parallel subagents | The 27 subagents MUST route through the queue server (start it once at Phase H, never run raw `bun lint`). |
| Cross-domain shared utility imports that point into a moved domain break | Block 2's cross-domain audit (Phase I step 4) rewrites ALL `@/frontend/views/dashboard/<moved-domain>/...` absolute imports repo-wide, including cross-domain ones from other moved domains and from `app/`. |

## Out of scope (explicitly deferred)

- Restructuring the relocated subtrees (splitting ViewModels by concern, extracting sub-components per CodeScene). Just physically relocate; the new module home just hosts the same internal layout.
- Adding `useViewport()` null-return to the pure-presentational Mobile* primitives `MobilePageHeader`, `MobileContentStack`, `MobileCardList`, `MobileCardListItem`, `MobileEmptyState`. They are intentionally presentational-only; corrected AGENTS.md (Phase E) documents this as the contract.
- Renaming `MobileMetricCardGrid` or splitting into separate mobile/desktop primitives — it stays a hybrid responsive; Phase E documents it.
- Any backend-layer, app-route structural, or root-AGENTS layer-table changes beyond the `frontend/` scope this plan defines.
