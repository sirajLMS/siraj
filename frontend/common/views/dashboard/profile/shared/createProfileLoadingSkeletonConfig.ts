import type {
  ProfileLoadingSkeletonConfig,
  SkeletonCardConfig,
} from "@/frontend/common/views/dashboard/profile/shared/ProfileLoadingSkeleton";

const DEFAULT_BOTTOM_CARD: ProfileLoadingSkeletonConfig["bottomCard"] = {
  textWidth: "60%",
  rectHeight: 260,
};

const COMMON_GRID_CARDS: readonly SkeletonCardConfig[] = [
  { textWidth: "70%", rectHeight: 140, lines: [{ width: "60%" }, { width: "70%", mt: 1.5 }] },
  { textWidth: "70%", rectHeight: 120, lines: [{ width: "50%" }] },
];

export function createProfileLoadingSkeletonConfig(
  gridCards: readonly SkeletonCardConfig[]
): ProfileLoadingSkeletonConfig {
  return { gridCards, bottomCard: DEFAULT_BOTTOM_CARD };
}

export function createProfileLoadingSkeletonConfigWithCommonCards(
  extraCards: readonly SkeletonCardConfig[]
): ProfileLoadingSkeletonConfig {
  return { gridCards: [...COMMON_GRID_CARDS, ...extraCards], bottomCard: DEFAULT_BOTTOM_CARD };
}
