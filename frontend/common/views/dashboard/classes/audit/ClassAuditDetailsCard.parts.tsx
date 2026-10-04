"use client";

import { UpdateOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { StatusBadge } from "@/frontend/common/components/ui";
import {
  StyledAuditTrailIcon,
  StyledAuditTrailSection,
  StyledDetailLabel,
  StyledEmphasizedFieldValue,
  StyledFieldValueText,
  StyledHeaderBar,
  StyledHeaderEventIcon,
  StyledHeaderTitle,
  StyledNoEventsText,
  StyledOriginalDateText,
  StyledRemarkItalicText,
  StyledRemarkMetaRow,
  StyledRemarkQuoteBlock,
  StyledSectionTitle,
  StyledTeacherIcon,
} from "@/frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard.styled";
import type { ClassAuditDetailsSectionProps } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard.types";
import { formatAuditTimestamp } from "@/frontend/common/views/dashboard/classes/audit/utils";
import { useAppLocale } from "@/shared/locale/localeContext";

interface DetailFieldProps {
  readonly label: string;
  readonly children: ReactNode;
}

export function DetailField({ label, children }: DetailFieldProps) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        alignItems: "center",
      }}
    >
      <StyledDetailLabel variant="labelMd">{label}:</StyledDetailLabel>
      {children}
    </Box>
  );
}

export function ClassAuditHeader({ auditName, statusLabel }: Readonly<{ auditName: string; statusLabel: string }>) {
  return (
    <StyledHeaderBar>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <StyledHeaderEventIcon />
        <StyledHeaderTitle variant="titleLg">{auditName}</StyledHeaderTitle>
      </Box>
      <StatusBadge category="trackingStatus" status="rescheduled" label={statusLabel} />
    </StyledHeaderBar>
  );
}

export function ClassAuditFields({ audit, labels }: ClassAuditDetailsSectionProps) {
  const locale = useAppLocale();
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
        <StyledOriginalDateText variant="bodyLg">
          {formatAuditTimestamp(audit.originalDate, locale)}
        </StyledOriginalDateText>
      </DetailField>
      <DetailField label={labels.rescheduledDate}>
        <StyledEmphasizedFieldValue variant="bodyLg">
          {formatAuditTimestamp(audit.rescheduledDate, locale)}
        </StyledEmphasizedFieldValue>
      </DetailField>
      <DetailField label={labels.timeSlot}>
        <StyledFieldValueText variant="bodyLg" dir="ltr" sx={{ unicodeBidi: "isolate" }}>
          {audit.timeSlot ?? ""}
        </StyledFieldValueText>
      </DetailField>
      <DetailField label={labels.venue}>
        <StyledFieldValueText variant="bodyLg">{audit.venue ?? ""}</StyledFieldValueText>
      </DetailField>
    </Box>
  );
}

export function ClassAuditTrail({ audit, labels }: ClassAuditDetailsSectionProps) {
  const locale = useAppLocale();
  const hasRemark = (audit.auditRemark ?? "").trim() !== "";
  return (
    <StyledAuditTrailSection>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <StyledAuditTrailIcon />
        <StyledSectionTitle variant="titleLg">{labels.auditTrailTitle}</StyledSectionTitle>
      </Box>
      {hasRemark ? (
        <StyledRemarkQuoteBlock>
          <StyledRemarkItalicText variant="bodyMd">&ldquo;{audit.auditRemark}&rdquo;</StyledRemarkItalicText>
          <StyledRemarkMetaRow>
            <UpdateOutlined sx={{ fontSize: 14 }} />
            <Typography variant="labelMd">{formatAuditTimestamp(audit.auditLoggedAt, locale)}</Typography>
          </StyledRemarkMetaRow>
        </StyledRemarkQuoteBlock>
      ) : (
        <StyledNoEventsText variant="bodyMd">{labels.auditTrailEmpty}</StyledNoEventsText>
      )}
    </StyledAuditTrailSection>
  );
}
