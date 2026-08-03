import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export const whatsappEn: WhatsappLabels = {
  // ─── Page / Tab labels ──────────────────────────────────────────────
  pageTitle: "WhatsApp Configuration",
  tabNumbers: "Numbers",
  tabTemplates: "Templates",
  tabOptIn: "Opt-in",

  // ─── Numbers tab ─────────────────────────────────────────────────────
  numbersTitle: "WhatsApp Numbers",
  numbersSubtitle: "Manage WhatsApp Business Cloud API numbers and credentials.",
  addAccount: "Add Number",
  editAccount: "Edit Number",
  editToken: "Edit Token",
  editPin: "Edit PIN",
  cancel: "Cancel",
  save: "Save",
  deleteAccount: "Delete Number",
  deleteConfirm: "Are you sure you want to delete this WhatsApp number? This action cannot be undone.",
  wabaId: "WABA ID",
  phoneNumberId: "Phone Number ID",
  displayPhoneNumber: "Display Phone Number",
  displayName: "Display Name",
  accessToken: "Access Token",
  accessTokenPlaceholder: "Enter Meta access token",
  twoStepPin: "Two-Step Verification PIN",
  twoStepPinPlaceholder: "Enter 6-digit PIN",
  isActive: "Active",
  qualityRating: "Quality Rating",
  messagingTier: "Messaging Limit Tier",
  throughputLevel: "Throughput Level",
  lastWebhookAt: "Last Webhook Received",
  syncFromMeta: "Sync from Meta",
  syncSuccess: "Successfully synced WhatsApp accounts from Meta.",
  syncNoChange: "No changes detected from Meta.",
  syncError: "Failed to sync from Meta. Please check credentials and try again.",
  noAccounts: 'No WhatsApp numbers configured. Click "Add Number" to get started.',

  // ─── Templates tab ──────────────────────────────────────────────────
  templatesTitle: "Message Templates",
  templatesSubtitle: "Sync and review WhatsApp message templates from Meta.",
  templateName: "Template Name",
  templateLanguage: "Language",
  templateStatus: "Status",
  templateCategory: "Category",
  noTemplates: 'No templates found. Click "Sync Templates" to fetch from Meta.',
  syncTemplates: "Sync Templates",

  // ─── Template status labels (Q5: Meta enum → localized) ───────────
  templateStatusApproved: "Approved",
  templateStatusPending: "Pending",
  templateStatusRejected: "Rejected",
  templateStatusPaused: "Paused",

  // ─── Quality rating labels (Q5) ────────────────────────────────────
  qualityGreen: "High Quality",
  qualityYellow: "Medium Quality",
  qualityRed: "Low Quality",
  qualityUnknown: "Unknown",

  // ─── Tier label captions (Q5: raw Meta enum → localized) ──────────
  tier10: "10 conversations / 24h",
  tier50: "50 conversations / 24h",
  tier250: "250 conversations / 24h",
  tier1K: "1,000 conversations / 24h",
  tier5K: "5,000 conversations / 24h",
  tier10K: "10,000 conversations / 24h",
  tierUnlimited: "Unlimited conversations / 24h",
  tierUnknown: "Unknown tier",

  // ─── Throughput level labels ────────────────────────────────────────
  throughputStandard: "Standard",
  throughputCoexistence: "Coexistence",
  throughputHigh: "High",
  throughputUnknown: "Unknown",

  // ─── Coexistence warning (R7) ───────────────────────────────────────
  coexistenceWarningTitle: "Coexistence Mode Active",
  coexistenceWarningBody:
    "This number is in coexistence mode with the WhatsApp Business App. Messaging is limited to 20 messages per second. Some features may be unavailable.",

  // ─── Unverified 2-slot warning (R7) ────────────────────────────────
  unverifiedWarningTitle: "Unverified Number",
  unverifiedWarningBody:
    "This number is unverified and limited to 2 message template slots. Complete Meta verification to unlock full template capacity.",

  // ─── Opt-in toggle + consent copy (REQ-10) ──────────────────────────
  optInTitle: "WhatsApp Notifications Opt-in",
  optInSubtitle: "Choose whether to receive notifications via WhatsApp.",
  optInToggle: "Receive notifications via WhatsApp",
  optInConsentBody:
    "By enabling this option, you consent to receive notifications and updates via WhatsApp. You may opt out at any time. Standard message rates may apply.",
  optInEnabled: "WhatsApp notifications enabled",
  optInDisabled: "WhatsApp notifications disabled",

  // ─── Snackbar / notification messages ──────────────────────────────
  deleteSuccess: "WhatsApp number deleted successfully.",
  deleteError: "Failed to delete WhatsApp number.",
  saveSuccess: "WhatsApp number saved successfully.",
  saveError: "Failed to save WhatsApp number.",
  optInError: "Failed to update WhatsApp opt-in preference.",
  isInactive: "Inactive",

  // ─── Delivery-failure keys (14.5) ──────────────────────────────────
  deliveryFailed: "WhatsApp message delivery failed",
  deliveryFailedWithReason: (reason: string) => `WhatsApp message delivery failed: ${reason}`,
};
