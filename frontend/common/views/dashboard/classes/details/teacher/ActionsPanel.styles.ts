import HelpOutlinedIcon from "@mui/icons-material/HelpOutlined";
import { Box, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledActionsHeader = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.header,
  paddingBlock: theme.spacing(2),
}));

export const StyledActionsTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.onHeader,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const StyledHelpContainer = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1.5),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  borderRadius: 1.5,
  alignItems: "flex-start",
}));

export const StyledHelpText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  lineHeight: 1.6,
}));

export const StyledHelpIcon = styled(HelpOutlinedIcon)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  fontSize: 20,
  marginTop: theme.spacing(0.25),
  flexShrink: 0,
}));
