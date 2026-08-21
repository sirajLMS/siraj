"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { TeacherProgressFeedEventKind } from "@/frontend/common/graphql/generated/gql/graphql";
import type { StudentProgressFeedItem } from "@/frontend/common/types/shared.types";
import { studentHref } from "@/frontend/common/utils/profileHref";
import type { StudentProgressFeedProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";
import { resolveStudentProgressFeedIcon } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/resolveStudentProgressFeedIcon";

export interface StudentProgressFeedSharedSlots {
  readonly PersonProfileLink: (props: {
    readonly href: string | undefined;
    readonly name: string;
    readonly avatarSize: number;
    readonly typographyVariant: "bodyLg";
    readonly fontWeight: number;
  }) => ReactNode;
  readonly renderList: (
    items: readonly StudentProgressFeedItem[],
    renderItemContent: (item: StudentProgressFeedItem) => ReactNode
  ) => ReactNode;
}

export interface StudentProgressFeedSharedProps {
  readonly items: readonly StudentProgressFeedItem[];
  readonly title: string;
  readonly labels: StudentProgressFeedProps["labels"];
  readonly slots: StudentProgressFeedSharedSlots;
}

export function StudentProgressFeedShared({ items, title, labels, slots }: Readonly<StudentProgressFeedSharedProps>) {
  const { PersonProfileLink, renderList } = slots;

  const renderItemContent = (item: StudentProgressFeedItem): ReactNode => {
    const EventIcon = resolveStudentProgressFeedIcon(item.eventKind);
    return (
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
            <PersonProfileLink
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
                item.eventKind === TeacherProgressFeedEventKind.AutoMissed ||
                item.eventKind === TeacherProgressFeedEventKind.MarkedAbsent
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
  };

  return (
    <Stack sx={{ gap: 2 }}>
      <Typography sx={{ typography: "titleLg", color: theme => theme.palette.primary.main }}>{title}</Typography>
      {renderList(items, renderItemContent)}
    </Stack>
  );
}
