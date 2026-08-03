# Plan 10 — Testing & Knowledge Propagation: Technical Design

> **Feature**: Certificate Generation & Verification (Siraj)
> **Plan**: 10 — Testing & Knowledge Propagation
> **Depends on**: Plans 01–09 (ALL preceding plans must be complete)
> **Patterns source**: `siraj_analysis/10-testing-quality-patterns.md`, `siraj_analysis/03-repository-patterns.md`, `siraj_analysis/04-services-graphql-patterns.md`, existing test suites (`backend/db/test/repo/billing/`, `backend/db/test/logic/billing/`, `frontend/common/graphql/test/billing/`)

---

## 1. Architecture Overview

### 1.1 Layer Position

```
Plans 01–09 (All certificate code — schema, repos, services, GraphQL, UI)
         ↓ validated by
Plan 10 — Testing & Knowledge Propagation (THIS PLAN)
    ├── Repository Tests (backend/db/test/repo/certificates/)
    ├── Service Tests (backend/db/test/logic/certificates/)
    ├── GraphQL Tests (frontend/common/graphql/test/certificates/)
    ├── i18n Tests
    ├── Documentation (docs/certificates/)
    ├── AGENTS.md Updates (11+ files)
    └── Knowledge Outcome Files (outcome/)
```

### 1.2 Test Pyramid

```
                    ┌─────────────────────┐
                    │  GraphQL Integration │  2 files (queries + mutations)
                    │  tests (dev server)  │  slowest, broad scope
                    └─────────────────────┘
                ┌─────────────────────────────┐
                │    Service Tests            │  4 files (logic/business workflows)
                │  (runInRollback, live DB)   │  cross-repo orchestration
                └─────────────────────────────┘
            ┌─────────────────────────────────────┐
            │       Repository Tests               │  7 files (100% coverage)
            │    (runInRollback, live DB)           │  fastest, isolated per-repo
            └─────────────────────────────────────┘
        ┌─────────────────────────────────────────────┐
        │              i18n Tests                       │  1 file (locale key check)
        │         (no DB, no server)                    │  fastest, pure validation
        └─────────────────────────────────────────────┘
```

### 1.3 Pattern Compliance Matrix

| Pattern | Source | Application |
|---|---|---|
| `runInRollback` | `backend/db/test/test-utils.ts`, `billing.repository.test.ts` | ALL DB tests (repo + service) |
| `tx` propagation | `AGENTS.md`, `backend/db/test/logic/AGENTS.md` | Pass `tx` to EVERY repo/service method call |
| `expectRepoError` (try/catch) | `billing.repository.test.ts:25-40` | ALL error assertions inside `runInRollback` |
| `entity-setup.ts` helpers | `backend/db/test/entity-setup.ts` | `createTestUser`, `createTestStudent`, `setupTestEntities` |
| `run-test.ts` script | `scripts/run-test/run-test.ts` | `bun run scripts/run-test/run-test.ts <path>` |
| `testClient` | `frontend/common/graphql/test/testClient.ts` | ALL GraphQL tests |
| `setupTestServerLifecycle` | `frontend/common/graphql/test/lifecycle.ts` | ALL GraphQL tests (spawns dev server) |
| `loginAndProvision` | `frontend/common/graphql/test/helpers.ts` | ALL authenticated GraphQL tests |
| `assertOperationDenied` | `frontend/common/graphql/test/helpers.ts` | Unauthorized GraphQL assertions |
| `TypedDocumentNode` | `sharedDocuments/` + `bun codegen` | ALL GraphQL test documents |
| `errorPolicy: "all"` | `testClient.ts` config | Assert on `result.error`, not `result.errors` |
| `beforeAll` + `tErrors` | `billing.repository.test.ts:15-20` | Init `getServerTranslations("en").errorsTranslations` |
| 100% coverage | `AGENTS.md``backend/db/repo/AGENTS.md` | `bun test --coverage` for all repo tests |
| Bun test runner | `bun:test` | `import { describe, test, expect, beforeAll } from "bun:test"` |
| No `as any` | `AGENTS.md`, `backend/db/test/logic/AGENTS.md` | Strict type safety in all tests |
| `testLogger` | `@/shared/lib/logger/testlogger` | Only logger allowed in tests (no `console.*`) |

---

## 2. Test Files to Create

### 2.1 Directory Layout

