import { BillingRepository } from "@/backend/db/repo/billing.repository";
import { AppPermission } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";

export namespace BillingAlertsService {
  export async function getUnpaidInvoices(userId: string, locale?: string) {
    try {
      const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.BILLING_VIEW_UNPAID_INVOICES);
      if (!isAuthorized) {
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("unauthorizedAction"));
      }

      return await BillingRepository.getUnpaidInvoicesSummary();
    } catch (error) {
      logger.error("Error fetching unpaid invoices", { userId, error });
      throw error;
    }
  }
}
