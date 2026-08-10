# Locale Namespace Migration Pattern

This document describes the pattern for migrating monolithic locale files to namespace sub-module directories.

## Why This Pattern Exists

Monolithic locale files (e.g., `profile.ts`, `meeting-config.ts`, `payment-method.ts`) grew too large and created duplication with the namespace directory structure. The migration splits these files into sub-modules.

## The Pattern

### Structure

Before (monolithic):
```
shared/locale/en/ui/meeting-config.ts    # Single large file
shared/locale/ar/ui/meeting-config.ts
```

After (namespace directory):
```
shared/locale/en/ui/meetingConfig/
  index.ts          # Re-exports all sub-modules
  display.ts        # Display-related labels
  manager.ts        # Manager-related labels
  reauthNeeded.ts   # Re-auth labels
  ...
shared/locale/ar/ui/meetingConfig/
  index.ts
  display.ts
  ...
```

### Migration Process

1. Create the camelCase directory (`meetingConfig/`, not `meeting-config/`)
2. Split the monolithic file content into logical sub-modules
3. Create `index.ts` that re-exports all sub-modules
4. Update namespace registration in `shared/locale/namespaces/ui/<name>.namespace.ts`
5. Update import paths in `shared/locale/{en,ar}/ui/index.ts`
6. Update import paths in `shared/locale/{en,ar}/messages.ts`
7. Delete the monolithic file
8. Verify with `bun check:duplicates` and `bun tsgo`

### Naming Convention

- Directory names: camelCase (`meetingConfig/`, `paymentMethod/`)
- NOT kebab-case (`meeting-config/` is wrong)
- Namespace keys: dot-separated (`ui.meetingConfig`, `ui.paymentMethod`)

## Translation System Compliance

When migrating locale files, verify:

- Client components use `useAppTranslation(Translation.<Namespace>)` with Translation enum (not string literal)
- Translation objects accessed via property access (`t.propertyName`) NOT function calls (`t(propertyName)`)
- Server components use `await getTranslations(locale)` (single arg) and access namespace as property
- Namespace directories use lowercase casing
- NO `useAppTranslation("stringLiteral")`
- NO `getTranslations(locale, "namespace")` (two args)
- NO `t(functionCall)`
- NO hardcoded strings
- NO `next-intl` imports

## Completed Migrations

| Namespace | Monolithic File | New Directory | Task |
|-----------|----------------|---------------|------|
| profile | `locale/{en,ar}/profile.ts` | `locale/{en,ar}/profile/` | 3.3 |
| meetingConfig | `locale/{en,ar}/ui/meeting-config.ts` | `locale/{en,ar}/ui/meetingConfig/` | 3.4 |
| paymentMethod | `locale/{en,ar}/ui/payment-method.ts` | `locale/{en,ar}/ui/paymentMethod/` | 3.5 |

## Related Documents

- `shared/AGENTS.md`
- `.ai/plans/duplications/outcome/3.4-locale-meeting-config-migration-outcome.md`
- `.agents/instructions/frontend.instructions.md`
