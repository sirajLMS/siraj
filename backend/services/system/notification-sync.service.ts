import { BillingRepository } from "@/backend/db/repo";
import { logger } from "@/backend/lib/logger";
import type * as Types from "@/backend/types";

export namespace NotificationSyncService {
  export async function syncUnpaidNotifications(locale?: string): Promise<Types.UnpaidInvoicesSummaryResult> {
    try {
      const summary = await BillingRepository.getUnpaidInvoicesSummary();
      logger.info("Notification tray synced after billing mutation", {
        totalOverdueInvoices: summary.totalOverdueInvoices,
        totalOverdueAmount: summary.totalOverdueAmount,
      });
      return summary;
    } catch (error) {
      logger.error("Failed to sync notification tray", { locale, error });
      throw error;
    }
  }
}
