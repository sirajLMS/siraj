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

// Uppercase header-colored block caption used as the remarks title
const StyledRemarksTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.header,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  display: "block",
}));

// Default-background italic quote block with a header-colored left accent border
const StyledRemarksQuoteBlock = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(2),
  borderRadius: 1.5,
  borderLeft: 4,
  borderColor: theme.palette.header,
  fontStyle: "italic",
  color: theme.palette.text.secondary,
}));

export function RemarksCard({ remarks, labels }: RemarksCardProps) {
  return (
    <BaseCard>
      <StyledRemarksTitle variant="caption" sx={{ mb: 1.5 }}>
        {labels.remarksTitle}
      </StyledRemarksTitle>
      <StyledRemarksQuoteBlock>
        <Typography variant="body2">&ldquo;{remarks}&rdquo;</Typography>
      </StyledRemarksQuoteBlock>
    </BaseCard>
  );
}
