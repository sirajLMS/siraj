# Site Appearance Customization — Locked Decisions

> Planning session for a `/settings/appearance` tab (super admin + academy admin)
> that customizes site look: name, title, description, logo, theme colors.
> Design includes a `?customize=1` overlay wrapping the real app with an extra
> header + extra sidebar for live WYSIWYG editing.

---

## 10. JSON Schema & IDE Validation

**Decision: A — Canonical JSON Schema file with `$schema` binding & VS Code integration**

To enable seamless IDE autocomplete and validation when authoring appearance configuration:
- A standard JSON Schema file will be defined at `docs/schemas/appearance-settings.schema.json` (or `shared/schemas/appearance.schema.json`).
- Any JSON file (e.g. `appearance.json` or `.brand.json`) can reference `"schema": "./docs/schemas/appearance-settings.schema.json"`.
- `.vscode/settings.json` is updated with `json.schemas` mapping so any `*appearance*.json` or `.brand.json` file is validated automatically in VS Code / Cursor / Windsurf without needing explicit `$schema` tags.

---

## 11. Environment Variable Hydration & Cold-Start Optimization

**Decision: A — JSON-valued ENV variable with tiered fallback**

To eliminate cold start latency, prevent database bottlenecks, and allow zero-DB white-labeling:
- **Environment Variable**: `NEXT_PUBLIC_APP_BRANDING` (or `SITE_APPEARANCE_JSON` on server) accepts a valid JSON string matching the appearance schema.
- **Resolution Tier**:
  1. In-Memory / Module Cache (0ms)
  2. Database published row via `unstable_cache` (tag: `"appearance"`)
  3. Environment variable `NEXT_PUBLIC_APP_BRANDING` (parsed & validated synchronously in <0.1ms)
  4. Hardcoded `DEFAULT_APPEARANCE_FIELDS`
- **Fallback safety**: If the database is unreachable or down, the server gracefully falls back to ENV or hardcoded defaults without throwing or degrading SSR performance.
- **Example configuration**: Added to `.env.example` with a well-commented JSON snippet.

---

## 12. Settings Export / Import to JSON

**Decision: A — "Export JSON" button on Settings Appearance tab + Customizer**

Admins can export the currently published or drafted appearance configuration directly as a formatted JSON file:
- Download filename: `appearance-settings.json` (with `$schema` included).
- Allows operators to copy the JSON into their deployment environment variables (`NEXT_PUBLIC_APP_BRANDING='{...}'`), commit to git, or replicate across staging/production environments.

---

## 13. Built-in Preset Themes (Light & Dark Palettes)

**Decision: A — Preset Theme Catalog with Light/Dark Palette Pairs**

The app will ship a catalog of curated, high-contrast, beautiful built-in preset themes (each defined with paired light & dark palettes):
- **Preset themes**:
  1. `default` (Teal / Indigo - Siraj Default)
  2. `ocean` (Deep Blue / Sky)
  3. `emerald` (Emerald Green / Mint)
  4. `violet` (Deep Purple / Lavender)
  5. `crimson` (Rose / Amber)
  6. `slate` (Slate / Monochrome Minimal)
- **Selection mechanism**:
  - In Customizer / Appearance Settings: admins can pick a preset theme with 1-click, which fills the draft colors for both light and dark modes.
  - Via Environment Variable: `APP_THEME_PRESET="emerald"` or inside `NEXT_PUBLIC_APP_BRANDING={"preset":"emerald", ...}`.
- **Extensible structure**: Palettes stored under `frontend/common/providers/theme/presets/{presetName}/(light|dark)Palette.ts`.

---

## 14. Alignment with Settings → Environment Config & System Settings Resolution

**Decision: A — Unified Environment Config Resolver Pattern**

To align with how `EnvironmentConfigService` and `resolveEnvConfig()` work throughout the codebase:
- Branding settings keys (`NEXT_PUBLIC_APP_BRANDING`, `APP_THEME_PRESET`, `SITE_NAME`, etc.) are registered in `ENV_CONFIG_KEYS` (`backend/lib/env-config-keys.ts`).
- When an admin views Settings → Environment, the branding keys appear under the `Branding & Appearance` category.
- **Precedence Hierarchy**:
  1. In-memory hot cache (0ms)
  2. Database DB override / Published settings (`appearance_settings` table / `system_settings` `env::NEXT_PUBLIC_APP_BRANDING`)
  3. Process environment variables (`process.env.NEXT_PUBLIC_APP_BRANDING`)
  4. Built-in preset theme defaults / hardcoded defaults
