### Task J — GraphQL Integration Tests

**Objective:** Write GraphQL integration tests to verify the `deleteLearningResource` mutation and `generateAttendanceReport` query work correctly over the API and properly enforce RBAC.

**Dependencies:** Depends on Task I — requires `deleteLearningResourceMutationDocument` and `generateAttendanceReportQueryDocument` and generated schema.

**Layer-Specific Rules (Frontend GraphQL Tests - Flattened from section-1-core-principles.md):**
- **Authorized success + unauthorized denial** — Every new GraphQL operation must have tests for authorized success and unauthorized denial.
- **Security threat coverage** — Include tests reflecting threats from Section 4.

**Target Files:**
- `frontend/graphql/test/resource.test.ts`
- `frontend/graphql/test/report.test.ts` (New)

**Detailed Implementation Steps:**

*Step 1: Write `resource.test.ts`*

Open `frontend/graphql/test/resource.test.ts` (or create if not existing).

```typescript
// frontend/graphql/test/resource.test.ts
import { expect, test, describe } from "bun:test";
import { executeGraphQLMutation } from "./setup";
import { deleteLearningResourceMutationDocument } from "../sharedDocuments/resource.documents";
// import helpers for DB seeding ...

describe("Mutation: deleteLearningResource", () => {
  test("allows Academy Admin to delete a resource", async () => {
    // 1. Arrange: Seed resource and get an admin token
    // const resource = await seedResource();
    // const adminToken = await getAdminToken();

    // 2. Act
    // const result = await executeGraphQLMutation(deleteLearningResourceMutationDocument, { id: resource.id }, adminToken);

    // 3. Assert
    // expect(result.data?.deleteLearningResource).toBe(true);
  });

  test("rejects User without resources.delete permission", async () => {
    // 1. Arrange: Seed resource and get a teacher token (no perm)
    // const resource = await seedResource();
    // const teacherToken = await getTeacherToken();

    // 2. Act & Assert
    // const result = await executeGraphQLMutation(deleteLearningResourceMutationDocument, { id: resource.id }, teacherToken);
    // expect(result.errors).toBeDefined();
    // expect(result.errors![0].message).toInclude("unauthorized");
  });
});
```

*Step 2: Write `report.test.ts`*

Create `frontend/graphql/test/report.test.ts`.

```typescript
// frontend/graphql/test/report.test.ts
import { expect, test, describe } from "bun:test";
import { executeGraphQLQuery } from "./setup";
import { generateAttendanceReportQueryDocument } from "../sharedDocuments/report.documents";
import { ReportGroupingMode } from "../generated/gql/graphql-types";
// import helpers for DB seeding ...

describe("Query: generateAttendanceReport", () => {
  const filters = {
    fromDate: new Date("2024-01-01").toISOString(),
    toDate: new Date("2024-12-31").toISOString(),
    groupBy: ReportGroupingMode.Date
  };

  test("returns full data for Academy Admin with both permissions", async () => {
    // 1. Arrange: get token with both report.generate_custom and report.view_financials
    // const adminToken = await getAdminToken();

    // 2. Act
    // const result = await executeGraphQLQuery(generateAttendanceReportQueryDocument, { filters }, adminToken);

    // 3. Assert
    // expect(result.data?.generateAttendanceReport).toBeDefined();
    // expect(result.data?.generateAttendanceReport[0].paidEGP).toBeGreaterThan(0); // Assuming seeded data
  });

  test("masks financial data for user lacking report.view_financials", async () => {
    // 1. Arrange: get token with ONLY report.generate_custom
    // const limitedToken = await getLimitedAdminToken();

    // 2. Act
    // const result = await executeGraphQLQuery(generateAttendanceReportQueryDocument, { filters }, limitedToken);

    // 3. Assert
    // expect(result.data?.generateAttendanceReport).toBeDefined();
    // expect(result.data?.generateAttendanceReport[0].totalHours).toBe(0);
    // expect(result.data?.generateAttendanceReport[0].paidEGP).toBe(0);
  });

  test("rejects user lacking report.generate_custom", async () => {
    // 1. Arrange: get teacher token
    // const teacherToken = await getTeacherToken();

    // 2. Act & Assert
    // const result = await executeGraphQLQuery(generateAttendanceReportQueryDocument, { filters }, teacherToken);
    // expect(result.errors).toBeDefined();
    // expect(result.errors![0].message).toInclude("unauthorized");
  });
});
```

**Test Execution Requirements:**
- Run GraphQL integration tests:
  ```bash
  bun run test:graphql
  ```

**Success Criteria / Check Progress Points:**
- [ ] Tests verify `deleteLearningResource` authorization logic.
- [ ] Tests verify `generateAttendanceReport` authorization logic and financial masking over the API boundary.
- [ ] `bun run test:graphql` passes cleanly.

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
