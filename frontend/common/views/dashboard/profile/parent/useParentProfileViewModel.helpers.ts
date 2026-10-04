import {
  type CurrencyCode,
  ParentStatus,
  type ProfileByUserIdQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { ParentAdminEditFormData } from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";
import type { ParentViewData } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { ProfileScope } from "@/shared/constants/profile.enum";

type ProfileData = NonNullable<ProfileByUserIdQuery["profileByUserId"]>;

const PARENT_STATUS_VALUES: readonly string[] = Object.values(ParentStatus);

function isParentStatus(value: string | null | undefined): value is ParentStatus {
  return value !== null && value !== undefined && PARENT_STATUS_VALUES.includes(value);
}

function isIanaTimezoneString(value: string | null | undefined): value is IanaTimezone {
  return value !== null && value !== undefined && (Object.values(IanaTimezone) as readonly string[]).includes(value);
}

function toIanaTimezoneOrNull(value: string | null | undefined): IanaTimezone | null {
  return isIanaTimezoneString(value) ? value : null;
}

export function buildParentSource(scope: ProfileScope, profile: ProfileData | null | undefined): ParentViewData | null {
  if (!profile) return null;
  return scope === ProfileScope.OWN ? profile.parentOwnProfile : profile.parentAdminProfile;
}

export function toEditData(
  parentData: ParentViewData | null,
  avatarUrl: string | null | undefined,
  displayCurrency: CurrencyCode | null | undefined,
  profileTimezone: string | null | undefined
): ParentAdminEditFormData {
  const adminData = parentData && "invoiceType" in parentData ? parentData : null;
  return {
    name: parentData?.name ?? "",
    email: parentData?.email ?? "",
    avatarUrl: avatarUrl ?? null,
    displayCurrency: displayCurrency ?? null,
    phone: parentData?.phone ?? "",
    facebook: parentData?.facebook ?? "",
    whatsapp: parentData?.whatsapp ?? "",
    twitter: parentData?.twitter ?? "",
    nationality: parentData?.nationality ?? "",
    address: parentData?.address ?? "",
    invoiceType: adminData?.invoiceType ?? "",
    feeAmount: adminData?.feeAmount ?? "",
    currency: adminData?.currency ?? undefined,
    timezone: adminData?.timezone ?? profileTimezone ?? "",
    lifecycleStatus:
      (adminData && isParentStatus(adminData.lifecycleStatus) ? adminData.lifecycleStatus : undefined) ??
      ParentStatus.Regular,
  };
}

function buildCoreUpdateInput(formData: ParentAdminEditFormData) {
  return {
    name: formData.name,
    email: formData.email,
    avatarUrl: formData.avatarUrl,
    displayCurrency: formData.displayCurrency,
  };
}

function buildParentOwnUpdateInput(formData: ParentAdminEditFormData) {
  return {
    phone: formData.phone ?? null,
    facebook: formData.facebook ?? null,
    whatsapp: formData.whatsapp ?? null,
    twitter: formData.twitter ?? null,
  };
}

export function buildOwnParentProfileUpdateVariables(formData: ParentAdminEditFormData) {
  return {
    input: {
      core: buildCoreUpdateInput(formData),
      parent: {
        ...buildParentOwnUpdateInput(formData),
        timezone: toIanaTimezoneOrNull(formData.timezone),
      },
    },
  };
}

export function buildAdminParentProfileUpdateVariables(targetUserId: string, formData: ParentAdminEditFormData) {
  return {
    userId: targetUserId,
    input: {
      core: buildCoreUpdateInput(formData),
      parent: {
        ...buildParentOwnUpdateInput(formData),
        nationality: formData.nationality ?? null,
        address: formData.address ?? null,
        invoiceType: formData.invoiceType ?? null,
        feeAmount: formData.feeAmount ?? null,
        currency: formData.currency ?? null,
        timezone: toIanaTimezoneOrNull(formData.timezone),
      },
    },
  };
}
