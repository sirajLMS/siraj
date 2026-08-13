import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import type { ErrorsLabels } from "@/shared/locale/types/errors";
import type { ProfileLabels, ProfileParentLabels } from "@/shared/locale/types/profile";

export type ParentSectionLabels = ProfileParentLabels;

export type ParentSectionLabelsBundle = {
  readonly parent: ProfileParentLabels;
  readonly baseLabels: ProfileSharedBaseLabels;
};

export function toParentSharedBaseLabels(base: ProfileLabels): ProfileSharedBaseLabels {
  return {
    notSet: base.notSet,
    fieldAccess: base.fieldAccess,
    actions: {
      ...base.actions,
      manageLifecycle: base.actions.manageLifecycle,
    },
  };
}

export type ParentBillingViewLabels = {
  readonly parent: ProfileParentLabels;
  readonly base: Pick<ProfileLabels, "notSet" | "convertedTotalApprox">;
  readonly errors: ErrorsLabels;
};

export type ParentProfileViewLabels = {
  readonly base: ProfileLabels;
  readonly parent: ProfileParentLabels;
};

export type AssociatedStudentsSectionLabels = {
  readonly parent: ProfileParentLabels;
  readonly base: ProfileLabels;
};

export type ProfileData = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>;
export type ParentOwnData = NonNullable<ProfileData["parentOwnProfile"]>;
export type ParentAdminData = NonNullable<ProfileData["parentAdminProfile"]>;
export type ParentViewData = ParentOwnData | ParentAdminData;
export type AssociatedStudents = ProfileData["associatedStudents"];
export type AssociatedStudentRow = NonNullable<NonNullable<AssociatedStudents>["rows"]>[number];

export function toDisplayValue(value: string | null | undefined, fallback: string): string {
  return value?.trim() ?? fallback;
}

export interface AssociatedStudentsSectionVariantProps {
  readonly labels: AssociatedStudentsSectionLabels;
  readonly rows: readonly AssociatedStudentRow[];
  readonly loading: boolean;
  readonly emptyMessage: string;
}
