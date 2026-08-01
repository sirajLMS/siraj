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

export namespace QuotaNotificationService {
  // NOTE: Transient notification failures are logged but not retried — consider a durable outbox for production
  export const sendQuotaExpiringSoon = async (input: {
    affectedUserIds: string[];
    quotaName: string;
    validUntil: string;
    remaining: number;
    locale?: string;
  }): Promise<void> => {
    try {
      const payloads = buildQuotaExpiringSoonPayloads(input);
      if (payloads.length > 0) {
        await dispatchWithPreferences(payloads, input.affectedUserIds, input.locale);
      }
    } catch (err) {
      logger.error("Quota expiring soon notification dispatch failed", { err, input });
    }
  };

  export const sendQuotaExpired = async (input: {
    affectedUserIds: string[];
    quotaName: string;
    locale?: string;
  }): Promise<void> => {
    try {
      const payloads = buildQuotaExpiredPayloads(input);
      if (payloads.length > 0) {
        await dispatchWithPreferences(payloads, input.affectedUserIds, input.locale);
      }
    } catch (err) {
      logger.error("Quota expired notification dispatch failed", { err, input });
    }
  };

  export const sendQuotaLowBalance = async (input: {
    affectedUserIds: string[];
    studentName: string;
    remaining: number;
    totalClasses: number;
    locale?: string;
  }): Promise<void> => {
    try {
      const payloads = buildQuotaLowBalancePayloads(input);
      if (payloads.length > 0) {
        await dispatchWithPreferences(payloads, input.affectedUserIds, input.locale);
      }
    } catch (err) {
      logger.error("Quota low balance notification dispatch failed", { err, input });
    }
  };

  export const sendOndemandInstancePendingCredit = async (input: {
    affectedUserIds: string[];
    studentName: string;
    scheduledStartAt: string;
    locale?: string;
  }): Promise<void> => {
    try {
      const payloads = buildOndemandInstancePendingCreditPayloads(input);
      if (payloads.length > 0) {
        await dispatchWithPreferences(payloads, input.affectedUserIds, input.locale);
      }
    } catch (err) {
      logger.error("On-demand pending credit notification dispatch failed", { err, input });
    }
  };

  export const sendOndemandInstanceReminderT3 = async (input: {
    affectedUserIds: string[];
    studentName: string;
    scheduledStartAt: string;
    locale?: string;
  }): Promise<void> => {
    try {
      const payloads = buildOndemandInstanceReminderT3Payloads(input);
      if (payloads.length > 0) {
        await dispatchWithPreferences(payloads, input.affectedUserIds, input.locale);
      }
    } catch (err) {
      logger.error("On-demand T-3 reminder notification dispatch failed", { err, input });
    }
  };

  export const sendOndemandInstanceReminderT1 = async (input: {
    affectedUserIds: string[];
    studentName: string;
    scheduledStartAt: string;
    locale?: string;
  }): Promise<void> => {
    try {
      const payloads = buildOndemandInstanceReminderT1Payloads(input);
      if (payloads.length > 0) {
        await dispatchWithPreferences(payloads, input.affectedUserIds, input.locale);
      }
    } catch (err) {
      logger.error("On-demand T-1 reminder notification dispatch failed", { err, input });
    }
  };

  export const sendOndemandTeacherDailyDigest = async (input: {
    affectedUserIds: string[];
    teacherName: string;
    pendingCount: number;
    locale?: string;
  }): Promise<void> => {
    try {
      const payloads = buildOndemandTeacherDailyDigestPayloads(input);
      if (payloads.length > 0) {
        await dispatchWithPreferences(payloads, input.affectedUserIds, input.locale);
      }
    } catch (err) {
      logger.error("On-demand teacher daily digest notification dispatch failed", { err, input });
    }
  };
}
