"use client";

import { Box, Chip } from "@mui/material";
import type { ReactNode } from "react";

/** Collapsed multi-select preview: a few status chips, then a "+N" overflow chip. */
export function renderStatusValue<Status extends string>(
  selected: readonly string[],
  statusLabels: Record<Status, string>,
  emptyLabel: string,
  isStatus: (value: string) => boolean,
  previewLimit: number
): ReactNode {
  const statuses = selected.filter((status): status is Status => isStatus(status));
  if (statuses.length === 0) {
    return <Box sx={theme => ({ color: theme.palette.onSurfaceVariant })}>{emptyLabel}</Box>;
  }
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {statuses.slice(0, previewLimit).map(status => (
        <Chip key={status} size="small" label={statusLabels[status]} />
      ))}
      {statuses.length > previewLimit ? <Chip size="small" label={`+${statuses.length - previewLimit}`} /> : null}
    </Box>
  );
}
