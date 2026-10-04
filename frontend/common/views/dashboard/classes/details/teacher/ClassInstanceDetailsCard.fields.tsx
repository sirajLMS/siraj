"use client";

import { MenuBookOutlined } from "@mui/icons-material";
import { Button, Grid, Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { UserAvatar } from "@/frontend/common/components/ui/avatar/UserAvatar";
import { StudentEntityLink } from "@/frontend/common/views/dashboard/classes/details/components/EntityLinks";
import { DetailField } from "@/frontend/common/views/dashboard/classes/details/teacher/ClassInstanceDetailsCard.parts";
import type { ClassInstanceDetailsFieldsProps } from "@/frontend/common/views/dashboard/classes/details/teacher/ClassInstanceDetailsCard.types";
import { Link } from "@/shared/i18n";

export function ClassInstanceDetailsFields({
  studentId,
  studentName,
  subjectId,
  displaySubjectName,
  subjectAvatarUrl,
  startTime,
  endTime,
  durationMinutes,
  statusKey,
  statusLabel,
  hideStudentField = false,
  labels,
}: ClassInstanceDetailsFieldsProps) {
  return (
    <Grid container spacing={3} sx={theme => ({ pb: 4, borderBottom: 1, borderColor: theme.palette.outlineVariant })}>
      {!hideStudentField && (
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailField
            label={labels.studentName}
            value={
              studentId ? (
                <StudentEntityLink studentId={studentId} name={studentName} variant="bodyLg" />
              ) : (
                <Typography variant="bodyLg" sx={theme => ({ fontWeight: theme.typography.fontWeightBold })}>
                  {studentName}
                </Typography>
              )
            }
          />
        </Grid>
      )}
      <Grid size={{ xs: 12, sm: 6 }}>
        <DetailField
          label={labels.courseModule}
          value={
            <Stack sx={{ gap: 1 }}>
              <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
                <UserAvatar src={subjectAvatarUrl ?? undefined} label={displaySubjectName} size={40} />
                <Typography variant="bodyLg">{displaySubjectName}</Typography>
              </Stack>
              {subjectId ? (
                <Link href={`/subjects/${subjectId}`} style={{ textDecoration: "none" }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<MenuBookOutlined />}
                    sx={theme => ({
                      alignSelf: "flex-start",
                      borderColor: theme.palette.outline,
                      color: theme.palette.primary.main,
                      "&:hover": {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: theme.palette.action.hover,
                      },
                    })}
                  >
                    {labels.viewSubject}
                  </Button>
                </Link>
              ) : null}
            </Stack>
          }
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <DetailField label={labels.startTime} value={<Typography variant="bodyLg">{startTime}</Typography>} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <DetailField label={labels.endTime} value={<Typography variant="bodyLg">{endTime}</Typography>} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <DetailField
          label={labels.duration}
          value={
            <Typography variant="bodyLg">
              {durationMinutes} {labels.minutes}
            </Typography>
          }
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <DetailField
          label={labels.status}
          value={<StatusBadge category="session" status={statusKey} label={statusLabel} />}
        />
      </Grid>
    </Grid>
  );
}
