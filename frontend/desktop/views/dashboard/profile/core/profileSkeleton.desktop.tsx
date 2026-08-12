"use client";

import { ProfileSkeletonShared } from "@/frontend/common/views/dashboard/profile/core/__shared__/profileSkeletonShared";
import { DESKTOP_SKELETON_OPTIONS } from "@/frontend/common/views/dashboard/profile/core/__shared__/profileSkeletonShared.options";

export function ProfileSkeletonDesktopView() {
  return <ProfileSkeletonShared options={DESKTOP_SKELETON_OPTIONS} />;
}
