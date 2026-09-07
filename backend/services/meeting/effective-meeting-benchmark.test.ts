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
import { logger } from "@/backend/lib/logger";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import { errorsEn } from "@/shared/locale/en/errors";

describe("EffectiveMeetingService Benchmark", () => {
  test("compares unbatched Promise.all vs batched resolveForClassInstances for 50 class instances", async () => {
    await runInRollback(async tx => {
      const tErrors = errorsEn;
      const { student } = await setupStudent(tx);
      const { teacher, user: teacherUser } = await setupTeacher(tx);
      const provider = await createTestMeetingProvider(tx);

      await createTestMeetingConfig(tx, teacherUser.id, provider.id, {
        isDefault: true,
        details: { meetingUrl: "https://zoom.us/j/teacher-default" },
      });

      // Create 50 class instances
      const indices = Array.from({ length: 50 }, (_, i) => i);
      const instanceIds = await indices.reduce<Promise<string[]>>(async (prevPromise, i) => {
        const acc = await prevPromise;
        const inst = await createMockClassInstance(tx, student.id, teacher.id);
        acc.push(inst.id);
        if (i % 2 === 0) {
          await createTestClassMeetingConfig(tx, { classInstanceId: inst.id }, provider.id, {
            isDefault: true,
            details: { meetingUrl: `https://zoom.us/j/class-${i}` },
          });
        }
        return acc;
      }, Promise.resolve([]));

      // Warm up database caches
      await EffectiveMeetingService.resolveForClassInstances(instanceIds.slice(0, 5), tErrors, tx);

      // Measure unbatched Promise.all
      const startUnbatched = performance.now();
      const unbatchedResults = await Promise.all(
        instanceIds.map(async id => {
          const map = await EffectiveMeetingService.resolveForClassInstances([id], tErrors, tx);
          return map.get(id);
        })
      );
      const durationUnbatched = performance.now() - startUnbatched;

      // Measure batched resolveForClassInstances
      const startBatched = performance.now();
      const batchedMap = await EffectiveMeetingService.resolveForClassInstances(instanceIds, tErrors, tx);
      const durationBatched = performance.now() - startBatched;

      expect(unbatchedResults).toHaveLength(50);
      expect(batchedMap.size).toBe(50);

      // Verify that both methods return identical results for every instance
      instanceIds.forEach((id, index) => {
        const unbatchedRes = unbatchedResults.find(r => r?.configId === batchedMap.get(id)?.configId);
        expect(unbatchedRes).toBeDefined();
        expect(batchedMap.get(id)?.joinUrl).toEqual(unbatchedResults[index]?.joinUrl);
      });

      const speedup = (durationUnbatched / durationBatched).toFixed(2);
      logger.info("effective-meeting benchmark", {
        instances: 50,
        unbatchedMs: durationUnbatched.toFixed(2),
        batchedMs: durationBatched.toFixed(2),
        speedup,
      });
    });
  });
});
