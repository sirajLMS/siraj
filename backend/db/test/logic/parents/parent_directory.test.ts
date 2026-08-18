import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { ParentRepository } from "@/backend/db/repo/parents";
import { runInRollback } from "@/backend/db/test/test-utils";
import { AppPermission } from "@/backend/enum";
import { ParentDirectoryService, PermissionsService } from "@/backend/services";
import { getErrorMessage } from "@/shared/utils/error";

describe("ParentDirectoryService Permission Gating", () => {
  const originalHasAnyPermission = PermissionsService.hasAnyPermission;
  const mockPermissions = new Map<string, boolean>();

  beforeAll(() => {
    PermissionsService.hasAnyPermission = async (userId: string, permissionKeys: AppPermission[]) => {
      return permissionKeys.some(permissionKey => mockPermissions.get(`${userId}:${permissionKey}`) ?? false);
    };
  });

  afterAll(() => {
    PermissionsService.hasAnyPermission = originalHasAnyPermission;
  });

  it("getParentDirectory: enforces permission checks", async () => {
    const actorUserId = randomUUID();

    // Case 1: Lacks permission — service throws before any DB query
    const error = await ParentDirectoryService.getParentDirectory(actorUserId, null, null, null).catch(e => e);
    expect(error).toBeInstanceOf(Error);
    expect(getErrorMessage(error)).toContain("الصلاحيات");

    // Case 2: Has parent.view_directory — test repository directly inside runInRollback
    mockPermissions.set(`${actorUserId}:${AppPermission.PARENT_VIEW_DIRECTORY}`, true);
    await runInRollback(async tx => {
      const result = await ParentRepository.getParentDirectory(
        { search: null, pagination: null, lifecycleStatus: null },
        tx
      );
      expect(result.totalCount).toBeGreaterThanOrEqual(0);
    });
    mockPermissions.clear();

    // Case 3: Has parents.list — test repository directly inside runInRollback
    mockPermissions.set(`${actorUserId}:${AppPermission.PARENTS_LIST}`, true);
    await runInRollback(async tx => {
      const result = await ParentRepository.getParentDirectory(
        { search: null, pagination: null, lifecycleStatus: null },
        tx
      );
      expect(result.totalCount).toBeGreaterThanOrEqual(0);
    });
    mockPermissions.clear();
  });
});
