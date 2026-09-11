# WhatsApp Conversations — plan index

Feature: new top-level page `/whatsapp` (WhatsApp Conversations) under the `grp_integrations`
nav group. Lists per-account WhatsApp conversations, supports sending (free-text inside the
24h service window, templates anytime), enforces Meta test-number recipient restrictions via
a local per-account recipient registry, and marks test numbers with a badge.

Owner plan dir: `.ai/plans/whatsapp-conversations/`

## Chunks (each ≤ 70 lines)

- Specs
  - `specs/specs-1-overview-stories.md` — problem, scope, user stories
  - `specs/specs-2-permissions-detection.md` — routes/nav/permissions + test-number detection EARS
  - `specs/specs-3-send-composer.md` — conversations view + composer EARS
  - `specs/specs-4-recipients.md` — recipient registry + Meta error mapping EARS
- Design
  - `design/design-01-architecture.md` — decisions
  - `design/design-02-data-model.md` — columns/tables/migrations
  - `design/design-03-backend.md` — service/repo/GraphQL
  - `design/design-04-frontend-ux.md` — page/nav/components/role matrix
  - `design/design-05-i18n-tests.md` — i18n + test plan
- Tasks
  - `tasks/tasks-01-foundation.md` — baseline, permissions, schema, regen
  - `tasks/tasks-02-backend.md` — repos, service, request builder
  - `tasks/tasks-03-graphql.md` — pothos, mutations/queries, codegen
  - `tasks/tasks-04-frontend.md` — page, nav, components, i18n wiring
  - `tasks/tasks-05-verify-review.md` — tests, journeys, reviews, knowledge

## Key decisions (locked)

1. Composer = free-text (window-gated) + template.
2. Settings Inbox tab stays as-is (read-only); `/whatsapp` is the full workspace.
3. New permissions `whatsapp.conversations_view` / `whatsapp.conversations_manage`.
4. Test recipients: local registry + hello_world "Verify" test-send; hard-block otherwise.
