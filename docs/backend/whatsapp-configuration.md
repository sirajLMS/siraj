# WhatsApp Cloud API Configuration (Settings ▸ WhatsApp ▸ Config Tab)

## Overview

The Config tab on the WhatsApp settings page manages the Cloud API credentials for the
platform's WhatsApp integration: Meta App ID, Meta App Secret, Webhook Verify Token, Webhook
Callback URL, Phone Number ID, WABA ID, Permanent Access Token, and Embedded Signup Config ID.

All values live in a **single-row** `whatsapp_configs` table (`backend/db/schema/whatsapp/`).
Database values take precedence over the `WHATSAPP_*` environment variables: consumers resolve
credentials DB-first and fall back to env only when no row exists yet (or the database is
unreachable). `accessToken` is the one field that is **not** DB-writable — it stays
env-managed (`WHATSAPP_ACCESS_TOKEN`) so token rotation keeps its existing lifecycle.

## Data Flow

```
Config tab UI (ConfigTabPanel, tier wrappers)
  → GraphQL query whatsappConfiguration / mutations updateWhatsappConfiguration,
    generateWhatsappVerifyToken, testWhatsappConnection   (backend/graphql, WHATSAPP_CONFIG_MANAGE)
  → WhatsappConfigService  (backend/services/whatsapp/whatsapp-config.service.ts)
      resolveConfiguration · saveConfiguration · generateVerifyToken · testConnection
  → WhatsappConfigRepository  (backend/db/repo/whatsapp/whatsapp-config.repository.ts)
  → whatsapp_configs row  +  env-config write-through  (system_settings `env::<key>` overrides)
```

Enforcement paths that read the resolved configuration downstream: webhook ingestion (HMAC
validation with the App Secret, GET verification with the Verify Token), outbound Cloud API
calls (Phone Number ID + Access Token via the per-account channel adapter), and the admin
Test Connection probe (`GET /v21.0/{phone_number_id}` with the active token).

Env mapping is single-sourced in `backend/lib/whatsapp-constants.ts`
(`WHATSAPP_CONFIG_ENV_SOURCES` — field ↔ env key pairs). The seeder's initial carry-over and
the service's env fallback both import from it; never duplicate the mapping locally.

## Singleton-Row Concurrency Pattern (advisory lock + FOR UPDATE)

`upsertWhatsappConfig` serializes all writers with a **transaction-scoped advisory lock**
(`acquireAdvisoryLock(t, "whatsapp-config-upsert")`) plus `SELECT … FOR UPDATE` on the row.

`FOR UPDATE` alone cannot protect the create path: with an empty table there is no row to
lock, so two racing writers both observe "no configuration" and both insert (phantom insert).
The advisory lock closes that window — writers queue before the read — and the row lock then
keeps the read-modify-write of the update path atomic. Locks only exist inside a transaction,
so the write path always takes a real `DBTransaction` (never a bare auto-commit executor).

The repository's upsert accepts an `onMergedRow(tx, mergedRow)` hook that runs **inside** the
locked transaction, after the row write and before commit. Cross-table side effects that must
stay atomic with the row (e.g. the env-config write-through below) belong in that hook: a
rejection rolls the whole transaction back, so the row and its side effects persist together
or not at all.

`saveConfiguration` performs **field-complete** DB-first credential resolution with an
env-config write-through:

1. The merged row is written under the advisory lock (omit keeps stored value, `null` clears).
2. Still in-tx, each DB-writable field is mirrored into its `env::<key>` override row in
   `system_settings` (`propagateEnvConfigOverrides`), plus an audit entry — attribution via
   `updatedByUserId`.
3. **After commit**, the env-config cache is invalidated per key. Locally the new values are
   immediately visible; other instances see them within the env-config TTL
   (`ENV_CONFIG_CACHE_TTL_MS`) — invalidated-then-expired is the documented propagation model.

An upsert patch that is empty while the table is empty raises
`WhatsappConfigEmptyPatchError` instead of inserting an all-null singleton row (which would
permanently shadow the env fallback).

## Secret Handling (Drizzle error projection)

Drizzle 1.0.0-rc.4 wraps failed queries in `DrizzleQueryError` whose message embeds the **full
bound parameters** — for `whatsapp_configs` writes that means plaintext secrets. Never log or
rethrow a raw driver error from a secret-bearing table: project to stable metadata only.

- `toLoggableDbError()` in the service keeps `{ name, message?, code?, detail? }` for log
  lines; read driver-cause fields via `in`-narrowing (assertion-free), never `as` casts.
- GraphQL error surfaces apply the same philosophy (`toSafeErrorProjection` in the
  environment-config resolver): keep only `name` + first string `code` from the error or its
  driver `cause`, drop `message`/`params`/`detail`, and do **not** attach the raw error as
  `originalError`/`cause` — a `GraphQLError` with `INTERNAL_SERVER_ERROR` extensions is thrown
  instead. Domain errors (`DomainError` subclasses) keep passing through unchanged.
- At rest, `appSecret` and `accessToken` use the `encryptedText` Drizzle column type
  (AES-256-GCM via `field-encryption.ts`); plaintext exists only in memory.

## Masking & Audit Conventions

- GraphQL reads return a **masked view** (`maskSecretValue` from `backend/lib/env-config.helpers.ts`):
  `appSecret` / `accessToken` render as `••••••••<last4>`; `verifyToken` is intentionally
  visible (it is shared with Meta's subscription and echoed during GET verification).
  The mutation never echoes secrets back — it returns the masked view of the saved row.
- Frontend forms hold secrets in password inputs with visibility toggles and never send a
  masked value back: omitted fields keep their stored value, explicit `null` clears.
- Every save attributes the acting administrator (`updatedByUserId`) and mirrors env-key
  changes through `auditEnvConfigChange` — in-tx audit failures abort the save (fail-safe:
  commits with its audit row or not at all).
- Permissions: read = `WHATSAPP_VIEW` (viewers get a read-only notice), manage =
  `WHATSAPP_CONFIG_MANAGE`; manage mutations additionally block impersonating sessions.
  When combining `permission` with extra scopes, wrap the authScopes map in `$all` —
  see `backend/graphql/AGENTS.md`.

## CI Verification

Sandbox/dev containers with a 4 GB memory ceiling OOM on full-repo `bun tsgo` and
`bun quality-gate` (both exit 137 under memory pressure, independent of the change set).
Feature-scoped type checks and per-file sub-loops are the local equivalents; **CI (≥8 GB
runner) must run the full-repo `bun tsgo` and `bun quality-gate`** before merge.

## Related

- `docs/services/whatsapp-cloud-api.md` — WhatsApp Cloud API integration reference (adapter,
  factory, webhook, dispatch).
- `docs/services/whatsapp-coexistence-multi.md` — multi-number routing and per-account
  credential scoping (v2).
- `docs/backend/service-base-pattern.md` — service `__shared__/` helper conventions.
- `docs/backend/db-availability-fail-fast.md` — `DatabaseUnavailableError` classification and
  outage UX (the config service's read fallback and write gating build on it).
