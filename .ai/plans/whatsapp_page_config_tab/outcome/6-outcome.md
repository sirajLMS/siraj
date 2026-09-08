# Task 6 — Frontend UI (Settings ▸ WhatsApp ▸ Config Tab) Outcome

- **Task ID:** 6 (subtasks 6.1–6.6)
- **Date:** 2026-09-07
- **Branch:** `feat/whatsapp-page-config-tab`
- **Scope:** tab integration, config tab panel (own ViewModel + shared content + tier wrappers), responsive shells, i18n (en/ar), quality loop, semantic review. No commits made.

## Summary

The "config" tab is fully integrated into the URL-synced WhatsApp settings tabbed pane: `WhatsappConfigTab` gained `"config"`, and `TAB_IDS`/`TAB_LABELS`/`TAB_PERMISSIONS` in `whatsappConfig.constants.ts` are the single source the nav (`WhatsappTabNav`) and URL resolver (`whatsappTabUrl`) already derive from — so both picked the tab up with no edits (verified by reading both files; they consume `TAB_IDS`/`TAB_LABELS`/`TAB_PERMISSIONS` exclusively). `WhatsappTabPanels` wires a `ConfigTabPanel` that owns its own ViewModel (`useWhatsappConfigViewModel` — queries fire only when the tab mounts, mirroring the inbox pattern) and lazily loads the tier wrappers `ConfigTab.mobile.tsx` / `ConfigTab.desktop.tsx` via `createLazyView` + `ResponsiveViewSwitch`. The shared `WhatsappConfigTabContent` renders all 7 credential fields (Meta App ID, App Secret with reveal toggle, Verify Token with Fast Generate + Copy, Webhook Callback URL read-only + copy + Meta setup guidance, Phone Number ID, WABA ID, Permanent Access Token multiline-masked with toggle, Embedded Signup Config ID optional), the connection-test alert, the read-only notice, and Save/Test actions — gated by `canManage` (`WHATSAPP_CONFIG_MANAGE` from the user store), mirroring the backend permission matrix. Save uses the documented merge semantics (omit/undefined preserves, explicit `null` clears; masked secrets are never echoed back — secret inputs submit only when the user typed a replacement). All labels/tooltips/validation messages/snackbars flow through `WhatsappLabels` with 44 new keys in en + ar + the type schema (en/ar both 233 keys, full parity).

## Files created / modified

**Created (6):**
- `frontend/common/views/dashboard/settings/whatsapp/tabs/shared/WhatsappConfigTabContent.tsx` — shared tier-agnostic form content (fields, generate/copy row, webhook URL + guidance, connection alert, actions, snackbars; local reveal toggles only).
- `frontend/common/views/dashboard/settings/whatsapp/types/whatsappConfigView.types.ts` — `WhatsappConfigFormField`, `WhatsappConfigFormValues`, `WhatsappConfigValidationKey`, `WhatsappConfigConnectionResult`, `WhatsappConfigTabViewModel`.
- `frontend/common/views/dashboard/settings/whatsapp/useWhatsappConfigViewModel.ts` — config ViewModel: config query + update mutation, draft-based form state (draft wins over refetch until save), validation, Test Connection, token generation, clipboard copy, snackbar.
- `frontend/common/views/dashboard/settings/whatsapp/whatsappConfigFormValidation.ts` — pure validators (numeric-only App ID / Phone Number ID / WABA ID; empty = valid) returning `WhatsappLabels` keys.
- `frontend/desktop/views/dashboard/settings/whatsapp/tabs/ConfigTab.desktop.tsx` — desktop wrapper (max-width 960) exporting `ConfigTabDesktop`.
- `frontend/mobile/views/dashboard/settings/whatsapp/tabs/ConfigTab.mobile.tsx` — mobile wrapper (tighter rhythm) exporting `ConfigTabMobile`.

