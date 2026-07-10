import type { ClassAuditLabels } from "@/shared/messages/types/dashboard/classes";

export const classAudit: ClassAuditLabels = {
  invalidClassId: "Invalid class ID",
  pageTitle: "Class Details View",
  mobileTitle: "Class Audit Log",
  breadcrumbs: {
    dashboard: "Dashboard",
    schedules: "Schedules",
    current: "Class Audit Log",
  },
  actions: {
    generateReport: "Generate Report",
    editClass: "Edit Class",
  },
  fields: {
    courseCode: "Course Code",
    teacher: "Teacher",
    originalDate: "Original Date",
    rescheduledDate: "Rescheduled Date",
    timeSlot: "Time Slot",
    venue: "Venue",
    classDetails: "Class Details",
  },
  status: {
    regularRescheduled: "Regular (rescheduled)",
  },
  auditTrail: {
    title: "Automated Audit Trail & Notes",
  },
  students: {
    title: "Registered Students ({count})",
    exportList: "Export List",
    studentName: "Student Name",
    idNumber: "Student ID",
    attendanceStatus: "Attendance Status",
    actions: "Actions",
    student: "Student",
    status: "Status",
    viewAll: "View all {count} students",
    pending: "Pending",
    present: "Present",
    absent: "Absent",
    noEntries: "No students",
  },
  venue: {
    title: "Room Location",
    capacity: "Capacity: {count} students",
    viewMap: "View",
    capacityBadge: "Capacity {count} students",
  },
  meeting: {
    title: "Online meeting",
    joinMeeting: "Join meeting",
  },
  communication: {
    title: "Communication Log",
    resendNotifications: "Resend Notifications",
  },
  adminNote: {
    title: "Admin Note",
    titleMobile: "Administrative Justification",
    lastUpdated: "Last updated: {time}",
    update: "Update",
    edit: "Edit",
  },
  meetingIdLabel: "Meeting ID:",
  online: "Online",
  meetingIdNA: "Not available",
};
