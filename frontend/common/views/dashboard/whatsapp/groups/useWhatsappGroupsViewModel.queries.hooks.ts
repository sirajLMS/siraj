"use client";

import { useQuery } from "@apollo/client/react";
import {
  whatsappAccountsQueryDocument,
  whatsappGroupJoinRequestsQueryDocument,
  whatsappGroupMessagesQueryDocument,
  whatsappGroupQueryDocument,
  whatsappGroupsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import {
  MESSAGES_PAGE_SIZE,
  PAGE_SIZE,
} from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.constants";
import { buildPaginationArgs } from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.helpers";

/**
 * Workspace queries: the paginated groups list refreshes with the network
 * (cache-and-network) so syncs land immediately; the single group, its
 * message thread, and its pending join requests skip until a group opens.
 */
export function useWorkspaceQueries(accountId: string | null, page: number, selectedGroupId: string | null) {
  const accountsQuery = useQuery(whatsappAccountsQueryDocument);
  const groupsQuery = useQuery(whatsappGroupsQueryDocument, {
    variables: { accountId, search: null, pagination: buildPaginationArgs(page, PAGE_SIZE) },
    fetchPolicy: "cache-and-network",
  });
  const groupQuery = useQuery(whatsappGroupQueryDocument, {
    variables: { groupId: selectedGroupId ?? "" },
    skip: selectedGroupId === null,
    fetchPolicy: "cache-and-network",
  });
  const messagesQuery = useQuery(whatsappGroupMessagesQueryDocument, {
    variables: { groupId: selectedGroupId ?? "", pagination: buildPaginationArgs(0, MESSAGES_PAGE_SIZE) },
    skip: selectedGroupId === null,
    fetchPolicy: "cache-and-network",
  });
  const joinRequestsQuery = useQuery(whatsappGroupJoinRequestsQueryDocument, {
    variables: { groupId: selectedGroupId ?? "" },
    skip: selectedGroupId === null,
    fetchPolicy: "cache-and-network",
  });
  return { accountsQuery, groupsQuery, groupQuery, messagesQuery, joinRequestsQuery };
}

export type WorkspaceQueries = ReturnType<typeof useWorkspaceQueries>;
