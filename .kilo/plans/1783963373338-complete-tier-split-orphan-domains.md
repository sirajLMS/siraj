# Complete the Tier-Split: Orphan Domains (Switcher Conversion + Tier-Completion + Non-Switcher Triage)

**Status:** Finalized
**Date:** 2026-07-13
**Prerequisite (MUST land first):** `.kilo/plans/1783946053338-update-tier-module-docs-and-conventions.md` — Block 2 (switcher relocation into `frontend/common/views/`). This plan picks up the orphans Block 2's `createLazyView` grep missed and completes the tier-split for the domains where only one tier was ever built out.

**Execution model:** 8 parallel subagents, one per subtree (partition below). Each subagent owns its audit + git mv + tier-split completion + per-file `bun tsgo` on its files. All subagents MUST route lint through the queue server; never run raw `bun lint`. A coordinating gate keeps the tree typecheck-clean between subagent waves.

## Context (verified 2026-07-13)

After the two physical migrations (mobile/desktop primitives + 27 `createLazyView` switcher domains), the residual state is:

- **Zero inline `.mobile.tsx`/`.desktop.tsx` files remain inside `frontend/views/`** — the prior migrations fully collapsed them.
- **27 switcher domains** are being relocated by the prerequisite's Block 2 (in flight).
- **5 "orphan" mobile-view domains** (`components`, `permissions`, `profile`, `students`, `tools`) have `frontend/mobile/views/dashboard/<x>/...` files but NO `createLazyView` switcher matching them in `frontend/views/`. Each is a distinct completion case (see Partition below).
- **`permissions`** uses a LEGACY inline switcher (`useViewport()` + static imports of both tier views) — NOT `createLazyView`. Block 2's `createLazyView` grep misses it. This plan explicitly handles it.

Orphan file counts (frontend/views sibling vs mobile vs desktop tier dirs):

| Domain | views/ | mobile/ | desktop/ |
|---|---|---|---|
| components | 28 | 1 | 1 |
| permissions | 32 | 2 | 2 |
| profile | 80 | 1 | 1 |
| students | 34 | 2 | 2 |
| tools | 10 | 2 | 2 |

App routes that import Containers from these orphan domains (high churn — must be rewritten in lockstep with the moves): `permissions/page.tsx`, `profile/page.tsx`, `profile/edit/page.tsx`, `students/[id]/profile/page.tsx`, `students/onboarding/page.tsx`, `tools/dst-migration/page.tsx`, `parents/[id]/lifecycle/page.tsx`, `users/[id]/profile/page.tsx`, `users/[id]/profile/edit/page.tsx`.

## Decisions (locked)

1. **Tier-split completion is the primary goal**, not just physical relocation. Where one tier exists but the other is genuinely missing (e.g. `students/status` has mobile cards `studentStatusHeader.mobile`, `upcomingClassesTable.mobile` but NO `.desktop.tsx` — the desktop side is `.tsx` inline), the desktop side is treated as the original desktop-styled implementation: convert the inline desktop `.tsx` into `.desktop.tsx` files and wire a `createLazyView` switcher.
2. **`permissions` legacy switcher is converted** to the modern `createLazyView` + `ResponsiveViewSwitch` pattern (mirroring the verified `resourcesView.tsx` shape from the prerequisite plan), and the whole `permissions/` subtree is relocated to `frontend/common/views/dashboard/permissions/`.
3. **Non-switcher domains** (no tier views at all — pure scaffolding like `config/`, `lib/`, `types/`, `utils/`): NOT moved by this plan (user did not select "Relocate scaffolding dirs"). They stay where they are. Subagents must leave them untouched.
4. **Relocation target is `frontend/common/views/dashboard/<domain>/`** for switcher-formed subtrees (per the prerequisite plan's Block 2 contract). A domain whose tier split is genuinely a standalone mobile-only or desktop-only feature (not a switcher pair) keeps the shared/non-tiered tier-neutral files at `frontend/views/dashboard/<domain>/` and the one tier-half where it already is (`frontend/mobile/...` or `frontend/desktop/...`). **The audit phase decides per-domain** which case applies; subagents don't blindly `git mv` everything.
5. **No namespacing/restructuring** beyond the migration. Same rule as the prior migrations — physically relocate and complete the tier split, do not split ViewModels, extract sub-components, or otherwise restructure.
6. **8 subagents** as partitioned below; each owns its subtree end-to-end (audit + move + tier-completion + per-file tsgo). A coordination gate tracks cross-subtree `@/frontend/views/...` import rewrites that land outside the owner's subtree (a subagent must NOT edit a file it doesn't own — it reports the cross-file dependency to the orchestrator).
7. **Re-enumeration before any `git mv`** — same precedent as the prerequisite plan's Phase H. Each subagent re-audits its subtree's actual file inventory before moving, because the counts above are planning-time estimates. Final acceptance criteria adapt to re-enumerated totals.

