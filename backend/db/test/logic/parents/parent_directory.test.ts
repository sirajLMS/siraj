import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { users } from "@/backend/db/schema";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { ParentDirectoryService } from "@/backend/services/parent/parent-directory.service";
import { getErrorMessage } from "@/shared/utils/error";

describe("ParentDirectoryService Permission Gating", () => {
  const originalHasPermission = PermissionsService.hasPermission;
  const mockPermissions = new Map<string, boolean>();
  let testUser: typeof users.$inferSelect;

  beforeAll(async () => {
    PermissionsService.hasPermission = async (userId: string, permissionKey: AppPermission) => {
      const key = `${userId}:${permissionKey}`;
      return mockPermissions.get(key) ?? false;
    };

    const now = new Date();
    [testUser] = await db
      .insert(users)
      .values({
        name: "Parent Directory Test Actor",
        email: `parent-actor-${randomUUID()}@example.com`,
        password: "password",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
  });

  afterEach(() => {
    mockPermissions.clear();
  });

  afterAll(async () => {
    PermissionsService.hasPermission = originalHasPermission;
    if (testUser) {
      await db.delete(users).where(eq(users.id, testUser.id));
    }
  });

  it("getParentDirectory: enforces permission checks", async () => {
    const actorUserId = testUser.id;

    // Case 1: Lacks permission
    const error = await ParentDirectoryService.getParentDirectory(actorUserId, null, null, null).catch(e => e);
    expect(error).toBeInstanceOf(Error);
    expect(getErrorMessage(error)).toContain("الصلاحيات");

    // Case 2: Has permission
    mockPermissions.set(`${actorUserId}:${AppPermission.PARENT_VIEW_DIRECTORY}`, true);
    const result = await ParentDirectoryService.getParentDirectory(actorUserId, null, null, null);
    expect(result.id).toBe("parent-directory");
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
  });
});
