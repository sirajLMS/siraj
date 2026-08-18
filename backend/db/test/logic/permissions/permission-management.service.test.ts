import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, like, sql } from "drizzle-orm";
import { db } from "@/backend/db";
import { groupPermissions, permissionGroups, permissions, users } from "@/backend/db/schema";
import { runInRollback } from "@/backend/db/test/test-utils";
import { AppPermission, OverrideState, UserRole } from "@/backend/enum";
import { PermissionManagementService, PermissionsService } from "@/backend/services";
import type { UserPermissionContext } from "@/backend/types";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import { getErrorMessage } from "@/shared/utils/error";

let tErrors: ErrorsLabels;

function loc(en: string, ar?: string) {
  return { ar: ar ?? en, en };
}

async function assertThrows(fn: () => Promise<unknown>, message: string) {
  let err: unknown = null;
  try {
    await fn();
  } catch (e) {
    err = e;
  }
  expect(err).not.toBeNull();
  expect(getErrorMessage(err)).toContain(message);
}

let testSystemGroupId: string;

async function getSystemGroup() {
  const [sysGroup] = await db
    .select()
    .from(permissionGroups)
    .where(eq(permissionGroups.id, testSystemGroupId))
    .limit(1);
  expect(sysGroup).toBeDefined();
  return sysGroup;
}

async function restoreSystemGroupPermissions(
  groupId: string,
  originalPerms: ReadonlyArray<{ groupId: string; permissionId: string }>
): Promise<void> {
  await db.delete(groupPermissions).where(eq(groupPermissions.groupId, groupId));
  if (originalPerms.length > 0) {
    await db
      .insert(groupPermissions)
      .values(originalPerms.map(p => ({ groupId: p.groupId, permissionId: p.permissionId })));
  }
}

const manageContext = (): UserPermissionContext => ({
  permissions: [AppPermission.PERMISSION_GROUPS_MANAGE],
  permissionGroups: ["admin_group"],
  isSuperAdmin: false,
  role: UserRole.ACADEMY_ADMIN,
});

const assignContext = (): UserPermissionContext => ({
  permissions: [AppPermission.PERMISSION_GROUPS_ASSIGN],
  permissionGroups: ["assigner_group"],
  isSuperAdmin: false,
  role: UserRole.STAFF,
});

const userContext = (): UserPermissionContext => ({
  permissions: [],
  permissionGroups: [],
  isSuperAdmin: false,
  role: UserRole.USER,
});

const superAdminContext = (): UserPermissionContext => ({
  permissions: [],
  permissionGroups: [],
  isSuperAdmin: true,
  role: UserRole.SUPER_ADMIN,
});

