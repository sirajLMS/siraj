"use client";

import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import { Box, Stack, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";

interface ExpensesEmptyStateProps {
  readonly heading: string;
  readonly hint: string;
}

/**
 * Zero-row panel rendered by the grid's no-rows slot: a muted receipt glyph
 * over the empty-state copy. Widths are symmetric and direction-free so the
 * panel reads identically in RTL.
 */
export function ExpensesEmptyState({ heading, hint }: Readonly<ExpensesEmptyStateProps>) {
  return (
    <Stack
      sx={{
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        px: 2,
        py: 6,
        textAlign: "center",
      }}
    >
      <Box
        sx={(theme: Theme) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 56,
          height: 56,
          borderRadius: "50%",
          mb: 0.5,
          backgroundColor: theme.palette.action.hover,
          color: theme.palette.text.secondary,
        })}
      >
        <ReceiptLongOutlined fontSize="large" />
      </Box>
      <Typography variant="titleLg">{heading}</Typography>
      <Typography variant="bodyMd" sx={(theme: Theme) => ({ color: theme.palette.text.secondary, maxWidth: 360 })}>
        {hint}
      </Typography>
    </Stack>
  );
}
