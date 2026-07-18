import type { NotificationsLabels } from "@/shared/locale/types/notifications";

export const notificationsEn: NotificationsLabels = {
  invoiceGenerated: {
    title: "New Invoice",
    body: ({ invoiceId, amount, currency }) => `Invoice ${invoiceId} for ${amount} ${currency} has been generated.`,
  },
  invoiceStatusChanged: {
    proofSubmitted: {
      title: "Payment Proof Submitted",
      body: ({ invoiceId }) => `Payment proof for invoice ${invoiceId} has been submitted and is pending review.`,
    },
    proofApproved: {
      title: "Payment Proof Approved",
      body: ({ invoiceId }) => `Payment proof for invoice ${invoiceId} has been approved.`,
    },
    proofRejected: {
      title: "Payment Proof Rejected",
      body: ({ invoiceId }) => `Payment proof for invoice ${invoiceId} has been rejected. Please resubmit.`,
    },
    markedPaid: {
      title: "Invoice Paid",
      body: ({ invoiceId }) => `Invoice ${invoiceId} has been marked as paid.`,
    },
  },
  paymentMethodChanged: {
    created: {
      title: "Payment Method Added",
      body: ({ identifier }) => `A new payment method (${identifier}) has been added to your account.`,
    },
    updated: {
      title: "Payment Method Updated",
      body: ({ identifier }) => `Your payment method (${identifier}) has been updated.`,
    },
    deleted: {
      title: "Payment Method Removed",
      body: ({ identifier }) => `Your payment method (${identifier}) has been removed.`,
    },
    setDefault: {
      title: "Default Payment Method Changed",
      body: ({ identifier }) => `Your default payment method is now ${identifier}.`,
    },
    verified: {
      title: "Payment Method Verified",
      body: ({ identifier }) => `Your payment method (${identifier}) has been verified.`,
    },
  },
  classScheduled: {
    title: "Class Scheduled",
    body: ({ studentName, scheduledStartAt }) =>
      `A class for ${studentName} has been scheduled for ${scheduledStartAt}.`,
  },
  classActivated: {
    title: "Class Activated",
    body: ({ studentName, scheduledStartAt }) =>
      `The class for ${studentName} at ${scheduledStartAt} has been activated.`,
  },
  classStarted: {
    title: "Class Started",
    body: ({ studentName, scheduledStartAt }) =>
      `The class for ${studentName} scheduled at ${scheduledStartAt} has started.`,
  },
  classCompleted: {
    title: "Class Completed",
    body: ({ studentName, scheduledStartAt }) =>
      `The class for ${studentName} scheduled at ${scheduledStartAt} has been completed.`,
  },
  classMarkedAbsent: {
    title: "Student Marked Absent",
    body: ({ studentName, scheduledStartAt }) =>
      `${studentName} has been marked absent for the class at ${scheduledStartAt}.`,
  },
  classMarkedMissed: {
    title: "Class Missed",
    body: ({ studentName, scheduledStartAt }) =>
      `The class for ${studentName} scheduled at ${scheduledStartAt} was missed.`,
  },
  classLeaveRequested: {
    title: "Leave Requested",
    body: ({ studentName, scheduledStartAt }) =>
      `A leave request has been submitted for the ${studentName} class at ${scheduledStartAt}.`,
  },
  classRescheduled: {
    title: "Class Rescheduled",
    body: ({ studentName, scheduledStartAt, newStartAt }) =>
      `The class for ${studentName} originally scheduled at ${scheduledStartAt} has been rescheduled to ${newStartAt}.`,
  },
  classCancelled: {
    title: "Class Cancelled",
    body: ({ studentName, scheduledStartAt }) =>
      `The class for ${studentName} scheduled at ${scheduledStartAt} has been cancelled.`,
  },
  classReset: {
    title: "Class Reset",
    body: ({ studentName, scheduledStartAt }) =>
      `The class for ${studentName} scheduled at ${scheduledStartAt} has been reset.`,
  },
  studentTeacherReassigned: {
    parent: {
      title: "Teacher Reassigned",
      body: ({ studentName, newTeacherName }) =>
        `The teacher for ${studentName} has been reassigned to ${newTeacherName}.`,
    },
    oldTeacher: {
      title: "Student Reassigned Away",
      body: ({ studentName, newTeacherName }) =>
        `${studentName} has been reassigned to a new teacher (${newTeacherName}).`,
    },
    newTeacher: {
      title: "Student Reassigned To You",
      body: ({ studentName, oldTeacherName }) => `${studentName} has been reassigned to you from ${oldTeacherName}.`,
    },
  },
  studentStatusChanged: {
    title: "Student Status Changed",
    body: ({ studentName, oldStatus, newStatus }) =>
      `${studentName}'s status has changed from ${oldStatus} to ${newStatus}.`,
  },
  studentQuotaOverridden: {
    title: "Class Quota Updated",
    body: ({ studentName, newClassesRemaining }) =>
      `${studentName}'s remaining class quota is now ${newClassesRemaining}.`,
  },
  lessonReportSubmitted: {
    title: "Lesson Report Submitted",
    body: ({ reportId, teacherName }) => `${teacherName} submitted lesson report ${reportId} for your review.`,
  },
  lessonReportReviewed: {
    title: "Lesson Report Reviewed",
    body: ({ reportId, teacherName, decision }) =>
      `Your lesson report ${reportId} from ${teacherName} has been ${decision}.`,
  },
  newComplaint: {
    title: "New Complaint",
    body: ({ complaintId, category }) => `A new ${category} complaint (${complaintId}) has been submitted.`,
  },
  drawerTitle: "Notifications",
  managePreferences: "Manage preferences",
  markAllRead: "Mark all as read",
  markAsRead: "Mark as read",
  reschedule: "Reschedule",
  viewEntity: "View",
  approveInvoice: "Approve invoice",
  rejectInvoice: "Reject invoice",
  noNotifications: "No notifications",
  unreadCount: count =>
    count === 0 ? "No unread notifications" : count === 1 ? "1 unread notification" : `${count} unread notifications`,
};
