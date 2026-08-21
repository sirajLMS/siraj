# Site Appearance Customization — Locked Decisions

> Planning session for a `/settings/appearance` tab (super admin + academy admin)
> that customizes site look: name, title, description, logo, theme colors.
> Design includes a `?customize=1` overlay wrapping the real app with an extra
> header + extra sidebar for live WYSIWYG editing.

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
