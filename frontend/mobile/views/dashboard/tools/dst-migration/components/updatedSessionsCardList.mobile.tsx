"use client";

import { ArrowForwardOutlined, CheckCircleOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type { UpdatedSession } from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";
import { MobilePersonProfileLink } from "@/frontend/mobile/components/ui/display/personProfileLink";

interface Props {
  readonly sessions: readonly UpdatedSession[];
  readonly successfulCount: number;
}

function UpdatedSessionRow({ session }: Readonly<{ session: UpdatedSession }>) {
  return (
    <MobileCardListItem variant="edge-to-edge">
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
        <CheckCircleOutlined sx={theme => ({ color: theme.palette.tertiaryContainer })} />
        <Box sx={{ minWidth: 0 }}>
          <MobilePersonProfileLink
            href={session.studentId ? studentHref(session.studentId) : undefined}
            name={session.studentName}
            showAvatar={false}
            typographyVariant="bodyMd"
            fontWeight={700}
          />
          <MobilePersonProfileLink
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
    </MobileCardListItem>
  );
}

export function UpdatedSessionsCardListMobile({ sessions }: Readonly<Props>) {
  return (
    <MobileCardList
      rows={sessions}
      getKey={session => session.id}
      paginationOptions={false}
      layout="edge-to-edge"
      renderItem={session => <UpdatedSessionRow session={session} />}
    />
  );
}