```
backend/db/test/repo/certificates/
├── certificate.repository.test.ts              (CertificateRepository)
├── certificate-template.repository.test.ts      (TemplateRepository)
├── template-element.repository.test.ts          (TemplateElementRepository)
├── template-variable.repository.test.ts        (TemplateVariableRepository)
├── recipient-group.repository.test.ts           (RecipientGroupRepository)
├── verification.repository.test.ts              (VerificationRepository)
└── category.repository.test.ts                  (CertificateCategoryRepository)

backend/db/test/logic/certificates/
├── certificate-generation.service.test.ts      (CertificateGenerationService)
├── certificate-verification.service.test.ts    (CertificateVerificationService)
├── template-management.service.test.ts         (TemplateManagementService)
├── recipient-group.service.test.ts             (RecipientGroupService)
└── certificate-i18n.test.ts                     (i18n completeness)

frontend/common/graphql/test/certificates/
├── certificate-query.test.ts                    (GraphQL queries: list, detail, verify)
└── certificate-mutation.test.ts                 (GraphQL mutations: generate, revoke, CRUD)

docs/certificates/
├── overview.md                                  (Canonical feature reference)
├── pdf-rendering.md                             (PDF rendering pipeline)
├── template-management.md                       (Template editor + versioning)
└── verification.md                              (Public verification system)
```

---

### 2.2 Repository Test Pattern — `certificate.repository.test.ts`

#### Structure

```typescript
import { describe, test, expect, beforeAll } from "bun:test";
import { runInRollback } from "@/backend/db/test/test-utils";
import { createTestUser, createTestStudent, setupTestEntities, type TestDb } from "@/backend/db/test/entity-setup";
import { CertificateRepository, TemplateRepository } from "@/backend/db/repo";
import { CertificateStatus } from "@/backend/enum";
import { getServerTranslations } from "@/shared/locale";
import { testLogger } from "@/shared/lib/logger/testlogger";
import type * as Types from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

let tErrors: ErrorsLabels;

beforeAll(() => {
  tErrors = getServerTranslations("en").errorsTranslations;
});

describe("CertificateRepository", () => {
  describe("findById", () => {
    test("returns existing certificate", () =>
      runInRollback(async (tx) => {
        // Setup: create user, student, template, certificate via entity-setup helpers
        const { user, student, template } = await setupTestCertificateEntities(tx);
        const created = await CertificateRepository.create(
          { templateId: template.id, studentId: student.id, /* ... */ },
          tErrors,
          tx
        );
        const result = await CertificateRepository.findById(created.id, tx);
        expect(result).not.toBeNull();
        expect(result?.recipientName).toBe(created.recipientName);
      }));

    test("returns null for non-existent ID", () =>
      runInRollback(async (tx) => {
        const result = await CertificateRepository.findById("nonexistent-id", tx);
        expect(result).toBeNull();
      }));

    test("returns null for soft-deleted certificate", () =>
      runInRollback(async (tx) => {
        const { student, template, user } = await setupTestCertificateEntities(tx);
        const created = await CertificateRepository.create(/* ... */, tErrors, tx);
        await CertificateRepository.softDelete(created.id, user.id, tErrors, tx);
        const result = await CertificateRepository.findById(created.id, tx);
        expect(result).toBeNull();
      }));
  });

  // ... findMany, create, update, softDelete, findByIdempotencyKey
});
```

#### Error Assertion Helper (domain-specific, defined in test file)

```typescript
async function expectRepoError(
  logic: () => Promise<unknown>,
  expectedSubstring: string
): Promise<Error> {
  try {
    await logic();
    throw new Error("Expected error was not thrown");
  } catch (error) {
    expect(error).not.toBeNull();
    const err = error as Error;
    expect(err.message.toLowerCase()).toContain(expectedSubstring.toLowerCase());
    return err;
  }
}

// Usage inside runInRollback:
test("update on non-existent ID throws error", () =>
  runInRollback(async (tx) => {
    await expectRepoError(
      () => CertificateRepository.update("nonexistent", { status: CertificateStatus.ISSUED }, tErrors, tx),
      "not found"
    );
  }));
```

#### Test Data Setup Helper (domain-specific, defined in test file)

```typescript
async function setupTestCertificateEntities(tx: TestDb) {
  const user = await createTestUser(tx, { suffix: "cert-test" });
  const student = await createTestStudent(tx, { parentId: null, suffix: "cert-test" });
  const category = await CertificateCategoryRepository.create(
    { name: { en: "Test Category", ar: "فئة اختبار" } },
    tErrors,
    tx
  );
  const template = await TemplateRepository.create(
    { name: { en: "Test Template", ar: "قالب اختبار" }, createdByUserId: user.id, categoryId: category.id },
    tErrors,
    tx
  );
  return { user, student, template, category };
}
```

