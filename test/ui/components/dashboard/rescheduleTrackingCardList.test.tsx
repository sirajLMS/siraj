import { afterEach, describe, expect, mock, test } from "bun:test";

await mock.module("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import { LeaveRequestStatus, RescheduleDateLabel } from "@/frontend/common/graphql/generated/gql/graphql";
import type { TrackingRow } from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";
import { RescheduleTrackingCardListMobile } from "@/frontend/mobile/views/dashboard/reschedule/tracking/components/rescheduleTrackingCardList.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";

afterEach(() => {
  cleanup();
});

const mockLabels = {
  newDate: "التاريخ الجديد",
  leaveRequest: "طلب إجازة",
  rescheduled: "تم المعاد الجدولة",
  pendingLeave: "إجازة معلقة",
  viewDetails: "عرض التفاصيل",
  noEntries: "لا توجد سجلاّت",
  statusPending: "معلق",
  statusRescheduled: "تمت الجدولة",
  statusApproved: "موافق عليه",
  statusCancelled: "ملغى",
};

const mockRows: TrackingRow[] = [
  {
    id: "req-123",
    teacherId: "teacher-1",
    teacherName: "أحمد علي",
    studentId: "student-1",
    studentName: "سارة محمد",
    dateLabel: RescheduleDateLabel.NewDate,
    status: LeaveRequestStatus.Pending,
    teacherInitials: "أع",
    scheduledDate: "2026-10-01",
    timeSlot: "10:00 - 11:00",
  },
];

describe("RescheduleTrackingCardListMobile", () => {
  test("renders icon-only view button with accessible aria-label", () => {
    const handleView = mock(() => {});

    renderWithWrapper(<RescheduleTrackingCardListMobile rows={mockRows} labels={mockLabels} onView={handleView} />, {
      locale,
    });

    const viewButton = screen.getByRole("button", { name: mockLabels.viewDetails });
    expect(viewButton).toBeInTheDocument();
    expect(viewButton).toHaveAttribute("aria-label", mockLabels.viewDetails);

    fireEvent.click(viewButton);
    expect(handleView).toHaveBeenCalledWith("req-123");
  });
});
