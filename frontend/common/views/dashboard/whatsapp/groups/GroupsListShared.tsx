"use client";

import { GroupsOutlined } from "@mui/icons-material";
import { Avatar, Box, Chip, Skeleton, Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { PaginationControls } from "@/frontend/common/components/ui/filter";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import type {
  WhatsappGroupRow,
  WhatsappGroupsListLabels,
} from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";

export interface GroupsListSharedProps {
  readonly labels: WhatsappGroupsListLabels;
  readonly search: string;
  readonly onSearchChange: (value: string) => void;
  readonly groups: readonly WhatsappGroupRow[];
  readonly loading: boolean;
  readonly selectedGroupId: string | null;
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
  readonly onSelectGroup: (groupId: string) => void;
  readonly formatTimestamp: (iso: string | null) => string;
}

const LIST_SKELETON_KEYS = ["groups-row-a", "groups-row-b", "groups-row-c"];

function GroupsListEmptyState({ labels }: Readonly<{ labels: WhatsappGroupsListLabels }>) {
  return (
    <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center", px: 2, py: 6 }}>
      <GroupsOutlined sx={{ fontSize: 40, color: theme => theme.palette.text.secondary }} />
      <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
        {labels.emptyState}
      </Typography>
    </Stack>
  );
}

interface GroupsListRowProps {
  readonly group: WhatsappGroupRow;
  readonly labels: WhatsappGroupsListLabels;
  readonly selected: boolean;
  readonly onSelectGroup: (groupId: string) => void;
  readonly formatTimestamp: (iso: string | null) => string;
}

function GroupsListRow({ group, labels, selected, onSelectGroup, formatTimestamp }: Readonly<GroupsListRowProps>) {
  const pendingBadgeText =
    group.pendingJoinRequestCount > 0 ? withCount(labels.pendingBadge, group.pendingJoinRequestCount) : null;
  return (
    <Box
      component="button"
      type="button"
      onClick={() => onSelectGroup(group.id)}
      aria-pressed={selected}
      sx={theme => ({
        all: "unset",
        display: "flex",
        gap: 1.5,
        width: "100%",
        boxSizing: "border-box",
        px: 2,
        py: 1.5,
        cursor: "pointer",
        alignItems: "center",
        backgroundColor: selected ? theme.palette.action.selected : "transparent",
        borderRadius: 1,
        "&:hover": { backgroundColor: theme.palette.action.hover },
        "&:focus-visible": { backgroundColor: theme.palette.action.hover },
      })}
    >
      <Avatar sx={{ width: 40, height: 40, flexShrink: 0 }}>{group.subject.slice(0, 2) || "?"}</Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="titleLg"
          sx={{
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textAlign: "start",
          }}
        >
          {group.subject}
        </Typography>
        {pendingBadgeText !== null && (
          <Stack direction="row" spacing={0.75} sx={{ mt: 0.5, flexWrap: "wrap" }}>
            <Chip size="small" variant="outlined" color="warning" label={pendingBadgeText} />
          </Stack>
        )}
      </Box>
      <Stack spacing={0.5} sx={{ alignItems: "flex-end", flexShrink: 0 }}>
        {group.suspended ? (
          <StatusBadge category="syncStatus" status="failed" label={labels.suspendedBadge} />
        ) : (
          <StatusBadge category="syncStatus" status="success" label={labels.activeBadge} />
        )}
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, whiteSpace: "nowrap" }}>
          {withDate(labels.createdAtLabel, formatTimestamp(group.creationTimestamp))}
        </Typography>
      </Stack>
    </Box>
  );
}

/** Replaces a single `{variable}` placeholder in a translated template. */
function withCount(template: string, count: number): string {
  return template.replaceAll("{count}", String(count));
}

/** Replaces a single `{variable}` placeholder in a translated template. */
function withDate(template: string, date: string): string {
  return template.replaceAll("{date}", date);
}
/**
 * Shared groups list panel for the `/whatsapp` groups workspace: search
 * toolbar, bordered row list with the subject, pending-join-request badge and
 * sync state, and server-driven pagination. Used verbatim by both tiers —
 * there are no viewport-specific code paths inside.
 */
export function GroupsListShared({
  labels,
  search,
  onSearchChange,
  groups,
  loading,
  selectedGroupId,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onSelectGroup,
  formatTimestamp,
}: Readonly<GroupsListSharedProps>) {
  const showSkeleton = loading && groups.length === 0;
  const showEmpty = !loading && groups.length === 0;
  return (
    <Stack sx={{ borderRadius: 2, overflow: "hidden", border: theme => `1px solid ${theme.palette.outlineVariant}` }}>
      <Stack spacing={2} sx={{ p: 2 }}>
        <SearchBarField value={search} placeholder={labels.searchPlaceholder} onChange={onSearchChange} />
      </Stack>
      {showSkeleton && (
        <Stack spacing={1} sx={{ px: 2, pb: 2 }} aria-busy>
          {LIST_SKELETON_KEYS.map(key => (
            <Skeleton key={key} variant="rounded" height={64} />
          ))}
        </Stack>
      )}
      {showEmpty && <GroupsListEmptyState labels={labels} />}
      {!showSkeleton && !showEmpty && (
        <Stack aria-label={labels.listTitle}>
          {groups.map(group => (
            <GroupsListRow
              key={group.id}
              group={group}
              labels={labels}
              selected={group.id === selectedGroupId}
              onSelectGroup={onSelectGroup}
              formatTimestamp={formatTimestamp}
            />
          ))}
        </Stack>
      )}
      <PaginationControls
        page={page}
        pageCount={Math.max(1, Math.ceil(totalCount / pageSize))}
        rowCount={totalCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </Stack>
  );
}
