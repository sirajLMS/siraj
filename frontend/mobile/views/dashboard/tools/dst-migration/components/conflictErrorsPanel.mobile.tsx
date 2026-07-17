"use client";

import { CancelOutlined, WarningAmberOutlined } from "@mui/icons-material";
import { alpha, Box, Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import type { ConflictGroup } from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import { useAppTranslation } from "@/shared/locale";

interface Props {
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
        p: 1.5,
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

export function ConflictErrorsPanelMobile({ conflictGroups }: Readonly<Props>) {
  const t = useAppTranslation().dashboardTranslations.dstMigration;

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
        <Typography sx={theme => ({ typography: "titleMd", color: theme.palette.error.main })}>
          {t.sections.errors}
        </Typography>
      </Box>
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {conflictGroups.map(group => (
          <Box key={group.id} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <StatusBadge category="session" status="pending" label={t.conflicts.teacherLabel(group.teacherName)} />
            {group.conflicts.map(conflict => (
              <ConflictCard key={conflict.id} studentName={conflict.studentName} message={conflict.message} />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
