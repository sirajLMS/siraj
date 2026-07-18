// NEW FOR PLAN v5: Lifted byte-identical styled factories shared by both tier
// CommunicationLogCard modules (specs.md §0 rule 2 "shared ... live ONCE in
// frontend/common/..." + N24: diff empty → unified). These five factories were
// duplicated verbatim across communicationLogCard.{mobile,desktop}.tsx.
import { CheckCircleOutlined, RadioButtonUncheckedOutlined } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledDeliveredIcon = styled(CheckCircleOutlined)(({ theme }) => ({
  color: theme.palette.success.main,
}));

export const StyledUndeliveredIcon = styled(RadioButtonUncheckedOutlined)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

export const StyledEntryDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

export const StyledEntryTimestamp = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

export const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));
