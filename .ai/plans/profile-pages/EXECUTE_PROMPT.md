# Profile Pages — Execution Prompt

Copy the prompt block below. **In the same message**, state which module to implement (e.g. `Module: teacher-profile`).

Supporting docs: [README.md](./README.md) | [DATA_POLICY.md](./DATA_POLICY.md) | [ORCHESTRATION.md](./ORCHESTRATION.md) | [LAYER_PIPELINE.md](./LAYER_PIPELINE.md)

---

## Prompt

```
Implement the profile-pages plan for the module named in my message.

Plan folder: `.ai/plans/profile-pages/<module>/` (spec.md, plan.md, tasks.md)

## Phase 0 — Plan review (automatic, no user prompt)

1. Read spec.md, plan.md, tasks.md for the module
2. Run plan-review skill (`.opencode/skills/plan-review/SKILL.md`) against AGENTS.md + `.github/instructions/`
3. Fix any plan violations, re-review until clean
4. Then start implementation

## Phase 1 — Implementation

Follow [LAYER_PIPELINE.md](.ai/plans/profile-pages/LAYER_PIPELINE.md) bottom-up.
Read `.github/instructions/backend.instructions.md` or `frontend.instructions.md` per layer.
Read layer AGENTS.md files listed in LAYER_PIPELINE.md.

### Orchestration ([ORCHESTRATION.md](.ai/plans/profile-pages/ORCHESTRATION.md))

- You are the orchestrator; dispatch subagents for parallel per-file lint/fix when multiple files change in one layer
- Start lint queue server before parallel work: `~/.bun/bin/bun run scripts/lint-queue-server.ts &`
- NEVER run `bun run lint` directly — use lint queue client
- Each subagent: `bun run scripts/health/sub-loop.ts <file> --lifecycle lint` after edits (never `--lifecycle codescene`)

### Between-layer verification ([VERIFY.md](.ai/plans/profile-pages/VERIFY.md))

After EVERY layer in tasks.md:
- Run VERIFY checklist for that layer
- Auto-fix violations — do not ask the user
- Mark tasks [x] only after VERIFY passes
- Run plan-review again after Layer 4 (Services) and Layer 12 (UI)

### Stitch design (local — NO MCP during implementation)

Use `.ai/plans/profile-pages/stitch-assets/` (html/, screenshots/, manifest.json).
Refresh only via: `bun run .ai/plans/profile-pages/scripts/fetch-stitch-assets.ts`


### Data policy ([DATA_POLICY.md](.ai/plans/profile-pages/DATA_POLICY.md))

- ALL profile display/edit data via GraphQL endpoints only (Apollo useQuery/useMutation)
- Server page.tsx: routing context only (scope, mode, audience, targetUserId) — NO profile entity props
- NO @/backend/services or repo imports in frontend/views/profile/**
- Nested/tab data: profileByUserId fields OR dedicated GraphQL query with skip — never direct service calls
- Reused dashboard components: layout only; pass props from GraphQL parent — no internal fetches

### GraphQL client ([GRAPHQL_PATTERNS.md](.ai/plans/profile-pages/GRAPHQL_PATTERNS.md))

- Documents: TypedDocumentNode, `profile.documents.ts` pattern
- Hooks from `@apollo/client/react` — useQuery, useMutation
- NO useLazyQuery — use skip on useQuery for conditional loads
- fetchPolicy: "cache-and-network" when data may refresh (dashboard pattern)
- Types: Operations.* and Types.* from generated gql — extend, never duplicate
- react-hook-form + zod for edit forms (match TeacherProfileContainer)
- Every selection set includes id

### Layer order

Types → Schema/Migration/Seed → Repo → Services → Pothos → ops →
generate:gqlSchema → codegen → Documents → codegen →
Frontend types → i18n → UI → Tests → Verification

### Quality exclusions

- Do NOT run codescene, sonar-scan, or full `bun quality-gate`
- Per-file verify: tsgo → biome → lint queue only

### Critical rules (.github/instructions + AGENTS.md)

- Types only in backend/types/ — never in Pothos
- Pothos → services only — never repos
- MUI v9: sx prop only, *Outlined icons
- No console.* — use logger
- i18n: next-intl for all user strings
- Db tests: runInRollback, pass tx, no expect().rejects.toThrow()
- Db tests: use run-test script not raw bun test
- UI data: GraphQL endpoints only — enforce DATA_POLICY.md

## Phase 2 — Module completion

1. quality-loop skill on all touched files (tsgo → biome → lint only — skip codescene and sonar-scan)
2. All tasks.md items [x], all VERIFY gates passed
3. spec.md acceptance criteria met
4. Summarize in chat (no SUMMARY.md)
5. No git commits unless asked
```