**Modified (6):**
- `frontend/common/views/dashboard/settings/whatsapp/WhatsappConfigView.tsx` — `WhatsappConfigTab` union extended with `"config"` (single-line change).
- `frontend/common/views/dashboard/settings/whatsapp/WhatsappTabPanels.tsx` — `lazyConfigTab` (mobile/desktop dynamic imports), `ConfigTabPanel` (own VM), `TAB_PANELS.config` entry.
- `frontend/common/views/dashboard/settings/whatsapp/whatsappConfig.constants.ts` — `"config"` in `TAB_IDS`, `tabConfig` in `TAB_LABELS`, `config: [WhatsappView, WhatsappConfigManage]` in `TAB_PERMISSIONS` (read gate mirrors backend OR-permission).
- `shared/locale/en/whatsapp/index.ts` — +44 config-tab keys.
- `shared/locale/ar/whatsapp/index.ts` — +44 config-tab keys (proper Arabic, RTL-safe — no directional punctuation issues; interpolations use template placeholders like the existing `configSecretStored(masked)`).
- `shared/locale/types/whatsapp/index.ts` — +56 typed entries in `WhatsappLabels` (incl. function-typed `configSecretStored`).

`WhatsappTabNav.tsx` and `whatsappTabUrl.ts` were **not modified** — verification confirmed they derive entirely from `whatsappConfig.constants.ts` (`TAB_IDS` for the URL whitelist, `TAB_IDS × TAB_PERMISSIONS × TAB_LABELS` for the nav), so the new tab appears in both automatically. No other file in the repo consumes these constants.

## Verification results

### Integration trace (6.1) — tab "config" end-to-end

| Layer | File | Derivation | Verdict |
|---|---|---|---|
| Type | `WhatsappConfigView.tsx` | `WhatsappConfigTab = "numbers" \| "templates" \| "optin" \| "inbox" \| "config"` | ✅ |
| URL | `whatsappTabUrl.ts` | `isWhatsappConfigTab` checks `TAB_IDS.includes(value)` → `?tab=config` resolves; default `TAB_IDS[0]` | ✅ (no change needed) |
| Nav | `WhatsappTabNav.tsx` | tabs = `TAB_IDS.filter(hasPermission(TAB_PERMISSIONS[tab])).map(... TAB_LABELS[tab] → pageLabels.tabConfig)` | ✅ (no change needed) |
| Panels | `WhatsappTabPanels.tsx` | `TAB_PANELS.config = ConfigTabPanel`; `RequirePermission(TAB_PERMISSIONS[activeTab])` + Suspense fallback | ✅ |
| Wrappers | `ConfigTab.mobile/.desktop.tsx` | exports `ConfigTabMobile`/`ConfigTabDesktop` match the dynamic importers in `lazyConfigTab` | ✅ |
| Permissions | constants + generated enum | `AppPermission.WhatsappView` / `.WhatsappConfigManage` exist in `generated/gql/graphql.ts` (lines 352–356) | ✅ |