#### 100% Coverage Checklist per Repository

| Method | Tests Required |
|---|---|
| `findById` | exists, null (non-existent), null (soft-deleted) |
| `findMany` | no-filter, filter-by-status, filter-by-templateId, filter-by-studentId, pagination, combined |
| `create` | happy path, idempotency collision, all required fields |
| `update` | happy path, non-existent error, soft-deleted error |
| `softDelete` | sets deletedAt, findById returns null, audit log created |
| `findByIdempotencyKey` | exists, null (not found) |
| `loadByIds` | batch lookup, returns Error for missing |
| `existsById` | true, false |
| Feature 6 methods | `findOutcomesByCertificateId`, `findProgressByStudentId`, `updateProgress` |

---

### 2.3 Service Test Pattern — `certificate-generation.service.test.ts`

#### Structure

```typescript
import { describe, test, expect, beforeAll } from "bun:test";
import { runInRollback } from "@/backend/db/test/test-utils";
import { setupTestEntities, createTestUser, createTestStudent, type TestDb } from "@/backend/db/test/entity-setup";
import { CertificateGenerationService, TemplateManagementService, RecipientGroupService } from "@/backend/services/certificates";
import { CertificateRepository, TemplateRepository } from "@/backend/db/repo";
import { CertificateStatus, TemplateStatus } from "@/backend/enum";
import { getServerTranslations } from "@/shared/locale";
import type { ErrorsLabels } from "@/shared/locale";

let tErrors: ErrorsLabels;

beforeAll(() => {
  tErrors = getServerTranslations("en").errorsTranslations;
});

describe("CertificateGenerationService.generateCertificate", () => {
  test("happy path — creates ISSUED certificate with verification code", () =>
    runInRollback(async (tx) => {
      // 1. Setup: create user, student, template (PUBLISHED), recipient group
      const { user, student, template, recipientGroup } = await setupGenerationTestEntities(tx);

      // 2. Generate certificate
      const result = await CertificateGenerationService.generateCertificate({
        templateId: template.id,
        recipientGroupId: recipientGroup.id,
        studentId: student.id,
        idempotencyKey: "test-idemp-key-001",
        actorUserId: user.id,
      }, tErrors, tx);

      // 3. Assertions
      expect(result.status).toBe(CertificateStatus.ISSUED);
      expect(result.verificationCode).toBeTruthy();
      expect(result.idempotencyKey).toBe("test-idemp-key-001");
    }));

  test("idempotency — same key returns same certificate", () =>
    runInRollback(async (tx) => {
      const { user, student, template, recipientGroup } = await setupGenerationTestEntities(tx);
      const input = {
        templateId: template.id,
        recipientGroupId: recipientGroup.id,
        studentId: student.id,
        idempotencyKey: "test-idemp-key-002",
        actorUserId: user.id,
      };

      const first = await CertificateGenerationService.generateCertificate(input, tErrors, tx);
      const second = await CertificateGenerationService.generateCertificate(input, tErrors, tx);

      expect(second.id).toBe(first.id);
      expect(second.verificationCode).toBe(first.verificationCode);
    }));

  test("error — missing template throws not-found error", () =>
    runInRollback(async (tx) => {
      const { user, student } = await setupTestEntities(tx, { suffix: "gen-error" });
      await expectServiceError(
        () => CertificateGenerationService.generateCertificate(
          { templateId: "nonexistent", studentId: student.id, idempotencyKey: "key", actorUserId: user.id },
          tErrors, tx
        ),
        "not found"
      );
    }));

  test("error — unpublished template throws error", () =>
    runInRollback(async (tx) => {
      const { user, student, template } = await setupGenerationTestEntities(tx, { publishTemplate: false });
      await expectServiceError(
        () => CertificateGenerationService.generateCertificate(
          { templateId: template.id, studentId: student.id, idempotencyKey: "key", actorUserId: user.id },
          tErrors, tx
        ),
        "publish"  // substring of "must be published" / "not published"
      );
    }));

  test("error — empty recipient group throws error", () =>
    runInRollback(async (tx) => {
      const { user, student, template, recipientGroup } = await setupGenerationTestEntities(tx, { emptyGroup: true });
      await expectServiceError(
        () => CertificateGenerationService.generateCertificate(
          { templateId: template.id, recipientGroupId: recipientGroup.id, studentId: student.id,
            idempotencyKey: "key", actorUserId: user.id },
          tErrors, tx
        ),
        "empty"  // substring of "recipient group is empty"
      );
    }));
});

describe("CertificateGenerationService.revokeCertificate", () => {
  test("sets status to REVOKED with reason", () =>
    runInRollback(async (tx) => {
      const { user, certificate } = await setupRevocableCertificate(tx);
      const result = await CertificateGenerationService.revokeCertificate(
        { certificateId: certificate.id, reason: "Test revocation", actorUserId: user.id },
        tErrors, tx
      );
      expect(result.status).toBe(CertificateStatus.REVOKED);
      expect(result.revocationReason).toBe("Test revocation");
      expect(result.revokedAt).toBeTruthy();
    }));

  test("cannot revoke an already-revoked certificate", () =>
    runInRollback(async (tx) => {
      const { user, certificate } = await setupRevocableCertificate(tx);
      await CertificateGenerationService.revokeCertificate(
        { certificateId: certificate.id, reason: "First", actorUserId: user.id }, tErrors, tx
      );
      await expectServiceError(
        () => CertificateGenerationService.revokeCertificate(
          { certificateId: certificate.id, reason: "Second", actorUserId: user.id }, tErrors, tx
        ),
        "already"  // substring of "already revoked"
      );
    }));
});
```

