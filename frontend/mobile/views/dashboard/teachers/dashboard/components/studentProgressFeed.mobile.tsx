"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { studentHref } from "@/frontend/common/utils/profileHref";
import type { StudentProgressFeedProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";
import { resolveStudentProgressFeedIcon } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/resolveStudentProgressFeedIcon";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";
import { MobilePersonProfileLink } from "@/frontend/mobile/components/ui/display/personProfileLink";

/**
 * Mobile variant of the student progress feed.
 */
export function StudentProgressFeedMobile({ items, title, labels }: Readonly<StudentProgressFeedProps>) {
  return (
    <Stack sx={{ gap: 2 }}>
      <Typography sx={{ typography: "titleLg", color: theme => theme.palette.primary.main }}>{title}</Typography>
      <MobileCardList
        rows={items}
        getKey={item => item.id}
        paginationOptions={false}
        layout="edge-to-edge"
        renderItem={item => {
          const EventIcon = resolveStudentProgressFeedIcon(item.eventKind);
          return (
            <MobileCardListItem variant="edge-to-edge">
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                    <MobilePersonProfileLink
                      href={item.studentId ? studentHref(item.studentId) : undefined}
                      name={item.studentName}
                      avatarSize={40}
                      typographyVariant="bodyLg"
                      fontWeight={600}
                    />
                    <Typography
                      sx={{
                        typography: "labelMd",
                        color: theme => theme.palette.text.secondary,
                        flexShrink: 0,
                      }}
                    >
                      {item.timeAgo}
                    </Typography>
                  </Box>
                  <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                    {item.summary}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0, pt: 0.25 }}>
                  <EventIcon
                    sx={{
                      color: theme =>
                        item.eventKind === "auto_missed" || item.eventKind === "marked_absent"
                          ? theme.palette.error.main
                          : theme.palette.primary.main,
                    }}
                    fontSize="small"
                  />
                  {item.infoTooltip ? (
                    <Tooltip title={item.infoTooltip} arrow>
                      <InfoOutlined
                        fontSize="small"
                        aria-label={labels.autoMissedTooltip}
                        sx={{ color: theme => theme.palette.text.secondary }}
                      />
                    </Tooltip>
                  ) : null}
                </Box>
              </Box>
            </MobileCardListItem>
          );
        }}
      />
    </Stack>
  );
}
