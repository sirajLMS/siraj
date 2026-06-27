import { BillingRepository, ParentRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  AdminBillingSummaryResult,
  InvoiceHistoryPaginatedResult,
  ParentBillingSummaryResult,
  PaginationArgs,
  StudentCreditRow,
} from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";

export namespace BillingHistoryService {
  export async function getParentInvoiceHistory(
    actorUserId: string,
    parentId: string | null,
    pagination: PaginationArgs | null = null,
    locale?: string
  ): Promise<InvoiceHistoryPaginatedResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_VIEW_HISTORY);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    let resolvedParentId = parentId;
    if (!resolvedParentId) {
      const parent = await ParentRepository.findByUserId(actorUserId);
      if (!parent) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("parentNotFound"));
      }
      resolvedParentId = parent.id;
    }

    const result = await BillingRepository.getInvoicesForParent(resolvedParentId, pagination);

    return {
      id: `parent-invoice-history-${resolvedParentId}`,
      rows: result.rows,
      totalCount: result.totalCount,
      pageInfo: result.pageInfo,
    };
  }

  export async function getAdminInvoices(
    actorUserId: string,
    pagination: PaginationArgs | null = null,
    locale?: string
  ): Promise<InvoiceHistoryPaginatedResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_VIEW_HISTORY);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    return BillingRepository.getAllInvoices(pagination);
  }

  export async function getAdminBillingSummary(
    actorUserId: string,
    locale?: string
  ): Promise<AdminBillingSummaryResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_VIEW_HISTORY);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    return BillingRepository.getAdminBillingSummary();
  }

  export async function getStudentCreditStatus(
    actorUserId: string,
    locale?: string
  ): Promise<StudentCreditRow[]> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_VIEW_HISTORY);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    return BillingRepository.getStudentsWithCreditStatus();
  }

  export async function getParentBillingSummary(
    actorUserId: string,
    parentId: string | null,
    locale?: string
  ): Promise<ParentBillingSummaryResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_VIEW_HISTORY);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    let resolvedParentId = parentId;
    if (!resolvedParentId) {
      const parent = await ParentRepository.findByUserId(actorUserId);
      if (!parent) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("parentNotFound"));
      }
      resolvedParentId = parent.id;
    }

    return BillingRepository.getParentBillingSummary(resolvedParentId);
  }
}
