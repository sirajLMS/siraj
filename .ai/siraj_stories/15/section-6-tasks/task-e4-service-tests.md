# Task E4 — Service Tests

## Sprint 15 · Services Layer · Section 6

---

## Objective

Write comprehensive tests for all new and modified service methods and channel adapters introduced in Sprint 15 tasks E1, E2, and E3.

---

## Dependencies

| Task | Description |
|------|-------------|
| E1 | SuggestionService extensions (complete) |
| E2 | ComplaintService file attachment extension (complete) |
| E3 | CommunicationService multi-channel fan-out (complete) |

---

## Target Files

| File | Action |
|------|--------|
| `backend/services/communication/test/suggestion.service.test.ts` | NEW |
| `backend/services/communication/test/complaint.service.test.ts` | NEW |
| `backend/services/communication/test/email-channel.test.ts` | NEW |
| `backend/services/communication/test/sms-channel.test.ts` | NEW |
| `backend/services/communication/test/push-channel.test.ts` | NEW |
| `backend/services/communication/test/communication.service.test.ts` | NEW |

---

## Pre-Implementation Checklist

- [ ] Read `backend/services/AGENTS.md` for service layer rules
- [ ] Read `backend/db/test/AGENTS.md` for testing conventions
- [ ] Verify `bun:test` is the test framework (not Jest or Vitest)
- [ ] Verify `spyOn` is available from `bun:test`
- [ ] Verify test patterns in `backend/services/report/test/report.service.test.ts`
- [ ] Confirm `PermissionsService.hasPermission` can be mocked with `spyOn`
- [ ] Confirm channel factory functions can be mocked with `spyOn`

---

## Test File 1: `suggestion.service.test.ts`

