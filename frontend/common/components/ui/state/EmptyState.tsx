import { Box, type SxProps, type Theme, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

export interface EmptyStateProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly icon?: ReactNode;
  readonly sx?: SxProps<Theme>;
}

/**
 * Viewport-agnostic empty-state display: centered icon, title, and optional
 * subtitle on a padded canvas. Shared counterpart of the tier `MobileEmptyState`.
 */
export function EmptyState({ title, subtitle, icon, sx }: Readonly<EmptyStateProps>) {
  return (
    <Box
      sx={mergeSx(
        { py: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, textAlign: "center" },
        sx
      )}
    >
      {icon ? <Box sx={{ display: "flex", justifyContent: "center" }}>{icon}</Box> : null}
      <Typography variant="headlineMd">{title}</Typography>
      {subtitle ? (
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}
