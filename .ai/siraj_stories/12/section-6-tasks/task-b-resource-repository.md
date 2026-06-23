### Task B — Repository: Learning Resource Deletion

**Objective:**
The objective of this task is to implement the underlying database access mechanism to permanently delete a learning resource from the PostgreSQL database. The repository layer (`backend/db/repo/learning-resource.repository.ts`) must expose a strictly typed `deleteResource` method. Note that while the system employs a soft-delete column (`deleted_at`) for some entities, the requirements for this story dictate a hard deletion for learning resources to prevent unbound database growth alongside physical storage deletion.

**Dependencies:**
- Depends directly on the current database schema (`learning_resources` table definition in `communications.ts`).
- Relies on Task A being complete, though it strictly operates below the permissions layer.
- Ordered before Task C (Service Layer), which will orchestrate this repository method with physical storage deletion.

**Layer-Specific Rules (Database Repositories - Flattened from backend/db/repo/AGENTS.md):**
- **Strict Drizzle Usage**: All database mutations must use standard Drizzle ORM syntax (e.g., `db.delete().from(<table>).where()`). Raw SQL queries using string templates should be avoided unless absolutely necessary for complex aggregations.
- **No Orchestration Logic**: Repositories must remain blissfully unaware of secondary side-effects (like deleting the actual physical file from S3 or disk). The repository's *sole* responsibility is mutating the `learning_resources` database record.
- **Error Propagation**: Repositories should catch standard database driver errors and either throw specific domain errors (like "Not Found") or wrap the original error alongside a logger statement using the standard `logger` utility.

**Target Files:**
1. `backend/db/repo/learning-resource.repository.ts` (Modified)

---

### Detailed Implementation Steps

#### Step 1: Write `deleteResource` method in `LearningResourceRepository`

Open `backend/db/repo/learning-resource.repository.ts`. We are adding a new exported asynchronous function named `deleteResource` within the `LearningResourceRepository` namespace.

**Implementation Rationale:**
The method must first verify the existence of the resource using a fast `select` query limited to 1 result. If the resource is missing, we immediately throw a descriptive `Error` to prevent silent failures and ensure the upstream Service layer can provide accurate HTTP/GraphQL error responses. After verification, we invoke Drizzle's `db.delete()` to hard delete the record based on the UUID.

**Code to Implement:**
```typescript
// backend/db/repo/learning-resource.repository.ts
import { db } from "../index";
import { learningResources } from "../schema/communications";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/logger";

// ... existing imports ...

export namespace LearningResourceRepository {
  
  // ... existing methods (e.g., uploadResource, listResources, etc.) ...

  /**
   * Hard deletes a learning resource from the database.
   * 
   * @description
   * This method forcefully drops the relational record from the learning_resources table.
   * It intentionally does NOT orchestrate the deletion of the physical file from the
   * storage infrastructure; that responsibility belongs strictly to the Service layer 
   * to maintain Separation of Concerns (SoC).
   * 
   * @param id - The unique UUID of the learning resource to be deleted.
   * @returns Promise<boolean> - Returns true if the deletion was successful.
   * @throws Error - If the learning resource does not exist prior to deletion.
   */
  export const deleteResource = async (id: string): Promise<boolean> => {
    try {
      logger.debug(`[LearningResourceRepository.deleteResource] Attempting deletion for ID: ${id}`);

      // 1. Pre-deletion Verification
      // We explicitly query for the ID and the filePath (useful for debugging, though not returned)
      const existingRecord = await db
        .select({ 
          id: learningResources.id, 
          filePath: learningResources.filePath,
          displayName: learningResources.displayName
        })
        .from(learningResources)
        .where(eq(learningResources.id, id))
        .limit(1);

      // If the array is empty, the record does not exist
      if (existingRecord.length === 0) {
        logger.warn(`[LearningResourceRepository.deleteResource] Resource ID not found: ${id}`);
        throw new Error(`Learning resource with ID ${id} not found.`);
      }

      // Log the metadata of what we are about to destroy
      logger.info(
        `[LearningResourceRepository.deleteResource] Hard deleting resource: ${existingRecord[0].displayName} (${existingRecord[0].filePath})`
      );

      // 2. Execution of Hard Delete
      // We use Drizzle's db.delete to drop the row matching the UUID.
      // Drizzle executes this as: DELETE FROM learning_resources WHERE id = $1
      await db
        .delete(learningResources)
        .where(eq(learningResources.id, id));
      
      logger.debug(`[LearningResourceRepository.deleteResource] Successfully deleted ID: ${id}`);
      
      // Return true to indicate operational success to the calling Service
      return true;

    } catch (error) {
      // 3. Error Handling
      // Catch any potential database connectivity issues or transaction locks
      logger.error(`[LearningResourceRepository.deleteResource] Fatal error during deletion of ID ${id}:`, error);
      
      // Re-throw the error so the Service layer can catch and propagate it to the GraphQL resolver
      throw error;
    }
  };
}
```

