import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { AppPermission } from "@/backend/enum";
import { UnauthorizedError } from "@/backend/lib/errors";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import * as resolveViewerTimezoneModule from "@/backend/services/schedule/resolve-viewer-timezone";
import { ScheduleService } from "@/backend/services/schedule/schedule.service";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { errorsEn } from "@/shared/locale/en/errors";

const tErrors = errorsEn;

afterEach(() => {
  spyOn(PermissionsService, "hasAnyPermission").mockRestore();
  spyOn(PermissionsService, "hasPermission").mockRestore();
  spyOn(resolveViewerTimezoneModule, "resolveViewerTimezone").mockRestore();
  spyOn(SchedulingRepository, "getDailySchedule").mockRestore();
});

describe("ScheduleService.getDailySchedule authorization", () => {
  test("allows staff with schedule.view_all only", async () => {
    spyOn(PermissionsService, "hasAnyPermission").mockImplementation(async (_userId, keys) => {
      return keys.includes(AppPermission.SCHEDULE_VIEW_ALL);
    });
    spyOn(resolveViewerTimezoneModule, "resolveViewerTimezone").mockResolvedValue(IanaTimezone.UTC);
    spyOn(SchedulingRepository, "getDailySchedule").mockResolvedValue([]);

    const result = await ScheduleService.getDailySchedule("staff-user", new Date("2026-07-29"), tErrors);

    expect(result).toEqual([]);
    expect(PermissionsService.hasAnyPermission).toHaveBeenCalledWith("staff-user", [
      AppPermission.SCHEDULE_VIEW_LIST,
      AppPermission.SCHEDULE_VIEW_ALL,
    ]);
  });

  test("allows users with schedule.view_list", async () => {
    spyOn(PermissionsService, "hasAnyPermission").mockImplementation(async (_userId, keys) => {
      return keys.includes(AppPermission.SCHEDULE_VIEW_LIST);
    });
    spyOn(resolveViewerTimezoneModule, "resolveViewerTimezone").mockResolvedValue(IanaTimezone.UTC);
    spyOn(SchedulingRepository, "getDailySchedule").mockResolvedValue([]);

    const result = await ScheduleService.getDailySchedule("admin-user", new Date("2026-07-29"), tErrors);

    expect(result).toEqual([]);
  });

  test("rejects users without schedule list or view_all permissions", async () => {
    spyOn(PermissionsService, "hasAnyPermission").mockResolvedValue(false);

    let errorCaught: Error | null = null;
    try {
      await ScheduleService.getDailySchedule("restricted-user", new Date("2026-07-29"), tErrors);
    } catch (e) {
      if (e instanceof Error) errorCaught = e;
    }

    expect(errorCaught).toBeInstanceOf(UnauthorizedError);
    expect(errorCaught).not.toBeNull();
    if (errorCaught && "code" in errorCaught) {
      expect(errorCaught.code).toBe("UNAUTHORIZED");
    } else {
      throw new Error("Expected error to have a code property");
    }
  });
});

describe("ScheduleService.getAdminDashboardSchedule authorization", () => {
  test("rejects unauthorized user with UnauthorizedError and UNAUTHORIZED code", async () => {
    spyOn(PermissionsService, "hasPermission").mockResolvedValue(false);

    let errorCaught: Error | null = null;
    try {
      await ScheduleService.getAdminDashboardSchedule("restricted-user", { date: "2026-07-29" }, tErrors, "en");
    } catch (e) {
      if (e instanceof Error) errorCaught = e;
    }

    expect(errorCaught).toBeInstanceOf(UnauthorizedError);
    expect(errorCaught).not.toBeNull();
    if (errorCaught && "code" in errorCaught) {
      expect(errorCaught.code).toBe("UNAUTHORIZED");
    } else {
      throw new Error("Expected error to have a code property");
    }
  });
});
