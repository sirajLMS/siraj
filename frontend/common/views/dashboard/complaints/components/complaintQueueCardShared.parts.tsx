"use client";

import { AlternateEmailOutlined, DeleteOutlined, SendOutlined } from "@mui/icons-material";
import { Box, type ButtonProps, TextField, Typography } from "@mui/material";
import {
  StyledAnsweredIcon,
  StyledAnsweredResponseBox,
  StyledAnsweredResponseHeader,
  StyledAnsweredResponseLabel,
  StyledAnsweredResponseTime,
  StyledResponseActionsBox,
  StyledResponseInputLabel,
} from "@/frontend/common/views/dashboard/complaints/components/complaintQueueCardShared.styled";
import type { ButtonComponentType } from "@/frontend/common/views/dashboard/complaints/components/complaintQueueCardShared.types";
import {
  type AdminComplaintRow,
  ComplaintStatus,
} from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import type { ComplaintsAdminLabels } from "@/shared/locale";

interface ComplaintResponseSectionSharedProps {
  readonly row: AdminComplaintRow;
  readonly labels: ComplaintsAdminLabels;
  readonly draftResponse: string;
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly onDraftChange: (text: string) => void;
  readonly onAnswer: (options: { readonly sendEmail: boolean }) => void;
  readonly onDelete: () => void;
  readonly PrimaryActionButton: ButtonComponentType;
  readonly EmailActionButton: ButtonComponentType;
  readonly DeleteActionButton: ButtonComponentType;
  readonly EmailActionSx: ButtonProps["sx"];
  readonly DeleteActionSx: ButtonProps["sx"];
  readonly ActionsDirection: "row" | "column";
  readonly ActionsJustifyContent: string;
}

export function ComplaintResponseSectionShared({
  row,
  labels,
  draftResponse,
  canManage,
  canDelete,
  onDraftChange,
  onAnswer,
  onDelete,
  PrimaryActionButton,
  EmailActionButton,
  DeleteActionButton,
  EmailActionSx,
  DeleteActionSx,
  ActionsDirection,
  ActionsJustifyContent,
}: Readonly<ComplaintResponseSectionSharedProps>) {
  if (row.status === ComplaintStatus.Answered) {
    return (
      <StyledAnsweredResponseBox>
        <StyledAnsweredResponseHeader>
          <StyledAnsweredIcon />
          <StyledAnsweredResponseLabel variant="labelMd">{labels.queue.adminResponse}</StyledAnsweredResponseLabel>
          {row.answeredAt ? (
            <StyledAnsweredResponseTime variant="labelMd">{row.answeredAt}</StyledAnsweredResponseTime>
          ) : null}
        </StyledAnsweredResponseHeader>
        <Typography variant="bodyMd" sx={{ fontStyle: "italic" }}>
          {row.adminResponse}
        </Typography>
      </StyledAnsweredResponseBox>
    );
  }

  if (!canManage) return null;

  return (
    <Box>
      <StyledResponseInputLabel variant="labelMd">{labels.queue.yourResponse}</StyledResponseInputLabel>
      <TextField
        fullWidth
        multiline
        minRows={3}
        value={draftResponse}
        placeholder={labels.queue.responsePlaceholder}
        onChange={event => {
          onDraftChange(event.target.value);
        }}
        slotProps={{ htmlInput: { autoComplete: "off" } }}
      />
      <StyledResponseActionsBox sx={{ flexDirection: ActionsDirection, justifyContent: ActionsJustifyContent }}>
        <PrimaryActionButton
          startIcon={<SendOutlined />}
          disabled={draftResponse.trim().length === 0}
          onClick={() => {
            onAnswer({ sendEmail: false });
          }}
        >
          {labels.queue.answer}
        </PrimaryActionButton>
        <EmailActionButton
          startIcon={<AlternateEmailOutlined />}
          disabled={draftResponse.trim().length === 0}
          onClick={() => {
            onAnswer({ sendEmail: true });
          }}
          sx={EmailActionSx}
        >
          {labels.queue.answerAndEmail}
        </EmailActionButton>
        {canDelete ? (
          <DeleteActionButton
            startIcon={<DeleteOutlined />}
            onClick={() => {
              onDelete();
            }}
            sx={DeleteActionSx}
          >
            {labels.queue.deleteConfirmConfirm}
          </DeleteActionButton>
        ) : null}
      </StyledResponseActionsBox>
    </Box>
  );
}
