import { describe, expect, it, spyOn } from "bun:test";
import { StudentHistoryRepository } from "@/backend/db/repo/students/student-history.repository";
import { StudentRepository } from "@/backend/db/repo/students";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import { StudentHistoryService } from "@/backend/services/history/student-history.service";
import { EffectiveMeetingSource } from "@/backend/enum";
import type { ErrorsLabels } from "@/shared/locale";

const tErrors = {
  notFound: "Not found",
  unauthorizedAction: "Unauthorized action",
  studentNotFound: (id: string) => `Student ${id} not found`,
} as unknown as ErrorsLabels;

describe("StudentHistoryService performance & functionality", () => {
  it("getStudentClassHistory resolves meeting info correctly and efficiently for multiple sessions", async () => {
    const userId = "user-admin-1";
    const studentId = "student-1";
    const year = 2026;
    const month = 5;

    // Mock PermissionsService
    spyOn(PermissionsService, "getUserContext").mockResolvedValue({
      userId,
      isSuperAdmin: true,
      roles: [],
      permissions: [],
    } as unknown as Awaited<ReturnType<typeof PermissionsService.getUserContext>>);

    // Mock StudentHistoryRepository
    spyOn(StudentHistoryRepository, "getMonthlyMetrics").mockResolvedValue({
      totalSessions: 50,
      completedSessions: 45,
      cancelledSessions: 5,
      attendanceRate: 90,
      averageRating: 4.8,
    } as unknown as Awaited<ReturnType<typeof StudentHistoryRepository.getMonthlyMetrics>>);

    const sessionCount = 50;
    const mockSessions = Array.from({ length: sessionCount }, (_, i) => ({
      id: `session-${i + 1}`,
      studentId,
      teacherId: "teacher-1",
      scheduledStartAt: new Date(),
      scheduledEndAt: new Date(),
      status: "COMPLETED",
      outcome: "ATTENDED",
      teacherName: `Teacher ${i + 1}`,
    }));

    spyOn(StudentHistoryRepository, "getMonthlyCalendar").mockResolvedValue(
      mockSessions as unknown as Awaited<ReturnType<typeof StudentHistoryRepository.getMonthlyCalendar>>
    );

    // Mock StudentRepository
    spyOn(StudentRepository, "findById").mockResolvedValue({
      id: studentId,
      name: "John Student",
    } as unknown as Awaited<ReturnType<typeof StudentRepository.findById>>);

    // Spy on EffectiveMeetingService
    let singleCallsCount = 0;
    let batchCallsCount = 0;

    spyOn(EffectiveMeetingService, "resolveForClassInstance").mockImplementation(async (id: string) => {
      singleCallsCount++;
      return {
        joinUrl: `https://meeting.example.com/${id}`,
        providerSlug: "zoom",
        providerName: "Zoom",
        logoUrl: null,
        meetingId: id,
        source: EffectiveMeetingSource.CLASS,
        configId: `config-${id}`,
        providerId: "provider-1",
        supportsAutoGeneration: false,
      };
    });

    spyOn(EffectiveMeetingService, "resolveForClassInstances").mockImplementation(async (ids: readonly string[]) => {
      batchCallsCount++;
      const map = new Map();
      for (const id of ids) {
        map.set(id, {
          joinUrl: `https://meeting.example.com/${id}`,
          providerSlug: "zoom",
          providerName: "Zoom",
          logoUrl: null,
          meetingId: id,
          source: EffectiveMeetingSource.CLASS,
          configId: `config-${id}`,
          providerId: "provider-1",
          supportsAutoGeneration: false,
        });
      }
      return map;
    });

    const start = performance.now();
    const result = await StudentHistoryService.getStudentClassHistory(userId, studentId, year, month, tErrors);
    const durationMs = performance.now() - start;

    expect(result.id).toBe(`history-${studentId}-${year}-${month}`);
    expect(result.studentName).toBe("John Student");
    expect(result.sessions).toHaveLength(sessionCount);
    expect(result.sessions[0].meetingJoinUrl).toBe("https://meeting.example.com/session-1");
    expect(result.sessions[49].meetingJoinUrl).toBe("https://meeting.example.com/session-50");

    expect(singleCallsCount).toBe(0);
    expect(batchCallsCount).toBe(1);
    expect(durationMs).toBeGreaterThanOrEqual(0);
  });
});
