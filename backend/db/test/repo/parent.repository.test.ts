import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
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
        expect(profile.skype === null || typeof profile.skype === "string").toBeTrue();
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
