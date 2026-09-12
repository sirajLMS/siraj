# Development Guide: Ngrok Webhook Tunnel for WhatsApp

This guide details how to expose your local Siraj development server (`http://localhost:3000`) over a secure HTTPS public tunnel using **ngrok** to receive live webhooks from Meta WhatsApp Cloud API.

---

## 1. Quick Start

Run the ngrok development tunnel script:

```bash
bun run ngrok
```

When connected, the terminal displays:
```text
══════════════════════════════════════════════════════════════════════
  NGROK TUNNEL ONLINE
══════════════════════════════════════════════════════════════════════
  Forwarding:        https://handmade-overkill-renewable.ngrok-free.dev  ->  http://localhost:3000
  Web Inspection:    http://127.0.0.1:4041
──────────────────────────────────────────────────────────────────────
  Meta Webhook Settings:
  • Callback URL:     https://handmade-overkill-renewable.ngrok-free.dev/api/webhooks/whatsapp
  • Verify token:     c094b8d5caa8478dcf782e3b6f8bc322958dd537
══════════════════════════════════════════════════════════════════════

✓ Local server detected on port 3000.

Press Ctrl+C to stop the tunnel.
```

---

## 2. Environment Configuration

You can configure ngrok defaults in your `.env` (or `.env.local`):

```bash
# ------------------------------------------
# Ngrok Development Tunnel (Webhooks testing)
# ------------------------------------------
# Optional ngrok account authtoken (or config via ~/.config/ngrok/ngrok.yml)
NGROK_AUTHTOKEN=your_ngrok_authtoken

# Optional reserved static domain
NGROK_DOMAIN=your-domain.ngrok-free.dev

# Local server port to forward to (defaults to 3000)
NGROK_PORT=3000
```

### Configuration Priority

1. **CLI flags** (e.g. `--domain <domain>`, `--authtoken <token>`, `--port <port>`)
2. **Project `.env`** (`NGROK_DOMAIN`, `NGROK_AUTHTOKEN`, `NGROK_PORT`)
3. **System configuration** (`~/.config/ngrok/ngrok.yml`)
4. **OmniRoute fallback** (`~/.omniroute/.env` via `--from-omniroute`)

---

## 3. CLI Command Usage & Flags

The script is located at [scripts/ngrok.ts](file:///home/ahmed/Projects/siraj/scripts/ngrok.ts).

| Command | Description |
| :--- | :--- |
| `bun run ngrok` | Starts tunnel using default port 3000 and available credentials. |
| `bun run ngrok 3000` or `bun run ngrok --port 3000` | Forwards to a custom port. |
| `bun run ngrok --domain <domain>` | Uses a specific reserved or custom domain. |
| `bun run ngrok --authtoken <token>` | Overrides authtoken for the session. |
| `bun run ngrok --from-omniroute` | Loads `NGROK_AUTHTOKEN` and `NGROK_DOMAIN` from `~/.omniroute/.env`. |
| `bun run ngrok --env-file .env.local` | Reads from a custom env file. |

---

## 4. One-command webhook setup

The committed script
[scripts/whatsapp-webhook-setup.ts](../../scripts/whatsapp-webhook-setup.ts)
automates the entire Meta-side webhook configuration over the Graph API.
With a tunnel running (and the WhatsApp env keys set), the whole setup is:

```bash
bun run whatsapp:webhook-setup
```

Without `--url`, the script auto-detects a running ngrok tunnel by querying
the local ngrok inspectors on `http://127.0.0.1:4040` and
`http://127.0.0.1:4041`. Only HTTPS tunnels are accepted (TCP tunnels are
ignored). If no HTTPS tunnel is found, it tells you exactly how to proceed:

```text
Looking for a running ngrok tunnel (127.0.0.1:4040, 127.0.0.1:4041)...
No HTTPS tunnel detected.

Next steps:
  1. Start a tunnel in another terminal:  bun run ngrok
  2. Re-run this command, or pass the URL directly:
       bun run whatsapp:webhook-setup --url https://<your-domain>
```

### Command-line options

| Option | Description |
| :--- | :--- |
| `--url <https://...>` | Explicit HTTPS URL; skips tunnel auto-detection. |
| `--check` | Read-only status report (no changes are made). |
| `-h`, `--help` | Prints usage information. |

Trailing slashes on the `--url` value are stripped before use.

### What the script configures

* **App-level `whatsapp_business_account` subscription** — registers
  `<base-url>/api/webhooks/whatsapp` as the callback URL, posts your
  `WHATSAPP_VERIFY_TOKEN`, and subscribes to the `messages`,
  `message_template_status_update`, `phone_number_quality_update`, and
  `account_update` fields.
* **WABA app attachment** — subscribes your app to the WhatsApp Business
  Account (`WHATSAPP_WABA_ID`) via `subscribed_apps`.

Meta applies upsert semantics, so the command is **idempotent** — re-running
it with the same callback URL reports "already points at this callback URL;
refreshing it anyway." It is safe to re-run any time (e.g. after the tunnel
URL changes).

