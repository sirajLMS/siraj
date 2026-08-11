import { SearchOutlined } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledSearchIcon = styled(SearchOutlined)(({ theme }) => ({
  fontSize: 18,
  color: theme.palette.onSurfaceVariant,
}));

export const StyledSectionTitleRow = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingInline: theme.spacing(2),
  paddingBlock: theme.spacing(1.5),
}));

export const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurface,
}));

export const StyledMobileSectionBody = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
  paddingInline: theme.spacing(2),
  paddingTop: theme.spacing(2.5),
  paddingBottom: theme.spacing(2),
}));
