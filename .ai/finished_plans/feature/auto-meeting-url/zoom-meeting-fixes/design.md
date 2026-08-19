# Zoom Meeting-URL Fixes — Technical Design

## Overview

This design describes how to amend the `in-app-meeting-view` draft plan and the finished `auto-meeting-url` plan to resolve verified discrepancies against Zoom's official documentation. The plan touches **planning documents and an existing canonical doc** — it does not modify source code directly. The in-app-meeting-view plan (when executed later) will inherit the corrected specs.

### Design Goals
1. Surface the OBF user-presence sequencing constraint in the in-app spec and design, so external-participant joins fail gracefully with translated messaging.
2. Clarify the conceptual distinction between OBF (app-acts-for-user) and ZAK (user-acts-as-host) tokens.
3. Widen the SDK JWT lifetime margin from the documented minimum to a safer value.
4. Correct the stale 90-day refresh-token claim and confirm `invalid_grant` as the sole re-auth trigger.
5. Reconcile the research-outcome's `participant_video` value with the executed adapter.

---

## Key Design Decisions

### Decision: Plan-amendment scope, not source-code change
**Context:** The in-app-meeting-view plan is a draft (0/51 tasks done). The auto-meeting-url plan is finished.
**Options Considered:**
1. Modify adapter and surface code now — Pros: immediate fix / Cons: the in-app-meeting-view plan would execute against pre-touched code, creating drift between plan and reality.
2. Amend only planning + canonical docs — Pros: clean separation, the executing team inherits corrected specs / Cons: fixes don't land until the in-app plan executes.
**Decision:** Option 2 — amend specs, design, research-outcome, and canonical doc only.
**Rationale:** The in-app-meeting-view plan has not started. Modifying source preemptively creates plan/code drift. Correcting the plans now ensures the executing team builds the right surface the first time.

### Decision: "Waiting for the host" state polls the Zoom participant API
**Context:** OBF-token joins block forever if no authorized host is in the meeting.
**Options Considered:**
1. Polling Zoom List Meeting Participants (`GET /metrics/meetings/{meetingId}/participants`) — Pros: authoritative, low overhead / Cons: requires metrics scope, rate limits.
2. Webhook-based (`meeting.participant_joined`) — Pros: push-based, no polling / Cons: requires a webhook registration infra that's out of scope for the spec amendment.
3. Frontend "retry join" UX — Pros: simplest / Cons: user-visible jank.
**Decision:** Option 1 in v1 — poll the participant API from `ZoomEmbeddedSurface`, mark Option 2 as a v2 evolution.
**Rationale:** Webhooks require new backend infra that exceeds the scope of a spec correction. Polling from the existing surface is a minimal v1 cut; webhook architecture can be added later when the in-app plan reaches its design phase.

### Decision: SDK JWT lifetime `iat + 3600`
**Context:** Zoom's documented minimum SDK JWT window is 30 min (1800 s). The draft plan uses exactly that.
**Options Considered:**
1. `iat + 1800` (current) — Cons: exactly at minimum, fragile to clock drift.
2. `iat + 3600` (60 min) — Pros: 2× the minimum, negligible cost (cached) / Cons: none material.
3. `iat + 7200` (2 h) — Pros: more margin / Cons: unnecessary for a one-session JWT.
**Decision:** Option 2 — `iat + 3600`.
**Rationale:** Doubling the minimum is a safe, conventional margin with no cost. Longer lives add risk of replay if leaked; 60 min matches an industry pattern for session JWTs.

### Decision: Treat `invalid_grant` as the sole authoritative re-auth trigger
**Context:** The research-outcome claimed a 90-day refresh-token expiry, which isn't verifiable in Zoom docs.
**Options Considered:**
1. Rely on a 90-day proactive renewal clock — Cons: undocumented, race-prone, wrong.
2. Treat `invalid_grant` as the sole trigger — Pros: grounded in Zoom docs (the canonical SDK behavior), simpler / Cons: a token may fail slightly before the user expects.
**Decision:** Option 2.
**Rationale:** Zoom rotates refresh tokens on every refresh; `invalid_grant` is the documented signal. Proactive renewal on an undocumented clock adds complexity without correctness.

---

## Component Interactions (in the in-app-meeting-view plan once executed)

The amendments introduce one new state to `ZoomEmbeddedSurface`:

```
ZoomEmbeddedSurface
  ├─ join() calls ZoomObfTokenService.resolveOBFToken()
  │     └─ if no host in meeting → enter "WaitingForHost" state
  │           └─ poll GET /metrics/meetings/{meetingId}/participants
  │                 every 5s, timeout 10 min
  │           └─ translate: inAppMeetingView.waitingForHost
  ├─ join() calls ZoomSdkSignatureService.generateSdkJwt()
  │     └─ exp = iat + 3600  ← widened margin
  └─ host detected → resume SDK join
```

