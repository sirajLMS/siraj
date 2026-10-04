"use client";

import { Skeleton, Stack } from "@mui/material";
import type { ReactNode } from "react";
import type { ServerListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import {
  GroupsListEmptyState,
  GroupsListRow,
} from "@/frontend/common/views/dashboard/whatsapp/groups/GroupsListShared.parts";
import type {
  WhatsappGroupRow,
  WhatsappGroupsListLabels,
} from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";

export interface GroupsListShellArgs {
  readonly toolbar: ReactNode;
  readonly skeleton: ReactNode | null;
  readonly empty: ReactNode | null;
  readonly rows: readonly WhatsappGroupRow[];
  readonly renderRow: (row: WhatsappGroupRow) => ReactNode;
  readonly paginationOptions: ServerListPaginationOptions;
  readonly rowsAriaLabel: string;
}

export type GroupsListShell = (args: GroupsListShellArgs) => ReactNode;

export interface GroupsListSharedProps {
  readonly labels: WhatsappGroupsListLabels;
  readonly search: string;
  readonly onSearchChange: (value: string) => void;
  readonly groups: readonly WhatsappGroupRow[];
  readonly loading: boolean;
  readonly selectedGroupId: string | null;
  readonly paginationOptions: ServerListPaginationOptions;
  readonly listShell: GroupsListShell;
  readonly onSelectGroup: (groupId: string) => void;
  readonly formatTimestamp: (iso: string | null) => string;
}

const LIST_SKELETON_KEYS = ["groups-row-a", "groups-row-b", "groups-row-c"];

/**
 * Shared groups list scaffold for the `/whatsapp` groups workspace: search
 * toolbar, row list with the subject, pending-join-request chip and sync
 * state, and server-driven pagination options. The outer list chrome is
 * tier-owned — the tier supplies a `listShell` slot that receives the
 * toolbar, skeleton/empty branches, rendered rows and pagination options.
 */
export function GroupsListShared({
  labels,
  search,
  onSearchChange,
  groups,
  loading,
  selectedGroupId,
  paginationOptions,
  listShell,
  onSelectGroup,
  formatTimestamp,
}: Readonly<GroupsListSharedProps>) {
  const showSkeleton = loading && groups.length === 0;
  const showEmpty = !loading && groups.length === 0;
  return listShell({
    toolbar: (
      <Stack spacing={2} sx={{ p: 2 }}>
        <SearchBarField value={search} placeholder={labels.searchPlaceholder} onChange={onSearchChange} />
      </Stack>
    ),
    skeleton: showSkeleton ? (
      <Stack spacing={1} sx={{ px: 2, pb: 2 }} aria-busy>
        {LIST_SKELETON_KEYS.map(key => (
          <Skeleton key={key} variant="rounded" height={64} />
        ))}
      </Stack>
    ) : null,
    empty: showEmpty ? <GroupsListEmptyState labels={labels} /> : null,
    rows: groups,
    renderRow: row => (
      <GroupsListRow
        key={row.id}
        group={row}
        labels={labels}
        selected={row.id === selectedGroupId}
        onSelectGroup={onSelectGroup}
        formatTimestamp={formatTimestamp}
      />
    ),
    paginationOptions,
    rowsAriaLabel: labels.listTitle,
  });
}
