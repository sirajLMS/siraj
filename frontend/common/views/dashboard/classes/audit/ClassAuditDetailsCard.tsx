"use client";

import { AccountCircleOutlined, EventNoteOutlined, HistoryOutlined, UpdateOutlined } from "@mui/icons-material";
import { alpha, Box, Chip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";
import { BaseCard } from "@/frontend/common/components/ui";
import type { GroupClassAuditQuery_groupClassAudit as GroupClassAudit } from "@/frontend/common/graphql/generated/gql/graphql";

interface ClassAuditDetailsCardProps {
  readonly audit: NonNullable<GroupClassAudit>;
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

const StyledDetailLabel = styled(Typography)(({ theme }) => ({
  textTransform: "uppercase",
  color: theme.palette.onSurfaceVariant,
}));

const StyledHeaderBar = styled(Box)(({ theme }) => ({
  paddingInline: theme.spacing(3),
  paddingBlock: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(1.5),
}));

const StyledHeaderEventIcon = styled(EventNoteOutlined)(({ theme }) => ({
  color: theme.palette.onPrimary,
  fontSize: 28,
}));

const StyledHeaderTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.onPrimary,
}));

const StyledStatusChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.primary.main,
  typography: "labelUppercase",
  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
}));

const StyledEmphasizedFieldValue = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

const StyledTeacherIcon = styled(AccountCircleOutlined)(({ theme }) => ({
  fontSize: 20,
  color: theme.palette.primary.main,
}));

const StyledFieldValueText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurface,
}));

const StyledOriginalDateText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  textDecoration: "line-through",
  opacity: 0.6,
}));

const StyledAuditTrailSection = styled(Box)(({ theme }) => ({
  paddingInline: theme.spacing(3),
  paddingBlock: theme.spacing(3),
  backgroundColor: theme.palette.surfaceContainerLow,
  borderTop: `1px solid ${theme.palette.border.light}`,
}));

const StyledAuditTrailIcon = styled(HistoryOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

const StyledRemarkQuoteBlock = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: 2,
  borderLeft: `4px solid ${theme.palette.header}`,
  boxShadow: theme.palette.shadow.card,
}));

const StyledRemarkItalicText = styled(Typography)(({ theme }) => ({
  fontStyle: "italic",
  color: theme.palette.onSurface,
  lineHeight: 1.6,
}));

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
      <ClassAuditHeader auditName={audit.className ?? ""} statusLabel={labels.statusRescheduled} />
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
        <StyledEmphasizedFieldValue variant="bodyLg">{audit.courseCode ?? ""}</StyledEmphasizedFieldValue>
      </DetailField>
      <DetailField label={labels.teacher}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <StyledTeacherIcon />
          <StyledFieldValueText variant="bodyLg">{audit.teacherName ?? ""}</StyledFieldValueText>
        </Box>
      </DetailField>
      <DetailField label={labels.originalDate}>
        <StyledOriginalDateText variant="bodyLg">{audit.originalDate ?? ""}</StyledOriginalDateText>
      </DetailField>
      <DetailField label={labels.rescheduledDate}>
        <StyledEmphasizedFieldValue variant="bodyLg">{audit.rescheduledDate ?? ""}</StyledEmphasizedFieldValue>
      </DetailField>
      <DetailField label={labels.timeSlot}>
        <StyledFieldValueText variant="bodyLg">{audit.timeSlot ?? ""}</StyledFieldValueText>
      </DetailField>
      <DetailField label={labels.venue}>
        <StyledFieldValueText variant="bodyLg">{audit.venue ?? ""}</StyledFieldValueText>
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
        <StyledRemarkItalicText variant="bodyMd">&ldquo;{audit.auditRemark ?? ""}&rdquo;</StyledRemarkItalicText>
        <StyledRemarkMetaRow>
          <UpdateOutlined sx={{ fontSize: 14 }} />
          <Typography variant="labelMd">{audit.auditLoggedAt ?? ""}</Typography>
        </StyledRemarkMetaRow>
      </StyledRemarkQuoteBlock>
    </StyledAuditTrailSection>
  );
}
