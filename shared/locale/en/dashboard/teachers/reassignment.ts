import type { TeacherReassignmentLabels } from "@/shared/locale/types/dashboard/teachers";

export const dashboardTeacherReassignmentEn: TeacherReassignmentLabels = {
  pageTitle: "Teacher Reassignment",
  pageSubtitle: "Reassign teacher for a student",
  breadcrumbs: {
    dashboard: "Dashboard",
    parentManagement: "Parent Management",
    teacherReassignment: "Teacher Reassignment",
  },
  studentContext: {
    grade: grade => `Grade: ${grade}`,
    enrollment: "Enrollment Date",
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
    currentStatus: status => `Current: ${status}`,
    statusOptions: {
      REGULAR: "Regular / Active",
      SUSPENDED: "Suspended",
      ON_LEAVE: "On Leave",
      ON_TRIAL: "On Trial",
      DEACTIVATED: "Deactivated",
    },
  },
  historyAndContact: {
    changeHistory: "Change History",
    lastUpdated: date => `Last updated: ${date}`,
    parentContact: "Parent Contact",
    pendingNotifications: count => `Pending Notifications: ${count}`,
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
