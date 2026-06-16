"use client";

import { CheckCircleOutlined, CloseOutlined } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";

interface SubmissionSuccessBannerProps {
  readonly message: string;
  readonly onDismiss: () => void;
}

export function SubmissionSuccessBanner({ message, onDismiss }: Readonly<SubmissionSuccessBannerProps>) {
  return (
    <Box
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        bgcolor: theme.palette.tertiaryContainer,
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
      <IconButton aria-label="Dismiss" onClick={onDismiss} sx={{ color: "inherit", opacity: 0.7 }}>
        <CloseOutlined />
      </IconButton>
    </Box>
  );
}