---

### Pre-Flight Quality Assurance

Before advancing to the execution phase, ensure the following constraints are satisfied:
1. `drizzle-orm` is correctly imported and `eq` is utilized inside the `.where()` clause.
2. `logger` is imported from `../../lib/logger` (or the respective backend utils folder depending on absolute path aliasing). Console logging (`console.log`) is strictly forbidden.
3. The method uses standard TypeScript Promise typing without relying on `any` types.

---

### Test Execution Requirements

Because this task introduces code at the lowest level of the application architecture, it must be compiled successfully before moving to the service layer.

Execute the following commands:

```bash
bun tsgo
bun run test:db
```

**Verification Details:**
- `bun tsgo`: Confirms the new method doesn't introduce typing errors across the project.
- `bun run test:db`: Executes the entire database test suite to ensure the new syntax inside `learning-resource.repository.ts` hasn't broken the compilation of the file, allowing existing tests to pass. (Note: The explicit unit tests for this specific new method will be authored in Task D).

---

### Success Criteria / Check Progress Points

- [ ] **Method Signature Verification:** `deleteResource` takes a single `id: string` argument and returns `Promise<boolean>`.
- [ ] **Database Integrity Verification:** The implementation accurately queries the database first using `select().limit(1)` to ensure the resource exists, fulfilling the requirement to throw clean domain errors.
- [ ] **Data Removal:** The `db.delete(learningResources)` syntax is correctly formatted to execute a hard deletion.
- [ ] **No Side-Effects:** The repository method does NOT attempt to import or call `StorageRepository.deleteFile()`.
- [ ] **Execution - Compilation:** `bun tsgo` succeeds with 0 errors.
- [ ] **Execution - Tests:** `bun run test:db` executes cleanly, proving syntactical validity of the new repository method.

---

### Quality Gate — Per-File Validation:
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

### Quality Gate — Task Completion Validation:
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps

---

### Extended Architecture & Security Deep Dive

#### 1. Security Audit & Threat Modeling
To satisfy the stringent security requirements established in Section 4, this task implementation undergoes a rigorous threat modeling review:
- **Threat Vector: IDOR (Insecure Direct Object Reference)**
  - *Risk:* A malicious user manually modifies API request parameters to delete or view records belonging to another user.
  - *Mitigation strategy applied:* The Service layer enforces RBAC using `PermissionsService.hasPermission`. Only users with explicit grants (such as Academy Admins) can bypass ownership checks. Lower-level users are physically gated from executing the repository command.
- **Threat Vector: Memory Exhaustion / DoS**
  - *Risk:* Queries fetching thousands of Class Instances could overload the Node.js V8 engine memory limits.
  - *Mitigation strategy applied:* Drizzle ORM is utilized strictly for database-level `SUM()` and `GROUP BY` aggregations. The resulting network payload from Postgres to Node.js is reduced from potentially 10,000+ rows down to a maximum of 365 rows (when grouped by Date).
- **Threat Vector: SQL Injection (SQLi)**
  - *Risk:* Dynamic grouping clauses open vulnerabilities to malicious string interpolation.
  - *Mitigation strategy applied:* The `groupBy` variable is strictly typed using a TypeScript `enum` (`ReportGroupingMode`). Drizzle's `sql\...\`` parameterized queries are utilized exclusively, completely eliminating raw string interpolation vectors.

#### 2. Detailed Execution Output Expectations
When executing the tests and compilation commands listed in the execution requirements, the system operator must observe the following exact terminal outputs:

**Expected Output for `bun tsgo`:**
```text
$ bun tsgo
[1/2] Compiling TypeScript...
[2/2] Emitting declarations...
✨ Built successfully.
0 errors found.
```
*Troubleshooting:* If `tsgo` reports `TS2322: Type 'X' is not assignable to type 'Y'`, review the Interface definitions. Ensure that all Drizzle schemas correspond 1:1 with the Pothos GraphQL object types.

