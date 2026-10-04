"use client";

import { ChatBubbleOutlineOutlined, Star, StarBorderOutlined } from "@mui/icons-material";
import { Box, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";
import type {
  MonthlyAppraisalRow,
  StudentParentAppraisalViewModel,
} from "@/frontend/common/views/dashboard/reports/monthly-appraisal/student-parent/useStudentParentAppraisalViewModel";
import {
  AddFeedbackButton,
  FeedbackThreadSection,
} from "@/frontend/desktop/views/dashboard/reports/monthly-appraisal/studentParentAppraisalFeedback.parts";

function GradeStars({ grade }: Readonly<{ grade: number }>) {
  return (
    <Box sx={{ display: "inline-flex", gap: 0.25, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map(i =>
        i <= grade ? (
          <Star key={i} sx={theme => ({ fontSize: 18, color: theme.palette.warning.main })} />
        ) : (
          <StarBorderOutlined key={i} sx={theme => ({ fontSize: 18, color: theme.palette.action.disabled })} />
        )
      )}
    </Box>
  );
}

interface AppraisalCardProps {
  readonly appraisal: MonthlyAppraisalRow;
  readonly labels: StudentParentAppraisalViewModel["labels"];
  readonly onOpenFeedback: () => void;
}

/** Summary card for one month: rubric grades, learning targets and the feedback thread. */
export function AppraisalCard({ appraisal, labels, onOpenFeedback }: Readonly<AppraisalCardProps>) {
  const monthLabel = new Date(appraisal.month).toLocaleDateString("en", { month: "long", year: "numeric" });
  return (
    <Card variant="outlined" sx={{ transition: "box-shadow 0.2s", "&:hover": { boxShadow: 3 } }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {monthLabel}
            </Typography>
            <Typography variant="body2" sx={theme => ({ color: theme.palette.text.secondary })}>
              {labels.studentParentView.teacher}: {appraisal.teacherId.slice(0, 8)}
            </Typography>
          </Box>
          <Chip
            icon={<ChatBubbleOutlineOutlined />}
            label={`${appraisal.feedback.length} ${appraisal.feedback.length === 1 ? "reply" : "replies"}`}
            variant="outlined"
            size="small"
          />
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {appraisal.rubricFields.length === 0 ? null : (
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            {appraisal.rubricFields.map(field => (
              <Box key={field.label}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {field.label}
                  </Typography>
                  {field.grade !== null ? <GradeStars grade={field.grade} /> : null}
                </Stack>
                {field.comment ? (
                  <Typography variant="body2" sx={theme => ({ color: theme.palette.text.secondary, mt: 0.25 })}>
                    {field.comment}
                  </Typography>
                ) : null}
              </Box>
            ))}
          </Stack>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {labels.studentParentView.learningTargets}
          </Typography>
          <Typography variant="body2" sx={theme => ({ color: theme.palette.text.secondary, mt: 0.25 })}>
            {appraisal.learningTargets}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />
        <FeedbackThreadSection feedback={appraisal.feedback} labels={labels} />
        <AddFeedbackButton label={labels.studentParentView.addFeedback} onClick={onOpenFeedback} />
      </CardContent>
    </Card>
  );
}