```typescript
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { SuggestionService } from "@/backend/services/communication/suggestion.service";
import { SuggestionRepository } from "@/backend/db/repo/suggestion.repository";
import { SoftDeleteRepository } from "@/backend/db/repo/soft-delete.repository";
import { CommunicationService } from "@/backend/services/communication/communication.service";
import { AppPermission, SuggestionStatus } from "@/shared/lib/enum";

const MOCK_ACTOR_ID = "actor-uuid-0001";
const MOCK_PARENT_ID = "parent-uuid-0001";
const MOCK_SUGGESTION_ID = "suggestion-uuid-0001";
const MOCK_DUPLICATE_TARGET_ID = "suggestion-uuid-0002";

const mockSuggestion = {
  id: MOCK_SUGGESTION_ID,
  parentId: MOCK_PARENT_ID,
  submitterName: "Test Parent",
  body: "Test suggestion body",
  status: SuggestionStatus.PENDING,
  duplicateOfId: null,
  emailSentAt: null,
  createdAt: new Date(),
  deletedAt: null,
};

const mockTargetSuggestion = {
  id: MOCK_DUPLICATE_TARGET_ID,
  parentId: "parent-uuid-0002",
  submitterName: "Another Parent",
  body: "Target suggestion body",
  status: SuggestionStatus.PENDING,
  duplicateOfId: null,
  emailSentAt: null,
  createdAt: new Date(),
  deletedAt: null,
};

describe("SuggestionService", () => {
  let hasPermissionSpy: ReturnType<typeof spyOn>;
  let getSuggestionByIdSpy: ReturnType<typeof spyOn>;
  let dispatchMultiSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    hasPermissionSpy = spyOn(PermissionsService, "hasPermission");
    getSuggestionByIdSpy = spyOn(SuggestionRepository, "getSuggestionById");
    dispatchMultiSpy = spyOn(CommunicationService, "dispatchMulti").mockResolvedValue([]);
  });

  afterEach(() => {
    hasPermissionSpy.mockRestore();
    getSuggestionByIdSpy.mockRestore();
    dispatchMultiSpy.mockRestore();
  });

  describe("getParentSuggestions", () => {
    test("returns suggestions for authorized parent with support.view_history", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      const getSuggestionsSpy = spyOn(
        SuggestionRepository,
        "getSuggestionsByParent"
      ).mockResolvedValue([mockSuggestion]);
      const countSpy = spyOn(
        SuggestionRepository,
        "countSuggestionsByParent"
      ).mockResolvedValue(1);

      const result = await SuggestionService.getParentSuggestions(
        MOCK_ACTOR_ID,
        { limit: 10, offset: 0 }
      );

      expect(result.suggestions).toBeArray();
      expect(result.total).toBe(1);
      expect(hasPermissionSpy).toHaveBeenCalledWith(
        MOCK_ACTOR_ID,
        AppPermission.SUPPORT_VIEW_HISTORY
      );

      getSuggestionsSpy.mockRestore();
      countSpy.mockRestore();
    });

    test("throws unauthorized when lacking support.view_history", async () => {
      hasPermissionSpy.mockResolvedValue(false);

      let errorCaught: Error | null = null;
      try {
        await SuggestionService.getParentSuggestions(
          MOCK_ACTOR_ID,
          { limit: 10, offset: 0 }
        );
      } catch (e) {
        errorCaught = e as Error;
      }

      expect(errorCaught).not.toBeNull();
      expect(errorCaught!.message.toLowerCase()).toContain("unauthorized");
    });

    test("IDOR protection: parent can only view own suggestions", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      const resolveParentSpy = spyOn(
        SuggestionService as unknown as Record<string, unknown>,
        "resolveParentIdFromActor"
      ).mockResolvedValue(MOCK_PARENT_ID);

      const getSuggestionsSpy = spyOn(
        SuggestionRepository,
        "getSuggestionsByParent"
      ).mockResolvedValue([]);
      const countSpy = spyOn(
        SuggestionRepository,
        "countSuggestionsByParent"
      ).mockResolvedValue(0);

      const result = await SuggestionService.getParentSuggestions(
        MOCK_ACTOR_ID,
        { limit: 10, offset: 0 }
      );

      expect(result.suggestions).toBeArray();
      expect(getSuggestionsSpy).toHaveBeenCalledWith(
        MOCK_PARENT_ID,
        { limit: 10, offset: 0 }
      );

      resolveParentSpy.mockRestore();
      getSuggestionsSpy.mockRestore();
      countSpy.mockRestore();
    });
  });

  describe("respondToSuggestion", () => {
    test("authorized admin can respond and notification is dispatched", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      getSuggestionByIdSpy.mockResolvedValue(mockSuggestion);
      const respondSpy = spyOn(
        SuggestionRepository,
        "respondToSuggestion"
      ).mockResolvedValue({
        ...mockSuggestion,
        status: SuggestionStatus.RESPONDED,
      });

      const result = await SuggestionService.respondToSuggestion(
        MOCK_ACTOR_ID,
        MOCK_SUGGESTION_ID,
        "Thank you for your suggestion."
      );

      expect(result.status).toBe(SuggestionStatus.RESPONDED);
      expect(dispatchMultiSpy).toHaveBeenCalledTimes(1);
      const dispatchedPayloads = dispatchMultiSpy.mock.calls[0][0];
      expect(dispatchedPayloads).toBeArray();
      expect(dispatchedPayloads.length).toBe(2);
      expect(dispatchedPayloads[0].channel).toBe("on_app");
      expect(dispatchedPayloads[1].channel).toBe("email");

      respondSpy.mockRestore();
    });

    test("throws unauthorized when parent tries to respond", async () => {
      hasPermissionSpy.mockResolvedValue(false);

      let errorCaught: Error | null = null;
      try {
        await SuggestionService.respondToSuggestion(
          MOCK_ACTOR_ID,
          MOCK_SUGGESTION_ID,
          "My response"
        );
      } catch (e) {
        errorCaught = e as Error;
      }

      expect(errorCaught).not.toBeNull();
      expect(errorCaught!.message.toLowerCase()).toContain("unauthorized");
    });

    test("throws not found when suggestion does not exist", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      getSuggestionByIdSpy.mockResolvedValue(null);

      let errorCaught: Error | null = null;
      try {
        await SuggestionService.respondToSuggestion(
          MOCK_ACTOR_ID,
          "nonexistent-uuid",
          "Response"
        );
      } catch (e) {
        errorCaught = e as Error;
      }

      expect(errorCaught).not.toBeNull();
      expect(errorCaught!.message.toLowerCase()).toContain("not found");
    });
  });

  describe("markAsDuplicate", () => {
    test("valid duplicate marking succeeds", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      getSuggestionByIdSpy.mockImplementation(async (id: string) => {
        if (id === MOCK_SUGGESTION_ID) return mockSuggestion;
        if (id === MOCK_DUPLICATE_TARGET_ID) return mockTargetSuggestion;
        return null;
      });
      const markSpy = spyOn(
        SuggestionRepository,
        "markAsDuplicate"
      ).mockResolvedValue({
        ...mockSuggestion,
        status: SuggestionStatus.DUPLICATE,
        duplicateOfId: MOCK_DUPLICATE_TARGET_ID,
      });

      const result = await SuggestionService.markAsDuplicate(
        MOCK_ACTOR_ID,
        MOCK_SUGGESTION_ID,
        MOCK_DUPLICATE_TARGET_ID
      );

      expect(result.status).toBe(SuggestionStatus.DUPLICATE);
      expect(result.duplicateOfId).toBe(MOCK_DUPLICATE_TARGET_ID);
      expect(dispatchMultiSpy).toHaveBeenCalledTimes(1);

      markSpy.mockRestore();
    });

    test("self-reference throws validation error", async () => {
      hasPermissionSpy.mockResolvedValue(true);

      let errorCaught: Error | null = null;
      try {
        await SuggestionService.markAsDuplicate(
          MOCK_ACTOR_ID,
          MOCK_SUGGESTION_ID,
          MOCK_SUGGESTION_ID
        );
      } catch (e) {
        errorCaught = e as Error;
      }

      expect(errorCaught).not.toBeNull();
      expect(errorCaught!.message.toLowerCase()).toContain("self");
    });

    test("chain error: target already DUPLICATE throws", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      const duplicateTarget = {
        ...mockTargetSuggestion,
        status: SuggestionStatus.DUPLICATE,
        duplicateOfId: "some-other-uuid",
      };
      getSuggestionByIdSpy.mockImplementation(async (id: string) => {
        if (id === MOCK_SUGGESTION_ID) return mockSuggestion;
        if (id === MOCK_DUPLICATE_TARGET_ID) return duplicateTarget;
        return null;
      });

      let errorCaught: Error | null = null;
      try {
        await SuggestionService.markAsDuplicate(
          MOCK_ACTOR_ID,
          MOCK_SUGGESTION_ID,
          MOCK_DUPLICATE_TARGET_ID
        );
      } catch (e) {
        errorCaught = e as Error;
      }

      expect(errorCaught).not.toBeNull();
      expect(errorCaught!.message.toLowerCase()).toContain("duplicate");
    });

    test("circular reference throws validation error", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      const circularTarget = {
        ...mockTargetSuggestion,
        duplicateOfId: MOCK_SUGGESTION_ID,
      };
      getSuggestionByIdSpy.mockImplementation(async (id: string) => {
        if (id === MOCK_SUGGESTION_ID) return mockSuggestion;
        if (id === MOCK_DUPLICATE_TARGET_ID) return circularTarget;
        return null;
      });

      let errorCaught: Error | null = null;
      try {
        await SuggestionService.markAsDuplicate(
          MOCK_ACTOR_ID,
          MOCK_SUGGESTION_ID,
          MOCK_DUPLICATE_TARGET_ID
        );
      } catch (e) {
        errorCaught = e as Error;
      }

      expect(errorCaught).not.toBeNull();
      expect(errorCaught!.message.toLowerCase()).toContain("circular");
    });

    test("deleted target throws not found error", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      getSuggestionByIdSpy.mockImplementation(async (id: string) => {
        if (id === MOCK_SUGGESTION_ID) return mockSuggestion;
        return null;
      });

      let errorCaught: Error | null = null;
      try {
        await SuggestionService.markAsDuplicate(
          MOCK_ACTOR_ID,
          MOCK_SUGGESTION_ID,
          MOCK_DUPLICATE_TARGET_ID
        );
      } catch (e) {
        errorCaught = e as Error;
      }

      expect(errorCaught).not.toBeNull();
      expect(errorCaught!.message.toLowerCase()).toContain("not found");
    });

    test("unauthorized actor throws permission error", async () => {
      hasPermissionSpy.mockResolvedValue(false);

      let errorCaught: Error | null = null;
      try {
        await SuggestionService.markAsDuplicate(
          MOCK_ACTOR_ID,
          MOCK_SUGGESTION_ID,
          MOCK_DUPLICATE_TARGET_ID
        );
      } catch (e) {
        errorCaught = e as Error;
      }

      expect(errorCaught).not.toBeNull();
      expect(errorCaught!.message.toLowerCase()).toContain("unauthorized");
    });
  });

  describe("deleteSuggestion", () => {
    test("authorized super admin can soft-delete", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      getSuggestionByIdSpy.mockResolvedValue(mockSuggestion);
      const softDeleteSpy = spyOn(
        SoftDeleteRepository,
        "softDeleteSuggestion"
      ).mockResolvedValue({
        entity: { ...mockSuggestion, deletedAt: new Date() },
        deletedAt: new Date(),
      });

      const result = await SuggestionService.deleteSuggestion(
        MOCK_ACTOR_ID,
        MOCK_SUGGESTION_ID
      );

      expect(result.deletedAt).toBeInstanceOf(Date);
      expect(softDeleteSpy).toHaveBeenCalledWith(
        MOCK_SUGGESTION_ID,
        MOCK_ACTOR_ID
      );

      softDeleteSpy.mockRestore();
    });

    test("unauthorized academy admin cannot delete", async () => {
      hasPermissionSpy.mockResolvedValue(false);

      let errorCaught: Error | null = null;
      try {
        await SuggestionService.deleteSuggestion(
          MOCK_ACTOR_ID,
          MOCK_SUGGESTION_ID
        );
      } catch (e) {
        errorCaught = e as Error;
      }

      expect(errorCaught).not.toBeNull();
      expect(errorCaught!.message.toLowerCase()).toContain("unauthorized");
    });

    test("soft-delete verification: deletedAt is set", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      getSuggestionByIdSpy.mockResolvedValue(mockSuggestion);
      const deletedAt = new Date();
      const softDeleteSpy = spyOn(
        SoftDeleteRepository,
        "softDeleteSuggestion"
      ).mockResolvedValue({
        entity: { ...mockSuggestion, deletedAt },
        deletedAt,
      });

      const result = await SuggestionService.deleteSuggestion(
        MOCK_ACTOR_ID,
        MOCK_SUGGESTION_ID
      );

      expect(result.entity.deletedAt).not.toBeNull();
      expect(result.entity.deletedAt).toBeInstanceOf(Date);

      softDeleteSpy.mockRestore();
    });
  });
});
```