- Invalidation: Publishing appearance settings or updating environment config invalidates the in-memory cache and `unstable_cache` tags.

---

## 15. Zero-Latency Serverless Architecture (Vercel Edge/Serverless + Neon + Upstash)

**Decision: A — Zero-Blocking SSR / Zero-Roundtrip Fast Path**

On serverless platforms (Vercel lambdas / Edge) where Postgres (Neon) or Redis (Upstash) can suffer cold starts (100ms - 1500ms):
1. **Critical Path Isolation (No DB on SSR Fast Path)**:
   - Root SSR (`app/layout.tsx`, `server-theme-css.ts`, `generateMetadata()`) MUST NEVER synchronously await cold database connections or remote network roundtrips.
   - Initial render critical path reads from **synchronous static memory & validated ENV cache** (`NEXT_PUBLIC_APP_BRANDING` / preset theme). Execution time is **< 0.05ms**, guaranteeing instant TTFB and zero Cumulative Layout Shift (CLS).
2. **Asynchronous Background Revalidation (SWR)**:
   - When a Next.js serverless instance boots, DB-published overrides from `appearance_settings` are resolved via `unstable_cache` (or background fetch) without blocking the initial HTML stream if the cache is cold.
3. **Inline CSS Var Injection**:
   - `buildServerThemeCss()` inlines the critical CSS variables into the `<head>` in the exact same render tick. Zero layout shift, zero flash of unstyled content (FOUC), and zero dependency on client JS hydration or emotion stylesheets mounting.

---

## 16. Accessibility & WCAG APCA / AA Color Contrast Guardrail

**Decision: A — In-browser WCAG AA (4.5:1 / 3:1) Contrast Checker & Dynamic `onPrimary` Text Derivation**

To prevent admins from accidentally publishing unreadable colors (e.g. bright yellow on white):
- **Contrast calculation**: The customizer derives `primary.contrastText` and computes the contrast ratio against `bgDefault` and `surface`.
- **UI Indicator**: A real-time WCAG AA badge (Pass / Fail indicator) alerts the admin if the selected brand color violates contrast minimums.
- **Dynamic CSS Variable**: `document.documentElement` sets `--mui-palette-onPrimary` to `#000000` or `#FFFFFF` based on luminance calculation, ensuring buttons and chips always remain readable.

---

## 17. Multi-Admin Concurrency & Optimistic Lock Protection

**Decision: A — `updatedAt` Version Stamp / Stale-Draft Guard**

When multiple admins edit appearance settings concurrently:
- `saveAppearanceDraft` and `publishAppearance` pass the client's current `updatedAt` snapshot.
- If another admin published or modified the draft in the interim, the backend returns a `StaleAppearanceError` / conflict warning, prompting the admin to refresh or override rather than silently clobbering another admin's work.

---

## 18. Strict Input Sanitization, Hex Normalization & Storage Key Isolation

**Decision: A — Defense-in-Depth Validation**

- **Color Sanitization**: Hex strings are normalized (`#RGB` → `#RRGGBB`), trimmed, and validated against strict regex (`^#[0-9A-Fa-f]{6}$`) preventing CSS injection or invalid color formats.
- **HTML / Metadata Sanitization**: `siteName`, `siteTitle`, and `siteDescription` are sanitized to strip any dangerous HTML/script tags before metadata insertion.
- **Asset Key Isolation & CDN Caching**: Uploaded logos are stored under `public/appearance/logo-{hash}.{ext}` with `Cache-Control: public, max-age=31536000, immutable` to enable CDN edge caching.

---

## 19. Frontend UI Patterns: Compound Customizer, Focus Management & Reactive State

**Decision: A — Modern Component & Hook Composition Architecture**

Applying frontend best practices to the customizer & appearance settings:
1. **Compound Customizer Component Architecture**:
   - Split customizer into compound components (`Customizer.Toolbar`, `Customizer.Sidebar`, `Customizer.PresetPicker`, `Customizer.ColorSection`, `Customizer.ContrastBadge`).
   - Clean component composition without prop drilling.
