"use client";

import { DescriptionOutlined, GradeOutlined, LoginOutlined } from "@mui/icons-material";
import { Avatar, Box, Paper, Stack, Typography } from "@mui/material";
import type { StudentProgressFeedItem } from "@/frontend/stores/teacherDashboardTypes";

interface StudentProgressFeedProps {
  readonly items: readonly StudentProgressFeedItem[];
  readonly title: string;
}

function resolveFeedIcon(icon: StudentProgressFeedItem["icon"]) {
  if (icon === "grade") {
    return GradeOutlined;
  }
  if (icon === "login") {
    return LoginOutlined;
  }
  return DescriptionOutlined;
}

export function StudentProgressFeed({ items, title }: Readonly<StudentProgressFeedProps>) {
  return (
    <Stack sx={{ gap: 2 }}>
      <Typography sx={{ typography: "titleLg", color: theme => theme.palette.primary.main }}>{title}</Typography>
      <Paper variant="outlined" sx={{ overflow: "hidden", borderColor: theme => theme.palette.border.light }}>
        <Stack divider={<Box sx={{ borderBottom: theme => `1px solid ${theme.palette.border.light}` }} />}>
          {items.map(item => {
            const Icon = resolveFeedIcon(item.icon);
            return (
              <Box key={item.id} sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ width: 40, height: 40, typography: "labelMd" }}>{item.studentInitials}</Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                    <Typography sx={{ typography: "bodyLg", fontWeight: 600 }}>{item.studentName}</Typography>
                    <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
                      {item.timeAgo}
                    </Typography>
                  </Box>
                  <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                    {item.summary}
                  </Typography>
                </Box>
                <Icon sx={{ color: theme => theme.palette.primary.main }} />
              </Box>
            );
          })}
        </Stack>
      </Paper>
    </Stack>
  );
}