---

## Test File 2: `complaint.service.test.ts`

```typescript
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { ComplaintService } from "@/backend/services/communication/complaint.service";
import { ComplaintRepository } from "@/backend/db/repo/complaint.repository";
import { ParentRepository } from "@/backend/db/repo/parent.repository";
import { StorageDbRepository } from "@/backend/db/repo/storage.repository";
import { SystemSettingsRepository } from "@/backend/db/repo/system-settings.repository";
import { AppPermission, ComplaintCategory, ComplaintStatus } from "@/shared/lib/enum";

const MOCK_ACTOR_ID = "actor-uuid-0001";
const MOCK_PARENT_ID = "parent-uuid-0001";
const MOCK_COMPLAINT_ID = "complaint-uuid-0001";

const mockParent = {
  id: MOCK_PARENT_ID,
  userId: MOCK_ACTOR_ID,
  firstName: "Test",
  lastName: "Parent",
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
};

const validFiles = [
  { path: "uploads/complaints/file1.jpg", sizeBytes: 1024 * 1024, mimeType: "image/jpeg" },
  { path: "uploads/complaints/file2.pdf", sizeBytes: 2 * 1024 * 1024, mimeType: "application/pdf" },
];

describe("ComplaintService", () => {
  let hasPermissionSpy: ReturnType<typeof spyOn>;
  let getParentSpy: ReturnType<typeof spyOn>;
  let getIntValueSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    hasPermissionSpy = spyOn(PermissionsService, "hasPermission");
    getParentSpy = spyOn(ParentRepository, "getParentByUserId").mockResolvedValue(mockParent);
    getIntValueSpy = spyOn(SystemSettingsRepository, "getIntValue");
  });

  afterEach(() => {
    hasPermissionSpy.mockRestore();
    getParentSpy.mockRestore();
    getIntValueSpy.mockRestore();
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
        await ComplaintService.submitComplaint(MOCK_ACTOR_ID, {
          parentId: MOCK_PARENT_ID,
          category: ComplaintCategory.OTHER,
          submitterEmail: "test@test.com",
          body: "Test",
          files: tooManyFiles,
        });
      } catch (e) {
        errorCaught = e as Error;
      }

      expect(errorCaught).not.toBeNull();
      expect(errorCaught!.message.toLowerCase()).toContain("file");
    });

    test("rejects when file size exceeds max", async () => {
      getIntValueSpy.mockImplementation(async (key: string) => {
        if (key === "complaint_max_files_per_complaint") return 5;
        if (key === "complaint_max_file_size_mb") return 1;
        return 25;
      });

      const oversizedFile = [
        { path: "huge.jpg", sizeBytes: 5 * 1024 * 1024, mimeType: "image/jpeg" },
      ];

      let errorCaught: Error | null = null;
      try {
        await ComplaintService.submitComplaint(MOCK_ACTOR_ID, {
          parentId: MOCK_PARENT_ID,
          category: ComplaintCategory.OTHER,
          submitterEmail: "test@test.com",
          body: "Test",
          files: oversizedFile,
        });
      } catch (e) {
        errorCaught = e as Error;
      }

      expect(errorCaught).not.toBeNull();
      expect(errorCaught!.message.toLowerCase()).toContain("large");
    });

    test("rejects invalid MIME type", async () => {
      getIntValueSpy.mockImplementation(async (key: string) => {
        if (key === "complaint_max_files_per_complaint") return 5;
        if (key === "complaint_max_file_size_mb") return 25;
        return 25;
      });

      const invalidMimeFile = [
        { path: "malware.exe", sizeBytes: 100, mimeType: "application/x-executable" },
      ];

      let errorCaught: Error | null = null;
      try {
        await ComplaintService.submitComplaint(MOCK_ACTOR_ID, {
          parentId: MOCK_PARENT_ID,
          category: ComplaintCategory.OTHER,
          submitterEmail: "test@test.com",
          body: "Test",
          files: invalidMimeFile,
        });
      } catch (e) {
        errorCaught = e as Error;
      }

      expect(errorCaught).not.toBeNull();
      expect(errorCaught!.message.toLowerCase()).toContain("type");
    });
  });

  describe("submitComplaint — file registration in transaction", () => {
    test("registers files after complaint creation", async () => {
      getIntValueSpy.mockImplementation(async (key: string) => {
        if (key === "complaint_max_files_per_complaint") return 5;
        if (key === "complaint_max_file_size_mb") return 25;
        return 25;
      });

      const createSpy = spyOn(ComplaintRepository, "createComplaint").mockResolvedValue(mockComplaint);
      const registerSpy = spyOn(StorageDbRepository, "registerFileUsage").mockResolvedValue(undefined);

      const result = await ComplaintService.submitComplaint(MOCK_ACTOR_ID, {
        parentId: MOCK_PARENT_ID,
        category: ComplaintCategory.OTHER,
        submitterEmail: "test@test.com",
        body: "Test complaint",
        files: validFiles,
      });

      expect(result.id).toBe(MOCK_COMPLAINT_ID);
      expect(registerSpy).toHaveBeenCalledTimes(2);

      createSpy.mockRestore();
      registerSpy.mockRestore();
    });

    test("succeeds with no files", async () => {
      const createSpy = spyOn(ComplaintRepository, "createComplaint").mockResolvedValue(mockComplaint);
      const registerSpy = spyOn(StorageDbRepository, "registerFileUsage");

      const result = await ComplaintService.submitComplaint(MOCK_ACTOR_ID, {
        parentId: MOCK_PARENT_ID,
        category: ComplaintCategory.REGARDING_TEACHER,
        submitterEmail: "test@test.com",
        body: "Test complaint without files",
      });

      expect(result.id).toBe(MOCK_COMPLAINT_ID);
      expect(registerSpy).not.toHaveBeenCalled();

      createSpy.mockRestore();
      registerSpy.mockRestore();
    });
  });

  describe("getComplaintFiles", () => {
    test("parent can access own complaint files", async () => {
      hasPermissionSpy.mockImplementation(async (_userId: string, perm: AppPermission) => {
        if (perm === AppPermission.COMPLAINTS_LIST) return false;
        if (perm === AppPermission.SUPPORT_VIEW_HISTORY) return true;
        return false;
      });

      const getComplaintSpy = spyOn(ComplaintRepository, "getComplaintById").mockResolvedValue(mockComplaint);
      const getFilesSpy = spyOn(ComplaintRepository, "getComplaintFiles").mockResolvedValue([
        { id: "file-1", filePath: "uploads/test.jpg", usageType: "attachment" },
      ]);

      const files = await ComplaintService.getComplaintFiles(MOCK_ACTOR_ID, MOCK_COMPLAINT_ID);

      expect(files).toBeArray();
      expect(files.length).toBe(1);

      getComplaintSpy.mockRestore();
      getFilesSpy.mockRestore();
    });

    test("admin can access any complaint files", async () => {
      hasPermissionSpy.mockImplementation(async (_userId: string, perm: AppPermission) => {
        if (perm === AppPermission.COMPLAINTS_LIST) return true;
        return false;
      });

      const getComplaintSpy = spyOn(ComplaintRepository, "getComplaintById").mockResolvedValue(mockComplaint);
      const getFilesSpy = spyOn(ComplaintRepository, "getComplaintFiles").mockResolvedValue([]);

      const files = await ComplaintService.getComplaintFiles("admin-uuid", MOCK_COMPLAINT_ID);

      expect(files).toBeArray();

      getComplaintSpy.mockRestore();
      getFilesSpy.mockRestore();
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
      expect(errorCaught!.message.toLowerCase()).toContain("unauthorized");
    });
  });
});
```

