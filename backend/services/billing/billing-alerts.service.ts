import { BillingRepository } from "@/backend/db/repo/billing/billing.repository";
import { AppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { ErrorsLabels } from "@/shared/locale";

export namespace BillingAlertsService {
  export async function getUnpaidInvoices(
    userId: string,
    tErrors: ErrorsLabels
  ): Promise<ReturnType<typeof BillingRepository.getUnpaidInvoicesSummary>> {
    try {
      const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.BILLING_VIEW_UNPAID_INVOICES);
      if (!isAuthorized) {
        throw new Error(tErrors.unauthorizedAction);
      }

      return await BillingRepository.getUnpaidInvoicesSummary();
    } catch (error) {
      logger.error("Error fetching unpaid invoices", { userId, error });
      throw error;
    }
  }
}
