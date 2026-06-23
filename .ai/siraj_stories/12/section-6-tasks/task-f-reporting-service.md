### Task F — Service: Reporting Service

**Objective:** Implement the `generateAttendanceReport` method in `ReportService`. This service enforces the `report.generate_custom` permission (blocking access entirely if absent) and the `report.view_financials` permission (scrubbing/masking the financial fields from the repository results if absent).

**Dependencies:** Depends on Task E — requires `ReportRepository.generateAttendanceReport` method.

**Layer-Specific Rules (Backend Services - Flattened from backend/services/AGENTS.md):**
- **Business logic centralization** - All orchestration, validation, and permission checks reside in services, NOT repositories or resolvers.
- **🚫 Services MUST NOT import from DB/Drizzle** - Services can ONLY depend on the repository layer (`backend/db/repo/`). Importing from `drizzle-orm` or `backend/db/schema` is **strictly forbidden**.

**Target Files:**
- `backend/services/report/report.service.ts`

**Detailed Implementation Steps:**

*Step 1: Write `generateAttendanceReport` method in `ReportService`*

Create `backend/services/report/report.service.ts`.

```typescript
// backend/services/report/report.service.ts
import { ReportRepository, AttendanceReportFilters, AttendanceReportRow } from "../../db/repo/report.repository";
import { PermissionsService } from "../auth/permissions.service";
import { AppPermission } from "@/shared/lib/enum";
import { logger } from "../../lib/logger";

export namespace ReportService {
  /**
   * Orchestrates the execution of dynamic attendance reports.
   * Enforces base execution access AND conditionally masks financial data.
   * 
   * @param filters - Filtering parameters (From/To dates, Teacher ID, GroupBy).
   * @param actorUserId - The user ID generating the report.
   * @returns Array of aggregated report rows (financials scrubbed if necessary).
   */
  export const generateAttendanceReport = async (
    filters: AttendanceReportFilters,
    actorUserId: string
  ): Promise<AttendanceReportRow[]> => {
    try {
      // 1. Core Execution Permission Check
      const hasBasePermission = await PermissionsService.hasPermission(actorUserId, AppPermission.REPORT_GENERATE_CUSTOM);
      if (!hasBasePermission) {
        throw new Error("unauthorized"); 
      }

      // 2. Fetch Raw Aggregated Data
      const rawResults = await ReportRepository.generateAttendanceReport(filters);

      // 3. Financial Visibility Check
      const hasFinancialPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.REPORT_VIEW_FINANCIALS);

      // 4. Data Masking (if financial permission is missing)
      if (!hasFinancialPermission) {
        return rawResults.map(row => ({
          ...row,
          // Mask sensitive columns
          totalHours: 0,
          paidEGP: 0,
          paidUSD: 0
        }));
      }

      return rawResults;
    } catch (error) {
      logger.error(`[ReportService.generateAttendanceReport] Failed for user ${actorUserId}:`, error);
      throw error;
    }
  };
}
```

*Step 2: Note the usage pattern*
The GraphQL resolver will simply map the `AttendanceReportFilters` object from input, pass the context user ID, and let the service handle the rest.

**Test Execution Requirements:**
- **Run the database and service tests** to ensure no compilation errors. Testing of this service logic specifically will occur in Task G.

**Success Criteria / Check Progress Points:**
- [ ] `generateAttendanceReport` method is fully implemented in `ReportService`.
- [ ] Base permission (`REPORT_GENERATE_CUSTOM`) blocks unauthorized access.
- [ ] Financial permission (`REPORT_VIEW_FINANCIALS`) correctly scrubs the `totalHours`, `paidEGP`, `paidUSD` fields.
- [ ] The service contains NO imports from `drizzle-orm` or `backend/db/schema`.

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