describe("PermissionManagementService Business Logic", () => {
  let adminUser: typeof users.$inferSelect;
  let regularUser: typeof users.$inferSelect;
  let superAdminUser: typeof users.$inferSelect;
  let testPerm1: typeof permissions.$inferSelect | undefined;
  let testPerm2: typeof permissions.$inferSelect | undefined;

  // Track groups created by this test file for targeted cleanup (avoid wiping parallel tests' data)
  const createdGroupIds = new Set<string>();

  // Track original getUserContext to restore later
  const originalGetUserContext = PermissionsService.getUserContext;
  let mockContext: UserPermissionContext | null = null;

  function testSystemGroupGuard(
    name: string,
    contextFn: () => UserPermissionContext,
    action: (groupId: string) => Promise<unknown>,
    expectedError: string
  ) {
    test(name, async () => {
      mockContext = contextFn();
      const sysGroup = await getSystemGroup();
      await assertThrows(() => action(sysGroup.id), expectedError);
    });
  }

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    // Override PermissionsService.getUserContext to return mock context if set
    PermissionsService.getUserContext = async (userId: string): Promise<UserPermissionContext> => {
      if (mockContext) {
        return mockContext;
      }
      return originalGetUserContext(userId);
    };

    const now = new Date();
    // Create test users directly in DB so they are visible to global db queries
    [adminUser] = await db
      .insert(users)
      .values({
        name: "Service Admin User",
        email: `svc-adm-${randomUUID().slice(0, 8)}@example.com`,
        password: "password",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    [regularUser] = await db
      .insert(users)
      .values({
        name: "Service Regular User",
        email: `svc-reg-${randomUUID().slice(0, 8)}@example.com`,
        password: "password",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    [superAdminUser] = await db
      .insert(users)
      .values({
        name: "Service SuperAdmin User",
        email: `svc-sa-${randomUUID().slice(0, 8)}@example.com`,
        password: "password",
        isSuperAdmin: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Insert test permissions for tests that need them
    const existing1 = await db
      .select()
      .from(permissions)
      .where(eq(permissions.key, AppPermission.TEST_CUSTOM_ONLY))
      .limit(1);

    if (existing1.length > 0) {
      testPerm1 = existing1[0];
    } else {
      [testPerm1] = await db
        .insert(permissions)
        .values({
          key: AppPermission.TEST_CUSTOM_ONLY,
          resource: "test",
          action: "test_action_1",
          description: loc("Test permission 1"),
          category: loc("Test"),
          isSystem: false,
        })
        .returning();
    }

    const existing2 = await db
      .select()
      .from(permissions)
      .where(eq(permissions.key, AppPermission.TEST_CUSTOM_ALT))
      .limit(1);

    if (existing2.length > 0) {
      testPerm2 = existing2[0];
    } else {
      [testPerm2] = await db
        .insert(permissions)
        .values({
          key: AppPermission.TEST_CUSTOM_ALT,
          resource: "test",
          action: "test_action_2",
          description: loc("Test permission 2"),
          category: loc("Test"),
          isSystem: false,
        })
        .returning();
    }

    // Create a test system group (trigger only blocks UPDATE/DELETE of system groups, not INSERT)
    const [testSysGroup] = await db
      .insert(permissionGroups)
      .values({
        name: loc("Service Test System Group"),
        slug: `svc-sys-group-${randomUUID().slice(0, 8)}`,
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    testSystemGroupId = testSysGroup.id;
  });

  afterAll(async () => {
    // Restore original getUserContext
    PermissionsService.getUserContext = originalGetUserContext;

    // Cleanup users
    await db.delete(users).where(like(users.email, "service-test-%"));

    // Cleanup test permissions
    await db.delete(permissions).where(eq(permissions.key, AppPermission.TEST_CUSTOM_ONLY));
    await db.delete(permissions).where(eq(permissions.key, AppPermission.TEST_CUSTOM_ALT));

    // Cleanup test system group — disable trigger to allow DELETE of isSystem=true group
    await db.execute(sql`ALTER TABLE permission_groups DISABLE TRIGGER trg_protect_system_permission_groups`);
    try {
      await db.delete(permissionGroups).where(eq(permissionGroups.id, testSystemGroupId));
    } finally {
      await db.execute(sql`ALTER TABLE permission_groups ENABLE TRIGGER trg_protect_system_permission_groups`);
    }
  });

  afterEach(async () => {
    mockContext = null;
    // Only delete groups this test file created — avoid wiping parallel tests' data
    const deletePromises = Array.from(createdGroupIds).map(groupId =>
      db
        .delete(permissionGroups)
        .where(eq(permissionGroups.id, groupId))
        .catch(() => {})
    );
    await Promise.all(deletePromises);
    createdGroupIds.clear();
  });

  describe("Access Control (Authorization Guards)", () => {
    test("listPermissions should throw unauthorized for non-admin", async () => {
      mockContext = userContext();
      await assertThrows(
        () => PermissionManagementService.listPermissions(regularUser.id, tErrors),
        "You do not have sufficient permissions to perform this action."
      );
    });

    test("listPermissions should allow admin with manage permission", async () => {
      mockContext = manageContext();

      const perms = await PermissionManagementService.listPermissions(adminUser.id, tErrors);
      expect(perms).toBeDefined();
      expect(perms.length).toBeGreaterThan(0);
    });

    test("listPermissions should allow superadmin", async () => {
      mockContext = superAdminContext();

      const perms = await PermissionManagementService.listPermissions(superAdminUser.id, tErrors);
      expect(perms).toBeDefined();
      expect(perms.length).toBeGreaterThan(0);
    });
  });

  describe("Group CRUD Validation", () => {
    test("createGroup should throw if name is empty", async () => {
      mockContext = manageContext();
      await assertThrows(
        () => PermissionManagementService.createGroup(adminUser.id, { name: loc("   "), permissionIds: [] }, tErrors),
        "Permission group name is required"
      );
    });

    test("createGroup should throw if name too long", async () => {
      mockContext = manageContext();
      await assertThrows(
        () =>
          PermissionManagementService.createGroup(
            adminUser.id,
            { name: loc("a".repeat(256)), permissionIds: [] },
            tErrors
          ),
        "Permission group name is too long (max 255 characters)."
      );
    });

    test("createGroup should auto-generate slug and succeed", async () => {
      mockContext = manageContext();

      const group = await PermissionManagementService.createGroup(
        adminUser.id,
        {
          name: loc("My Custom Group & Permissions!!"),
          description: loc("Custom group description"),
          permissionIds: testPerm1 ? [testPerm1.id] : [],
        },
        tErrors
      );
      createdGroupIds.add(group.id);

      expect(group).toBeDefined();
      expect(group.name).toEqual(loc("My Custom Group & Permissions!!"));
      expect(group.slug).toBe("my_custom_group_permissions");
      expect(group.description).toEqual(loc("Custom group description"));
      if (testPerm1) {
        expect(group.permissionIds).toContain(testPerm1.id);
      }
    });

    test("updateGroup should trim and validate updated fields", async () => {
      mockContext = manageContext();

      const group = await PermissionManagementService.createGroup(
        adminUser.id,
        {
          name: loc("Initial Group"),
          permissionIds: [],
        },
        tErrors
      );
      createdGroupIds.add(group.id);

      const updated = await PermissionManagementService.updateGroup(
        adminUser.id,
        {
          groupId: group.id,
          name: loc("Updated Group Name"),
          description: loc("   Updated description   "),
        },
        tErrors
      );

      expect(updated.name).toEqual(loc("Updated Group Name"));
      expect(updated.slug).toBe("updated_group_name");
      expect(updated.description).toEqual(loc("Updated description"));
    });

    test("updateGroup on system group with permissionIds should succeed and update permissions", async () => {
      mockContext = manageContext();
      const sysGroup = await getSystemGroup();

      const originalPerms = await db.select().from(groupPermissions).where(eq(groupPermissions.groupId, sysGroup.id));

      const testPermId = testPerm1?.id ?? "";
      const updated = await PermissionManagementService.updateGroup(
        adminUser.id,
        { groupId: sysGroup.id, permissionIds: [testPermId] },
        tErrors,
        "en"
      );

      expect(updated.isSystem).toBe(true);
      expect(updated.permissionIds).toEqual([testPermId]);

      const afterPerms = await db.select().from(groupPermissions).where(eq(groupPermissions.groupId, sysGroup.id));
      expect(afterPerms).toHaveLength(1);
      expect(afterPerms[0].permissionId).toBe(testPermId);

      await restoreSystemGroupPermissions(sysGroup.id, originalPerms);
    });

    test("updateGroup on system group with name change should succeed but name NOT changed", async () => {
      mockContext = manageContext();
      const sysGroup = await getSystemGroup();
      const originalName = sysGroup.name;

      const updated = await PermissionManagementService.updateGroup(
        adminUser.id,
        { groupId: sysGroup.id, name: loc("New System Name") },
        tErrors,
        "en"
      );

      expect(updated.isSystem).toBe(true);
      expect(updated.name).toEqual(originalName);
    });

    test("updateGroup on system group with permissionIds: [] should succeed and clear all permissions", async () => {
      mockContext = manageContext();
      const sysGroup = await getSystemGroup();

      const originalPerms = await db.select().from(groupPermissions).where(eq(groupPermissions.groupId, sysGroup.id));

      const updated = await PermissionManagementService.updateGroup(
        adminUser.id,
        { groupId: sysGroup.id, permissionIds: [] },
        tErrors,
        "en"
      );

      expect(updated.isSystem).toBe(true);
      expect(updated.permissionIds).toEqual([]);

      const afterPerms = await db.select().from(groupPermissions).where(eq(groupPermissions.groupId, sysGroup.id));
      expect(afterPerms).toHaveLength(0);

      await restoreSystemGroupPermissions(sysGroup.id, originalPerms);
    });

    testSystemGroupGuard(
      "deleteGroup on system group should throw cannotDeleteSystemPermissionGroup",
      manageContext,
      groupId => PermissionManagementService.deleteGroup(adminUser.id, groupId, tErrors, "ar"),
      "لا يمكن حذف صلاحية أو مجموعة تابعة للنظام"
    );
  });

  describe("User Assignment Logic", () => {
    test("assignGroupToUser and revokeGroupFromUser should work for authorized user", async () => {
      mockContext = assignContext();

      const group = await db.transaction(async tx => {
        const [g] = await tx
          .insert(permissionGroups)
          .values({
            name: loc("Assign Test Group"),
            slug: "assign_test_group",
            createdAt: new Date(),
            updatedAt: new Date(),
            isSystem: false,
          })
          .returning();
        return g;
      });
      createdGroupIds.add(group.id);

      // Verify list initially empty
      let userGroups = await PermissionManagementService.listGroupsForUser(adminUser.id, regularUser.id, tErrors);
      expect(userGroups).not.toContain(group.id);

      // Assign
      await PermissionManagementService.assignGroupToUser(
        adminUser.id,
        {
          userId: regularUser.id,
          groupId: group.id,
        },
        tErrors
      );

      userGroups = await PermissionManagementService.listGroupsForUser(adminUser.id, regularUser.id, tErrors);
      expect(userGroups).toContain(group.id);

      // Revoke
      await PermissionManagementService.revokeGroupFromUser(
        adminUser.id,
        {
          userId: regularUser.id,
          groupId: group.id,
        },
        tErrors
      );

      userGroups = await PermissionManagementService.listGroupsForUser(adminUser.id, regularUser.id, tErrors);
      expect(userGroups).not.toContain(group.id);
    });

    testSystemGroupGuard(
      "revokeGroupFromUser on SuperAdmin should throw cannotModifySuperAdmin",
      assignContext,
      groupId =>
        PermissionManagementService.revokeGroupFromUser(
          adminUser.id,
          {
            userId: superAdminUser.id,
            groupId,
          },
          tErrors
        ),
      "Cannot modify super admin user."
    );
  });

  describe("System Permission Database Constraints", () => {
    test("should prevent creating a new system permission", async () => {
      await runInRollback(async tx => {
        let err: unknown = null;
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
          err = e;
        }
        expect(err).not.toBeNull();
        expect(getErrorMessage(err)).toContain("Cannot create system permissions");
      });
    });

    test("should prevent modifying custom permission to system permission", async () => {
      expect(testPerm1).toBeDefined();
      if (!testPerm1) throw new Error("testPerm1 missing");
      const perm1Id = testPerm1.id;
      await runInRollback(async tx => {
        let err: unknown = null;
        try {
          await tx.update(permissions).set({ isSystem: true }).where(eq(permissions.id, perm1Id));
        } catch (e) {
          err = e;
        }

        expect(err).not.toBeNull();
        expect(getErrorMessage(err)).toContain("Cannot change is_system to true");
      });
    });
  });

  describe("Bulk Assignment & Self-Demotion Guards", () => {
    test("bulkAssignUsersToGroup and bulkRevokeUsersFromGroup work and respect self-demotion filter", async () => {
      mockContext = assignContext();

      const group = await db.transaction(async tx => {
        const [g] = await tx
          .insert(permissionGroups)
          .values({
            name: loc("Bulk Assign Test Group"),
            slug: "bulk_assign_test_group",
            createdAt: new Date(),
            updatedAt: new Date(),
            isSystem: false,
          })
          .returning();
        return g;
      });
      createdGroupIds.add(group.id);

      // Bulk assign
      await PermissionManagementService.bulkAssignUsersToGroup(
        adminUser.id,
        {
          userIds: [regularUser.id],
          groupId: group.id,
        },
        tErrors
      );

      let userGroups = await PermissionManagementService.listGroupsForUser(adminUser.id, regularUser.id, tErrors);
      expect(userGroups).toContain(group.id);

      // Attempt to bulk revoke both regular user and super admin user
      await PermissionManagementService.bulkRevokeUsersFromGroup(
        adminUser.id,
        {
          userIds: [regularUser.id, superAdminUser.id],
          groupId: group.id,
        },
        tErrors
      );

      // Verify regular user is revoked
      userGroups = await PermissionManagementService.listGroupsForUser(adminUser.id, regularUser.id, tErrors);
      expect(userGroups).not.toContain(group.id);
    });
  });

  describe("Slug Collision Handling", () => {
    test("createGroup handles name collision by appending suffix counter to slug", async () => {
      mockContext = manageContext();

      const group1 = await PermissionManagementService.createGroup(
        adminUser.id,
        {
          name: loc("Collision Group Name"),
          permissionIds: [],
        },
        tErrors
      );
      createdGroupIds.add(group1.id);

      const group2 = await PermissionManagementService.createGroup(
        adminUser.id,
        {
          name: loc("Collision Group Name!"),
          permissionIds: [],
        },
        tErrors
      );
      createdGroupIds.add(group2.id);

      expect(group1.slug).toBe("collision_group_name");
      expect(group2.slug).toBe("collision_group_name_1");
    });
  });

  describe("User Permission Overrides & Effective Permissions", () => {
    test("listUserOverrides, updateUserOverrides, and getEffectiveUserPermissions logic", async () => {
      mockContext = manageContext();

      expect(testPerm1).toBeDefined();
      expect(testPerm2).toBeDefined();
      if (!testPerm1 || !testPerm2) throw new Error("Test permissions missing");

      const perm1Id = testPerm1.id;
      const perm1Key = testPerm1.key;
      const perm2Id = testPerm2.id;
      const perm2Key = testPerm2.key;

      // Set overrides for regularUser
      await PermissionManagementService.updateUserOverrides(
        adminUser.id,
        {
          userId: regularUser.id,
          overrides: [
            { permissionId: perm1Id, state: OverrideState.GRANTED },
            { permissionId: perm2Id, state: OverrideState.DENIED },
          ],
        },
        tErrors
      );

      // List overrides
      const overrides = await PermissionManagementService.listUserOverrides(adminUser.id, regularUser.id, tErrors);
      const grant = overrides.find(o => o.permissionId === perm1Id);
      const deny = overrides.find(o => o.permissionId === perm2Id);
      expect(grant).toBeDefined();
      expect(grant?.state).toBe(OverrideState.GRANTED);
      expect(deny).toBeDefined();
      expect(deny?.state).toBe(OverrideState.DENIED);

      // Verify effective permissions combining overrides
      const effective = await PermissionManagementService.getEffectiveUserPermissions(
        adminUser.id,
        regularUser.id,
        tErrors
      );
      const effectiveKeys: readonly string[] = effective;
      expect(effectiveKeys).toContain(perm1Key);
      expect(effectiveKeys).not.toContain(perm2Key);

      // Clean up overrides
      await PermissionManagementService.updateUserOverrides(
        adminUser.id,
        {
          userId: regularUser.id,
          overrides: [],
        },
        tErrors
      );
    });
  });
});
