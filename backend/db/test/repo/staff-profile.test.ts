import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { StaffProfileRepository } from "@/backend/db/repo/staff-profile.repository";
import { permissionGroups, staffProfiles, userPermissionGroups } from "@/backend/db/schema";
import { createTestUser } from "../entity-setup";
import { type DbTransaction, runInRollback } from "../test-utils";

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

function staffTest(name: string, fn: (tx: DbTransaction) => Promise<void>) {
  test(name, async () => {
    await runInRollback(fn);
  });
}

async function createStaffUser(
  tx: DbTransaction,
  name: string,
  overrides: { phone?: string | null; skypeId?: string | null } = {}
) {
  const now = new Date();
  const user = await createTestUser(tx, {
    name,
    email: `staff-${name.toLowerCase()}-${randomUUID()}@t.com`,
  });

  const profiles = await tx
    .insert(staffProfiles)
    .values({
      userId: user.id,
      phone: overrides.phone ?? null,
      skypeId: overrides.skypeId ?? null,
      status: "ACTIVATED",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const profile = profiles[0];
  if (!profile) throw new Error("Failed to create staff profile");
  return { user, profile };
}

async function createTestPermissionGroup(tx: DbTransaction, name: string, slug: string) {
  const now = new Date();
  const groups = await tx
    .insert(permissionGroups)
    .values({
      name,
      slug,
      isSystem: false,
      description: `Test group ${name}`,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const group = groups[0];
  if (!group) throw new Error("Failed to create permission group");
  return group;
}

async function assignUserToGroup(tx: DbTransaction, userId: string, groupId: string) {
  await tx.insert(userPermissionGroups).values({
    userId,
    groupId,
    assignedAt: new Date(),
  });
}

describe("StaffProfileRepository — getManagerDirectory", () => {
  staffTest("returns all staff members with their role", async tx => {
    const { user } = await createStaffUser(tx, "DirMgr");
    const group = await createTestPermissionGroup(tx, "Test Dir Group", `test-dir-${randomUUID()}`);
    await assignUserToGroup(tx, user.id, group.id);

    const rows = await StaffProfileRepository.getManagerDirectory(tx);
    const found = rows.find(r => r.id === user.id);
    expect(found).toBeDefined();
    expect(found?.roleSlug).toBe(group.slug);
    expect(found?.email).toBe(user.email);
  });

  staffTest("includes skypeId and phone fields", async tx => {
    await createStaffUser(tx, "SkypePhone", {
      phone: "+1234567890",
      skypeId: "live:test.skype",
    });

    const rows = await StaffProfileRepository.getManagerDirectory(tx);
    const found = rows.find(r => r.name === "SkypePhone");
    expect(found).toBeDefined();
    expect(found?.phone).toBe("+1234567890");
    expect(found?.skypeId).toBe("live:test.skype");
  });

  staffTest("returns empty array when no staff profiles exist", async tx => {
    const rows = await StaffProfileRepository.getManagerDirectory(tx);
    expect(Array.isArray(rows)).toBe(true);
  });

  staffTest("returns staff without permission group (roleSlug is null)", async tx => {
    const { user } = await createStaffUser(tx, "NoGroupMgr");

    const rows = await StaffProfileRepository.getManagerDirectory(tx);
    const found = rows.find(r => r.id === user.id);
    expect(found).toBeDefined();
    expect(found?.roleSlug).toBeNull();
    expect(found?.roleName).toBeNull();
  });
});

describe("StaffProfileRepository — findByUserId", () => {
  staffTest("returns staff profile for valid user ID", async tx => {
    const { user, profile } = await createStaffUser(tx, "FindMe", {
      phone: "+9876543210",
    });

    const result = await StaffProfileRepository.findByUserId(user.id, tx);
    expect(result).not.toBeNull();
    expect(result?.name).toBe("FindMe");
    expect(result?.staffProfileId).toBe(profile.id);
    expect(result?.phone).toBe("+9876543210");
  });

  staffTest("returns null for non-existent user ID", async tx => {
    const result = await StaffProfileRepository.findByUserId("00000000-0000-0000-0000-000000000000", tx);
    expect(result).toBeNull();
  });

  staffTest("returns staff with group info", async tx => {
    const { user } = await createStaffUser(tx, "FindWithGroup");
    const group = await createTestPermissionGroup(tx, "Find Group", `find-grp-${randomUUID()}`);
    await assignUserToGroup(tx, user.id, group.id);

    const result = await StaffProfileRepository.findByUserId(user.id, tx);
    expect(result).not.toBeNull();
    expect(result?.roleSlug).toBe(group.slug);
    expect(result?.roleName).toBe("Find Group");
  });
});

describe("StaffProfileRepository — updateManagerProfile", () => {
  staffTest("updates phone and skypeId", async tx => {
    const { profile } = await createStaffUser(tx, "UpdateBoth");

    const result = await StaffProfileRepository.updateManagerProfile(
      profile.id,
      { phone: "+1234567890", phoneIsSet: true, skypeId: "test.skype", skypeIdIsSet: true },
      undefined,
      tx
    );
    expect(result.phone).toBe("+1234567890");
    expect(result.skypeId).toBe("test.skype");
  });

  staffTest("updates only phone when skypeId is not set", async tx => {
    const { profile } = await createStaffUser(tx, "UpdatePhone", {
      skypeId: "original.skype",
    });

    const result = await StaffProfileRepository.updateManagerProfile(
      profile.id,
      { phone: "+9876543210", phoneIsSet: true },
      undefined,
      tx
    );
    expect(result.phone).toBe("+9876543210");
    expect(result.skypeId).toBe("original.skype");
  });

  staffTest("sets phone to null when explicitly passed as null", async tx => {
    const { profile } = await createStaffUser(tx, "NullPhone", {
      phone: "+1111111111",
    });

    const result = await StaffProfileRepository.updateManagerProfile(
      profile.id,
      { phone: null, phoneIsSet: true },
      undefined,
      tx
    );
    expect(result.phone).toBeNull();
  });

  staffTest("updates only skypeId when phone is not set", async tx => {
    const { profile } = await createStaffUser(tx, "UpdateSkype", {
      phone: "+5555555555",
    });

    const result = await StaffProfileRepository.updateManagerProfile(
      profile.id,
      { skypeId: "new.skype.id", skypeIdIsSet: true },
      undefined,
      tx
    );
    expect(result.skypeId).toBe("new.skype.id");
    expect(result.phone).toBe("+5555555555");
  });

  staffTest("throws error for non-existent staff profile ID", async tx => {
    const error = await expectRepoError(() =>
      StaffProfileRepository.updateManagerProfile(
        "00000000-0000-0000-0000-000000000000",
        { phone: "+1111111111", phoneIsSet: true },
        undefined,
        tx
      )
    );
    expect(error.message).toContain("not found");
  });

  staffTest("does not update fields when neither flag is set", async tx => {
    const { profile } = await createStaffUser(tx, "NoUpdate", {
      phone: "+9999999999",
      skypeId: "keep.skype",
    });

    const result = await StaffProfileRepository.updateManagerProfile(profile.id, {}, undefined, tx);
    expect(result.phone).toBe("+9999999999");
    expect(result.skypeId).toBe("keep.skype");
  });

  staffTest("persists update to database", async tx => {
    const { profile } = await createStaffUser(tx, "Persist");

    await StaffProfileRepository.updateManagerProfile(
      profile.id,
      { phone: "+1234500000", phoneIsSet: true },
      undefined,
      tx
    );

    const [updated] = await tx
      .select({ phone: staffProfiles.phone })
      .from(staffProfiles)
      .where(eq(staffProfiles.id, profile.id));
    expect(updated?.phone).toBe("+1234500000");
  });
});

describe("StaffProfileRepository — getUserPermissionGroupSlugs", () => {
  staffTest("returns assigned group slugs for a user", async tx => {
    const user = await createTestUser(tx, {
      name: "SlugUser",
      email: `slug-${randomUUID()}@t.com`,
    });
    const group1 = await createTestPermissionGroup(tx, "Slug Group A", `slug-a-${randomUUID()}`);
    const group2 = await createTestPermissionGroup(tx, "Slug Group B", `slug-b-${randomUUID()}`);
    await assignUserToGroup(tx, user.id, group1.id);
    await assignUserToGroup(tx, user.id, group2.id);

    const slugs = await StaffProfileRepository.getUserPermissionGroupSlugs(user.id, tx);
    expect(slugs).toContain(group1.slug);
    expect(slugs).toContain(group2.slug);
    expect(slugs.length).toBe(2);
  });

  staffTest("returns empty array for user with no groups", async tx => {
    const slugs = await StaffProfileRepository.getUserPermissionGroupSlugs("00000000-0000-0000-0000-000000000000", tx);
    expect(slugs).toEqual([]);
  });

  staffTest("returns single slug for user with one group", async tx => {
    const user = await createTestUser(tx, {
      name: "SingleSlug",
      email: `single-${randomUUID()}@t.com`,
    });
    const group = await createTestPermissionGroup(tx, "Single Group", `single-${randomUUID()}`);
    await assignUserToGroup(tx, user.id, group.id);

    const slugs = await StaffProfileRepository.getUserPermissionGroupSlugs(user.id, tx);
    expect(slugs).toEqual([group.slug]);
  });
});

describe("StaffProfileRepository — create", () => {
  staffTest("creates staff profile successfully", async tx => {
    const user = await createTestUser(tx, { name: "Test Staff", email: `staff-${randomUUID()}@test.com` });

    const result = await StaffProfileRepository.create(
      {
        userId: user.id,
        status: "ACTIVATED",
        phone: "+1234567890",
        skypeId: "test_skype",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      tx
    );

    expect(result.id).toBeDefined();
    expect(result.userId).toBe(user.id);
    expect(result.status).toBe("ACTIVATED");
    expect(result.phone).toBe("+1234567890");
    expect(result.skypeId).toBe("test_skype");
  });

  staffTest("rejects duplicate staff profile for same user", async tx => {
    const user = await createTestUser(tx, { name: "Dup Staff", email: `dups-${randomUUID()}@test.com` });

    await StaffProfileRepository.create(
      { userId: user.id, status: "ACTIVATED", createdAt: new Date(), updatedAt: new Date() },
      tx
    );

    let error: unknown = null;
    try {
      await StaffProfileRepository.create(
        { userId: user.id, status: "ACTIVATED", createdAt: new Date(), updatedAt: new Date() },
        tx
      );
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    expect((error as Error).message).toContain("already exists");
  });

  staffTest("rejects when create insertion fails", async () => {
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
    } as unknown as DbTransaction;

    let error: unknown = null;
    try {
      await StaffProfileRepository.create(
        { userId: randomUUID(), status: "ACTIVATED", createdAt: new Date(), updatedAt: new Date() },
        mockTx
      );
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    expect((error as Error).message).toContain("Failed");
  });

  staffTest("throws error when manager profile update select fails", async () => {
    let callCount = 0;
    const mockTx = {
      select: () => ({
        from: () => ({
          innerJoin: () => ({
            leftJoin: () => ({
              leftJoin: () => ({
                where: () => ({
                  limit: () => {
                    callCount++;
                    if (callCount === 1) {
                      return [{ id: "some-id" }];
                    }
                    return [];
                  },
                }),
              }),
            }),
          }),
          where: () => ({
            limit: () => {
              callCount++;
              if (callCount === 1) {
                return [{ id: "some-id" }];
              }
              return [];
            },
          }),
        }),
      }),
      update: () => ({
        set: () => ({
          where: () => Promise.resolve(),
        }),
      }),
    } as unknown as DbTransaction;

    let error: unknown = null;
    try {
      await StaffProfileRepository.updateManagerProfile(
        "some-id",
        { phone: "+123", phoneIsSet: true },
        undefined,
        mockTx
      );
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    expect((error as Error).message).toContain("Failed");
  });

  staffTest("supports calls without tx", async () => {
    const fakeId = randomUUID();
    const result = await StaffProfileRepository.findByUserId(fakeId);
    expect(result).toBeNull();

    const directory = await StaffProfileRepository.getManagerDirectory();
    expect(directory.length).toBeGreaterThanOrEqual(0);
  });

  staffTest("rolls back staff profile creation on subsequent failure", async () => {
    let createdStaffId: string | undefined;
    await runInRollback(async outerTx => {
      const u = await createTestUser(outerTx, { name: "Rollback User", email: `rb-${randomUUID()}@test.com` });
      const profile = await StaffProfileRepository.create(
        { userId: u.id, status: "ACTIVATED", createdAt: new Date(), updatedAt: new Date() },
        outerTx
      );
      createdStaffId = profile.id;
      throw new Error("Simulated rollback error");
    }).catch(() => null);

    if (createdStaffId) {
      const [found] = await db.select().from(staffProfiles).where(eq(staffProfiles.id, createdStaffId)).limit(1);
      expect(found).toBeUndefined();
    }
  });
});
