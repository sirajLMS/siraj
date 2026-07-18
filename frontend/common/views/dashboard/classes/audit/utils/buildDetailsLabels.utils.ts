// NEW FOR PLAN v5: Lifted pure-data helper out of tier (specs.md §5 N9 violation).
import type {
  ClassAuditDetailsLabels,
  ClassAuditLabels,
} from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";

export function buildDetailsLabels(labels: ClassAuditLabels): ClassAuditDetailsLabels {
  return {
    courseCode: labels.courseCode,
    teacher: labels.teacher,
    originalDate: labels.originalDate,
    rescheduledDate: labels.rescheduledDate,
    timeSlot: labels.timeSlot,
    venue: labels.venue,
    auditTrailTitle: labels.auditTrailTitle,
    statusRescheduled: labels.statusRescheduled,
    classDetails: labels.classDetails,
  };
}
