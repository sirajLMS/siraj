import { DeleteOutlined, RefreshOutlined } from "@mui/icons-material";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { FilterChip } from "@/frontend/common/components/ui/filter";
import type {
  WhatsappGroupRow,
  WhatsappGroupsDetailLabels,
} from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";

/** Replaces a single `{date}` placeholder in a translated template. */
function withDate(template: string, date: string): string {
  return template.replaceAll("{date}", date);
}

interface GroupInfoHeaderProps {
  readonly labels: WhatsappGroupsDetailLabels;
  readonly canManage: boolean;
  readonly group: WhatsappGroupRow;
  readonly approvalModeLabel: string;
  readonly formatTimestamp: (iso: string | null) => string;
  readonly onRefresh: () => void;
  readonly onAskDelete: () => void;
}

export function GroupInfoHeader({
  labels,
  canManage,
  group,
  approvalModeLabel,
  formatTimestamp,
  onRefresh,
  onAskDelete,
}: Readonly<GroupInfoHeaderProps>) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
          {group.subject}
        </Typography>
        {group.description !== null && group.description !== "" && (
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, whiteSpace: "pre-wrap" }}>
            {group.description}
          </Typography>
        )}
        <Stack direction="row" spacing={0.75} sx={{ mt: 0.5, flexWrap: "wrap", alignItems: "center" }}>
          {group.suspended ? (
            <StatusBadge category="syncStatus" status="failed" label={labels.suspendedBadge} />
          ) : (
            <StatusBadge category="syncStatus" status="success" label={labels.activeBadge} />
          )}
          <FilterChip label={approvalModeLabel} />
          <Typography variant="caption" sx={{ color: theme => theme.palette.text.secondary }}>
            {withDate(labels.createdAtLabel, formatTimestamp(group.createdAt))}
          </Typography>
          {group.syncedAt !== null && (
            <Typography variant="caption" sx={{ color: theme => theme.palette.text.secondary }}>
              {withDate(labels.lastSyncedAtLabel, formatTimestamp(group.syncedAt))}
            </Typography>
          )}
        </Stack>
      </Box>
      <Stack direction="row" spacing={0.5}>
        <IconButton size="small" onClick={onRefresh} aria-label={labels.refresh}>
          <RefreshOutlined fontSize="small" />
        </IconButton>
        {canManage && (
          <IconButton size="small" onClick={onAskDelete} aria-label={labels.deleteGroup}>
            <DeleteOutlined fontSize="small" />
          </IconButton>
        )}
      </Stack>
    </Stack>
  );
}
