"use client";

import { HourglassEmptyOutlined, VerifiedUserOutlined } from "@mui/icons-material";
import { Box, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";
import type { StatusBadgeCategory } from "@/frontend/common/components/ui/badge/types/statusBadgeShared.types";
import {
  ComplaintStatus,
  type ParentComplaintRecord,
} from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import type { ComplaintsParentLabels } from "@/shared/locale";

type StatusBadgeComponentProps = {
  readonly category: StatusBadgeCategory;
  readonly status: string;
  readonly label: string;
};

type StatusBadgeComponent = React.FC<Readonly<StatusBadgeComponentProps>>;

interface ComplaintRecordCardSharedOptions {
  readonly contentPadding: number;
  readonly headerDirection: "row" | "column";
  readonly headerGap: number;
  readonly bare?: boolean;
}

interface ComplaintRecordCardSharedSlots {
  readonly StatusBadge: StatusBadgeComponent;
}

interface ComplaintRecordCardSharedProps {
  readonly record: ParentComplaintRecord;
  readonly labels: ComplaintsParentLabels;
  readonly options: ComplaintRecordCardSharedOptions;
  readonly slots: ComplaintRecordCardSharedSlots;
}

const StyledRecordCardPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.layout.radius.card,
  border: `1px solid ${theme.palette.outlineVariant}`,
  backgroundColor: theme.palette.surfaceContainerLowest,
  overflow: "hidden",
  transition: theme.transitions.create("border-color", { duration: 150, easing: "ease" }),
  "&:hover": { borderColor: theme.palette.primary.main },
}));

const StyledRecordCardContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const StyledRecordCardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: theme.spacing(2),
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
  fontSize: theme.typography.titleLg.fontSize,
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

function mapStatusForBadge(status: ComplaintStatus): string {
  if (status === ComplaintStatus.Answered) {
    return "completed";
  }

  return "pending";
}

const DESKTOP_OPTIONS: ComplaintRecordCardSharedOptions = {
  contentPadding: 3,
  headerDirection: "row",
  headerGap: 2,
  bare: false,
};

const MOBILE_OPTIONS: ComplaintRecordCardSharedOptions = {
  contentPadding: 2.5,
  headerDirection: "column",
  headerGap: 1.5,
  bare: false,
};

export function ComplaintRecordCardShared({
  record,
  labels,
  options,
  slots,
}: Readonly<ComplaintRecordCardSharedProps>) {
  const isResolved = record.status === ComplaintStatus.Answered;
  const labelKey = record.status === ComplaintStatus.Answered ? "resolved" : "pending";
  const { StatusBadge } = slots;

  const content: ReactNode = (
    <>
      <StyledRecordCardHeader
        sx={{
          flexDirection: options.headerDirection,
          gap: options.headerGap,
        }}
      >
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

      {isResolved && record.adminResponse ? (
        <StyledAdminResponseBox>
          <StyledAdminResponseHeader>
            <StyledVerifiedIcon />
            <StyledAdminResponseLabel variant="labelMd">{labels.adminResponse}</StyledAdminResponseLabel>
            <StyledAdminResponseTime variant="labelMd">{record.adminResponse.answeredAt}</StyledAdminResponseTime>
          </StyledAdminResponseHeader>
          <StyledAdminResponseText variant="bodyMd">&ldquo;{record.adminResponse.text}&rdquo;</StyledAdminResponseText>
        </StyledAdminResponseBox>
      ) : (
        <StyledPendingStatusBox>
          <HourglassEmptyOutlined sx={{ fontSize: 20 }} />
          <Typography variant="labelMd">{labels.waitingMessage}</Typography>
        </StyledPendingStatusBox>
      )}
    </>
  );

  if (options.bare) {
    return content;
  }

  return (
    <StyledRecordCardPaper elevation={0}>
      <StyledRecordCardContent sx={{ p: options.contentPadding }}>{content}</StyledRecordCardContent>
    </StyledRecordCardPaper>
  );
}

export const COMPLAINT_RECORD_CARD_DESKTOP_OPTIONS = DESKTOP_OPTIONS;
export const COMPLAINT_RECORD_CARD_MOBILE_OPTIONS = MOBILE_OPTIONS;
