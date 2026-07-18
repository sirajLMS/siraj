"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Paper, Stack, Tooltip, Typography } from "@mui/material";
import type { StudentProgressFeedProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";
import { resolveStudentProgressFeedIcon } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/resolveStudentProgressFeedIcon";
import { MobileUserAvatar } from "@/frontend/mobile/components/ui/avatar";

/**
 * Mobile variant of the student progress feed.
 * Compact vertical list with avatar + summary + event icon, mirroring the
 * historical mobile layout (separating per-row dividers, edge-to-edge card shell).
 *
 * Plan v5: per specs.md §3 N15 + §4.1 Class B, the byte-identical inline
 * `StudentProgressFeedMobileProps` interface was deleted; both tiers now
 * import the shared `StudentProgressFeedProps` declared once in
 * `frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps.ts`.
 * Per specs.md §3 N9 + §5 the inline pure-data `resolveFeedIcon` helper was
 * lifted to `frontend/common/views/dashboard/teachers/dashboard/utils/resolveStudentProgressFeedIcon.ts`.
 */
export function StudentProgressFeedMobile({ items, title, labels }: Readonly<StudentProgressFeedProps>) {
  return (
    <Stack sx={{ gap: 2 }}>
      <Typography sx={{ typography: "titleLg", color: theme => theme.palette.primary.main }}>{title}</Typography>
      <Paper variant="outlined" sx={{ overflow: "hidden", borderColor: theme => theme.palette.border.light }}>
        <Stack divider={<Box sx={{ borderBottom: theme => `1px solid ${theme.palette.border.light}` }} />}>
          {items.map(item => {
            const EventIcon = resolveStudentProgressFeedIcon(item.eventKind);
            return (
              <Box key={item.id} sx={{ p: 2, display: "flex", alignItems: "flex-start", gap: 2 }}>
                <MobileUserAvatar label={item.studentName} size={40}>
                  {item.studentInitials}
                </MobileUserAvatar>
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
