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
import { AccountStatus } from "@/backend/enum";
import { DomainError } from "@/backend/lib/errors";
import type { DBTransaction } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

/**
 * Tombstone display name applied to anonymized persons.
 */
const DELETED_USER_NAME = "Deleted user";

/**
 * Unique, non-deliverable tombstone email — satisfies the `users.email`
 * unique constraint because it embeds the (immutable) user id.
 */
const tombstoneEmail = (userId: string) => `deleted_${userId}@removed.invalid`;

/** Scrubs the user row: profile fields first, then security remnants, then status. */
export async function scrubUserAccount(t: DBTransaction, userId: string, locale: string | undefined): Promise<void> {
  await UserRepository.updateProfileFields(
    userId,
    {
      name: DELETED_USER_NAME,
      email: tombstoneEmail(userId),
      phone: null,
      avatarUrl: null,
      avatarFilePath: null,
    },
    locale,
    t
  );
  await UserRepository.scrubSecurityRemnants(userId, t);
  await UserRepository.updateStatus(userId, AccountStatus.DEACTIVATED, t, locale);
}

/**
 * Scrubs the owned parent row and returns its id, appending the parent's
 * WhatsApp number to `subjectPhones` before the scrub clears it.
 */
export async function scrubParentProfile(
  t: DBTransaction,
  userId: string,
  locale: string | undefined,
  subjectPhones: string[]
): Promise<string | null> {
  const parent = await ParentRepository.findByUserId(userId, t);
  if (parent?.whatsapp) {
    subjectPhones.push(parent.whatsapp);
  }
  if (parent) {
    await ParentRepository.updateParentProfile(
      parent.id,
      { nationality: null, address: null, facebook: null, whatsapp: null, twitter: null },
      locale,
      t
    );
  }
  return parent?.id ?? null;
}

/** Erases WhatsApp identity data linked to the subject's phone numbers. */
export async function scrubWhatsappIdentity(t: DBTransaction, subjectPhones: readonly string[]): Promise<void> {
  const uniquePhones = [...new Set(subjectPhones)];
  if (uniquePhones.length === 0) return;
  await WhatsappContactRepository.anonymizeByPhoneNumbers(uniquePhones, t);
  await WhatsappConversationRepository.anonymizeByWaIds(uniquePhones, t);
  await WhatsappMessageRepository.deleteSubjectContentByWaIds(uniquePhones, t);
}

/** Scrubs the owned teacher row and returns its id, or null when absent. */
export async function scrubTeacherProfile(t: DBTransaction, userId: string): Promise<string | null> {
  const teacher = await TeacherRepository.findByUserId(userId, t);
  if (!teacher) return null;
  await TeacherRepository.updateTeacherProfile(
    teacher.id,
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
    t
  );
  return teacher.id;
}

/**
 * Scrubs directly-owned student rows (the user's own student account and, for
 * parents, their children) and removes the subject's file-junction rows. The
 * scrub runs through the students repository inside `withCurrentUser` (FORCE
 * RLS sets the `app.current_user_id` GUC), and the affected-row assertion
 * aborts the whole erasure on mismatch instead of leaving a partial scrub.
 */
export async function scrubStudentsAndFileJunctions(
  t: DBTransaction,
  params: { userId: string; parentId: string | null; teacherId: string | null; locale: string | undefined }
): Promise<void> {
  const errorsTranslations = getServerTranslations(params.locale ?? "en").errorsTranslations;
  const { priorCount, scrubbedCount, scrubbedIds } = await StudentRepository.scrubForAnonymization(t, {
    userId: params.userId,
    parentId: params.parentId,
    scrubbedName: DELETED_USER_NAME,
  });
  if (scrubbedCount !== priorCount) {
    throw new DomainError("ANONYMIZATION_SCRUB_INCOMPLETE", errorsTranslations.anonymizationScrubIncomplete);
  }

  await StorageDbRepository.deleteOwnerFileJunctions(
    {
      userId: params.userId,
      parentId: params.parentId,
      teacherId: params.teacherId,
      studentIds: scrubbedIds,
    },
    t
  );
}

/** Scrubs communications PII: complaints, suggestions, device tokens, delivery content. */
export async function scrubCommunicationsPii(t: DBTransaction, userId: string, parentId: string | null): Promise<void> {
  if (parentId) {
    await ComplaintRepository.deleteByParentId(parentId, t);
    await SuggestionRepository.deleteByParentId(parentId, t);
  }
  await NotificationRepository.deleteDeviceTokensByUserId(userId, t);
  await NotificationRepository.scrubDeliveryContentByUserId(userId, t);
}

/** Erases session remnants and email-keyed security rows recorded before anonymization. */
export async function scrubSessionRemnants(t: DBTransaction, userId: string, subjectEmail: string): Promise<void> {
  await SessionRepository.deleteByUserId(userId, t);
  await RateLimitRepository.deleteEmailRemnants(subjectEmail, t);
}

/** Soft-deletes the user row and writes the anonymization admin audit entry. */
export async function softDeleteAndAuditUser(
  t: DBTransaction,
  params: { userId: string; actorUserId: string; actorIpAddress: string | null | undefined }
): Promise<{ deletedAt: Date }> {
  const { deletedAt } = await SoftDeleteRepository.softDeleteUser(params.userId, params.actorUserId, t);
  await AuditRepository.createManyAdminAuditLogs(
    [
      {
        actorUserId: params.actorUserId,
        targetUserId: params.userId,
        action: "USER_ANONYMIZED",
        description: "User PII anonymized and account soft-deleted",
        newState: { anonymized: true, status: AccountStatus.DEACTIVATED },
        ipAddress: params.actorIpAddress ?? null,
      },
    ],
    t
  );
  return { deletedAt };
}
