## Section 2: RBAC Permissions (Canonical)

### 2.1 New Permissions

| **Permission Key** | **Group** | **UI Gate** | **Backend Service Method** | **GraphQL Mutation/Query** |
|---|---|---|---|---|
| `resources.delete` | Academy Admin | Resource Delete Button | `LearningResourceService.deleteResource()` | `deleteLearningResource` (Mutation) |
| `report.generate_custom` | Academy Admin | Report Form & Data Grid | `ReportService.generateAttendanceReport()` | `generateAttendanceReport` (Query) |
| `report.view_financials` | Academy Admin | Financial Columns in Report | `ReportService.generateAttendanceReport()` (Conditionally computed fields) | Fields within `generateAttendanceReport` (Query) |

### 2.2 Permission Mapping to Existing Permissions

| **Story Permission** | **Existing Related Permission** | **Relationship** |
|---|---|---|
| `resources.delete` | `resources.upload` | Complementary — existing handles creation, new handles hard deletion. |
| `report.generate_custom` | `dashboard.view_metrics` | Complementary — reports are on-demand dynamic aggregated queries vs static dashboard metrics. |
| `report.view_financials` | `report.generate_custom` | Granular — explicitly gates whether sensitive payroll columns (Paid EGP/USD) are populated in the generated custom report. |

### 2.3 Permission Group Assignments

| **Permission Group** | **Slug** | **New Permissions Assigned** |
|---|---|---|
| Academy Admin | `academy_admin` | `resources.delete`, `report.generate_custom`, `report.view_financials` |
| Teacher | `teacher_default` | *None assigned* |
| Parent | `parent_default` | *None assigned* |
| Student | `student_default` | *None assigned* |

### 2.4 Field-Level Gating via Permissions
The `report.view_financials` permission utilizes field-level calculation gating:
- **Lower role (no `report.view_financials`):** The service layer executes the aggregation but returns `null` or zeroes for the financial fields (`hours`, `paidEGP`, `paidUSD`).
- **Academy Admin (with `report.view_financials`):** The service layer executes the aggregation AND computes the financial values using the rates defined for each teacher, returning the populated figures to the UI.

This ensures the exact same GraphQL Query (`generateAttendanceReport`) can be reused without needing separate reporting endpoints or data structures, with security strictly enforced at the service level.
