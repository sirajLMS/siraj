# Fix CodeScene Health Warnings — 68 Files

## Goal
Resolve all 68 CodeScene-flagged files (0 errors, 68 warnings) so `bun run codescene --scan` exits 0 with `With warnings: 0 files`, `With errors: 0 files`.

## Locked decisions
- **waveSize = 16** parallel executor subagents per wave
- **scope = all 68 files** (source + tests + stories)
- **Executor template**: `.agents/skills/fix-codescene/SUB_AGENT_PROMPT_TEMPLATE.md` (mandatory; substitute `<file-path>` and `<paste warning lines>`)
- **Orchestrator**: may NOT read repo source files; builds prompts only from template + scan output; verifies lint queue server before dispatch.

## Hard prohibitions (every executor + orchestrator)
- Never `bun codescene --reset`, `--reset --scan`, `--scan --full`
- Never `bun sonar-scan` / `sonar-manager.ts`
- Never `bun quality-gate` / `quality-gate:fresh`
- Executor edits ONLY its assigned file (exception: rule files printed by `sub-loop.ts` Step 1).
- No `--scan` between waves; only after the final wave.

## Pre-flight (orchestrator, before wave 1)
1. **Lint queue server is guaranteed running** on port 5077 (verified at plan start). No server start/status check needed by executors.
2. **Subagents must NOT start or check the lint server** — it is guaranteed to be running. The `sub-loop.ts` script will use the lint queue client directly without any server health checks.

## Warning-type fix playbook (executor applies per-file)
- **Large Method (LoC=N)** — extract long body into named sub-functions/sub-components **in the same file**; preserve call shape and behavior. Pure mechanical extraction.
- **Code Duplication (null)** — extract duplicated blocks into a local helper/constant/shared JSX **in the same file**; call from each duplicate site. If the true duplicate partner is in ANOTHER file → report CROSS-FILE DEPENDENCY (do not edit the other file); still dedup whatever is possible in-file.
- **Deep, Nested Complexity (nesting=4)** — flatten nested conditionals via early returns / guard clauses / extracted helpers in the same file.
- Test files: extract repeated arrange/act/assert blocks into a local `setupXxx()` / `makeXxx()` factory in the same test file.
- Stories: extract repeated story args into a shared `baseArgs` constant in the same story file.

## Wave assignment (domain-coherent; ordered to surface cross-file clusters early)

**Total: 68 files → 5 waves: 16, 16, 16, 16, 4**

#### Wave 1 — billing/quota + scripts (16)
1. scripts/quota-reminder-cron.ts
2. scripts/ondemand-no-credits-resolver.ts
3. scripts/quota-expiry-sweeper.ts
4. backend/services/billing/quota.service.ts
5. backend/services/billing/credit.service.ts
6. backend/services/billing/quota-notification.service.ts
7. backend/services/notification/quota-notification.builders.ts
8. backend/services/notification/notification-dispatch.helpers.test.ts
9. backend/db/repo/billing/quota.repository.ts
10. backend/graphql/pothos/billing/quota.pothos.ts
11. backend/graphql/pothos/billing/billing-history.pothos.ts
12. frontend/common/views/dashboard/billing/quota/useQuotaFormViewModel.ts
13. frontend/common/views/dashboard/billing/quota/QuotaInsightsContainer.tsx
14. frontend/common/views/dashboard/billing/quota/QuotaDetailContainer.tsx
15. frontend/common/views/dashboard/billing/quota/components/QuotaListDesktop.tsx
16. frontend/common/views/dashboard/admin/meeting-providers/form/useMeetingProviderFormViewModel.ts

#### Wave 2 — cron + schedule + recurring (16)
1. backend/services/cron/cron.service.ts
2. backend/services/cron/test/custom-sql.adapter.test.ts
3. backend/services/cron/test/cron.service.test.ts
4. backend/db/repo/scheduling/recurring.ts (Large 147 lines)
5. backend/db/repo/scheduling/class-instances.ts
6. backend/services/schedule/recurring-class.service.ts
7. backend/services/subject/class-subject.service.ts
8. app/api/cron/ticker/route.test.ts
9. app/api/cron/execute/route.test.ts
10. backend/db/test/repo/cron.repository.test.ts
11. frontend/mobile/views/dashboard/cron/cronView.mobile.tsx
12. frontend/desktop/views/dashboard/cron/cronView.desktop.tsx
13. frontend/common/views/dashboard/cron/useCronViewModel.tsx
14. frontend/common/views/dashboard/cron/components/CronScheduleCreateEditDialog.tsx
15. backend/services/auth/permission-management.service.ts
16. backend/services/auth/test/session.service.test.ts

