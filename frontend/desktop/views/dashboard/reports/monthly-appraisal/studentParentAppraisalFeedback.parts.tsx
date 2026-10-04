"use client";

import { ChatBubbleOutlineOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import type {
  AppraisalFeedbackEntry,
  StudentParentAppraisalViewModel,
} from "@/frontend/common/views/dashboard/reports/monthly-appraisal/student-parent/useStudentParentAppraisalViewModel";

const FEEDBACK_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
};

function formatFeedbackDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("en", FEEDBACK_DATE_OPTIONS);
}

interface FeedbackThreadSectionProps {
  readonly feedback: readonly AppraisalFeedbackEntry[];
  readonly labels: StudentParentAppraisalViewModel["labels"];
}

/** Thread of teacher/parent replies attached to one appraisal, or its empty hint. */
export function FeedbackThreadSection({ feedback, labels }: Readonly<FeedbackThreadSectionProps>) {
  return (
    <>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {labels.studentParentView.feedbackThread}
      </Typography>
      {feedback.length === 0 ? (
        <Typography variant="body2" sx={theme => ({ color: theme.palette.text.disabled })}>
          {labels.studentParentView.noFeedback}
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {feedback.map(fb => (
            <Box key={fb.id} sx={theme => ({ p: 1.5, borderRadius: 1.5, bgcolor: theme.palette.action.hover })}>
              <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {fb.authorName ?? labels.studentParentView.feedbackAuthor}
                </Typography>
                <Typography variant="caption" sx={theme => ({ color: theme.palette.text.disabled })}>
                  {formatFeedbackDate(fb.createdAt)}
                </Typography>
              </Stack>
              <Typography variant="body2">{fb.body}</Typography>
            </Box>
          ))}
        </Stack>
      )}
    </>
  );
}

interface AddFeedbackButtonProps {
  readonly label: string;
  readonly onClick: () => void;
}

/** Outlined call-to-action that opens the appraisal feedback modal. */
export function AddFeedbackButton({ label, onClick }: Readonly<AddFeedbackButtonProps>) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        mt: 2,
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        border: 1,
        borderColor: theme => theme.palette.primary.main,
        borderRadius: 2,
        py: 1,
        px: 2,
        bgcolor: "transparent",
        color: theme => theme.palette.primary.main,
        cursor: "pointer",
        fontWeight: 600,
        textTransform: "none",
        "&:hover": { bgcolor: theme => theme.palette.action.hover },
      }}
    >
      <ChatBubbleOutlineOutlined fontSize="small" />
      {label}
    </Box>
  );
}
