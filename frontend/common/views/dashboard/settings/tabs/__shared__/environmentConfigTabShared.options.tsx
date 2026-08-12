import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type { EnvironmentConfigTabSharedOptions } from "@/frontend/common/views/dashboard/settings/tabs/__shared__/environmentConfigTabShared";
import type { EnvironmentConfigViewModel } from "@/frontend/common/views/dashboard/settings/types/environmentConfig.types";

function renderDesktopHeaderRow(labels: EnvironmentConfigViewModel["labels"]): ReactNode {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 1,
        pb: 1,
        borderBottom: theme => `1px solid ${theme.palette.outlineVariant}`,
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1.6fr)",
      }}
    >
      <Typography sx={{ typography: "labelUppercase", color: "text.secondary" }}>{labels.columns.key}</Typography>
      <Typography sx={{ typography: "labelUppercase", color: "text.secondary" }}>{labels.columns.source}</Typography>
      <Typography sx={{ typography: "labelUppercase", color: "text.secondary" }}>{labels.columns.value}</Typography>
    </Box>
  );
}

export const DESKTOP_ENV_CONFIG_OPTIONS: EnvironmentConfigTabSharedOptions = {
  accordionDetailsSx: { px: 2, pb: 2 },
  renderHeaderRow: renderDesktopHeaderRow,
};

export const MOBILE_ENV_CONFIG_OPTIONS: EnvironmentConfigTabSharedOptions = {
  accordionDetailsSx: { px: 1, pb: 2 },
  entryLayout: "stacked",
};
