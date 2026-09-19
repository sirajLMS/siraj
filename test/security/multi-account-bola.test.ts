import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { createHash, randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { StorageDbRepository } from "@/backend/db/repo";
import {
  groupPermissions,
  invoiceFiles,
  invoices,
  learningResourceFiles,
  learningResources,
  parents,
  payments,
  permissionGroups,
  permissions,
  storageFiles,
  students,
  suggestions,
  teachers,
  userPaymentMethods,
  users,
} from "@/backend/db/schema";
import { createTestParent, createTestStudent, createTestTeacher, createTestUser } from "@/backend/db/test/entity-setup";
import { AppPermission, ProfileScope, UserRole } from "@/backend/enum";
import { PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { ForbiddenError, logger } from "@/backend/lib";
import {
  BillingHistoryService,
  BillingManagementService,
  PaymentMethodService,
  PermissionsService,
  ProfileService,
  ProfitLossService,
  StaffProfileService,
  StorageService,
  StudentMonthlyReportService,
  StudentProfileService,
  StudentStatusService,
  SuggestionService,
} from "@/backend/services";
import type {
  InvoiceSelectType,
  ParentSelectType,
  StudentSelectType,
  TeacherSelectType,
  UserPermissionContext,
  UserSelectType,
} from "@/backend/types";
import { SystemPermissionGroupSlug } from "@/shared/constants";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting";
import {
  assignSystemGroup,
  expectJourneyError,
  revokeSystemGroupAssignments,
  type SystemGroupAssignment,
} from "@/test/workflows/helpers";

/**
 * try/catch helper for not-found paths: asserts the rejection carries the
 * translated not-found message (never the raw translation key).
 */
async function expectNotFound(fn: () => Promise<unknown>, expectedMessage: string): Promise<Error> {
  const error = await expectJourneyError(fn);
  expect(error.message).toContain(expectedMessage);
  return error;
}

/** Current accounting month in YYYY-MM form; requirePermission throws before labels are consumed. */
function currentAccountingMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Minimal labels stub for the P&L boundary tests — the permission gate rejects before month validation. */
function assertIsProfitLossLabels(value: unknown): asserts value is ProfitLossLabels {
  if (typeof value !== "object" || value == null) {
    throw new Error("tLabelsStub must be an object");
  }
}

/**
 * Multi-account BOLA regression suite for the H1/H3/H4/H5/M1/M3 security
 * remediation. Every negative step fails through the real permission /
 * ownership checks — actors hold real `user_permission_groups` memberships
 * against the system groups (`parent_default`, `teacher_default`,
 * `student_default`, `academy_admin`) and nothing is mocked.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): fixtures are committed in beforeAll inside a
 * single `db.transaction(...)` and hard-deleted in afterAll in FK-safe order.
 *
 * DB precondition: migration 48 (`48-prune-view-other-defaults.sql`) must be
 * applied to the test database — `parent_default` / `teacher_default` must
 * hold ZERO `profile.<group>.view_other` group_permissions rows. The first
 * test validates that state explicitly.
 */
describe("Multi-account BOLA regression suite (parent/teacher/student/storage/billing isolation)", () => {
  const PREFIX = `sec_bola_${randomUUID().slice(0, 8)}`;
  const INVOICE_FILE_PATH_B = `sec-bola/${PREFIX}/invoice-b-proof.pdf`;
  const RESOURCE_FILE_PATH = `sec-bola/${PREFIX}/resource.pdf`;

  /** Aggregation window for monthly-report reads: the current UTC month. */
  const REPORT_YEAR = new Date().getUTCFullYear();
  const REPORT_MONTH = new Date().getUTCMonth() + 1;

  let tErrors: ErrorsLabels;
  let cast: BolaJourneyCast;
  let logSpy: ReturnType<typeof spyOn>;

  interface BolaJourneyCast {
    prefix: string;
    parentAUser: UserSelectType;
    parentA: ParentSelectType;
    parentBUser: UserSelectType;
    parentB: ParentSelectType;
    studentA: StudentSelectType;
    studentB: StudentSelectType;
    teacherAUser: UserSelectType;
    teacherA: TeacherSelectType;
    teacherBUser: UserSelectType;
    teacherB: TeacherSelectType;
    operatorUser: UserSelectType;
    superAdminUser: UserSelectType;
    invoiceA: InvoiceSelectType;
    invoiceB: InvoiceSelectType;
    methodAId: string;
    methodBId: string;
    suggestionId: string;
    learningResourceId: string;
    groupAssignments: SystemGroupAssignment[];
  }

  async function expectDenied(fn: () => Promise<unknown>): Promise<Error> {
    const error = await expectJourneyError(fn);
    expect(error.message).toContain(tErrors.insufficientPermissions);
    return error;
  }

  async function expectForbidden(fn: () => Promise<unknown>): Promise<Error> {
    const error = await expectJourneyError(fn);
    expect(error.message).toContain(tErrors.insufficientPermissions);
    if (!(error instanceof ForbiddenError)) {
      throw new Error(`expected ForbiddenError, got ${error.constructor.name}: ${error.message}`);
    }
    return error;
  }

  function profitLossLabels(): ProfitLossLabels {
    const stub = {
      error: { monthInvalid: "invalid month", paginationInvalid: "invalid pagination" },
    } satisfies Partial<ProfitLossLabels>;
    assertIsProfitLossLabels(stub);
    return stub;
  }

  /** Mirrors the `recordPayment` GraphQL resolver's `recordPayin` input shape. */
  function payinInput(
    invoiceId: string,
    userPaymentMethodId: string
  ): {
    invoiceId: string;
    userPaymentMethodId: string;
    amount: string;
    currency: CurrencyCode;
    paymentDate: Date;
    transactionId: null;
    gatewayResponse: null;
    exchangeRateSnapshot: null;
    exchangeRateSource: null;
    idempotencyKey: string;
  } {
    return {
      invoiceId,
      userPaymentMethodId,
      amount: "100.00",
      currency: CurrencyCode.SAR,
      paymentDate: new Date(),
      transactionId: null,
      gatewayResponse: null,
      exchangeRateSnapshot: null,
      exchangeRateSource: null,
      idempotencyKey: `payin:${PREFIX}:${randomUUID()}`,
    };
  }

  /** Provisions the actor cast in a single COMMITTING transaction. */
  async function provisionBolaCast(prefix: string): Promise<BolaJourneyCast> {
    return db.transaction(async tx => {
      const now = new Date();
      const parentAUser = await createTestUser(tx, { name: `${prefix} Parent A` });
      const parentBUser = await createTestUser(tx, { name: `${prefix} Parent B` });
      const teacherAUser = await createTestUser(tx, { name: `${prefix} Teacher A` });
      const teacherBUser = await createTestUser(tx, { name: `${prefix} Teacher B` });
      const operatorUser = await createTestUser(tx, { name: `${prefix} Academy Operator` });
      const superAdminUser = await createTestUser(tx, { name: `${prefix} Super Admin`, isSuperAdmin: true });

      const teacherA = await createTestTeacher(tx, teacherAUser.id);
      const teacherB = await createTestTeacher(tx, teacherBUser.id);
      const parentA = await createTestParent(tx, parentAUser.id);
      const parentB = await createTestParent(tx, parentBUser.id);

      const studentA = await createTestStudent(tx, parentA.id, {
        name: `${prefix} Student A`,
        primaryTeacherId: teacherA.id,
      });
      const studentB = await createTestStudent(tx, parentB.id, {
        name: `${prefix} Student B`,
        primaryTeacherId: teacherB.id,
      });

      const invoiceValues = {
        amount: "100.00",
        currency: CurrencyCode.SAR,
        status: "UNPAID",
        invoiceType: "CREDIT_HOURS_PACKAGE",
        issueDate: "2026-09-01",
        dueDate: "2026-09-30",
        createdAt: now,
        updatedAt: now,
      } as const;
      const [invoiceA] = await tx
        .insert(invoices)
        .values({
          ...invoiceValues,
          parentId: parentA.id,
          studentId: studentA.id,
          idempotencyKey: `${prefix}-inv-A`,
        })
        .returning();
      const [invoiceB] = await tx
        .insert(invoices)
        .values({
          ...invoiceValues,
          parentId: parentB.id,
          studentId: studentB.id,
          idempotencyKey: `${prefix}-inv-B`,
        })
        .returning();
      if (!invoiceA || !invoiceB) {
        throw new Error("failed to create invoice fixtures");
      }

      const methodValues = {
        type: PaymentMethodType.MOBILE_WALLET,
        direction: PaymentDirection.PAYIN,
        isDefault: false,
        label: `${prefix} wallet`,
        // Direct fixture insert: a valid MobileWalletDetails payload with a
        // throwaway wallet reference (no catalog row needed for these paths).
        details: { walletId: randomUUID(), phone: "0000000000" },
        createdAt: now,
        updatedAt: now,
      } as const;
      const [methodA] = await tx
        .insert(userPaymentMethods)
        .values({ ...methodValues, userId: parentAUser.id })
        .returning({ id: userPaymentMethods.id });
      const [methodB] = await tx
        .insert(userPaymentMethods)
        .values({ ...methodValues, userId: parentBUser.id })
        .returning({ id: userPaymentMethods.id });
      if (!methodA || !methodB) {
        throw new Error("failed to create payment-method fixtures");
      }

      const [suggestion] = await tx
        .insert(suggestions)
        .values({
          parentId: parentA.id,
          submitterName: parentAUser.name,
          body: `${prefix} suggestion body`,
          createdAt: now,
        })
        .returning({ id: suggestions.id });
      const [resource] = await tx
        .insert(learningResources)
        .values({
          displayName: `${prefix} Resource`,
          filePath: RESOURCE_FILE_PATH,
          uploadedByUserId: superAdminUser.id,
          createdAt: now,
        })
        .returning({ id: learningResources.id });
      if (!suggestion || !resource) {
        throw new Error("failed to create suggestion/learning-resource fixtures");
      }

      const groupAssignments = [
        await assignSystemGroup(tx, parentAUser.id, SystemPermissionGroupSlug.PARENT_DEFAULT),
        await assignSystemGroup(tx, parentBUser.id, SystemPermissionGroupSlug.PARENT_DEFAULT),
        await assignSystemGroup(tx, teacherAUser.id, SystemPermissionGroupSlug.TEACHER_DEFAULT),
        await assignSystemGroup(tx, teacherBUser.id, SystemPermissionGroupSlug.TEACHER_DEFAULT),
        await assignSystemGroup(tx, studentA.userId, SystemPermissionGroupSlug.STUDENT_DEFAULT),
        await assignSystemGroup(tx, studentB.userId, SystemPermissionGroupSlug.STUDENT_DEFAULT),
        await assignSystemGroup(tx, operatorUser.id, SystemPermissionGroupSlug.ACADEMY_ADMIN),
      ];

      return {
        prefix,
        parentAUser,
        parentA,
        parentBUser,
        parentB,
        studentA,
        studentB,
        teacherAUser,
        teacherA,
        teacherBUser,
        teacherB,
        operatorUser,
        superAdminUser,
        invoiceA,
        invoiceB,
        methodAId: methodA.id,
        methodBId: methodB.id,
        suggestionId: suggestion.id,
        learningResourceId: resource.id,
        groupAssignments,
      };
    });
  }

  /** Hard-deletes the cast in FK-safe order, including storage side-effect rows. */
  async function cleanupBolaCast(castFixture: BolaJourneyCast): Promise<void> {
    await db.transaction(async tx => {
      const invoiceIds = [castFixture.invoiceA.id, castFixture.invoiceB.id];
      await tx.delete(invoiceFiles).where(inArray(invoiceFiles.invoiceId, invoiceIds));
      await tx
        .delete(learningResourceFiles)
        .where(eq(learningResourceFiles.learningResourceId, castFixture.learningResourceId));
      await tx.delete(storageFiles).where(inArray(storageFiles.path, [INVOICE_FILE_PATH_B, RESOURCE_FILE_PATH]));
      await tx.delete(payments).where(inArray(payments.invoiceId, invoiceIds));
      await tx.delete(suggestions).where(eq(suggestions.id, castFixture.suggestionId));
      await tx.delete(learningResources).where(eq(learningResources.id, castFixture.learningResourceId));
      await tx
        .delete(userPaymentMethods)
        .where(inArray(userPaymentMethods.id, [castFixture.methodAId, castFixture.methodBId]));
      await tx.delete(invoices).where(inArray(invoices.id, invoiceIds));
      await tx.delete(students).where(inArray(students.id, [castFixture.studentA.id, castFixture.studentB.id]));
      await tx.delete(parents).where(inArray(parents.id, [castFixture.parentA.id, castFixture.parentB.id]));
      await tx.delete(teachers).where(inArray(teachers.id, [castFixture.teacherA.id, castFixture.teacherB.id]));
      await revokeSystemGroupAssignments(tx, castFixture.groupAssignments);
      await tx
        .delete(users)
        .where(
          inArray(users.id, [
            castFixture.parentAUser.id,
            castFixture.parentBUser.id,
            castFixture.teacherAUser.id,
            castFixture.teacherBUser.id,
            castFixture.operatorUser.id,
            castFixture.superAdminUser.id,
            castFixture.studentA.userId,
            castFixture.studentB.userId,
          ])
        );
    });
  }

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    cast = await provisionBolaCast(PREFIX);

    const invoiceUsage = await StorageDbRepository.registerFileUsage({
      referenceTable: "invoices",
      referenceId: cast.invoiceB.id,
      usageType: "payment_proof",
      filePath: INVOICE_FILE_PATH_B,
    });
    const resourceUsage = await StorageDbRepository.registerFileUsage({
      referenceTable: "learning_resources",
      referenceId: cast.learningResourceId,
      usageType: "resource",
      filePath: RESOURCE_FILE_PATH,
    });
    if (!invoiceUsage.success || !resourceUsage.success) {
      throw new Error("failed to register storage file-usage fixtures");
    }

    logSpy = spyOn(logger, "info").mockImplementation(() => {});
  });

  afterAll(async () => {
    logSpy.mockRestore();
    await cleanupBolaCast(cast);
  });

  test("precondition — parent_default/teacher_default hold zero profile.*_view_other grants (migration 48)", async () => {
    const rows = await db
      .select({ slug: permissionGroups.slug, key: permissions.key })
      .from(groupPermissions)
      .innerJoin(permissionGroups, eq(groupPermissions.groupId, permissionGroups.id))
      .innerJoin(permissions, eq(groupPermissions.permissionId, permissions.id))
      .where(
        and(
          inArray(permissionGroups.slug, [
            SystemPermissionGroupSlug.PARENT_DEFAULT,
            SystemPermissionGroupSlug.TEACHER_DEFAULT,
          ]),
          sql`${permissions.key}::text like ${"profile.%_other"}`
        )
      );
    expect(rows).toHaveLength(0);
  });

  describe("parent default boundary", () => {
    test("Parent A cannot read Parent B's unified profile (no profile.*_view_other after migration 48)", async () => {
      await expectDenied(() => ProfileService.getProfileByUserId(cast.parentAUser.id, cast.parentBUser.id, "en"));
    });

    test("Parent A cannot read Parent B's student profile (H4 assertStudentReadAccess)", async () => {
      await expectForbidden(() => StudentProfileService.getProfile(cast.parentAUser.id, cast.studentB.id, tErrors));
    });

    test("Parent A cannot fetch Parent B's invoice history", async () => {
      await expectDenied(() =>
        BillingHistoryService.getParentInvoiceHistory(
          cast.parentAUser.id,
          cast.parentB.id,
          cast.parentAUser.id,
          tErrors
        )
      );
    });

    test("Parent A cannot read Parent B's invoice payment submission (M1 verifyInvoiceAccess)", async () => {
      await expectForbidden(() =>
        BillingManagementService.getInvoicePaymentSubmission(cast.parentAUser.id, cast.invoiceB.id, tErrors)
      );
    });

    test("recordPayin with Parent B's method on Parent A's own invoice → ForbiddenError (H3 cross-user binding)", async () => {
      await expectForbidden(() =>
        PaymentMethodService.recordPayin(payinInput(cast.invoiceA.id, cast.methodBId), tErrors)
      );
    });

    test("recordPayin with Parent A's method on Parent B's invoice → ForbiddenError (H3 cross-user binding)", async () => {
      await expectForbidden(() =>
        PaymentMethodService.recordPayin(payinInput(cast.invoiceB.id, cast.methodAId), tErrors)
      );
    });

    test("Parent A holds no BILLING_UPDATE_STATUS_PAID (the recordPayment mutation gate denies them)", async () => {
      const hasPermission = await PermissionsService.hasPermission(
        cast.parentAUser.id,
        AppPermission.BILLING_UPDATE_STATUS_PAID
      );
      expect(hasPermission).toBe(false);
    });

    test("Parent A cannot read the profit & loss report (accounting.profits_view denied by default)", async () => {
      await expectForbidden(() =>
        ProfitLossService.getReport(
          cast.parentAUser.id,
          { month: currentAccountingMonth(), currency: CurrencyCode.SAR },
          {},
          tErrors,
          profitLossLabels()
        )
      );
    });
  });

  describe("teacher default boundary", () => {
    test("Teacher A cannot read Student B's profile (unassociated + no student.*_view_other)", async () => {
      await expectForbidden(() => StudentProfileService.getProfile(cast.teacherAUser.id, cast.studentB.id, tErrors));
    });

    test("Teacher A cannot open Teacher B's teacher-profile-for-edit (teacher_default holds no edit_other)", async () => {
      await expectDenied(() =>
        StaffProfileService.getTeacherProfileForEdit(cast.teacherAUser.id, cast.teacherB.id, "en")
      );
    });

    test("Teacher A cannot read the profit & loss report (accounting.profits_view denied by default)", async () => {
      await expectForbidden(() =>
        ProfitLossService.getReport(
          cast.teacherAUser.id,
          { month: currentAccountingMonth(), currency: CurrencyCode.SAR },
          {},
          tErrors,
          profitLossLabels()
        )
      );
    });
  });

  describe("student default boundary", () => {
    test("Student A cannot read Student B's profile", async () => {
      await expectForbidden(() => StudentProfileService.getProfile(cast.studentA.userId, cast.studentB.id, tErrors));
    });

    test("Student A cannot read Student B's monthly report", async () => {
      await expectDenied(() =>
        StudentMonthlyReportService.getMonthlyReport(
          cast.studentA.userId,
          cast.studentB.id,
          REPORT_YEAR,
          REPORT_MONTH,
          "en"
        )
      );
    });
  });

  describe("storage (H5 file-usage ownership)", () => {
    test("invoice-attached file: Parent B allowed, Parent A denied with 403", async () => {
      const denied = await StorageService.checkFileAccess(cast.parentAUser.id, INVOICE_FILE_PATH_B, "en");
      expect(denied).not.toBeNull();
      expect(denied?.status).toBe(403);

      const allowed = await StorageService.checkFileAccess(cast.parentBUser.id, INVOICE_FILE_PATH_B, "en");
      expect(allowed).toBeNull();
    });

    test("learning-resource file: caller without RESOURCES_LIST denied, academy_admin holder allowed", async () => {
      const denied = await StorageService.checkFileAccess(cast.parentBUser.id, RESOURCE_FILE_PATH, "en");
      expect(denied).not.toBeNull();
      expect(denied?.status).toBe(403);

      const allowed = await StorageService.checkFileAccess(cast.operatorUser.id, RESOURCE_FILE_PATH, "en");
      expect(allowed).toBeNull();
    });
  });

  describe("positive controls — regression guards", () => {
    test("Parent B reads OWN profile payment methods (H6 listForProfile own scope)", async () => {
      const methods = await PaymentMethodService.listForProfile(
        cast.parentBUser.id,
        cast.parentBUser.id,
        ProfileScope.OWN,
        "en"
      );
      expect(methods).not.toBeNull();
      expect(methods?.some(method => method.id === cast.methodBId)).toBe(true);
    });

    test("Parent A gets null payment methods for Parent B's profile without view_other (H6)", async () => {
      const methods = await PaymentMethodService.listForProfile(
        cast.parentAUser.id,
        cast.parentBUser.id,
        ProfileScope.OTHER,
        "en"
      );
      expect(methods).toBeNull();
    });

    test("Parent B reads OWN student profile", async () => {
      const profile = await StudentProfileService.getProfile(cast.parentBUser.id, cast.studentB.id, tErrors);
      expect(profile.id).toBe(cast.studentB.id);
    });

    test("Teacher A reads Student A's profile as the primary-teacher association", async () => {
      const profile = await StudentProfileService.getProfile(cast.teacherAUser.id, cast.studentA.id, tErrors);
      expect(profile.id).toBe(cast.studentA.id);
    });

    test("Parent A reads OWN child's upcoming classes and monthly report (H4 functional fixes)", async () => {
      const upcoming = await StudentStatusService.getUpcomingClasses(cast.parentAUser.id, cast.studentA.id, tErrors);
      expect(upcoming.studentId).toBe(cast.studentA.id);
      expect(Array.isArray(upcoming.classes)).toBe(true);

      const report = await StudentMonthlyReportService.getMonthlyReport(
        cast.parentAUser.id,
        cast.studentA.id,
        REPORT_YEAR,
        REPORT_MONTH,
        "en"
      );
      expect(report.studentId).toBe(cast.studentA.id);
    });

    test("M1 verifyInvoiceAccess: explicit context honored, null context derives server-side", async () => {
      const superAdminContext: UserPermissionContext = {
        permissions: [],
        permissionGroups: [],
        isSuperAdmin: true,
        role: UserRole.SUPER_ADMIN,
      };
      const bySuperAdmin = await BillingManagementService.verifyInvoiceAccess(
        cast.superAdminUser.id,
        cast.invoiceB.id,
        superAdminContext,
        tErrors
      );
      expect(bySuperAdmin.id).toBe(cast.invoiceB.id);

      const byParentOwner = await BillingManagementService.verifyInvoiceAccess(
        cast.parentBUser.id,
        cast.invoiceB.id,
        null,
        tErrors
      );
      expect(byParentOwner.id).toBe(cast.invoiceB.id);

      const parentAContext = await PermissionsService.getUserContext(cast.parentAUser.id);
      await expectForbidden(() =>
        BillingManagementService.verifyInvoiceAccess(cast.parentAUser.id, cast.invoiceB.id, parentAContext, tErrors)
      );
    });

    test("superadmin reachability sanity", async () => {
      const context = await PermissionsService.getUserContext(cast.superAdminUser.id);
      expect(context.isSuperAdmin).toBe(true);

      const profile = await StudentProfileService.getProfile(cast.superAdminUser.id, cast.studentB.id, tErrors);
      expect(profile.id).toBe(cast.studentB.id);

      const fileAccess = await StorageService.checkFileAccess(cast.superAdminUser.id, INVOICE_FILE_PATH_B, "en");
      expect(fileAccess).toBeNull();
    });

    test("M3 getContributorStats: contributor identity is anonymized (initials + SHA-256 surrogate)", async () => {
      const stats = await SuggestionService.getContributorStats(cast.parentAUser.id, 365, "en");

      // The surrogate id is a deterministic SHA-256 prefix of the raw contributor id.
      const expectedSurrogate = createHash("sha256").update(cast.parentA.id).digest("hex").slice(0, 12);
      const mine = stats.contributors.find(contributor => contributor.id === expectedSurrogate);
      expect(mine).toBeDefined();
      if (!mine) return;

      // The displayed name is initials-only, never the contributor's real name.
      const expectedInitials = (cast.parentAUser.name ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(part => `${part.charAt(0).toUpperCase()}.`)
        .join(" ");
      expect(mine.id).toMatch(/^[0-9a-f]{12}$/);
      expect(mine.name).toBe(expectedInitials);
      expect(mine.name).not.toContain(PREFIX);
      expect(mine.suggestionCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("fuzz/chaos — random and malformed ids", () => {
    test("random UUIDs surface not-found or insufficientPermissions, never another tenant's row", async () => {
      const fuzzId = randomUUID();

      // Denial precedes existence for student reads.
      await expectDenied(() => StudentProfileService.getProfile(cast.parentAUser.id, fuzzId, tErrors));
      await expectDenied(() =>
        StudentMonthlyReportService.getMonthlyReport(cast.parentAUser.id, fuzzId, REPORT_YEAR, REPORT_MONTH, "en")
      );

      // recordPayin on a nonexistent invoice is a not-found rejection.
      await expectNotFound(
        () => PaymentMethodService.recordPayin(payinInput(fuzzId, cast.methodBId), tErrors),
        tErrors.billing.invoiceNotFound(fuzzId)
      );

      // Unlinked file paths are default-denied (H2 fix).
      const denied = await StorageService.checkFileAccess(cast.parentAUser.id, `sec-bola/${fuzzId}/missing.pdf`, "en");
      expect(denied?.status).toBe(403);
    });

    test("malformed (non-UUID) ids fail cleanly without leaking data", async () => {
      const profileError = await expectJourneyError(() =>
        StudentProfileService.getProfile(cast.parentAUser.id, "not-a-uuid", tErrors)
      );
      const reportError = await expectJourneyError(() =>
        StudentMonthlyReportService.getMonthlyReport(cast.parentAUser.id, "not-a-uuid", REPORT_YEAR, REPORT_MONTH, "en")
      );
      const payinError = await expectJourneyError(() =>
        PaymentMethodService.recordPayin(payinInput("not-a-uuid", cast.methodBId), tErrors)
      );
      const submissionError = await expectJourneyError(() =>
        BillingManagementService.getInvoicePaymentSubmission(cast.parentAUser.id, "not-a-uuid", tErrors)
      );

      for (const error of [profileError, reportError, payinError, submissionError]) {
        expect(error).toBeInstanceOf(Error);
        // Fail cleanly = a controlled domain error message, never an internal
        // stack/SQL echo that would leak schema details.
        expect(error.message.length).toBeGreaterThan(0);
        expect(error.message).not.toContain("select");
      }
    });
  });
});
