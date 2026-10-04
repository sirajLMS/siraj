"use client";

import { Box, Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { resolveSourceStatus } from "@/frontend/common/views/dashboard/settings/components/environment/EnvironmentConfigEntryRow.helpers";
import type { EnvironmentConfigViewModel } from "@/frontend/common/views/dashboard/settings/types/environmentConfig.types";

interface KeyBlockProps {
  readonly configKey: string;
  readonly description: string | undefined;
  readonly editable: boolean;
  readonly labels: EnvironmentConfigViewModel["labels"];
}

export function KeyBlock({ configKey, description, editable, labels }: KeyBlockProps) {
  return (
    <Stack sx={{ gap: 0.75, minWidth: 0 }}>
      <Typography sx={theme => ({ typography: "labelUppercase", color: theme.palette.text.secondary })}>
        {labels.columns.key}
      </Typography>
      <Typography
        sx={{
          typography: "bodyMd",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
        }}
      >
        {configKey}
      </Typography>
      {description ? (
        <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
          {description}
        </Typography>
      ) : null}
      {editable ? null : (
        <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
          {labels.readOnlyHint}
        </Typography>
      )}
    </Stack>
  );
}

interface SourceBlockProps {
  readonly source: string | null | undefined;
  readonly sourceLabel: string;
  readonly hasDbOverride: boolean | null;
  readonly labels: EnvironmentConfigViewModel["labels"];
}

export function SourceBlock({ source, sourceLabel, hasDbOverride, labels }: SourceBlockProps) {
  return (
    <Stack sx={{ gap: 1, minWidth: 0 }}>
      <Typography sx={theme => ({ typography: "labelUppercase", color: theme.palette.text.secondary })}>
        {labels.columns.source}
      </Typography>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
        <StatusBadge category="syncStatus" status={resolveSourceStatus(source)} label={sourceLabel} />
        {hasDbOverride ? (
          <StatusBadge category="overrideStatus" status="active" label={labels.badges.dbOverride} />
        ) : null}
      </Stack>
    </Stack>
  );
}

interface LayoutBlockProps {
  readonly keyBlock: React.ReactNode;
  readonly sourceBlock: React.ReactNode;
  readonly valueBlock: React.ReactNode;
  readonly layout: "grid" | "stacked";
}

export function LayoutBlock({ keyBlock, sourceBlock, valueBlock, layout }: LayoutBlockProps) {
  if (layout === "stacked") {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          py: 2,
          borderBottom: theme => `1px solid ${theme.palette.outlineVariant}`,
          width: "100%",
        }}
      >
        {keyBlock}
        {sourceBlock}
        {valueBlock}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        py: 2,
        borderBottom: theme => `1px solid ${theme.palette.outlineVariant}`,
        width: "100%",
        gridTemplateColumns: {
          xs: "1fr",
          lg: "minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1.6fr)",
        },
      }}
    >
      {keyBlock}
      {sourceBlock}
      {valueBlock}
    </Box>
  );
}
