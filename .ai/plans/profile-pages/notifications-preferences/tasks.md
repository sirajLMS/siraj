# Tasks

> Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md), [ORCHESTRATION.md](../ORCHESTRATION.md), [VERIFY.md](../VERIFY.md).
> Read `.github/instructions/*.instructions.md` for each layer. Use [stitch-assets/](../stitch-assets/) for design.
> Run plan-review before Layer 1 and after Layers 4 + 12.
 — Notification Preferences

Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md). Full layer stack — new API.

## Layer 1 — Types
- [x] Read `backend/types/AGENTS.md`
- [x] Create `backend/types/notification-preferences.types.ts`
- [x] `NotificationPreferenceReturnType`, `NotificationPreferenceUpdateInput`
- [x] Export from `backend/types/index.ts` if applicable
- [x] `bun tsgo`

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 2 — Schema / Migration / Seed
- [x] N/A — table `user_notification_preferences` exists in `communications.ts`
- [x] Verify enums: `notificationChannelEnum`, `notificationEventTypeEnum`

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 3 — Repository
- [x] Read `backend/db/repo/AGENTS.md`
- [x] Create `notification-preferences.repository.ts` — getByUserId, batchUpsert
- [x] RLS: userId must match actor (enforced in service too)
- [x] Export from `backend/db/repo/index.ts`

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 4 — Services
- [x] Read `backend/services/AGENTS.md`
- [x] Create `notification-preferences.service.ts`
- [x] `getPreferences(userId)` — merge with defaults for missing channel×event combos
- [x] `updatePreferences(actorUserId, input)` — own user only
- [x] Localized errors via `getBackendTranslations`

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 5 — Pothos
- [x] Read `backend/graphql/AGENTS.md`
- [x] Create `notification-preferences.pothos.ts` — types from `@/backend/types`
- [x] Register in `backend/graphql/pothos/index.ts`
- [x] Query: `notificationPreferences`; Mutation: `updateNotificationPreferences`
- [x] Resolvers → service only; every object has `id`

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 6 — GraphQL ops
- [x] Create `notification-preferences.query.ts`, `notification-preferences.mutation.ts`
- [x] Register in query/mutation index files

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 7 — Codegen (schema)
- [x] `bun run generate:gqlSchema`
- [x] `bun codegen`

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 8 — Documents
- [x] Read `frontend/graphql/sharedDocuments/AGENTS.md`
- [x] Create `notification-preferences.documents.ts`
- [x] `notificationPreferencesQueryDocument`, `updateNotificationPreferencesMutationDocument`
- [x] TypedDocumentNode with Operations/Types imports; all objects include `id`
- [x] Export from `sharedDocuments/index.ts`

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 9 — Codegen (operations)
- [x] `bun codegen`

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 10 — Frontend types
- [x] `type NotificationPrefRow = Operations.NotificationPreferencesQuery['notificationPreferences'][number]` if needed
- [x] No duplicate entity definitions

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 11 — i18n
- [x] `profile.notifications.channels.*`, `profile.notifications.events.*` (types, en, ar)

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 12 — UI
- [x] Read `frontend/views/AGENTS.md`
- [x] Depends on [shared-shell](../shared-shell/)
- [x] Create `core/notifications/NotificationPreferencesTab.tsx`
- [x] Create `PreferencesMatrix.tsx` (desktop), `PreferencesAccordion.tsx` (mobile)
- [x] Wire tab in `profileTabs.ts` — own scope only, all audiences
- [x] Optimistic toggle + debounced batch save
- [x] `notificationPreferences` query + `updateNotificationPreferences` mutation only
- [x] Tab load via `useQuery` with `skip` when tab inactive

### VERIFY — this layer
- [x] DATA_POLICY: GraphQL endpoints only — no backend service/repo imports in UI
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 13 — Tests
- [x] Repo test with `runInRollback` wrapper
- [x] Service test: defaults + update
- [x] GraphQL test: own user can update; cannot update other user

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 14 — Verification
- [x] tsgo, biome, lint per file
- [x] Storybook: PreferencesMatrix

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan
