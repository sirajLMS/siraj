"use client";

import { AccountCircleOutlined, EventNoteOutlined, HistoryOutlined, UpdateOutlined } from "@mui/icons-material";
import { alpha, Box, Chip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";
import { BaseCard } from "@/frontend/components/ui";
import type { ClassAuditData } from "@/frontend/stores/mockClassAuditStore";

interface ClassAuditDetailsCardProps {
  readonly audit: ClassAuditData;
  readonly labels: {
    readonly courseCode: string;
    readonly teacher: string;
    readonly originalDate: string;
    readonly rescheduledDate: string;
    readonly timeSlot: string;
    readonly venue: string;
    readonly auditTrailTitle: string;
    readonly statusRescheduled: string;
    readonly classDetails: string;
  };
}

interface DetailFieldProps {
  readonly label: string;
  readonly children: ReactNode;
}

// Uppercase muted label used as a detail-field caption
const StyledDetailLabel = styled(Typography)(({ theme }) => ({
  textTransform: "uppercase",
  color: theme.palette.onSurfaceVariant,
}));

// Primary-colored header strip at the top of the audit card
const StyledHeaderBar = styled(Box)(({ theme }) => ({
  paddingInline: theme.spacing(3),
  paddingBlock: theme.spacing(2),
  bgcolor: theme.palette.primary.main,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(1.5),
}));

// Event icon rendered on the primary header (onPrimary tint)
const StyledHeaderEventIcon = styled(EventNoteOutlined)(({ theme }) => ({
  color: theme.palette.onPrimary,
  fontSize: 28,
}));

// Header title text rendered on the primary background
const StyledHeaderTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.onPrimary,
}));

// Status chip displayed in the header (paper background with primary accent border)
const StyledStatusChip = styled(Chip)(({ theme }) => ({
  bgcolor: theme.palette.background.paper,
  color: theme.palette.primary.main,
  typography: "labelUppercase",
  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
}));

// Bold primary-colored body text used for emphasized field values (course code, rescheduled date)
const StyledEmphasizedFieldValue = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

// Primary-tinted icon used beside teacher name
const StyledTeacherIcon = styled(AccountCircleOutlined)(({ theme }) => ({
  fontSize: 20,
  color: theme.palette.primary.main,
}));

// Default onSurface body text for generic field values
const StyledFieldValueText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurface,
}));

// Muted line-through text used for the original (superseded) date
const StyledOriginalDateText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  textDecoration: "line-through",
  opacity: 0.6,
}));

// Low-surface section container for the audit trail (top border + surfaceContainerLow bg)
const StyledAuditTrailSection = styled(Box)(({ theme }) => ({
  paddingInline: theme.spacing(3),
  paddingBlock: theme.spacing(3),
  bgcolor: theme.palette.surfaceContainerLow,
  borderTop: `1px solid ${theme.palette.border.light}`,
}));

// Primary-colored icon paired with the audit trail section title
const StyledAuditTrailIcon = styled(HistoryOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

// Primary-colored section title text
const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

// Paper-background quote block with left accent border used for the audit remark
const StyledRemarkQuoteBlock = styled(Box)(({ theme }) => ({
  bgcolor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: 2,
  borderLeft: `4px solid ${theme.palette.header}`,
  boxShadow: theme.palette.shadow.card,
}));

// Italic body text used for the audit remark quote
const StyledRemarkItalicText = styled(Typography)(({ theme }) => ({
  fontStyle: "italic",
  color: theme.palette.onSurface,
  lineHeight: 1.6,
}));

// Muted metadata row beneath the remark (timestamp + icon)
const StyledRemarkMetaRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.75),
  marginTop: theme.spacing(1.5),
  color: theme.palette.onSurfaceVariant,
}));

function DetailField({ label, children }: DetailFieldProps) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        alignItems: "center",
      }}
    >
      <StyledDetailLabel variant="labelMd">{label} :</StyledDetailLabel>
      {children}
    </Box>
  );
}

export function ClassAuditDetailsCard({ audit, labels }: ClassAuditDetailsCardProps) {
  return (
    <BaseCard sx={{ p: 0, overflow: "hidden" }}>
      <ClassAuditHeader auditName={audit.className} statusLabel={labels.statusRescheduled} />

      <ClassAuditFields audit={audit} labels={labels} />

      <ClassAuditTrail audit={audit} labels={labels} />
    </BaseCard>
  );
}

function ClassAuditHeader({ auditName, statusLabel }: Readonly<{ auditName: string; statusLabel: string }>) {
  return (
    <StyledHeaderBar>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <StyledHeaderEventIcon />
        <StyledHeaderTitle variant="titleLg">{auditName}</StyledHeaderTitle>
      </Box>
      <StyledStatusChip label={statusLabel} size="small" />
    </StyledHeaderBar>
  );
}

function ClassAuditFields({ audit, labels }: ClassAuditDetailsCardProps) {
  return (
    <Box
      sx={{
        p: 3,
        display: { xs: "flex", md: "grid" },
        flexDirection: "column",
        gap: 3,
        gridTemplateColumns: { md: "1fr 1fr" },
      }}
    >
      <DetailField label={labels.courseCode}>
        <StyledEmphasizedFieldValue variant="bodyLg">{audit.courseCode}</StyledEmphasizedFieldValue>
      </DetailField>
      <DetailField label={labels.teacher}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <StyledTeacherIcon />
          <StyledFieldValueText variant="bodyLg">{audit.teacherName}</StyledFieldValueText>
        </Box>
      </DetailField>
      <DetailField label={labels.originalDate}>
        <StyledOriginalDateText variant="bodyLg">{audit.originalDate}</StyledOriginalDateText>
      </DetailField>
      <DetailField label={labels.rescheduledDate}>
        <StyledEmphasizedFieldValue variant="bodyLg">{audit.rescheduledDate}</StyledEmphasizedFieldValue>
      </DetailField>
      <DetailField label={labels.timeSlot}>
        <StyledFieldValueText variant="bodyLg">{audit.timeSlot}</StyledFieldValueText>
      </DetailField>
      <DetailField label={labels.venue}>
        <StyledFieldValueText variant="bodyLg">{audit.venue}</StyledFieldValueText>
      </DetailField>
    </Box>
  );
}

function ClassAuditTrail({ audit, labels }: ClassAuditDetailsCardProps) {
  return (
    <StyledAuditTrailSection>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <StyledAuditTrailIcon />
        <StyledSectionTitle variant="titleLg">{labels.auditTrailTitle}</StyledSectionTitle>
      </Box>
      <StyledRemarkQuoteBlock>
        <StyledRemarkItalicText variant="bodyMd">&ldquo;{audit.auditRemark}&rdquo;</StyledRemarkItalicText>
        <StyledRemarkMetaRow>
          <UpdateOutlined sx={{ fontSize: 14 }} />
          <Typography variant="labelMd">{audit.auditLoggedAt}</Typography>
        </StyledRemarkMetaRow>
      </StyledRemarkQuoteBlock>
    </StyledAuditTrailSection>
  );
}
