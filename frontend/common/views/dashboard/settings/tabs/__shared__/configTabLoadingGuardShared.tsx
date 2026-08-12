"use client";

import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import type { ReactNode } from "react";

export interface ConfigTabLoadingGuardProps {
  readonly loading: boolean;
  readonly error: unknown;
  readonly hasItems: boolean;
  readonly loadingLabel: string;
  readonly errorLabel: string;
  readonly children: ReactNode;
}

export function ConfigTabLoadingGuard({
  loading,
  error,
  hasItems,
  loadingLabel,
  errorLabel,
  children,
}: Readonly<ConfigTabLoadingGuardProps>): ReactNode {
  if (loading && !hasItems) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
        <Typography sx={{ typography: "bodyMd", color: "text.secondary", ml: 2 }}>{loadingLabel}</Typography>
      </Box>
    );
  }

  if (error && !hasItems && !loading) {
    return (
      <Alert severity="error" sx={{ mt: 1 }}>
        {errorLabel}
      </Alert>
    );
  }

  return <>{children}</>;
}
