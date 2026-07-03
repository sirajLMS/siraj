"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/components/ui";

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
    <BaseCard>
      <StyledRemarksTitle variant="caption" sx={theme => ({ mb: 1.5, color: theme.palette.header })}>
        {labels.remarksTitle}
      </StyledRemarksTitle>
      <StyledRemarksQuoteBlock
        sx={theme => ({
          backgroundColor: theme.palette.background.default,
          borderColor: theme.palette.header,
          color: theme.palette.text.secondary,
        })}
      >
        <Typography variant="body2">&ldquo;{remarks}&rdquo;</Typography>
      </StyledRemarksQuoteBlock>
    </BaseCard>
  );
}
