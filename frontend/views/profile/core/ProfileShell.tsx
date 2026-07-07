"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { PageContainer } from "@/frontend/components/ui/PageContainer";
import { PageHeader } from "@/frontend/components/ui/PageHeader";

export type ProfileShellProps = {
  readonly title: string;
  readonly subtitle?: string;
  readonly loading?: boolean;
  readonly error?: string | null;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
};

export function ProfileShell({ title, subtitle, loading, error, actions, children }: ProfileShellProps) {
  return (
    <PageContainer>
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : null}
      {error ? <Typography sx={{ color: theme => theme.palette.error.main, py: 4 }}>{error}</Typography> : null}
      {!loading && !error ? children : null}
    </PageContainer>
  );
}