#### Wave 3 — meeting/whatsapp/communication domain (16)
1. backend/services/meeting/meeting-config-snapshot.test.ts
2. backend/services/meeting/class-meeting-config.service.test.ts
3. backend/services/meeting/class-meeting-config.service.ts
4. backend/services/meeting/meeting-config.service.ts
5. backend/services/meeting/meeting-config-snapshot.ts
6. backend/services/meeting/utils/maybe-generate-url.test.ts
7. backend/services/meeting/integrations/meeting-oauth.service.ts
8. backend/services/meeting/integrations/meeting-integrations.service.test.ts
9. backend/services/meeting/channels/microsoft-teams/MicrosoftTeamsAdapter.ts
10. backend/services/meeting/channels/google-meet/GoogleMeetAdapter.ts
11. backend/services/meeting/channels/zoom/test/ZoomMeetingAdapter.test.ts
12. backend/services/whatsapp/test/whatsapp-webhook.handler.test.ts
13. backend/services/communication/test/whatsapp-channel.test.ts
14. backend/services/communication/test/pair-rate-limit.test.ts
15. backend/db/repo/whatsapp/whatsapp-account.repository.ts
16. app/api/webhooks/whatsapp/route.ts

#### Wave 4 — notifications/teachers + frontend views (16)
1. backend/db/repo/notifications/notification.repository.ts
2. backend/db/repo/notifications/test/notification-rank-guard.test.ts
3. backend/db/repo/teachers/teacher-availability.repository.ts
4. frontend/common/hooks/usePhoneInput.ts
5. frontend/common/views/dashboard/teachers/schedule/weekly/useTeacherWeeklyScheduleViewModel.ts
6. frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.ts
7. frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop.tsx
8. frontend/mobile/views/dashboard/profile/core/notifications/preferencesChannelTabs.mobile.tsx
9. frontend/common/views/dashboard/settings/tabs/meetingIntegrations/useMeetingIntegrationsViewModel.ts
10. frontend/common/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsStoryMocks.ts
11. frontend/common/views/dashboard/settings/components/meetingIntegrations/TestConnectionResultPanel.tsx
12. frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingProviderCredentialForm.tsx
13. frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager.stories.tsx
14. app/api/webhooks/whatsapp/route.test.ts
15. test/integration/communication/whatsapp/whatsapp-unit.test.ts
16. backend/db/test/connection-strategy.test.ts

#### Wave 5 — remaining (4)
1. frontend/common/graphql/test/helpers.ts (Deep Nested Complexity nesting=4)
2. frontend/common/graphql/test/teachers/teacher-onboarding.test.ts
3. frontend/common/graphql/test/teachers/manager-onboarding.test.ts
4. backend/db/test/logic/shared/cache_tag_invalidation.test.ts (Large Method 85 lines :6)

> Verify after assignment: 16 + 16 + 16 + 16 + 4 = 68 ✓.

## Cross-file dependency clusters to watch
Executors may report CROSS-FILE DEPENDENCY for these known same-domain duplication groups. The orchestrator should dedupe `Blocked by` files and schedule a follow-up wave for blockers only:

- **quota-notification builders/dispatch**: `backend/services/notification/quota-notification.builders.ts` (W1) ↔ `backend/services/notification/notification-dispatch.helpers.test.ts` (W1) ↔ `backend/services/billing/quota-notification.service.ts` (W1). If duplication is cross-file between builder & caller, the test/impl fix may need to mirror a helper in the source file. Executors report; orchestrator dispatches the source-holding file first if a test is blocked.
- **meeting-config** cluster (W3): `meeting-config-snapshot.ts` ↔ `meeting-config-snapshot.test.ts` ↔ `class-meeting-config.service.ts` ↔ `class-meeting-config.service.test.ts` ↔ `meeting-config.service.ts`. Source files hold the canonical helpers; tests duplicate setup. If a test is blocked, defer to the source file's executor reporting the test as blocker; orchestrator rebounds to source.
- **cron** source/test cluster (W2): `cron.service.ts` (source) ↔ `cron.service.test.ts` / `custom-sql.adapter.test.ts` / `cron.repository.test.ts` / `app/api/cron/*/route.test.ts`. Source dedup must complete before test files that duplicate its code can fully dedup. **Dispatch cron.service.ts in the same wave as its tests**; if a test reports cron.service.ts as blocker, schedule a mini follow-up wave.
- **whatsapp webhook**: `app/api/webhooks/whatsapp/route.ts` (W3) ↔ `app/api/webhooks/whatsapp/route.test.ts` (W4, different wave). If route.test.ts is blocked by route.ts, orchestrator runs route.ts's review first (already done in W3) then rebound route.test.ts.
- **recurrent booking**: `backend/db/repo/scheduling/recurring.ts` (source) ↔ `backend/services/schedule/recurring-class.service.ts` (W2) ↔ `backend/db/repo/scheduling/class-instances.ts` (W2).
- **teacher availability** repo + its test folder (W4).
- **notification.repository + notification-rank-guard.test** (W4): source = `notification.repository.ts`, test = `notification-rank-guard.test.ts`.

