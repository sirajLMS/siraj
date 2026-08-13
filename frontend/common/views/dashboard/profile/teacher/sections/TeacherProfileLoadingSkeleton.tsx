"use client";

import {
  ProfileLoadingSkeleton,
  type ProfileLoadingSkeletonConfig,
} from "@/frontend/common/views/dashboard/profile/shared/ProfileLoadingSkeleton";

const config: ProfileLoadingSkeletonConfig = {
  spacing: { xs: 2, md: 3 },
  gridCards: [
    { textWidth: "70%", rectHeight: 140, lines: [{ width: "60%" }, { width: "70%", mt: 1.5 }] },
    { textWidth: "70%", rectHeight: 120, lines: [{ width: "50%" }] },
    { textWidth: "80%", rectHeight: 120, lines: [{ width: "60%" }] },
    { textWidth: "75%", rectHeight: 110, lines: [{ width: "50%" }] },
  ],
  bottomCard: { textWidth: "60%", rectHeight: 100 },
};

export function TeacherProfileLoadingSkeleton() {
  return <ProfileLoadingSkeleton config={config} />;
}
