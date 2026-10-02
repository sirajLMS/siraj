import type { TeacherInsertType, TeacherOnboardingInput } from "@/backend/types";
import { serializeNationalId } from "@/shared/lib/national-id";

/**
 * Builds the insert payload for `TeacherRepository.create()` from the
 * onboarding input fields and the newly created user's id.
 *
 * Captures the inline payload construction that was previously duplicated
 * in `teacher-onboarding.service.ts`.
 */
export function buildTeacherInsertPayload(input: TeacherOnboardingInput, userId: string): TeacherInsertType {
  return {
    userId,
    nationality: input.nationality ?? null,
    nationalId: serializeNationalId(input.nationalId),
    phone: input.phone ?? null,
    dateOfBirth: input.dateOfBirth ?? null,
    gender: input.gender ?? null,
    address: input.address ?? null,
    qualifications: input.qualifications ?? null,
    countryCode: input.countryCode ?? null,
    hourlyRate: input.hourlyRate ?? null,
    rateCurrency: input.rateCurrency ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
