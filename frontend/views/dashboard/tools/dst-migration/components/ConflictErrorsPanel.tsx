"use client";

import { CancelOutlined, WarningAmberOutlined } from "@mui/icons-material";
import { alpha, Box, Chip, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { ConflictGroup } from "@/frontend/stores/dstMigrationStore";

interface Props {
  readonly conflictGroups: readonly ConflictGroup[];
}

function ConflictCard({
  className,
  message,
}: Readonly<{
  className: string;
  message: string;
}>) {
  return (
    <Box
      sx={theme => ({
        p: 2,
        borderRadius: 2,
        borderLeft: 4,
        borderColor: theme.palette.error.main,
        bgcolor: alpha(theme.palette.error.main, 0.06),
      })}
    >
      <Typography variant="bodyMd" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main, mb: 0.5 })}>
        {className}
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

export function ConflictErrorsPanel({ conflictGroups }: Readonly<Props>) {
  const t = useTranslations("dashboard.dstMigration");

  return (
    <Box
      sx={theme => ({
        bgcolor: theme.palette.surfaceContainerLowest,
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
          bgcolor: alpha(theme.palette.error.main, 0.08),
          borderBottom: `1px solid ${theme.palette.outlineVariant}`,
        })}
      >
        <Box
          sx={theme => ({
            width: 32,
            height: 32,
            borderRadius: "50%",
            bgcolor: theme.palette.error.main,
            color: theme.palette.onError,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <CancelOutlined sx={{ fontSize: 18 }} />
        </Box>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.error.main })}>
          {t("sections.errors")}
        </Typography>
      </Box>
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3, maxHeight: 500, overflowY: "auto" }}>
        {conflictGroups.map(group => (
          <Box key={group.id} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Chip
              label={t("conflicts.teacherLabel", { name: group.teacherName })}
              size="small"
              sx={theme => ({
                alignSelf: "flex-start",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                bgcolor: theme.palette.secondaryContainer,
                color: theme.palette.onSecondaryContainer,
              })}
            />
            {group.conflicts.map(conflict => (
              <ConflictCard key={conflict.id} className={conflict.className} message={conflict.message} />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
