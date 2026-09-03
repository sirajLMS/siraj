import { beforeEach, describe, expect, it, mock } from "bun:test";
import { classInstances, leaveRequests } from "@/backend/db/schema";
import { AppPermission, LeaveRequesterType, LeaveRequestStatus, LeaveRequestType } from "@/backend/enum";
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from "@/backend/lib/errors";
import type { LeaveRequestSelectType } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

// ---------------------------------------------------------------------------
// Mock dependencies before importing LeaveRequestService
// ---------------------------------------------------------------------------

let mockHasPermission = mock((_userId: string, _perm: AppPermission) => Promise.resolve(true));

await mock.module("@/backend/services/auth/permissions.service", () => ({
  PermissionsService: {
    hasPermission: (userId: string, perm: AppPermission) => mockHasPermission(userId, perm),
  },
}));

let mockEnvConfig = mock((_key: string) => Promise.resolve("12"));

await mock.module("@/backend/services", () => ({
  resolveEnvConfig: (key: string) => mockEnvConfig(key),
}));

// State for database query mocks
let mockClassInstance: Record<string, unknown> | null = null;
let mockLeaveRequestsQueryResponse: LeaveRequestSelectType[] = [];
let mockInsertResponse: LeaveRequestSelectType[] = [];
let mockUpdateResponse: LeaveRequestSelectType[] = [];

function resolveTableResponse(table: unknown): unknown[] {
  if (table === classInstances) {
    return mockClassInstance ? [mockClassInstance] : [];
  }
  if (table === leaveRequests) {
    return mockLeaveRequestsQueryResponse;
  }
  return mockLeaveRequestsQueryResponse;
}

function createChainableQuery(data: unknown[]) {
  const limit = mock((_n: number) => Promise.resolve(data));
  const then = (resolve: (val: unknown) => void) => resolve(data);
  return { limit, then };
}

const mockQueryDb = mock((_tx?: unknown) => ({
  select: mock((_fields?: unknown) => ({
    from: mock((table: unknown) => {
      const data = resolveTableResponse(table);
      const whereChain = createChainableQuery(data);
      const where = mock((_condition: unknown) => whereChain);
      return { where, limit: whereChain.limit, then: whereChain.then };
    }),
  })),
}));

const mockDbTransaction = mock(async (cb: (tx: unknown) => Promise<unknown>) => {
  const fakeTx = {
    insert: mock((_table: unknown) => ({
      values: mock((_vals: unknown) => ({
        returning: mock(() => Promise.resolve(mockInsertResponse)),
      })),
    })),
  };
  return cb(fakeTx);
});

const mockDbUpdate = mock((_table: unknown) => ({
  set: mock((_vals: unknown) => ({
    where: mock((_cond: unknown) => ({
      returning: mock(() => Promise.resolve(mockUpdateResponse)),
    })),
  })),
}));

const mockDbInsert = mock((_table: unknown) => ({
  values: mock((_vals: unknown) => ({
    returning: mock(() => Promise.resolve(mockInsertResponse)),
  })),
}));

await mock.module("@/backend/db", () => ({
  db: {
    transaction: mockDbTransaction,
    update: mockDbUpdate,
    insert: mockDbInsert,
  },
  queryDb: mockQueryDb,
}));

// Import service after module mocks are established
const { LeaveRequestService } = await import("@/backend/services/leave-request/leave-request.service");

// Helper mock data builders
const MOCK_USER_ID = "usr-11111111-1111-1111-1111-111111111111";
const MOCK_OTHER_USER_ID = "usr-22222222-2222-2222-2222-222222222222";
const MOCK_CLASS_INSTANCE_ID = "cls-11111111-1111-1111-1111-111111111111";
const MOCK_REQUEST_ID = "req-11111111-1111-1111-1111-111111111111";

function buildMockLeaveRequest(overrides: Partial<LeaveRequestSelectType> = {}): LeaveRequestSelectType {
  return {
    id: MOCK_REQUEST_ID,
    classInstanceId: MOCK_CLASS_INSTANCE_ID,
    requestedByUserId: MOCK_USER_ID,
    requesterType: LeaveRequesterType.STUDENT,
    requestType: LeaveRequestType.DELAY,
    status: LeaveRequestStatus.PENDING,
    proposedStartAt: new Date(Date.now() + 86400000), // 24h in future
    reason: "Personal reason",
    processedAt: null,
    processedByUserId: null,
    createdAt: new Date("2026-01-01T10:00:00Z"),
    ...overrides,
  };
}

