"use client";

import { HourglassEmptyOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type { StatusBadgeCategory } from "@/frontend/common/components/ui/badge/types/statusBadgeShared.types";
import {
  StyledAdminResponseBox,
  StyledAdminResponseHeader,
  StyledAdminResponseLabel,
  StyledAdminResponseText,
  StyledAdminResponseTime,
  StyledPendingStatusBox,
  StyledRecordCardContent,
  StyledRecordCardHeader,
  StyledRecordCardPaper,
  StyledRecordRegardingLabel,
  StyledRecordSummaryText,
  StyledVerifiedIcon,
} from "@/frontend/common/views/dashboard/complaints/components/__shared__/complaintRecordCardShared.styled";
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
