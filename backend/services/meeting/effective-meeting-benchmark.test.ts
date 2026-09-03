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
      const instanceIds: string[] = [];
      for (let i = 0; i < 50; i++) {
        const inst = await createMockClassInstance(tx, student.id, teacher.id);
        instanceIds.push(inst.id);
        if (i % 2 === 0) {
          await createTestClassMeetingConfig(tx, { classInstanceId: inst.id }, provider.id, {
            isDefault: true,
            details: { meetingUrl: `https://zoom.us/j/class-${i}` },
          });
        }
      }

      // Warm up database caches
      await EffectiveMeetingService.resolveForClassInstances(instanceIds.slice(0, 5), tErrors, tx);

      // Measure unbatched Promise.all
      const startUnbatched = performance.now();
      const unbatchedResults = await Promise.all(
        instanceIds.map(id =>
          // Simulate the old behavior of individual resolutions
          // We can call resolveForClassInstances([id]) representing 1 query set per instance
          EffectiveMeetingService.resolveForClassInstances([id], tErrors, tx).then(map => map.get(id)!)
        )
      );
      const durationUnbatched = performance.now() - startUnbatched;

      // Measure batched resolveForClassInstances
      const startBatched = performance.now();
      const batchedMap = await EffectiveMeetingService.resolveForClassInstances(instanceIds, tErrors, tx);
      const durationBatched = performance.now() - startBatched;

      expect(unbatchedResults.length).toBe(50);
      expect(batchedMap.size).toBe(50);

      // Verify that both methods return identical results for every instance
      for (const id of instanceIds) {
        const unbatchedRes = unbatchedResults.find(r => r.configId === batchedMap.get(id)?.configId);
        expect(unbatchedRes).toBeDefined();
        expect(batchedMap.get(id)?.joinUrl).toEqual(
          unbatchedResults[instanceIds.indexOf(id)].joinUrl
        );
      }

      console.log(`\n--- BENCHMARK RESULTS (N=50) ---`);
      console.log(`Unbatched (50 x individual queries): ${durationUnbatched.toFixed(2)} ms`);
      console.log(`Batched (1 single batch query):       ${durationBatched.toFixed(2)} ms`);
      const speedup = (durationUnbatched / durationBatched).toFixed(2);
      console.log(`Speedup: ${speedup}x faster\n`);
    });
  });
});