## Subagent partition (8 subagents)

| # | Subtree (owner) | Work type |
|---|---|---|
| 1 | `frontend/views/dashboard/permissions/**` | Convert legacy `useViewport` switcher → `createLazyView`; relocate entire subtree → `frontend/common/views/dashboard/permissions/`; rewrite `app/.../permissions/page.tsx` Container import + any cross-domain `@/frontend/views/dashboard/permissions/...` importers. |
| 2 | `frontend/views/dashboard/students/status/**` (+ its mobile tier partners under `frontend/mobile/views/dashboard/students/status/`) | **Tier-split completion**: convert inline desktop `StudentStatusHeader.tsx`, `UpcomingClassesTable.tsx` → `.desktop.tsx` variants; create a `createLazyView` switcher `StudentStatusView.tsx` that lazy-loads both halves; wire through `StudentStatusContainer.tsx`; rewrite `app/.../students/[id]/status/page.tsx`. |
| 3 | `frontend/views/dashboard/students/{history,new,onboarding,profile,quota}/**` | Triage each sub-directory: does it have a switcher (legacy or modern)? one tier only? pure non-tiered? Per-domain, decide case-by-case and encode the decision as the in-plan migration table for that subagent's subtree. |
| 4 | `frontend/views/dashboard/profile/**` (80 files — `core/`, `teacher/`, `staff/`, `parent/`, `__shared__/`, `shared/`) | Sub-partition this very large subtree internally into the audit domains (one audit pass per sub-dir). Most sub-dirs likely stay non-tiered scaffolding; only the ones with existing `frontend/mobile/views/dashboard/profile/...` partners need switcher wiring. Report any internal sub-subtree that exceeds ~25 files to the orchestrator to split further if needed. |
| 5 | `frontend/views/dashboard/tools/dst-migration/**` + `frontend/mobile/views/dashboard/tools/dst-migration/**` + `frontend/desktop/views/dashboard/tools/dst-migration/**` | Triage `dst-migration`: inline `DstMigrationView.tsx` is likely not switcher-shaped (no `createLazyView`); one or both of the mobile/desktop partners may already be created; wire a `createLazyView` switcher if absent + relocate the tier-neutral tree. |
| 6 | `frontend/views/dashboard/components/**` (the 28-file scaffold, including `dashboardMetricsSection.mobile.tsx` partner) | Triage ONLY the parts where mobile/desktop tier partners exist (`DashboardMetricsSection.tsx` + `dashboardMetricsSection.mobile.tsx`). The infrastructure components (`BottomNavbar`, `DashboardLayout`, `DashboardClientBridge`, `DashboardLayoutContainer`, navbar/) stay untouched (they are not tier-versioned views — they are the dashboard shell). |
| 7 | `frontend/views/dashboard/dashboard/**` (home metrics: `DashboardView.tsx`, `DashboardContainer.tsx`, `components/`, `utils/`) + `frontend/views/dashboard/parents/lifecycle/**` | Triage whether `DashboardView` is a switcher or shared-shell (it imports `dashboardMetricsSection` — likely a shell). Relocate any tier-paired switcher domains to `frontend/common/views/...`. `parents/lifecycle` audit: does it need a switcher? |
| 8 | Cross-cutting: any `app/**/page.tsx` + cross-domain `@/frontend/views/dashboard/...` importers that the other 7 subagents do NOT own | Owns the cross-file rewrite of any `@/frontend/views/dashboard/<moved-domain>/...` import specifiers that live in a file NOT owned by the move-subagent's subtree. Dispatched in a wave AFTER the move-subagents declare their moves complete. |

### Subagent dependencies and execution order

**Wave 1 (parallel, subagents 1–7):** each audits its subtree, then performs its `git mv`s + tier-split completion + intra-subtree import rewrites. Per-file `bun tsgo` on owned files only. Cross-file `@/frontend/views/...` importers that land OUTSIDE the owning subtree are reported to the orchestrator (not edited by the move-subagent).

**Wave 2 (subagent 8, after Wave 1 reports):** rewrites the cross-file importers identified by Waves 1's reports; whole-tree `bun tsgo` to verify.

