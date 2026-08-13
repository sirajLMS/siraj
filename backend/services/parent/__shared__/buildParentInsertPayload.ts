import type { ParentOnboardingInput } from "@/backend/services/parent/parent-onboarding.service";
import type { ParentEntityInput } from "@/backend/types";

/**
 * Builds the insert payload for `ParentRepository.create()` from the
 * onboarding input fields and the newly created user's id.
 *
 * Captures the inline payload construction that was previously duplicated
 * in `parent-onboarding.service.ts`.
 */
export function buildParentInsertPayload(input: ParentOnboardingInput, userId: string): ParentEntityInput {
  return {
    userId,
    status: input.status ?? "REGULAR",
    nationality: input.nationality ?? null,
    address: input.address ?? null,
    facebook: input.facebook ?? null,
    whatsapp: input.whatsapp ?? null,
    twitter: input.twitter ?? null,
    invoiceType: input.invoiceType ?? null,
    feeAmount: input.feeAmount ?? null,
    currency: input.currency ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