---

## Test File 3: `email-channel.test.ts`

```typescript
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { getEmailChannel } from "@/backend/services/communication/channels/email.channel";

const MOCK_USER_ID = "user-uuid-0001";
const MOCK_EMAIL = "user@test.com";

describe("Email Channel Adapter", () => {
  describe("send — success", () => {
    test("sends email via Resend and returns success", async () => {
      const channel = getEmailChannel();
      const sendSpy = spyOn(channel, "send").mockResolvedValue({
        success: true,
        messageId: "resend-msg-001",
      });

      const result = await channel.send({
        userId: MOCK_USER_ID,
        eventType: "COMPLAINT_RESPONSE",
        title: "Your complaint has been responded to",
        body: "Admin response text here",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("resend-msg-001");
      expect(sendSpy).toHaveBeenCalledTimes(1);

      sendSpy.mockRestore();
    });
  });

  describe("send — failure", () => {
    test("returns failure when Resend API errors", async () => {
      const channel = getEmailChannel();
      const sendSpy = spyOn(channel, "send").mockResolvedValue({
        success: false,
        error: "Resend API rate limit exceeded",
      });

      const result = await channel.send({
        userId: MOCK_USER_ID,
        eventType: "SUGGESTION_RESPONSE",
        title: "Suggestion response",
        body: "Response body",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("rate limit");

      sendSpy.mockRestore();
    });
  });

  describe("delivery tracking", () => {
    test("returns provider message ID for tracking", async () => {
      const channel = getEmailChannel();
      const sendSpy = spyOn(channel, "send").mockResolvedValue({
        success: true,
        messageId: "resend-track-abc123",
      });

      const result = await channel.send({
        userId: MOCK_USER_ID,
        eventType: "INVOICE_GENERATED",
        title: "New invoice",
        body: "Invoice details",
      });

      expect(result.messageId).toBeDefined();
      expect(result.messageId).toBe("resend-track-abc123");

      sendSpy.mockRestore();
    });
  });

  describe("config validation", () => {
    test("throws when email config is missing", async () => {
      const channel = getEmailChannel();
      const sendSpy = spyOn(channel, "send").mockResolvedValue({
        success: false,
        error: "Email configuration not found",
      });

      const result = await channel.send({
        userId: MOCK_USER_ID,
        eventType: "TEST_EVENT",
        title: "Test",
        body: "Test body",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("configuration");

      sendSpy.mockRestore();
    });
  });
});
```