#### Service Test Error Helper

```typescript
async function expectServiceError(
  logic: () => Promise<unknown>,
  expectedSubstring: string
): Promise<Error> {
  try {
    await logic();
    throw new Error("Expected service error was not thrown");
  } catch (error) {
    expect(error).not.toBeNull();
    const err = error as Error;
    expect(err.message.toLowerCase()).toContain(expectedSubstring.toLowerCase());
    return err;
  }
}
```

---

### 2.4 GraphQL Integration Test Pattern — `certificate-query.test.ts`

#### Structure

```typescript
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { testClient } from "@/frontend/common/graphql/test/testClient";
import { setupTestServerLifecycle } from "@/frontend/common/graphql/test/lifecycle";
import { loginAndProvision, authenticatedRequest, assertOperationDenied, provisionTestSuperAdmin, cleanupTestSuperAdmin, cleanupTestEntities } from "@/frontend/common/graphql/test/helpers";
import { certificatesQueryDocument, certificateQueryDocument, verifyCertificateQueryDocument } from "@/frontend/common/graphql/sharedDocuments/certificates/certificate.documents";
import { CertificateStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";

describe("Certificate GraphQL Queries", () => {
  setupTestServerLifecycle();

  // Shared test state
  let adminToken: string;
  let adminUserId: string;
  let testCertificateId: string;
  let testVerificationCode: string;

  beforeAll(async () => {
    const provision = await loginAndProvision("CertTest");
    adminToken = provision.token;
    adminUserId = provision.userId;
    // TODO: Create test template + certificate via mutations or seed
    // For now, provisioning creates entities that can be queried
  });

  afterAll(async () => {
    await cleanupTestEntities(adminToken);
  });

  describe("certificates (list query)", () => {
    test("authenticated admin can list certificates", async () => {
      const result = await authenticatedRequest(
        adminToken,
        "query",
        certificatesQueryDocument,
        { first: 10 }
      );
      expect(result.error).toBeUndefined();
      expect(result.data?.certificates).toBeDefined();
      expect(result.data?.certificates?.edges).toBeInstanceOf(Array);
    });

    test("unauthenticated request returns error", async () => {
      const result = await testClient.query({
        query: certificatesQueryDocument,
        variables: { first: 10 },
      });
      assertOperationDenied(result);
    });
  });

  describe("certificate (by ID query)", () => {
    test("authenticated admin can fetch single certificate", async () => {
      // Assumes testCertificateId is set in beforeAll
      const result = await authenticatedRequest(
        adminToken,
        "query",
        certificateQueryDocument,
        { id: testCertificateId }
      );
      expect(result.error).toBeUndefined();
      expect(result.data?.certificate?.id).toBe(testCertificateId);
    });
  });

  describe("verifyCertificate (public query)", () => {
    test("no authentication required — returns VALID for valid code", async () => {
      const result = await testClient.query({
        query: verifyCertificateQueryDocument,
        variables: { verificationCode: testVerificationCode },
      });
      expect(result.error).toBeUndefined();
      expect(result.data?.verifyCertificate?.status).toBe(CertificateStatus.Valid);
    });

    test("returns EXPIRED for expired certificate", async () => {
      const result = await testClient.query({
        query: verifyCertificateQueryDocument,
        variables: { verificationCode: "expired-code-example" },
      });
      expect(result.error).toBeUndefined();
      expect(result.data?.verifyCertificate?.status).toBe(CertificateStatus.Expired);
    });

    test("returns REVOKED for revoked certificate", async () => {
      const result = await testClient.query({
        query: verifyCertificateQueryDocument,
        variables: { verificationCode: "revoked-code-example" },
      });
      expect(result.error).toBeUndefined();
      expect(result.data?.verifyCertificate?.status).toBe(CertificateStatus.Revoked);
    });

    test("returns INVALID for non-existent code", async () => {
      const result = await testClient.query({
        query: verifyCertificateQueryDocument,
        variables: { verificationCode: "nonexistent-code" },
      });
      // May return error or INVALID status depending on schema design
      // Assert appropriately based on actual GraphQL schema
    });
  });
});
```

