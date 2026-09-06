# 8 — Embedded Signup Onboarding Outcome

- **Task**: Phase 8 (`8-signup`) of `.ai/plans/whatsapp2/`
- **Date**: 2026-09-05
- **Requirements**: REQ-4 (ES v4 coexistence onboarding, client + server)

## Deliverables

| Task | Surface | State |
|---|---|---|
| 8.1 | `cloud-api/requests/embedded-signup.request.ts` (code exchange, `subscribed_apps`, platform-fields confirm) | new |
| 8.1 | `whatsapp-account.service.ts` `completeEmbeddedSignup` (coexistence confirm + account creation) | new fn |
| 8.1 | `backend/lib/errors.ts` `WhatsappEmbeddedSignupError` (`whatsapp.embeddedSignupFailed`) | new |
| 8.2 | `whatsapp-account.pothos.ts` `WhatsappEmbeddedSignupInput` + `whatsapp-account.mutation.ts` `completeWhatsappEmbeddedSignup` (permission `WHATSAPP_CONFIG_MANAGE`) | new |
| 8.2 | Schema regenerated + codegen rerun; `completeWhatsappEmbeddedSignupMutationDocument` in `sharedDocuments/whatsapp/whatsapp.documents.ts` | new |
| 8.3 | `frontend/.../whatsapp/embeddedSignup/` (types, `embeddedSignupSdk`, `useEmbeddedSignupSession`, `EmbeddedSignupDialog`, barrel) | new |
| 8.3 | Server page resolves `WHATSAPP_ES_CONFIG_ID` + `WHATSAPP_APP_ID` → Container → ViewModel → Numbers tab (desktop + mobile) | wired |
| 8.TE | `backend/services/whatsapp/test/whatsapp-embedded-signup.test.ts` (13 tests, green) + `test/ui/components/whatsapp/whatsappEmbeddedSignupDialog.test.tsx` (written, **not run** per user constraint) | done |

## Server flow (`completeEmbeddedSignup`)

Permission (`WHATSAPP_CONFIG_MANAGE`), input validation (numeric wabaId/phoneNumberId ≤64, code ≤2048), env-config app credentials (`WHATSAPP_APP_ID`/`WHATSAPP_APP_SECRET`), then: exchange `code` → business-integration token (`GET /oauth/access_token`) → resolve phone number (explicit `phoneNumberId`, else `GET /<WABA_ID>/phone_numbers` must yield exactly one) → coexistence confirm (`is_on_biz_app === true && platform_type === "CLOUD_API"`) → duplicate check on `phoneNumberId` → `POST /<WABA_ID>/subscribed_apps` (failure tolerated: warn + continue; surfaces later as settings warning) → create account row (`onboardingMode: COEXISTENCE`, real token via `encryptedText`, `isActive: true`) → audit → `resetWhatsappChannel` → `enqueuePostOnboardingSync` (Phase 6; failure logged, never rolls back onboarding). Every Meta failure surfaces as `WhatsappEmbeddedSignupError` with the localized `whatsappEmbeddedSignupFailed` message; internals only logged.

## Frontend flow (8.3)

- `page.tsx` resolves `WHATSAPP_ES_CONFIG_ID` + `WHATSAPP_APP_ID` via `resolveEnvConfigMany` server-side and passes both down as props — `config_id` is never client input and never hardcoded.
- `useWhatsappSettingsViewModel({ esConfigId, esAppId })` gains `openEmbeddedSignupDialog` (new `dialogState.type: "embeddedSignup"`), `embeddedSignupSubmitting`, and `handleEmbeddedSignupComplete` (mutation + accounts refetch + snackbar; rethrows so the dialog lands on its error phase).
- `EmbeddedSignupDialog` renders phase surfaces: idle/launch, waiting (FB popup open), submitting, success, cancelled (CANCEL event or popup closed without a code), error (ERROR event or mutation failure), not-configured. `useEmbeddedSignupSession` owns the FB SDK lazy loader (`ensureFbSdk`, locale-aware `en_US`/`ar_AR`, init version `v25.0`), the `FB.login` call (`response_type: "code"`, `extras: { setup: {}, featureType: "whatsapp_business_app_onboarding" }` — no `version` in extras, per ES v4), and the `WA_EMBEDDED_SIGNUP` message listener (object or JSON-string payloads; FINISH/FINISH_ONLY_WABA/FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING complete; CANCEL/ERROR surface).
- Numbers header gains an optional permission-gated "Connect Business App" button (`NumbersHeaderShared`), rendered on both desktop and mobile tabs; the dialog is shared with `fullScreen=true` on mobile.

## Tests (8.TE)

