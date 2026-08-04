# Task 02 — Auth Test Outcome

## File Analyzed
`frontend/common/graphql/test/auth/auth.test.ts`

## Mutations Found and Their Variables

### 1. `demoLoginMutationDocument`
- **Source:** `frontend/common/graphql/sharedDocuments/auth/auth.documents.ts`
- **GraphQL document:** `mutation demoLogin($input: DemoLoginInput!) { demoLogin(input: $input) { ... } }`
- **Variables:**
  - `input` (`DemoLoginInput`) — **required**
- **Input type `DemoLoginInput`:**
  - `groupSlug: String` — **required** (no optional fields exist)
- **Call sites in test:**
  - Line 17 (`expectDemoLoginSucceeds`): passes `variables: { input: { groupSlug } }` ✅
  - Line 42 (super_admin token test): passes `variables: { input: { groupSlug: "super_admin" } }` ✅
  - Line 111 (stale JTI test setup): passes `variables: { input: { groupSlug: "academy_admin" } }` ✅
  - Indirect (lines 58, 63): `expectDemoLoginSucceeds` covers `academy_admin` and `super_admin`

### 2. `logoutMutationDocument`
- **Source:** `frontend/common/graphql/sharedDocuments/auth/auth.documents.ts`
- **GraphQL document:** `mutation logout { logout }`
- **Variables:** None (`LogoutMutationVariables = { [key: string]: never }`)
- **Call sites in test:**
  - Line 145: `authenticatedRequest(token, "mutate", logoutMutationDocument)` — no variables needed ✅

### 3. `refreshTokenMutationDocument`
- **Source:** `frontend/common/graphql/sharedDocuments/auth/auth.documents.ts`
- **GraphQL document:** `mutation refreshToken { refreshToken { ... } }`
- **Variables:** None (`RefreshTokenMutationVariables = { [key: string]: never }`)
- **Call sites in test:**
  - Line 102: `authenticatedRequest(token, "mutate", refreshTokenMutationDocument)` — no variables needed ✅
  - Line 123: `testClient.mutate({ mutation: refreshTokenMutationDocument })` — no variables needed ✅
  - Line 129: `testClient.mutate({ mutation: refreshTokenMutationDocument, context: { ... } })` — no variables needed ✅
  - Line 154: `testClient.mutate({ mutation: refreshTokenMutationDocument, context: { ... } })` — no variables needed ✅

## What Was Missing Before Changes

**Nothing was missing.** All three mutations in this test file already pass all available input arguments as `variables` at every call site:

- `demoLoginMutationDocument` — the only input type field (`groupSlug`) is required and is passed in every call. There are no optional fields in `DemoLoginInput`, so there is no optional-arg-with-`null` test to add.
- `logoutMutationDocument` — the GraphQL document declares no variables. Nothing to pass.
- `refreshTokenMutationDocument` — the GraphQL document declares no variables. Nothing to pass.

## What Was Added/Changed

**No changes were made to the test file.** It already satisfies all requirements:

1. Every variable declared in each mutation's GraphQL document appears in the `variables` object at every call site.
2. For `demoLoginMutationDocument`, the only input field (`groupSlug`) is required, so it is passed with a meaningful value at every call. There are no optional fields to test with `null`.
3. `logoutMutationDocument` and `refreshTokenMutationDocument` have no variables, so no `variables` object is needed at their call sites.

## Backend Bugs Found

None. No CROSS-FILE DEPENDENCY reports.

## Quality Loop Results

No file modifications were made, so the quality loop was not run (the file is unchanged).
