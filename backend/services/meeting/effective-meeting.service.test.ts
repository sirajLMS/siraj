import { describe, expect, test } from "bun:test";
import {
  createMockClassInstance,
  createTestClassMeetingConfig,
  createTestMeetingConfig,
  createTestMeetingProvider,
  setupStudent,
  setupTeacher,
} from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { EffectiveMeetingSource } from "@/backend/enum";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import type { DBTransaction } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";
import { errorsEn } from "@/shared/locale/en/errors";

function resolutionTest(name: string, fn: (tx: DBTransaction, tErrors: ErrorsLabels) => Promise<void>) {
  test(name, async () => {
    let completed = false;
    await runInRollback(async tx => {
      const tErrors = errorsEn;
      await fn(tx, tErrors);
      completed = true;
    });
    expect(completed).toBe(true);
  });
}

describe("EffectiveMeetingService", () => {
  resolutionTest("resolveForClassInstance uses class default when present", async (tx, tErrors) => {
    const { student } = await setupStudent(tx);
    const { teacher, user: teacherUser } = await setupTeacher(tx);
    const provider = await createTestMeetingProvider(tx);
    await createTestMeetingConfig(tx, teacherUser.id, provider.id, {
      isDefault: true,
      details: { meetingUrl: "https://zoom.us/j/teacher-default" },
    });
    const instance = await createMockClassInstance(tx, student.id, teacher.id);
    await createTestClassMeetingConfig(tx, { classInstanceId: instance.id }, provider.id, {
      isDefault: true,
      details: { meetingUrl: "https://zoom.us/j/class-override" },
    });

    const resolved = await EffectiveMeetingService.resolveForClassInstance(instance.id, tErrors, tx);

    expect(resolved.source).toBe(EffectiveMeetingSource.CLASS);
    expect(resolved.joinUrl).toBe("https://zoom.us/j/class-override");
  });

  resolutionTest("resolveForClassInstance falls back to teacher default", async (tx, tErrors) => {
    const { student } = await setupStudent(tx);
    const { teacher, user: teacherUser } = await setupTeacher(tx);
    const provider = await createTestMeetingProvider(tx);
    await createTestMeetingConfig(tx, teacherUser.id, provider.id, {
      isDefault: true,
      details: { meetingUrl: "https://zoom.us/j/teacher-only" },
    });
    const instance = await createMockClassInstance(tx, student.id, teacher.id);

    const resolved = await EffectiveMeetingService.resolveForClassInstance(instance.id, tErrors, tx);

    expect(resolved.source).toBe(EffectiveMeetingSource.TEACHER);
    expect(resolved.joinUrl).toBe("https://zoom.us/j/teacher-only");
  });

  resolutionTest("resolveForNewBooking returns none when no configs exist", async (tx, tErrors) => {
    const { teacher } = await setupTeacher(tx);

    const resolved = await EffectiveMeetingService.resolveForNewBooking(teacher.id, { tErrors, tx });

    expect(resolved.source).toBe(EffectiveMeetingSource.NONE);
    expect(resolved.joinUrl).toBeNull();
  });

  resolutionTest("resolveForClassInstances batch resolves multiple instances correctly", async (tx, tErrors) => {
    const { student } = await setupStudent(tx);
    const { teacher, user: teacherUser } = await setupTeacher(tx);
    const provider = await createTestMeetingProvider(tx);

    // Set teacher default meeting
    await createTestMeetingConfig(tx, teacherUser.id, provider.id, {
      isDefault: true,
      details: { meetingUrl: "https://zoom.us/j/teacher-default" },
    });

    // Create 3 instances: instance 1 with class default override, instance 2 relying on teacher default, instance 3 relying on teacher default
    const inst1 = await createMockClassInstance(tx, student.id, teacher.id);
    const inst2 = await createMockClassInstance(tx, student.id, teacher.id);
    const inst3 = await createMockClassInstance(tx, student.id, teacher.id);

    await createTestClassMeetingConfig(tx, { classInstanceId: inst1.id }, provider.id, {
      isDefault: true,
      details: { meetingUrl: "https://zoom.us/j/class-override-1" },
    });

    const resultMap = await EffectiveMeetingService.resolveForClassInstances(
      [inst1.id, inst2.id, inst3.id],
      tErrors,
      tx
    );

    expect(resultMap.size).toBe(3);

    const res1 = resultMap.get(inst1.id)!;
    expect(res1.source).toBe(EffectiveMeetingSource.CLASS);
    expect(res1.joinUrl).toBe("https://zoom.us/j/class-override-1");

    const res2 = resultMap.get(inst2.id)!;
    expect(res2.source).toBe(EffectiveMeetingSource.TEACHER);
    expect(res2.joinUrl).toBe("https://zoom.us/j/teacher-default");

    const res3 = resultMap.get(inst3.id)!;
    expect(res3.source).toBe(EffectiveMeetingSource.TEACHER);
    expect(res3.joinUrl).toBe("https://zoom.us/j/teacher-default");
  });

  resolutionTest("resolveForClassInstances handles empty array", async (tx, tErrors) => {
    const resultMap = await EffectiveMeetingService.resolveForClassInstances([], tErrors, tx);
    expect(resultMap.size).toBe(0);
  });
});