**Rule**: Executors fix what they can in-file; report blockers; orchestrator sends follow-up wave ONLY to `Blocked by` files not already successfully fixed.

## Orchestrator per-wave procedure
For each wave (sequentially), for up to `waveSize` files:
1. Build the `Task` prompt from `SUB_AGENT_PROMPT_TEMPLATE.md`, substituting:
   - `<file-path>` → the assigned file path
   - Both `<paste warning lines>` slots → the exact `warn: ...` lines for that file (from scan output)
2. Dispatch all wave executors in **parallel** (`generalPurpose`, `run_in_background: true`).
3. Wait for the wave to complete.
4. Collect each executor's report:
   - Final sub-loop exit status MUST be 0 (proof: "All checks for lifecycle 'codescene' passed for ...").
   - `CROSS-FILE DEPENDENCY:` blocks → collect.
5. After the wave, dedupe `Blocked by` files; record for a follow-up wave.
6. Relaunch failed executors (non-zero exit, no cross-file report) in a later wave with their own failure output as added guidance.
7. Do NOT run `--scan` between waves.

## Follow-up waves (only if needed)
- **Cross-file follow-up**: after waves 1–5, dispatch one wave for all deduped `Blocked by` files with waveSize = min(16, count). Each gets its own template prompt with that file's warning lines.
- **Failed-executor follow-up**: re-dispatch any executor that exited non-zero without a cross-file report, appending the executor's own failure output as context.

## Final scan (orchestrator)
```bash
bun run codescene --scan
```
Expect:
- `Perfect health: 4797 files`
- `With warnings: 0 files`
- `With errors: 0 files`
- exit 0

If warnings remain, identify which files persist and run a targeted follow-up wave with those files only (template prompt + their surviving warning lines), then re-scan.

## Validation beyond CodeScene
- Each executor's `sub-loop.ts --lifecycle codescene` already runs tsgo → biome → lint(rpc) → codescene on the file. Exit 0 = all green for that file.
- **Test files & stories**: after sub-loop passes, executor should additionally run behavior validation per template Step 4:
  - `bun run scripts/run-test/run-test.ts <test-path>` for `.test.ts` (log-captured).
  - Storybook stories (`*.stories.tsx`) can't be run by a single command; rely on sub-loop's tsgo+biome+lint passing — stories have no runtime test orchestration here.
- **No new plan files/SUMMARY.md** per AGENTS.md AI communication rules — orchestrator reports in chat only.

## Risks & mitigations
- **Behavior change from Large Method extraction** → mitigated by template rule "pure mechanical extraction; do not change behavior" + tsgo/biome/lint gate per file + run-test for tests.
- **Cascading cross-file edits** → mitigated by the FIX-OR-REPORT rule; orchestrator coordinates follow-up waves; no executor touches an unassigned file.
- **Lint queue contention under waveSize=16** → mitigated by the lint queue server serializing requests; starting it pre-flight is mandatory.
- **Large Method in huge files** (e.g. `recurring.ts` 147-line method, `useCronViewModel.tsx` 241 lines, `QuotaInsightsContainer.tsx` 286 lines, `CronScheduleCreateEditDialog.tsx` 177 lines) → executors extract into multiple named sub-functions/sub-components in-file. Higher risk of subtle JSX/logic changes; verify via sub-loop + (for components) that tsgo catches type mismatches. No runtime component tests in scope — accept tsgo+biome+lint as the validation bar for non-test frontend files.
- **Test files with extensive array-table duplication** (e.g. `teacher-onboarding.test.ts` 12× dup, `cron.repository.test.ts` 14× dup, `whatsapp-webhook.handler.test.ts` 10× dup) → extract per-test `setupXxx`/`makeXxx` factories locally; if genuine cross-test-file duplication exists across the `*/test/**` siblings, report CROSS-FILE and let orchestrator rebound.

## Out of scope
- SonarQube (.scannerwork already exists; do NOT trigger sonar-scan).
- `bun quality-gate` (separate skill; after clean scan, owner may auto-transfer to quality-gate — user can run separately).
- Non-flagged files.
- Refactoring file boundaries (e.g. splitting files, moving to new modules) — executors extract helpers in-file only; no new files except within their assigned file's existing scope. (A shared helper in a NEW file is cross-file and out of executor scope.)

## Open items for implementation
None. All decisions resolved; wave buckets authoritative; cross-file clusters identified. Ready for an implementation-capable agent to execute waves 1–5 (+ follow-ups) and the final scan.