# English Translation Migration Plan

## Goal

Migrate the monolithic `shared/messages/en.ts` (2251 lines) into a split directory structure matching `shared/messages/ar/`, so both locales have identical file-per-domain organization.

## Target Structure

```
shared/messages/en/
├── index.ts           ← Assembles all English translations (typed as MessageSchema)
├── errors.ts          ← Error translations
├── auth/
│   └── index.ts
├── common/
│   └── index.ts
└── dashboard/
    ├── admin/
    │   ├── index.ts
    │   ├── dashboard.ts
    │   └── dst.migration.ts
    ├── billing/
    │   ├── index.ts
    │   ├── main.ts
    │   └── manual.ts
    ├── classes/
    │   ├── index.ts
    │   ├── main.ts
    │   ├── details.ts
    │   ├── audit.ts
    │   ├── reschedule.form.ts
    │   └── reschedule.tracking.ts
    ├── complaints/
    │   ├── index.ts
    │   └── main.ts
    ├── core/
    │   ├── index.ts
    │   ├── layout.ts
    │   ├── nav.ts
    │   ├── notifications.ts
    │   ├── parent.dashboard.ts
    │   ├── schedule.alerts.ts
    │   ├── search.schedule.ts
    │   └── status.tracking.ts
    ├── managers/
    │   ├── index.ts
    │   ├── directory.ts
    │   └── onboarding.ts
    ├── parents/
    │   ├── index.ts
    │   ├── directory.ts
    │   ├── onboarding.ts
    │   └── profile.ts
    ├── permissions.ts
    ├── reports/
    │   ├── index.ts
    │   └── main.ts
    ├── resources/
    │   ├── index.ts
    │   └── main.ts
    ├── students/
    │   ├── index.ts
    │   ├── directory.ts
    │   ├── history.ts
    │   ├── quota.ts
    │   └── status.ts
    ├── suggestions/
    │   ├── index.ts
    │   └── main.ts
    └── teachers/
        ├── index.ts
        ├── availability.ts
        ├── create.recurring.class.ts
        ├── dashboard.ts
        ├── directory.ts
        ├── future.schedule.ts
        ├── onboarding.ts
        ├── profile.ts
        ├── reassignment.ts
        └── weekly.schedule.ts
```

## Migration Steps

### Phase 1: Extract top-level keys from en.ts
- `common` → `en/common/index.ts`
- `auth` → `en/auth/index.ts`
- `errors` → already done in `en/errors.ts`
- `session` → already done in `en/index.ts`

### Phase 2: Extract dashboard domains from en.ts
Extract each `dashboard.*` key into its own file under `en/dashboard/`, mirroring the `ar/dashboard/` structure exactly.

### Phase 3: Wire up en/index.ts
Update `en/index.ts` to import all split files and assemble the full `MessageSchema`-typed object, matching the pattern used in `ar/index.ts`.

### Phase 4: Delete monolithic en.ts
Replace `en.ts` with a re-export from `en/index.ts`:
```ts
export { enTranslations as default } from "./en";
```

### Phase 5: Verify
- `bun tsgo` — zero errors
- `bun biome:check` — clean
- Both `ar/` and `en/` must produce objects typed as `MessageSchema`

## Rules
- Every extracted file must import its label type from `../types/` for type safety
- Export names must match the `MessageSchema` key names (same as Arabic files)
- Each `index.ts` re-exports from domain files and assembles the parent object
- No hardcoded strings — all text comes from these message files
