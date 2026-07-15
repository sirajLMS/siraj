"use client";

import { Box, Link, Typography } from "@mui/material";
import { useImpersonation } from "@/frontend/common/hooks/useImpersonation";
import { useAppTranslation } from "@/shared/locale/client";

export function ImpersonationBanner() {
  const t = useAppTranslation("auth").impersonation;
  const { isImpersonating, status, endImpersonation, loading } = useImpersonation();

  if (!isImpersonating || !status?.targetUser) {
    return null;
  }

  const targetName = status.targetUser.name ?? status.targetUser.email ?? "";

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
        backgroundColor: theme.palette.warningContainer ?? theme.palette.warning.main,
        color: theme.palette.onWarningContainer ?? theme.palette.onWarning,
        borderBottom: `1px solid ${theme.palette.divider}`,
        typography: "bodyMd",
      })}
    >
      <Typography component="span" sx={{ fontWeight: 600, textAlign: "center" }}>
        {t.bannerLoggedInAs(targetName)}
      </Typography>
      <Link
        component="button"
        type="button"
        underline="always"
        disabled={loading}
        onClick={() => void endImpersonation()}
        sx={theme => ({
          fontWeight: 700,
          color: theme.palette.onWarningContainer ?? theme.palette.onWarning,
          cursor: loading ? "wait" : "pointer",
          border: "none",
          background: "none",
          typography: "bodyMd",
        })}
      >
        {t.returnToNormalLogin}
      </Link>
    </Box>
  );
}
