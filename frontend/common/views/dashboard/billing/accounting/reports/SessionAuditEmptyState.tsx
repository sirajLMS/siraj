"use client";

import { SearchOffOutlined } from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports/sessionAudit";

interface SessionAuditEmptyStateProps {
  /**
   * Empty-state copy slice. The ViewModel pre-resolves `title` against the
   * active-filter state, so the panel never blames filters for an account
   * that simply has no sessions yet.
   */
  readonly labels: SessionAuditLabels["emptyState"];
  /** Filtered zero-row states add the guidance subtext and the clear-filters affordance. */
  readonly hasActiveFilters: boolean;
  readonly onClearFilters: () => void;
}

/**
 * Zero-row panel rendered by the report grid's no-rows slot: a muted search
 * glyph, the context-resolved heading, and — only while filters are active —
 * guidance copy plus the clear-filters action. Widths are symmetric and
 * direction-free so the panel reads identically in RTL and at mobile widths.
 */
export function SessionAuditEmptyState({
  labels,
  hasActiveFilters,
  onClearFilters,
}: Readonly<SessionAuditEmptyStateProps>) {
  return (
    <Stack
      sx={{
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        px: 2,
        py: { xs: 3, sm: 4 },
        textAlign: "center",
      }}
    >
      <Box
        sx={theme => ({
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
        <SearchOffOutlined fontSize="large" />
      </Box>
      <Typography variant="titleLg">{labels.title}</Typography>
      {hasActiveFilters ? (
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, maxWidth: 360 })}>
          {labels.subtitle}
        </Typography>
      ) : null}
      {hasActiveFilters ? (
        <Button size="small" variant="outlined" onClick={onClearFilters} sx={{ mt: 1 }}>
          {labels.cta}
        </Button>
      ) : null}
    </Stack>
  );
}