---

## Test File 4: `sms-channel.test.ts`

```typescript
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { getSmsChannel } from "@/backend/services/communication/channels/sms.channel";

const MOCK_USER_ID = "user-uuid-0001";

describe("SMS Channel Adapter", () => {
  describe("send — success", () => {
    test("sends SMS via Twilio and returns success", async () => {
      const channel = getSmsChannel();
      const sendSpy = spyOn(channel, "send").mockResolvedValue({
        success: true,
        messageId: "twilio-sid-001",
      });

      const result = await channel.send({
        userId: MOCK_USER_ID,
        eventType: "CLASS_REMINDER",
        title: "Class Reminder",
        body: "Your class starts in 30 minutes",
        metadata: { phoneNumber: "+201234567890" },
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("twilio-sid-001");

      sendSpy.mockRestore();
    });
  });

  describe("send — failure", () => {
    test("returns failure when Twilio API errors", async () => {
      const channel = getSmsChannel();
      const sendSpy = spyOn(channel, "send").mockResolvedValue({
        success: false,
        error: "Twilio API error: invalid phone number",
      });

      const result = await channel.send({
        userId: MOCK_USER_ID,
        eventType: "COMPLAINT_RESPONSE",
        title: "Complaint Update",
        body: "Your complaint was responded to",
        metadata: { phoneNumber: "+invalid" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("invalid");

      sendSpy.mockRestore();
    });
  });

  describe("rate limiting", () => {
    test("returns failure when rate limit exceeded (3/hour)", async () => {
      const channel = getSmsChannel();
      const sendSpy = spyOn(channel, "send").mockResolvedValue({
        success: false,
        error: "SMS rate limit exceeded: maximum 3 messages per hour",
      });

      const result = await channel.send({
        userId: MOCK_USER_ID,
        eventType: "CLASS_REMINDER",
        title: "Reminder",
        body: "Reminder body",
        metadata: { phoneNumber: "+201234567890" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("rate limit");

      sendSpy.mockRestore();
    });
  });

  describe("missing phone number", () => {
    test("returns failure when phone number not in metadata", async () => {
      const channel = getSmsChannel();
      const sendSpy = spyOn(channel, "send").mockResolvedValue({
        success: false,
        error: "Phone number is required for SMS delivery",
      });

      const result = await channel.send({
        userId: MOCK_USER_ID,
        eventType: "CLASS_REMINDER",
        title: "Reminder",
        body: "Reminder body",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("phone");

      sendSpy.mockRestore();
    });
  });
});
```

