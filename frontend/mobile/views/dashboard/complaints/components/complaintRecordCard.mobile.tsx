"use client";

import { HourglassEmptyOutlined, VerifiedUserOutlined } from "@mui/icons-material";
import { Box, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ParentComplaintRecord } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { ComplaintStatus } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import type { ComplaintsParentLabels } from "@/shared/locale";

const StyledRecordCardPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.layout.radius.card,
  border: `1px solid ${theme.palette.outlineVariant}`,
  backgroundColor: theme.palette.surfaceContainerLowest,
  overflow: "hidden",
  transition: "border-color 0.15s ease",
  "&:hover": { borderColor: theme.palette.primary.main },
}));

const StyledRecordCardContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5),
}));

const StyledRecordCardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(2),
}));

const StyledRecordRegardingLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textTransform: "uppercase",
  marginBottom: theme.spacing(0.5),
}));

const StyledRecordSummaryText = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.primary.main,
}));

const StyledAdminResponseBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.layout.radius.card,
  backgroundColor: theme.palette.surfaceContainerLow,
  position: "relative",
}));

const StyledAdminResponseHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const StyledVerifiedIcon = styled(VerifiedUserOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: 18,
}));

const StyledAdminResponseLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

const StyledAdminResponseTime = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginLeft: "auto",
}));

const StyledAdminResponseText = styled(Typography)(({ theme }) => ({
  fontStyle: "italic",
  color: theme.palette.onSurfaceVariant,
}));

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

interface ComplaintRecordCardMobileProps {
  readonly record: ParentComplaintRecord;
  readonly labels: ComplaintsParentLabels;
  /** When true, omit outer Paper chrome (parent provides MobileCardListItem). */
  readonly bare?: boolean;
}

function mapStatusForBadge(status: ComplaintStatus): string {
  if (status === ComplaintStatus.Answered) {
    return "completed";
  }

  return "pending";
}

export function ComplaintRecordCardMobile({ record, labels, bare = false }: Readonly<ComplaintRecordCardMobileProps>) {
  const isResolved = record.status === ComplaintStatus.Answered;
  const labelKey = record.status === ComplaintStatus.Answered ? "resolved" : "pending";

  const content = (
    <>
      <StyledRecordCardHeader>
        <Box>
          <StyledRecordRegardingLabel variant="labelMd">{record.regarding}</StyledRecordRegardingLabel>
          <StyledRecordSummaryText variant="bodyLg">{record.summary}</StyledRecordSummaryText>
        </Box>
        <MobileStatusBadge
          category="classStatus"
          status={mapStatusForBadge(record.status)}
          label={labels.statusLabels[labelKey]}
        />
      </StyledRecordCardHeader>

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
    </>
  );

  if (bare) {
    return content;
  }

  return (
    <StyledRecordCardPaper elevation={0}>
      <StyledRecordCardContent>{content}</StyledRecordCardContent>
    </StyledRecordCardPaper>
  );
}
