## Section 0: Story Metadata & Context

- **Source story:** `.ai/siraj_stories/12.md` (Part 13: 00:00 - 01:56 - Permissions & Permission Groups)  
- **Security baseline:** Existing RBAC implementation via `permissions` and `permission_groups`.
- **Story scope:** Introduces resource deletion (`resources.delete`) and dynamic reporting aggregation (`report.generate_custom`, `report.view_financials`). This involves extending the resource management lifecycle to handle destructive deletions (both physical file storage and DB records) and building a new ephemeral query engine to aggregate class instances and output operational and financial data.
- **Target roles:** Admin (full access). Teachers, Students, and Parents have no access to these destructive or reporting features.
- **Status:** Planning phase - execution approved.

---

### 0.1 Business Objectives
1. **Resource Lifecycle Management:** Ensure academy storage doesn't bloat by allowing hard deletion of irrelevant learning resources. The UI provides a necessary friction point (confirmation dialog) to prevent accidental deletions.
2. **Operational Visibility:** Allow administrators to query attendance and session health across dates or teachers to maintain academy standards.
3. **Data Privacy & Payroll Security:** The `report.view_financials` permission gates highly sensitive financial data (Paid EGP / Paid USD). This segregation allows the system to scale; lower-level operational staff could theoretically be granted `report.generate_custom` to see attendance without exposing teacher payroll data.

---

### 0.2 Scope Boundaries

**In scope:**
- New migration file to add 3 new permissions to the database.
- Addition of 3 new permissions to the `AppPermission` enum.
- Backend repository methods for deleting a learning resource and querying attendance reports.
- Domain services coordinating physical storage deletion with database deletion for resources.
- Domain services applying permission-based financial gating for reports.
- GraphQL Pothos objects, queries, and mutations for reports and resource deletion.
- Frontend Apollo documents (Queries & Mutations) and Zustand stores integration.
- UI implementation: Resource delete button with MUI Dialog confirmation.
- UI implementation: Reporting interface (Container -> Form -> View) with data grids.
- i18n translations for all new UI strings, dialogs, and error messages.
- RBAC enforcement using existing `<RequirePermission>` and `PermissionsService`.

**Out of scope:**
- Modifying the existing `resources.upload` functionality (already implemented in Part 12).
- Storing/persisting generated reports in the database (reports are ephemeral query results).
- Scheduling automated report generation.
- Teacher/Parent/Student UI access (these roles are explicitly excluded from these features).

---

### 0.3 Architectural Layer Interactions
1. **Database / Migrations:** `3-system_permissions_and_groups.sql` will be augmented. `shared/lib/enum.ts` updated to match.
2. **Database / Repositories:** Drizzle ORM will execute hard deletions (ResourceRepository) and perform complex group-by aggregate functions for reporting (ReportingRepository).
3. **Services:** Centralize RBAC enforcement and storage-DB orchestration logic.
4. **GraphQL Resolvers:** Act as secure, type-safe thin wrappers exposing Service functions to the frontend.
5. **Frontend Views:** React components integrating MUI, Apollo `useMutation`/`useQuery`, and i18n dictionaries.

---

### 0.4 Risk Identification
- **Risk of Orphaned Files:** Deleting the DB record before deleting the S3/storage file could leave garbage in the cloud.
- **Risk of IDOR:** If `LearningResourceService.deleteResource(id)` does not check permissions correctly, any authenticated user might delete arbitrary files.
- **Risk of Financial Leak:** If `report.view_financials` is not explicitly and strictly masked at the Service layer, unprivileged staff might see teacher payouts by requesting those fields via GraphQL.

*(This metadata sets the stage for the deep technical implementation and security protocols defined in the subsequent sections.)*
