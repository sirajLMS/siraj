# Appearance Settings

Appearance settings manage the site's theme colors, logo, site name/title/description, and default color scheme through a single global `appearance_settings` row that keeps **published** columns separate from a **draft** JSONB payload. An admin edits branding in the Settings → Appearance tab (or the customize overlay), which drives the GraphQL `saveAppearanceDraft` / `publishAppearance` / `resetAppearanceDraft` mutations into `AppearanceSettingsService`. `saveDraft` enforces the `SETTINGS_APPEARANCE_MANAGE` permission, sanitizes and Zod-validates the input, replaces only `draft_fields` (published columns stay live), and supports optimistic concurrency via `expectedUpdatedAt` — a mismatch throws `AppearanceConflictError`, which the frontend surfaces as a Reload/Overwrite dialog. `publish` copies the draft into the published columns, calls `revalidateAppearanceCache()` (`revalidateTag("appearance")` plus clearing the in-memory memo), and emits a best-effort audit entry; the first admin access seeds the row with preset-driven defaults. The effective appearance reaches the app shell through `getResolvedAppearance()`, a 4-tier resolution ladder: a 15-second in-memory memo, an `unstable_cache`-tagged DB read, the `NEXT_PUBLIC_APP_BRANDING` env fallback, and finally the static `DEFAULT_APPEARANCE_FIELDS`. `app/layout.tsx` (`generateMetadata`, `buildServerThemeCss`) and `app/manifest.ts` consume this on every SSR render, so a publish invalidates the cache and the next request paints the new branding without redeploy.

## Key sources

- `backend/services/appearance/appearance-settings.service.ts` — service: getAppearance, saveDraft/publish/resetDraft, getResolvedAppearance ladder, conflict error, defaults
- `backend/graphql/query/system/site-appearance-settings.query.ts` — `appearanceSettings` query with draft permission gate
- `backend/graphql/mutation/system/site-appearance-settings.mutation.ts` — `saveAppearanceDraft` / `publishAppearance` / `resetAppearanceDraft` mutations
- `backend/db/schema/appearance/appearance-settings.schema.ts` — single-row table: published columns + `draft_fields` JSONB
- `app/(dashboard)/settings/page.tsx` — settings page entry (`withPageAuth`, includes `SETTINGS_APPEARANCE_MANAGE`)
- `frontend/common/views/dashboard/settings/tabs/appearance/useAppearanceSettingsViewModel.ts` — ViewModel owning the mutations and toasts
- `app/layout.tsx` — SSR consumption: `generateMetadata`, theme-mode resolution, inline server theme CSS
- `frontend/common/lib/server-theme-css.ts` — `buildServerThemeCss` / `resolveServerThemeMode`
- `app/manifest.ts` — PWA manifest built from published appearance

## Diagram

```mermaid
%% Appearance Settings — draft/publish persistence and effective-emission to the app shell
sequenceDiagram
    autonumber
    actor Admin
    participant VM as useAppearanceSettingsViewModel
    participant Q as Pothos Appearance Fields
    participant SVC as AppearanceSettingsService
    participant REPO as AppearanceSettingsRepository
    participant DB as appearance_settings table
    participant CACHE as unstable_cache (appearance tag)
    participant SHELL as App Shell SSR

    Admin->>Q: appearanceSettings draft query
    Q->>SVC: getAppearance actorUserId
    SVC->>REPO: get
    REPO->>DB: SELECT
    alt No row yet
        SVC->>REPO: upsert DEFAULT_APPEARANCE_FIELDS
        REPO->>DB: INSERT seed row
    end
    SVC-->>Admin: full row with draftFields

    Admin->>VM: edit colors siteName logo
    VM->>Q: saveAppearanceDraft input expectedUpdatedAt
    Q->>SVC: saveDraft
    SVC->>SVC: assert SETTINGS_APPEARANCE_MANAGE plus sanitize plus Zod
    opt expectedUpdatedAt mismatch
        SVC-->>VM: AppearanceConflictError APPEARANCE_CONFLICT
        VM-->>Admin: Reload or Overwrite dialog
    end
    SVC->>REPO: upsert draftFields only
    REPO->>DB: UPDATE draft_fields published preserved

    Admin->>VM: publish button
    VM->>Q: publishAppearance
    Q->>SVC: publish
    SVC->>REPO: publishDraft
    REPO->>DB: copy draftFields into published columns
    SVC->>CACHE: revalidateAppearanceCache clear tag plus memo
    SVC->>SVC: best-effort audit log never throws

    SHELL->>SVC: getResolvedAppearance
    alt Tier 1 in-memory memo warm
        SVC-->>SHELL: memo value
    else Tier 2 cached DB read
        SVC->>CACHE: getCachedPublishedAppearance
        CACHE->>DB: SELECT published columns
    else Tier 3 env fallback
        SVC->>SVC: parse NEXT_PUBLIC_APP_BRANDING
    else Tier 4 static defaults
        SVC->>SVC: DEFAULT_APPEARANCE_FIELDS
    end
    SHELL->>SHELL: layout generateMetadata plus manifest plus buildServerThemeCss
```

Machine-checkable copy: [appearance.mmd](./appearance.mmd)
