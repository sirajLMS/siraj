import type { TeacherReassignmentLabels } from "@/shared/messages/types/dashboard/teachers";

export const reassignment: TeacherReassignmentLabels = {
  pageTitle: "Teacher Reassignment",
  pageSubtitle: "Reassign teacher for a student",
  breadcrumbs: {
    dashboard: "Dashboard",
    parentManagement: "Parent Management",
    teacherReassignment: "Teacher Reassignment",
  },
  studentContext: {
    studentId: "Student ID: {id}",
    grade: "Grade: {grade}",
    enrollment: "Enrollment Date: {date}",
    active: "Active",
  },
  currentTeacher: {
    title: "Current Teacher",
    unset: "Not assigned",
    notice: "Changes may affect scheduling and class availability",
  },
  warning: "Reassignments may impact student progress and scheduling.",
  controls: {
    title: "Reassignment Controls",
    subtitle: "Select a new teacher and confirm",
    assignTeacher: "Assign Teacher",
    assignTeacherPlaceholder: "Select new teacher",
    teacherAvailabilityNotice: "Teachers with availability in the student’s timezone",
    statusUpdate: "Update Status",
    currentStatus: "Current: {status}",
  },
  historyAndContact: {
    changeHistory: "Change History",
    lastUpdated: "Last updated: {date}",
    parentContact: "Parent Contact",
    pendingNotifications: "Pending Notifications: {count}",
  },
  actions: {
    info: "Info",
    cancel: "Cancel",
    submit: "Submit",
    processing: "Processing...",
    saved: "Saved",
    reassignSuccess: "Teacher reassigned successfully.",
    statusChangeSuccess: "Status updated successfully.",
  },
  errors: {
    invalidId: "Invalid student ID.",
  },
};