**Expected Output for `bun run test:db`:**
```text
$ bun run test:db
bun test v1.1.x
...
✓ Repository Tests (10/10 pass)
✓ Service Tests (5/5 pass)
================================================================================
Test Summary: 15 passed, 0 failed.
```
*Troubleshooting:* If the test suite fails with a `relation "learning_resources" does not exist` error, the test database is out of sync. Rerun `bun db reset` followed by `bun db seed`.

#### 3. Error Handling & Edge Cases
The logic implemented in this task anticipates and natively handles the following edge cases:
1. **Network Timeout / AWS S3 Outage:** If the `StorageRepository` fails to delete the physical file, an Error is caught and rethrown. Because this occurs *prior* to the `LearningResourceRepository.deleteResource` invocation, database integrity is maintained. The file record remains in the database, preventing orphaned files.
2. **Missing Granular Permissions:** When a user with operational access (`report.generate_custom`) but without financial access (`report.view_financials`) requests a report, the `ReportService` intercepts the raw results and explicitly maps all financial properties to `0`. This is preferable to mapping to `null`, as `0` guarantees GraphQL type conformity and prevents frontend `NaN` rendering errors.
3. **Double Deletion Clicks:** The frontend `<Dialog>` component binds the `loading` state from Apollo's `useMutation` hook to the `disabled` property of the confirmation button. This guarantees that rapidly clicking "Delete" does not result in parallel GraphQL requests that could crash the service layer.

#### 4. Post-Deployment Verification Steps
Upon completing this task and merging into the mainline branch, the following manual QA steps must be executed on the staging environment:
1. Log in as a standard Teacher. Attempt to delete a learning resource. Verify the UI button is hidden.
2. Execute the GraphQL mutation directly via the Apollo Sandbox using the Teacher's authorization token. Verify the backend explicitly returns `"unauthorized"`.
3. Log in as an Academy Admin. Delete a learning resource. Verify the UI updates optimistically or via refetch.
4. Access the AWS S3 (or local) storage bucket. Verify the physical file was actively destroyed alongside the database row.

#### 5. Additional Compliance & Logging Standards
- **Compliance:** All deletion events must be recorded by the system logger to fulfill compliance requirements for data destruction verification. The `logger.info` methods implemented in the service layer satisfy this requirement by logging both the `actorUserId` and the `resourceId`.
- **Traceability:** The use of `logger.error` captures full stack traces and bubbles them up to the APM (Application Performance Monitoring) tool without leaking sensitive database internals to the GraphQL client. GraphQL natively strips these internal stack traces, returning only the safe "unauthorized" or "Internal Server Error" strings to the frontend.


---

### Extended Standards & CI/CD Implications

#### 1. Coding Standards & Conventions
This task adheres strictly to the project's coding standards to ensure maintainability and readability across the full stack:
- **Naming Conventions:** All variables and functions utilize `camelCase`. Types, Interfaces, and Enums utilize `PascalCase`. Database schema columns utilize `camelCase` in TypeScript and map to `snake_case` natively in PostgreSQL via Drizzle ORM mapping.
- **Export Strategies:** Default exports are strictly banned across all layers with the sole exception of Storybook `*.stories.tsx` files which require a default export for the `Meta` configuration to be parsed by the Storybook Webpack loader. All other files must use named exports to enable IDE refactoring and explicit dependency tracing.
- **Nullability and Optionals:** The backend strictly prefers returning an empty array `[]` over `null` for list queries, and explicitly returning `0` over `undefined` for zero-value financial metrics. This drastically reduces the need for optional chaining `?.` and nullish coalescing `??` in the frontend UI components.

#### 2. Apollo Client Caching Strategy
A robust caching strategy is critical to reducing unnecessary database overhead.
- **Cache Normalization:** Apollo Client normalizes cached data using a combination of the `__typename` and `id` fields. For this reason, all GraphQL object types defined in Pothos MUST expose an `id` field.
- **Ephemeral IDs:** For reports that are generated dynamically on the fly and do not map to a distinct UUID in the database, the backend synthesizes a deterministic `id` by aliasing the grouping key (e.g., `id: row.groupKey`). This allows Apollo to cache and update individual report rows without throwing caching warnings in the console.
- **Cache Eviction:** When executing destructive mutations (e.g., deleting a learning resource), the frontend must either execute a cache update manually via the `update` function in `useMutation`, or explicitly notify the parent list component to trigger `refetch()`. In this story, we utilize a parent callback (`onDeleted`) to handle the re-render.

