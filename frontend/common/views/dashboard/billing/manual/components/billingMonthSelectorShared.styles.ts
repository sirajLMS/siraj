import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledSectionLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  textTransform: "uppercase",
}));
