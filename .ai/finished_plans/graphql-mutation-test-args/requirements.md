# Requirements: GraphQL Mutation Test Argument Coverage

## Feature Overview

All GraphQL mutation integration tests under `frontend/common/graphql/test/` must exercise **every** available input argument defined on their corresponding mutation documents — both required and optional — as real `variables` in at least one test case. Currently many mutation tests omit optional arguments entirely (passing only the minimum required variables). This plan ensures full argument coverage across all 28 test files that contain mutation calls.

## Scope

**In scope:**
- 28 test files under `frontend/common/graphql/test/` that reference `MutationDocument` imports
- Ensuring each mutation document's **all** defined variables (from `documents.ts`) appear in test `variables` objects
- Identifying and fixing backend bugs exposed by optional arguments that were never exercised
- Running the quality loop (tsgo + biome:check + lint) on each modified file

**Out of scope:**
- Query test coverage (only mutations)
- Test files with zero mutation references (parent-portal, profile, settings-audit, settings-timezones, student-directory, student-profile, teacher-portal, translation — these are query-only files)
- Backend feature additions (only bug fixes if a backend missing-optional-arg bug surfaces)

## User Stories

### US-1: Comprehensive Argument Coverage
**As a** developer maintaining the GraphQL API,
**I want** every mutation integration test to pass all available input arguments (required and optional) as variables,
**So that** optional fields and edge cases are exercised, and regressions in optional argument handling are caught early.

### US-2: Backend Bug Detection
**As a** backend engineer,
**I want** mutation tests that exercise optional arguments to surface hidden backend bugs,
**So that** the production API correctly handles all optional fields (e.g., `expectedVersion`, `notes`, `sendEmail`, `transactionId`).

## Acceptance Criteria (EARS Format)

1. **WHEN** a test file under `frontend/common/graphql/test/` calls a `MutationDocument` **THEN** the test's `variables` object **SHALL** include every variable declared in the mutation's GraphQL document string (both `!` required and optional fields).

2. **WHEN** a mutation document defines an optional variable (e.g., `$expectedVersion: Int`, `$notes: String`, `$sendEmail: Boolean`) **THEN** at least one test case **SHALL** pass a meaningful non-null value for it, and at least one test case **SHALL** explicitly pass `null` or `undefined` (or omit only where the backend applies a sensible default).

3. **WHEN** exercising a previously-untested optional argument causes a backend error or unexpected behavior **THEN** the test **SHALL** be written to expect the correct behavior, and if the backend is buggy, a bug fix **SHALL** be applied to the backend service/resolver (reported back to main agent for coordination).

4. **WHEN** a subagent finishes modifying a test file **THEN** the subagent **SHALL** run `bun tsgo`, `bun biome:check`, and the lint queue client on the modified file, and all three **SHALL** pass with zero errors and zero warnings.

5. **WHEN** the subagent modifies a file **THEN** it **SHALL** validate the file against `frontend/common/graphql/test/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, and `.agents/instructions/tests.instructions.md`.

6. **WHEN** a subagent encounters a backend bug requiring a fix outside its assigned test file **THEN** it **SHALL NOT** modify backend files directly but **SHALL** report a CROSS-FILE DEPENDENCY to the orchestrator with the file path, rule violated, and required fix.

7. **WHEN** all 28 test files have been processed **THEN** the orchestrator **SHALL** run the full GraphQL test suite (`bun run test:graphql`) to verify all tests still pass.

8. **WHEN** all implementation work is complete **THEN** a knowledge propagation task **SHALL** create a canonical doc under `docs/testing/` documenting the mutation argument coverage pattern and update the relevant AGENTS.md and instructions files.

9. **WHEN** any subagent executes a task **THEN** it **SHALL** first read ALL existing files in `.ai/plans/graphql-mutation-test-args/outcome/` to absorb prior findings (`Feature 6 — Outcome Knowledge Base`).

10. **WHEN** any subagent completes a task **THEN** it **SHALL** write an outcome file `.ai/plans/graphql-mutation-test-args/outcome/<task-id>-outcome.md` and update the task checkbox `[ ]` → `[x]` in `tasks.md`.

## Edge Cases & Constraints

- **Optional arguments with defaults**: Some optional GraphQL args have backend defaults (e.g., `force: Boolean = false` on `refreshExchangeRates`). Tests should verify the default behavior AND explicitly pass a non-default value in at least one case.
- **`NextFunction` `expectedVersion`**: Many mutations accept `expectedVersion: Int` for optimistic concurrency. Tests should pass a real version number (from a prior query) in at least one case, and `null` in another.
- **Input object mutations**: Mutations like `createStudent(input: StudentOnboardingInput!)` have complex input objects. The `variables` must include every field of the input object type that is defined (required fields always; optional fields in at least one test case with a non-null value).
- **Nullable optional args as null vs undefined**: TypeScript/Apollo differentiates `null` (explicit null) from `undefined` (omit). Tests should use `null` where the document declares the variable as optional (nullable) to be explicit.
- **Backend bugs from unexercised optional args**: If an optional arg has never been tested, the backend resolver might not handle it correctly. Subagents must report these as CROSS-FILE DEPENDENCIES.
- **Test execution resource constraints**: Up to 24 parallel subagents, max 48 total concurrent. The orchestrator must manage the dispatch pool.

## Assumptions

- The GraphQL schema and generated types are up-to-date (`bun run generate:gqlSchema` + `bun codegen` completed).
- The dev server can start for GraphQL integration tests (`bun run test:graphql`).
- The lint queue server will be started by the orchestrator before dispatching subagents.
- Input object type fields are defined in the generated types (`graphql-types.ts`) and can be looked up by name.
