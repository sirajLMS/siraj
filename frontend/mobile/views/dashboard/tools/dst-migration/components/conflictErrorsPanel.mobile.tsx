"use client";

import { CancelOutlined, WarningAmberOutlined } from "@mui/icons-material";
import { alpha, Box, Stack, Typography } from "@mui/material";
import type { ConflictGroup } from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import { MobileCardList, MobileCardListItem, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import type { DstMigrationLabels } from "@/shared/locale/types/dashboard/admin/dstMigration";

interface Props {
  readonly labels: DstMigrationLabels;
  readonly conflictGroups: readonly ConflictGroup[];
}

type ConflictRow = {
  readonly id: string;
  readonly groupId: string;
  readonly teacherName: string;
  readonly studentName: string;
  readonly message: string;
  readonly isFirstInGroup: boolean;
};

function flattenConflicts(groups: readonly ConflictGroup[]): ConflictRow[] {
  return groups.flatMap(group =>
    group.conflicts.map((conflict, index) => ({
      id: conflict.id,
      groupId: group.id,
      teacherName: group.teacherName,
      studentName: conflict.studentName,
      message: conflict.message,
      isFirstInGroup: index === 0,
    }))
  );
}

export function ConflictErrorsPanelMobile({ labels, conflictGroups }: Readonly<Props>) {
  const rows = flattenConflicts(conflictGroups);

  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.surfaceContainerLowest,
        borderRadius: 3,
        border: `1px solid ${theme.palette.outlineVariant}`,
        overflow: "hidden",
      })}
    >
      <Box
        sx={theme => ({
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
          backgroundColor: alpha(theme.palette.error.main, 0.08),
          borderBottom: `1px solid ${theme.palette.outlineVariant}`,
        })}
      >
        <Box
          sx={theme => ({
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: theme.palette.error.main,
            color: theme.palette.onError,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <CancelOutlined sx={{ fontSize: 16 }} />
        </Box>
        <Typography sx={theme => ({ typography: "titleLg", color: theme.palette.error.main })}>
          {labels.sections.errors}
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        <MobileCardList
          rows={rows}
          getKey={row => row.id}
          paginationOptions={false}
          layout="edge-to-edge"
          renderItem={row => (
            <MobileCardListItem
              variant="edge-to-edge"
              accentBorder={{ color: "error", side: "inline-start" }}
              sx={theme => ({ backgroundColor: alpha(theme.palette.error.main, 0.06) })}
            >
              {row.isFirstInGroup ? (
                <Box sx={{ mb: 1 }}>
                  <MobileStatusBadge
                    category="session"
                    status="pending"
                    label={labels.conflicts.teacherLabel(row.teacherName)}
                  />
                </Box>
              ) : null}
              <Typography
                variant="bodyMd"
                sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main, mb: 0.5 })}
              >
                {row.studentName}
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "flex-start" }}>
                <WarningAmberOutlined sx={theme => ({ fontSize: 16, color: theme.palette.error.main, mt: 0.25 })} />
                <Typography variant="labelMd" sx={theme => ({ color: theme.palette.error.main })}>
                  {row.message}
                </Typography>
              </Stack>
            </MobileCardListItem>
          )}
        />
      </Box>
    </Box>
  );
}
