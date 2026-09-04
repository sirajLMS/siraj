import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { classInstances } from "@/backend/db/schema";
import {
  createTestClassMeetingConfig,
  createTestMeetingConfig,
  createTestMeetingProvider,
  ensureTestSubjectId,
  setupTestEntities,
} from "@/backend/db/test/entity-setup";
import { createTestUserWithDefaults, runInRollback } from "@/backend/db/test/test-utils";
import { UserRole } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { StudentHistoryService } from "@/backend/services/history/student-history.service";
import { errorsEn } from "@/shared/locale/en/errors";

describe("StudentHistoryService", () => {
  test("getStudentClassHistory returns batch-resolved sessions correctly", async () => {
    const originalGetUserContext = PermissionsService.getUserContext;
    PermissionsService.getUserContext = async (_userId: string) => ({
      permissions: [],
      permissionGroups: [],
      isSuperAdmin: true,
      role: UserRole.SUPER_ADMIN,
    });

    try {
      let completed = false;
      await runInRollback(async tx => {
        const tErrors = errorsEn;
        const adminUser = await createTestUserWithDefaults(tx, { isSuperAdmin: true });
        const { student, teacher, teacherUser } = await setupTestEntities(tx, "hist1", { skipInstance: true });
        const provider = await createTestMeetingProvider(tx);

        // Teacher default meeting
        await createTestMeetingConfig(tx, teacherUser.id, provider.id, {
          isDefault: true,
          details: { meetingUrl: "https://zoom.us/j/teacher-default-url" },
        });

        const subjectId = await ensureTestSubjectId(tx);

        // Create 10 class instances for the student in June 2026:
        // Instance 1 will have a class-level meeting override.
        // Instances 2-10 will fall back to teacher default meeting.
        const createdIds: string[] = [];
        for (let i = 1; i <= 10; i++) {
          const dayStr = i < 10 ? `0${i}` : `${i}`;
          const [instance] = await tx
            .insert(classInstances)
            .values({
              studentId: student.id,
              teacherId: teacher.id,
              subjectId,
              scheduledStartAt: new Date(`2026-06-${dayStr}T10:00:00Z`),
              scheduledEndAt: new Date(`2026-06-${dayStr}T11:00:00Z`),
              durationMinutes: 60,
              classType: "REGULAR",
              executionState: "COMPLETED",
              outcome: "TAKEN",
              actualStartAt: new Date(`2026-06-${dayStr}T10:00:00Z`),
              actualEndAt: new Date(`2026-06-${dayStr}T11:00:00Z`),
              idempotencyKey: randomUUID(),
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          createdIds.push(instance.id);
        }

        await createTestClassMeetingConfig(tx, { classInstanceId: createdIds[0] }, provider.id, {
          isDefault: true,
          details: { meetingUrl: "https://zoom.us/j/class-override-url" },
        });

        // Call getStudentClassHistory with tx
        const history = await StudentHistoryService.getStudentClassHistory(
          adminUser.id,
          student.id,
          2026,
          6,
          tErrors,
          tx
        );

        expect(history.id).toBe(`history-${student.id}-2026-6`);
        expect(history.sessions).toHaveLength(10);

        // Check session 0 (class override)
        const session0 = history.sessions.find(s => s.id === createdIds[0])!;
        expect(session0.meetingJoinUrl).toBe("https://zoom.us/j/class-override-url");
        expect(session0.effectiveMeeting.joinUrl).toBe("https://zoom.us/j/class-override-url");

        // Check session 1 (teacher fallback)
        const session1 = history.sessions.find(s => s.id === createdIds[1])!;
        expect(session1.meetingJoinUrl).toBe("https://zoom.us/j/teacher-default-url");
        expect(session1.effectiveMeeting.joinUrl).toBe("https://zoom.us/j/teacher-default-url");

        completed = true;
      });
      expect(completed).toBe(true);
    } finally {
      PermissionsService.getUserContext = originalGetUserContext;
    }
  });
});
