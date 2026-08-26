import { gql } from "@apollo/client";

/**
 * Shared selection set for the `User` entity.
 *
 * Covers the universally-shared user fields exposed by `UserPothosObject`
 * (see `backend/graphql/pothos/auth/user.pothos.ts`): identity (`id`, `name`,
 * `email`), contact (`phone`, `avatarUrl`), status, plus the derived
 * viewer-context fields (`role`, `permissions`, `displayCurrency`,
 * `teacherId`, `parentId`, `notificationCount`, `emailVerifiedAt`,
 * `createdAt`, `updatedAt`).
 *
 * Spread this fragment anywhere a query/mutation returns a `User` selection
 * so the frontend view of the current viewer stays consistent. Apollo cache
 * normalization requires `id` to be present — it is included here.
 *
 * NOTE: This fragment is scoped to the GraphQL `User` type ONLY. The four
 * onboarding mutations return distinct result types (`TeacherOnboarding`,
 * `ManagerOnboardingResult`, `ParentOnboardingResult`, `StudentOnboardingResult`)
 * that share field NAMES with `User` but are separate GraphQL types — GraphQL
 * fragments are type-bound, so this fragment cannot be spread inside those
 * selections. Only spread it inside selections on the `User` type itself.
 */
export const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    name
    email
    emailVerifiedAt
    createdAt
    updatedAt
    avatarUrl
    phone
    status
    permissions
    role
    notificationCount
    teacherId
    parentId
    displayCurrency
  }
`;

// Alias for codegen-style consumers: re-exports the gql-built DocumentNode so
// gql template interpolations in `auth.documents.ts` / `general-user-create.documents.ts`
// receive a DocumentNode that retains its `loc` (the codegen-emitted
// `UserFieldsFragmentDoc` from `generated/gql/graphql` is a JSON literal without
// `loc`, which crashes `graphql-tag`'s template interpolation at module load).
export const UserFieldsFragmentDoc = USER_FIELDS;
