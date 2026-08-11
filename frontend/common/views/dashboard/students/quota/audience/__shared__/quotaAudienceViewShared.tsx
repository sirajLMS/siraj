"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import type { SxProps } from "@mui/material";
import { Box, Paper, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ReactElement } from "react";
import { QuotaAudienceCard } from "@/frontend/common/views/dashboard/students/quota/audience/QuotaAudienceCard";

/** Layout style for a section with an icon. */
export type QuotaAudienceIconLayout = "leading" | "inline";

/** A single quota audience section (one Paper card inside the audience view). */
export interface QuotaAudienceSection {
  /** The label shown at the top of the section (e.g. remainingCredits, activeQuotas). */
  readonly label: string;
  /** The empty-state / no-data message rendered below the label. */
  readonly emptyStateMessage: string;
  /** Optional icon rendered alongside the label. */
  readonly icon?: SvgIconComponent;
  /** Optional color for the icon — must reference a theme palette path (e.g. "warning.main"). */
  readonly iconColor?: string;
  /** How the icon is positioned relative to the label. Defaults to "leading". */
  readonly iconLayout?: QuotaAudienceIconLayout;
  /** Whether this is the primary/highlighted section (elevation 4 instead of 0). */
  readonly highlighted?: boolean;
}

/** Slot props for the shared quota audience view scaffold. */
export interface QuotaAudienceViewSharedProps {
  /** The card title (audience-specific, e.g. t.audience.parentTitle). */
  readonly title: string;
  /** The ordered list of sections to render inside the card. */
  readonly sections: readonly QuotaAudienceSection[];
  /** Optional extra sx for the card's inner Box container. */
  readonly cardContentSx?: SxProps<Theme>;
}

export function QuotaAudienceViewShared({
  title,
  sections,
  cardContentSx,
}: Readonly<QuotaAudienceViewSharedProps>): ReactElement {
  return (
    <QuotaAudienceCard title={title}>
      <Box sx={cardContentSx}>
        {sections.map(section => (
          <QuotaAudienceSectionPaper key={section.label} section={section} />
        ))}
      </Box>
    </QuotaAudienceCard>
  );
}

function QuotaAudienceSectionPaper({ section }: Readonly<{ section: QuotaAudienceSection }>): ReactElement {
  const Icon = section.icon;
  const layout = section.iconLayout ?? "leading";

  if (Icon !== undefined && layout === "leading") {
    return (
      <Paper sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }} elevation={0} variant="outlined">
        <Icon sx={section.iconColor !== undefined ? { color: section.iconColor } : undefined} />
        <Box>
          <Typography variant="labelMd">{section.label}</Typography>
          <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
            {section.emptyStateMessage}
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (Icon !== undefined && layout === "inline") {
    return (
      <Paper sx={{ p: 3 }} elevation={0} variant="outlined">
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Icon sx={section.iconColor !== undefined ? { color: section.iconColor } : undefined} />
          <Typography variant="labelMd">{section.label}</Typography>
        </Box>
        <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
          {section.emptyStateMessage}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }} elevation={section.highlighted === true ? 4 : 0} variant="outlined">
      <Typography variant="labelMd" sx={{ mb: 1 }}>
        {section.label}
      </Typography>
      <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
        {section.emptyStateMessage}
      </Typography>
    </Paper>
  );
}
