# Email Template System — Complete Environment Keys Guide

**Generated:** 2026-08-02
**Purpose:** Everything you need to set up env keys (local + Vercel + CI) for the email template system to run successfully across all 5 email providers.

**Conventions in this repo:**
- **`.env`** — your local development env (gitignored)
- **`.env.example`** — committed template with safe placeholders (everyone copies from this)
- **`.env.test`** — gitignored; secondary credentials file (e.g. for sandbox or trial providers)
- **`environment.d.ts`** — TypeScript ambient declarations for every env var (provides autocomplete + type safety)
- **`backend/lib/env.ts`** — runtime env loader (`buildEnvironmentConfig()` → `EnvironmentConfig` object)
- **`backend/lib/env-config-keys.ts`** — canonical registry of keys eligible for **DB override** via the Settings → Environment Config admin UI (super_admin only)
- **`backend/lib/env-config-resolver.ts`** — `resolveEnvConfig(key)` resolves **DB-first / env-fallback** (5-min TTL cache). Secrets registered here can be edited live by a super_admin without a redeploy.

---

## 1. What already exists today (Resend only)

The repo currently supports only Resend. These keys are already declared in `environment.d.ts`, registered in `env-config-keys.ts`, and consumed in `EmailChannelFactory.ts`:

| Env var | Required in prod | Default | excludeFromDb | isSecret | How to obtain |
|---|---|---|---|---|---|
| `EMAIL_PROVIDER` | optional | `"resend"` | false | false | Free-text, set to provider name |
| `RESEND_API_KEY` | **required** (adapter throws) | — | false | true | https://resend.com/api-keys |
| `RESEND_FROM_EMAIL` | **required** (adapter throws) | — | false | false | Must be a verified sender in Resend |
| `RESEND_TEST_TO_EMAIL` | never | — | (not registered) | false | Your Resend account owner email |

---

## 2. New env keys to add (per the design)

Every new key needs **4 edits** to register it properly:
1. `environment.d.ts` — add the type declaration
2. `backend/lib/env-config-keys.ts` — add to `ENV_CONFIG_KEYS` registry with correct category + flags
3. `backend/lib/env.ts` — add `process.env.XXX` to `buildEnvironmentConfig()` (for non-secret keys used at boot)
4. `.env.example` — add a commented-out placeholder line for documentation

You can wire one provider at a time; the `EMAIL_PROVIDER` union below covers all of them.

### 2.1 Widen `EMAIL_PROVIDER` union

**Before** (`environment.d.ts` line 56):
```ts
EMAIL_PROVIDER?: "resend";
```
**After:**
```ts
EMAIL_PROVIDER?: "resend" | "ses" | "postmark" | "mailgun" | "smtp";
```

---

## 3. Per-provider credentials — how to obtain each

### 🟢 3.1 Resend (already set up — only listed for completeness)

