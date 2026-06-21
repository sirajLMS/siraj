import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, like } from "drizzle-orm";
import { PermissionManagementService } from "@/backend/services/auth/permission-management.service";
import { PermissionsService, type UserPermissionContext } from "@/backend/services/auth/permissions.service";
import { AppPermission } from "@/shared/lib/enum";
import { getErrorMessage } from "@/shared/utils/error";
import { db } from "../../drizzleDb";
import { permissionGroups, permissions, users } from "../../schema";

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

describe("PermissionManagementService Business Logic", () => {
  let adminUser: typeof users.$inferSelect;
  let regularUser: typeof users.$inferSelect;
  let superAdminUser: typeof users.$inferSelect;

  // Track original getUserContext to restore later
  const originalGetUserContext = PermissionsService.getUserContext;
  let mockContext: UserPermissionContext | null = null;

  const manageContext = (): UserPermissionContext => ({
    permissions: [AppPermission.PERMISSION_GROUPS_MANAGE],
    permissionGroups: ["admin_group"],
    isSuperAdmin: false,
    role: "Admin",
  });

  const assignContext = (): UserPermissionContext => ({
    permissions: [AppPermission.PERMISSION_GROUPS_ASSIGN],
    permissionGroups: ["assigner_group"],
    isSuperAdmin: false,
    role: "Assigner",
  });

  const userContext = (): UserPermissionContext => ({
    permissions: [],
    permissionGroups: [],
    isSuperAdmin: false,
    role: "User",
  });

  const superAdminContext = (): UserPermissionContext => ({
    permissions: [],
    permissionGroups: [],
    isSuperAdmin: true,
    role: "SuperAdmin",
  });

  beforeAll(async () => {
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
        email: `service-test-admin-${randomUUID()}@example.com`,
        password: "password",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    [regularUser] = await db
      .insert(users)
      .values({
        name: "Service Regular User",
        email: `service-test-regular-${randomUUID()}@example.com`,
        password: "password",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    [superAdminUser] = await db
      .insert(users)
      .values({
        name: "Service SuperAdmin User",
        email: `service-test-superadmin-${randomUUID()}@example.com`,
        password: "password",
        isSuperAdmin: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
  });

  afterAll(async () => {
    // Restore original getUserContext
    PermissionsService.getUserContext = originalGetUserContext;

    // Cleanup users
    await db.delete(users).where(like(users.email, "service-test-%"));
  });

  afterEach(async () => {
    mockContext = null;
    // Clean up non-system groups
    await db.delete(permissionGroups).where(eq(permissionGroups.isSystem, false));
  });

  describe("Access Control (Authorization Guards)", () => {
    test("listPermissions should throw unauthorized for non-admin", async () => {
      mockContext = userContext();
      await assertThrows(() => PermissionManagementService.listPermissions(regularUser.id), "Unauthorized");
    });

    test("listPermissions should allow admin with manage permission", async () => {
      mockContext = manageContext();

      const perms = await PermissionManagementService.listPermissions(adminUser.id);
      expect(perms).toBeDefined();
      expect(perms.length).toBeGreaterThan(0);
    });

    test("listPermissions should allow superadmin", async () => {
      mockContext = superAdminContext();

      const perms = await PermissionManagementService.listPermissions(superAdminUser.id);
      expect(perms).toBeDefined();
      expect(perms.length).toBeGreaterThan(0);
    });
  });

  describe("Group CRUD Validation", () => {
    test("createGroup should throw if name is empty", async () => {
      mockContext = manageContext();
      await assertThrows(
        () => PermissionManagementService.createGroup(adminUser.id, { name: "   ", permissionIds: [] }),
        "Permission group name is required"
      );
    });

    test("createGroup should throw if name too long", async () => {
      mockContext = manageContext();
      await assertThrows(
        () => PermissionManagementService.createGroup(adminUser.id, { name: "a".repeat(256), permissionIds: [] }),
        "Permission group name cannot exceed 255 characters"
      );
    });

    test("createGroup should auto-generate slug and succeed", async () => {
      mockContext = manageContext();

      const [perm] = await db.select().from(permissions).limit(1);
      const group = await PermissionManagementService.createGroup(adminUser.id, {
        name: "My Custom Group & Permissions!!",
        description: "Custom group description",
        permissionIds: perm ? [perm.id] : [],
      });

      expect(group).toBeDefined();
      expect(group.name).toBe("My Custom Group & Permissions!!");
      expect(group.slug).toBe("my_custom_group_permissions");
      expect(group.description).toBe("Custom group description");
      if (perm) {
        expect(group.permissionIds).toContain(perm.id);
      }
    });

    test("updateGroup should trim and validate updated fields", async () => {
      mockContext = manageContext();

      const group = await PermissionManagementService.createGroup(adminUser.id, {
        name: "Initial Group",
        permissionIds: [],
      });

      const updated = await PermissionManagementService.updateGroup(adminUser.id, {
        groupId: group.id,
        name: "Updated Group Name",
        description: "   Updated description   ",
      });

      expect(updated.name).toBe("Updated Group Name");
      expect(updated.slug).toBe("updated_group_name");
      expect(updated.description).toBe("Updated description");
    });

    test("updateGroup on system group should throw cannotModifySystemPermissionGroup", async () => {
      mockContext = manageContext();

      const [sysGroup] = await db.select().from(permissionGroups).where(eq(permissionGroups.isSystem, true)).limit(1);
      expect(sysGroup).toBeDefined();

      await assertThrows(
        () => PermissionManagementService.updateGroup(adminUser.id, { groupId: sysGroup.id, name: "New System Name" }),
        "Cannot modify core properties of system permission groups"
      );
    });

    test("deleteGroup on system group should throw cannotDeleteSystemPermissionGroup", async () => {
      mockContext = manageContext();

      const [sysGroup] = await db.select().from(permissionGroups).where(eq(permissionGroups.isSystem, true)).limit(1);
      expect(sysGroup).toBeDefined();

      await assertThrows(
        () => PermissionManagementService.deleteGroup(adminUser.id, sysGroup.id),
        "Cannot delete a system permission or group"
      );
    });
  });

  describe("User Assignment Logic", () => {
    test("assignGroupToUser and revokeGroupFromUser should work for authorized user", async () => {
      mockContext = assignContext();

      const group = await db.transaction(async tx => {
        const [g] = await tx
          .insert(permissionGroups)
          .values({
            name: "Assign Test Group",
            slug: "assign_test_group",
            createdAt: new Date(),
            updatedAt: new Date(),
            isSystem: false,
          })
          .returning();
        return g;
      });

      // Verify list initially empty
      let userGroups = await PermissionManagementService.listGroupsForUser(adminUser.id, regularUser.id);
      expect(userGroups).not.toContain(group.id);

      // Assign
      await PermissionManagementService.assignGroupToUser(adminUser.id, {
        userId: regularUser.id,
        groupId: group.id,
      });

      userGroups = await PermissionManagementService.listGroupsForUser(adminUser.id, regularUser.id);
      expect(userGroups).toContain(group.id);

      // Revoke
      await PermissionManagementService.revokeGroupFromUser(adminUser.id, {
        userId: regularUser.id,
        groupId: group.id,
      });

      userGroups = await PermissionManagementService.listGroupsForUser(adminUser.id, regularUser.id);
      expect(userGroups).not.toContain(group.id);
    });

    test("revokeGroupFromUser on SuperAdmin should throw cannotModifySuperAdmin", async () => {
      mockContext = assignContext();

      const [sysGroup] = await db.select().from(permissionGroups).where(eq(permissionGroups.isSystem, true)).limit(1);
      expect(sysGroup).toBeDefined();

      await assertThrows(
        () =>
          PermissionManagementService.revokeGroupFromUser(adminUser.id, {
            userId: superAdminUser.id,
            groupId: sysGroup.id,
          }),
        "Cannot modify permissions of a SuperAdmin user"
      );
    });
  });

  describe("System Permission Database Constraints", () => {
    test("should prevent creating a new system permission", async () => {
      let err: unknown = null;
      try {
        await db.insert(permissions).values({
          key: AppPermission.TEST_SYSTEM_ONLY,
          resource: "custom",
          action: "test_system_permission",
          description: "Test description",
          category: "Custom",
          isSystem: true,
        });
      } catch (e) {
        err = e;
      }
      expect(err).not.toBeNull();
      expect(getErrorMessage(err)).toContain("Cannot create system permissions");
    });

    test("should prevent modifying custom permission to system permission", async () => {
      // First insert custom permission with isSystem = false
      const [customPerm] = await db
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

      let err: unknown = null;
      try {
        await db.update(permissions).set({ isSystem: true }).where(eq(permissions.id, customPerm.id));
      } catch (e) {
        err = e;
      }

      // Cleanup custom permission
      await db.delete(permissions).where(eq(permissions.id, customPerm.id));

      expect(err).not.toBeNull();
      expect(getErrorMessage(err)).toContain("Cannot change is_system to true");
    });
  });

  describe("Bulk Assignment & Self-Demotion Guards", () => {
    test("bulkAssignUsersToGroup and bulkRevokeUsersFromGroup work and respect self-demotion filter", async () => {
      mockContext = assignContext();

      const group = await db.transaction(async tx => {
        const [g] = await tx
          .insert(permissionGroups)
          .values({
            name: "Bulk Assign Test Group",
            slug: "bulk_assign_test_group",
            createdAt: new Date(),
            updatedAt: new Date(),
            isSystem: false,
          })
          .returning();
        return g;
      });

      // Bulk assign
      await PermissionManagementService.bulkAssignUsersToGroup(adminUser.id, {
        userIds: [regularUser.id],
        groupId: group.id,
      });

      let userGroups = await PermissionManagementService.listGroupsForUser(adminUser.id, regularUser.id);
      expect(userGroups).toContain(group.id);

      // Attempt to bulk revoke both regular user and super admin user
      await PermissionManagementService.bulkRevokeUsersFromGroup(adminUser.id, {
        userIds: [regularUser.id, superAdminUser.id],
        groupId: group.id,
      });

      // Verify regular user is revoked
      userGroups = await PermissionManagementService.listGroupsForUser(adminUser.id, regularUser.id);
      expect(userGroups).not.toContain(group.id);
    });
  });

  describe("Slug Collision Handling", () => {
    test("createGroup handles name collision by appending suffix counter to slug", async () => {
      mockContext = manageContext();

      const group1 = await PermissionManagementService.createGroup(adminUser.id, {
        name: "Collision Group Name",
        permissionIds: [],
      });

      const group2 = await PermissionManagementService.createGroup(adminUser.id, {
        name: "Collision Group Name!",
        permissionIds: [],
      });

      expect(group1.slug).toBe("collision_group_name");
      expect(group2.slug).toBe("collision_group_name_1");
    });
  });

  describe("User Permission Overrides & Effective Permissions", () => {
    test("listUserOverrides, updateUserOverrides, and getEffectiveUserPermissions logic", async () => {
      mockContext = manageContext();

      const [perm1, perm2] = await db.select().from(permissions).limit(2);
      expect(perm1).toBeDefined();
      expect(perm2).toBeDefined();

      // Set overrides for regularUser
      await PermissionManagementService.updateUserOverrides(adminUser.id, {
        userId: regularUser.id,
        overrides: [
          { permissionId: perm1.id, state: "GRANTED" },
          { permissionId: perm2.id, state: "DENIED" },
        ],
      });

      // List overrides
      const overrides = await PermissionManagementService.listUserOverrides(adminUser.id, regularUser.id);
      expect(overrides.length).toBe(2);
      expect(overrides.find(o => o.permissionId === perm1.id)?.state).toBe("GRANTED");
      expect(overrides.find(o => o.permissionId === perm2.id)?.state).toBe("DENIED");

      // Verify effective permissions combining overrides
      const effective = await PermissionManagementService.getEffectiveUserPermissions(adminUser.id, regularUser.id);
      expect(effective).toContain(perm1.key);
      expect(effective).not.toContain(perm2.key);

      // Clean up overrides
      await PermissionManagementService.updateUserOverrides(adminUser.id, {
        userId: regularUser.id,
        overrides: [],
      });
    });
  });
});
