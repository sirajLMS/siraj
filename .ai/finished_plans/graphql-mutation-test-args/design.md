# Design: GraphQL Mutation Test Argument Coverage

## Overview

This plan modifies 28 GraphQL integration test files to ensure every mutation call passes all available input arguments (required and optional) as `variables`. The approach uses parallel subagents (up to 24 concurrent, max 48 total) to fix individual test files, with a sub-loop quality verification per file. Backend bugs discovered during testing are reported back to the orchestrator for coordinated fixes.

## Design Goals

1. **Full argument coverage**: Every mutation variable defined in a `documents.ts` file appears in test `variables` objects
2. **Optional argument exercise**: Each optional argument is tested with both a meaningful value and `null`/omitted
3. **Backend bug surfacing**: Exercising untested optional args may reveal latent backend bugs
4. **Parallel execution**: Up to 24 subagents concurrently, 48 max, orchestrated in waves
5. **Quality compliance**: Each file passes tsgo + biome + lint before completion
6. **Knowledge propagation**: Capture learnings in docs and AGENTS.md updates

## Key Design Decisions

### Decision 1: Subagent Per Test File (Not Per Mutation)
**Context**: 28 test files, each containing 1-10+ mutations.
**Options Considered:**
1. One subagent per test file — handles all mutations in that file
2. One subagent per mutation — finer granularity but more coordination overhead
**Decision**: One subagent per test file.
**Rationale**: Test files are cohesive units; mutations within a file often share setup (provisioning tokens, entity IDs). A single subagent per file avoids duplicate setup and keeps context in one place. 28 files fits well within the 24-parallel / 48-total limits.

### Decision 2: Wave-Based Dispatch
**Context**: Max 24 parallel, 48 total. 28 files to process.
**Options Considered:**
1. Dispatch all 28 at once (exceeds 24 parallel limit)
2. Two waves: 24 + 4
3. Adaptive dispatch: maintain a pool of 24, spawn new ones as others finish
**Decision**: Adaptive dispatch — maintain up to 24 concurrent subagents, spawn replacements as they finish.
**Rationale**: Maximizes throughput. The orchestrator monitors subagent completion notifications and immediately spawns the next pending file.

