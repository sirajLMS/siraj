# Site Appearance Customization — Tasks

> Plan links: [specs.md](specs.md) · [implementation.md](implementation.md) ·
> locked decisions: [outcome/decisions.md](outcome/decisions.md)
>
> Execution rules (MANDATORY, Feature 6 — see specs.md AC-F6.*):
> 1. Before ANY task, read ALL files in `.ai/plans/brand/outcome/`.
> 2. After EACH task, write `.ai/plans/brand/outcome/<task-id>-outcome.md`.
> 3. Tick `[ ]` → `[x]` here after each task.
>
> Per-file quality check after each new/edited file:
> `bun run scripts/health/sub-loop.ts <file> --lifecycle <stage>` (exit 0 = pass),
> escalating stage per lifecycle (`tsgo → biomе → lint → duplicates → codescene`).

## Phase 0: Pre-Implementation Baseline (DONE at execution start, not in plan)

- [x] 0.1 Record tsgo error count baseline
  - `bun tsgo 2>&1 | grep "error TS" | wc -l > /tmp/baseline-tsgo.txt`
  - Write: `.ai/plans/brand/outcome/0.1-baseline-outcome.md`
- [x] 0.2 Record biome + lint baselines
  - `bun biome:check 2>&1 | grep -c "warn" > /tmp/baseline-biome.txt`
  - `bun run scripts/lint-service.ts --json --id baseline > /tmp/baseline-lint.json`
  - Write: `.ai/plans/brand/outcome/0.2-baseline-outcome.md`

---

## Phase 1: Permission (enum + seed SQL)

- [x] 1. Add `SETTINGS_APPEARANCE_MANAGE` enum value
  - Edit `backend/enum/permissions/permission.enum.ts`: add
    `SETTINGS_APPEARANCE_MANAGE = "settings.appearance_manage"` near other `SETTINGS_*`.
  - _Requirements: AC-3_
  - Applicable AGENTS.md: root `AGENTS.md`, `backend/enum/AGENTS.md`
  - Sub-loop: `bun tsgo`
