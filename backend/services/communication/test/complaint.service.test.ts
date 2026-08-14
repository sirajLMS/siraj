import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { ComplaintRepository } from "@/backend/db/repo/complaints";
import { ParentRepository } from "@/backend/db/repo/parents";
import { SystemSettingsRepository } from "@/backend/db/repo/shared";
import { StorageDbRepository } from "@/backend/db/repo/storage";
import { AppPermission, ComplaintCategory, ComplaintStatus } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { ComplaintService } from "@/backend/services/communication/complaint.service";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import type { ComplaintSelectType } from "@/backend/types";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

const MOCK_ACTOR_ID = "actor-uuid-0001";
const MOCK_PARENT_ID = "parent-uuid-0001";
const MOCK_COMPLAINT_ID = "complaint-uuid-0001";

const mockParent = {
  id: MOCK_PARENT_ID,
  userId: MOCK_ACTOR_ID,
  status: "ACTIVE",
  phone: null,
  nationality: null,
  address: null,
  facebook: null,
  whatsapp: null,
  twitter: null,
  invoiceType: null,
  feeAmount: null,
  paymentMethod: null,
  currency: null,
  timezone: IanaTimezone.UTC,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockComplaint = {
  id: MOCK_COMPLAINT_ID,
  parentId: MOCK_PARENT_ID,
  studentId: null,
  category: ComplaintCategory.OTHER,
  submitterEmail: "parent@test.com",
  body: "Test complaint body",
  status: ComplaintStatus.UNANSWERED,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
} satisfies ComplaintSelectType;

const mockComplaintDetail = {
  ...mockComplaint,
  parentName: "Test Parent",
  studentName: null,
};

const validFiles = [
  { path: "uploads/complaints/file1.jpg", sizeBytes: 1024 * 1024, mimeType: "image/jpeg" },
  { path: "uploads/complaints/file2.pdf", sizeBytes: 2 * 1024 * 1024, mimeType: "application/pdf" },
];

function mockFileValidationSettings(spy: ReturnType<typeof spyOn>, maxFiles: number, maxSizeMb: number) {
  spy.mockImplementation(async (key: string) => {
    if (key === "complaint_max_files_per_complaint") return maxFiles;
    if (key === "complaint_max_file_size_mb") return maxSizeMb;
    return 25;
  });
}

async function expectThrowsAsync(fn: () => Promise<unknown>, expectedSubstring: string) {
  let errorCaught: Error | null = null;
  try {
    await fn();
  } catch (e) {
    errorCaught = e instanceof Error ? e : new Error(String(e));
  }
  expect(errorCaught).not.toBeNull();
  expect(errorCaught?.message.toLowerCase()).toContain(expectedSubstring);
}

async function expectSubmitComplaintThrows(
  files: Array<{ path: string; sizeBytes: number; mimeType: string }>,
  expectedSubstring: string
) {
  await expectThrowsAsync(
    () =>
      ComplaintService.submitComplaint(
        MOCK_ACTOR_ID,
        {
          category: ComplaintCategory.OTHER,
          submitterEmail: "test@test.com",
          body: "Test",
          files,
        },
        "en"
      ),
    expectedSubstring
  );
}

describe("ComplaintService", () => {
  let hasPermissionSpy: ReturnType<typeof spyOn>;
  let findByUserIdSpy: ReturnType<typeof spyOn>;
  let getIntValueSpy: ReturnType<typeof spyOn>;
  let submitComplaintSpy: ReturnType<typeof spyOn>;
  let registerFileUsageSpy: ReturnType<typeof spyOn>;
  let getComplaintByIdSpy: ReturnType<typeof spyOn>;
  let getComplaintFilesSpy: ReturnType<typeof spyOn>;
  let getUserIdsWithPermissionSpy: ReturnType<typeof spyOn>;
  let dispatchWithPreferencesSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    getUserIdsWithPermissionSpy = spyOn(PermissionsService, "getUserIdsWithPermission").mockResolvedValue([]);
    dispatchWithPreferencesSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    findByUserIdSpy = spyOn(ParentRepository, "findByUserId").mockResolvedValue(mockParent);
    getIntValueSpy = spyOn(SystemSettingsRepository, "getIntValue").mockResolvedValue(5);
    submitComplaintSpy = spyOn(ComplaintRepository, "submitComplaint").mockResolvedValue(mockComplaint);
    registerFileUsageSpy = spyOn(StorageDbRepository, "registerFileUsage").mockResolvedValue({
      success: true,
      message: "",
    });
    getComplaintByIdSpy = spyOn(ComplaintRepository, "getComplaintById").mockResolvedValue(mockComplaintDetail);
    getComplaintFilesSpy = spyOn(ComplaintRepository, "getComplaintFiles").mockResolvedValue([]);
  });

  afterEach(() => {
    hasPermissionSpy.mockRestore();
    findByUserIdSpy.mockRestore();
    getIntValueSpy.mockRestore();
    submitComplaintSpy.mockRestore();
    registerFileUsageSpy.mockRestore();
    getComplaintByIdSpy.mockRestore();
    getComplaintFilesSpy.mockRestore();
    getUserIdsWithPermissionSpy.mockRestore();
    dispatchWithPreferencesSpy.mockRestore();
  });

  describe("submitComplaint — file validation", () => {
    test("rejects when file count exceeds max", async () => {
      mockFileValidationSettings(getIntValueSpy, 2, 25);

      await expectSubmitComplaintThrows(
        [
          { path: "f1.jpg", sizeBytes: 100, mimeType: "image/jpeg" },
          { path: "f2.jpg", sizeBytes: 100, mimeType: "image/jpeg" },
          { path: "f3.jpg", sizeBytes: 100, mimeType: "image/jpeg" },
        ],
        "file"
      );
    });

    test("rejects when file size exceeds max", async () => {
      mockFileValidationSettings(getIntValueSpy, 5, 1);

      await expectSubmitComplaintThrows(
        [{ path: "huge.jpg", sizeBytes: 5 * 1024 * 1024, mimeType: "image/jpeg" }],
        "exceed"
      );
    });

    test("rejects invalid MIME type", async () => {
      mockFileValidationSettings(getIntValueSpy, 5, 25);

      await expectSubmitComplaintThrows(
        [{ path: "malware.exe", sizeBytes: 100, mimeType: "application/x-executable" }],
        "type"
      );
    });
  });

  describe("submitComplaint — file registration in transaction", () => {
    test("registers files after complaint creation", async () => {
      mockFileValidationSettings(getIntValueSpy, 5, 25);

      const result = await ComplaintService.submitComplaint(MOCK_ACTOR_ID, {
        category: ComplaintCategory.OTHER,
        submitterEmail: "test@test.com",
        body: "Test complaint",
        files: validFiles,
      });

      expect(result.id).toBe(MOCK_COMPLAINT_ID);
      expect(registerFileUsageSpy).toHaveBeenCalledTimes(2);
    });

    test("succeeds with no files", async () => {
      const result = await ComplaintService.submitComplaint(MOCK_ACTOR_ID, {
        category: ComplaintCategory.REGARDING_TEACHER,
        submitterEmail: "test@test.com",
        body: "Test complaint without files",
      });

      expect(result.id).toBe(MOCK_COMPLAINT_ID);
      expect(registerFileUsageSpy).not.toHaveBeenCalled();
    });
  });

  describe("getComplaintFiles", () => {
    test("parent can access own complaint files", async () => {
      hasPermissionSpy.mockImplementation(async (_userId: string, perm: AppPermission) => {
        if (perm === AppPermission.COMPLAINTS_LIST) return false;
        if (perm === AppPermission.SUPPORT_VIEW_HISTORY) return true;
        return false;
      });
      getComplaintFilesSpy.mockResolvedValue([
        {
          fileId: "file-1",
          filePath: "uploads/test.jpg",
          isProtected: false,
          usageType: "attachment",
          createdAt: new Date(),
        },
      ]);

      const files = await ComplaintService.getComplaintFiles(MOCK_ACTOR_ID, MOCK_COMPLAINT_ID);

      expect(files).toBeArray();
      expect(files).toHaveLength(1);
    });

    test("admin can access any complaint files", async () => {
      hasPermissionSpy.mockImplementation(
        async (_userId: string, perm: AppPermission) => perm === AppPermission.COMPLAINTS_LIST
      );
      getComplaintFilesSpy.mockResolvedValue([]);

      const files = await ComplaintService.getComplaintFiles("admin-uuid", MOCK_COMPLAINT_ID);

      expect(files).toBeArray();
    });

    test("unauthorized user cannot access complaint files", async () => {
      hasPermissionSpy.mockResolvedValue(false);

      await expectThrowsAsync(
        () => ComplaintService.getComplaintFiles("unauthorized-uuid", MOCK_COMPLAINT_ID),
        "permission"
      );
    });
  });
});
