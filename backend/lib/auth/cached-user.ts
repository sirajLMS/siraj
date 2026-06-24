import { cache } from "react";
import { SessionService } from "@/backend/services/auth/session.service";
import type { CurrentUserProfile } from "@/backend/types";

export const getCurrentUser = cache(async (userId: string): Promise<CurrentUserProfile> => {
  return SessionService.getCurrentUserProfile(userId);
});
