import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { permissionGroups, permissions } from "@/backend/db/schema";
import { AppPermission } from "@/shared/lib/enum";
import { getErrorMessage } from "@/shared/utils/error";
import { runInRollback } from "../test-utils";

type Tx = DBTransaction;

function testConstraint(name: string, operation: (tx: Tx) => unknown, expectedError?: string) {
  test(name, () =>
    runInRollback(async tx => {
      if (expectedError) {
        let errorThrown: unknown = null;
        try {
          await operation(tx);
        } catch (e) {
          errorThrown = e;
        }
        expect(errorThrown).not.toBeNull();

        const actualMessage = getErrorMessage(errorThrown);
        expect(actualMessage).toContain(expectedError);
      } else {
        await operation(tx);
      }
    })
  );
}

describe("Permissions and Permission Groups Database Constraints", () => {
  testConstraint("Should verify system permissions and groups exist", async tx => {
    // Uses seed system permission — required: testing DB trigger that only applies to isSystem=true entities
    const [sysPerm] = await tx.select().from(permissions).where(eq(permissions.key, AppPermission.AUTH_LOGIN));
    expect(sysPerm).toBeDefined();
    expect(sysPerm.isSystem).toBe(true);

    // Uses seed system group — required: testing DB trigger that only applies to isSystem=true entities
    const [sysGroup] = await tx.select().from(permissionGroups).where(eq(permissionGroups.slug, "super_admin"));
    expect(sysGroup).toBeDefined();
    expect(sysGroup.isSystem).toBe(true);
  });

  testConstraint(
    "Should prevent deleting a system permission",
    // Operates on seed auth.login permission — required: trigger test target
    tx => tx.delete(permissions).where(eq(permissions.key, AppPermission.AUTH_LOGIN)),
    "Cannot delete a system permission or group"
  );

  testConstraint(
    "Should prevent deleting a system permission group",
    // Operates on seed super_admin group — required: trigger test target
    tx => tx.delete(permissionGroups).where(eq(permissionGroups.slug, "super_admin")),
    "Cannot delete a system permission or group"
  );

  testConstraint("Should allow updating the description of a system permission", async tx => {
    const newDesc = "Updated login description";
    const [updated] = await tx
      .update(permissions)
      .set({ description: newDesc })
      .where(eq(permissions.key, AppPermission.AUTH_LOGIN))
      .returning();

    expect(updated.description).toBe(newDesc);
  });

  testConstraint("Should allow updating the description of a system permission group", async tx => {
    const newDesc = "Updated super admin description";
    const [updated] = await tx
      .update(permissionGroups)
      .set({ description: newDesc })
      .where(eq(permissionGroups.slug, "super_admin"))
      .returning();

    expect(updated.description).toBe(newDesc);
  });

  testConstraint("Should allow updating the name of a system permission group", async tx => {
    const newName = "Updated Super Admin Name";
    const [updated] = await tx
      .update(permissionGroups)
      .set({ name: newName })
      .where(eq(permissionGroups.slug, "super_admin"))
      .returning();

    expect(updated.name).toBe(newName);
  });

  testConstraint(
    "Should prevent updating action of system permissions",
    tx =>
      tx.update(permissions).set({ action: "modified_action" }).where(eq(permissions.key, AppPermission.AUTH_LOGIN)),
    "Cannot modify core properties of system permissions; only description can be updated"
  );

  testConstraint(
    "Should prevent updating category of system permissions",
    tx =>
      tx
        .update(permissions)
        .set({ category: "Modified Category" })
        .where(eq(permissions.key, AppPermission.AUTH_LOGIN)),
    "Cannot modify core properties of system permissions; only description can be updated"
  );

  testConstraint(
    "Should prevent updating slug of system permission groups",
    tx => tx.update(permissionGroups).set({ slug: "modified_slug" }).where(eq(permissionGroups.slug, "super_admin")),
    "Cannot modify core properties of system permission groups; only name and description can be updated"
  );

  testConstraint(
    "Should prevent changing isSystem from true to false for system permissions",
    tx => tx.update(permissions).set({ isSystem: false }).where(eq(permissions.key, AppPermission.AUTH_LOGIN)),
    "Cannot change is_system from true to false for system permissions or groups"
  );

  testConstraint(
    "Should prevent changing isSystem from true to false for system groups",
    tx => tx.update(permissionGroups).set({ isSystem: false }).where(eq(permissionGroups.slug, "super_admin")),
    "Cannot change is_system from true to false for system permissions or groups"
  );

  testConstraint("CRUD operations on non-system groups should work", async tx => {
    // Create non-system group
    const [newGroup] = await tx
      .insert(permissionGroups)
      .values({
        name: "Custom Group",
        slug: "custom_group",
        description: "Custom description",
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    expect(newGroup).toBeDefined();

    // Update non-system group name and description
    const [updatedGroup] = await tx
      .update(permissionGroups)
      .set({ name: "Custom Group Updated", description: "Updated custom description" })
      .where(eq(permissionGroups.id, newGroup.id))
      .returning();

    expect(updatedGroup.name).toBe("Custom Group Updated");
    expect(updatedGroup.description).toBe("Updated custom description");

    // Update non-system group slug (allowed since not system)
    const [slugUpdatedGroup] = await tx
      .update(permissionGroups)
      .set({ slug: "custom_group_updated" })
      .where(eq(permissionGroups.id, newGroup.id))
      .returning();

    expect(slugUpdatedGroup.slug).toBe("custom_group_updated");

    // Delete non-system group
    const deletedGroup = await tx.delete(permissionGroups).where(eq(permissionGroups.id, newGroup.id)).returning();

    expect(deletedGroup.length).toBe(1);
  });
});
