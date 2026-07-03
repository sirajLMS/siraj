import { BillingRepository, ParentRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  AdminBillingSummaryResult,
  InvoiceHistoryPaginatedResult,
  PaginationArgs,
  ParentBillingSummaryResult,
  StudentCreditRow,
} from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";

export namespace BillingHistoryService {
  async function assertBillingViewPermission(actorUserId: string, locale?: string): Promise<void> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_VIEW_HISTORY);
    if (hasPermission) return;
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("insufficientPermissions"));
  }

  async function resolveParentId(parentId: string | null, fallbackUserId: string, locale?: string): Promise<string> {
    if (parentId) return parentId;
    const parent = await ParentRepository.findByUserId(fallbackUserId);
    if (!parent) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("parentNotFound"));
    }
    return parent.id;
  }

  export async function getParentInvoiceHistory(
    actorUserId: string,
    parentId: string | null,
    userId: string | null | undefined,
    pagination: PaginationArgs | null = null,
    locale?: string
  ): Promise<InvoiceHistoryPaginatedResult> {
    await assertBillingViewPermission(actorUserId, locale);
    const resolvedParentId = await resolveParentId(parentId, userId || actorUserId, locale);

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
    await assertBillingViewPermission(actorUserId, locale);
    return BillingRepository.getAllInvoices(pagination);
  }

  export async function getAdminBillingSummary(
    actorUserId: string,
    locale?: string
  ): Promise<AdminBillingSummaryResult> {
    await assertBillingViewPermission(actorUserId, locale);
    return BillingRepository.getAdminBillingSummary();
  }

  export async function getStudentCreditStatus(actorUserId: string, locale?: string): Promise<StudentCreditRow[]> {
    await assertBillingViewPermission(actorUserId, locale);
    return BillingRepository.getStudentsWithCreditStatus();
  }

  export async function getParentBillingSummary(
    actorUserId: string,
    parentId: string | null,
    userId: string | null | undefined,
    locale?: string
  ): Promise<ParentBillingSummaryResult> {
    await assertBillingViewPermission(actorUserId, locale);
    const resolvedParentId = await resolveParentId(parentId, userId || actorUserId, locale);
    return BillingRepository.getParentBillingSummary(resolvedParentId);
  }
}