**Setup steps** (for fresh setup, if you didn't already):
1. Go to https://resend.com → sign up (free tier: 3,000 emails/month, 100/day)
2. Verify your sending domain: https://resend.com/domains → Add domain → add the 3 DNS records (SPF, DKIM, DMARC) to your DNS provider
3. Generate an API key: https://resend.com/api-keys → "Create API Key" → copy `re_...` value immediately (only shown once)
4. Find your sender email: the verified `@domain` address (e.g. `noreply@yourdomain.com`)
5. For trial-only use: use `onboarding@resend.dev` as the `RESEND_FROM_EMAIL` — it's Resend's sandbox that only delivers to your account owner email. Set `RESEND_TEST_TO_EMAIL=your-account-owner@gmail.com` so the redirect kicks in.

**Env vars to set:**
```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_real_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com   # must match a verified sender
RESEND_TEST_TO_EMAIL=your.account@gmail.com   # dev redirect only
```

**Where to get help:** https://resend.com/docs

---

### 🟡 3.2 Amazon SES (SESv2) — recommended for production volume

SES has the **highest free tier** (62,000 emails/month if sent from EC2; 3,000/month from Lambda/Vercel) but the most complex setup. The adapter uses the SESv2 API (`@aws-sdk/client-sesv2`).

**Setup steps:**
1. Sign up for AWS: https://aws.amazon.com → create an account (requires credit card, but free tier protects you)
2. Go to **SES console**: https://console.aws.amazon.com/sesv2/home — pick a region (e.g. `us-east-1`; SES is region-scoped)
3. **Verify your sending identity**: SES → "Verified identities" → "Create identity" → either domain (with SPF/DKIM/DMARC DNS records) or email address (click verification link). Production launches REQUIRE a verified domain.
4. **Get out of the sandbox**: by default SES only lets you send to verified addresses. Request production access: https://console.aws.amazon.com/support/contacts#/case?templateUrl=https://aws.amazon.com/cloudformation/register-case-template/ses-account-appeal/ — fill the form (volume estimates, use case, bounce/complaint handling). Approval can take 24 hours.
5. **Create an IAM user with SES permissions** (do NOT use root credentials):
   - Go to IAM: https://console.aws.amazon.com/iam/ → Users → "Create user"
   - Name: `siraj-ses-sender`, no console access (programmatic only)
   - Attach inline policy:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         { "Effect": "Allow", "Action": ["ses:SendEmail", "ses:SendRawEmail"], "Resource": "*" }
       ]
     }
     ```
   - Or scope to a specific identity ARN: `"Resource": "arn:aws:ses:us-east-1:ACCOUNT_ID:identity/yourdomain.com"`
   - **Save the Access Key ID + Secret Access Key** (only shown once)
6. **Optional — configuration set** for bounce/complaint webhooks:
   - SES → "Configuration sets" → "Create set"
   - Add an SNS event destination for `send`, `bounce`, `complaint`, `delivery` events (creates an SNS topic SES will publish to)
   - Note the configuration set name for `SES_CONFIGURATION_SET`

**Env vars to set:**
```bash
EMAIL_PROVIDER=ses
SES_REGION=us-east-1
SES_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
SES_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SES_FROM_EMAIL=noreply@yourdomain.com   # must be SES-verified
SES_FROM_NAME="Siraj"                    # optional, display name in From header
SES_CONFIGURATION_SET=siraj-prod        # optional, for bounce/complaint webhooks
```

**Local dev shortcut (no AWS account needed):** Use **LocalStack** (free) for local SES:
```bash
# Run localstack SES (one-time setup — instructions below)
docker run -d -p 4566:4566 -e SERVICES=ses localstack/localstack
# Then set:
SES_REGION=us-east-1
SES_ACCESS_KEY_ID=localstack
SES_SECRET_ACCESS_KEY=localstack
SES_FROM_EMAIL=noreply@localstack.local   # verify via localstack cli
# SES_ENDPOINT override for adapter: http://localhost:4566
```
You'll need to add a `SES_ENDPOINT` env var for localstack (not in the canonical list above). The adapter captures `SESv2Client` config — it can accept `endpoint` in the client config.

**Where to get help:** https://docs.aws.amazon.com/ses/latest/dg/setting-up.html

---

### 🟡 3.3 Postmark — easiest commercial provider for transactional email

Postmark has the cleanest developer experience for pure transactional email. No free tier, but $15/month for 10,000 emails; 30-day trial of 100 emails free.

**Setup steps:**
1. Go to https://postmarkapp.com → "Start trial" → no credit card needed for trial
2. Verify a **sender signature** for your domain: https://account.postmarkapp.com/senders → "Add sender signature" → enter `noreply@yourdomain.com` → add the 2 DNS records (SPF + DKIM) to your DNS
3. Get your **server API token**: https://account.postmarkapp.com/servers → click your server → "API Tokens" tab → copy the "Server API Token" (8-character hex + dash + 24 hex, e.g. `deadbeef-1234567890abcdef12345678`)
4. **Optional** — account token (for managing senders via API; not needed for sending): same page, "Account API Token"
5. **Message stream**: Postmark organizes email by streams. Default is `outbound`. Create stream for `notifications` or `marketing` if you want to separate — see https://account.postmarkapp.com/streams

**Env vars to set:**
```bash
EMAIL_PROVIDER=postmark
POSTMARK_SERVER_TOKEN=deadbeef-1234567890abcdef12345678
POSTMARK_ACCOUNT_TOKEN=optionalonly_api_mgmt
POSTMARK_FROM_EMAIL=noreply@yourdomain.com   # must be a verified sender signature
POSTMARK_MESSAGE_STREAM=outbound              # optional; default is "outbound"
```

**Local dev shortcut (no signup needed):** Postmark offers a **sandbox server** when you sign up — sends to any email address return a simulated bounce (no DNS verification required). Switch the `POSTMARK_SERVER_TOKEN` between your trial server and the sandbox server as needed.

**Where to get help:** https://postmarkapp.com/support

---

### 🟡 3.4 Mailgun — good for bulk + transactional

Mailgun has a generous free tier: 5,000 emails/month for 3 months (Flex design), then pay-as-you-go.

**Setup steps:**
1. Go to https://www.mailgun.com → sign up for Flex design (no credit card for first 3 months)
2. Verify a domain: https://app.mailgun.com/app/sending/log/domains → "Add custom domain" → enter `mail.yourdomain.com` (subdomain recommended) → add the 5 DNS records (SPF, DKIM, CNAME tracking, MX, return path). DNS propagation can take 15–60 minutes.
3. Get API key: https://app.mailgun.com/app/account/security/api_keys → "Add API key" → copy the `key-...` value (or `pubkey-...` for public key, but the sending API key is the private one beginning `key-`)
4. Note your domain: the one you just verified (e.g. `mail.yourdomain.com`)
5. **Region**: Mailgun has US (`api.mailgun.net`) and EU (`api.eu.mailgun.net`) regions. Pick based on where your account is — your dashboard URL says `app.mailgun.com` (US) or `eu.mailgun.com` (EU).

**Env vars to set:**
```bash
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=key-1234567890abcdef1234567890abcdef
MAILGUN_DOMAIN=mail.yourdomain.com              # the verified subdomain
MAILGUN_FROM_EMAIL=noreply@yourdomain.com        # must be on your verified domain
MAILGUN_HOST=api.mailgun.net                     # or "api.eu.mailgun.net" for EU
```

**Local dev shortcut (no DNS needed):** Mailgun provides a **sandbox domain** on signup (looks like `sandbox123abc.mailgun.org`). It lets you send to **authorized recipients only** (you can add up to 5 emails). Use it for local development:
```bash
MAILGUN_DOMAIN=sandbox123abc.mailgun.org
MAILGUN_FROM_EMAIL=postmaster@sandbox123abc.mailgun.org
MAILGUN_TEST_RECIPIENT=your.email@gmail.com    # you must add this as authorized recipient
```
Note: `MAILGUN_TEST_RECIPIENT` is not currently registered — you'd add it as a new env var if you want the redirect pattern to match Resend's `RESEND_TEST_TO_EMAIL`.

**Where to get help:** https://documentation.mailgun.com

---

### 🟢 3.5 SMTP — the universal fallback

SMTP is the most flexible: works with any provider that exposes SMTP (Gmail, AWS WorkMail, Exchange, on-pre Postfix, etc.). The design now treats it as production-grade under the Vercel + Node.js runtime.

**Setup steps** (general):
1. Get SMTP credentials from your email provider. Common providers + their SMTP hostnames:
   - **Gmail (free, small volume only — ~100/day)**: `smtp.gmail.com:587` — enable "Less secure apps" OR generate an "App password" at https://myaccount.google.com/apppasswords (requires 2FA enabled)
   - **AWS WorkMail**: `smtp.mail.us-east-1.aws.amazon.com:587` — credentials are IAM-user email + password from WorkMail web console
   - **Microsoft 365 / Outlook**: `smtp.office365.com:587` — use your account email + password (modern auth NOT yet supported by nodemailer for SMTP)
   - **Postfix / self-hosted**: your hostname. Install Postfix, configure `mynetworks` to allow your server, set a username/password via Cyrus SASL.
   - **Brevo (formerly Sendinblue)**: `smtp-relay.brevo.com:587` — free tier 300/day, API key as password
   - **SMTP2GO**: `mail.smtp2go.com:587` — free tier 1,000/month
2. Note the `from` email: most SMTP providers require the From address match your authenticated account OR be on a verified domain.

**Env vars to set:**
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587                               # 587 = STARTTLS, 465 = implicit SSL, 25 = plaintext (most providers block 25)
SMTP_USERNAME=your-smtp-username
SMTP_PASSWORD=your-smtp-password             # use Gmail App Password not real password if Gmail
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME="Siraj"                       # optional
SMTP_SECURE=false                            # true for port 465 (implicit SSL); false for 587 (STARTTLS upgrade)
```

