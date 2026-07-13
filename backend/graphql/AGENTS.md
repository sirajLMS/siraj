# Backend GraphQL & Pothos Layer Rules

- **Framework**: We use Pothos to build our GraphQL schema code-first.
- **Nullability**: In Pothos, fields are non-nullable by default unless explicitly set to `nullable: true`. Ensure your TypeScript types align with your Pothos definitions.
- **Resolvers**: Pothos field resolvers should generally delegate to the `backend/services/` layer, rather than putting business logic inside the GraphQL definitions or calling Repositories directly.
- **Cache Updates**: Ensure `id` fields are always exposed on GraphQL objects so the Apollo client can auto-update its cache.
- **Locale Propagation & Localized Errors**: GraphQL field resolvers must propagate the request locale (`ctx.locale`) to service and repository calls to enable proper localized error messages. Any direct error thrown in resolvers should also be translated using next-intl (via `getBackendTranslations`).
- **Type Definition Pattern**: GraphQL Pothos objects should use types from `backend/types/` (e.g., `{Entity}ReturnType`, `{Entity}SubmitInput`) as the underlying type references for object and input definitions. Import these types from `@/backend/types` and use them in Pothos `.implement()` calls to ensure consistency between GraphQL types and backend service/repository types.

## Pothos Enum Registration Pattern (CRITICAL RULE)

GraphQL enums MUST be backed by a real TypeScript `enum` defined in `backend/enum/`. **Hardcoding enum value literal arrays inside a Pothos file is PROHIBITED** — it bypasses the single-source-of-truth enum definition and drifts away from the backend layer.

### Positive Pattern (Required):
- Define the enum in `backend/enum/<subdir>/<entity>.enum.ts` (see `backend/enum/AGENTS.md`).
- Register it with Pothos by passing the enum object: `gqlSchemaBuilder.enumType(MyEnum, { name: "MyEnum" })`.
- All Pothos enum registrations live in `backend/graphql/pothos/shared/enum.pothos.ts`. Import the registered Pothos enum (e.g. `MyEnumPothosEnum`) from there into the domain Pothos files that reference it on a field — never re-register the same enum in a domain file.
- Run `bun run generate:gqlSchema` then `bun codegen` after registering a new enum so the frontend codegen output (`@/frontend/common/graphql/generated/gql/graphql-types`) stays in sync.

```typescript
// backend/enum/profiles/profile.enum.ts
export enum ProfileMode {
  VIEW = "view",
  EDIT = "edit",
}

// backend/graphql/pothos/shared/enum.pothos.ts
import { ProfileMode } from "@/backend/enum";
export const ProfileModePothosEnum = gqlSchemaBuilder.enumType(ProfileMode, { name: "ProfileMode" });

// backend/graphql/pothos/profile/profile.pothos.ts
import { ProfileModePothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
// ...use ProfileModePothosEnum as a field type
```

### Negative Pattern (PROHIBITED):
- Hardcoding enum value literals inside a Pothos file:
  ```typescript
  // ❌ DO NOT DO THIS in *.pothos.ts files
  export const ProfileModePothosEnum = gqlSchemaBuilder.enumType("ProfileMode", {
    values: ["view", "edit"] as const,
  });
  ```
- Defining a TypeScript `enum` inline inside a Pothos file instead of `backend/enum/`.
- Re-registering an enum that is already registered in `shared/enum.pothos.ts` (produces a "has already been declared" runtime error).
- Re-declaring enum values as a string-union type somewhere else (e.g. `type ProfileMode = "view" | "edit"`); the canonical enum lives in `backend/enum/` and all other layers should reference that enum (or, for the frontend, the GraphQL codegen enum).

### Migrating an existing hardcoded Pothos enum:
1. Define (or locate) the canonical TypeScript `enum` under `backend/enum/<subdir>/`.
2. Add it to the sub-directory's `index.ts` and (if needed) the top-level `backend/enum/index.ts` barrel.
3. Register it once in `backend/graphql/pothos/shared/enum.pothos.ts` using the enum-object form.
4. Replace any `values: [...]` usages in domain Pothos files with an import of the registered Pothos enum from `shared/enum.pothos`.
5. Regenerate the schema and codegen.

## Single Canonical Object Type Pattern (CRITICAL RULE)

### Positive Pattern (Required):
- Create a single GraphQL object type per entity using types from `backend/types/` (e.g., `{Entity}ReturnType`)
- Use the canonical type as the basis for Pothos object implementation: `gqlSchemaBuilder.objectRef<{Entity}ReturnType>("<Entity>")`
- Add additional fields as needed (resolved relationships, computed properties) beyond the canonical type
- Leverage GraphQL's selection mechanism - clients can request only the fields they need from the full object
- Define input types using types from `backend/types/` (e.g., `{Entity}SubmitInput`)

### Negative Pattern (PROHIBITED - Major Violation):
- Creating local type definitions within Pothos files (e.g., `export type {Entity}Definition = {...}`)
- Defining multiple GraphQL object types for the same entity when one canonical type would suffice
- Duplicating entity structure in local types instead of using centralized types from `backend/types/`
- Creating ad-hoc types like `export type <Entity>SimpleDefinition`

### Example of Proper Pattern:
```typescript
// Instead of defining local types in Pothos files:
export type <Entity>SimpleDefinition = {
  id: string;
  name: string;
};

// Use types from backend/types:
import type { {Entity}ReturnType } from "@/backend/types";

const {Entity}Ref = gqlSchemaBuilder.objectRef<{Entity}ReturnType>("<Entity>");
export const {Entity}PothosObject = {Entity}Ref.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    // ... other fields from {Entity}ReturnType
  }),
});
```

### Exception Policy:
- Input types (mutation inputs, filter inputs) are allowed as separate definitions when they serve a specific purpose
- Wrapper types for collections or complex responses (e.g., paginated results) are allowed as separate definitions
- Complex computed/derived types that don't map directly to a single table may require custom definitions (but should still import base types from `backend/types/`)