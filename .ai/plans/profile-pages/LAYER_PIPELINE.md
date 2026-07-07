# Layer Pipeline — Profile Pages

**Mandatory implementation order.** See also [DATA_POLICY.md](./DATA_POLICY.md), [ORCHESTRATION.md](./ORCHESTRATION.md), [VERIFY.md](./VERIFY.md), [GRAPHQL_PATTERNS.md](./GRAPHQL_PATTERNS.md), [stitch-assets/](./stitch-assets/README.md).
 Complete each layer fully before starting the next. Read the listed instruction files before working in that layer.

## Global layer order

```
1. Types          backend/types/
2. Schema         backend/db/schema/          (only if new tables/columns)
3. Migrations     backend/db/migration/       (create → run)
4. Seeds          backend/db/seeds/           (create/update → run via bun run db)
5. Repository     backend/db/repo/
6. Services       backend/services/
7. Pothos         backend/graphql/pothos/
8. GraphQL ops    backend/graphql/query/ + mutation/
9. generate:gqlSchema   bun run generate:gqlSchema
10. codegen (1)         bun codegen            (schema → graphql-types)
11. Documents     frontend/graphql/sharedDocuments/
12. codegen (2)         bun codegen            (operations types)
13. Frontend types frontend/types/             (extend gql generated only)
14. i18n          shared/messages/
15. UI            frontend/views/profile/
16. App routes    app/[locale]/(dashboard)/    (only if new pages)
17. Tests
18. Verification  tsgo → biome → lint per file (NO codescene, NO sonar-scan)
```

## Instruction files per layer

| Layer | AGENTS.md | Instructions |
|-------|-----------|--------------|
| Types | `backend/types/AGENTS.md` | `.github/instructions/backend.instructions.md` |
| Repo | `backend/db/repo/AGENTS.md` | `.github/instructions/backend.instructions.md` |
| Seeds | `backend/db/seeds/AGENTS.md` | `.github/instructions/backend.instructions.md` |
| Services | `backend/services/AGENTS.md` | `.github/instructions/backend.instructions.md` |
| Pothos | `backend/graphql/AGENTS.md` | `.github/instructions/backend.instructions.md` |
| Documents | `frontend/graphql/sharedDocuments/AGENTS.md` | `frontend/graphql/AGENTS.md` |
| UI | `frontend/views/AGENTS.md` | `frontend/AGENTS.md`, `.github/instructions/frontend.instructions.md` |
| App | `app/AGENTS.md` | `.github/instructions/frontend.instructions.md` |
| Tests | `backend/db/test/AGENTS.md` (db tests) | `.github/instructions/tests.instructions.md` |

## Critical rules

### Types (`backend/types/`)
- Single canonical type per entity: `{Entity}SelectType`, `{Entity}ReturnType`, `{Entity}SubmitInput`
- **Never** define types in Pothos or service files — import from `@/backend/types`
- Profile extensions go in `backend/types/profile.types.ts` or domain files (`teacher.types.ts`, etc.)

### Repository (`backend/db/repo/`)
- Data access only — no business logic, no permission checks
- Use `getBackendTranslations` for errors — no hardcoded strings
- Pass `tx` in all methods inside transactions (db tests)
- Import types from `backend/types/`, not schema directly

### Services (`backend/services/`)
- All business logic and permission gating here
- Pothos resolvers delegate to services — never call repos from Pothos
- Localized errors via `getBackendTranslations(locale?)`

### Pothos (`backend/graphql/pothos/`)
- `objectRef<{Entity}ReturnType>` — no local type definitions in pothos files
- Every object exposes `id` for Apollo cache normalization
- Resolvers call services only

### Codegen sequence (non-negotiable)

```bash
# After pothos/schema changes:
bun run generate:gqlSchema
bun codegen

# After writing/updating .documents.ts:
bun codegen
```

### GraphQL documents (`frontend/graphql/sharedDocuments/`)
- Import: `gql, TypedDocumentNode` from `@apollo/client`
- Types: `Operations.*` from `generated/gql/operations`, `Types.*` from `generated/gql/graphql-types`
- Naming: `{entityName}QueryDocument`, `{entityName}MutationDocument`
- Every object selection must include `id`

### Frontend types (`frontend/types/`)
- **Import gql generated types first** — `Operations.ProfileByUserIdQuery`, etc.
- UI-only extensions allowed: `type ProfileViewModel = NonNullable<Operations.ProfileByUserIdQuery['profileByUserId']> & { ... }`
- **Never** duplicate backend entity shapes locally

### UI (`frontend/views/profile/`)
- **GraphQL-only data** — see [DATA_POLICY.md](./DATA_POLICY.md)
- Client components: Apollo `useQuery`/`useMutation` with TypedDocumentNodes
- Server pages: `resolveProfilePageContext` for routing only — never fetch profile entity data for display
- MUI v9: style props via `sx`, not direct props
- No `console.*` — use `logger` from `@/frontend/utils/logger`
- Wrap permission-gated UI in `<RequirePermission>`

### Verification per file
```bash
bun tsgo
bun biome:check
# lint via queue client for the specific file
```

## Module layer applicability

| Module | Types | Schema/Migration/Seed | Repo | Service | Pothos | Documents | UI |
|--------|-------|----------------------|------|---------|--------|-----------|-----|
| shared-shell | — | — | — | — | — | — | ✓ |
| teacher-profile | extend | — | — | extend | extend | extend | ✓ |
| parent-profile | extend | — | extend | extend | extend | extend | ✓ |
| staff-profile | extend | — | extend | extend | extend | extend | ✓ |
| teacher-banking | extend | — | extend | extend | extend | extend | ✓ |
| assigned-students | extend | — | — | extend | extend | extend | ✓ |
| notifications-preferences | new | — | new | new | new | new | ✓ |

## Cross-module dependency

Implement lower modules before higher:

1. `shared-shell` (UI chrome — no backend)
2. `teacher-profile`, `parent-profile`, `staff-profile` (audience cores)
3. `teacher-banking`, `assigned-students` (teacher tabs — depend on teacher-profile types/pothos)
4. `notifications-preferences` (cross-cutting — can parallel after shared-shell)


## GraphQL client (UI layer)

See [DATA_POLICY.md](./DATA_POLICY.md) and [GRAPHQL_PATTERNS.md](./GRAPHQL_PATTERNS.md). Summary:
- `useQuery` / `useMutation` from `@apollo/client/react` — **NO useLazyQuery**
- `skip` for conditional queries; `fetchPolicy: "cache-and-network"` when appropriate
- TypedDocumentNode documents; types from `Operations.*` and `Types.*`
- Forms: react-hook-form + zod (match TeacherProfileContainer)

## Between-layer verification

After each layer, run gates from [VERIFY.md](./VERIFY.md). Orchestrator runs plan-review after Layers 4 and 12.

## Stitch assets

Use local files in `stitch-assets/` — do not call Stitch MCP during implementation.

## Quality scope (profile pages)

- **In scope:** `bun tsgo`, `bun biome:check`, lint queue client, `sub-loop.ts --lifecycle lint`
- **Out of scope:** codescene, sonar-scan, `bun quality-gate` full pipeline
- Module completion: **quality-loop** skill only
