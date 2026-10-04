"use client";

import { Alert, Box, CircularProgress } from "@mui/material";
import type * as React from "react";

interface DetailDrawerStateProps {
  readonly loading: boolean;
  readonly hasError: boolean;
  readonly hasData: boolean;
  readonly loadError: string;
  readonly loadingLabel: string;
  readonly children?: React.ReactNode;
}

/**
 * Shared detail-drawer state guard: a spinner while the first load is in
 * flight, an error alert on failure, silence before data arrives, and the
 * summary content once the record is loaded.
 */
export function DetailDrawerState({
  loading,
  hasError,
  hasData,
  loadError,
  loadingLabel,
  children,
}: Readonly<DetailDrawerStateProps>) {
  if (loading && !hasData) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }} aria-label={loadingLabel}>
        <CircularProgress size={32} />
      </Box>
    );
  }
  if (hasError) {
    return <Alert severity="error">{loadError}</Alert>;
  }
  if (!hasData) {
    return null;
  }
  return <>{children}</>;
}