### Decision 3: Backend Bug Handling via CROSS-FILE DEPENDENCY
**Context**: Exercising optional args may reveal backend bugs (e.g., resolver doesn't handle `expectedVersion` correctly).
**Options Considered:**
1. Subagents fix backend bugs directly — violates file assignment rules
2. Subagents report bugs; orchestrator dispatches backend fix subagents
3. Skip backend bugs entirely
**Decision**: Subagents report CROSS-FILE DEPENDENCIES; orchestrator dispatches targeted backend fix subagents after all test files are done.
**Rationale**: Clean separation. Test subagents own test files only. Backend fixes are dispatched as a separate wave. Prevents concurrent modifications to backend files.

### Decision 4: Argument Discovery via GraphQL Schema + Generated Types
**Context**: Need to know all variables for each mutation document.
**Options Considered:**
1. Parse the GraphQL document string in `documents.ts` to extract `$varName` definitions
2. Look up `Mutation<Name>Args` in generated types
3. Reference the generated `schema.graphql` mutation definitions
**Decision**: Subagents use all three: the document definition (ground truth for what variables the test can pass), the generated `Mutation<Name>Args` type (TS interface), and the schema definition (to understand field nullable-ness).
**Rationale**: Triple-source verification ensures completeness. The document defines available variables; the type definition gives TS shape; the schema shows backend field requirements.

### Decision 5: Input Object Field Coverage
**Context**: Mutations with `input: SomeInputType!` have nested input objects with many optional fields.
**Options Considered:**
1. Only cover top-level mutation variables (skip nested input object fields)
2. Cover all fields of input objects too
**Decision**: Cover BOTH — all top-level mutation variables AND all fields within input object types.
**Rationale**: Full coverage means testing every field the GraphQL schema exposes for the mutation, including nested ones. The generated types (`StudentOnboardingInput`, `TeacherOnboardingInput`, etc.) define these fields.

### Decision 6: Sub-Loop Quality Verification
**Context**: Each file must pass tsgo, biome, lint, and rules compliance.
**Decision**: Each subagent runs the quality loop on its file before completion. If tsgo fails, fix tsgo first. Then biome. Then lint. Progressive enforcement.
**Rationale**: Follows the project's sub-loop pattern. Prevents broken files from being considered done.

## Architecture: Orchestrator → Subagent Dispatch Model

```
Orchestrator (Main Agent)
  │
  ├── Phase 1: Start lint queue server (background)
  ├── Phase 2: Pre-compute argument map (mutation → all variables)
  ├── Phase 3: Dispatch subagents in waves (24 concurrent, 28 files)
  │     ├── Wave 1: Files 1-24 → 24 parallel subagents
  │     └── Wave 2: Files 25-28 → spawn as Wave 1 slots free up
  │     Each subagent:
  │       1. Read existing outcome files
  │       2. Read AGENTS.md + instructions + task spec
  │       3. Analyze mutation documents → identify all variables
  │       4. Modify test file to include all args as variables
  │       5. Run quality loop (tsgo → biome → lint)
  │       6. Write outcome file
  │       7. Report CROSS-FILE DEPENDENCIES (if any backend bugs found)
  │
  ├── Phase 4: Process CROSS-FILE DEPENDENCY reports
  │     └── Dispatch backend fix subagents (one per backend file)
  │
  ├── Phase 5: Run full GraphQL test suite
  │     └── bun run test:graphql
  │
  └── Phase 6: Knowledge Propagation
        ├── Create docs/testing/mutation-argument-coverage.md
        ├── Update AGENTS.md files
        ├── Update instructions files
        └── Final quality gate verification
```

## Mutation Argument Discovery Process (Per Subagent)

Each subagent must determine ALL variables for each mutation in its assigned test file:

### Step 1: Identify mutation documents used in the test file
```bash
grep -oP "(\w+MutationDocument)" <test-file> | sort -u
```

### Step 2: For each mutation document, extract its variable definitions from the documents.ts file
The document string (in `sharedDocuments/<domain>/<name>.documents.ts`) contains:
```graphql
mutation MutationName($reqField: Type!, $optField: Type) {
  mutationName(reqField: $reqField, optField: $optField) { ... }
}
```
Extract all `$varName` declarations → these are ALL available variables.

### Step 3: Cross-reference with generated type
```typescript
// From graphql-types.ts:
export type Mutation<Name>Args = {
  reqField: Scalars['Type']['input'];          // required
  optField: InputMaybe<Scalars['Type']['input']>; // optional (nullable)
};
```
Fields without `InputMaybe` are required; fields with `InputMaybe` are optional.

### Step 4: For input object types, look up the input type definition
```typescript
export type StudentOnboardingInput = {
  name: Scalars['String']['input'];              // required
  email: Scalars['String']['input'];             // required
  notes: InputMaybe<Scalars['String']['input']>;   // optional
  // ... more fields
};
```
Cover all fields of the input object in the `input` variable.

### Step 5: Modify test variables
For each mutation call site, ensure the `variables` object includes:
- All required fields with meaningful test values
- All optional fields with a meaningful value in at least one test case
- All optional fields with `null` in at least one test case (to test the nullable path)

## UX/Navigation Specification

This plan does not introduce any new UI routes, sidebar entries, or user-facing navigation. It is entirely a test infrastructure change. No role-based access changes, no mobile/desktop variants, no permission changes.

**Routes affected**: None (test files only)
**Sidebar changes**: None
**Role-based access**: None (integration tests use demo users internally)

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Backend bugs from untested optional args | Subagents report CROSS-FILE DEPENDENCIES; orchestrator dispatches backend fixes |
| Test file conflicts (two subagents editing same file) | Each file assigned to exactly one subagent |
| Port conflicts during test runs | Tests use dynamic port allocation (lifecycle.ts handles this) |
| Subagent timeout | Each subagent has a single file as scope; quality loop is bounded |
| Too many concurrent subagents | Adaptive dispatch: max 24 concurrent, 48 total |
| Generated types out of date | Verify with `bun codegen` check before starting |

## Test Strategy

- **Unit verification per file**: tsgo + biome + lint after each subagent's modifications
- **Integration verification**: Run `bun run test:graphql` after all files are done
- **Argument coverage audit**: Grep each test file for mutation calls and verify all variables are present
- **Backend regression check**: If backend bugs were fixed, run any affected backend tests

## Instruction File & AGENTS.md Mapping

| File Path Pattern | AGENTS.md Files | Instruction Files |
|---|---|---|
| `frontend/common/graphql/test/**/*.test.ts` | `frontend/common/graphql/test/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, root `AGENTS.md` | `.agents/instructions/tests.instructions.md` |
| `backend/services/**/*.ts` (if backend fix needed) | `backend/services/AGENTS.md`, `backend/AGENTS.md`, root `AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| `backend/graphql/**/*.ts` (if backend fix needed) | `backend/graphql/AGENTS.md`, `backend/AGENTS.md`, root `AGENTS.md` | `.agents/instructions/backend.instructions.md` |
