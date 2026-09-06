import { WhatsappConversationRepository, WhatsappMessageRepository } from "@/backend/db/repo/whatsapp";
import { AppPermission } from "@/backend/enum";
import { ForbiddenError, NotFoundError } from "@/backend/lib";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { WhatsappCoexistenceSyncService } from "@/backend/services/whatsapp/whatsapp-coexistence-sync.service";
import {
  type DBTransaction,
  PaginationArgs,
  type UserPermissionContext,
  type WhatsappAccountSyncOverview,
  type WhatsappConversationMessagesInput,
  type WhatsappConversationMessagesPaginatedResult,
  type WhatsappConversationsListInput,
  type WhatsappConversationsPaginatedResult,
} from "@/backend/types";
import { PaginationUtils } from "@/backend/utils/pagination.utils";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Read surface for the WhatsApp inbox (conversations, thread messages) and the
 * per-account coexistence sync overview. Every entry point takes the caller's
 * `UserPermissionContext` (already on the GraphQL context) so permission
 * checks never re-query `PermissionsService.getUserContext(userId)`.
 */

async function assertCanViewInbox(context: UserPermissionContext, tErrors: ErrorsLabels): Promise<void> {
  const ok = await PermissionsService.hasPermission(context, AppPermission.WHATSAPP_INBOX_VIEW);
  if (!ok) {
    throw new ForbiddenError(tErrors.insufficientPermissions);
  }
}

export namespace WhatsappInboxService {
  export async function listConversations(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: WhatsappConversationsListInput,
    tx?: DBTransaction
  ): Promise<WhatsappConversationsPaginatedResult> {
    await assertCanViewInbox(context, tErrors);
    const accountId = input.accountId ?? null;
    const pagination = input.paginationArgs ? PaginationArgs.fromArgs(input.paginationArgs) : null;
    const [rows, total] = await Promise.all([
      WhatsappConversationRepository.listForInbox(accountId, pagination, tx),
      WhatsappConversationRepository.countForInbox(accountId, tx),
    ]);
    return {
      id: `whatsapp-conversations:${accountId ?? "all"}`,
      rows,
      totalCount: total,
      pageInfo: PaginationUtils.buildPageInfoFromArgs(pagination, rows.length, total),
    };
  }
  /**
   * Thread messages for one conversation. `conversationId` is client-supplied,
   * so the conversation row is loaded first and must exist (and thus belong to
   * an account of this tenant) — otherwise the read is rejected as NOT_FOUND
   * before any message rows are fetched.
   */
  export async function listConversationMessages(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: WhatsappConversationMessagesInput,
    tx?: DBTransaction
  ): Promise<WhatsappConversationMessagesPaginatedResult> {
    await assertCanViewInbox(context, tErrors);
    const conversation = await WhatsappConversationRepository.findById(input.conversationId, tx);
    if (!conversation) {
      throw new NotFoundError("WHATSAPP_CONVERSATION", tErrors.notFound);
    }
    const pagination = input.paginationArgs ? PaginationArgs.fromArgs(input.paginationArgs) : null;
    const [rows, total] = await Promise.all([
      WhatsappMessageRepository.listByConversation(conversation.id, pagination, tx),
      WhatsappMessageRepository.countByConversation(conversation.id, tx),
    ]);
    return {
      id: `whatsapp-messages:${conversation.id}`,
      rows,
      totalCount: total,
      pageInfo: PaginationUtils.buildPageInfoFromArgs(pagination, rows.length, total),
    };
  }
  /** Account-level coexistence sync overview for the Numbers/Inbox status surfaces. */
  export async function getSyncStatus(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    accountId: string,
    tx?: DBTransaction
  ): Promise<WhatsappAccountSyncOverview> {
    await assertCanViewInbox(context, tErrors);
    const overview = await WhatsappCoexistenceSyncService.getSyncStatus(accountId, tx);
    if (!overview) {
      throw new NotFoundError("WHATSAPP_ACCOUNT", tErrors.whatsappAccountNotFound(accountId));
    }
    return overview;
  }
}
