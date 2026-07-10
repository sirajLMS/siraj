# Meeting Configs — Spec

## Status

Implementation in progress. Providers are **configurable DB catalog rows** (`meeting_providers`), not enums.

## Locked decisions

- **5C** — multiple `user_meeting_configs` per user; exactly one `isDefault = true`
- **8C** — clean-slate migration; drop `teachers.zoom_*`, `parents.default_zoom_link`
- **Catalog-driven** — validation from provider `url_allowlist` + `field_schema` JSONB

## Tables

- `meeting_providers` — admin catalog (slug, LocalizedString fields, url_allowlist, field_schema, logo, is_active)
- `user_meeting_configs` — user_id, provider_id FK, label, is_default, details JSONB, encrypted_secret
- `class_instances` — meeting_join_url, user_meeting_config_id, meeting_provider_id, meeting_config_snapshot

See [plan.md](./plan.md) for phase pipeline and file inventory.
