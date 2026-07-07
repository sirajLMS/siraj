# Tasks

> Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md), [ORCHESTRATION.md](../ORCHESTRATION.md), [VERIFY.md](../VERIFY.md).
> Read `.github/instructions/*.instructions.md` for each layer. Use [stitch-assets/](../stitch-assets/) for design.
> Run plan-review before Layer 1 and after Layers 4 + 12.
 — Notification Preferences

Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md). Full layer stack — new API.

## Layer 1 — Types
- [ ] Read `backend/types/AGENTS.md`
- [ ] Create `backend/types/notification-preferences.types.ts`
- [ ] `NotificationPreferenceReturnType`, `NotificationPreferenceUpdateInput`
- [ ] Export from `backend/types/index.ts` if applicable
- [ ] `bun tsgo`

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 2 — Schema / Migration / Seed
- [ ] N/A — table `user_notification_preferences` exists in `communications.ts`
- [ ] Verify enums: `notificationChannelEnum`, `notificationEventTypeEnum`

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 3 — Repository
- [ ] Read `backend/db/repo/AGENTS.md`
- [ ] Create `notification-preferences.repository.ts` — getByUserId, batchUpsert
- [ ] RLS: userId must match actor (enforced in service too)
- [ ] Export from `backend/db/repo/index.ts`

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 4 — Services
- [ ] Read `backend/services/AGENTS.md`
- [ ] Create `notification-preferences.service.ts`
- [ ] `getPreferences(userId)` — merge with defaults for missing channel×event combos
- [ ] `updatePreferences(actorUserId, input)` — own user only
- [ ] Localized errors via `getBackendTranslations`

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 5 — Pothos
- [ ] Read `backend/graphql/AGENTS.md`
- [ ] Create `notification-preferences.pothos.ts` — types from `@/backend/types`
- [ ] Register in `backend/graphql/pothos/index.ts`
- [ ] Query: `notificationPreferences`; Mutation: `updateNotificationPreferences`
- [ ] Resolvers → service only; every object has `id`

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 6 — GraphQL ops
- [ ] Create `notification-preferences.query.ts`, `notification-preferences.mutation.ts`
- [ ] Register in query/mutation index files

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 7 — Codegen (schema)
- [ ] `bun run generate:gqlSchema`
- [ ] `bun codegen`

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 8 — Documents
- [ ] Read `frontend/graphql/sharedDocuments/AGENTS.md`
- [ ] Create `notification-preferences.documents.ts`
- [ ] `notificationPreferencesQueryDocument`, `updateNotificationPreferencesMutationDocument`
- [ ] TypedDocumentNode with Operations/Types imports; all objects include `id`
- [ ] Export from `sharedDocuments/index.ts`

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 9 — Codegen (operations)
- [ ] `bun codegen`

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 10 — Frontend types
- [ ] `type NotificationPrefRow = Operations.NotificationPreferencesQuery['notificationPreferences'][number]` if needed
- [ ] No duplicate entity definitions

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 11 — i18n
- [ ] `profile.notifications.channels.*`, `profile.notifications.events.*` (types, en, ar)

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 12 — UI
- [ ] Read `frontend/views/AGENTS.md`
- [ ] Depends on [shared-shell](../shared-shell/)
- [ ] Create `core/notifications/NotificationPreferencesTab.tsx`
- [ ] Create `PreferencesMatrix.tsx` (desktop), `PreferencesAccordion.tsx` (mobile)
- [ ] Wire tab in `profileTabs.ts` — own scope only, all audiences
- [ ] Optimistic toggle + debounced batch save
- [ ] `notificationPreferences` query + `updateNotificationPreferences` mutation only
- [ ] Tab load via `useQuery` with `skip` when tab inactive

### VERIFY — this layer
- [ ] DATA_POLICY: GraphQL endpoints only — no backend service/repo imports in UI
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 13 — Tests
- [ ] Repo test with `runInRollback` wrapper
- [ ] Service test: defaults + update
- [ ] GraphQL test: own user can update; cannot update other user

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 14 — Verification
- [ ] tsgo, biome, lint per file
- [ ] Storybook: PreferencesMatrix

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

