"use client";

import { Box, type ButtonProps, Typography } from "@mui/material";
import type { ReactNode } from "react";
import {
  getInitials,
  mapPriorityForBadge,
} from "@/frontend/common/views/dashboard/complaints/components/complaintQueueCardShared.helpers";
import { ComplaintResponseSectionShared } from "@/frontend/common/views/dashboard/complaints/components/complaintQueueCardShared.parts";
import {
  StyledComplaintTextBox,
  StyledQueueCardHeader,
  StyledQueueCardStatusBox,
  StyledReceivedTimeLabel,
  StyledSubmitterAvatar,
  StyledSubmitterInfoBox,
  StyledSubmitterName,
  StyledSubmitterRole,
} from "@/frontend/common/views/dashboard/complaints/components/complaintQueueCardShared.styled";
import type {
  ButtonComponentType,
  StatusBadgeComponentProps,
} from "@/frontend/common/views/dashboard/complaints/components/complaintQueueCardShared.types";
import {
  type AdminComplaintRow,
  ComplaintStatus,
} from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import type { ComplaintsAdminLabels } from "@/shared/locale";

interface ComplaintQueueCardSlotProps {
  readonly Root: React.FC<{
    readonly children: ReactNode;
    readonly isUnanswered: boolean;
  }>;
  readonly StatusBadge: React.FC<Readonly<StatusBadgeComponentProps>>;
  readonly PrimaryActionButton: ButtonComponentType;
  readonly EmailActionButton: ButtonComponentType;
  readonly DeleteActionButton: ButtonComponentType;
  readonly EmailActionSx: ButtonProps["sx"];
  readonly DeleteActionSx: ButtonProps["sx"];
  readonly HeaderDirection: "row" | "column";
  readonly HeaderJustifyContent: string;
  readonly HeaderAlignItems: string;
  readonly SubmitterGap: number;
  readonly AvatarSize: number;
  readonly StatusTextAlign: "left" | "right";
  readonly ReceivedTimeMarginTop: number;
  readonly ActionsDirection: "row" | "column";
  readonly ActionsJustifyContent: string;
}

export interface ComplaintQueueCardSharedProps {
  readonly row: AdminComplaintRow;
  readonly labels: ComplaintsAdminLabels;
  readonly draftResponse: string;
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly onDraftChange: (text: string) => void;
  readonly onAnswer: (options: { readonly sendEmail: boolean }) => void;
  readonly onDelete: () => void;
  readonly slots: ComplaintQueueCardSlotProps;
}

export function ComplaintQueueCardShared({
  row,
  labels,
  draftResponse,
  canManage,
  canDelete,
  onDraftChange,
  onAnswer,
  onDelete,
  slots,
}: Readonly<ComplaintQueueCardSharedProps>) {
  const {
    Root,
    StatusBadge,
    PrimaryActionButton,
    EmailActionButton,
    DeleteActionButton,
    EmailActionSx,
    DeleteActionSx,
    HeaderDirection,
    HeaderJustifyContent,
    HeaderAlignItems,
    SubmitterGap,
    AvatarSize,
    StatusTextAlign,
    ReceivedTimeMarginTop,
    ActionsDirection,
    ActionsJustifyContent,
  } = slots;

  const isUnanswered = row.status === ComplaintStatus.Unanswered;

  return (
    <Root isUnanswered={isUnanswered}>
      <StyledQueueCardHeader
        sx={{
          flexDirection: HeaderDirection,
          justifyContent: HeaderJustifyContent,
          alignItems: HeaderAlignItems,
        }}
      >
        <StyledSubmitterInfoBox
          sx={{
            gap: SubmitterGap,
          }}
        >
          <StyledSubmitterAvatar sx={{ width: AvatarSize, height: AvatarSize }} src={row.avatarUrl ?? undefined}>
            {getInitials(row.submitterName)}
          </StyledSubmitterAvatar>
          <Box>
            <StyledSubmitterName variant="titleLg">{row.submitterName}</StyledSubmitterName>
            <StyledSubmitterRole variant="labelMd">{row.submitterRole}</StyledSubmitterRole>
          </Box>
        </StyledSubmitterInfoBox>
        <StyledQueueCardStatusBox
          sx={{
            textAlign: StatusTextAlign,
          }}
        >
          <StatusBadge
            category="classStatus"
            status={mapPriorityForBadge(row.priority)}
            label={labels.priorityLabels[row.priority]}
          />
          <StyledReceivedTimeLabel variant="labelMd" sx={{ marginTop: ReceivedTimeMarginTop }}>
            {labels.queue.received}: {row.receivedAt}
          </StyledReceivedTimeLabel>
        </StyledQueueCardStatusBox>
      </StyledQueueCardHeader>

      <StyledComplaintTextBox isUnanswered={isUnanswered}>
        <Typography variant="bodyLg">{row.complaintText}</Typography>
      </StyledComplaintTextBox>

      <ComplaintResponseSectionShared
        row={row}
        labels={labels}
        draftResponse={draftResponse}
        canManage={canManage}
        canDelete={canDelete}
        onDraftChange={onDraftChange}
        onAnswer={onAnswer}
        onDelete={onDelete}
        PrimaryActionButton={PrimaryActionButton}
        EmailActionButton={EmailActionButton}
        DeleteActionButton={DeleteActionButton}
        EmailActionSx={EmailActionSx}
        DeleteActionSx={DeleteActionSx}
        ActionsDirection={ActionsDirection}
        ActionsJustifyContent={ActionsJustifyContent}
      />
    </Root>
  );
}
