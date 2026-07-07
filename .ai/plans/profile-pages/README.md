# Profile Pages — Plan Index

## Execute a module

1. Copy prompt from **[EXECUTE_PROMPT.md](./EXECUTE_PROMPT.md)**
2. State module in your message: `Module: teacher-profile`

## Supporting documents

| Doc | Purpose |
|-----|---------|
| [LAYER_PIPELINE.md](./LAYER_PIPELINE.md) | Mandatory layer order + `.github/instructions` |
| [ORCHESTRATION.md](./ORCHESTRATION.md) | Subagents, plan-review, lint queue |
| [VERIFY.md](./VERIFY.md) | Between-layer quality gates |
| [DATA_POLICY.md](./DATA_POLICY.md) | GraphQL-only data in UI — mandatory |
| [GRAPHQL_PATTERNS.md](./GRAPHQL_PATTERNS.md) | useQuery, documents, container patterns |
| [stitch-assets/](./stitch-assets/README.md) | Local Stitch HTML + screenshots (no MCP) |
| [scripts/fetch-stitch-assets.ts](./scripts/fetch-stitch-assets.ts) | Refresh Stitch assets |

## Quality scope

Verification for profile-pages: **tsgo → biome → lint only**. Skip codescene and sonar-scan. Use quality-loop skill at module end.

## Convention

Each module: `spec.md` (what) | `plan.md` (how) | `tasks.md` (checklist with VERIFY after each layer)

## Modules & order

1. `shared-shell`
2. `teacher-profile` | `parent-profile` | `staff-profile`
3. `teacher-banking` | `assigned-students` | `notifications-preferences`

## Stitch

Project `3409377417207008542`. **Use local `stitch-assets/`** during implementation.

## Routes

| Route | Scope | Mode |
|-------|-------|------|
| `/profile` | own | view |
| `/profile/edit` | own | edit |
| `/users/[userId]/profile` | other | view |
| `/users/[userId]/profile/edit` | other | edit |
