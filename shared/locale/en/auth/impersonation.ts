import type { AuthImpersonationLabels } from "@/shared/locale/types/auth";

export const authImpersonationEn: AuthImpersonationLabels = {
  bannerLoggedInAs: name => `You are logged in as ${name}.`,
  returnToNormalLogin: "Return to normal login",
  bannerViewingAs: (name, email) => `Viewing dashboard as ${name} (${email})`,
  exit: "Exit view",
  loginAs: "Login as",
  administration: "Administration",
  actorIdentity: name => `Admin: ${name}`,
  viewAsUser: "View as user",
  confirmTitle: name => `Login as ${name}?`,
  confirmMessage: "You will navigate the site as this user. Admin session remains active in the background.",
  reasonLabel: "Reason (optional)",
  reasonPlaceholder: "Support ticket, bug fix, etc.",
  confirm: "Login as",
  cancel: "Cancel",
};
