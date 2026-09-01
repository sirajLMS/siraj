"use client";

import { AlternateEmailOutlined, CheckCircleOutlined, DeleteOutlined, SendOutlined } from "@mui/icons-material";
import { Avatar, Box, type ButtonProps, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";
import type { StatusBadgeCategory } from "@/frontend/common/components/ui/badge/types/statusBadgeShared.types";
import {
  type AdminComplaintRow,
  type ComplaintPriority,
  ComplaintStatus,
} from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import type { ComplaintsAdminLabels } from "@/shared/locale";

type StatusBadgeComponentProps = {
  readonly category: StatusBadgeCategory;
  readonly status: string;
  readonly label: string;
};

type ButtonComponentType = React.FC<Readonly<ButtonProps>>;

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

const StyledQueueCardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
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
  fontSize: theme.typography.titleLg.fontSize,
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

function getInitials(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .split(" ")
    .map(part => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function mapPriorityForBadge(priority: ComplaintPriority): string {
  if (priority === "urgent") return "blocked";
  return "confirmed";
}

function ComplaintResponseSectionShared({
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
}: Readonly<{
  row: AdminComplaintRow;
  labels: ComplaintsAdminLabels;
  draftResponse: string;
  canManage: boolean;
  canDelete: boolean;
  onDraftChange: (text: string) => void;
  onAnswer: (options: { readonly sendEmail: boolean }) => void;
  onDelete: () => void;
  PrimaryActionButton: ButtonComponentType;
  EmailActionButton: ButtonComponentType;
  DeleteActionButton: ButtonComponentType;
  EmailActionSx: ButtonProps["sx"];
  DeleteActionSx: ButtonProps["sx"];
  ActionsDirection: "row" | "column";
  ActionsJustifyContent: string;
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
