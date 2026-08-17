# WhatsApp — v2 Deferral Note

**v1 status:** Meta Cloud API outbound + admin configuration is shipped (see `docs/services/whatsapp-cloud-api.md` and `docs/frontend/whatsapp-ui-patterns.md`). Inbound chat via `whatsapp-web.js` is **NOT** a supported path in v1 — Cloud API is the only sanctioned integration; the `webhooks` route strips inbound `messages[]` per the S3 route-level policy (see `whatsapp-cloud-api.md` §9).

**v2 backlog:** Inbound chat / two-way messaging is deferred to v2 / BL4. Do NOT wire any `whatsapp-web.js` client into the app's runtime — library references are exploratory only.
