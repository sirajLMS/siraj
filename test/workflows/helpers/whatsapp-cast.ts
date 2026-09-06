import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { WhatsappAccountRepository } from "@/backend/db/repo/whatsapp";
import {
  groupPermissions,
  permissionGroups,
  permissions,
  userPermissionGroups,
  whatsappAccounts,
  whatsappWebhookEvents,
} from "@/backend/db/schema";
import {
  createCompletedClassInstance,
  createTestParent,
  createTestStudent,
  createTestTeacher,
  createTestUser,
  type TestDb,
} from "@/backend/db/test/entity-setup";
import { AppPermission } from "@/backend/enum";
import { WhatsappAccountPurpose, WhatsappOnboardingMode } from "@/backend/enum/whatsapp";
import type {
  ClassInstanceSelectType,
  ParentSelectType,
  StudentSelectType,
  TeacherSelectType,
  UserSelectType,
  WhatsappAccountInsertType,
  WhatsappAccountReturnType,
} from "@/backend/types";
import { SystemPermissionGroupSlug } from "@/shared/constants";
import { createCastSubjectPair, purgeCastFixture } from "@/test/workflows/helpers/cast-scaffold";
import { assignSystemGroup, type SystemGroupAssignment } from "@/test/workflows/helpers/permissions";

/**
 * Actor cast for the WhatsApp multi-number/coexistence journeys:
 *
 * - `adminUser` holds the `academy_admin` system group (honest membership via
 *   `assignSystemGroup`) PLUS a run-prefixed custom group granting
 *   `whatsapp.config_manage`, because the migrations grant that key only to
 *   `super_admin` — journeys must not take the fake super-admin shortcut, so
 *   the catalog row is granted to a per-run group exactly like the adjustment
 *   cast's legacy-group precedent (`adjustment-cast.ts`).
 * - `staffUser` holds `staff_default` (migrations grant it `whatsapp.inbox_view`).
 * - `intruderUser` holds only `teacher_default` (no inbox access) for the
 *   honest-permission denial step.
 * - `parentUser`/`student`/`teacher`/`classInstance` feed the real
 *   CLASS_REMINDER payload builder.
 * - Three accounts on three distinct WABAs: an ADVERTISING number, a STUDENTS
 *   number, and an INACTIVE coexistence number (kept inactive so purpose
 *   resolution never falls back to it mid-journey; inbox reads are not gated
 *   on account activity).
 */
export interface WhatsappJourneyCast {
  prefix: string;
  /** Configures purposes/accounts: academy_admin + per-run whatsapp.config_manage grant. */
  adminUser: UserSelectType;
  /** Reads the inbox: staff_default (granted whatsapp.inbox_view by migration). */
  staffUser: UserSelectType;
  /** Honest-permission denial actor: teacher_default only. */
  intruderUser: UserSelectType;
  /** External recipient of the routed template notification. */
  parentUser: UserSelectType;
  parent: ParentSelectType;
  student: StudentSelectType;
  teacherUser: UserSelectType;
  teacher: TeacherSelectType;
  /** Feeds `studentName`/`scheduledStartAt` template params of CLASS_REMINDER. */
  classInstance: ClassInstanceSelectType;
  adsAccount: WhatsappAccountReturnType;
  studentsAccount: WhatsappAccountReturnType;
  coexistAccount: WhatsappAccountReturnType;
  groupAssignments: SystemGroupAssignment[];
  /** Run-prefixed custom group granting whatsapp.config_manage to the admin. */
  whatsappConfigGroupId: string;
  createdSubjectId: string | null;
  createdCategoryId: string | null;
}

/**
 * Grants the migration-seeded `whatsapp.config_manage` catalog permission to
 * the admin actor through a run-prefixed custom group (real
 * `group_permissions` + `user_permission_groups` rows — no mocked context).
 */
async function grantWhatsappConfigManage(tx: TestDb, prefix: string, userId: string): Promise<string> {
  const [catalogRow] = await tx
    .select({ id: permissions.id })
    .from(permissions)
    .where(eq(permissions.key, AppPermission.WHATSAPP_CONFIG_MANAGE))
    .limit(1);
  if (!catalogRow) {
    throw new Error("WhatsApp journey cast: whatsapp.config_manage catalog row not found");
  }
  const now = new Date();
  const [group] = await tx
    .insert(permissionGroups)
    .values({
      name: { en: `${prefix} WhatsApp Config`, ar: `${prefix} WhatsApp Config` },
      slug: `${prefix}-whatsapp-config`,
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: permissionGroups.id });
  if (!group) {
    throw new Error("WhatsApp journey cast: failed to create whatsapp.config_manage group");
  }
  await tx.insert(groupPermissions).values({ groupId: group.id, permissionId: catalogRow.id });
  await tx.insert(userPermissionGroups).values({ userId, groupId: group.id, assignedAt: now });
  return group.id;
}
/**
 * Builds one account insert with unique WABA / phone-number-id / display
 * phone so webhook account resolution and pair-rate-limit sender keys never
 * collide across accounts or runs. `createdAt` staggers rows so
 * oldest-first purpose resolution is deterministic inside a run.
 */
function accountFixture(
  prefix: string,
  slot: string,
  overrides: Partial<WhatsappAccountInsertType>
): WhatsappAccountInsertType {
  return {
    wabaId: `${prefix}-waba-${slot}`,
    phoneNumberId: `${prefix}-pn-${slot}`,
    displayPhoneNumber: `+1555${randomUUID().replace(/\D/g, "").slice(0, 7)}`,
    encryptedAccessToken: `${prefix}-token-${slot}-${randomUUID()}`,
    encryptedTwoStepPin: "654321",
    isActive: true,
    syncProgress: 0,
    ...overrides,
  };
}

/**
 * Provisions the full cast in one COMMITTING transaction. Accounts are
 * fixtures (Cloud-API numbers start GENERAL, purposes are assigned by the
 * ADMIN actor mid-journey through the real service); the coexistence number
 * starts INACTIVE with a real credential so sync enqueue can run against it.
 */
export async function provisionWhatsappCast(prefix: string): Promise<WhatsappJourneyCast> {
  return db.transaction(async tx => {
    const pair = await createCastSubjectPair(tx, prefix);

    const adminUser = await createTestUser(tx, { name: `${prefix} Admin` });
    const staffUser = await createTestUser(tx, { name: `${prefix} Staff` });
    const intruderUser = await createTestUser(tx, { name: `${prefix} Intruder` });
    const parentUser = await createTestUser(tx, { name: `${prefix} Parent` });
    const teacherUser = await createTestUser(tx, { name: `${prefix} Teacher` });

    const parent = await createTestParent(tx, parentUser.id);
    const teacher = await createTestTeacher(tx, teacherUser.id);
    const student = await createTestStudent(tx, parent.id, { name: `${prefix} Student` });
    const classInstance = await createCompletedClassInstance(tx, student.id, teacher.id, {
      subjectId: pair.subjectId,
    });

    const groupAssignments = [
      await assignSystemGroup(tx, adminUser.id, SystemPermissionGroupSlug.ACADEMY_ADMIN),
      await assignSystemGroup(tx, staffUser.id, SystemPermissionGroupSlug.STAFF_DEFAULT),
      await assignSystemGroup(tx, intruderUser.id, SystemPermissionGroupSlug.TEACHER_DEFAULT),
    ];
    const whatsappConfigGroupId = await grantWhatsappConfigManage(tx, prefix, adminUser.id);
    const adsAccount = await WhatsappAccountRepository.create(
      accountFixture(prefix, "ads", {
        purpose: WhatsappAccountPurpose.GENERAL,
        onboardingMode: WhatsappOnboardingMode.CLOUD_API,
      }),
      tx
    );
    const studentsAccount = await WhatsappAccountRepository.create(
      accountFixture(prefix, "students", {
        purpose: WhatsappAccountPurpose.GENERAL,
        onboardingMode: WhatsappOnboardingMode.CLOUD_API,
      }),
      tx
    );
    const coexistAccount = await WhatsappAccountRepository.create(
      accountFixture(prefix, "coexist", {
        purpose: WhatsappAccountPurpose.GENERAL,
        onboardingMode: WhatsappOnboardingMode.COEXISTENCE,
        isActive: false,
      }),
      tx
    );

    return {
      prefix,
      adminUser,
      staffUser,
      intruderUser,
      parentUser,
      parent,
      student,
      teacherUser,
      teacher,
      classInstance,
      adsAccount,
      studentsAccount,
      coexistAccount,
      groupAssignments,
      whatsappConfigGroupId,
      createdSubjectId: pair.subjectId,
      createdCategoryId: pair.categoryId,
    };
  });
}
/**
 * Hard-deletes every row the cast + journey produces, in FK-safe order:
 * audit rows for the accounts (audit immutability trigger is toggled by the
 * caller's suite, as in the adjustment journeys), durable webhook events
 * (matched by this run's payload hashes — their `accountId` is null at insert
 * so the account cascade cannot reach them), the accounts (cascading inbox
 * tables + sync requests), the per-run config group chain, then the shared
 * class/student/parent/teacher fixture sweep.
 */
export async function cleanupWhatsappCast(cast: WhatsappJourneyCast, webhookPayloadHashes: string[]): Promise<void> {
  await db.transaction(async tx => {
    if (webhookPayloadHashes.length > 0) {
      await tx.delete(whatsappWebhookEvents).where(inArray(whatsappWebhookEvents.payloadHash, webhookPayloadHashes));
    }
    await tx
      .delete(whatsappAccounts)
      .where(inArray(whatsappAccounts.id, [cast.adsAccount.id, cast.studentsAccount.id, cast.coexistAccount.id]));
    await tx.delete(userPermissionGroups).where(eq(userPermissionGroups.groupId, cast.whatsappConfigGroupId));
    await tx.delete(groupPermissions).where(eq(groupPermissions.groupId, cast.whatsappConfigGroupId));
    await tx.delete(permissionGroups).where(eq(permissionGroups.id, cast.whatsappConfigGroupId));
    await purgeCastFixture(tx, {
      instanceIds: [cast.classInstance.id],
      studentId: cast.student.id,
      parentId: cast.parent.id,
      teacherIds: [cast.teacher.id],
      userIds: [
        cast.adminUser.id,
        cast.staffUser.id,
        cast.intruderUser.id,
        cast.parentUser.id,
        cast.teacherUser.id,
        cast.student.userId,
      ],
      groupAssignments: cast.groupAssignments,
      createdSubjectId: cast.createdSubjectId,
      createdCategoryId: cast.createdCategoryId,
    });
  });
}
