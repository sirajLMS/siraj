# Orchestration — Subagents, Review, Quality Gates

How to execute profile-page modules with project best practices from `AGENTS.md` and `.github/instructions/`.

## Phase 0 — Automatic plan review (before any code)

**Run without asking the user.**

1. Read the module's `spec.md`, `plan.md`, `tasks.md`
2. Run **plan-review** skill (`.opencode/skills/plan-review/SKILL.md`) against affected layers
3. If violations found → fix the plan files first, then re-review until clean
4. Verify [DATA_POLICY.md](./DATA_POLICY.md): UI uses GraphQL endpoints only — no service/repo data in frontend
5. Only then start Layer 1 implementation

## Phase 1 — Orchestrator + subagents

The executing agent acts as **orchestrator**. Delegate file-level work to **subagents** where AGENTS.md recommends parallelism.

### When to use subagents

| Situation | Subagent model |
|-----------|----------------|
| Explore/read-only investigation | `explore` |
| Per-file lint/biome/tsgo fixes after a layer | `generalPurpose` (one per file) |
| Full layer implementation (single module, single layer) | `generalPurpose` with layer instructions |

### Lint queue server (required before parallel subagents)

```bash
~/.bun/bin/bun run scripts/lint-queue-server.ts &
curl -s http://localhost:4777/status
```

**NEVER** run `bun run lint` directly. Always use lint queue client.

### Per-file verification (each subagent)

After editing a file, subagent runs:

```bash
bun run scripts/health/sub-loop.ts <file-path> --lifecycle <stage>
```

| Stage | Checks |
|-------|--------|
| `tsgo` | tsgo only |
| `biome` | tsgo → biome |
| `lint` | tsgo → biome → lint queue |

**Profile pages quality scope stops at `lint`.** Do not use `--lifecycle codescene` or any sonar stage.

## Excluded from profile-pages quality (never run)

- `bun run codescene` / `--lifecycle codescene`
- `bun sonar-scan` / `bun scripts/sonar-manager.ts` (scan or write)
- `bun quality-gate` full pipeline (includes codescene + sonar)

Use **quality-loop** skill only (tsgo → biome → lint queue).

Subagents **NEVER** run `bun sonar-scan` or `bun scripts/sonar-manager.ts` write operations.

### Layer completion gate (orchestrator)

After all files in a layer are done:

1. Run `bun tsgo` (full project or module-related paths)
2. Run module-related tests if applicable
3. Run **plan-review** on changed files vs AGENTS.md (quick pass)
4. Mark layer tasks `[x]` in `tasks.md`
5. Proceed to next layer

## Phase 2 — Mid-implementation review (automatic)

After **Layers 4 (Services)** and **Layer 12 (UI)**:

1. Re-run plan-review on implemented files
2. Auto-fix violations without user prompt
3. Re-run verify gate for touched files

## Phase 3 — Module completion

1. Run **quality-loop** skill only (tsgo → biome → lint queue on all touched files) — **no codescene, no sonar**
2. Run relevant tests (`bun run scripts/run-test/run-test.ts` for db tests)
3. Check `spec.md` acceptance criteria
4. Summarize in chat (no SUMMARY.md)

## Instruction files (read before each layer)

| Layer | Required reading |
|-------|------------------|
| All | Root `AGENTS.md` |
| Types | `backend/types/AGENTS.md`, `.github/instructions/backend.instructions.md` |
| Repo | `backend/db/repo/AGENTS.md`, `.github/instructions/backend.instructions.md` |
| Services | `backend/services/AGENTS.md`, `.github/instructions/backend.instructions.md` |
| Pothos | `backend/graphql/AGENTS.md`, `.github/instructions/backend.instructions.md` |
| Documents | `frontend/graphql/AGENTS.md`, `frontend/graphql/sharedDocuments/AGENTS.md`, `.github/instructions/frontend.instructions.md` |
| UI | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `.github/instructions/frontend.instructions.md` |
| Tests | `.github/instructions/tests.instructions.md`, layer test AGENTS.md |

## Stitch reference

Use **local assets** only: `stitch-assets/manifest.json`, `html/`, `screenshots/`. Do not call Stitch MCP during implementation unless refreshing assets via `scripts/fetch-stitch-assets.ts`.
