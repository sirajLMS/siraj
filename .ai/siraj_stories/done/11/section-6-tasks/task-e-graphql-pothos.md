### Task E — Backend GraphQL: Pothos Object Types, Queries & Mutations

**Objective:** Define Pothos GraphQL object types, input types, and wire resolvers to the service layer. Ensure all objects expose `id` fields for Apollo cache normalization.

**Dependencies:** Depends on Task D — all service methods are implemented.

**Layer-Specific Rules (Backend GraphQL — Flattened from backend/graphql/pothos/AGENTS.md):**
- **Framework:** Pothos code-first GraphQL schema builder.
- **Nullability:** Fields are non-nullable by default unless explicitly set to `nullable: true`.
- **Resolvers:** Pothos field resolvers should delegate to the service layer.
- **Cache Compliance:** Every GraphQL object MUST expose an `id` field for Apollo cache normalization.
- **Locale Propagation:** Resolvers must propagate `ctx.locale` to service calls.
- **🚫 NO DB/Repo Imports**: Resolvers can ONLY depend on `backend/services/`.

**Target Files:**
- `backend/graphql/pothos/student-directory.pothos.ts` — NEW (student directory query type + resolver)
- `backend/graphql/pothos/staff-directory.pothos.ts` — MODIFY (add manager directory query)
- `backend/graphql/pothos/learning-resource.pothos.ts` — NEW (learning resource types + queries/mutations)
- `backend/graphql/pothos/index.ts` — MODIFY (register new modules)

---

**Detailed Implementation Steps:**

*Step 1: Create `student-directory.pothos.ts`*

Create `backend/graphql/pothos/student-directory.pothos.ts`:

```typescript
import { builder } from "./schema";
import type { GetStudentDirectoryResult } from "@/backend/services/student/student-directory.service";

export interface StudentDirectoryRowDefinition {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly status: string;
  readonly classesRemaining: number;
  readonly classesTotal: number;
  readonly hoursPerWeek: string;
  readonly parentName: string;
  readonly teacherName: string | null;
  readonly createdAt: string; // ISO datetime
}

builder.objectRef<StudentDirectoryRowDefinition>("StudentDirectoryRow")
  .implement({
    id(builder) {
      builder.id("id").requireNonNull();
    },
    name(b) { b.string("name").requireNonNull(); },
    email(b) { b.string("email").requireNonNull(); },
    status(b) { b.string("status").requireNonNull(); },
    classesRemaining(b) { b.int("classesRemaining").requireNonNull(); },
    classesTotal(b) { b.int("classesTotal").requireNonNull(); },
    hoursPerWeek(b) { b.string("hoursPerWeek").requireNonNull(); },
    parentName(b) { b.string("parentName").requireNonNull(); },
    teacherName(b) { b.string("teacherName").nullable(); },
    createdAt(b) { b.dateTime("createdAt").requireNonNull(); },
  });

builder.queryField("studentDirectory", t => 
  t.field({
    type: ["StudentDirectoryRow"],
    args: {
      paginationArgs: t.arg({ type: "PaginationArgs", required: false }),
      filterArgs: t.arg({ type: "StudentFilterArgs", required: false }),
      orderBy: t.argList({ 
        type: "StudentsOrderByClause",
        required: false 
      }),
    },
    resolve: async (_parent, args, ctx) => {
      const { getStudentDirectory } = await import("@/backend/services/student/student-directory.service");
      
      const locale = ctx.locale || "en";
      
      return await getStudentDirectory(
        ctx.userId!,
        args.paginationArgs ?? null,
        args.filterArgs ?? null,
        args.orderBy ?? null,
        locale
      );
    },
    description: "Fetches the global student directory with cross-relational data.",
  })
);
```


---

*Step 2: Extend `staff-directory.pothos.ts`*

Open `backend/graphql/pothos/staff-directory.pothos.ts` and add manager directory query type. The existing file defines teacher directory types — extend it with manager-specific types.

Add these definitions at the end of the file:

```typescript
export interface ManagerDirectoryRowDefinition {
  readonly id: string;
  readonly staffProfileId: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly skypeId: string | null;
  readonly status: string;
  readonly roleSlug: string;
  readonly roleName: string;
}

export const ManagerDirectoryRowPothosObject = builder
  .objectRef<ManagerDirectoryRowDefinition>("ManagerDirectoryRow")
  .implement({
    id(b) { b.id("id").requireNonNull(); },
    staffProfileId(b) { b.id("staffProfileId").requireNonNull(); },
    name(b) { b.string("name").requireNonNull(); },
    email(b) { b.string("email").requireNonNull(); },
    phone(b) { b.string("phone").nullable(); },
    skypeId(b) { b.string("skypeId").nullable(); },
    status(b) { b.string("status").requireNonNull(); },
    roleSlug(b) { b.string("roleSlug").requireNonNull(); },
    roleName(b) { b.string("roleName").requireNonNull(); },
  });

export const managerDirectoryQueryField = builder.queryField("managerDirectory", t => 
  t.field({
    type: [ManagerDirectoryRowPothosObject],
    resolve: async (_parent, _args, ctx) => {
      const { getManagerDirectory } = await import("@/backend/services/staff/manager-directory.service");
      
      const locale = ctx.locale || "en";
      
      const result = await getManagerDirectory(ctx.userId!, locale);
      return result.rows;
    },
    description: "Lists all staff members with administrative access.",
  })
);
```


