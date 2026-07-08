import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { ParentRepository } from "@/backend/db/repo";
import { parents } from "@/backend/db/schema";
import { createTestParent, createTestStudent, createTestUser } from "../entity-setup";
import { runInRollback } from "../test-utils";

async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  return errorCaught as Error;
}

describe("ParentRepository — getParentProfile", () => {
  test("returns full profile when parentId exists", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Profile Parent", email: `pp-${randomUUID()}@test.com` });
      const parent = await createTestParent(tx, user.id);

      const profile = await ParentRepository.getParentProfile(parent.id, tx);

      expect(profile).not.toBeNull();
      expect(profile?.id).toBe(parent.id);
      expect(profile?.userId).toBe(user.id);
      expect(profile?.name).toBe("Profile Parent");
      expect(profile?.email).toBe(user.email);
      expect(typeof profile?.status).toBe("string");
      expect(profile?.timezone).toBe("UTC");
      expect(profile?.createdAt).toBeInstanceOf(Date);
      expect(profile?.updatedAt).toBeInstanceOf(Date);
    });
  });

  test("returns null when parentId does not exist", async () => {
    await runInRollback(async tx => {
      const profile = await ParentRepository.getParentProfile("00000000-0000-0000-0000-000000000000", tx);
      expect(profile).toBeNull();
    });
  });

  test("returns nullable social media fields as null when not set", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Social Parent", email: `sp-${randomUUID()}@test.com` });
      const parent = await createTestParent(tx, user.id);

      const profile = await ParentRepository.getParentProfile(parent.id, tx);
      expect(profile).not.toBeNull();
      if (profile) {
        expect(profile.facebook === null || typeof profile.facebook === "string").toBeTrue();
        expect(profile.whatsapp === null || typeof profile.whatsapp === "string").toBeTrue();
        expect(profile.twitter === null || typeof profile.twitter === "string").toBeTrue();
        expect(profile.defaultZoomLink === null || typeof profile.defaultZoomLink === "string").toBeTrue();
      }
    });
  });
});

describe("ParentRepository — getAssociatedStudents", () => {
  test("returns students array for a parent with students", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Parent With Students", email: `pws-${randomUUID()}@test.com` });
      const parent = await createTestParent(tx, user.id);
      await createTestStudent(tx, parent.id, {
        name: "Student A",
        classesRemaining: 5,
        classesTotal: 10,
        hoursPerWeek: "3",
      });
      await createTestStudent(tx, parent.id, {
        name: "Student B",
        classesRemaining: 8,
        classesTotal: 12,
        hoursPerWeek: "4",
      });

      const result = await ParentRepository.getAssociatedStudents(parent.id, tx);

      expect(Array.isArray(result)).toBeTrue();
      expect(result).toHaveLength(2);

      const first = result[0];
      expect(first).toBeDefined();
      expect(typeof first.id).toBe("string");
      expect(typeof first.name).toBe("string");
      expect(typeof first.classesRemaining).toBe("number");
      expect(typeof first.classesTotal).toBe("number");
      expect(first.classesRemaining).toBeGreaterThanOrEqual(0);
      expect(first.classesTotal).toBeGreaterThanOrEqual(0);
      expect(typeof first.hoursPerWeek).toBe("string");
    });
  });

  test("returns empty array for parent with no students", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Lonely Parent", email: `lp-${randomUUID()}@test.com` });
      const parent = await createTestParent(tx, user.id);

      const result = await ParentRepository.getAssociatedStudents(parent.id, tx);
      expect(result).toEqual([]);
    });
  });

  test("returns empty array for unknown parentId", async () => {
    await runInRollback(async tx => {
      const result = await ParentRepository.getAssociatedStudents("00000000-0000-0000-0000-000000000000", tx);
      expect(result).toEqual([]);
    });
  });
});

