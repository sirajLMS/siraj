import type { TeacherCreateRecurringClassLabels } from "@/shared/messages/types/dashboard/teachers";

export const createRecurringClass: TeacherCreateRecurringClassLabels = {
  dialogTitle: "Create Recurring Class",
  fields: {
    student: "Student",
    studentPlaceholder: "Select student",
    teacher: "Teacher",
    teacherPlaceholder: "Select teacher",
    time: "Time",
    duration: "Duration",
    durationMinutes: "{minutes} minutes",
    days: "Days",
    timezone: "Timezone",
    classType: "Class Type",
  },
  classTypes: {
    REGULAR: "Regular",
    TRIAL: "Trial",
    ADVANCE: "Advance",
  },
  days: {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  },
  timeOverride: {
    addOverride: "Add Time Override",
    removeOverride: "Remove Override",
    label: "Custom Time for {day}",
  },
  actions: {
    create: "Create",
    cancel: "Cancel",
    submitting: "Creating...",
  },
  success: {
    title: "Success",
    description: "Recurring classes created successfully.",
  },
  errors: {
    noDaysSelected: "At least one day must be selected.",
    noStudentSelected: "A student must be selected.",
    creationFailed: "Failed to create recurring classes.",
    durationMustBePositive: "Duration must be greater than 0.",
  },
};
