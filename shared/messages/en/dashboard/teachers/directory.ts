import type { TeachersDirectoryLabels } from "@/shared/messages/types/dashboard/teachers";

export const directory: TeachersDirectoryLabels = {
  pageTitle: "Teachers Directory",
  pageSubtitle: "Manage and view all teachers",
  metrics: {
    title: "Teachers Overview",
    activated: "Activated",
    deactivated: "Deactivated",
  },
  actions: {
    updateSchedules: "Update Schedules",
    addTeacher: "Add Teacher",
    joinRoom: "Join Classroom",
    viewSchedule: "View Schedule",
    options: "Options",
    viewProfile: "View Profile",
  },
  table: {
    hash: "#",
    image: "Image",
    name: "Name",
    email: "Email",
    zoom: "Zoom",
    schedule: "Schedule",
    options: "Options",
    showingOf: "Showing {count} of {total} teachers",
    linkPending: "Link Pending",
  },
  fields: {
    phone: "Phone",
  },
  status: {
    active: "Active",
    offline: "Offline",
  },
  errors: {
    failedToLoad: "Failed to load teachers.",
  },
};