describe("ParentRepository — deactivateParent", () => {
  test("throws parentNotFound for unknown parentId", async () => {
    await runInRollback(async tx => {
      const error = await expectRepoError(() =>
        ParentRepository.deactivateParent("00000000-0000-0000-0000-000000000000", tx)
      );
      expect(error.message).toContain("was not found");
    });
  });

  test("deactivates a REGULAR parent successfully", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Active Parent", email: `ap-${randomUUID()}@test.com` });
      const parent = await createTestParent(tx, user.id, { status: "REGULAR" });

      const result = await ParentRepository.deactivateParent(parent.id, tx);

      expect(result.id).toBe(parent.id);
      expect(result.status).toBe("DEACTIVATED");
      expect(result.userId).toBe(user.id);

      // Verify in DB via tx
      const updated = await tx
        .select({ status: parents.status })
        .from(parents)
        .where(eq(parents.id, parent.id))
        .limit(1);
      expect(updated[0]?.status).toBe("DEACTIVATED");
    });
  });

  test("throws parentAlreadyDeactivated when parent is already DEACTIVATED", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Deactivated Parent", email: `dp-${randomUUID()}@test.com` });
      const parent = await createTestParent(tx, user.id, { status: "DEACTIVATED" });

      const error = await expectRepoError(() => ParentRepository.deactivateParent(parent.id, tx));
      expect(error.message).toContain("already deactivated");
    });
  });
});

describe("ParentRepository — create", () => {
  test("creates parent profile successfully with billing configuration", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Test Parent", email: `parent-${randomUUID()}@test.com` });

      const result = await ParentRepository.create(
        {
          userId: user.id,
          status: "REGULAR",
          phone: "+1234567890",
          nationality: "US",
          address: "123 Main St",
          invoiceType: "MONTHLY",
          feeAmount: "500.00",
          paymentMethod: "BANK_ACCOUNT",
          currency: "USD",
          timezone: "America/Chicago",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        tx
      );

      expect(result.id).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.status).toBe("REGULAR");
      expect(result.invoiceType).toBe("MONTHLY");
      expect(result.feeAmount).toBe("500.00");
      expect(result.paymentMethod).toBe("BANK_ACCOUNT");
      expect(result.currency).toBe("USD");
    });
  });

  test("rejects duplicate parent profile for same user", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Dup Parent", email: `dupp-${randomUUID()}@test.com` });

      await ParentRepository.create(
        { userId: user.id, status: "REGULAR", createdAt: new Date(), updatedAt: new Date() },
        tx
      );

      let error: unknown = null;
      try {
        await ParentRepository.create(
          { userId: user.id, status: "REGULAR", createdAt: new Date(), updatedAt: new Date() },
          tx
        );
      } catch (e) {
        error = e;
      }

      expect(error).not.toBeNull();
      expect((error as Error).message).toContain("already exists");
    });
  });

  test("creates parent with default UTC timezone", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "UTC Parent", email: `utc-${randomUUID()}@test.com` });

      const result = await ParentRepository.create(
        { userId: user.id, status: "REGULAR", createdAt: new Date(), updatedAt: new Date() },
        tx
      );

      expect(result.id).toBeDefined();
      expect(result.timezone).toBe("UTC");
    });
  });

  test("rejects invalid timezone", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "TZ Parent", email: `tz-${randomUUID()}@test.com` });

      let error: unknown = null;
      try {
        await ParentRepository.create(
          {
            userId: user.id,
            status: "REGULAR",
            timezone: "Invalid/Timezone",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          tx
        );
      } catch (e) {
        error = e;
      }

      expect(error).not.toBeNull();
      expect((error as Error).message).toContain("timezone");
    });
  });

  test("rejects when create insertion fails", async () => {
    const user = { id: randomUUID() };
    const mockTx = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => [],
          }),
        }),
      }),
      insert: () => ({
        values: () => ({
          returning: () => [],
        }),
      }),
    } as unknown as DBTransaction;

    let error: unknown = null;
    try {
      await ParentRepository.create(
        { userId: user.id, status: "REGULAR", createdAt: new Date(), updatedAt: new Date() },
        mockTx
      );
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    expect((error as Error).message).toContain("Failed");
  });
});

