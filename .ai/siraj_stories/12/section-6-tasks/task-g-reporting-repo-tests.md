### Task G — Testing: Reporting Repository & Service

**Objective:** Write unit tests for the Reporting Repository and Service to verify correct data aggregation and strict permission enforcement.

**Dependencies:** Depends on Task F — requires `ReportService.generateAttendanceReport` and `ReportRepository.generateAttendanceReport`.

**Layer-Specific Rules (Testing Requirements - Flattened from section-1-core-principles.md):**
- **100% line + function coverage** on all new/modified repository methods.
- **Success AND failure paths** — Every repo method must have tests for valid input success, invalid input rejection.
- **Authorized success + unauthorized denial** at the service level logic, particularly the financial masking.

**Target Files:**
- `backend/db/test/repo/report.repository.test.ts`
- `backend/services/report/test/report.service.test.ts`

**Detailed Implementation Steps:**

*Step 1: Write Repository Tests*

Create `backend/db/test/repo/report.repository.test.ts`. Create a suite for `generateAttendanceReport`.

```typescript
// backend/db/test/repo/report.repository.test.ts
import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { ReportRepository, ReportGroupingMode } from "../../../repo/report.repository";
import { db } from "../../../index";
// ... setup helpers for creating dummy teachers, schedules, and class instances ...

describe("ReportRepository", () => {
  describe("generateAttendanceReport()", () => {
    test("aggregates successfully grouped by DATE", async () => {
      // 1. Arrange - Seed dummy classes for specific dates
      
      // 2. Act
      // const filters = { fromDate: ..., toDate: ..., groupBy: ReportGroupingMode.DATE };
      // const results = await ReportRepository.generateAttendanceReport(filters);

      // 3. Assert
      // expect(results).toBeArray();
      // Verify taken/absent/leave counts match the seed data.
      // Verify totalHours, paidEGP, paidUSD are correctly summed.
    });

    test("aggregates successfully grouped by TEACHER", async () => {
      // 1. Arrange - Seed dummy classes for specific teachers
      
      // 2. Act
      // const filters = { fromDate: ..., toDate: ..., groupBy: ReportGroupingMode.TEACHER };
      // const results = await ReportRepository.generateAttendanceReport(filters);

      // 3. Assert
      // Verify groupLabel matches the teacher's name.
    });
  });
});
```

*Step 2: Write Service Tests*

Create `backend/services/report/test/report.service.test.ts`.

```typescript
// backend/services/report/test/report.service.test.ts
import { expect, test, describe, spyOn } from "bun:test";
import { ReportService } from "../report.service";
import { PermissionsService } from "../../auth/permissions.service";
import { ReportRepository, ReportGroupingMode } from "../../../db/repo/report.repository";

describe("ReportService.generateAttendanceReport()", () => {
  const dummyFilters = { fromDate: new Date(), toDate: new Date(), groupBy: ReportGroupingMode.DATE };
  const mockRepoResults = [{
    groupKey: "2024-05-01", groupLabel: "2024-05-01",
    takenClasses: 5, absentClasses: 1, leaveClasses: 0, pendingClasses: 0,
    totalHours: 5.5, paidEGP: 500, paidUSD: 0
  }];

  test("throws unauthorized if missing REPORT_GENERATE_CUSTOM", async () => {
    const hasPermSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(false);
    
    expect(ReportService.generateAttendanceReport(dummyFilters, "user-1")).rejects.toThrow("unauthorized");
    
    hasPermSpy.mockRestore();
  });

  test("masks financial data if missing REPORT_VIEW_FINANCIALS", async () => {
    const hasPermSpy = spyOn(PermissionsService, "hasPermission").mockImplementation(async (userId, perm) => {
      if (perm === "report.generate_custom") return true;
      if (perm === "report.view_financials") return false;
      return false;
    });
    
    const repoSpy = spyOn(ReportRepository, "generateAttendanceReport").mockResolvedValue(mockRepoResults);

    const result = await ReportService.generateAttendanceReport(dummyFilters, "user-1");

    expect(result[0].takenClasses).toBe(5); // Operational data intact
    expect(result[0].totalHours).toBe(0); // Financial data masked
    expect(result[0].paidEGP).toBe(0);
    expect(result[0].paidUSD).toBe(0);

    hasPermSpy.mockRestore();
    repoSpy.mockRestore();
  });

  test("returns full data if all permissions present", async () => {
    const hasPermSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const repoSpy = spyOn(ReportRepository, "generateAttendanceReport").mockResolvedValue(mockRepoResults);

    const result = await ReportService.generateAttendanceReport(dummyFilters, "user-1");

    expect(result[0].paidEGP).toBe(500); // Financial data present

    hasPermSpy.mockRestore();
    repoSpy.mockRestore();
  });
});
```

**Test Execution Requirements:**
- **Run the coverage verification:**
  ```bash
  bun run test:coverage backend/db/test/repo/report.repository.test.ts
  bun test backend/services/report/test/report.service.test.ts
  ```

**Success Criteria / Check Progress Points:**
- [ ] Line coverage for `generateAttendanceReport` method in repo is 100%.
- [ ] Service logic is verified to securely mask financial fields based on permissions.

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
