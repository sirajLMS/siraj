"use client";

import { createProfileLoadingSkeletonConfigWithCommonCards } from "@/frontend/common/views/dashboard/profile/shared/createProfileLoadingSkeletonConfig";
import { ProfileLoadingSkeleton } from "@/frontend/common/views/dashboard/profile/shared/ProfileLoadingSkeleton";

const config = createProfileLoadingSkeletonConfigWithCommonCards([
  { textWidth: "80%", rectHeight: 160, lines: [{ width: "60%" }] },
  { textWidth: "75%", rectHeight: 120, lines: [{ width: "50%" }] },
]);

export function ParentProfileLoadingSkeleton() {
  return <ProfileLoadingSkeleton config={config} />;
}
