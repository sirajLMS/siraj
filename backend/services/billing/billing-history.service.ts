import { BillingRepository } from "@/backend/db/repo";
import type { ParentInvoiceHistoryResult } from "@/backend/db/repo/billing.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { PaginationArgs } from "@/backend/types";
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

export interface ParentInvoiceHistoryResultType {
  readonly id: string;
  readonly rows: ParentInvoiceHistoryRow[];
  readonly totalCount: number;
  readonly pageInfo: import("@/backend/types").PageInfo | null;
}

export namespace BillingHistoryService {
  export async function getParentInvoiceHistory(
    actorUserId: string,
    parentId: string,
    pagination: PaginationArgs | null = null,
    locale?: string
  ): Promise<ParentInvoiceHistoryResultType> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_VIEW_HISTORY);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const result: ParentInvoiceHistoryResult = await BillingRepository.getInvoicesForParent(parentId, pagination);

    return {
      id: `parent-invoice-history-${parentId}`,
      rows: result.rows,
      totalCount: result.totalCount,
      pageInfo: result.pageInfo,
    };
  }
}
