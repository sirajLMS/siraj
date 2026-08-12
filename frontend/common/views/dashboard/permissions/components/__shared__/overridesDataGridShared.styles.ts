import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledPermissionKeyContainerShared = styled(Box)({
  display: "flex",
  flexDirection: "column",
});

export const StyledPermissionKeyTextShared = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.labelMd.fontSize,
  fontWeight: 600,
  color: theme.palette.primary.main,
}));

export const StyledPermissionDescriptionShared = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
}));

export const StyledBaselineTextShared = styled(Typography, {
  shouldForwardProp: prop => prop !== "isAllowed",
})<{ readonly isAllowed: boolean }>(({ theme, isAllowed }) => ({
  color: isAllowed ? theme.palette.success.main : theme.palette.text.secondary,
}));
