# Plan — Shared Profile Shell

References: [spec.md](./spec.md)

## Architecture

```
app/[locale]/(dashboard)/profile/page.tsx
  └── ProfilePageClient (audience router)
        └── {Audience}ProfileContainer
              └── ProfileShell (header, tabs, states)
                    ├── ProfileTabNav (new)
                    ├── ProfileActionBar (existing)
                    └── {tab content | section children}
```

Server pages resolve audience via `resolveProfilePageContext` in `backend/lib/auth/cached-profile.ts`.

## File paths

| Action | Path |
|--------|------|
| Extend | `frontend/views/profile/core/ProfileShell.tsx` |
| Extend | `frontend/views/profile/core/components/ProfileActionBar.tsx` |
| Create | `frontend/views/profile/core/ProfileTabNav.tsx` |
| Create | `frontend/views/profile/core/ProfileHeader.tsx` |
| Create | `frontend/views/profile/core/ProfileSkeleton.tsx` |
| Create | `frontend/views/profile/core/profileTabs.ts` |
| Extend | `frontend/views/profile/core/ProfilePageClient.tsx` |

## Data flow

See [DATA_POLICY.md](../DATA_POLICY.md). Routing vs entity data:

1. Server `page.tsx` calls `resolveProfilePageContext` → passes scope, mode, audience, targetUserId
2. Client container fetches `profileByUserId` via Apollo
3. ProfileShell receives loading, error, title, actions from GraphQL-backed container (no own fetches)
4. Tab nav filters tabs by audience + scope from `profileTabs.ts`
5. Tab content via query param `?tab=banking`

## Dependencies

- None (foundation module)
- Consumed by all other profile-page modules

## i18n keys

Namespace: `profile.shell.*` — add to `shared/messages/types/profile.ts`, `en.ts`, `ar/profile.ts`

## Theme

Use `PageContainer`, `PageHeader`, `SectionPanel`; `theme.layout.sectionGap`; see `frontend/THEME_PALETTE.md`

## Migration

Replace spinner-only loading in ProfileShell with ProfileSkeleton; unify edit CTA via ProfileActionBar

## Risks

- Tab state in URL vs local state — ensure back button works on mobile
- Conditional tabs must not flash before profile query resolves

## Layer pipeline

This module is **frontend-only**. Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md) layers 14–18:

1. i18n (`shared/messages/`)
2. UI (`frontend/views/profile/core/`)
3. Tests
4. Verification

No backend, repo, service, or GraphQL changes.

## Orchestration & quality

- [ORCHESTRATION.md](../ORCHESTRATION.md) — subagents, plan-review, lint queue
- [VERIFY.md](../VERIFY.md) — gate after each layer in tasks.md
- [GRAPHQL_PATTERNS.md](../GRAPHQL_PATTERNS.md) — client patterns (if UI/GraphQL)
- [stitch-assets/](../stitch-assets/README.md) — local design reference
- Instruction files: `.github/instructions/backend.instructions.md`, `frontend.instructions.md`, `tests.instructions.md`
