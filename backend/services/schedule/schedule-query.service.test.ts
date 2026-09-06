import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import type { StatusTrackingRow } from "@/backend/db/repo/scheduling/queries";
import { AppPermission, EffectiveMeetingSource } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import * as resolveViewerTimezoneModule from "@/backend/services/schedule/resolve-viewer-timezone";
import { ScheduleQueryService } from "@/backend/services/schedule/schedule-query.service";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { errorsEn } from "@/shared/locale/en/errors";

const tErrors = errorsEn;

afterEach(() => {
  spyOn(PermissionsService, "hasAnyPermission").mockRestore();
  spyOn(resolveViewerTimezoneModule, "resolveViewerTimezone").mockRestore();
  spyOn(SchedulingRepository, "getStatusTrackingRows").mockRestore();
  spyOn(EffectiveMeetingService, "resolveForClassInstances").mockRestore();
});

describe("ScheduleQueryService.getStatusTrackingSchedule", () => {
  test("throws unauthorized when user lacks permissions", async () => {
    spyOn(PermissionsService, "hasAnyPermission").mockResolvedValue(false);

    let errorCaught: Error | null = null;
    try {
      await ScheduleQueryService.getStatusTrackingSchedule("user-1", new Date(), tErrors);
    } catch (e) {
      if (e instanceof Error) errorCaught = e;
    }

    expect(errorCaught).not.toBeNull();
    expect(errorCaught?.message).toBe(tErrors.unauthorizedAction);
  });

  test("returns empty array when no rows found", async () => {
    spyOn(PermissionsService, "hasAnyPermission").mockResolvedValue(true);
    spyOn(resolveViewerTimezoneModule, "resolveViewerTimezone").mockResolvedValue(IanaTimezone.UTC);
    spyOn(SchedulingRepository, "getStatusTrackingRows").mockResolvedValue([]);

    const result = await ScheduleQueryService.getStatusTrackingSchedule("admin-1", new Date(), tErrors);

    expect(result).toEqual([]);
  });

  test("fetches status tracking schedule and enriches with batched effective meeting", async () => {
    spyOn(PermissionsService, "hasAnyPermission").mockImplementation(async (_userId, keys) => {
      return keys.includes(AppPermission.SCHEDULE_VIEW_ALL);
    });
    spyOn(resolveViewerTimezoneModule, "resolveViewerTimezone").mockResolvedValue(IanaTimezone.UTC);

    const mockRows = [
      { id: "inst-1", studentName: "Student A" } as StatusTrackingRow,
      { id: "inst-2", studentName: "Student B" } as StatusTrackingRow,
    ];
    spyOn(SchedulingRepository, "getStatusTrackingRows").mockResolvedValue(mockRows);

    const mockMeetingMap = new Map([
      [
        "inst-1",
        {
          joinUrl: "https://zoom.us/j/111",
          providerSlug: "zoom",
          providerName: { en: "Zoom", ar: "Zoom" },
          logoUrl: null,
          meetingId: "111",
          source: EffectiveMeetingSource.CLASS,
          configId: "cfg-1",
          providerId: "prov-1",
          supportsAutoGeneration: false,
        },
      ],
      [
        "inst-2",
        {
          joinUrl: null,
          providerSlug: null,
          providerName: null,
          logoUrl: null,
          meetingId: null,
          source: EffectiveMeetingSource.NONE,
          configId: null,
          providerId: null,
          supportsAutoGeneration: false,
        },
      ],
    ]);

    const batchSpy = spyOn(EffectiveMeetingService, "resolveForClassInstances").mockResolvedValue(mockMeetingMap);

    const result = await ScheduleQueryService.getStatusTrackingSchedule("admin-1", new Date("2026-08-01"), tErrors);

    expect(batchSpy).toHaveBeenCalledWith(["inst-1", "inst-2"], tErrors);
    expect(result).toHaveLength(2);
    expect(result[0].meetingJoinUrl).toBe("https://zoom.us/j/111");
    expect(result[0].effectiveMeeting?.source).toBe(EffectiveMeetingSource.CLASS);
    expect(result[1].meetingJoinUrl).toBeNull();
    expect(result[1].effectiveMeeting?.source).toBe(EffectiveMeetingSource.NONE);
  });
});
