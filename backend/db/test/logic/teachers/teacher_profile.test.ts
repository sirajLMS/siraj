import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { TeacherRepository } from "@/backend/db/repo/teachers";
import { teachers } from "@/backend/db/schema";
import { setupTeacher } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { AppPermission } from "@/backend/enum";
import { PermissionsService, StaffProfileService } from "@/backend/services";
import type { UserPermissionContext } from "@/backend/types";
import { getErrorMessage } from "@/shared/utils/error";

describe("StaffProfileService Permission Gating", () => {
  const originalHasPermission = PermissionsService.hasPermission;
  const mockPermissions = new Map<string, boolean>();

  beforeAll(() => {
    PermissionsService.hasPermission = async (userId: UserPermissionContext | string, permissionKey: AppPermission) => {
      const userIdStr = typeof userId === "string" ? userId : "";
      const key = `${userIdStr}:${permissionKey}`;
      return mockPermissions.get(key) ?? false;
    };
  });

  afterAll(() => {
    PermissionsService.hasPermission = originalHasPermission;
  });

  it("getTeacherProfileForEdit: enforces permission checks", async () => {
    const actorUserId = randomUUID();
    const teacherId = randomUUID();

    // Case 1: Lacks permission — service throws before any DB query
    const error = await StaffProfileService.getTeacherProfileForEdit(actorUserId, teacherId).catch(e => e);
    expect(error).toBeInstanceOf(Error);
    expect(getErrorMessage(error)).toContain("الصلاحيات");

    // Case 2: Has permission — test with real data inside runInRollback
    mockPermissions.set(`${actorUserId}:${AppPermission.PROFILE_TEACHER_PROFESSIONAL_EDIT_OTHER}`, true);

    await runInRollback(async tx => {
      const { teacher } = await setupTeacher(tx);
      const profile = await TeacherRepository.getTeacherProfileForEdit(teacher.id, tx);
      expect(profile).not.toBeNull();
      expect(profile?.id).toBe(teacher.id);
    });

    mockPermissions.clear();
  });

  it("updateTeacherProfile: enforces permission checks", async () => {
    const actorUserId = randomUUID();
    const teacherId = randomUUID();
    const newAddress = "456 Service St";

    // Case 1: Lacks permission — service throws before any DB query
    const error = await StaffProfileService.updateTeacherProfile(actorUserId, teacherId, {
      address: newAddress,
    }).catch(e => e);
    expect(error).toBeInstanceOf(Error);
    expect(getErrorMessage(error)).toContain("الصلاحيات");

    // Case 2: Has permission — test with real data inside runInRollback
    mockPermissions.set(`${actorUserId}:${AppPermission.PROFILE_TEACHER_PROFESSIONAL_EDIT_OTHER}`, true);

    await runInRollback(async tx => {
      const { teacher } = await setupTeacher(tx);

      const success = await TeacherRepository.updateTeacherProfile(teacher.id, { address: newAddress }, tx);
      expect(success).toBe(true);

      const profile = await TeacherRepository.getTeacherProfileForEdit(teacher.id, tx);
      expect(profile).not.toBeNull();
      expect(profile?.id).toBe(teacher.id);

      // Verify address was persisted (field is omitted from API return type for PII protection)
      const [updated] = await tx
        .select({ address: teachers.address })
        .from(teachers)
        .where(eq(teachers.id, teacher.id))
        .limit(1);
      expect(updated?.address).toBe(newAddress);
    });

    mockPermissions.clear();
  });
});
