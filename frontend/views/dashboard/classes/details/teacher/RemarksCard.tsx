"use client";

import { Box, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/components/ui";

interface RemarksCardProps {
  readonly remarks: string;
  readonly labels: {
    readonly remarksTitle: string;
  };
}

export function RemarksCard({ remarks, labels }: RemarksCardProps) {
  return (
    <BaseCard>
      <Typography
        variant="caption"
        sx={theme => ({
          color: theme.palette.header,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          display: "block",
          mb: 1.5,
        })}
      >
        {labels.remarksTitle}
      </Typography>
      <Box
        sx={theme => ({
          bgcolor: theme.palette.background.default,
          p: 2,
          borderRadius: 1.5,
          borderLeft: 4,
          borderColor: theme.palette.header,
          fontStyle: "italic",
          color: theme.palette.text.secondary,
        })}
      >
        <Typography variant="body2">&ldquo;{remarks}&rdquo;</Typography>
      </Box>
    </BaseCard>
  );
}