**Local dev shortcut (no real SMTP needed):** Use **Ethereal (nodemailer throwaway accounts)** — they're free, instant, and deliver to a web inbox (not real recipients). Created by nodemailer's author:
```bash
# Generate a one-time account (no signup)
~/.bun/bin/bun -e "import nodemailer from 'nodemailer'; nodemailer.createTestAccount().then(a => console.log({SMTP_HOST: a.smtp.host, SMTP_PORT: a.smtp.port, SMTP_USERNAME: a.user, SMTP_PASSWORD: a.pass, SMTP_FROM_EMAIL: a.user + '@ethereal.email'}))"
```
Output looks like:
```
{ host: 'smtp.ethereal.email', port: 587, user: 'random@ethereal.email', pass: '...' }
```
Paste those into `.env` and set `SMTP_FROM_EMAIL=random@ethereal.email`. To preview sent mail, print `nodemailer.getTestMessageUrl(info)` after each send — gives you a URL like https://ethereal.email/message/XXXX.

**Where to get help:** https://nodemailer.com/smtp/

---

## 4. Shared flags

### 4.1 `EMAIL_TEMPLATES_ENABLED` (feature flag — CRITICAL)

**MUST be `false` by default** so existing dispatcher passthrough email continues working until you're ready to cut over.

