import { logger } from "@/backend/lib/logger";
import { dispatchWithPreferences } from "@/backend/services/notification/notification-dispatch.helpers";
import {
  buildOndemandInstancePendingCreditPayloads,
  buildOndemandInstanceReminderT1Payloads,
  buildOndemandInstanceReminderT3Payloads,
  buildOndemandTeacherDailyDigestPayloads,
  buildQuotaExpiredPayloads,
  buildQuotaExpiringSoonPayloads,
  buildQuotaLowBalancePayloads,
} from "@/backend/services/notification/quota-notification.builders";
import type { CommunicationPayload } from "@/backend/types";

export namespace QuotaNotificationService {
  // NOTE: Transient notification failures are logged but not retried — consider a durable outbox for production

  /**
   * Single parameterized dispatch method shared by all seven public `send*`
   * wrappers. Builds payloads via `builder`, dispatches via
   * `dispatchWithPreferences`, and logs transient failures with `errorLabel`.
   */
  async function dispatch<I extends { affectedUserIds: string[]; locale?: string }>(
    builder: (input: I) => CommunicationPayload[],
    input: I,
    errorLabel: string
  ): Promise<void> {
    try {
      const payloads = builder(input);
      if (payloads.length > 0) {
        await dispatchWithPreferences(payloads, input.affectedUserIds, input.locale);
      }
    } catch (err) {
      logger.error(errorLabel, { err, input });
    }
  }

  export const sendQuotaExpiringSoon = (input: {
    affectedUserIds: string[];
    quotaName: string;
    validUntil: string;
    remaining: number;
    locale?: string;
  }): Promise<void> =>
    dispatch(buildQuotaExpiringSoonPayloads, input, "Quota expiring soon notification dispatch failed");

  export const sendQuotaExpired = (input: {
    affectedUserIds: string[];
    quotaName: string;
    locale?: string;
  }): Promise<void> => dispatch(buildQuotaExpiredPayloads, input, "Quota expired notification dispatch failed");

  export const sendQuotaLowBalance = (input: {
    affectedUserIds: string[];
    studentName: string;
    remaining: number;
    totalClasses: number;
    locale?: string;
  }): Promise<void> => dispatch(buildQuotaLowBalancePayloads, input, "Quota low balance notification dispatch failed");

  export const sendOndemandInstancePendingCredit = (input: {
    affectedUserIds: string[];
    studentName: string;
    scheduledStartAt: string;
    locale?: string;
  }): Promise<void> =>
    dispatch(
      buildOndemandInstancePendingCreditPayloads,
      input,
      "On-demand pending credit notification dispatch failed"
    );

  export const sendOndemandInstanceReminderT3 = (input: {
    affectedUserIds: string[];
    studentName: string;
    scheduledStartAt: string;
    locale?: string;
  }): Promise<void> =>
    dispatch(buildOndemandInstanceReminderT3Payloads, input, "On-demand T-3 reminder notification dispatch failed");

  export const sendOndemandInstanceReminderT1 = (input: {
    affectedUserIds: string[];
    studentName: string;
    scheduledStartAt: string;
    locale?: string;
  }): Promise<void> =>
    dispatch(buildOndemandInstanceReminderT1Payloads, input, "On-demand T-1 reminder notification dispatch failed");

  export const sendOndemandTeacherDailyDigest = (input: {
    affectedUserIds: string[];
    teacherName: string;
    pendingCount: number;
    locale?: string;
  }): Promise<void> =>
    dispatch(
      buildOndemandTeacherDailyDigestPayloads,
      input,
      "On-demand teacher daily digest notification dispatch failed"
    );
}
