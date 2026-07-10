import type { MeetingProvidersLabels } from "@/shared/messages/types/dashboard/meeting-providers";

export const meetingProviders: MeetingProvidersLabels = {
  pageTitle: "Meeting Providers",
  pageSubtitle: "Manage meeting platform catalog entries for user settings.",
  addProvider: "Add Provider",
  createTitle: "Create Meeting Provider",
  editTitle: "Edit Meeting Provider",
  deleteTitle: "Delete Meeting Provider",
  deleteConfirm: "Delete Provider",
  active: "Active",
  inactive: "Inactive",
  cancel: "Cancel",
  save: "Save",
  edit: "Edit",
  delete: "Delete",
  emptyCatalogTitle: "No Meeting Providers",
  emptyCatalogBody:
    "Add at least one active provider before users can create meeting settings. Teachers and parents need catalog entries to link Zoom, Google Meet, or Teams URLs.",
  urlAllowlistInvalid: "One of the example URLs does not match allowed patterns",
  columns: {
    slug: "ID",
    name: "Name",
    active: "Status",
    actions: "Actions",
  },
  fields: {
    slug: "ID",
    name: "Name",
    urlAllowlist: "Allowed Hosts List",
    urlAllowlistHelp: "Comma-separated host patterns",
    urlExample: "Example URL",
    isActive: "Active",
    supportsUsername: "Supports Username",
    supportsPassword: "Supports Password",
    supportsTenantId: "Supports Tenant ID",
  },
};
