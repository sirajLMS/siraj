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
 * Maps the raw audit locale labels onto the flat view-level label shape,
 * mirroring the ViewModel mapping so tests exercise the same strings.
 */
export function buildClassAuditViewLabels(t: ClassAuditLocaleLabels, audit: GroupClassAudit): ClassAuditLabels {
  const registeredStudentCount = audit.registeredStudentCount ?? 0;
  return {
    breadcrumbs: {
      dashboard: t.breadcrumbs.dashboard,
      schedules: t.breadcrumbs.schedules,
      current: t.breadcrumbs.current,
    },
    pageTitle: t.pageTitle,
    mobileTitle: t.mobileTitle,
    generateReport: t.actions.generateReport,
    editClass: t.actions.editClass,
    courseCode: t.fields.courseCode,
    teacher: t.fields.teacher,
    originalDate: t.fields.originalDate,
    rescheduledDate: t.fields.rescheduledDate,
    timeSlot: t.fields.timeSlot,
    venue: t.fields.venue,
    auditTrailTitle: t.auditTrail.title,
    statusRescheduled: t.status.regularRescheduled,
    classDetails: t.fields.classDetails,
    registeredStudents: {
      title: t.students.title(registeredStudentCount),
      exportList: t.students.exportList,
      studentName: t.students.studentName,
      idNumber: t.students.idNumber,
      attendanceStatus: t.students.attendanceStatus,
      actions: t.students.actions,
      student: t.students.student,
      status: t.students.status,
      viewAll: t.students.viewAll(registeredStudentCount),
      pending: t.students.pending,
      present: t.students.present,
      absent: t.students.absent,
      noEntries: t.students.noEntries,
      viewStudentAriaLabel: t.students.viewStudentAriaLabel,
    },
    meetingInfo: {
      title: t.meeting.title,
      joinMeeting: t.meeting.joinMeeting,
      capacityBadge: t.venue.capacityBadge(0),
      capacity: t.venue.capacity(0),
      meetingIdLabel: t.meetingIdLabel,
      online: t.online,
      meetingIdNA: t.meetingIdNA,
    },
    communicationLog: {
      title: t.communication.title,
      resendNotifications: t.communication.resendNotifications,
    },
    adminNote: {
      title: t.adminNote.title,
      titleMobile: t.adminNote.titleMobile,
      lastUpdated: t.adminNote.lastUpdated(audit.adminNote?.lastUpdated ?? ""),
      update: t.adminNote.update,
      edit: t.adminNote.edit,
    },
  };
}
