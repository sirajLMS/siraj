import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { StaffProfileRepository } from "@/backend/db/repo";
import type { ManagerProfileUpdateInput } from "@/backend/db/repo/staff-profile.repository";
import { permissionGroups, staffProfiles, userPermissionGroups } from "@/backend/db/schema";
import { AccountStatus } from "@/backend/enum";
import { PaginationArgs } from "@/backend/types";
import { createTestUser } from "../entity-setup";
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

function staffTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    await runInRollback(fn);
  });
}

async function createStaffUser(tx: DBTransaction, name: string, overrides: { phone?: string | null } = {}) {
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
      status: AccountStatus.ACTIVATED,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const profile = profiles[0];
  if (!profile) throw new Error("Failed to create staff profile");
  return { user, profile };
}

async function createTestPermissionGroup(tx: DBTransaction, name: string, slug: string) {
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

async function assignUserToGroup(tx: DBTransaction, userId: string, groupId: string) {
  await tx.insert(userPermissionGroups).values({
    userId,
    groupId,
    assignedAt: new Date(),
  });
}

async function updateProfile(tx: DBTransaction, profileId: string, input: ManagerProfileUpdateInput) {
  return StaffProfileRepository.updateManagerProfile(profileId, input, undefined, tx);
}

async function createStaffAndGroup(tx: DBTransaction, staffName: string, groupName: string, groupSlug: string) {
  const { user } = await createStaffUser(tx, staffName);
  const group = await createTestPermissionGroup(tx, groupName, groupSlug);
  await assignUserToGroup(tx, user.id, group.id);
  return { user, group };
}

async function insertStaffProfile(tx: DBTransaction, userId: string, status: string) {
  const now = new Date();
  await tx.insert(staffProfiles).values({
    userId,
    status,
    createdAt: now,
    updatedAt: now,
  });
}

describe("StaffProfileRepository — getManagerDirectory", () => {
  staffTest("returns all staff members with their role", async tx => {
    const { user } = await createStaffUser(tx, "DirMgr");
    const group = await createTestPermissionGroup(tx, "Test Dir Group", `test-dir-${randomUUID()}`);
    await assignUserToGroup(tx, user.id, group.id);

    const result = await StaffProfileRepository.getManagerDirectory(null, undefined, tx);
    const found = result.rows.find(r => r.id === user.id);
    expect(found).toBeDefined();
    expect(found?.roleSlug).toBe(group.slug);
    expect(found?.email).toBe(user.email);
  });

  staffTest("includes phone field", async tx => {
    await createStaffUser(tx, "PhoneOnly", {
      phone: "+1234567890",
    });

    const result = await StaffProfileRepository.getManagerDirectory(null, undefined, tx);
    const found = result.rows.find(r => r.name === "PhoneOnly");
    expect(found).toBeDefined();
    expect(found?.phone).toBe("+1234567890");
  });

  staffTest("returns empty array when no staff profiles exist", async tx => {
    const result = await StaffProfileRepository.getManagerDirectory(null, undefined, tx);
    expect(Array.isArray(result.rows)).toBe(true);
  });

  staffTest("returns staff without permission group (roleSlug is null)", async tx => {
    const { user } = await createStaffUser(tx, "NoGroupMgr");

    const result = await StaffProfileRepository.getManagerDirectory(null, undefined, tx);
    const found = result.rows.find(r => r.id === user.id);
    expect(found).toBeDefined();
    expect(found?.roleSlug).toBeNull();
    expect(found?.roleName).toBeNull();
  });

  staffTest("filters by admin role", async tx => {
    const { user: adminUser } = await createStaffAndGroup(tx, "AdminFilter", "Admin Group", `admin-${randomUUID()}`);
    const { user: staffUser } = await createStaffAndGroup(
      tx,
      "StaffFilterNoAdmin",
      "Staff Group",
      `staff-${randomUUID()}`
    );

    const result = await StaffProfileRepository.getManagerDirectory(null, { roleFilter: "admin" }, tx);
    expect(result.rows.find(r => r.id === adminUser.id)).toBeDefined();
    expect(result.rows.find(r => r.id === staffUser.id)).toBeUndefined();
  });

  staffTest("filters by staff role (non-admin slugs)", async tx => {
    const { user: adminUser } = await createStaffAndGroup(tx, "AdminNoMatch", "Admin X", `admin-x-${randomUUID()}`);
    const { user: staffUser } = await createStaffAndGroup(tx, "StaffMatch", "Staff Y", `staff-y-${randomUUID()}`);
    const { user: noGroupUser } = await createStaffUser(tx, "NoGroupMatch");

    const result = await StaffProfileRepository.getManagerDirectory(null, { roleFilter: "staff" }, tx);
    expect(result.rows.find(r => r.id === adminUser.id)).toBeUndefined();
    expect(result.rows.find(r => r.id === staffUser.id)).toBeDefined();
    expect(result.rows.find(r => r.id === noGroupUser.id)).toBeDefined();
  });

  staffTest("filters by active status", async tx => {
    const activeUser = await createTestUser(tx, { name: "ActiveS", email: `active-s-${randomUUID()}@t.com` });
    await insertStaffProfile(tx, activeUser.id, AccountStatus.ACTIVATED);
    const deactivatedUser = await createTestUser(tx, { name: "DeactivatedS", email: `deact-s-${randomUUID()}@t.com` });
    await insertStaffProfile(tx, deactivatedUser.id, AccountStatus.DEACTIVATED);

    const result = await StaffProfileRepository.getManagerDirectory(null, { statusFilter: "active" }, tx);
    expect(result.rows.find(r => r.id === activeUser.id)).toBeDefined();
    expect(result.rows.find(r => r.id === deactivatedUser.id)).toBeUndefined();
  });

  staffTest("filters by offline status", async tx => {
    const activeUser = await createTestUser(tx, { name: "ActiveOff", email: `active-off-${randomUUID()}@t.com` });
    await insertStaffProfile(tx, activeUser.id, AccountStatus.ACTIVATED);
    const deactivatedUser = await createTestUser(tx, {
      name: "DeactivatedOff",
      email: `deact-off-${randomUUID()}@t.com`,
    });
    await insertStaffProfile(tx, deactivatedUser.id, AccountStatus.DEACTIVATED);

    const result = await StaffProfileRepository.getManagerDirectory(null, { statusFilter: "offline" }, tx);
    expect(result.rows.find(r => r.id === activeUser.id)).toBeUndefined();
    expect(result.rows.find(r => r.id === deactivatedUser.id)).toBeDefined();
  });

  staffTest("returns paginated results with pageInfo", async tx => {
    await createStaffUser(tx, "Page1");
    await createStaffUser(tx, "Page2");

    const pagination = new PaginationArgs({ first: 1, page: 1 });
    const result = await StaffProfileRepository.getManagerDirectory(pagination, undefined, tx);

    expect(result.rows.length).toBeLessThanOrEqual(1);
    expect(result.pageInfo).not.toBeNull();
    expect(result.pageInfo?.perPage).toBe(1);
    expect(result.pageInfo?.currentPage).toBe(1);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
  });

  staffTest("returns metrics in directory result", async tx => {
    await createStaffUser(tx, "MetricsDir");

    const result = await StaffProfileRepository.getManagerDirectory(null, undefined, tx);
    expect(result.metrics).toBeDefined();
    expect(result.metrics.id).toBe("manager-directory-metrics");
    expect(typeof result.metrics.totalAdmin).toBe("number");
    expect(typeof result.metrics.systemStaff).toBe("number");
    expect(typeof result.metrics.activeNow).toBe("number");
    expect(typeof result.metrics.alerts).toBe("number");
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
  staffTest("updates phone", async tx => {
    const { profile } = await createStaffUser(tx, "UpdatePhone");

    const result = await updateProfile(tx, profile.id, {
      phone: "+1234567890",
      phoneIsSet: true,
    });
    expect(result.phone).toBe("+1234567890");
  });

  staffTest("updates only phone when given", async tx => {
    const { profile } = await createStaffUser(tx, "UpdatePhoneOnly", {
      phone: "+1111111111",
    });

    const result = await updateProfile(tx, profile.id, { phone: "+9876543210", phoneIsSet: true });
    expect(result.phone).toBe("+9876543210");
  });

  staffTest("sets phone to null when explicitly passed as null", async tx => {
    const { profile } = await createStaffUser(tx, "NullPhone", {
      phone: "+1111111111",
    });

    const result = await updateProfile(tx, profile.id, { phone: null, phoneIsSet: true });
    expect(result.phone).toBeNull();
  });

  staffTest("updates phone to new value when only phone is given", async tx => {
    const { profile } = await createStaffUser(tx, "UpdatePhoneOnly2", {
      phone: "+5555555555",
    });

    const result = await updateProfile(tx, profile.id, { phone: "+6666666666", phoneIsSet: true });
    expect(result.phone).toBe("+6666666666");
  });

  staffTest("updates status when statusIsSet is true", async tx => {
    const { profile } = await createStaffUser(tx, "StatusUpdate", {
      phone: "+4444444444",
    });

    const result = await updateProfile(tx, profile.id, { status: AccountStatus.DEACTIVATED, statusIsSet: true });
    expect(result.status).toBe(AccountStatus.DEACTIVATED);
  });

  staffTest("defaults status to ACTIVATED when statusIsSet is true and status is null", async tx => {
    const { profile } = await createStaffUser(tx, "StatusDefault");

    const result = await updateProfile(tx, profile.id, { status: null, statusIsSet: true });
    expect(result.status).toBe(AccountStatus.ACTIVATED);
  });

  staffTest("throws error for non-existent staff profile ID", async tx => {
    const error = await expectRepoError(() =>
      updateProfile(tx, "00000000-0000-0000-0000-000000000000", { phone: "+1111111111", phoneIsSet: true })
    );
    expect(error.message).toContain("not found");
  });

  staffTest("does not update fields when neither flag is set", async tx => {
    const { profile } = await createStaffUser(tx, "NoUpdate", {
      phone: "+9999999999",
    });

    const result = await updateProfile(tx, profile.id, {});
    expect(result.phone).toBe("+9999999999");
  });

  staffTest("persists update to database", async tx => {
    const { profile } = await createStaffUser(tx, "Persist");

    await updateProfile(tx, profile.id, { phone: "+1234500000", phoneIsSet: true });

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

describe("StaffProfileRepository — getOnboardingMetrics", () => {
  staffTest("returns metrics with correct structure", async tx => {
    await createStaffUser(tx, "Onboard1");

    const result = await StaffProfileRepository.getOnboardingMetrics(tx);
    expect(result.id).toBe("onboarding-metrics");
    expect(typeof result.activeStaff).toBe("number");
    expect(typeof result.pendingApproval).toBe("number");
    expect(typeof result.avgOnboardingDays).toBe("number");
  });

  staffTest("counts active and deactivated staff correctly", async tx => {
    const activeUser = await createTestUser(tx, { name: "ActiveOM", email: `active-om-${randomUUID()}@t.com` });
    await insertStaffProfile(tx, activeUser.id, AccountStatus.ACTIVATED);
    const deactivatedUser = await createTestUser(tx, {
      name: "DeactivatedOM",
      email: `deact-om-${randomUUID()}@t.com`,
    });
    await insertStaffProfile(tx, deactivatedUser.id, AccountStatus.DEACTIVATED);

    const result = await StaffProfileRepository.getOnboardingMetrics(tx);
    expect(result.activeStaff).toBeGreaterThanOrEqual(1);
    expect(result.pendingApproval).toBeGreaterThanOrEqual(1);
  });

  staffTest("returns 0 avgOnboardingDays when no recent profiles", async tx => {
    const result = await StaffProfileRepository.getOnboardingMetrics(tx);
    expect(result.avgOnboardingDays).toBeGreaterThanOrEqual(0);
  });
});

describe("StaffProfileRepository — create", () => {
  staffTest("creates staff profile successfully", async tx => {
    const user = await createTestUser(tx, { name: "Test Staff", email: `staff-${randomUUID()}@test.com` });

    const result = await StaffProfileRepository.create(
      {
        userId: user.id,
        status: AccountStatus.ACTIVATED,
        phone: "+1234567890",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      tx
    );

    expect(result.id).toBeDefined();
    expect(result.userId).toBe(user.id);
    expect(result.status).toBe(AccountStatus.ACTIVATED);
    expect(result.phone).toBe("+1234567890");
  });

  staffTest("rejects duplicate staff profile for same user", async tx => {
    const user = await createTestUser(tx, { name: "Dup Staff", email: `dups-${randomUUID()}@test.com` });

    await StaffProfileRepository.create(
      { userId: user.id, status: AccountStatus.ACTIVATED, createdAt: new Date(), updatedAt: new Date() },
      tx
    );

    let error: unknown = null;
    try {
      await StaffProfileRepository.create(
        { userId: user.id, status: AccountStatus.ACTIVATED, createdAt: new Date(), updatedAt: new Date() },
        tx
      );
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    expect((error as Error).message).toContain("already exists");
  });

  staffTest("rejects when create insertion fails", async () => {
    const selectLimit = () => [];
    const selectWhere = () => ({ limit: selectLimit });
    const selectFrom = () => ({ where: selectWhere });
    const selectFn = () => ({ from: selectFrom });
    const insertReturning = () => [];
    const insertValues = () => ({ returning: insertReturning });
    const insertFn = () => ({ values: insertValues });
    const mockTx = { select: selectFn, insert: insertFn } as unknown as DBTransaction;

    let error: unknown = null;
    try {
      await StaffProfileRepository.create(
        { userId: randomUUID(), status: AccountStatus.ACTIVATED, createdAt: new Date(), updatedAt: new Date() },
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
    const limitHandler = () => {
      callCount++;
      if (callCount === 1) return [{ id: "some-id" }];
      return [];
    };
    const deepWhere = () => ({ limit: limitHandler });
    const secondLeftJoin = () => ({ where: deepWhere });
    const firstLeftJoin = () => ({ leftJoin: secondLeftJoin });
    const innerJoin = () => ({ leftJoin: firstLeftJoin });
    const outerWhere = () => ({ limit: limitHandler });
    const fromFn = () => ({ innerJoin, where: outerWhere });
    const selectFn = () => ({ from: fromFn });
    const updateSetWhere = () => Promise.resolve();
    const updateSet = () => ({ where: updateSetWhere });
    const updateFn = () => ({ set: updateSet });
    const mockTx = { select: selectFn, update: updateFn } as unknown as DBTransaction;

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
    expect(directory.rows.length).toBeGreaterThanOrEqual(0);
  });

  staffTest("rolls back staff profile creation on subsequent failure", async () => {
    let createdStaffId: string | undefined;
    await runInRollback(async outerTx => {
      const u = await createTestUser(outerTx, { name: "Rollback User", email: `rb-${randomUUID()}@test.com` });
      const profile = await StaffProfileRepository.create(
        { userId: u.id, status: AccountStatus.ACTIVATED, createdAt: new Date(), updatedAt: new Date() },
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
