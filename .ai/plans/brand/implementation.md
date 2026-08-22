# Site Appearance Customization — Technical Design

## Overview

The feature adds a persisted, single-row **branding configuration** that flows
into (a) the MUI theme's `primaryMain`/`secondaryMain` colors, (b) site-wide
METADATA, (c) the server-injected fallback CSS variables, and (d) the dashboard
brand region. Editing happens through a new Settings **Appearance** tab (form
view) and a `?customize=1` live WYSIWYG overlay on the real app. Draft edits live
in a Zustand store and autosave; Publish copies `draft_fields` into the published
columns.

All architectural decisions are **locked** in
[`outcome/decisions.md`](outcome/decisions.md). This document is the concrete,
file-by-file implementation plan. Read decisions.md first, and follow the AGENTS.md
layer rules for every file.

## Design Goals

- **Minimal blast radius**: default theme path (`createAppCssVarsTheme`) is
  untouched for normal users; brand colors only override server fallback tokens
  and client CSS vars during/after publish.
- **Live preview with zero JS color math**: rely on MUI `nativeColor: true` +
  CSS `color-mix()` to derive shade/contrast tokens in-browser.
- **Safe draft model**: draft is client store + `draft_fields` jsonb; server never
  renders draft to other users.
- **Follow existing conventions**: mirror the `site-content` repo/service/pothos
  layering, the `7b-settings-permissions-data.sql` permission-seed pattern, the
  `settingsTabs.config.ts` + `SettingsTabPanels.tsx` tab wiring, and the
  `server-theme-css.ts` + `generateMetadata()` integration.

## Architecture (data flow)

```
Settings Appearance tab / ?customize=1 overlay
   │  (Zustand appearancePreviewStore → CSS var writes on <html>)
   ▼
saveAppearanceDraft / publishAppearance / resetAppearanceDraft  (GraphQL)
   ▼
AppearanceSettingsService (auth + audit + defaults)
   ▼
AppearanceSettingsRepository (upsert / get)
   ▼
appearance_settings (Drizzle)  ──►  getFirstAppearancePublished()
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
            RootLayout generateMetadata()           server-theme-css.ts
            (title/desc/OG/twitter)                 (fallback CSS vars)
```

## Backend

### 1. Schema — `appearance_settings` table

New Drizzle table definition.

**File (create):** `backend/db/schema/appearance/appearance-settings.schema.ts`

```ts
export const appearanceSettings = pgTable("appearance_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  primaryMain: text("primary_main").notNull(),
  secondaryMain: text("secondary_main").notNull(),
  logoUrl: text("logo_url"),
  siteName: text("site_name").notNull(),
  siteTitle: text("site_title").notNull(),
  siteDescription: text("site_description").notNull(),
  defaultColorScheme: text("default_color_scheme").notNull(),
  draftFields: jsonb("draft_fields").notNull(),
  updatedByUserId: uuid("updated_by_user_id").references(() => users.id),
  updatedAt: timestamptz("updated_at").defaultNow().notNull(),
  createdAt: timestamptz("created_at").defaultNow().notNull(),
});
```

- `draftFields` stores `{ primaryMain, secondaryMain, logoUrl, siteName,
  siteTitle, siteDescription, defaultColorScheme }` (mirrors published columns).
- Single global row, no `tenant_id`. Seeded via upsert on first read.
- Create a barrel `backend/db/schema/appearance/index.ts` (`export *`).

**Migration:** run `bun run db generate` (drizzle) after the schema edit to
produce the SQL migration under `backend/drizzle/`. Since `appearance_settings`
is a net-new table there is no destructive change; no policy conflict.

### 2. Types — `appearance.types.ts`

**File (create):** `backend/types/appearance.types.ts`

