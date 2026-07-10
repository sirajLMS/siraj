import { describe, expect, test } from "bun:test";
import type { DBTransaction } from "@/backend/db/db.types";
import {
  createMockClassInstance,
  createTestClassMeetingConfig,
  createTestMeetingConfig,
  createTestMeetingProvider,
  setupStudent,
  setupTeacher,
} from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";

function resolutionTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    let completed = false;
    await runInRollback(async tx => {
      await fn(tx);
      completed = true;
    });
    expect(completed).toBe(true);
  });
}

describe("EffectiveMeetingService", () => {
  resolutionTest("resolveForClassInstance uses class default when present", async tx => {
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

    const resolved = await EffectiveMeetingService.resolveForClassInstance(instance.id, tx);

    expect(resolved.source).toBe("class");
    expect(resolved.joinUrl).toBe("https://zoom.us/j/class-override");
  });

  resolutionTest("resolveForClassInstance falls back to teacher default", async tx => {
    const { student } = await setupStudent(tx);
    const { teacher, user: teacherUser } = await setupTeacher(tx);
    const provider = await createTestMeetingProvider(tx);
    await createTestMeetingConfig(tx, teacherUser.id, provider.id, {
      isDefault: true,
      details: { meetingUrl: "https://zoom.us/j/teacher-only" },
    });
    const instance = await createMockClassInstance(tx, student.id, teacher.id);

    const resolved = await EffectiveMeetingService.resolveForClassInstance(instance.id, tx);

    expect(resolved.source).toBe("teacher");
    expect(resolved.joinUrl).toBe("https://zoom.us/j/teacher-only");
  });

  resolutionTest("resolveForNewBooking returns none when no configs exist", async tx => {
    const { teacher } = await setupTeacher(tx);

    const resolved = await EffectiveMeetingService.resolveForNewBooking(teacher.id, { tx });

    expect(resolved.source).toBe("none");
    expect(resolved.joinUrl).toBeNull();
  });
});
