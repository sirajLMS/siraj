import type { BaseContext } from "@/backend/graphql/gqlContext";
import { resolveDisplayAmountFields } from "@/backend/services";
import type { TeacherProfileReturnType } from "@/backend/types";

export async function enrichWithDisplayAmount(
  profile: TeacherProfileReturnType,
  ctx: BaseContext
): Promise<TeacherProfileReturnType & { displayAmount: unknown }> {
  const displayAmounts = await resolveDisplayAmountFields([profile], ctx, "hourlyRate", "rateCurrency", "userId");
  return {
    ...profile,
    displayAmount: displayAmounts.get(profile.id) ?? null,
  };
}
