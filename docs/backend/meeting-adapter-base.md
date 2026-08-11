# Meeting Adapter Base Class Pattern

## Overview

The Siraj project supports three meeting providers (Google Meet, Microsoft Teams, Zoom). Each adapter implements `IMeetingChannel` with near-identical OAuth token management, retry-with-jitter backoff, timeout/abort utilities, and token clearing logic. This pattern extracts those shared concerns into an abstract base class.

## Files

| File | Purpose |
|------|---------|
| `backend/services/meeting/channels/__shared__/meetingAdapterBase.ts` | Abstract base class + shared utilities |
| `backend/services/meeting/channels/google-meet/GoogleMeetAdapter.ts` | Concrete adapter (extends base) |
| `backend/services/meeting/channels/microsoft-teams/MicrosoftTeamsAdapter.ts` | Concrete adapter (extends base) |
| `backend/services/meeting/channels/zoom/ZoomMeetingAdapter.ts` | Concrete adapter (extends base) |

## Pattern Details

### Template Method Pattern

The base class implements the shared flow (token resolution, retry, timeout) and delegates provider-specific logic to abstract methods:

```typescript
abstract class MeetingAdapterBase implements IMeetingChannel {
  abstract resolveAccessToken(userContext): Promise<string>;
  abstract callProviderApi(token, meetingData, userContext): Promise<GenerateMeetingResult>;
  abstract readonly tokenRefreshMarginMs: number;

  async generateMeetingLink(meetingData, userContext): Promise<GenerateMeetingResult> {
    const token = await this.resolveAccessToken(userContext);
    // shared retry-with-jitter flow
  }
}
```

### Exported Utilities

- `fetchWithTimeout(url, init, timeoutMs)` — fetch with AbortController
- `withTimeout(promise, timeoutMs)` — generic timeout wrapper
- `jitterDelay(attempt)` — exponential backoff with jitter
- `isRecord(value)` — type guard for `Record<string, unknown>`
- `isTokenExpired(token, marginMs)` — JWT/token expiry check

### Constants

- `REQUEST_TIMEOUT_MS` — default API timeout
- `RETRY_JITTER_BASE_MS` — base delay for retry backoff
- `MAX_GENERATE_RETRIES` — maximum retry attempts

## Key Design Decisions

1. **`callProviderApi` returns `GenerateMeetingResult`** (not raw `Response`) — avoids "body already used" issues from consuming the response stream twice.

2. **`resolveAccessToken` is abstract** — each provider has fundamentally different token acquisition flows (Google: OAuth2 refresh, Zoom: server-to-server, Teams: client credentials).

3. **`tokenRefreshMarginMs` varies per provider** — Google/Zoom use 60s, Teams uses 120s (Microsoft tokens have different TTL characteristics).

4. **No `transformResponse` abstraction** — response transformations live inside each `callProviderApi` implementation because they differ significantly per provider.

5. **All `as` casts replaced with `isRecord` type guards** — complies with oxlint `no-unsafe-type-assertion` rule. No `oxlint-disable` comments.

## Stats

- **Clones eliminated:** 16 cross-file clones
- **Lines reduced:** ~239 lines of duplicated logic
- **Adapters reduced:** ~18% smaller on average