Grep for `TAB_IDS|TAB_LABELS|TAB_PERMISSIONS|WhatsappConfigTab` consumers across `frontend/`: only the 5 whatsapp files (plus unrelated features' own tab constants) — integration is self-contained and complete.

### Documents usage (carry-forward from 5-outcome.md) — all match generated names

- `whatsappConfigurationQueryDocument` / `updateWhatsappConfigurationMutationDocument` / `testWhatsappConnectionQueryDocument` / `generateWhatsappVerifyTokenQueryDocument` — exported from `sharedDocuments/whatsapp/whatsapp-config.documents.ts` (line 41/50/62/71), re-exported via the barrel chain; imported in the ViewModel from `@/frontend/common/graphql/sharedDocuments`.
- Generated types used: `WhatsappConfigurationFieldsFragment`, `WhatsappConfigUpdateInput`, `WhatsappConfigurationQuery`, `UpdateWhatsappConfigurationMutation(Variables)` (via `useMutation`), `TestWhatsappConnectionQuery`, `GenerateWhatsappVerifyTokenQuery` — all present in `generated/gql/graphql.ts` (types ~5511–5520, documents 6057–6060, `WhatsappConfigUpdateInput` at 2148: 7 keys `string | null | undefined`).
- Usage pattern honored: no codegen hooks exist (typed-document-node codegen) — ViewModel uses `useQuery(document)`, `useMutation(document)`, and `client.query({ query, fetchPolicy: "network-only" })` for the two management queries. `buildConfigInput` implements the omit-preserves / null-clears semantics from the Task 5 carry-forward.
- Field semantics honored: `appSecret`/`accessToken` start empty and never echo masked server values; `verifyToken` visible; `webhookUrl` read-only + copy + Meta setup guidance; `source` (`"db"`/`"env"`) surfaced as a caption.

### i18n parity (6.5) — programmatic check + type-check

- Runtime check (bun import of en/ar modules): all 42 config keys used by the components present in **en** and **ar**; en-only keys: **NONE**; ar-only keys: **NONE** (both namespaces: 233 keys).
- Pre-existing keys reused: `retry`, `errorGeneric` (already in `WhatsappLabels`).
- Type-level: `shared/locale/types/whatsapp/index.ts` declares every key (incl. `tabConfig` consumed by `TAB_LABELS`, and function-typed `configSecretStored`); `whatsappEn`/`whatsappAr` are declared `: WhatsappLabels` and both pass the per-file tsgo step in the quality loop — the type schema checks clean.
- Arabic reviewed for RTL safety: plain sentences with proper Arabic diacritic-free phrasing, `configWebhookUrlGuidance` uses neutral "▸" and Latin tokens (URL / Meta field names) inline — consistent with the existing file style.

### Quality loop (6.6) — `bun run scripts/health/sub-loop.ts <file> --lifecycle …`

`--lifecycle codescene` probed first on one file: environmental failure again (installer runs, then `Executable not found in $PATH: "cs"`, exit 1 — same sandbox limitation as Tasks 1–5) → fell back to `--lifecycle biome` for all 12 files.

| File | tsgo | oxlint | biome:check | Verdict |
|---|---|---|---|---|
| `WhatsappConfigView.tsx` | ✅ | ✅ | ✅ | **passed** |
| `WhatsappTabPanels.tsx` | ✅ | ✅ | ✅ | **passed** |
| `whatsappConfig.constants.ts` | ✅ | ✅ | ✅ | **passed** |
| `tabs/shared/WhatsappConfigTabContent.tsx` | ✅ | ❌ → ✅ (after fix) | ❌ → ✅ (after fix) | **passed after fixes** |
| `types/whatsappConfigView.types.ts` | ✅ | ✅ | ✅ | **passed** |
| `useWhatsappConfigViewModel.ts` | ✅ | ✅ | ✅ | **passed** |
| `whatsappConfigFormValidation.ts` | ✅ | ✅ | ✅ | **passed** |
| `ConfigTab.desktop.tsx` | ✅ | ✅ | ✅ | **passed** |
| `ConfigTab.mobile.tsx` | ✅ | ✅ | ✅ | **passed** |
| `shared/locale/en/whatsapp/index.ts` | ✅ | ✅ | ✅ | **passed** |
| `shared/locale/ar/whatsapp/index.ts` | ✅ | ✅ | ✅ | **passed** |
| `shared/locale/types/whatsapp/index.ts` | ✅ | ✅ | ✅ | **passed** |

**Issues found & fixed (WhatsappConfigTabContent.tsx only, 4 oxlint errors):** (1–2) `WhatsappConfigFormField` imported but never used (eslint no-unused-vars + TS6196) → removed from the type import. (3–4) TS2769 on `sx={[mobileContentGutterBelowMdSx, { … }]}` array literal at the credential grid and the actions Stack — the gutter helper is declared as the broad `SxProps<Theme>` union, which fails MUI's array overload inference → replaced with the repo-sanctioned `mergeSx(mobileContentGutterBelowMdSx, { … })` (same composition pattern as `MobileEmptyState.tsx` / `MobileSectionPanel.tsx`; runtime style output identical, since `mergeSx` flattens to the same sx array). Re-run: tsgo ✅ oxlint ✅ biome:check ✅. All other 11 files passed on first run.

### Semantic greps (6.6)

| Check | Files | Result |
|---|---|---|
| Plan artifacts (`REQ-`, `Task `, `Phase `, `.ai/plans`) | 9 task-6 frontend files | **0 matches** |
| Plan artifacts | 3 locale files | **0 matches in task-6-added lines**; pre-existing provenance comments from earlier feature sections (`Task 11`, `REQ-10`, … at lines 92–265) are committed baseline content, untouched by this task's diff (diff adds only the config-tab sections) |
| Hardcoded hex colors (`#[0-9a-fA-F]{3,8}`) | all 12 files | **0 matches** — colors come exclusively from `theme.palette` callbacks (e.g. `theme => theme.palette.text.secondary`) and MUI severity variants |
| Hardcoded user-facing JSX text (`>Text<` scan on the 3 new components) | content + 2 wrappers | **0 matches** — every label/helper/tooltip/aria-label/snackbar comes from `WhatsappLabels` via the ViewModel, or from pre-localized server data (`connectionResult.message`) |
| Cross-layer imports (`@/backend`, `backend/`) | all 9 frontend files | **0 matches** — imports are MUI/icons, react, repo UI primitives (`SecretTextField`, `FormError/SuccessSnackbar`, `mergeSx`, `mobileContentGutterBelowMdSx`), generated graphql types, sharedDocuments barrel, userStore/logger, `@/shared/locale` |

## Semantic review

- **Layering:** tier wrappers (desktop/mobile) are pure layout shells delegating to shared content; all state/logic lives in the ViewModel (matches the inbox-tab architecture). The settings VM is untouched by config form state — `TAB_PANELS.config` ignores its prop, mirroring the documented inbox pattern.
- **Permission mirroring:** `canManage` (user store, `WhatsappConfigManage`) disables every input/button and drives the read-only notice; nav visibility uses the OR-permission read gate. This mirrors the backend matrix (read = view OR manage; manage ops = manage only) from 5-outcome.md.
- **Secrets hygiene:** masked server secrets are never written into form state; secret inputs submit only non-empty typed values; reveal toggles are local UI state; no secret values in logs (logger calls carry only the error object). `SecretTextField` used in its supported editable mode.
- **Mutation semantics:** Save is disabled until `dirty` and no field errors; `buildConfigInput` preserves unedited fields (undefined → omitted by JSON transport) and clears intentionally emptied visible fields (`"" → null`), matching the integration-tested merge semantics.
- **a11y:** tooltips wrap disabled buttons in `<span>`, copy buttons carry `aria-label`s, tabpanel/tab ids and `aria-busy` fallbacks follow the existing tab patterns, snackbars use the shared form snackbar components.

## Carry-forward for review waves

- The config tab renders behind `RequirePermission` with OR-permission (`WhatsappView`/`WhatsappConfigManage`); editing affordances require `WhatsappConfigManage`. Reviewers without manage see the read-only notice.
- `WhatsappConfigTabContent` is the single shared component for both tiers; only the reveal-toggle state is local. Any field addition must extend: `WhatsappConfigFormField` + `WhatsappConfigFormValues` (types file), `EMPTY_CONFIG_VALUES`/`VISIBLE_FIELDS`/`SECRET_FIELDS`/`areValuesEqual`/`baselineFromConfig`/`buildConfigInput` (ViewModel), the content component, and the 3 locale files.
- `mergeSx` (not raw sx array literals) is required when combining `mobileContentGutterBelowMdSx`-style `SxProps<Theme>`-declared helpers with object literals — MUI v9's array overload rejects the broad union type.
- Server-masked secrets: `config.appSecret`/`config.accessToken` are `••••••••<last4>` tails used only as helper captions via `configSecretStored(masked)`.
- Test-connection messages are pre-localized server-side; the client adds no error text on the happy/failure alert path — only `configTestConnectionError` for the transport-failure path.

## Cross-file dependencies

- `WhatsappConfigView.tsx` (type) ← `whatsappConfig.constants.ts` ← `WhatsappTabNav.tsx` + `whatsappTabUrl.ts` + `WhatsappTabPanels.tsx` (all derive from the constants; the constants file is the integration hub).
- `WhatsappTabPanels.tsx` → dynamic imports → `ConfigTab.mobile.tsx` / `ConfigTab.desktop.tsx` → `WhatsappConfigTabContent.tsx`.
- `useWhatsappConfigViewModel.ts` → sharedDocuments barrel (`whatsapp-config.documents.ts`) → generated `graphql.ts`; → `whatsappConfigFormValidation.ts` → `types/whatsappConfigView.types.ts` → `@/shared/locale/types/whatsapp` + generated fragment type.
- `TAB_LABELS.config = "tabConfig"` → `WhatsappLabels.tabConfig` (types) → en/ar values; `TAB_PERMISSIONS` → `AppPermission` generated enum.
- No backend files touched; Tasks 1–5 artifacts consumed read-only.

## Deferred items

No new code deferrals; no deferred-items.md row added (Task 6 carries no test subtask in the plan — 6.1–6.5 are implementation, 6.6 is quality loop — so no UI component tests were batched; the tab is exercised end-to-end by the Task 5 GraphQL integration suite at the API layer). Environmental (recurring, already tracked as D1): `--lifecycle codescene` unavailable in sandbox (`cs` not in PATH) → biome fallback used on all 12 files; full-repo tsgo/tsgolint OOM (D1) — the per-file tsgo step inside the biome lifecycle passed on all 12 files, and Task 7 re-attempts the full type-check gate.