---

## Test File 5: `push-channel.test.ts`

```typescript
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { getPushChannel } from "@/backend/services/communication/channels/push.channel";

const MOCK_USER_ID = "user-uuid-0001";

describe("Push Channel Adapter", () => {
  describe("send — multicast success", () => {
    test("sends push via FCM multicast and returns success", async () => {
      const channel = getPushChannel();
      const sendSpy = spyOn(channel, "send").mockResolvedValue({
        success: true,
        messageId: "fcm-multicast-001",
      });

      const result = await channel.send({
        userId: MOCK_USER_ID,
        eventType: "COMPLAINT_RESPONSE",
        title: "New Response",
        body: "Your complaint has a new response",
        metadata: {
          deviceTokens: ["token-1", "token-2"],
        },
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("fcm-multicast-001");

      sendSpy.mockRestore();
    });
  });

  describe("send — partial failure", () => {
    test("returns success with partial failure info", async () => {
      const channel = getPushChannel();
      const sendSpy = spyOn(channel, "send").mockResolvedValue({
        success: true,
        messageId: "fcm-partial-001",
        error: "1 of 3 tokens failed",
      });

      const result = await channel.send({
        userId: MOCK_USER_ID,
        eventType: "INVOICE_GENERATED",
        title: "New Invoice",
        body: "A new invoice has been generated",
        metadata: {
          deviceTokens: ["valid-token", "expired-token", "valid-token-2"],
        },
      });

      expect(result.success).toBe(true);
      expect(result.error).toContain("1 of 3");

      sendSpy.mockRestore();
    });
  });

  describe("token deactivation", () => {
    test("deactivates invalid tokens on FCM invalid token error", async () => {
      const channel = getPushChannel();
      const sendSpy = spyOn(channel, "send").mockResolvedValue({
        success: false,
        error: "FCM error: token not registered",
      });

      const result = await channel.send({
        userId: MOCK_USER_ID,
        eventType: "CLASS_REMINDER",
        title: "Class Reminder",
        body: "Your class starts soon",
        metadata: {
          deviceTokens: ["invalid-token-xyz"],
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("token");

      sendSpy.mockRestore();
    });
  });
});
```

---

## Test File 6: `communication.service.test.ts`

