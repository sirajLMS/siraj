# Site Appearance Customization — Requirements Specification

## Overview

Add a Settings → **Appearance** tab (super admin + academy admin) that lets
admins customize the site's brand: name, title, description, logo, and theme
colors. Editing happens live via a `?customize=1` WYSIWYG overlay on the real
app (extra toolbar above the app header + extra sidebar beside the app
sidebar). Changes are staged in a **draft** and only reach visitors on
**Publish**. The published values feed the app's `<html>` CSS variables, METADATA
(title/description/OG), and the dashboard brand region.

This plan documents the architecture. All architectural decisions are **locked**
in [`.ai/plans/brand/outcome/decisions.md`](outcome/decisions.md) — read it first.
This spec converts those decisions into testable EARS acceptance criteria.

## Scope

**In scope**

- New `appearance_settings` singleton table (Drizzle schema + migration).
- New permission `SETTINGS_APPEARANCE_MANAGE` granted to `super_admin` and `academy_admin` groups.
- Backend: `AppearanceSettingsRepository`, `AppearanceSettingsService`,
  `appearance.types.ts`, and Pothos resolvers.
- GraphQL codegen (`generate:gqlSchema` + `codegen`).
- Settings **Appearance** tab (form view) + `?customize=1` WYSIWYG overlay.
- Zustand `appearancePreviewStore` + CSS-var writer hook for live preview.
- Logo upload via the existing storage pipeline.
- METADATA (`generateMetadata`) and `server-theme-css.ts` override from published values.
- i18n labels for the tab and customizer.
- Tests (repo, service, GraphQL, component, E2E).

**Out of scope (deferred)**

- Per-tenant/multi-`tenant_id` branding (one global row for now).
- Persisted undo/redo history across sessions (in-session only).
- Rich font/border-radius/sidebar-color editing — only brand primitives below.

## Personas

| Persona | Permission                                  | Can |
|---------|---------------------------------------------|-----|
| Super admin | `SETTINGS_APPEARANCE_MANAGE` everywhere | view + edit + publish |
| Academy admin | `SETTINGS_APPEARANCE_MANAGE` everywhere | view + edit + publish |
| Any user with `SETTINGS_VIEW` | `SETTINGS_VIEW` only | view the Appearance tab (read-only) |
| All other users | — | consume published branding only |

## User Stories

### US-1: Brand the site from Settings

As a **super admin / academy admin**, I want to customize the site name, title,
description, logo, and theme colors from a dedicated Settings tab, so that the
product matches my academy's identity.

### US-2: Preview changes live before publishing

As an admin, I want to edit branding inside a `?customize=1` overlay on the real
dashboard and see changes **live**, so that I can judge the look before it goes
live.

### US-3: Stage vs. publish

As an admin, I want edits to be saved as a **draft** that only affects me until I
explicitly **Publish**, so that visitors are never exposed to half-finished
branding.

### US-4: Brand is reflected site-wide

As a visitor, I want the published site name/title/description/logo/colors to
appear across all pages (browser tab, meta tags, dashboard header/sidebar, theme
colors), so the whole site feels cohesive.

### US-5: Revert to defaults

As an admin, I want to reset my draft (and optionally publish) back to the
default brand values.

## Acceptance Criteria (EARS)

### Data model

- **AC-1** WHEN the migration runs THEN the `appearance_settings` table SHALL
  exist with columns `id (uuid PK)`, `primary_main (text)`, `secondary_main
  (text)`, `logo_url (text, null)`, `site_name (text)`, `site_title (text)`,
  `site_description (text)`, `default_color_scheme (text)`, `draft_fields
  (jsonb)`, `updated_by_user_id (uuid FK → users.id)`, `updated_at
  (timestamptz)`, `created_at (timestamptz)`, per the locked decision #4.
- **AC-2** WHEN the database has no `appearance_settings` row AND any read
  occurs THEN the system SHALL upsert a single seeded row whose published and
  `draft_fields` values snapshot the current default theme palette and brand
  defaults (see `DEFAULTS` in the design doc).

### Permission

- **AC-3** WHEN the `SETTINGS_APPEARANCE_MANAGE = "settings.appearance_manage"`
  enum value is declared THEN it SHALL exist in the backend `AppPermission`
  enum and the generated GraphQL `AppPermission` type.
- **AC-4** WHEN the permission seed SQL runs THEN `settings.appearance_manage`
  SHALL be granted to BOTH the `super_admin` and `academy_admin` permission groups.

### Access control

- **AC-5** WHEN a user with `SETTINGS_VIEW` (or `SETTINGS_APPEARANCE_MANAGE`)
  requests the Appearance tab THEN the tab SHALL render (read-only if only
  `SETTINGS_VIEW`).
- **AC-6** WHEN a user without either `SETTINGS_VIEW` or
  `SETTINGS_APPEARANCE_MANAGE` requests the Appearance tab THEN the tab SHALL be
  hidden (via `getVisibleSettingsTabs`) and the route SHALL be guarded by
  `withPageAuth`.
- **AC-7** WHEN a user without `SETTINGS_APPEARANCE_MANAGE` attempts Save
  Draft / Publish / Reset THEN the mutation SHALL be rejected.

