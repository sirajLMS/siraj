import { GroupsOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { ClassAvatar } from "@/frontend/common/components/ui/avatar";
import { FilterChip } from "@/frontend/common/components/ui/filter";
import { ListRowButton } from "@/frontend/common/views/dashboard/whatsapp/__shared__";
import type {
  WhatsappGroupRow,
  WhatsappGroupsListLabels,
} from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";

/** Replaces a single `{variable}` placeholder in a translated template. */
function withCount(template: string, count: number): string {
  return template.replaceAll("{count}", String(count));
}

/** Replaces a single `{variable}` placeholder in a translated template. */
function withDate(template: string, date: string): string {
  return template.replaceAll("{date}", date);
}

export function GroupsListEmptyState({ labels }: Readonly<{ labels: WhatsappGroupsListLabels }>) {
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

export function GroupsListRow({
  group,
  labels,
  selected,
  onSelectGroup,
  formatTimestamp,
}: Readonly<GroupsListRowProps>) {
  const pendingBadgeText =
    group.pendingJoinRequestCount > 0 ? withCount(labels.pendingBadge, group.pendingJoinRequestCount) : null;
  return (
    <ListRowButton selected={selected} onClick={() => onSelectGroup(group.id)}>
      <ClassAvatar label={group.subject} sx={{ width: 40, height: 40, flexShrink: 0 }} />
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
            <FilterChip label={pendingBadgeText} />
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
    </ListRowButton>
  );
}