> **Reconciling decisions #2/#7 with #12.** The published columns are **single**
> values (`primary_main`, `secondary_main`) applied to the selected
> `default_color_scheme` mode (legacy/fallback). The **draft**, however, is
> per-mode (`{ light: {primaryMain, secondaryMain}, dark: {...} }`) so the admin
> can edit each mode in the overlay (decision #12). On publish, the draft's
> **active-mode** colors (per `defaultColorScheme`) are copied into the single
> published columns.

```ts
export interface PerModeColors {
  light: { primaryMain: string; secondaryMain: string };
  dark:  { primaryMain: string; secondaryMain: string };
}

export interface AppearanceFields {
  colors: PerModeColors;
  logoUrl: string | null;
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  defaultColorScheme: PaletteMode; // "light" | "dark"
}

// DB published row (single-mode color columns + jsonb draft)
export type AppearanceSettingsRow = {
  id: string;
  primaryMain: string;      // published (active-mode) colors
  secondaryMain: string;
  logoUrl: string | null;
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  defaultColorScheme: PaletteMode;
  draftFields: AppearanceFields;        // typed JSONB (per-mode)
  updatedByUserId: string | null;
  updatedAt: string;
  createdAt: string;
};

// Service/API shape
export type AppearanceSettingsReturnType = AppearanceSettingsRow;
export type AppearanceSettingsSubmitInput = AppearanceFields;
export type AppearanceDraftInput = AppearanceFields;
```

- On publish, `AppearanceSettingsService.publish` maps
  `draftFields.colors[draftFields.defaultColorScheme]` →
  `primary_main`/`secondary_main`, and copies the other scalar fields.
- The Pothos `AppearanceSettings` object exposes both the published single-mode
  colors AND the per-mode `colors` from `draftFields` (when drafting).

Barrel: `backend/types/index.ts` should already re-export `*` (verify; add if
not present). No local `.types.ts` in the service layer — types live here.

### 3. Repository — `AppearanceSettingsRepository`

**File (create):** `backend/db/repo/appearance/appearance-settings.repository.ts`
Barrel: `backend/db/repo/appearance/index.ts`, re-exported from `backend/db/repo/..` (`export *`).

```ts
export namespace AppearanceSettingsRepository {
  // Upsert the single row; returns the fresh row.
  export async function upsert(
    db: DBQueryExecutor,
    input: AppearanceSettingsRow,
    updatedByUserId: string
  ): Promise<AppearanceSettingsRow>;

  // Returns the single row or null.
  export async function get(db: DBQueryExecutor): Promise<AppearanceSettingsRow | null>;

  // Copy draft_fields into the published columns (for publish).
  export async function publishDraft(
    db: DBQueryExecutor,
    draftFields: AppearanceFields,
    updatedByUserId: string
  ): Promise<AppearanceSettingsRow>;
}
```

Use the imported `appearanceSettings` table and standard
`db.insert(...).onConflictDoUpdate(...)` / `db.select()`.

### 4. Service — `AppearanceSettingsService`

**File (create):** `backend/services/appearance/appearance-settings.service.ts`
Barrel: `backend/services/appearance/index.ts`, re-exported from `backend/services/..` (`export *`).

Follows the `SiteContentService` pattern (see
[site-content.service.ts](file:///home/ahmed/Projects/siraj/backend/services/storage/site-content.service.ts)):

```ts
export const DEFAULT_APPEARANCE_FIELDS: AppearanceFields = {
  colors: {
    light: { primaryMain: "#0D9488", secondaryMain: "#4F46E5" },   // lightPalette
    dark:  { primaryMain: "#2DD4BF", secondaryMain: "#818CF8" },   // darkPalette
  },
  logoUrl: null,
  siteName: "Siraj",
  siteTitle: "Siraj",
  siteDescription: "Siraj education management",
  defaultColorScheme: "dark",   // matches current default in createAppCssVarsTheme
};

export namespace AppearanceSettingsService {
  // Auth-safe read; caller supplies tx or db executor.
  export async function getAppearance(db): Promise<AppearanceFields | null>;

  // Returns defaults if no row exists, seeding it (upsert) on first access.
  export async function getFirstAppearancePublished(): Promise<AppearanceFields | null>;

  // Guarded by SETTINGS_APPEARANCE_MANAGE.
  export async function saveDraft(tx, userId, input, tErrors);
  export async function publish(tx, userId, tErrors);
  export async function resetDraft(tx, userId, tErrors);
}
```

- **Auth read path**: read guarded by `SETTINGS_VIEW` OR `SETTINGS_APPEARANCE_MANAGE`
  (enforced in the GraphQL resolver); no check on `getFirstAppearancePublished`
  (public).
- **Write path**: all of `saveDraft`/`publish`/`resetDraft` enforce
  `SETTINGS_APPEARANCE_MANAGE`.
- **Audit**: `publish` emits an `AuditService` entry (`settings.appearance_manage`)
  with the new published values. Best-effort (wrapped in try/catch) — see
  site-content reference. Save-draft autosaves are noisy; per open question, emit
  audit **on publish only** (resolved: yes).
- **Defaults**: `DEFAULT_APPEARANCE_FIELDS` snapshot of the current theme palette.
- **Cache tag**: `NAME_APPEARANCE = "appearance"` constant used with
  `revalidateTag` on publish (see §9).

### 5. Pothos resolvers — `site-appearance-settings.pothos.ts`

**File (create):** `backend/graphql/pothos/system/site-appearance-settings.pothos.ts`
(Mirror [site-content-settings.pothos.ts](file:///home/ahmed/Projects/siraj/backend/graphql/pothos/system/site-content-settings.pothos.ts).)

```ts
const AppearanceSettingsRef = gqlSchemaBuilder.objectRef<AppearanceSettingsReturnType>("AppearanceSettings");
// implement fields: id (required for Apollo cache normalization — see
// backend/graphql/AGENTS.md), primaryMain, secondaryMain, logoUrl, siteName,
// siteTitle, siteDescription, defaultColorScheme (exposeString/Boolean)

export const AppearanceSettingsQuery = gqlSchemaBuilder.queryFields(t => ({
  appearanceSettings: t.field({
    type: AppearanceSettingsRef,
    args: { draft: t.arg.boolean(), defaultValue: false },
    resolve: ... // draft ? service.getDraft(context perms) : service.getPublished
  }),
}));

export const AppearanceSettingsMutation = gqlSchemaBuilder.mutationFields(t => ({
  saveAppearanceDraft:  t.field({ type: "Boolean", args: { input: t.arg({ type: AppearanceDraftInputRef }) }, resolve: requireAuth + service.saveDraft }),
  publishAppearance:    t.field({ type: "Boolean", resolve: requireAuth + service.publish }),
  resetAppearanceDraft: t.field({ type: "Boolean", resolve: requireAuth + service.resetDraft }),
}));
```

- Use `requireAuth` and the `BaseContext`.
- `AppearanceDraftInput` input ref mirrors `AppearanceFields` (all required text + optional logoUrl).
- Import the service from `@/backend/services` barrel.

### 6. Permission

**Enum** — add to [`backend/enum/permissions/permission.enum.ts`](file:///home/ahmed/Projects/siraj/backend/enum/permissions/permission.enum.ts):

```ts
SETTINGS_APPEARANCE_MANAGE = "settings.appearance_manage",
```

**Seed data SQL** — follow [`backend/db/migration/7b-settings-permissions-data.sql`](file:///home/ahmed/Projects/siraj/backend/db/migration/7b-settings-permissions-data.sql):

- Either append to `7b` (if uncommitted) or create a new `7c-appearance-permissions-data.sql`
  that:
  1. disables `trg_protect_system_permissions` (try/catch),
  2. `INSERT INTO permissions (id, key, resource, action, description, category, is_system)
     VALUES (gen_random_uuid(), 'settings.appearance_manage', 'settings',
     'appearance_manage', $ar/en jsonb, $category jsonb, true) ON CONFLICT (key) DO UPDATE ...`,
  3. re-enables the trigger,
  4. `INSERT INTO group_permissions (group_id, permission_id) SELECT g.id, p.id
     FROM permission_groups g, permissions p WHERE g.slug IN ('super_admin','academy_admin')
     AND p.key = 'settings.appearance_manage' ON CONFLICT DO NOTHING;`

The `academy_admin` slug exists (`SystemPermissionGroupSlug.ACADEMY_ADMIN`).

### 7. Backend barrels

Create `index.ts` barrels (relative `./` paths, `export *`) for:
`backend/db/schema/appearance/`, `backend/db/repo/appearance/`,
`backend/services/appearance/`. Wire into parent barrels (`backend/types`,
`backend/services`, `backend/graphql/pothos`) as applicable.

## GraphQL codegen

After the schema/Pothos changes run:
`bun run generate:gqlSchema && bun codegen`

This regenerates `frontend/common/graphql/generated/...` so the frontend gets
`AppearanceSettings`, `saveAppearanceDraft` mutation, `appearanceSettings`
query, and `AppPermission.SettingsAppearanceManage`.

## Frontend

### 8. Zustand store — `appearancePreviewStore`

**File (create):** `frontend/common/stores/appearancePreviewStore.ts` (the repo keeps
Zustand stores under `frontend/common/stores/`, e.g. `meetingIntegrationsSettingsStore.ts`)

```ts
// NOTE: per frontend/common/stores/AGENTS.md, the `draft` shape must use the
// GraphQL codegen-extracted type (import from
// "@/frontend/common/graphql/generated/gql/graphql") rather than a hand-rolled
// mapping. Define `AppearanceSettingsDraft` in generated types (mirroring
// `AppearanceFields`), and type the store's `draft` as that generated type.
interface AppearancePreviewState {
  draft: AppearanceFields;                 // generated type, e.g. AppearanceSettingsDraft
  isCustomizeMode: boolean;
  isDark: boolean;                          // active per-mode tab
  hydrated: boolean;
  setField(key, value): void;               // updates draft + writes CSS var
  setMode(isDark): void;                    // toggles live app mode
  loadPublished(published): void;           // initialize draft from published
  resetToDefaults(): void;                  // draft = DEFAULT_APPEARANCE_FIELDS + clear inline css vars
  undo(); redo();                           // in-session history stack
}
```

- Written CSS vars: `--mui-palette-primary-main`,
  `--mui-palette-secondary-main` via
  `document.documentElement.style.setProperty(...)`.
- Debounce (3s) autosave: a `useEffect` in a provider calls
  `saveAppearanceDraft` mutation (client, `@apollo/client/react`'s `useMutation`).
- Undo/redo: simple in-memory history stack (not persisted).

### 9. CSS-var writer hook + nativeColor context

- Hook `useAppearanceCssVars()` sets/clears `<html>` inline CSS vars whenever the
  **active-mode** draft colors change — reading
  `draft.colors[activeMode].primaryMain/secondaryMain` (activeMode = `isDark ?
  'dark' : 'light'`), writing `--mui-palette-primary-main` / `--mui-palette-secondary-main`
  under the current `[data-mui-color-scheme=...]` selector.
- The customization context enables `cssVariables.nativeColor: true` selectively
  (see decisions #3) so the browser derives shade/contrast via `color-mix()`.
  A `@supports not (color: rgb(from red r g b))` block ships static fallbacks.

### 10. Overlay — `?customize=1` conditional

- **Root layout** (`app/layout.tsx`): when `?customize=1` is present (read via
  `searchParams`/`useSearchParams` in the client shell), render the extra
  `CustomizeToolbar` above the app and the extra `CustomizeSidebar` beside it.
- **Dashboard shell** (`frontend/common/views/dashboard/components/DashboardProfileShell.tsx`):
  accept an optional `customizeMode` prop; when true:
  - collapse the dashboard sidebar to icon-only (64px) with hover-to-expand,
    restoring its stored state on exit (AC-16),
  - render the amber toolbar in place of the header Customize button (AC-19).
- `CustomizeToolbar` (`?customize=1`): exit-customize, undo/redo, save draft,
  publish, reset-to-defaults (matches prototype `customize-overlay.html`).
- `CustomizeSidebar`: brand identity, per-mode color editors (light/dark tabs),
  logo upload, default-mode radio.
- Guard: customize mode only initializes editable state when the current user has
  `SETTINGS_APPEARANCE_MANAGE` (AC-17).

### 11. Settings Appearance tab

- Add `appearance` tab to
  [`settingsTabs.config.ts`](file:///home/ahmed/Projects/siraj/frontend/common/views/dashboard/settings/config/settingsTabs.config.ts)
  (id `"appearance"`, labelKey `"appearance"`, permissions
  `PAGE_PERMISSIONS.settingsAppearance`, icon e.g. `PaletteOutlined`).
- Add `"appearance"` to `SettingsTabId` in
  [`settings.types.ts`](file:///home/ahmed/Projects/siraj/frontend/common/views/dashboard/settings/types/settings.types.ts).
- Add `settingsAppearance` to
  [`page-permissions.types.ts`](file:///home/ahmed/Projects/siraj/frontend/common/types/page-permissions.types.ts)
  = `[AppPermission.SettingsAppearanceManage, AppPermission.SettingsView]`.
- Add a lazy `AppearanceSettingsTab` to
  [`SettingsTabPanels.tsx`](file:///home/ahmed/Projects/siraj/frontend/common/views/dashboard/settings/SettingsTabPanels.tsx)
  matching the existing `Lazy*` pattern. This form view shows the hero with
  "Enter Customize Mode" CTA + published/draft status + action bar (matches
  prototype `index.html`).
- Add `AppPermission.SETTINGS_APPEARANCE_MANAGE` to the `withPageAuth` list in
  [`app/(dashboard)/settings/page.tsx`](file:///home/ahmed/Projects/siraj/app/(dashboard)/settings/page.tsx)
  (AC-6).
- Add the header Customize button (permission-gated, AC-18) to the dashboard
  header component.

### 12. Logo upload

Reuse the existing storage pipeline (`StorageService` +
`StorageDbRepository`, `VALID_REFERENCE_TABLES`). Add an upload mutation /
handler that stores under an `appearance/` key and returns the URL; write it into
`draft_fields.logoUrl`. On publish the `logo_url` published column is set.
(Finalize the exact storage reference-table key during implementation — see open
question; default to a dedicated `appearance` key.)

### 13. METADATA + server-theme-css override

- **`app/layout.tsx` `generateMetadata()`**: call
  `AppearanceSettingsService.getFirstAppearancePublished()` (cached via
  `unstable_cache` tag `"appearance"`); override `title.default/template`,
  `description`, `applicationName`, `openGraph.*`, `twitter.*`; fall back to
  current translation defaults when null (AC-20).
- **`server-theme-css.ts`** (`frontend/common/lib/server-theme-css.ts`): when a
  published row exists, override `primaryMain`, `primaryContainer`, `onPrimary`
  (and secondary) in the emitted fallback tokens, gated by the published
  `defaultColorScheme`, so first paint matches the brand (AC-21). Publish calls
  `revalidateTag("appearance")` (AC-22).
- `defaultColorScheme`: the published value is read server-side and used as the
  `defaultMode` for the theme provider and `InitColorSchemeScript`, overriding the
  current `#2DD4BF`-dark default (AC-21/AC-20).

### 14. i18n

Add labels to the **settings** locale namespace
(`shared/locale/types/dashboard/settings` + `en`/`ar` impls):

- `tabs.appearance` (the tab label).
- Customizer labels: `customize.enterMode`, `customize.exitMode`.
  `customize.undo`, `customize.redo`, `customize.saveDraft`, `customize.publish`,
  `customize.resetDefaults`, `customize.brandIdentity`, `customize.colors`,
  `customize.light`, `customize.dark`, `customize.logoUpload`,
  `customize.defaultMode`, `customize.published`, `customize.draft`,
  `customize.exportJson`.
- Error strings for the service (`tErrors`) e.g. `appearance.saveFailed`,
  `appearance.publishFailed` in the shared errors/messages namespace.

### 15. JSON Schema & IDE Integration

**File (create):** `shared/schemas/appearance.schema.json`
- Defines the complete JSON Schema matching `AppearanceFields` with property descriptions, hex color regex pattern (`^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$`), enum constraints (`light` | `dark`), and `$schema: "https://json-schema.org/draft/2020-12/schema"`.
- Update `.vscode/settings.json` with `json.schemas` entry pointing to `shared/schemas/appearance.schema.json` for `*appearance*.json` and `.brand.json`.
- Export a schema validator helper in `shared/lib/appearance-schema-validator.ts` using type-safe parsing.

### 16. Fast Cold Starts, ENV Var Hydration & Tiered Resolution

**Tiered resolution order for SSR/Layouts (`AppearanceSettingsService.getResolvedAppearance()`):**
1. **In-Memory Cache (0ms)**: Process-level memory snapshot.
2. **Database Cache (1-5ms)**: Wrapped in Next.js `unstable_cache` with tag `"appearance"`.
3. **Environment Variable (<0.1ms)**: If DB is empty or during cold start / DB failure, parse `process.env.NEXT_PUBLIC_APP_BRANDING` (or `SITE_APPEARANCE_JSON`). Validates against JSON Schema.
4. **Hardcoded Fallback**: `DEFAULT_APPEARANCE_FIELDS`.

**Update `.env.example`:**
```bash
# =============================================================================
# Site Appearance / Branding Defaults (JSON string)
# =============================================================================
# Configures initial branding defaults without requiring a database query.
# Validated against shared/schemas/appearance.schema.json.
# Published settings in the DB will override this if present.
NEXT_PUBLIC_APP_BRANDING='{
  "$schema": "./shared/schemas/appearance.schema.json",
  "siteName": "Siraj",
  "siteTitle": "Siraj - Modern Education Platform",
  "siteDescription": "Next-generation learning management system",
  "logoUrl": null,
  "defaultColorScheme": "dark",
  "colors": {
    "light": { "primaryMain": "#0D9488", "secondaryMain": "#4F46E5" },
    "dark":  { "primaryMain": "#2DD4BF", "secondaryMain": "#818CF8" }
  }
}'
```

### 17. Export JSON Feature

- In `AppearanceSettingsTab` and `CustomizeToolbar`, add an **"Export JSON"** action button.
- Triggers browser blob download of `appearance-settings.json` containing the current state with the `$schema` reference pre-populated.
- Enables operators to copy settings into production environment variables or version control.

### 18. Built-in Preset Themes Catalog (Light & Dark Pairs)

**File (create):** `frontend/common/providers/theme/presets/index.ts`
- Each preset defines paired palettes `{ light: { primaryMain, secondaryMain }, dark: { primaryMain, secondaryMain } }`.
- Available presets:
  1. `default`: `#0D9488` / `#4F46E5` (Light), `#2DD4BF` / `#818CF8` (Dark)
  2. `ocean`: `#0284C7` / `#0EA5E9` (Light), `#38BDF8` / `#7DD3FC` (Dark)
  3. `emerald`: `#059669` / `#10B981` (Light), `#34D399` / `#6EE7B7` (Dark)
  4. `violet`: `#7C3AED` / `#8B5CF6` (Light), `#A78BFA` / `#C4B5FD` (Dark)
  5. `crimson`: `#E11D48` / `#F43F5E` (Light), `#FB7185` / `#FDA4AF` (Dark)
  6. `slate`: `#475569` / `#64748B` (Light), `#94A3B8` / `#CBD5E1` (Dark)
- UI: In the customizer sidebar and appearance tab, a preset picker allows 1-click theme application.

### 19. Settings → Environment Config Tab Integration

- Add branding keys to `ENV_CONFIG_KEYS` in `backend/lib/env-config-keys.ts`:
  - `NEXT_PUBLIC_APP_BRANDING`: `SystemSettingCategory.BRANDING`, dataType `JSON`, isSecret: `false`.
  - `APP_THEME_PRESET`: `SystemSettingCategory.BRANDING`, dataType `STRING`, isSecret: `false`.
- The existing `EnvironmentConfigService` and Settings → Environment tab UI automatically surfaces these keys with status indicator (whether active value comes from DB override, ENV, or default).
- Editing via the Environment tab updates `system_settings` under `env::NEXT_PUBLIC_APP_BRANDING`, automatically invalidating `resolveEnvConfig` cache and appearance cache.

### 20. Accessibility & WCAG AA Contrast Calculation

**File (create):** `shared/lib/color-contrast.utils.ts`
- Implements relative luminance calculation `L = 0.2126 * R + 0.7152 * G + 0.0722 * B` (sRGB IEC 61966-2-1 standard).
- Calculates contrast ratio `(L1 + 0.05) / (L2 + 0.05)` and returns WCAG score (Pass/Fail for AA normal text `4.5:1` and large text / UI components `3.0:1`).
- Customizer derives `--mui-palette-onPrimary` dynamically (`#FFFFFF` on dark primary, `#000000` on light primary) and displays a small badge in the color picker UI.

### 21. Multi-Admin Optimistic Concurrency Control

- `SaveAppearanceDraftInput` and `publishAppearance` mutations accept an optional `expectedUpdatedAt: string`.
- If `expectedUpdatedAt` is provided and the DB record has been updated more recently by another admin, the service throws a localized `AppearanceConflictError` (i18n: `appearance.concurrentEditConflict`).
- The UI catches this and displays a diff prompt ("Another admin recently saved changes. [Reload] or [Overwrite]").

### 22. Defense-in-Depth Input Sanitization & Normalized Caching

- **Hex Normalization**: `backend/services/appearance/appearance.helpers.ts` expands `#RGB` to `#RRGGBB`, lowercases hex strings, and asserts valid format.
- **XSS & HTML Sanitization**: Strips HTML tags from `siteName`, `siteTitle`, and `siteDescription` before persisting and injecting into metadata.
- **Cache-Control Headers for Uploaded Logos**: The storage pipeline stores brand logos with content-hash filenames (`logo-[hash].[ext]`) and sets HTTP headers `Cache-Control: public, max-age=31536000, immutable`.

### 23. Frontend UI Component & Hook Patterns

- **Compound Architecture**: Decompose customizer overlay into atomic compound components:
  - `CustomizeOverlay.Toolbar`: Sticky action bar (undo/redo, save, export, publish, exit).
  - `CustomizeOverlay.Sidebar`: Sliding panel containing Brand, Presets, and Color controls.
  - `CustomizeOverlay.PresetGrid`: Grid of built-in preset cards with active indicator.
  - `CustomizeOverlay.ColorField`: Individual color input with live hex text, color picker, and WCAG badge.
- **Referential Stability & Memoization**:
  - `useDebouncedAutosave`: Wrap mutation triggers with `useRef(mutationFn)` and `useRef(draftState)` to guarantee callback references stay stable across fast slider drags, avoiding re-render storms.
  - `useMemo` for derived CSS tokens and contrast calculations.
- **Accessible Focus Trap & Announcements**:
  - Customizer overlay manages focus on open (`previousFocusRef.current = document.activeElement`) and restores focus on exit.
  - `aria-live="polite"` region notifies screen readers when autosave completes or preset theme is applied.
- **Fault-Tolerant Error Boundary**:
  - `<AppearanceErrorBoundary>` wraps the customizer view to catch any malformed client state or color-mix parser errors, rendering a fallback reset button without crashing the main shell.

### 24. Security & Database Skills Hardening

- **Storage & SSRF (`pentester` & `backend-security-review`)**:
  - Logo uploads use MIME verification + SVG sanitize step to prevent stored XSS attacks.
  - External logo URLs checked via `isSafeUrl()` to block SSRF attempts targeting AWS/GCP metadata endpoints or private LAN subnets.
- **BOLA / IDOR Defense (`idor-testing`)**:
  - Input types cannot pass `userId` or tenant identifiers; all audit fields (`updatedByUserId`) are injected by session context (`ctx.userId`).
- **Drizzle Best Practices (`drizzle-best-practices`)**:
  - `AppearanceSettingsRepository` uses `queryDb(tx)` for non-transactional reads (`get`, `getFirstAppearancePublished`) for stateless Neon HTTP performance.
  - All write mutations pass `tx` to guarantee all statements share the same transaction handle.

### 25. Zod Schema & Strict Type-Safety

**File (create):** `shared/schemas/appearance.zod.ts`
- Single source of truth for runtime validation:
  ```ts
  export const HexColorSchema = z.string().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/);
  export const PerModeColorsSchema = z.object({
    light: z.object({ primaryMain: HexColorSchema, secondaryMain: HexColorSchema }),
    dark:  z.object({ primaryMain: HexColorSchema, secondaryMain: HexColorSchema }),
  });
  export const AppearanceFieldsSchema = z.object({
    colors: PerModeColorsSchema,
    logoUrl: z.string().url().nullable().refine(url => !url || isSafeUrl(url)),
    siteName: z.string().trim().min(1).max(100),
    siteTitle: z.string().trim().min(1).max(200),
    siteDescription: z.string().trim().max(500),
    defaultColorScheme: z.enum(["light", "dark"]),
  });
  ```
- Uses safe parsing with fallback in `AppearanceSettingsService` to handle corrupt or partial ENV strings gracefully.

### 26. Test-Expert 4-Tier Test Suite Specification

**Tier 1: Happy Path & 100% Branch Coverage**:
- `backend/db/test/repo/appearance-settings.repository.test.ts`: 100% line & statement coverage with `runInRollback`.
- `backend/services/appearance/test/appearance-settings.service.test.ts`: 100% branch coverage (permission grants, published snapshotting, audit logging).
- `frontend/common/graphql/test/system/site-appearance-settings.test.ts`: Full mutation argument permutations via `testClient`.

**Tier 2: Edge Cases & Boundaries**:
- Corrupt JSON strings in `NEXT_PUBLIC_APP_BRANDING` (missing braces, null fields, invalid hex codes like `#XYZ123`).
- Boundary text inputs (empty string, 500-char descriptions, RTL Arabic Unicode strings, emojis).
- Malformed logo URLs (e.g. `javascript:...`, `file:///etc/passwd`).

**Tier 3: Monkey & Chaos Testing**:
- Concurrent `saveDraft` vs `publish` requests verifying optimistic lock conflict rejection.
- Mocked DB connection timeouts during `generateMetadata` verifying immediate non-blocking fallback to ENV/defaults.

**Tier 4: Security & Abuse Testing**:
- Low-privilege user attempting `saveAppearanceDraft` or `publishAppearance` (assert `ForbiddenError`).
- Stored XSS injection payloads in `siteName`/`siteTitle` asserting HTML stripping.
- SSRF attack payloads in `logoUrl` (e.g. `http://169.254.169.254/latest/meta-data/`) asserting rejection by `isSafeUrl()`.

## Testing

- **Repo tests** (`backend/db/test/...`): CRUD upsert/get/publishDraft with
  `runInRollback`; never read seeds; use helpers.
- **Service tests** (`backend/services/appearance/test/`): permission enforcement,
  defaults on empty, publish-copies-draft, audit-on-publish.
- **GraphQL integration** (`frontend/common/graphql/test/...`): query/mutation
  via `testClient`; permission matrix (view vs manage vs neither).
- **UI component tests** (`test/ui/components/`): Subscription-form based; mock
  Apollo for the appearance tab + customizer store.
- **E2E** (`test/ui/e2e/`): requires `bun run build:test` first; covers tab
  visibility, customize overlay entry, save/publish, METADATA reflection.

## Open Implementation Details (resolved in this plan)

1. **Default seed values** — `DEFAULT_APPEARANCE_FIELDS` above snapshot the
   current theme palette (`#2DD4BF` primary, `#818CF8` secondary, `dark` default).
2. **Logo storage** — reuse the existing storage pipeline under an `appearance/`
   key (not a new provider).
3. **draft_fields logo** — stored as `draftFields.logoUrl` string; upload-then-reference.
4. **Mobile** — the extra customize sidebar collapses to a bottom sheet on mobile
   (implementation detail; not an AC).
5. **Audit** — emit on **publish only**, not on every autosave.

## Deferred / Out of Scope

- Multi-tenant branding (`tenant_id`) — single global row.
- Persisted undo/redo history across sessions.
- Editing fonts/border-radius/sidebar colors beyond brand primitives.

## Cross-cutting compliance notes

- **MUI v9**: All customizer components must use the `sx` prop for styling (never
  direct style props like `mb`/`fontWeight`/`display` on Typography/Stack/Box/Grid),
  and icon names use the `*Outlined` suffix (e.g. `PaletteOutlined`).
- **Logging**: none of the appearance code may use `console.*`; use `logger` from
  `@/backend/lib` (backend) / `@/frontend/common/lib/logger` (frontend).
- **GraphQL documents** (`frontend/common/graphql/sharedDocuments/...`): name the
  frontend docs `AppearanceSettingsQueryDocument` / `SaveAppearanceDraftMutationDocument`
  / `PublishAppearanceMutationDocument` / `ResetAppearanceDraftMutationDocument`,
  always include the `id` field on `AppearanceSettings` for Apollo cache
  normalization, and import Apollo hooks from `@apollo/client/react`. Prefer
  stateful `useQuery`/`useMutation` over `useLazyQuery`.
- **Service boundary**: `app/layout.tsx` `generateMetadata` and `server-theme-css`
  call `AppearanceSettingsService.getFirstAppearancePublished()` directly (Server
  Component → service); client store/panels use the Apollo hooks for mutations.

## Files touched/summary

| Area | Files |
|------|-------|
| Schema | `backend/db/schema/appearance/appearance-settings.schema.ts`, `index.ts`, drizzle migration |
| Types | `backend/types/appearance.types.ts` |
| JSON Schema | `shared/schemas/appearance.schema.json`, `.vscode/settings.json`, `shared/lib/appearance-schema-validator.ts` |
| Presets | `frontend/common/providers/theme/presets/index.ts` (6 light/dark pairs) |
| Repo | `backend/db/repo/appearance/appearance-settings.repository.ts`, `index.ts` |
| Service | `backend/services/appearance/appearance-settings.service.ts`, `index.ts` |
| Environment Config | `backend/lib/env-config-keys.ts` (`NEXT_PUBLIC_APP_BRANDING`, `APP_THEME_PRESET`), `.env.example` |
| GraphQL | `backend/graphql/pothos/system/site-appearance-settings.pothos.ts` |
| Permission | `backend/enum/permissions/permission.enum.ts`, new `7c-*` migration SQL |
| Frontend store | `frontend/common/stores/appearancePreviewStore.ts` |
| Frontend hooks | `useAppearanceCssVars` (new hook file) |
| Overlay | `app/layout.tsx`, `DashboardProfileShell.tsx`, `CustomizeToolbar`, `CustomizeSidebar` |
| Settings tab | `settingsTabs.config.ts`, `settings.types.ts`, `page-permissions.types.ts`, `SettingsTabPanels.tsx`, `app/(dashboard)/settings/page.tsx`, header Customize button |
| Metadata & SSR | `app/layout.tsx` `generateMetadata`, `frontend/common/lib/server-theme-css.ts` |
| i18n | `shared/locale/types/dashboard/settings` + `en`/`ar` impls |
| Tests | repo / service / GraphQL / UI component / E2E |