### Draft / publish

- **AC-8** WHEN an admin saves a draft THEN only `draft_fields` SHALL be updated
  and the published columns SHALL remain unchanged.
- **AC-9** WHEN an admin publishes THEN `draft_fields` SHALL be copied into the
  published columns (`primary_main`, `secondary_main`, `logo_url`, `site_name`,
  `site_title`, `site_description`, `default_color_scheme`) in a single write.
- **AC-10** WHEN an admin resets THEn the `draft_fields` SHALL be replaced with
  the hardcoded defaults AND in the overlay the `<html>` inline CSS vars SHALL be cleared.

### CSS-variable live preview

- **AC-11** WHEN the admin changes `primaryMain`/`secondaryMain` in the
  `?customize=1` overlay THEN the system SHALL update `--mui-palette-primary-main`
  (and secondary) on `<html>` inline style within the current render frame, so a
  live color change is visible immediately without a full re-render.
- **AC-12** WHEN `nativeColor: true` is active for the customization context THEN
  the browser SHALL derive `primary.light/dark/contrastText` (and secondary)
  via CSS `color-mix()` + relative-color functions; a `@supports not (...)` block
  SHALL ship static fallbacks for legacy browsers.
- **AC-13** WHEN the admin edits the per-mode tabs THEN the live app's color mode
  SHALL switch to the active tab's mode, and color edits SHALL apply only to the
  active mode.
- **AC-14** WHEN draft changes are debounced (3s) with no further edits AND the
  user has `SETTINGS_APPEARANCE_MANAGE` THEN the store SHALL autosave a draft via
  the `saveAppearanceDraft` mutation.

### Overlay behavior

- **AC-15** WHEN `?customize=1` is present THEN the root layout and dashboard
  shell SHALL render the extra customization toolbar (above the app header) and
  the extra customization sidebar (before the app sidebar) alongside the real app.
- **AC-16** WHEN the admin is in customize mode THEN the dashboard sidebar SHALL
  collapse to icon-only (64px) with hover-to-expand, and SHALL restore its prior
  state on exit.
- **AC-17** WHEN an admin without `SETTINGS_APPEARANCE_MANAGE` loads
  `?customize=1` THEN the overlay SHALL NOT initialize as editable.

### Entry point

- **AC-18** WHEN a user with `SETTINGS_APPEARANCE_MANAGE` is on any dashboard page
  THEN an amber "Customize" button SHALL render in the app header (linking to the
  current URL + `?customize=1`).
- **AC-19** WHEN the user is in customize mode THEN the header Customize button
  SHALL be hidden (the amber toolbar replaces it).

### Site-wide reflection (published)

- **AC-20** WHEN `getFirstAppearancePublished()` returns a published row THEN
  root `generateMetadata()` SHALL override `title.default`, `title.template`,
  `description`, `applicationName`, `openGraph.title/description/siteName`, and
  `twitter.title/description` from the published `siteTitle`/`siteName`/
  `siteDescription`; otherwise it SHALL fall back to current translation defaults.
- **AC-21** WHEN a published row exists THEN `server-theme-css.ts` SHALL override
  its `DARK_FALLBACKS`/`LIGHT_FALLBACKS` tokens (primary/primaryContainer/onPrimary)
  with the published color values, gated by the published `default_color_scheme`.
- **AC-22** WHEN the appearance settings publish SHALL use
  `revalidateTag("appearance")` so that METADATA and server-theme-css reduce on
  the cached appearance row.

### Logo upload

- **AC-23** WHEN an admin uploads a logo in the Appearance tab/overlay THEN the
  system SHALL use the existing storage pipeline, store the file under an
  `appearance/` (or equivalent) key, and persist the returned URL into
  `draft_fields.logoUrl` (and published `logo_url` on publish).

### i18n

- **AC-24** WHEN the Appearance tab and customizer render THEN all user-facing
  labels SHALL come from the compile-time translation system under the settings
  locale namespace (e.g. add `settings.appearance` tab key + customizer label keys)
  — no hardcoded UI strings.

### JSON Schema, Fast Cold Starts & ENV Fallback

- **AC-25** WHEN the appearance JSON schema is created at `shared/schemas/appearance.schema.json`
  (or referenced in `.vscode/settings.json`) THEN editing branding JSON files in the IDE SHALL
  provide real-time type validation, description hints, and autocomplete.
- **AC-26** WHEN `process.env.NEXT_PUBLIC_APP_BRANDING` (or `SITE_APPEARANCE_JSON`) is defined
  THEN the system SHALL parse and validate the JSON value as default branding, serving cold
  starts in `<0.1ms` without requiring a database query if no DB override exists.
- **AC-27** WHEN database queries fail, timeout, or during DB cold starts THEN the system
  SHALL gracefully fallback to the parsed ENV configuration or hardcoded defaults without
  crashing SSR or layout rendering.
- **AC-28** WHEN an admin clicks "Export JSON" in the Appearance settings or customizer THEN
  the browser SHALL trigger a download of `appearance-settings.json` formatted with `$schema`
  and current draft/published branding fields, suitable for directly pasting into `.env`.
