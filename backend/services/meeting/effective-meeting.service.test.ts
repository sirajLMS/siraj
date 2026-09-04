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

  resolutionTest("resolveForClassInstances resolves mixed sources in batch", async (tx, tErrors) => {
    const { student } = await setupStudent(tx);
    const { teacher, user: teacherUser } = await setupTeacher(tx);
    const provider = await createTestMeetingProvider(tx);

    // Teacher default config
    await createTestMeetingConfig(tx, teacherUser.id, provider.id, {
      isDefault: true,
      details: { meetingUrl: "https://zoom.us/j/teacher-default" },
    });

    // Instance 1: Class-level default
    const inst1 = await createMockClassInstance(tx, student.id, teacher.id);
    await createTestClassMeetingConfig(tx, { classInstanceId: inst1.id }, provider.id, {
      isDefault: true,
      details: { meetingUrl: "https://zoom.us/j/class-1" },
    });

    // Instance 2: Fallback to teacher default
    const inst2 = await createMockClassInstance(tx, student.id, teacher.id);

    // Instance 3: No teacher config and no class config -> NONE
    const { teacher: teacherNoConfig } = await setupTeacher(tx);
    const inst3 = await createMockClassInstance(tx, student.id, teacherNoConfig.id);

    // Empty list check
    const emptyMap = await EffectiveMeetingService.resolveForClassInstances([], tErrors, tx);
    expect(emptyMap.size).toBe(0);

    // Batch resolve inst1, inst2, inst3
    const map = await EffectiveMeetingService.resolveForClassInstances([inst1.id, inst2.id, inst3.id], tErrors, tx);

    expect(map.size).toBe(3);
    expect(map.get(inst1.id)?.source).toBe(EffectiveMeetingSource.CLASS);
    expect(map.get(inst1.id)?.joinUrl).toBe("https://zoom.us/j/class-1");

    expect(map.get(inst2.id)?.source).toBe(EffectiveMeetingSource.TEACHER);
    expect(map.get(inst2.id)?.joinUrl).toBe("https://zoom.us/j/teacher-default");

    expect(map.get(inst3.id)?.source).toBe(EffectiveMeetingSource.NONE);
    expect(map.get(inst3.id)?.joinUrl).toBeNull();
  });
});
