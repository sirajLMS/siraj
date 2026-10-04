"use client";

import { CheckCircleOutlined } from "@mui/icons-material";
import { Avatar, Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledQueueCardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

export const StyledSubmitterInfoBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const StyledSubmitterAvatar = styled(Avatar)(({ theme }) => ({
  width: 48,
  height: 48,
  ...theme.typography.labelMd,
}));

export const StyledSubmitterName = styled(Typography)({
  fontWeight: 700,
});

export const StyledSubmitterRole = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textTransform: "uppercase",
}));

export const StyledQueueCardStatusBox = styled(Box)(() => ({
  textAlign: "right",
}));

export const StyledReceivedTimeLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(1),
}));

export const StyledComplaintTextBox = styled(Box, {
  shouldForwardProp: prop => prop !== "isUnanswered",
})<{ isUnanswered: boolean }>(({ theme, isUnanswered }) => ({
  marginBottom: theme.spacing(isUnanswered ? 3 : 2),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.surfaceContainerLowest,
  borderRadius: theme.layout.radius.card,
  borderLeft: `4px solid ${theme.palette.primary.main}`,
}));

export const StyledAnsweredResponseBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.layout.radius.card,
  backgroundColor: theme.palette.surfaceContainerLow,
  border: `1px solid ${theme.palette.outlineVariant}`,
}));

export const StyledAnsweredResponseHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

export const StyledAnsweredIcon = styled(CheckCircleOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: theme.typography.titleLg.fontSize,
}));

export const StyledAnsweredResponseLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

export const StyledAnsweredResponseTime = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginLeft: "auto",
}));

export const StyledResponseInputLabel = styled(Typography)({
  fontWeight: 700,
  marginBottom: "0.5rem",
  textTransform: "uppercase",
});

export const StyledResponseActionsBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  display: "flex",
  flexDirection: "row",
  justifyContent: "flex-end",
  gap: theme.spacing(1.5),
}));
