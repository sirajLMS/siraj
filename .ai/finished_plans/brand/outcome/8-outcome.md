# Task 8 — Override `generateMetadata()` in `app/layout.tsx`

## Summary

Overrode the root layout `generateMetadata()` so that the published site
appearance (brand name, title, description, logo) drives the `<title>`, meta
description, `applicationName`, Open Graph, and Twitter card tags. When no
published `appearance_settings` row exists — or the cached DB read throws —
the function falls back to the existing translation-based defaults, preserving
the pre-task behavior exactly.

The appearance read goes through `AppearanceSettingsService.getFirstAppearancePublished()`,
which is wrapped in `unstable_cache` with tag `"appearance"` (Task 2.3). That
cache is invalidated on every `publish` call via `revalidateTag("appearance",
"max")` (AC-22), so SSR metadata reflects the latest published appearance
within the Next.js Data Cache revalidation window.

## Requirements Coverage

- **AC-20** — Published appearance overrides SSR metadata (`title`,
  `description`, `applicationName`, `openGraph.*`, `twitter.*`).
  - `title.default` ← `appearance.siteTitle` (full title).
  - `title.template` ← `` `%s | ${appearance.siteName}` `` (short brand
    suffix, replacing the localized `documentTitleTemplate`).
  - `description` ← `appearance.siteDescription`.
  - `applicationName` ← `appearance.siteName` (short brand).
  - `openGraph.{title,description,siteName}` ← appearance fields.
  - `twitter.{title,description}` ← appearance fields.
  - `openGraph.images` / `twitter.images` ← `[{ url: appearance.logoUrl }]`
    when a logo is published (otherwise omitted).
  - `twitter.card` ← `"summary_large_image"` when a logo exists, else
    `"summary"`.
- **AC-22** — Cache invalidation: the read is tagged `"appearance"`;
    `publish` calls `revalidateTag`, so the next SSR render picks up the new
    published values without a redeploy.

## Files Modified

### Edited (1 file)

1. **`app/layout.tsx`** (+2 imports, `generateMetadata` body rewritten)
   - Added imports:
     - `import { AppearanceSettingsService } from "@/backend/services";`
     - `import type { AppearanceFields } from "@/backend/types";`
   - Rewrote `generateMetadata()`:
     - Reads `locale` + `t` (translations) as before — these remain the
       fallback source.
     - Calls `AppearanceSettingsService.getFirstAppearancePublished()` inside
       a `try/catch`; on failure, logs via `logger.error` and proceeds with
       `appearance = null` (translation fallback).
     - Resolves brand values with `appearance?.X ?? t.X` so a single return
       statement serves both the override and fallback paths.
     - Conditionally spreads `images` into `openGraph` / `twitter` only when
       `appearance.logoUrl` is set.

## Design Adherence

### Unified resolve-and-return (no duplicated object literal)

Instead of building a `fallback: Metadata` object and a separate
appearance-overridden object (which would duplicate ~15 lines of structure),
the function resolves scalar brand values first, then returns a single
`Metadata` object:

```tsx
const siteName = appearance?.siteName ?? t.title;
const siteTitle = appearance?.siteTitle ?? t.title;
const siteDescription = appearance?.siteDescription ?? t.description;
const template = appearance
  ? `%s | ${appearance.siteName}`
  : t.documentTitleTemplate("%s");
const images = appearance?.logoUrl
  ? [{ url: appearance.logoUrl }]
  : undefined;
```

When `appearance` is `null`, every `?.` resolves to `undefined` and the `??`
fallback restores the original translation values — the returned `Metadata` is
byte-identical to the pre-task output. When `appearance` is present, the
published values take precedence. This keeps cyclomatic complexity low (single
return, one branch for `template`) and passed codescene cleanly.

### Field mapping rationale

