import type { Email } from "@/backend/lib/email";

/** Data returned after successful manager onboarding */
export type ManagerOnboardingReturnType = {
  id: string;
  userId: string;
  staffProfileId: string;
  name: string;
  email: Email;
  status: string;
  assignedGroupSlug: string;
};