**CRITICAL BUG** found in v5 review (V5-2): `resolveEnvConfig()` returns `string | undefined` — the string `"false"` is truthy in JS. Must use `getBooleanEnv("EMAIL_TEMPLATES_ENABLED")` from `@/backend/lib/env` (returns `true` only when value literally `=== "true"`).

**Registration:** `env-config-keys.ts` — `excludeFromDb: true, serverOnly: true` (mirroring `IS_DEMO` at line 510). This means it's **NOT** DB-overridable — flip it via Vercel env or commit change to `.env`.

**Env var:**
```bash
EMAIL_TEMPLATES_ENABLED=false   # set to "true" (lowercase only) to enable new template pipeline
```

### 4.2 `NEXT_PUBLIC_BASE_URL` (for email links + webhooks)

Used by templates that include links back to the app (e.g., password reset links). Already declared in `environment.d.ts` + `env.ts`.

**Vercel:** set to your production domain `https://your-app.vercel.app` or custom domain.
**Local dev:** `http://localhost:3000`.

### 4.3 Optional — preview-server dev-only env (dev only)

If you want to use `react-email dev` (standalone preview server; uses the optional dep `@react-email/ui`):
```bash
# Optional — only for developing email components in isolation outside the Next.js app
# npm: @react-email/ui (not yet installed; install when ready)
REACT_EMAIL_PREVIEW_PORT=3001   # if launched on a different port
```

---

## 5. Webhook configuration (production launch)

For bounce/complaint webhook handling, you'll need to expose an HTTP webhook endpoint. The design mentions `api/email/webhooks/<provider>/route.ts` (Vercel-compatible route handlers).

### 5.1 SES SES → SNS → HTTP webhook
1. In SES → Configuration sets → Event destinations → "Add destination" → SNS
2. Create an SNS topic: `ses-events` (standard type)
3. SNS → Subscriptions → "Create subscription" → Protocol: HTTPS, Endpoint: `https://your-app.vercel.app/api/email/webhooks/ses`
4. Confirm the subscription (AWS sends a confirmation POST; your route handler must return 200 with the subscription confirmation body — see AWS docs). After confirmation, SES pushes `Send`, `Bounce`, `Complaint` events.

### 5.2 Postmark webhooks
1. Postmark → Servers → your server → Settings → Webhooks
2. Add webhook URL: `https://your-app.vercel.app/api/email/webhooks/postmark`
3. Select events: Bounce, Spam complaint, Delivery, Open, Click
4. Add an HTTP header for authentication (e.g., `X-Postmark-Webhook-Secret: <random-secret>`). Set the secret in `.env`:
   ```bash
   POSTMARK_WEBHOOK_SECRET=<your-random-secret>
   ```
5. Your route handler compares the header to the env var before processing.

### 5.3 Mailgun webhooks
1. Mailgun → Sending → Webhooks → "Add webhook"
2. URL: `https://your-app.vercel.app/api/email/webhooks/mailgun`
3. Select events: delivered, bounced, complained
4. Mailgun signs webhooks with `timestamp + token + signature` (HMAC of API key). Your route handler verifies this signature.
5. No extra env needed — uses existing `MAILGUN_API_KEY`.

### 5.4 SMTP — no native webhooks
SMTP doesn't have native bounce callbacks. You must parse bounce delivery receipts (DSN — Delivery Status Notification) from a monitored inbox, OR add a Return-Path domain to your From header that you monitor via IMAP. This is out-of-scope for V1 — bookkeeping only.

