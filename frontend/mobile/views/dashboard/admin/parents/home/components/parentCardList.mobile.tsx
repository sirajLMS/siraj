"use client";

import { PriorityHighOutlined as AlertIcon, SettingsOutlined as SettingsIcon } from "@mui/icons-material";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import { profileHrefForParent } from "@/frontend/common/utils/profileHref";
import type {
  ParentCardListLabels,
  ParentDirectoryRow,
} from "@/frontend/common/views/dashboard/admin/parents/home/directory";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { MobileListPagination, MobilePersonProfileLink, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card/MobileBaseCard";

export type { ParentCardListLabels };

interface ParentCardProps {
  readonly row: ParentDirectoryRow;
  readonly labels: ParentCardListLabels;
  readonly onOpenSettings: (id: string) => void;
}

function ParentCard({ row, labels, onOpenSettings }: Readonly<ParentCardProps>) {
  const hasUnpaid = row.unpaidInvoices > 0;

  return (
    <MobileBaseCard
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
            <MobilePersonProfileLink
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
          <MobileStatusBadge
            category="studentAccount"
            status={row.lifecycleStatus}
            label={labels.statusLabels[row.lifecycleStatus]}
          />
          <MobileStatusBadge
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
    </MobileBaseCard>
  );
}

// VARIANT JUSTIFICATION: Class C card-list vs data-grid sibling per specs §4.3 — `ParentCardListMobileProps` renders single-row mobile cards (taking the unified `ParentCardListLabels` shared with no desktop twin because desktop renders via `ParentsDataGridDesktop`). Layout-specific label type differs from the desktop data-grid variant, so a shared `BaseParentsListProps` row/contract already lives in `directory.ts`.
interface ParentCardListMobileProps {
  readonly rows: readonly ParentDirectoryRow[];
  readonly labels: ParentCardListLabels;
  readonly onOpenSettings: (id: string) => void;
  readonly paginationOptions: ListPaginationOptions;
}

export function ParentCardListMobile({
  rows,
  labels,
  onOpenSettings,
  paginationOptions,
}: Readonly<ParentCardListMobileProps>) {
  return (
    <Stack spacing={2}>
      {rows.map(row => (
        <ParentCard key={row.id} row={row} labels={labels} onOpenSettings={onOpenSettings} />
      ))}
      <MobileListPagination paginationOptions={paginationOptions} />
    </Stack>
  );
}
