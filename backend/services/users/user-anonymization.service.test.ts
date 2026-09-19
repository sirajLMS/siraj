import { describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { AuditRepository } from "@/backend/db/repo/audit";
import { ComplaintRepository } from "@/backend/db/repo/complaints";
import { NotificationRepository } from "@/backend/db/repo/notifications";
import { ParentRepository, SuggestionRepository } from "@/backend/db/repo/parents";
import { RateLimitRepository, SessionRepository, SoftDeleteRepository } from "@/backend/db/repo/shared";
import { StorageDbRepository } from "@/backend/db/repo/storage";
import { StudentRepository } from "@/backend/db/repo/students";
import { TeacherRepository } from "@/backend/db/repo/teachers";
import { UserRepository } from "@/backend/db/repo/users";
import {
  WhatsappContactRepository,
  WhatsappConversationRepository,
  WhatsappMessageRepository,
} from "@/backend/db/repo/whatsapp";
import { AccountStatus, AUDIT_ACTION_VALUES, UserRole } from "@/backend/enum";
import { assertAnonymizationAllowed } from "@/backend/graphql/mutation/profile/user-anonymization.mutation";
import * as authPassword from "@/backend/lib/auth/password";
import * as ratelimit from "@/backend/lib/ratelimit";
import { UserService } from "@/backend/services";
import { UserAnonymizationService } from "@/backend/services/users/user-anonymization.service";
import type {
  DBTransaction,
  ParentSelectType,
  TeacherSelectType,
  UserReturnType,
  UserSelectType,
} from "@/backend/types";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { ParentStatus } from "@/shared/constants/parent.enum";
import { getServerTranslations } from "@/shared/locale";

const ACTOR_ID = randomUUID();
const TARGET_ID = randomUUID();
const NOW = new Date();
const STUDENT_ID = randomUUID();
const SUBJECT_PHONE = "+966500000000";

/**
 * Localized error fragments reused by the rejection tests below.
 */
const tErrors = getServerTranslations("en").errorsTranslations;

const userRow: UserSelectType = {
  id: TARGET_ID,
  createdAt: NOW,
  updatedAt: NOW,
  deletedAt: null,
  name: "Target User",
  email: `target-${randomUUID().slice(0, 8)}@example.com`,
  emailVerifiedAt: NOW,
  password: `irrelevant-hash-${randomUUID().slice(0, 8)}`,
  rememberTokenHash: "remember-hash",
  avatarFilePath: null,
  avatarUrl: "https://cdn.example.com/avatar.png",
  phone: SUBJECT_PHONE,
  status: AccountStatus.ACTIVATED,
  isSuperAdmin: false,
  timezone: IanaTimezone.UTC,
  displayCurrency: null,
  lastLoginAt: null,
};

const userReturn: UserReturnType = {
  id: TARGET_ID,
  createdAt: NOW,
  updatedAt: NOW,
  name: userRow.name,
  email: userRow.email,
  emailVerifiedAt: NOW,
  avatarFilePath: null,
  avatarUrl: null,
  phone: null,
  isSuperAdmin: false,
  lastLoginAt: null,
  role: UserRole.PARENT,
  status: AccountStatus.DEACTIVATED,
  timezone: IanaTimezone.UTC,
  displayCurrency: null,
};

const parentRow: ParentSelectType = {
  id: randomUUID(),
  userId: TARGET_ID,
  status: ParentStatus.REGULAR,
  nationality: null,
  address: "123 King Fahd Rd",
  facebook: "facebook-handle",
  whatsapp: SUBJECT_PHONE,
  twitter: "twitter-handle",
  invoiceType: null,
  feeAmount: null,
  currency: null,
  createdAt: NOW,
  updatedAt: NOW,
};

const teacherRow: TeacherSelectType = {
  id: randomUUID(),
  userId: TARGET_ID,
  nationality: null,
  nationalId: "[PHONE_REDACTED]",
  phone: SUBJECT_PHONE,
  dateOfBirth: "1990-01-01",
  gender: null,
  address: "456 Olaya St",
  qualifications: "B.A. Arabic",
  countryCode: null,
  hourlyRate: null,
  rateCurrency: null,
  createdAt: NOW,
  updatedAt: NOW,
};

/**
 * Guard-style narrowing keeps the fake transaction honest without type
 * assertions. The service orchestrates repos only — it never issues Drizzle
 * calls itself, so the transaction just needs to be a passable object.
 */
function isDbTransaction(value: unknown): value is DBTransaction {
  return typeof value === "object" && value !== null;
}

function fakeTx(): DBTransaction {
  const candidate: Record<string, unknown> = {};
  if (!isDbTransaction(candidate)) {
    throw new Error("fake transaction must be an object");
  }
  return candidate;
}

function mockRepos(overrides?: {
  superAdmin?: boolean;
  parent?: ParentSelectType | null;
  teacher?: TeacherSelectType | null;
  missingUser?: boolean;
  scrubMismatch?: boolean;
}) {
  const safeUser = spyOn(UserRepository, "findSafeById").mockResolvedValue(
    overrides?.missingUser ? null : { ...userRow, isSuperAdmin: overrides?.superAdmin ?? false }
  );
  const profileFields = spyOn(UserRepository, "updateProfileFields").mockResolvedValue(userReturn);
  const status = spyOn(UserRepository, "updateStatus").mockResolvedValue(userRow);
  const parent = spyOn(ParentRepository, "findByUserId").mockResolvedValue(
    overrides?.parent === undefined ? parentRow : overrides.parent
  );
  const parentUpdate = spyOn(ParentRepository, "updateParentProfile").mockResolvedValue({
    id: parentRow.id,
    userId: TARGET_ID,
    name: userRow.name,
    email: userRow.email,
    avatarUrl: null,
    lifecycleStatus: ParentStatus.REGULAR,
    accountStatus: AccountStatus.DEACTIVATED,
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
    createdAt: NOW,
    updatedAt: NOW,
  });
  const teacher = spyOn(TeacherRepository, "findByUserId").mockResolvedValue(
    overrides?.teacher === undefined ? teacherRow : overrides.teacher
  );
  const teacherUpdate = spyOn(TeacherRepository, "updateTeacherProfile").mockResolvedValue(true);
  const scrubRemnants = spyOn(UserRepository, "scrubSecurityRemnants").mockResolvedValue(userRow);
  const studentScrub = spyOn(StudentRepository, "scrubForAnonymization").mockResolvedValue(
    overrides?.scrubMismatch
      ? { priorCount: 2, scrubbedCount: 1, scrubbedIds: [STUDENT_ID] }
      : { priorCount: 1, scrubbedCount: 1, scrubbedIds: [STUDENT_ID] }
  );
  const softDelete = spyOn(SoftDeleteRepository, "softDeleteUser").mockResolvedValue({
    entity: userRow,
    deletedAt: NOW,
  });
  const audit = spyOn(AuditRepository, "createManyAdminAuditLogs").mockResolvedValue([]);
  const waContacts = spyOn(WhatsappContactRepository, "anonymizeByPhoneNumbers").mockResolvedValue(undefined);
  const waConversations = spyOn(WhatsappConversationRepository, "anonymizeByWaIds").mockResolvedValue(undefined);
  const waMessages = spyOn(WhatsappMessageRepository, "deleteSubjectContentByWaIds").mockResolvedValue(undefined);
  const complaints = spyOn(ComplaintRepository, "deleteByParentId").mockResolvedValue(undefined);
  const suggestions = spyOn(SuggestionRepository, "deleteByParentId").mockResolvedValue(undefined);
  const deviceTokens = spyOn(NotificationRepository, "deleteDeviceTokensByUserId").mockResolvedValue(undefined);
  const deliveries = spyOn(NotificationRepository, "scrubDeliveryContentByUserId").mockResolvedValue(undefined);
  const fileJunctions = spyOn(StorageDbRepository, "deleteOwnerFileJunctions").mockResolvedValue(undefined);
  const sessions = spyOn(SessionRepository, "deleteByUserId").mockResolvedValue(1);
  const rateLimitRemnants = spyOn(RateLimitRepository, "deleteEmailRemnants").mockResolvedValue(undefined);

  return {
    safeUser,
    profileFields,
    status,
    parent,
    parentUpdate,
    teacher,
    teacherUpdate,
    scrubRemnants,
    studentScrub,
    softDelete,
    audit,
    waContacts,
    waConversations,
    waMessages,
    complaints,
    suggestions,
    deviceTokens,
    deliveries,
    fileJunctions,
    sessions,
    rateLimitRemnants,
  };
}

type RepoMocks = ReturnType<typeof mockRepos>;

function restoreAll(mocks: RepoMocks) {
  for (const spy of Object.values(mocks)) {
    spy.mockRestore();
  }
}

async function expectRejection(fn: () => Promise<unknown>): Promise<Error> {
  let caught: unknown = null;
  try {
    await fn();
  } catch (error) {
    caught = error;
  }
  expect(caught).not.toBeNull();
  if (caught instanceof Error) return caught;
  return new Error(String(caught));
}

/**
 * Invokes the erasure flow and captures any raised rejection as an `Error`.
 * The guard and scrub-mismatch tests below assert on the returned message.
 */
function expectAnonymizationRejection(): Promise<Error> {
  return expectRejection(() =>
    UserAnonymizationService.anonymizeAndSoftDeleteUser(TARGET_ID, ACTOR_ID, "en", fakeTx())
  );
}

/**
 * Shared harness for guard-style rejections (missing target, super-admin
 * target): asserts the localized message fragment and that the erasure
 * pipeline never started — no profile scrub and no soft-delete.
 */
function testGuardRejection(name: string, overrides: Parameters<typeof mockRepos>[0], expectedSubstring: string): void {
  test(name, async () => {
    const mocks = mockRepos(overrides);
    try {
      const error = await expectAnonymizationRejection();
      expect(error.message).toContain(expectedSubstring);
      expect(mocks.profileFields).not.toHaveBeenCalled();
      expect(mocks.softDelete).not.toHaveBeenCalled();
    } finally {
      restoreAll(mocks);
    }
  });
}

/**
 * Spies on the step-up gate collaborators (rate limit, actor lookup, password
 * comparison) so gate decisions run against mocked collaborators instead of
 * the real rate-limit store and password hasher.
 */
function mockGate(overrides?: { rateLimited?: boolean; passwordMatches?: boolean; actorMissing?: boolean }) {
  const checkLimit = spyOn(ratelimit, "checkRateLimit").mockResolvedValue(
    overrides?.rateLimited
      ? { success: false, limit: 10, remaining: 0, reset: 0 }
      : { success: true, limit: 10, remaining: 9, reset: 0 }
  );
  const findActor = spyOn(UserService, "findById").mockResolvedValue(
    overrides?.actorMissing ? null : { ...userRow, id: ACTOR_ID }
  );
  const compare = spyOn(authPassword, "comparePassword").mockResolvedValue(overrides?.passwordMatches ?? true);
  return { checkLimit, findActor, compare };
}

type GateMocks = ReturnType<typeof mockGate>;

function restoreGateMocks(mocks: GateMocks): void {
  mocks.checkLimit.mockRestore();
  mocks.findActor.mockRestore();
  mocks.compare.mockRestore();
}

/**
 * Shared harness for step-up gate rejections: asserts the gate refused with
 * the localized error, then restores the gate spies. The optional assertion
 * hook covers per-case expectations (which collaborator was or was not used).
 */
function testGateRejection(
  name: string,
  overrides: Parameters<typeof mockGate>[0],
  password: string,
  expectedMessage: string,
  extraAssert?: (mocks: GateMocks) => void
): void {
  test(name, async () => {
    const mocks = mockGate(overrides);
    try {
      const gate = await assertAnonymizationAllowed(ACTOR_ID, password, tErrors);
      expect(gate.ok).toBe(false);
      if (!gate.ok) {
        expect(gate.error.message).toBe(expectedMessage);
      }
      extraAssert?.(mocks);
    } finally {
      restoreGateMocks(mocks);
    }
  });
}

describe("UserAnonymizationService.anonymizeAndSoftDeleteUser", () => {
  test("scrubs the users row with a unique tombstone email, nulls PII and avatarFilePath", async () => {
    const mocks = mockRepos();
    try {
      const result = await UserAnonymizationService.anonymizeAndSoftDeleteUser(TARGET_ID, ACTOR_ID, "en", fakeTx());

      expect(result.userId).toBe(TARGET_ID);
      expect(result.anonymized).toBe(true);

      expect(mocks.profileFields).toHaveBeenCalledWith(
        TARGET_ID,
        {
          name: "Deleted user",
          email: `deleted_${TARGET_ID}@removed.invalid`,
          phone: null,
          avatarUrl: null,
          avatarFilePath: null,
        },
        "en",
        expect.anything()
      );
      expect(mocks.status).toHaveBeenCalledWith(TARGET_ID, AccountStatus.DEACTIVATED, expect.anything(), "en");
    } finally {
      restoreAll(mocks);
    }
  });

  test("scrubs owned parent, teacher, and student rows, then soft-deletes the user", async () => {
    const mocks = mockRepos();
    try {
      await UserAnonymizationService.anonymizeAndSoftDeleteUser(TARGET_ID, ACTOR_ID, "en", fakeTx());

      expect(mocks.parentUpdate).toHaveBeenCalledWith(
        parentRow.id,
        { nationality: null, address: null, facebook: null, whatsapp: null, twitter: null },
        "en",
        expect.anything()
      );
      expect(mocks.teacherUpdate).toHaveBeenCalledWith(
        teacherRow.id,
        {
          nationalId: null,
          phone: null,
          dateOfBirth: null,
          address: null,
          qualifications: null,
          nationality: null,
          gender: null,
          countryCode: null,
        },
        expect.anything()
      );
      expect(mocks.softDelete).toHaveBeenCalledWith(TARGET_ID, ACTOR_ID, expect.anything());
      expect(mocks.audit).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            actorUserId: ACTOR_ID,
            targetUserId: TARGET_ID,
            action: "USER_ANONYMIZED",
          }),
        ],
        expect.anything()
      );
    } finally {
      restoreAll(mocks);
    }
  });

  test("scrubs WhatsApp rows linked to the subject's captured phone numbers", async () => {
    const mocks = mockRepos();
    try {
      await UserAnonymizationService.anonymizeAndSoftDeleteUser(TARGET_ID, ACTOR_ID, "en", fakeTx());

      // users.phone and parents.whatsapp were both the same number — the
      // captured set is deduplicated before the scrub calls.
      expect(mocks.waContacts).toHaveBeenCalledTimes(1);
      expect(mocks.waConversations).toHaveBeenCalledTimes(1);
      expect(mocks.waMessages).toHaveBeenCalledTimes(1);
      expect(mocks.waContacts.mock.calls[0][0]).toEqual([SUBJECT_PHONE]);
      expect(mocks.waConversations.mock.calls[0][0]).toEqual([SUBJECT_PHONE]);
      expect(mocks.waMessages.mock.calls[0][0]).toEqual([SUBJECT_PHONE]);
      for (const spy of [mocks.waContacts, mocks.waConversations, mocks.waMessages]) {
        expect(spy.mock.calls[0][1]).toBeTypeOf("object");
      }
    } finally {
      restoreAll(mocks);
    }
  });

  test("skips the WhatsApp scrub when the subject has no phone numbers", async () => {
    const mocks = mockRepos({
      parent: { ...parentRow, whatsapp: null },
    });
    try {
      mocks.safeUser.mockResolvedValue({ ...userRow, phone: null });

      await UserAnonymizationService.anonymizeAndSoftDeleteUser(TARGET_ID, ACTOR_ID, "en", fakeTx());

      expect(mocks.waContacts).not.toHaveBeenCalled();
      expect(mocks.waConversations).not.toHaveBeenCalled();
      expect(mocks.waMessages).not.toHaveBeenCalled();
    } finally {
      restoreAll(mocks);
    }
  });

  test("deletes storage junctions, communications PII, sessions, and email-keyed remnants", async () => {
    const mocks = mockRepos();
    try {
      await UserAnonymizationService.anonymizeAndSoftDeleteUser(TARGET_ID, ACTOR_ID, "en", fakeTx());

      expect(mocks.fileJunctions).toHaveBeenCalledWith(
        {
          userId: TARGET_ID,
          parentId: parentRow.id,
          teacherId: teacherRow.id,
          studentIds: [STUDENT_ID],
        },
        expect.anything()
      );
      expect(mocks.complaints).toHaveBeenCalledWith(parentRow.id, expect.anything());
      expect(mocks.suggestions).toHaveBeenCalledWith(parentRow.id, expect.anything());
      expect(mocks.deviceTokens).toHaveBeenCalledWith(TARGET_ID, expect.anything());
      expect(mocks.deliveries).toHaveBeenCalledWith(TARGET_ID, expect.anything());
      expect(mocks.sessions).toHaveBeenCalledWith(TARGET_ID, expect.anything());
      expect(mocks.rateLimitRemnants).toHaveBeenCalledWith(userRow.email, expect.anything());
    } finally {
      restoreAll(mocks);
    }
  });

  test("skips parent-only scrubs when the user owns no parent row", async () => {
    const mocks = mockRepos({ parent: null });
    try {
      await UserAnonymizationService.anonymizeAndSoftDeleteUser(TARGET_ID, ACTOR_ID, "en", fakeTx());

      expect(mocks.parentUpdate).not.toHaveBeenCalled();
      expect(mocks.complaints).not.toHaveBeenCalled();
      expect(mocks.suggestions).not.toHaveBeenCalled();
      // User-keyed scrubs still run.
      expect(mocks.deviceTokens).toHaveBeenCalledWith(TARGET_ID, expect.anything());
      expect(mocks.sessions).toHaveBeenCalledWith(TARGET_ID, expect.anything());
      expect(mocks.softDelete).toHaveBeenCalledTimes(1);
    } finally {
      restoreAll(mocks);
    }
  });

  test("rolls back loudly when the students scrub affects fewer rows than the pre-read found", async () => {
    const mocks = mockRepos({ scrubMismatch: true });
    try {
      const error = await expectAnonymizationRejection();
      expect(error.message).toBe(tErrors.anonymizationScrubIncomplete);
      // The erasure aborted before the irreversible soft-delete.
      expect(mocks.softDelete).not.toHaveBeenCalled();
      expect(mocks.audit).not.toHaveBeenCalled();
    } finally {
      restoreAll(mocks);
    }
  });

  test("skips parent/teacher scrubbing when the user owns neither row", async () => {
    const mocks = mockRepos({ parent: null, teacher: null });
    try {
      await UserAnonymizationService.anonymizeAndSoftDeleteUser(TARGET_ID, ACTOR_ID, "en", fakeTx());

      expect(mocks.parentUpdate).not.toHaveBeenCalled();
      expect(mocks.teacherUpdate).not.toHaveBeenCalled();
      expect(mocks.softDelete).toHaveBeenCalledTimes(1);
    } finally {
      restoreAll(mocks);
    }
  });

  testGuardRejection("rejects when the target user does not exist", { missingUser: true }, "not found");

  testGuardRejection("refuses to anonymize super-admin accounts", { superAdmin: true }, "permissions");

  test("records USER_ANONYMIZED in the AuditAction enum values", () => {
    expect(AUDIT_ACTION_VALUES).toContain("USER_ANONYMIZED");
  });
});

