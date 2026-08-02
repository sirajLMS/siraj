# Shared Context for All Subagents

## Objective

Each subagent is assigned one test file under `frontend/common/graphql/test/`. The goal is to ensure every mutation call in that test file passes **all** available input arguments (required AND optional) as `variables`. This means:

1. Every variable declared in the mutation's GraphQL document string (in `*.documents.ts`) must appear in the `variables` object at every mutation call site.
2. For optional variables: at least one test case should pass a meaningful non-null value, and at least one should pass `null` (or omit, if the backend applies a default).

## Reference Files (MUST Read Before Starting)

- **Mutation argument reference**: `.ai/plans/graphql-mutation-test-args/outcome/mutation-args-reference.json` — maps every mutation operation name to its required/optional variables.
- **Human-readable summary**: `.ai/plans/graphql-mutation-test-args/outcome/mutation-args-reference.txt`
- **Test AGENTS.md**: `/workspaces/siraj/frontend/common/graphql/test/AGENTS.md`
- **GraphQL AGENTS.md**: `/workspaces/siraj/frontend/common/graphql/AGENTS.md`
- **Tests instructions**: `/workspaces/siraj/.agents/instructions/tests.instructions.md`
- **Root AGENTS.md**: `/workspaces/siraj/AGENTS.md`

## Argument Discovery Process (Per Mutation in Your Test File)

### Step 1: Identify mutations used
```bash
grep -oP "(\w+MutationDocument)" <your-test-file> | sort -u
```

### Step 2: Find each mutation's document definition
The document is imported from `frontend/common/graphql/sharedDocuments/<domain>/<name>.documents.ts`. Open that file and find the mutation definition:

```graphql
mutation MutationName($reqField: Type!, $optField: Type) {
  mutationName(reqField: $reqField, optField: $optField) { ... }
}
```

ALL `$varName` declarations are the available variables.

### Step 3: Cross-reference with generated types
Look up the args type in `frontend/common/graphql/generated/gql/graphql-types.ts`:
```typescript
export type Mutation<Name>Args = {
  reqField: Scalars['Type']['input'];           // required
  optField: InputMaybe<Scalars['Type']['input']>;  // optional (nullable)
};
```
- Fields WITHOUT `InputMaybe` are **required** — always pass them
- Fields WITH `InputMaybe` are **optional** — pass in at least one test, `null` in at least one

### Step 4: For input object types, look up the input type
If the mutation uses `input: SomeInputType!`, find the input type definition:
```typescript
export type StudentOnboardingInput = {
  name: Scalars['String']['input'];              // required
  email: Scalars['String']['input'];             // required
  notes: InputMaybe<Scalars['String']['input']>;   // optional
};
```
Cover ALL fields (required always, optional with value + `null`) in the input object.

### Step 5: Modify the test
For each mutation call site, ensure the `variables` object includes ALL variables. If a variable was previously missing, add it with a meaningful test value.

## Rules

- **Do NOT modify backend files.** If you find a backend bug, report it as a CROSS-FILE DEPENDENCY.
- **Use `authenticatedRequest` from helpers.ts** for authenticated mutations (don't manually set headers).
- **Use `assertOperationDenied` for authorization denial tests.**
- **Use the `@/` alias** for imports — not relative paths.
- **Run quality loop after modifications**: `~/.bun/bin/bun tsgo`, `~/.bun/bin/bun biome:check`, then lint via the queue client.
- **Lint queue port**: 4777

## Quality Loop

```bash
# Type check
~/.bun/bin/bun tsgo

# Biome
~/.bun/bin/bun biome:check

# Lint via queue client (file-scoped)
curl -s -X POST http://localhost:4777/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"<your-task-id>","files":["<your-test-file>"]}'
```

All three must pass with 0 errors and 0 warnings.

## Outcome File

After completing your work, write an outcome file at:
`.ai/plans/graphql-mutation-test-args/outcome/<your-task-id>-outcome.md`

Include:
- What mutations were found in the test file
- What variables were missing before your changes
- What you added/changed
- Any backend bugs found (CROSS-FILE DEPENDENCY reports)
- Quality loop results
