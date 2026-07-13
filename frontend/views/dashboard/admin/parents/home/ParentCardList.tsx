"use client";

import { PriorityHighOutlined as AlertIcon, SettingsOutlined as SettingsIcon } from "@mui/icons-material";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import { PaginationControls, PersonProfileLink } from "@/frontend/common/components/ui";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { BaseCard } from "@/frontend/common/components/ui/card/BaseCard";
import { profileHrefForParent } from "@/frontend/common/utils/profileHref";
import type {
  ParentAccountStatusKey,
  ParentDirectoryRow,
} from "@/frontend/views/dashboard/admin/parents/home/directory";
import type { ParentLifecycleStatus } from "@/frontend/views/dashboard/types/parent.types";

export interface ParentCardListLabels {
  readonly guardianOf: (name: string) => string;
  readonly unpaidCount: (count: number) => string;
  readonly invoicesCleared: string;
  readonly statusLabels: Record<ParentLifecycleStatus, string>;
  readonly accountStatusLabels: Record<ParentAccountStatusKey, string>;
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
          <Stack>
            <PersonProfileLink
              href={profileHrefForParent({ userId: row.userId, parentId: row.id })}
              name={row.name}
              avatarUrl={row.avatarUrl}
              avatarSize={48}
              typographyVariant="titleLg"
              fontWeight={600}
            />
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, pl: 7 })}>
              {labels.guardianOf(row.guardianOf)}
            </Typography>
          </Stack>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
          {row.userId ? <ViewAsUserButton variant="link" targetUserId={row.userId} targetUserName={row.name} /> : null}
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
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <StatusBadge
            category="studentAccount"
            status={row.lifecycleStatus}
            label={labels.statusLabels[row.lifecycleStatus]}
          />
          <StatusBadge
            category="staffAccount"
            status={row.accountStatus}
            label={labels.accountStatusLabels[row.accountStatus]}
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
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

export function ParentCardList({
  rows,
  labels,
  onOpenSettings,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Readonly<ParentCardListProps>) {
  const hasPagination =
    totalCount !== undefined && page !== undefined && pageSize !== undefined && onPageChange !== undefined;
  const pageCount = (pageSize ?? 0) > 0 ? Math.ceil((totalCount ?? 0) / (pageSize ?? 1)) : 0;

  return (
    <Stack spacing={2}>
      {rows.map(row => (
        <ParentCard key={row.id} row={row} labels={labels} onOpenSettings={onOpenSettings} />
      ))}
      {hasPagination &&
        page !== undefined &&
        pageSize !== undefined &&
        totalCount !== undefined &&
        onPageChange !== undefined && (
          <PaginationControls
            page={page}
            pageCount={pageCount}
            rowCount={totalCount}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        )}
    </Stack>
  );
}
