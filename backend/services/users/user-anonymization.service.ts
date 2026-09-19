import { db } from "@/backend/db";
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

export namespace UserAnonymizationService {
  interface AnonymizeUserResult {
    readonly userId: string;
    readonly anonymized: true;
    readonly deletedAt: Date;
  }

  /**
   * Anonymizes a person's PII and soft-deletes their user account.
   *
   * All scrubs below run inside a single transaction so a partial erasure
   * never commits silently:
   * - users row: name → "Deleted user", email → unique tombstone,
   *   phone/avatar URL/avatar file path → null, security remnants → null,
   *   status → DEACTIVATED
   * - owned parent row: address, whatsapp, facebook, twitter, nationality → null
   * - owned teacher row: nationalId, phone, dateOfBirth, address,
   *   qualifications, nationality, gender, countryCode → null
   * - directly-owned student rows (the user's own student account and, for
   *   parents, their children): name → "Deleted user", dateOfBirth, avatarUrl,
   *   gender, language, timezoneOverride → null — routed through the students
   *   repository inside `withCurrentUser` (FORCE RLS sets the
   *   `app.current_user_id` GUC), with an affected-row assertion that rolls
   *   the whole erasure back on mismatch
   * - WhatsApp identity data linked to the subject's phone numbers
   *   (users.phone / parents.whatsapp): contact and conversation identity
   *   columns → null; the subject's own message content (INBOUND/ECHO) deleted
   * - communications PII: the subject's complaints and suggestions rows
   *   deleted (identity/body columns are NOT NULL), device-token rows
   *   deleted, notification-delivery content columns → null
   * - storage junctions (user/parent/teacher/student files) deleted;
   *   `avatarFilePath` cleared so no orphaned avatar path survives
   * - session remnants: sessions + session metadata deleted, email-keyed
   *   auth rate-limit and password-reset rows deleted
   * - the user row is soft-deleted last (RLS filters soft-deleted rows, so
   *   the scrub must complete before `deletedAt` is set)
   *
   * The subject's message content is erased conservatively: only messages
   * authored by the subject (INBOUND deliveries and ECHO mirrors of their
   * phone-app sends) are deleted; academy-authored API_OUTBOUND replies stay.
   *
   * Super-admin accounts are never anonymized (last-resort admin recovery).
   */
  export const anonymizeAndSoftDeleteUser = async (
    userId: string,
    actorUserId: string,
    locale?: string,
    tx?: DBTransaction,
    actorIpAddress?: string | null
  ): Promise<AnonymizeUserResult> => {
    const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;

    const run = async (t: DBTransaction): Promise<AnonymizeUserResult> => {
      const user = await UserRepository.findSafeById(userId, t);
      if (!user) {
        throw new Error(errorsTranslations.userNotFound(userId));
      }
      if (user.isSuperAdmin) {
        throw new Error(errorsTranslations.insufficientPermissions);
      }

      // Captured BEFORE any scrub — the WhatsApp lookup keys and the
      // email-keyed security remnants disappear once the rows are tombstoned.
      const subjectEmail = user.email;
      const subjectPhones = [user.phone].filter((p): p is string => !!p);

      // 1. Scrub the users row (profile fields first, then security remnants).
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

      // 2. Scrub the directly-owned parent row.
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

      // 2b. Erase WhatsApp identity data linked to the subject's phone
      //     numbers (users.phone and the pre-scrub parents.whatsapp).
      const uniquePhones = [...new Set(subjectPhones)];
      if (uniquePhones.length > 0) {
        await WhatsappContactRepository.anonymizeByPhoneNumbers(uniquePhones, t);
        await WhatsappConversationRepository.anonymizeByWaIds(uniquePhones, t);
        await WhatsappMessageRepository.deleteSubjectContentByWaIds(uniquePhones, t);
      }

      // 3. Scrub the directly-owned teacher row.
      const teacher = await TeacherRepository.findByUserId(userId, t);
      if (teacher) {
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
      }

      // 4. Scrub directly-owned student rows: the user's own student record and,
      //    for parents, their children (matching the schema's parent cascade).
      //    The scrub runs through the students repository inside withCurrentUser
      //    (FORCE RLS sets the app.current_user_id GUC), and the affected-row
      //    assertion guarantees the scrub matched every row the pre-read found —
      //    a mismatch (RLS policy, concurrent write) aborts the whole erasure
      //    instead of leaving a partial scrub.
      const { priorCount, scrubbedCount, scrubbedIds } = await StudentRepository.scrubForAnonymization(t, {
        userId,
        parentId: parent?.id ?? null,
        scrubbedName: DELETED_USER_NAME,
      });
      if (scrubbedCount !== priorCount) {
        throw new DomainError("ANONYMIZATION_SCRUB_INCOMPLETE", errorsTranslations.anonymizationScrubIncomplete);
      }

      // 4b. Remove the subject's file-junction rows (user, parent, teacher,
      //     student files) so the anonymized person stops linking to stored
      //     photos and proofs. Physical blob removal is owned by the storage
      //     cleanup workflow; `avatarFilePath` was cleared in step 1.
      await StorageDbRepository.deleteOwnerFileJunctions(
        {
          userId,
          parentId: parent?.id ?? null,
          teacherId: teacher?.id ?? null,
          studentIds: scrubbedIds,
        },
        t
      );

      // 5. Scrub communications PII: complaints and suggestions are deleted
      //    (their submitter/body columns are NOT NULL, so the rows cannot be
      //    nulled without a schema change); device tokens are deleted; the
      //    content columns of the subject's notification deliveries are nulled.
      if (parent) {
        await ComplaintRepository.deleteByParentId(parent.id, t);
        await SuggestionRepository.deleteByParentId(parent.id, t);
      }
      await NotificationRepository.deleteDeviceTokensByUserId(userId, t);
      await NotificationRepository.scrubDeliveryContentByUserId(userId, t);

      // 6. Erase session remnants: active sessions (+ metadata, and Redis
      //    mirrors when enabled) and email-keyed security rows recorded
      //    under the pre-anonymization email.
      await SessionRepository.deleteByUserId(userId, t);
      await RateLimitRepository.deleteEmailRemnants(subjectEmail, t);

      // 7. Soft-delete the user row last (RLS hides soft-deleted rows afterwards).
      const { deletedAt } = await SoftDeleteRepository.softDeleteUser(userId, actorUserId, t);

      await AuditRepository.createManyAdminAuditLogs(
        [
          {
            actorUserId,
            targetUserId: userId,
            action: "USER_ANONYMIZED",
            description: "User PII anonymized and account soft-deleted",
            newState: { anonymized: true, status: AccountStatus.DEACTIVATED },
            ipAddress: actorIpAddress ?? null,
          },
        ],
        t
      );

      return { userId, anonymized: true, deletedAt };
    };

    return tx ? run(tx) : db.transaction(run);
  };
}
