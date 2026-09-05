"use client";

import { CheckCircleOutlined, CloseOutlined } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import { Translation, useAppTranslation } from "@/shared/locale";

interface SubmissionSuccessBannerProps {
  readonly message: string;
  readonly onDismiss: () => void;
}

export function SubmissionSuccessBanner({ message, onDismiss }: Readonly<SubmissionSuccessBannerProps>) {
  const t = useAppTranslation(Translation.Common);
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: theme.palette.tertiaryContainer,
        color: theme.palette.onTertiaryContainer,
        opacity: 0.95,
        border: `1px solid ${theme.palette.outlineVariant}`,
        borderRadius: theme.layout.radius.card,
        px: 3,
        py: 2,
        mb: 3,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <CheckCircleOutlined />
        <Typography variant="titleLg">{message}</Typography>
      </Box>
      <IconButton
        aria-label={t.ariaDismiss}
        onClick={onDismiss}
        sx={theme => ({
          color: "inherit",
          opacity: 0.7,
          "&:hover": { opacity: 1 },
          "&:focus-visible": {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        })}
      >
        <CloseOutlined />
      </IconButton>
    </Box>
  );
}
