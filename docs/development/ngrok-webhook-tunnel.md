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

## 4. Connecting with Meta Developer Console

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

## 5. Webhook Traffic Inspection

ngrok includes a built-in web dashboard for inspecting HTTP requests, headers, and responses:
* Inspect URL: `http://127.0.0.1:4040` (or `http://127.0.0.1:4041` if port 4040 is occupied by another agent).
* Open this in your browser to inspect raw JSON payloads arriving from Meta servers in real time.

---

## 6. Troubleshooting & Common Issues

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
