# Phase 10 — i18n (`whatsappInbox` namespace + whatsapp additions)

- **Date**: 2026-09-05
- **Plan**: `.ai/plans/whatsapp2/`
- **Tasks covered**: 10.1, 10.2, 10.3, 10.QL, 10.TE, 10.SEC, 10.SR, 10.IV
- **Scope guard**: `shared/locale/` (+ generated `public/static/locale-snapshots/`, `.next-locale-snapshots-version`) only. No `frontend/common/graphql/generated/**`, no `backend/graphql/**` touched (Phase 9 concurrent ownership).

## Summary

The new `whatsappInbox` namespace (read-only Inbox tab strings) is created and
wired on BOTH translation surfaces per `shared/locale/AGENTS.md`: eager
`messages.ts` tree (server) and lazy `defineNamespace` loader (client), with
`whatsappInboxTranslations` on the `Translations` schema and a `WhatsappInbox`
handle in the `Translation` registry. The existing `whatsapp` namespace gains
tab/purpose/onboarding-mode/coexistence-sync label groups keyed to the Phase 1
enums (`WhatsappAccountPurpose`, `WhatsappOnboardingMode`, `WhatsappSyncStatus`,
`WhatsappMessageDirection` referenced in comments only — shared cannot import
backend). The `errors` namespace completes the whatsapp error group with the
six remaining Phase-10.2 error keys alongside the Phase 5/8 pre-seeds
(`whatsappNoSenderForPurpose`, `whatsappEmbeddedSignupFailed`) — EXTEND, not
duplicate.

## New files

| File | Purpose |
|---|---|
| `shared/locale/types/whatsappInbox/index.ts` | `WhatsappInboxLabels` interface (25 keys): title/subtitle, account filter, search, 5 column headers, empty/notice states (incl. `historyDeclinedNotice`, `readOnlyNotice`), thread labels, 3 direction markers (INBOUND/ECHO/API_OUTBOUND), 3 media placeholder states, revoke/edit markers, error state |
| `shared/locale/en/whatsappInbox/index.ts` | `whatsappInboxEn` leaf |
| `shared/locale/ar/whatsappInbox/index.ts` | `whatsappInboxAr` leaf |
| `shared/locale/namespaces/whatsappInbox/whatsappInbox.namespace.ts` | `defineNamespace<WhatsappInboxLabels>("whatsappInbox.whatsappInbox", …)` — stable string id, both locale loaders |
| `shared/locale/namespaces/whatsappInbox/index.ts` | dir barrel (`export * from "./whatsappInbox.namespace"`) |

## Modified files

| File | Change |
|---|---|
| `shared/locale/types/message.ts` | import `WhatsappInboxLabels`; add `whatsappInboxTranslations: WhatsappInboxLabels` to `Translations` |
| `shared/locale/types/index.ts` | `export * from "./whatsappInbox"` (after `./whatsapp`, alphabetical) |
| `shared/locale/namespaces/index.ts` | `export * from "./whatsappInbox"` |
| `shared/locale/namespaces/translation.ts` | import + `WhatsappInbox` registry entry (top level, next to `Whatsapp`) |
| `shared/locale/en/messages.ts` | import + `whatsappInboxTranslations: whatsappInboxEn` |
| `shared/locale/ar/messages.ts` | import + `whatsappInboxTranslations: whatsappInboxAr` |
| `shared/locale/types/whatsapp/index.ts` | New groups: `tabInbox`; purpose labels (`purposeLabel/Helper/General/Advertising/Students/Updated/UpdateFailed`); onboarding mode labels (`onboardingModeLabel/CloudApi/Coexistence`, `coexistenceRestrictionsHint` — specs §322); sync statuses (`syncStatusLabel` + 5 `WhatsappSyncStatus` values), `syncHistoryDeclined` badge (specs journey J2), `syncProgress(percent)` |
| `shared/locale/en/whatsapp/index.ts` | Implementations for the above |
| `shared/locale/ar/whatsapp/index.ts` | Arabic implementations |
| `shared/locale/types/errors/index.ts` | 6 keys after `whatsappEmbeddedSignupFailed`: `whatsappPurposeRequiresActive`, `whatsappAccountOffboarded`, `whatsappCoexistenceTakenByOtherPartner`, `whatsappSyncDeadlineExpired`, `whatsappHistoryDeclined`, `whatsappWebhookProcessingFailed` |
| `shared/locale/en/errors/index.ts`, `shared/locale/ar/errors/index.ts` | Matching leaf entries |

