import { Box, Button } from "@mui/material";
import { styled, type Theme } from "@mui/material/styles";

export const StyledScrollableFormBody = styled(Box, {
  shouldForwardProp: prop => prop !== "paddingScale",
})<{ paddingScale: number }>(({ theme, paddingScale }) => ({
  flex: 1,
  overflowY: "auto",
  padding: theme.spacing(paddingScale),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  "&::-webkit-scrollbar": { width: 4 },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.divider,
    borderRadius: 2,
  },
}));

export const StyledFormActions = styled(Box, {
  shouldForwardProp: prop => prop !== "actionsAlignItems",
})<{ actionsAlignItems: "stretch" | "flex-end" }>(({ theme, actionsAlignItems }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: actionsAlignItems,
  gap: theme.spacing(2),
}));

export const StyledSubmitRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: theme.spacing(2),
  flexWrap: "wrap",
  width: "100%",
}));

export const StyledSuccessBadge = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  px: 2,
  py: 1,
  borderRadius: 2,
  backgroundColor: theme.palette.status.activeContainer,
  color: theme.palette.status.active,
  border: 1,
  borderColor: theme.palette.status.active,
}));

export const StyledSubmitButton = styled(Button, {
  shouldForwardProp: prop => prop !== "extraSx",
})<{ extraSx: (theme: Theme) => Record<string, unknown> }>(({ theme, extraSx }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  borderRadius: theme.shape.borderRadius,
  typography: "labelUppercase",
  boxShadow: theme.palette.shadow.button,
  "&:hover": {
    backgroundColor: theme.palette.primary.main,
    filter: "brightness(1.1)",
  },
  ...extraSx(theme),
}));
