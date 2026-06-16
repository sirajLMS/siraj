"use client";

import { Avatar, Box, Typography } from "@mui/material";
import type { SuggestionsParentLabels } from "@/frontend/messages/types/dashboard/suggestions/main";

interface SuggestionSocialProofProps {
  readonly labels: SuggestionsParentLabels;
}

const TEAM_AVATARS = ["AK", "SA", "JS"] as const;

export function SuggestionSocialProof({ labels }: Readonly<SuggestionSocialProofProps>) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
      <Box sx={{ display: "flex" }}>
        {TEAM_AVATARS.map(initials => (
          <Avatar
            key={initials}
            sx={theme => ({
              width: 32,
              height: 32,
              fontSize: 12,
              bgcolor: theme.palette.secondaryContainer,
              color: theme.palette.onSecondaryContainer,
              border: `2px solid ${theme.palette.background.paper}`,
              ml: -1,
            })}
          >
            {initials}
          </Avatar>
        ))}
        <Avatar
          sx={theme => ({
            width: 32,
            height: 32,
            fontSize: 10,
            bgcolor: theme.palette.surfaceContainer,
            color: theme.palette.onSurfaceVariant,
            border: `2px solid ${theme.palette.background.paper}`,
            ml: -1,
          })}
        >
          +12
        </Avatar>
      </Box>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, fontStyle: "italic" })}>
        {labels.socialProof}
      </Typography>
    </Box>
  );
}
