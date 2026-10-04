"use client";

import { useMutation } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import {
  approveWhatsappGroupJoinRequestsMutationDocument,
  rejectWhatsappGroupJoinRequestsMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { PAGE_SIZE } from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.constants";
import {
  filterJoinRequestRows,
  isGroupRow,
} from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.helpers";
import {
  type NoticeState,
  useSyncListPage,
  type WorkspaceFilters,
  type WorkspaceQueries,
} from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.hooks";
import {
  type JoinRequestActionKind,
  type JoinRequestMutate,
  runJoinRequestAction,
} from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.list.sections.helpers";
import type { WhatsappGroupsLabels } from "@/shared/locale/types/whatsappGroups";

interface GroupsListSectionDeps {
  readonly queries: WorkspaceQueries;
  readonly filters: WorkspaceFilters;
  readonly setServerTotalCount: (totalCount: number) => void;
}

function useGroupsListSection({ queries, filters, setServerTotalCount }: GroupsListSectionDeps) {
  const { groupsQuery } = queries;
  const pageRows = useMemo(() => (groupsQuery.data?.whatsappGroups?.rows ?? []).filter(isGroupRow), [groupsQuery.data]);
  const groups = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    if (!needle) {
      return pageRows;
    }
    return pageRows.filter(row =>
      [row.subject, row.description, row.groupJid].some(field => (field ? field.toLowerCase().includes(needle) : false))
    );
  }, [pageRows, filters.search]);

  const totalCount = groupsQuery.data?.whatsappGroups?.totalCount ?? 0;
  const lastPage = Math.max(0, Math.ceil(totalCount / PAGE_SIZE) - 1);
  const groupsPage = Math.min(filters.page, lastPage);
  useSyncListPage(groupsQuery.data, filters.page, filters.setPage, setServerTotalCount);

  const onRetryGroups = useCallback(() => {
    void groupsQuery.refetch();
  }, [groupsQuery]);

  return {
    slice: {
      search: filters.search,
      onSearchChange: filters.onSearchChange,
      groups,
      groupsLoading: groupsQuery.loading,
      groupsError: groupsQuery.error !== undefined,
      groupsPage,
      groupsPageSize: PAGE_SIZE,
      groupsTotalCount: totalCount,
      onGroupsPageChange: filters.setPage,
      onRetryGroups,
    },
  };
}

interface JoinRequestsSectionDeps {
  readonly queries: WorkspaceQueries;
  readonly filters: WorkspaceFilters;
  readonly labels: WhatsappGroupsLabels;
  readonly showNotice: NoticeState["showNotice"];
}

interface JoinRequestActionsDeps {
  readonly queries: WorkspaceQueries;
  readonly labels: WhatsappGroupsLabels;
  readonly selectedGroupIdForActions: string;
  readonly showNotice: NoticeState["showNotice"];
}

function useJoinRequestActions({ queries, labels, selectedGroupIdForActions, showNotice }: JoinRequestActionsDeps) {
  const { groupQuery, joinRequestsQuery } = queries;
  const [joinRequestBusyId, setJoinRequestBusyId] = useState<string | null>(null);
  const [approveJoinRequests] = useMutation(approveWhatsappGroupJoinRequestsMutationDocument, { errorPolicy: "none" });
  const [rejectJoinRequests] = useMutation(rejectWhatsappGroupJoinRequestsMutationDocument, { errorPolicy: "none" });

  const runJoinRequestActionFor = useCallback(
    (kind: JoinRequestActionKind, requestId: string) => {
      if (selectedGroupIdForActions === "") {
        return;
      }
      const mutate: JoinRequestMutate =
        kind === "approve"
          ? input => approveJoinRequests({ variables: { input } })
          : input => rejectJoinRequests({ variables: { input } });
      runJoinRequestAction(
        {
          groupId: selectedGroupIdForActions,
          labels,
          showNotice,
          refetches: [() => joinRequestsQuery.refetch(), () => groupQuery.refetch()],
          mutate,
          setBusy: setJoinRequestBusyId,
        },
        kind,
        requestId
      );
    },
    [
      selectedGroupIdForActions,
      approveJoinRequests,
      rejectJoinRequests,
      joinRequestsQuery,
      groupQuery,
      labels,
      showNotice,
    ]
  );

  const onApproveJoinRequest = useCallback(
    (requestId: string) => runJoinRequestActionFor("approve", requestId),
    [runJoinRequestActionFor]
  );
  const onRejectJoinRequest = useCallback(
    (requestId: string) => runJoinRequestActionFor("reject", requestId),
    [runJoinRequestActionFor]
  );

  return { joinRequestBusyId, onApproveJoinRequest, onRejectJoinRequest };
}

function useJoinRequestsSection({ queries, filters, labels, showNotice }: JoinRequestsSectionDeps) {
  const { joinRequestsQuery } = queries;
  const selectedGroupIdForActions = filters.selectedGroupId ?? "";
  const joinRequests = useMemo(() => filterJoinRequestRows(joinRequestsQuery.data), [joinRequestsQuery.data]);
  const { joinRequestBusyId, onApproveJoinRequest, onRejectJoinRequest } = useJoinRequestActions({
    queries,
    labels,
    selectedGroupIdForActions,
    showNotice,
  });

  return {
    slice: {
      joinRequests,
      joinRequestsLoading: joinRequestsQuery.loading,
      joinRequestsError: joinRequestsQuery.error !== undefined,
      joinRequestBusyId,
      onApproveJoinRequest,
      onRejectJoinRequest,
    },
  };
}

export { useGroupsListSection, useJoinRequestsSection };
