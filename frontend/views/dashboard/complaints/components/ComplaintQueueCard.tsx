"use client";

import { AlternateEmailOutlined, CheckCircleOutlined, SendOutlined } from "@mui/icons-material";
import { Avatar, Box, Paper, TextField, Typography } from "@mui/material";
import { FilterButton, PrimaryPageAction, StatusBadge } from "@/frontend/components/ui";
import type { AdminComplaintRow, ComplaintPriority } from "@/frontend/stores/adminComplaintsStore";
import type { ComplaintsAdminLabels } from "@/shared/messages/types/dashboard/complaints/main";

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
  if (row.status === "answered") {
    return (
      <Box
        sx={theme => ({
          p: 2,
          borderRadius: theme.layout.radius.card,
          bgcolor: theme.palette.surfaceContainerLow,
          border: `1px solid ${theme.palette.outlineVariant}`,
        })}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <CheckCircleOutlined sx={theme => ({ color: theme.palette.primary.main, fontSize: 18 })} />
          <Typography variant="labelMd" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
            {labels.queue.adminResponse}
          </Typography>
          {row.answeredAt ? (
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary, ml: "auto" })}>
              {row.answeredAt}
            </Typography>
          ) : null}
        </Box>
        <Typography variant="bodyMd" sx={{ fontStyle: "italic" }}>
          {row.adminResponse}
        </Typography>
      </Box>
    );
  }

  if (!canManage) {
    return null;
  }

  return (
    <Box>
      <Typography variant="labelMd" sx={{ fontWeight: 700, mb: 1, textTransform: "uppercase" }}>
        {labels.queue.yourResponse}
      </Typography>
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
      <Box
        sx={{
          mt: 2,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "flex-end",
          gap: 1.5,
        }}
      >
        <PrimaryPageAction
          startIcon={<SendOutlined />}
          disabled={draftResponse.trim().length === 0}
          onClick={() => {
            onAnswer({ sendEmail: false });
          }}
        >
          {labels.queue.answer}
        </PrimaryPageAction>
        <FilterButton
          startIcon={<AlternateEmailOutlined />}
          disabled={draftResponse.trim().length === 0}
          onClick={() => {
            onAnswer({ sendEmail: true });
          }}
          sx={theme => ({
            bgcolor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
            borderColor: theme.palette.primary.main,
            "&:hover": { bgcolor: theme.palette.primary.dark },
          })}
        >
          {labels.queue.answerAndEmail}
        </FilterButton>
      </Box>
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
  const isUnanswered = row.status === "unanswered";

  return (
    <Paper
      elevation={0}
      sx={theme => ({
        p: 3,
        borderRadius: theme.layout.radius.card,
        border: `1px solid ${theme.palette.outlineVariant}`,
        bgcolor: isUnanswered ? theme.palette.surface : theme.palette.surfaceContainerLow,
        transition: "background-color 0.15s ease",
      })}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "flex-start" },
          gap: 2,
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar src={row.avatarUrl || undefined} sx={{ width: 48, height: 48, typography: "labelMd" }}>
            {getInitials(row.submitterName)}
          </Avatar>
          <Box>
            <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
              {row.submitterName}
            </Typography>
            <Typography
              variant="labelMd"
              sx={theme => ({ color: theme.palette.text.secondary, textTransform: "uppercase" })}
            >
              {row.submitterRole}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
          <StatusBadge
            category="classStatus"
            status={mapPriorityForBadge(row.priority)}
            label={labels.priorityLabels[row.priority]}
          />
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary, mt: 1 })}>
            {labels.queue.received}: {row.receivedAt}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={theme => ({
          mb: isUnanswered ? 3 : 2,
          p: 2,
          bgcolor: theme.palette.surfaceContainerLowest,
          borderRadius: theme.layout.radius.card,
          borderLeft: `4px solid ${theme.palette.primary.main}`,
        })}
      >
        <Typography variant="bodyLg">{row.complaintText}</Typography>
      </Box>

      <ComplaintResponseSection
        row={row}
        labels={labels}
        draftResponse={draftResponse}
        canManage={canManage}
        onDraftChange={onDraftChange}
        onAnswer={onAnswer}
      />
    </Paper>
  );
}
