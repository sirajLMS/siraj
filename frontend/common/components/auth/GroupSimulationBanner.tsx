"use client";

import { Box, Link, Typography } from "@mui/material";

import { usePermissionGroupSimulation } from "@/frontend/common/hooks/usePermissionGroupSimulation";

import { Translation, useAppTranslation } from "@/shared/locale";

export function GroupSimulationBanner() {
  const t = useAppTranslation(Translation.Auth.GroupSimulation);

  const { isSimulatingGroup, status, endSimulation, loading } = usePermissionGroupSimulation();

  if (!isSimulatingGroup || !status?.groupName) {
    return null;
  }

  return (
    <Box
      sx={theme => ({
        position: "sticky",

        top: 0,

        zIndex: theme.zIndex.appBar + 1,

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        flexWrap: "wrap",

        gap: theme.spacing(0.5),

        px: theme.spacing(2),

        py: theme.spacing(1.25),

        backgroundColor: theme.palette.secondaryContainer,

        color: theme.palette.onSecondaryContainer,

        borderBottom: `1px solid ${theme.palette.divider}`,

        typography: "bodyMd",
      })}
    >
      <Typography component="span" sx={{ fontWeight: 600, textAlign: "center" }}>
        {t.bannerSimulatingAs(status.groupName)}
      </Typography>

      <Link
        component="button"
        type="button"
        underline="always"
        disabled={loading}
        onClick={() => void endSimulation()}
        sx={theme => ({
          fontWeight: 700,

          color: theme.palette.onSecondaryContainer,

          cursor: loading ? "wait" : "pointer",

          border: "none",

          background: "none",

          typography: "bodyMd",
        })}
      >
        {t.returnToNormalRole}
      </Link>
    </Box>
  );
}
