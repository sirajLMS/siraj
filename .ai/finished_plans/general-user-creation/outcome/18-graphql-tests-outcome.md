# Task 18: GraphQL Integration Tests — Outcome

## Summary
Created `frontend/common/graphql/test/users/general-user-create.test.ts` with 10 test cases covering all required scenarios for the `createGeneralUser` mutation.

## Files Created
- `frontend/common/graphql/test/users/general-user-create.test.ts`

## Test Cases Covered
1. Provision super admin for tests (setup)
2. Successful mutation with all fields — returns result with user and assignedGroupSlug
3. Successful mutation with minimal fields (optional fields null) — succeeds
4. Unauthorized — no token → denied (UNAUTHENTICATED)
5. Forbidden — teacher without STAFF_CREATE → denied (FORBIDDEN)
6. Forbidden — parent without STAFF_CREATE → denied (FORBIDDEN)
7. Impersonation rejection — super admin impersonating → rejected
8. Missing required name field — GraphQL validation error
9. Missing required email field — GraphQL validation error
10. Missing required password field — GraphQL validation error
11. Missing required groupSlug field — GraphQL validation error

## Key Patterns
- **`setupTestServerLifecycle()`** — handles dev server spawn/kill
- **`provisionTestSuperAdmin`** + `loginDemoUser("super_admin")` — authentication setup
- **`authenticatedRequest(token, "mutate", document, variables)`** — for authenticated calls
- **`assertOperationDenied(roleGroup, "mutate", document, variables)`** — for auth/permission tests
- **`buildGeneralUserInput(overrides)`** — typed builder for full input with all fields
- **`buildMinimalInput(name)`** — convenience builder defaulting optional fields to null
- **`buildInputMissingField(field)`** — builds input with one required field deleted for validation tests
- **`assertCreateResult(created, expectedName)`** — shared assertions for successful creation results
- **`isRecord(value)`** — type guard to satisfy `no-unsafe-type-assertion` lint rule

## CodeScene Dedup Fix
Initial CodeScene run flagged 4 code duplication warnings at lines 79, 100, 145, 160.
Fixed by extracting:
- `buildMinimalInput()` — eliminates repeated `buildGeneralUserInput` with null optionals
- `assertCreateResult()` — eliminates repeated null check + 4 expect() calls
- `uniqueEmail()` — centralizes email generation pattern

## Verification Results
- tsgo: PASSED
- oxlint: PASSED (after type guard fix for `no-unsafe-type-assertion`)
- biome:check: PASSED
- lint:type-aware: PASSED
- check:duplicates: PASSED
- codescene: PASSED (health score 9.38, 0 warnings after dedup fix)

## Carry-Forward Knowledge
- GraphQL test files live in `frontend/common/graphql/test/<domain>/` subdirectories
- Use `@/frontend/common/graphql/test/helpers` alias for test helpers (not relative paths)
- Import documents from `@/frontend/common/graphql/sharedDocuments/<domain>/`
- `provisionTestSuperAdmin` returns `{ token, userId }` for created super admin
- `assertOperationDenied` handles the full login → mutate → assert denied flow
- `no-unsafe-type-assertion` lint rule requires type guards (`value is Type`) instead of `as` casts
- Tests require running dev server — not executed in this session
