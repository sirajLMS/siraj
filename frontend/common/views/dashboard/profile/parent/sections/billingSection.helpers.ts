import type { ParentAdminData } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";

const LIFECYCLE_STATUS_KEYS = ["regular", "on_trial", "on_leave", "suspended", "deactivated"] as const;

export function isLifecycleStatusKey(value: string): value is (typeof LIFECYCLE_STATUS_KEYS)[number] {
  return (LIFECYCLE_STATUS_KEYS as readonly string[]).includes(value);
}

export function resolveLifecycleStatus(adminData: ParentAdminData): string {
  let raw: string;
  if ("lifecycleStatus" in adminData && adminData.lifecycleStatus) {
    raw = adminData.lifecycleStatus;
  } else if ("accountStatus" in adminData && adminData.accountStatus) {
    raw = adminData.accountStatus;
  } else {
    raw = "REGULAR";
  }
  return raw.toLowerCase();
}
