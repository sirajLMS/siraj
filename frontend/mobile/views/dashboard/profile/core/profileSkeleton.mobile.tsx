"use client";

import { ProfileSkeletonShared } from "@/frontend/common/views/dashboard/profile/core/__shared__/profileSkeletonShared";
import { MOBILE_SKELETON_OPTIONS } from "@/frontend/common/views/dashboard/profile/core/__shared__/profileSkeletonShared.options";

export function ProfileSkeletonMobileView() {
  return <ProfileSkeletonShared options={MOBILE_SKELETON_OPTIONS} />;
}
