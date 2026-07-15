"use client";

import { ErrorOutlined as ErrorIcon } from "@mui/icons-material";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import type { useAppTranslation } from "@/shared/locale/client";

// Loading UI shown during initial connectivity check
interface InitializingUIProps {
  readonly error?: boolean;
  readonly onRetry?: () => void;
  readonly t: ReturnType<typeof useAppTranslation<"common">>;
}

export function InitializingUI({ error, onRetry, t }: InitializingUIProps) {
  const common = t;
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
          <Typography color="error">{common.serverConnectionLost}</Typography>
          <Button onClick={onRetry} variant="contained">
            {common.retry}
          </Button>
        </>
      ) : (
        <CircularProgress size={48} />
      )}
    </Box>
  );
}
