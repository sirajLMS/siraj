import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { TeacherRepository } from "@/backend/db/repo/teacher.repository";
import { users } from "@/backend/db/schema";
import { setupTeacher } from "../entity-setup";
import { runInRollback } from "../test-utils";

describe("TeacherRepository", () => {
  it("getTeacherDirectory returns all non-deleted teachers sorted by name", async () => {
    await runInRollback(async tx => {
      await setupTeacher(tx, { name: "Zack Teacher", email: "zack@example.com" }, { status: "ACTIVATED" });
      const t2 = await setupTeacher(tx, { name: "Alice Teacher", email: "alice@example.com" }, { status: "ACTIVATED" });

      const directory = await TeacherRepository.getTeacherDirectory(undefined, tx);
      expect(directory.length).toBeGreaterThanOrEqual(2);

      // Verify sorting is alphabetical by user name
      const indices = directory.map(t => t.name);
      const aliceIdx = indices.indexOf("Alice Teacher");
      const zackIdx = indices.indexOf("Zack Teacher");
      expect(aliceIdx).toBeLessThan(zackIdx);

      // Verify fields are correctly populated
      const aliceRow = directory.find(t => t.id === t2.teacher.id);
      expect(aliceRow).toBeDefined();
      expect(aliceRow?.name).toBe("Alice Teacher");
      expect(aliceRow?.email).toBe("alice@example.com");
      expect(aliceRow?.status).toBe("ACTIVATED");
    });
  });

  it("getTeacherDirectory supports search filters by name or email", async () => {
    await runInRollback(async tx => {
      const t1 = await setupTeacher(
        tx,
        { name: "SearchName Teacher", email: "search1@example.com" },
        { status: "ACTIVATED" }
      );
      const t2 = await setupTeacher(
        tx,
        { name: "Unique Teacher", email: "searchemail@example.com" },
        { status: "ACTIVATED" }
      );

      const nameSearchResult = await TeacherRepository.getTeacherDirectory({ search: "SearchName" }, tx);
      expect(nameSearchResult.length).toBe(1);
      expect(nameSearchResult[0].id).toBe(t1.teacher.id);

      const emailSearchResult = await TeacherRepository.getTeacherDirectory({ search: "searchemail@example.com" }, tx);
      expect(emailSearchResult.length).toBe(1);
      expect(emailSearchResult[0].id).toBe(t2.teacher.id);
    });
  });

  it("getTeacherDirectory supports limit and offset", async () => {
    await runInRollback(async tx => {
      await setupTeacher(tx, { name: "Teacher A" }, { status: "ACTIVATED" });
      await setupTeacher(tx, { name: "Teacher B" }, { status: "ACTIVATED" });
      await setupTeacher(tx, { name: "Teacher C" }, { status: "ACTIVATED" });

      const limited = await TeacherRepository.getTeacherDirectory({ limit: 1 }, tx);
      expect(limited.length).toBe(1);

      const offsetResult = await TeacherRepository.getTeacherDirectory({ limit: 1, offset: 1 }, tx);
      expect(offsetResult.length).toBe(1);
      expect(offsetResult[0].id).not.toBe(limited[0].id);
    });
  });

  it("getTeacherDirectoryMetrics returns correct counts", async () => {
    await runInRollback(async tx => {
      const initialMetrics = await TeacherRepository.getTeacherDirectoryMetrics(tx);

      await setupTeacher(tx, { name: "Active T1" }, { status: "ACTIVATED" });
      await setupTeacher(tx, { name: "Active T2" }, { status: "ACTIVATED" });
      await setupTeacher(tx, { name: "Inactive T1" }, { status: "DEACTIVATED" });

      const newMetrics = await TeacherRepository.getTeacherDirectoryMetrics(tx);
      expect(newMetrics.activated).toBe(initialMetrics.activated + 2);
      expect(newMetrics.deactivated).toBe(initialMetrics.deactivated + 1);
    });
  });

  it("getTeacherDirectory filters out soft-deleted teachers", async () => {
    await runInRollback(async tx => {
      const t1 = await setupTeacher(tx, { name: "SoftDeleted Teacher" }, { status: "ACTIVATED" });

      const beforeDelete = await TeacherRepository.getTeacherDirectory({ search: "SoftDeleted" }, tx);
      expect(beforeDelete.length).toBe(1);

      // Soft delete user
      await tx.update(users).set({ deletedAt: new Date() }).where(eq(users.id, t1.user.id));

      const afterDelete = await TeacherRepository.getTeacherDirectory({ search: "SoftDeleted" }, tx);
      expect(afterDelete.length).toBe(0);
    });
  });

  it("getTeacherDirectoryMetrics handles empty table gracefully", async () => {
    await runInRollback(async tx => {
      const metrics = await TeacherRepository.getTeacherDirectoryMetrics(tx);
      expect(metrics.activated).toBeGreaterThanOrEqual(0);
      expect(metrics.deactivated).toBeGreaterThanOrEqual(0);
    });
  });
});