#### GraphQL Mutation Test Pattern — `certificate-mutation.test.ts`

```typescript
describe("Certificate GraphQL Mutations", () => {
  setupTestServerLifecycle();

  describe("generateCertificate", () => {
    test("authenticated admin generates certificate", async () => {
      const result = await authenticatedRequest(
        adminToken, "mutate",
        generateCertificateMutationDocument,
        { input: { templateId, studentId, idempotencyKey: "test-001" } }
      );
      expect(result.error).toBeUndefined();
      expect(result.data?.generateCertificate?.status).toBe("ISSUED");
      expect(result.data?.generateCertificate?.verificationCode).toBeTruthy();
    });

    test("unauthorized user gets permission error", async () => {
      const result = await testClient.mutate({
        mutation: generateCertificateMutationDocument,
        variables: { input: { templateId: "...", studentId: "...", idempotencyKey: "test-002" } },
      });
      assertOperationDenied(result);
    });
  });

  describe("revokeCertificate", () => {
    test("authenticated admin revokes certificate", async () => { /* ... */ });
    test("unauthorized — permission error", async () => { /* ... */ });
    test("revoking non-existent — error", async () => { /* ... */ });
    test("already revoked — error", async () => { /* ... */ });
  });

  describe("createTemplate", () => {
    test("authenticated admin creates template", async () => { /* ... */ });
    test("unauthorized — permission error", async () => { /* ... */ });
    test("invalid name — validation error", async () => { /* ... */ });
  });

  describe("publishTemplate", () => {
    test("authenticated admin publishes template", async () => { /* ... */ });
    test("creates version snapshot", async () => { /* ... */ });
    test("unauthorized — permission error", async () => { /* ... */ });
  });
});
```

---

## 3. Test Patterns & Constraints

### 3.1 Database Test Rules (CRITICAL)

| Rule | Rationale | Enforcement |
|---|---|---|
| `runInRollback` on ALL DB tests | Prevents database pollution | ESLint + AGENTS.md |
| `tx` passed to ALL method calls | Prevents deadlocks | AGENTS.md (manual) |
| No `expect(...).rejects.toThrow()` in `runInRollback` | Causes deadlocks | AGENTS.md (manual) |
| Use try/catch error helper | Safe error assertion pattern | AGENTS.md |
| No `console.log` | ESLint errors | ESLint |
| Use `testLogger` | Only allowed logger in tests | ESLint |
| No `as any` | Strict type safety | ESLint + TypeScript |
| Create test data via `entity-setup.ts` | Never query seed data | AGENTS.md |
| Use `randomUUID()` or prefixed strings for unique IDs | Avoid unique constraint violations | AGENTS.md |

### 3.2 GraphQL Test Rules (CRITICAL)

| Rule | Rationale | Source |
|---|---|---|
| Use `testClient` (not raw `fetch`) | Type-safe Apollo Client | `test/AGENTS.md` |
| Use `TypedDocumentNode` | Type-safe GraphQL operations | `test/AGENTS.md` |
| Use `setupTestServerLifecycle()` | Spawns/kills dev server | `test/AGENTS.md` |
| `errorPolicy: "all"` | `result.error` not `result.errors` | `test/AGENTS.md` |
| `loginAndProvision(prefix)` | Provision test entities | `test/AGENTS.md` |
| `assertOperationDenied(result)` | Standardized auth denial assertion | `test/AGENTS.md` |
| No backend imports (repos, services, schema) | Tests via GraphQL API only | `test/AGENTS.md` |
| Import docs from `sharedDocuments/<subdir>/` | Alias, not relative | `test/AGENTS.md` |
| Run codegen before tests | Required for typed documents | `AGENTS.md` |

