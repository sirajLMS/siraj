import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import {
  ComplaintRepository,
  ParentRepository,
  StorageDbRepository,
  SystemSettingsRepository,
} from "@/backend/db/repo";
import { PermissionsService } from "@/backend/services";
import { ComplaintService } from "@/backend/services/communication/complaint.service";
import type { ComplaintSelectType } from "@/backend/types";
import { AppPermission, ComplaintCategory, ComplaintStatus } from "@/shared/lib/enum";

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
  skype: null,
  defaultZoomLink: null,
  invoiceType: null,
  feeAmount: null,
  paymentMethod: null,
  currency: null,
  timezone: "UTC",
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

describe("ComplaintService", () => {
  let hasPermissionSpy: ReturnType<typeof spyOn>;
  let findByUserIdSpy: ReturnType<typeof spyOn>;
  let getIntValueSpy: ReturnType<typeof spyOn>;
  let submitComplaintSpy: ReturnType<typeof spyOn>;
  let registerFileUsageSpy: ReturnType<typeof spyOn>;
  let getComplaintByIdSpy: ReturnType<typeof spyOn>;
  let getComplaintFilesSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
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
  });

  describe("submitComplaint — file validation", () => {
    test("rejects when file count exceeds max", async () => {
      getIntValueSpy.mockImplementation(async (key: string) => {
        if (key === "complaint_max_files_per_complaint") return 2;
        return 25;
      });

      const tooManyFiles = [
        { path: "f1.jpg", sizeBytes: 100, mimeType: "image/jpeg" },
        { path: "f2.jpg", sizeBytes: 100, mimeType: "image/jpeg" },
        { path: "f3.jpg", sizeBytes: 100, mimeType: "image/jpeg" },
      ];

      let errorCaught: Error | null = null;
      try {
        await ComplaintService.submitComplaint(
          MOCK_ACTOR_ID,
          {
            category: ComplaintCategory.OTHER,
            submitterEmail: "test@test.com",
            body: "Test",
            files: tooManyFiles,
          },
          "en"
        );
      } catch (e) {
        errorCaught = e as Error;
      }

      expect(errorCaught).not.toBeNull();
      expect(errorCaught?.message.toLowerCase()).toContain("file");
    });

    test("rejects when file size exceeds max", async () => {
      getIntValueSpy.mockImplementation(async (key: string) => {
        if (key === "complaint_max_files_per_complaint") return 5;
        if (key === "complaint_max_file_size_mb") return 1;
        return 25;
      });

      const oversizedFile = [{ path: "huge.jpg", sizeBytes: 5 * 1024 * 1024, mimeType: "image/jpeg" }];

      let errorCaught: Error | null = null;
      try {
        await ComplaintService.submitComplaint(
          MOCK_ACTOR_ID,
          {
            category: ComplaintCategory.OTHER,
            submitterEmail: "test@test.com",
            body: "Test",
            files: oversizedFile,
          },
          "en"
        );
      } catch (e) {
        errorCaught = e as Error;
      }

      expect(errorCaught).not.toBeNull();
      expect(errorCaught?.message.toLowerCase()).toContain("large");
    });

    test("rejects invalid MIME type", async () => {
      getIntValueSpy.mockImplementation(async (key: string) => {
        if (key === "complaint_max_files_per_complaint") return 5;
        if (key === "complaint_max_file_size_mb") return 25;
        return 25;
      });

      const invalidMimeFile = [{ path: "malware.exe", sizeBytes: 100, mimeType: "application/x-executable" }];

      let errorCaught: Error | null = null;
      try {
        await ComplaintService.submitComplaint(
          MOCK_ACTOR_ID,
          {
            category: ComplaintCategory.OTHER,
            submitterEmail: "test@test.com",
            body: "Test",
            files: invalidMimeFile,
          },
          "en"
        );
      } catch (e) {
        errorCaught = e as Error;
      }

      expect(errorCaught).not.toBeNull();
      expect(errorCaught?.message.toLowerCase()).toContain("type");
    });
  });

  describe("submitComplaint — file registration in transaction", () => {
    test("registers files after complaint creation", async () => {
      getIntValueSpy.mockImplementation(async (key: string) => {
        if (key === "complaint_max_files_per_complaint") return 5;
        if (key === "complaint_max_file_size_mb") return 25;
        return 25;
      });

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
      expect(files.length).toBe(1);
    });

    test("admin can access any complaint files", async () => {
      hasPermissionSpy.mockImplementation(async (_userId: string, perm: AppPermission) => {
        if (perm === AppPermission.COMPLAINTS_LIST) return true;
        return false;
      });
      getComplaintFilesSpy.mockResolvedValue([]);

      const files = await ComplaintService.getComplaintFiles("admin-uuid", MOCK_COMPLAINT_ID);

      expect(files).toBeArray();
    });

    test("unauthorized user cannot access complaint files", async () => {
      hasPermissionSpy.mockResolvedValue(false);

      let errorCaught: Error | null = null;
      try {
        await ComplaintService.getComplaintFiles("unauthorized-uuid", MOCK_COMPLAINT_ID);
      } catch (e) {
        errorCaught = e as Error;
      }

      expect(errorCaught).not.toBeNull();
      expect(errorCaught?.message.toLowerCase()).toContain("permission");
    });
  });
});
