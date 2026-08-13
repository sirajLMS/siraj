// NEW FOR PLAN v5 (newly created for the migration wave)
import type {
  ParentAdminData,
  ParentViewData,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";

/**
 * Pure-data predicates used by the parent profile mobile/desktop tier views
 * to decide whether a section's data is non-empty before rendering. Lifted to
 * `frontend/common/views/dashboard/.../utils/` per specs.md §5 N9 (inline
 * lowercase pure-data helpers must not live in tier files).
 */
export function hasParentSocialData(parentData: ParentViewData): boolean {
  return (
    (parentData?.facebook?.trim() ?? "") !== "" ||
    (parentData?.whatsapp?.trim() ?? "") !== "" ||
    (parentData?.twitter?.trim() ?? "") !== ""
  );
}

export function hasParentIdentityData(adminData: ParentAdminData): boolean {
  return Boolean(adminData?.nationality?.trim() ?? adminData?.address?.trim());
}

export function hasParentBillingData(adminData: ParentAdminData): boolean {
  return Boolean(
    adminData?.invoiceType?.trim() ??
      adminData?.feeAmount?.trim() ??
      adminData?.currency ??
      adminData?.timezone?.trim() ??
      adminData?.lifecycleStatus
  );
}
