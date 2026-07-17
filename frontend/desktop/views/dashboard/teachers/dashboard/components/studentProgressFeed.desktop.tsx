"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import {
  CheckCircleOutlineOutlined,
  DescriptionOutlined,
  EventAvailableOutlined,
  EventBusyOutlined,
  InfoOutlined,
  PersonOffOutlined,
  PlayCircleOutlineOutlined,
  SensorsOutlined,
} from "@mui/icons-material";
import { Box, Paper, Stack, Tooltip, Typography } from "@mui/material";
import type { StudentProgressFeedItem, TeacherProgressFeedEventKind } from "@/frontend/common/types/shared.types";
import type { TeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import { DesktopUserAvatar } from "@/frontend/desktop/components/ui/avatar";

interface StudentProgressFeedDesktopProps {
  readonly items: readonly StudentProgressFeedItem[];
  readonly title: string;
  readonly labels: TeacherDashboardLabels["progressFeed"];
}

function resolveFeedIcon(eventKind: TeacherProgressFeedEventKind): SvgIconComponent {
  switch (eventKind) {
    case "auto_missed":
      return EventBusyOutlined;
    case "marked_absent":
      return PersonOffOutlined;
    case "activated":
      return PlayCircleOutlineOutlined;
    case "started":
      return SensorsOutlined;
    case "completed":
      return CheckCircleOutlineOutlined;
    case "leave":
      return EventAvailableOutlined;
    default:
      return DescriptionOutlined;
  }
}

/**
 * Desktop variant of the student progress feed.
 * Same row shape as the mobile variant (avatar + name + summary + event
 * icon) but rendered in a dense, panel-style card suitable for the desktop
 * page width — no edge-to-edge styling, default padding within the page.
 */
export function StudentProgressFeedDesktop({ items, title, labels }: Readonly<StudentProgressFeedDesktopProps>) {
  return (
    <Stack sx={{ gap: 2 }}>
      <Typography sx={{ typography: "titleLg", color: theme => theme.palette.primary.main }}>{title}</Typography>
      <Paper variant="outlined" sx={{ overflow: "hidden", borderColor: theme => theme.palette.border.light }}>
        <Stack divider={<Box sx={{ borderBottom: theme => `1px solid ${theme.palette.border.light}` }} />}>
          {items.map(item => {
            const EventIcon = resolveFeedIcon(item.eventKind);
            return (
              <Box key={item.id} sx={{ p: 2, display: "flex", alignItems: "flex-start", gap: 2 }}>
                <DesktopUserAvatar label={item.studentName} size={40}>
                  {item.studentInitials}
                </DesktopUserAvatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                    <Typography sx={{ typography: "bodyLg", fontWeight: 600 }}>{item.studentName}</Typography>
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
            );
          })}
        </Stack>
      </Paper>
    </Stack>
  );
}
