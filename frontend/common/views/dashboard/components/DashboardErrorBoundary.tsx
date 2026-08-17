"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import { useEffect } from "react";
import { logger } from "@/frontend/common/utils/logger";
import { type NamespaceHandle, useAppTranslation } from "@/shared/locale";

export interface DashboardErrorBoundaryLabels {
  readonly errorGenericTitle: string;
  readonly errorGeneric: string;
  readonly retry: string;
}

export interface DashboardErrorBoundaryProps<TLabels extends DashboardErrorBoundaryLabels> {
  readonly error: Error;
  readonly reset: () => void;
  readonly translation: NamespaceHandle<TLabels>;
  readonly errorScope: string;
}

export function DashboardErrorBoundary<TLabels extends DashboardErrorBoundaryLabels>({
  error,
  reset,
  translation,
  errorScope,
}: Readonly<DashboardErrorBoundaryProps<TLabels>>) {
  const t = useAppTranslation(translation);

  useEffect(() => {
    logger.error(`${errorScope} error boundary:`, error);
  }, [error, errorScope]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: { xs: 2, sm: 3 },
        width: "100%",
      }}
    >
      <Stack sx={{ alignItems: "center", gap: 2, py: 4 }}>
        <Typography variant="h6" sx={{ color: theme => theme.palette.error.main }}>
          {t.errorGenericTitle}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {t.errorGeneric}
        </Typography>
        <Button variant="outlined" onClick={reset}>
          {t.retry}
        </Button>
      </Stack>
    </Box>
  );
}
