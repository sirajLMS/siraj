"use client";

import { HourglassEmptyOutlined, VerifiedUserOutlined } from "@mui/icons-material";
import { Box, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { StatusBadge } from "@/frontend/common/components/ui";
import type { ParentComplaintRecord } from "@/frontend/views/dashboard/complaints/types/complaints.types";
import { ComplaintStatus } from "@/frontend/views/dashboard/complaints/types/complaints.types";
import type { ComplaintsParentLabels } from "@/shared/messages/types/dashboard/complaints/main";

/** Root card paper with border, hover transition, and rounded corners */
const StyledRecordCardPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.layout.radius.card,
  border: `1px solid ${theme.palette.outlineVariant}`,
  backgroundColor: theme.palette.surfaceContainerLowest,
  overflow: "hidden",
  transition: "border-color 0.15s ease",
  "&:hover": { borderColor: theme.palette.primary.main },
}));

/** Inner content padding wrapper */
const StyledRecordCardContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
}));

/** Header row with complaint info and status badge */
const StyledRecordCardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

/** Uppercase label indicating what the complaint is regarding */
const StyledRecordRegardingLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textTransform: "uppercase",
  marginBottom: theme.spacing(0.5),
}));

/** Bold summary text in primary color */
const StyledRecordSummaryText = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.primary.main,
}));

/** Admin response container with background and rounded corners */
const StyledAdminResponseBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.layout.radius.card,
  backgroundColor: theme.palette.surfaceContainerLow,
  position: "relative",
}));

/** Header row inside the admin response section */
const StyledAdminResponseHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

/** Verified user icon in the admin response section */
const StyledVerifiedIcon = styled(VerifiedUserOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: 18,
}));

/** Bold label for the admin response section title */
const StyledAdminResponseLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

/** Timestamp displayed at the end of the admin response header */
const StyledAdminResponseTime = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginLeft: "auto",
}));

/** Italic quoted text of the admin's response */
const StyledAdminResponseText = styled(Typography)(({ theme }) => ({
  fontStyle: "italic",
  color: theme.palette.onSurfaceVariant,
}));

/** Fallback box shown when the complaint is still pending */
const StyledPendingStatusBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  color: theme.palette.text.secondary,
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  borderTop: `1px dashed ${theme.palette.outlineVariant}`,
  marginTop: theme.spacing(1),
}));

interface ComplaintRecordCardProps {
  readonly record: ParentComplaintRecord;
  readonly labels: ComplaintsParentLabels;
}

function mapStatusForBadge(status: ComplaintStatus): string {
  if (status === ComplaintStatus.Answered) {
    return "completed";
  }

  return "pending";
}

export function ComplaintRecordCard({ record, labels }: Readonly<ComplaintRecordCardProps>) {
  const isResolved = record.status === ComplaintStatus.Answered;
  const labelKey = record.status === ComplaintStatus.Answered ? "resolved" : "pending";

  return (
    <StyledRecordCardPaper elevation={0}>
      <StyledRecordCardContent>
        {/* Complaint header: regarding label, summary, and status badge */}
        <StyledRecordCardHeader>
          <Box>
            <StyledRecordRegardingLabel variant="labelMd">{record.regarding}</StyledRecordRegardingLabel>
            <StyledRecordSummaryText variant="bodyLg">{record.summary}</StyledRecordSummaryText>
          </Box>
          <StatusBadge
            category="classStatus"
            status={mapStatusForBadge(record.status)}
            label={labels.statusLabels[labelKey]}
          />
        </StyledRecordCardHeader>

        {/* Admin response section (shown when resolved) or pending status */}
        {isResolved && record.adminResponse ? (
          <StyledAdminResponseBox>
            <StyledAdminResponseHeader>
              <StyledVerifiedIcon />
              <StyledAdminResponseLabel variant="labelMd">{labels.adminResponse}</StyledAdminResponseLabel>
              <StyledAdminResponseTime variant="labelMd">{record.adminResponse.answeredAt}</StyledAdminResponseTime>
            </StyledAdminResponseHeader>
            <StyledAdminResponseText variant="bodyMd">
              &ldquo;{record.adminResponse.text}&rdquo;
            </StyledAdminResponseText>
          </StyledAdminResponseBox>
        ) : (
          <StyledPendingStatusBox>
            <HourglassEmptyOutlined sx={{ fontSize: 20 }} />
            <Typography variant="labelMd">{labels.waitingMessage}</Typography>
          </StyledPendingStatusBox>
        )}
      </StyledRecordCardContent>
    </StyledRecordCardPaper>
  );
}