2. **Accessible Overlay & Focus Trapping**:
   - When entering `?customize=1`, save previous focus element; `Escape` key exits customizer mode with focus restored to the trigger button.
   - Screen-reader announcements (`aria-live="polite"`) on autosave, preset selection, and publish events.
3. **Referentially Stable Debounced Autosave**:
   - Use `useRef` holding latest mutation handler and state to ensure debounced autosaves (3s) never trigger infinite re-renders or stale closures during rapid color picker adjustments.
4. **Isolated Error Boundaries**:
   - Wrap `CustomizeSidebar` and preview CSS injectors in dedicated `<AppearanceErrorBoundary>` to ensure a bad color state or client crash never takes down the main dashboard layout.

---

## 20. Security Hardening: Storage Validation, SSRF Defense & BOLA / IDOR Protection

**Decision: A — Skills-Informed Security Armor (`pentester`, `idor-testing`, `security-and-hardening`)**

Applying our security skills to appearance settings and file uploads:
1. **Logo Storage Upload Security**:
   - Verify magic bytes (`image/png`, `image/jpeg`, `image/svg+xml`, `image/webp`) on upload before writing to disk/S3.
   - For SVG uploads, sanitize XML with DOMPurify / sanitize-svg to prevent stored XSS (stripping `<script>`, `onload`, `javascript:` URIs).
   - Randomize storage keys using UUIDs (`appearance/logo-${uuid}.${ext}`) to prevent path traversal and object overwrite attacks.
2. **Safe URL & SSRF Defense**:
   - If external `logoUrl` strings are accepted, validate against `isSafeUrl()` from `@/shared/lib/safe-url` (only `https:`, blocking loopback/private IPs `127.0.0.1`, `169.254.169.254`, `10.0.0.0/8`).
3. **IDOR & Mass Assignment (BOPLA) Defenses**:
   - Resolvers strictly type input arguments via Pothos input refs; internal audit fields (`updatedByUserId`, `updatedAt`, `createdAt`) are derived exclusively from `ctx.userId` in the session, never accepted from user input.

---

## 21. Drizzle ORM & Database Driver Patterns

**Decision: A — Skills-Informed Database Patterns (`drizzle-best-practices`, `write-tests`)**

1. **Transaction Wrapping & Handle Propagation**:
   - In all service mutations (`saveDraft`, `publish`, `resetDraft`), pass `tx` to all repository queries to guarantee atomic rollbacks and eliminate deadlock risks.
2. **Stateless Reads over Neon HTTP**:
   - Non-transactional reads (`getAppearance`, `getFirstAppearancePublished`) use `queryDb(tx)` from `@/backend/db` to take advantage of stateless Neon HTTP mode on serverless lambdas.
3. **Dynamic Queries over Array Placeholders**:
   - No `inArray(col, sql.placeholder(...))` usage; prepared statements only on scalar lookups.

---

## 22. End-to-End Type Safety & Zod Validation for ENV & Inputs

**Decision: A — Single-Source Zod Validation & Schema Type Inference**

To ensure 100% type-safety across environment variables, JSON configs, and GraphQL inputs:
- **Zod Schema (`shared/schemas/appearance.zod.ts`)**:
  - Validates `NEXT_PUBLIC_APP_BRANDING` env strings and user inputs synchronously.
  - Strict hex color refinement (`/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/`).
  - Text length limits (e.g. `siteName` max 100 chars, `siteTitle` max 200 chars, `siteDescription` max 500 chars).
  - Nullable, valid URL `logoUrl` validation.
- **Fail-Safe Parsing**: Invalid JSON in `NEXT_PUBLIC_APP_BRANDING` logs a domain error and gracefully falls back to `DEFAULT_APPEARANCE_FIELDS` without throwing or stalling server boot.

---

## 23. Test-Expert 4-Tier Test Engineering Framework

**Decision: A — Exhaustive 4-Tier Testing Methodology (`test-expert`)**

The test plan enforces tests across all four tiers:
1. **Tier 1: Happy Path & 100% Branch Coverage**:
   - Repo CRUD, Service permission gates, GraphQL query/mutation resolvers, CSS variable injection across all themes.
2. **Tier 2: Edge Cases & Boundaries**:
   - Empty strings, ultra-long strings (10k chars), RTL Arabic brand names, invalid hex colors, corrupt JSON env strings, missing fields in `draft_fields`.
3. **Tier 3: Monkey & Chaos Testing**:
   - Rapid concurrent save/publish races, simulated DB timeouts during SSR metadata fetch, corrupt storage keys.
