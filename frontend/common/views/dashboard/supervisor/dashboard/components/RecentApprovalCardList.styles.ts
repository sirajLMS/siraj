import { Box, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";

export const StyledCardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(1.5),
}));

export const StyledCardHeaderMain = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: theme.spacing(0.75),
  minWidth: 0,
  flex: 1,
}));

export const StyledCardActions = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  flexShrink: 0,
  padding: theme.spacing(0.25),
  borderRadius: theme.layout.radius.card,
  backgroundColor: alpha(theme.palette.onSurface, 0.04),
}));

export const StyledTimeHighlightContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 8,
  minWidth: 0,
  flex: 1,
  overflow: "hidden",
});

export const StyledTimeHighlightLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  flexShrink: 0,
  whiteSpace: "nowrap",
}));

export const StyledTimeHighlightText = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 700,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

export const StyledPeopleRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: theme.spacing(1.5),
  paddingTop: theme.spacing(1.25),
  borderTop: `1px solid ${theme.palette.border.light}`,
}));