### 3.3 Test Execution Commands

```bash
# Repository tests (run all, parallel via test runner)
bun run scripts/run-test/run-test.ts backend/db/test/repo/certificates/certificate.repository.test.ts
bun run scripts/run-test/run-test.ts backend/db/test/repo/certificates/certificate-template.repository.test.ts
# ... (or batch: bun run test:db)

# Service tests
bun run scripts/run-test/run-test.ts backend/db/test/logic/certificates/certificate-generation.service.test.ts
bun run scripts/run-test/run-test.ts backend/db/test/logic/certificates/certificate-verification.service.test.ts
bun run scripts/run-test/run-test.ts backend/db/test/logic/certificates/template-management.service.test.ts
bun run scripts/run-test/run-test.ts backend/db/test/logic/certificates/recipient-group.service.test.ts

# GraphQL integration tests (requires dev server)
bun run test:graphql  # or:
bun test frontend/common/graphql/test/certificates/

# i18n tests
bun run scripts/run-test/run-test.ts backend/db/test/logic/certificates/certificate-i18n.test.ts

# Coverage check (repository tests only)
bun test --coverage backend/db/test/repo/certificates/

# Quality validation
bun tsgo          # Type checking
bun biome:check   # Formatting + lint
bun run lint      # ESLint via lint queue
```

### 3.4 SonarQube / CodeScene Compliance for Tests

| Concern | Pattern |
|---|---|
| Test helper duplication (CodeScene) | Extract `expectRepoError` / `expectServiceError` / `setupTestCertificateEntities` as local helpers in each file (not shared across files unless truly common) |
| Large method remediation | Keep test setup helpers modular (< 70-80 lines each) |
| No `any` types | Use proper types from `@/backend/types` |
| Optional chaining | Use `result.data?.certificate` not `result.data && result.data.certificate` |
| No nested ternaries | Extract to if/else or separate variables |

---

## 4. Documentation Design

### 4.1 `docs/certificates/overview.md` Structure

```markdown
# Certificate Feature Overview

## Architecture
- [Architecture diagram / data flow]
- [Plan-to-feature mapping table]

## Entities
- [Entity relationship summary with table list]
- [Key relationships diagram]

## Permissions
- [Permission table with scope]

## Key Design Decisions
- Idempotency (unique index + catch pattern)
- Template versioning (snapshot + publish)
- Soft-delete (deletedAt + RLS)
- Public verification (no-auth + RLS)
- Variable resolution (student profile → template variables)

## References
- [Link to pdf-rendering.md]
- [Link to template-management.md]
- [Link to verification.md]
- [Link to backend services, repos, schema]
```

### 4.2 `docs/certificates/pdf-rendering.md` Structure

```markdown
# PDF Rendering Pipeline

## Technology
- [Rendering engine (from Plan 06)]
- [Font handling for Arabic/English]

## Data Flow
- Template → Element Resolution → Variable Substitution → PDF Generation → Storage

## Template-to-PDF
- [Element rendering order (z_index)]
- [Page setup (orientation, dimensions)]
- [QR code generation for verification]

## i18n / RTL
- [Right-to-left rendering for Arabic]
- [Font selection per locale]

## Error Handling
- [Retry strategy]
- [Error states and user feedback]

## Storage
- [Where PDFs are saved]
- [Storage service integration]

## Performance
- [Rendering time expectations]
- [Batch generation considerations]
```

### 4.3 `docs/certificates/template-management.md` Structure

```markdown
# Template Management

## Data Model
- [Templates → Elements → Variables → Versions]

## Element Types
- TEXT, IMAGE, QR_CODE, SIGNATURE, SHAPE
- [Config schema per type]

## Variable Types
- TEXT, DATE, NAME, EMAIL, CUSTOM
- [Resolution pipeline]

## Versioning
- [Snapshot mechanism]
- [Publish lifecycle: DRAFT → PUBLISHED → ARCHIVED]
- [Version increment rules]

## UI Architecture (Plan 07)
- [Template editor views]
- [Desktop/Mobile isolation]

## Permissions
- CERTIFICATES_MANAGE_TEMPLATE

## References
- [TemplateManagementService, TemplateRepository paths]
```

### 4.4 `docs/certificates/verification.md` Structure

