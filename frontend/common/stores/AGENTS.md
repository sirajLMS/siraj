# Frontend Stores Layer Rules

- **Zustand**: We use Zustand for global state management.
- **Strict Typing**: Stores should be strictly typed using the GraphQL generated types (e.g., import `User` from `graphql-types.ts`). Avoid redefining types if they exist in the GraphQL schema.
- **Direct Assignment**: Solve TypeScript errors by adjusting the GraphQL schema or queries to align with the frontend types. Do NOT create complex intermediate mapping functions or map manually if it can be avoided by simply relying on the exact typed structure from Codegen.
- **Import Types from `graphql-types.ts`**: Import generated entity TYPES from `graphql-types.ts`, NOT `operations.ts`:
  ```ts
  import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";  // ✅ CORRECT — has all type definitions
  import type * as Operations from "@/frontend/common/graphql/generated/gql/operations"; // ✅ CORRECT — only for operation result/variable types
  // ❌ WRONG — do NOT import entity types from operations.ts; it has poorer type definitions
  ```
  - `graphql-types.ts` has the complete and canonical type definitions (enums, interfaces, input types, etc.)
  - `operations.ts` is only for operation-specific result/variable types (e.g., `DeleteBookMutationMutation`)
  - Zustand stores and other type consumers: always prefer `graphql-types.ts` for entity types

## Person Autocomplete options cache

- `userAutocompleteStore` caches **fetched options only** (by audience + search + scope), not selection.
- Page/domain stores (or RHF) hold the **selected** `PersonOption` / id.
- In-memory LRU (no `persist`) — survives SPA navigation and tier switch; refresh refetches.

## Serialization

- **Non-serializable values**: Never store `File`, `Blob`, `FormData`, `Promise`, or other non-JSON-serializable values in `persist`-enabled Zustand stores. `JSON.stringify(new File(...))` produces `{}`, destroying the value on rehydration.
- **Three mitigation strategies** (choose one):
  1. **Non-persisted store**: Create the store without `persist` middleware. State survives tier switch (in-memory) but not page refresh — acceptable for `File` objects since browsers don't let you restore them across refresh anyway.
  2. **`partialize` exclusion**: Use `partialize` in the `persist` config to exclude non-serializable fields. Example: `partialize: (state) => ({ ...state, selectedFile: undefined })` — persist only serializable metadata (e.g., `documentName`), accept that the file must be re-selected on hard refresh.
  3. **`useRef` in ViewModel hook**: Keep `File` objects in a `useRef` inside the `useXxViewModel()` hook (the hook lives above the tier-switch unmount boundary, so the ref survives). Store only serializable metadata in Zustand.
- **ViewModel hook for `File`**: The recommended pattern for file uploads is option 3 — keep `File` in a `useRef` in the ViewModel hook, store `documentName` (string) in Zustand.
- **ESLint enforcement**: No automated enforcement yet; developers must follow this rule. Add a manual review check in `plan-review` skill for stores using `persist`.
- **Cross-reference**: See `frontend/views/AGENTS.md` (ViewModel Pattern), `.agents/instructions/mobile-desktop.instructions.md`.

## Serialization

### Non-serializable values

- Never store `File`, `Blob`, `FormData`, `Promise`, or other non-JSON-serializable values in `persist`-enabled Zustand stores. `JSON.stringify(new File(...))` produces `{}`, destroying the value on rehydration.

### Three mitigation strategies (choose one)

1. **Non-persisted store**: Create the store without `persist` middleware. State survives tier switch (in-memory) but not page refresh — acceptable for `File` objects since browsers don't let you restore them across refresh anyway.
2. **`partialize` exclusion**: Use `partialize` in the `persist` config to exclude non-serializable fields. Example: `partialize: (state) => ({ ...state, selectedFile: undefined })` — persist only serializable metadata (e.g., `documentName`), accept that the file must be re-selected on hard refresh.
3. **`useRef` in ViewModel hook**: Keep `File` objects in a `useRef` inside the `useXxViewModel()` hook (the hook lives above the tier-switch unmount boundary, so the ref survives). Store only serializable metadata in Zustand.

### ViewModel hook for `File`

- The recommended pattern for file uploads is option 3 — keep `File` in a `useRef` in the ViewModel hook, store `documentName` (string) in Zustand.

### ESLint enforcement

- No automated enforcement yet; developers must follow this rule. Add a manual review check in `plan-review` skill for stores using `persist`.

### Cross-reference

- See `frontend/views/AGENTS.md` (ViewModel Pattern), `.agents/instructions/mobile-desktop.instructions.md`.
