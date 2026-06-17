"use client";

import { ErrorOutlined as ErrorIcon } from "@mui/icons-material";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import type { useTranslations } from "next-intl";
import type React from "react";

// Loading UI shown during initial connectivity check
export const InitializingUI: React.FC<{
  error?: boolean;
  onRetry?: () => void;
  t: ReturnType<typeof useTranslations<"common">>;
}> = ({ error, onRetry, t }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      gap: 2,
    }}
  >
    {error && t ? (
      <>
        <ErrorIcon color="error" sx={{ fontSize: 48 }} />
        <Typography color="error">{t("serverConnectionLost")}</Typography>
        <Button onClick={onRetry} variant="contained">
          {t("retry")}
        </Button>
      </>
    ) : (
      <CircularProgress size={48} />
    )}
  </Box>
);