No backend service changes are required by the spec amendments; the polling happens in the surface component (frontend). The v2 backend pre-join hook is documented but explicitly marked out of scope.

---

## UX/Navigation Specification (REQUIRED per skill)

Because this is a plan-correction plan (no source code), the UX spec is minimal — it defines *the spec text the in-app plan must implement*, not UI code:

- **New Routes & URLs**: None introduced by this plan. The in-app-meeting-view plan (when executed) owns the routes; this amendment only adds a state to one component.
- **Sidebar/Navigation Integration**: No changes introduced by this plan.
- **Role-Based Access Matrix**: No change. OBF/ZAK token resolution continues to gate on `TEACHER`/`PARENT`/`STUDENT` per the in-app plan's existing matrix.
- **Per-Audience Rendering**: The "Waiting for the host" state is shown only to external participants joining via OBF (typically parents). Teachers/hosts see their normal host-join flow. This per-audience constraint is added to REQ-5 of the amended spec.
- **Mobile vs Desktop Variants**: No new variants introduced — the state applies to both the mobile and desktop embedded surfaces equally. The amendment requires both variants to render the translated waiting state; no layout diverges.
- **Permission Mapping**: No new permission strings. The OBF Resolution permission (`meeting:read:obf` or similar) continues to be defined by the in-app plan. This amendment adds a *behavior* (waiting state), not a permission.

### Translation Requirement (REQ-0.5)

| Translation key | Namespace | Type schema | English |
|---|---|---|---|
| `waitingForHost` | `shared/locale/types/dashboard/meeting-providers/` (type schema) + `shared/locale/{en,ar}/dashboard/meeting-providers/` (implementations) | `string` | "Waiting for the host to start the meeting" |
| `hostJoinTimeout` | same | `string` | "The host hasn't joined yet. You can keep waiting or try again later." |

**Convention:** Static strings with no parameters are typed as `string` (not `() => string`), implemented verbatim in each locale file. The amended spec references these keys — the keys themselves are *defined as requirements*, not added to `shared/locale/` by this plan (the in-app plan owns the implementation, including Namespace Registration per `shared/AGENTS.md`: add to `shared/locale/types/message.ts` `MessageSchema`, add path mapping in `shared/locale/serverLegacy.ts` `namespacePaths`, and wire into `LocaleProvider` translations in `app/[locale]/layout.tsx` if rendered at layout time).

---

## Error Handling

| Scenario | Behavior | Spec amendment |
|---|---|---|
| External participant joins via OBF before host | Enter "Waiting for the host" state; poll participant API; show translated text | REQ-1 AC #2 |
| WaitingForHost reaches 10-min timeout | Show `hostJoinTimeout` translation; offer "Keep waiting" / "Leave" buttons | REQ-1 AC #2 |
| SDK JWT rejected due to exp | Surface a generic "meeting failed to start" error; log `sdk jwt rejected` (not the token) | REQ-3 |
| `invalid_grant` on refresh-token exchange | Throw `ProviderReauthRequiredError` (existing) — re-prompt user to re-authorize. No proactive renewal logic. | REQ-4 |

---

## Testing Strategy

This plan's deliverables are **document amendments**, not code. Verification is by **reading**:

1. Each spec/design AC maps to a specific textual amendment in a named file. The tasks section specifies the exact text to add/change per file.
2. The Phase 1.5 plan-review gate (`@plan-review` skill) validates the amended specs against AGENTS.md rules and catches cross-reference gaps.
3. There are no unit tests for this plan. The in-app-meeting-view plan, when executed, will own tests for the `ZoomEmbeddedSurface` waiting state and the SDK JWT service.

The `participant_video` correction (Issue #5) is verified by a single grep: `ZoomMeetingAdapter.ts:116` contains `participant_video: true`, and the amended research-outcome and canonical doc must match.

---

## Design Checklist
- [x] All requirements addressed in design (REQ-0 through REQ-5)
- [x] Component responsibilities well-defined (ZoomEmbeddedSurface new state, ZoomObfTokenService constraint, ZoomSdkSignatureService lifetime, doc corrections)
- [x] Interfaces between components specified (polling flow, host detection)
- [x] Error handling covers expected failures (timeout, JWT rejection, `invalid_grant`)
- [x] Security considerations addressed (masked JWT logs, rotated refresh tokens)
- [x] UX/Navigation Specification complete (routes, sidebar, roles, per-audience, mobile/desktop, permissions)
- [x] Translation requirements specified (two keys, typed, namespaced)
