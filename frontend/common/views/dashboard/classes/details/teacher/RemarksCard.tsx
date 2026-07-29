"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/common/components/ui";

interface RemarksCardProps {
  readonly remarks: string;
  readonly labels: {
    readonly remarksTitle: string;
  };
}

const StyledRemarksTitle = styled(Typography)(() => ({
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  display: "block",
}));

const StyledRemarksQuoteBlock = styled(Box)(() => ({
  padding: 2,
  borderRadius: 1.5,
  borderLeft: 4,
  fontStyle: "italic",
}));

export function RemarksCard({ remarks, labels }: RemarksCardProps) {
  return (
    <BaseCard edgeToEdge>
      <StyledRemarksTitle variant="caption" sx={theme => ({ mb: 1.5, color: theme.palette.onSurfaceVariant })}>
        {labels.remarksTitle}
      </StyledRemarksTitle>
      <StyledRemarksQuoteBlock
        sx={theme => ({
          backgroundColor: theme.palette.surfaceContainerLow,
          borderColor: theme.palette.outlineVariant,
          borderLeftColor: theme.palette.primary.main,
          color: theme.palette.onSurface,
        })}
      >
        <Typography variant="body2" sx={theme => ({ color: theme.palette.onSurface })}>
          &ldquo;{remarks}&rdquo;
        </Typography>
      </StyledRemarksQuoteBlock>
    </BaseCard>
  );
}
