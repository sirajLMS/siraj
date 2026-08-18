import type { ManagerAccountType } from "@/backend/enum";

export type ManagerOnboardingInput = {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly avatarUrl?: string | null;
  readonly phone?: string | null;
  readonly accountType: ManagerAccountType;
  readonly timezone?: string | null;
  readonly displayCurrency?: string | null;
};

export type ManagerOnboardingResult = {
  readonly id: string;
  readonly userId: string;
  readonly staffProfileId: string;
  readonly name: string;
  readonly email: string;
  readonly status: string;
  readonly assignedGroupSlug: string;
};