**Vercel webhook env (all providers):**
```bash
# Random long string per provider — used to verify webhook authenticity
SES_WEBHOOK_SECRET=<random-32-hex>           # verified against SNS signature (uses AWS signature V4)
POSTMARK_WEBHOOK_SECRET=<random-32-hex>      # compared against X-Postmark-Webhook-Secret header
# Mailgun uses MAILGUN_API_KEY — no separate webhook secret needed
```

---

## 6. Repo edits per provider (per provider you wire up)

For each new key, you need these 4 edits:

### 6.1 `environment.d.ts` (TypeScript ambient types)
Add each new key as an optional interface field under `// Email Configuration` (around line 56). Example for SES:
```ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // existing:
      EMAIL_PROVIDER?: "resend" | "ses" | "postmark" | "mailgun" | "smtp";   // widened
      RESEND_API_KEY?: string;
      // new — SES:
      SES_REGION?: string;
      SES_ACCESS_KEY_ID?: string;
      SES_SECRET_ACCESS_KEY?: string;
      SES_FROM_EMAIL?: string;
      SES_FROM_NAME?: string;
      SES_CONFIGURATION_SET?: string;
      // etc. for other providers
    }
  }
}
```

### 6.2 `backend/lib/env-config-keys.ts` (DB-override registry)
Add a descriptor per new key. Pattern (for SES):
```ts
{
  key: "SES_FROM_EMAIL",
  category: "email",
  displayStrategy: "plain",
  isSecret: false,
  excludeFromDb: false,
  description: {
    en: "Verified sender email address for Amazon SES (SESv2 SendEmailCommand FromEmailAddress)",
    ar: "بريد المرسل الموثق لـ Amazon SES"
  }
},
{
  key: "SES_SECRET_ACCESS_KEY",
  category: "email",
  displayStrategy: "db_with_mask_only",
  isSecret: true,
  excludeFromDb: false,
  description: {
    en: "AWS IAM user secret access key for SES (paired with SES_ACCESS_KEY_ID). Must have ses:SendEmail permission.",
    ar: "مفتاح الوصول السري لمستخدم AWS IAM لـ SES"
  }
},
```
Use `excludeFromDb: true` for **boot-critical** secrets you never want editable via Settings UI. Recommendation: follow the existing Resend pattern (keep secrets DB-overridable for live config changes) unless security review says otherwise.

### 6.3 `backend/lib/env.ts` (runtime config builder)
Add `process.env.XXX` to `buildEnvironmentConfig()`. Pattern:
```ts
sesRegion: process.env.SES_REGION,
sesAccessKeyId: process.env.SES_ACCESS_KEY_ID,
sesSecretAccessKey: process.env.SES_SECRET_ACCESS_KEY,
sesFromEmail: process.env.SES_FROM_EMAIL,
sesConfigurationSet: process.env.SES_CONFIGURATION_SET,
// etc.
```
Also add **secrets** (API keys + tokens + passwords) to the `validateNoPlaceholderSecrets()` array (lines 261–274) so a `<placeholder>` stays a placeholder in production.

### 6.4 `.env.example` (committed documentation)
Add a sub-block per provider (mirroring the existing `# Resend API Key (get from ...)` block).

---

## 7. Vercel deployment env setup

For Vercel production deployment, set these via the Vercel dashboard or CLI:
```bash
# Required for ANY email provider to work:
NOTE: In Vercel, env vars are set by "Environment" scope: Production, Preview, Development.

# Common to all environments:
# — At least ONE provider's credentials (Resend is the simplest to start):
vercel env add RESEND_API_KEY production
vercel env add RESEND_FROM_EMAIL production
# — Feature flag (V5-2 CRITICAL — must be "false" string until production launch)
vercel env add EMAIL_TEMPLATES_ENABLED production

# Provider-specific (only when you pick a different EMAIL_PROVIDER):
vercel env add SES_ACCESS_KEY_ID production
vercel env add SES_SECRET_ACCESS_KEY production
vercel env add SES_REGION production
vercel env add SES_FROM_EMAIL production

# Webhook secrets (production launch):
vercel env add POSTMARK_WEBHOOK_SECRET production
vercel env add SES_WEBHOOK_SECRET production
```

**Vercel-specific gotchas** (read these to avoid surprises):
- **Preview deployments do NOT inherit Production env vars by default.** Set env vars explicitly for each environment scope (Production, Preview, Development) — see https://vercel.com/docs/projects/environment-variables
- **Seconds to wait**: changes to env vars trigger a redeploy only when you redeploy. Vercel caches env vars per deployment.
- **Encrypted at rest**: Vercel encrypts env vars at rest with AES-256.

---