describe("anonymizeUser step-up gate (assertAnonymizationAllowed)", () => {
  testGateRejection(
    "rejects when the per-actor rate limit is exceeded",
    { rateLimited: true },
    "confirmation",
    tErrors.rateLimitExceeded,
    mocks => {
      expect(mocks.findActor).not.toHaveBeenCalled();
    }
  );

  testGateRejection(
    "rejects on actor password mismatch (step-up re-auth)",
    { passwordMatches: false },
    "wrong-password",
    tErrors.auth.currentPasswordInvalid,
    mocks => {
      expect(mocks.compare).toHaveBeenCalledWith("wrong-password", userRow.password);
    }
  );

  test("allows the erasure when rate limit passes and the actor re-authenticates", async () => {
    const mocks = mockGate();
    try {
      const gate = await assertAnonymizationAllowed(ACTOR_ID, "correct-password", tErrors);
      expect(gate.ok).toBe(true);
      // Per-actor bucket, not a shared one.
      expect(mocks.checkLimit.mock.calls[0][0]).toBe(`anonymize-user:${ACTOR_ID}`);
    } finally {
      restoreGateMocks(mocks);
    }
  });

  testGateRejection(
    "rejects when the acting admin cannot be loaded",
    { actorMissing: true },
    "confirmation",
    tErrors.auth.invalidCredentials
  );
});
