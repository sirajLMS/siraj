import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { ClassPerformanceRepository } from "@/backend/db/repo/class-performance.repository";
import { setupTestEntities } from "../entity-setup";
import { runInRollback } from "../test-utils";

describe("ClassPerformanceRepository", () => {
  it("should return null if no performance record exists", async () => {
    await runInRollback(async tx => {
      const { instance } = await setupTestEntities(tx, "perf1");
      if (!instance) throw new Error("instance is null");
      const result = await ClassPerformanceRepository.getByClassInstanceId(instance.id, tx);
      expect(result).toBeNull();
    });
  });

  it("should create a new performance record via upsert", async () => {
    await runInRollback(async tx => {
      const { instance } = await setupTestEntities(tx, "perf2");
      if (!instance) throw new Error("instance is null");
      const result = await ClassPerformanceRepository.upsertForClassInstance(
        instance.id,
        {
          engagementScore: 85,
          focusLevel: "HIGH",
          sessionHealth: "GOOD",
          heatmapData: [1, 2, 3],
        },
        tx
      );

      expect(result).toBeDefined();
      expect(result.classInstanceId).toBe(instance.id);
      expect(result.engagementScore).toBe(85);
      expect(result.focusLevel).toBe("HIGH");

      const fetched = await ClassPerformanceRepository.getByClassInstanceId(instance.id, tx);
      expect(fetched).not.toBeNull();
      expect(fetched?.engagementScore).toBe(85);
    });
  });

  it("should update an existing performance record via upsert", async () => {
    await runInRollback(async tx => {
      const { instance } = await setupTestEntities(tx, "perf3");
      if (!instance) throw new Error("instance is null");

      // First insert
      await ClassPerformanceRepository.upsertForClassInstance(
        instance.id,
        {
          engagementScore: 80,
          assessmentProgress: 50,
        },
        tx
      );

      // Update
      const updated = await ClassPerformanceRepository.upsertForClassInstance(
        instance.id,
        {
          engagementScore: 95,
          assessmentProgress: 100,
          avgGrade: "A+",
        },
        tx
      );

      expect(updated.engagementScore).toBe(95);
      expect(updated.assessmentProgress).toBe(100);
      expect(updated.avgGrade).toBe("A+");
    });
  });

  it("should support native non-transactional calls", async () => {
    const fakeId = randomUUID();
    const result = await ClassPerformanceRepository.getByClassInstanceId(fakeId);
    expect(result).toBeNull();

    // We cannot easily test non-transactional upsert without polluting the DB or setting up data outside a tx,
    // so we just test the getter to hit the code path.
  });
});
