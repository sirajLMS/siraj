### Task E — Repository: Reporting Queries

**Objective:** Implement dynamic reporting aggregation queries. The `ReportRepository` will fetch and aggregate `classInstances` data based on `fromDate`, `toDate`, and optionally `teacherId`, supporting multiple grouping modes ("DATE" vs "TEACHER"). EGP/USD payroll amounts are calculated securely inside the query execution.

**Dependencies:** Depends on current project state (`classInstances`, `teachers`, `timezones` tables).

**Layer-Specific Rules (Database Repositories - Flattened from backend/db/repo/AGENTS.md):**
- Use Drizzle standard syntax `db.select().from(<table>).leftJoin()`.
- Avoid string concatenation for SQL logic; utilize Drizzle primitives (`sql\`\`` securely with bound parameters) to aggregate SUMs and GROUP BY fields.

**Target Files:**
- `backend/db/repo/report.repository.ts`

**Detailed Implementation Steps:**

*Step 1: Create `ReportRepository`*

Create `backend/db/repo/report.repository.ts`. Define input types and return types.

```typescript
// backend/db/repo/report.repository.ts
import { db } from "../index";
import { classInstances } from "../schema/scheduling";
import { teachers, staffProfiles } from "../schema/staff";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { logger } from "../../lib/logger";

export enum ReportGroupingMode {
  DATE = "DATE",
  TEACHER = "TEACHER",
}

export interface AttendanceReportFilters {
  fromDate: Date;
  toDate: Date;
  teacherId?: string;
  groupBy: ReportGroupingMode;
}

export interface AttendanceReportRow {
  groupKey: string;     // E.g., '2024-05-01' or 'teacher-uuid'
  groupLabel: string;   // E.g., 'May 1, 2024' or 'John Doe'
  takenClasses: number;
  absentClasses: number;
  leaveClasses: number;
  pendingClasses: number;
  totalHours: number;
  paidEGP: number;
  paidUSD: number;
}

export namespace ReportRepository {
  /**
   * Generates aggregated attendance and financial reporting data.
   * Note: Security and field masking occurs at the Service layer.
   */
  export const generateAttendanceReport = async (filters: AttendanceReportFilters): Promise<AttendanceReportRow[]> => {
    try {
      const conditions = [
        gte(classInstances.scheduledStartAt, filters.fromDate),
        lte(classInstances.scheduledStartAt, filters.toDate)
      ];

      if (filters.teacherId) {
        conditions.push(eq(classInstances.teacherId, filters.teacherId));
      }

      // We group either by Date (trunc to day) or by Teacher ID.
      const groupKeyExpr = filters.groupBy === ReportGroupingMode.DATE
        ? sql<string>`DATE_TRUNC('day', ${classInstances.scheduledStartAt})`
        : classInstances.teacherId;

      // Group Label Expr requires joining the teacher table if grouping by Teacher
      const groupLabelExpr = filters.groupBy === ReportGroupingMode.DATE
        ? sql<string>`TO_CHAR(${classInstances.scheduledStartAt}, 'YYYY-MM-DD')`
        : sql<string>`MAX(${staffProfiles.firstName} || ' ' || ${staffProfiles.lastName})`; // Needs leftJoin on staffProfiles/users

      // This is an advanced Drizzle aggregation query
      // Due to complexity, raw SQL wrapped in Drizzle might be more efficient for the aggregations:
      
      const query = db.select({
        groupKey: sql<string>`${groupKeyExpr}::text`,
        groupLabel: sql<string>`COALESCE(${groupLabelExpr}, ${groupKeyExpr}::text)`,
        takenClasses: sql<number>`SUM(CASE WHEN ${classInstances.outcome} = 'TAKEN' THEN 1 ELSE 0 END)::int`,
        absentClasses: sql<number>`SUM(CASE WHEN ${classInstances.outcome} = 'ABSENT' THEN 1 ELSE 0 END)::int`,
        leaveClasses: sql<number>`SUM(CASE WHEN ${classInstances.outcome} = 'LEAVE' THEN 1 ELSE 0 END)::int`,
        pendingClasses: sql<number>`SUM(CASE WHEN ${classInstances.outcome} = 'PENDING' THEN 1 ELSE 0 END)::int`,
        totalHours: sql<number>`SUM(${classInstances.durationMinutes}::float / 60.0)::float`,
        paidEGP: sql<number>`SUM(CASE WHEN ${classInstances.rateCurrency} = 'EGP' THEN ${classInstances.rateAmount} ELSE 0 END)::float`,
        paidUSD: sql<number>`SUM(CASE WHEN ${classInstances.rateCurrency} = 'USD' THEN ${classInstances.rateAmount} ELSE 0 END)::float`
      })
      .from(classInstances);

      if (filters.groupBy === ReportGroupingMode.TEACHER) {
        // Assume staffProfiles linked via users/teachers
        // (Simplified for task illustration - must match real schema)
        // query.leftJoin(teachers, eq(teachers.id, classInstances.teacherId))
        //      .leftJoin(staffProfiles, eq(staffProfiles.id, teachers.staffProfileId));
      }

      const results = await query.where(and(...conditions)).groupBy(groupKeyExpr);
      
      return results;
    } catch (error) {
      logger.error("Error generating attendance report:", error);
      throw error;
    }
  };
}
```
*Note: Make sure the joins for `ReportGroupingMode.TEACHER` accurately target the existing schema (e.g. `users` or `staffProfiles`) to get the `groupLabel` (teacher's name).*

**Test Execution Requirements:**
- **Run the whole test suite:** Run `bun run test:db` to ensure compilation success.
  ```bash
  bun run test:db
  ```

**Success Criteria / Check Progress Points:**
- [ ] `generateAttendanceReport` method is fully implemented using Drizzle queries.
- [ ] Both `DATE` and `TEACHER` grouping modes are supported via dynamic grouping expressions.
- [ ] The aggregations successfully capture status counts and financial rates securely.
- [ ] No compilation errors when compiling the database repository.

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
