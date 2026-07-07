import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { TeacherAvailabilityRepository } from "@/backend/db/repo";
import { teacherAvailabilityWindows, teacherRecurringUnavailability } from "@/backend/db/schema";
import type { CrossStaffSearchInput } from "@/backend/types";
import { AvailabilitySearchSortBy, DayOfWeek, Gender, VacationRequestStatus } from "@/shared/lib/enum";
import { createMockClassInstance, createTestTeacher, createTestUser, setupStudent } from "../entity-setup";
import { runInRollback } from "../test-utils";

const TEST_MONDAY_RANGE = {
  fromDate: "2026-01-05",
  toDate: "2026-01-11",
};

function withMondayRange(input: CrossStaffSearchInput): CrossStaffSearchInput {
  return {
    ...input,
    fromDate: input.fromDate ?? TEST_MONDAY_RANGE.fromDate,
    toDate: input.toDate ?? TEST_MONDAY_RANGE.toDate,
  };
}

async function createAvailabilityWindow(
  tx: Parameters<typeof runInRollback>[0] extends (tx: infer T) => unknown ? T : never,
  teacherId: string,
  dayOfWeek: DayOfWeek,
  startTime: string,
  endTime: string
) {
  const now = new Date();
  const [window] = await tx
    .insert(teacherAvailabilityWindows)
    .values({
      teacherId,
      dayOfWeek,
      startTime,
      endTime,
      timezone: "UTC",
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return window;
}

async function createRecurringUnavailability(
  tx: Parameters<typeof runInRollback>[0] extends (tx: infer T) => unknown ? T : never,
  teacherId: string,
  dayOfWeek: DayOfWeek,
  startTime: string,
  endTime: string
) {
  const now = new Date();
  const [unavail] = await tx
    .insert(teacherRecurringUnavailability)
    .values({
      teacherId,
      dayOfWeek,
      startTime,
      endTime,
      timezone: "UTC",
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return unavail;
}

type DBTx = Parameters<typeof runInRollback>[0] extends (tx: infer T) => unknown ? T : never;

async function setupTwoTestTeachers(
  tx: DBTx,
  options: {
    teacher1Name: string;
    teacher1Status: "ACTIVATED" | "DEACTIVATED";
    teacher1Gender?: "MALE" | "FEMALE";
    teacher2Name: string;
    teacher2Status: "ACTIVATED" | "DEACTIVATED";
    teacher2Gender?: "MALE" | "FEMALE";
    fromTime?: string;
    toTime?: string;
  }
) {
  const user1 = await createTestUser(tx, { name: options.teacher1Name, email: `t1-${randomUUID()}@test.com` });
  const teacher1 = await createTestTeacher(tx, user1.id, {
    status: options.teacher1Status,
    gender: options.teacher1Gender,
  });

  const user2 = await createTestUser(tx, { name: options.teacher2Name, email: `t2-${randomUUID()}@test.com` });
  const teacher2 = await createTestTeacher(tx, user2.id, {
    status: options.teacher2Status,
    gender: options.teacher2Gender,
  });

  const from = options.fromTime ?? "08:00";
  const to = options.toTime ?? "12:00";

  await createAvailabilityWindow(tx, teacher1.id, DayOfWeek.MONDAY, from, to);
  await createAvailabilityWindow(tx, teacher2.id, DayOfWeek.MONDAY, from, to);

  return { teacher1, teacher2 };
}

async function performSearchAndAssert(tx: DBTx, searchOptions: CrossStaffSearchInput, expectedTeacherName: string) {
  const result = await TeacherAvailabilityRepository.searchCrossStaffAvailability(withMondayRange(searchOptions), tx);
  const matched = result.teachers.find(t => t.name === expectedTeacherName);
  expect(matched).toBeDefined();
  expect(matched?.gaps.length).toBeGreaterThan(0);
}

describe("TeacherAvailabilityRepository.searchCrossStaffAvailability", () => {
  test("throws error when fromTime >= toTime", async () => {
    await runInRollback(async tx => {
      let errorCaught = false;
      try {
        await TeacherAvailabilityRepository.searchCrossStaffAvailability(
          withMondayRange({ fromTime: "17:00", toTime: "08:00" }),
          tx
        );
      } catch {
        errorCaught = true;
      }
      expect(errorCaught).toBe(true);
    });
  });

  test("returns result structure when querying availability", async () => {
    await runInRollback(async tx => {
      const result = await TeacherAvailabilityRepository.searchCrossStaffAvailability(
        withMondayRange({ fromTime: "08:00", toTime: "17:00" }),
        tx
      );

      expect(result.id).toContain("availability-search");
      expect(Array.isArray(result.teachers)).toBe(true);
      expect(typeof result.totalGaps).toBe("number");
      expect(typeof result.totalCount).toBe("number");
      expect(result.pageInfo).not.toBeNull();
    });
  });

  test("returns gaps for teacher with availability windows", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Avail Teacher", email: `avail-${randomUUID()}@test.com` });
      const teacher = await createTestTeacher(tx, user.id, { status: "ACTIVATED" });

      await createAvailabilityWindow(tx, teacher.id, DayOfWeek.MONDAY, "08:00", "12:00");

      const result = await TeacherAvailabilityRepository.searchCrossStaffAvailability(
        withMondayRange({ fromTime: "08:00", toTime: "12:00" }),
        tx
      );

      const matched = result.teachers.find(t => t.id === teacher.id);
      expect(matched).toBeDefined();
      expect(matched?.name).toBe("Avail Teacher");
      expect(matched?.gaps.length).toBeGreaterThan(0);
      expect(matched?.availableDaysCount).toBeGreaterThan(0);

      const mondayGaps = matched?.gaps.filter(g => g.dayOfWeek === DayOfWeek.MONDAY) ?? [];
      expect(mondayGaps.length).toBeGreaterThan(0);
      expect(mondayGaps[0].calendarDate).toBe("2026-01-05");
      expect(mondayGaps[0].gapStartTime).toBe("08:00");
      expect(mondayGaps[0].gapEndTime).toBe("12:00");
    });
  });

  test("scopes results to the selected date range", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Range Teacher", email: `range-${randomUUID()}@test.com` });
      const teacher = await createTestTeacher(tx, user.id, { status: "ACTIVATED" });

      await createAvailabilityWindow(tx, teacher.id, DayOfWeek.MONDAY, "08:00", "12:00");
      await createAvailabilityWindow(tx, teacher.id, DayOfWeek.TUESDAY, "08:00", "12:00");

      const mondayOnly = await TeacherAvailabilityRepository.searchCrossStaffAvailability(
        {
          fromTime: "08:00",
          toTime: "12:00",
          fromDate: "2026-01-05",
          toDate: "2026-01-05",
        },
        tx
      );

      const matched = mondayOnly.teachers.find(t => t.id === teacher.id);
      expect(matched?.gaps.every(gap => gap.calendarDate === "2026-01-05")).toBe(true);
    });
  });

  test("filters teachers by gender", async () => {
    await runInRollback(async tx => {
      await setupTwoTestTeachers(tx, {
        teacher1Name: "Male Teacher",
        teacher1Status: "ACTIVATED",
        teacher1Gender: "MALE",
        teacher2Name: "Female Teacher",
        teacher2Status: "ACTIVATED",
        teacher2Gender: "FEMALE",
      });

      await performSearchAndAssert(tx, { fromTime: "08:00", toTime: "12:00", gender: Gender.MALE }, "Male Teacher");
    });
  });

  test("subtracts recurring unavailability from gaps", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Blocked Teacher", email: `blocked-${randomUUID()}@test.com` });
      const teacher = await createTestTeacher(tx, user.id, { status: "ACTIVATED" });

      await createAvailabilityWindow(tx, teacher.id, DayOfWeek.MONDAY, "08:00", "17:00");
      await createRecurringUnavailability(tx, teacher.id, DayOfWeek.MONDAY, "12:00", "13:00");

      const result = await TeacherAvailabilityRepository.searchCrossStaffAvailability(
        withMondayRange({ fromTime: "08:00", toTime: "17:00" }),
        tx
      );

      const matched = result.teachers.find(t => t.id === teacher.id);
      expect(matched).toBeDefined();
      const mondayGaps = matched?.gaps.filter(g => g.calendarDate === "2026-01-05") ?? [];

      expect(mondayGaps).toHaveLength(2);
      expect(mondayGaps[0].gapStartTime).toBe("08:00");
      expect(mondayGaps[0].gapEndTime).toBe("12:00");
      expect(mondayGaps[1].gapStartTime).toBe("13:00");
      expect(mondayGaps[1].gapEndTime).toBe("17:00");
    });
  });

  test("excludes deactivated teachers", async () => {
    await runInRollback(async tx => {
      await setupTwoTestTeachers(tx, {
        teacher1Name: "Active Teacher",
        teacher1Status: "ACTIVATED",
        teacher2Name: "Inactive Teacher",
        teacher2Status: "DEACTIVATED",
        fromTime: "09:00",
        toTime: "11:00",
      });

      await performSearchAndAssert(tx, { fromTime: "09:00", toTime: "11:00" }, "Active Teacher");
    });
  });

  test("returns no gaps for teacher when search range does not overlap windows", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Early Teacher", email: `early-${randomUUID()}@test.com` });
      const teacher = await createTestTeacher(tx, user.id, { status: "ACTIVATED" });

      await createAvailabilityWindow(tx, teacher.id, DayOfWeek.MONDAY, "06:00", "08:00");

      const result = await TeacherAvailabilityRepository.searchCrossStaffAvailability(
        withMondayRange({ fromTime: "10:00", toTime: "17:00" }),
        tx
      );

      const matched = result.teachers.find(t => t.id === teacher.id);
      expect(matched).toBeUndefined();
    });
  });

  test("excludes gaps blocked by approved vacation", async () => {
    await runInRollback(async tx => {
      const adminUser = await createTestUser(tx, { name: "Admin", email: `admin-${randomUUID()}@test.com` });
      const user = await createTestUser(tx, { name: "Vacation Teacher", email: `vac-${randomUUID()}@test.com` });
      const teacher = await createTestTeacher(tx, user.id, { status: "ACTIVATED" });

      await createAvailabilityWindow(tx, teacher.id, DayOfWeek.MONDAY, "08:00", "17:00");

      const vacation = await TeacherAvailabilityRepository.submitVacationRequest(
        {
          startAt: new Date("2026-01-05T00:00:00.000Z"),
          endAt: new Date("2026-01-05T23:59:59.999Z"),
          timezone: "UTC",
        },
        user.id,
        teacher.id,
        tx
      );

      const approvedVacation = await TeacherAvailabilityRepository.approveVacationRequest(
        { vacationRequestId: vacation.id },
        adminUser.id,
        tx
      );

      const result = await TeacherAvailabilityRepository.searchCrossStaffAvailability(
        withMondayRange({ fromTime: "08:00", toTime: "17:00" }),
        tx
      );

      const matched = result.teachers.find(t => t.id === teacher.id);
      expect(matched).toBeUndefined();
      expect(approvedVacation.status).toBe(VacationRequestStatus.APPROVED);
    });
  });

  test("excludes gaps blocked by booked class instances", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Booked Teacher", email: `booked-${randomUUID()}@test.com` });
      const teacher = await createTestTeacher(tx, user.id, { status: "ACTIVATED" });
      const { student } = await setupStudent(tx, { name: "Parent", email: `parent-${randomUUID()}@test.com` }, {}, {});

      await createAvailabilityWindow(tx, teacher.id, DayOfWeek.MONDAY, "08:00", "17:00");
      await createMockClassInstance(tx, student.id, teacher.id, {
        scheduledStartAt: new Date("2026-01-05T10:00:00.000Z"),
        scheduledEndAt: new Date("2026-01-05T11:00:00.000Z"),
      });

      const result = await TeacherAvailabilityRepository.searchCrossStaffAvailability(
        withMondayRange({ fromTime: "08:00", toTime: "17:00" }),
        tx
      );

      const matched = result.teachers.find(t => t.id === teacher.id);
      const mondayGaps = matched?.gaps.filter(gap => gap.calendarDate === "2026-01-05") ?? [];

      expect(mondayGaps).toHaveLength(2);
      expect(mondayGaps[0].gapEndTime).toBe("10:00");
      expect(mondayGaps[1].gapStartTime).toBe("11:00");
    });
  });

  test("filters by minimum available days and total gaps", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Threshold Teacher", email: `thresh-${randomUUID()}@test.com` });
      const teacher = await createTestTeacher(tx, user.id, { status: "ACTIVATED" });

      await createAvailabilityWindow(tx, teacher.id, DayOfWeek.MONDAY, "08:00", "12:00");

      const tooStrict = await TeacherAvailabilityRepository.searchCrossStaffAvailability(
        withMondayRange({
          fromTime: "08:00",
          toTime: "12:00",
          minAvailableDays: 2,
          minTotalGaps: 2,
        }),
        tx
      );

      expect(tooStrict.teachers.find(t => t.id === teacher.id)).toBeUndefined();

      const passes = await TeacherAvailabilityRepository.searchCrossStaffAvailability(
        withMondayRange({
          fromTime: "08:00",
          toTime: "12:00",
          minAvailableDays: 1,
          minTotalGaps: 1,
        }),
        tx
      );

      expect(passes.teachers.find(t => t.id === teacher.id)).toBeDefined();
    });
  });

  test("sorts and paginates teachers", async () => {
    await runInRollback(async tx => {
      await setupTwoTestTeachers(tx, {
        teacher1Name: "Alpha Teacher",
        teacher1Status: "ACTIVATED",
        teacher2Name: "Zulu Teacher",
        teacher2Status: "ACTIVATED",
      });

      const sorted = await TeacherAvailabilityRepository.searchCrossStaffAvailability(
        withMondayRange({
          fromTime: "08:00",
          toTime: "12:00",
          sortBy: AvailabilitySearchSortBy.NAME_DESC,
          paginationArgs: { first: 1, page: 1, skip: null, after: null, before: null, last: null, maxCount: null },
        }),
        tx
      );

      expect(sorted.teachers).toHaveLength(1);
      expect(sorted.teachers[0]?.name).toBe("Zulu Teacher");
      expect(sorted.totalCount).toBeGreaterThanOrEqual(2);
      expect(sorted.pageInfo?.perPage).toBe(1);
    });
  });
});