describe("LeaveRequestService", () => {
  beforeEach(() => {
    mockHasPermission = mock((_userId: string, _perm: AppPermission) => Promise.resolve(true));
    mockEnvConfig = mock((_key: string) => Promise.resolve("12"));
    mockClassInstance = null;
    mockLeaveRequestsQueryResponse = [];
    mockInsertResponse = [];
    mockUpdateResponse = [];
  });

  describe("getMyRequests", () => {
    it("returns leave requests for caller when caller has SESSION_SELF_DELAY permission", async () => {
      const mockRequests = [
        buildMockLeaveRequest({ id: "req-1" }),
        buildMockLeaveRequest({ id: "req-2", requestType: LeaveRequestType.CANCEL }),
      ];
      mockLeaveRequestsQueryResponse = mockRequests;

      const results = await LeaveRequestService.getMyRequests(MOCK_USER_ID);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe("req-1");
      expect(results[1].id).toBe("req-2");
      expect(mockHasPermission).toHaveBeenCalledWith(MOCK_USER_ID, AppPermission.SESSION_SELF_DELAY);
    });

    it("returns an empty array when caller has no leave requests", async () => {
      mockLeaveRequestsQueryResponse = [];

      const results = await LeaveRequestService.getMyRequests(MOCK_USER_ID);

      expect(results).toEqual([]);
      expect(mockHasPermission).toHaveBeenCalledWith(MOCK_USER_ID, AppPermission.SESSION_SELF_DELAY);
    });

    it("throws UnauthorizedError when user lacks SESSION_SELF_DELAY permission", async () => {
      mockHasPermission = mock((_userId: string, _perm: AppPermission) => Promise.resolve(false));

      let caughtError: unknown = null;
      try {
        await LeaveRequestService.getMyRequests(MOCK_USER_ID);
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(UnauthorizedError);
      expect((caughtError as UnauthorizedError).message).toBe(
        getServerTranslations("en").errorsTranslations.insufficientPermissions
      );
    });

    it("uses locale for localized error message when provided", async () => {
      mockHasPermission = mock((_userId: string, _perm: AppPermission) => Promise.resolve(false));

      let caughtError: unknown = null;
      try {
        await LeaveRequestService.getMyRequests(MOCK_USER_ID, "ar");
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(UnauthorizedError);
      expect((caughtError as UnauthorizedError).message).toBe(
        getServerTranslations("ar").errorsTranslations.insufficientPermissions
      );
    });
  });

  describe("createStudentDelayRequest & createStudentCancelRequest", () => {
    it("successfully creates a student delay request when valid", async () => {
      const futureStart = new Date(Date.now() + 48 * 3600 * 1000); // 48 hrs in future (> 12 hr lock threshold)
      mockClassInstance = {
        id: MOCK_CLASS_INSTANCE_ID,
        studentId: "student-1",
        scheduledStartAt: futureStart,
      };
      mockLeaveRequestsQueryResponse = []; // No duplicate pending

      const createdRow = buildMockLeaveRequest({ requestType: LeaveRequestType.DELAY });
      mockInsertResponse = [createdRow];

      const proposedStartAt = new Date(Date.now() + 72 * 3600 * 1000);
      const result = await LeaveRequestService.createStudentDelayRequest(
        MOCK_USER_ID,
        MOCK_CLASS_INSTANCE_ID,
        proposedStartAt,
        "Need to reschedule"
      );

      expect(result.id).toBe(MOCK_REQUEST_ID);
      expect(result.requestType).toBe(LeaveRequestType.DELAY);
      expect(mockHasPermission).toHaveBeenCalledWith(MOCK_USER_ID, AppPermission.SESSION_SELF_DELAY);
    });

    it("successfully creates a student cancel request when valid", async () => {
      const futureStart = new Date(Date.now() + 48 * 3600 * 1000);
      mockClassInstance = {
        id: MOCK_CLASS_INSTANCE_ID,
        studentId: "student-1",
        scheduledStartAt: futureStart,
      };
      mockLeaveRequestsQueryResponse = []; // No duplicate pending

      const createdRow = buildMockLeaveRequest({ requestType: LeaveRequestType.CANCEL, proposedStartAt: null });
      mockInsertResponse = [createdRow];

      const result = await LeaveRequestService.createStudentCancelRequest(
        MOCK_USER_ID,
        MOCK_CLASS_INSTANCE_ID,
        "Medical emergency"
      );

      expect(result.id).toBe(MOCK_REQUEST_ID);
      expect(result.requestType).toBe(LeaveRequestType.CANCEL);
      expect(mockHasPermission).toHaveBeenCalledWith(MOCK_USER_ID, AppPermission.SESSION_SELF_CANCEL);
    });

    it("throws UnauthorizedError when user lacks permission for create request", async () => {
      mockHasPermission = mock((_userId: string, _perm: AppPermission) => Promise.resolve(false));

      await expect(
        LeaveRequestService.createStudentDelayRequest(
          MOCK_USER_ID,
          MOCK_CLASS_INSTANCE_ID,
          new Date(),
          "Reason"
        )
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("throws NotFoundError when class instance is not found", async () => {
      mockClassInstance = null;

      await expect(
        LeaveRequestService.createStudentDelayRequest(
          MOCK_USER_ID,
          MOCK_CLASS_INSTANCE_ID,
          new Date(),
          "Reason"
        )
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("throws ValidationError when class instance is locked (within lock window)", async () => {
      // Session starts in 2 hours (< 12 hour lock threshold)
      const nearFutureStart = new Date(Date.now() + 2 * 3600 * 1000);
      mockClassInstance = {
        id: MOCK_CLASS_INSTANCE_ID,
        studentId: "student-1",
        scheduledStartAt: nearFutureStart,
      };

      await expect(
        LeaveRequestService.createStudentDelayRequest(
          MOCK_USER_ID,
          MOCK_CLASS_INSTANCE_ID,
          new Date(),
          "Reason"
        )
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it("throws ConflictError when duplicate pending request exists", async () => {
      const futureStart = new Date(Date.now() + 48 * 3600 * 1000);
      mockClassInstance = {
        id: MOCK_CLASS_INSTANCE_ID,
        studentId: "student-1",
        scheduledStartAt: futureStart,
      };
      // Existing pending request
      mockLeaveRequestsQueryResponse = [buildMockLeaveRequest({ status: LeaveRequestStatus.PENDING })];

      await expect(
        LeaveRequestService.createStudentDelayRequest(
          MOCK_USER_ID,
          MOCK_CLASS_INSTANCE_ID,
          new Date(),
          "Reason"
        )
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe("rejectRequest", () => {
    it("rejects a pending leave request successfully", async () => {
      const pendingRequest = buildMockLeaveRequest({ status: LeaveRequestStatus.PENDING });
      mockLeaveRequestsQueryResponse = [pendingRequest];

      const rejectedRequest = buildMockLeaveRequest({
        status: LeaveRequestStatus.REJECTED,
        processedAt: new Date(),
        processedByUserId: MOCK_OTHER_USER_ID,
      });
      mockUpdateResponse = [rejectedRequest];

      const result = await LeaveRequestService.rejectRequest(MOCK_OTHER_USER_ID, MOCK_REQUEST_ID);

      expect(result.status).toBe(LeaveRequestStatus.REJECTED);
      expect(result.processedByUserId).toBe(MOCK_OTHER_USER_ID);
      expect(mockHasPermission).toHaveBeenCalledWith(MOCK_OTHER_USER_ID, AppPermission.SESSION_RESCHEDULE);
    });

    it("throws UnauthorizedError when supervisor lacks SESSION_RESCHEDULE permission", async () => {
      mockHasPermission = mock((_userId: string, _perm: AppPermission) => Promise.resolve(false));

      await expect(
        LeaveRequestService.rejectRequest(MOCK_OTHER_USER_ID, MOCK_REQUEST_ID)
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("throws NotFoundError when leave request is not found", async () => {
      mockLeaveRequestsQueryResponse = [];

      await expect(
        LeaveRequestService.rejectRequest(MOCK_OTHER_USER_ID, MOCK_REQUEST_ID)
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("throws ConflictError when leave request is not PENDING", async () => {
      const alreadyApprovedRequest = buildMockLeaveRequest({ status: LeaveRequestStatus.APPROVED });
      mockLeaveRequestsQueryResponse = [alreadyApprovedRequest];

      await expect(
        LeaveRequestService.rejectRequest(MOCK_OTHER_USER_ID, MOCK_REQUEST_ID)
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });
});