---

*Step 3: Create `learning-resource.pothos.ts`*

Create `backend/graphql/pothos/learning-resource.pothos.ts`:

```typescript
import { builder } from "./schema";
import type { 
  ListResourcesResult, 
  CreateResourceInput,
  CreateResourceResult 
} from "@/backend/services/resource/learning-resource.service";

// Input types first
export const ResourceUploadInputPothosObject = builder.inputRef<CreateResourceInput>("ResourceUploadInput");

ResourceUploadInputPothosObject.implement({
  displayName(b) { b.string("displayName").requireNonNull(); },
  filePath(b) { b.string("filePath").requireNonNull(); },
  fileId(b) { b.id("fileId").requireNonNull(); },
});

// Resource row type
export interface LearningResourceRowDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly filePath: string;
  readonly uploadedByUserId: string;
  readonly uploadedByUserName: string | null;
  readonly fileSize: number | null;
  readonly contentType: string | null;
  readonly createdAt: string;
}

const LearningResourceRowPothosObject = builder
  .objectRef<LearningResourceRowDefinition>("LearningResourceRow")
  .implement({
    id(b) { b.id("id").requireNonNull(); },
    displayName(b) { b.string("displayName").requireNonNull(); },
    filePath(b) { b.string("filePath").requireNonNull(); },
    uploadedByUserId(b) { b.id("uploadedByUserId").requireNonNull(); },
    uploadedByUserName(b) { b.string("uploadedByUserName").nullable(); },
    fileSize(b) { b.float("fileSize").nullable(); },
    contentType(b) { b.string("contentType").nullable(); },
    createdAt(b) { b.dateTime("createdAt").requireNonNull(); },
  });


// Query
export const learningResourcesQueryField = builder.queryField("learningResources", t => 
  t.field({
    type: [LearningResourceRowPothosObject],
    args: {
      searchQuery: t.arg({ type: "String", required: false }),
    },
    resolve: async (_parent, args, ctx) => {
      const { listResources } = await import("@/backend/services/resource/learning-resource.service");
      
      const locale = ctx.locale || "en";
      
      const result = await listResources(
        ctx.userId!,
        args.searchQuery ?? undefined,
        locale
      );
      
      return result;
    },
    description: "Lists all learning resources available to the academy.",
  })
);

// Mutation
export const uploadLearningResourceMutationField = builder.mutationField("uploadLearningResource", t => 
  t.field({
    type: LearningResourceRowPothosObject,
    args: {
      input: t.arg({ type: "ResourceUploadInput", required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const { createResource } = await import("@/backend/services/resource/learning-resource.service");
      
      const locale = ctx.locale || "en";
      
      return await createResource(
        ctx.userId!,
        args.input,
        locale
      );
    },
    description: "Uploads a new learning resource to the academy library.",
  })
);
```


---

*Step 4: Register new modules in index.ts*

Append the following to `backend/graphql/pothos/index.ts`:

```typescript
export * from "./student-directory.pothos";
export * from "./learning-resource.pothos";
```

The file should already export everything alphabetically — add exports in correct position.

---

*Step 5: Run schema generation and codegen*

Execute these commands in order:

```bash
bun run generate:gqlSchema
```

Verify schema builds successfully. Then run:

```bash
bun codegen
```

Verify generated types compile without errors.

**Test Execution Requirements:**
- Run GraphQL schema generation:
  ```bash
  bun run generate:gqlSchema
  ```
- Run codegen:
  ```bash
  bun codegen
  ```

**Success Criteria / Check Progress Points:**
- [ ] `studentDirectory` query field added to schema with proper arguments.
- [ ] `managerDirectory` query field added to schema (extends existing staff-directory).
- [ ] `learningResources` query field added to schema.
- [ ] `uploadLearningResource` mutation field added to schema.
- [ ] All object types expose `id` field (required for Apollo cache normalization).
- [ ] All resolvers call service methods with `ctx.locale` propagation.
- [ ] No resolver imports from `drizzle-orm`, `backend/db/schema`, or direct repo modules.
- [ ] `bun run generate:gqlSchema` succeeds with 0 errors.
- [ ] `bun codegen` succeeds and generates TypeScript types without errors.


**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
