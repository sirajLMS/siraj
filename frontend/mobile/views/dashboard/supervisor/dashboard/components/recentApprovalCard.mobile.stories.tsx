import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import {
  type RecentApprovalCardLabels,
  RecentApprovalCardSkeleton,
  RecentApprovalEmptyState,
} from "@/frontend/common/views/dashboard/supervisor/dashboard/components/RecentApprovalCardList";
import type { RecentApproval } from "@/frontend/common/views/dashboard/supervisor/dashboard/types/supervisorDashboardTypes";
import { MobileCardList, MobileCardListItem, MobileSectionPanel } from "@/frontend/mobile/components/ui";
import { RecentApprovalCardMobile } from "@/frontend/mobile/views/dashboard/supervisor/dashboard/components/recentApprovalCard.mobile";

const cardLabels: RecentApprovalCardLabels = {
  approvedTime: "Approved time",
  lessonDate: "Lesson date",
  duration: "Duration",
  completion: "Completion",
  teacher: "Teacher",
  student: "Student",
  viewReport: "View report",
  viewClass: "View class",
  history: "Student history",
  approvedStatus: "Approved",
};

const mockApprovals: RecentApproval[] = [
  {
    id: "report-1",
    classInstanceId: "class-1",
    subjectName: "Quran Memorization",
    classAvatarUrl: "https://i.pravatar.cc/150?u=quran",
    lessonDate: "Mar 2, 2026",
    lessonDateRaw: "2026-03-02T00:00:00.000Z",
    durationMinutes: 45,
    completionPercentage: 92,
    status: LessonReportStatus.Approved,
    studentId: "student-1",
    studentName: "Demo Student",
    studentAvatarUrl: null,
    studentUserId: "user-student-1",
    teacherId: "teacher-1",
    teacherName: "Default Teacher",
    teacherAvatarUrl: null,
    teacherUserId: "user-teacher-1",
    reviewedAt: "Mar 2, 2026, 10:00 AM",
    reviewedAtRaw: "2026-03-02T10:00:00Z",
  },
  {
    id: "report-2",
    classInstanceId: "class-2",
    subjectName: "Arabic Grammar",
    classAvatarUrl: null,
    lessonDate: "Feb 18, 2026",
    lessonDateRaw: "2026-02-18T00:00:00.000Z",
    durationMinutes: 60,
    completionPercentage: 78,
    status: LessonReportStatus.Approved,
    studentId: "student-1",
    studentName: "Demo Student",
    studentAvatarUrl: null,
    studentUserId: "user-student-1",
    teacherId: "teacher-1",
    teacherName: "Default Teacher",
    teacherAvatarUrl: null,
    teacherUserId: "user-teacher-1",
    reviewedAt: "Feb 18, 2026, 11:30 AM",
    reviewedAtRaw: "2026-02-18T11:30:00Z",
  },
  {
    id: "report-3",
    classInstanceId: "class-3",
    subjectName: "Tajweed Fundamentals",
    classAvatarUrl: "https://i.pravatar.cc/150?u=tajweed",
    lessonDate: "Feb 11, 2026",
    lessonDateRaw: "2026-02-11T00:00:00.000Z",
    durationMinutes: 30,
    completionPercentage: 100,
    status: LessonReportStatus.Approved,
    studentId: "student-2",
    studentName: "Sara Al-Rashid",
    studentAvatarUrl: "https://i.pravatar.cc/150?u=sara",
    studentUserId: "user-student-2",
    teacherId: "teacher-2",
    teacherName: "Ahmed Hassan",
    teacherAvatarUrl: "https://i.pravatar.cc/150?u=ahmed",
    teacherUserId: "user-teacher-2",
    reviewedAt: "Feb 11, 2026, 9:15 AM",
    reviewedAtRaw: "2026-02-11T09:15:00Z",
  },
];

const meta = {
  title: "Views/dashboard/supervisor/RecentApprovalCard/Mobile",
  component: RecentApprovalCardMobile,
  tags: ["ai-generated"],
  parameters: {
    layout: "fullscreen",
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
  args: {
    item: mockApprovals[0],
    labels: cardLabels,
  },
} satisfies Meta<typeof RecentApprovalCardMobile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleCard: Story = {};

export const Loading: Story = {
  render: () => (
    <MobileSectionPanel title="Recent Approvals" contentInset={false}>
      <MobileCardListItem variant="edge-to-edge">
        <RecentApprovalCardSkeleton />
      </MobileCardListItem>
    </MobileSectionPanel>
  ),
};

export const Empty: Story = {
  render: () => (
    <MobileSectionPanel title="Recent Approvals" contentInset={false}>
      <MobileCardListItem variant="edge-to-edge">
        <RecentApprovalEmptyState message="No recent approvals" />
      </MobileCardListItem>
    </MobileSectionPanel>
  ),
};

export const SectionWithCards: Story = {
  render: args => (
    <MobileSectionPanel title="Recent Approvals" contentInset={false}>
      <MobileCardList
        rows={mockApprovals}
        getKey={row => row.id}
        layout="edge-to-edge"
        gap={0}
        paginationOptions={false}
        renderItem={row => (
          <MobileCardListItem variant="edge-to-edge">
            <RecentApprovalCardMobile item={row} labels={args.labels} />
          </MobileCardListItem>
        )}
      />
    </MobileSectionPanel>
  ),
};
