import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

export const SuspensionChartBar = styled(Box, {
  shouldForwardProp: prop => prop !== "isHighlighted" && prop !== "hasHover",
})<{ isHighlighted: boolean; hasHover: boolean }>(({ theme, isHighlighted, hasHover }) => ({
  flex: 1,
  backgroundColor: isHighlighted ? theme.palette.error.main : theme.palette.primaryContainer,
  borderRadius: "3px 3px 0 0",
  transition: theme.transitions.create("height", { duration: 300, easing: "ease" }),
  ...(hasHover ? { "&:hover": { opacity: 0.85 } } : {}),
}));

export const SuspensionDayLabel = styled(Box, {
  shouldForwardProp: prop => prop !== "isHighlighted",
})<{ isHighlighted: boolean; fontFamily: string }>(({ theme, isHighlighted, fontFamily }) => ({
  flex: 1,
  textAlign: "center",
  fontSize: theme.typography.labelUppercase.fontSize,
  fontFamily: fontFamily || theme.typography.fontFamily,
  fontWeight: isHighlighted ? 700 : 400,
  color: isHighlighted ? theme.palette.error.main : theme.palette.text.secondary,
}));