4. **Tier 4: Security & Abuse Testing**:
   - Non-admin authorization bypass, XSS payloads in `siteTitle`/`siteDescription`, SSRF via `logoUrl`, SVG malicious scripts, BOLA/BOPLA tampering on `updatedByUserId`.

---

## 1. Live-preview approach

**Decision: C — `?customize=1` overlay on the real app (WYSIWYG)**

The customization UI is an overlay on the live dashboard. When `?customize=1` is
present, the root layout and dashboard shell conditionally render:

- An **extra header** above the normal app header — holds exit-customize, save
  draft, publish, reset-to-defaults, and undo/redo controls.
- An **extra sidebar** before the normal sidebar — holds the appearance editor
  panels (brand identity, colors, logo upload, preview-mode toggle).

The overlay reads the **draft** appearance values, not the published ones, so the
admin sees their in-progress changes live across every real page they navigate.

**Trade-off accepted:** invasive — requires conditional branches in `app/layout.tsx`
and the dashboard shell. SSR + hydration edge cases must be handled carefully
(draft values are client-only; server must not render them).

---

## 2. Theme token scope

**Decision: A — Brand primitives only**

Editable fields (7 atomic inputs):

| Field                | Stored as              | Derived from / notes                          |
|----------------------|------------------------|-----------------------------------------------|
| `primaryMain`        | `text` (hex)           | Browser derives light/dark/contrastText       |
| `secondaryMain`      | `text` (hex)           | Browser derives light/dark/contrastText       |
| `logoUrl`            | `text` (URL)           | Uploaded via existing storage pipeline         |
| `siteName`           | `text`                 | Used in `<title>`, OG, navbar brand             |
| `siteTitle`          | `text`                 | Used in `<title>` template, app header          |
| `siteDescription`    | `text`                 | Used in meta description, OG description        |
| `defaultColorScheme` | `enum(light, dark)`    | Default mode for new visitors                   |

MUI's `nativeColor: true` auto-derives `primary.light`, `primary.dark`,
`primary.contrastText`, `secondary.*` from the single `main` value via CSS
`color-mix()` + relative-color functions. No admin needs to pick 40+ tokens.

---

## 3. Dynamic contrast derivation

**Decision: A — CSS `nativeColor: true` (in-browser)**

Enable `cssVariables.nativeColor: true` **selectively inside the customization
context only**. The current production theme (`createAppCssVarsTheme`) behavior
stays untouched; we do not flip a global flag that affects all users.

When `?customize=1` is active and the admin picks a new `primaryMain`, the
overlay writes the CSS variable `--mui-palette-primary-main` on `<html>` and
`nativeColor` causes the browser to recompute `--mui-palette-primary-light`,
`--mui-palette-primary-dark`, and `--mui-palette-primary-contrastText` via
`color-mix()` + `rgb(from var(--…) r g b)`. Zero JS color math, zero deps.

**Fallback:** a `@supports not (color: rgb(from black r g b))` block ships
static fallback values for the derived tokens so legacy browsers (Safari <16.4,
< 1% market) still get a coherent palette.

---

## 4. Persistence shape & ownership

**Decision: A — New typed `appearance_settings` table + new permission**

### Table: `appearance_settings`

| Column                | Type         | Notes                                                |
|-----------------------|--------------|------------------------------------------------------|
| `id`                  | `uuid PK`    | Default singleton `gen_random_uuid()`               |
| `primary_main`        | `text`       | Hex color, e.g. `#2DD4BF`                            |
| `secondary_main`      | `text`       | Hex color                                             |
| `logo_url`            | `text`       | Nullable; URL to uploaded logo in storage            |
| `site_name`           | `text`       | Short brand name, e.g. "Siraj"                       |
| `site_title`          | `text`       | Full title for `<title>` template                    |
| `site_description`    | `text`       | Meta description / OG description                   |
| `default_color_scheme`| `text`       | `'light'` or `'dark'`                                |
| `draft_fields`        | `jsonb`      | JSONB blob mirroring all columns above for draft     |
| `updated_by_user_id`  | `uuid FK`    | References `users.id`                                |
| `updated_at`          | `timestamptz`| Auto-updated on write                                |
| `created_at`          | `timestamptz`| Default `now()`                                       |