**Gate:** whole-tree `bun tsgo` must exit 0 between waves and at the end.

## Execution phases

### Phase A — Anchor: prerequisite plan's Block 2 must be COMPLETE

Before starting Wave 1, verify the prerequisite: `frontend/common/views/` exists and `rg -l "createLazyView" frontend/views` returns empty (all 27 modern switchers relocated). If `permissions` is STILL in `frontend/views/dashboard/permissions/` AND uses the legacy `useViewport` pattern, Block 2 did not catch it — subagent 1 still owns it. If Block 2's agent discovered and converted `permissions`, subagent 1's work is reduced to just verifying the conversion and updating this plan's acceptance; the orchestrator reconciles.

### Phase B — Per-subtree audit (subagents 1–7, in parallel)

Each subagent re-enumerates its files and produces a concrete migration table for ITS subtree, classifying each file:
- **relocate-only** (move to the target home, no behavior change),
- **needs-tier-split** (one tier exists, the other is the inline `.tsx` that must become `.desktop.tsx` or `.mobile.tsx`),
- **convert-to-createLazyView** (legacy `useViewport` switcher pattern),
- **stays-untouched** (pure non-tiered shared/scaffolding — infrastructure shapes like the dashboard shell, config, lib, types).

The table is the subagent's execution contract. A subagent does NOT `git mv` anything until its table is complete and self-consistent.

### Phase C — Execute