## Reconciliation (pre-seeded keys preserved, not duplicated)

- `whatsapp.noSenderForPurpose` → exists as `errors.whatsappNoSenderForPurpose` (Phase 5) — untouched.
- `whatsapp.embeddedSignupFailed` → exists as `errors.whatsappEmbeddedSignupFailed` (Phase 8) — untouched.
- Phase 8's 13 embedded-signup UI keys in `whatsapp` namespace — untouched. The
  fuller onboarding copy (10.2's "onboarding strings") landed as the onboarding-mode
  label group + `coexistenceRestrictionsHint`; the dialog flow strings were considered
  complete for the currently implemented surfaces.
- Error keys live in the `errors` namespace (matching Phase 5/8 convention and
  resolvers' `ctx.t().errorsTranslations` consumption pattern), NOT duplicated in
  `whatsapp`/`whatsappInbox`.

## Snapshots (10.3)

`bun run locale:snapshots` → 260 snapshots processed, 6 written, hash
`7702bbddab272bf9`:
- NEW: `public/static/locale-snapshots/{en,ar}/whatsappInbox.whatsappInbox.json`
- UPDATED: `{en,ar}/whatsapp.whatsapp.json`, `{en,ar}/errors.errors.json`
- `.next-locale-snapshots-version` regenerated.

## Verification

### 10.QL — sub-loop (codescene lifecycle) per touched file

All 17 `shared/locale/**` files pass (tsgo-filtered / oxlint / biome /
type-aware lint / intra-file duplicates / codescene each exit 0). Snapshot JSON
artifacts are generated output (not sub-loop targets).

### 10.TE — snapshot + key parity

- Key parity script over the generated snapshots: `whatsappInbox` 25/25,
  `whatsapp` 173/173, `errors` 179/179 — zero missing keys in either direction.
- Runtime smoke (both surfaces): `getTranslations("en"/"ar")` resolves
  `whatsappInboxTranslations`, `whatsappTranslations.tabInbox`,
  `syncProgress(45)` interpolation (en `"45% synced"`, ar `"تمت مزامنة 45٪"`),
  and `getServerTranslations("ar").errorsTranslations.whatsappSyncDeadlineExpired`.
  No test files written — locale layer asserts parity via compile-time typing (no
  existing locale unit tests to mirror).

### 10.SEC

Strings only; no secrets, no user input interpolation beyond two existing-style
typed `(param) => string` functions (`syncProgress`, none in whatsappInbox); no
changes to auth/permission flows.

### 10.SR

- Dual-surface wiring complete (both `messages.ts` + namespace loader + handle +
  schema) — the drift risk called out in `shared/locale/AGENTS.md` is closed.
- Stable namespace id `whatsappInbox.whatsappInbox` matches the `<scope>.<key>`
  convention (`whatsapp.whatsapp`, `sms.sms`).
- All imports use `@/shared/locale/...` alias except barrel `./` exports (allowed).
- Enum-mirror keys document the backend enum values in comments; no value imports
  (shared-layer isolation respected).

### 10.IV

Read and applied: root `AGENTS.md`, `shared/AGENTS.md`, `shared/locale/AGENTS.md`
(both printed by sub-loop; no `.agents/instructions/*.md` matches `shared/locale/**` —
frontend/backend/tests instruction files do not cover these paths).

## Cross-file notes

- None blocking. Phase 9 (concurrent) owns GraphQL resolvers that will consume
  `ctx.t().errorsTranslations.whatsapp*` / `.whatsappInboxTranslations`; the keys
  they need are now present. Phase 11/12 consume `whatsapp` purpose/sync keys and
  the `whatsappInbox` namespace.
- tsgo remaining errors (2, in `test/ui/components/**classDetails*`) are foreign
  in-flight work, unchanged by this phase (baseline 9 → 2).
