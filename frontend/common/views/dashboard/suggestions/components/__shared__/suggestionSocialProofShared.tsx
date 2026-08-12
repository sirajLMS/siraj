"use client";

import { useQuery } from "@apollo/client/react";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { suggestionContributorStatsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import type { SuggestionSocialProofProps } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";

const CONTRIBUTOR_AVATAR_LIMIT = 3;
const CONTRIBUTOR_STATS_DAYS = 30;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface SuggestionSocialProofSharedProps extends SuggestionSocialProofProps {
  /** Gap between avatar group and label (desktop: 2, mobile: 1.5). */
  readonly gap: number;
  /**
   * Renders a single contributor avatar. Tier injects `DesktopUserAvatar` / `MobileUserAvatar`.
   */
  readonly renderAvatar: (props: {
    key?: string;
    label?: string;
    size: number;
    sx: SxProps<Theme>;
    children: ReactNode;
  }) => ReactNode;
}

export function SuggestionSocialProofShared({ labels, gap, renderAvatar }: SuggestionSocialProofSharedProps) {
  const { data } = useQuery(suggestionContributorStatsQueryDocument, {
    variables: { days: CONTRIBUTOR_STATS_DAYS },
  });

  const stats = data?.suggestionContributorStats;
  const contributors = stats?.contributors ?? [];
  const displayContributors = contributors.slice(0, CONTRIBUTOR_AVATAR_LIMIT);
  const remainingCount = Math.max(0, (stats?.uniqueContributorCount ?? 0) - CONTRIBUTOR_AVATAR_LIMIT);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap, flexWrap: "wrap" }}>
      <Box sx={{ display: "flex" }}>
        {displayContributors.map(contributor =>
          renderAvatar({
            key: contributor?.id ?? "",
            label: contributor?.name ?? "",
            size: 32,
            sx: theme => ({
              typography: "labelSm",
              backgroundColor: theme.palette.secondaryContainer,
              color: theme.palette.onSecondaryContainer,
              border: `2px solid ${theme.palette.background.paper}`,
              ml: -1,
            }),
            children: getInitials(contributor?.name ?? ""),
          })
        )}
        {remainingCount > 0 &&
          renderAvatar({
            size: 32,
            sx: theme => ({
              typography: "labelSm",
              backgroundColor: theme.palette.surfaceContainer,
              color: theme.palette.onSurfaceVariant,
              border: `2px solid ${theme.palette.background.paper}`,
              ml: -1,
            }),
            children: `+${remainingCount}`,
          })}
      </Box>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, fontStyle: "italic" })}>
        {labels.socialProof}
      </Typography>
    </Box>
  );
}
