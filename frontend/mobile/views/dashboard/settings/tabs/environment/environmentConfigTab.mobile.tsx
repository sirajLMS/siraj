"use client";

import { ExpandMoreOutlined } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, CircularProgress, Typography } from "@mui/material";
import { EnvironmentConfigEntryRow } from "@/frontend/common/views/dashboard/settings/components/environment/EnvironmentConfigEntryRow";
import type { EnvironmentConfigViewModel } from "@/frontend/common/views/dashboard/settings/types/environmentConfig.types";

export function EnvironmentConfigTabMobileView(viewModel: Readonly<EnvironmentConfigViewModel>) {
  const { labels, groupedEntries, loading, error } = viewModel;

  if (loading && groupedEntries.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
        <Typography sx={{ typography: "bodyMd", color: "text.secondary", ml: 2 }}>{labels.loading}</Typography>
      </Box>
    );
  }

  if (error && groupedEntries.length === 0 && !loading) {
    return (
      <Alert severity="error" sx={{ mt: 1 }}>
        {labels.loadError}
      </Alert>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography sx={{ typography: "bodyMd", color: "text.secondary" }}>{labels.description}</Typography>

      {groupedEntries.map(group => (
        <Accordion
          key={group.category}
          expanded={viewModel.isCategoryExpanded(group.category)}
          onChange={(_, expanded) => {
            viewModel.onCategoryExpandedChange(group.category, expanded);
          }}
          disableGutters
          elevation={0}
        >
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Typography sx={{ typography: "titleMd" }}>{labels.categories[group.category]}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 1, pb: 2 }}>
            {group.entries.map(entry => (
              <EnvironmentConfigEntryRow
                key={entry.id ?? entry.key ?? ""}
                entry={entry}
                viewModel={viewModel}
                layout="stacked"
              />
            ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
