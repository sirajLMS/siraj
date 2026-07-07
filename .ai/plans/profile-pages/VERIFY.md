# Verification Gates — Between Every Layer

**Scope:** tsgo → biome → lint only. **Skip codescene and sonar-scan** for profile-pages work.


Insert these gates **after each layer section** in `tasks.md`. Do not proceed until the gate passes.

## Per-file gate (after each file change)

```bash
bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint
```

Or manually:
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:4777/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"profile-verify","files":["<file-path>"]}'
```

## Per-layer gate (after all files in a layer)

- [ ] All files in layer pass sub-loop `--lifecycle lint`
- [ ] `bun tsgo` passes
- [ ] Read instruction file for layer — no rule violations
- [ ] Auto-fix any violations before next layer

## Layer-specific gates

| Layer | Extra checks |
|-------|--------------|
| Types | `bun tsgo` on `backend/types/` |
| Migration | `bun run scripts/dbActions.ts push` if schema changed |
| Repo | db tests with `run-test` script if repo changed |
| Services | service unit tests |
| Pothos + ops | `bun run generate:gqlSchema` → `bun codegen` |
| Documents | `bun codegen`; verify TypedDocumentNode types resolve |
| UI | [DATA_POLICY.md](./DATA_POLICY.md): GraphQL-only data; no backend imports in views; Storybook if new component |
| Tests | `bun run scripts/run-test/run-test.ts <path>` for db tests |
| Final | quality-loop (tsgo → biome → lint) on all touched files — no codescene/sonar |

## Standard task suffix

Append to every layer in tasks.md:

```
### VERIFY — Layer N
- [ ] sub-loop lint on all files changed this layer
- [ ] bun tsgo
- [ ] instruction file rules satisfied
- [ ] auto-fix violations; re-verify until clean
```
