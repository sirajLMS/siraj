## Section 4: Security Threat Remediation

### Threat 1: IDOR on Resource Deletion
**Risk:** User A could theoretically attempt to delete User B's resources by manipulating the `resourceId` parameter in the GraphQL mutation.
**Mitigation:** The service method `LearningResourceService.deleteResource(resourceId, actorUserId)` verifies if the actor has the `resources.delete` permission (Admin bypass). If not, the system will verify the resource exists. As the story does not specify self-scoped deletion for teachers, any call to this mutation without `resources.delete` will be rejected outright at the permission level before any database fetch.
**Test Requirements:**
- Admin with `resources.delete` can successfully delete a resource.
- User without `resources.delete` calling mutation throws `unauthorized` error.

### Threat 2: Financial Data Leakage (Payroll Fraud)
**Risk:** Users without `report.view_financials` (like lower-level scheduling managers) could access financial columns via direct GraphQL query manipulation of the reporting endpoint.
**Mitigation:** The resolver propagates `ctx` to `ReportService.generateAttendanceReport()`. The service checks `PermissionsService.hasPermission(ctx.userId, "report.view_financials")`. If this evaluates to false, the financial properties (`hours`, `paidEGP`, `paidUSD`) are strictly returned as `null` or `0`, regardless of the GraphQL selection set requested by the client.
**Test Requirements:**
- Admin with `report.view_financials` gets actual values for EGP/USD.
- Admin with ONLY `report.generate_custom` (but NOT `view_financials`) receives `null` for financial fields.
- User without `report.generate_custom` is completely blocked.

### Threat 3: Destructive Action Without Confirmation (Orphaned Files)
**Risk:** Accidental resource deletion due to a misclick causing data loss. Moreover, if the database record is deleted but the storage is down, the physical file is orphaned.
**Mitigation:** 
- **Frontend:** Implement an explicit MUI Dialog confirmation prompt requiring user confirmation to proceed.
- **Backend:** The `LearningResourceService.deleteResource()` method must call `StorageService.deleteFile(filePath)` or the equivalent storage repository method BEFORE the database record is deleted or within a coordinated block to ensure no orphaned files. If the physical storage deletion fails, an error is thrown, aborting the database deletion.
**Test Requirements:**
- Simulate a storage deletion failure and ensure the database record remains intact (mocked storage service failure).

### Threat 4: SQL Injection in Report Queries
**Risk:** User-provided `fromDate`, `toDate`, and `teacherId` parameters might be maliciously crafted to perform SQL injection attacks against the query engine.
**Mitigation:** The `ReportRepository.generateAttendanceReport()` method MUST use strictly typed Drizzle ORM primitives (`eq`, `gte`, `lte`, `and`). No raw `sql\`\`` blocks incorporating raw string parameters. Date bounds must be validated to be valid ISO date strings before processing.
**Test Requirements:**
- Ensure valid filtering works via Drizzle ORM.
- Provide malformed strings or SQL snippets as dates/IDs and verify the input validation catches them or Drizzle escapes them successfully.
