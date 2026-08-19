# Deferred Items Ledger

**Plan**: .ai/plans/graphql-devlog-catch-errors/
**Created**: 2026-08-19

| ID | Source Task | Target Task | Description | Status | Notes |
|----|------------|------------|-------------|--------|-------|
| D1 | 7.3 | — | Adding `warnings` field to `deleteRecurringClass` mutation return type requires changing GraphQL type from `Boolean` to custom object | ✅ | Acceptable as-is: `deleteClassInstance` (Task 7) already surfaces warnings. `deleteRecurringClass` has `logger.warn` observability. Full return-type change would require GraphQL schema change + codegen + frontend Apollo cache update for marginal benefit. |
| D2 | — | — | ~~Adding nullable `meetingUrl` field~~ | ✅ | Done: added to types, service, Pothos, and codegen regenerated. |
| D3 | 10.1 | — | Adding `skippedNotificationsByType` to `dispatchWithPreferences` return type | ✅ | Acceptable as-is: structured `droppedByChannel` in WARN log is done (Task 10). Changing return type from `ChannelDispatchResult[]` would break 10+ callers for marginal benefit. Log-level observability is sufficient. | |
