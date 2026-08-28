import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";

expect.extend(matchers);

import { ProfileSkeletonShared } from "@/frontend/common/views/dashboard/profile/core/__shared__/profileSkeletonShared";
import { MOBILE_SKELETON_OPTIONS } from "@/frontend/common/views/dashboard/profile/core/__shared__/profileSkeletonShared.options";
import {
  ProfileLoadingSkeleton,
  type ProfileLoadingSkeletonConfig,
} from "@/frontend/common/views/dashboard/profile/shared/ProfileLoadingSkeleton";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { getEmotionStylesForElement, getPaddingDeclarations } from "@/test/ui/components/helpers/emotionStyles";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";

const skeletonConfig: ProfileLoadingSkeletonConfig = {
  gridCards: [
    {
      textWidth: "60%",
      rectHeight: 120,
      lines: [{ width: "80%", mt: 1 }],
    },
  ],
  bottomCard: { textWidth: "40%", rectHeight: 200 },
};

function expectNoOuterPadding(container: HTMLElement) {
  const outer = container.firstElementChild;
  if (!outer) {
    throw new Error("expected a rendered root element");
  }
  expect(getEmotionStylesForElement(outer).length).toBeGreaterThan(0);
  expect(getPaddingDeclarations(outer)).toEqual([]);
}

describe("ProfileLoadingSkeleton", () => {
  test("renders skeleton cards", () => {
    const { container } = renderWithWrapper(<ProfileLoadingSkeleton config={skeletonConfig} />, { locale });
    expect(container.querySelectorAll(".MuiSkeleton-root").length).toBeGreaterThan(0);
  });

  test("outer wrapper has no padding — layout owns spacing", () => {
    const { container } = renderWithWrapper(<ProfileLoadingSkeleton config={skeletonConfig} />, { locale });
    expectNoOuterPadding(container);
  });
});

describe("ProfileSkeletonShared", () => {
  test("renders skeleton cards", () => {
    const { container } = renderWithWrapper(<ProfileSkeletonShared options={MOBILE_SKELETON_OPTIONS} />, { locale });
    expect(container.querySelectorAll(".MuiSkeleton-root").length).toBeGreaterThan(0);
  });

  test("outer wrapper has no padding — layout owns spacing", () => {
    const { container } = renderWithWrapper(<ProfileSkeletonShared options={MOBILE_SKELETON_OPTIONS} />, { locale });
    expectNoOuterPadding(container);
  });
});
