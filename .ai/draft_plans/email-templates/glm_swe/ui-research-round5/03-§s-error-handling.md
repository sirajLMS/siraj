# Round 5 Audit: §S — Error Handling & Resilience

## Summary
- INVALID designs: 2 (S5, S6)
- PARTIAL designs: 3 (S2, S4, S7)
- NEW gaps: 3
- v9 fixes verified correct: 2/4 (S8 ✓, S7-partial ✓; S5 ✗, S6 ✗)

## S1 — VALID (minor NEW gap)
- `ViewSwitchErrorBoundary` mirrored reference confirmed at `frontend/common/components/ui/container/ResponsiveViewSwitch.tsx:20-79`
- NEW gap: design's "Editor failed to load" fallback is hardcoded English — needs i18n key `t.editorLoadFailed`
- Design should match existing boundary's `{ errorMessage }` state shape and MUI `Alert` + Toolpad `Typography variant="bodyMd"`

## S2 — PARTIAL (frontend file path wrong)
- GraphQL throw pattern verified correct (bare literal `extensions: { code: "UPPER_SNAKE" }`)
- Design says `frontend/common/graphql/utils/errorCodes.ts` — file does NOT exist
- Only existing helper: `frontend/common/utils/errorUtils.ts:10` (`getGraphQLErrorMessage`)
- Design must say "create `frontend/common/graphql/utils/errorCodes.ts`" or extend `errorUtils.ts`

## S5 — INVALID (v9 fix contradicts actual channel contract)
1. Wrong file path: `backend/types/email/emailChannel.types.ts` does NOT exist — actual: `backend/services/communication/channels/email/IEmailChannel.ts`
2. `EmailPayload` is `{ to, subject, html, eventType, userId, metadata? }` — NO `from`, NO `attachments`. `from` is consumed inside `ResendEmailAdapter`, never passed in payload
3. `EmailSendResult` is `{ success, providerMessageId?, error? }` — NOT `{ html, degraded, error? }`. Design conflates two different contracts
4. `safeRender`/`renderForSend` do not exist yet — `grep` returns zero matches
5. **Intra-design contradiction**: design line 70 still says "pass html+text+attachments" while §S5 drops `text` — v9 edited §S5 without parallel-edit of line 70

### S5 Fix for v10:
- `renderForSend(...): Promise<{ html: string; subject: string; degraded: boolean; error?: Error }>` (drop `text`; keep `subject`; add `degraded`; no `attachments`)
- `degraded` consumed by dispatcher (sets `status=FAILED`, `failureReason="render_degraded"`) — NOT via `EmailSendResult`
- Fix design line 70 to match

## S6 — INVALID (unverifiable premise + import cycle)
1. `e.constraint` claim unverified — `is-duplicate-error.ts` only reads `e.code === "23505"`, does NOT access `e.constraint`
2. Existing helper is a boolean predicate, not a mapper — "reuse" is a category error; must EXTEND to `mapDuplicateConstraint(e): { kind: "scope_locale" | "slug" } | null`
3. **Import cycle risk**: repo `catch` throwing `DuplicateScopeLocaleError` from `@/backend/services/...` creates `repo → services` cycle
4. Fix: place typed error classes in `backend/types/.../errors.ts` (neutral layer) OR have service (not repo) catch raw `QueryError` and map
5. Strip "Drizzle exposes `e.code, e.detail, e.constraint`" — assert as requirement to verify in §W1

## S7 — PARTIAL (anti-pattern + frontend type mismatch)
1. Enum-layer path & const-object pattern correct per `backend/enum/AGENTS.md:46-54` ✓
2. NEW anti-pattern: registering error-code enum as Pothos SDL produces dead `enum EmailTemplateErrorCode {…}` with no field referencing it
3. Either: register AND add `result.errorCode` field (so SDL member is reachable), OR don't register and expose union only via frontend
4. If registered: frontend `getGraphQLErrorCode` MUST return codegen'd client enum, not backend const (per `backend/enum/AGENTS.md:36`)
5. Do NOT use `createPgEnumFromEnum` for S7 (it's for `pgEnum` columns, not GraphQL error codes)
6. 10 member list completeness verified ✓

## S8 — VALID (minor NEW gap)
- Toolpad typings verified: `ShowNotificationOptions.severity?: 'info'|'warning'|'error'|'success'` ✓
- `useApolloConnectivity.ts:104-106` verified — passes `severity` ✓
- NEW gap: `notifications.show(..., { actionText, onAction })` may carry callback-action without escalating to `<Alert>` — design convention needs explicit carve-out

## S9 — VALID (path nit)
- `createConnectivityLink` recovery path verified at `frontend/common/providers/apollo/utils.ts` ✓
- `SESSION_EXPIRED` appears ONLY in design file — §S4 cleanup instruction is self-referential; verify §P7 edits applied

## v9 Fix Side-Effects
1. S5: dropping `text` introduced intra-design contradiction (line 70 unchanged)
2. S6: moving typed errors to services creates repo→services import cycle risk
3. S7: registering error-code enum as SDL is new anti-pattern (45 existing enums are all value types)
4. S7: frontend helper return type should be codegen'd enum, not backend const
