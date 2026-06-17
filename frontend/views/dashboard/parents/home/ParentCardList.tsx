"use client";

import { PriorityHighOutlined as AlertIcon, SettingsOutlined as SettingsIcon } from "@mui/icons-material";
import { Avatar, Box, IconButton, Stack, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/components/ui/BaseCard";
import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import type { ParentAccountStatus, ParentDirectoryRow } from "@/frontend/stores/mockParentsStore";

export interface ParentCardListLabels {
  readonly guardianOf: (name: string) => string;
  readonly unpaidCount: (count: number) => string;
  readonly invoicesCleared: string;
  readonly statusLabels: Record<ParentAccountStatus, string>;
}

interface ParentCardProps {
  readonly row: ParentDirectoryRow;
  readonly labels: ParentCardListLabels;
  readonly onOpenSettings: (id: string) => void;
}

function ParentCard({ row, labels, onOpenSettings }: Readonly<ParentCardProps>) {
  const hasUnpaid = row.unpaidInvoices > 0;

  return (
    <BaseCard
      onClick={() => {
        onOpenSettings(row.id);
      }}
      sx={{
        cursor: "pointer",
        transition: "transform 0.15s ease",
        "&:active": { transform: "scale(0.98)" },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Avatar
            src={row.avatarUrl}
            alt={row.name}
            sx={theme => ({ width: 48, height: 48, bgcolor: theme.palette.surfaceContainer })}
          />
          <Stack>
            <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
              {row.name}
            </Typography>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {labels.guardianOf(row.guardianOf)}
            </Typography>
          </Stack>
        </Box>
        <IconButton
          size="small"
          onClick={e => {
            e.stopPropagation();
            onOpenSettings(row.id);
          }}
          sx={theme => ({ color: theme.palette.onSurfaceVariant })}
        >
          <SettingsIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <StatusBadge
            category="studentAccount"
            status={row.accountStatus}
            label={labels.statusLabels[row.accountStatus]}
          />
          {hasUnpaid ? (
            <Box sx={theme => ({ display: "flex", alignItems: "center", gap: 0.5, color: theme.palette.error.main })}>
              <AlertIcon sx={{ fontSize: 16 }} />
              <Typography variant="labelMd" sx={{ fontWeight: 700 }}>
                {labels.unpaidCount(row.unpaidInvoices)}
              </Typography>
            </Box>
          ) : (
            <Typography
              variant="labelMd"
              sx={theme => ({ color: theme.palette.onSurfaceVariant, opacity: 0.6, fontStyle: "italic" })}
            >
              {labels.invoicesCleared}
            </Typography>
          )}
        </Box>
      </Box>
    </BaseCard>
  );
}

interface ParentCardListProps {
  readonly rows: readonly ParentDirectoryRow[];
  readonly labels: ParentCardListLabels;
  readonly onOpenSettings: (id: string) => void;
}

export function ParentCardList({ rows, labels, onOpenSettings }: Readonly<ParentCardListProps>) {
  return (
    <Stack spacing={2}>
      {rows.map(row => (
        <ParentCard key={row.id} row={row} labels={labels} onOpenSettings={onOpenSettings} />
      ))}
    </Stack>
  );
}