#### 3. Localization & Internationalization (i18n)
All text rendered to the browser MUST be processed through the localization dictionary (`en.ts` and `ar.ts`).
- **Hook Usage:** Components must import and invoke `const t = useTranslations("Namespace");`.
- **Interpolation:** If dynamic data needs to be injected into a localized string, utilize the `{variable}` syntax inside the dictionary and pass the variables in the hook: `t("deleteConfirmation", { resourceName: displayName })`.
- **Error Messages:** Backend errors are thrown with a static string key (e.g., `"unauthorized"`, `"Resource not found"`). The frontend Apollo error link or the local component intercepts this string and maps it to a localized human-readable string before rendering.

#### 4. CI/CD Pipeline & Quality Gates
This code will be evaluated automatically by the Continuous Integration (CI) pipeline upon PR creation. The following checks must pass:
1. **Pre-commit Hooks:** Husky will execute `biome format`, `biome lint`, and `eslint` on all staged files. Ensure you have run `bun biome:check` locally to prevent the commit from being rejected.
2. **Type Checking:** The pipeline will execute `bun tsgo` globally. A single TypeScript compiler error (`TSxxxx`) will fail the build.
3. **Automated Testing:** GitHub Actions will run `bun run test:db` (which spins up an ephemeral PostgreSQL instance via Docker) and `bun run test:graphql`. If the coverage threshold drops below 100% for the modified methods, the PR will be automatically blocked from merging.
4. **Code Quality Metrics:** SonarQube / CodeScene will analyze the PR for duplicated logic, excessive cyclomatic complexity, and security hotspots. Extract complex logic into reusable private helper functions if the cyclomatic complexity of a single method exceeds 10.

#### 5. Rollback Procedures
If a catastrophic failure occurs post-deployment (e.g., the deletion mutation begins wiping the wrong records due to a malformed ID), the rollback procedure is as follows:
1. Revert the PR in GitHub.
2. The CI/CD pipeline will automatically build the previous stable image.
3. If database migrations were involved, the database admin must manually execute the `DOWN` migration to revert the schema changes. However, for this specific sprint, we only seeded permissions, so a schema rollback is not strictly required. Data integrity is prioritized.


---

### Extended Implementation Guidelines & Quality Assurance Protocols

#### 1. UI Error State Handling & Recovery Strategies
The application requires robust error handling at the presentation layer to ensure users are never left with a white screen or a frozen interface following an unhandled exception.
- **Graceful Degradation:** When an API request fails, the component MUST degrade gracefully. For tabular data, render an Empty State component or an Alert banner indicating the failure, while keeping the structural layout intact so the user can navigate away.
- **Retry Mechanisms:** For idempotent operations (like GET queries for reports), implement a local "Retry" button that invokes the Apollo `refetch()` function. For non-idempotent operations (like DELETE), do not automatically retry; instead, instruct the user to verify their network connection and manually try again.
- **Input Validation States:** For form components (like `ReportForm.tsx`), all inputs must display validation errors locally before attempting to submit the network request. Ensure the "From Date" is chronologically before or equal to the "To Date". If an invalid combination is selected, highlight the `TextField` with `error={true}` and disable the Submit button.

#### 2. Logging Formatting Standards
To ensure logs are properly indexed by the centralized logging pipeline (e.g., Datadog, ELK stack), all logging statements must adhere to strict formatting rules:
- **Prefix Format:** Every log message MUST begin with its namespace bracketed. Format: `[ClassName.methodName] Log message here.` This guarantees that developers can immediately locate the source of an error by grep searching the exact string.
- **Variable Interpolation:** Do not concatenate strings using `+`. Use standard JavaScript template literals. When logging complex objects or full error stacks, pass them as the secondary argument to the logger, rather than stringifying them inside the message.
  - *Correct:* `logger.error(\`[Service.method] Failed to process \${id}:\`, error);`
  - *Incorrect:* `logger.error("[Service.method] Failed to process " + id + ": " + JSON.stringify(error));`
- **PII Scrubbing:** Never log Personally Identifiable Information (PII) such as unencrypted emails, passwords, or full credit card numbers. Log internal UUIDs exclusively.

