# Plan — Notification Preferences

References: [spec.md](./spec.md), depends on [shared-shell](../shared-shell/plan.md)

## Architecture

```
{Audience}ProfileContainer (tab=notifications, scope=own)
  └── NotificationPreferencesTab
        ├── PreferencesMatrix (desktop)
        ├── PreferencesAccordion (mobile)
        └── SaveBar (auto-save or explicit save)
```

## File paths

| Action | Path |
|--------|------|
| Create | `frontend/views/profile/core/notifications/NotificationPreferencesTab.tsx` |
| Create | `frontend/views/profile/core/notifications/PreferencesMatrix.tsx` |
| Create | `frontend/views/profile/core/notifications/PreferencesAccordion.tsx` |
| Create | `backend/services/notification/notification-preferences.service.ts` |
| Create | `backend/graphql/query/notification-preferences.query.ts` |
| Create | `backend/graphql/mutation/notification-preferences.mutation.ts` |
| Create | `frontend/graphql/sharedDocuments/notification-preferences.documents.ts` |

## Data flow

GraphQL endpoints only — [DATA_POLICY.md](../DATA_POLICY.md).

1. Query `notificationPreferences` for current user on tab mount
2. Merge with defaults for missing channel×event combinations
3. Mutation `updateNotificationPreferences` on toggle change (debounced batch)

## GraphQL (new)

```graphql
query NotificationPreferences {
  notificationPreferences { channel eventType enabled }
}
mutation UpdateNotificationPreferences($input: [NotificationPreferenceInput!]!) {
  updateNotificationPreferences(input: $input) { channel eventType enabled }
}
```

## i18n

Namespace: `profile.notifications.*` — channel names, event type labels

## Risks

- New API surface — needs repo methods on `user_notification_preferences`
- Enum coverage — ensure all event types have labels in en/ar

## Layer pipeline

Full stack — new surface area.

| Step | Layer | Files |
|------|-------|-------|
| 1 | Types | `backend/types/notification-preferences.types.ts` (new) |
| 2 | Schema | N/A — `user_notification_preferences` exists |
| 3 | Repository | new methods on preferences repo or new repo file |
| 4 | Services | `notification-preferences.service.ts` (new) |
| 5 | Pothos | new pothos + query + mutation |
| 6–9 | Codegen + Documents | `notification-preferences.documents.ts` (new) |
| 10 | i18n + UI | `frontend/views/profile/core/notifications/` |

See [LAYER_PIPELINE.md](../LAYER_PIPELINE.md).

## Orchestration & quality

- [ORCHESTRATION.md](../ORCHESTRATION.md) — subagents, plan-review, lint queue
- [VERIFY.md](../VERIFY.md) — gate after each layer in tasks.md
- [GRAPHQL_PATTERNS.md](../GRAPHQL_PATTERNS.md) — client patterns (if UI/GraphQL)
- [stitch-assets/](../stitch-assets/README.md) — local design reference
- Instruction files: `.github/instructions/backend.instructions.md`, `frontend.instructions.md`, `tests.instructions.md`
