---
name: write-tests
description: >
  Use when writing new tests or expanding test coverage across any of Siraj's test layers:
  (1) Database layer tests (repositories, RLS, triggers, rollback workflows),
  (2) Backend services layer tests (business logic, orchestration, mocked external channels),
  (3) GraphQL integration tests (queries, mutations, server lifecycle, TypedDocumentNode).
---

# Write Tests Guide (Siraj Codebase)

This skill provides step-by-step guidance and templates for authoring high-quality, compliant tests across the three backend and integration testing layers in Siraj.

---

## 1. Choose the Target Testing Layer

```
Which layer are you testing?
 ├── Database Layer (Repositories & DB logic)      → See Section 2
 ├── Backend Services Layer (Business logic & API) → See Section 3
 └── GraphQL Layer (Resolvers & Schema operations) → See Section 4
```

---

## 2. Database Layer Tests (`backend/db/test/`)

Database tests run against the local `siraj_test` PostgreSQL instance.

### File Placement
- **Repository coverage**: `backend/db/test/repo/<entity>.repository.test.ts` (100% coverage target).
- **Business logic / workflows**: `backend/db/test/logic/<domain>/<feature>.test.ts`.

### Strict Rules
1. **Always use `runInRollback`**: Wrap every test inside `runInRollback` from `@/backend/db/test/test-utils`.
2. **Always pass `tx` to all repository methods**:
   ```typescript
   await SomeRepository.updateProfile(userId, input, tx);
   ```
   Failing to pass `tx` causes the repo to use the global pool outside the rollback, leading to deadlocks.
3. **NEVER use `expect(...).rejects.toThrow()` inside `runInRollback`**:
   Promise rejections break transaction rollbacks. Always use the `expectRepoError` helper:
   ```typescript
   async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
     let errorCaught: unknown = null;
     try {
       await fn();
     } catch (error) {
       errorCaught = error;
     }
     expect(errorCaught).not.toBeNull();
     return errorCaught as Error;
   }
   ```
4. **Never query seed data**:
   Always create fresh entities inside the transaction using helpers from `backend/db/test/entity-setup.ts` (`createTestUser`, `createTestTeacher`, `setupStudent`, etc.).
5. **Assert on localized message substrings**:
   Assert on translated message fragments (e.g. `expect(error.message).toContain("not found")`), not translation keys.

### Template: Database Repository Test
```typescript
import { describe, expect, test } from "bun:test";
import { runInRollback } from "@/backend/db/test/test-utils";
import { createTestUser, createTestStudent } from "@/backend/db/test/entity-setup";
import { StudentRepository } from "@/backend/db/repo";

describe("StudentRepository", () => {
  test("updates student status within rollback transaction", async () => {
    await runInRollback(async (tx) => {
      const user = await createTestUser(tx);
      const student = await createTestStudent(tx, user.id);

      const updated = await StudentRepository.updateStatus(student.id, "ACTIVE", tx);
      expect(updated).toBeDefined();
      expect(updated.status).toBe("ACTIVE");
    });
  });
});
```

---

## 3. Backend Services Layer Tests (`backend/services/`)

Service tests cover business workflows, validation, permissions, and orchestration.

### File Placement
- Co-located with the service: `backend/services/<domain>/<service>.service.test.ts` or in `backend/services/<domain>/test/`.

### Strict Rules
1. **Strict Ban on Real External APIs**:
   Never make real network calls to third parties. Mock outbound integrations before exercising code:
   - **Notifications / Communications**: `spyOn(CommunicationService, "dispatchMulti")` or `dispatchWithPreferences`.
   - **Email / SMS / WhatsApp / Push**: Mock channel facades (`emailChannel`, `smsChannel`, `pushChannel`, `WhatsappChannelFactory`).
   - **Exchange Rates / FX**: Mock FX providers or ingestion adapters.
   - **Redis / Cache**: Mock `cacheService` or `ICacheService`.
2. **Live external integration tests belong in `test/integration/` only** (e.g. `test/integration/communication/`).
3. **Assert on domain errors and return structures**.

### Template: Service Test
```typescript
import { describe, expect, test, spyOn } from "bun:test";
import { CommunicationService } from "@/backend/services/communication";
import { BillingService } from "@/backend/services/billing/billing.service";

describe("BillingService", () => {
  test("sends notification on invoice generation without hitting external API", async () => {
    const dispatchSpy = spyOn(CommunicationService, "dispatchMulti").mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      results: [],
    });

    const result = await BillingService.generateInvoice({
      parentId: "test-parent-id",
      amount: 100,
    });

    expect(result.invoiceId).toBeDefined();
    expect(dispatchSpy).toHaveBeenCalled();
    dispatchSpy.mockRestore();
  });
});
```

---

## 4. GraphQL Integration Tests (`frontend/common/graphql/test/`)

Integration tests execute end-to-end GraphQL queries and mutations through a test Next.js server instance.

### File Placement
- `frontend/common/graphql/test/<domain>/<scenario>.test.ts` (mirroring `frontend/common/graphql/sharedDocuments/<domain>/`).

### Strict Rules
1. **Server Lifecycle**: Call `setupTestServerLifecycle()` at the root of your `describe` block.
2. **Execute via `testClient` & `TypedDocumentNode`**:
   Import document nodes from `@/frontend/common/graphql/sharedDocuments/...` and execute via `testClient`.
3. **Strict Interface Isolation**:
   Never import `db/repo` or backend services inside GraphQL test files. All interactions must go through `testClient`.
4. **100% Mutation Argument Coverage**:
   Pass **ALL** available arguments (required + optional as `null` or valid values) in variables. Use typed builder helpers for large inputs.
5. **Enums**: Import and use generated enums from `@/frontend/common/graphql/generated/gql/graphql-types`.

### Template: GraphQL Integration Test
```typescript
import { describe, expect, test } from "bun:test";
import { setupTestServerLifecycle, testClient } from "@/test/helpers";
import { targetEntityQueryDocument } from "@/frontend/common/graphql/sharedDocuments/<domain>/<domain>.documents";

describe("<Domain> GraphQL Integration", () => {
  setupTestServerLifecycle();

  test("fetches entity by ID", async () => {
    // Execute query with authorized session headers
    const result = await testClient.query({
      query: targetEntityQueryDocument,
      variables: { id: "test-entity-id" },
      context: {
        headers: { Authorization: "Bearer <valid-token>" },
      },
    });

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
  });
});
```

---

## 5. Verification & Test Execution

Always run tests with the project test runner and verify quality:

```bash
# 1. Run the specific test with log capture
bun run test/scripts/run-test.ts <path-to-test-file>

# 2. Layer-specific suite commands
bun run test:db             # All DB repository tests (parallel)
bun run test:services       # All Backend service tests
bun run test:graphql        # All GraphQL integration tests

# 3. Verify code quality on newly created test files
bun tsgo
bun oxlint
bun biome:check
bun run scripts/lint-service.ts -f <path-to-test-file>
```
