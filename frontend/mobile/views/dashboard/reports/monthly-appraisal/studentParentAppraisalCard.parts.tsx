"use client";

import { ChatBubbleOutlineOutlined, Star, StarBorderOutlined } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";
import type {
  MonthlyAppraisalRow,
  StudentParentAppraisalViewModel,
} from "@/frontend/common/views/dashboard/reports/monthly-appraisal/student-parent/useStudentParentAppraisalViewModel";

function MobileGradeStars({ grade }: Readonly<{ grade: number }>) {
  return (
    <Box sx={{ display: "inline-flex", gap: 0.25 }}>
      {[1, 2, 3, 4, 5].map(i =>
        i <= grade ? (
          <Star key={i} sx={theme => ({ fontSize: 14, color: theme.palette.warning.main })} />
        ) : (
          <StarBorderOutlined key={i} sx={theme => ({ fontSize: 14, color: theme.palette.action.disabled })} />
        )
      )}
    </Box>
  );
}

interface MobileAppraisalCardProps {
  appraisal: MonthlyAppraisalRow;
  labels: StudentParentAppraisalViewModel["labels"];
  onOpenFeedback: () => void;
}

export function MobileAppraisalCard({ appraisal, labels, onOpenFeedback }: Readonly<MobileAppraisalCardProps>) {
  const monthLabel = new Date(appraisal.month).toLocaleDateString("en", { month: "short", year: "numeric" });
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {monthLabel}
          </Typography>
          <Chip
            icon={<ChatBubbleOutlineOutlined />}
            label={appraisal.feedback.length}
            variant="outlined"
            size="small"
          />
        </Stack>

        {appraisal.rubricFields.length === 0 ? null : (
          <Stack spacing={0.75} sx={{ mb: 1.5 }}>
            {appraisal.rubricFields.map(field => (
              <Box key={field.label}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {field.label}
                  </Typography>
                  {field.grade !== null ? <MobileGradeStars grade={field.grade} /> : null}
                </Stack>
                {field.comment ? (
                  <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
                    {field.comment}
                  </Typography>
                ) : null}
              </Box>
            ))}
          </Stack>
        )}

        <Divider sx={{ my: 1 }} />
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {labels.studentParentView.learningTargets}
        </Typography>
        <Typography variant="body2" sx={theme => ({ color: theme.palette.text.secondary })}>
          {appraisal.learningTargets}
        </Typography>

        {appraisal.feedback.length > 0 ? (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {labels.studentParentView.feedbackThread}
            </Typography>
            {appraisal.feedback.map(fb => (
              <Box key={fb.id} sx={theme => ({ p: 1, mt: 0.5, borderRadius: 1, bgcolor: theme.palette.action.hover })}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {fb.authorName ?? labels.studentParentView.feedbackAuthor}
                </Typography>
                <Typography variant="body2">{fb.body}</Typography>
              </Box>
            ))}
          </Box>
        ) : null}

        <Button
          fullWidth
          variant="outlined"
          color="primary"
          size="small"
          startIcon={<ChatBubbleOutlineOutlined />}
          onClick={onOpenFeedback}
          sx={{ mt: 1.5, borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          {labels.studentParentView.addFeedback}
        </Button>
      </CardContent>
    </Card>
  );
}
