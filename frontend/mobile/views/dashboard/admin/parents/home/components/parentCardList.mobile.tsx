"use client";

import { SettingsOutlined as SettingsIcon } from "@mui/icons-material";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { profileHrefForParent } from "@/frontend/common/utils/profileHref";
import type {
  ParentCardListLabels,
  ParentDirectoryRow,
} from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";
import { MobileCardListItem, MobilePersonProfileLink, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { MobileCardList } from "@/frontend/mobile/components/ui/container/MobileCardList";

export type { ParentCardListLabels };

interface ParentCardProps {
  readonly row: ParentDirectoryRow;
  readonly labels: ParentCardListLabels;
  readonly onOpenSettings: (id: string) => void;
}

function ParentCard({ row, labels, onOpenSettings }: Readonly<ParentCardProps>) {
  const hasUnpaid = row.unpaidInvoices > 0;

  return (
    <Box
      onClick={() => {
        onOpenSettings(row.id);
      }}
      sx={{ cursor: "pointer" }}
    >
      <MobileCardListItem variant="edge-to-edge" interactive>
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
              <Typography
                variant="bodyMd"
                sx={theme => ({ color: theme.palette.onSurfaceVariant, marginInlineStart: theme.spacing(7) })}
              >
                {labels.guardianOf(row.guardianOf)}
              </Typography>
            </Stack>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5, flexShrink: 0 }}>
            {row.userId ? (
              <ViewAsUserButton variant="link" targetUserId={row.userId} targetUserName={row.name} />
            ) : null}
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
            <MobileStatusBadge
              category="invoice"
              status={hasUnpaid ? "OVERDUE" : "PAID"}
              label={hasUnpaid ? labels.unpaidCount(row.unpaidInvoices) : labels.invoicesCleared}
            />
          </Box>
        </Box>
      </MobileCardListItem>
    </Box>
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
    <MobileCardList
      rows={rows}
      getKey={row => row.id}
      paginationOptions={paginationOptions}
      layout="edge-to-edge"
      renderItem={row => <ParentCard row={row} labels={labels} onOpenSettings={onOpenSettings} />}
    />
  );
}
