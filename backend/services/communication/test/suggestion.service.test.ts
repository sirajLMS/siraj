import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { ParentRepository, SoftDeleteRepository, SuggestionRepository, UserRepository } from "@/backend/db/repo";
import { AccountStatus, AppPermission, SuggestionStatus } from "@/backend/enum";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import { PermissionsService } from "@/backend/services";
import { CommunicationService } from "@/backend/services/communication/communication.service";
import { SuggestionService } from "@/backend/services/communication/suggestion.service";
import type { SuggestionSelectType, UserSelectType } from "@/backend/types";

const MOCK_ACTOR_ID = "actor-uuid-0001";
const MOCK_PARENT_ID = "parent-uuid-0001";
const MOCK_SUGGESTION_ID = "suggestion-uuid-0001";
const MOCK_DUPLICATE_TARGET_ID = "suggestion-uuid-0002";

const mockSuggestionRow = {
  id: MOCK_SUGGESTION_ID,
  parentId: MOCK_PARENT_ID,
  parentName: "Test Parent",
  submitterName: "Test Parent",
  body: "Test suggestion body",
  status: SuggestionStatus.PENDING,
  adminResponse: null,
  duplicateOfId: null,
  duplicateOfBody: null,
  duplicateOfSubmitterName: null,
  reviewedByUserId: null,
  reviewerName: null,
  reviewedAt: null,
  emailSentAt: null,
  createdAt: new Date(),
} satisfies SuggestionRepository.SuggestionDetailRow;

const mockSuggestionSelect = {
  id: MOCK_SUGGESTION_ID,
  parentId: MOCK_PARENT_ID,
  submitterName: "Test Parent",
  body: "Test suggestion body",
  status: SuggestionStatus.PENDING,
  adminResponse: null,
  duplicateOfId: null,
  reviewedByUserId: null,
  reviewedAt: null,
  emailSentAt: null,
  createdAt: new Date(),
  deletedAt: null,
} satisfies SuggestionSelectType;

const mockTargetSuggestionRow = {
  id: MOCK_DUPLICATE_TARGET_ID,
  parentId: "parent-uuid-0002",
  parentName: "Another Parent",
  submitterName: "Another Parent",
  body: "Target suggestion body",
  status: SuggestionStatus.PENDING,
  adminResponse: null,
  duplicateOfId: null,
  duplicateOfBody: null,
  duplicateOfSubmitterName: null,
  reviewedByUserId: null,
  reviewerName: null,
  reviewedAt: null,
  emailSentAt: null,
  createdAt: new Date(),
} satisfies SuggestionRepository.SuggestionDetailRow;

