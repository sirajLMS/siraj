# Meeting Provider Environment Setup

This guide walks you through obtaining credentials and configuring environment keys for each meeting provider (Zoom, Google Meet, Microsoft Teams) so that auto-meeting-URL generation and per-teacher OAuth work correctly.

## Prerequisites

The following keys are required for the application to boot at all:

| Key | Purpose | Example |
|-----|---------|---------|
| `JWT_SECRET` | Signs session tokens and OAuth state JWTs (HS256, 10-minute expiry). Must be ≥ 32 characters in production. | `openssl rand -base64 48` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/siraj` |
| `NEXT_PUBLIC_BASE_URL` | Public app URL (used for OAuth redirect URIs when `OAUTH_REDIRECT_BASE_URL` is unset) | `http://localhost:3000` |

Generate a strong `JWT_SECRET`:

```bash
openssl rand -base64 48
```

---

## OAuth Callback URLs

Each provider requires you to register an OAuth redirect URI. The pattern is:

```
{OAUTH_REDIRECT_BASE_URL or NEXT_PUBLIC_BASE_URL}/api/oauth/{provider-slug}/callback
```

The three callback routes are:

| Provider | Callback path |
|----------|---------------|
| Zoom | `/api/oauth/zoom/callback` |
| Google Meet | `/api/oauth/google-meet/callback` |
| Microsoft Teams | `/api/oauth/microsoft-teams/callback` |

For local development, these resolve to:

- `http://localhost:3000/api/oauth/zoom/callback`
- `http://localhost:3000/api/oauth/google-meet/callback`
- `http://localhost:3000/api/oauth/microsoft-teams/callback`

> **`proxy.ts` exclusion**: All `/api/*` routes (including OAuth callbacks) are already excluded from the auth proxy via the matcher in `proxy.ts`. No additional configuration is needed.

---

## Zoom (Server-to-Server OAuth)

### What you need

A **Server-to-Server (S2S) OAuth** app from the Zoom App Marketplace. This app type uses a single set of credentials (no per-user OAuth dance) to generate meetings on behalf of the account.

### Steps

