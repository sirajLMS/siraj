# GraphQL Codegen Consolidation — Type Fix Task

## Target File
{{TARGET_FILE}}

## Context
The GraphQL codegen has been consolidated from 3 files (graphql-types.ts, operations.ts, graphql.ts)
into a single `graphql.ts` file with native TS enums and compact extracted field types.

Your job: fix all TypeScript errors in the target file caused by this consolidation.

## Instructions

1. Read the target file: `{{TARGET_FILE}}`
2. Get exact errors:
   ```
   bun tsgo 2>&1 | grep "{{TARGET_FILE}}"
   ```
3. For each error, identify the fix:

   ### TS2305 / TS2724: No exported member
   - The file imports a schema type name (e.g., `User`, `Quota`) or a default-mode extracted
     type name (e.g., `AdminComplaintQueueQuery_adminComplaintQueue_ComplaintQueueResult_rows_Complaint`)
     that no longer exists.
   - Find the correct compact extracted type name in `graphql.ts`:
     ```
     grep "^export type" frontend/common/graphql/generated/gql/graphql.ts | grep "<OperationName>_<field>"
     ```
   - Replace the old type name with the new compact extracted type name.

   ### TS2307: Cannot find module
   - The file imports from `gql/graphql-types` or `gql/operations` which are deleted.
   - Replace import path with `@/frontend/common/graphql/generated/gql/graphql`.

   ### TS7006: Implicit any
   - Cascade from a broken type. Fix the root type reference first, then the implicit any
     resolves automatically.

   ### TS2353: Extra __typename in fixtures/stories
   - The new extracted types don't include `__typename` unless the query explicitly selects it.
   - Remove `__typename` from test fixtures and story arguments.

   ### TS2322 / TS2345: Type mismatch
   - Cascade from using the wrong type. Fix the import to use the correct extracted type.

   ### TS2694: Namespace member not exported
   - The file references a type via `Types.Xxx` or `Operations.Xxx` that doesn't exist.
   - Replace with the correct named import from `graphql.ts`.

4. After fixing, verify:
   ```
   bun tsgo 2>&1 | grep "{{TARGET_FILE}}"
   ```
   Expect: 0 errors for this file.

5. Run sub-loop verification:
   ```
   bun run scripts/health/sub-loop.ts {{TARGET_FILE}} --lifecycle tsgo
   ```

6. If you cannot find the correct type name, REPORT it — do NOT create a workaround.
   Report format:
   ```
   UNRESOLVED: {{TARGET_FILE}}
   Missing type: <type name that was expected>
   Available candidates: <list of similar type names from graphql.ts>
   ```

## CRITICAL RULES (Violations are BLOCKING)

1. **NO MAPPING**: Never create mapping functions or intermediate conversion layers.
   Use codegen types directly. If a type mismatch occurs, fix the GraphQL query/document
   to select the right fields — never create a mapping function.
2. **NO INDEXED-ACCESS**: Never use `NonNullable<X["y"]>` workarounds.
   Use the named extracted type (e.g., `MeQuery_me`).
3. **NO SCHEMA TYPES**: Never import or reference schema-level object types.
   Only operation-derived types from `graphql.ts`.
4. **NO HARDCODED TYPES**: Never redefine types locally.
   If a type is missing from `graphql.ts`, the query document needs to select those fields.
5. **SINGLE SOURCE**: All imports from
   `@/frontend/common/graphql/generated/gql/graphql` only.

## Reference: Compact Type Naming
Types follow: `{OperationName}_{field}_{subField}...`
- `MeQuery_me` (not `MeQuery_me_User`)
- `QuotaQuery_quota` (not `QuotaQuery_quota_Quota`)
- `AdminComplaintQueueQuery_adminComplaintQueue_rows` (not
  `AdminComplaintQueueQuery_adminComplaintQueue_ComplaintQueueResult_rows_Complaint`)

Collision resolution is automatic: codegen appends a type suffix if two field paths
collide with the same name but different types.

## Reference: How to Find the Correct Type Name

1. Identify which GraphQL operation the file uses (from imports or usage):
   ```
   grep "Document\|Query\|Mutation" {{TARGET_FILE}} | head -10
   ```

2. Search for extracted types from that operation in graphql.ts:
   ```
   grep "^export type <OperationName>_" frontend/common/graphql/generated/gql/graphql.ts
   ```

3. Pick the type whose field path matches what the consumer needs.
   For example, if the file used `User` and the context is the MeQuery:
   - `MeQuery_me` is the user object from MeQuery
   - `MeQuery_me` is the correct replacement

4. If multiple operations return the same entity, pick the one that matches the file's context:
   - `userStore.ts` → `MeQuery_me` (it uses the MeQuery)
   - `login.ts` → `LoginMutation_login_user` (it uses LoginMutation)
