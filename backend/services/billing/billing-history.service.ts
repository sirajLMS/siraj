import { BillingRepository } from "@/backend/db/repo/billing";
import { ParentRepository } from "@/backend/db/repo/parents";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  AdminBillingSummaryResult,
  InvoiceHistoryPaginatedResult,
  PaginationArgs,
  ParentBillingSummaryResult,
  StudentCreditRow,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace BillingHistoryService {
  async function assertBillingViewPermission(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_VIEW_HISTORY);
    if (hasPermission) return;
    throw new Error(tErrors.insufficientPermissions);
  }

  async function resolveParentId(
    parentId: string | null,
    fallbackUserId: string,
    tErrors: ErrorsLabels
  ): Promise<string> {
    if (parentId) return parentId;
    const parent = await ParentRepository.findByUserId(fallbackUserId);
    if (!parent) {
      throw new Error(tErrors.billing.parentNotFound);
    }
    return parent.id;
  }

  export async function getParentInvoiceHistory(
    actorUserId: string,
    parentId: string | null,
    userId: string | null | undefined,
    tErrors: ErrorsLabels,
    pagination: PaginationArgs | null = null,
    search: string | null | undefined = null
  ): Promise<InvoiceHistoryPaginatedResult> {
    await assertBillingViewPermission(actorUserId, tErrors);
    const resolvedParentId = await resolveParentId(parentId, userId ?? actorUserId, tErrors);

    const result = await BillingRepository.getInvoicesForParent(resolvedParentId, pagination, search);

    return {
      id: `parent-invoice-history-${resolvedParentId}`,
      rows: result.rows,
      totalCount: result.totalCount,
      pageInfo: result.pageInfo,
    };
  }

  export async function getAdminInvoices(
    actorUserId: string,
    tErrors: ErrorsLabels,
    pagination: PaginationArgs | null = null,
    search: string | null | undefined = null
  ): Promise<InvoiceHistoryPaginatedResult> {
    await assertBillingViewPermission(actorUserId, tErrors);
    return BillingRepository.getAllInvoices(pagination, search);
  }

  export async function getAdminBillingSummary(
    actorUserId: string,
    tErrors: ErrorsLabels
  ): Promise<AdminBillingSummaryResult> {
    await assertBillingViewPermission(actorUserId, tErrors);
    return BillingRepository.getAdminBillingSummary();
  }

  export async function getStudentCreditStatus(
    actorUserId: string,
    tErrors: ErrorsLabels
  ): Promise<StudentCreditRow[]> {
    await assertBillingViewPermission(actorUserId, tErrors);
    return BillingRepository.getStudentsWithCreditStatus();
  }

  export async function getParentBillingSummary(
    actorUserId: string,
    parentId: string | null,
    userId: string | null | undefined,
    tErrors: ErrorsLabels
  ): Promise<ParentBillingSummaryResult> {
    await assertBillingViewPermission(actorUserId, tErrors);
    const resolvedParentId = await resolveParentId(parentId, userId ?? actorUserId, tErrors);
    return BillingRepository.getParentBillingSummary(resolvedParentId);
  }
}
