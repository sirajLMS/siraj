"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { ResourceUploadGuidelinesProps } from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";

export interface ResourceUploadGuidelinesConfig {
  /** Padding for the outer container */
  readonly padding: number;
}

export function ResourceUploadGuidelinesShared({
  labels,
  config,
}: Readonly<ResourceUploadGuidelinesProps & { readonly config: ResourceUploadGuidelinesConfig }>) {
  return (
    <Box
      sx={theme => ({
        mt: 3,
        p: config.padding,
        borderRadius: theme.layout.radius.card,
        backgroundColor: theme.palette.surfaceContainerLow,
        border: `1px solid ${theme.palette.outlineVariant}`,
      })}
    >
      <Box sx={{ display: "flex", gap: 2 }}>
        <InfoOutlined sx={theme => ({ color: theme.palette.primary.main })} />
        <Box>
          <Typography variant="titleLg" sx={{ mb: 1 }}>
            {labels.guidelines.title}
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {labels.guidelines.items.map(item => (
              <li key={item}>
                <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, mb: 0.5 })}>
                  {item}
                </Typography>
              </li>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
