import { AppPermission, ProfileAudience, ProfileScope } from "@/backend/enum";

/** Legacy banking removed — payment methods replace teacher_banking_details_history. */
export async function loadTeacherBankingSummary(
  _actorUserId: string,
  _scope: ProfileScope,
  _audience: ProfileAudience,
  _teacherId: string
): Promise<null> {
  return null;
}

export function buildMaskedBankingSummary(): never {
  throw new Error("Teacher banking summary is no longer supported");
}
