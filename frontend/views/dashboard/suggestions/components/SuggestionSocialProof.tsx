"use client";

import { useQuery } from "@apollo/client/react";
import { Box, Typography } from "@mui/material";
import { UserAvatar } from "@/frontend/components/ui";
import { suggestionContributorStatsQueryDocument } from "@/frontend/graphql/sharedDocuments/suggestion.documents";
import type { SuggestionSocialProofProps } from "../types/suggestionsView.types";

const CONTRIBUTOR_AVATAR_LIMIT = 3;
const CONTRIBUTOR_STATS_DAYS = 30;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function SuggestionSocialProof({ labels }: Readonly<SuggestionSocialProofProps>) {
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
          <UserAvatar
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
          </UserAvatar>
        ))}
        {remainingCount > 0 && (
          <UserAvatar
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
          </UserAvatar>
        )}
      </Box>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, fontStyle: "italic" })}>
        {labels.socialProof}
      </Typography>
    </Box>
  );
}
