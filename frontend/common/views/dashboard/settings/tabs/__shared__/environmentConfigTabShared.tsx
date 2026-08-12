"use client";

import { ExpandMoreOutlined } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { EnvironmentConfigEntryRow } from "@/frontend/common/views/dashboard/settings/components/environment/EnvironmentConfigEntryRow";
import { SettingsTabShell } from "@/frontend/common/views/dashboard/settings/tabs/__shared__/SettingsTabShell";
import type { EnvironmentConfigViewModel } from "@/frontend/common/views/dashboard/settings/types/environmentConfig.types";

export interface EnvironmentConfigTabSharedOptions {
  readonly accordionDetailsSx: object;
  readonly entryLayout?: "grid" | "stacked";
  readonly renderHeaderRow?: (labels: EnvironmentConfigViewModel["labels"]) => ReactNode;
}

export function EnvironmentConfigTabShared({
  viewModel,
  options,
}: Readonly<{ readonly viewModel: EnvironmentConfigViewModel; readonly options: EnvironmentConfigTabSharedOptions }>) {
  const { labels, groupedEntries, loading, error } = viewModel;

  return (
    <SettingsTabShell
      loading={loading}
      error={error}
      hasItems={groupedEntries.length > 0}
      loadingLabel={labels.loading}
      errorLabel={labels.loadError}
      description={labels.description}
    >
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
          <AccordionDetails sx={options.accordionDetailsSx}>
            {options.renderHeaderRow ? options.renderHeaderRow(labels) : null}
            {group.entries.map(entry => (
              <EnvironmentConfigEntryRow
                key={entry.id ?? entry.key ?? ""}
                entry={entry}
                viewModel={viewModel}
                layout={options.entryLayout}
              />
            ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </SettingsTabShell>
  );
}