```markdown
# Public Certificate Verification

## Verification Flow
- Code lookup → Status check → Response

## Public Access Model
- No authentication required
- RLS allows public INSERT on certificate_verifications

## Verification Status
- VALID, INVALID, EXPIRED, REVOKED

## Event Logging
- IP, User-Agent, timestamp
- Verified-by user (nullable)

## GraphQL API
- verifyCertificate query (Plan 05)
- [Return shape]

## Service Layer
- CertificateVerificationService (Plan 04)
- [Method signatures]

## Verification UI (Plan 08)
- [Public page route]

## Privacy
- [What data is exposed]
- [What PII is withheld]
```

---

## 5. AGENTS.md Update Design

### 5.1 Update Strategy

Each AGENTS.md file receives an **additive** section. No existing content is removed. The new section follows the existing heading style and format of each file.

### 5.2 Content per File

#### `backend/db/repo/AGENTS.md` — "Certificate Repositories"

```markdown
### Certificate Repositories

Location: `backend/db/repo/certificates/`

| Repository | File | Key Patterns |
|---|---|---|
| CertificateRepository | certificate.repository.ts | Idempotency catch, Feature 6 outcomes |
| TemplateRepository | certificate-template.repository.ts | Version snapshots, Feature 6 outcomes |
| TemplateElementRepository | template-element.repository.ts | z_index ordering, config jsonb |
| TemplateVariableRepository | template-variable.repository.ts | (templateId, key) unique catch |
| RecipientGroupRepository | certificate-recipient-group.repository.ts | studentIds array, join students |
| VerificationRepository | certificate-verification.repository.ts | Public insert, no soft-delete |
| CertificateCategoryRepository | certificate-category.repository.ts | Self-referencing hierarchy |

Key patterns:
- `create` catches unique violation on `idempotencyKey` and returns existing record
- `publishVersion` creates a new `certificate_template_versions` row with `elementSnapshot` jsonb
- `RecipientGroupRepository` stores student IDs as `text[]` array (no junction table)
- 5 of 7 repos use soft-delete pattern; verification + versions do not
```

#### `backend/services/AGENTS.md` — "Certificate Services"

```markdown
### Certificate Services

Location: `backend/services/certificates/`

| Service | File | Key Patterns |
|---|---|---|
| TemplateManagementService | template-management.service.ts | Version snapshot, publish/archive |
| CertificateGenerationService | certificate-generation.service.ts | Idempotency key, variable resolution |
| CertificateVerificationService | certificate-verification.service.ts | Public (no auth), status computation |
| RecipientGroupService | recipient-group.service.ts | Student assignment, variable resolution |

Key patterns:
- All services use `namespace NamespaceName { export async function ... }` pattern
- Permission gating via `PermissionsService.hasPermission(userId, AppPermission.CERTIFICATES_*)`
- Localization via `getServerTranslations(locale, "cert")` → `tErrors.cert.*`
- CertificateGenerationService delegates PDF rendering to Plan 06
- CertificateVerificationService requires NO authentication (public endpoint)
```

#### `backend/graphql/AGENTS.md` — "Certificate GraphQL"

```markdown
### Certificate GraphQL

Location: `backend/graphql/pothos/certificates/`

Key patterns:
- `verifyCertificate` query: PUBLIC (no auth required) — special case
- All other certificate queries/mutations require authentication + permissions
- Enum registration: CertificateStatus, TemplateStatus, TemplateElementType, TemplateVariableType, CertificateOrientation, VerificationStatus
- DataLoader batching for certificate lookups (avoid N+1 on template/student joins)
- Input types: TemplateInput, TemplateElementInput, TemplateVariableInput, RecipientGroupInput
```

#### Root `AGENTS.md` — "Important References" section

Add:
```markdown
- `docs/certificates/overview.md` - Certificate feature canonical reference
- `docs/certificates/pdf-rendering.md` - Certificate PDF rendering pipeline
- `docs/certificates/template-management.md` - Certificate template editor & versioning
- `docs/certificates/verification.md` - Public certificate verification system
```

### 5.3 Instruction File Updates

| File | Update (if needed) |
|---|---|
| `.agents/instructions/backend.instructions.md` | Add certificate namespace pattern + idempotency Key note if new convention |
| `.agents/instructions/frontend.instructions.md` | Add certificate Apollo document import patterns if new convention |
| `.agents/instructions/tests.instructions.md` | Add: "Certificate tests use runInRollback + tx propagation; GraphQL tests in `test/certificates/` subdirectory" |

---

## 6. Knowledge Propagation File Design

### 6.1 Per-Task Outcome Files

Each task produces a `<task-id>-outcome.md` file in the `outcome/` directory:

