import type { ProfileSkeletonSharedOptions } from "@/frontend/common/views/dashboard/profile/core/__shared__/profileSkeletonShared";

export const DESKTOP_SKELETON_OPTIONS: ProfileSkeletonSharedOptions = {
  stackDirection: { md: "row" },
  stackSpacing: 3,
  stackAlignItems: "center",
  cardSx: () => ({ flex: 1, p: 3, height: "fit-content" }),
  cards: [
    { id: "desktop-card-1", skeletonHeight: 120, textWidths: ["60%", "70%"] },
    { id: "desktop-card-2", skeletonHeight: 120, textWidths: ["60%", "70%"] },
  ],
};

export const MOBILE_SKELETON_OPTIONS: ProfileSkeletonSharedOptions = {
  stackDirection: { xs: "column" },
  stackSpacing: 2,
  stackAlignItems: "flex-start",
  cardSx: () => ({ p: 2, width: "100%" }),
  cards: [
    {
      id: "mobile-card-1",
      skeletonHeight: 80,
      textWidths: ["60%", "70%"],
    },
    {
      id: "mobile-card-2",
      skeletonHeight: 80,
      textWidths: ["60%"],
    },
    {
      id: "mobile-card-3",
      skeletonHeight: 80,
      textWidths: ["50%"],
    },
  ],
};
