import type { DstMigrationLabels } from "@/shared/messages/types/dashboard/admin";

export const dstMigration: DstMigrationLabels = {
  pageTitle: "Daylight Saving Time Adjustment",
  pageSubtitle:
    "Bulk migration tool to adjust institutional schedules for upcoming seasonal time changes. This tool audits all active classes and offsets local start/end times by 60 minutes to maintain global synchronization.",
  actions: {
    updateSchedules: "Update Schedules",
    migrating: "Migrating...",
    migrationComplete: "Migration Complete",
    successMessage: "Daylight Saving Time migration completed successfully. All eligible schedules have been adjusted.",
  },
  errors: {
    mutationFailed: "Daylight Saving Time migration failed. Please try again.",
    noDstTransitionDetected:
      "No Daylight Saving Time transition detected. The system is outside the Daylight Saving Time adjustment window.",
  },
  sections: {
    updated: "Updated",
    errors: "Error",
    checkedEmpty: "Verified / Empty",
    conflictsDetected: "Conflicts Detected",
    successfullyUpdated: "Successfully Updated",
    inactiveVerified: "Inactive / Verified",
  },
  metrics: {
    totalAudited: "Total Audited",
    successful: "Successful",
    conflicts: "Conflicts",
    unchanged: "Unchanged",
  },
  table: {
    studentName: "Student Name",
    from: "From",
    to: "To",
    sessionsCount: "{count} session{s}",
  },
  conflicts: {
    teacherLabel: "Teacher: {name}",
  },
  checkedEmpty: {
    inactiveNote:
      "30 schedules remained unchanged. These are either locked by manual overrides or belong to clubs that do not follow institutional Daylight Saving Time.",
  },
};