Single global row (no `tenant_id`). Seeded on first access via upsert.

### Permission: `SETTINGS_APPEARANCE_MANAGE`

New enum value in `AppPermission`:
```
SETTINGS_APPEARANCE_MANAGE = "settings.appearance_manage"
```
Assigned to both **super admin** and **academy admin** role groups.

### Layer pattern (matches existing codebase conventions)

```
backend/db/schema/appearance/  → Drizzle table definition
backend/db/repo/appearance/    → AppearanceSettingsRepository (CRUD)
backend/services/appearance/   → AppearanceSettingsService (auth + audit)
backend/graphql/pothos/system/ → site-appearance-settings.pothos.ts (resolvers)
backend/types/                 → appearance.types.ts (Select/Insert/Return/Upsert)
```

---

## 5. Access control

**Decision: A — Read = `SETTINGS_VIEW` or `SETTINGS_APPEARANCE_MANAGE`;
Write = `SETTINGS_APPEARANCE_MANAGE` only**

| Action                          | Permission required                                  |
|---------------------------------|-----------------------------------------------------|
| View appearance tab             | `SETTINGS_VIEW` OR `SETTINGS_APPEARANCE_MANAGE`     |
| Read draft + published          | `SETTINGS_VIEW` OR `SETTINGS_APPEARANCE_MANAGE`     |
| Save draft (autosave)           | `SETTINGS_APPEARANCE_MANAGE`                        |
| Publish draft → published        | `SETTINGS_APPEARANCE_MANAGE`                        |
| Reset to defaults               | `SETTINGS_APPEARANCE_MANAGE`                        |
| Page-level (`withPageAuth`)     | `SETTINGS_VIEW` OR `SETTINGS_APPEARANCE_MANAGE`      |

Super admin and academy admin both receive `SETTINGS_APPEARANCE_MANAGE`.
No `notImpersonating` lock — academy admin is trusted to brand their site.

---

## 6. Tenancy

**Decision: A — Global branding (single row, no `tenant_id`)**

One `appearance_settings` row serves the entire site. All visitors see the same
branding regardless of tenant. Multi-tenant branding deferred to a future phase.

---

## 7. Draft vs Publish model

**Decision: A — Draft + Publish**

- **Published columns** (`primary_main`, `secondary_main`, `logo_url`,
  `site_name`, `site_title`, `site_description`, `default_color_scheme`) —
  what regular users see.
- **`draft_fields` JSONB** — mirrors the published columns; what the admin sees
  in `?customize=1`.
- On **Publish**, `draft_fields` is copied into the published columns
  (`UPDATE appearance_settings SET primary_main = draft_fields->>'primary_main', …`).
- On **Save Draft**, only `draft_fields` is updated.
- On first ever access, both published and draft are seeded with sensible
  defaults (current theme values).
- **No `is_published` boolean** — published columns always hold the live values;
  draft is always staging. Simpler than the site-content model.

---

## 8. Live edit propagation

**Decision: A — Zustand store + debounced autosave**

### Client store: `appearancePreviewStore` (Zustand)

Holds in-progress draft values. On every change:

1. Store updates → React re-renders the customizer panel.
2. Store updates → a `useEffect` writes CSS variables directly to
   `<html>` inline style (`document.documentElement.style.setProperty(
   '--mui-palette-primary-main', value)`) — instant visual feedback, no
   re-render of the app tree.
3. A debounced (3s) effect calls the `saveAppearanceDraft` GraphQL mutation
   with the full `draftFields` JSON — persists to backend so refreshes don't
   lose work.

### Why not server on every change?

Network jitter makes color sliders feel laggy. CSS-var writes + debounced
autosave gives buttery 60fps sliders + safe persistence.

### Reset / Undo

- **Reset to defaults** — replaces draft with hardcoded defaults (current theme
  palette values) and clears `<html>` inline styles.
- **Undo/redo** — Zustand `temporal` middleware (or a simple history stack in
  the store) for within-session undo; not persisted across sessions.

---

## 9. SEO metadata integration

**Decision: A — Server-side fetch in RootLayout + override generateMetadata**

`app/layout.tsx`'s `generateMetadata()` currently reads from
`getTranslations(locale)`. After this feature:

1. `generateMetadata()` calls `AppearanceSettingsService.getPublished()`
   (cached, no `tx` needed) and overrides:
   - `title.default` ← `siteTitle`
   - `title.template` ← `"%s | " + siteName`
   - `description` ← `siteDescription`
   - `applicationName` ← `siteName`
   - `openGraph.title` ← `siteTitle`
   - `openGraph.description` ← `siteDescription`
   - `openGraph.siteName` ← `siteName`
   - `twitter.title` ← `siteTitle`
   - `twitter.description` ← `siteDescription`
2. Falls back to translation defaults if no appearance row exists (first boot).
3. **Cache:** appearance settings change rarely; wrap in
   `unstable_cache` with a tag (`"appearance"`) so `revalidateTag("appearance")`
   fires on publish.

The published `defaultColorScheme` is also read server-side and injected via
the existing `server-theme-css.ts` pipeline (overrides the `DARK_FALLBACKS` /
`LIGHT_FALLBACKS` tokens when a published row exists).

---

## 10. Customize mode entry point

**Decision: Header button visible only to users with `SETTINGS_APPEARANCE_MANAGE`**

The real dashboard header contains a "🎨 Customize" button (amber accent, outlined style).
It links to the current page with `?customize=1` appended. The button is:

- **Permission-gated**: only rendered when the user has `SETTINGS_APPEARANCE_MANAGE`
- **Present on all dashboard pages**: not limited to `/settings` — admins can enter
  customize mode from anywhere to see context-specific preview
- **Hidden in customize mode**: the button is not shown when `?customize=1` is active
  (the amber toolbar replaces it)

---

## 11. Dashboard sidebar state in customize mode

**Decision: Dashboard sidebar defaults to collapsed (icons only)**

When `?customize=1` is active:
- Dashboard sidebar collapses to **64px width** (icon-only mode)
- **Hover-to-expand**: hovering the sidebar expands it temporarily to 240px
- This maximizes the visible dashboard area alongside the 300px customize sidebar
- The dashboard sidebar state is **restored** when exiting customize mode

---

## 12. Per-mode color editing with live mode switching

**Decision: Light/Dark tabs in the Theme Colors section**

Theme colors are edited separately per color mode:
- **Light tab** → shows primary/secondary color pickers for light mode
- **Dark tab** → shows primary/secondary color pickers for dark mode
- **Switching tabs switches the live app's color mode** (light↔dark) so the admin
  sees their changes in context immediately
- Color changes only apply live when editing the **active** mode
- No separate "Default Mode" section — the active tab IS the mode being edited
- Production: `draftFields` stores per-mode colors:
  `{ light: { primaryMain, secondaryMain }, dark: { primaryMain, secondaryMain } }`
- The `defaultColorScheme` field (which mode new visitors see) is set via a small
  radio under the Brand Identity section, not in the color tabs

---

## Implementation phases (high-level)

| Phase | Scope                                                          |
|-------|----------------------------------------------------------------|
| 1     | DB: `appearance_settings` table + migration                    |
| 2     | Backend: repo, service, types, Pothos resolvers, permission     |
| 3     | GraphQL codegen (`bun run generate:gqlSchema && bun codegen`)   |
| 4     | Frontend store: `appearancePreviewStore` + CSS-var writer hook   |
| 5     | Overlay: `?customize=1` conditional in layout + dashboard shell   |
| 6     | Settings tab: `appearance` tab in `settingsTabs.config.ts`       |
| 7     | Customizer UI: extra header + extra sidebar + editor panels      |
| 8     | Logo upload: integrate with existing storage pipeline            |
| 9     | Metadata: `generateMetadata` + `server-theme-css` override       |
| 10    | i18n: locale namespaces for all customizer labels               |
| 11    | Tests: repo, service, GraphQL, component, E2E                    |
| 12    | Quality gate: `bun quality-gate` clean pass                      |

---

## Open questions (to resolve before implementation)

These are implementation details, not architectural decisions. We'll resolve
them in the plan doc:

- [ ] Exact default seed values for `primary_main`, `secondary_main`,
      `site_name`, `site_title`, `site_description` — current theme values?
- [ ] Logo storage: reuse existing file-upload pipeline or new dedicated
      `appearance/` storage prefix?
- [ ] Should `draft_fields` JSONB also store `logoUrl` or should logo be a
      separate upload-then-reference flow?
- [ ] Mobile responsive: extra sidebar collapses to a bottom sheet on mobile?
- [ ] Audit log: emit on publish only, or on every autosave too?