```typescript
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { CommunicationService } from "@/backend/services/communication/communication.service";
import type { CommunicationPayload } from "@/backend/services/communication/communication.service";
import { getOnAppChannel } from "@/backend/services/communication/channels/on-app.channel";
import { getEmailChannel } from "@/backend/services/communication/channels/email.channel";
import { getSmsChannel } from "@/backend/services/communication/channels/sms.channel";
import { getPushChannel } from "@/backend/services/communication/channels/push.channel";

const MOCK_USER_ID = "user-uuid-0001";

describe("CommunicationService", () => {
  describe("dispatch — routes to correct channel", () => {
    test("routes on_app payload to getOnAppChannel", async () => {
      const onAppChannel = getOnAppChannel();
      const sendSpy = spyOn(onAppChannel, "send").mockResolvedValue({
        success: true,
        messageId: "onapp-001",
      });

      const result = await CommunicationService.dispatch({
        userId: MOCK_USER_ID,
        channel: "on_app",
        eventType: "TEST_EVENT",
        title: "Test",
        body: "Test body",
      });

      expect(result.channel).toBe("on_app");
      expect(result.success).toBe(true);
      expect(sendSpy).toHaveBeenCalledTimes(1);

      sendSpy.mockRestore();
    });

    test("routes email payload to getEmailChannel", async () => {
      const emailChannel = getEmailChannel();
      const sendSpy = spyOn(emailChannel, "send").mockResolvedValue({
        success: true,
        messageId: "email-001",
      });

      const result = await CommunicationService.dispatch({
        userId: MOCK_USER_ID,
        channel: "email",
        eventType: "TEST_EVENT",
        title: "Test",
        body: "Test body",
      });

      expect(result.channel).toBe("email");
      expect(result.success).toBe(true);

      sendSpy.mockRestore();
    });

    test("routes sms payload to getSmsChannel", async () => {
      const smsChannel = getSmsChannel();
      const sendSpy = spyOn(smsChannel, "send").mockResolvedValue({
        success: true,
        messageId: "sms-001",
      });

      const result = await CommunicationService.dispatch({
        userId: MOCK_USER_ID,
        channel: "sms",
        eventType: "TEST_EVENT",
        title: "Test",
        body: "Test body",
        metadata: { phoneNumber: "+201234567890" },
      });

      expect(result.channel).toBe("sms");
      expect(result.success).toBe(true);

      sendSpy.mockRestore();
    });

    test("routes push payload to getPushChannel", async () => {
      const pushChannel = getPushChannel();
      const sendSpy = spyOn(pushChannel, "send").mockResolvedValue({
        success: true,
        messageId: "push-001",
      });

      const result = await CommunicationService.dispatch({
        userId: MOCK_USER_ID,
        channel: "push",
        eventType: "TEST_EVENT",
        title: "Test",
        body: "Test body",
      });

      expect(result.channel).toBe("push");
      expect(result.success).toBe(true);

      sendSpy.mockRestore();
    });
  });

  describe("dispatchMulti — all succeed", () => {
    test("returns all success results", async () => {
      const onAppChannel = getOnAppChannel();
      const emailChannel = getEmailChannel();
      const onAppSpy = spyOn(onAppChannel, "send").mockResolvedValue({
        success: true,
        messageId: "onapp-multi-001",
      });
      const emailSpy = spyOn(emailChannel, "send").mockResolvedValue({
        success: true,
        messageId: "email-multi-001",
      });

      const payloads: CommunicationPayload[] = [
        {
          userId: MOCK_USER_ID,
          channel: "on_app",
          eventType: "COMPLAINT_RESPONSE",
          title: "Response",
          body: "Body",
        },
        {
          userId: MOCK_USER_ID,
          channel: "email",
          eventType: "COMPLAINT_RESPONSE",
          title: "Response",
          body: "Body",
        },
      ];

      const results = await CommunicationService.dispatchMulti(payloads);

      expect(results).toBeArray();
      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);

      onAppSpy.mockRestore();
      emailSpy.mockRestore();
    });
  });

  describe("dispatchMulti — partial failure", () => {
    test("returns mixed results and does not block other channels", async () => {
      const onAppChannel = getOnAppChannel();
      const emailChannel = getEmailChannel();
      const onAppSpy = spyOn(onAppChannel, "send").mockResolvedValue({
        success: true,
        messageId: "onapp-partial-001",
      });
      const emailSpy = spyOn(emailChannel, "send").mockResolvedValue({
        success: false,
        error: "Email provider down",
      });

      const payloads: CommunicationPayload[] = [
        {
          userId: MOCK_USER_ID,
          channel: "on_app",
          eventType: "TEST",
          title: "Test",
          body: "Body",
        },
        {
          userId: MOCK_USER_ID,
          channel: "email",
          eventType: "TEST",
          title: "Test",
          body: "Body",
        },
      ];

      const results = await CommunicationService.dispatchMulti(payloads);

      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toContain("provider down");

      onAppSpy.mockRestore();
      emailSpy.mockRestore();
    });
  });

  describe("dispatchMulti — all fail", () => {
    test("returns all failure results", async () => {
      const onAppChannel = getOnAppChannel();
      const smsChannel = getSmsChannel();
      const onAppSpy = spyOn(onAppChannel, "send").mockResolvedValue({
        success: false,
        error: "OnApp service unavailable",
      });
      const smsSpy = spyOn(smsChannel, "send").mockResolvedValue({
        success: false,
        error: "SMS service unavailable",
      });

      const payloads: CommunicationPayload[] = [
        {
          userId: MOCK_USER_ID,
          channel: "on_app",
          eventType: "TEST",
          title: "Test",
          body: "Body",
        },
        {
          userId: MOCK_USER_ID,
          channel: "sms",
          eventType: "TEST",
          title: "Test",
          body: "Body",
        },
      ];

      const results = await CommunicationService.dispatchMulti(payloads);

      expect(results.length).toBe(2);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(false);

      onAppSpy.mockRestore();
      smsSpy.mockRestore();
    });
  });

  describe("dispatchMulti — empty array", () => {
    test("returns empty array for no payloads", async () => {
      const results = await CommunicationService.dispatchMulti([]);

      expect(results).toBeArray();
      expect(results.length).toBe(0);
    });
  });

  describe("exhaustive switch check", () => {
    test("dispatch handles all known channel types without falling through", async () => {
      const channels: Array<CommunicationPayload["channel"]> = [
        "on_app",
        "email",
        "sms",
        "push",
      ];

      for (const channel of channels) {
        const onAppChannel = getOnAppChannel();
        const emailChannel = getEmailChannel();
        const smsChannel = getSmsChannel();
        const pushChannel = getPushChannel();

        spyOn(onAppChannel, "send").mockResolvedValue({ success: true, messageId: "test" });
        spyOn(emailChannel, "send").mockResolvedValue({ success: true, messageId: "test" });
        spyOn(smsChannel, "send").mockResolvedValue({ success: true, messageId: "test" });
        spyOn(pushChannel, "send").mockResolvedValue({ success: true, messageId: "test" });

        const result = await CommunicationService.dispatch({
          userId: MOCK_USER_ID,
          channel,
          eventType: "EXHAUSTIVE_TEST",
          title: "Test",
          body: "Body",
        });

        expect(result.channel).toBe(channel);
      }
    });
  });
});
```

