import { AccountingPaymentSupport } from "@/backend/db/repo/billing";
import { StudentRepository } from "@/backend/db/repo/students";
import { logger } from "@/backend/lib/logger";
import {
  buildAccountingLowHoursPayloads,
  buildAccountingPaymentRecordedPayloads,
} from "@/backend/services/notification/accounting-notification.builders";
import { dispatchWithPreferences } from "@/backend/services/notification/notification-dispatch.helpers";
import { SystemSettingsService } from "@/backend/services/system/system-settings.service";
import type { CommunicationPayload } from "@/backend/types";

const DEFAULT_LOW_HOURS_THRESHOLD = 5;

export namespace AccountingNotificationService {
  // NOTE: Transient notification failures are logged but not retried — consider a durable outbox for production

  async function dispatch<I extends { affectedUserIds: readonly string[]; locale?: string }>(
    builder: (input: I) => CommunicationPayload[],
    input: I,
    errorLabel: string
  ): Promise<void> {
    try {
      const payloads = builder(input);
      if (payloads.length > 0) {
        await dispatchWithPreferences(payloads, [...input.affectedUserIds], input.locale);
      }
    } catch (err) {
      logger.error(errorLabel, { err, input });
    }
  }

  /**
   * Fire-and-forget notice after a successful hour purchase. Delivered to the
   * student (plus the linked parent when one exists).
   */
  const sendPaymentRecorded = (input: {
    affectedUserIds: readonly string[];
    packageName: string;
    creditHours: string;
    amount: string;
    currency: string;
    locale?: string;
  }): Promise<void> =>
    dispatch(buildAccountingPaymentRecordedPayloads, input, "Accounting payment recorded notification dispatch failed");

  /**
   * Fire-and-forget entry used right after a successful payment tx commit.
   * Resolves student/parent user ids internally so callers stay lean.
   */
  export async function notifyPaymentRecorded(input: {
    studentId: string;
    packageName: string;
    creditHours: string;
    amount: string;
    currency: string;
  }): Promise<void> {
    try {
      const recipients = await AccountingPaymentSupport.resolveHourLedgerRecipients(input.studentId);
      const affectedUserIds = [recipients.studentUserId, recipients.parentUserId].filter((id): id is string =>
        Boolean(id)
      );
      await sendPaymentRecorded({
        affectedUserIds,
        packageName: input.packageName,
        creditHours: input.creditHours,
        amount: input.amount,
        currency: input.currency,
      });
    } catch (err) {
      logger.error("Accounting payment recorded notification failed", { err, input });
    }
  }

  /** Fire-and-forget low-balance warning delivered to student + linked parent. */
  const sendLowHours = (input: {
    affectedUserIds: readonly string[];
    remaining: string;
    threshold: string;
    locale?: string;
  }): Promise<void> =>
    dispatch(buildAccountingLowHoursPayloads, input, "Accounting low hours notification dispatch failed");

  /**
   * Convenience wrapper used by deduction paths: checks the live balance
   * against the `accounting_low_hours_threshold` system setting and dispatches
   * the ACCOUNTING_LOW_HOURS notice when it dips to/below the threshold.
   * Never throws — callers may fire-and-forget with `void`.
   */
  export async function maybeNotifyLowHours(studentId: string): Promise<void> {
    try {
      const setting = await SystemSettingsService.getSettingByKey("accounting_low_hours_threshold");
      const thresholdRaw = setting?.value ?? String(DEFAULT_LOW_HOURS_THRESHOLD);
      const threshold = Number(thresholdRaw);
      if (!Number.isFinite(threshold)) return;

      const balance = await StudentRepository.getCreditHourBalance(studentId);
      const remaining = Number(balance.creditHoursRemaining);
      if (remaining > threshold) return;

      const recipients = await AccountingPaymentSupport.resolveHourLedgerRecipients(studentId);
      const affectedUserIds = [recipients.studentUserId, recipients.parentUserId].filter((id): id is string =>
        Boolean(id)
      );
      await sendLowHours({
        affectedUserIds,
        remaining: balance.creditHoursRemaining,
        threshold: thresholdRaw,
      });
    } catch (err) {
      logger.error("Accounting low hours check failed", { err, studentId });
    }
  }
}
