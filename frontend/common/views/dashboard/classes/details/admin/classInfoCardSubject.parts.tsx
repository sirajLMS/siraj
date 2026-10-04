"use client";

import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import { Box, Button, Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { UserAvatar } from "@/frontend/common/components/ui/avatar/UserAvatar";
import type { ClassInfoCardLabels } from "@/frontend/common/views/dashboard/classes/details/admin/classInfoCard.helpers";
import {
  StyledActiveConnectionCaption,
  StyledActiveStatusDot,
  StyledCourseNameHeading,
} from "@/frontend/common/views/dashboard/classes/details/admin/classInfoCard.styled";
import { Link } from "@/shared/i18n";

interface SubjectHeaderBlockProps {
  readonly subjectId: string;
  readonly subjectHref: string | undefined;
  readonly subjectName: string;
  readonly subjectAvatarUrl: string | undefined;
  readonly courseName: string;
  readonly isActive: boolean;
  readonly labels: ClassInfoCardLabels;
}

export function SubjectHeaderBlock({
  subjectId,
  subjectHref,
  subjectName,
  subjectAvatarUrl,
  courseName,
  isActive,
  labels,
}: SubjectHeaderBlockProps) {
  const subjectAvatar = <UserAvatar src={subjectAvatarUrl} label={subjectName || courseName} size={64} />;

  return (
    <Stack
      direction="row"
      sx={theme => ({
        alignItems: "flex-start",
        gap: theme.spacing(2),
        flex: 1,
        minWidth: 0,
      })}
    >
      {subjectId || subjectName ? (
        <Box sx={{ flexShrink: 0 }}>
          {subjectHref ? (
            <Link href={subjectHref} style={{ textDecoration: "none" }}>
              {subjectAvatar}
            </Link>
          ) : (
            subjectAvatar
          )}
        </Box>
      ) : null}
      <Box sx={{ minWidth: 0 }}>
        {isActive ? (
          <Box sx={theme => ({ mb: theme.spacing(1.5) })}>
            <StatusBadge category="classInstance" status="ACTIVATED" label={labels.liveInstance} />
          </Box>
        ) : null}
        <StyledCourseNameHeading
          variant="h3"
          sx={theme => ({
            mb: theme.spacing(0.5),
            color: theme.palette.primary.main,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          })}
        >
          {courseName}
        </StyledCourseNameHeading>
        {subjectName ? (
          <Typography variant="bodyMd" sx={theme => ({ mb: theme.spacing(0.5), color: theme.palette.text.secondary })}>
            {subjectName}
          </Typography>
        ) : null}
        {subjectId ? (
          <Link href={`/subjects/${subjectId}`} style={{ textDecoration: "none" }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<MenuBookOutlined />}
              sx={theme => ({ mt: theme.spacing(1.5) })}
            >
              {labels.viewSubject}
            </Button>
          </Link>
        ) : null}
      </Box>
    </Stack>
  );
}

export function ActiveConnectionIndicator({ activeConnection }: { readonly activeConnection: string }) {
  return (
    <Stack
      direction="row"
      sx={theme => ({
        alignItems: "center",
        gap: theme.spacing(1),
        flexShrink: 0,
      })}
    >
      <StyledActiveStatusDot sx={theme => ({ color: theme.palette.status.active })} />
      <StyledActiveConnectionCaption variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
        {activeConnection}
      </StyledActiveConnectionCaption>
    </Stack>
  );
}