## 8. Local development trial-rank (easiest to hardest)

For FAST local setup without DNS work, this is the recommended order:

1. **SMTP + Ethereal** — zero signup. Generate creds in 2 seconds with the one-liner in §3.5.
2. **Postmark trial** — 100 emails free, 30-day trial. Sandbox server works without DNS.
3. **Resend + sandbox** — `RESEND_FROM_EMAIL=onboarding@resend.dev` (no DNS needed if you only send to your own account email).
4. **Mailgun sandbox** — free, but caps at 5 authorized recipient emails.
5. **SES + localstack** — requires Docker + 30-min initial setup. Best if your team already uses AWS.

For **production launch**, the rank flips:
1. **SES** — cheapest at volume (62K/month free from EC2; 3K/month from anywhere) AND integrates best with AWS-only stacks.
2. **Postmark** — best developer experience + highest deliverability reputation; pricing starts at $15/month for 10K emails.
3. **Resend** — cheapest at low volume; API ergonomics are the best.
4. **Mailgun** — good if you're in a heavy-volume bulk-sending scenario.
5. **SMTP** — only if you have a self-hosted/legacy reason. Works perfectly fine under Node; the warning was for Bun.

---

## 9. Final verification — how to know your env is set up correctly

After wiring all env vars, run this one-liner to sanity-check that everything resolves:

```bash
# Run in the project root
~/.bun/bin/bun -e "
const keys = [
  'EMAIL_PROVIDER', 'EMAIL_TEMPLATES_ENABLED',
  'RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'RESEND_TEST_TO_EMAIL',
  'SES_REGION', 'SES_ACCESS_KEY_ID', 'SES_SECRET_ACCESS_KEY', 'SES_FROM_EMAIL',
  'POSTMARK_SERVER_TOKEN', 'POSTMARK_FROM_EMAIL', 'POSTMARK_MESSAGE_STREAM',
  'MAILGUN_API_KEY', 'MAILGUN_DOMAIN', 'MAILGUN_FROM_EMAIL', 'MAILGUN_HOST',
  'SMTP_HOST', 'SMTP_PORT', 'SMTP_USERNAME', 'SMTP_PASSWORD', 'SMTP_FROM_EMAIL', 'SMTP_SECURE',
];
for (const k of keys) {
  const v = process.env[k];
  const masked = v && (k.includes('KEY') || k.includes('TOKEN') || k.includes('PASSWORD') || k.includes('SECRET'))
    ? v.substring(0, 6) + '...' + v.substring(v.length - 4) : v;
  console.log(k.padEnd(28), v ? '✓ ' + masked : '— unset');
}
"
```

If you see a `✓` next to a key you set, you're good. If you see a `— unset`, that provider is not yet wired up.

---

## 10. Recommended phased rollout (do less first)

You do NOT need all 5 providers set up at start. The design is designed for incremental provider rollout.

**Start here (minimum to develop the design):**
- Resend (existing — no work needed)
- `EMAIL_TEMPLATES_ENABLED=false` (add this as a new env var)

**Next (try the other adapters in dev):**
- Pick **one** of: Postmark (easiest) OR SMTP+Ethereal (free + instant)
- Set those env vars in `.env`

**Production launch:**
- Flip `EMAIL_TEMPLATES_ENABLED=true`
- Whichever production provider you picked isn't enough: add SES (cheapest at volume) or Postmark (best DX)
- Set webhook secrets once you wire bounce/complaint handling

This keeps your cognitive load manageable. Each phase unlocks new capabilities but doesn't break anything that worked before.

---

## 11. Key references

- **Existing factory**: `backend/services/communication/channels/email/EmailChannelFactory.ts`
- **Existing adapter pattern**: `backend/services/communication/channels/email/resend/ResendEmailAdapter.ts`
- **Env resolver mechanism**: `backend/lib/env-config-resolver.ts` (DB-first / env-fallback with 5-min cache)
- **Settings → Environment Config UI registry**: `backend/lib/env-config-keys.ts`
- **Sanitization runtime**: VERIFIED GREEN 2026-08-02 — `isomorphic-dompurify` works under Bun 1.3.14
- **Node_modules research**: `.ai/draft_plans/email-templates/reserch_node/FINAL-NODE-VERIFICATION-SUMMARY.md` + `15-newly-installed-packages-verification.md`

For dns/dkim/spf issues with any provider, the canonical tool is https://mxtoolbox.com/dkim.aspx — paste your domain and see what each provider's DNS setup looks like.