The script reads `WHATSAPP_APP_ID`, `WHATSAPP_APP_SECRET`,
`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, and `WHATSAPP_WABA_ID`
from `.env`; the Graph API version defaults to `v26.0` (overridable via
`WHATSAPP_GRAPH_API_VERSION` or `WHATSAPP_API_VERSION`). Secrets are never
printed.

On success you will see:

```text
══════════════════════════════════════════════════════════════════════
  WHATSAPP WEBHOOKS CONFIGURED
══════════════════════════════════════════════════════════════════════
  Callback URL:     https://<your-tunnel>.ngrok-free.dev/api/webhooks/whatsapp
  Fields:           messages, message_template_status_update,
                    phone_number_quality_update, account_update
  WABA attached:    yes
══════════════════════════════════════════════════════════════════════

Next: send a WhatsApp message to your number to test.
```

### Read-only status check

Use `--check` to inspect the current configuration without changing anything:

```bash
bun run whatsapp:webhook-setup --check
```

Example output:

```text
Webhook configuration status (read-only, Graph API v26.0):
  Callback URL:     https://<your-tunnel>.ngrok-free.dev/api/webhooks/whatsapp
  Fields:           messages, message_template_status_update,
                    phone_number_quality_update, account_update
  WABA attached:    yes
```

---

## 5. Connecting with Meta Developer Console

> Prefer automation? The `bun run whatsapp:webhook-setup` command
> (see section above) performs these exact steps via the Graph API.

1. In your browser, open [Meta for Developers](https://developers.facebook.com/apps).
2. Select your WhatsApp App and navigate to **WhatsApp** ➡️ **Configuration** (or **Step 2: Production setup > Configure Webhooks**).
3. Click **Edit** next to Webhook:
   - **Callback URL**: Paste the URL from the terminal output:
     `https://<ngrok-domain>/api/webhooks/whatsapp`
   - **Verify token**: Paste the exact value of `WHATSAPP_VERIFY_TOKEN` from `.env`.
4. Click **Verify and save**.
5. Under **Webhook fields**, click **Manage** and subscribe to:
   - `messages` (inbound chats & delivery receipts)
   - `message_template_status_update` (template approvals/rejections)
   - `phone_number_quality_update` (quality tier changes)
   - `account_update` (WABA status updates)

---

## 6. Webhook Traffic Inspection

ngrok includes a built-in web dashboard for inspecting HTTP requests, headers, and responses:
* Inspect URL: `http://127.0.0.1:4040` (or `http://127.0.0.1:4041` if port 4040 is occupied by another agent).
* Open this in your browser to inspect raw JSON payloads arriving from Meta servers in real time.

---

## 7. Troubleshooting & Common Issues

### Issue 1: `ERR_NGROK_334: The endpoint is already online`
* **Cause**: The static domain (for example `trailside-gloomily-shut.ngrok-free.dev` configured in OmniRoute) is already active in another tunnel or watchdog process.
* **Fix**:
  - Run without `--domain` to let ngrok use another available endpoint:
    ```bash
    bun run ngrok
    ```
  - Or stop the active tunnel in OmniRoute / systemd service before reusing that domain.

### Issue 2: `ERR_NGROK_320: This domain is reserved for another account`
* **Cause**: The domain is registered under a different Meta/ngrok account than the active authtoken.
* **Fix**: Ensure your `NGROK_AUTHTOKEN` matches the account that owns the reserved domain.

### Issue 3: `Local server not responding on http://localhost:3000`
* **Cause**: Next.js development server is not running.
* **Fix**: Open another terminal window and run:
  ```bash
  bun run dev
  ```
