"use client";

import { CheckCircleOutlined } from "@mui/icons-material";
import { alpha, Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { StatusBadge } from "@/frontend/components/ui";
import type { UpdatedSession } from "@/frontend/views/dashboard/tools/dst-migration/dst-migration.types";
import { UpdatedSessionsCardList } from "./UpdatedSessionsCardList";
import { UpdatedSessionsDataGrid } from "./UpdatedSessionsDataGrid";

interface Props {
  readonly sessions: readonly UpdatedSession[];
  readonly successfulCount: number;
}

export function UpdatedSessionsSection({ sessions, successfulCount }: Readonly<Props>) {
  const t = useTranslations("dashboard.dstMigration");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

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
          justifyContent: "space-between",
          backgroundColor: alpha(theme.palette.success.main, 0.08),
          borderBottom: `1px solid ${theme.palette.outlineVariant}`,
        })}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={theme => ({
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: theme.palette.success.main,
              color: theme.palette.onSuccess,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <CheckCircleOutlined sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
            {t("sections.updated")}
          </Typography>
        </Box>
        <StatusBadge
          category="session"
          status="completed"
          label={t("table.sessionsCount", { count: successfulCount })}
        />
      </Box>
      <Box sx={{ p: { xs: 2, lg: 0 } }}>
        {isMobile ? (
          <UpdatedSessionsCardList sessions={sessions} successfulCount={successfulCount} />
        ) : (
          <UpdatedSessionsDataGrid sessions={sessions} />
        )}
      </Box>
    </Box>
  );
}
