"use client";

import { ErrorOutlined as ErrorIcon } from "@mui/icons-material";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import type { useTranslations } from "next-intl";

// Loading UI shown during initial connectivity check
export function InitializingUI({
  error,
  onRetry,
  t,
}: Readonly<{
  error?: boolean;
  onRetry?: () => void;
  t: ReturnType<typeof useTranslations<"common">>;
}>) {
  return (
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
}
