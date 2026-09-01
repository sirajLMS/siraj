import type { GroupClassAuditQuery_groupClassAudit } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ClassAuditLabels } from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";
import type { ClassAuditLabels as ClassAuditLocaleLabels } from "@/shared/locale/types/dashboard/classes/audit";

type Audit = NonNullable<GroupClassAuditQuery_groupClassAudit>;
type ClassAuditT = ClassAuditLocaleLabels;

/**
 * Maps the raw audit locale labels onto the flat view-level label shape.
 * Shared by the class-audit ViewModel and by component-test fixtures so both
 * exercise the exact same label mapping.
 */
export function buildClassAuditLabels(t: ClassAuditT, commonCancel: string, audit: Audit): ClassAuditLabels {
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
    registeredStudents: buildRegisteredStudentsLabels(t, registeredStudentCount),
    meetingInfo: buildMeetingInfoLabels(t),
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
    adminNoteDialog: {
      title: t.adminNote.title,
      content: t.adminNote.content,
      cancel: commonCancel,
      save: t.adminNote.update,
    },
  };
}

function buildRegisteredStudentsLabels(t: ClassAuditT, registeredStudentCount: number) {
  return {
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
  };
}

function buildMeetingInfoLabels(t: ClassAuditT) {
  return {
    title: t.meeting.title,
    joinMeeting: t.meeting.joinMeeting,
    capacityBadge: t.venue.capacityBadge(0),
    capacity: t.venue.capacity(0),
    meetingIdLabel: t.meetingIdLabel,
    online: t.online,
    meetingIdNA: t.meetingIdNA,
  };
}