```markdown
# Task <N> Outcome: <Task Title>

## Implementation Summary
- [What was done]

## Research Findings
- [Patterns discovered, test approaches used]

## Pitfalls Encountered
- [Issue: ...] → [Resolution: ...]

## Carry-Over Points
- [Points for subsequent tasks]

## Files Created/Modified
- [List]
```

### 6.2 Final Knowledge Transfer File

`outcome/00-knowledge-transfer-final.md`:

```markdown
# Certificate Testing & Knowledge Transfer — Final Summary

## All Test Files
- [Complete list with paths]

## Documentation Created
- [Complete list with paths]

## AGENTS.md Updates
- [List of files updated with section names]

## Key Patterns Established
- [Comprehensive pattern list]

## Lessons Learned
- [Cross-cutting insights]

## References for Future Work
- [Links to docs, AGENTS.md sections, outcome files]
```

---

## 7. UX/Navigation Specification

> **This plan is testing and documentation only — no new UI routes, sidebar entries, or frontend components are in scope.**

### 7.1 Navigation Impact

| Aspect | Status |
|--------|--------|
| New routes | None (all certificate routes defined in Plans 07/08) |
| Sidebar changes | None |
| Mobile/desktop views | None |

### 7.2 Documentation Routes (Developer-facing)

| Document | Path | Audience |
|----------|------|----------|
| Overview | `docs/certificates/overview.md` | All developers/agents |
| PDF Rendering | `docs/certificates/pdf-rendering.md` | Backend developers |
| Template Management | `docs/certificates/template-management.md` | Full-stack developers |
| Verification | `docs/certificates/verification.md` | Backend developers |

---

## 8. Outcome & Knowledge Transfer Protocol

### 8.1 Protocol Flow

```
Task 1 (Repo Tests)
  → writes outcome/task01-outcome.md
  → Task 2 reads it before starting
Task 2 (Service Tests)
  → writes outcome/task02-outcome.md
  → Task 3 reads both before starting
... (cascade)
Task 12 (Final Knowledge File)
  → reads ALL outcome files
  → synthesizes into outcome/00-knowledge-transfer-final.md
```

### 8.2 Knowledge Retention Goals

1. **Pattern Documentation**: Every test pattern used (runInRollback, tx propagation, expectRepoError, testClient lifecycle) is documented for future test creation.
2. **Pitfall Catalog**: Every pitfall encountered (deadlocks, coverage gaps, GraphQL error handling) is catalogued with the resolution.
3. **Pattern Cross-Reference**: AGENTS.md sections link to canonical docs, which link to source code paths, which align with outcome files.
4. **Future Agent Onboarding**: A new agent reading `docs/certificates/overview.md` + the final knowledge transfer file should have sufficient context to extend the certificate feature without re-discovering any pattern.

---

## 9. Constraints and Assumptions

### Technical Constraints
- All DB tests must use `runInRollback` + `tx` propagation (no exceptions)
- All GraphQL tests must use `testClient` + `TypedDocumentNode` (no raw fetch)
- All test data created via `entity-setup.ts` helpers (never seed data queries)
- 100% repository coverage is mandatory (verified via `bun test --coverage`)
- Test runner: `bun run scripts/run-test/run-test.ts` (not raw `bun test` for DB tests)
- Lint queue server must be running for parallel lint execution

### Assumptions
- Plans 01–09 are fully implemented and stable
- Database migrations are applied (all certificate tables exist)
- `bun run generate:gqlSchema` + `bun codegen` have been run (typed documents exist)
- Dev server can be started for GraphQL integration tests
- `backend/db/test/entity-setup.ts` helpers are available and cover user/student/teacher creation
- The shared locale files for `cert` namespace exist in both `ar` and `en`
- The lint queue server can be started on the configured port

---

## 10. Quality Validation Plan

### 10.1 Per-File Verification Loop

After creating each test file:

```bash
# 1. Type check
bun tsgo

# 2. Biome formatting
bun biome:check

# 3. Lint via queue client (file-scoped)
export LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"plan10","files":["<the-file>"]}'

# 4. Run the test
bun run scripts/run-test/run-test.ts <test-path>
```

### 10.2 Final Quality Gate

After all tasks complete:

```bash
# Full type check
bun tsgo

# Full biome
bun biome:check

# Full lint (via queue, automatically requests full-repo lint)
bun run lint

# Run all certificate tests
bun run test:db              # repository + service tests (parallel)
bun run test:graphql        # GraphQL integration tests

# Verify 100% repo coverage
bun test --coverage backend/db/test/repo/certificates/
```

All commands must exit with zero errors.
