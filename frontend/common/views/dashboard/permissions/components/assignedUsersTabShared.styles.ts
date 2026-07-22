import { Box, Button } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledTabContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

export const StyledBulkActionBar = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  backgroundColor: theme.palette.errorContainer ?? theme.palette.error.main,
  color: theme.palette.onErrorContainer ?? theme.palette.error.main,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
  justifyContent: "space-between",
  alignItems: "stretch",
  boxShadow: theme.palette.shadow.card,
}));

export const StyledRemoveSelectedButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  fontWeight: 700,
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  width: "100%",
}));

export const StyledRemoveButton = styled(Button)(() => ({
  fontWeight: 600,
  typography: "labelMd",
}));

const Toolbar = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: Number(theme.shape.borderRadius) * 2,
  backgroundColor: theme.palette.surfaceContainerLow ?? theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  alignItems: "stretch",
}));

export { Toolbar as StyledUserToolbar };