- `git mv` for relocate-only files (preserve each file's existing name — do NOT normalize casing; same rule as the prerequisite plan).
- For tier-split-completion domains: create the missing `.desktop.tsx`/`.mobile.tsx` variant by extracting from the inline `.tsx`; the inline `.tsx` becomes the switcher (or is replaced by a new `createLazyView` switcher paired with the two tier variants). The move of these newly-created tier files into their tier module (`frontend/mobile/...` or `frontend/desktop/...`) follows the pattern from the prior mobile/desktop migration plans.
- For convert-to-createLazyView (`permissions`): rewrite the switcher body to use `createLazyView` + `ResponsiveViewSwitch`, mirroring `frontend/views/dashboard/resources/resourcesView.tsx`. The destination is `frontend/common/views/dashboard/permissions/PermissionManagementView.tsx` (block-2 target).
- Rewrite intra-subtree absolute imports from `@/frontend/views/dashboard/<own-domain>/...` → `@/frontend/common/views/dashboard/<own-domain>/...` (for relocated subtrees) or to the new tier path (for newly-created tier files).
- Cross-file importers (files OUTSIDE the owning subtree that import from the moved paths): do NOT edit. Report a CROSS-FILE DEPENDENCY record to the orchestrator: `<target file> / blocked by <other file> / required rewrite <old import spec> → <new import spec>`. Subagent 8 picks these up in Wave 2.

### Phase D — Wave 2 cross-file rewrites (subagent 8)

For each CROSS-FILE DEPENDENCY reported by Waves 1's subagents: rewrite the named importer's absolute import spec to the new path. Common cases:

- `app/[locale]/(dashboard)/<route>/page.tsx` rewrites: `import { XxxContainer } from "@/frontend/views/dashboard/<domain>/XxxContainer"` → `@/frontend/common/views/dashboard/<domain>/XxxContainer`.
- Cross-domain tier-view imports: `frontend/mobile/views/dashboard/<other-domain>/...mobile.tsx` (or desktop) importing from `@/frontend/views/dashboard/<moved-domain>/...` → rewrite to `@/frontend/common/views/dashboard/<moved-domain>/...`.

### Phase E — Documentation append

After Wave 2 lands and whole-tree `bun tsgo` exits 0:

1. Update `frontend/common/views/AGENTS.md` (written by Block 2's Phase J) — append a note that the orphan-domain tier-split is now complete and that the only residual `frontend/views/` content is pure scaffolding (`config/`, `lib/`, `types/`, `utils/`) per Out of Scope.
2. If the prerequisite plan's `mobile-desktop.instructions.md` Switcher Pattern example uses a shape that the tier-split-completion contradicted (it shouldn't — `createLazyView` is the canonical shape; the new switchers mirror it), no change. Otherwise, re-verify the example and adjust.

### Phase F — Verification gate

```bash
bun tsgo                          # Whole-tree — MUST exit 0
~/.bun/bin/bun run scripts/lint-queue-server.ts &   # start queue (if not already running)
# per-changed-file via queue client:
curl -s -X POST http://localhost:4777/lint -H "Content-Type: application/json" \
  -d '{"id":"verify","files":["<each changed file>"]}'
bun biome:check                   # whole tree
bun run build                     # Next.js production build — MUST succeed
```

Acceptance criteria:
- `bun tsgo` exits 0; `bun run build` succeeds.
- `permissions` uses `createLazyView` + `ResponsiveViewSwitch` (no `useViewport()` call) — `rg "useViewport" frontend/common/views/dashboard/permissions/PermissionManagementView.tsx` returns empty.
- `students/status` has both `students/status/components/studentStatusHeader.desktop.tsx` and `.mobile.tsx` (after tier-split completion) and a `createLazyView` switcher wires them.
- Every app route that imported a Container from a relocated orphan domain now imports from `@/frontend/common/views/dashboard/...`.
- No `app/**/page.tsx` or cross-domain importer still references `@/frontend/views/dashboard/<relocated-orphan-domain>/...`.
- No reverse drift: `rg "useViewport" frontend/common/views/dashboard/**/*.tsx | rg "View\.tsx"` returns empty (no new legacy switchers created).
- Re-enumerated orphan counts (from each subagent's Phase B table) match the moved-file set: zero orphan `frontend/mobile/views/dashboard/<x>/...` dirs without a corresponding switcher home.

## Risk register

| Risk | Mitigation |
|---|---|
| Block 2's Phase H catches `permissions` and converts it before this plan runs | Phase A reconciliation: subagent 1 verifies before doing redundant work. If `permissions` was converted, subagent 1 skips that subtree and only updates acceptance. |
| `profile/` 80-file subtree overwhelms a single subagent | Subagent 4 sub-partitions internally by sub-dir and reports to the orchestrator if any sub-subtree exceeds ~25 files; orchestrator spawns an additional subagent for the oversized sub-subtree. |
| A "needs-tier-split" domain turns out to be desktop-default with intentionally NO mobile tier ( produk decision, not incompleteness) | Phase B audit must distinguish "incomplete split" from "intentionally single-tier". Subagent records the decision; no `.mobile.tsx` is created for intentional desktop-only domains. The migration table marks it `stays-single-tier`. |
| Newly-created `.desktop.tsx` variants break the desktop UX because the inline `.tsx` was doing something tier-specific via CSS (not via React tree) | Phase B audit reads the inline `.tsx`'s `sx` usage; if it's responsive-only CSS with no platform branching, the split is safe. If platform branching exists in the `.tsx`, the subagent preserves it as-is in the `.desktop.tsx` (and reports the finding). |
| 8 subagents running `git mv` concurrently collide on shared parent directories | Each subagent owns a disjoint top-level domain subtree (`permissions`, `students`/..., `profile`, `tools`, `components`, `dashboard`, plus the cross-cutting subagent 8 that runs in Wave 2 only). No two subagents touch the same path. |
| New tier views created by this plan import the ViewModel type from `@/frontend/views/...` while the prerequisite relocated many ViewModels to `@/frontend/common/views/...` ambiguity | Phase A's precondition audit enumerates which ViewModels already relocated (Block 2) and which stay (this plan's relocation). New switchers import from the post-Block-2 home of their ViewModel. |
| Lint queue contention from 8 parallel subagents | All subagents route through the queue server; never raw `bun lint`. Server started once at Phase A. |
| A non-switcher domain that the user tagged as "triage" turns out to need a switcher wired (genuinely dual-tier intent it never got) | Phase B audit's migration table tags it `convert-to-createLazyView`; Phase C wires it like subagent 1's `permissions` work. |
| `bun run build` fails because new dynamic imports resolve to a path that's wrong by one segment | Acceptance gate runs `bun run build` after `bun tsgo`. Build catches dynamic-import path resolution that pure type-check misses. |

## Out of scope (explicitly deferred)

- Relocating pure non-tiered scaffolding dirs `config/`, `lib/`, `types/`, `utils/`, `shared/` from `frontend/views/dashboard/` into `frontend/common/views/`. (User did not select; those stay.)
- Restructuring any relocated subtree per CodeScene (extract sub-components, split ViewModels). Same as prior plans — physically relocate and complete the split, no internal restructuring.
- The Zoom live-metadata integration, the `role`-field cleanup, and the students/[id] & teachers/[id] view+edit pages from `.ai/todo/` — separate concerns.
- Backend-layer changes (GraphQL/Pothos, services, repositories). This plan is frontend-only; if a tier-split needs new fields it reports a cross-layer dependency instead of touching backend code.
- `app/` route restructuring beyond Container-import path rewrites (subagent 8's scope).