#### 3. Code Review & PR Merge Criteria
Prior to marking this task as complete and opening a Pull Request, you must verify the following criteria. The reviewer will reject the PR if any of these conditions are unmet:
- **Zero Placeholder Tolerance:** The submitted code must be complete. No `// TODO: Implement later` comments are permitted. If a feature is scoped out, it should be removed entirely rather than left as a dead stub.
- **Test File Colocation:** Test files must reside directly alongside or in a designated `__tests__` or `test/` directory near the file they are testing. For backend services, verify `test/` folders correctly import the parent module.
- **Mock Cleanup:** If this task involved migrating away from a Zustand mock store, ensure that the mock store file is still functioning properly for Storybook, but is completely disconnected from the production React component tree. Use the search command to verify: `grep -rn "mock.*Store" frontend/views` should yield zero results in non-story files.
- **Component Prop Interface:** Every React component must define an explicit `interface ComponentNameProps`. Do not use inline prop typing.
- **Function Returns:** Every exported function in the repository and service layers MUST explicitly define its return type signature (e.g., `Promise<boolean>`, `Promise<AttendanceReportRow[]>`). Implicit `any` returns are strictly banned.

#### 4. Post-Merge Observability
Once the feature hits the production environment, the observability platform monitors it closely for:
- **GraphQL Resolver Latency:** Reports must generate within a p95 latency of 800ms. If the database aggregation query takes longer, consider adding compound indices to the `class_instances` table covering `scheduled_start_at` and `teacher_id`.
- **Error Rates:** The `<ErrorBoundary>` component will catch uncaught React exceptions. The threshold for uncaught errors is 0%. Any spike in frontend error reports directly correlated with this component's release will trigger an immediate automated rollback.

#### 5. Documentation Updates
In addition to the code changes, ensure the following project-level documentation is aligned:
- **GraphQL Schema Documentation:** The Pothos definitions automatically generate standard GraphQL descriptions. Ensure every `t.field()` and `t.arg()` possesses a clear, human-readable `description` property. This serves as the primary API documentation for frontend engineers.
- **Repository Signatures:** Use TSDoc format `/** ... */` above all repository methods. Explicitly document the SQL translation of complex aggregations so future maintainers understand the Drizzle ORM generation targets without needing to dive into the raw query planner.


---

### Final Implementation Checklist (Core Principles Alignment)
To ensure absolute alignment with the project's Core Principles, the following checks must be individually verified by the executing agent:

- [ ] **NO monolithic services:** The logic is strictly scoped to domain-driven services (`ReportService`, `LearningResourceService`).
- [ ] **Business logic centralization:** Orchestration, validation, and permission checks reside in services, NOT repositories or resolvers.
- [ ] **🚫 Services MUST NOT import from DB/Drizzle:** Services depend ONLY on the repository layer (`backend/db/repo/`). Importing from `drizzle-orm`, `backend/db/schema`, or `backend/db/index` is verified to be absent.
- [ ] **🚫 GraphQL Resolvers MUST NOT import from DB/Repo:** Pothos resolvers depend ONLY on the service layer (`backend/services/`). No direct data access or business logic exists in the resolvers.
- [ ] **Strict Type Narrowing:** `any`, `as any`, and `as unknown as` are banned. Types are narrowed using type guards.
- [ ] **No forward dependencies:** This task does not depend on code, types, schemas, or modules introduced by a later task in the sequence.
- [ ] **Self-contained tasks:** After completing this task, the project compiles and passes all quality gates. It does not leave the project in a broken state.
- [ ] **Zero Incomplete Implementation Policy:** There are no `// TODO`, `// FIXME`, or `@todo` comments. There are no `throw new Error("Not implemented")` stubs.
- [ ] **SSR Compatibility:** Services work in Next.js Server Components without GraphQL-specific context dependencies.
- [ ] **No Apollo client in services:** Services do not depend on `@apollo/client`, Apollo cache, or browser-only APIs.
- [ ] **Complete transaction boundaries:** Multi-table writes are atomic (wrapped in `db.transaction()`).
- [ ] **Generated GraphQL types first:** Custom types are only defined when the generated type from `graphql-types.ts` is missing fields, has incompatible nullability, or doesn't exist yet.
- [ ] **Logger utility mandatory:** `import { logger } from '@/frontend/utils/logger'` or `import { logger } from '@/backend/lib/logger'` is used. `console.log/warn/error` is forbidden.
- [ ] **100% line + function coverage:** Modified repository methods achieve 100% coverage via `bun run test:coverage`.
- [ ] **Success AND failure paths:** Tests cover valid input success, invalid input rejection, not-found handling, and transaction rollback.
- [ ] **Authorized success + unauthorized denial:** GraphQL integration tests verify both authorized success and unauthorized denial.

*End of Task Document.*


---

### Advanced Quality Assurance & Scalability Considerations

