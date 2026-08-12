"use client";

import { createProfileLoadingSkeletonConfigWithCommonCards } from "@/frontend/common/views/dashboard/profile/shared/createProfileLoadingSkeletonConfig";
import { ProfileLoadingSkeleton } from "@/frontend/common/views/dashboard/profile/shared/ProfileLoadingSkeleton";

const config = createProfileLoadingSkeletonConfigWithCommonCards([
  { textWidth: "80%", rectHeight: 120, lines: [{ width: "60%" }] },
]);

export function StaffProfileLoadingSkeleton() {
  return <ProfileLoadingSkeleton config={config} />;
}
