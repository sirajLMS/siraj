"use client";

import { useState } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { WhatsappGroupsViewModel } from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";
import {
  useCreateGroupSection,
  useSyncSection,
} from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.create.sections.hooks";
import { useGroupDetailSection } from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.detail.sections.hooks";
import { resolveListQueryPage } from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.helpers";
import {
  useAccounts,
  useFormatTimestamp,
  useNoticeState,
  useWorkspaceFilters,
  useWorkspaceQueries,
} from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.hooks";
import {
  useGroupsListSection,
  useJoinRequestsSection,
} from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.list.sections.hooks";
import { useGroupMessagesSection } from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.messages.sections.hooks";
import { useRemoveParticipantSection } from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.participants.sections.hooks";
import { Translation, useAppTranslation } from "@/shared/locale";
import { useAppLocale } from "@/shared/locale/localeContext";

export { resolveMessageText } from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.helpers";

/**
 * View model for the `/whatsapp` groups workspace. Composition root: each
 * workspace area (list, detail, join requests, participants, messages,
 * create, sync) owns its queries, mutations and handlers in a dedicated
 * section hook; this hook wires the shared filters/notice state through and
 * flattens the section slices into the single tier-facing view model.
 */
export function useWhatsappGroupsViewModel(): WhatsappGroupsViewModel {
  const labels = useAppTranslation(Translation.WhatsappGroups);
  const commonLabels = useAppTranslation(Translation.Common);
  const locale = useAppLocale();
  const hasPermission = useUserStore(state => state.hasPermission);
  const canManage = hasPermission(AppPermission.WhatsappGroupsManage);

  const filters = useWorkspaceFilters();
  const notice = useNoticeState();
  const [serverTotalCount, setServerTotalCount] = useState<number | null>(null);
  const queries = useWorkspaceQueries(
    filters.accountId,
    resolveListQueryPage(filters.page, serverTotalCount),
    filters.selectedGroupId
  );
  const accounts = useAccounts(queries.accountsQuery, locale, filters.accountId, filters.setAccountId);
  const formatTimestamp = useFormatTimestamp(locale);

  const list = useGroupsListSection({ queries, filters, setServerTotalCount });
  const detail = useGroupDetailSection({ queries, filters, labels, canManage, showNotice: notice.showNotice });
  const joinRequests = useJoinRequestsSection({ queries, filters, labels, showNotice: notice.showNotice });
  const participants = useRemoveParticipantSection({ queries, filters, labels, showNotice: notice.showNotice });
  const messages = useGroupMessagesSection({ queries, filters, canManage, labels, showNotice: notice.showNotice });
  const create = useCreateGroupSection({ queries, filters, labels, showNotice: notice.showNotice });
  const sync = useSyncSection({ queries, filters, labels, showNotice: notice.showNotice });

  return {
    labelsBySection: {
      shell: labels,
      list: labels,
      create: labels,
      detail: labels,
      messages: labels,
    },
    commonLabels,
    canManage,
    ...accounts,
    accountId: filters.accountId,
    ...list.slice,
    ...detail.slice,
    ...joinRequests.slice,
    ...participants.slice,
    ...messages.slice,
    ...create.slice,
    ...sync.slice,
    notice: notice.notice?.text ?? null,
    noticeSeverity: notice.notice?.severity ?? "success",
    onDismissNotice: notice.dismissNotice,
    formatTimestamp,
  };
}
