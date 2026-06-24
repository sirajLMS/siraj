import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { TeacherAvailabilityRepository } from "@/backend/db/repo";
import { teacherAvailabilityWindows, teacherRecurringUnavailability } from "@/backend/db/schema";
import { DayOfWeek, Gender } from "@/shared/lib/enum";
import { createTestTeacher, createTestUser } from "../entity-setup";
import { runInRollback } from "../test-utils";

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

async function performSearchAndAssert(
  tx: DBTx,
  searchOptions: Parameters<typeof TeacherAvailabilityRepository.searchCrossStaffAvailability>[0],
  expectedTeacherName: string
) {
  const result = await TeacherAvailabilityRepository.searchCrossStaffAvailability(searchOptions, tx);
  expect(result.teachers).toHaveLength(1);
  expect(result.teachers[0].name).toBe(expectedTeacherName);
}

describe("TeacherAvailabilityRepository.searchCrossStaffAvailability", () => {
  test("throws error when fromTime >= toTime", async () => {
    await runInRollback(async tx => {
      let errorCaught = false;
      try {
        await TeacherAvailabilityRepository.searchCrossStaffAvailability({ fromTime: "17:00", toTime: "08:00" }, tx);
      } catch {
        errorCaught = true;
      }
      expect(errorCaught).toBe(true);
    });
  });

  test("returns empty result when no teachers match", async () => {
    await runInRollback(async tx => {
      const result = await TeacherAvailabilityRepository.searchCrossStaffAvailability(
        { fromTime: "08:00", toTime: "17:00" },
        tx
      );

      expect(result.teachers).toHaveLength(0);
      expect(result.totalGaps).toBe(0);
      expect(result.id).toContain("availability-search");
    });
  });

  test("returns gaps for teacher with availability windows", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Avail Teacher", email: `avail-${randomUUID()}@test.com` });
      const teacher = await createTestTeacher(tx, user.id, { status: "ACTIVATED" });

      await createAvailabilityWindow(tx, teacher.id, DayOfWeek.MONDAY, "08:00", "12:00");

      const result = await TeacherAvailabilityRepository.searchCrossStaffAvailability(
        { fromTime: "08:00", toTime: "12:00" },
        tx
      );

      expect(result.teachers).toHaveLength(1);
      expect(result.teachers[0].id).toBe(teacher.id);
      expect(result.teachers[0].name).toBe("Avail Teacher");
      expect(result.teachers[0].gaps.length).toBeGreaterThan(0);

      const mondayGaps = result.teachers[0].gaps.filter(g => g.dayOfWeek === DayOfWeek.MONDAY);
      expect(mondayGaps.length).toBeGreaterThan(0);
      expect(mondayGaps[0].gapStartTime).toBe("08:00");
      expect(mondayGaps[0].gapEndTime).toBe("12:00");
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
        { fromTime: "08:00", toTime: "17:00" },
        tx
      );

      expect(result.teachers).toHaveLength(1);
      const mondayGaps = result.teachers[0].gaps.filter(g => g.dayOfWeek === DayOfWeek.MONDAY);

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

  test("returns empty gaps when search range does not overlap windows", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Early Teacher", email: `early-${randomUUID()}@test.com` });
      const teacher = await createTestTeacher(tx, user.id, { status: "ACTIVATED" });

      await createAvailabilityWindow(tx, teacher.id, DayOfWeek.MONDAY, "06:00", "08:00");

      const result = await TeacherAvailabilityRepository.searchCrossStaffAvailability(
        { fromTime: "10:00", toTime: "17:00" },
        tx
      );

      expect(result.teachers).toHaveLength(0);
      expect(result.totalGaps).toBe(0);
    });
  });
});
