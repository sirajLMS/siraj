# Research Verification Outcome — 2026-08-01

## What was done

Four parallel deep-research subagents verified Zoom Meeting SDK, Google Meet APIs, Microsoft Graph/Teams APIs, and Next.js 16 / Bun runtime patterns against official documentation. Plan files updated from v1.0 → v1.1.

## Critical corrections applied to plan

| # | Correction |
|---|------------|
| 1 | OBF enforcement = **March 2, 2026** (Feb 23 = readiness deadline only) |
| 2 | JWT payload must include **`appKey`** + `sdkKey` (same value) |
| 3 | `client.join()` must **not** pass `sdkKey`/`apiKey` (SDK v4+); Component View uses `password` not `passWord` |
| 4 | Zoom url_validation response field = **`encryptedToken`** (not `encryptedTimestamp`) |
| 5 | Zoom participants scope = **`report:read:list_meeting_participants:admin`** (legacy deprecated) |
| 6 | Meet recordings: **Workspace Events API + Pub/Sub** primary; polling is fallback (not poll-only) |
| 7 | Meet recording shape: **`driveDestination.fileId` + `shareUri`** only (no `playUrl`) |
| 8 | Teams recording field = **`recordingContentUrl`** (not `downloadUrl`) |
| 9 | Teams attendance = **poll-only** (no Graph webhook); requires `AllowEngagementReport` policy |
| 10 | Teams rich notifications = **encrypted** (`encryptedContent` + certificate decryption) |
| 11 | Apollo Client v4: use **`fetchPolicy: 'no-cache'`** (ignores HTTP Cache-Control) |
| 12 | Scheduler: **`Bun.cron()`** in-process (Bun 1.3.12+) — resolved open question #6 |
| 13 | MUI DataGrid CSV export = **Community tier** (not Pro-only) |
| 14 | `undici` MockAgent: **install `undici` explicitly** for Bun tests (bundled shim is stub) |

## Files updated

- `.ai/plans/in-app-meeting-view/specs.md` (v1.1)
- `.ai/plans/in-app-meeting-view/design.md` (v1.1) — added §Research Verification Summary table
- `.ai/plans/in-app-meeting-view/trackable-tasks.md` (v1.1)

- Carry-over for implementation

- Teams webhook route needs encryption certificate registration at Graph subscription creation time — env keys `TEAMS_WEBHOOK_ENCRYPTION_CERT` + `TEAMS_WEBHOOK_ENCRYPTION_CERT_ID` added to task 1.7.
- Meet webhook route must subscribe to Google Workspace Events API topic (admin setup step in runbook REQ-14).
- Zoom `download_token` in `recording.completed` webhook expires after 24h — ingest must persist URLs promptly (REQ-8 AC2).
- Zoom OBF token: `GET /v2/users/{userId}/token?type=onbehalf&meeting_id={meeting_id}` with `user:read:token` scope (REQ-3).

## Official source index

See design.md §Research Verification Summary for full URL table.
