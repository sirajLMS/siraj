"use client";

import { Box } from "@mui/material";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";
import type { SystemStyleObject } from "@mui/system";

type OverrideCountPillVariant = "grant" | "revoke";

export interface OverrideCountPillSharedProps {
  readonly count: number;
  readonly variant: OverrideCountPillVariant;
  readonly label: string;
  readonly sx?: SxProps<Theme>;
}

const PILL_VARIANT_SX: Record<OverrideCountPillVariant, (theme: Theme) => SystemStyleObject<Theme>> = {
  grant: theme => ({
    backgroundColor: theme.palette.successContainer ?? alpha(theme.palette.success.main, 0.15),
    color: theme.palette.success.main,
    border: `1px solid ${theme.palette.success.light}`,
  }),
  revoke: theme => ({
    backgroundColor: theme.palette.errorContainer ?? alpha(theme.palette.error.main, 0.15),
    color: theme.palette.error.main,
    border: `1px solid ${theme.palette.error.light}`,
  }),
};

/**
 * Grant/revoke count badge for the Overrides cells, shared by both tiers.
 */
export function OverrideCountPillShared({ count, variant, label, sx }: Readonly<OverrideCountPillSharedProps>) {
  return (
    <Box
      aria-label={label}
      sx={[
        theme => ({
          fontSize: theme.typography.bodyMd.fontSize,
          fontWeight: 700,
          minWidth: 24,
          height: 24,
          borderRadius: 1,
          px: 1,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }),
        PILL_VARIANT_SX[variant],
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {count}
    </Box>
  );
}
