import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { teachers, users } from "@/backend/db/schema";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { StaffProfileService } from "@/backend/services/staff/staff-profile.service";
import { getErrorMessage } from "@/shared/utils/error";

describe("StaffProfileService Permission Gating", () => {
  const originalHasPermission = PermissionsService.hasPermission;
  const mockPermissions = new Map<string, boolean>();
  let testUser: typeof users.$inferSelect;
  let testTeacher: typeof teachers.$inferSelect;

  beforeAll(async () => {
    PermissionsService.hasPermission = async (userId: string, permissionKey: AppPermission) => {
      const key = `${userId}:${permissionKey}`;
      return mockPermissions.get(key) ?? false;
    };

    const now = new Date();
    [testUser] = await db
      .insert(users)
      .values({
        name: "Staff Profile Test Actor",
        email: `staff-actor-${randomUUID()}@example.com`,
        password: "password",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const [teacherUser] = await db
      .insert(users)
      .values({
        name: "Staff Profile Test Teacher User",
        email: `staff-teacher-${randomUUID()}@example.com`,
        password: "password",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    [testTeacher] = await db
      .insert(teachers)
      .values({
        userId: teacherUser.id,
        status: "ACTIVATED",
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
    if (testTeacher) {
      await db.delete(teachers).where(eq(teachers.id, testTeacher.id));
      await db.delete(users).where(eq(users.id, testTeacher.userId));
    }
    if (testUser) {
      await db.delete(users).where(eq(users.id, testUser.id));
    }
  });

  it("getTeacherProfileForEdit: enforces permission checks", async () => {
    const actorUserId = testUser.id;
    const teacherId = testTeacher.id;

    // Case 1: Lacks permission
    const error = await StaffProfileService.getTeacherProfileForEdit(actorUserId, teacherId).catch(e => e);
    expect(error).toBeInstanceOf(Error);
    expect(getErrorMessage(error)).toContain("Insufficient permissions");

    // Case 2: Has permission
    mockPermissions.set(`${actorUserId}:${AppPermission.STAFF_EDIT_PROFILE}`, true);
    const result = await StaffProfileService.getTeacherProfileForEdit(actorUserId, teacherId);
    expect(result.id).toBe(teacherId);
  });

  it("updateTeacherProfile: enforces permission checks", async () => {
    const actorUserId = testUser.id;
    const teacherId = testTeacher.id;
    const newAddress = "456 Service St";

    // Case 1: Lacks permission
    const error = await StaffProfileService.updateTeacherProfile(actorUserId, teacherId, {
      address: newAddress,
    }).catch(e => e);
    expect(error).toBeInstanceOf(Error);
    expect(getErrorMessage(error)).toContain("Insufficient permissions");

    // Case 2: Has permission
    mockPermissions.set(`${actorUserId}:${AppPermission.STAFF_EDIT_PROFILE}`, true);
    const result = await StaffProfileService.updateTeacherProfile(actorUserId, teacherId, {
      address: newAddress,
    });
    expect(result.id).toBe(teacherId);

    // Verify address was persisted (field is omitted from API return type for PII protection)
    const [updated] = await db
      .select({ address: teachers.address })
      .from(teachers)
      .where(eq(teachers.id, teacherId))
      .limit(1);
    expect(updated?.address).toBe(newAddress);
  });
});
