"use client";

import { CancelOutlined, WarningAmberOutlined } from "@mui/icons-material";
import { alpha, Box, Stack, Typography } from "@mui/material";
import type { ConflictGroup } from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import type { DstMigrationLabels } from "@/shared/locale/types/dashboard/admin/dstMigration";

interface Props {
  readonly labels: DstMigrationLabels;
  readonly conflictGroups: readonly ConflictGroup[];
}

function ConflictCard({
  studentName,
  message,
}: Readonly<{
  studentName: string;
  message: string;
}>) {
  return (
    <Box
      sx={theme => ({
        p: 2,
        borderRadius: 2,
        borderLeft: 4,
        borderColor: theme.palette.error.main,
        backgroundColor: alpha(theme.palette.error.main, 0.06),
      })}
    >
      <Typography variant="bodyMd" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main, mb: 0.5 })}>
        {studentName}
      </Typography>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: "flex-start" }}>
        <WarningAmberOutlined sx={theme => ({ fontSize: 16, color: theme.palette.error.main, mt: 0.25 })} />
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.error.main })}>
          {message}
        </Typography>
      </Stack>
    </Box>
  );
}

export function ConflictErrorsPanelDesktop({ labels, conflictGroups }: Readonly<Props>) {
  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.surfaceContainerLowest,
        borderRadius: 3,
        border: `1px solid ${theme.palette.outlineVariant}`,
        overflow: "hidden",
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <Box
        sx={theme => ({
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          backgroundColor: alpha(theme.palette.error.main, 0.08),
          borderBottom: `1px solid ${theme.palette.outlineVariant}`,
        })}
      >
        <Box
          sx={theme => ({
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: theme.palette.error.main,
            color: theme.palette.onError,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <CancelOutlined sx={{ fontSize: 18 }} />
        </Box>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.error.main })}>
          {labels.sections.errors}
        </Typography>
      </Box>
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3, maxHeight: 500, overflowY: "auto" }}>
        {conflictGroups.map(group => (
          <Box key={group.id} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <DesktopStatusBadge
              category="session"
              status="pending"
              label={labels.conflicts.teacherLabel(group.teacherName)}
            />
            {group.conflicts.map(conflict => (
              <ConflictCard key={conflict.id} studentName={conflict.studentName} message={conflict.message} />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
