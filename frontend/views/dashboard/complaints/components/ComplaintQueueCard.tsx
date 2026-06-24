"use client";

import { AlternateEmailOutlined, CheckCircleOutlined, SendOutlined } from "@mui/icons-material";
import { Avatar, Box, Paper, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { FilterButton, PrimaryPageAction, StatusBadge } from "@/frontend/components/ui";
import type { ComplaintsAdminLabels } from "@/shared/messages/types/dashboard/complaints/main";
import { type AdminComplaintRow, type ComplaintPriority, ComplaintStatus } from "../types/complaints.types";

/** Container for an already-answered complaint response with surface background */
const StyledAnsweredResponseBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.layout.radius.card,
  backgroundColor: theme.palette.surfaceContainerLow,
  border: `1px solid ${theme.palette.outlineVariant}`,
}));

/** Header row inside the answered response section */
const StyledAnsweredResponseHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

/** Check icon indicating the complaint has been answered */
const StyledAnsweredIcon = styled(CheckCircleOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: 18,
}));

/** Bold label for the answered response section title */
const StyledAnsweredResponseLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

/** Timestamp for when the complaint was answered */
const StyledAnsweredResponseTime = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginLeft: "auto",
}));

/** Uppercase label above the draft response text field */
const StyledResponseInputLabel = styled(Typography)({
  fontWeight: 700,
  marginBottom: "0.5rem",
  textTransform: "uppercase",
});

/** Actions row containing the answer and email buttons */
const StyledResponseActionsBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  gap: theme.spacing(1.5),
  [theme.breakpoints.up("sm")]: {
    flexDirection: "row",
  },
}));

/** Primary-colored Answer and Email button */
const StyledEmailActionButton = styled(FilterButton)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  borderColor: theme.palette.primary.main,
  "&:hover": { backgroundColor: theme.palette.primary.dark },
}));

/** Root card paper with conditional background based on answered/unanswered status */
const StyledQueueCardPaper = styled(Paper, {
  shouldForwardProp: prop => prop !== "isUnanswered",
})<{ isUnanswered: boolean }>(({ theme, isUnanswered }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.layout.radius.card,
  border: `1px solid ${theme.palette.outlineVariant}`,
  backgroundColor: isUnanswered ? theme.palette.surface : theme.palette.surfaceContainerLow,
  transition: "background-color 0.15s ease",
}));

/** Card header containing submitter info and status/priority */
const StyledQueueCardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
}));

/** Submitter avatar and name info group */
const StyledSubmitterInfoBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

/** Submitter avatar with initials fallback */
const StyledSubmitterAvatar = styled(Avatar)(({ theme }) => ({
  width: 48,
  height: 48,
  ...theme.typography.labelMd,
}));

/** Bold submitter name display */
const StyledSubmitterName = styled(Typography)({
  fontWeight: 700,
});

/** Uppercase submitter role label */
const StyledSubmitterRole = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textTransform: "uppercase",
}));

/** Right-aligned status badge and received timestamp */
const StyledQueueCardStatusBox = styled(Box)(({ theme }) => ({
  textAlign: "left",
  [theme.breakpoints.up("sm")]: {
    textAlign: "right",
  },
}));

/** Timestamp showing when the complaint was received */
const StyledReceivedTimeLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(1),
}));

/** Complaint text container with left border accent and conditional bottom margin */
const StyledComplaintTextBox = styled(Box, {
  shouldForwardProp: prop => prop !== "isUnanswered",
})<{ isUnanswered: boolean }>(({ theme, isUnanswered }) => ({
  marginBottom: theme.spacing(isUnanswered ? 3 : 2),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.surfaceContainerLowest,
  borderRadius: theme.layout.radius.card,
  borderLeft: `4px solid ${theme.palette.primary.main}`,
}));

interface ComplaintQueueCardProps {
  readonly row: AdminComplaintRow;
  readonly labels: ComplaintsAdminLabels;
  readonly draftResponse: string;
  readonly canManage: boolean;
  readonly onDraftChange: (text: string) => void;
  readonly onAnswer: (options: { readonly sendEmail: boolean }) => void;
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

function ComplaintResponseSection({
  row,
  labels,
  draftResponse,
  canManage,
  onDraftChange,
  onAnswer,
}: Readonly<{
  row: AdminComplaintRow;
  labels: ComplaintsAdminLabels;
  draftResponse: string;
  canManage: boolean;
  onDraftChange: (text: string) => void;
  onAnswer: (options: { readonly sendEmail: boolean }) => void;
}>) {
  if (row.status === ComplaintStatus.Answered) {
    // Already-answered response display
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

  // Draft response input section for unanswered complaints
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
        <PrimaryPageAction
          startIcon={<SendOutlined />}
          disabled={draftResponse.trim().length === 0}
          onClick={() => {
            onAnswer({ sendEmail: false });
          }}
        >
          {labels.queue.answer}
        </PrimaryPageAction>
        <StyledEmailActionButton
          startIcon={<AlternateEmailOutlined />}
          disabled={draftResponse.trim().length === 0}
          onClick={() => {
            onAnswer({ sendEmail: true });
          }}
        >
          {labels.queue.answerAndEmail}
        </StyledEmailActionButton>
      </StyledResponseActionsBox>
    </Box>
  );
}

export function ComplaintQueueCard({
  row,
  labels,
  draftResponse,
  canManage,
  onDraftChange,
  onAnswer,
}: Readonly<ComplaintQueueCardProps>) {
  const isUnanswered = row.status === ComplaintStatus.Unanswered;

  return (
    <StyledQueueCardPaper elevation={0} isUnanswered={isUnanswered}>
      {/* Submitter info and priority/status header */}
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
          <StatusBadge
            category="classStatus"
            status={mapPriorityForBadge(row.priority)}
            label={labels.priorityLabels[row.priority]}
          />
          <StyledReceivedTimeLabel variant="labelMd">
            {labels.queue.received}: {row.receivedAt}
          </StyledReceivedTimeLabel>
        </StyledQueueCardStatusBox>
      </StyledQueueCardHeader>

      {/* Complaint text with left accent border */}
      <StyledComplaintTextBox isUnanswered={isUnanswered}>
        <Typography variant="bodyLg">{row.complaintText}</Typography>
      </StyledComplaintTextBox>

      {/* Response section (answered display or draft input) */}
      <ComplaintResponseSection
        row={row}
        labels={labels}
        draftResponse={draftResponse}
        canManage={canManage}
        onDraftChange={onDraftChange}
        onAnswer={onAnswer}
      />
    </StyledQueueCardPaper>
  );
}
