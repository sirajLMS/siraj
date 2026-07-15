import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

export const notifications: ProfileNotificationsLabels = {
  title: "Notification Preferences",
  description: "Select how you receive updates for each event type and channel.",
  saved: "Notification preferences saved.",
  errorLoading: "Failed to load notification preferences.",
  errorSaving: "Failed to save notification preferences.",
  channels: {
    EMAIL: "Email",
    SMS: "SMS",
    PUSH: "Push Notifications",
    ON_APP: "In-App",
  },
  events: {
    CLASS_REMINDER: "Class Reminders",
    INVOICE_GENERATED: "Invoice Generation",
    COMPLAINT_RESPONSE: "Complaint Responses",
    PAYMENT_METHOD_CHANGED: "Payment Method Changed",
    NEW_COMPLAINT: "New Complaints",
    NEW_SUGGESTION: "New Suggestions",
    SUGGESTION_ACKNOWLEDGED: "Suggestion Acknowledged",
    SUGGESTION_DUPLICATE_MARKED: "Suggestion Marked Duplicate",
  },
};
