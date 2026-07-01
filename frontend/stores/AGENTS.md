# Frontend Stores Layer Rules

- **Zustand**: We use Zustand for global state management.
- **Strict Typing**: Stores should be strictly typed using the GraphQL generated types (e.g., import `User` from `graphql-types.ts`). Avoid redefining types if they exist in the GraphQL schema.
- **Direct Assignment**: Solve TypeScript errors by adjusting the GraphQL schema or queries to align with the frontend types. Do NOT create complex intermediate mapping functions or map manually if it can be avoided by simply relying on the exact typed structure from Codegen.
- **Import Types from `graphql-types.ts`**: Import generated entity TYPES from `graphql-types.ts`, NOT `operations.ts`:
  ```ts
  import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";  // ✅ CORRECT — has all type definitions
  import type * as Operations from "@/frontend/graphql/generated/gql/operations"; // ✅ CORRECT — only for operation result/variable types
  // ❌ WRONG — do NOT import entity types from operations.ts; it has poorer type definitions
  ```
  - `graphql-types.ts` has the complete and canonical type definitions (enums, interfaces, input types, etc.)
  - `operations.ts` is only for operation-specific result/variable types (e.g., `DeleteBookMutationMutation`)
  - Zustand stores and other type consumers: always prefer `graphql-types.ts` for entity types
