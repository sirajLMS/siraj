"use client";

import { AccessTimeOutlined, CheckCircleOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { ClassProfileLink } from "@/frontend/common/components/ui/display/classProfileLink/ClassProfileLink";
import { classHref, profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import { StyledTimeHighlight } from "@/frontend/common/views/dashboard/components/__shared__/timeHighlightShared.styles";
import {
  ScheduleSessionCardSkeleton,
  ScheduleSessionEmptyState,
} from "@/frontend/common/views/dashboard/components/ScheduleSessionCardStates";
import {
  buildApprovalMetaItems,
  resolveApprovalStatusKey,
} from "@/frontend/common/views/dashboard/supervisor/dashboard/components/RecentApprovalCardList.helpers";
import {
  ApprovalMetaStatBar,
  RecentApprovalCardActions,
} from "@/frontend/common/views/dashboard/supervisor/dashboard/components/RecentApprovalCardList.parts";
import { PersonCell } from "@/frontend/common/views/dashboard/supervisor/dashboard/components/RecentApprovalCardList.personParts";
import {
  StyledCardHeader,
  StyledCardHeaderMain,
  StyledPeopleRow,
  StyledTimeHighlightContent,
  StyledTimeHighlightLabel,
  StyledTimeHighlightText,
} from "@/frontend/common/views/dashboard/supervisor/dashboard/components/RecentApprovalCardList.styles";
import type { RecentApproval } from "@/frontend/common/views/dashboard/supervisor/dashboard/types/supervisorDashboardTypes";

export interface RecentApprovalCardLabels {
  readonly approvedTime: string;
  readonly lessonDate: string;
  readonly duration: string;
  readonly completion: string;
  readonly teacher: string;
  readonly student: string;
  readonly viewReport: string;
  readonly viewClass: string;
  readonly history: string;
  readonly approvedStatus: string;
}

export interface RecentApprovalCardProps {
  readonly item: RecentApproval;
  readonly labels: RecentApprovalCardLabels;
}

export function RecentApprovalCard({ item, labels }: RecentApprovalCardProps) {
  const subjectName = item.subjectName?.trim() || "—";
  const teacherName = item.teacherName || item.teacherId || "—";
  const studentName = item.studentName || item.studentId || "—";
  const classInstanceId = item.classInstanceId || "";

  return (
    <Box
      sx={{
        paddingBlock: 2,
        paddingInline: 2,
        width: "100%",
        minHeight: 220,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <StyledCardHeader>
        <StyledCardHeaderMain>
          <ClassProfileLink
            href={classInstanceId ? classHref(classInstanceId) : undefined}
            name={subjectName}
            avatarUrl={item.classAvatarUrl}
            avatarSize={40}
            typographyVariant="titleLg"
            fontWeight={700}
          />

          <StatusBadge
            category="classStatus"
            status={resolveApprovalStatusKey(item.status)}
            label={labels.approvedStatus}
            size="small"
          />
        </StyledCardHeaderMain>

        <RecentApprovalCardActions item={item} labels={labels} />
      </StyledCardHeader>

      <StyledTimeHighlight>
        <AccessTimeOutlined sx={theme => ({ fontSize: 18, color: theme.palette.primary.main, flexShrink: 0 })} />
        <StyledTimeHighlightContent>
          <StyledTimeHighlightLabel variant="labelMd">{labels.approvedTime}</StyledTimeHighlightLabel>
          <StyledTimeHighlightText variant="bodyLg" title={item.reviewedAt}>
            {item.reviewedAt || "—"}
          </StyledTimeHighlightText>
        </StyledTimeHighlightContent>
      </StyledTimeHighlight>

      <ApprovalMetaStatBar items={buildApprovalMetaItems(item, labels)} />

      <StyledPeopleRow>
        <PersonCell
          label={labels.teacher}
          name={teacherName}
          tone="teacher"
          href={item.teacherId ? profileHrefForTeacher({ teacherId: item.teacherId }) : undefined}
          avatarUrl={item.teacherAvatarUrl}
        />
        <PersonCell
          label={labels.student}
          name={studentName}
          tone="student"
          href={item.studentId ? studentHref(item.studentId) : undefined}
          avatarUrl={item.studentAvatarUrl}
        />
      </StyledPeopleRow>
    </Box>
  );
}

export function RecentApprovalCardSkeleton() {
  return <ScheduleSessionCardSkeleton actionCount={3} />;
}

export function RecentApprovalEmptyState({ message }: { readonly message: string }) {
  return <ScheduleSessionEmptyState message={message} icon={CheckCircleOutlined} iconColorKey="primary" />;
}
