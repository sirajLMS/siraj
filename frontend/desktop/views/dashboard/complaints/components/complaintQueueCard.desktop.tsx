"use client";

import { AlternateEmailOutlined, CheckCircleOutlined, DeleteOutlineOutlined, SendOutlined } from "@mui/icons-material";
import { Avatar, Box, Paper, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  type AdminComplaintRow,
  type ComplaintPriority,
  ComplaintStatus,
} from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { DesktopFilterButton, DesktopPrimaryPageAction, DesktopStatusBadge } from "@/frontend/desktop/components/ui";
import type { ComplaintsAdminLabels } from "@/shared/locale";

const StyledEmailActionButton = styled(DesktopFilterButton)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  borderColor: theme.palette.primary.main,
  "&:hover": { backgroundColor: theme.palette.primary.dark },
}));

const StyledQueueCardPaper = styled(Paper, {
  shouldForwardProp: prop => prop !== "isUnanswered",
})<{ isUnanswered: boolean }>(({ theme, isUnanswered }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.layout.radius.card,
  border: `1px solid ${theme.palette.outlineVariant}`,
  backgroundColor: isUnanswered ? theme.palette.surface : theme.palette.surfaceContainerLow,
  transition: "background-color 0.15s ease",
}));

const StyledQueueCardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const StyledSubmitterInfoBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const StyledSubmitterAvatar = styled(Avatar)(({ theme }) => ({
  width: 48,
  height: 48,
  ...theme.typography.labelMd,
}));

const StyledSubmitterName = styled(Typography)({
  fontWeight: 700,
});

const StyledSubmitterRole = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textTransform: "uppercase",
}));

const StyledQueueCardStatusBox = styled(Box)(() => ({
  textAlign: "right",
}));

const StyledReceivedTimeLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(1),
}));

const StyledComplaintTextBox = styled(Box, {
  shouldForwardProp: prop => prop !== "isUnanswered",
})<{ isUnanswered: boolean }>(({ theme, isUnanswered }) => ({
  marginBottom: theme.spacing(isUnanswered ? 3 : 2),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.surfaceContainerLowest,
  borderRadius: theme.layout.radius.card,
  borderLeft: `4px solid ${theme.palette.primary.main}`,
}));

const StyledAnsweredResponseBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.layout.radius.card,
  backgroundColor: theme.palette.surfaceContainerLow,
  border: `1px solid ${theme.palette.outlineVariant}`,
}));

const StyledAnsweredResponseHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const StyledAnsweredIcon = styled(CheckCircleOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: 18,
}));

const StyledAnsweredResponseLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

const StyledAnsweredResponseTime = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginLeft: "auto",
}));

const StyledResponseInputLabel = styled(Typography)({
  fontWeight: 700,
  marginBottom: "0.5rem",
  textTransform: "uppercase",
});

const StyledResponseActionsBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  display: "flex",
  flexDirection: "row",
  justifyContent: "flex-end",
  gap: theme.spacing(1.5),
}));

interface ComplaintQueueCardDesktopProps {
  readonly row: AdminComplaintRow;
  readonly labels: ComplaintsAdminLabels;
  readonly draftResponse: string;
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly onDraftChange: (text: string) => void;
  readonly onAnswer: (options: { readonly sendEmail: boolean }) => void;
  readonly onDelete: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map(part => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function mapPriorityForBadge(priority: ComplaintPriority): string {
  if (priority === "urgent") {
    return "blocked";
  }

  return "confirmed";
}

function ComplaintResponseSectionDesktop({
  row,
  labels,
  draftResponse,
  canManage,
  canDelete,
  onDraftChange,
  onAnswer,
  onDelete,
}: Readonly<{
  row: AdminComplaintRow;
  labels: ComplaintsAdminLabels;
  draftResponse: string;
  canManage: boolean;
  canDelete: boolean;
  onDraftChange: (text: string) => void;
  onAnswer: (options: { readonly sendEmail: boolean }) => void;
  onDelete: () => void;
}>) {
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

  if (!canManage) {
    return null;
  }

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
      <StyledResponseActionsBox>
        <DesktopPrimaryPageAction
          startIcon={<SendOutlined />}
          disabled={draftResponse.trim().length === 0}
          onClick={() => {
            onAnswer({ sendEmail: false });
          }}
        >
          {labels.queue.answer}
        </DesktopPrimaryPageAction>
        <StyledEmailActionButton
          startIcon={<AlternateEmailOutlined />}
          disabled={draftResponse.trim().length === 0}
          onClick={() => {
            onAnswer({ sendEmail: true });
          }}
        >
          {labels.queue.answerAndEmail}
        </StyledEmailActionButton>
        {canDelete ? (
          <DesktopFilterButton
            startIcon={<DeleteOutlineOutlined />}
            onClick={() => {
              onDelete();
            }}
          >
            {labels.queue.deleteConfirmConfirm}
          </DesktopFilterButton>
        ) : null}
      </StyledResponseActionsBox>
    </Box>
  );
}

export function ComplaintQueueCardDesktop({
  row,
  labels,
  draftResponse,
  canManage,
  canDelete,
  onDraftChange,
  onAnswer,
  onDelete,
}: Readonly<ComplaintQueueCardDesktopProps>) {
  const isUnanswered = row.status === ComplaintStatus.Unanswered;

  return (
    <StyledQueueCardPaper elevation={0} isUnanswered={isUnanswered}>
      <StyledQueueCardHeader>
        <StyledSubmitterInfoBox>
          <StyledSubmitterAvatar src={row.avatarUrl || undefined}>
            {getInitials(row.submitterName)}
          </StyledSubmitterAvatar>
          <Box>
            <StyledSubmitterName variant="titleLg">{row.submitterName}</StyledSubmitterName>
            <StyledSubmitterRole variant="labelMd">{row.submitterRole}</StyledSubmitterRole>
          </Box>
        </StyledSubmitterInfoBox>
        <StyledQueueCardStatusBox>
          <DesktopStatusBadge
            category="classStatus"
            status={mapPriorityForBadge(row.priority)}
            label={labels.priorityLabels[row.priority]}
          />
          <StyledReceivedTimeLabel variant="labelMd">
            {labels.queue.received}: {row.receivedAt}
          </StyledReceivedTimeLabel>
        </StyledQueueCardStatusBox>
      </StyledQueueCardHeader>

      <StyledComplaintTextBox isUnanswered={isUnanswered}>
        <Typography variant="bodyLg">{row.complaintText}</Typography>
      </StyledComplaintTextBox>

      <ComplaintResponseSectionDesktop
        row={row}
        labels={labels}
        draftResponse={draftResponse}
        canManage={canManage}
        canDelete={canDelete}
        onDraftChange={onDraftChange}
        onAnswer={onAnswer}
        onDelete={onDelete}
      />
    </StyledQueueCardPaper>
  );
}
