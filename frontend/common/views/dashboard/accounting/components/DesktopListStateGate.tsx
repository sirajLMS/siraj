"use client";

import { Box, CircularProgress } from "@mui/material";
import type { ReactNode } from "react";
import { ErrorState } from "@/frontend/common/components/ui/state/ErrorState";

export interface DesktopListStateGateProps {
  readonly error: boolean;
  readonly loading: boolean;
  /** True once any row has been fetched — gates only the "first load" states. */
  readonly hasRows: boolean;
  readonly errorMessage: string;
  readonly children: ReactNode;
}

/**
 * First-load state gate for desktop DataGrid panels: renders the embedded
 * error state, a centered first-page spinner, or the grid itself — replacing
 * nested ternary chains at every accounting list view call site.
 */
export function DesktopListStateGate({
  error,
  loading,
  hasRows,
  errorMessage,
  children,
}: Readonly<DesktopListStateGateProps>) {
  if (error && !hasRows) {
    return <ErrorState message={errorMessage} embedded />;
  }
  if (loading && !hasRows) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }
  return <>{children}</>;
}
