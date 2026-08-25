"use client";

import { ChatBubbleOutlineOutlined, Star, StarBorderOutlined } from "@mui/icons-material";
import { Alert, Box, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";
import type {
  MonthlyAppraisalRow,
  StudentParentAppraisalViewModel,
} from "@/frontend/common/views/dashboard/reports/monthly-appraisal/student-parent/useStudentParentAppraisalViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

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

function AppraisalCard({
  appraisal,
  labels,
  onOpenFeedback,
}: Readonly<{
  appraisal: MonthlyAppraisalRow;
  labels: StudentParentAppraisalViewModel["labels"];
  onOpenFeedback: () => void;
}>) {
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
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          {labels.studentParentView.feedbackThread}
        </Typography>
        {appraisal.feedback.length === 0 ? (
          <Typography variant="body2" sx={theme => ({ color: theme.palette.text.disabled })}>
            {labels.studentParentView.noFeedback}
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {appraisal.feedback.map(fb => (
              <Box key={fb.id} sx={theme => ({ p: 1.5, borderRadius: 1.5, bgcolor: theme.palette.action.hover })}>
                <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {fb.authorName ?? labels.studentParentView.feedbackAuthor}
                  </Typography>
                  <Typography variant="caption" sx={theme => ({ color: theme.palette.text.disabled })}>
                    {new Date(fb.createdAt).toLocaleDateString("en", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                </Stack>
                <Typography variant="body2">{fb.body}</Typography>
              </Box>
            ))}
          </Stack>
        )}

        <Box
          component="button"
          onClick={onOpenFeedback}
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
          {labels.studentParentView.addFeedback}
        </Box>
      </CardContent>
    </Card>
  );
}

function AppraisalListBody({
  labels,
  appraisals,
  loading,
  onSelectAppraisal,
  onOpenFeedbackModal,
}: Readonly<{
  labels: StudentParentAppraisalViewModel["labels"];
  appraisals: readonly MonthlyAppraisalRow[];
  loading: boolean;
  onSelectAppraisal: (id: string) => void;
  onOpenFeedbackModal: () => void;
}>) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <Typography variant="body2" sx={theme => ({ color: theme.palette.text.secondary })}>
          Loading...
        </Typography>
      </Box>
    );
  }
  if (appraisals.length === 0) {
    return (
      <Card variant="outlined" sx={{ borderStyle: "dashed" }}>
        <CardContent sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="h6" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.studentParentView.emptyState}
          </Typography>
          <Typography variant="body2" sx={theme => ({ color: theme.palette.text.disabled, mt: 1 })}>
            {labels.studentParentView.emptyStateDescription}
          </Typography>
        </CardContent>
      </Card>
    );
  }
  return (
    <Stack spacing={3}>
      {appraisals.map(a => (
        <AppraisalCard
          key={a.id}
          appraisal={a}
          labels={labels}
          onOpenFeedback={() => {
            onSelectAppraisal(a.id);
            onOpenFeedbackModal();
          }}
        />
      ))}
    </Stack>
  );
}

export function StudentParentAppraisalsDesktopView({
  labels,
  appraisals,
  loading,
  error,
  onSelectAppraisal,
  onOpenFeedbackModal,
}: Readonly<StudentParentAppraisalViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.studentParentView.pageTitle} subtitle={labels.studentParentView.pageSubtitle} />

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {labels.errors.loadFailed}
        </Alert>
      ) : null}

      <AppraisalListBody
        labels={labels}
        appraisals={appraisals}
        loading={loading}
        onSelectAppraisal={onSelectAppraisal}
        onOpenFeedbackModal={onOpenFeedbackModal}
      />
    </DesktopPageContainer>
  );
}