const mockParent = {
  id: MOCK_PARENT_ID,
  userId: MOCK_ACTOR_ID,
  status: "REGULAR",
  lifecycleStatus: "REGULAR",
  accountStatus: AccountStatus.ACTIVATED,
  phone: null,
  nationality: null,
  address: null,
  facebook: null,
  whatsapp: null,
  twitter: null,
  invoiceType: null,
  feeAmount: null,
  currency: null,
  displayCurrency: null,
  timezone: IanaTimezone.UTC,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockParentProfile = {
  id: MOCK_PARENT_ID,
  userId: MOCK_ACTOR_ID,
  name: "Test Parent",
  email: "parent@test.com",
  avatarUrl: null,
  lifecycleStatus: "REGULAR",
  accountStatus: AccountStatus.ACTIVATED,
  phone: null,
  nationality: null,
  address: null,
  facebook: null,
  whatsapp: null,
  twitter: null,
  invoiceType: null,
  feeAmount: null,
  currency: null,
  displayCurrency: null,
  timezone: IanaTimezone.UTC,
  createdAt: new Date(),
  updatedAt: new Date(),
};

async function expectErrorMatching(promise: Promise<unknown>, predicate: (message: string) => boolean) {
  let errorCaught: Error | null = null;
  try {
    await promise;
  } catch (e) {
    errorCaught = e as Error;
  }
  expect(errorCaught).not.toBeNull();
  expect(predicate(errorCaught?.message?.toLowerCase() ?? "")).toBe(true);
}

describe("SuggestionService", () => {
  let hasPermissionSpy: ReturnType<typeof spyOn>;
  let getSuggestionByIdSpy: ReturnType<typeof spyOn>;
  let dispatchMultiSpy: ReturnType<typeof spyOn>;
  let dispatchSpy: ReturnType<typeof spyOn>;
  let findByUserIdSpy: ReturnType<typeof spyOn>;
  let getParentProfileSpy: ReturnType<typeof spyOn>;
  let getSuggestionsByParentSpy: ReturnType<typeof spyOn>;
  let respondToSuggestionSpy: ReturnType<typeof spyOn>;
  let markAsDuplicateSpy: ReturnType<typeof spyOn>;
  let softDeleteSuggestionSpy: ReturnType<typeof spyOn>;
  let submitSuggestionRepoSpy: ReturnType<typeof spyOn>;
  let findSafeByIdSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    getSuggestionByIdSpy = spyOn(SuggestionRepository, "getSuggestionById").mockResolvedValue(mockSuggestionRow);
    dispatchMultiSpy = spyOn(CommunicationService, "dispatchMulti").mockResolvedValue([]);
    dispatchSpy = spyOn(CommunicationService, "dispatch").mockResolvedValue({ channel: "on_app", success: true });
    findByUserIdSpy = spyOn(ParentRepository, "findByUserId").mockResolvedValue(mockParent);
    getParentProfileSpy = spyOn(ParentRepository, "getParentProfile").mockResolvedValue(mockParentProfile);
    getSuggestionsByParentSpy = spyOn(SuggestionRepository, "getSuggestionsByParent").mockResolvedValue([]);
    respondToSuggestionSpy = spyOn(SuggestionRepository, "respondToSuggestion").mockResolvedValue({
      ...mockSuggestionSelect,
      status: SuggestionStatus.REVIEWED,
    });
    markAsDuplicateSpy = spyOn(SuggestionRepository, "markAsDuplicate").mockResolvedValue({
      ...mockSuggestionSelect,
      status: SuggestionStatus.DUPLICATE,
      duplicateOfId: MOCK_DUPLICATE_TARGET_ID,
    });
    softDeleteSuggestionSpy = spyOn(SoftDeleteRepository, "softDeleteSuggestion").mockResolvedValue({
      entity: { ...mockSuggestionSelect, deletedAt: new Date() },
      deletedAt: new Date(),
    });
    // `submitSuggestion` performs a real DB insert; mock it so the service
    // tests don't require a live database (and avoid the non-UUID parent id).
    submitSuggestionRepoSpy = spyOn(SuggestionRepository, "submitSuggestion").mockResolvedValue(mockSuggestionSelect);
    // Default: submitter user has an email — recipient resolution stamps `to`.
    findSafeByIdSpy = spyOn(UserRepository, "findSafeById").mockResolvedValue({
      email: "parent@test.com",
      phone: null,
    } as unknown as UserSelectType);
  });

  afterEach(() => {
    hasPermissionSpy.mockRestore();
    getSuggestionByIdSpy.mockRestore();
    dispatchMultiSpy.mockRestore();
    dispatchSpy.mockRestore();
    findByUserIdSpy.mockRestore();
    getParentProfileSpy.mockRestore();
    getSuggestionsByParentSpy.mockRestore();
    respondToSuggestionSpy.mockRestore();
    markAsDuplicateSpy.mockRestore();
    softDeleteSuggestionSpy.mockRestore();
    submitSuggestionRepoSpy.mockRestore();
    findSafeByIdSpy.mockRestore();
  });

  function mockSuggestionLookup(targetResult?: SuggestionRepository.SuggestionDetailRow | null) {
    getSuggestionByIdSpy.mockImplementation(async (id: string) => {
      if (id === MOCK_SUGGESTION_ID) return mockSuggestionRow;
      if (id === MOCK_DUPLICATE_TARGET_ID) return targetResult ?? null;
      return null;
    });
  }

  describe("getParentSuggestions", () => {
    test("returns suggestions for authorized parent with support.view_history", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      getSuggestionsByParentSpy.mockResolvedValue([mockSuggestionSelect]);

      const result = await SuggestionService.getParentSuggestions(MOCK_ACTOR_ID, { limit: 10, offset: 0 });

      expect(result).toHaveLength(1);
      expect(hasPermissionSpy).toHaveBeenCalledWith(MOCK_ACTOR_ID, AppPermission.SUPPORT_VIEW_HISTORY);
      expect(getSuggestionsByParentSpy).toHaveBeenCalledWith(MOCK_PARENT_ID, { limit: 10, offset: 0 });
    });

    test("throws unauthorized when lacking support.view_history", async () => {
      hasPermissionSpy.mockResolvedValue(false);
      await expectErrorMatching(SuggestionService.getParentSuggestions(MOCK_ACTOR_ID, { limit: 10, offset: 0 }), msg =>
        msg.includes("permission")
      );
    });

    test("IDOR protection: parent can only view own suggestions", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      getSuggestionsByParentSpy.mockResolvedValue([]);

      await SuggestionService.getParentSuggestions(MOCK_ACTOR_ID, { limit: 10, offset: 0 });

      expect(getSuggestionsByParentSpy).toHaveBeenCalledWith(MOCK_PARENT_ID, { limit: 10, offset: 0 });
    });
  });

  describe("respondToSuggestion", () => {
    test("authorized admin can respond and notification is dispatched", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      getSuggestionByIdSpy.mockResolvedValue(mockSuggestionRow);
      respondToSuggestionSpy.mockResolvedValue({ ...mockSuggestionSelect, status: SuggestionStatus.REVIEWED });
      getParentProfileSpy.mockResolvedValue(mockParentProfile);
      dispatchMultiSpy.mockResolvedValue([]);

      const result = await SuggestionService.respondToSuggestion(
        MOCK_ACTOR_ID,
        MOCK_SUGGESTION_ID,
        "Thank you for your suggestion."
      );

      expect(result.status).toBe(SuggestionStatus.REVIEWED);
      expect(dispatchMultiSpy).toHaveBeenCalledTimes(1);
      const dispatchedPayloads = dispatchMultiSpy.mock.calls[0][0];
      expect(dispatchedPayloads).toHaveLength(2);
      expect(dispatchedPayloads[0].channel).toBe("on_app");
      expect(dispatchedPayloads[1].channel).toBe("email");
      // Legacy direct-dispatch path must stamp `metadata.to` on the email payload.
      expect(dispatchedPayloads[1].metadata?.to).toBe("parent@test.com");
    });

    test("throws unauthorized when parent tries to respond", async () => {
      hasPermissionSpy.mockResolvedValue(false);
      await expectErrorMatching(
        SuggestionService.respondToSuggestion(MOCK_ACTOR_ID, MOCK_SUGGESTION_ID, "My response"),
        msg => msg.includes("permission")
      );
    });

    test("throws not found when suggestion does not exist", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      getSuggestionByIdSpy.mockResolvedValue(null);
      await expectErrorMatching(
        SuggestionService.respondToSuggestion(MOCK_ACTOR_ID, "nonexistent-uuid", "Response"),
        msg => msg.includes("suggestionnotfound")
      );
    });
  });

  describe("submitSuggestion", () => {
    test("dispatches NEW_SUGGESTION email with `metadata.to` set to the submitter's email", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      findByUserIdSpy.mockResolvedValue(mockParent);
      findSafeByIdSpy.mockResolvedValue({ email: "parent@test.com", phone: null } as unknown as UserSelectType);
      dispatchSpy.mockResolvedValue({ channel: "email", success: true });

      await SuggestionService.submitSuggestion(MOCK_ACTOR_ID, {
        submitterName: "Test Parent",
        body: "A new suggestion",
      });

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      const dispatchedPayload = dispatchSpy.mock.calls[0][0];
      expect(dispatchedPayload.channel).toBe("email");
      expect(dispatchedPayload.metadata?.to).toBe("parent@test.com");
    });

    test("skips email dispatch when submitter has no email", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      findByUserIdSpy.mockResolvedValue(mockParent);
      findSafeByIdSpy.mockResolvedValue({ email: null, phone: null } as unknown as UserSelectType);

      await SuggestionService.submitSuggestion(MOCK_ACTOR_ID, {
        submitterName: "Test Parent",
        body: "A new suggestion",
      });

      expect(dispatchSpy).not.toHaveBeenCalled();
    });
  });

  describe("markAsDuplicate", () => {
    test("valid duplicate marking succeeds", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      mockSuggestionLookup(mockTargetSuggestionRow);
      markAsDuplicateSpy.mockResolvedValue({
        ...mockSuggestionSelect,
        status: SuggestionStatus.DUPLICATE,
        duplicateOfId: MOCK_DUPLICATE_TARGET_ID,
      });
      getParentProfileSpy.mockResolvedValue(mockParentProfile);
      dispatchSpy.mockResolvedValue({ channel: "on_app", success: true });

      const result = await SuggestionService.markAsDuplicate(
        MOCK_ACTOR_ID,
        MOCK_SUGGESTION_ID,
        MOCK_DUPLICATE_TARGET_ID
      );

      expect(result.status).toBe(SuggestionStatus.DUPLICATE);
      expect(result.duplicateOfId).toBe(MOCK_DUPLICATE_TARGET_ID);
      expect(dispatchSpy).toHaveBeenCalledTimes(1);
    });

    test("self-reference throws validation error", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      await expectErrorMatching(
        SuggestionService.markAsDuplicate(MOCK_ACTOR_ID, MOCK_SUGGESTION_ID, MOCK_SUGGESTION_ID, "en"),
        msg => msg.includes("self") || msg.includes("نفسه")
      );
    });

    test("chain error: target already DUPLICATE throws", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      const duplicateTarget = {
        ...mockTargetSuggestionRow,
        status: SuggestionStatus.DUPLICATE,
        duplicateOfId: "some-other-uuid",
      };
      mockSuggestionLookup(duplicateTarget);
      await expectErrorMatching(
        SuggestionService.markAsDuplicate(MOCK_ACTOR_ID, MOCK_SUGGESTION_ID, MOCK_DUPLICATE_TARGET_ID, "en"),
        msg => msg.includes("duplicate") || msg.includes("مكررة")
      );
    });

    test("circular reference throws validation error", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      const circularTarget = { ...mockTargetSuggestionRow, duplicateOfId: MOCK_SUGGESTION_ID };
      mockSuggestionLookup(circularTarget);
      await expectErrorMatching(
        SuggestionService.markAsDuplicate(MOCK_ACTOR_ID, MOCK_SUGGESTION_ID, MOCK_DUPLICATE_TARGET_ID, "en"),
        msg => msg.includes("circular") || msg.includes("دائري")
      );
    });

    test("deleted target throws not found error", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      mockSuggestionLookup();
      await expectErrorMatching(
        SuggestionService.markAsDuplicate(MOCK_ACTOR_ID, MOCK_SUGGESTION_ID, MOCK_DUPLICATE_TARGET_ID),
        msg => msg.includes("suggestion.notfound")
      );
    });

    test("unauthorized actor throws permission error", async () => {
      hasPermissionSpy.mockResolvedValue(false);
      await expectErrorMatching(
        SuggestionService.markAsDuplicate(MOCK_ACTOR_ID, MOCK_SUGGESTION_ID, MOCK_DUPLICATE_TARGET_ID),
        msg => msg.includes("permission")
      );
    });
  });

  describe("deleteSuggestion", () => {
    test("authorized super admin can soft-delete", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      getSuggestionByIdSpy.mockResolvedValue(mockSuggestionRow);
      softDeleteSuggestionSpy.mockResolvedValue({
        entity: { ...mockSuggestionSelect, deletedAt: new Date() },
        deletedAt: new Date(),
      });

      const result = await SuggestionService.deleteSuggestion(MOCK_ACTOR_ID, MOCK_SUGGESTION_ID);

      expect(result.deletedAt).toBeDefined();
      expect(softDeleteSuggestionSpy).toHaveBeenCalledWith(MOCK_SUGGESTION_ID, MOCK_ACTOR_ID);
    });

    test("unauthorized academy admin cannot delete", async () => {
      hasPermissionSpy.mockResolvedValue(false);
      await expectErrorMatching(SuggestionService.deleteSuggestion(MOCK_ACTOR_ID, MOCK_SUGGESTION_ID), msg =>
        msg.includes("permission")
      );
    });

    test("soft-delete verification: deletedAt is set", async () => {
      hasPermissionSpy.mockResolvedValue(true);
      getSuggestionByIdSpy.mockResolvedValue(mockSuggestionRow);
      const deletedAt = new Date();
      softDeleteSuggestionSpy.mockResolvedValue({ entity: { ...mockSuggestionSelect, deletedAt }, deletedAt });

      const result = await SuggestionService.deleteSuggestion(MOCK_ACTOR_ID, MOCK_SUGGESTION_ID);

      expect(result.deletedAt).toBeDefined();
      expect(new Date(result.deletedAt)).toBeInstanceOf(Date);
    });
  });
});
