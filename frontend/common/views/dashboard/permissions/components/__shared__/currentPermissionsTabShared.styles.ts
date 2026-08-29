import { Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledRevokeButtonShared = styled(Button)(({ theme }) => ({
  color: theme.palette.error.main,
  fontWeight: 600,
  typography: "labelMd",
}));

export const StyledEmptyStateContainerShared = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(8),
  textAlign: "center",
  gap: theme.spacing(2),
}));

export const StyledEmptyStateIconCircleShared = styled(Box)(({ theme }) => ({
  width: 64,
  height: 64,
  borderRadius: "50%",
  backgroundColor: theme.palette.surfaceContainerHigh ?? theme.palette.action.hover,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: `1px solid ${theme.palette.divider}`,
}));

export const StyledEmptyStateTitleShared = styled(Typography)({
  fontWeight: 600,
});

export const StyledEmptyStateDescriptionShared = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  maxWidth: 400,
}));

export const StyledAssignFirstButtonShared = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  textTransform: "none",
  fontWeight: 600,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));
