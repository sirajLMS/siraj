# Task 0: Pre-Implementation Baseline — Outcome

**Date**: 2026-08-15
**Task**: 0 — Pre-Implementation Baseline
**Status**: ✅ Complete

## Baseline Counts

- **tsgo errors**: 13
- **biome warnings**: 0
- **lint status**: fail (exit code 1) — 15 problems (15 errors, 0 warnings) per `scripts/lint-service.ts --json --id baseline`

## Pre-existing Issues

Any pre-existing errors/warnings captured above are the baseline. During post-implementation review, compare against these counts to identify NEW errors introduced by this plan.

### Pre-existing tsgo errors (13)
13 `error TS` lines emitted by `bun tsgo` at baseline. These are pre-existing and must not be attributed to this plan.

### Pre-existing biome warnings (0)
`bun biome:check` produced 0 `warn` lines at baseline. Any warnings appearing post-implementation are NEW.

### Pre-existing lint errors (15)
The lint-service baseline run reports `"success": false` with `exitCode: 1` and 15 errors across the following pre-existing files (unrelated to manager-role-permissions-fix):

- `frontend/common/views/dashboard/profile/shared/meeting-configs/DisconnectConfirmDialog.stories.tsx`
- `frontend/common/views/dashboard/profile/shared/meeting-configs/OAuthCallbackHandler.stories.tsx`
- `frontend/common/views/dashboard/profile/shared/meeting-configs/ReconnectAllAction.stories.tsx`
- `frontend/common/views/dashboard/profile/shared/meeting-configs/TokenExpiryWarning.stories.tsx`
- `frontend/common/views/dashboard/settings/components/meetingIntegrations/ConnectProviderAction.stories.tsx`
- `frontend/common/views/dashboard/settings/components/meetingIntegrations/DisconnectConfirmDialog.stories.tsx`
- `test/ui/components/MeetingGenerationStatusIndicator.test.tsx`

Rule categories: `import-x/no-duplicates`, `sonarjs/no-globals-shadowing`, `sonarjs/prefer-specific-assertions`.

Full JSON baseline preserved at `/tmp/baseline-lint.json`.

## Files Modified Before Implementation (git diff baseline)

The following pre-existing uncommitted changes are present in the working tree (unrelated to this plan — they belong to meeting-configs / meetingIntegrations work):

- `frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigDeleteDialog.tsx`
- `frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialog.tsx`
- `frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager.tsx`
- `frontend/common/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsStoryMocks.ts`

## Stash List

Two pre-existing stashes are present (unrelated to this plan):

- `stash@{0}: WIP on master: 6d6420e0 feat(billing): add supported currencies query and enhance currency parsing utilities`
- `stash@{1}: WIP on master: 108b8b56 refactor: streamline code and improve readability across multiple components`

## Deferred Items Ledger

`deferred-items.md` already exists at `.ai/plans/manager-role-permissions-fix/deferred-items.md` with 3 entries (D1-D3):
- D1: GraphQL codegen regeneration needed after enum edit
- D2: Frontend SystemAccessSection.tsx compile-safe removal of Admin label key
- D3: Locale type schema admin key removal

## Carry-Forward Knowledge

- The deferred items D1-D3 represent cross-file dependencies that will cause TypeScript compilation failures until all related files are edited together
- Phase A (Task 1) will break TypeScript compilation intentionally — this is expected and will be resolved by Tasks 6-11
- GraphQL codegen MUST be regenerated (Task 12) after the enum edit before tests can pass