- Backend: 13 tests in `whatsapp-embedded-signup.test.ts`, all green via `run-test.ts`. Mocked `fetch` (URL-routed per endpoint), mocked repos/permissions/audit/env-config, mocked `WhatsappCoexistenceSyncService.enqueuePostOnboardingSync`. Covers: happy path with and without `phoneNumberId` (only-waba_id resolution), decline paths (`is_on_biz_app` false, non-CLOUD_API platform), exchange failure → `whatsapp.embeddedSignupFailed`, missing app credentials, duplicate number, multi-number ambiguity, empty WABA, subscribed_apps failure tolerated, sync-enqueue failure tolerated, permission denial before any Meta call, invalid input.
- UI: `whatsappEmbeddedSignupDialog.test.tsx` — 8 tests (launch surface, not-configured, FINISH complete + payload shape, only-waba payload, CANCEL surface, ERROR surface, popup-close cancellation, rejection → error, foreign-message ignore). Written but NOT executed (user constraint).
- Extra verification: `whatsapp-optin.test.ts` was red (missing `WhatsappContactRepository`/conversation/message stubs in its repo-barrel mock once Phase 7 inbox helpers landed). Fixed inside the test file (barrel mock surface extension) — 16/16 green.

## i18n additions (minimal, per Phase-8 allowance)

- `errors` namespace: `whatsappEmbeddedSignupFailed` (en+ar).
- `whatsapp` namespace: `connectBusinessApp`, `embeddedSignupTitle/Description/Launch/WaitingTitle/WaitingBody/CancelledTitle/CancelledBody/ErrorTitle/SuccessTitle/SuccessBody/Retry/NotConfigured` (en+ar). Phase 10 owns the fuller onboarding copy.

## 8.SEC

- `config_id` + App ID resolved server-side from env-config and passed as props; clients only submit `code` + Meta-issued asset IDs (`wabaId` mandatory, `phoneNumberId`/`businessId` optional).
- Authorization codes are single-use at Meta: replay fails the exchange → `whatsapp.embeddedSignupFailed` (tested).
- Mutation gated by `WHATSAPP_CONFIG_MANAGE` (authScopes + service `assertCanManage`); UI button additionally permission-gated via `RequirePermission`.
- IDs validated as numeric ≤64 chars server-side; tokens never logged (masked `***last4` in audit/log lines); exchange credentials come only from env-config.

## 8.SR / 8.IV

- No `...input` spread into GraphQL service call (resolver maps fields explicitly); no unbounded module state (dialog state is React refs/state); no plan tags added in comments.
- Read and applied: root `AGENTS.md`, `backend/AGENTS.md`, `backend/services/AGENTS.md`, `backend/types/AGENTS.md`, `backend/graphql(/pothos|/mutation)/AGENTS.md`, `frontend/common/views/AGENTS.md`, `frontend/mobile/AGENTS.md`, `frontend/desktop/AGENTS.md`, `app/AGENTS.md`, `shared/locale/AGENTS.md`, `frontend/common/graphql/sharedDocuments/AGENTS.md`, `test/ui(/components)/AGENTS.md`.
- tsgo caveat: two unrelated in-flight areas (carryover journey test by another agent; classDetails fixtures vs `class-instances.ts` type drift) fail repo-wide tsgo — none of my files report errors; every Phase 8 file passes `sub-loop.ts --lifecycle codescene` (exit 0, results logged below).

## 8.QL results

All 32 touched files pass `scripts/health/sub-loop.ts --lifecycle codescene` (exit 0). First sweep: 24 pass / 8 fail; the 8 failures were fixed in-place:

- oxlint `no-redundant-type-constituents` → ES event type widened to plain `string`.
- oxlint `prefer-add-event-listener` → `script.addEventListener("error", …, { once: true })`.
- oxlint `no-unsafe-type-assertion` (message parsing) → `Reflect.get` field reads + `isSessionData` type guard.
- oxlint `react(refs)` → `onCompleteRef` sync moved into `useEffect`.
- ESLint import alias + `sonarjs/no-nested-functions` → absolute `@/` imports; FB.login response handler extracted to `handleLoginResponse`.
- jsx-a11y `prefer-tag-over-role` → success surface uses `<Box component="output">`.
- CodeScene Large Method → `useWhatsappPageInteractions` extraction (ViewModel) and `NumbersHeaderDesktop` extraction (desktop tab).
- Test file: nested ternary → `requestUrlOf`, `toHaveLength` assertions, instance-of narrowing.

Notable test-authorship hazard (recorded for later phases): mocking the `@/backend/services` barrel with `collectAllPhoneNumbers`/`buildGetPhoneNumberRequest` stubs silently shadows the real deep-path imports inside `whatsapp-account.service.ts` under Bun's module mocking — flows that should call those builders resolve to the stub instead. Omitting those keys from the barrel mock keeps the real builders live.
