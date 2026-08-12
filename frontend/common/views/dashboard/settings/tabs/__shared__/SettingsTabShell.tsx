"use client";

import { Box, Typography } from "@mui/material";
import type * as React from "react";
import { ConfigTabLoadingGuard } from "@/frontend/common/views/dashboard/settings/tabs/__shared__/configTabLoadingGuardShared";

export interface SettingsTabShellProps {
  readonly loading: boolean;
  readonly error: unknown;
  readonly hasItems: boolean;
  readonly loadingLabel: string;
  readonly errorLabel: string;
  readonly description: string;
  readonly children: React.ReactNode;
}

export function SettingsTabShell({
  loading,
  error,
  hasItems,
  loadingLabel,
  errorLabel,
  description,
  children,
}: Readonly<SettingsTabShellProps>): React.ReactNode {
  return (
    <ConfigTabLoadingGuard
      loading={loading}
      error={error}
      hasItems={hasItems}
      loadingLabel={loadingLabel}
      errorLabel={errorLabel}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography sx={{ typography: "bodyMd", color: "text.secondary" }}>{description}</Typography>
        {children}
      </Box>
    </ConfigTabLoadingGuard>
  );
}
