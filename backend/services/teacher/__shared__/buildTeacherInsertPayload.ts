import type { TeacherOnboardingInput } from "@/backend/services/teacher/teacher-onboarding.service";
import type { TeacherInsertType } from "@/backend/types/teachers/teacher.types";

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
    nationalId: input.nationalId ?? null,
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