`AppearanceFields` distinguishes `siteName` ("Short brand name, e.g. Siraj.
Used in navbar brand + `<title>` template") from `siteTitle` ("Full title for
`<title>` template + app header"). The mapping:

| Metadata field | Appearance source | Why |
|---|---|---|
| `title.default` | `siteTitle` | Full title for the document title. |
| `title.template` | `` `%s \| ${siteName}` `` | Short brand as the suffix (mirrors the localized `"%s \| Siraj"`). |
| `applicationName` | `siteName` | Short app name (mirrors the original `t.title` = "Siraj"). |
| `openGraph.siteName` | `siteName` | OG site name is the short brand. |
| `openGraph.title` | `siteTitle` | Full title for social cards. |
| `description` / `openGraph.description` / `twitter.description` | `siteDescription` | Meta description. |
| `openGraph.images` / `twitter.images` | `logoUrl` | Logo as the social preview image (only when set). |
| `twitter.card` | `logoUrl ? "summary_large_image" : "summary"` | Large-image card when a logo exists. |

### Resilient read (try/catch → translation fallback)

`getFirstAppearancePublished()` is `unstable_cache`d with `revalidate: 3600`,
so warm-cache reads never touch the DB. On a cold cache, a transient DB/cache
failure would otherwise throw and 500 every page render (metadata runs for
every route). Wrapping the call in `try/catch` and logging via `logger.error`
lets the function degrade gracefully to translations — metadata is
non-critical, and the page body renders independently. This mirrors the
best-effort audit pattern in `appearance-settings.service.ts`.

### `metadataBase` hoisted

`new URL(NEXT_PUBLIC_BASE_URL)` is computed once and reused, rather than
inlined in the return object (the pre-task code inlined it). This is a minor
readability win and avoids reconstructing the `URL` if the function were ever
extended.

## Cross-file Dependencies

### Producers (this task)

- `app/layout.tsx` — edited (`generateMetadata` override + 2 imports).

### Consumers (existing, read but not modified)

- `AppearanceSettingsService.getFirstAppearancePublished()`
  (`backend/services/appearance/appearance-settings.service.ts`, Task 2.3) —
  cached SSR read, tag `"appearance"`.
- `AppearanceFields` type (`backend/types/appearance.types.ts`, Task 2.1) —
  shapes the `appearance` local.
- `getTranslations(locale).commonTranslations` (`@/shared/locale`) —
  fallback `title` / `description` / `documentTitleTemplate`.
- `NEXT_PUBLIC_BASE_URL` (`@/backend/lib/server`) — `metadataBase`.
- `logger` (`@/backend/lib/logger`) — error logging on read failure.

### Downstream

- **Task 8.1** (`server-theme-css.ts`) — will add the same published-appearance
  read to override primary/secondary fallback tokens gated by
  `defaultColorScheme`. The `getFirstAppearancePublished()` cache is shared,
  so the two SSR reads coalesce within a request.
- **Task 10.4** (E2E) — will assert SSR `<title>` / `<meta>` reflection of a
  published appearance row.

## Quality Verification

### Per-file `sub-loop.ts --lifecycle codescene`

All 6 checks passed for `app/layout.tsx`:

```
✅ tsgo passed (no errors for app/layout.tsx)
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed

✅ All checks for lifecycle "codescene" passed for app/layout.tsx
```

## Decisions

- **Unified resolve-and-return vs. branch-and-return.** Chose to resolve
  scalar brand values (`siteName`, `siteTitle`, etc.) with `?.` + `??` and
  emit a single `Metadata` object, rather than an `if (!appearance) return
  fallback;` early-return followed by a separate appearance object. The
  unified form avoids duplicating the ~15-line `Metadata` shape, keeps
  cyclomatic complexity at 2 (one ternary for `template`, one for `card`),
  and passed codescene with no refactor flags.

- **`siteName` → `applicationName` / OG `siteName`; `siteTitle` → `title.default` /
  OG `title`.** The `AppearanceFields` type deliberately splits the short
  brand (`siteName`) from the full title (`siteTitle`). The pre-task code used
  `t.title` ("Siraj") for both `title.default` and `applicationName`, so when
  `appearance` is null the mapping collapses to the identical value. When
  `appearance` is present, the short brand is the right `applicationName` /
  OG `siteName`, and the full title is the right document title.

- **`title.template` uses `` `%s | ${siteName}` `` rather than the localized
  `documentTitleTemplate`.** The appearance settings do not store a per-locale
  template; the published `siteName` is locale-agnostic. Using
  `` `%s | ${siteName}` `` mirrors the English/Arabic default template shape
  (`"%s | Siraj"` / `"%s | سراج"`) with the published brand. A follow-up could
  localize the `|` separator, but the brand suffix is the meaningful part.

- **`logoUrl` → `openGraph.images` / `twitter.images` + `summary_large_image`
  card.** The task spec says override `openGraph.*` / `twitter.*` with
  appearance values; `logoUrl` is an appearance value. Conditionally adding it
  as the social preview image (and upgrading the Twitter card to
  `summary_large_image`) is the natural interpretation. When `logoUrl` is
  `null`, the `images` arrays are omitted entirely (not `[]`), so the pre-task
  output is unchanged.

- **try/catch around the cached read.** `unstable_cache` does not swallow
  underlying DB errors. A cold-cache read during a DB hiccup would throw and
  break every route's metadata. Since metadata is non-critical and the page
  body renders independently, the try/catch logs and falls back to
  translations. This is a deliberate resilience addition beyond the literal
  task spec ("fall back to translations when null"), justified by SSR
  blast-radius.

## Carry-Forward / Deferred

- **`title.template` locale-awareness.** The template suffix uses the
  published `siteName` with a hard-coded `|` separator. If a locale needs a
  different separator (e.g. RTL Arabic), a follow-up could store a
  `titleTemplate` field on `AppearanceFields` or compose the template from
  the localized `documentTitleTemplate` with `siteName` substituted. Out of
  scope for AC-20.

- **`metadataBase` from appearance.** `metadataBase` still comes from
  `NEXT_PUBLIC_BASE_URL`. If a multi-tenant deployment needs a per-tenant
  canonical URL, that would be a separate field. Not in the appearance
  spec (decision #2 limits appearance to 7 brand primitives).

- **`alternates.canonical` / `robots`.** Not overridden — the pre-task
  metadata did not set these, and they are outside the appearance scope.

## Files Touched

| Path | Action | Lines |
|---|---|---|
| `app/layout.tsx` | Edited | +30 / -14 (net +16) |

## Issues / Open Questions

- **No issues.** `app/layout.tsx` passes all 6 codescene-lifecycle checks
  (tsgo, oxlint, biome, lint:type-aware, check:duplicates, codescene). The
  override is backward-compatible (null appearance → identical pre-task
  metadata) and resilient (DB error → translation fallback + logged error).
- **Open question for Task 8.1:** `server-theme-css.ts` will independently
  call `getFirstAppearancePublished()`. Since both are `unstable_cache`d with
  the same key `"appearance-settings-published"` and tag `"appearance"`,
  Next.js deduplicates them within a request. No code change needed here.
