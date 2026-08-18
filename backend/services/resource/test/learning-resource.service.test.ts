import { describe, expect, spyOn, test } from "bun:test";
import { LearningResourceRepository } from "@/backend/db/repo/storage/learning-resource.repository";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { LearningResourceService } from "@/backend/services/resource/learning-resource.service";
import * as storageServiceModule from "@/backend/storage/storage.service";

describe("LearningResourceService — deleteResource", () => {
  const dummyResourceId = "00000000-0000-0000-0000-000000000001";
  const dummyActorId = "00000000-0000-0000-0000-000000000002";
  const dummyResource = {
    id: dummyResourceId,
    displayName: "Test PDF Document",
    filePath: "curriculum/test.pdf",
    uploadedByUserId: dummyActorId,
    uploadedByUserName: null,
    fileSize: null,
    contentType: null,
    createdAt: new Date(),
  };

  test("throws unauthorized error if actor lacks delete permission", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(false);

    let errorCaught: Error | null = null;
    try {
      await LearningResourceService.deleteResource(dummyResourceId, dummyActorId);
    } catch (e) {
      errorCaught = e instanceof Error ? e : new Error(String(e));
    }

    expect(errorCaught).not.toBeNull();
    if (errorCaught) {
      expect(errorCaught.message).toContain("غير مصرح");
    }
    expect(hasPermissionSpy).toHaveBeenCalledWith(dummyActorId, AppPermission.RESOURCES_DELETE);

    hasPermissionSpy.mockRestore();
  });

  test("deletes physical file before DB record when authorized", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const findByIdSpy = spyOn(LearningResourceRepository, "findById").mockResolvedValue(dummyResource);

    const storageService = await storageServiceModule.getStorageService();
    const deleteFileSpy = spyOn(storageService, "deleteFile").mockResolvedValue({
      success: true,
      message: "File deleted successfully",
    });
    const deleteResourceSpy = spyOn(LearningResourceRepository, "deleteResource").mockResolvedValue(true);

    const result = await LearningResourceService.deleteResource(dummyResourceId, dummyActorId);

    expect(result).toBe(true);
    expect(deleteFileSpy).toHaveBeenCalledWith("curriculum/test.pdf");
    expect(deleteResourceSpy).toHaveBeenCalledWith(dummyResourceId, undefined);

    hasPermissionSpy.mockRestore();
    findByIdSpy.mockRestore();
    deleteFileSpy.mockRestore();
    deleteResourceSpy.mockRestore();
  });

  test("skips database deletion if physical file deletion throws an error", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const findByIdSpy = spyOn(LearningResourceRepository, "findById").mockResolvedValue(dummyResource);

    const storageService = await storageServiceModule.getStorageService();
    const deleteFileSpy = spyOn(storageService, "deleteFile").mockRejectedValue(new Error("AWS S3 Timeout"));
    const deleteResourceSpy = spyOn(LearningResourceRepository, "deleteResource").mockResolvedValue(true);

    let errorCaught: Error | null = null;
    try {
      await LearningResourceService.deleteResource(dummyResourceId, dummyActorId, "en");
    } catch (e) {
      errorCaught = e instanceof Error ? e : new Error(String(e));
    }

    expect(errorCaught).not.toBeNull();
    if (errorCaught) {
      expect(errorCaught.message).toContain("Failed to delete learning resource");
      expect(errorCaught.cause).toBeDefined();
      if (errorCaught.cause instanceof Error) {
        expect(errorCaught.cause.message).toContain("AWS S3 Timeout");
      }
    }
    expect(deleteResourceSpy).not.toHaveBeenCalled();

    hasPermissionSpy.mockRestore();
    findByIdSpy.mockRestore();
    deleteFileSpy.mockRestore();
    deleteResourceSpy.mockRestore();
  });

  test("throws error if resource does not exist during initial fetch", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const findByIdSpy = spyOn(LearningResourceRepository, "findById").mockResolvedValue(null);
    const deleteResourceSpy = spyOn(LearningResourceRepository, "deleteResource").mockResolvedValue(true);

    let errorCaught: Error | null = null;
    try {
      await LearningResourceService.deleteResource(dummyResourceId, dummyActorId);
    } catch (e) {
      errorCaught = e instanceof Error ? e : new Error(String(e));
    }

    expect(errorCaught).not.toBeNull();
    if (errorCaught) {
      expect(errorCaught.message).toContain("مورد التعلم غير موجود");
    }
    expect(deleteResourceSpy).not.toHaveBeenCalled();

    hasPermissionSpy.mockRestore();
    findByIdSpy.mockRestore();
    deleteResourceSpy.mockRestore();
  });
});