- **AC-29** WHEN an admin opens the theme preset selector in the customizer or appearance tab
  THEN the system SHALL display the built-in preset themes (`default`, `ocean`, `emerald`, `violet`,
  `crimson`, `slate`), and selecting a preset SHALL populate the draft with the preset's light and dark palette pairs.
- **AC-30** WHEN viewing Settings → Environment Config THEN the branding environment keys
  (`NEXT_PUBLIC_APP_BRANDING`, `APP_THEME_PRESET`) SHALL appear under the `Branding & Appearance`
  category, showing whether values originate from DB overrides, ENV, or defaults, with full masking and audit logging on edit.
- **AC-31** WHEN a serverless cold start occurs on Vercel/Neon/Upstash THEN `app/layout.tsx`,
  `server-theme-css.ts`, and `generateMetadata()` SHALL complete rendering synchronously without
  blocking on database network handshakes (execution overhead `< 0.05ms`), completely eliminating
  TTFB cold-start penalties and Flash of Unstyled Content (FOUC).
- **AC-32** WHEN an admin selects a brand color in the customizer THEN the system SHALL calculate
  the WCAG contrast ratio against background/surface tokens, display a WCAG AA compliance indicator,
  and dynamically derive `--mui-palette-onPrimary` (`#000000` or `#FFFFFF`) to guarantee readable text.
- **AC-33** WHEN saving a draft or publishing AND the backend `updatedAt` is newer than the client's
  cached snapshot THEN the mutation SHALL return a conflict error preventing silent clobbering by concurrent admins.
- **AC-34** WHEN color inputs or metadata strings are submitted THEN hex colors SHALL be normalized
  and validated to 6-digit hex format (`#RRGGBB`), text strings SHALL be sanitized against script injection,
  and uploaded logos SHALL be cached with immutable long-lived headers.
- **AC-35** WHEN using the customizer overlay THEN the UI SHALL support full keyboard navigation
  (Escape key exits with focus restoration), announce autosave and publish states via `aria-live="polite"`,
  maintain referential stability on debounced autosave handlers to prevent re-render loops, and isolate
  preview errors within an `<AppearanceErrorBoundary>`.
- **AC-36** WHEN a logo file is uploaded THEN the storage pipeline SHALL verify file magic bytes,
  sanitize SVG XML payloads to prevent stored XSS, generate non-guessable UUID file keys, and reject
  non-safe external image URLs (`isSafeUrl()` validation).
- **AC-37** WHEN executing non-transactional appearance reads THEN `AppearanceSettingsRepository`
  SHALL use `queryDb(tx)` for stateless Neon HTTP mode; and during mutations, ALL repo calls
  SHALL explicitly propagate `tx` within the database transaction.
- **AC-38** WHEN `NEXT_PUBLIC_APP_BRANDING` or user inputs are processed THEN they SHALL be validated
  against `AppearanceFieldsSchema` (Zod), strictly rejecting invalid hex formats, oversized strings,
  and non-safe URLs while safely falling back to defaults on corrupt ENV strings.
- **AC-39** WHEN running the test suite THEN tests SHALL cover Tier 1 (100% repo/service coverage),
  Tier 2 (RTL strings, boundaries, malformed JSON), Tier 3 (concurrency races, DB timeout fallbacks),
  and Tier 4 (unauthorized mutations, XSS injection, SSRF payloads, SVG scripts).

### Application of the standard Feature 6 (Outcome + Progress)

- **AC-F6.1** WHEN executing ANY task THEN the agent SHALL first read all files in
  `.ai/plans/brand/outcome/`.
- **AC-F6.2** WHEN a task completes THEN the agent SHALL write
  `.ai/plans/brand/outcome/<task-id>-outcome.md`.
- **AC-F6.3** WHEN a task completes THEN the agent SHALL tick the checkbox in
  `tasks.md`.

## Edge Cases & Constraints

- **Draft is client-only during SSR** — draft values must never be rendered
  server-side to other users; only the published values are safe to emit from
  server components. The overlay reads the draft from the Zustand store
  (client-only).
- **Hydration mismatch** — CSS var writes and color-mode switching happen only
  in `useEffect`/client handlers, never during render, to avoid SSR/client drift.
- **First boot** — no appearance row exists pre-migration seed; METADATA and
  server-theme-css must gracefully no-op/fall back to current behavior.
- **Logo URL** — must be nullable and validated as a URL before persist.
- **Legacy browsers** (Safari < 16.4) — `nativeColor` derived tokens need the
  `@supports` fallback so colors remain coherent.
- **No console.\*** — use `logger` from `@/backend/lib` / `@/frontend/common/lib/logger`.
- **Layered isolation** — follow the existing layer rules (repo/service/pothos/types
  barrels, `export *`, `@/` aliases, no service `.types.ts`).

## Out of Scope Verification

Design/mobile specifics (bottom-sheet behavior for the extra sidebar, exact
animations, Storybook stories beyond the happy path) are captured in the design
doc but are **not** acceptance criteria here; they are implementation details.