import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Link } from "@/shared/i18n";

export const StyledTopAccentBar = styled(Box)(({ theme }) => ({
  height: 4,
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  backgroundColor: theme.palette.primary.main,
}));

export const StyledViewProfileButton = styled(Link)(() => ({
  display: "block",
  width: "100%",
  textAlign: "center",
  borderRadius: 8,
  fontWeight: 700,
  letterSpacing: "0.08em",
  paddingBlock: 1.25,
  textDecoration: "none",
  typography: "labelUppercase",
  transition: "all 0.2s ease",
}));

export const viewProfileButtonSx = (theme: {
  palette: {
    outline: string;
    primary: { main: string };
    action: { hover: string };
  };
  spacing: (val: number) => string | number;
}) => ({
  border: `1px solid ${theme.palette.outline}`,
  color: theme.palette.primary.main,
  paddingBlock: theme.spacing(1.25),
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
  },
});