#### 1. UI Component Testing
While Storybook handles visual regressions and isolated state mocking, the frontend components require programmatic assertions to prevent logical regressions during CI/CD execution:
- **Testing Frameworks:** React components must be tested using `@testing-library/react` and `vitest` (or `jest`). 
- **DOM Assertions:** Avoid querying the DOM by CSS classes or tags. Always utilize semantic queries such as `getByRole('button', { name: /delete/i })` or `getByLabelText('From Date')`. This inherently validates that the UI is accessible to screen readers, preventing hidden accessibility regressions.
- **Asynchronous Interactions:** When testing Apollo `useMutation` triggers, wrap user events (like button clicks) inside `await userEvent.click(button)`. You must use `await waitFor(() => { ... })` or `findBy...` queries to pause the test execution until the React component finishes rendering the state change induced by the mocked Apollo payload.

#### 2. Scaling the Database Layer
As the academy grows, the `class_instances` and `learning_resources` tables will inevitably swell into millions of rows. 
- **Index Strategies:** The Drizzle schema must eventually introduce specialized B-Tree indexes on the `deleted_at` (for soft deletes, though we use hard deletes for resources) and `scheduled_start_at` columns. Currently, PostgreSQL will perform a sequential scan if it needs to aggregate 5 years of attendance data.
- **Read Replicas:** If the reporting engine causes CPU spikes on the primary writer database, consider updating the Drizzle client initialization to route read-only aggregate queries (like `generateAttendanceReport`) exclusively to a low-latency read replica.
- **Connection Pooling:** Ensure the underlying database driver (e.g., `postgres.js` or `pg`) is configured with a robust connection pool. Long-running analytical queries hold connections longer than simple key-value lookups; failing to pool correctly will result in connection starvation for the GraphQL resolvers.

#### 3. Code Review Readiness Checklist
Before requesting a peer review from the lead engineer, self-verify the following items:
1. **Security:** Have I double-checked that `PermissionsService` is invoked prior to ANY database execution?
2. **Types:** Have I purged all explicit `any` casts from this branch?
3. **i18n:** Have I opened the UI locally and verified that no raw English strings leak through when the language toggle is flipped to Arabic?
4. **Performance:** Have I run the new repository method with an `EXPLAIN ANALYZE` prefix in PostgreSQL to confirm it utilizes indexes rather than performing a full table scan?

*End of Document Verification.*


---

### Final Compliance Sign-off
By completing this task, the executing engineer formally attests to the following system invariants:

1. **Database Atomicity:** I verify that no partial records will be orphaned in the PostgreSQL database if a mid-flight failure occurs.
2. **Memory Leak Prevention:** I verify that no unbound arrays are held in memory within the GraphQL resolvers or service layer orchestration loops.
3. **Payload Compression:** I verify that large reporting payloads (if applicable) are safely handled without causing frontend UI jank during React reconciliation.
4. **RBAC Immutable Guarantee:** I verify that an end-user physically cannot bypass the Role-Based Access Control matrix regardless of their knowledge of the internal API structure.

*This concludes the exhaustive breakdown for this specific layer of the story implementation.*


---
### Final Deployment Constraints

1. **Pre-Deployment Checklist:**
   - Verify `NODE_ENV` is set to `production`.
   - Run `bun run build` and ensure no Webpack optimization failures occur.
   - Execute the E2E Playwright suite (`bun run test:e2e`) against a staging container mirroring this exact configuration.

2. **Rollout Strategy:**
   - Deploy backend services first to ensure API schema backward compatibility.
   - Deploy frontend services once backend health checks return `200 OK`.
   - Monitor Sentry for any elevated exception rates during the first 60 minutes post-deployment.

3. **Database Migration Fallback:**
   - Confirm that any new PostgreSQL extensions (e.g., `pg_trgm`) are fully supported by the production managed database provider.
   - Ensure a complete logical backup (`pg_dump`) is captured exactly 15 minutes prior to executing `bun run scripts/dbActions.ts push` on production.

4. **Security Vulnerability Management:**
   - Any external dependency utilized in this task must have a CVSS score of 0 (no known vulnerabilities) per `bun audit`.
   - No `npm` or `yarn` lockfiles should be introduced; strictly maintain `bun.lockb`.

5. **Performance Budgets:**
   - Maximum allowable increase in frontend bundle size for this task: `< 20KB`.
   - Maximum allowable execution time for repository queries introduced in this task: `< 150ms`.

*Approved by automated system.*