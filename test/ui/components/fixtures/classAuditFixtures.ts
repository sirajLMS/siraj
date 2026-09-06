/**
 * Shared fixtures for class-audit component tests.
 *
 * Used by:
 * - test/ui/components/classes/classAuditView.test.tsx
 * - test/ui/components/classes/classAuditView.mobile.test.tsx
 * - test/ui/components/classes/classAuditDetailsCard.test.tsx
 */

import {
  ClassExecutionState,
  GroupClassAttendanceStatus,
  type GroupClassAuditQuery_groupClassAudit as GroupClassAudit,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { ClassAuditLabels } from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";
import { buildClassAuditLabels } from "@/frontend/common/views/dashboard/classes/audit/utils/classAuditLabels.utils";
import type { ClassAuditLabels as ClassAuditLocaleLabels } from "@/shared/locale/types/dashboard/classes/audit";

export const CLASS_AUDIT_CLASS_NAME = "Quran Recitation - Advanced";

/** Shared no-op handler for view-model stubs. */
export function noopHandler() {}

export const classAuditFixture = {
  id: "class-instance-1",
  className: CLASS_AUDIT_CLASS_NAME,
  courseCode: "REGULAR",
  teacherName: "Ustadh Ahmad",
  originalDate: "2026-06-20T10:00:00Z",
  rescheduledDate: "2026-06-27T10:00:00Z",
  timeSlot: "10:00 AM - 11:00 AM",
  venue: "Online",
  status: ClassExecutionState.Completed,
  outcome: null,
  isFrozen: false,
  auditRemark: "Class rescheduled due to teacher availability",
  auditLoggedAt: "2026-06-20T08:00:00Z",
  isOneOnOne: false,
  registeredStudentCount: 3,
  totalStudentCount: 3,
  students: [
    {
      id: "s1",
      name: "Fatima Al-Rashid",
      studentId: "STU-001",
      initials: "FA",
      attendanceStatus: GroupClassAttendanceStatus.Present,
      avatarUrl: null,
    },
    {
      id: "s2",
      name: "Omar Hassan",
      studentId: "STU-002",
      initials: "OH",
      attendanceStatus: GroupClassAttendanceStatus.Pending,
      avatarUrl: null,
    },
    {
      id: "s3",
      name: "Aisha Mahmoud",
      studentId: "STU-003",
      initials: "AM",
      attendanceStatus: GroupClassAttendanceStatus.Absent,
      avatarUrl: null,
    },
  ],
  meetingInfo: {
    platform: "zoom",
    meetingId: "123456789",
    joinUrl: "https://zoom.us/j/123456789",
    logoUrl: null,
    providerName: null,
    source: null,
  },
  communications: [
    {
      id: "c1",
      type: "email",
      title: "Class Rescheduled",
      description: "Notification sent to parent",
      isActive: true,
      isDelivered: true,
      timestamp: "2026-06-20T09:00:00Z",
    },
  ],
  adminNote: {
    content: "Student needs extra attention on Tajweed rules.",
    lastUpdated: "2026-06-25T14:30:00Z",
  },
} satisfies GroupClassAudit;

/**
 * Maps the raw audit locale labels onto the flat view-level label shape.
 * Delegates to the same builder the ViewModel uses so tests exercise the
 * exact mapping production renders.
 */
export function buildClassAuditViewLabels(
  t: ClassAuditLocaleLabels,
  audit: GroupClassAudit,
  commonCancel: string
): ClassAuditLabels {
  return buildClassAuditLabels(t, commonCancel, audit);
}
