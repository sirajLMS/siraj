# GraphQL Client Patterns — Profile Pages

Match existing codebase patterns exactly.
**Data sourcing:** All profile UI data must come from GraphQL endpoints only. See [DATA_POLICY.md](./DATA_POLICY.md).
 Reference: `frontend/views/profile/teacher/TeacherProfileContainer.tsx`, `frontend/graphql/sharedDocuments/profile.documents.ts`.



## Data policy (mandatory)

- **Reads:** `useQuery` + documents in `sharedDocuments/` — no backend service imports
- **Writes:** `useMutation` only — refetch via `refetch()` or `refetchQueries`
- **Server pages:** routing props only (`scope`, `mode`, `audience`, `targetUserId`) — no profile payload
- **Nested/tab data:** fields on `profileByUserId` OR dedicated GraphQL query with `skip` — both are valid GraphQL endpoints
- **Presentational sections:** receive props from container query result; do not call services

## Documents (`frontend/graphql/sharedDocuments/`)

```typescript
import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";

export const profileByUserIdQueryDocument: TypedDocumentNode<
  Operations.ProfileByUserIdQuery,
  Types.QueryProfileByUserIdArgs
> = gql`
  query ProfileByUserId($userId: String!) {
    profileByUserId(userId: $userId) {
      id
      # every nested object must include id
    }
  }
`;
```

Rules:
- `gql` + `TypedDocumentNode` from `@apollo/client` (NOT `@apollo/client/core`)
- `Operations.*` for operation result types; `Types.*` for variables/entity types
- Entity enums/interfaces from `graphql-types.ts` — NOT from `operations.ts`
- Naming: `{entityName}QueryDocument`, `{entityName}MutationDocument`
- Export from `sharedDocuments/index.ts`
- After changes: `bun run generate:gqlSchema` (if pothos changed) then `bun codegen`

## Client containers (`frontend/views/profile/`)

```typescript
"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { profileByUserIdQueryDocument, updateOwnProfileMutationDocument } from "@/frontend/graphql/sharedDocuments/profile.documents";
```

### useQuery — REQUIRED pattern

- **NO `useLazyQuery`** — forbidden by `frontend.instructions.md`
- Import hooks from `@apollo/client/react` only
- Stateful `useQuery` with `variables`, `skip` when needed:

```typescript
const { data, loading, error, refetch } = useQuery(profileByUserIdQueryDocument, {
  variables: { userId: targetUserId },
  fetchPolicy: "cache-and-network", // use when data may change (dashboard pattern)
});

// Conditional queries — use skip, NOT lazy query:
const { data: prefsData } = useQuery(notificationPreferencesQueryDocument, {
  skip: activeTab !== "notifications",
});
```

### useMutation

```typescript
const [updateOwnProfile, { loading: saving }] = useMutation(updateOwnProfileMutationDocument, {
  refetchQueries: [{ query: profileByUserIdQueryDocument, variables: { userId: targetUserId } }],
});
```

Or `await refetch()` after mutation (existing profile pattern).

### Types in UI

```typescript
// Prefer inferred from query result:
type ProfileData = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>;

// Or NonNullable chaining for nested:
type TeacherOwn = NonNullable<ProfileData["teacherOwnProfile"]>;
```

Never define duplicate entity shapes. Extend gql generated types only.

### Forms

- `react-hook-form` + `zodResolver` (existing teacher profile pattern)
- Submit handlers call `useMutation` with typed variables
- Navigate with `useRouter` from `@/shared/i18n/routing`

### Loading / error

- Pass `loading`, `error` to `ProfileShell`
- Use `previousData` + `networkStatus` for refetch UX when following dashboard patterns
