"use client";

import { useQuery } from "@apollo/client/react";
import { Box, Typography } from "@mui/material";
import { suggestionContributorStatsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import type { SuggestionSocialProofProps } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";
import { DesktopUserAvatar } from "@/frontend/desktop/components/ui/avatar/DesktopUserAvatar";

const CONTRIBUTOR_AVATAR_LIMIT = 3;
const CONTRIBUTOR_STATS_DAYS = 30;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function SuggestionSocialProofDesktop({ labels }: Readonly<SuggestionSocialProofProps>) {
  const { data } = useQuery(suggestionContributorStatsQueryDocument, {
    variables: { days: CONTRIBUTOR_STATS_DAYS },
  });

  const stats = data?.suggestionContributorStats;
  const contributors = stats?.contributors ?? [];
  const displayContributors = contributors.slice(0, CONTRIBUTOR_AVATAR_LIMIT);
  const remainingCount = Math.max(0, (stats?.uniqueContributorCount ?? 0) - CONTRIBUTOR_AVATAR_LIMIT);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
      <Box sx={{ display: "flex" }}>
        {displayContributors.map(contributor => (
          <DesktopUserAvatar
            key={contributor?.id ?? ""}
            label={contributor?.name ?? ""}
            size={32}
            sx={theme => ({
              typography: "labelSm",
              backgroundColor: theme.palette.secondaryContainer,
              color: theme.palette.onSecondaryContainer,
              border: `2px solid ${theme.palette.background.paper}`,
              ml: -1,
            })}
          >
            {getInitials(contributor?.name ?? "")}
          </DesktopUserAvatar>
        ))}
        {remainingCount > 0 && (
          <DesktopUserAvatar
            size={32}
            sx={theme => ({
              typography: "labelSm",
              backgroundColor: theme.palette.surfaceContainer,
              color: theme.palette.onSurfaceVariant,
              border: `2px solid ${theme.palette.background.paper}`,
              ml: -1,
            })}
          >
            +{remainingCount}
          </DesktopUserAvatar>
        )}
      </Box>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, fontStyle: "italic" })}>
        {labels.socialProof}
      </Typography>
    </Box>
  );
}
