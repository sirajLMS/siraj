import { db } from "@/backend/db";
import { UserRepository } from "@/backend/db/repo/users";
import {
  scrubCommunicationsPii,
  scrubParentProfile,
  scrubSessionRemnants,
  scrubStudentsAndFileJunctions,
  scrubTeacherProfile,
  scrubUserAccount,
  scrubWhatsappIdentity,
  softDeleteAndAuditUser,
} from "@/backend/services/users/user-anonymization.helpers";
import type { DBTransaction } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

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

      await scrubUserAccount(t, userId, locale);
      const parentId = await scrubParentProfile(t, userId, locale, subjectPhones);
      await scrubWhatsappIdentity(t, subjectPhones);
      const teacherId = await scrubTeacherProfile(t, userId);
      await scrubStudentsAndFileJunctions(t, { userId, parentId, teacherId, locale });
      await scrubCommunicationsPii(t, userId, parentId);
      await scrubSessionRemnants(t, userId, subjectEmail);
      const { deletedAt } = await softDeleteAndAuditUser(t, { userId, actorUserId, actorIpAddress });

      return { userId, anonymized: true, deletedAt };
    };

    return tx ? run(tx) : db.transaction(run);
  };
}
