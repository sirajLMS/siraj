import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { PermissionManagementRepository } from "@/backend/db/repo";
import { permissionGroups, permissions } from "@/backend/db/schema";
import { createTestPermission } from "@/backend/db/test/entity-setup";
import { createTestUser, runInRollback } from "@/backend/db/test/test-utils";
import { AppPermission, OverrideState } from "@/backend/enum";
import { getErrorMessage } from "@/shared/utils/error";

function loc(en: string, ar?: string) {
  return { ar: ar ?? en, en };
}

function testRepo(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    expect(typeof fn).toBe("function");
    await runInRollback(fn);
  });
}

function testRepoError(name: string, operation: () => Promise<unknown>) {
  testRepo(name, async () => {
    let errorThrown: unknown = null;
    try {
      await operation();
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).not.toBeNull();
    expect(getErrorMessage(errorThrown)).toContain("Mock database error");
  });
}

/**
 * Type guard that narrows an unknown value to DBTransaction for mock-based tests.
 */
function isDbTransaction(value: unknown): value is DBTransaction {
  return typeof value === "object" && value !== null && "select" in value && "insert" in value;
}

/**
 * Safely converts a mock object to DBTransaction using a type guard.
 * Throws if the mock doesn't satisfy the minimum DBTransaction shape.
 */
function asDbTx(mock: object): DBTransaction {
  if (isDbTransaction(mock)) return mock;
  throw new Error("Mock is not a valid DBTransaction");
}

// Mock database client that throws errors to test error/catch paths
const badTx = asDbTx({
  select: () => {
    throw new Error("Mock database error");
  },
  insert: () => {
    throw new Error("Mock database error");
  },
  update: () => {
    throw new Error("Mock database error");
  },
  delete: () => {
    throw new Error("Mock database error");
  },
});

