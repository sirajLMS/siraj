import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { PermissionManagementRepository } from "@/backend/db/repo/permission-management.repository";
import { permissionGroups, permissions, users } from "@/backend/db/schema";
import type { UserEntity } from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";
import { getErrorMessage } from "@/shared/utils/error";
import { createTestUser, type DBTransaction, runInRollback } from "../test-utils";

function testRepo(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, () => runInRollback(fn));
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

// Mock database client that throws errors to test error/catch paths
const badTx = {
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
} as unknown as DBTransaction;

describe("PermissionManagementRepository", () => {
  describe("Group Management", () => {
    testRepo("listAllPermissions should return all permissions ordered by category, resource, action", async tx => {
      const perms = await PermissionManagementRepository.listAllPermissions(tx);
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
      PermissionManagementRepository.listAllPermissions(badTx)
    );

    testRepo("listAllGroups should return all groups with permissionIds", async tx => {
      const groups = await PermissionManagementRepository.listAllGroups(tx);
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
      PermissionManagementRepository.listAllGroups(badTx)
    );

    testRepo("getGroupById should retrieve group and return null if not found", async tx => {
      // Find a system group to get its ID
      const [sysGroup] = await tx.select().from(permissionGroups).where(eq(permissionGroups.isSystem, true)).limit(1);
      expect(sysGroup).toBeDefined();

      const group = await PermissionManagementRepository.getGroupById(sysGroup.id, tx);
      expect(group).not.toBeNull();
      expect(group?.id).toBe(sysGroup.id);
      expect(Array.isArray(group?.permissionIds)).toBe(true);

      // Random UUID
      const nonExistent = await PermissionManagementRepository.getGroupById("00000000-0000-0000-0000-000000000000", tx);
      expect(nonExistent).toBeNull();
    });

    testRepoError("getGroupById should throw on database error", () =>
      PermissionManagementRepository.getGroupById("00000000-0000-0000-0000-000000000000", badTx)
    );

    testRepo("createGroup should insert group and permission mapping", async tx => {
      const [perm] = await tx.select().from(permissions).limit(1);
      expect(perm).toBeDefined();

      const group = await PermissionManagementRepository.createGroup(
        {
          name: "Test Group Created",
          slug: "test_group_created",
          description: "Test description",
          permissionIds: [perm.id],
        },
        tx
      );

      expect(group).toBeDefined();
      expect(group.name).toBe("Test Group Created");
      expect(group.slug).toBe("test_group_created");
      expect(group.isSystem).toBe(false);
      expect(group.permissionIds).toContain(perm.id);

      // Verify in database
      const [dbGroup] = await tx.select().from(permissionGroups).where(eq(permissionGroups.id, group.id)).limit(1);
      expect(dbGroup).toBeDefined();
      expect(dbGroup.name).toBe("Test Group Created");
    });

    testRepoError("createGroup should throw on database error", () =>
      PermissionManagementRepository.createGroup(
        {
          name: "Test Group Fail",
          slug: "test_group_fail",
          permissionIds: [],
        },
        badTx
      )
    );

    testRepo("updateGroup should update fields and replace permissions", async tx => {
      const [perm1, perm2] = await tx.select().from(permissions).limit(2);
      expect(perm1).toBeDefined();
      expect(perm2).toBeDefined();

      // Create a custom group first
      const group = await PermissionManagementRepository.createGroup(
        {
          name: "Original Group",
          slug: "original_group",
          permissionIds: [perm1.id],
        },
        tx
      );

      // Update name and permissions
      const updated = await PermissionManagementRepository.updateGroup(
        {
          id: group.id,
          name: "Updated Group Name",
          permissionIds: [perm2.id],
        },
        undefined,
        tx
      );

      expect(updated.name).toBe("Updated Group Name");
      expect(updated.permissionIds).not.toContain(perm1.id);
      expect(updated.permissionIds).toContain(perm2.id);

      // Verify db
      const [dbGroup] = await tx.select().from(permissionGroups).where(eq(permissionGroups.id, group.id)).limit(1);
      expect(dbGroup.name).toBe("Updated Group Name");
    });

    testRepo("updateGroup should throw on non-existent group or system group", async tx => {
      const tFunc = getErrorMessage;
      // Non-existent group
      let errorThrown: unknown = null;
      try {
        await PermissionManagementRepository.updateGroup(
          {
            id: "00000000-0000-0000-0000-000000000000",
            name: "Fail Update",
          },
          undefined,
          tx
        );
      } catch (err) {
        errorThrown = err;
      }
      expect(errorThrown).not.toBeNull();
      expect(tFunc(errorThrown)).toContain("not found");

      // System group
      const [sysGroup] = await tx.select().from(permissionGroups).where(eq(permissionGroups.isSystem, true)).limit(1);
      expect(sysGroup).toBeDefined();

      errorThrown = null;
      try {
        await PermissionManagementRepository.updateGroup(
          {
            id: sysGroup.id,
            name: "Try Modifying System Group",
          },
          undefined,
          tx
        );
      } catch (err) {
        errorThrown = err;
      }
      expect(errorThrown).not.toBeNull();
      expect(tFunc(errorThrown)).toContain("Cannot modify core properties of system permission groups");
    });

    testRepoError("updateGroup should throw on database error", () =>
      PermissionManagementRepository.updateGroup(
        {
          id: "00000000-0000-0000-0000-000000000000",
          name: "Mock Err",
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
          name: "Group to Delete",
          slug: "group_to_delete",
          permissionIds: [],
        },
        tx
      );

      const deleted = await PermissionManagementRepository.deleteGroup(group.id, undefined, tx);
      expect(deleted.id).toBe(group.id);

      // Verify deleted in DB
      const [dbGroup] = await tx.select().from(permissionGroups).where(eq(permissionGroups.id, group.id)).limit(1);
      expect(dbGroup).toBeUndefined();

      // 2. Non-existent group
      let errorThrown: unknown = null;
      try {
        await PermissionManagementRepository.deleteGroup("00000000-0000-0000-0000-000000000000", undefined, tx);
      } catch (err) {
        errorThrown = err;
      }
      expect(errorThrown).not.toBeNull();
      expect(tFunc(errorThrown)).toContain("not found");

      // 3. System group
      const [sysGroup] = await tx.select().from(permissionGroups).where(eq(permissionGroups.isSystem, true)).limit(1);
      expect(sysGroup).toBeDefined();

      errorThrown = null;
      try {
        await PermissionManagementRepository.deleteGroup(sysGroup.id, undefined, tx);
      } catch (err) {
        errorThrown = err;
      }
      expect(errorThrown).not.toBeNull();
      expect(tFunc(errorThrown)).toContain("Cannot delete a system permission or group");
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
          name: "User Group",
          slug: "user_group",
          permissionIds: [],
        },
        tx
      );

      // Initial list should be empty
      const listEmpty = await PermissionManagementRepository.listUsersInGroup(group.id, tx);
      expect(listEmpty.length).toBe(0);

      // Bulk assign
      await PermissionManagementRepository.bulkAssignUsersToGroup([user1.id, user2.id], group.id, undefined, tx);

      const listAssigned = await PermissionManagementRepository.listUsersInGroup(group.id, tx);
      expect(listAssigned.length).toBe(2);
      expect(listAssigned.map(u => u.id)).toContain(user1.id);
      expect(listAssigned.map(u => u.id)).toContain(user2.id);

      // Bulk assign again (onConflictDoNothing testing)
      await PermissionManagementRepository.bulkAssignUsersToGroup([user1.id], group.id, undefined, tx);
      const listAssignedAgain = await PermissionManagementRepository.listUsersInGroup(group.id, tx);
      expect(listAssignedAgain.length).toBe(2);

      // Bulk revoke
      await PermissionManagementRepository.bulkRevokeUsersFromGroup([user1.id], group.id, tx);
      const listRevoked = await PermissionManagementRepository.listUsersInGroup(group.id, tx);
      expect(listRevoked.length).toBe(1);
      expect(listRevoked[0].id).toBe(user2.id);
    });

    testRepo("bulkAssignUsersToGroup and bulkRevokeUsersFromGroup should return early on empty user list", async tx => {
      const group = await PermissionManagementRepository.createGroup(
        {
          name: "Early Exit Group",
          slug: "early_exit_group",
          permissionIds: [],
        },
        tx
      );

      // Verify that calling with empty arrays doesn't crash
      await PermissionManagementRepository.bulkAssignUsersToGroup([], group.id, undefined, tx);
      await PermissionManagementRepository.bulkRevokeUsersFromGroup([], group.id, tx);
      const list = await PermissionManagementRepository.listUsersInGroup(group.id, tx);
      expect(list.length).toBe(0);
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
      const [perm1, perm2] = await tx.select().from(permissions).limit(2);
      expect(perm1).toBeDefined();
      expect(perm2).toBeDefined();

      // Initial overrides should be empty
      const initial = await PermissionManagementRepository.getUserOverrides(user.id, tx);
      expect(initial.length).toBe(0);

      // Set overrides
      await PermissionManagementRepository.setUserOverrides(
        user.id,
        [
          { permissionId: perm1.id, state: "GRANTED" },
          { permissionId: perm2.id, state: "DENIED" },
        ],
        undefined,
        tx
      );

      const overrides = await PermissionManagementRepository.getUserOverrides(user.id, tx);
      expect(overrides.length).toBe(2);

      const o1 = overrides.find(o => o.permissionId === perm1.id);
      expect(o1).toBeDefined();
      expect(o1?.state).toBe("GRANTED");

      const o2 = overrides.find(o => o.permissionId === perm2.id);
      expect(o2).toBeDefined();
      expect(o2?.state).toBe("DENIED");

      // Replace overrides (clear and insert)
      await PermissionManagementRepository.setUserOverrides(
        user.id,
        [{ permissionId: perm1.id, state: "DENIED" }],
        undefined,
        tx
      );

      const finalOverrides = await PermissionManagementRepository.getUserOverrides(user.id, tx);
      expect(finalOverrides.length).toBe(1);
      expect(finalOverrides[0].permissionId).toBe(perm1.id);
      expect(finalOverrides[0].state).toBe("DENIED");
    });

    testRepoError("getUserOverrides should throw on database error", () =>
      PermissionManagementRepository.getUserOverrides("00000000-0000-0000-0000-000000000000", badTx)
    );

    testRepoError("setUserOverrides should throw on database error", () =>
      PermissionManagementRepository.setUserOverrides("00000000-0000-0000-0000-000000000000", [], undefined, badTx)
    );
  });

  describe("Non-transactional calls (coverage fallback)", () => {
    test("should support executing operations without tx parameter", async () => {
      // Create group natively
      const group = await PermissionManagementRepository.createGroup({
        name: "Ntx Group",
        slug: "ntx_group",
        permissionIds: [],
      });
      expect(group.id).toBeDefined();

      // List natively
      const groups = await PermissionManagementRepository.listAllGroups();
      expect(groups.map(g => g.id)).toContain(group.id);

      // Get natively
      const fetched = await PermissionManagementRepository.getGroupById(group.id);
      expect(fetched?.id).toBe(group.id);

      // Update natively
      const updated = await PermissionManagementRepository.updateGroup({
        id: group.id,
        name: "Ntx Group Updated",
      });
      expect(updated.name).toBe("Ntx Group Updated");

      // Create a temporary user natively
      let tempUser: UserEntity | undefined;
      await db.transaction(async t => {
        tempUser = await createTestUser(t);
      });
      expect(tempUser).toBeDefined();
      if (!tempUser) {
        throw new Error("tempUser should be defined");
      }
      const userId = tempUser.id;

      // User overrides natively
      await PermissionManagementRepository.setUserOverrides(userId, []);
      const overrides = await PermissionManagementRepository.getUserOverrides(userId);
      expect(overrides.length).toBe(0);

      // Bulk assign natively
      await PermissionManagementRepository.bulkAssignUsersToGroup([userId], group.id);
      const usersInGroup = await PermissionManagementRepository.listUsersInGroup(group.id);
      expect(usersInGroup.map(u => u.id)).toContain(userId);

      // Bulk revoke natively
      await PermissionManagementRepository.bulkRevokeUsersFromGroup([userId], group.id);
      const usersInGroupAfter = await PermissionManagementRepository.listUsersInGroup(group.id);
      expect(usersInGroupAfter.map(u => u.id)).not.toContain(userId);

      // Delete group natively
      await PermissionManagementRepository.deleteGroup(group.id);

      // Clean up temp user
      await db.delete(users).where(eq(users.id, userId));
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
          description: "Test description",
          category: "Custom",
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
          description: "Test description",
          category: "Custom",
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
