import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { TeacherRepository } from "@/backend/db/repo";
import { teachers, users } from "@/backend/db/schema";
import { createTestUser, setupTeacher } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { AccountStatus, CurrencyCode } from "@/backend/enum";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import { PaginationArgs } from "@/backend/types";

/**
 * Type guard that narrows an unknown value to DBTransaction for mock-based tests.
 */
function isDbTransaction(value: unknown): value is DBTransaction {
  return typeof value === "object" && value !== null && "select" in value && "insert" in value;
}

/**
 * Catch-and-assert error helper — avoids expect(...).rejects.toThrow() inside runInRollback.
 */
async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  if (!(errorCaught instanceof Error)) {
    throw new Error(`Expected an Error instance but got: ${String(errorCaught)}`);
  }
  return errorCaught;
}

describe("TeacherRepository", () => {
  it("getTeacherDirectory returns all non-deleted teachers sorted by name", async () => {
    await runInRollback(async tx => {
      await setupTeacher(tx, { name: "Zack Teacher", email: "zack@example.com" }, {});
      const t2 = await setupTeacher(tx, { name: "Alice Teacher", email: "alice@example.com" }, {});

      const { rows: directory } = await TeacherRepository.getTeacherDirectory(null, undefined, tx);
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
      expect(aliceRow?.status).toBe(AccountStatus.ACTIVATED);
    });
  });

  it("getTeacherDirectory supports search filters by name or email", async () => {
    await runInRollback(async tx => {
      const t1 = await setupTeacher(tx, { name: "SearchName Teacher", email: "search1@example.com" }, {});
      const t2 = await setupTeacher(tx, { name: "Unique Teacher", email: "searchemail@example.com" }, {});

      const nameSearchResult = await TeacherRepository.getTeacherDirectory(null, "SearchName", tx);
      expect(nameSearchResult.rows).toHaveLength(1);
      expect(nameSearchResult.rows[0].id).toBe(t1.teacher.id);

      const emailSearchResult = await TeacherRepository.getTeacherDirectory(null, "searchemail@example.com", tx);
      expect(emailSearchResult.rows).toHaveLength(1);
      expect(emailSearchResult.rows[0].id).toBe(t2.teacher.id);
    });
  });

  it("getTeacherDirectory supports pagination via PaginationArgs", async () => {
    await runInRollback(async tx => {
      await setupTeacher(tx, { name: "Teacher A" }, {});
      await setupTeacher(tx, { name: "Teacher B" }, {});
      await setupTeacher(tx, { name: "Teacher C" }, {});

      const firstPageArgs = new PaginationArgs({ first: 1, page: 1 });
      const limited = await TeacherRepository.getTeacherDirectory(firstPageArgs, undefined, tx);
      expect(limited.rows).toHaveLength(1);

      const secondPageArgs = new PaginationArgs({ first: 1, page: 2 });
      const offsetResult = await TeacherRepository.getTeacherDirectory(secondPageArgs, undefined, tx);
      expect(offsetResult.rows).toHaveLength(1);
      expect(offsetResult.rows[0].id).not.toBe(limited.rows[0].id);
    });
  });

  it("getTeacherDirectoryMetrics returns correct counts", async () => {
    await runInRollback(async tx => {
      const initialMetrics = await TeacherRepository.getTeacherDirectoryMetrics(tx);

      await setupTeacher(tx, { name: "Active T1" }, {});
      await setupTeacher(tx, { name: "Active T2" }, {});
      await setupTeacher(tx, { name: "Inactive T1" }, { status: "DEACTIVATED" });

      const newMetrics = await TeacherRepository.getTeacherDirectoryMetrics(tx);
      expect(newMetrics.activated).toBe(initialMetrics.activated + 2);
      expect(newMetrics.deactivated).toBe(initialMetrics.deactivated + 1);
    });
  });

  it("getTeacherDirectory filters out soft-deleted teachers", async () => {
    await runInRollback(async tx => {
      const t1 = await setupTeacher(tx, { name: "SoftDeleted Teacher" }, {});

      const beforeDelete = await TeacherRepository.getTeacherDirectory(null, "SoftDeleted", tx);
      expect(beforeDelete.rows).toHaveLength(1);

      // Soft delete user
      await tx.update(users).set({ deletedAt: new Date() }).where(eq(users.id, t1.user.id));

      const afterDelete = await TeacherRepository.getTeacherDirectory(null, "SoftDeleted", tx);
      expect(afterDelete.rows).toHaveLength(0);
    });
  });

  it("getTeacherDirectoryMetrics handles empty table gracefully", async () => {
    await runInRollback(async tx => {
      const metrics = await TeacherRepository.getTeacherDirectoryMetrics(tx);
      expect(metrics.activated).toBeGreaterThanOrEqual(0);
      expect(metrics.deactivated).toBeGreaterThanOrEqual(0);
    });
  });

  describe("updateTeacherProfile", () => {
    it("successfully updates the teacher profile", async () => {
      await runInRollback(async tx => {
        const { teacher } = await setupTeacher(tx, { name: "Update Test Teacher" });
        const newAddress = "123 Updated Street";
        const newPhone = "+1234567890";

        const result = await TeacherRepository.updateTeacherProfile(
          teacher.id,
          { address: newAddress, phone: newPhone },
          tx
        );

        expect(result).toBe(true);
        const [updated] = await tx.select().from(teachers).where(eq(teachers.id, teacher.id));
        expect(updated.address).toBe(newAddress);
        expect(updated.phone).toBe(newPhone);
      });
    });

    it("returns false for non-existent teacher", async () => {
      await runInRollback(async tx => {
        const result = await TeacherRepository.updateTeacherProfile(
          "00000000-0000-0000-0000-000000000000",
          { address: "Nowhere" },
          tx
        );
        expect(result).toBe(false);
      });
    });
  });

  describe("create", () => {
    it("creates teacher profile successfully", async () => {
      await runInRollback(async tx => {
        const user = await createTestUser(tx, {
          name: "Test Teacher",
          email: "teacher@test.com",
          timezone: IanaTimezone.America_New_York,
        });

        const result = await TeacherRepository.create(
          {
            userId: user.id,
            nationality: "US",
            phone: "+1234567890",
            gender: "MALE",
            hourlyRate: "25.00",
            rateCurrency: CurrencyCode.USD,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          tx
        );

        expect(result.id).toBeDefined();
        expect(result.userId).toBe(user.id);
        expect(result.status).toBe(AccountStatus.ACTIVATED);
        expect(result.timezone).toBe(IanaTimezone.America_New_York);
        expect(result.createdAt).toBeInstanceOf(Date);
      });
    });

    it("rejects duplicate teacher profile for same user", async () => {
      await runInRollback(async tx => {
        const user = await createTestUser(tx, { name: "Dup Teacher", email: "dup@test.com" });

        await TeacherRepository.create({ userId: user.id, createdAt: new Date(), updatedAt: new Date() }, tx);

        const error = await expectRepoError(() =>
          TeacherRepository.create({ userId: user.id, createdAt: new Date(), updatedAt: new Date() }, tx, "ar")
        );
        expect(error.message).toContain("موجود بالفعل");
      });
    });

    it("rejects invalid timezone on user", async () => {
      await runInRollback(async tx => {
        const user = await createTestUser(tx, { name: "TZ Teacher", email: "tz@test.com" });

        let error: unknown = null;
        try {
          await tx.update(users).set({ timezone: "Invalid/Timezone" }).where(eq(users.id, user.id));
        } catch (e) {
          error = e;
        }

        expect(error).not.toBeNull();
      });
    });

    it("creates teacher with minimal required fields", async () => {
      await runInRollback(async tx => {
        const user = await createTestUser(tx, { name: "Min Teacher", email: "min@test.com" });

        const result = await TeacherRepository.create(
          {
            userId: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          tx
        );

        expect(result.id).toBeDefined();
        expect(result.userId).toBe(user.id);
      });
    });
  });

  describe("findByUserId", () => {
    it("returns null if teacher not found", async () => {
      await runInRollback(async tx => {
        const result = await TeacherRepository.findByUserId(randomUUID(), tx);
        expect(result).toBeNull();
      });
    });

    it("returns teacher if found", async () => {
      await runInRollback(async tx => {
        const { teacher, user } = await setupTeacher(tx, { name: "Find Teacher" });
        const result = await TeacherRepository.findByUserId(user.id, tx);
        expect(result).not.toBeNull();
        expect(result?.id).toBe(teacher.id);
      });
    });
  });

  describe("findById", () => {
    it("returns null if teacher not found", async () => {
      await runInRollback(async tx => {
        const result = await TeacherRepository.findById(randomUUID(), tx);
        expect(result).toBeNull();
      });
    });

    it("returns teacher if found", async () => {
      await runInRollback(async tx => {
        const { teacher } = await setupTeacher(tx, { name: "Find Teacher By ID" });
        const result = await TeacherRepository.findById(teacher.id, tx);
        expect(result).not.toBeNull();
        expect(result?.id).toBe(teacher.id);
      });
    });
  });

  describe("searchTeachers", () => {
    it("returns matching teachers based on query", async () => {
      await runInRollback(async tx => {
        const { teacher } = await setupTeacher(tx, { name: "SearchMe Teacher" });
        await setupTeacher(tx, { name: "Other Teacher" });

        const results = await TeacherRepository.searchTeachers("SearchMe", 10, tx);
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe(teacher.id);

        const allResults = await TeacherRepository.searchTeachers("", 10, tx);
        expect(allResults.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe("getTeacherProfileForEdit", () => {
    it("returns null if teacher does not exist", async () => {
      await runInRollback(async tx => {
        const result = await TeacherRepository.getTeacherProfileForEdit(randomUUID(), tx);
        expect(result).toBeNull();
      });
    });

    it("returns formatted profile if teacher exists", async () => {
      await runInRollback(async tx => {
        const user = await createTestUser(tx, { name: "Profile Edit Teacher", email: `prof-${randomUUID()}@test.com` });
        const now = new Date();
        const dateOfBirthStr = "1990-01-01";
        const teacher = await TeacherRepository.create(
          {
            userId: user.id,
            dateOfBirth: dateOfBirthStr,
            createdAt: now,
            updatedAt: now,
          },
          tx
        );

        const result = await TeacherRepository.getTeacherProfileForEdit(teacher.id, tx);
        expect(result).not.toBeNull();
        expect(result?.id).toBe(teacher.id);
        expect(result?.dateOfBirth).toBe(new Date(dateOfBirthStr).toISOString());
      });
    });

    it("handles null dateOfBirth", async () => {
      await runInRollback(async tx => {
        const user = await createTestUser(tx, { name: "Null DOB Teacher", email: `null-dob-${randomUUID()}@test.com` });
        const now = new Date();
        const teacher = await TeacherRepository.create(
          {
            userId: user.id,
            dateOfBirth: null,
            createdAt: now,
            updatedAt: now,
          },
          tx
        );

        const result = await TeacherRepository.getTeacherProfileForEdit(teacher.id, tx);
        expect(result).not.toBeNull();
        expect(result?.dateOfBirth).toBeNull();
      });
    });
  });

  describe("non-transactional coverage fallback", () => {
    it("supports calls without tx", async () => {
      const fakeId = randomUUID();
      const teacher = await TeacherRepository.findById(fakeId);
      expect(teacher).toBeNull();

      const profile = await TeacherRepository.getTeacherProfileForEdit(fakeId);
      expect(profile).toBeNull();

      const search = await TeacherRepository.searchTeachers("NonExistentName", 10);
      expect(search).toHaveLength(0);

      const directory = await TeacherRepository.getTeacherDirectory(new PaginationArgs({ first: 1, page: 1 }));
      expect(directory.rows.length).toBeGreaterThanOrEqual(0);

      const metrics = await TeacherRepository.getTeacherDirectoryMetrics();
      expect(metrics.activated).toBeGreaterThanOrEqual(0);
    });

    it("rejects when create insertion fails", async () => {
      const mockTx = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => [] as unknown[],
            }),
          }),
        }),
        insert: () => ({
          values: () => ({
            returning: () => [] as unknown[],
          }),
        }),
      };
      if (!isDbTransaction(mockTx)) {
        throw new Error("Mock transaction does not satisfy DBTransaction contract");
      }

      const error = await expectRepoError(() =>
        TeacherRepository.create({ userId: randomUUID(), createdAt: new Date(), updatedAt: new Date() }, mockTx)
      );
      expect(error.message).toContain("Failed");
    });
  });

  describe("transaction rollback participation", () => {
    it("rolls back teacher creation on subsequent failure", async () => {
      let createdTeacherId: string | undefined;
      await runInRollback(async tx => {
        const u = await createTestUser(tx, { name: "Rollback User", email: `rb-${randomUUID()}@test.com` });
        const teacher = await TeacherRepository.create(
          { userId: u.id, createdAt: new Date(), updatedAt: new Date() },
          tx
        );
        createdTeacherId = teacher.id;
        throw new Error("Simulated rollback error");
      }).catch(() => null);

      if (createdTeacherId) {
        const [found] = await db.select().from(teachers).where(eq(teachers.id, createdTeacherId)).limit(1);
        expect(found).toBeUndefined();
      }
    });
  });
});
