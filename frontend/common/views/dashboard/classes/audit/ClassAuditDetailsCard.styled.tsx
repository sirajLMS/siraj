import { AccountCircleOutlined, EventNoteOutlined, HistoryOutlined, PaymentsOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledDetailLabel = styled(Typography)(({ theme }) => ({
  textTransform: "uppercase",
  color: theme.palette.onSurfaceVariant,
}));

export const StyledHeaderBar = styled(Box)(({ theme }) => ({
  paddingInline: theme.spacing(3),
  paddingBlock: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(1.5),
}));

export const StyledHeaderEventIcon = styled(EventNoteOutlined)(({ theme }) => ({
  color: theme.palette.onPrimary,
  fontSize: 28,
}));

export const StyledHeaderTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.onPrimary,
}));

export const StyledEmphasizedFieldValue = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

export const StyledTeacherIcon = styled(AccountCircleOutlined)(({ theme }) => ({
  fontSize: 20,
  color: theme.palette.primary.main,
}));

export const StyledFieldValueText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurface,
}));

export const StyledOriginalDateText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  textDecoration: "line-through",
  opacity: 0.6,
}));

export const StyledAuditTrailSection = styled(Box)(({ theme }) => ({
  paddingInline: theme.spacing(3),
  paddingBlock: theme.spacing(3),
  backgroundColor: theme.palette.surfaceContainerLow,
  borderTop: `1px solid ${theme.palette.border.light}`,
}));

export const StyledAuditTrailIcon = styled(HistoryOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

export const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

export const StyledRemarkQuoteBlock = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: 2,
  borderLeft: `4px solid ${theme.palette.header}`,
  boxShadow: theme.palette.shadow.card,
}));

export const StyledRemarkItalicText = styled(Typography)(({ theme }) => ({
  fontStyle: "italic",
  color: theme.palette.onSurface,
  lineHeight: 1.6,
}));

export const StyledRemarkMetaRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.75),
  marginTop: theme.spacing(1.5),
  color: theme.palette.onSurfaceVariant,
}));

export const StyledCardStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(3),
}));

export const StyledPayrollSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
}));

export const StyledPayrollHeaderRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(1.5),
}));

export const StyledPayrollTitleRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const StyledPayrollIcon = styled(PaymentsOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

export const StyledOverrideHistorySection = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  paddingTop: theme.spacing(3),
  borderTop: `1px solid ${theme.palette.border.light}`,
}));

export const StyledHistoryTitleRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

export const StyledHistoryEntry = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.25),
  paddingBlock: theme.spacing(1),
  "& + &": {
    borderTop: `1px solid ${theme.palette.border.light}`,
  },
}));

export const StyledHistoryTimestamp = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
}));

export const StyledHistoryDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurface,
}));

export const StyledNoEventsText = styled(Typography)(({ theme }) => ({
  fontStyle: "italic",
  color: theme.palette.onSurfaceVariant,
}));
