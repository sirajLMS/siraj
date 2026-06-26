import { BillingRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { InvoiceHistoryPaginatedResult, PaginationArgs } from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";

export namespace BillingHistoryService {
  export async function getParentInvoiceHistory(
    actorUserId: string,
    parentId: string,
    pagination: PaginationArgs | null = null,
    locale?: string
  ): Promise<InvoiceHistoryPaginatedResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_VIEW_HISTORY);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const result = await BillingRepository.getInvoicesForParent(parentId, pagination);

    return {
      id: `parent-invoice-history-${parentId}`,
      rows: result.rows,
      totalCount: result.totalCount,
      pageInfo: result.pageInfo,
    };
  }
}
