import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { ValidationError } from "@/backend/lib/errors";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { RecurringClassService } from "@/backend/services/schedule/recurring-class.service";
import { DayOfWeek } from "@/shared/constants/day-of-week.enum";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { errorsEn } from "@/shared/locale/en/errors";

const tErrors = errorsEn;

const validInput = {
  studentId: "student-1",
  teacherId: "teacher-1",
  subjectId: "subject-1",
  durationMinutes: 60,
  defaultStartTime: "10:00:00",
  timezone: IanaTimezone.UTC,
  days: [{ dayOfWeek: DayOfWeek.MONDAY, startTime: "10:00:00", isActive: true }],
  locale: "en",
};

afterEach(() => {
  spyOn(PermissionsService, "hasPermission").mockRestore();
});

describe("RecurringClassService.createRecurringClass validation", () => {
  test("throws ValidationError RECURRING_CLASS_DAYS_REQUIRED when days is empty", async () => {
    spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);

    let errorCaught: Error | null = null;
    try {
      await RecurringClassService.createRecurringClass("user-1", { ...validInput, days: [] }, tErrors);
    } catch (e) {
      if (e instanceof Error) errorCaught = e;
    }

    expect(errorCaught).toBeInstanceOf(ValidationError);
    expect(errorCaught).not.toBeNull();
    if (errorCaught && "code" in errorCaught) {
      expect(errorCaught.code).toBe("RECURRING_CLASS_DAYS_REQUIRED");
    } else {
      throw new Error("Expected error to have a code property");
    }
  });

  test("throws ValidationError INVALID_DURATION when durationMinutes <= 0", async () => {
    spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);

    let errorCaught: Error | null = null;
    try {
      await RecurringClassService.createRecurringClass("user-1", { ...validInput, durationMinutes: 0 }, tErrors);
    } catch (e) {
      if (e instanceof Error) errorCaught = e;
    }

    expect(errorCaught).toBeInstanceOf(ValidationError);
    expect(errorCaught).not.toBeNull();
    if (errorCaught && "code" in errorCaught) {
      expect(errorCaught.code).toBe("INVALID_DURATION");
    } else {
      throw new Error("Expected error to have a code property");
    }
  });

  test("throws ValidationError SUBJECT_REQUIRED when subjectId is empty", async () => {
    spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);

    let errorCaught: Error | null = null;
    try {
      await RecurringClassService.createRecurringClass("user-1", { ...validInput, subjectId: "" }, tErrors);
    } catch (e) {
      if (e instanceof Error) errorCaught = e;
    }

    expect(errorCaught).toBeInstanceOf(ValidationError);
    expect(errorCaught).not.toBeNull();
    if (errorCaught && "code" in errorCaught) {
      expect(errorCaught.code).toBe("SUBJECT_REQUIRED");
    } else {
      throw new Error("Expected error to have a code property");
    }
  });
});
