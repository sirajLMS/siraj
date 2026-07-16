import type { TeachersDirectoryLabels } from "@/shared/locale/types/dashboard/teachers";

export const dashboardTeachersDirectoryEn: TeachersDirectoryLabels = {
  pageTitle: "Teachers Directory",
  pageSubtitle: "Manage and view all teachers",
  metrics: {
    activated: "Activated",
    deactivated: "Deactivated",
  },
  actions: {
    updateSchedules: "Update Schedules",
    addTeacher: "Add Teacher",
    joinRoom: "Join Classroom",
    viewSchedule: "View Schedule",
    options: "Options",
  },
  table: {
    hash: "#",
    image: "Image",
    name: "Name",
    email: "Email",
    zoom: "Zoom",
    schedule: "Schedule",
    options: "Options",
    showingOf: (count, total) => `Showing ${count} of ${total} teachers`,
    linkPending: "Link Pending",
  },
  fields: {
    phone: "Phone",
  },
  status: {
    active: "Active",
    offline: "Offline",
  },
};
