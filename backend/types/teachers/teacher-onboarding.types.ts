// Canonical type definitions for Teacher Onboarding.
// Aligned with TeacherOnboardingInput (service) and TeacherOnboardingResult (service/graphql).
import type { Gender } from "@/backend/enum";
import type { TeacherOnboardingResult } from "@/backend/services/teacher/teacher-onboarding.service";

/**
 * TeacherOnboardingReturnType:
 * - Core return type for Teacher Onboarding entity.
 * - Omits internal/reserved fields.
 * - Reapplies proper enum types.
 * - Exposes resolved properties (e.g., formatted display fields).
 */
export type TeacherOnboardingReturnType = TeacherOnboardingResult & {
  /**
   * Properly typed gender enum for GraphQL/resolver usage.
   */
  gender?: Gender | null;

  /**
   * Formatted display name for UI consistency.
   * Resolved from first/last name splits if needed.
   */
  displayName?: string;

  /**
   * Formatted timezone display string (e.g., "UTC+3: Cairo").
   */
  timezoneDisplay?: string;
};
