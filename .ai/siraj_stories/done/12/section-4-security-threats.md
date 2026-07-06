## Section 4: Security Threat Remediation

Story 12 introduces destructive database operations (`DELETE` queries) and the exposure of heavily aggregated financial payroll metrics. This section documents the specific security threats identified, the exact fixes, and the test requirements that must pass before this story is considered complete.

---

### Threat 1: IDOR on Resource Deletion

**Threat ID:** T12-001
**Severity:** Critical
**Attack Vector:** A user (Teacher, Student, or unauthorized Admin) manipulates the `resourceId` parameter in the `deleteLearningResource` GraphQL mutation to delete files belonging to other academies or arbitrary system files.

**Current Gap:**
If the GraphQL resolver or repository simply executes `DELETE FROM learning_resources WHERE id = ?` without validating the actor's permission boundary, an Insecure Direct Object Reference vulnerability exists.

**Fix:**
The service method `LearningResourceService.deleteResource(resourceId, actorUserId)` performs a strict `PermissionsService.hasPermission(actorUserId, AppPermission.RESOURCES_DELETE)` check before executing any logic. Because `resources.delete` is ONLY granted to the `academy_admin` group, and Admins are isolated by tenant boundaries (already handled by the core permission framework), a Teacher or unprivileged actor will receive an instant `unauthorized` throw.

**Test Requirements:**
1. **GraphQL test — unauthorized actor:** An actor with a Teacher role calls the mutation → receives `insufficientPermissions` error. No file is deleted.
2. **GraphQL test — authorized actor:** Admin calls mutation → succeeds.
3. **Service unit test:** Calling `LearningResourceService.deleteResource` explicitly throws `Unauthorized` if the permission mock returns false.

---

### Threat 2: Financial Data Leakage (Payroll Fraud / Gossiping)

**Threat ID:** T12-002
**Severity:** Critical
**Attack Vector:** Users with standard operational reporting access (`report.generate_custom`) manually execute a GraphQL Query against the `generateAttendanceReport` endpoint, maliciously including the `paidEGP` and `paidUSD` fields in their GraphQL AST selection set.

**Current Gap:**
If the backend relies purely on the frontend UI to "hide" the columns from the DataGrid, a bad actor can open Chrome DevTools, capture the bearer token, and execute the raw GQL query via Apollo Sandbox to view other teachers' compensation metrics.

**Fix — Node.js Layer Redaction:**
The resolver propagates the user context to `ReportService.generateAttendanceReport()`. The service explicitly evaluates:
```typescript
const canViewFinancials = await PermissionsService.hasPermission(actorUserId, AppPermission.REPORT_VIEW_FINANCIALS);
```
If this evaluates to `false`, the service iterates over the rows returned from the Database Repository and strictly overrides the financial fields:
```typescript
row.paidEGP = 0;
row.paidUSD = 0;
row.hours = 0;
```
This guarantees that regardless of what the GraphQL AST requests, the data is physically destroyed in-memory before it reaches the network socket.

**Test Requirements:**
1. **Service test — Redaction:** Call service without financial permission, verify output fields are strictly `0`.
2. **Service test — Pass-through:** Call service with financial permission, verify output fields contain aggregated totals.
3. **GraphQL test:** Verify that a standard Admin (without financial privileges) executing a query explicitly requesting `paidEGP` receives `0`, not the real data, and no error is thrown (graceful redaction).

---

### Threat 3: Destructive Action Orphaned Files (State Desync)

**Threat ID:** T12-003
**Severity:** High
**Attack Vector:** The admin executes a delete command. The database record is deleted successfully, but the AWS S3 network request fails due to a timeout. The physical file is now permanently orphaned in the cloud bucket, accumulating hidden billing costs because the reference in the DB is gone.

**Current Gap:**
Executing `DELETE` queries prior to network `unlink` commands guarantees state desynchronization upon network failure.

**Fix — Ordered Deletion Protocol:**
The `LearningResourceService.deleteResource()` method MUST call `StorageService.deleteFile(filePath)` BEFORE the `LearningResourceRepository.deleteById()` is invoked. 
If the S3 deletion throws an exception, the Node process halts, the catch block intercepts, and the Database Delete query is never fired. The user is alerted to the network failure, and they can retry. The database record remains intact, preventing an orphaned asset.

**Test Requirements:**
1. **Service Unit Test — Network Failure:** Mock the `StorageService` to throw a `TimeoutError`. Assert that `LearningResourceRepository.deleteById` is `toHaveBeenCalledTimes(0)`.
2. **Integration Test:** Verify that successful S3 deletion leads directly to successful DB deletion.

---

### Threat 4: SQL Injection in Report Grouping / Query Parameters

**Threat ID:** T12-004
**Severity:** Medium
**Attack Vector:** A bad actor passes a malformed string or SQL payload into the `fromDate`, `toDate`, or `groupBy` parameters of the `generateAttendanceReport` query to extract un-authorized tables.

**Current Gap:**
Using raw `sql\`...\`` blocks with string interpolation in Drizzle to construct dynamic `GROUP BY` logic opens severe vulnerability vectors.

**Fix — Strict Typings and Parameterization:**
- Dates are strictly parsed using standard `Date` objects in TypeScript.
- The `groupBy` variable is strictly constrained by a GraphQL `Enum` (`ReportGroupingMode`).
- The Drizzle query utilizes native primitive builder methods (`eq`, `gte`, `lte`, `and`). No raw string injection is permitted.
- The repository layer maps the `ReportGroupingMode` enum to physical Drizzle columns (e.g., `groupBy: [classInstances.teacherId]`) rather than dynamically injecting strings.

**Test Requirements:**
1. **Repo Test:** Ensure valid Drizzle ORM querying yields the correct Postgres parameterization.
2. **Integration Test:** Pass a malformed date string into the GraphQL endpoint, verify it rejects it as a `ValidationError` before it ever reaches the repository layer.

---

### Threat Summary Table

| **ID** | **Threat** | **Severity** | **Fix Layer** | **Test Coverage** |
|---|---|---|---|---|
| T12-001 | IDOR on Resource Deletion | Critical | Service (Permission Check) | GraphQL + Unit |
| T12-002 | Financial Data Leak via GQL | Critical | Service (Memory Redaction) | GraphQL + Unit |
| T12-003 | Orphaned S3 Files / State Desync | High | Service (Ordered Execution) | Service Unit |
| T12-004 | SQL Injection in Reporting | Medium | Repository (Drizzle Primitives) | Repo Integration |