- [x] 1.1 Create permission seed data SQL
  - Create `backend/db/migration/7c-appearance-permissions-data.sql` mirroring
    [`7b-settings-permissions-data.sql`](file:///home/ahmed/Projects/siraj/backend/db/migration/7b-settings-permissions-data.sql):
    toggle `trg_protect_system_permissions`, insert
    `('settings.appearance_manage','settings','appearance_manage', {ar,en} description, {category}, true)`
    with `ON CONFLICT (key) DO UPDATE`, re-enable trigger, then
    `INSERT INTO group_permissions (...) SELECT ... WHERE g.slug IN ('super_admin','academy_admin') AND p.key='settings.appearance_manage' ON CONFLICT DO NOTHING;`
  - _Requirements: AC-4_
  - Applicable AGENTS.md: root `AGENTS.md`, `backend/db/AGENTS.md`
  - Sub-loop: `bun tsgo`
- [x] 1.2 Run migration against dev DB
  - `bun run db push` (or the migration path used for `7b`); verify the permission row + both group grants exist.
  - Write: `.ai/plans/brand/outcome/1.2-outcome.md`

---

## Phase 2: Backend schema/types/repo/service/pothos

- [x] 2. Create `appearance_settings` Drizzle schema
  - Create `backend/db/schema/appearance/appearance-settings.schema.ts` per design §1; barrel `backend/db/schema/appearance/index.ts`.
  - Generate migration: `bun run db generate`; review the generated SQL under `backend/drizzle/`.
  - Apply: `bun run db push`.
  - _Requirements: AC-1, AC-2_
  - Applicable AGENTS.md: root `AGENTS.md`, `backend/db/AGENTS.md`
  - Sub-loop: `bun run scripts/health/sub-loop.ts backend/db/schema/appearance/appearance-settings.schema.ts --lifecycle codescene`
  - Write: `.ai/plans/brand/outcome/2-outcome.md`
- [x] 2.1 Create `backend/types/appearance.types.ts`
  - Define `AppearanceFields`, `AppearanceSettingsRow`, `AppearanceSettingsReturnType`, `AppearanceSettingsSubmitInput`. Ensure barrel re-export.
  - _Requirements: AC-1, AC-9_
  - Applicable AGENTS.md: root `AGENTS.md`, `backend/types/AGENTS.md`
  - Sub-loop: `bun run scripts/health/sub-loop.ts backend/types/appearance.types.ts --lifecycle codescene`
- [x] 2.2 Create `AppearanceSettingsRepository`
  - Create `backend/db/repo/appearance/appearance-settings.repository.ts` (upsert / get / publishDraft) + barrel.
  - _Requirements: AC-8, AC-9_
  - Applicable AGENTS.md: root `AGENTS.md`, `backend/db/repo/AGENTS.md`
  - Sub-loop: codescene on the new file
  - Write: `.ai/plans/brand/outcome/2.2-outcome.md`
- [x] 2.3 Create `AppearanceSettingsService`
  - Create `backend/services/appearance/appearance-settings.service.ts` (+ barrel)
    with `DEFAULT_APPEARANCE_FIELDS`, `getAppearance`, `getFirstAppearancePublished`
    (upsert-seeds on first access, cached tag `"appearance"`), `saveDraft`, `publish`
    (revalidateTag `"appearance"`, audit entry), `resetDraft`. Enforce
    `SETTINGS_APPEARANCE_MANAGE` on writes.
  - _Requirements: AC-2, AC-7, AC-8, AC-9, AC-10, AC-22_
  - Applicable AGENTS.md: root `AGENTS.md`, `backend/services/AGENTS.md`,
    `backend.instructions.md`
  - Sub-loop: codescene on the service file
  - Write: `.ai/plans/brand/outcome/2.3-outcome.md`
- [x] 2.4 Create Pothos resolvers
  - Create `backend/graphql/pothos/system/site-appearance-settings.pothos.ts`
    (`AppearanceSettings` object, `appearanceSettings` query with `draft` arg,
    `saveAppearanceDraft`, `publishAppearance`, `resetAppearanceDraft` mutations;
    `requireAuth` + permission guard on writes).
  - _Requirements: AC-5, AC-7, AC-8, AC-9_
  - Applicable AGENTS.md: root `AGENTS.md`, `backend/graphql/AGENTS.md`,
    `backend.instructions.md`
  - Sub-loop: codescene on the pothos file

---

## Phase 3: GraphQL codegen + i18n backend strings

- [x] 3. Regenerate schema + types
  - `bun run generate:gqlSchema && bun codegen`
  - Verify `AppPermission.SettingsAppearanceManage`, `AppearanceSettings`,
    and the query/mutation documents exist in `frontend/common/graphql/generated/`.
  - _Requirements: AC-3_
  - Applicable AGENTS.md: root `AGENTS.md`
  - Write: `.ai/plans/brand/outcome/3-outcome.md`
- [x] 3.1 Add backend i18n error keys
  - Add `appearance.saveDraftFailed`, `appearance.publishFailed`,
    `appearance.resetFailed`, `appearance.unauthorized` (or reuse existing) to the
    settings/errors locale types + `en` + `ar` impls.
  - _Requirements: AC-24, AC-7_
  - Applicable AGENTS.md: root `AGENTS.md`, `shared/AGENTS.md`

---

## Phase 4: Frontend preview store + CSS var hook

- [x] 4. Create `appearancePreviewStore` (Zustand)
  - Create `frontend/common/stores/appearancePreviewStore.ts` per design §8 (the repo
    keeps Zustand stores under `frontend/common/stores/`; mirror a sibling store like
    `meetingIntegrationsSettingsStore.ts`).
  - _Requirements: AC-11, AC-13, AC-14_
  - Applicable AGENTS.md: root `AGENTS.md`, `frontend/common/stores/AGENTS.md`,
    `frontend.instructions.md`
  - Sub-loop: codescene on the store file
  - Write: `.ai/plans/brand/outcome/4-outcome.md`
- [x] 4.1 Create `useAppearanceCssVars` hook + nativeColor context
  - Create hook that writes/clears `<html>` CSS vars per-mode on field change; add
    the selective `nativeColor: true` context + `@supports` fallback per design §9.
  - _Requirements: AC-11, AC-12, AC-13_
  - Sub-loop: codescene on the hook file

---

## Phase 5: Settings Appearance tab (form view) + permission wiring

- [x] 5. Wire the `appearance` tab
  - Edit `frontend/common/views/dashboard/settings/types/settings.types.ts`
    (`SettingsTabId` += `"appearance"`),
    `frontend/common/views/dashboard/settings/config/settingsTabs.config.ts`
    (add tab, `PaletteOutlined`, `PAGE_PERMISSIONS.settingsAppearance`),
    `frontend/common/types/page-permissions.types.ts`
    (`settingsAppearance: [AppPermission.SettingsAppearanceManage, AppPermission.SettingsView]`).
  - _Requirements: AC-5, AC-6_
  - Sub-loop: tsgo
- [x] 5.1 Add `appearance` tab label + form view strings to settings i18n namespace
  - `shared/locale/types/dashboard/settings` + `en`/`ar` impls (`tabs.appearance`).
  - _Requirements: AC-24_
- [x] 5.2 Add lazy `AppearanceSettingsTab` to `SettingsTabPanels.tsx`
  - Match existing `Lazy*` pattern; the form view shows hero + "Enter Customize
    Mode" CTA + published/draft status + action bar (prototype `prototype/index.html`).
  - Add `AppPermission.SETTINGS_APPEARANCE_MANAGE` to `withPageAuth` list in
    `app/(dashboard)/settings/page.tsx`.
  - _Requirements: AC-5, AC-6_
  - Sub-loop: codescene on the new tab file
  - Write: `.ai/plans/brand/outcome/5.2-outcome.md`

---

## Phase 6: Overlay (`?customize=1`) + customizer UI

- [x] 6. Add Customize header button (permission-gated)
  - Dashboard header: render amber "Customize" button only when user has
    `SETTINGS_APPEARANCE_MANAGE`; links to current URL + `?customize=1`.
  - _Requirements: AC-18, AC-19_
  - Sub-loop: tsgo + codescene
- [x] 6.1 Overlay conditional in root layout + dashboard shell
  - Read `?customize=1`; conditionally render `CustomizeToolbar` above and
    `CustomizeSidebar` beside the app; collapse dashboard sidebar to icon-only
    (64px) with hover-to-expand, restoring state on exit.
  - _Requirements: AC-15, AC-16, AC-17_
  - Applicable AGENTS.md: root `AGENTS.md`, `app/AGENTS.md`,
    `frontend/common/views/AGENTS.md`; Next.js docs in `node_modules/next/dist/docs/`
  - Sub-loop: codescene on edited layout/shell files
  - Write: `.ai/plans/brand/outcome/6.1-outcome.md`
- [x] 6.2 `CustomizeToolbar` component
  - Exit, undo/redo, save draft, publish, reset (matches `prototype/customize-overlay.html`).
  - _Requirements: AC-15, AC-16, AC-19_
  - Sub-loop: codescene
- [x] 6.3 `CustomizeSidebar` component
  - Brand identity, per-mode color editors (light/dark tabs switching live mode),
    logo upload, default-mode radio.
  - _Requirements: AC-13, AC-14, AC-23_
  - Sub-loop: codescene

---

## Phase 7: Logo upload

- [x] 7. Logo upload flow
  - Reuse `StorageService`/`StorageDbRepository`; add upload path storing under an
    `appearance/` key; write returned URL into `draft_fields.logoUrl`; published
    via publish.
  - _Requirements: AC-23_
  - Applicable AGENTS.md: root `AGENTS.md`, `backend/services/AGENTS.md`,
    `backend.instructions.md`
  - Sub-loop: codescene on new/changed storage files
  - Write: `.ai/plans/brand/outcome/7-outcome.md`

---

## Phase 8: METADATA + server-theme-css override

- [x] 8. Override `generateMetadata()` in `app/layout.tsx`
  - Call `AppearanceSettingsService.getFirstAppearancePublished()` (cached tag
    `"appearance"`); override `title.default/template`, `description`,
    `applicationName`, `openGraph.*`, `twitter.*`; fall back to translations when null.
  - _Requirements: AC-20, AC-22_
  - Applicable AGENTS.md: root `AGENTS.md`, `app/AGENTS.md`; Next.js docs
  - Sub-loop: codescene on `app/layout.tsx`
  - Write: `.ai/plans/brand/outcome/8-outcome.md`
- [x] 8.1 Override `server-theme-css.ts` fallback tokens
  - When a published row exists, override primary/secondary fallback tokens gated
    by published `defaultColorScheme`; use published value as default mode.
  - _Requirements: AC-21, AC-22_
  - Sub-loop: codescene on `frontend/common/lib/server-theme-css.ts`
  - Write: `.ai/plans/brand/outcome/8.1-outcome.md`

---

## Phase 9: i18n frontend labels

- [x] 9. Add customizer labels to settings locale namespace
  - `customize.enterMode|exitMode|undo|redo|saveDraft|publish|resetDefaults|
    brandIdentity|colors|light|dark|logoUpload|defaultMode|published|draft|exportJson` in
    `shared/locale/types/dashboard/settings` + `en` + `ar`.
  - _Requirements: AC-24_
  - Applicable AGENTS.md: root `AGENTS.md`, `shared/AGENTS.md`

---

## Phase 9.1: JSON Schema, ENV Hydration & Export

- [x] 9.1 Create JSON Schema & IDE Integration
  - Create `shared/schemas/appearance.schema.json` with schema constraints for `AppearanceFields`.
  - Update `.vscode/settings.json` with `json.schemas` association for `*appearance*.json` and `.brand.json`.
  - Create `shared/lib/appearance-schema-validator.ts` for runtime validation.
  - _Requirements: AC-25_
  - Sub-loop: tsgo
  - Write: `.ai/plans/brand/outcome/9.1-schema-outcome.md`
- [x] 9.2 Implement ENV Hydration & Tiered Caching Fallback
  - Implement `AppearanceSettingsService.getResolvedAppearance()` with tiered resolution: Memory -> `unstable_cache` (DB) -> `process.env.NEXT_PUBLIC_APP_BRANDING` -> `DEFAULT_APPEARANCE_FIELDS`.
  - Add fast JSON parsing helper with schema fallback to prevent cold-start stalls.
  - Update `.env.example` with `NEXT_PUBLIC_APP_BRANDING` documentation and sample JSON.
  - _Requirements: AC-26, AC-27_
  - Sub-loop: tsgo + codescene
  - Write: `.ai/plans/brand/outcome/9.2-env-outcome.md`
- [x] 9.3 Implement Settings "Export JSON" feature
  - Add "Export JSON" button to `AppearanceSettingsTab` and `CustomizeToolbar`.
  - Wire download handler exporting valid `appearance-settings.json` with `$schema` header.
  - _Requirements: AC-28_
  - Sub-loop: codescene
  - Write: `.ai/plans/brand/outcome/9.3-export-outcome.md`
- [x] 9.4 Create Built-in Preset Themes Catalog
  - Create `frontend/common/providers/theme/presets/index.ts` containing light & dark palette pairs for `default`, `ocean`, `emerald`, `violet`, `crimson`, and `slate`.
  - Add Preset Theme selector to `CustomizeSidebar` and `AppearanceSettingsTab`.
  - _Requirements: AC-29_
  - Sub-loop: tsgo + codescene
  - Write: `.ai/plans/brand/outcome/9.4-presets-outcome.md`
- [x] 9.5 Register Branding Keys in Settings → Environment Config Tab
  - Add `NEXT_PUBLIC_APP_BRANDING` and `APP_THEME_PRESET` descriptors to `backend/lib/env-config-keys.ts` under `SystemSettingCategory.BRANDING`.
  - Ensure overrides save to `system_settings` under `env::...` and invalidate the appearance cache and `EnvironmentConfigService` cache.
  - _Requirements: AC-30_
  - Sub-loop: tsgo + codescene
  - Write: `.ai/plans/brand/outcome/9.5-env-config-outcome.md`
- [x] 9.6 Implement WCAG Contrast Calculation & Dynamic `onPrimary`
  - Create `shared/lib/color-contrast.utils.ts` with relative luminance & contrast ratio algorithms.
  - Wire WCAG compliance badge and `--mui-palette-onPrimary` dynamic derivation in `useAppearanceCssVars`.
  - _Requirements: AC-32_
  - Sub-loop: tsgo + codescene
  - Write: `.ai/plans/brand/outcome/9.6-contrast-outcome.md`
- [x] 9.7 Implement Multi-Admin Optimistic Concurrency Control
  - Add `expectedUpdatedAt` check to `saveAppearanceDraft` and `publishAppearance` mutations in `AppearanceSettingsService`.
  - Handle `AppearanceConflictError` in frontend customizer with reload/overwrite options.
  - _Requirements: AC-33_
  - Sub-loop: tsgo + codescene
  - Write: `.ai/plans/brand/outcome/9.7-concurrency-outcome.md`
- [x] 9.8 Implement Defense-in-Depth Input Sanitization & Long-Lived Asset Caching
  - Add hex color normalization and metadata HTML tag sanitization in `appearance.helpers.ts`.
  - Ensure logo uploads set immutable long-lived CDN cache headers.
  - _Requirements: AC-34_
  - Sub-loop: tsgo + codescene
  - Write: `.ai/plans/brand/outcome/9.8-sanitization-outcome.md`
- [x] 9.9 Implement Frontend Patterns: Compound Composition, Focus Trapping & Error Boundary
  - Implement compound sub-components (`CustomizeOverlay.Toolbar`, `CustomizeOverlay.Sidebar`, `CustomizeOverlay.PresetGrid`, `CustomizeOverlay.ColorField`).
  - Wire `previousFocusRef` focus restoration on `Escape` key and `aria-live="polite"` announcements.
  - Wrap customizer in `<AppearanceErrorBoundary>` with safe reset recovery fallback.
  - _Requirements: AC-35_
  - Sub-loop: tsgo + codescene
  - Write: `.ai/plans/brand/outcome/9.9-frontend-patterns-outcome.md`
- [x] 9.10 Create Zod Validation Schema & Safe Fallback Parsers
  - Create `shared/schemas/appearance.zod.ts` with strict hex color regex, string limits, and safe URL refinement.
  - Integrate into `AppearanceSettingsService` for fail-safe parsing of `NEXT_PUBLIC_APP_BRANDING` and mutation inputs.
  - _Requirements: AC-38_
  - Sub-loop: tsgo + codescene
  - Write: `.ai/plans/brand/outcome/9.10-zod-outcome.md`

---

## Phase 10: Tests (4-Tier Test-Expert Matrix)

- [x] 10. Repo tests for `AppearanceSettingsRepository` (Tier 1 & Tier 2)
  - `backend/db/test/...`: upsert/get/publishDraft with `runInRollback`; test 100% line coverage and boundary cases (null logo, long strings).
  - _Requirements: AC-1, AC-8, AC-9, AC-37, AC-39_
  - Applicable AGENTS.md: root `AGENTS.md`, `backend/db/test/AGENTS.md`, `tests.instructions.md`
  - Run: `bun run test/scripts/run-test.ts <path>`
  - Write: `.ai/plans/brand/outcome/10-outcome.md`
- [x] 10.1 Service tests (Tier 1, 2, 3, 4)
  - `backend/services/appearance/test/`: 100% branch coverage, malformed JSON fallback, optimistic concurrency conflict rejection, permission gating, audit logging.
  - _Requirements: AC-2, AC-7, AC-8, AC-9, AC-10, AC-22, AC-33, AC-38, AC-39_
  - Run: `bun run test/scripts/run-test.ts <path>`
  - Write: `.ai/plans/brand/outcome/10.1-service-outcome.md`
- [x] 10.2 GraphQL integration tests (Tier 1 & Tier 4)
  - `frontend/common/graphql/test/...` via `testClient`: full argument permutation tests, unauthorized mutation attempts, XSS input payload tests.
  - _Requirements: AC-5, AC-6, AC-7, AC-8, AC-9, AC-34, AC-39_
  - Run: `bun run test:graphql`
  - Write: `.ai/plans/brand/outcome/10.2-outcome.md`
- [x] 10.3 UI component tests (Tier 1 & Tier 2)
  - Appearance tab render + customizer compound components; mock Apollo; test WCAG badge and keyboard focus restoration.
  - _Requirements: AC-32, AC-35_
  - Run: `bun run test:ui:components`
  - Write: `.ai/plans/brand/outcome/10.3-ui-outcome.md`
- [x] 10.4 E2E tests (`test/ui/e2e/`)
  - `bun run build:test` first; tab visibility, overlay entry/exit, save/publish, SSR metadata reflection, theme CSS verification.
  - _Requirements: AC-20, AC-21, AC-31_
  - Run: `bun run test:ui:e2e`
  - Write: `.ai/plans/brand/outcome/10.4-outcome.md`

---

## Phase 11: Quality gate + plan-review

- [x] 11. Full quality gate
  - `bun quality-gate` → resolve all stages clean (tsgo → oxlint → biome → lint →
    duplicates → codescene).
  - Write: `.ai/plans/brand/outcome/11-quality-outcome.md`
- [x] 11.1 Post-implementation review (per spec-implementation conventions)
  - Record deferred items; confirm no out-of-scope changes leaked in.

---

## Phase 12: Plan Review Gate (before implementation starts)

- [x] P-1 Run `@plan-review` on `specs.md`, `implementation.md`, `tasks.md`
  - Fix all reported violations; re-run until "Plan passes all AGENTS.md rules".
  - Write: `.ai/plans/brand/outcome/plan-review-R1.md`
- [ ] P-2 Commit the plan docs (specs/implementation/tasks + outcome)
  - When the user asks to commit; do not auto-commit.