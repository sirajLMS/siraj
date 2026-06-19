"use client";

import { MoreVert as MoreVertIcon } from "@mui/icons-material";
import { Box, IconButton, Paper, Stack, type Theme, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import type { ClassStatus, ScheduleRow } from "@/frontend/views/dashboard/types/dashboard";

interface ScheduleOverviewCardListProps {
  readonly rows: readonly ScheduleRow[];
  readonly statusLabels: Record<ClassStatus, string>;
  readonly detailsLabel: string;
  readonly emptyMessage: string;
}

const CLASS_STATUS_MAP: Record<ClassStatus, string> = {
  scheduled: "scheduled",
  in_progress: "in_progress",
  pending: "pending",
  completed: "completed",
  cancelled: "cancelled",
  absent: "absent",
};

function getLeftBorderColor(status: ClassStatus, theme: Theme): string {
  switch (status) {
    case "in_progress":
      return theme.palette.primary.main;
    case "absent":
      return theme.palette.error.main;
    case "scheduled":
    case "pending":
      return theme.palette.outlineVariant;
    default:
      return theme.palette.border.light;
  }
}

export function ScheduleOverviewCardList({
  rows,
  statusLabels,
  detailsLabel,
  emptyMessage,
}: ScheduleOverviewCardListProps) {
  const router = useRouter();
  const locale = useLocale();

  if (rows.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.5}>
      {rows.map(row => {
        const isAbsent = row.status === "absent";

        return (
          <Paper
            key={row.id}
            elevation={0}
            sx={theme => ({
              p: 2,
              borderRadius: 2,
              opacity: isAbsent ? 0.8 : 1,
              bgcolor: theme.palette.surfaceContainerLowest,
              border: `1px solid ${theme.palette.border.light}`,
              borderLeft: `4px solid ${getLeftBorderColor(row.status, theme)}`,
              boxShadow: theme.shadows[1],
            })}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Typography
                    variant="labelMd"
                    sx={theme => ({
                      color: theme.palette.text.secondary,
                      textTransform: "uppercase",
                    })}
                  >
                    ID: {row.classId.replace("#CLS-", "")}
                  </Typography>
                  <Box
                    sx={theme => ({
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      bgcolor: theme.palette.border.light,
                    })}
                  />
                  <Typography
                    variant="bodyMd"
                    sx={theme => ({
                      fontWeight: 700,
                      color: row.status === "in_progress" ? theme.palette.primary.main : theme.palette.text.secondary,
                    })}
                  >
                    {row.time}
                  </Typography>
                </Box>
                <Typography
                  variant="titleLg"
                  sx={theme => ({
                    color: theme.palette.onSurface,
                    mb: 0.25,
                  })}
                >
                  {row.student}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                <StatusBadge
                  category="classStatus"
                  status={CLASS_STATUS_MAP[row.status]}
                  label={statusLabels[row.status]}
                  size="small"
                />
                <IconButton
                  size="small"
                  onClick={() => router.push(`/${locale}/classes/${row.id}`)}
                  aria-label={detailsLabel}
                  sx={theme => ({
                    color: theme.palette.text.secondary,
                    "&:hover": {
                      bgcolor: "transparent",
                      color: theme.palette.primary.main,
                    },
                  })}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        );
      })}
    </Stack>
  );
}