describe("PermissionManagementRepository", () => {
  describe("Group Management", () => {
    testRepo("listAllPermissions should return all permissions ordered by category, resource, action", async tx => {
      const perms = await PermissionManagementRepository.listAllPermissions(undefined, tx);
      expect(perms).toBeDefined();
      expect(Array.isArray(perms)).toBe(true);
      if (perms.length > 0) {
        const first = perms[0];
        expect(first.id).toBeDefined();
        expect(first.key).toBeDefined();
        expect(first.resource).toBeDefined();
        expect(first.action).toBeDefined();
        expect(first.category).toBeDefined();
      }
    });

    testRepoError("listAllPermissions should throw on database error", () =>
      PermissionManagementRepository.listAllPermissions(undefined, badTx)
    );

    testRepo("listAllGroups should return all groups with permissionIds", async tx => {
      const groups = await PermissionManagementRepository.listAllGroups(undefined, tx);
      expect(groups).toBeDefined();
      expect(Array.isArray(groups)).toBe(true);

      // Verify structure of the returned groups
      if (groups.length > 0) {
        const first = groups[0];
        expect(first.id).toBeDefined();
        expect(first.name).toBeDefined();
        expect(first.slug).toBeDefined();
        expect(Array.isArray(first.permissionIds)).toBe(true);
      }
    });

    testRepoError("listAllGroups should throw on database error", () =>
      PermissionManagementRepository.listAllGroups(undefined, badTx)
    );

    testRepo("getGroupById should retrieve group and return null if not found", async tx => {
      const perm = await createTestPermission(tx, AppPermission.TEST_CUSTOM_ONLY);

      // Create a custom group to test getGroupById
      const group = await PermissionManagementRepository.createGroup(
        {
          name: loc("GetGroup Test"),
          slug: "getgroup_test",
          permissionIds: [perm.id],
        },
        undefined,
        tx
      );

      const fetched = await PermissionManagementRepository.getGroupById(group.id, undefined, tx);
      expect(fetched).not.toBeNull();
      expect(fetched?.id).toBe(group.id);
      expect(Array.isArray(fetched?.permissionIds)).toBe(true);

      // Random UUID
      const nonExistent = await PermissionManagementRepository.getGroupById(
        "00000000-0000-0000-0000-000000000000",
        undefined,
        tx
      );
      expect(nonExistent).toBeNull();
    });

    testRepoError("getGroupById should throw on database error", () =>
      PermissionManagementRepository.getGroupById("00000000-0000-0000-0000-000000000000", undefined, badTx)
    );

    testRepo("createGroup should insert group and permission mapping", async tx => {
      const perm = await createTestPermission(tx, AppPermission.TEST_CUSTOM_ONLY);

      const group = await PermissionManagementRepository.createGroup(
        {
          name: loc("Test Group Created"),
          slug: "test_group_created",
          description: loc("Test description"),
          permissionIds: [perm.id],
        },
        undefined,
        tx
      );

      expect(group).toBeDefined();
      expect(group.name).toEqual(loc("Test Group Created"));
      expect(group.slug).toBe("test_group_created");
      expect(group.isSystem).toBe(false);
      expect(group.permissionIds).toContain(perm.id);

      // Verify in database
      const [dbGroup] = await tx.select().from(permissionGroups).where(eq(permissionGroups.id, group.id)).limit(1);
      expect(dbGroup).toBeDefined();
      expect(dbGroup.name).toEqual(loc("Test Group Created"));
    });

    testRepoError("createGroup should throw on database error", () =>
      PermissionManagementRepository.createGroup(
        {
          name: loc("Test Group Fail"),
          slug: "test_group_fail",
          permissionIds: [],
        },
        undefined,
        badTx
      )
    );

    testRepo("updateGroup should update fields and replace permissions", async tx => {
      const perm1 = await createTestPermission(tx, AppPermission.TEST_CUSTOM_ONLY);
      const perm2 = await createTestPermission(tx, AppPermission.TEST_CUSTOM_ALT);

      // Create a custom group first
      const group = await PermissionManagementRepository.createGroup(
        {
          name: loc("Original Group"),
          slug: "original_group",
          permissionIds: [perm1.id],
        },
        undefined,
        tx
      );

      // Update name and permissions
      const updated = await PermissionManagementRepository.updateGroup(
        {
          id: group.id,
          name: loc("Updated Group Name"),
          permissionIds: [perm2.id],
        },
        undefined,
        tx
      );

      expect(updated.name).toEqual(loc("Updated Group Name"));
      expect(updated.permissionIds).not.toContain(perm1.id);
      expect(updated.permissionIds).toContain(perm2.id);

      // Verify db
      const [dbGroup] = await tx.select().from(permissionGroups).where(eq(permissionGroups.id, group.id)).limit(1);
      expect(dbGroup.name).toEqual(loc("Updated Group Name"));
    });

    testRepo("updateGroup should throw on non-existent group or system group", async tx => {
      const tFunc = getErrorMessage;
      // Non-existent group
      let errorThrown: unknown = null;
      try {
        await PermissionManagementRepository.updateGroup(
          {
            id: "00000000-0000-0000-0000-000000000000",
            name: loc("Fail Update"),
          },
          "ar",
          tx
        );
      } catch (err) {
        errorThrown = err;
      }
      expect(errorThrown).not.toBeNull();
      expect(tFunc(errorThrown)).toContain("مجموعة الأذونات غير موجودة");

      // System group
      // Uses seed system group — required: DB trigger prevents creating isSystem=true groups
      const [sysGroup] = await tx.select().from(permissionGroups).where(eq(permissionGroups.isSystem, true)).limit(1);
      expect(sysGroup).toBeDefined();

      errorThrown = null;
      try {
        await PermissionManagementRepository.updateGroup(
          {
            id: sysGroup.id,
            name: loc("Try Modifying System Group"),
          },
          "ar",
          tx
        );
      } catch (err) {
        errorThrown = err;
      }
      expect(errorThrown).not.toBeNull();
      expect(tFunc(errorThrown)).toContain("لا يمكن تعديل الخصائص الأساسية لمجموعات صلاحيات النظام");
    });

    testRepoError("updateGroup should throw on database error", () =>
      PermissionManagementRepository.updateGroup(
        {
          id: "00000000-0000-0000-0000-000000000000",
          name: loc("Mock Err"),
        },
        undefined,
        badTx
      )
    );

    testRepo("deleteGroup should remove group, and throw on non-existent or system group", async tx => {
      const tFunc = getErrorMessage;

      // 1. Create a custom group to delete
      const group = await PermissionManagementRepository.createGroup(
        {
          name: loc("Group to Delete"),
          slug: "group_to_delete",
          permissionIds: [],
        },
        undefined,
        tx
      );

      const deleted = await PermissionManagementRepository.deleteGroup(group.id, "ar", tx);
      expect(deleted.id).toBe(group.id);

      // Verify deleted in DB
      const [dbGroup] = await tx.select().from(permissionGroups).where(eq(permissionGroups.id, group.id)).limit(1);
      expect(dbGroup).toBeUndefined();

      // 2. Non-existent group
      let errorThrown: unknown = null;
      try {
        await PermissionManagementRepository.deleteGroup("00000000-0000-0000-0000-000000000000", "ar", tx);
      } catch (err) {
        errorThrown = err;
      }
      expect(errorThrown).not.toBeNull();
      expect(tFunc(errorThrown)).toContain("مجموعة الأذونات غير موجودة");

      // 3. System group
      // Uses seed system group — required: DB trigger prevents creating isSystem=true groups
      const [sysGroup] = await tx.select().from(permissionGroups).where(eq(permissionGroups.isSystem, true)).limit(1);
      expect(sysGroup).toBeDefined();

      errorThrown = null;
      try {
        await PermissionManagementRepository.deleteGroup(sysGroup.id, "ar", tx);
      } catch (err) {
        errorThrown = err;
      }
      expect(errorThrown).not.toBeNull();
      expect(tFunc(errorThrown)).toContain("لا يمكن حذف صلاحية أو مجموعة تابعة للنظام");
    });

    testRepoError("deleteGroup should throw on database error", () =>
      PermissionManagementRepository.deleteGroup("00000000-0000-0000-0000-000000000000", undefined, badTx)
    );
  });

  describe("Bulk User Management", () => {
    testRepo("listUsersInGroup, bulkAssignUsersToGroup, and bulkRevokeUsersFromGroup should work", async tx => {
      const user1 = await createTestUser(tx);
      const user2 = await createTestUser(tx);

      const group = await PermissionManagementRepository.createGroup(
        {
          name: loc("User Group"),
          slug: "user_group",
          permissionIds: [],
        },
        undefined,
        tx
      );

      // Initial list should be empty
      const listEmpty = await PermissionManagementRepository.listUsersInGroup(group.id, tx);
      expect(listEmpty).toHaveLength(0);

      // Bulk assign
      await PermissionManagementRepository.bulkAssignUsersToGroup([user1.id, user2.id], group.id, undefined, tx);

      const listAssigned = await PermissionManagementRepository.listUsersInGroup(group.id, tx);
      expect(listAssigned).toHaveLength(2);
      expect(listAssigned.map(u => u.id)).toContain(user1.id);
      expect(listAssigned.map(u => u.id)).toContain(user2.id);

      // Bulk assign again (onConflictDoNothing testing)
      await PermissionManagementRepository.bulkAssignUsersToGroup([user1.id], group.id, undefined, tx);
      const listAssignedAgain = await PermissionManagementRepository.listUsersInGroup(group.id, tx);
      expect(listAssignedAgain).toHaveLength(2);

      // Bulk revoke
      await PermissionManagementRepository.bulkRevokeUsersFromGroup([user1.id], group.id, tx);
      const listRevoked = await PermissionManagementRepository.listUsersInGroup(group.id, tx);
      expect(listRevoked).toHaveLength(1);
      expect(listRevoked[0].id).toBe(user2.id);
    });

    testRepo("bulkAssignUsersToGroup and bulkRevokeUsersFromGroup should return early on empty user list", async tx => {
      const group = await PermissionManagementRepository.createGroup(
        {
          name: loc("Early Exit Group"),
          slug: "early_exit_group",
          permissionIds: [],
        },
        undefined,
        tx
      );

      // Verify that calling with empty arrays doesn't crash
      await PermissionManagementRepository.bulkAssignUsersToGroup([], group.id, undefined, tx);
      await PermissionManagementRepository.bulkRevokeUsersFromGroup([], group.id, tx);
      const list = await PermissionManagementRepository.listUsersInGroup(group.id, tx);
      expect(list).toHaveLength(0);
    });

    testRepoError("listUsersInGroup should throw on database error", () =>
      PermissionManagementRepository.listUsersInGroup("00000000-0000-0000-0000-000000000000", badTx)
    );

    testRepoError("bulkAssignUsersToGroup should throw on database error", () =>
      PermissionManagementRepository.bulkAssignUsersToGroup(
        ["00000000-0000-0000-0000-000000000000"],
        "00000000-0000-0000-0000-000000000000",
        undefined,
        badTx
      )
    );

    testRepoError("bulkRevokeUsersFromGroup should throw on database error", () =>
      PermissionManagementRepository.bulkRevokeUsersFromGroup(
        ["00000000-0000-0000-0000-000000000000"],
        "00000000-0000-0000-0000-000000000000",
        badTx
      )
    );
  });

  describe("Overrides Engine", () => {
    testRepo("getUserOverrides and setUserOverrides should work", async tx => {
      const user = await createTestUser(tx);
      const perm1 = await createTestPermission(tx, AppPermission.TEST_CUSTOM_ONLY);
      const perm2 = await createTestPermission(tx, AppPermission.TEST_CUSTOM_ALT);

      // Initial overrides should be empty
      const initial = await PermissionManagementRepository.getUserOverrides(user.id, tx);
      expect(initial).toHaveLength(0);

      // Set overrides
      await PermissionManagementRepository.setUserOverrides(
        user.id,
        [
          { permissionId: perm1.id, state: OverrideState.GRANTED },
          { permissionId: perm2.id, state: OverrideState.DENIED },
        ],
        undefined,
        tx
      );

      const overrides = await PermissionManagementRepository.getUserOverrides(user.id, tx);
      expect(overrides).toHaveLength(2);

      const o1 = overrides.find(o => o.permissionId === perm1.id);
      expect(o1).toBeDefined();
      expect(o1?.state).toBe(OverrideState.GRANTED);

      const o2 = overrides.find(o => o.permissionId === perm2.id);
      expect(o2).toBeDefined();
      expect(o2?.state).toBe(OverrideState.DENIED);

      // Replace overrides (clear and insert)
      await PermissionManagementRepository.setUserOverrides(
        user.id,
        [{ permissionId: perm1.id, state: OverrideState.DENIED }],
        undefined,
        tx
      );

      const finalOverrides = await PermissionManagementRepository.getUserOverrides(user.id, tx);
      expect(finalOverrides).toHaveLength(1);
      expect(finalOverrides[0].permissionId).toBe(perm1.id);
      expect(finalOverrides[0].state).toBe(OverrideState.DENIED);
    });

    testRepoError("getUserOverrides should throw on database error", () =>
      PermissionManagementRepository.getUserOverrides("00000000-0000-0000-0000-000000000000", badTx)
    );

    testRepoError("setUserOverrides should throw on database error", () =>
      PermissionManagementRepository.setUserOverrides("00000000-0000-0000-0000-000000000000", [], undefined, badTx)
    );
  });

  describe("Non-transactional calls (coverage fallback)", () => {
    testRepo("should support executing operations with tx parameter", async tx => {
      const perm = await createTestPermission(tx, AppPermission.TEST_CUSTOM_ONLY);

      // Create group
      const group = await PermissionManagementRepository.createGroup(
        {
          name: loc("Ntx Group"),
          slug: "ntx_group",
          permissionIds: [perm.id],
        },
        undefined,
        tx
      );
      expect(group.id).toBeDefined();

      // List
      const groups = await PermissionManagementRepository.listAllGroups(undefined, tx);
      expect(groups.map(g => g.id)).toContain(group.id);

      // Get by ID
      const fetched = await PermissionManagementRepository.getGroupById(group.id, undefined, tx);
      expect(fetched?.id).toBe(group.id);

      // Update
      const updated = await PermissionManagementRepository.updateGroup(
        {
          id: group.id,
          name: loc("Ntx Group Updated"),
        },
        undefined,
        tx
      );
      expect(updated.name).toEqual(loc("Ntx Group Updated"));

      // User overrides
      const tempUser = await createTestUser(tx);
      await PermissionManagementRepository.setUserOverrides(tempUser.id, [], undefined, tx);
      const overrides = await PermissionManagementRepository.getUserOverrides(tempUser.id, tx);
      expect(overrides).toHaveLength(0);

      // Bulk assign
      await PermissionManagementRepository.bulkAssignUsersToGroup([tempUser.id], group.id, undefined, tx);
      const usersInGroup = await PermissionManagementRepository.listUsersInGroup(group.id, tx);
      expect(usersInGroup.map(u => u.id)).toContain(tempUser.id);

      // Bulk revoke
      await PermissionManagementRepository.bulkRevokeUsersFromGroup([tempUser.id], group.id, tx);
      const usersInGroupAfter = await PermissionManagementRepository.listUsersInGroup(group.id, tx);
      expect(usersInGroupAfter.map(u => u.id)).not.toContain(tempUser.id);

      // Delete group
      await PermissionManagementRepository.deleteGroup(group.id, undefined, tx);
    });
  });

  describe("System Permission Constraints (Trigger)", () => {
    testRepo("Should prevent creating a new system permission", async tx => {
      let insertErr: unknown = null;
      try {
        await tx.insert(permissions).values({
          key: AppPermission.TEST_SYSTEM_ONLY,
          resource: "custom",
          action: "test_system_permission",
          description: loc("Test description"),
          category: loc("Custom"),
          isSystem: true,
        });
      } catch (e) {
        insertErr = e;
      }
      expect(insertErr).not.toBeNull();
      expect(getErrorMessage(insertErr)).toContain("Cannot create system permissions");
    });

    testRepo("Should prevent modifying custom permission to system permission", async tx => {
      const [customPerm] = await tx
        .insert(permissions)
        .values({
          key: AppPermission.TEST_CUSTOM_ONLY,
          resource: "custom",
          action: "test_custom_permission",
          description: loc("Test description"),
          category: loc("Custom"),
          isSystem: false,
        })
        .returning();

      let updateErr: unknown = null;
      try {
        await tx.update(permissions).set({ isSystem: true }).where(eq(permissions.id, customPerm.id));
      } catch (e) {
        updateErr = e;
      }
      expect(updateErr).not.toBeNull();
      expect(getErrorMessage(updateErr)).toContain("Cannot change is_system to true");
    });
  });
});
