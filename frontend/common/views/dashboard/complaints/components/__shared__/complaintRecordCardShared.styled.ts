"use client";

import { VerifiedUserOutlined } from "@mui/icons-material";
import { Box, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledRecordCardPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.layout.radius.card,
  border: `1px solid ${theme.palette.outlineVariant}`,
  backgroundColor: theme.palette.surfaceContainerLowest,
  overflow: "hidden",
  transition: theme.transitions.create("border-color", { duration: 150, easing: "ease" }),
  "&:hover": { borderColor: theme.palette.primary.main },
}));

export const StyledRecordCardContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
}));

export const StyledRecordCardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

export const StyledRecordRegardingLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textTransform: "uppercase",
  marginBottom: theme.spacing(0.5),
}));

export const StyledRecordSummaryText = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.primary.main,
}));

export const StyledAdminResponseBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.layout.radius.card,
  backgroundColor: theme.palette.surfaceContainerLow,
  position: "relative",
}));

export const StyledAdminResponseHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

export const StyledVerifiedIcon = styled(VerifiedUserOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: theme.typography.titleLg.fontSize,
}));

export const StyledAdminResponseLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

export const StyledAdminResponseTime = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginLeft: "auto",
}));

export const StyledAdminResponseText = styled(Typography)(({ theme }) => ({
  fontStyle: "italic",
  color: theme.palette.onSurfaceVariant,
}));

export const StyledPendingStatusBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  color: theme.palette.text.secondary,
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  borderTop: `1px dashed ${theme.palette.outlineVariant}`,
  marginTop: theme.spacing(1),
}));
