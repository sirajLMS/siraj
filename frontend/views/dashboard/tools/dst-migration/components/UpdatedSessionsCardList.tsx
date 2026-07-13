"use client";

import { ArrowForwardOutlined, CheckCircleOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { PersonProfileLink } from "@/frontend/common/components/ui";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type { UpdatedSession } from "@/frontend/views/dashboard/tools/dst-migration/dst-migration.types";

interface Props {
  readonly sessions: readonly UpdatedSession[];
  readonly successfulCount: number;
}

function UpdatedSessionRow({ session }: Readonly<{ session: UpdatedSession }>) {
  return (
    <Box
      sx={theme => ({
        p: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `1px solid ${theme.palette.outlineVariant}`,
      })}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
        <CheckCircleOutlined sx={theme => ({ color: theme.palette.tertiaryContainer })} />
        <Box sx={{ minWidth: 0 }}>
          <PersonProfileLink
            href={session.studentId ? studentHref(session.studentId) : undefined}
            name={session.studentName}
            showAvatar={false}
            typographyVariant="bodyMd"
            fontWeight={700}
          />
          <PersonProfileLink
            href={profileHrefForTeacher({ teacherId: session.teacherId })}
            name={session.teacherName}
            showAvatar={false}
            typographyVariant="labelMd"
            fontWeight={400}
          />
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {session.fromTime}
            </Typography>
            <ArrowForwardOutlined sx={theme => ({ fontSize: 14, color: theme.palette.text.secondary })} />
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
              {session.toTime}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

export function UpdatedSessionsCardList({ sessions }: Readonly<Props>) {
  return (
    <Box sx={theme => ({ backgroundColor: theme.palette.surfaceContainerLowest, borderRadius: 3, overflow: "hidden" })}>
      {sessions.map(session => (
        <UpdatedSessionRow key={session.id} session={session} />
      ))}
    </Box>
  );
}
