"use client";

import type { ProfileLoadingSkeletonConfig } from "@/frontend/common/views/dashboard/profile/shared/ProfileLoadingSkeleton";
import { ProfileLoadingSkeleton } from "@/frontend/common/views/dashboard/profile/shared/ProfileLoadingSkeleton";

const config: ProfileLoadingSkeletonConfig = {
  gridCards: [
    { textWidth: "70%", rectHeight: 140, lines: [{ width: "60%" }, { width: "70%", mt: 1.5 }] },
    { textWidth: "70%", rectHeight: 120, lines: [{ width: "50%" }] },
    { textWidth: "80%", rectHeight: 160, lines: [{ width: "60%" }] },
    { textWidth: "75%", rectHeight: 120, lines: [{ width: "50%" }] },
  ],
  bottomCard: { textWidth: "60%", rectHeight: 260 },
};

export function ParentProfileLoadingSkeleton() {
  return <ProfileLoadingSkeleton config={config} />;
}