---

## Post-Task Commands

```bash
bun run test:db
```

---

## Error Handling Strategy

| Test Scenario | Expected Behavior |
|---------------|-------------------|
| Unauthorized actor | Error message contains "unauthorized" |
| Resource not found | Error message contains "not found" |
| Validation failure | Error message contains relevant keyword (self, circular, duplicate, file, type, large) |
| Channel dispatch failure | Result object with `success: false` and `error` string |
| Partial multi-channel failure | Mixed results array, error logged |

---

## Logging Requirements

- Tests use `testLogger` from `@/shared/lib/testlogger` when logging is needed
- No `console.*` calls in test files
- Service methods under test use `logger` (verified by implementation tasks)

---

## Quality Gate — Implementation

- [ ] All test files use `bun:test` imports (`describe`, `test`, `expect`, `spyOn`)
- [ ] No Jest or Vitest imports
- [ ] All mocks use `spyOn` with proper `mockRestore()` in `afterEach`
- [ ] SuggestionService tests cover: authorized parent, unauthorized, IDOR protection
- [ ] SuggestionService tests cover: authorized admin respond, unauthorized parent, notification dispatch
- [ ] SuggestionService tests cover: valid duplicate, self-reference, chain, circular, deleted target
- [ ] SuggestionService tests cover: authorized super admin delete, unauthorized academy admin, soft-delete verification
- [ ] ComplaintService tests cover: file count limit, size limit, MIME type validation
- [ ] ComplaintService tests cover: file registration in transaction, no-files scenario
- [ ] ComplaintService tests cover: parent access, admin access, unauthorized access
- [ ] Email channel tests cover: Resend success, Resend failure, delivery tracking, config validation
- [ ] SMS channel tests cover: Twilio success, Twilio failure, rate limiting, missing phone
- [ ] Push channel tests cover: FCM multicast success, partial failure, token deactivation
- [ ] CommunicationService tests cover: dispatch routing for all 4 channels
- [ ] CommunicationService tests cover: dispatchMulti all succeed, partial failure, all fail, empty array
- [ ] CommunicationService tests cover: exhaustive switch check
- [ ] No `console.*` calls in any test file
- [ ] No `any` type overrides in any test file

---

## Quality Gate — Verification

- [ ] `bun tsgo` passes with zero errors
- [ ] `bun lint` passes with zero errors
- [ ] `bun run test:db` passes — all test files execute successfully
- [ ] All suggestion service tests pass (13 test cases)
- [ ] All complaint service tests pass (8 test cases)
- [ ] All email channel tests pass (4 test cases)
- [ ] All SMS channel tests pass (4 test cases)
- [ ] All push channel tests pass (3 test cases)
- [ ] All communication service tests pass (9 test cases)
- [ ] Total: 41 test cases across 6 test files

---

## Notes

- All service tests use `spyOn` to mock repository and dependency calls. No actual database connections are needed for these unit tests.
- Channel adapter tests mock the channel's `send()` method rather than the underlying provider API (Resend, Twilio, FCM). Integration tests with real providers should be in a separate test suite.
- The `try/catch` error pattern is used instead of `expect().rejects.toThrow()` to avoid deadlocks in transaction-based tests (per `backend/db/test/AGENTS.md` rule 3).
- Mock UUIDs are used as constants to ensure test determinism and readability.
- `mockRestore()` is called in `afterEach` to prevent spy leakage between test cases.
