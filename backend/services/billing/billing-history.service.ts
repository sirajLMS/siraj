import { BillingRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission } from "@/shared/lib/enum";

export interface ParentInvoiceHistoryRow {
  readonly id: string;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly paidDate: string | null;
  readonly amount: string;
  readonly currency: string;
  readonly status: string;
  readonly invoiceType: string;
  readonly studentId: string | null;
}

export namespace BillingHistoryService {
  /**
   * Retrieves the full invoice history for a specific parent.
   * Requires: billing.view_history permission.
   */
  export async function getParentInvoiceHistory(
    actorUserId: string,
    parentId: string,
    locale?: string
  ): Promise<ParentInvoiceHistoryRow[]> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_VIEW_HISTORY);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    return BillingRepository.getInvoicesForParent(parentId);
  }
}