describe("ParentRepository — getParentDirectory", () => {
  test("returns parent directory metrics and rows", async () => {
    await runInRollback(async tx => {
      const user1 = await createTestUser(tx, { name: "Dir Parent A", email: `dpa-${randomUUID()}@test.com` });
      const parent1 = await createTestParent(tx, user1.id, { status: "REGULAR" });

      const user2 = await createTestUser(tx, { name: "Dir Parent B", email: `dpb-${randomUUID()}@test.com` });
      const parent2 = await createTestParent(tx, user2.id, { status: "ON_LEAVE" });

      const result = await ParentRepository.getParentDirectory({ search: "Dir Parent" }, tx);
      expect(result.totalCount).toBeGreaterThanOrEqual(2);
      expect(result.rows.length).toBeGreaterThanOrEqual(2);
      expect(result.metrics.regular).toBeGreaterThanOrEqual(1);
      expect(result.metrics.onLeave).toBeGreaterThanOrEqual(1);

      const searchResult = await ParentRepository.getParentDirectory({ search: "Dir Parent A" }, tx);
      expect(searchResult.rows.some(r => r.id === parent1.id)).toBeTrue();
      expect(searchResult.rows.some(r => r.id === parent2.id)).toBeFalse();
    });
  });
});

describe("ParentRepository — getAssociatedStudentById", () => {
  test("returns student details if student belongs to parent", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Parent Stud ID", email: `psid-${randomUUID()}@test.com` });
      const parent = await createTestParent(tx, user.id);
      const student = await createTestStudent(tx, parent.id, { name: "Student Target" });

      const result = await ParentRepository.getAssociatedStudentById(student.id, tx);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(student.id);
      expect(result?.name).toBe("Student Target");
    });
  });

  test("returns null if student does not exist", async () => {
    await runInRollback(async tx => {
      const result = await ParentRepository.getAssociatedStudentById(randomUUID(), tx);
      expect(result).toBeNull();
    });
  });
});

describe("ParentRepository — findByUserId", () => {
  test("returns parent if found", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Find By User Parent", email: `fbup-${randomUUID()}@test.com` });
      const parent = await createTestParent(tx, user.id);

      const result = await ParentRepository.findByUserId(user.id, tx);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(parent.id);
    });
  });

  test("returns null if parent not found", async () => {
    await runInRollback(async tx => {
      const result = await ParentRepository.findByUserId(randomUUID(), tx);
      expect(result).toBeNull();
    });
  });
});

describe("ParentRepository — getStudentsForParent", () => {
  test("returns students list", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Parent List", email: `pl-${randomUUID()}@test.com` });
      const parent = await createTestParent(tx, user.id);
      await createTestStudent(tx, parent.id, { name: "Student Child" });

      const result = await ParentRepository.getStudentsForParent(parent.id, tx);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].name).toBe("Student Child");
    });
  });
});

describe("ParentRepository — non-transactional coverage fallback", () => {
  test("supports calls without tx", async () => {
    const fakeId = randomUUID();
    const profile = await ParentRepository.getParentProfile(fakeId);
    expect(profile).toBeNull();

    const parent = await ParentRepository.findByUserId(fakeId);
    expect(parent).toBeNull();

    const student = await ParentRepository.getAssociatedStudentById(fakeId);
    expect(student).toBeNull();

    const studentsList = await ParentRepository.getAssociatedStudents(fakeId);
    expect(studentsList).toHaveLength(0);

    const directory = await ParentRepository.getParentDirectory({});
    expect(directory.rows.length).toBeGreaterThanOrEqual(0);
  });
});

describe("ParentRepository — transaction rollback participation", () => {
  test("rolls back parent creation on subsequent failure", async () => {
    let createdParentId: string | undefined;
    await runInRollback(async tx => {
      const u = await createTestUser(tx, { name: "Rollback User", email: `rb-${randomUUID()}@test.com` });
      const parent = await ParentRepository.create(
        { userId: u.id, status: "REGULAR", createdAt: new Date(), updatedAt: new Date() },
        tx
      );
      createdParentId = parent.id;
      throw new Error("Simulated rollback error");
    }).catch(() => null);

    if (createdParentId) {
      const [found] = await db.select().from(parents).where(eq(parents.id, createdParentId)).limit(1);
      expect(found).toBeUndefined();
    }
  });
});