1. **Create the app** — Go to [Zoom App Marketplace → Build App](https://marketplace.zoom.us/user/build) and choose **Server-to-Server OAuth**. Fill in the app name and description (internal name is fine).

2. **Get credentials** — On the [App Credentials](https://marketplace.zoom.us/user/build) page, copy:
   - **Account ID** → `ZOOM_ACCOUNT_ID` (different from the client ID)
   - **Client ID** → `ZOOM_CLIENT_ID`
   - **Client Secret** → `ZOOM_CLIENT_SECRET` (copy immediately — shown only once)

3. **Add scopes** — On the [Scopes](https://marketplace.zoom.us/user/build) page, add **granular scopes**:
   - `meeting:write:meeting` — create and manage meetings (see [Create Meeting API](https://developers.zoom.us/docs/api/meetings/create-meeting/))
   - `user:read:user` — read the token owner's profile (see [Get User API](https://developers.zoom.us/docs/api/users/get-user/))
   
   > **Note**: You can also use classic scopes (`meeting:write` + `user:read`) instead. Granular scopes provide finer-grained access control and are recommended for new apps. The scope names above come directly from the [S2S OAuth documentation](https://developers.zoom.us/docs/internal-apps/s2s-oauth/).

4. **Configure environment** — Set `ZOOM_REQUIRED_SCOPES` to the comma-separated scope list:

   ```
   ZOOM_REQUIRED_SCOPES=meeting:write:meeting,user:read:user
   ```

5. **Activate** — On the [Activation](https://marketplace.zoom.us/user/build) page, toggle the app status to **Active**. Tokens won't work until the app is activated, and tokens stop working if the app is deactivated.

### Environment keys

| Key | Required | Description |
|-----|----------|-------------|
| `ZOOM_ACCOUNT_ID` | ✅ | Zoom S2S OAuth account ID |
| `ZOOM_CLIENT_ID` | ✅ | Zoom S2S OAuth client ID |
| `ZOOM_CLIENT_SECRET` | ✅ | Zoom S2S OAuth client secret |
| `ZOOM_REQUIRED_SCOPES` | optional | Comma-separated scopes. Defaults to `meeting:write:meeting,user:read:user` |

### S2S OAuth technical details

| Item | Value |
|------|-------|
| **Token endpoint** | `https://zoom.us/oauth/token` |
| **Grant type** | `account_credentials` |
| **Auth method** | HTTP Basic Auth (`client_id:client_secret` as `Authorization` header value) |
| **Token TTL** | 1 hour (3600 seconds) |
| **Refresh token** | None — S2S apps re-fetch a new access token each time |
| **Scope reference** | [S2S OAuth docs](https://developers.zoom.us/docs/internal-apps/s2s-oauth/) |
| **API reference** | [Create Meeting](https://developers.zoom.us/docs/api/meetings/create-meeting/), [Get User](https://developers.zoom.us/docs/api/users/get-user/) |

### Reference URLs

| Purpose | URL |
|---------|-----|
| Build a new app | https://marketplace.zoom.us/user/build |
| S2S OAuth overview | https://developers.zoom.us/docs/internal-apps/s2s-oauth/ |
| Create Meeting API | https://developers.zoom.us/docs/api/meetings/create-meeting/ |
| Get User API | https://developers.zoom.us/docs/api/users/get-user/ |
| Zoom App Marketplace | https://marketplace.zoom.us/ |

### Per-teacher OAuth

For per-teacher OAuth (teachers connecting their own Zoom account), you also need an **OAuth 2.0** app (not S2S):

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us/) → **Develop App** → **OAuth 2.0**.
2. Add the redirect URI:
   ```
   http://localhost:3000/api/oauth/zoom/callback
   ```
3. Copy the **Client ID** and **Client Secret** — these are the same `ZOOM_CLIENT_ID` / `ZOOM_CLIENT_SECRET` keys (the OAuth flow uses the same credentials).

The OAuth authorization URL is built with scopes `meeting:write:meeting` and `user:read:user`.

---

## Google Meet (Service Account + Domain-Wide Delegation)

### What you need

A **Google Cloud service account** with Domain-Wide Delegation enabled in your Google Workspace. This allows Siraj to create Meet spaces on behalf of a Workspace user.

### Steps

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) → create or select a project.
2. Enable the **Google Meet API**:
   - Navigate to **APIs & Services → Library**.
   - Search for "Google Meet API" → **Enable**.
3. Create a service account:
   - Go to **IAM & Admin → Service Accounts** → **Create Service Account**.
   - Give it a name (e.g., `siraj-meet-bot`).
  . No roles needed at creation time.
4. Create a JSON key:
   - Click the service account → **Keys → Add Key → Create New Key → JSON**.
   - Download the `.json` file.
5. Copy the **entire JSON content** into `GOOGLE_MEET_SERVICE_ACCOUNT_JSON`. It should look like:

   ```json
   {"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"siraj-meet-bot@yourproject.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://oauth2.googleapis.com/token","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/siraj-meet-bot%40yourproject.iam.gserviceaccount.com"}
   ```

   > **Tip**: Paste it as a single line. If your `.env` parser supports multi-line values, you can also use escaped newlines.

6. Configure Domain-Wide Delegation in Google Workspace:
   - Go to your [Google Workspace Admin Console](https://admin.google.com/).
   - Navigate to **Security → Access and Data Control → API Controls → Manage Domain-Wide Delegation**.
   - **Add API Authorization** for the service account's **Client ID** (the numeric `client_id` from the JSON file).
   - Add these OAuth scopes:
     - `https://www.googleapis.com/auth/meetings.space.created`
     - `https://www.googleapis.com/auth/meetings.space.readonly`
7. Set `GOOGLE_MEET_IMPERSONATE_SUBJECT` to the email of a Google Workspace user who has Google Meet enabled. This is the account that "owns" the created meeting spaces.

### Environment keys

| Key | Required | Description |
|-----|----------|-------------|
| `GOOGLE_MEET_SERVICE_ACCOUNT_JSON` | ✅ | Entire service account JSON key file content |
| `GOOGLE_MEET_IMPERSONATE_SUBJECT` | ✅ | Google Workspace user email to impersonate (e.g., `[EMAIL_REDACTED]`) |

### Per-teacher OAuth

For per-teacher OAuth (teachers connecting their own Google account), you also need an OAuth 2.0 Client ID:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Choose **Web application**.
3. Add the authorized redirect URI:
   ```
   http://localhost:3000/api/oauth/google-meet/callback
   ```
4. Copy the **Client ID** and **Client Secret**.

| Key | Required | Description |
|-----|----------|-------------|
| `GOOGLE_MEET_CLIENT_ID` | for OAuth | Google OAuth 2.0 client ID |
| `GOOGLE_MEET_CLIENT_SECRET` | for OAuth | Google OAuth 2.0 client secret |

The OAuth authorization URL requests scopes `meetings.space.created` and `meetings.space.readonly`.

---

## Microsoft Teams (Client Credentials / Entra ID)

### What you need

An **Azure AD (Entra ID) app registration** with Microsoft Graph API permissions for online meetings.

### Steps

1. Go to the [Azure Portal](https://portal.azure.com/) → **Microsoft Entra ID → App Registrations → New Registration**.
2. Name the app (e.g., `siraj-teams-bot`).
3. Under **Supported account types**, choose **Accounts in this organizational directory only** (single tenant).
4. Click **Register**.
5. On the app **Overview** page, copy:
   - **Application (client) ID** → `MS_TEAMS_CLIENT_ID`
   - **Directory (tenant) ID** → `MS_TEAMS_TENANT_ID`
6. Create a client secret:
   - Go to **Certificates & Secrets → New client secret**.
   - Add a description and expiry.
   - Copy the **Secret Value** (not the Secret ID) → `MS_TEAMS_CLIENT_SECRET`.
   > ⚠️ The secret value is only shown once. Copy it immediately.
7. Add Graph API permissions:
   - Go to **API Permissions → Add a permission → Microsoft Graph → Application permissions**.
   - Search for and add `OnlineMeetings.ReadWrite.All`.
   - Click **Grant admin consent** for the permission.
8. Find the meeting organizer's **Object ID**:
   - Go to **Microsoft Entra ID → Users**.
   - Search for the user who will be the meeting organizer.
   - Copy their **Object ID** → `MS_TEAMS_ORGANIZER_USER_ID`.
9. Set `MS_TEAMS_REQUIRED_SCOPES`:

   ```
   MS_TEAMS_REQUIRED_SCOPES=https://graph.microsoft.com/OnlineMeetings.ReadWrite,User.Read
   ```

### Environment keys

| Key | Required | Description |
|-----|----------|-------------|
| `MS_TEAMS_TENANT_ID` | ✅ | Entra ID tenant ID |
| `MS_TEAMS_CLIENT_ID` | ✅ | App registration client ID |
| `MS_TEAMS_CLIENT_SECRET` | ✅ | App registration client secret value |
| `MS_TEAMS_ORGANIZER_USER_ID` | ✅ | Entra user object ID of the Teams meeting organizer |
| `MS_TEAMS_REQUIRED_SCOPES` | optional | Comma-separated scopes. Default: `https://graph.microsoft.com/OnlineMeetings.ReadWrite,User.Read` |

### Per-teacher OAuth

For per-teacher OAuth, register the redirect URI in the same app registration:

1. Go to **Authentication → Add a platform → Web**.
2. Add the redirect URI:
   ```
   http://localhost:3000/api/oauth/microsoft-teams/callback
   ```
3. The OAuth authorization URL uses the same `MS_TEAMS_CLIENT_ID` and `MS_TEAMS_TENANT_ID`, with scopes `OnlineMeetings.ReadWrite` and `User.Read`.

---

## `.env.local` Template

Copy this into your `.env.local` file and fill in the values:

```bash
# ----------------------------------------------------------------------
# Required (app core)
# ----------------------------------------------------------------------
JWT_SECRET=<generate with: openssl rand -base64 48>
DATABASE_URL=postgresql://user:pass@localhost:5432/siraj
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# ----------------------------------------------------------------------
# Zoom (Server-to-Server OAuth)
# ----------------------------------------------------------------------
ZOOM_ACCOUNT_ID=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
ZOOM_REQUIRED_SCOPES=meeting:write:meeting,user:read:user

# ----------------------------------------------------------------------
# Google Meet (Service Account + Domain-Wide Delegation)
# ----------------------------------------------------------------------
GOOGLE_MEET_SERVICE_ACCOUNT_JSON=
GOOGLE_MEET_IMPERSONATE_SUBJECT=
# Google Meet (per-teacher OAuth)
GOOGLE_MEET_CLIENT_ID=
GOOGLE_MEET_CLIENT_SECRET=

# ----------------------------------------------------------------------
# Microsoft Teams (Client Credentials / Entra ID)
# ----------------------------------------------------------------------
MS_TEAMS_TENANT_ID=
MS_TEAMS_CLIENT_ID=
MS_TEAMS_CLIENT_SECRET=
MS_TEAMS_ORGANIZER_USER_ID=
MS_TEAMS_REQUIRED_SCOPES=https://graph.microsoft.com/OnlineMeetings.ReadWrite,User.Read

# ----------------------------------------------------------------------
# OAuth redirect base URL (optional — defaults to NEXT_PUBLIC_BASE_URL)
# ----------------------------------------------------------------------
OAUTH_REDIRECT_BASE_URL=http://localhost:3000
```

---

## Running Tests

### Unit tests (no real credentials needed)

Adapter unit tests, validation tests, and service tests use **mocked values** — they run fine without any meeting provider env keys:

```bash
bun run test:services          # All backend service tests (parallel)
bun run test:services:sequential # Sequential (for debugging)
```

### Integration tests (real credentials required)

Integration tests that call live provider APIs require real env keys. Tests will **skip gracefully** if the corresponding keys are empty:

```bash
bun run test:integration           # All integration tests (parallel)
bun run test:integration:sequential # Sequential (for debugging)
```

### Meeting-config validation tests

```bash
bun run scripts/run-test/run-test.ts backend/lib/meeting-config.validation.test.ts
```

### Database repository tests

```bash
bun run test:db          # All DB tests (parallel)
bun run test:db:sequential # Sequential (for debugging)
```

---

## Troubleshooting

### "JWT_SECRET is not set"

Generate and set it:
```bash
echo "JWT_SECRET=$(openssl rand -base64 48)" >> .env.local
```

### OAuth callback returns "invalid state"

- Ensure `JWT_SECRET` is the same value used when initiating the OAuth flow.
- Verify the redirect URI registered in the provider's console matches your `OAUTH_REDIRECT_BASE_URL` + `/api/oauth/{provider}/callback`.

### Google Meet "missing impersonation subject"

Set `GOOGLE_MEET_IMPERSONATE_SUBJECT` to a Google Workspace user email. The service account must have Domain-Wide Delegation configured in the Workspace Admin Console.

### Zoom "invalid client credentials"

Double-check that the app is **Active** (not disabled) in the Zoom Marketplace. S2S credentials expire if the app is deactivated.

### Microsoft Teams "insufficient privileges"

Ensure `OnlineMeetings.ReadWrite.All` is added as an **Application permission** (not Delegated) and that **admin consent** has been granted in the Azure portal.

### Provider not showing in the UI

Provider adapters are initialized via `MeetingChannelFactory.createAdapter()` when the corresponding env keys are present. If keys are missing, the provider silently fails to initialize and won't appear as an auto-generation option.
