# Phase 0 — Pre-Implementation Baseline (student-credit-hours-system)

- **Date**: 2026-08 (captured via SSH bridge from Z.ai sandbox)
- **Branch**: master
- **Captured before any plan work started.**

## Tooling Baseline

| Check | Count | Details |
|---|---|---|
| tsgo | 2 pre-existing errors | `meetingConfigTypeFields.desktop.stories.tsx(8,8)` + `.mobile.stories.tsx(9,8)` — TS2305 missing exported member `MeetingProviderFieldsFragment` (Storybook files, unrelated to this plan) |
| biome:check | 1 warning | generic; full output `/tmp/baseline-biome-full.txt` |
| lint queue | not run at baseline (long); sub-loop.ts per file used during implementation instead |

## Git Baseline

Files already modified BEFORE this plan (must NOT be touched by plan tasks; excluded from review scope):

```
app/api/storage/files/[[...path]]/route.ts
backend/lib/test/security-regression.test.ts
backend/services/profile/profile-field-filter.ts
backend/services/storage/storage.service.ts
frontend/common/components/ui/input/editableTypography/EditableTypographyShared.tsx
frontend/common/components/ui/input/userSelect/AudienceAutocomplete.tsx
frontend/common/views/dashboard/permissions/components/__shared__/manageOverridesDialogShared.tsx
frontend/common/views/dashboard/permissions/components/__shared__/permissionGroupFormShared.tsx
shared/lib/phone/calling-code.ts
```

Staged (from other plans): `.agents/skills/spec-implementation/SKILL.md`, `.ai/plans/credit-adjustment-system/prototype/*`.

## Carry-Forward Notes for Implementers

1. Pre-existing 2 tsgo errors live in Storybook files for meetingConfigTypeFields — IGNORE in quality gates; do NOT fix inside this plan (out of scope).
2. Full baseline outputs saved on remote under /tmp/baseline-*.{txt,json}. Files list = /tmp/baseline-files.txt.
3. Database is the dev PG instance; migrations for this plan must be additive-only.
4. Deferred-items ledger initialized at deferred-items.md (no open items yet).
